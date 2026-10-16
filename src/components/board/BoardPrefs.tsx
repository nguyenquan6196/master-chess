'use client';

import { createContext, useContext } from 'react';
import type { BoardView, ConcretePieceSet, MoveAnimation } from '@/core/profile/settingsOptions';
import type { Board3DLabels } from '../board3d/Board3D';

/** Player preferences every board follows (provided once by the app shell). */
export interface BoardPrefs {
  /** Already resolved ("theme" → the theme's set). */
  pieceSet: ConcretePieceSet;
  moveAnimation: MoveAnimation;
  /** 2D or 3D; only boards with `allow3d` honour "3d". */
  view: BoardView;
  /** Switches the view (the quick 2D/3D toggle on game boards); absent = no toggle. */
  onViewChange?: (view: BoardView) => void;
  labels3d: Board3DLabels & { to3d: string };
}

export const MOVE_ANIMATION_MS: Record<MoveAnimation, number> = { normal: 180, fast: 90, off: 0 };

const BoardPrefsContext = createContext<BoardPrefs>({
  pieceSet: 'classic',
  moveAnimation: 'normal',
  view: '2d',
  labels3d: { camera: { angle: '', top: '', low: '' }, to2d: '2D', to3d: '3D' },
});

export const BoardPrefsProvider = BoardPrefsContext.Provider;
export const useBoardPrefs = () => useContext(BoardPrefsContext);
