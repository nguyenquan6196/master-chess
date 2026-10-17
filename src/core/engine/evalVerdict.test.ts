import { describe, expect, it } from 'vitest';
import { evalVerdict, verdictVariant } from './evalVerdict';

describe('evalVerdict', () => {
  it('is null while the score is unknown or the game is mate', () => {
    expect(evalVerdict(null)).toBeNull();
    expect(evalVerdict({ kind: 'mate', value: 0 })).toBeNull();
  });

  it('grades centipawn scores by size and names the better side', () => {
    expect(evalVerdict({ kind: 'cp', value: 20 })).toEqual({ level: 'equal', side: null });
    expect(evalVerdict({ kind: 'cp', value: -49 })).toEqual({ level: 'equal', side: null });
    expect(evalVerdict({ kind: 'cp', value: 80 })).toEqual({ level: 'slight', side: 'w' });
    expect(evalVerdict({ kind: 'cp', value: -200 })).toEqual({ level: 'clear', side: 'b' });
    expect(evalVerdict({ kind: 'cp', value: 900 })).toEqual({ level: 'winning', side: 'w' });
  });

  it('reports forced mates with their length', () => {
    expect(evalVerdict({ kind: 'mate', value: -3 })).toEqual({
      level: 'mate',
      side: 'b',
      mateIn: 3,
    });
  });

  it('rotates the wording with the move number', () => {
    expect([0, 1, 2, 3].map(verdictVariant)).toEqual(['a', 'b', 'c', 'a']);
  });
});
