import type { Metadata } from 'next';
import { PracticeHub } from '@/features/practice-hub/PracticeHub';

export const metadata: Metadata = { title: 'Practice' };

export default function PracticePage() {
  return <PracticeHub />;
}
