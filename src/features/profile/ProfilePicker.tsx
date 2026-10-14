'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useFormatter, useNow, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { profileRepo } from '@/services/db/repositories';
import { LOCALE_LABELS, LOCALES } from '@/services/i18n/config';
import { createProfile, selectProfile } from '@/services/profile/actions';
import { useSettings } from '@/services/settings/store';
import { NewProfileForm } from './NewProfileForm';
import { ImportSaveButton } from './ImportSaveButton';

export function ProfilePicker() {
  const t = useTranslations('profile');
  const format = useFormatter();
  const now = useNow();
  const profiles = useLiveQuery(() => profileRepo.list(), []);
  const [creating, setCreating] = useState(false);
  const locale = useSettings((s) => s.locale);
  const setLocale = useSettings((s) => s.setLocale);

  const showForm = creating || profiles?.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex gap-1 self-end">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => setLocale(l)}
            className={cn(
              'rounded-lg px-2 py-1 text-xs font-semibold',
              locale === l ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2',
            )}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-5xl" aria-hidden>
          ♞
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t('pickTitle')}</h1>
        <p className="mt-2 text-muted">{t('pickSubtitle')}</p>
      </div>

      {profiles && profiles.length > 0 && !showForm && (
        <ul className="grid w-full gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => void selectProfile(p)}
                className="w-full text-left focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Card className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
                  <span className="text-4xl" aria-hidden>
                    {p.avatar}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-semibold">
                      {p.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {t('lastActive', { date: format.relativeTime(p.lastActiveAt, now) })}
                    </span>
                  </span>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <NewProfileForm
          onSubmit={(name, avatar) => createProfile(name, avatar)}
          onCancel={profiles && profiles.length > 0 ? () => setCreating(false) : undefined}
        />
      ) : (
        <Button variant="primary" onClick={() => setCreating(true)}>
          + {t('newPlayer')}
        </Button>
      )}

      <ImportSaveButton label={t('importFromFile')} onImported={(p) => void selectProfile(p)} />
    </div>
  );
}
