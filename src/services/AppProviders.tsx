'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { IntlProvider } from 'use-intl';
import { DEFAULT_LOCALE, detectLocale, type Locale } from './i18n/config';
import { DEFAULT_MESSAGES, loadMessages, type Messages } from './i18n/messages';
import { useSettings } from './settings/store';
import { resolveTheme } from './theme/themes';

/** Rehydrates settings, keeps <html> theme/lang in sync and provides translations. */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useSettings((s) => s.locale);
  const theme = useSettings((s) => s.theme);
  const [active, setActive] = useState<{ locale: Locale; messages: Messages }>({
    locale: DEFAULT_LOCALE,
    messages: DEFAULT_MESSAGES,
  });

  useEffect(() => {
    void Promise.resolve(useSettings.persist.rehydrate()).then(() => {
      const s = useSettings.getState();
      if (!s.localeChosen) s.setLocale(detectLocale(navigator.languages));
    });
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

  return (
    <IntlProvider locale={active.locale} messages={active.messages} timeZone="Asia/Ho_Chi_Minh">
      {children}
    </IntlProvider>
  );
}
