# Master Chess — Kế hoạch triển khai

> Đi kèm: [TECH_SPEC.md](TECH_SPEC.md) · Ngày: 2026-10-13
> Ước lượng theo 1 người làm part-time (~10–15 giờ/tuần). Giai đoạn đầu **chỉ chạy local** (`npm run dev`); deploy Vercel khi tính năng đã tương đối đầy đủ (xem mục "Deploy" cuối lộ trình).

## Tổng quan lộ trình

| Phase | Tên | Thời lượng | Kết quả |
|---|---|---|---|
| 0 | Khởi tạo & nền tảng (gồm CI, kiến trúc phân lớp) — ✅ xong | 1.5 tuần | Repo, Next.js, bàn cờ chơi 2 người cùng máy |
| 1 | Đấu bot (MVP) — ✅ xong | 2 tuần | Chơi với Stockfish, 8 mức độ khó |
| 2 | Puzzle & Quiz — ✅ code xong, chờ chơi thử | 2 tuần | Puzzle rated, theo chủ đề, quiz |
| 3 | Learn — ✅ code xong, chờ đọc thử | 2–3 tuần | 18 bài học MDX tương tác × 3 ngôn ngữ |
| 4 | Bot persona & Game Review — ✅ code xong, chờ chơi thử | 2 tuần | Phong cách bot, phân tích ván sau trận |
| 5 | Hoa hòe: theme, âm thanh, ngôn ngữ, gamification — ✅ code xong, chờ chơi thử | 3–4 tuần | 8 theme + tuỳ chỉnh, nhạc nền, vi/en/ja, XP, huy hiệu, PWA |
| 5.5 | Giao diện kiểu game — ✅ code xong | 1 tuần | Sảnh chính thay thanh menu, màn chơi toàn màn hình, HUD icon |
| 5.6 | Bộ quân theo chủ đề — ✅ code xong | 1–2 tuần | Mỗi theme một bộ quân riêng (hình dáng + chất liệu) |
| 6 | 3D board — ✅ code xong | 2 tuần | Chế độ 3D tuỳ chọn |
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
- [x] Repo GitHub public: https://github.com/nguyenquan6196/master-chess (branch `main`, CI xanh)
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
- Deploy Vercel + subdomain: **dời** sang mục "Deploy" (quyết định 2026-10-14: chạy local trước, deploy khi tính năng hòm hòm).

**Done khi:** chơi trọn 1 ván 2 người, phát hiện đúng chiếu hết/hòa. ✅ (local)

## Phase 1 — Đấu bot (MVP) — ✅ code xong (2026-10-14)
- [x] Stockfish **19** lite single-thread (~1.9 MB, `public/engine/`, kèm `COPYING.txt` + `CREDITS.md`). Đo: depth 12 ≈ 70 ms (Node, laptop)
- [x] `src/services/engine/StockfishEngine.ts`: Web Worker + UCI, tìm kiếm tuần tự (lệnh mới tự `stop` lệnh cũ), MultiPV, giới hạn Elo, báo lỗi khi không tải được engine; 2 engine riêng: `bot` và `analysis`
- [x] 8 mức bot (`src/core/bot/levels.ts`): 4 mức thấp lấy mẫu softmax trên MultiPV + tỉ lệ nước ngẫu nhiên; Sư tử/Đại bàng/Rồng dùng `UCI_Elo`; Kiện tướng full sức. Có độ trễ "suy nghĩ" giả lập
- [x] Màn chọn bot: emoji, tên, Elo ước lượng, mô tả (3 ngôn ngữ); chọn màu (Trắng/Ngẫu nhiên/Đen), thời gian (∞, 10+0, 5+3, 3+2)
- [x] Đồng hồ (có increment, hết giờ = thua); Gợi ý (mũi tên), Đi lại, Xin thua (xác nhận), Đề nghị hòa (bot nhận khi đang kém hoặc thế cân bằng sau 60 nửa nước)
- [x] Hồ sơ người chơi (IndexedDB/Dexie): màn "Ai đang chơi?", tạo (tên + avatar), sửa, xoá, đổi người chơi; cài đặt lưu theo từng người; tải lại tab vẫn giữ người chơi (sessionStorage)
- [x] Tự lưu ván sau mỗi nước; mở lại → thẻ "Ván đang dở" (Chơi tiếp / Bỏ ván); đồng hồ không tính thời gian rời đi
- [x] Âm thanh cơ bản: đi quân, ăn quân, nhập thành, chiếu, phong cấp, bắt đầu/thắng/thua/hòa; bật/tắt + âm lượng trong Cài đặt. *Khác plan:* tổng hợp bằng Web Audio (không file âm thanh, không cần Howler) — Howler + nhạc nền ở Phase 5
- [x] Hộp kết quả ván (Chơi lại / Đổi đối thủ / Xem bàn cờ); lưu PGN (có header); trang Lịch sử (kết quả, lý do, số gợi ý/đi lại, sao chép PGN); thống kê trong trang Hồ sơ
- [x] Xuất/nhập file save JSON (zod validate, `schemaVersion`, xác nhận trước khi ghi đè)
- [x] Thanh đánh giá (engine `analysis`, depth 10), bật/tắt, lưu theo người chơi
- [x] Playwright E2E (desktop + mobile, 6 test): ván 2 người + chiếu hết + đi lại; ván với bot + bot trả lời + tự lưu + chơi tiếp + xin thua + lịch sử; nhớ người chơi + đổi người chơi. CI chạy ở chế độ cảnh báo. *Dời:* size-limit/Lighthouse → mục Deploy (đo trên bản deploy mới có ý nghĩa)
- [x] Skill `new-feature` (`.claude/skills/new-feature/`)
- [ ] Skill `add-bot` → làm ở Phase 4 khi bot chuyển sang file persona JSON + thoại (hiện bot cấu hình trong code `src/core/bot/levels.ts`)
- [x] Subagent `reviewer` (`.claude/agents/reviewer.md`)
- [x] Unit test (43) cho `core`: UCI parser, chọn nước bot, đồng hồ, ván bot (đi quân/chiếu hết/xin thua/đi lại/hết giờ/tiếp tục), file save, thống kê. `services` (Web Worker, IndexedDB) được kiểm qua E2E

