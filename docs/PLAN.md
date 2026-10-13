# Master Chess — Kế hoạch triển khai

> Đi kèm: [TECH_SPEC.md](TECH_SPEC.md) · Ngày: 2026-10-13
> Ước lượng theo 1 người làm part-time (~10–15 giờ/tuần). Mỗi phase kết thúc bằng 1 bản deploy chạy được trên Vercel.

## Tổng quan lộ trình

| Phase | Tên | Thời lượng | Kết quả |
|---|---|---|---|
| 0 | Khởi tạo & nền tảng (gồm CI, kiến trúc phân lớp) — ✅ code xong, chờ deploy | 1.5 tuần | Repo, Next.js, bàn cờ chơi 2 người cùng máy, deploy Vercel |
| 1 | Đấu bot (MVP) | 2 tuần | Chơi với Stockfish, 8 mức độ khó |
| 2 | Puzzle & Quiz | 2 tuần | Puzzle rated, theo chủ đề, quiz |
| 3 | Learn | 2–3 tuần | 15–20 bài học MDX tương tác |
| 4 | Bot persona & Game Review | 2 tuần | Phong cách bot, phân tích ván sau trận |
| 5 | Hoa hòe: theme, âm thanh, ngôn ngữ, gamification | 3–4 tuần | 8 theme + tuỳ chỉnh, nhạc nền, vi/en/ja, XP, huy hiệu, PWA |
| 6 | 3D board | 2 tuần | Chế độ 3D tuỳ chọn |
| 7 | (Tuỳ chọn) Cloud | — | Tài khoản, đồng bộ, AI Coach, PvP |

**MVP có thể dùng được = hết Phase 3 (~7–8 tuần).**

## Definition of Done chung cho mọi phase

**Ưu tiên tính năng**; performance chỉ cần giữ ở mức hợp lý (không giật, lazy-load phần nặng), không ngặt nghèo. Scale & maintain giữ qua kiến trúc phân lớp + i18n/theme (chi tiết: spec §13). Một feature chỉ coi là xong khi:

- [ ] CI xanh ở các bước bắt buộc: typecheck, lint, unit test, build, `check-i18n` (size-limit / Lighthouse chỉ cảnh báo)
- [ ] Phần nặng mới thêm (engine, 3D, nhạc, ảnh lớn) được lazy-load — không cần tối ưu sâu, budget spec §13.1 chỉ để tham khảo
- [ ] Logic mới nằm đúng lớp (`core` / `services` / `features`), không vi phạm quy tắc import
- [ ] Có unit test cho logic `core`, E2E nếu là luồng chính của người dùng
- [ ] Chuỗi giao diện dùng key i18n (đủ 3 file vi/en/ja, bản dịch tạm cũng được), màu/font lấy từ biến theme
- [ ] Dữ liệu lưu mới có migrate (Dexie version + `schemaVersion` của file save)
- [ ] Asset mới đã tối ưu dung lượng + ghi `CREDITS.md`
- [ ] Đã thử trên mobile thật hoặc viewport mobile + chế độ máy yếu
- [ ] Cập nhật docs/ADR nếu có quyết định kiến trúc mới

---

## Phase 0 — Khởi tạo & nền tảng
- [~] `git init` ✅ (branch `main`) — **còn:** tạo repo GitHub + push (bạn làm, xem "Việc cần bạn làm" bên dưới)
- [x] `create-next-app` → **Next.js 16.4**, React 19, TypeScript, Tailwind 4, App Router, ESLint (bật sẵn `cacheComponents`)
- [x] Cài: `chess.js`, `react-chessboard` v5, `zustand`, `zod`, `use-intl`, `clsx`. *Dời sang khi cần:* `dexie` (Phase 1), `framer-motion`, shadcn/ui
- [x] Cấu trúc thư mục phân lớp (spec §13.4) — thực tế:
  ```
  src/
    app/            (route mỏng: /, /learn, /practice, /play, /play/local, /settings)
    core/chess/     (game.ts + game.test.ts)
    services/       (i18n/, theme/, settings/, AppProviders.tsx)
    features/       (home, shell, play-hub, local-game, settings)
    components/     (ui/: Button, Card, cn · board/: ChessBoard, PromotionPicker)
    styles/themes.css
  messages/{vi,en,ja}.json
  scripts/check-i18n.mjs
  docs/adr/
  ```
  `content/`, `public/engine|puzzles|audio|themes|pieces/` tạo khi phase tương ứng cần.
