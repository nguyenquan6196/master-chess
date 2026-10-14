'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { applyMove, newGame, toPgn, undoMove, type GameSnapshot } from '@/core/chess/game';
import { GameStatusBanner } from './GameStatusBanner';
import { MoveList } from '@/components/board/MoveList';

const COPIED_FEEDBACK_MS = 1500;

export function LocalGame() {
  const t = useTranslations('game');
  const [game, setGame] = useState<GameSnapshot>(() => newGame());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [copied, setCopied] = useState(false);

  const last = game.history.at(-1);

  async function copyPgn() {
    try {
      await navigator.clipboard.writeText(toPgn(game));
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard can be unavailable (insecure context / denied); nothing to do.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="mx-auto w-full max-w-[560px]">
        <ChessBoard
          fen={game.fen}
          orientation={orientation}
          movableColor="both"
          lastMove={last ? { from: last.from, to: last.to } : null}
          onMove={(move) => {
            const next = applyMove(game, move);
            if (!next) return false;
            setGame(next);
            return true;
          }}
          promotionLabels={{
            title: t('choosePromotion'),
            cancel: t('cancel'),
            pieces: { q: t('pieces.q'), r: t('pieces.r'), b: t('pieces.b'), n: t('pieces.n') },
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <GameStatusBanner status={game.status} />

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setGame(newGame())}>
            {t('newGame')}
          </Button>
          <Button onClick={() => setGame(undoMove(game))} disabled={game.history.length === 0}>
            {t('undo')}
          </Button>
          <Button onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
            {t('flip')}
          </Button>
          <Button variant="ghost" onClick={copyPgn} disabled={game.history.length === 0}>
            {copied ? t('copied') : t('copyPgn')}
          </Button>
        </div>

        <Card className="p-4">
          <h2 className="mb-2 font-display text-lg font-semibold">{t('moves')}</h2>
          <MoveList moves={game.history.map((m) => m.san)} emptyLabel={t('noMoves')} />
        </Card>
      </div>
    </div>
  );
}
