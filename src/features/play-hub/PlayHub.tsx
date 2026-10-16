'use client';

import { useTranslations } from 'use-intl';
import { MenuTile } from '@/components/ui/MenuTile';
import { PageHeader } from '@/components/ui/PageHeader';

export function PlayHub() {
  const t = useTranslations();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader title={t('play.title')} />
      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <MenuTile
            href="/play/bot"
            icon="🤖"
            title={t('play.botTitle')}
            desc={t('play.botDesc')}
            primary
          />
        </li>
        <li>
          <MenuTile
            href="/play/local"
            icon="👥"
            title={t('play.localTitle')}
            desc={t('play.localDesc')}
          />
        </li>
      </ul>
    </div>
  );
}