- [x] **Nền tảng chất lượng:** TypeScript strict, ESLint + Prettier + quy tắc import theo lớp (`no-restricted-imports`, đã thử vi phạm → bị chặn), Husky + lint-staged, zod (đã cài, dùng từ Phase 1)
- [x] **CI GitHub Actions** (`.github/workflows/ci.yml`): typecheck → lint → test → check-i18n → build. *Dời:* size-limit, Lighthouse CI (cảnh báo), Playwright → Phase 1 khi có luồng bot
- [x] `@vercel/speed-insights` (tự chạy khi lên Vercel); Dependabot (`.github/dependabot.yml`)
- [x] README, CONTRIBUTING, ADR 0001–0007
- [x] **Harness cho Claude Code:**
  - [x] `CLAUDE.md` gốc (rule chung) + `docs/GLOSSARY.md` (thuật ngữ vi/en/ja, giọng văn)
  - [x] Điền phần "Lệnh" trong `CLAUDE.md` (dùng **npm**, không phải pnpm)
  - [x] `CLAUDE.md` theo thư mục: `src/core/`, `src/features/`
  - [x] `.claude/settings.json`: hook PostToolUse chạy ESLint --fix + Prettier trên file vừa sửa; allowlist lệnh `npm run …`
  - [x] `.claude/launch.json` (preview "dev")
  - [ ] Skill `new-feature` → viết ở Phase 1 (cần thêm 1–2 feature thật làm mẫu)
- [x] **i18n từ ngày đầu:** `use-intl` (ADR 0005), vi/en/ja, key được type-check, tự đoán ngôn ngữ trình duyệt lần đầu
- [x] **Font:** Be Vietnam Pro + Baloo 2; Noto Sans JP + M PLUS Rounded 1c chỉ tải khi chọn tiếng Nhật (đã kiểm tra)
- [x] **Khung theme:** CSS variables + `data-theme`, theme Classic + Midnight, chế độ Tự động theo hệ thống, script áp theme trước khi vẽ (không chớp)
- [x] Layout + navigation (Home, Học, Luyện tập, Đấu cờ, Cài đặt), menu mobile, dark mode (= Midnight)
- [x] Component `ChessBoard`: kéo-thả, click-to-move, chấm nước hợp lệ / vòng ăn quân, highlight nước vừa đi, sáng đỏ Vua bị chiếu, hộp chọn phong cấp; nhập thành & bắt tốt qua đường (chess.js)
- [x] Chế độ 2 người cùng máy (`/play/local`): trạng thái lượt/chiếu/chiếu hết/hòa (4 lý do), lịch sử nước đi, đi lại, lật bàn, ván mới, sao chép PGN
- [x] Vitest cho `src/core` (10 test: chiếu hết, hòa pat, thiếu quân, lặp 3 lần, nhập thành, bắt tốt qua đường, phong cấp, đi lại…)
- [ ] Kết nối Vercel, auto-deploy từ `main` — **bạn làm** (cần tài khoản)
- [ ] Gắn subdomain `chess.mrquannguyenn.net`: thêm domain trong Vercel + bản ghi CNAME ở DNS, kiểm tra SSL — **bạn làm**

**Done khi:** chơi trọn 1 ván 2 người trên URL Vercel, phát hiện đúng chiếu hết/hòa. *(Đã đạt ở local; chờ deploy.)*

**Việc cần bạn làm để đóng Phase 0:**
1. Tạo repo trên GitHub (vd `master-chess`), rồi `git remote add origin …` và push nhánh `main` (Claude có thể commit giúp khi bạn bảo).
2. Vercel → Add New Project → Import repo đó (framework Next.js tự nhận, không cần cấu hình).
3. Vercel → Settings → Domains → thêm `chess.mrquannguyenn.net`; ở DNS tên miền thêm `CNAME chess → (giá trị Vercel hiển thị)`.
4. Bật Speed Insights trong tab của project trên Vercel.

