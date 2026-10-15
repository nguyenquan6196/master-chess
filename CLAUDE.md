# Master Chess

Web app cờ vua để **học, luyện tập (quiz/puzzle), đấu bot**. Next.js + TypeScript, chạy hoàn toàn ở client, deploy Vercel tại `chess.mrquannguyenn.net`.

- Kế hoạch & tiến độ: [docs/PLAN.md](docs/PLAN.md) — **nguồn sự thật duy nhất**, tick checkbox khi xong việc.
- Thiết kế chi tiết: [docs/TECH_SPEC.md](docs/TECH_SPEC.md)
- Thuật ngữ & giọng văn 3 ngôn ngữ: [docs/GLOSSARY.md](docs/GLOSSARY.md)
- Quyết định kiến trúc: [docs/adr/](docs/adr/README.md)
- **Next.js 16** có nhiều thay đổi so với kiến thức cũ — đọc [AGENTS.md](AGENTS.md) và docs trong `node_modules/next/dist/docs/` trước khi dùng API Next mới. Dự án bật `cacheComponents` + `partialPrefetching`.

## Giao tiếp
- Trao đổi với người dùng bằng **tiếng Việt**.
- Code, tên biến/file, comment, commit message: **tiếng Anh**.
- Giao diện: mặc định tiếng Việt, hỗ trợ vi / en / ja.

## Ưu tiên
- **Tính năng trước.** Performance chỉ cần hợp lý: không giật, lazy-load phần nặng (Stockfish, 3D, nhạc, ảnh lớn). Không tối ưu sâu, không chặn việc vì số bundle/Lighthouse (budget ở spec §13.1 chỉ để tham khảo).
- Làm theo thứ tự phase trong PLAN; việc ngoài phase hiện tại → ghi vào PLAN thay vì làm ngay.

## Quy tắc bắt buộc

**Kiến trúc phân lớp** (dependency chỉ đi xuống):
```
app/ → features/ → services/ → core/
            ↘ components/ (ui/, board/) ↗
```
- `src/core/`: TypeScript thuần — **không** import React, DOM, Dexie, Howler, Next. Luật cờ (bọc chess.js), bot persona, rating, phân loại nước đi, puzzle validator.
- `src/services/`: engine (Web Worker), db (Dexie + repository), audio, theme, i18n — luôn đứng sau interface.
- `src/features/<name>/`: mỗi feature tự chứa components/hooks/store. **Feature không import feature khác**; dùng chung thì đưa xuống `services` hoặc `components/ui`.
- `src/app/`: route mỏng, chỉ ghép feature.
- `src/components/`: UI dùng chung (`ui/` nút, card…; `board/` bàn cờ) — chỉ nhận props, được dùng `core`, không gọi `services`.
- Quy tắc import được ESLint ép tự động (`eslint.config.mjs`). Hướng dẫn chi tiết: `src/core/CLAUDE.md`, `src/features/CLAUDE.md`.

