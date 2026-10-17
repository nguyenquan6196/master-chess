'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';
import { useFormatter, useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { rankColors, RankEmblem } from '@/components/ui/RankEmblem';
import { bossRankIndex, RANKS } from '@/core/rating/rank';
import { resolveBotLevel } from '@/core/bot/levels';
import { STYLE_ICONS } from '@/core/bot/styles';
import type { GameResult } from '@/core/profile/schema';
import { gameRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';
import { PageHeader } from '@/components/ui/PageHeader';

const RESULT_STYLE: Record<GameResult, string> = {
  win: 'bg-accent text-accent-fg',
  loss: 'bg-danger text-surface',
  draw: 'bg-surface-2 text-fg',
};

const COPIED_FEEDBACK_MS = 1500;

type Filter = 'all' | GameResult;
const FILTERS: readonly Filter[] = ['all', 'win', 'loss', 'draw'];

/** Side stripe of a game card, by result. */
const RESULT_STRIPE: Record<GameResult, string> = {
  win: 'bg-accent',
  loss: 'bg-danger',
  draw: 'bg-border',
};

const CHIP = 'rounded-full bg-surface-2 px-2 py-0.5';

export function HistoryScreen() {
  const t = useTranslations('history');
  const tg = useTranslations('botGame');
  const tb = useTranslations('bots');
  const ts = useTranslations('botStyles');
  const tk = useTranslations('ranking');
  const tr = useTranslations('rank');
  const tv = useTranslations('review');
  const format = useFormatter();
  const profileId = useSession((s) => s.profile?.id);
  const games = useLiveQuery(
    () => (profileId ? gameRepo.listByProfile(profileId) : Promise.resolve([])),
    [profileId],
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const finished = (games ?? []).filter((g) => g.status === 'finished');
  const count = (r: GameResult) => finished.filter((g) => g.result === r).length;
  const counts: Record<Filter, number> = {
    all: finished.length,
    win: count('win'),
    loss: count('loss'),
    draw: count('draw'),
  };
  const winRate = finished.length ? Math.round((counts.win / finished.length) * 100) : 0;
  const shown = filter === 'all' ? finished : finished.filter((g) => g.result === filter);

  async function copy(id: string, pgn: string) {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(id);
      setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />

      {games && finished.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl" aria-hidden>
            📜
          </span>
          <p className="text-muted">{t('empty')}</p>
          <Link
            href="/play/bot"
            className="rounded-[var(--mc-radius-btn)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
          >
            🤖 {t('playBot')}
          </Link>
        </Card>
      ) : (
        <>
          {/* Summary and result filter. */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tabular-nums">
                {finished.length}
              </span>
              <span className="text-sm text-muted">{t('played')}</span>
              <span aria-hidden className="text-muted">
                ·
              </span>
              <span className="text-sm font-semibold text-accent tabular-nums">
                {t('winRate', { rate: winRate })}
              </span>
            </p>
            <div
              role="tablist"
              aria-label={t('filterLabel')}
              className="ml-auto flex flex-wrap gap-1 rounded-2xl bg-surface-2 p-1"
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold',
                    filter === f ? 'bg-surface shadow-card' : 'text-muted hover:text-fg',
                  )}
                >
                  {t(`filter.${f}`)}
                  <span className="text-xs font-normal tabular-nums opacity-70">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          <ul key={filter} className="mc-pop grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((g) => {
              const level = resolveBotLevel(g.botId, g.customElo);
              const boss = g.botId === 'custom' ? null : RANKS[bossRankIndex(g.botId)].id;
              const metal = boss ? rankColors(boss) : null;
              return (
                <li key={g.id}>
                  <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                    {g.result && (
                      <span
                        aria-hidden
                        className={cn('absolute inset-y-0 left-0 w-1.5', RESULT_STRIPE[g.result])}
                      />
                    )}
                    <div className="flex items-start gap-3 px-5 pt-4">
                      <span
                        aria-hidden
                        className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-3xl"
                        style={metal ? { borderColor: metal.dark } : undefined}
                      >
                        {level.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          <span className="truncate">
                            {t('vs', { bot: tb(`${g.botId}.name`) })}
                          </span>
                          <span
                            className="rounded-md border border-border px-1.5 text-xs font-bold tabular-nums"
                            title={boss ? tk('bossOf', { rank: tr(boss) }) : undefined}
                            style={
                              metal
                                ? {
                                    color: metal.ink,
                                    borderColor: metal.dark,
                                    background: `linear-gradient(160deg, ${metal.face}, ${metal.light} 45%, ${metal.dark})`,
                                  }
                                : undefined
                            }
                          >
                            {level.elo}
                          </span>
                        </p>
                        <p className="text-xs text-muted">
                          {format.dateTime(g.updatedAt, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      {g.result && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                            RESULT_STYLE[g.result],
                          )}
                        >
                          {tg(`result.${g.result}`)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 px-5 text-xs">
                      <span className={CHIP}>
                        {g.playerColor === 'w' ? `♔ ${t('asWhite')}` : `♚ ${t('asBlack')}`}
                      </span>
                      <span className={CHIP}>
                        {t('moves', { count: Math.ceil(g.moves.length / 2) })}
                      </span>
                      {g.endReason && <span className={CHIP}>{tg(`reason.${g.endReason}`)}</span>}
                      {g.style !== 'balanced' && (
                        <span className={CHIP}>
                          {STYLE_ICONS[g.style]} {ts(`${g.style}.name`)}
                        </span>
                      )}
                      {(g.hintsUsed > 0 || g.undosUsed > 0) && (
                        <span className={cn(CHIP, 'text-muted')}>
                          {t('assists', {
                            hints: g.hintsUsed,
                            undos: g.undosUsed,
                          })}
                        </span>
                      )}
                      {g.rated && g.ratingDelta !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 font-bold tabular-nums',
                            g.ratingDelta >= 0
                              ? 'bg-accent text-accent-fg'
                              : 'bg-danger text-surface',
                          )}
                          title={tk('rated')}
                        >
                          <span aria-hidden>🏆 </span>
                          <span>
                            {g.ratingDelta >= 0 ? '+' : ''}
                            {g.ratingDelta}
                          </span>
                        </span>
                      )}
                      {g.promotion && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pr-2 pl-1 font-semibold"
                          title={tk('promotionMatch')}
                        >
                          <RankEmblem
                            rank={RANKS[g.promotion.to].id}
                            size={18}
                            animated={false}
                            className={g.promotion.passed ? undefined : 'opacity-40 grayscale'}
                          />
                          {tk('promotionMatch')}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex border-t border-border">
                      <Link
                        href={`/review#${g.id}`}
                        className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
                      >
                        🔍 {tv('open')}
                      </Link>
                      {g.pgn && (
                        <button
                          type="button"
                          onClick={() => void copy(g.id, g.pgn ?? '')}
                          className="flex flex-1 items-center justify-center gap-2 border-l border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <span className="whitespace-nowrap">
                            📋 {copied === g.id ? t('copied') : t('copyPgn')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
