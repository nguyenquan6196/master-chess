---
name: add-lesson
description: Add or edit a Master Chess lesson (MDX in vi/en/ja with interactive boards, move sequences and exercises, plus catalog entry and end-of-lesson quiz), validated by tests. Use when asked to write a new lesson, a new chapter, or translate/fix lesson content.
---

# Add a lesson

Read `content/learn/CLAUDE.md` first (components, rules, style). Reference lessons: `content/learn/vi/castling.mdx`, `tactics.mdx`.

## 1. Catalog entry — `content/learn/catalog.json`
Add the lesson to the right chapter (or a new chapter `{ id, emoji, title: {vi,en,ja}, lessons: [] }`):
```json
{
  "id": "smothered-mate",
  "emoji": "🐴",
  "minutes": 5,
  "requires": ["mates"],
  "title": { "vi": "…", "en": "…", "ja": "…" },
  "summary": { "vi": "…", "en": "…", "ja": "…" },
  "quiz": ["existing-quiz-id"],
  "practiceTheme": "smotheredMate"
}
```
- `requires` must point to lessons earlier in the catalog (usually the previous one) — lessons unlock in order.
- `quiz`: 2–4 ids from `content/quiz/questions.json`. Missing questions? Add them first with the `add-quiz` skill.
- `practiceTheme`: a key from `TRAINING_THEMES` in `src/core/puzzle/types.ts` (adds a "practice more" button).

## 2. Write the Vietnamese lesson — `content/learn/vi/<id>.mdx`
Design every position **before** writing text. For each exercise, check by reasoning (and then by the test) that:
- the FEN is legal (both kings, correct side to move, not already mate/stalemate unless intended);
- the answer is legal and is the only reasonable answer (or list alternatives in `answers`, or use `mate`).

## 3. Translate — `content/learn/en/<id>.mdx`, `content/learn/ja/<id>.mdx`
Same sections, same boards/exercises (identical `fen`, `answers`, `square`), translated prompts/explanations/captions. Terms from `docs/GLOSSARY.md`.

## 4. Validate
```
npx vitest run src/core/learn
npm run check
```
Then open `/learn/<id>` (the lesson must be unlocked — complete the prerequisite or temporarily test via the E2E flow) on desktop and mobile; try every exercise, including a wrong answer and "try again". If `next.config.ts` changed, restart the dev server.

## 5. Wrap up
Update the lesson count in `e2e/learn.spec.ts` if it asserts totals (`0/18 bài`), tick `docs/PLAN.md`, commit `feat(learn): …`.