## Phase 1 — Đấu bot (MVP)
- [ ] Tải Stockfish WASM lite single-thread vào `public/engine/`
- [ ] `src/services/engine`: Web Worker + giao tiếp UCI (`uci`, `isready`, `position fen`, `go depth/movetime`, parse `info ... multipv ... score`, `bestmove`)
- [ ] `BotController` + bảng 8 mức (spec §6.3), gồm lớp blunder/softmax cho Elo < 1300
- [ ] Màn hình chọn bot: avatar, Elo, mô tả; chọn màu, time control
- [ ] Đồng hồ cờ; Hint, Undo, Resign, Offer draw
- [ ] Hồ sơ người chơi cục bộ (spec §8.1): màn nhập tên / chọn người chơi, mọi dữ liệu gắn `profileId`
- [ ] Autosave ván đang chơi dở, mở lại đánh tiếp
- [ ] `AudioManager` (Howler.js) + SFX cơ bản: đi quân, ăn quân, chiếu, kết thúc ván; mở khoá âm thanh ở cú click chọn người chơi (nhạc nền làm ở Phase 5)
- [ ] Màn kết thúc ván; lưu PGN vào IndexedDB; trang lịch sử ván
- [ ] Xuất/nhập save dạng file JSON (spec §8.2)
- [ ] Eval bar (worker phân tích riêng), bật/tắt
- [ ] Playwright E2E (chơi hết 1 ván với bot, autosave + mở lại, import/export) + size-limit/Lighthouse CI ở chế độ cảnh báo
- [ ] Skill `new-feature` (dựng khung feature theo `src/features/CLAUDE.md` + checklist DoD)
- [ ] Skill `add-bot`: persona JSON + thoại 3 ngôn ngữ theo GLOSSARY (viết từ bot đầu tiên)
- [ ] Subagent `reviewer`: soát thay đổi theo DoD (đúng lớp, không hardcode chữ/màu, có test, có CREDITS)

**Done khi:** người mới thắng được bot thấp nhất, bot Master không thua ván nào trong test thủ công.

## Phase 2 — Puzzle & Quiz
- [ ] Tải `lichess_db_puzzle.csv` (database.lichess.org)
- [ ] `scripts/build-puzzles.ts`: lọc popularity ≥ 90, nbPlays đủ lớn → bucket theo rating & theme → JSON ≤ 500 bài/file
- [ ] Puzzle runner: auto-play nước đối thủ, kiểm tra nước người dùng, chấp nhận mate thay thế, gợi ý 2 cấp, xem lời giải
- [ ] Puzzle rating (Glicko-2 đơn giản) lưu IndexedDB
- [ ] Chế độ: Rated, Theme Training, Puzzle Rush (3/5 phút), Daily Puzzle
- [ ] Quiz engine (choice / select-squares / make-move) + bộ ~50 câu đầu
- [ ] Hiệu ứng đúng/sai, confetti
- [ ] Skill `add-quiz` (+ hướng dẫn chạy lại `build-puzzles`)

**Done khi:** giải puzzle liên tục không lặp, rating thay đổi hợp lý.

## Phase 3 — Learn
- [ ] Cấu hình MDX (`@next/mdx` hoặc `next-mdx-remote`) + frontmatter
- [ ] Component: `InteractiveBoard`, `MoveSequence`, `Callout`, `LessonQuiz`
- [ ] Trang danh sách khoá học + tiến độ (% hoàn thành, khoá bài theo prerequisite)
- [ ] Viết nội dung (ưu tiên):
  - [ ] Chương 1 – Cơ bản: bàn cờ & ký hiệu, 6 quân cờ, giá trị quân (8 bài)
  - [ ] Chương 2 – Luật: nhập thành, bắt tốt qua đường, phong cấp, chiếu/hết/hòa pat, các luật hòa (5 bài)
  - [ ] Chương 3 – Nguyên tắc: khai cuộc, chiến thuật cơ bản, tàn cuộc cơ bản (5–7 bài)
  - [ ] Chương 4 – Khai cuộc phổ biến (để sau MVP)
- [ ] Liên kết bài học ↔ puzzle theme tương ứng ("Luyện thêm 10 bài chĩa đôi")
- [ ] `content/learn/CLAUDE.md`: cách viết bài (cấu trúc, độ dài, giọng văn theo GLOSSARY)
- [ ] Skill `add-lesson`: tạo MDX từ template, kiểm tra FEN/nước đi hợp lệ bằng chess.js, quiz cuối bài, bản 3 ngôn ngữ (viết từ 1–2 bài đầu)

**Done khi:** người chưa biết chơi đi hết Chương 1–2 và chơi được với bot thấp nhất.

## Phase 4 — Bot persona & Game Review
- [ ] Style bonus từ MultiPV (Tấn công / Phòng thủ / Thế trận / Hỗn loạn / Cân bằng)
- [ ] Opening book riêng mỗi persona (`scripts/build-book.ts` từ PGN)
- [ ] Ma trận chọn bot = Độ khó × Phong cách; chế độ Custom (slider Elo)
- [ ] Thoại bot theo sự kiện
- [ ] `scripts/calibrate-bots.ts`: cho bot tự đấu với Stockfish UCI_Elo để hiệu chỉnh Elo
- [ ] Adaptive difficulty (gợi ý bot tiếp theo dựa trên kết quả)
- [ ] Game Review: phân loại nước (Best/Good/Inaccuracy/Mistake/Blunder), accuracy, biểu đồ eval, "thử lại nước sai"

