/**
 * Glicko-2 rating system (Glickman, "Example of the Glicko-2 system", 2013).
 * Used for puzzle ratings (Phase 2) and player game ratings (Phase 4, spec §6.7).
 */

export interface Rating {
  rating: number;
  /** Rating deviation: uncertainty, shrinks as more results come in. */
  rd: number;
  /** Volatility: expected fluctuation. */
  vol: number;
}

export interface Opponent {
  rating: number;
  rd: number;
}

/** 1 = win, 0.5 = draw, 0 = loss (from the rated player's point of view). */
export type Score = 0 | 0.5 | 1;

export const GLICKO = {
  defaultRating: 1500,
  defaultRd: 350,
  defaultVol: 0.06,
  /** System constant: how much volatility may change (0.3–1.2). */
  tau: 0.5,
  minRd: 45,
  maxRd: 350,
  scale: 173.7178,
  epsilon: 0.000001,
} as const;

export function newRating(
  rating: number = GLICKO.defaultRating,
  rd: number = GLICKO.defaultRd,
): Rating {
  return { rating, rd, vol: GLICKO.defaultVol };
}

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const expected = (mu: number, muJ: number, phiJ: number) =>
  1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/** Updates `player` after one rating period containing `games`. */
export function updateRating(
  player: Rating,
  games: readonly { opponent: Opponent; score: Score }[],
  tau: number = GLICKO.tau,
): Rating {
  const { scale, epsilon } = GLICKO;
  const mu = (player.rating - 1500) / scale;
  const phi = player.rd / scale;

  if (games.length === 0) {
    const phiStar = Math.sqrt(phi * phi + player.vol * player.vol);
    return { ...player, rd: clampRd(phiStar * scale) };
  }

  let vInv = 0;
  let deltaSum = 0;
  for (const { opponent, score } of games) {
    const muJ = (opponent.rating - 1500) / scale;
    const phiJ = opponent.rd / scale;
    const e = expected(mu, muJ, phiJ);
    const gj = g(phiJ);
    vInv += gj * gj * e * (1 - e);
    deltaSum += gj * (score - e);
  }
  const v = 1 / vInv;
  const delta = v * deltaSum;

  // New volatility via the Illinois algorithm.
  const a = Math.log(player.vol * player.vol);
  const f = (x: number) => {
    const ex = Math.exp(x);
    const num = ex * (delta * delta - phi * phi - v - ex);
    const den = 2 * (phi * phi + v + ex) ** 2;
    return num / den - (x - a) / (tau * tau);
  };
  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) k++;
    B = a - k * tau;
  }
  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > epsilon) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA /= 2;
    }
    B = C;
    fB = fC;
  }
  const vol = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * deltaSum;

  return { rating: muNew * scale + 1500, rd: clampRd(phiNew * scale), vol };
}

function clampRd(rd: number): number {
  return Math.min(GLICKO.maxRd, Math.max(GLICKO.minRd, rd));
}

/** Probability that `player` beats `opponent`. */
export function winProbability(player: Opponent, opponent: Opponent): number {
  const { scale } = GLICKO;
  return expected(
    (player.rating - 1500) / scale,
    (opponent.rating - 1500) / scale,
    opponent.rd / scale,
  );
}