**Done khi:** người mới thắng được bot thấp nhất, bot Master không thua ván nào trong test thủ công. ✅ Người chơi thử thắng Gà con bằng chiếu hết (2026-10-14). Còn theo dõi: cảm giác độ khó các mức giữa.

## Phase 2 — Puzzle & Quiz — ✅ code xong (2026-10-14)
- [x] Tải Lichess puzzle DB (307 MB, CC0) vào thư mục tạm; file dùng zstd *seekable* → giải nén bằng Python 3.14 `compression.zstd` (Node không đọc được)
- [x] `scripts/build-puzzles.mjs`: lọc popularity ≥ 90, nbPlays ≥ 1000, RD ≤ 90, kiểm tra từng lời giải bằng chess.js → **13.831 puzzle** (0 lỗi), 3.1 MB: 12 bucket rating 400–2800 (≤1000/bucket), 22 chủ đề (~240–480/chủ đề), 400 puzzle hằng ngày; `public/puzzles/CREDITS.md`
- [x] Puzzle runner (`core/puzzle/session.ts` + `features/puzzles`): tự đi nước mở đầu của đối thủ, kiểm tra nước, chấp nhận mọi nước chiếu hết, phản hồi đúng/sai, gợi ý 2 cấp (đánh dấu quân → mũi tên), xem lời giải, hiện chủ đề sau khi giải
- [x] Glicko-2 đầy đủ (`core/rating/glicko2.ts`, khớp ví dụ chuẩn của Glickman) — dùng lại cho rank ở Phase 4. Rating puzzle bắt đầu 800 (RD 300); lỗi đầu tiên/gợi ý/xem lời giải = thua (như Lichess)
- [x] Chế độ: Tính điểm (puzzle gần rating, không lặp), Luyện theo chủ đề (22 chủ đề), Puzzle Rush 3/5 phút (khó dần, 3 lần sai, kỷ lục), Câu đố hằng ngày (cố định theo ngày, nhớ đã giải)
- [x] Quiz engine (choice / select-squares — đáp án tính theo luật / make-move, chấp nhận mọi nước chiếu hết) + **51 câu** × 3 ngôn ngữ, 5 chủ đề; vòng 10 câu, lưu điểm tốt nhất theo chủ đề; test tự kiểm toàn bộ nội dung
- [x] Hiệu ứng: âm thanh đúng/sai, confetti (canvas, tự viết, tắt khi `prefers-reduced-motion`)
- [x] Dữ liệu v2: bảng `puzzleAttempts`, profile thêm `puzzleRating`/`rushBest`/`quizBest`; Dexie version 2 + migrate (đã kiểm tra trên dữ liệu thật của Phase 1); file save `schemaVersion` 2 + migrate từ v1 (có test)
- [x] Skill `add-quiz` (+ hướng dẫn build lại puzzle)
- [x] E2E: 5 test mới (bộ puzzle giả lập cố định): tính điểm đúng/sai, chủ đề + hằng ngày, Rush, quiz cả vòng → tổng 16 test pass (desktop + mobile)
- [x] Mở rộng quiz lần 2 (2026-10-15): **300 câu viết tay** × 3 ngôn ngữ, **60 câu mỗi chủ đề** (85 câu đi quân, 37 câu chọn ô; dễ 113 / vừa 123 / khó 64). Sửa `legalTargets` trả trùng ô phong cấp
- [x] Mở rộng quiz (2026-10-15): **150 câu viết tay** × 3 ngôn ngữ (quân cờ 30, luật 32, ký hiệu 28, nguyên tắc 30, chiến thuật 30; 43 câu đi quân, 17 câu chọn ô); test kiểm thêm "bên vừa đi không được đang bị chiếu" (sửa 1 FEN sai cũ)
- [x] Phần **Luyện tập thêm 🤖 Máy tạo** dưới phần viết tay: `core/quiz/generate.ts` sinh câu hỏi ngẫu nhiên theo chủ đề (nước đi của quân có vật cản, trạng thái chiếu/chiếu hết/hòa pat, thoát chiếu, đọc ký hiệu, ăn quân treo, chiếu hết 1 nước, đếm điểm quân, chọn nước ăn tốt nhất); điểm tốt nhất lưu riêng `gen:<topic>`; hiện "Đáp án: …" khi đi sai; E2E thêm 1 vòng máy tạo (tổng 26 test pass)

**Done khi:** giải puzzle liên tục không lặp, rating thay đổi hợp lý. ✅ Kiểm tra thực tế: puzzle ~874 cho người chơi 800; xem lời giải → 800 → 680. **Cần bạn chơi thử** để cảm nhận độ khó/điểm.

## Phase 3 — Learn — ✅ code xong (2026-10-15)
- [x] MDX qua `@next/mdx` (Turbopack, `remark-gfm`); trang `/learn/[lessonId]` prerender cả 18 bài; mỗi trang render đủ 3 bản ngôn ngữ, client hiện theo cài đặt (thiếu bản dịch → hiện bản khác + thông báo). Metadata bài học để trong `content/learn/catalog.json` (thay cho frontmatter)
- [x] Component dùng trong MDX (không cần import): `Board` (fen, ô đánh dấu, mũi tên, chấm nước đi của 1 quân), `MoveSequence` (⏮ ◀ ▶ ⏭ + danh sách nước), `Callout` (tip/warning/rule/fun), `Exercise` (đi quân / chọn ô, làm lại được). `QuestionView` chuyển xuống `components/board` để Quiz và bài học dùng chung
- [x] Trang danh sách bài: tiến độ tổng & theo chương, "Học tiếp", khoá bài theo `requires` (màn khoá chỉ đường tới bài cần học trước)
- [x] Cuối bài: quiz 2–4 câu từ ngân hàng quiz → "Hoàn thành bài học" (lưu điểm tốt nhất) → bài tiếp theo + "Luyện thêm" mở thẳng chủ đề puzzle (`/practice/themes#fork`)
- [x] Nội dung **18 bài × 3 ngôn ngữ** (vi/en/ja):
  - [x] Chương 1 – Cơ bản (9): bàn cờ, tên ô & ký hiệu, Tốt, Mã, Tượng, Xe, Hậu, Vua, giá trị quân
  - [x] Chương 2 – Luật (5): chiếu/chiếu hết/hòa pat, nhập thành, bắt tốt qua đường, phong cấp, các trường hợp hòa
  - [x] Chương 3 – Nguyên tắc (4): khai cuộc, chiến thuật (chĩa đôi/ghim/xiên), thế chiếu hết cơ bản, tàn cuộc cơ bản
  - [ ] Chương 4 – Khai cuộc phổ biến (để sau MVP)
