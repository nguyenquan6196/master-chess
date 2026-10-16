import type { Metadata } from 'next';
import { GuideScreen } from '@/features/guide/GuideScreen';

export const metadata: Metadata = { title: 'Guide' };

export default function GuidePage() {
  return <GuideScreen />;
}
