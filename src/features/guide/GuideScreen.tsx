'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { allLessons } from '@/core/learn/catalog';
import { BOT_LEVELS, getBotLevel } from '@/core/bot/levels';
import { DEFAULT_PUZZLE_RATING } from '@/core/profile/schema';
import { ACHIEVEMENTS, XP } from '@/core/progress/progress';
import { GAME_RATING, RANK_WIDTH, RANKS } from '@/core/rating/rank';
import { CATALOG } from '@/services/learn/learn';
import { QUIZ_QUESTIONS } from '@/services/quiz/quizContent';

const SECTIONS = [
  'why',
  'here',
  'features',
  'path',
  'points',
  'ranks',
  'xp',
  'tips',
  'faq',
] as const;
const WHY = ['think', 'focus', 'learn', 'fun'] as const;
const HERE = ['free', 'path', 'bots', 'review', 'offline', 'fun'] as const;
const FEATURES = [
  { key: 'learn', href: '/learn' },
  { key: 'practice', href: '/practice' },
  { key: 'play', href: '/play' },
  { key: 'review', href: '/history' },
] as const;
const FAQ = ['data', 'lose', 'mobile', 'unrated', 'bots'] as const;
const PATH_STEPS = 5;
const TIP_COUNT = 6;
const RULE_COUNT = 5;

const LINK_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-[var(--mc-radius-btn)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover';
const LINK_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-[var(--mc-radius-btn)] bg-surface-2 px-5 py-2.5 text-sm font-semibold hover:bg-border';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{body}</p>
    </Card>
  );
}

