'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';

type Section = 'learn' | 'practice';

const ICONS: Record<Section, string> = { learn: '📖', practice: '🧩' };

export function ComingSoon({ section }: { section: Section }) {
  const t = useTranslations();

  return (
    <Card className="mx-auto mt-8 max-w-md text-center">
      <p className="text-5xl" aria-hidden>
        {ICONS[section]}
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold">{t(`nav.${section}`)}</h1>
      <p className="mt-1 font-semibold text-accent">{t('common.comingSoon')}</p>
      <p className="mt-2 text-sm text-muted">{t('common.comingSoonDesc')}</p>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-accent underline">
        {t('common.backHome')}
      </Link>
    </Card>
  );
}
