'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { PROFILE_AVATARS, PROFILE_NAME_MAX } from '@/core/profile/schema';

interface NewProfileFormProps {
  initialName?: string;
  initialAvatar?: string;
  submitLabel?: string;
  onSubmit: (name: string, avatar: string) => Promise<unknown> | void;
  onCancel?: () => void;
}

export function NewProfileForm({
  initialName = '',
  initialAvatar = PROFILE_AVATARS[0],
  submitLabel,
  onSubmit,
  onCancel,
}: NewProfileFormProps) {
  const t = useTranslations('profile');
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(name.trim(), avatar);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{t('nameLabel')}</span>
          <input
            autoFocus
            value={name}
            maxLength={PROFILE_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-fg outline-none focus:border-accent"
          />
        </label>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">{t('avatarLabel')}</legend>
          <div className="flex flex-wrap gap-2">
            {PROFILE_AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={avatar === a}
                onClick={() => setAvatar(a)}
                className={cn(
                  'size-11 rounded-xl border text-2xl transition-transform hover:scale-110',
                  avatar === a ? 'border-accent bg-surface-2' : 'border-border',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              {t('cancel')}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={!name.trim() || busy}>
            {submitLabel ?? t('create')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
