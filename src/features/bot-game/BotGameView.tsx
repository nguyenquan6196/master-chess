'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { EvalBar } from '@/components/board/EvalBar';
import { MoveList } from '@/components/board/MoveList';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { ActionButton, GameLayout, HudCard, useSideColumn } from '@/components/ui/GameLayout';
import { Modal } from '@/components/ui/Modal';
import { RankBadge, rankTitle } from '@/components/ui/RankBadge';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { BossIntroOverlay, RankUpOverlay } from '@/components/ui/RankUpOverlay';
import { STYLE_ICONS } from '@/core/bot/styles';
import { isTimed, remainingAt } from '@/core/game/clock';
import { evalVerdict, verdictVariant } from '@/core/engine/evalVerdict';
import { scoreToCp } from '@/core/engine/uci';
import type { GameRecord } from '@/core/profile/schema';
import { RANKS, rankStatus } from '@/core/rating/rank';
import { useMusicScene } from '@/services/audio/musicDirector';
import { BOT_TIER_TRACK } from '@/services/audio/musicTracks';
import { playSfx } from '@/services/audio/sfx';
import { useSession } from '@/services/profile/session';
import { useSettings } from '@/services/settings/store';
import { PlayerBar } from './PlayerBar';
import { useBotChat } from './useBotChat';
import { useBotGame } from './useBotGame';

/** When the music gets tense (spec §7.1). */
const TENSION = { lowTimeMs: 30_000, losingCp: -300 } as const;

interface BotGameViewProps {
  initial: GameRecord;
  onRematch: (game: GameRecord) => void;
  onChangeBot: () => void;
}

