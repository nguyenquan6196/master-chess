/** Pure helpers for the UCI protocol spoken by Stockfish. */

export type EngineScore = { kind: 'cp'; value: number } | { kind: 'mate'; value: number };

export interface EngineLine {
  /** 1-based MultiPV index. */
  multipv: number;
  depth: number;
  /** Score from the point of view of the side to move. */
  score: EngineScore;
  /** Principal variation in UCI notation, e.g. ["e2e4", "e7e5"]. */
  pv: string[];
}

/** Centipawn value used for forced mates, so mates sort above any material score. */
export const MATE_CP = 100_000;

/** Parses an `info ... score ... pv ...` line; returns null for lines without a scored PV. */
export function parseInfoLine(line: string): EngineLine | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null;
  const tokens = line.split(/\s+/);
  let depth = 0;
  let multipv = 1;
  let score: EngineScore | null = null;
  let pv: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'depth') depth = Number(tokens[++i]);
    else if (t === 'multipv') multipv = Number(tokens[++i]);
    else if (t === 'score') {
      const kind = tokens[++i];
      const value = Number(tokens[++i]);
      if (kind === 'cp' || kind === 'mate') score = { kind, value };
    } else if (t === 'pv') {
      pv = tokens.slice(i + 1);
      break;
    }
  }

  if (!score || pv.length === 0 || Number.isNaN(depth)) return null;
  return { multipv, depth, score, pv };
}

/** Parses `bestmove e2e4 ponder e7e5`; returns null for other lines or `bestmove (none)`. */
export function parseBestMove(line: string): string | null {
  const m = /^bestmove (\S+)/.exec(line);
  if (!m || m[1] === '(none)') return null;
  return m[1];
}

/** Converts a score to centipawns (mates become ±(MATE_CP − distance)). */
export function scoreToCp(score: EngineScore): number {
  if (score.kind === 'cp') return score.value;
  if (score.value === 0) return -MATE_CP;
  return Math.sign(score.value) * (MATE_CP - Math.abs(score.value));
}

/** Converts a side-to-move score into White's point of view. */
export function toWhitePov(score: EngineScore, sideToMove: 'w' | 'b'): EngineScore {
  return sideToMove === 'w' ? score : { kind: score.kind, value: -score.value };
}
