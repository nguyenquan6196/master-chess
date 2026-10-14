// Builds the app's puzzle set from the Lichess puzzle database (CC0).
//
//   node scripts/build-puzzles.mjs <path/to/lichess_db_puzzle.csv>
//
// Download: https://database.lichess.org/lichess_db_puzzle.csv.zst (~300 MB) and keep it out of
// the repo. The file uses zstd *seekable* frames that Node's zstd stream cannot read, so
// decompress it first (e.g. `zstd -d`, or Python 3.14+:
// `python -c "import shutil,sys;from compression import zstd;shutil.copyfileobj(zstd.open(sys.argv[1]),open(sys.argv[2],'wb'))" in.zst out.csv`). Output (committed): public/puzzles/{index.json, rating/<min>.json,
// theme/<theme>.json, daily.json} in the compact tuple format of src/core/puzzle/types.ts.
import { Chess } from 'chess.js';
import { createReadStream, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const OUT = 'public/puzzles';
const BUCKET = 200;
const MIN = 400;
const MAX = 2800;
const PER_BUCKET = 1000;
const PER_THEME_BUCKET = 40;
const DAILY_COUNT = 400;
const DAILY_RATING = [1000, 1800];

/** Quality filter: well-liked, well-tested, stable rating. */
const keep = (p) => p.popularity >= 90 && p.nbPlays >= 1000 && p.rd <= 90;

const TRAINING_THEMES = [
  'mateIn1',
  'mateIn2',
  'mateIn3',
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'doubleCheck',
  'hangingPiece',
  'trappedPiece',
  'sacrifice',
  'deflection',
  'attraction',
  'backRankMate',
  'smotheredMate',
  'promotion',
  'enPassant',
  'castling',
  'endgame',
  'rookEndgame',
  'pawnEndgame',
  'opening',
];

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/build-puzzles.mjs <lichess_db_puzzle.csv>');
  process.exit(1);
}

const bucketOf = (r) => Math.floor(Math.min(MAX - 1, Math.max(MIN, r)) / BUCKET) * BUCKET;

/** Replays the solution to make sure every move is legal. */
function valid(p) {
  try {
    const chess = new Chess(p.fen);
    for (const m of p.moves) {
      chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
    }
    return true;
  } catch {
    return false;
  }
}

const tuple = (p) => [p.id, p.fen, p.moves.join(' '), p.rating, p.rd, p.themes.join(' ')];

const byBucket = new Map();
const byTheme = new Map(TRAINING_THEMES.map((t) => [t, new Map()]));
const daily = [];
let total = 0;
let kept = 0;
let invalid = 0;

if (input.endsWith('.zst')) {
  console.error('Decompress the .zst file first (see the header of this script).');
  process.exit(1);
}
const stream = createReadStream(input);
stream.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
const lines = createInterface({ input: stream, crlfDelay: Infinity });

for await (const line of lines) {
  if (total++ === 0 && line.startsWith('PuzzleId')) continue;
  const [id, fen, moves, rating, rd, popularity, nbPlays, themes] = line.split(',');
  const p = {
    id,
    fen,
    moves: moves.split(' '),
    rating: Number(rating),
    rd: Number(rd),
    popularity: Number(popularity),
    nbPlays: Number(nbPlays),
    themes: themes ? themes.split(' ') : [],
  };
  if (!keep(p)) continue;

  const b = bucketOf(p.rating);
  const bucket = byBucket.get(b) ?? [];
  const themeSlots = p.themes.filter(
    (t) => byTheme.has(t) && (byTheme.get(t).get(b)?.length ?? 0) < PER_THEME_BUCKET,
  );
  const wantDaily =
    daily.length < DAILY_COUNT &&
    p.popularity >= 95 &&
    p.rating >= DAILY_RATING[0] &&
    p.rating <= DAILY_RATING[1];
  if (bucket.length >= PER_BUCKET && themeSlots.length === 0 && !wantDaily) continue;

  if (!valid(p)) {
    invalid++;
    continue;
  }
  kept++;
  if (bucket.length < PER_BUCKET) {
    bucket.push(p);
    byBucket.set(b, bucket);
  }
  for (const t of themeSlots) {
    const m = byTheme.get(t);
    m.set(b, [...(m.get(b) ?? []), p]);
  }
  if (wantDaily) daily.push(p);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/rating`, { recursive: true });
mkdirSync(`${OUT}/theme`, { recursive: true });

const write = (path, puzzles) =>
  writeFileSync(path, JSON.stringify(puzzles.sort((a, b) => a.rating - b.rating).map(tuple)));

const index = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'lichess.org (CC0)',
  rating: {},
  themes: {},
  daily: daily.length,
};
for (const [b, ps] of [...byBucket].sort((x, y) => x[0] - y[0])) {
  write(`${OUT}/rating/${b}.json`, ps);
  index.rating[b] = ps.length;
}
for (const [t, m] of byTheme) {
  const ps = [...m.values()].flat();
  if (ps.length === 0) continue;
  write(`${OUT}/theme/${t}.json`, ps);
  index.themes[t] = ps.length;
}
writeFileSync(`${OUT}/daily.json`, JSON.stringify(daily.map(tuple)));
writeFileSync(`${OUT}/index.json`, JSON.stringify(index, null, 2));
writeFileSync(
  `${OUT}/CREDITS.md`,
  `# Puzzle credits

Puzzles are a filtered subset of the [Lichess puzzle database](https://database.lichess.org/#puzzles),
released under **CC0** (public domain). Generated ${index.generatedAt} by \`scripts/build-puzzles.mjs\`
(popularity >= 90, plays >= 1000, rating deviation <= 90).
`,
);

console.log(`read ${total} rows, kept ${kept}, invalid ${invalid}`);
console.log(JSON.stringify(index, null, 2));
