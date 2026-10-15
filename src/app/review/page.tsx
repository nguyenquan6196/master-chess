import type { Metadata } from 'next';
import { GameReview } from '@/features/review/GameReview';

export const metadata: Metadata = { title: 'Review' };

/** The game id comes from the URL hash: /review#<gameId>. */
export default function ReviewPage() {
  return <GameReview />;
}
