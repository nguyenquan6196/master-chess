'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
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

export type ColorChoice = 'w' | 'b' | 'random';

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
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

  const promotion = rank?.promotionTo != null ? RANKS[rank.promotionTo] : null;
  const ongoingLevel = ongoing ? resolveBotLevel(ongoing.botId, ongoing.customElo) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>

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

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">
          {t('chooseBot')} · {t('difficulty')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BOT_LEVELS.map((b) => {
            const selected = choice.botId === b.id;
            const guards = RANKS[bossRankIndex(b.id)];
            return (
              <li key={b.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setChoice({ ...choice, botId: b.id })}
                  className={cn(
                    'relative flex h-full w-full flex-col items-center gap-1 rounded-2xl border bg-surface p-3 text-center transition-transform hover:-translate-y-0.5',
                    selected ? 'border-accent ring-2 ring-accent' : 'border-border',
                  )}
                >
                  {suggested === b.id && (
                    <span className="absolute -top-2 right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-fg">
                      ⭐ {tk('next')}
                    </span>
                  )}
                  <span className="text-4xl" aria-hidden>
                    {b.emoji}
                  </span>
                  <span className="font-display font-semibold">{tb(`${b.id}.name`)}</span>
                  <span className="text-xs font-semibold text-accent tabular-nums">~{b.elo}</span>
                  {guards && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                      👑 {tk('bossOf', { rank: tr(guards.id) })}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-pressed={choice.botId === 'custom'}
              onClick={() => setChoice({ ...choice, botId: 'custom' })}
              className={cn(
                'flex h-full w-full flex-col items-center gap-1 rounded-2xl border border-dashed bg-surface p-3 text-center transition-transform hover:-translate-y-0.5',
                choice.botId === 'custom' ? 'border-accent ring-2 ring-accent' : 'border-border',
              )}
            >
              <span className="text-4xl" aria-hidden>
                🎛️
              </span>
              <span className="font-display font-semibold">{tb('custom.name')}</span>
              <span className="text-xs font-semibold text-accent tabular-nums">
                ~{choice.customElo}
              </span>
            </button>
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted">{tb(`${choice.botId}.desc`)}</p>
        {choice.botId === 'custom' && (
          <label className="mt-3 flex max-w-md flex-col gap-1">
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
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">{t('style')}</h2>
        <Segmented<BotStyle>
          value={choice.style}
          onChange={(style) => setChoice({ ...choice, style })}
          options={BOT_STYLES.map((s) => ({
            value: s,
            label: `${STYLE_ICONS[s]} ${ts(`${s}.name`)}`,
          }))}
        />
        <p className="mt-2 text-sm text-muted">{ts(`${choice.style}.desc`)}</p>
      </section>

      <section className="flex flex-wrap gap-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t('yourColor')}</h2>
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
          <h2 className="mb-2 text-sm font-semibold">{t('timeControl')}</h2>
          <Segmented<TimeControlId>
            value={choice.timeControl}
            onChange={(timeControl) => setChoice({ ...choice, timeControl })}
            options={TIME_CONTROLS.map((tc) => ({
              value: tc.id,
              label: tc.id === 'none' ? `∞ ${t('noLimit')}` : `⏱ ${tc.id}`,
            }))}
          />
        </div>
      </section>

      <div>
        <Button variant="primary" className="px-8 py-3 text-base" onClick={() => onStart(choice)}>
          ♟️ {t('start')}
        </Button>
      </div>
    </div>
  );
}
