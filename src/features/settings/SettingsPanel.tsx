'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { playSfx, unlockAudio } from '@/services/audio/sfx';
import { useSettings } from '@/services/settings/store';
import { THEME_PREFERENCES } from '@/services/theme/themes';

/** Segmented choice: options stay on one line and only wrap when they don't fit. */
function Segmented<T extends string | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex w-fit flex-wrap gap-1 rounded-xl bg-surface-2 p-1"
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One setting: label on the left, control on the right (stacked on narrow screens). */
function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-bold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Theme and sound settings for the floating settings panel. Language lives in the header. */
export function SettingsPanel() {
  const t = useTranslations('settings');
  const { theme, setTheme, sfxEnabled, sfxVolume, update } = useSettings();

  return (
    <div className="flex flex-col gap-5">
      <SettingSection title={`🎨 ${t('appearance')}`}>
        <SettingRow label={t('theme')}>
          <Segmented
            label={t('theme')}
            value={theme}
            onChange={setTheme}
            options={THEME_PREFERENCES.map((p) => ({
              value: p,
              label: t(`themes.${p}`),
              title: p === 'auto' ? t('autoHint') : undefined,
            }))}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title={`🔊 ${t('sound')}`}>
        <SettingRow label={t('sfx')}>
          <Segmented
            label={t('sfx')}
            value={sfxEnabled}
            onChange={(v) => update({ sfxEnabled: v })}
            options={[
              { value: true, label: t('on') },
              { value: false, label: t('off') },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('volume')}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(sfxVolume * 100)}
            disabled={!sfxEnabled}
            aria-label={t('volume')}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })}
            className="w-40 accent-[var(--mc-accent)] disabled:opacity-50"
          />
          <span className="w-10 text-sm tabular-nums text-muted">
            {Math.round(sfxVolume * 100)}%
          </span>
          <button
            type="button"
            disabled={!sfxEnabled}
            onClick={() => {
              unlockAudio();
              playSfx('capture');
            }}
            className="rounded-lg border border-border px-3 py-1 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
          >
            ▶ {t('test')}
          </button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
