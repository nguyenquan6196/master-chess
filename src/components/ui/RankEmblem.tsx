import { useId, type ReactNode } from 'react';
import type { RankId } from '@/core/rating/rank';
import { GLYPH_FONT, PIECE_GLYPHS, type PieceKind } from '../board/pieceShapes';
import { cn } from './cn';

/**
 * Rank emblems (spec §6.7, approved draft: docs/design/rank-emblems-draft.svg).
 * Layered SVG shields with metallic gradients; the higher the rank, the more layers
 * (wings, gems, crown, flames, laurel, rays). Colours are fixed artwork, like flags.
 * Animations live in globals.css (`.mc-emblem-*`) and stop under reduced motion.
 */

interface Palette {
  /** Outer rim, metal light → dark, inner face light → dark. */
  rim: string;
  metal: [string, string];
  face: [string, string];
  engrave: string;
  piece: string;
  pieceEdge: string;
  accent?: string;
}

const PALETTES: Record<RankId, Palette> = {
  bronze: {
    rim: '#5e3518',
    metal: ['#d08a52', '#8a5228'],
    face: ['#e9b07c', '#b07444'],
    engrave: '#f3c79b',
    piece: '#3d2412',
    pieceEdge: '#f0c08e',
  },
  silver: {
    rim: '#4b535c',
    metal: ['#e8edf2', '#8d97a3'],
    face: ['#f4f7fa', '#b9c2cc'],
    engrave: '#7d8793',
    piece: '#323941',
    pieceEdge: '#ffffff',
  },
  gold: {
    rim: '#6e4a0c',
    metal: ['#ffe28a', '#c08a20'],
    face: ['#fff1bf', '#e2b245'],
    engrave: '#a87414',
    piece: '#5a3c06',
    pieceEdge: '#fff6d6',
    accent: '#f3d27a',
  },
  platinum: {
    rim: '#1c4e4b',
    metal: ['#b8f2ea', '#3f9a93'],
    face: ['#e6fffb', '#6cc3bc'],
    engrave: '#2f7f79',
    piece: '#123f3c',
    pieceEdge: '#e8fffb',
    accent: '#9fe0d8',
  },
  diamond: {
    rim: '#142f66',
    metal: ['#a9cbff', '#2f5fb3'],
    face: ['#e6f0ff', '#6f9fe8'],
    engrave: '#2a55a8',
    piece: '#102753',
    pieceEdge: '#eaf3ff',
    accent: '#9cc3ff',
  },
  elite: {
    rim: '#2c1157',
    metal: ['#d6bcff', '#6a35c4'],
    face: ['#f1e8ff', '#9a72e4'],
    engrave: '#5a2ba3',
    piece: '#25104d',
    pieceEdge: '#f3ebff',
    accent: '#c6a3ff',
  },
  grandmaster: {
    rim: '#4d0c0c',
    metal: ['#ff8a7a', '#a82424'],
    face: ['#ffe4d8', '#e07a62'],
    engrave: '#f0c94a',
    piece: '#4a0a0a',
    pieceEdge: '#ffe9a8',
    accent: '#ffa040',
  },
  challenger: {
    rim: '#0f1738',
    metal: ['#fff0a8', '#c9951c'],
    face: ['#2e3b80', '#1a2550'],
    engrave: '#f7e08a',
    piece: '#ffd84a',
    pieceEdge: '#7a5a10',
    accent: '#f0c94a',
  },
};

const RANK_PIECE: Record<RankId, PieceKind> = {
  bronze: 'p',
  silver: 'n',
  gold: 'b',
  platinum: 'r',
  diamond: 'q',
  elite: 'k',
  grandmaster: 'k',
  challenger: 'k',
};

const SHIELD = 'M0,-48 L36,-38 C38,8 22,34 0,50 C-22,34 -38,8 -36,-38 Z';
const WING =
  'M30,-30 C50,-42 64,-30 66,-12 C58,-17 51,-15 47,-9 C55,-6 60,2 58,10 C50,3 43,3 36,7 Z';
const CRYSTAL_WING = '32,-28 68,-44 60,-20 74,-10 54,-4 62,12 36,4';
const PHOENIX =
  'M28,-24 C56,-58 74,-48 74,-22 C68,-30 62,-28 58,-22 C68,-18 72,-8 70,4 C62,-4 54,-4 48,0 C56,4 58,14 54,22 C46,12 38,10 32,12 Z';
