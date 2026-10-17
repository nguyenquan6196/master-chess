'use client';

import { createContext, useContext } from 'react';
import type { BoardView, ConcretePieceSet, MoveAnimation } from '@/core/profile/settingsOptions';
import type { Board3DLabels } from '../board3d/Board3D';
import type { SurfaceKind } from '../board3d/textures';

/** Player preferences every board follows (provided once by the app shell). */
export interface BoardPrefs {
  /** Already resolved ("theme" → the theme's set). */
  pieceSet: ConcretePieceSet;
  moveAnimation: MoveAnimation;
  /** 3D board surface (wood grain, marble…) of the current theme / board preset. */
  boardSurface: SurfaceKind;
  /** 2D or 3D; only boards with `allow3d` honour "3d". */
  view: BoardView;
  /** Switches the view (the quick 2D/3D toggle on game boards); absent = no toggle. */
  onViewChange?: (view: BoardView) => void;
  labels3d: Board3DLabels & {
    to3d: string;
    /** Shown when 3D switched itself off because it ran too slowly. */
    slow: string;
  };
}

export const MOVE_ANIMATION_MS: Record<MoveAnimation, number> = { normal: 180, fast: 90, off: 0 };

const BoardPrefsContext = createContext<BoardPrefs>({
  pieceSet: 'classic',
  moveAnimation: 'normal',
  view: '2d',
  boardSurface: 'plain',
  labels3d: { camera: { angle: '', top: '', low: '' }, to2d: '2D', to3d: '3D', slow: '' },
});

export const BoardPrefsProvider = BoardPrefsContext.Provider;
export const useBoardPrefs = () => useContext(BoardPrefsContext);