- [x] Liên kết bài học ↔ chủ đề puzzle
- [x] Dữ liệu v3: `profile.lessons` (Dexie version 3 + migrate; file save `schemaVersion` 3 + migrate)
- [x] `content/learn/CLAUDE.md` (cách viết bài) + skill `add-lesson`
- [x] Test: catalog + **toàn bộ 54 file MDX** (mọi FEN, chuỗi nước, đáp án bài tập đều được kiểm bằng chess.js); E2E học (mở khoá, hoàn thành, bài tập, đổi ngôn ngữ) → tổng 24 E2E pass
- Sửa trong lúc làm: sơ đồ thiếu Vua làm sập trang (helpers đọc thế cờ giờ bỏ qua kiểm tra hợp lệ); nhiều bàn cờ trên 1 trang trùng `id` (giờ mỗi bàn 1 id riêng)

**Done khi:** người chưa biết chơi đi hết Chương 1–2 và chơi được với bot thấp nhất. → **Cần bạn đọc thử** vài bài (nội dung do AI viết, nên soát thuật ngữ & văn phong, nhất là bản tiếng Nhật).

### Cập nhật giao diện sau Phase 3 (2026-10-15, theo góp ý)
- [x] Favicon: icon SVG quân Mã (`src/app/icon.svg`) thay logo Next.js
- [x] Chọn ngôn ngữ chuyển lên thanh menu, bên trái nút người chơi
- [x] Cài đặt thành **nút nổi ⚙️ góc phải dưới**, bấm để mở/đóng bảng (giao diện + âm thanh); bỏ trang `/settings` và mục "Cài đặt" trên menu. Phase 5: các mục theme/nhạc/sound pack mới sẽ thêm vào bảng này
- [x] Mobile: logo chỉ còn icon khi màn hình < 440px để vừa chỗ
- [x] Nút **← quay lại** trên mọi màn con (luyện tập, đấu cờ); nút Back của trình duyệt lùi **từng bước** (vòng quiz → menu quiz → Luyện tập) nhờ `services/navigation/historyStep.ts`; E2E kiểm tra
- [x] Nền caro mờ của màn welcome thành **nền chung cho mọi màn** (biến theme `--mc-backdrop-*` trong `themes.css`, Midnight mờ hơn)
- [x] Màn "Ai đang chơi?" làm mới: 2 cột — giới thiệu app + bàn cờ demo tự chạy (khai cuộc Ý) + 3 mục Học/Luyện tập/Đấu cờ; thẻ người chơi có avatar, rating puzzle; ô "+ Người chơi mới" nét đứt; chọn ngôn ngữ có cờ; nền ô cờ mờ. Mobile: thẻ người chơi lên trước

## Phase 4 — Bot persona & Game Review — ✅ code xong (2026-10-15)
- [x] Style bonus từ MultiPV (Tấn công / Phòng thủ / Thế trận / Hỗn loạn / Cân bằng): `core/bot/styles.ts` — chỉ cộng điểm cho nước cách nước tốt nhất ≤ 80cp; bot yếu cộng vào softmax, bot mạnh chọn trong MultiPV 4 quanh nước của limiter (+ test)
- [x] Opening book riêng mỗi phong cách: `content/books/openings.json` (dòng SAN viết tay + trọng số, nạp lúc chạy → không cần script build), `core/bot/book.ts` tra theo thế cờ cho cả Trắng lẫn Đen, dùng tới nước thứ 24, bot ≥ 700 Elo (+ test kiểm hợp lệ)
- [x] Ma trận chọn bot = Độ khó × Phong cách; chế độ Custom (slider Elo 250–3000, nội suy tham số bot yếu / UCI_Elo / full strength)
- [x] Thoại bot theo sự kiện: `content/bots/dialogue.<locale>.json` (8 bot + default, 10 sự kiện: mở màn, ra mắt trùm, ăn quân, bị ăn, chiếu, bị chiếu, thắng, thua, hòa, bị hạ khi thăng hạng), bóng thoại cạnh bot (+ test đủ nội dung 3 ngôn ngữ)
- [x] `scripts/calibrate-bots.ts` (`npm run calibrate-bots [số ván/cặp]`): bot đấu nhau bằng Stockfish chạy trong Node, Sư tử/Đại bàng/Rồng (UCI_Elo) làm mốc, ước lượng Elo bot yếu bằng maximum likelihood (có prior để không chạy ra vô cực)
- [x] Adaptive difficulty: "⭐ Đối thủ gợi ý" = bot gần rating người chơi, +/−100 theo chuỗi thắng/thua (`core/bot/suggest.ts`)
- [x] **Hệ thống Rank — phần logic** (spec §6.7): 8 rank Đồng → Thách Đấu, bậc con III/II/I, mỗi bot là "trùm canh giữ" 1 rank
  - [x] `core/rating/`: Glicko-2, ánh xạ rating → rank/bậc con/tiến độ, luật trận thăng hạng, "sàn" rank, ván có gợi ý/đi lại = không tính điểm (+ unit test)
  - [x] Dữ liệu: `gameRating`, `rankFloor` trong profile (trận thăng hạng suy ra từ rating, không cần lưu `pendingPromotion`); `style`, `customElo`, `rated`, `ratingDelta`, `ratingAfter`, `promotion` trong GameRecord → Dexie v4 + `SAVE_SCHEMA_VERSION` 4 + migrate (có test). Tính điểm 1 lần trong transaction (`services/rating/gameRating.ts`)
  - [x] UI tạm (chưa cần huy hiệu đẹp): rank + thanh tiến độ ở Hồ sơ, icon rank trên header, "+/− điểm" ở màn kết quả & lịch sử, "Trùm hạng X" trên thẻ bot, banner trận thăng hạng, nhãn Tính điểm/Luyện tập + hỏi xác nhận trước khi dùng gợi ý/đi lại
  - [x] Dùng Elo bot đã hiệu chỉnh (`calibrate-bots`) để tính điểm. Lần chạy 2026-10-15 phát hiện Sói mạnh hơn Sư tử (thắng 7/8) → giảm độ sâu/tăng ngẫu nhiên cho Cáo & Sói; kết quả cuối: Rùa ≈640, Cáo ≈860, Sói ≈1230 < Sư tử 1400 → Elo mới Rùa 600, Cáo 850, Sói 1200