const CROWN = 'M-18,-46 L-20,-62 L-9,-54 L0,-70 L9,-54 L20,-62 L18,-46 Z';

const level = (rank: RankId) =>
  ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite', 'grandmaster', 'challenger'].indexOf(
    rank,
  );

/** Mirrored pair of wing shapes; `flap` animates them (diamond and above). */
function Wings({ children, flap = false }: { children: () => ReactNode; flap?: boolean }) {
  const cls = flap ? 'mc-emblem-wing' : undefined;
  return (
    <g>
      <g className={cls}>{children()}</g>
      <g transform="scale(-1,1)">
        <g className={cls}>{children()}</g>
      </g>
    </g>
  );
}

/**
 * One square frame for every rank, centred on the shield, so the shield itself has the
 * same size and position at every rank; higher ranks' ornaments (wings, crown, rays) fill
 * the margin around it and may spill slightly past the edge (the svg is overflow-visible).
 */
const FRAME_HALF = 74;
const FRAME_CY = -4;
const FRAME = `${-FRAME_HALF} ${FRAME_CY - FRAME_HALF} ${FRAME_HALF * 2} ${FRAME_HALF * 2}`;

export function RankEmblem({
  rank,
  size = 64,
  animated = true,
  title,
  className,
}: {
  rank: RankId;
  size?: number;
  animated?: boolean;
  title?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const p = PALETTES[rank];
  const lv = level(rank);
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox={FRAME}
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={cn('shrink-0 overflow-visible', animated && 'mc-emblem-animated', className)}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.metal[0]} />
          <stop offset="0.55" stopColor={p.metal[1]} />
          <stop offset="1" stopColor={p.rim} />
        </linearGradient>
        <linearGradient id={id('face')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={p.face[0]} />
          <stop offset="1" stopColor={p.face[1]} />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2a6" />
          <stop offset="0.5" stopColor="#f0c94a" />
          <stop offset="1" stopColor="#a8770f" />
        </linearGradient>
        <linearGradient id={id('shine')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#ffe68a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffe68a" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('clip')}>
          <path d={SHIELD} transform="scale(0.86)" />
        </clipPath>
      </defs>

      {/* Challenger: breathing halo and rotating rays. */}
      {lv >= 7 && <circle className="mc-emblem-halo" r="78" fill={url('halo')} />}
      {lv >= 5 && (
        <g
          className="mc-emblem-rays"
          stroke={lv >= 7 ? '#f0c94a' : p.accent}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.75"
        >
          {Array.from({ length: lv >= 7 ? 12 : 8 }, (_, i) => {
            const a = (i / (lv >= 7 ? 12 : 8)) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={Math.sin(a) * 58}
                y1={-Math.cos(a) * 58 - 4}
                x2={Math.sin(a) * 76}
                y2={-Math.cos(a) * 76 - 4}
              />
            );
          })}
        </g>
      )}

      {/* Laurel (Challenger). */}
      {lv >= 7 && (
        <g fill="#3f8a3a" stroke="#2a5e27" strokeWidth="0.6">
          {[
            [34, 30, 50],
            [42, 16, 70],
            [46, 0, 85],
            [24, 40, 30],
          ].flatMap(([x, y, r]) => [
            <ellipse
              key={`l${x}`}
              cx={-x}
              cy={y}
              rx="9"
              ry="4"
              transform={`rotate(${-r} ${-x} ${y})`}
            />,
            <ellipse
              key={`r${x}`}
              cx={x}
              cy={y}
              rx="9"
              ry="4"
              transform={`rotate(${r} ${x} ${y})`}
            />,
          ])}
        </g>
      )}

      {/* Wings: feathers (gold, platinum, challenger), crystal (diamond, elite), phoenix (grandmaster). */}
      {(lv === 2 || lv === 3) && (
        <Wings>
          {() => (
            <>
              <path d={WING} fill={p.metal[1]} stroke={p.rim} strokeWidth="1" />
              <path d={WING} fill={p.accent} transform="scale(0.8) translate(6,-2)" />
            </>
          )}
        </Wings>
      )}
      {(lv === 4 || lv === 5) && (
        <Wings flap>
          {() => (
            <>
              <polygon points={CRYSTAL_WING} fill={p.metal[1]} stroke={p.rim} strokeWidth="1" />
              <polygon
                points={CRYSTAL_WING}
                fill={p.accent}
                opacity="0.9"
                transform="scale(0.78) translate(8,-2)"
              />
              <polygon points="40,-18 62,-34 56,-16" fill="#fff" opacity="0.45" />
            </>
          )}
        </Wings>
      )}
      {lv === 6 && (
        <Wings flap>
          {() => (
            <>
              <path d={PHOENIX} fill="#c2321f" stroke="#6e1414" strokeWidth="1" />
              <path
                d="M30,-20 C50,-44 64,-38 64,-22 C56,-24 50,-18 48,-12 C40,-12 36,-8 34,-4 Z"
                fill="#ffa040"
              />
            </>
          )}
        </Wings>
      )}
      {lv === 7 && (
        <Wings flap>
          {() => (
            <path
              d={WING}
              fill={url('gold')}
              stroke="#8a6410"
              strokeWidth="1"
              transform="translate(4,-6)"
            />
          )}
        </Wings>
      )}

      {/* Elite flames behind the shield. */}
      {lv === 5 && (
        <g className="mc-emblem-flames" fill="#c25cf0">
          <path d="M-26,-30 C-40,-50 -30,-66 -22,-74 C-20,-60 -12,-56 -10,-44 Z" />
          <path d="M26,-30 C40,-50 30,-66 22,-74 C20,-60 12,-56 10,-44 Z" />
        </g>
      )}

      {/* Shield: rim, metal band, face, engraved line, highlight. */}
      <path d={SHIELD} fill={p.rim} />
      <path d={SHIELD} fill={url('metal')} transform="scale(0.92)" />
      {lv >= 6 && (
        <path d={SHIELD} fill="none" stroke={url('gold')} strokeWidth="3" transform="scale(0.84)" />
      )}
      <path d={SHIELD} fill={url('face')} transform="scale(0.78)" />
      <path
        d={SHIELD}
        fill="none"
        stroke={p.engrave}
        strokeWidth="1.2"
        strokeDasharray={lv >= 1 ? undefined : '3 2'}
        transform="scale(0.66)"
      />
      <path
        d="M-26,-34 L-2,-40 C-12,-20 -20,0 -24,14 C-28,-2 -28,-18 -26,-34 Z"
        fill="#fff"
        opacity="0.18"
      />

      {/* Light sweep: soft and slow for bronze/silver, brighter from gold up. */}
      {
        <g clipPath={url('clip')}>
          <g className={cn('mc-emblem-shine', lv < 2 && 'mc-emblem-shine--soft')}>
            <rect
              x="-90"
              y="-60"
              width="40"
              height="120"
              fill={url('shine')}
              transform="skewX(-20)"
            />
          </g>
        </g>
      }

      {/* Centre piece: the chess character (same as the "glyph" piece set). */}
      <text
        x="0"
        y="20"
        textAnchor="middle"
        fontSize="50"
        fontFamily={GLYPH_FONT}
        fill={p.piece}
        stroke={p.pieceEdge}
        strokeWidth="1.6"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {PIECE_GLYPHS[RANK_PIECE[rank]]}
      </text>

      {/* Gems and crowns. */}
      {lv === 3 && (
        <polygon
          className="mc-emblem-gem"
          points="0,-60 7,-52 0,-44 -7,-52"
          fill="#e8fffb"
          stroke={p.rim}
          strokeWidth="1.5"
        />
      )}
      {lv === 4 && (
        <polygon
          className="mc-emblem-gem"
          points="0,-68 11,-55 0,-42 -11,-55"
          fill="#e6f0ff"
          stroke={p.rim}
          strokeWidth="1.5"
        />
      )}
      {lv >= 5 && (
        <>
          <path
            d={lv === 7 ? 'M-22,-46 L-24,-66 L-11,-56 L0,-76 L11,-56 L24,-66 L22,-46 Z' : CROWN}
            fill={url('gold')}
            stroke="#7a5a10"
            strokeWidth="1.2"
          />
          <circle
            className="mc-emblem-gem"
            cx="0"
            cy={lv === 7 ? -58 : -55}
            r="3.2"
            fill="#e0413a"
          />
          {lv === 7 && (
            <>
              <circle className="mc-emblem-gem" cx="-12" cy="-52" r="2.5" fill="#3a7be0" />
              <circle className="mc-emblem-gem" cx="12" cy="-52" r="2.5" fill="#3a7be0" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
