'use client';

import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/** Loading / error / empty placeholder shared by the puzzle modes. */
export function PuzzleStatus({
  state,
  onRetry,
}: {
  state: 'loading' | 'error' | 'empty' | 'ready';
  onRetry?: () => void;
}) {
  const t = useTranslations('puzzle');
  if (state === 'loading' || state === 'ready') {
    return <p className="animate-pulse text-muted">{t('loading')}</p>;
  }
  return (
    <Card className="flex flex-col items-start gap-3">
      <p>{state === 'error' ? t('loadError') : t('noMore')}</p>
      {state === 'error' && onRetry && <Button onClick={onRetry}>{t('retry')}</Button>}
    </Card>
  );
}
