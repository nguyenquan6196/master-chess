'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { EvalBar } from '@/components/board/EvalBar';
import { MoveList } from '@/components/board/MoveList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import type { GameRecord } from '@/core/profile/schema';
import { useSession } from '@/services/profile/session';
import { useSettings } from '@/services/settings/store';
import { PlayerBar } from './PlayerBar';
import { useBotGame } from './useBotGame';

interface BotGameViewProps {
  initial: GameRecord;
  onRematch: (game: GameRecord) => void;
  onChangeBot: () => void;
}

export function BotGameView({ initial, onRematch, onChangeBot }: BotGameViewProps) {
  const t = useTranslations('botGame');
  const tg = useTranslations('game');
  const tc = useTranslations('common');
  const tb = useTranslations('bots');
  const profile = useSession((s) => s.profile);
  const toggleEval = useSettings((s) => s.update);
  const g = useBotGame(initial);
  const { record, snapshot, level } = g;
  const [confirmResign, setConfirmResign] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);

  const orientation = record.playerColor === 'w' ? 'white' : 'black';
  const botName = tb(`${level.id}.name`);
  const last = snapshot.history[snapshot.history.length - 1];
  const turn = snapshot.status.kind === 'playing' ? snapshot.status.turn : null;
  const finished = record.status === 'finished';

  const statusLine = g.engineError
    ? t('engineError')
    : g.isBotTurn
      ? t('thinking', { bot: botName })
      : snapshot.status.kind === 'playing' && snapshot.status.inCheck
        ? tg('check')
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_1fr]">
      <div className="mx-auto w-full max-w-[600px]">
        <PlayerBar
          avatar={level.emoji}
          name={botName}
          subtitle={`${level.elo}`}
          color={g.botColor}
          clock={record.clock}
          now={g.now}
          active={turn === g.botColor}
          status={g.isBotTurn || g.engineError ? statusLine : null}
        />
        <div className="flex gap-2">
          {g.showEvalBar && (
            <EvalBar score={g.evaluation} orientation={orientation} label={t('evalBar')} />
          )}
          <ChessBoard
            className="min-w-0 flex-1"
            fen={snapshot.fen}
            orientation={orientation}
            movableColor={g.isPlayerTurn ? record.playerColor : 'none'}
            lastMove={last ? { from: last.from, to: last.to } : null}
            arrows={g.hint ? [g.hint] : []}
            onMove={g.onPlayerMove}
            promotionLabels={{
              title: tg('choosePromotion'),
              cancel: tg('cancel'),
              pieces: {
                q: tg('pieces.q'),
                r: tg('pieces.r'),
                b: tg('pieces.b'),
                n: tg('pieces.n'),
              },
            }}
          />
        </div>
        <PlayerBar
          avatar={profile?.avatar ?? '♟️'}
          name={profile?.name ?? t('you')}
          color={record.playerColor}
          clock={record.clock}
          now={g.now}
          active={turn === record.playerColor}
          status={!g.isBotTurn ? statusLine : null}
        />
      </div>

      <div className="flex flex-col gap-4">
        {g.notice && (
          <p role="status" className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium">
            {t(g.notice, { bot: botName })}
          </p>
        )}

        {!finished ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void g.requestHint()} disabled={!g.isPlayerTurn}>
              💡 {t('hint')}
            </Button>
            <Button onClick={g.undo} disabled={!g.canUndo}>
              ↩️ {tg('undo')}
            </Button>
            <Button onClick={() => void g.offerDraw()}>🤝 {t('offerDraw')}</Button>
            <Button variant="ghost" onClick={() => setConfirmResign(true)}>
              🏳️ {t('resign')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => onRematch(record)}>
              🔁 {t('rematch')}
            </Button>
            <Button onClick={onChangeBot}>{t('changeBot')}</Button>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={g.showEvalBar}
            onChange={(e) => toggleEval({ showEvalBar: e.target.checked })}
            className="size-4 accent-[var(--mc-accent)]"
          />
          {t('evalBar')}
        </label>

        <Card className="p-4">
          <h2 className="mb-2 font-display text-lg font-semibold">{tg('moves')}</h2>
          <MoveList moves={snapshot.history.map((m) => m.san)} emptyLabel={tg('noMoves')} />
        </Card>
      </div>

      <Modal
        open={confirmResign}
        title={t('resign')}
        onClose={() => setConfirmResign(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmResign(false)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                g.resign();
                setConfirmResign(false);
              }}
            >
              {t('resign')}
            </Button>
          </>
        }
      >
        {t('resignConfirm')}
      </Modal>

      <Modal
        open={finished && !resultDismissed}
        title={record.result ? t(`result.${record.result}`) : ''}
        onClose={() => setResultDismissed(true)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setResultDismissed(true)}>
              {t('viewBoard')}
            </Button>
            <Button onClick={onChangeBot}>{t('changeBot')}</Button>
            <Button variant="primary" onClick={() => onRematch(record)}>
              {t('rematch')}
            </Button>
          </>
        }
      >
        <p className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {level.emoji}
          </span>
          {record.endReason && t(`reason.${record.endReason}`)}
        </p>
      </Modal>
    </div>
  );
}