export function BotGameView({ initial, onRematch, onChangeBot }: BotGameViewProps) {
  const t = useTranslations('botGame');
  const sideColumn = useSideColumn();
  const tg = useTranslations('game');
  const tc = useTranslations('common');
  const tb = useTranslations('bots');
  const ts = useTranslations('botStyles');
  const tk = useTranslations('ranking');
  const tr = useTranslations('rank');
  const tv = useTranslations('review');
  const profile = useSession((s) => s.profile);
  const toggleEval = useSettings((s) => s.update);
  const g = useBotGame(initial);
  const router = useRouter();
  const { record, snapshot, level } = g;
  const [confirmResign, setConfirmResign] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);
  /** An assist (hint/undo) waiting for confirmation because it makes the game unrated. */
  const [pendingAssist, setPendingAssist] = useState<(() => void) | null>(null);
  const withAssist = (action: () => void) => (g.rated ? setPendingAssist(() => action) : action());

  const myRank = profile ? rankStatus(profile.gameRating.rating, profile.rankFloor) : null;
  const pendingPromotion = myRank?.promotionTo ?? null;
  const isPromotionMatch =
    record.status === 'ongoing' &&
    pendingPromotion !== null &&
    RANKS[pendingPromotion].boss === record.botId;
  const chat = useBotChat(record, snapshot, g.botColor, isPromotionMatch);
  const [introOpen, setIntroOpen] = useState(() => isPromotionMatch && initial.moves.length === 0);
  const [rankUpDismissed, setRankUpDismissed] = useState(false);
  const rankUp = record.promotion?.passed && !rankUpDismissed ? record.promotion.to : null;

  const finished = record.status === 'finished';

  // Music: the bot tier's track; tension in time trouble or when losing badly.
  const timeTrouble =
    !finished &&
    isTimed(record.clock) &&
    remainingAt(record.clock, record.playerColor, g.now) < TENSION.lowTimeMs;
  const evalCp = g.evaluation ? scoreToCp(g.evaluation) : 0;
  const losingBadly =
    !finished && (record.playerColor === 'w' ? evalCp : -evalCp) < TENSION.losingCp;
  const intensity = timeTrouble ? 1 : losingBadly ? 0.6 : isPromotionMatch ? 0.35 : 0;
  const musicTrack = BOT_TIER_TRACK[level.tier];
  useEffect(() => {
    useMusicScene.getState().setScene({ track: musicTrack, intensity });
  }, [musicTrack, intensity]);
  useEffect(() => () => useMusicScene.getState().setScene(null), []);
  useEffect(() => {
    if (rankUp !== null) playSfx('rankUp');
  }, [rankUp]);
  const ratingBefore =
    record.ratingAfter !== undefined && record.ratingDelta !== undefined
      ? record.ratingAfter - record.ratingDelta
      : null;

  const orientation = record.playerColor === 'w' ? 'white' : 'black';
  const botName = tb(`${level.id}.name`);
  const verdict = evalVerdict(g.evaluation);
  const variant = verdictVariant(snapshot.history.length);
  const verdictText = !verdict
    ? undefined
    : verdict.level === 'equal' || !verdict.side
      ? t(`verdict.equal.${variant}`)
      : t(
          `verdict.${verdict.level}.${verdict.side === record.playerColor ? 'you' : 'bot'}.${variant}`,
          {
            bot: botName,
            n: verdict.mateIn ?? 0,
          },
        );
  const last = snapshot.history[snapshot.history.length - 1];
  const turn = snapshot.status.kind === 'playing' ? snapshot.status.turn : null;

  const statusLine = g.engineError
    ? t('engineError')
    : g.isBotTurn
      ? t('thinking', { bot: botName })
      : snapshot.status.kind === 'playing' && snapshot.status.inCheck
        ? tg('check')
        : null;

  const actions = !finished ? (
    <>
      <ActionButton
        icon="💡"
        label={t('hint')}
        onClick={() => withAssist(() => void g.requestHint())}
        disabled={!g.isPlayerTurn}
      />
      <ActionButton
        icon="↩️"
        label={tg('undo')}
        onClick={() => withAssist(g.undo)}
        disabled={!g.canUndo}
      />
      <ActionButton icon="🤝" label={t('offerDraw')} onClick={() => void g.offerDraw()} />
      <ActionButton icon="🏳️" label={t('resign')} onClick={() => setConfirmResign(true)} />
      <ActionButton icon="🎛️" label={t('changeBot')} onClick={onChangeBot} />
    </>
  ) : (
    <>
      <ActionButton icon="🔁" label={t('rematch')} primary onClick={() => onRematch(record)} />
      <ActionButton
        icon="🔍"
        label={tv('open')}
        onClick={() => router.push(`/review#${record.id}`)}
      />
      <ActionButton icon="🎛️" label={t('changeBot')} onClick={onChangeBot} />
    </>
  );

  return (
    <>
      <GameLayout
        top={
          <div className="relative">
            <PlayerBar
              avatar={level.emoji}
              name={botName}
              subtitle={`${level.elo}${record.style !== 'balanced' ? ` · ${STYLE_ICONS[record.style]} ${ts(`${record.style}.name`)}` : ''}`}
              color={g.botColor}
              clock={record.clock}
              now={g.now}
              active={turn === g.botColor}
              status={g.isBotTurn || g.engineError ? statusLine : null}
            />
            {chat && (
              <p
                role="status"
                className="pointer-events-none absolute top-full left-12 z-10 mt-1 max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-surface px-3 py-1.5 text-sm shadow-card"
              >
                {chat}
              </p>
            )}
          </div>
        }
        board={
          <div className="flex flex-col gap-2">
            {/* Phones: a thin strip above the board; side-column screens show the gauge there. */}
            {g.showEvalBar && !sideColumn && (
              <EvalBar score={g.evaluation} orientation={orientation} label={t('evalBar')} />
            )}
            <ChessBoard
              allow3d
              fen={snapshot.fen}
              orientation={orientation}
              movableColor={g.isPlayerTurn ? record.playerColor : 'none'}
              lastMove={last ? { from: last.from, to: last.to, promotion: last.promotion } : null}
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
        }
        bottom={
          <PlayerBar
            avatar={profile?.avatar ?? '♟️'}
            name={profile?.name ?? t('you')}
            color={record.playerColor}
            clock={record.clock}
            now={g.now}
            active={turn === record.playerColor}
            status={!g.isBotTurn ? statusLine : null}
            aside={
              myRank && (
                <span className="flex items-center gap-2">
                  <span className="hidden text-right text-xs leading-tight sm:block">
                    <span className="block font-semibold">
                      {rankTitle(myRank, tr(RANKS[myRank.rankIndex].id))}
                    </span>
                    <span className="text-muted tabular-nums">{profile?.gameRating.rating}</span>
                  </span>
                  <RankEmblem
                    rank={RANKS[myRank.rankIndex].id}
                    size={40}
                    animated={false}
                    title={rankTitle(myRank, tr(RANKS[myRank.rankIndex].id))}
                  />
                </span>
              )
            }
          />
        }
        actions={actions}
        side={
          <>
            {g.notice && (
              <p role="status" className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium">
                {t(g.notice, { bot: botName })}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {isPromotionMatch && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-fg">
                  ⚔️ {tk('promotionMatch')}
                </span>
              )}
              <span
                className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold"
                title={g.rated ? undefined : tk('practiceDesc')}
              >
                {g.rated ? `🏆 ${tk('rated')}` : `📘 ${tk('practice')}`}
              </span>
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={g.showEvalBar}
                  onChange={(e) => toggleEval({ showEvalBar: e.target.checked })}
                  className="size-4 accent-[var(--mc-accent)]"
                />
                {t('evalBar')}
              </label>
            </div>
            {g.showEvalBar && sideColumn && (
              <EvalBar
                size="panel"
                score={g.evaluation}
                orientation={orientation}
                label={t('evalBar')}
                caption={verdictText}
              />
            )}
            <HudCard className="py-3">
              <h2 className="mb-2 font-display text-base font-semibold">{tg('moves')}</h2>
              <MoveList moves={snapshot.history.map((m) => m.san)} emptyLabel={tg('noMoves')} />
            </HudCard>
          </>
        }
      />

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
        open={pendingAssist !== null}
        title={tk('unratedTitle')}
        onClose={() => setPendingAssist(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPendingAssist(null)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                pendingAssist?.();
                setPendingAssist(null);
              }}
            >
              {tk('unratedConfirm')}
            </Button>
          </>
        }
      >
        {tk('unratedDesc')}
      </Modal>

      <Modal
        open={finished && !resultDismissed && rankUp === null}
        title={record.result ? t(`result.${record.result}`) : ''}
        onClose={() => setResultDismissed(true)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setResultDismissed(true)}>
              {t('viewBoard')}
            </Button>
            <Link
              href={`/review#${record.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-surface-2 text-fg hover:bg-border"
            >
              🔍 {tv('open')}
            </Link>
            <Button onClick={onChangeBot}>{t('changeBot')}</Button>
            <Button variant="primary" onClick={() => onRematch(record)}>
              {t('rematch')}
            </Button>
          </>
        }
      >
        <Confetti trigger={record.result === 'win' ? 1 : null} />
        <p className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {level.emoji}
          </span>
          {record.endReason && t(`reason.${record.endReason}`)}
        </p>
        {record.rated && ratingBefore !== null && record.ratingDelta !== undefined && (
          <p className="mt-2 font-semibold tabular-nums">
            {myRank && (
              <RankBadge
                className="mr-2 align-middle"
                status={myRank}
                rankName={tr(RANKS[myRank.rankIndex].id)}
              />
            )}
            {tk('resultRated', { before: ratingBefore, after: record.ratingAfter ?? 0 })}{' '}
            <span className={record.ratingDelta >= 0 ? 'text-accent' : 'text-danger'}>
              ({record.ratingDelta >= 0 ? '+' : ''}
              {record.ratingDelta})
            </span>
          </p>
        )}
        {record.rated === false && (
          <p className="mt-2 text-sm text-muted">{tk('resultPractice')}</p>
        )}
        {record.promotion && (
          <p className="mt-2 font-display text-lg font-bold text-accent">
            {record.promotion.passed
              ? tk('promoted', { rank: tr(RANKS[record.promotion.to].id) })
              : tk('promotionFailed')}
          </p>
        )}
      </Modal>

      {introOpen && (
        <BossIntroOverlay
          bossEmoji={level.emoji}
          rank={RANKS[pendingPromotion ?? 0].id}
          title={tk('promotionMatch')}
          bossName={botName}
          line={chat}
          startLabel={tk('bossStart')}
          onStart={() => setIntroOpen(false)}
        />
      )}
      {rankUp !== null && (
        <RankUpOverlay
          from={RANKS[Math.max(rankUp - 1, 0)].id}
          to={RANKS[rankUp].id}
          title={tk('promoted', { rank: tr(RANKS[rankUp].id) })}
          closeLabel={tk('rankUpClose')}
          onClose={() => setRankUpDismissed(true)}
        />
      )}
    </>
  );
}
