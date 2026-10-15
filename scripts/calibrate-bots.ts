/**
 * Bot Elo calibration (spec §6.3). Plays matches between ladder bots in Node with the
 * same Stockfish build as the app, anchors the bots that use Stockfish's own strength
 * limiter (UCI_Elo) at their configured Elo, and estimates the others by maximum
 * likelihood. Prints suggested `elo` values for src/core/bot/levels.ts.
 *
 *   node_modules/.bin/jiti scripts/calibrate-bots.ts [gamesPerPair=8]
 *
 * Slow on purpose (limited bots think 300–800 ms per move): run it in the background.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { Chess } from 'chess.js';
import { chooseSampledMove, seededRng } from '../src/core/bot/choose';
import { BOT_LEVELS, getBotLevel, type BotId, type BotLevel } from '../src/core/bot/levels';
import { parseBestMove, parseInfoLine, scoreToCp, type EngineLine } from '../src/core/engine/uci';

const GAMES_PER_PAIR = Number(process.argv[2] ?? 8);
const MAX_PLIES = 200;
/** Bots whose strength comes from Stockfish's UCI_Elo (or full strength): fixed anchors. */
const ANCHORS: BotId[] = ['lion', 'eagle', 'dragon'];
/** Matches played: each weak bot against its neighbours and the first anchor. */
const PAIRS: [BotId, BotId][] = [
  ['chick', 'turtle'],
  ['chick', 'fox'],
  ['turtle', 'fox'],
  ['turtle', 'wolf'],
  ['fox', 'wolf'],
  ['fox', 'lion'],
  ['wolf', 'lion'],
  ['wolf', 'eagle'],
];

interface SfModule {
  listener: (line: string) => void;
  processCommand: (cmd: string) => void;
}

/** Minimal promise wrapper around one Stockfish instance. */
class Engine {
  private sf: SfModule;
  private waiters: {
    done: (l: string) => boolean;
    lines: string[];
    resolve: (l: string[]) => void;
  }[] = [];

  constructor() {
    const require = createRequire(import.meta.url);
    const factory = require(
      path.resolve('public/engine/stockfish-19-lite-single.js'),
    ) as () => SfModule;
    this.sf = factory();
    this.sf.listener = (line) => {
      const w = this.waiters[0];
      if (!w) return;
      w.lines.push(line);
      if (w.done(line)) {
        this.waiters.shift();
        w.resolve(w.lines);
      }
    };
  }

  private send(cmd: string, done: (l: string) => boolean): Promise<string[]> {
    return new Promise((resolve) => {
      this.waiters.push({ done, lines: [], resolve });
      this.sf.processCommand(cmd);
    });
  }

  init = () => this.send('uci', (l) => l === 'uciok');

  async search(
    fen: string,
    o: { depth?: number; movetimeMs?: number; multiPV?: number; elo?: number | null },
  ): Promise<{ best: string | null; lines: EngineLine[] }> {
    this.sf.processCommand(`setoption name MultiPV value ${o.multiPV ?? 1}`);
    this.sf.processCommand(`setoption name UCI_LimitStrength value ${o.elo != null}`);
    if (o.elo != null) this.sf.processCommand(`setoption name UCI_Elo value ${o.elo}`);
    await this.send('isready', (l) => l === 'readyok');
    this.sf.processCommand(`position fen ${fen}`);
    const go = o.movetimeMs ? `go movetime ${o.movetimeMs}` : `go depth ${o.depth ?? 10}`;
    const out = await this.send(go, (l) => l.startsWith('bestmove'));
    const byPv = new Map<number, EngineLine>();
    for (const l of out) {
      const info = parseInfoLine(l);
      if (info) byPv.set(info.multipv, info);
    }
    return {
      best: parseBestMove(out[out.length - 1]),
      lines: [...byPv.values()].sort((a, b) => a.multipv - b.multipv),
    };
  }
}

const rng = seededRng(2026);

async function botMove(engine: Engine, chess: Chess, level: BotLevel): Promise<string> {
  const fen = chess.fen();
  const s = level.strategy;
  const legal = chess.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
  if (s.kind === 'sampled') {
    const { lines } = await engine.search(fen, { depth: s.depth, multiPV: s.multiPV });
    const candidates = lines.map((l) => ({ move: l.pv[0], scoreCp: scoreToCp(l.score) }));
    return chooseSampledMove(candidates, legal, s, rng);
  }
  const { best } = await engine.search(fen, {
    movetimeMs: s.movetimeMs,
    elo: s.kind === 'limited' ? s.elo : null,
  });
  return best ?? legal[0];
}

/** 1 = white wins, 0 = black wins, 0.5 = draw. */
async function playGame(engine: Engine, white: BotLevel, black: BotLevel): Promise<number> {
  const chess = new Chess();
  while (!chess.isGameOver() && chess.history().length < MAX_PLIES) {
    const level = chess.turn() === 'w' ? white : black;
    const uci = await botMove(engine, chess, level);
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  }
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 0 : 1;
  return 0.5;
}

const expected = (ra: number, rb: number) => 1 / (1 + 10 ** ((rb - ra) / 400));

async function main() {
  const engine = new Engine();
  await engine.init();
  const results: { a: BotId; b: BotId; score: number }[] = [];

  for (const [a, b] of PAIRS) {
    let score = 0;
    for (let g = 0; g < GAMES_PER_PAIR; g++) {
      const aWhite = g % 2 === 0;
      const r = await playGame(engine, getBotLevel(aWhite ? a : b), getBotLevel(aWhite ? b : a));
      const s = aWhite ? r : 1 - r;
      score += s;
      results.push({ a, b, score: s });
    }
    console.log(`${a} vs ${b}: ${score}/${GAMES_PER_PAIR}`);
  }

  // Maximum likelihood with anchors fixed (simple iterative fit).
  const elo = new Map<BotId, number>(BOT_LEVELS.map((l) => [l.id, l.elo]));
  for (let iter = 0; iter < 500; iter++) {
    for (const l of BOT_LEVELS) {
      if (ANCHORS.includes(l.id) || l.strategy.kind !== 'sampled') continue;
      // Prior: one virtual draw against the configured Elo keeps all-win/all-loss
      // records from running off to infinity.
      let actual = 0.5;
      let exp = expected(elo.get(l.id) ?? 0, l.elo);
      for (const r of results) {
        if (r.a === l.id) {
          actual += r.score;
          exp += expected(elo.get(r.a) ?? 0, elo.get(r.b) ?? 0);
        } else if (r.b === l.id) {
          actual += 1 - r.score;
          exp += expected(elo.get(r.b) ?? 0, elo.get(r.a) ?? 0);
        }
      }
      elo.set(l.id, (elo.get(l.id) ?? 0) + 40 * (actual - exp));
    }
  }

  console.log('\nSuggested Elo (anchors fixed):');
  for (const l of BOT_LEVELS) {
    const v = Math.round((elo.get(l.id) ?? l.elo) / 10) * 10;
    console.log(
      `  ${l.id.padEnd(7)} current ${String(l.elo).padStart(4)}  →  ${v}${ANCHORS.includes(l.id) ? ' (anchor)' : ''}`,
    );
  }
  process.exit(0);
}

void main();
