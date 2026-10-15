'use client';

import { useTranslations } from 'use-intl';
import { playSfx, unlockAudio } from '@/services/audio/sfx';
import { useSettings } from '@/services/settings/store';
import { AppearanceSettings } from './AppearanceSettings';
import { Segmented, SettingRow, SettingSection } from './controls';

/** Theme and sound settings for the floating settings panel. Language lives in the header. */
export function SettingsPanel() {
  const t = useTranslations('settings');
  const { sfxEnabled, sfxVolume, update } = useSettings();

  return (
    <div className="flex flex-col gap-5">
      <AppearanceSettings />

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
