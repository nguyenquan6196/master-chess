import type { Metadata } from 'next';
import { ComingSoon } from '@/features/shell/ComingSoon';

export const metadata: Metadata = { title: 'Practice' };

export default function PracticePage() {
  return <ComingSoon section="practice" />;
}
