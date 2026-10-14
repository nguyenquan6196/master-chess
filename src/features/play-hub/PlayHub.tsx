'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';

export function PlayHub() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">{t('play.title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/play/bot" className="group">
          <Card className="h-full transition-transform group-hover:-translate-y-1">
            <p className="text-3xl" aria-hidden>
              🤖
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">{t('play.botTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('play.botDesc')}</p>
            <p className="mt-4 text-sm font-semibold text-accent">{t('home.start')} →</p>
          </Card>
        </Link>

        <Link href="/play/local" className="group">
          <Card className="h-full transition-transform group-hover:-translate-y-1">
            <p className="text-3xl" aria-hidden>
              👥
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">{t('play.localTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('play.localDesc')}</p>
            <p className="mt-4 text-sm font-semibold text-accent">{t('home.start')} →</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
