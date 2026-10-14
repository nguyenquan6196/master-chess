import { describe, expect, it } from 'vitest';
import { MATE_CP, parseBestMove, parseInfoLine, scoreToCp, toWhitePov } from './uci';

describe('core/engine/uci', () => {
  it('parses a multipv info line with a cp score', () => {
    const line =
      'info depth 12 seldepth 18 multipv 2 score cp -35 nodes 1234 nps 100 hashfull 1 tbhits 0 time 12 pv d7d5 e4d5 d8d5';
    expect(parseInfoLine(line)).toEqual({
      multipv: 2,
      depth: 12,
      score: { kind: 'cp', value: -35 },
      pv: ['d7d5', 'e4d5', 'd8d5'],
    });
  });

  it('parses mate scores and bound annotations', () => {
    const line = 'info depth 5 multipv 1 score mate -2 upperbound nodes 10 pv e1e2 d8h4';
    expect(parseInfoLine(line)?.score).toEqual({ kind: 'mate', value: -2 });
  });

  it('ignores lines without a pv', () => {
    expect(parseInfoLine('info string NNUE evaluation using nn.nnue')).toBeNull();
    expect(parseInfoLine('info depth 1 currmove e2e4 currmovenumber 1')).toBeNull();
  });

  it('parses bestmove', () => {
    expect(parseBestMove('bestmove e7e8q ponder a2a3')).toBe('e7e8q');
    expect(parseBestMove('bestmove (none)')).toBeNull();
    expect(parseBestMove('readyok')).toBeNull();
  });

  it('orders mates above material', () => {
    expect(scoreToCp({ kind: 'mate', value: 3 })).toBe(MATE_CP - 3);
    expect(scoreToCp({ kind: 'mate', value: -1 })).toBe(-(MATE_CP - 1));
    expect(scoreToCp({ kind: 'mate', value: 3 })).toBeGreaterThan(
      scoreToCp({ kind: 'cp', value: 900 }),
    );
  });

  it("converts to White's point of view", () => {
    expect(toWhitePov({ kind: 'cp', value: 50 }, 'b')).toEqual({ kind: 'cp', value: -50 });
    expect(toWhitePov({ kind: 'mate', value: 2 }, 'w')).toEqual({ kind: 'mate', value: 2 });
  });
});
