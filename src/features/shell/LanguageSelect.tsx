'use client';

import { useTranslations } from 'use-intl';
import { isLocale, LOCALE_LABELS, LOCALES } from '@/services/i18n/config';
import { useSettings } from '@/services/settings/store';

/** Compact language switcher for the header (native select: accessible and mobile friendly). */
export function LanguageSelect() {
  const t = useTranslations('settings');
  const locale = useSettings((s) => s.locale);
  const setLocale = useSettings((s) => s.setLocale);

  return (
    <label className="relative flex items-center rounded-full border border-border text-sm font-semibold hover:bg-surface-2">
      <span aria-hidden className="pointer-events-none absolute left-2">
        🌐
      </span>
      <select
        aria-label={t('language')}
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="cursor-pointer appearance-none rounded-full bg-transparent py-1 pr-3 pl-8 text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l} className="bg-surface text-fg">
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
