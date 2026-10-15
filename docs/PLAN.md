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

## Phase 4 — Bot persona & Game Review
- [ ] Style bonus từ MultiPV (Tấn công / Phòng thủ / Thế trận / Hỗn loạn / Cân bằng)
- [ ] Opening book riêng mỗi persona (`scripts/build-book.ts` từ PGN)
- [ ] Ma trận chọn bot = Độ khó × Phong cách; chế độ Custom (slider Elo)
- [ ] Thoại bot theo sự kiện
- [ ] `scripts/calibrate-bots.ts`: cho bot tự đấu với Stockfish UCI_Elo để hiệu chỉnh Elo
- [ ] Adaptive difficulty (gợi ý bot tiếp theo dựa trên kết quả)
- [ ] **Hệ thống Rank — phần logic** (spec §6.7): 8 rank Đồng → Thách Đấu, bậc con III/II/I, mỗi bot là "trùm canh giữ" 1 rank
  - [ ] `core/rating/`: Glicko-2, ánh xạ rating → rank/bậc con/tiến độ, luật trận thăng hạng, "sàn" rank, ván có gợi ý/đi lại = không tính điểm (+ unit test)
  - [ ] Dữ liệu: `rating`, `rankFloor`, `pendingPromotion` trong profile; `rated`, `ratingDelta` trong GameRecord → Dexie v2 + `SAVE_SCHEMA_VERSION` 2 + migrate
  - [ ] UI tạm (chưa cần huy hiệu đẹp): rank + thanh tiến độ ở Hồ sơ, "+/− điểm" ở màn kết quả, "Ngang hạng X" trên thẻ bot, màn trận thăng hạng
  - [ ] Dùng Elo bot đã hiệu chỉnh (`calibrate-bots`) để tính điểm
- [ ] Game Review: phân loại nước (Best/Good/Inaccuracy/Mistake/Blunder), accuracy, biểu đồ eval, "thử lại nước sai"

## Phase 5 — Hoa hòe
- [ ] Theme (spec §7.2):
  - [ ] Tìm/tạo asset: ảnh nền chất lượng cao (desktop + mobile), texture bàn, 3–5 bộ quân có license phù hợp, skin nút (gỗ/cuộn giấy dạng 9-slice); ghi `CREDITS.md`
  - [ ] 8 theme có sẵn (Classic, Gỗ, Cẩm thạch, Neon, Arcade, Fantasy, Sakura, Midnight)
  - [ ] Nền theo theme: đã có lớp nền chung `body::before` đọc biến `--mc-backdrop-image/size/mask/opacity` (mặc định: caro mờ). Mỗi theme chỉ cần ghi đè các biến này (ảnh, gradient…)
  - [ ] Tuỳ chỉnh từng phần: nền (màu đơn sắc / gradient / ảnh / ảnh tự tải lên), bàn cờ, bộ quân, highlight & mũi tên, màu nhấn, kiểu nút
  - [ ] Thanh làm tối/làm mờ nền; nền động (cánh hoa, hạt) tôn trọng `prefers-reduced-motion`
  - [ ] Bảng cài đặt nổi → Giao diện: lưới thẻ xem trước + live preview trên bàn cờ mẫu (có thể mở rộng bảng thành toàn màn hình)
- [ ] Ngôn ngữ (chọn trên menu): vi/en/ja; dịch đủ UI, thoại bot, quiz; bài học dịch dần (fallback + thông báo)
- [ ] Skill `add-theme` (manifest + asset + CREDITS) và skill `sync-i18n` (dịch key còn thiếu vi → en/ja theo GLOSSARY)
- [ ] Animation, hiệu ứng chiếu/phong cấp
- [ ] Âm thanh (spec §7.1):
  - [ ] Tìm/tạo asset: SFX (CC0), nhạc menu, Learn, Practice, Puzzle Rush, 4 mức bot (+ bản "căng" cho mỗi mức), stinger thắng/thua/hòa; ghi `CREDITS.md`
  - [ ] Nhạc nền theo màn + theo độ khó bot, crossfade khi chuyển màn, dừng khi ẩn tab
  - [ ] SFX đầy đủ + UI click; sound pack (classic / arcade / fantasy)
  - [ ] Căng thẳng động (đồng hồ < 30 s / eval thua nặng)
  - [ ] Bảng cài đặt → Âm thanh: âm lượng Master/Nhạc/SFX/UI, chế độ nhạc auto/cố định/tắt, sound pack, nút nghe thử; nút loa tắt nhanh trên header
- [ ] **Huy hiệu Rank — phần hình** (spec §6.7, bản phác đã duyệt: `docs/design/rank-emblems-draft.svg`):
  - [ ] Component `RankEmblem` (SVG nhiều lớp, 8 bậc, nhiều kích thước) dựa trên bản phác; trau chuốt: dải màu kim loại, viền highlight, chi tiết chạm khắc, quân cờ vẽ vector thay ký tự
  - [ ] Animation (tắt khi `prefers-reduced-motion`): vệt ánh kim chạy ngang, đá quý lấp lánh, cánh vỗ nhẹ, lửa/tia sáng xoay, hào quang Thách Đấu
  - [ ] Màn lên hạng (huy hiệu cũ vỡ hạt → huy hiệu mới bay vào + confetti + âm thanh) và màn giới thiệu trùm trước trận thăng hạng
  - [ ] Gắn huy hiệu vào header, Hồ sơ, thẻ bot, màn kết quả, lịch sử
  - [ ] (Tuỳ chọn) Brief cho designer/Midjourney để vẽ bản minh hoạ cao cấp; `RankEmblem` hỗ trợ `variant` để thay ảnh không sửa code
- [ ] XP, streak, thành tích (achievement), trang Profile
- [ ] Responsive mobile hoàn chỉnh; PWA (chơi offline)

## Phase 6 — 3D
- [ ] Spike: react-three-fiber + model GLTF quân cờ (CC0 hoặc tự dựng)
- [ ] Ánh xạ ô ↔ toạ độ 3D, raycast click-to-move, animation di chuyển
- [ ] Camera orbit, preset góc nhìn, ánh sáng/bóng đổ
- [ ] Toggle 2D/3D, lazy-load bundle, fallback khi máy yếu

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
