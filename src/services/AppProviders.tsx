'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { IntlProvider } from 'use-intl';
import { useShallow } from 'zustand/react/shallow';
import { installAudioUnlock } from './audio/engine';
import { installUiClickSounds } from './audio/sfx';
import { DEFAULT_LOCALE, detectLocale, type Locale } from './i18n/config';
import { DEFAULT_MESSAGES, loadMessages, type Messages } from './i18n/messages';
import { restoreSession, syncSettingsToProfile } from './profile/actions';
import { registerServiceWorker } from './pwa';
import { useSettings } from './settings/store';
import { useSession } from './profile/session';
import { applyAppearance } from './theme/appearance';
import { loadBackdropImage } from './theme/backdropImage';
import { resolveTheme } from './theme/themes';

/** Rehydrates settings, keeps <html> theme/lang in sync and provides translations. */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useSettings((s) => s.locale);
  const theme = useSettings((s) => s.theme);
  const appearance = useSettings(
    useShallow((s) => ({
      board: s.board,
      accent: s.accent,
      highlight: s.highlight,
      buttonStyle: s.buttonStyle,
      backdrop: s.backdrop,
      backdropColor: s.backdropColor,
      backdropGradient: s.backdropGradient,
      backdropDim: s.backdropDim,
      backdropBlur: s.backdropBlur,
    })),
  );
  const backdropVersion = useSettings((s) => s.backdropVersion);
  const profileId = useSession((s) => s.profile?.id);
  const [active, setActive] = useState<{ locale: Locale; messages: Messages }>({
    locale: DEFAULT_LOCALE,
    messages: DEFAULT_MESSAGES,
  });

  useEffect(() => {
    void Promise.resolve(useSettings.persist.rehydrate())
      .then(() => {
        const s = useSettings.getState();
        if (!s.localeChosen) s.setLocale(detectLocale(navigator.languages));
      })
      .then(restoreSession);
    const stopSync = syncSettingsToProfile();
    const stopUnlock = installAudioUnlock();
    const stopClicks = installUiClickSounds();
    registerServiceWorker();
    return () => {
      stopSync();
      stopUnlock();
      stopClicks();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadMessages(locale).then((messages) => {
      if (!cancelled) setActive({ locale, messages });
    });
    document.documentElement.lang = locale;
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme, media.matches);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  // Appearance overrides (+ the custom backdrop image, kept as an object URL).
  useEffect(() => {
    applyAppearance(appearance, null);
    if (appearance.backdrop !== 'image' || !profileId) return;
    let url: string | null = null;
    let cancelled = false;
    void loadBackdropImage(profileId).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      applyAppearance(appearance, url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [appearance, profileId, backdropVersion]);

  return (
    <IntlProvider locale={active.locale} messages={active.messages} timeZone="Asia/Ho_Chi_Minh">
      {children}
    </IntlProvider>
  );
}
