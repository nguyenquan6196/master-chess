import vi from '../../../messages/vi.json';
import type { Locale } from './config';

export type Messages = typeof vi;

/** Vietnamese is bundled (default); other languages load on demand. */
export const DEFAULT_MESSAGES: Messages = vi;

const loaders: Record<Exclude<Locale, 'vi'>, () => Promise<Messages>> = {
  en: () => import('../../../messages/en.json').then((m) => m.default),
  ja: () => import('../../../messages/ja.json').then((m) => m.default),
};

const cache = new Map<Locale, Messages>([['vi', vi]]);

export async function loadMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const messages = await loaders[locale as Exclude<Locale, 'vi'>]();
  cache.set(locale, messages);
  return messages;
}
