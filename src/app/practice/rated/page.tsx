import type { Metadata } from 'next';
import { RatedPuzzles } from '@/features/puzzles/RatedPuzzles';

export const metadata: Metadata = { title: 'Rated puzzles' };

export default function RatedPuzzlesPage() {
  return <RatedPuzzles />;
}
