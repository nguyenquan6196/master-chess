import type { Metadata } from 'next';
import { ThemeTraining } from '@/features/puzzles/ThemeTraining';

export const metadata: Metadata = { title: 'Theme training' };

export default function ThemeTrainingPage() {
  return <ThemeTraining />;
}
