import type { Metadata } from 'next';
import { PlayHub } from '@/features/play-hub/PlayHub';

export const metadata: Metadata = { title: 'Play' };

export default function PlayPage() {
  return <PlayHub />;
}