- [x] Game Review (`/review#<gameId>`, mở từ Lịch sử hoặc hộp kết quả): Stockfish depth 12 trên engine phân tích, lưu kết quả vào ván (`review`, không đổi thứ tự lịch sử); phân loại Best/Good/Inaccuracy/Mistake/Blunder theo % thắng bị mất (công thức Lichess), accuracy 2 bên, biểu đồ eval bấm để nhảy nước, phím ← →, hiện nước tốt nhất, **thử lại nước sai** (chấm bằng engine). `core/review/review.ts` + test; E2E
- [x] Sửa: trang mở bằng `<Link>` có `#hash` (Review, `/practice/themes#fork` từ bài học) đọc hash quá sớm → hook `useLocationHash`

## Phase 5 — Hoa hòe — ✅ code xong (2026-10-15)
- [x] Theme (spec §7.2) — asset **tự tạo, không tải** (chốt 2026-10-15):
  - [x] Asset tự vẽ: nền CSS (vân gỗ, cẩm thạch, lưới neon, pixel, trời sao + cực quang, cánh hoa), 3 bộ quân SVG tự vẽ (Tối giản, Viền neon, Ký tự) + bộ mặc định; kiểu nút bằng bo góc (không dùng skin ảnh 9-slice)
  - [x] 8 theme có sẵn (Classic, Gỗ, Cẩm thạch, Neon, Arcade, Fantasy, Sakura, Midnight)
  - [x] Nền theo theme: đã có lớp nền chung `body::before` đọc biến `--mc-backdrop-image/size/mask/opacity` (mặc định: caro mờ). Mỗi theme chỉ cần ghi đè các biến này (ảnh, gradient…)
  - [x] Tuỳ chỉnh từng phần: nền (theo chủ đề / trơn / màu / 5 dải màu / ảnh tự tải lên — thu nhỏ ≤1920px, lưu IndexedDB bảng `media`, không vào file save), 8 kiểu bàn, 4 bộ quân, tô sáng nước đi, 8 màu nhấn, kiểu nút, tốc độ hiệu ứng quân. Áp trước khi vẽ trang (boot script) để không nháy
  - [x] Thanh làm nhạt/làm mờ nền; nền động bằng canvas (cánh hoa, sao, hạt neon, pixel, bụi gỗ), dừng khi ẩn tab, tắt khi `prefers-reduced-motion`
  - [x] Bảng cài đặt nổi → Giao diện: lưới thẻ xem trước + bàn cờ xem trước trực tiếp, nút phóng to bảng
- [x] Ngôn ngữ (chọn trên menu): vi/en/ja; dịch đủ UI, thoại bot, quiz, bài học (18 bài × 3 ngôn ngữ); test kiểm đủ key/nội dung
- [x] Skill `add-theme` (CSS + preset + tên 3 ngôn ngữ, không asset ngoài) và skill `sync-i18n` (dịch key còn thiếu vi → en/ja theo GLOSSARY)
- [x] Animation, hiệu ứng chiếu/phong cấp: ô Vua bị chiếu nhấp nháy, ô phong cấp loé sáng, confetti khi thắng bot; theo cài đặt tốc độ hiệu ứng và `prefers-reduced-motion`
- [x] Âm thanh (spec §7.1) — **toàn bộ tổng hợp bằng Web Audio, không file** (không cần Howler):
  - [x] Nhạc tự sinh (`services/audio/music.ts` + công thức `musicTracks.ts`): 8 bài — menu, Learn, Practice, Puzzle Rush, 4 mức bot; bản "căng" = tham số `intensity` (nhanh hơn, sáng hơn, trống dày, drone); stinger thắng/thua/hòa/lên hạng trong SFX
  - [x] Nhạc nền theo màn + theo độ khó bot, crossfade khi chuyển màn, dừng khi ẩn tab
  - [x] SFX đầy đủ + UI click; sound pack (classic / arcade / fantasy)
  - [x] Căng thẳng động (đồng hồ < 30 s / eval thua nặng khi bật thanh đánh giá / trận thăng hạng; Rush 30 s cuối)
  - [x] Bảng cài đặt → Âm thanh: âm lượng Master/Nhạc/SFX/UI, chế độ nhạc auto/cố định/tắt, sound pack, nút nghe thử; nút loa tắt nhanh trên header
- [x] **Huy hiệu Rank — phần hình** (spec §6.7, bản phác đã duyệt: `docs/design/rank-emblems-draft.svg`):
  - [x] Component `RankEmblem` (SVG nhiều lớp, 8 bậc, nhiều kích thước) dựa trên bản phác; trau chuốt: dải màu kim loại, viền highlight, chi tiết chạm khắc, quân cờ vẽ vector thay ký tự
  - [x] Animation (tắt khi `prefers-reduced-motion`): vệt ánh kim chạy ngang, đá quý lấp lánh, cánh vỗ nhẹ, lửa/tia sáng xoay, hào quang Thách Đấu
  - [x] Màn lên hạng (huy hiệu cũ vỡ hạt → huy hiệu mới bay vào + confetti + âm thanh) và màn giới thiệu trùm trước trận thăng hạng
  - [x] Gắn huy hiệu vào header, Hồ sơ (kèm dải 8 hạng), thẻ bot, màn kết quả, lịch sử (trận thăng hạng)
  - [ ] (Tuỳ chọn, chưa làm) Brief cho designer/Midjourney để vẽ bản minh hoạ cao cấp; `RankEmblem` hỗ trợ `variant` để thay ảnh không sửa code
