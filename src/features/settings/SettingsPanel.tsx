'use client';

import { useTranslations } from 'use-intl';
import { MUSIC_MODES, MUSIC_TRACKS, SOUND_PACKS } from '@/core/profile/settingsOptions';
import { playSfx, unlockAudio } from '@/services/audio/sfx';
import { useSettings } from '@/services/settings/store';
import { AppearanceSettings } from './AppearanceSettings';
import { Segmented, SettingRow, SettingSection } from './controls';

function Volume({
  value,
  label,
  disabled,
  onChange,
}: {
  value: number;
  label: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-40 accent-[var(--mc-accent)] disabled:opacity-50"
      />
      <span className="w-10 text-sm text-muted tabular-nums">{Math.round(value * 100)}%</span>
    </>
  );
}

/** Appearance and sound settings for the floating settings panel. Language lives in the header. */
export function SettingsPanel() {
  const t = useTranslations('settings');
  const s = useSettings();
  const off = s.muted;

  return (
    <div className="flex flex-col gap-5">
      <AppearanceSettings />

      <SettingSection title={`🔊 ${t('sound')}`}>
        <SettingRow label={t('muteAll')}>
          <Segmented
            label={t('muteAll')}
            value={s.muted}
            onChange={(muted) => s.update({ muted })}
            options={[
              { value: false, label: t('on') },
              { value: true, label: t('off') },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('master')}>
          <Volume
            value={s.masterVolume}
            label={t('master')}
            disabled={off}
            onChange={(masterVolume) => s.update({ masterVolume })}
          />
        </SettingRow>

        <SettingRow label={t('music')}>
          <Segmented
            label={t('music')}
            value={s.musicMode}
            onChange={(musicMode) => {
              unlockAudio();
              s.update({ musicMode });
            }}
            options={MUSIC_MODES.map((m) => ({ value: m, label: t(`musicModes.${m}`) }))}
          />
        </SettingRow>
        {s.musicMode === 'auto' && <p className="-mt-2 text-xs text-muted">{t('musicHint')}</p>}
        {s.musicMode === 'fixed' && (
          <SettingRow label={t('track')}>
            <Segmented
              label={t('track')}
              value={s.musicTrack}
              onChange={(musicTrack) => s.update({ musicTrack })}
              options={MUSIC_TRACKS.map((tr) => ({ value: tr, label: t(`tracks.${tr}`) }))}
            />
          </SettingRow>
        )}
        <SettingRow label={t('musicVolume')}>
          <Volume
            value={s.musicVolume}
            label={t('musicVolume')}
            disabled={off || s.musicMode === 'off'}
            onChange={(musicVolume) => s.update({ musicVolume })}
          />
        </SettingRow>

        <SettingRow label={t('sfx')}>
          <Segmented
            label={t('sfx')}
            value={s.sfxEnabled}
            onChange={(sfxEnabled) => s.update({ sfxEnabled })}
            options={[
              { value: true, label: t('on') },
              { value: false, label: t('off') },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('volume')}>
          <Volume
            value={s.sfxVolume}
            label={t('volume')}
            disabled={off || !s.sfxEnabled}
            onChange={(sfxVolume) => s.update({ sfxVolume })}
          />
        </SettingRow>
        <SettingRow label={t('soundPack')}>
          <Segmented
            label={t('soundPack')}
            value={s.soundPack}
            onChange={(soundPack) => {
              unlockAudio();
              s.update({ soundPack });
              playSfx('capture', soundPack);
            }}
            options={SOUND_PACKS.map((p) => ({ value: p, label: t(`soundPacks.${p}`) }))}
          />
          <button
            type="button"
            disabled={off || !s.sfxEnabled}
            onClick={() => {
              unlockAudio();
              playSfx('promote');
            }}
            className="rounded-lg border border-border px-3 py-1 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
          >
            ▶ {t('test')}
          </button>
        </SettingRow>
        <SettingRow label={t('uiVolume')}>
          <Volume
            value={s.uiVolume}
            label={t('uiVolume')}
            disabled={off}
            onChange={(uiVolume) => s.update({ uiVolume })}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
