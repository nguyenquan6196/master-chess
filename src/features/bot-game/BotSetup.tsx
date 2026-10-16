'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { RankEmblem } from '@/components/ui/RankEmblem';
import type { Dialogue } from '@/core/bot/dialogue';
import {
  BOT_LEVELS,
  CUSTOM_ELO,
  getBotLevel,
  resolveBotLevel,
  type BotId,
  type BotKey,
} from '@/core/bot/levels';
import { BOT_STYLES, STYLE_ICONS, type BotStyle } from '@/core/bot/styles';
import { TIME_CONTROLS, type TimeControlId } from '@/core/game/clock';
import type { GameRecord } from '@/core/profile/schema';
import { bossRankIndex, RANKS, type RankStatus } from '@/core/rating/rank';
import { loadDialogue } from '@/services/bots/dialogue';
import { useSettings } from '@/services/settings/store';

export type ColorChoice = 'w' | 'b' | 'random';

/** Character-select roster: ladder bots, then the custom bot. */
const ROSTER: BotKey[] = [...BOT_LEVELS.map((b) => b.id), 'custom'];
/** Strength meter: segments, full at this Elo. */
const STRENGTH_STEPS = 10;
const STRENGTH_MAX_ELO = 2800;

export interface SetupChoice {
  botId: BotKey;
  customElo: number;
  style: BotStyle;
  color: ColorChoice;
  timeControl: TimeControlId;
}

