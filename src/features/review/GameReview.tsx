'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { EvalChart } from '@/components/board/EvalChart';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { ActionButton, GameLayout } from '@/components/ui/GameLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { resolveBotLevel } from '@/core/bot/levels';
import { applyMove, moveToUci, newGame, uciToMove, type MoveInput } from '@/core/chess/game';
import { scoreToCp } from '@/core/engine/uci';
import { replayGame } from '@/core/game/botGame';
import {
  buildReview,
  classify,
  retryableMoves,
  reviewPositions,
  winPercent,
  type MoveClass,
  type ReviewedMove,
} from '@/core/review/review';
import { playSfx } from '@/services/audio/sfx';
import { gameRepo } from '@/services/db/repositories';
import { useLocationHash } from '@/services/navigation/locationHash';
import { evaluatePosition } from '@/services/engine/bot';
import { analyzeGame, stopAnalysis } from '@/services/review/analyzeGame';

/** Depth used to judge a retried move. */
const RETRY_DEPTH = 10;
const CLASS_ICON: Record<MoveClass, string> = {
  best: '★',
  good: '✓',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};
const MARKED: readonly MoveClass[] = ['inaccuracy', 'mistake', 'blunder'];

type Retry = {
  move: ReviewedMove;
  state: 'idle' | 'checking' | 'correct' | 'wrong' | 'answer';
  tried: string | null;
};

function ClassBadge({ cls, label }: { cls: MoveClass; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-surface"
      style={{ background: `var(--mc-cls-${cls})` }}
    >
      {CLASS_ICON[cls]} {label}
    </span>
  );
}

