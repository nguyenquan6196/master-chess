import catalogJson from '../../../content/learn/catalog.json';
import { CatalogSchema } from '@/core/learn/catalog';
import type { Profile } from '@/core/profile/schema';
import { profileRepo } from '../db/repositories';
import { recordProgress } from '../progress/progress';
import { useSession } from '../profile/session';

/** Lesson catalog, validated once (also covered by unit tests). */
export const CATALOG = CatalogSchema.parse(catalogJson);

/** Marks a lesson as completed, keeping the best quiz score. */
export async function completeLesson(
  profile: Profile,
  lessonId: string,
  score: number,
): Promise<void> {
  const prev = profile.lessons[lessonId];
  const lessons = {
    ...profile.lessons,
    [lessonId]: {
      completedAt: prev?.completedAt ?? Date.now(),
      score: Math.max(score, prev?.score ?? 0),
    },
  };
  await profileRepo.update(profile.id, { lessons });
  useSession.getState().setProfile({ ...profile, lessons });
  await recordProgress(profile.id, { kind: 'lesson', score, firstTime: !prev });
}