interface BotSetupProps {
  initial: SetupChoice;
  ongoing: GameRecord | null;
  rank: RankStatus | null;
  suggested: BotId | null;
  onStart: (choice: SetupChoice) => void;
  onContinue: () => void;
  onAbandon: () => void;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'mc-press rounded-lg px-3 py-1.5 text-sm font-semibold',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const STAGE_ARROW =
  'mc-press absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-lg shadow-card hover:bg-surface-2';

/**
 * Bot selection as a game "character select": a stage with the chosen bot (portrait,
 * strength, rank it guards, catchphrase), a roster strip below, and the match options
 * (style, colour, clock) next to a big start button. ← → cycle through the roster.
 */
export function BotSetup({
  initial,
  ongoing,
  rank,
  suggested,
  onStart,
  onContinue,
  onAbandon,
}: BotSetupProps) {
  const t = useTranslations('botGame');
  const tg = useTranslations('game');
  const tb = useTranslations('bots');
  const ts = useTranslations('botStyles');
  const tr = useTranslations('rank');
  const tk = useTranslations('ranking');
  const [choice, setChoice] = useState(initial);
  const locale = useSettings((x) => x.locale);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDialogue(locale).then((d) => !cancelled && setDialogue(d));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const promotion = rank?.promotionTo != null ? RANKS[rank.promotionTo] : null;
  const ongoingLevel = ongoing ? resolveBotLevel(ongoing.botId, ongoing.customElo) : null;
  const selected = resolveBotLevel(choice.botId, choice.customElo);
  const guards = choice.botId === 'custom' ? null : RANKS[bossRankIndex(choice.botId)];
  const strength = Math.max(1, Math.round((selected.elo / STRENGTH_MAX_ELO) * STRENGTH_STEPS));
  const quote = dialogue ? (dialogue[choice.botId]?.start?.[0] ?? null) : null;

  const step = (dir: 1 | -1) => {
    const i = ROSTER.indexOf(choice.botId);
    setChoice({ ...choice, botId: ROSTER[(i + dir + ROSTER.length) % ROSTER.length] });
  };

  // ← → switch bots (not while typing or dragging a slider).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold">{t('title')}</h1>

      {ongoing && ongoingLevel && (
        <Card className="flex flex-wrap items-center gap-4 border-accent">
          <span className="text-4xl" aria-hidden>
            {ongoingLevel.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{t('continueTitle')}</p>
            <p className="text-sm text-muted">
              {t('continueDesc', {
                bot: tb(`${ongoing.botId}.name`),
                count: Math.ceil(ongoing.moves.length / 2),
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onAbandon}>
              {t('abandon')}
            </Button>
            <Button variant="primary" onClick={onContinue}>
              ▶ {t('continue')}
            </Button>
          </div>
        </Card>
      )}

      {promotion && (
        <Card className="flex flex-wrap items-center gap-4 border-2 border-accent bg-surface">
          <span className="text-4xl" aria-hidden>
            {getBotLevel(promotion.boss).emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-accent">⚔️ {tk('promotionTitle')}</p>
            <p className="text-sm text-muted">
              {tk('promotionDesc', { rank: tr(promotion.id), bot: tb(`${promotion.boss}.name`) })}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => onStart({ ...choice, botId: promotion.boss, style: 'balanced' })}
          >
            {tk('promotionStart')}
          </Button>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-border bg-surface px-14 py-6 text-center shadow-card"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 32%, color-mix(in srgb, var(--mc-accent) 22%, transparent), transparent 62%)',
            }}
          >
            <button
              type="button"
              aria-label={t('prevBot')}
              onClick={() => step(-1)}
              className={cn(STAGE_ARROW, 'left-3')}
            >
              ◀
            </button>
            <button
              type="button"
              aria-label={t('nextBot')}
              onClick={() => step(1)}
              className={cn(STAGE_ARROW, 'right-3')}
            >
              ▶
            </button>

            <div key={choice.botId} className="mc-pop flex flex-col items-center gap-2">
              <span className="flex min-h-6 flex-wrap items-center justify-center gap-2">
                {suggested === choice.botId && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg">
                    ⭐ {tk('next')}
                  </span>
                )}
                {guards && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pr-2 pl-1 text-[11px] font-semibold text-muted">
                    <RankEmblem rank={guards.id} size={18} animated={false} />
                    {tk('bossOf', { rank: tr(guards.id) })}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className="mc-float grid size-32 place-items-center rounded-full border-4 border-accent bg-surface-2 text-7xl shadow-card sm:size-36 sm:text-8xl"
              >
                {selected.emoji}
              </span>
              <h2 className="font-display text-3xl font-bold">{tb(`${choice.botId}.name`)}</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
                <span className="text-accent tabular-nums">Elo ~{selected.elo}</span>
                <span aria-hidden className="text-muted">
                  ·
                </span>
                <span className="text-muted">{t('strength')}</span>
                <span className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: STRENGTH_STEPS }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-2 w-3 rounded-sm',
                        i < strength ? 'bg-accent' : 'bg-surface-2',
                      )}
                    />
                  ))}
                </span>
              </div>
              <p className="max-w-sm text-sm text-muted">{tb(`${choice.botId}.desc`)}</p>
              {quote && <p className="max-w-sm text-sm italic">“{quote}”</p>}
            </div>

            {choice.botId === 'custom' && (
              <label className="mt-1 flex w-full max-w-xs flex-col gap-1">
                <span className="text-sm font-semibold tabular-nums">
                  {t('customElo', { elo: choice.customElo })}
                </span>
                <input
                  type="range"
                  min={CUSTOM_ELO.min}
                  max={CUSTOM_ELO.max}
                  step={CUSTOM_ELO.step}
                  value={choice.customElo}
                  onChange={(e) => setChoice({ ...choice, customElo: Number(e.target.value) })}
                  className="accent-[var(--mc-accent)]"
                />
              </label>
            )}
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('chooseBot')}</h2>
            <ul className="flex gap-2 overflow-x-auto px-1 pt-1 pb-2">
              {ROSTER.map((id) => {
                const lv = resolveBotLevel(id, choice.customElo);
                const active = choice.botId === id;
                return (
                  <li key={id} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setChoice({ ...choice, botId: id })}
                      className={cn(
                        'mc-lift flex w-20 flex-col items-center gap-1 rounded-2xl border bg-surface p-2 text-center shadow-card',
                        active
                          ? 'border-accent ring-2 ring-accent'
                          : 'border-border opacity-75 hover:opacity-100',
                      )}
                    >
                      <span className="relative text-3xl" aria-hidden>
                        {lv.emoji}
                        {suggested === id && (
                          <span className="absolute -top-1 -right-2 text-xs">⭐</span>
                        )}
                      </span>
                      <span className="w-full truncate text-xs font-semibold">
                        {tb(`${id}.name`)}
                      </span>
                      <span className="text-[10px] font-semibold text-muted tabular-nums">
                        ~{lv.elo}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-card">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('style')}</h3>
            <Segmented<BotStyle>
              value={choice.style}
              onChange={(style) => setChoice({ ...choice, style })}
              options={BOT_STYLES.map((s) => ({
                value: s,
                label: `${STYLE_ICONS[s]} ${ts(`${s}.name`)}`,
              }))}
            />
            <p className="mt-2 text-xs text-muted">{ts(`${choice.style}.desc`)}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('yourColor')}</h3>
            <Segmented<ColorChoice>
              value={choice.color}
              onChange={(color) => setChoice({ ...choice, color })}
              options={[
                { value: 'w', label: `♔ ${tg('white')}` },
                { value: 'random', label: `🎲 ${t('random')}` },
                { value: 'b', label: `♚ ${tg('black')}` },
              ]}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('timeControl')}</h3>
            <Segmented<TimeControlId>
              value={choice.timeControl}
              onChange={(timeControl) => setChoice({ ...choice, timeControl })}
              options={TIME_CONTROLS.map((tc) => ({
                value: tc.id,
                label: tc.id === 'none' ? `∞ ${t('noLimit')}` : `⏱ ${tc.id}`,
              }))}
            />
          </div>
          <Button
            variant="primary"
            className="mt-auto w-full py-3 text-lg"
            onClick={() => onStart(choice)}
          >
            ♟️ {t('start')}
          </Button>
        </div>
      </section>
    </div>
  );
}
