import { parseBestMove, parseInfoLine, type EngineLine } from '@/core/engine/uci';

/** Lite single-threaded build: ~1.9 MB, needs no cross-origin isolation headers. */
export const ENGINE_URL = '/engine/stockfish-19-lite-single.js';

export interface AnalyzeOptions {
  /** Search depth; ignored when `movetimeMs` is set. */
  depth?: number;
  movetimeMs?: number;
  multiPV?: number;
  /** Stockfish strength limiter (1320–3190); null/undefined = full strength. */
  elo?: number | null;
}

export interface AnalysisResult {
  bestMove: string | null;
  /** Deepest line per MultiPV index, best first. */
  lines: EngineLine[];
}

type Listener = (line: string) => void;

export class EngineLoadError extends Error {
  constructor() {
    super('Stockfish failed to load');
  }
}

/**
 * One Stockfish instance in a Web Worker. Searches are serialized: starting a new search
 * stops the current one (whose promise still resolves with its partial result — callers
 * must ignore superseded results).
 */
export class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private listeners = new Set<Listener>();
  private failers = new Set<(err: Error) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private searching = false;

  /** Loads the worker (idempotent). Safe to call early to preload. */
  init(): Promise<void> {
    if (!this.ready) {
      const worker = new Worker(ENGINE_URL);
      worker.onmessage = (e: MessageEvent) => {
        const line = String(e.data);
        for (const l of this.listeners) l(line);
      };
      worker.onerror = () => this.fail(new EngineLoadError());
      this.worker = worker;
      this.ready = this.request('uci', (l) => l === 'uciok').then(() => this.sync());
    }
    return this.ready;
  }

  /** Clears hash/history between games. */
  async newGame(): Promise<void> {
    await this.init();
    this.post('ucinewgame');
    await this.sync();
  }

  analyze(
    fen: string,
    opts: AnalyzeOptions,
    onUpdate?: (lines: EngineLine[]) => void,
  ): Promise<AnalysisResult> {
    this.stop();
    const run = () => this.search(fen, opts, onUpdate);
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Stops the running search (it resolves with what it has so far). */
  stop(): void {
    if (this.searching) this.post('stop');
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.listeners.clear();
    this.failers.clear();
    this.searching = false;
    this.queue = Promise.resolve();
  }

  private async search(
    fen: string,
    opts: AnalyzeOptions,
    onUpdate?: (lines: EngineLine[]) => void,
  ): Promise<AnalysisResult> {
    await this.init();
    const limited = opts.elo != null;
    this.post(`setoption name MultiPV value ${opts.multiPV ?? 1}`);
    this.post(`setoption name UCI_LimitStrength value ${limited}`);
    if (limited) this.post(`setoption name UCI_Elo value ${opts.elo}`);
    await this.sync();

    const byPv = new Map<number, EngineLine>();
    const sorted = () => [...byPv.values()].sort((a, b) => a.multipv - b.multipv);
    this.searching = true;
    this.post(`position fen ${fen}`);
    const go = opts.movetimeMs ? `go movetime ${opts.movetimeMs}` : `go depth ${opts.depth ?? 12}`;

    const output = await this.request(go, (l) => {
      const info = parseInfoLine(l);
      if (info) {
        byPv.set(info.multipv, info);
        onUpdate?.(sorted());
      }
      return l.startsWith('bestmove');
    });
    this.searching = false;
    return { bestMove: parseBestMove(output[output.length - 1]), lines: sorted() };
  }

  private sync(): Promise<void> {
    return this.request('isready', (l) => l === 'readyok').then(() => undefined);
  }

  /** Rejects every pending request and resets, so the next call retries loading. */
  private fail(err: Error): void {
    const failers = [...this.failers];
    this.dispose();
    for (const f of failers) f(err);
  }

  private request(command: string, isLast: (line: string) => boolean): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const out: string[] = [];
      const listener: Listener = (line) => {
        out.push(line);
        if (isLast(line)) {
          this.listeners.delete(listener);
          this.failers.delete(reject);
          resolve(out);
        }
      };
      this.listeners.add(listener);
      this.failers.add(reject);
      this.post(command);
    });
  }

  private post(command: string): void {
    this.worker?.postMessage(command);
  }
}

const engines: Partial<Record<'bot' | 'analysis', StockfishEngine>> = {};

/** Shared engines: one plays as the bot, one analyses (hints, eval bar) so they never block each other. */
export function getEngine(role: 'bot' | 'analysis'): StockfishEngine {
  return (engines[role] ??= new StockfishEngine());
}