**Không viết cứng:**
- **Chữ giao diện** → `useTranslations` từ **`use-intl`** (không phải next-intl), thêm key vào **cả 3** file `messages/{vi,en,ja}.json` (bản en/ja tạm cũng được). Key được type-check theo `vi.json`. Thuật ngữ cờ theo [GLOSSARY](docs/GLOSSARY.md).
- **Màu, font** → class theme (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`, `text-accent`, `bg-accent`, `border-border`, `text-danger`, `font-display`, `shadow-card`) hoặc `var(--mc-*)` (định nghĩa ở `src/styles/themes.css`). Không hex/rgb trong component.
- **Tham số** (độ khó bot, thời gian animation, ngưỡng eval) → file config có tên rõ ràng, không magic number.

**Dữ liệu:**
- Mọi dữ liệu người chơi gắn `profileId`, lưu IndexedDB qua repository. Không login, không server, không database.
- Đổi schema → tăng Dexie `version()` + migrate, và cập nhật `schemaVersion` của file save import/export.
- Dữ liệu từ ngoài (file save import, JSON nội dung, manifest theme) → validate bằng **zod**.

**Engine:** Stockfish luôn chạy trong Web Worker, không bao giờ trên main thread; tái sử dụng worker; `stop` khi rời màn.

**Asset** (ảnh, nhạc, SFX, bộ quân, font): hiện tất cả đều **tự tạo** (CSS/SVG/Web Audio, chốt Phase 5). Nếu thêm asset ngoài: chỉ dùng nguồn có license cho phép (CC0, CC-BY, Unsplash/Pexels…), **ghi vào `CREDITS.md`** cùng thư mục. Không lấy asset của chess.com / lichess trừ khi license cho phép rõ ràng.

**TypeScript strict**, không `any`.

## Definition of Done
Xem [PLAN.md → Definition of Done](docs/PLAN.md#definition-of-done-chung-cho-mọi-phase). Tối thiểu trước khi báo xong:
1. `npm run check` pass (typecheck + lint + test + check-i18n); thêm `npx next build` nếu đụng config/route.
2. Logic trong `core/` có unit test.
3. Đủ key i18n ở 3 ngôn ngữ, không hardcode chữ/màu.
4. Đã chạy thử trên trình duyệt (desktop + viewport mobile) nếu là thay đổi giao diện.
5. Tick checkbox tương ứng trong `docs/PLAN.md`.

## Lệnh (npm)
```
npm run dev          # http://localhost:3000 (browser pane: preview "dev" trong .claude/launch.json)
npm run check        # typecheck + lint + test + check-i18n
npm run typecheck    # next typegen && tsc --noEmit
npm run lint         # ESLint, gồm quy tắc chia lớp
npm run test         # Vitest (src/**/*.test.ts)
npm run check-i18n   # 3 file ngôn ngữ đủ key
npm run calibrate-bots  # cho bot đấu nhau (Stockfish trong Node) → gợi ý Elo cho levels.ts; chậm, chạy nền
npm run test:e2e     # Playwright (desktop + mobile), tự bật dev server; E2E_BASE_URL=http://localhost:3002 để chạy với server có sẵn
npm run build
```
Hook PostToolUse (`.claude/hooks/format.mjs`) tự chạy ESLint --fix + Prettier trên file vừa sửa. Husky chạy lint-staged khi commit.

## Thêm nội dung (registry — không sửa code lõi)
| Thêm | Ở đâu |
|---|---|
| Bài học | `content/learn/catalog.json` + `content/learn/<locale>/<lesson>.mdx` (skill `add-lesson`) |
| Bot | tham số `src/core/bot/levels.ts` + tên `messages/*/bots.<id>` + thoại `content/bots/dialogue.<locale>.json` |
| Opening book | `content/books/openings.json` (dòng SAN theo phong cách) |
| Theme | `src/styles/themes.css` + `services/theme/appearance.ts` + id trong `core/profile/settingsOptions.ts` (skill `add-theme`) |
| Quiz | `content/quiz/questions.json` + `content/quiz/<locale>.json` (skill `add-quiz`) |
| Ngôn ngữ | `messages/<locale>.json` + `content/*/<locale>/` |

Skills: `.claude/skills/new-feature` (quy trình làm 1 tính năng mới), `.claude/skills/add-quiz` (thêm câu quiz 3 ngôn ngữ, build lại bộ puzzle), `.claude/skills/add-lesson` (thêm bài học MDX 3 ngôn ngữ), `.claude/skills/add-theme` (theme/preset giao diện), `.claude/skills/sync-i18n` (đồng bộ bản dịch). Subagent `reviewer` (`.claude/agents/`) soát thay đổi theo Definition of Done. Các skill thêm nội dung (bài học, bot, theme…) viết dần sau khi có ví dụ thật đầu tiên.
