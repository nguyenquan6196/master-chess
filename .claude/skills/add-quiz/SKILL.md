---
name: add-quiz
description: Add or edit Master Chess quiz questions (choice, select-squares, make-move) in all three languages, validated by tests; also how to rebuild the Lichess puzzle set. Use when asked to add quiz questions, a quiz topic, or refresh puzzles.
---

# Add quiz questions

Files:
- `content/quiz/questions.json` — language-independent structure (one entry per question).
- `content/quiz/vi.json`, `en.json`, `ja.json` — texts keyed by question id.
- Types/validation: `src/core/quiz/quiz.ts`. Tests that validate ALL content: `src/core/quiz/quiz.test.ts`.

## 1. Pick a kind

| kind | Fields | Answer |
|---|---|---|
| `choice` | `choices: string[]` (keys), `answer` (one key), optional `fen` to show a board | the key |
| `select-squares` | `fen`, `square` (the piece to study) | computed from the rules: every legal destination of that piece |
| `make-move` | `fen` (side to move = the player), `answers: string[]` (UCI, e.g. `e1g1`, `a7a8q`), optional `mate: true` | any listed move; with `mate`, any checkmating move |

Common fields: `id` (kebab-case, unique), `topic` (`pieces` · `rules` · `notation` · `strategy` · `tactics`), `level` (1 easy … 3 hard).

To add a new topic: add it to `QUIZ_TOPICS` in `src/core/quiz/quiz.ts` and `quizTopics.<topic>` in `messages/{vi,en,ja}.json`.

## 2. Write the structure
Append to `questions.json`. For positions, build the FEN carefully:
- Both kings must be on the board; the side to move must not be able to capture the enemy king.
- For `make-move`, double-check there is no unintended second solution (or list it in `answers`).
- For "escape check" style questions, make sure the position is not already checkmate.

## 3. Write the texts (3 languages)
In each `content/quiz/<locale>.json` add:
```json
"my-question-id": {
  "prompt": "…",
  "choices": { "key1": "…", "key2": "…" },
  "explanation": "One or two sentences: why the answer is right."
}
```
- `choices` only for `choice` questions, with exactly the same keys as `questions.json`.
- Tone and chess terms from `docs/GLOSSARY.md` (vi: friendly "bạn"; ja: です/ます). Piece names capitalized in Vietnamese (Mã, Hậu…).
- Explanations teach, never blame.

## 4. Validate
```
npx vitest run src/core/quiz
```
The tests check: unique ids, every locale has every question and matching choice keys, all FENs load, `select-squares` pieces exist and have moves, `make-move` answers are legal, `mate` answers really mate. Then `npm run check`.

Try it in the app: `/practice/quiz` → the topic → answer the new question (desktop + mobile).

---

# Rebuild the puzzle set (Lichess, CC0)

1. Download `https://database.lichess.org/lichess_db_puzzle.csv.zst` (~300 MB) to a scratch folder outside the repo (ask the user before downloading).
2. Decompress it — it uses zstd *seekable* frames that Node's zstd stream rejects. With Python 3.14+ (run isolated):
   ```
   python -I -c "import shutil,sys;from compression import zstd;shutil.copyfileobj(zstd.open(sys.argv[1]),open(sys.argv[2],'wb'))" in.csv.zst out.csv
   ```
3. `node scripts/build-puzzles.mjs <path/to/out.csv>` → rewrites `public/puzzles/` (rating buckets, themes, daily, index, CREDITS). Filters and limits are constants at the top of the script.
4. Commit only `public/puzzles/` (≈3 MB), never the CSV.
