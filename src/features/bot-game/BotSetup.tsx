'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { BOT_LEVELS, getBotLevel, type BotId } from '@/core/bot/levels';
import { TIME_CONTROLS, type TimeControlId } from '@/core/game/clock';
import type { GameRecord } from '@/core/profile/schema';

export type ColorChoice = 'w' | 'b' | 'random';

export interface SetupChoice {
  botId: BotId;
  color: ColorChoice;
  timeControl: TimeControlId;
}

interface BotSetupProps {
  initial: SetupChoice;
  ongoing: GameRecord | null;
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

export function BotSetup({ initial, ongoing, onStart, onContinue, onAbandon }: BotSetupProps) {
  const t = useTranslations('botGame');
  const tg = useTranslations('game');
  const tb = useTranslations('bots');
  const [choice, setChoice] = useState(initial);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>

      {ongoing && (
        <Card className="flex flex-wrap items-center gap-4 border-accent">
          <span className="text-4xl" aria-hidden>
            {getBotLevel(ongoing.botId).emoji}
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

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">{t('chooseBot')}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BOT_LEVELS.map((b) => {
            const selected = choice.botId === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setChoice({ ...choice, botId: b.id })}
                  className={cn(
                    'flex h-full w-full flex-col items-center gap-1 rounded-2xl border bg-surface p-3 text-center transition-transform hover:-translate-y-0.5',
                    selected ? 'border-accent ring-2 ring-accent' : 'border-border',
                  )}
                >
                  <span className="text-4xl" aria-hidden>
                    {b.emoji}
                  </span>
                  <span className="font-display font-semibold">{tb(`${b.id}.name`)}</span>
                  <span className="text-xs font-semibold text-accent tabular-nums">~{b.elo}</span>
                  <span className="hidden text-xs text-muted sm:block">{tb(`${b.id}.desc`)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-muted sm:hidden">{tb(`${choice.botId}.desc`)}</p>
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
