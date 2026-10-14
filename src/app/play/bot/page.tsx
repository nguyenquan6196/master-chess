import type { Metadata } from 'next';
import { BotGameScreen } from '@/features/bot-game/BotGameScreen';

export const metadata: Metadata = { title: 'Play vs Bot' };

export default function BotGamePage() {
  return <BotGameScreen />;
}
