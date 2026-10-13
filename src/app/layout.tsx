import type { Metadata, Viewport } from 'next';
import { Baloo_2, Be_Vietnam_Pro, M_PLUS_Rounded_1c, Noto_Sans_JP } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppShell } from '@/features/shell/AppShell';
import { AppProviders } from '@/services/AppProviders';
import { DEFAULT_LOCALE } from '@/services/i18n/config';
import { THEME_BOOT_SCRIPT } from '@/services/theme/boot-script';
import './globals.css';

const beVietnam = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

// Japanese fonts are only downloaded when text actually uses them (lang="ja").
const notoJp = Noto_Sans_JP({
  variable: '--font-noto-jp',
  preload: false,
  display: 'swap',
});

const mplus = M_PLUS_Rounded_1c({
  variable: '--font-mplus',
  weight: ['400', '700'],
  preload: false,
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Master Chess', template: '%s · Master Chess' },
  description: 'Học, luyện tập và đấu cờ vua — Learn, practice and play chess.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      data-theme="classic"
      suppressHydrationWarning
      className={`${beVietnam.variable} ${baloo.variable} ${notoJp.variable} ${mplus.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
