/**
 * Bot difficulty ladder (spec §6.3). Weak-bot Elo values come from scripts/calibrate-bots
 * (2026-10-15, 8 games per pair, UCI_Elo bots as anchors). Names/descriptions live in messages under `bots.<id>`.
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

/** Ladder bots plus the user-tuned "custom" bot (spec §6.3). */
export type BotKey = BotId | 'custom';

export interface BotLevel {
  id: BotKey;
  emoji: string;
  elo: number;
  /** Music/UI intensity bucket (spec §7.1): 1 relaxed … 4 boss. */
  tier: 1 | 2 | 3 | 4;
  strategy: BotStrategy;
  /** Artificial "thinking" delay range so fast bots don't answer instantly. */
  thinkTimeMs: readonly [min: number, max: number];
}

export const BOT_LEVELS: readonly (BotLevel & { id: BotId })[] = [
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
    elo: 600,
    tier: 1,
    strategy: { kind: 'sampled', depth: 2, multiPV: 6, randomMoveRate: 0.3, temperatureCp: 200 },
    thinkTimeMs: [600, 1400],
  },
  {
    id: 'fox',
    emoji: '🦊',
    elo: 850,
    tier: 2,
    strategy: { kind: 'sampled', depth: 2, multiPV: 5, randomMoveRate: 0.22, temperatureCp: 160 },
    thinkTimeMs: [600, 1500],
  },
  {
    id: 'wolf',
    emoji: '🐺',
    elo: 1200,
    tier: 2,
    strategy: { kind: 'sampled', depth: 3, multiPV: 5, randomMoveRate: 0.12, temperatureCp: 100 },
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

export const CUSTOM_ELO = { min: 250, max: 3000, step: 50, default: 1000 } as const;
/** Stockfish's own limiter is used from this Elo up (its floor is ~1320). */
const LIMITER_MIN_ELO = 1350;
const FULL_STRENGTH_ELO = 2800;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A bot of any strength: below the Stockfish limiter, interpolates the sampled settings
 * of the neighbouring ladder bots; above it, uses the limiter (or full strength).
 */
export function customLevel(rawElo: number): BotLevel {
  const elo = Math.min(Math.max(Math.round(rawElo), CUSTOM_ELO.min), CUSTOM_ELO.max);
  const base = { id: 'custom' as const, emoji: '🌟', elo, thinkTimeMs: [600, 1400] as const };
  const tier: BotLevel['tier'] = elo < 700 ? 1 : elo < 1300 ? 2 : elo < 2000 ? 3 : 4;
  if (elo >= FULL_STRENGTH_ELO)
    return { ...base, tier, strategy: { kind: 'full', movetimeMs: 1500 } };
  if (elo >= LIMITER_MIN_ELO) {
    const movetimeMs = Math.round(
      lerp(300, 800, (elo - LIMITER_MIN_ELO) / (FULL_STRENGTH_ELO - LIMITER_MIN_ELO)),
    );
    return { ...base, tier, strategy: { kind: 'limited', elo, movetimeMs } };
  }
  const sampled = BOT_LEVELS.filter((b) => b.strategy.kind === 'sampled');
  // Above the strongest sampled bot: extrapolate from the last pair (capped below).
  let lo = sampled[sampled.length - 2];
  let hi = sampled[sampled.length - 1];
  for (let i = 0; i < sampled.length - 1; i++) {
    if (elo >= sampled[i].elo && elo <= sampled[i + 1].elo) {
      lo = sampled[i];
      hi = sampled[i + 1];
    }
  }
  const t = hi.elo === lo.elo ? 0 : Math.min(Math.max((elo - lo.elo) / (hi.elo - lo.elo), 0), 1.5);
  const a = lo.strategy as SampledStrategy;
  const b = hi.strategy as SampledStrategy;
  return {
    ...base,
    tier,
    strategy: {
      kind: 'sampled',
      depth: Math.round(lerp(a.depth, b.depth, t)),
      multiPV: Math.round(lerp(a.multiPV, b.multiPV, t)),
      randomMoveRate: Math.max(lerp(a.randomMoveRate, b.randomMoveRate, t), 0.02),
      temperatureCp: Math.max(lerp(a.temperatureCp, b.temperatureCp, t), 30),
    },
  };
}

/** The level for a stored game: a ladder bot, or the custom bot at its Elo. */
export function resolveBotLevel(botId: BotKey, customElo?: number): BotLevel {
  return botId === 'custom' ? customLevel(customElo ?? CUSTOM_ELO.default) : getBotLevel(botId);
}

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