/** The player guide: chess, the site, points, ranks, XP, tips and FAQ. */
export function GuideScreen() {
  const t = useTranslations('guide');
  const tr = useTranslations('rank');
  const tb = useTranslations('bots');
  const tn = useTranslations('nav');
  /** Numbered/list keys are data-driven; all exist in every locale (check-i18n). */
  const tDyn = t as unknown as (key: string, values?: Record<string, string | number>) => string;
  const tierSize = Math.round(RANK_WIDTH / 3);

  const xpRows: { key: string; value: string }[] = [
    { key: 'lesson', value: `+${XP.lessonFirst}` },
    { key: 'perfect', value: `+${XP.lessonPerfectBonus}` },
    { key: 'quiz', value: `+${XP.quizPerCorrect}` },
    { key: 'puzzle', value: `+${XP.puzzleSolved}` },
    { key: 'daily', value: `+${XP.puzzleDailyBonus}` },
    { key: 'rush', value: `+${XP.rushPerPoint}` },
    { key: 'win', value: t('xp.winValue', { per: XP.gameWinPerTier }) },
    { key: 'draw', value: `+${XP.gameDraw}` },
    { key: 'loss', value: `+${XP.gameLoss}` },
    { key: 'review', value: `+${XP.review}` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-bold tracking-wide text-accent uppercase">📘 {t('title')}</p>
        <h1 className="font-display text-4xl font-bold">{t('heroTitle')}</h1>
        <p className="max-w-2xl text-lg text-muted">{t('heroSubtitle')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
        <nav aria-label={t('toc')} className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 hidden text-xs font-bold tracking-wide text-muted uppercase lg:block">
            {t('toc')}
          </p>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {SECTIONS.map((s) => (
              <li key={s}>
                <a
                  href={`#${s}`}
                  className="block rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-muted hover:text-fg lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2"
                >
                  {t(`nav.${s}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <Section id="why" title={t('why.title')}>
            <p className="text-muted">{t('why.intro')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {WHY.map((k) => (
                <InfoCard
                  key={k}
                  title={t(`why.items.${k}.title`)}
                  body={t(`why.items.${k}.body`)}
                />
              ))}
            </div>
          </Section>

          <Section id="here" title={t('here.title')}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {HERE.map((k) => (
                <InfoCard
                  key={k}
                  title={t(`here.items.${k}.title`)}
                  body={t(`here.items.${k}.body`)}
                />
              ))}
            </div>
          </Section>

          <Section id="features" title={t('features.title')}>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURES.map(({ key, href }) => (
                <Link key={key} href={href} className="transition-transform hover:-translate-y-0.5">
                  <InfoCard
                    title={t(`features.${key}.title`)}
                    body={tDyn(`features.${key}.body`, {
                      lessons: allLessons(CATALOG).length,
                      quiz: QUIZ_QUESTIONS.length,
                      bots: BOT_LEVELS.length,
                    })}
                  />
                </Link>
              ))}
            </div>
          </Section>

          <Section id="path" title={t('path.title')}>
            <p className="text-muted">{t('path.intro')}</p>
            <ol className="flex flex-col gap-2">
              {Array.from({ length: PATH_STEPS }, (_, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{tDyn(`path.steps.${i}`)}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Link href="/learn" className={LINK_PRIMARY}>
                📖 {t('path.cta.learn')}
              </Link>
              <Link href="/play/bot" className={LINK_SECONDARY}>
                ♟️ {t('path.cta.play')}
              </Link>
            </div>
          </Section>

          <Section id="points" title={t('points.title')}>
            <p className="text-muted">{t('points.intro')}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                title={t('points.rank.title')}
                body={t('points.rank.body', { start: GAME_RATING.initial.rating })}
              />
              <InfoCard
                title={t('points.puzzle.title')}
                body={t('points.puzzle.body', { start: DEFAULT_PUZZLE_RATING.rating })}
              />
              <InfoCard title={t('points.xp.title')} body={t('points.xp.body')} />
            </div>
          </Section>

          <Section id="ranks" title={t('ranks.title')}>
            <p className="text-muted">{t('ranks.intro')}</p>
            <Card className="overflow-x-auto p-2 sm:p-4">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted uppercase">
                  <tr>
                    <th className="p-2">{t('ranks.colRank')}</th>
                    <th className="p-2">{t('ranks.colPoints')}</th>
                    <th className="hidden p-2 sm:table-cell">{t('ranks.colTiers')}</th>
                    <th className="p-2">{t('ranks.colBoss')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map((r, i) => {
                    const next = RANKS[i + 1];
                    const boss = getBotLevel(r.boss);
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-2">
                          <span className="flex items-center gap-3">
                            <RankEmblem rank={r.id} size={i >= 5 ? 72 : 60} title={tr(r.id)} />
                            <span className="font-display text-base font-bold">{tr(r.id)}</span>
                          </span>
                        </td>
                        <td className="p-2 tabular-nums">
                          {i === 0
                            ? t('ranks.below', { max: RANKS[1].min })
                            : next
                              ? t('ranks.range', { min: r.min, max: next.min - 1 })
                              : t('ranks.from', { min: r.min })}
                        </td>
                        <td className="hidden p-2 sm:table-cell">
                          {r.tiers > 1 ? t('ranks.tiers3') : t('ranks.tiers1')}
                        </td>
                        <td className="p-2">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-xl" aria-hidden>
                              {boss.emoji}
                            </span>
                            {tb(`${r.boss}.name`)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
            <Card className="flex flex-col gap-2 p-4">
              <h3 className="font-display text-lg font-semibold">⚔️ {t('ranks.rulesTitle')}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                {Array.from({ length: RULE_COUNT }, (_, i) => (
                  <li key={i}>{tDyn(`ranks.rules.${i}`, { tier: tierSize })}</li>
                ))}
              </ul>
            </Card>
          </Section>

          <Section id="xp" title={t('xp.title')}>
            <Card className="p-2 sm:p-4">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted uppercase">
                  <tr>
                    <th className="p-2">{t('xp.colAction')}</th>
                    <th className="p-2 text-right">{t('xp.colXp')}</th>
                  </tr>
                </thead>
                <tbody>
                  {xpRows.map((row) => (
                    <tr key={row.key} className="border-t border-border">
                      <td className="p-2">{tDyn(`xp.rows.${row.key}`)}</td>
                      <td className="p-2 text-right font-semibold whitespace-nowrap text-accent tabular-nums">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              <li>⭐ {t('xp.level', { step: XP.levelStep })}</li>
              <li>{t('xp.streak')}</li>
              <li>🏅 {t('xp.achievements', { count: ACHIEVEMENTS.length })}</li>
            </ul>
          </Section>

          <Section id="tips" title={t('tips.title')}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: TIP_COUNT }, (_, i) => (
                <li key={i} className="flex gap-2 rounded-xl bg-surface-2 p-3 text-sm">
                  <span aria-hidden>💡</span>
                  {tDyn(`tips.items.${i}`)}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="faq" title={t('faq.title')}>
            <div className="flex flex-col gap-2">
              {FAQ.map((k) => (
                <details key={k} className="group rounded-xl border border-border bg-surface p-4">
                  <summary className="cursor-pointer font-semibold marker:text-accent">
                    {t(`faq.items.${k}.title`)}
                  </summary>
                  <p className="mt-2 text-sm text-muted">{t(`faq.items.${k}.body`)}</p>
                </details>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/learn" className={LINK_PRIMARY}>
                📖 {tn('learn')}
              </Link>
              <Link href="/practice" className={LINK_SECONDARY}>
                🧩 {tn('practice')}
              </Link>
              <Link href="/play" className={LINK_SECONDARY}>
                ♟️ {tn('play')}
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
