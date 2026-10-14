import type { Metadata } from 'next';
import { LearnHub } from '@/features/learn/LearnHub';

export const metadata: Metadata = { title: 'Learn' };

export default function LearnPage() {
  return <LearnHub />;
}
