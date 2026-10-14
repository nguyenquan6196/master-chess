import type { GameRecord, GameResult } from './schema';

export type ResultSummary = { played: number } & Record<GameResult, number>;

export function summarizeResults(games: readonly GameRecord[]): ResultSummary {
  const summary: ResultSummary = { played: 0, win: 0, loss: 0, draw: 0 };
  for (const g of games) {
    if (g.status !== 'finished' || !g.result) continue;
    summary.played++;
    summary[g.result]++;
  }
  return summary;
}
