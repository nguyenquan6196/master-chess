import { useId, type ReactNode } from 'react';
import type { RankId } from '@/core/rating/rank';
import { stauntonShape } from '../board/pieceArt/wood';
import type { PieceKind } from '../board/pieceShapes';
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
    rim: '#5c3a00',
    metal: ['#fff7cc', '#d49a1c'],
    face: ['#fff3b8', '#d99e1c'],
    engrave: '#fff8d8',
    piece: '#6b4300',
    pieceEdge: '#fff6cf',
    accent: '#ffe27a',
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
/**
 * Challenger dragon wings, two pairs: a big upper wing (arm bone, three finger struts,
 * membrane sagging between them, a pointed tip) and a smaller lower wing.
 */
const DRAGON_WING = {
  upper: {
    membrane: 'M26,-30 L52,-62 L88,-78 Q76,-60 94,-46 Q72,-40 86,-18 Q64,-22 68,0 Q50,-12 32,-6 Z',
    inner: 'M28,-28 L52,-60 L84,-74 Q66,-56 72,-40 Q56,-36 52,-22 Q42,-20 32,-12 Z',
    arm: 'M26,-30 L52,-62 L88,-78',
    elbow: [52, -62] as const,
    fingers: [
      [94, -46],
      [86, -18],
      [68, 0],
    ] as const,
  },
  lower: {
    membrane: 'M30,-4 L52,6 L82,2 Q68,14 78,28 Q60,24 62,40 Q46,28 32,16 Z',
    inner: 'M31,-2 L52,7 L76,5 Q62,14 64,26 Q50,22 34,12 Z',
    arm: 'M30,-4 L52,6 L82,2',
    elbow: [52, 6] as const,
    fingers: [
      [78, 28],
      [62, 40],
    ] as const,
  },
};
const CROWN = 'M-18,-46 L-20,-62 L-9,-54 L0,-70 L9,-54 L20,-62 L18,-46 Z';

/**
 * Light running around the rim of the top three ranks: the higher the rank, the more
 * bands, the faster and the brighter (with a glow). Replaces the old spinning rays.
 */
const ORBIT: Record<
  number,
  { glow: string; dash: string; width: number; seconds: number; blur: number }
