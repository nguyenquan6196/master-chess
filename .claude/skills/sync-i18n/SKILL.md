---
name: sync-i18n
description: Fill missing or stale UI translations in Master Chess (messages/en.json, messages/ja.json from the Vietnamese source messages/vi.json) following the glossary, and keep content translations (quiz, bot dialogue, lessons) in sync. Use when check-i18n fails, after adding UI strings in Vietnamese only, or when asked to translate/review en/ja texts.
---

# Sync translations

`messages/vi.json` is the **source of truth**; `en.json` and `ja.json` must have exactly the same keys (types are generated from vi).

## 1. Find what is missing
```
npm run check-i18n
```
It lists `missing:` / `extra:` keys per locale. Extra keys are usually leftovers: delete them unless vi is the one missing a key.

## 2. Translate
For every missing key, translate the vi value:
- Chess terms and tone from `docs/GLOSSARY.md` (vi uses "bạn", ja uses です/ます; piece names: Hậu/Queen/クイーン …).
- Keep ICU placeholders exactly (`{count}`, `{bot}`, `{rank}` …) and plural/select syntax.
- Keep emojis and leading symbols (←, ⚔️) where the vi string has them.
- Keep it short: buttons and chips must fit on a 375px screen (Japanese is usually shorter, English often longer).
Edit the JSON with a script (python `json.load` / `json.dump(..., ensure_ascii=False, indent=2)`) rather than by hand for many keys; Prettier formats on commit.

## 3. Content outside messages
- Quiz: `content/quiz/{vi,en,ja}.json` — validated by `src/core/quiz/quiz.test.ts`.
- Bot dialogue: `content/bots/dialogue.{vi,en,ja}.json` — `src/core/bot/dialogue.test.ts`.
- Lessons: `content/learn/<locale>/<id>.mdx` — see the `add-lesson` skill.
- Achievement names live in messages (`achievements.<id>`) — `src/core/progress/progress.test.ts`.

## 4. Verify
```
npm run check
```
Then switch the language in the header and glance at the changed screens (desktop + mobile) for overflow.
