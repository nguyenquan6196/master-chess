'use client';

import { useEffect, useRef } from 'react';

/** Move history in pairs: "1. e4 e5". */
export function MoveList({ moves, emptyLabel }: { moves: string[]; emptyLabel: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [moves.length]);

  if (moves.length === 0) return <p className="text-sm text-muted">{emptyLabel}</p>;

  const rows: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className="max-h-72 overflow-y-auto">
      <ol className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-2 gap-y-0.5 text-sm tabular-nums">
        {rows.map((r) => (
          <li key={r.n} className="contents">
            <span className="text-muted">{r.n}.</span>
            <span className="font-medium">{r.white}</span>
            <span className="font-medium">{r.black ?? ''}</span>
          </li>
        ))}
      </ol>
      <div ref={endRef} />
    </div>
  );
}