- [x] XP, streak, thành tích (achievement), trang Profile: `core/progress` (XP theo bài học/quiz/puzzle/Rush/ván cờ/xem lại, cấp độ, chuỗi ngày theo lịch, 25 thành tích) + `services/progress` (ghi tuần tự, toast); Dexie v6 + save v6; thẻ Cấp độ/Chuỗi ngày/Thành tích ở Hồ sơ
- [x] Responsive mobile hoàn chỉnh (đo tự động: không trang nào tràn ngang ở 375px); PWA: `app/manifest.ts` + icon PNG xuất từ SVG, service worker `public/sw.js` (trang: mạng trước/cache khi offline; asset, Stockfish, puzzle: cache trước) — chơi được offline cả đấu bot (E2E `offline.spec.ts`)

### Cập nhật sau Phase 5 (2026-10-16, theo góp ý)
- [x] Header: nút loa, chọn ngôn ngữ, nút người chơi cùng cao 32px
- [x] Huy hiệu: khung SVG vuông vừa khít từng hạng (căn giữa đúng cạnh chữ và trong dải hạng); Đồng/Bạc có vệt sáng nhẹ; dải 8 hạng ở Hồ sơ cùng cỡ, hạng hiện tại có viền + animation
- [x] Trang **Hướng dẫn** (`/guide`, có trên menu): vì sao chơi cờ, vì sao chơi ở đây, tính năng, lộ trình cho người mới, 3 loại điểm, bảng 8 hạng (huy hiệu động, khoảng điểm, bậc, trùm), luật thăng hạng, bảng XP, mẹo, hỏi đáp — số liệu đọc từ code nên luôn khớp luật; 3 ngôn ngữ; E2E

## Phase 5.5 — Giao diện kiểu game (chốt 2026-10-16) — ✅ code xong
Mục tiêu: app cảm giác như một game, không như website có thanh menu. Giữ nguyên logic, theme, âm thanh; chỉ đổi "vỏ" bố cục. URL giữ nguyên (Back/mở lại đúng màn vẫn chạy).
- [x] Bỏ thanh menu chữ. **Sảnh chính** (`/`): thẻ người chơi góc trên trái (avatar, cấp, huy hiệu, chuỗi 🔥 → Hồ sơ), loa + cài đặt + ngôn ngữ góc trên phải, 3 ô lớn Đấu cờ / Luyện tập / Học ở giữa, nút phụ Lịch sử / Hồ sơ / Hướng dẫn ở đáy
- [x] **HUD** cho các màn khác: nút ⌂ về sảnh + ← lùi một bước, tiêu đề màn, các nút icon (loa, cài đặt) — không còn thanh điều hướng dạng web; cài đặt mở dạng bảng nổi từ HUD
- [x] **Màn đấu cờ** (bot, 2 người) vừa khít màn hình, không cuộn: desktop — bàn cờ giữa tối đa chiều cao, thẻ đối thủ/người chơi + đồng hồ cạnh bàn, cột phải: trạng thái, danh sách nước, nút icon (gợi ý, đi lại, hòa, xin thua); mobile dọc — thẻ đối thủ trên, bàn rộng hết, thẻ mình dưới, dải nút icon có nhãn ở đáy
- [x] Puzzle (tính điểm, chủ đề, Rush, hằng ngày), Quiz, Xem lại ván: cùng bố cục "bàn giữa – điều khiển cạnh/đáy"
- [x] Các màn chọn (hub Luyện tập, Đấu cờ, Học, chọn bot) dạng ô lớn kiểu menu game; trang nhiều chữ (Hồ sơ, Lịch sử, Hướng dẫn) là bảng nổi trên sảnh
- [x] Chuyển cảnh mờ/trượt, nút có độ nảy; tôn trọng `prefers-reduced-motion`
- [x] Kiểm tra desktop + mobile: đo tự động không cuộn ở 1440×900 / 1366×768 (sảnh, đấu bot, 2 người, puzzle), không tràn ngang mobile; 40 E2E pass. Khung dùng chung: `components/ui/GameLayout` (bàn giữa, thẻ trên/dưới, cột phải; dải nút cố định đáy trên mobile), `MenuTile`, `HudIconButton`
- [x] Vòng góp ý sau Phase 5.5: HUD dính đầu trang (nền mờ dần), bỏ trùng nút back (HUD chỉ còn ⌂, trang tự có "← màn cha"); **chọn bot kiểu chọn nhân vật** (sân khấu bot + sức mạnh + rank canh giữ + câu thoại, ◀ ▶ / phím ← →, dải roster, cột tùy chọn); Hồ sơ dạng grid 2 cột full-width trên desktop; hàng 8 rank chỉ làm sáng rank hiện tại; hệ chuyển động thống nhất (`--mc-ease`/`--mc-dur*`, `.mc-press`, `.mc-lift` hover nhấc thẻ, `.mc-pop`); con trỏ `pointer` đồng nhất cho mọi phần tử bấm được
- [x] Vòng góp ý 2: tiêu đề màn + nút ← đưa lên hàng HUD cạnh ⌂ (`components/ui/PageHeader`, portal vào slot của shell; mobile xuống hàng 2); hết nháy thanh cuộn khi chuyển cảnh (scene-in dùng scale thay vì trượt xuống + `scrollbar-gutter: stable`); mục lục Hướng dẫn sáng theo đoạn đang đọc (scroll-spy); huy hiệu rank dùng chung một khung nên khiên mọi hạng cùng cỡ, bảng hạng thẳng cột; thêm 22 thành tích (tổng 47) chia 5 nhóm Học / Câu đố / Đấu bot / Hạng / Chăm chỉ
- [x] Vòng góp ý 3: nút ⌂/← trên HUD đổi sang icon màu 🏠 ⬅️ như các nút khác; hàng 8 rank chia ô đều (grid 8 cột), rank hiện tại to hơn chút; quân cờ trong huy hiệu dùng bộ "ký tự" (Unicode, kèm U+FE0E); **100 thành tích** (thêm chỉ số: quiz tuyệt đối, câu hỏi tự sinh, puzzle chủ đề, điểm đấu bot, phong cách bot đã thắng) hiển thị theo tab nhóm + khung cuộn; ô menu nổi bật dùng nền accent nhạt
- [x] Vòng góp ý 4: tiêu đề HUD chỉ còn chữ (bỏ emoji, thẳng hàng với dòng màn cha); chọn bot — mọi thẻ bot xếp chồng trong một ô lưới nên khung luôn cao bằng thẻ cao nhất (không nhảy khi sang Tuỳ chỉnh có thanh Elo), dải roster tự cuộn để thẻ đang chọn luôn hiện đủ, icon bot Tuỳ chỉnh đổi thành 🌟; popup Cài đặt: khung bo tròn overflow-hidden, tiêu đề cố định, chỉ phần nội dung cuộn bên trong
- [x] Vòng góp ý 5: màn chọn bot cao hết màn hình (khung bot giãn theo cột), chân dung bot có vòng sáng xoay + quầng + bóng đế thay viền xanh cứng, mũi tên ⬅️ ➡️ màu, thẻ đối đầu "Bạn VS bot" trên nút Bắt đầu; huy hiệu Tinh Anh / Cao Thủ / Thách Đấu: bỏ vòng tia xoay, thay bằng dải sáng chạy quanh viền (1 / 2 / 3 dải, nhanh và sáng dần), Cao Thủ + Thách Đấu có viền phát sáng nhịp thở, hào quang và sao lấp lánh, Thách Đấu có vệt ánh kim quét nhanh hơn
- [x] Vòng góp ý 6: huy hiệu Thách Đấu vẽ lại toàn vàng kim (viền nhiều dải ánh, mặt khiên vàng toả sáng), hai đôi cánh rồng vàng (xương cánh + màng võng, đầu nhọn; đôi trên lớn, đôi dưới nhỏ), bỏ vòng lá xanh
- [x] Sửa lớp phủ popup chỉ phủ khung trang: `.mc-scene` dùng fill `backwards` (transform giữ lại sau animation biến `main` thành containing block của phần tử fixed); `Modal` và lớp phủ lên hạng / trùm render qua portal vào `body`
- [x] Popup Cài đặt: bỏ icon cạnh tiêu đề; neo ngay dưới nút ⚙️ (cách 8px như dropdown ngôn ngữ, mép phải thẳng mép nút); phóng to giữ mép phải, chỉ giãn rộng sang trái có animation, nội dung chia 2 cột (container query) thay vì kéo dãn; thẻ theme cỡ cố định; nút "Theo chủ đề" cao bằng ô màu tròn
- [x] Popup Cài đặt (tiếp): mép phải đo trực tiếp trên popup nên thẳng mép nút ⚙️ kể cả khi có thanh cuộn; phóng to giãn tới mép trái khung trang (thẳng nút ⌂), 2 cột 50:50; dòng cài đặt tự xếp nhãn-trên/điều-khiển-dưới khi cột hẹp (container query)
- [x] Theme thứ 10 **Nhựa thông** (`rosin`, kiểu bàn nhựa mã não xanh–trắng): ô xanh đại dương + ô trắng ngọc trai có vân mã não (biến tuỳ chọn `--mc-board-*-texture`, preset bàn cờ tự bỏ vân), nền cẩm thạch trắng có vòng vân xanh; lưới theme 5 cột và khung xem trước giãn full width trở lại; nút xem trước ghi rõ "Nút chính" / "Nút phụ"
- [x] Bộ quân **Nhựa** (`resin`) đi kèm theme Nhựa thông: thân trong mờ trắng ngọc trai / xanh đại dương, vân mã não bên trong, vệt bóng, viền đậm; quân xanh có viền sáng bao ngoài để đọc rõ trên ô xanh

