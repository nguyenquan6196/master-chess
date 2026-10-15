'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useFormatter, useNow, useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { Flag } from '@/components/ui/Flag';
import { profileRepo } from '@/services/db/repositories';
import { LOCALE_LABELS, LOCALES } from '@/services/i18n/config';
import { createProfile, selectProfile } from '@/services/profile/actions';
import { useSettings } from '@/services/settings/store';
import { ImportSaveButton } from './ImportSaveButton';
import { NewProfileForm } from './NewProfileForm';
import { WelcomeHero } from './WelcomeHero';

/** Faint checkerboard behind the welcome screen (theme colors only). */
const CHECKER_BG = {
  backgroundImage: 'repeating-conic-gradient(var(--mc-surface-2) 0 25%, transparent 0 50%)',
  backgroundSize: '64px 64px',
  maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 70%)',
} as const;

export function ProfilePicker() {
  const t = useTranslations('profile');
  const format = useFormatter();
  const now = useNow();
  const profiles = useLiveQuery(() => profileRepo.list(), []);
  const [creating, setCreating] = useState(false);
  const locale = useSettings((s) => s.locale);
  const setLocale = useSettings((s) => s.setLocale);

  const hasProfiles = !!profiles && profiles.length > 0;
  const showForm = creating || profiles?.length === 0;

  return (
    <div className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={CHECKER_BG}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <div className="flex gap-1 self-end rounded-xl border border-border bg-surface p-1">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                locale === l ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2',
              )}
            >
              <Flag code={l} />
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
          <WelcomeHero />

          <section className="order-first flex flex-col gap-5 rounded-3xl lg:order-none border border-border bg-surface p-5 shadow-card sm:p-7">
            <div>
              <h1 className="font-display text-3xl font-bold">{t('pickTitle')}</h1>
              <p className="mt-1 text-sm text-muted">{t('pickSubtitle')}</p>
            </div>

            {showForm ? (
              <NewProfileForm
                onSubmit={(name, avatar) => createProfile(name, avatar)}
                onCancel={hasProfiles ? () => setCreating(false) : undefined}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {profiles?.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void selectProfile(p)}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-bg p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <span
                        aria-hidden
                        className="grid size-14 shrink-0 place-items-center rounded-full bg-surface-2 text-3xl transition-transform group-hover:scale-110"
                      >
                        {p.avatar}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-semibold">
                          {p.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {t('lastActive', { date: format.relativeTime(p.lastActiveAt, now) })}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold tabular-nums">
                        🧩 {Math.round(p.puzzleRating.rating)}
                      </span>
                      <span
                        aria-hidden
                        className="text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
                      >
                        →
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-border p-3 text-left font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-2xl">
                      +
                    </span>
                    {t('newPlayer')}
                  </button>
                </li>
              </ul>
            )}

            <div className="flex justify-center border-t border-border pt-4">
              <ImportSaveButton
                label={t('importFromFile')}
                onImported={(p) => void selectProfile(p)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
