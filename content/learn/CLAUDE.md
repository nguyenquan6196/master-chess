# content/learn — lesson writing guide

- Catalog: `catalog.json` (chapters → lessons: id, emoji, minutes, `requires`, localized `title`/`summary`, end-of-lesson `quiz` ids from `content/quiz/questions.json`, optional `practiceTheme`).
- Body: `<locale>/<id>.mdx` for **vi, en, ja** — same structure, boards and exercises in every language.
- Validation: `npx vitest run src/core/learn` checks the catalog, that every file exists, and every board / move sequence / exercise in the MDX.

## Structure of a lesson (3–6 minutes)
1. One or two sentences of introduction (no `#` title — the page shows it).
2. 2–3 `##` sections, each: short explanation → a board or move sequence → an exercise.
3. 1–3 `Callout`s (tip / warning / rule / fun). Do not overuse them.
4. End naturally; the quiz from the catalog is appended automatically.

## Components (no imports needed)
```mdx
<Board fen="…" show="d4" squares="e4 d5" arrows="e2e4 g1f3" orientation="black">Caption.</Board>
<MoveSequence fen="…" moves="e4 e5 Nf3">Caption.</MoveSequence>
<Callout type="tip|warning|rule|fun">Text with **bold**.</Callout>
<Exercise kind="make-move" fen="…" answers="e1g1 e1c1" mate explain="Why it works.">Prompt.</Exercise>
<Exercise kind="select-squares" fen="…" square="c3" explain="…">Prompt.</Exercise>
```
- `fen` defaults to the start position. Diagrams may omit kings; **exercises need a fully legal position** (both kings, side to move correct, castling/en passant fields right).
- `MoveSequence` uses SAN (`Nf3`, `O-O`, `e8=Q`, `Qxf7#`); `answers` use UCI (`g1f3`, `e1g1`, `a7a8q`).
- `mate` accepts any checkmating move. For "only move" exercises, make sure no other legal move should also count.
- Attributes must be plain strings in double quotes; avoid `{`, `}` and `<` in text.

## Style
Follow `docs/GLOSSARY.md`: vi uses "bạn", friendly and short; capitalize piece names (Mã, Hậu…). en: second person, friendly. ja: です/ます, katakana piece names. Teach by showing the board first, then explaining. Never blame the reader.
