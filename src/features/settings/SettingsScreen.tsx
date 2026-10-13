'use client';

import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { LOCALE_LABELS, LOCALES } from '@/services/i18n/config';
import { useSettings } from '@/services/settings/store';
import { THEME_PREFERENCES } from '@/services/theme/themes';

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

export function SettingsScreen() {
  const t = useTranslations('settings');
  const { locale, theme, setLocale, setTheme } = useSettings();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold">🌐 {t('language')}</h2>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <OptionButton key={l} selected={locale === l} onClick={() => setLocale(l)}>
              <span lang={l}>{LOCALE_LABELS[l]}</span>
            </OptionButton>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold">🎨 {t('theme')}</h2>
        <div className="flex flex-wrap gap-2">
          {THEME_PREFERENCES.map((p) => (
            <OptionButton key={p} selected={theme === p} onClick={() => setTheme(p)}>
              {t(`themes.${p}`)}
            </OptionButton>
          ))}
        </div>
      </Card>
    </div>
  );
}
