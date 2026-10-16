'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { BackButton } from '@/components/ui/BackButton';
import { ActionButton, GameLayout, HudCard } from '@/components/ui/GameLayout';
import { applyMove, newGame, toPgn, undoMove, type GameSnapshot } from '@/core/chess/game';
import { GameStatusBanner } from './GameStatusBanner';
import { MoveList } from '@/components/board/MoveList';

const COPIED_FEEDBACK_MS = 1500;

export function LocalGame() {
  const t = useTranslations('game');
  const tn = useTranslations('nav');
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
    <GameLayout
      top={<GameStatusBanner status={game.status} />}
      board={
        <ChessBoard
          fen={game.fen}
          orientation={orientation}
          movableColor="both"
          lastMove={last ? { from: last.from, to: last.to, promotion: last.promotion } : null}
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
      }
      actions={
        <>
          <ActionButton icon="✨" label={t('newGame')} primary onClick={() => setGame(newGame())} />
          <ActionButton
            icon="↩️"
            label={t('undo')}
            onClick={() => setGame(undoMove(game))}
            disabled={game.history.length === 0}
          />
          <ActionButton
            icon="🔄"
            label={t('flip')}
            onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
          />
          <ActionButton
            icon="📋"
            label={copied ? t('copied') : t('copyPgn')}
            onClick={copyPgn}
            disabled={game.history.length === 0}
          />
        </>
      }
      side={
        <>
          <HudCard className="py-3">
            <h2 className="mb-2 font-display text-base font-semibold">{t('moves')}</h2>
            <MoveList moves={game.history.map((m) => m.san)} emptyLabel={t('noMoves')} />
          </HudCard>
          <BackButton href="/play" label={tn('play')} />
        </>
      }
    />
  );
}
