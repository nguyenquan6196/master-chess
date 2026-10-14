---
name: new-feature
description: Scaffold and build a new Master Chess feature the project way — pure logic in src/core with tests, side effects in src/services, UI in src/features/<name>, route in src/app, strings in all 3 locales, theme tokens only, then verify and tick docs/PLAN.md. Use when starting any new screen or capability (e.g. "add puzzle mode", "build the lesson page").
---

# New feature (Master Chess)

Follow this order. Reference implementation: the bot game (`src/core/game/botGame.ts`, `src/services/engine/`, `src/features/bot-game/`, `src/app/play/bot/page.tsx`).

## 1. Locate it in the plan
- Find the item in `docs/PLAN.md` (current phase). If it is not in the current phase, add it to the plan instead of building it, and tell the user.
- Read the relevant section of `docs/TECH_SPEC.md` and any ADR in `docs/adr/`.

## 2. Core logic first (`src/core/<domain>/`)
- Pure TypeScript: no React/Next/DOM/Dexie/zustand (ESLint enforces it).
- Pure functions on serializable data: `(state, input, now) => newState | null`. Pass time (`now`) and randomness (`rng`) in as parameters so tests are deterministic (see `seededRng` in `src/core/bot/choose.ts`).
- Return codes/enums, never user-facing text.
- Write `*.test.ts` next to it, including edge cases. Run `npm run test`.
- Persisted shapes go in `src/core/profile/schema.ts` (zod). Changing them = new Dexie `version()` in `src/services/db/db.ts` + `SAVE_SCHEMA_VERSION` bump with a migrate step in `src/core/profile/saveFile.ts`.

## 3. Side effects (`src/services/`)
- IndexedDB → add methods to `src/services/db/repositories.ts`.
- Engine → `src/services/engine/` (Stockfish only in Web Workers; reuse `getEngine('bot' | 'analysis')`).
- Sounds → `playSfx` in `src/services/audio/sfx.ts`.
- Settings that belong to the player → `ProfileSettingsSchema` + `useSettings` (synced to the profile automatically).

## 4. UI (`src/features/<name>/`)
- Root component `<Name>Screen.tsx` (`'use client'`), sub-components and a `use<Name>.ts` hook that wires core + services.
- Never import another feature. Shared UI → `src/components/ui|board`; shared logic → `core`/`services`.
- Text: `useTranslations('<namespace>')` from `use-intl`. Add keys to `messages/vi.json` first, then `en.json` and `ja.json` (terms from `docs/GLOSSARY.md`). Run `npm run check-i18n`.
- Colors/fonts: theme classes only (`bg-surface`, `text-muted`, `text-accent`, `border-border`, `font-display`, `bg-side-white`…) or `var(--mc-*)`. Add a token to `src/styles/themes.css` (all themes) + `src/app/globals.css` if missing.
- Data that must survive reloads → IndexedDB via repositories, keyed by `profileId` (`useSession((s) => s.profile)`); read lists with `useLiveQuery`.
- Use `Modal`, `Button`, `Card` from `src/components/ui/`.

## 5. Route (`src/app/<path>/page.tsx`)
```tsx
import type { Metadata } from 'next';
import { NameScreen } from '@/features/name/NameScreen';

export const metadata: Metadata = { title: 'Name' };

export default function NamePage() {
  return <NameScreen />;
}
```
Add a nav entry in `src/features/shell/AppShell.tsx` or a link from a hub page if needed.

## 6. Verify
1. `npm run check` (typecheck + lint + unit tests + i18n).
2. Run the app (`.claude/launch.json` → preview "dev") and exercise the feature on desktop and a 375px mobile viewport; check the console for errors. Create a test player first (the app is behind the "who's playing?" screen).
3. Add/extend a Playwright spec in `e2e/` for the main user flow (`move()` and `createPlayer()` helpers in `e2e/helpers.ts`), run `npm run test:e2e`.
4. `npx next build` if routes or config changed.

## 7. Wrap up
- Tick the items in `docs/PLAN.md`; write an ADR in `docs/adr/` for any architectural decision.
- Commit with a Conventional Commit message (`feat: …`).
