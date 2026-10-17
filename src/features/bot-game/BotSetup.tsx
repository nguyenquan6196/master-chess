'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useSession } from '@/services/profile/session';
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
  const player = useSession((x) => x.profile);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const roster = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDialogue(locale).then((d) => !cancelled && setDialogue(d));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const promotion = rank?.promotionTo != null ? RANKS[rank.promotionTo] : null;
  const ongoingLevel = ongoing ? resolveBotLevel(ongoing.botId, ongoing.customElo) : null;

  const shownBoss = choice.botId === 'custom' ? null : RANKS[bossRankIndex(choice.botId)];
  const step = (dir: 1 | -1) => {
    const i = ROSTER.indexOf(choice.botId);
    setChoice({ ...choice, botId: ROSTER[(i + dir + ROSTER.length) % ROSTER.length] });
  };

  // Keep the selected bot centred in the roster strip (e.g. after ◀ ▶ reach Master/Custom).
  useEffect(() => {
    const list = roster.current;
    const item = list?.querySelector<HTMLElement>(`[data-bot="${choice.botId}"]`);
    if (!list || !item) return;
    const offset = item.getBoundingClientRect().left - list.getBoundingClientRect().left;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({
      left: list.scrollLeft + offset - (list.clientWidth - item.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [choice.botId]);

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
    <div className="flex flex-1 flex-col gap-4">
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

      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="relative flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-border bg-surface px-14 pt-14 pb-8 text-center shadow-card"
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
              <span aria-hidden className="text-base">
                ⬅️
              </span>
            </button>
            <button
              type="button"
              aria-label={t('nextBot')}
              onClick={() => step(1)}
              className={cn(STAGE_ARROW, 'right-3')}
            >
              <span aria-hidden className="text-base">
                ➡️
              </span>
            </button>

            {/* Tags ride at the top edge of the stage. */}
            <span
              key={choice.botId}
              className="mc-pop absolute inset-x-14 top-4 z-10 flex flex-wrap items-center justify-center gap-2"
            >
              {suggested === choice.botId && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg">
                  ⭐ {tk('next')}
                </span>
              )}
              {shownBoss && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pr-2 pl-1 text-[11px] font-semibold text-muted">
                  <RankEmblem rank={shownBoss.id} size={22} animated={false} />
                  {tk('bossOf', { rank: tr(shownBoss.id) })}
                </span>
              )}
            </span>

            {/* Every bot's card is stacked in one grid cell and only the selected one is
                visible, so the stage is always as tall as the tallest bot (no jumping
                when switching, e.g. to the custom bot with its Elo slider). */}
            <div className="grid w-full">
              {ROSTER.map((id) => {
                const shown = id === choice.botId;
                const lv = resolveBotLevel(id, choice.customElo);
                const power = Math.max(1, Math.round((lv.elo / STRENGTH_MAX_ELO) * STRENGTH_STEPS));
                const line = dialogue?.[id]?.start?.[0] ?? null;
                return (
                  <div
                    key={shown ? `${id}-shown` : id}
                    aria-hidden={!shown}
                    className={cn(
                      'col-start-1 row-start-1 flex flex-col items-center gap-3',
                      shown ? 'mc-pop' : 'invisible',
                    )}
                  >
                    {/* Portrait: a turning ring of light with a glow, a soft inner disc
                        and a shadow "pedestal" under the floating bot. */}
                    <span aria-hidden className="flex flex-col items-center">
                      <span className="relative grid size-36 place-items-center sm:size-40 lg:size-44">
                        <span
                          className={cn(
                            'mc-portrait-ring absolute inset-0 rounded-full',
                            shown && 'mc-portrait-ring--live',
                          )}
                        />
                        <span className="mc-portrait-disc absolute inset-[7px] rounded-full" />
                        <span
                          className={cn(
                            'relative text-7xl sm:text-8xl lg:text-[7rem]',
                            shown && 'mc-float',
                          )}
                        >
                          {lv.emoji}
                        </span>
                      </span>
                      <span className="mc-portrait-pedestal -mt-1 h-3 w-28 rounded-[50%]" />
                    </span>
                    <h2 className="font-display text-3xl font-bold">{tb(`${id}.name`)}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
                      <span className="text-accent tabular-nums">Elo ~{lv.elo}</span>
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
                              i < power ? 'bg-accent' : 'bg-surface-2',
                            )}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-muted">
                      {tb(`${id}.desc`)}
                    </p>
                    {id === 'custom' ? (
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
                          tabIndex={shown ? undefined : -1}
                          onChange={(e) =>
                            setChoice({ ...choice, customElo: Number(e.target.value) })
                          }
                          className="accent-[var(--mc-accent)]"
                        />
                      </label>
                    ) : (
                      line && <p className="max-w-sm text-sm italic">“{line}”</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('chooseBot')}</h2>
            <ul ref={roster} className="flex gap-2 overflow-x-auto px-1 pt-1 pb-2">
              {ROSTER.map((id) => {
                const lv = resolveBotLevel(id, choice.customElo);
                const active = choice.botId === id;
                return (
                  <li key={id} data-bot={id} className="shrink-0">
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
          <div className="mt-auto flex flex-col gap-3">
            {/* Match-up preview: you vs the selected bot, with the chosen options. */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl bg-surface-2 p-4 text-center">
              <div className="flex min-w-0 flex-col items-center gap-0.5">
                <span aria-hidden className="text-4xl">
                  {player?.avatar ?? '♟️'}
                </span>
                <span className="w-full truncate text-sm font-semibold">{player?.name}</span>
                <span className="text-xs text-muted">
                  {choice.color === 'w'
                    ? `♔ ${tg('white')}`
                    : choice.color === 'b'
                      ? `♚ ${tg('black')}`
                      : `🎲 ${t('random')}`}
                </span>
              </div>
              <span className="font-display text-2xl font-black text-accent italic">
                {t('versus')}
              </span>
              <div key={choice.botId} className="mc-pop flex min-w-0 flex-col items-center gap-0.5">
                <span aria-hidden className="text-4xl">
                  {resolveBotLevel(choice.botId, choice.customElo).emoji}
                </span>
                <span className="w-full truncate text-sm font-semibold">
                  {tb(`${choice.botId}.name`)}
                </span>
                <span className="text-xs text-muted">
                  {STYLE_ICONS[choice.style]} {ts(`${choice.style}.name`)} ·{' '}
                  {choice.timeControl === 'none' ? '∞' : choice.timeControl}
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full py-3 text-lg"
              onClick={() => onStart(choice)}
            >
              ♟️ {t('start')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
