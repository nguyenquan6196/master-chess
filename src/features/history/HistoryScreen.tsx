'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { RANKS } from '@/core/rating/rank';
import { resolveBotLevel } from '@/core/bot/levels';
import { STYLE_ICONS } from '@/core/bot/styles';
import type { GameResult } from '@/core/profile/schema';
import { gameRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';

const RESULT_STYLE: Record<GameResult, string> = {
  win: 'bg-accent text-accent-fg',
  loss: 'bg-danger text-surface',
  draw: 'bg-surface-2 text-fg',
};

const COPIED_FEEDBACK_MS = 1500;

export function HistoryScreen() {
  const t = useTranslations('history');
  const tg = useTranslations('botGame');
  const tb = useTranslations('bots');
  const ts = useTranslations('botStyles');
  const tk = useTranslations('ranking');
  const tv = useTranslations('review');
  const format = useFormatter();
  const profileId = useSession((s) => s.profile?.id);
  const games = useLiveQuery(
    () => (profileId ? gameRepo.listByProfile(profileId) : Promise.resolve([])),
    [profileId],
  );
  const [copied, setCopied] = useState<string | null>(null);

  const finished = (games ?? []).filter((g) => g.status === 'finished');

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
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      {games && finished.length === 0 && <p className="text-muted">{t('empty')}</p>}
      <ul className="flex flex-col gap-3">
        {finished.map((g) => {
          const level = resolveBotLevel(g.botId, g.customElo);
          return (
            <li key={g.id}>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                <span className="text-3xl" aria-hidden>
                  {level.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {t('vs', { bot: tb(`${g.botId}.name`) })}{' '}
                    <span className="text-xs font-normal text-muted">
                      · {g.playerColor === 'w' ? t('asWhite') : t('asBlack')} ·{' '}
                      {t('moves', { count: Math.ceil(g.moves.length / 2) })}
                      {g.style !== 'balanced' &&
                        ` · ${STYLE_ICONS[g.style]} ${ts(`${g.style}.name`)}`}
                      {g.botId === 'custom' && ` · ~${level.elo}`}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {format.dateTime(g.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    {g.endReason && ` · ${tg(`reason.${g.endReason}`)}`}
                    {(g.hintsUsed > 0 || g.undosUsed > 0) &&
                      ` · ${t('assists', { hints: g.hintsUsed, undos: g.undosUsed })}`}
                  </p>
                </div>
                {g.rated && g.ratingDelta !== undefined && (
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      g.ratingDelta >= 0 ? 'text-accent' : 'text-danger',
                    )}
                    title={tk('rated')}
                  >
                    {g.ratingDelta >= 0 ? '+' : ''}
                    {g.ratingDelta}
                  </span>
                )}
                {g.promotion && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted"
                    title={tk('promotionMatch')}
                  >
                    <RankEmblem
                      rank={RANKS[g.promotion.to].id}
                      size={22}
                      animated={false}
                      className={g.promotion.passed ? undefined : 'opacity-40 grayscale'}
                    />
                    {tk('promotionMatch')}
                  </span>
                )}
                {g.result && (
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold',
                      RESULT_STYLE[g.result],
                    )}
                  >
                    {tg(`result.${g.result}`)}
                  </span>
                )}
                <Link
                  href={`/review#${g.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-surface-2 text-fg hover:bg-border"
                >
                  🔍 {tv('open')}
                </Link>
                {g.pgn && (
                  <Button variant="ghost" onClick={() => void copy(g.id, g.pgn ?? '')}>
                    {copied === g.id ? t('copied') : t('copyPgn')}
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
