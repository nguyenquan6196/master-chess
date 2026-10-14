import type { Metadata } from 'next';
import { DailyPuzzle } from '@/features/puzzles/DailyPuzzle';

export const metadata: Metadata = { title: 'Daily puzzle' };

export default function DailyPuzzlePage() {
  return <DailyPuzzle />;
}
