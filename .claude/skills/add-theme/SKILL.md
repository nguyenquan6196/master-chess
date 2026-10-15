---
name: add-theme
description: Add or tweak a Master Chess colour theme (CSS variables, procedural backdrop, animated particles, preview swatch, names in vi/en/ja) without external assets. Use when asked for a new theme, to change a theme's colours/background, or to add a board/accent/gradient preset.
---

# Add a theme

Themes are pure CSS + data — no images are downloaded (project decision, Phase 5). If an asset is ever added, it must have a permissive licence and be listed in a `CREDITS.md` next to it.

## 1. Register the id — `src/core/profile/settingsOptions.ts`
Append the id to `THEME_IDS`. Adding an id only widens the settings enum: no Dexie/save migration is needed (removing or renaming one does need a migration).

## 2. CSS block — `src/styles/themes.css`
Add `[data-theme='<id>'] { … }` next to the others.
- **Light theme**: set at least `color-scheme: light`, `--mc-bg`, `--mc-surface`, `--mc-surface-2`, `--mc-fg`, `--mc-muted`, `--mc-border`, `--mc-accent`, `--mc-accent-hover`, `--mc-accent-fg`, the four `--mc-board-*`, `--mc-arrow-hint`, `--mc-mark-hint`. Everything else falls back to the Classic values in `:root`.
- **Dark theme**: `color-scheme: dark` and **every** variable of the `midnight` block (highlights, side colours, marks, `--mc-cls-*`, chart colours, shadow) — the Classic fallbacks are made for light backgrounds.
- **Backdrop**: `--mc-backdrop-image` (CSS gradients/patterns only), `--mc-backdrop-size`, `--mc-backdrop-mask`, `--mc-backdrop-opacity`. Optional `--mc-radius-btn` (button corners).
- Check contrast: body text on `--mc-bg` and `--mc-surface`, `--mc-accent-fg` on `--mc-accent`, piece sets on both board colours.

## 3. Preview + particles — `src/services/theme/appearance.ts`
Add `THEME_INFO.<id>`: `dark`, `swatch: [bg, boardLight, boardDark, accent]` (used by the settings grid) and `particles` (`'petals' | 'stars' | 'neon' | 'pixels' | 'dust' | null`, drawn by `components/ui/BackdropParticles.tsx` in theme colours).

Presets for the customization panel live in the same file (`BOARD_PRESETS`, `ACCENT_PRESETS`, `HIGHLIGHT_PRESETS`, `GRADIENT_PRESETS`); a new preset also needs its id in `settingsOptions.ts` and a name in messages.

## 4. Names — `messages/{vi,en,ja}.json`
`settings.themes.<id>` in all three files (vi is the source; tone per `docs/GLOSSARY.md`).

## 5. Verify
```
npm run check
npx next build
```
Then in the browser (desktop + 375px): open ⚙️ → pick the theme; look at home, `/play/local` (board + each piece set), `/practice/quiz`, the profile (emblems) and a dialog. The pre-paint boot script applies the theme from localStorage, so a reload must not flash another theme.