### Phase 5.6 — Bộ quân theo chủ đề — ✅ code xong (2026-10-17)
Mỗi theme có một bộ quân riêng, khác cả **hình dáng** lẫn **chất liệu**; lựa chọn "Bộ quân: Theo chủ đề" (mặc định) để đổi theme là đổi quân. Tự vẽ SVG (`components/board/pieceArt/`), không tải asset. Khung chung kiểu Staunton để người mới vẫn nhận ra quân.
- [x] Hạ tầng: `pieceSet: 'theme'` (mặc định) + `THEME_PIECE_SET` / `resolvePieceSet` trong core (có test); Dexie v7 + save v7 chuyển mặc định cũ "classic" → "theme"; Cài đặt chọn bộ quân bằng lưới thẻ có hình Mã trắng + Vua đen (`PieceSetPreview`), thẻ "Theo chủ đề" ghi bộ đang áp dụng
- [x] Cổ điển: giữ bộ Staunton của react-chessboard
- [x] Gỗ (`wood`): quân tiện — chân rộng có rãnh, thân tiện, đầu tròn, mã chạm; vân gỗ, sồi sáng / óc chó sẫm
- [x] Nhựa thông (`resin`): Staunton đúc thon cao, trong mờ, vân xoáy, vệt bóng; quân xanh có viền sáng
- [x] Cẩm thạch (`marble`): đá chạm — đế vuông vát, cạnh thẳng, đầu tốt bát giác, chóp kim cương, mặt vát đổ bóng, vân đá trắng / đen
- [x] Neon (`outline`): ống neon hình học — tốt tròn + tam giác, xe tháp thẳng, mã gấp khúc, tượng kim cương, hậu vương miện 5 cánh, vua hình thang + thập tự; cyan / magenta, quầng sáng nhấp nháy theo nhịp lệch pha từng quân; mã là đầu ngựa cong (mõm, tai, bờm), tượng là mũ mitre tròn có quả cầu + khe chéo
- [x] Arcade (`pixel`): sprite 12×12, viền + bóng tự sinh, bảng màu Game Boy
- [x] Huyền ảo (`fantasy`): lính cầm khiên, tháp lâu đài cắm cờ, rồng, pháp sư mũ nhọn cầm gậy, nữ hoàng có cánh, vua phù thuỷ cầm quyền trượng; ngà vàng / tím thạch anh
- [x] Hoa anh đào (`sakura`): kokeshi, chùa nhiều mái cong, ngựa tua đỏ, đèn lồng đá, thiếu nữ kimono cài trâm, lãnh chúa vai kamishimo đội eboshi; sứ hoa hồng / sơn mài đen
- [x] Nửa đêm (`midnight`): kim loại Art Deco — cao, cạnh thẳng vát sắc, đầu tốt lục giác, xe khía chữ V, tượng hình lưỡi, vua có thập tự liền khối; bạc / đen bóng, ánh xanh lạnh
- [x] Huy hiệu rank: quân giữa vẽ bằng SVG (dáng Staunton của bộ Gỗ, phẳng một màu theo bảng màu hạng, viền sáng) thay cho ký tự Unicode — giống nhau trên mọi máy
- [x] Bỏ 2 bộ "Tối giản" và "Ký tự" cho khớp 1 theme – 1 bộ (Dexie v8 + save v8 chuyển người đang dùng sang "Theo chủ đề"); lưới chọn 5 thẻ/hàng, thẻ cao bằng nhau

