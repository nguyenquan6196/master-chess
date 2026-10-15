import viDialogue from '../../../content/bots/dialogue.vi.json';
import { DialogueSchema, type Dialogue } from '@/core/bot/dialogue';
import type { Locale } from '../i18n/config';

const loaders: Record<Locale, () => Promise<unknown>> = {
  vi: () => Promise.resolve(viDialogue),
  en: () => import('../../../content/bots/dialogue.en.json').then((m) => m.default),
  ja: () => import('../../../content/bots/dialogue.ja.json').then((m) => m.default),
};

const cache = new Map<Locale, Dialogue>();

/** Bot lines for a language (validated once, cached). */
export async function loadDialogue(locale: Locale): Promise<Dialogue> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const dialogue = DialogueSchema.parse(await loaders[locale]());
  cache.set(locale, dialogue);
  return dialogue;
}
