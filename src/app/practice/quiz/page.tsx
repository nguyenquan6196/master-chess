import type { Metadata } from 'next';
import { QuizScreen } from '@/features/quiz/QuizScreen';

export const metadata: Metadata = { title: 'Quiz' };

export default function QuizPage() {
  return <QuizScreen />;
}