> = {
  5: { glow: '#c48cff', dash: '30 270', width: 2.6, seconds: 4.5, blur: 2.2 },
  6: { glow: '#ffa53a', dash: '38 112', width: 3.2, seconds: 3.2, blur: 3 },
  7: { glow: '#ffd84a', dash: '42 58', width: 3.8, seconds: 2.4, blur: 3.8 },
};
/** Twinkling four-point stars around the badge (grandmaster: 2, challenger: 6). */
const SPARKLES: [number, number, number][] = [
  [-50, -40, 1],
  [52, -26, 0.8],
  [-46, 36, 0.7],
  [48, 42, 0.9],
  [-26, -74, 0.6],
  [30, -70, 0.7],
];
const STAR4 = 'M0,-6 L1.4,-1.4 L6,0 L1.4,1.4 L0,6 L-1.4,1.4 L-6,0 L-1.4,-1.4 Z';

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
        {lv >= 7 ? (
          <>
            {/* Challenger: banded, iridescent gold. */}
            <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fffbe0" />
              <stop offset="0.22" stopColor="#f5c542" />
              <stop offset="0.42" stopColor="#fff3b0" />
              <stop offset="0.62" stopColor="#c98d14" />
              <stop offset="0.8" stopColor="#ffe680" />
              <stop offset="1" stopColor="#7a4e00" />
            </linearGradient>
            <radialGradient id={id('face')} cx="0.38" cy="0.3" r="0.85">
              <stop offset="0" stopColor="#fffbe6" />
              <stop offset="0.35" stopColor="#f7cf55" />
              <stop offset="0.75" stopColor="#d4961a" />
              <stop offset="1" stopColor="#8f5a04" />
            </radialGradient>
            <linearGradient id={id('wingDeep')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe48a" />
              <stop offset="0.5" stopColor="#d99a1c" />
              <stop offset="1" stopColor="#8a5600" />
            </linearGradient>
          </>
        ) : (
          <>
            <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={p.metal[0]} />
              <stop offset="0.55" stopColor={p.metal[1]} />
              <stop offset="1" stopColor={p.rim} />
            </linearGradient>
            <linearGradient id={id('face')} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor={p.face[0]} />
              <stop offset="1" stopColor={p.face[1]} />
            </linearGradient>
          </>
        )}
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
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={ORBIT[lv]?.blur ?? 2} />
        </filter>
        <clipPath id={id('pieceClip')}>{stauntonShape(RANK_PIECE[rank])}</clipPath>
        <clipPath id={id('clip')}>
          <path d={SHIELD} transform="scale(0.86)" />
        </clipPath>
      </defs>

      {/* Breathing halo: warm for grandmaster, bright gold for challenger. */}
      {lv >= 6 && (
        <circle
          className="mc-emblem-halo"
          r={lv >= 7 ? 82 : 66}
          fill={url('halo')}
          opacity={lv >= 7 ? 1 : 0.55}
        />
      )}

      {/* Wings: feathers (gold, platinum), two pairs of gold dragon wings (challenger), crystal (diamond, elite), phoenix (grandmaster). */}
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
        <g transform="scale(0.88)">
          <Wings flap>
            {() =>
              [DRAGON_WING.lower, DRAGON_WING.upper].map((w, i) => (
                <g key={i} strokeLinecap="round" strokeLinejoin="round">
                  <path d={w.membrane} fill={url('wingDeep')} stroke="#6b4300" strokeWidth="1.2" />
                  <path d={w.inner} fill={url('gold')} opacity="0.75" />
                  <g stroke="#6b4300" strokeWidth="1.6">
                    {w.fingers.map(([x, y]) => (
                      <line key={x} x1={w.elbow[0]} y1={w.elbow[1]} x2={x} y2={y} />
                    ))}
                  </g>
                  <path d={w.arm} fill="none" stroke="#5c3a00" strokeWidth="3" />
                  <path d={w.arm} fill="none" stroke="#ffe9a0" strokeWidth="1" opacity="0.8" />
                  <circle cx={w.elbow[0]} cy={w.elbow[1]} r="2.6" fill="#fff1b8" stroke="#5c3a00" />
                </g>
              ))
            }
          </Wings>
        </g>
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

      {/* Breathing aura hugging the shield (grandmaster warm, challenger gold). */}
      {animated && lv >= 6 && (
        <path
          className="mc-emblem-aura"
          d={SHIELD}
          fill="none"
          stroke={ORBIT[lv].glow}
          strokeWidth={lv >= 7 ? 7 : 5}
          transform="scale(1.03)"
          filter={url('glow')}
        />
      )}

      {/* Light bands running round the rim (elite and up; only when animated):
          a coloured glow under a white-hot core. */}
      {animated &&
        ORBIT[lv] &&
        [
          { stroke: ORBIT[lv].glow, width: ORBIT[lv].width * 3, filter: url('glow') },
          { stroke: ORBIT[lv].glow, width: ORBIT[lv].width * 1.6, filter: undefined },
          { stroke: '#fffdf2', width: ORBIT[lv].width * 0.7, filter: undefined },
        ].map((band, i) => (
          <path
            key={i}
            className="mc-emblem-orbit"
            d={SHIELD}
            fill="none"
            pathLength={300}
            stroke={band.stroke}
            strokeWidth={band.width}
            strokeLinecap="round"
            strokeDasharray={ORBIT[lv].dash}
            transform="scale(0.96)"
            filter={band.filter}
            style={{ animationDuration: `${ORBIT[lv].seconds}s` }}
          />
        ))}

      {/* Light sweep: soft and slow for bronze/silver, brighter from gold up. */}
      {
        <g clipPath={url('clip')}>
          <g
            className={cn(
              'mc-emblem-shine',
              lv < 2 && 'mc-emblem-shine--soft',
              lv >= 7 && 'mc-emblem-shine--fast',
            )}
          >
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

      {/* Centre piece: a flat Staunton silhouette in the rank's colours (SVG, so it
          looks the same on every device), with a light edge and a soft highlight. */}
      <g transform="translate(0,3) scale(1.02)" strokeLinejoin="round" strokeLinecap="round">
        <g fill="none" stroke={p.pieceEdge} strokeWidth="3.2">
          {stauntonShape(RANK_PIECE[rank])}
        </g>
        <g fill={p.piece}>{stauntonShape(RANK_PIECE[rank])}</g>
        <rect
          x="-6"
          y="-30"
          width="3"
          height="48"
          fill="#fff"
          opacity="0.18"
          clipPath={url('pieceClip')}
        />
        {RANK_PIECE[rank] === 'n' && <circle cx="-2" cy="-14" r="1.5" fill={p.pieceEdge} />}
        {RANK_PIECE[rank] === 'b' && (
          <line x1="1.5" y1="-18" x2="5" y2="-12.5" stroke={p.pieceEdge} strokeWidth="1.8" />
        )}
      </g>

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

      {/* Twinkling stars around the top two ranks. */}
      {animated &&
        lv >= 6 &&
        SPARKLES.slice(0, lv >= 7 ? 6 : 2).map(([x, y, k], i) => (
          <path
            key={i}
            className="mc-emblem-twinkle"
            d={STAR4}
            transform={`translate(${x} ${y}) scale(${k * (lv >= 7 ? 1.2 : 1)})`}
            fill={lv >= 7 ? '#fff4b8' : '#ffd08a'}
            style={{ animationDelay: `${i * 0.37}s` }}
          />
        ))}
    </svg>
  );
}
