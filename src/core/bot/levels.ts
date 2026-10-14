/**
 * Bot difficulty ladder (spec §6.3). Elo values are rough estimates until calibrated
 * by scripts/calibrate-bots (Phase 4). Names/descriptions live in messages under `bots.<id>`.
 */

/** Weak bots: sample among the engine's top moves, sometimes play a random legal move. */
export interface SampledStrategy {
  kind: 'sampled';
  depth: number;
  multiPV: number;
  /** Probability of ignoring the engine and playing a uniformly random legal move. */
  randomMoveRate: number;
  /** Softmax temperature in centipawns: higher = picks worse moves more often. */
  temperatureCp: number;
}

/** Mid/strong bots: Stockfish's own strength limiter. */
export interface LimitedStrategy {
  kind: 'limited';
  elo: number;
  movetimeMs: number;
}

/** Full strength with a time budget. */
export interface FullStrategy {
  kind: 'full';
  movetimeMs: number;
}

export type BotStrategy = SampledStrategy | LimitedStrategy | FullStrategy;

export const BOT_IDS = [
  'chick',
  'turtle',
  'fox',
  'wolf',
  'lion',
  'eagle',
  'dragon',
  'master',
] as const;
export type BotId = (typeof BOT_IDS)[number];

export interface BotLevel {
  id: BotId;
  emoji: string;
  elo: number;
  /** Music/UI intensity bucket (spec §7.1): 1 relaxed … 4 boss. */
  tier: 1 | 2 | 3 | 4;
  strategy: BotStrategy;
  /** Artificial "thinking" delay range so fast bots don't answer instantly. */
  thinkTimeMs: readonly [min: number, max: number];
}

export const BOT_LEVELS: readonly BotLevel[] = [
  {
    id: 'chick',
    emoji: '🐣',
    elo: 250,
    tier: 1,
    strategy: { kind: 'sampled', depth: 1, multiPV: 8, randomMoveRate: 0.6, temperatureCp: 300 },
    thinkTimeMs: [500, 1200],
  },
  {
    id: 'turtle',
    emoji: '🐢',
    elo: 500,
    tier: 1,
    strategy: { kind: 'sampled', depth: 2, multiPV: 6, randomMoveRate: 0.3, temperatureCp: 200 },
    thinkTimeMs: [600, 1400],
  },
  {
    id: 'fox',
    emoji: '🦊',
    elo: 800,
    tier: 2,
    strategy: { kind: 'sampled', depth: 4, multiPV: 5, randomMoveRate: 0.15, temperatureCp: 120 },
    thinkTimeMs: [600, 1500],
  },
  {
    id: 'wolf',
    emoji: '🐺',
    elo: 1100,
    tier: 2,
    strategy: { kind: 'sampled', depth: 6, multiPV: 4, randomMoveRate: 0.06, temperatureCp: 60 },
    thinkTimeMs: [700, 1600],
  },
  {
    id: 'lion',
    emoji: '🦁',
    elo: 1400,
    tier: 3,
    strategy: { kind: 'limited', elo: 1400, movetimeMs: 300 },
    thinkTimeMs: [600, 1500],
  },
  {
    id: 'eagle',
    emoji: '🦅',
    elo: 1800,
    tier: 3,
    strategy: { kind: 'limited', elo: 1800, movetimeMs: 500 },
    thinkTimeMs: [600, 1500],
  },
  {
    id: 'dragon',
    emoji: '🐉',
    elo: 2200,
    tier: 4,
    strategy: { kind: 'limited', elo: 2200, movetimeMs: 800 },
    thinkTimeMs: [500, 1200],
  },
  {
    id: 'master',
    emoji: '👑',
    elo: 2800,
    tier: 4,
    strategy: { kind: 'full', movetimeMs: 1500 },
    thinkTimeMs: [0, 0],
  },
];

export function getBotLevel(id: BotId): BotLevel {
  const level = BOT_LEVELS.find((b) => b.id === id);
  if (!level) throw new Error(`Unknown bot: ${id}`);
  return level;
}

export function isBotId(value: unknown): value is BotId {
  return typeof value === 'string' && (BOT_IDS as readonly string[]).includes(value);
}

/** Draw offers: the bot accepts when it is clearly worse, or level and the game is long. */
export const DRAW_OFFER = {
  acceptWhenBotEvalAtMostCp: -150,
  acceptLevelPositionAfterPly: 60,
  levelPositionWindowCp: 30,
} as const;

export function botAcceptsDraw(botEvalCp: number, ply: number): boolean {
  if (botEvalCp <= DRAW_OFFER.acceptWhenBotEvalAtMostCp) return true;
  return (
    ply >= DRAW_OFFER.acceptLevelPositionAfterPly &&
    Math.abs(botEvalCp) <= DRAW_OFFER.levelPositionWindowCp
  );
}
