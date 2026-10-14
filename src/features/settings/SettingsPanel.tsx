'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { playSfx, unlockAudio } from '@/services/audio/sfx';
import { useSettings } from '@/services/settings/store';
import { THEME_PREFERENCES } from '@/services/theme/themes';

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

/** Theme and sound settings, shown in the floating settings panel. Language lives in the header. */
export function SettingsPanel() {
  const t = useTranslations('settings');
  const { theme, setTheme, sfxEnabled, sfxVolume, update } = useSettings();

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted">🎨 {t('theme')}</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PREFERENCES.map((p) => (
            <OptionButton key={p} selected={theme === p} onClick={() => setTheme(p)}>
              {t(`themes.${p}`)}
            </OptionButton>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted">🔊 {t('sound')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">{t('sfx')}</span>
          <OptionButton selected={sfxEnabled} onClick={() => update({ sfxEnabled: true })}>
            {t('on')}
          </OptionButton>
          <OptionButton selected={!sfxEnabled} onClick={() => update({ sfxEnabled: false })}>
            {t('off')}
          </OptionButton>
        </div>
        <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {t('volume')}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(sfxVolume * 100)}
            disabled={!sfxEnabled}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })}
            className="w-36 accent-[var(--mc-accent)]"
          />
          <span className="w-10 tabular-nums text-muted">{Math.round(sfxVolume * 100)}%</span>
        </label>
        <div>
          <button
            type="button"
            disabled={!sfxEnabled}
            onClick={() => {
              unlockAudio();
              playSfx('capture');
            }}
            className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-surface-2 disabled:opacity-50"
          >
            ▶ {t('test')}
          </button>
        </div>
      </section>
    </div>
  );
}
