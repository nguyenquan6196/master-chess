import type { Metadata } from 'next';
import { ComingSoon } from '@/features/shell/ComingSoon';

export const metadata: Metadata = { title: 'Learn' };

export default function LearnPage() {
  return <ComingSoon section="learn" />;
}
