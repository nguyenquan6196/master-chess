'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';

const SECTIONS = [
  { href: '/learn', title: 'nav.learn', desc: 'home.learnDesc', icon: '📖' },
  { href: '/practice', title: 'nav.practice', desc: 'home.practiceDesc', icon: '🧩' },
  { href: '/play', title: 'nav.play', desc: 'home.playDesc', icon: '♟️' },
] as const;

export function HomeScreen() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-8">
      <section className="py-6 text-center sm:py-10">
        <p className="mb-2 text-5xl" aria-hidden>
          ♔ ♞ ♛
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-5xl">{t('home.title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t('home.subtitle')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full transition-transform group-hover:-translate-y-1 group-focus-visible:outline-2 group-focus-visible:outline-accent">
              <p className="text-3xl" aria-hidden>
                {s.icon}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">{t(s.title)}</h2>
              <p className="mt-1 text-sm text-muted">{t(s.desc)}</p>
              <p className="mt-4 text-sm font-semibold text-accent">{t('home.start')} →</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