## Phase 5 — Hoa hòe
- [ ] Theme (spec §7.2):
  - [ ] Tìm/tạo asset: ảnh nền chất lượng cao (desktop + mobile), texture bàn, 3–5 bộ quân có license phù hợp, skin nút (gỗ/cuộn giấy dạng 9-slice); ghi `CREDITS.md`
  - [ ] 8 theme có sẵn (Classic, Gỗ, Cẩm thạch, Neon, Arcade, Fantasy, Sakura, Midnight)
  - [ ] Tuỳ chỉnh từng phần: nền (màu đơn sắc / gradient / ảnh / ảnh tự tải lên), bàn cờ, bộ quân, highlight & mũi tên, màu nhấn, kiểu nút
  - [ ] Thanh làm tối/làm mờ nền; nền động (cánh hoa, hạt) tôn trọng `prefers-reduced-motion`
  - [ ] Settings → Giao diện: lưới thẻ xem trước + live preview trên bàn cờ mẫu
- [ ] Settings → Language: vi/en/ja; dịch đủ UI, thoại bot, quiz; bài học dịch dần (fallback + thông báo)
- [ ] Skill `add-theme` (manifest + asset + CREDITS) và skill `sync-i18n` (dịch key còn thiếu vi → en/ja theo GLOSSARY)
- [ ] Animation, hiệu ứng chiếu/phong cấp
- [ ] Âm thanh (spec §7.1):
  - [ ] Tìm/tạo asset: SFX (CC0), nhạc menu, Learn, Practice, Puzzle Rush, 4 mức bot (+ bản "căng" cho mỗi mức), stinger thắng/thua/hòa; ghi `CREDITS.md`
  - [ ] Nhạc nền theo màn + theo độ khó bot, crossfade khi chuyển màn, dừng khi ẩn tab
  - [ ] SFX đầy đủ + UI click; sound pack (classic / arcade / fantasy)
  - [ ] Căng thẳng động (đồng hồ < 30 s / eval thua nặng)
  - [ ] Settings → Âm thanh: âm lượng Master/Nhạc/SFX/UI, chế độ nhạc auto/cố định/tắt, sound pack, nút nghe thử; nút loa tắt nhanh trên header
- [ ] XP, streak, huy hiệu, trang Profile
- [ ] Responsive mobile hoàn chỉnh; PWA (chơi offline)

## Phase 6 — 3D
- [ ] Spike: react-three-fiber + model GLTF quân cờ (CC0 hoặc tự dựng)
- [ ] Ánh xạ ô ↔ toạ độ 3D, raycast click-to-move, animation di chuyển
- [ ] Camera orbit, preset góc nhìn, ánh sáng/bóng đổ
- [ ] Toggle 2D/3D, lazy-load bundle, fallback khi máy yếu

## Phase 7 — Cloud (tuỳ chọn)
- [ ] (Chỉ khi đổi ý) Cloud save bằng Tên + PIN — hiện đã chốt KHÔNG làm, xem spec §8.3
- [ ] (Nếu cần nhiều hơn) Supabase Auth + Postgres, đồng bộ tiến độ
- [ ] AI Coach: API route gọi Claude giải thích nước đi từ output Stockfish
- [ ] PvP online qua dịch vụ realtime
- [ ] Bảng xếp hạng puzzle

---

## Quyết định cần chốt trước khi code

| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Repo public hay private? | Public (đơn giản hoá GPL của Stockfish) |
| 2 | react-chessboard (MIT) hay chessground (GPL, giống lichess)? | react-chessboard |
| 3 | Ngôn ngữ nội dung | Tiếng Việt trước, cấu trúc sẵn i18n |
| 4 | Lưu người chơi thế nào? | ✅ Đã chốt: profile theo tên, lưu IndexedDB + import/export file JSON. Không login, không database |
| 6 | Deploy ở đâu? | ✅ Đã chốt: Vercel + subdomain `chess.mrquannguyenn.net` (CNAME) |
| 5 | Nguồn hình quân cờ / avatar bot | cburnett SVG + avatar tự tạo |

## Checklist kiểm tra độ khả thi (spike 1–2 ngày, nên làm đầu tiên)
- [ ] Stockfish WASM chạy trong worker trên Vercel, đo thời gian `go depth 12` trên laptop và điện thoại
- [ ] Bot mức 250 Elo thực sự "dễ" khi tự chơi thử
- [ ] react-chessboard hoạt động mượt trên mobile (tap-to-move)
- [ ] Build puzzle JSON từ CSV lichess, kiểm tra kích thước
- [ ] Render 1 bài MDX có bàn cờ tương tác
- [ ] Đo bundle size của react-chessboard + chess.js + Next.js khung → xác nhận budget 170 KB trang chủ là khả thi