## Phase 6 — 3D — ✅ code xong (2026-10-17)
Quyết định: [ADR 0008](adr/0008-procedural-3d-board.md) — three + react-three-fiber, quân dựng bằng code (không tải model), tải lười.
- [x] Spike: react-three-fiber; quân tự dựng — tiện tròn (`LatheGeometry`) từ profile Staunton của bộ Gỗ, đầu ngựa đùn từ đường SVG, xe có răng thành, vua có thập tự (`components/board3d/geometry.ts`)
- [x] Ánh xạ ô ↔ toạ độ 3D, quân từ FEN, nước được animate (nhập thành kéo cả xe, bỏ qua khi đi lại/ván mới), quỹ đạo nhảy vòng cung cho mã (`core/board3d`, có test); raycast bấm để đi (chọn quân → chấm/vòng nước đi → bấm ô), phong cấp dùng lại bảng chọn 2D
- [x] Camera xoay (OrbitControls, không pan, giới hạn góc/khoảng cách), 3 góc đặt sẵn (nghiêng / từ trên / thấp) chuyển mượt, xoay theo chiều bàn; ánh sáng bán cầu + đèn hướng có bóng đổ; màu bàn và highlight đọc từ theme, chất liệu quân theo bộ quân
- [x] Bật/tắt 2D/3D: cài đặt "Kiểu bàn cờ" (Dexie v9 + save v9, mặc định 2D) + nút nhanh "3D"/"2D" trên bàn; chỉ bàn chơi chính (đấu bot, 2 người, puzzle, xem lại ván); bài học/quiz/xem trước giữ 2D; chunk 3D chỉ tải khi bật; không có WebGL → 2D
- [x] Kéo-thả trong 3D: nhấn giữ quân → quân nhấc lên đi theo con trỏ, ô sắp thả có vòng đánh dấu, camera ngừng xoay khi kéo; thả vào ô hợp lệ là đi (không trượt lại lần nữa); bấm-để-đi vẫn dùng được
- [x] Quân 3D theo từng theme: Staunton tiện (cổ điển/gỗ), Staunton đúc thon (nhựa), tiện 8 cạnh vát + chóp bát diện (đá), tiện 6 cạnh Art Deco (kim loại), khung dây phát sáng (neon), voxel từ sprite 12×12 (arcade), tượng đùn từ hình nhân vật 2D (huyền ảo, Nhật Bản) — hình lấy chung dữ liệu với bộ 2D
- [x] Tự tắt 3D trên máy yếu: ≤ 2 nhân CPU / ≤ 2 GB RAM / bật tiết kiệm dữ liệu → luôn 2D (Cài đặt ghi rõ lý do); đang chạy mà FPS trung bình < 24 → tự chuyển 2D kèm thông báo (`core/board3d/perf`, có test)
- [x] Hoạ tiết 3D như 2D (`components/board3d/textures.ts`, vẽ canvas, không file ảnh): mặt bàn theo theme — vân gỗ, vân đá, vân mã não, kim loại xước, pixel, lưới neon (4 biến thể mỗi màu ô); khung bàn dày hơn cùng hoạ tiết; quân có vân gỗ / vân xoáy nhựa / vân đá / kim loại xước; voxel pixel tô viền + bóng như sprite
- [x] Huyền ảo & Hoa anh đào dựng lại thành tượng tròn nhiều phần (`figures.ts`) — thân tiện, đầu cầu, mũ/mái nón, khiên, cánh, hoa, đai obi, cửa sổ đèn lồng phát sáng — tô màu theo phần như 2D; tượng quay mặt về phía người xem
- [x] Hoạ tiết vẽ tay trên quân 3D: rãnh tiện sẫm (gỗ, cổ điển), khe mũ tượng, vòng sáng xanh (kim loại), mắt + bờm quân mã, mắt/má cho tượng nhân vật; quân mã mọi bộ là đầu ngựa đùn bo tròn và vuốt thon (không còn tấm dẹt)
- [x] Neon 3D: thân kính tối trong mờ + đường viền phát sáng (EdgesGeometry), nhấp nháy theo nhịp lệch pha từng loại quân như 2D (tắt khi giảm chuyển động)
- [x] Chế độ "Phóng to bàn cờ" (desktop, nhớ theo trình duyệt): bàn to tới 1000px theo chiều cao màn, nút chức năng thu thành thanh icon dưới bàn, nước đi & thông tin mở bằng ngăn kéo bên phải
- [x] Quân mã 3D nặn tròn (cổ + đầu loft theo đường cong, má, tai, bờm, mắt, lỗ mũi) cho mọi bộ trừ pixel; bỏ vòng tròn trên quân cổ điển/gỗ/nửa đêm
- [x] Bố cục phóng to mới (màn rộng ngang, biến thể CSS `wide:`): bàn cao hết màn, nút dọc bên trái (chỉ icon dưới 1280px), thẻ người chơi/bot/trạng thái + nước đi sang cột phải; tablet dọc & điện thoại giữ bố cục xếp chồng; tiêu đề HUD cho màn đấu bot
- [x] Điện thoại xoay ngang (biến thể CSS `short:`): 2 cột — bàn cờ bên trái cao hết màn, thanh nút + thẻ người chơi/bot + nước đi bên phải (không còn dock đáy); cả cảnh cao đúng bằng bàn cờ, cột phải gọn (thanh nút 1 hàng, nước đi tự cuộn) nên không phải cuộn trang
- [x] Thanh đánh giá: màn rộng/xoay ngang là thanh lớn trong cột phải (ngay dưới checkbox) kèm số và một câu nhận xét thế cờ (`core/engine/evalVerdict.ts`), điện thoại dọc là dải mỏng trên bàn — không còn làm hẹp bàn cờ
- [x] Thanh đánh giá màu theo theme (phần của bạn màu accent), nhận xét 3 cách nói mỗi mức và tách giọng bạn/bot; nút "Đổi đối thủ" vào cột nút; huy hiệu rank + điểm ở thẻ người chơi khi đấu bot
- [x] Thanh đánh giá + nhận xét cho màn xem lại ván; thẻ bot đeo màu kim loại của hạng nó canh giữ (viền + Elo trên bảng kim loại + huy hiệu); mục lục hướng dẫn cuộn mượt và nháy tiêu đề mục; hồ sơ: thẻ cấp/thành tích cao bằng cột trái, nút đổi/xoá người chơi xuống dưới
- [x] Huy hiệu rank nghiêng theo chuột + vệt sáng (mọi nơi), xoay 360° ở màn lên hạng; thẻ bot trong trận bỏ huy hiệu (giữ viền + bảng Elo); màn chọn bot: tag "Trùm hạng" ở mép trên, dãn dòng; bàn 3D: canvas phủ toàn màn hình sau trang (camera fit theo khung bằng view offset, chuột nhận trong khung, thẻ/HUD nằm trên; GPU tích hợp vẫn 60 FPS)
- [x] Thẻ người chơi/bot đang tới lượt có viền nhấp nháy nhẹ (màu kim loại hạng với bot, màu accent với người chơi); màn 2 người cùng máy: dòng trạng thái phát sáng màu accent khi tới lượt người ngồi dưới, màu quân đối phương khi tới lượt đối phương; màn xem lại: thẻ độ chính xác của bên tới lượt ở thế cờ đang xem cũng phát sáng; câu đố: ô trạng thái phát sáng (accent khi tới lượt giải, màu quân đối phương khi câu đố đáp); quầng sáng mảnh hơn; biểu đồ đánh giá bo 4 góc, chấm lỗi tròn đều
- [x] Lịch sử ván làm lại: rộng theo container, tổng số ván + tỉ lệ thắng, lọc Tất cả/Thắng/Thua/Hòa, lưới thẻ (vạch màu kết quả, Elo trên bảng kim loại hạng trùm, chip thông tin, nút Xem lại/Sao chép PGN ở chân thẻ); cột phải màn chơi cuộn không hiện thanh (không lệch với thẻ bên dưới)
- [x] Cột phải màn chơi (bot, 2 người, xem lại) cao đúng bằng hàng bàn cờ: thẻ nước đi cao vừa nội dung, chỉ co lại và tự cuộn bên trong khi hết chỗ, trang không cuộn; thiếu chỗ (xoay ngang thấp) thì cả cụm cột phải cuộn kể cả biểu đồ. Đã thử 1440×900, 1280×720, 1024×768, 956×440, 844×390, 390×844; xoay ngang: nội dung cuộn dừng dưới thanh nút một khoảng
- [x] Thẻ "Thử lại nước sai" thu gọn còn 4 nước + "Xem thêm n"/"Thu gọn"; điện thoại hết lẹm quầng sáng thẻ; hướng dẫn: hỏi đáp mở/đóng mượt (accordion `.mc-accordion` dùng chung), các mục có vạch phân cách và thoáng hơn, mục lục trên điện thoại/tablet thành hàng tab dính dưới HUD (biến `--mc-hud-h`), tự cuộn tới tab đang đọc
- [x] Điện thoại: thanh đánh giá dùng kiểu lớn trong cột thông tin như desktop (bỏ dải mỏng trên bàn); HUD dưới lg là thanh mờ đặc (backdrop-blur), tiêu đề không có nút Back nằm cạnh ⌂, có Back thì xuống hàng riêng; hàng tab hướng dẫn nối liền HUD
- [x] Nền theme Cẩm thạch: vân đá chéo bằng SVG noise (lớp nền riêng, vẽ một lần)
- [x] Camera tự tính khoảng cách để cả 4 góc khung bàn và đỉnh quân hàng xa luôn nằm trong khung (hết lẹm góc)
- [x] Bố cục bàn chơi desktop 3 cột: nút chức năng xếp dọc bên trái, bàn cờ giữa (to nhất theo chiều cao/rộng), nước đi & thông tin bên phải; mobile giữ dải nút đáy

## Deploy — khi tính năng hòm hòm (dự kiến sau Phase 3 hoặc Phase 5)
- [ ] Vercel → Add New Project → Import repo `nguyenquan6196/master-chess` (Next.js tự nhận, không cần cấu hình)
- [ ] Vercel → Settings → Domains → thêm `chess.mrquannguyenn.net`; DNS tên miền thêm `CNAME chess → (giá trị Vercel hiển thị)`, kiểm tra SSL
- [ ] Bật Speed Insights (package `@vercel/speed-insights` đã cài sẵn)
- [ ] Kiểm tra Stockfish WASM chạy trên bản deploy (desktop + điện thoại)

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
- [ ] Stockfish WASM chạy trong worker (local), đo thời gian `go depth 12` trên laptop và điện thoại
- [ ] Bot mức 250 Elo thực sự "dễ" khi tự chơi thử
- [ ] react-chessboard hoạt động mượt trên mobile (tap-to-move)
- [ ] Build puzzle JSON từ CSV lichess, kiểm tra kích thước
- [ ] Render 1 bài MDX có bàn cờ tương tác
- [ ] Đo bundle size của react-chessboard + chess.js + Next.js khung → xác nhận budget 170 KB trang chủ là khả thi
