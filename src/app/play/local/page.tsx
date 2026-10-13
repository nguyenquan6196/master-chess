import type { Metadata } from 'next';
import { LocalGame } from '@/features/local-game/LocalGame';

export const metadata: Metadata = { title: 'Local game' };

export default function LocalGamePage() {
  return <LocalGame />;
}
