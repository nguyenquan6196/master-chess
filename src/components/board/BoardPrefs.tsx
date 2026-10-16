'use client';

import { createContext, useContext } from 'react';
import type { ConcretePieceSet, MoveAnimation } from '@/core/profile/settingsOptions';

/** Player preferences every board follows (provided once by the app shell). */
export interface BoardPrefs {
  /** Already resolved ("theme" → the theme's set). */
  pieceSet: ConcretePieceSet;
  moveAnimation: MoveAnimation;
}

export const MOVE_ANIMATION_MS: Record<MoveAnimation, number> = { normal: 180, fast: 90, off: 0 };

const BoardPrefsContext = createContext<BoardPrefs>({
  pieceSet: 'classic',
  moveAnimation: 'normal',
});

export const BoardPrefsProvider = BoardPrefsContext.Provider;
export const useBoardPrefs = () => useContext(BoardPrefsContext);
