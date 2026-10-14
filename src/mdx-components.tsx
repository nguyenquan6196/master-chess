import type { MDXComponents } from 'mdx/types';
import { Callout } from '@/features/learn/mdx/Callout';
import { Exercise } from '@/features/learn/mdx/Exercise';
import { LessonBoard } from '@/features/learn/mdx/LessonBoard';
import { MoveSequence } from '@/features/learn/mdx/MoveSequence';

/** Components available in every lesson MDX file without importing them. */
const components: MDXComponents = {
  Board: LessonBoard,
  MoveSequence,
  Callout,
  Exercise,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
