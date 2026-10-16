'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { summarizeResults } from '@/core/profile/stats';
import { gameRepo, profileRepo } from '@/services/db/repositories';
import { selectProfile, switchProfile } from '@/services/profile/actions';
import { exportProfile } from '@/services/profile/saveTransfer';
import { useSession } from '@/services/profile/session';
import { ImportSaveButton } from './ImportSaveButton';
import { NewProfileForm } from './NewProfileForm';
import { ProgressCard } from './ProgressCard';
import { RankCard } from './RankCard';

export function ProfileScreen() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const profile = useSession((s) => s.profile);
  const games = useLiveQuery(
    () => (profile ? gameRepo.listByProfile(profile.id) : Promise.resolve([])),
    [profile?.id],
  );
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!profile) return null;
  const stats = summarizeResults(games ?? []);

  async function rename(name: string, avatar: string) {
    if (!profile) return;
    await profileRepo.rename(profile.id, name, avatar);
    useSession.getState().setProfile({ ...profile, name, avatar });
    setEditing(false);
  }

  async function remove() {
    if (!profile) return;
    await profileRepo.remove(profile.id);
    setConfirmDelete(false);
    switchProfile();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {editing ? (
            <NewProfileForm
              initialName={profile.name}
              initialAvatar={profile.avatar}
              submitLabel={t('save')}
              onSubmit={rename}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <Card className="flex items-center gap-4">
              <span className="text-6xl" aria-hidden>
                {profile.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-2xl font-bold">{profile.name}</p>
              </div>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                ✏️ {t('edit')}
              </Button>
            </Card>
          )}

          <RankCard profile={profile} />

          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold">📊 {t('stats')}</h2>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {(['played', 'win', 'loss', 'draw'] as const).map((k) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted">{t(k)}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">{stats[k]}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/history"
              className="mt-4 inline-block text-sm font-semibold text-accent underline"
            >
              {t('viewHistory')} →
            </Link>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">💾 {t('data')}</h2>
            <p className="mt-1 text-sm text-muted">{t('dataDesc')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void exportProfile(profile.id)}>📤 {t('export')}</Button>
              <ImportSaveButton
                label={t('import')}
                variant="secondary"
                onImported={(p) => void selectProfile(p)}
              />
            </div>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            <Button onClick={switchProfile}>🔄 {t('switch')}</Button>
            <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>
              🗑️ {t('delete')}
            </Button>
          </div>
        </div>
        <ProgressCard profile={profile} />
      </div>

      <Modal
        open={confirmDelete}
        title={t('delete')}
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="primary" onClick={() => void remove()}>
              {t('delete')}
            </Button>
          </>
        }
      >
        {t('deleteConfirm', { name: profile.name })}
      </Modal>
    </div>
  );
}