export function GameReview() {
  const t = useTranslations('review');
  const tg = useTranslations('game');
  const tb = useTranslations('bots');
  const gameId = useLocationHash();
  const game = useLiveQuery(() => (gameId ? gameRepo.get(gameId) : undefined), [gameId], null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [cur, setCur] = useState(0);
  const [showBest, setShowBest] = useState(false);
  const [retry, setRetry] = useState<Retry | null>(null);
  const started = useRef(false);

  const positions = useMemo(() => (game ? reviewPositions(game.startFen, game.moves) : []), [game]);
  const sans = useMemo(() => (game ? replayGame(game).history.map((m) => m.san) : []), [game]);
  const review = useMemo(
    () => (game?.review ? buildReview(game.startFen, game.moves, game.review) : null),
    [game],
  );

  // Analyze once when the game has no review yet.
  const needsAnalysis = !!game && !game.review;
  useEffect(() => {
    if (!needsAnalysis || !game || started.current) return;
    started.current = true;
    let cancelled = false;
    void analyzeGame(
      game,
      (done, total) => !cancelled && setProgress({ done, total }),
      () => cancelled,
    ).then(() => {
      if (!cancelled) setCur(game.moves.length);
    });
    return () => {
      cancelled = true;
      started.current = false;
      stopAnalysis();
    };
  }, [needsAnalysis, game]);

  // Keyboard navigation.
  const last = positions.length - 1;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (retry) return;
      if (e.key === 'ArrowLeft') setCur((c) => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCur((c) => Math.min(last, c + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, retry]);

  if (game === null || !gameId) return <div aria-busy="true" />;
  if (!game) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/history" label={t('back')} />
        <p className="text-muted">{t('notFound')}</p>
      </div>
    );
  }

  const level = resolveBotLevel(game.botId, game.customElo);
  const orientation = game.playerColor === 'w' ? 'white' : 'black';
  const moveAt = (i: number) => review?.moves[i - 1] ?? null;
  const current = retry ? null : moveAt(cur);
  const boardFen = retry ? retry.move.fenBefore : (positions[cur]?.fen ?? game.startFen);
  const lastUci = retry ? null : (game.moves[cur - 1] ?? null);
  const lastMove = lastUci ? uciToMove(lastUci) : null;
  const bestHere = game.review?.best[cur] ?? null;
  const arrowUci = retry
    ? retry.state === 'answer' || retry.state === 'correct'
      ? retry.move.bestUci
      : null
    : showBest
      ? bestHere
      : null;
  const arrow = arrowUci ? uciToMove(arrowUci) : null;
  const marks = new Map<number, MoveClass>(
    (review?.moves ?? []).filter((m) => MARKED.includes(m.cls)).map((m) => [m.ply + 1, m.cls]),
  );
  const toRetry = review ? retryableMoves(review, game.playerColor) : [];

  async function onRetryMove(input: MoveInput): Promise<boolean> {
    if (!retry || !game?.review || retry.state === 'checking') return false;
    const after = applyMove(newGame(retry.move.fenBefore), input);
    const played = after?.history[after.history.length - 1];
    if (!after || !played) return false;
    const uci = moveToUci(played);
    const r = retry;
    if (uci === r.move.bestUci) {
      playSfx('notify');
      setRetry({ ...r, state: 'correct', tried: played.san });
      return true;
    }
    setRetry({ ...r, state: 'checking', tried: played.san });
    const evalAfter = await evaluatePosition(after.fen, RETRY_DEPTH);
    const whiteCp = evalAfter.score ? scoreToCp(evalAfter.score) : 0;
    const before = winPercent(game.review.evals[r.move.ply]);
    const afterWin = winPercent(whiteCp);
    const loss = r.move.color === 'w' ? before - afterWin : afterWin - before;
    const cls = classify(Math.max(0, loss), false);
    const ok = cls === 'good';
    playSfx(ok ? 'notify' : 'illegal');
    setRetry({ ...r, state: ok ? 'correct' : 'wrong', tried: played.san });
    return false;
  }

  const accuracyCard = (color: 'w' | 'b') => {
    const isPlayer = color === game.playerColor;
    return (
      <div className="flex-1 rounded-xl bg-surface-2 p-3 text-center">
        <p className="text-xs text-muted">
          {isPlayer ? t('you') : `${level.emoji} ${tb(`${game.botId}.name`)}`}
        </p>
        <p className="font-display text-3xl font-bold tabular-nums">
          {review ? `${review.accuracy[color]}%` : '—'}
        </p>
        <p className="text-xs text-muted">{t('accuracy')}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BackButton href="/history" label={t('back')} />
        <h1 className="font-display text-2xl font-bold">
          {t('title')}{' '}
          <span className="text-lg font-semibold text-muted">
            {t('vs', { bot: tb(`${game.botId}.name`) })}
          </span>
        </h1>
      </div>

      <GameLayout
        board={
          <ChessBoard
            fen={boardFen}
            orientation={orientation}
            movableColor={retry && retry.state !== 'answer' ? game.playerColor : 'none'}
            lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
            arrows={arrow ? [{ from: arrow.from, to: arrow.to }] : []}
            onMove={(m) => {
              void onRetryMove(m);
              return false;
            }}
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
        }
        bottom={
          review ? (
            <EvalChart
              whiteWin={review.whiteWin}
              current={retry ? retry.move.ply : cur}
              marks={marks}
              onSelect={(i) => !retry && setCur(Math.max(0, Math.min(last, i)))}
              label={t('chart')}
            />
          ) : undefined
        }
        actions={
          retry ? undefined : (
            <>
              {(
                [
                  ['start', '⏮', 0],
                  ['prev', '◀', Math.max(0, cur - 1)],
                  ['next', '▶', Math.min(last, cur + 1)],
                  ['end', '⏭', last],
                ] as const
              ).map(([key, icon, to]) => (
                <ActionButton key={key} icon={icon} label={t(key)} onClick={() => setCur(to)} />
              ))}
            </>
          )
        }
        side={
          <>
            <p className="hidden text-xs text-muted lg:block">{t('keyHint')}</p>

            {!review && (
              <Card className="flex flex-col gap-2">
                <p className="font-semibold">🔍 {t('analyze')}</p>
                <p className="text-sm text-muted">{t('analyzeDesc')}</p>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{
                      width: `${progress ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted tabular-nums">
                  {t('analyzing', { done: progress?.done ?? 0, total: positions.length })}
                </p>
              </Card>
            )}

            <div className="flex gap-3">
              {accuracyCard(game.playerColor)}
              {accuracyCard(game.playerColor === 'w' ? 'b' : 'w')}
            </div>

            {retry ? (
              <Card className="flex flex-col gap-3 border-accent">
                <p className="font-semibold">
                  {retry.state === 'correct'
                    ? t('retryCorrect', { move: retry.tried ?? retry.move.bestSan ?? '' })
                    : retry.state === 'wrong'
                      ? t('retryWrong', { move: retry.tried ?? '' })
                      : retry.state === 'checking'
                        ? t('retryChecking')
                        : retry.state === 'answer'
                          ? t('bestWas', { move: retry.move.bestSan ?? '' })
                          : t('retryPrompt', { move: retry.move.san })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {retry.state !== 'correct' && retry.state !== 'answer' && (
                    <Button onClick={() => setRetry({ ...retry, state: 'answer' })}>
                      {t('showAnswer')}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCur(retry.move.ply + 1);
                      setRetry(null);
                    }}
                  >
                    {t('exitRetry')}
                  </Button>
                </div>
              </Card>
            ) : (
              current && (
                <Card className="flex flex-col gap-1 p-4">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {Math.floor(current.ply / 2) + 1}
                    {current.color === 'w' ? '.' : '…'} {current.san}
                    <ClassBadge cls={current.cls} label={t(`cls.${current.cls}`)} />
                  </p>
                  {current.cls !== 'best' && current.bestSan && (
                    <p className="text-sm text-muted">{t('bestWas', { move: current.bestSan })}</p>
                  )}
                </Card>
              )
            )}

            {review && !retry && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showBest}
                  onChange={(e) => setShowBest(e.target.checked)}
                  className="size-4 accent-[var(--mc-accent)]"
                />
                {t('showBest')}
              </label>
            )}

            {review && (
              <Card className="flex flex-col gap-2 p-4">
                <h2 className="font-display text-lg font-semibold">🔁 {t('mistakes')}</h2>
                {toRetry.length === 0 ? (
                  <p className="text-sm text-muted">{t('noMistakes')}</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {toRetry.map((m) => (
                      <li key={m.ply}>
                        <Button onClick={() => setRetry({ move: m, state: 'idle', tried: null })}>
                          {Math.floor(m.ply / 2) + 1}
                          {m.color === 'w' ? '.' : '…'} {m.san}{' '}
                          <span style={{ color: `var(--mc-cls-${m.cls})` }}>
                            {CLASS_ICON[m.cls]}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            <Card className="p-4">
              <h2 className="mb-2 font-display text-lg font-semibold">{tg('moves')}</h2>
              <ol className="grid max-h-72 grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 overflow-y-auto text-sm">
                {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, row) => (
                  <li key={row} className="contents">
                    <span className="text-muted tabular-nums">{row + 1}.</span>
                    {[row * 2, row * 2 + 1].map((ply) => {
                      if (ply >= game.moves.length) return <span key={ply} />;
                      const m = review?.moves[ply];
                      const san = sans[ply] ?? game.moves[ply];
                      return (
                        <button
                          key={ply}
                          type="button"
                          onClick={() => {
                            setRetry(null);
                            setCur(ply + 1);
                          }}
                          className={cn(
                            'flex items-center gap-1 rounded px-1 text-left',
                            cur === ply + 1 && !retry
                              ? 'bg-surface-2 font-semibold'
                              : 'hover:bg-surface-2',
                          )}
                        >
                          {m && MARKED.includes(m.cls) && (
                            <span
                              aria-hidden
                              className="text-xs font-bold"
                              style={{ color: `var(--mc-cls-${m.cls})` }}
                            >
                              {CLASS_ICON[m.cls]}
                            </span>
                          )}
                          {san}
                        </button>
                      );
                    })}
                  </li>
                ))}
              </ol>
            </Card>
          </>
        }
      />
    </div>
  );
}
