import { describe, expect, it } from 'vitest';
import { seededRng } from './choose';
import { customLevel, resolveBotLevel, BOT_LEVELS, CUSTOM_ELO } from './levels';
import { applyStyle, pickStyledMove, styleBonus, STYLE_TUNING } from './styles';
import { resultStreak, suggestBot } from './suggest';

/** White can play a quiet developing move or grab a pawn with check. */
const FEN = 'rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3';

describe('core/bot/styles', () => {
  it('balanced adds nothing', () => {
    expect(styleBonus(FEN, 'f3e5', 'balanced')).toBe(0);
  });

  it('aggressive likes captures more than quiet moves', () => {
    expect(styleBonus(FEN, 'e4d5', 'aggressive')).toBeGreaterThan(
      styleBonus(FEN, 'b1c3', 'aggressive'),
    );
  });

  it('positional likes developing minor pieces and the center', () => {
    expect(styleBonus(FEN, 'b1c3', 'positional')).toBeGreaterThan(
      styleBonus(FEN, 'a2a3', 'positional'),
    );
  });

  it('chaotic avoids captures', () => {
    expect(styleBonus(FEN, 'e4d5', 'chaotic')).toBeLessThan(0);
    expect(styleBonus(FEN, 'a2a3', 'chaotic')).toBeGreaterThan(0);
  });

  it('only boosts candidates close to the best move', () => {
    const cands = [
      { move: 'b1c3', scoreCp: 50 },
      { move: 'e4d5', scoreCp: 40 },
      { move: 'a2a3', scoreCp: 50 - STYLE_TUNING.windowCp - 10 },
    ];
    const styled = applyStyle(FEN, cands, 'aggressive');
    expect(styled[1].scoreCp).toBeGreaterThan(40);
    expect(styled[2].scoreCp).toBe(cands[2].scoreCp);
  });

  it('strong bots keep their move unless a styled alternative is about as good', () => {
    const cands = [
      { move: 'b1c3', scoreCp: 30 },
      { move: 'e4d5', scoreCp: 20 },
    ];
    expect(pickStyledMove(FEN, cands, 'b1c3', 'balanced')).toBe('b1c3');
    expect(pickStyledMove(FEN, cands, 'b1c3', 'aggressive', seededRng(1))).toBe('e4d5');
    const far = [
      { move: 'b1c3', scoreCp: 300 },
      { move: 'e4d5', scoreCp: 20 },
    ];
    expect(pickStyledMove(FEN, far, 'b1c3', 'aggressive')).toBe('b1c3');
  });
});

describe('core/bot/levels custom', () => {
  it('clamps the Elo to the slider range', () => {
    expect(customLevel(10).elo).toBe(CUSTOM_ELO.min);
    expect(customLevel(99999).elo).toBe(CUSTOM_ELO.max);
  });

  it('uses sampled play below the limiter, the limiter above, full strength at the top', () => {
    expect(customLevel(600).strategy.kind).toBe('sampled');
    expect(customLevel(1600)).toMatchObject({ strategy: { kind: 'limited', elo: 1600 } });
    expect(customLevel(2900).strategy.kind).toBe('full');
  });

  it('gets steadily less random as the Elo rises', () => {
    const rate = (elo: number) => {
      const s = customLevel(elo).strategy;
      return s.kind === 'sampled' ? s.randomMoveRate : 0;
    };
    expect(rate(300)).toBeGreaterThan(rate(700));
    expect(rate(700)).toBeGreaterThan(rate(1000));
    expect(rate(1300)).toBeGreaterThan(0);
  });

  it('resolves stored games to a ladder or custom level', () => {
    expect(resolveBotLevel('fox').elo).toBe(BOT_LEVELS[2].elo);
    expect(resolveBotLevel('custom', 1234)).toMatchObject({ id: 'custom', elo: 1234 });
  });
});

describe('core/bot/suggest', () => {
  it('measures the current streak', () => {
    expect(resultStreak([])).toBe(0);
    expect(resultStreak([{ result: 'win' }, { result: 'win' }, { result: 'loss' }])).toBe(2);
    expect(resultStreak([{ result: 'loss' }, { result: 'win' }])).toBe(-1);
    expect(resultStreak([{ result: 'draw' }, { result: 'win' }])).toBe(0);
  });

  it('suggests the bot near the player level, nudged by streaks', () => {
    expect(suggestBot(400, [])).toBe('turtle');
    expect(suggestBot(400, [{ result: 'win' }, { result: 'win' }, { result: 'win' }])).toBe('fox');
    expect(suggestBot(400, [{ result: 'loss' }, { result: 'loss' }])).toBe('chick');
    expect(suggestBot(2600, [])).toBe('master');
  });
});
