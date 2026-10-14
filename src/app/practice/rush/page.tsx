import type { Metadata } from 'next';
import { PuzzleRush } from '@/features/puzzles/PuzzleRush';

export const metadata: Metadata = { title: 'Puzzle Rush' };

export default function PuzzleRushPage() {
  return <PuzzleRush />;
}
