'use client';

import { useTranslations } from 'use-intl';
import { useToasts, type ToastData } from '@/services/progress/toasts';

/** XP, level-up and achievement notifications (bottom left, above content). */
export function Toaster() {
  const t = useTranslations('progress');
  const ta = useTranslations('achievements');
  const tDyn = ta as unknown as (key: string) => string;
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  const render = (d: ToastData) => {
    if (d.kind === 'xp')
      return (
        <span className="font-display font-bold text-accent">
          ✨ {t('xpGain', { amount: d.amount })}
        </span>
      );
    if (d.kind === 'level')
      return <span className="font-display font-bold">{t('levelUp', { level: d.level })}</span>;
    return (
      <span className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {d.icon}
        </span>
        <span>
          <span className="block text-xs font-bold text-accent uppercase">
            {t('achievementUnlocked')}
          </span>
          <span className="block font-semibold">{tDyn(`${d.id}.name`)}</span>
        </span>
      </span>
    );
  };

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-6rem)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className="mc-toast pointer-events-auto rounded-xl border border-border bg-surface px-4 py-2 text-left text-sm shadow-card"
        >
          {render(toast.data)}
        </button>
      ))}
    </div>
  );
}
