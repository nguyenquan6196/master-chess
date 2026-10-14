import questionsJson from '../../../content/quiz/questions.json';
import viTexts from '../../../content/quiz/vi.json';
import { QuizQuestionsSchema, QuizTextsSchema, type QuizText } from '@/core/quiz/quiz';
import type { Locale } from '../i18n/config';

/** Validated once at import (content is also checked by unit tests). */
export const QUIZ_QUESTIONS = QuizQuestionsSchema.parse(questionsJson);

const loaders: Record<Locale, () => Promise<unknown>> = {
  vi: () => Promise.resolve(viTexts),
  en: () => import('../../../content/quiz/en.json').then((m) => m.default),
  ja: () => import('../../../content/quiz/ja.json').then((m) => m.default),
};

const cache = new Map<Locale, Record<string, QuizText>>();

export async function loadQuizTexts(locale: Locale): Promise<Record<string, QuizText>> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const texts = QuizTextsSchema.parse(await loaders[locale]());
  cache.set(locale, texts);
  return texts;
}
