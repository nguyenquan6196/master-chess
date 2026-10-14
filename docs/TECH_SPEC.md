# Master Chess — Tech Spec

> Phiên bản: 0.1 (draft) · Ngày: 2026-10-13
> Tham khảo UX: chess.com, lichess.org

## 1. Mục tiêu & phạm vi

Web app cờ vua chạy hoàn toàn trên trình duyệt, deploy lên Vercel, gồm 3 module chính:

| Module | Mục đích | Nội dung chính |
|---|---|---|
| **Learn** (Học) | Lý thuyết có cấu trúc | Quân cờ, cách đi, giá trị, luật đặc biệt, khai cuộc/trung cuộc/tàn cuộc cơ bản, mẹo & lỗi thường gặp |
| **Practice** (Luyện tập) | Củng cố bằng bài tập | Quiz trắc nghiệm, Puzzle (tìm nước đi tốt nhất), bài tập tương tác trong bài học |
| **Play vs Bot** (Đấu bot) | Thực chiến | Chọn độ khó + phong cách bot, gợi ý, undo, phân tích ván sau khi chơi |

**Yêu cầu xuyên suốt:** performance tốt, dễ scale, dễ maintain — có budget đo được và được CI kiểm tra tự động, xem **§13**.

**Ngoài phạm vi MVP:** chơi online người–người (PvP realtime), tài khoản/đồng bộ cloud, xếp hạng toàn cầu. Để mở đường cho giai đoạn sau (xem §10).

## 2. Kiến trúc tổng quan

```
┌──────────────────────────── Browser ─────────────────────────────┐
│  Next.js (React) UI                                              │
│   ├─ Board (2D: react-chessboard  |  3D: react-three-fiber)      │
│   ├─ Learn pages (MDX)                                           │
│   ├─ Practice (Quiz / Puzzle runner)                             │
│   └─ Play (Game controller)                                      │
│                                                                  │
│  Game core (TS thuần, không phụ thuộc UI)                        │
│   ├─ chess.js: luật, sinh nước hợp lệ, FEN/PGN, chiếu/hết cờ     │
│   ├─ BotController: persona → tham số engine → chọn nước         │
│   └─ Evaluator: chấm nước đi (best / good / inaccuracy / blunder)│
│                                                                  │
│  Web Worker: Stockfish (WASM, UCI)                               │
│  Storage: IndexedDB (Dexie) – tiến độ, lịch sử ván, puzzle rating│
└──────────────────────────────────────────────────────────────────┘
          ▲ static assets (JS, WASM, JSON puzzles, ảnh/âm thanh)
          │
      Vercel (static + edge, không cần backend ở MVP)
```

Điểm mấu chốt: **engine chạy ở client** → không tốn server, không giới hạn số người chơi, hoạt động được offline (PWA).

## 3. Tech stack

| Hạng mục | Lựa chọn | Lý do / Ghi chú |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Deploy Vercel 1-click, SSG cho trang Learn, tốt cho SEO |
| Styling | **Tailwind CSS** + shadcn/ui | Nhanh, dễ làm theme sáng/tối, nhiều skin bàn cờ |
| Animation | Framer Motion | Hiệu ứng di chuyển, confetti khi giải puzzle |
| Luật cờ | **chess.js** (BSD-2) | Chuẩn de-facto, có FEN/PGN, SAN, kiểm tra chiếu/hết/hòa |
| Bàn cờ 2D | **react-chessboard** (MIT) | Kéo-thả, click-to-move, mũi tên, highlight ô, custom pieces. (Thay thế: chessground – GPL, đẹp hơn nhưng ràng buộc license) |
| Bàn cờ 3D | **react-three-fiber + drei** | Model quân cờ GLTF; chế độ tuỳ chọn, lazy-load |
| Engine | **Stockfish 19 WASM – bản "lite single-thread"** (~1.9 MB, stockfish.js) trong Web Worker | Không cần header COOP/COEP; bản multi-thread mạnh hơn nhưng cần cấu hình header |
| State | Zustand | Nhẹ, đủ cho game state + settings |
| Lưu trữ | IndexedDB qua **Dexie** | Tiến độ học, lịch sử ván (PGN), puzzle rating |
| Nội dung bài học | **MDX** + component nhúng `<InteractiveBoard fen=... />` | Viết lý thuyết như markdown, chèn bàn cờ tương tác |
| Puzzle data | **Lichess puzzle DB** (CC0, ~4–5 triệu bài) | Lọc trước ~5–20k bài, chia file JSON theo rating/theme |
| Âm thanh | Phase 1: Web Audio tổng hợp (`src/services/audio/sfx.ts`); Phase 5: Howler.js cho nhạc nền | Tiếng đi quân, ăn quân, chiếu |
| i18n | use-intl (vi/en/ja), client-side — ADR 0005 | Tiếng Việt mặc định, xem §7.4 |
| Font | next/font/google: Be Vietnam Pro, Baloo 2, Noto Sans JP… | Xem §7.3 |
| Theme | CSS variables + manifest JSON | Xem §7.2 |
| Test | Vitest (core), Playwright (E2E) | |
| PWA | next-pwa / Serwist | Chơi offline với bot |

## 4. Module Learn

### 4.1 Cấu trúc nội dung
```
content/learn/
  01-basics/
    01-board-and-notation.mdx      # bàn cờ, toạ độ, ký hiệu
    02-pawn.mdx                    # cách đi, phong cấp, bắt tốt qua đường
    03-knight.mdx ... 07-king.mdx
    08-piece-values.mdx            # giá trị quân
  02-rules/
    castling.mdx, en-passant.mdx, promotion.mdx,
    check-checkmate-stalemate.mdx, draw-rules.mdx (3 lần lặp, 50 nước, thiếu quân)
  03-principles/
    opening-principles.mdx, tactics-intro.mdx (ghim, xiên, chĩa đôi, phát hiện...)
    basic-endgames.mdx (Q+K vs K, R+K vs K, tốt vs vua)
  04-openings/ (Italian, Sicilian, Queen's Gambit, London...)
```

### 4.2 Mỗi bài học gồm
- Frontmatter: `title, level, duration, tags, prerequisites`.
- Phần lý thuyết (text + hình/sơ đồ).
- **Bàn cờ minh hoạ**: highlight các ô quân có thể đi, mũi tên.
- **"Thử ngay"**: mini-bài tập (vd: "đưa mã từ b1 tới h8 trong ít nước nhất") — kiểm tra bằng chess.js.
- **Chú ý / lỗi hay gặp** (callout box).
- Cuối bài: 3–5 câu quiz → đánh dấu hoàn thành.

### 4.3 Component chính
- `<InteractiveBoard fen arrows highlights allowMoves onMove expectedMoves />`
- `<MoveSequence pgn />` — trình chiếu từng bước với nút ◀ ▶.
- `<Callout type="tip|warning|rule">`.

## 5. Module Practice

### 5.1 Quiz
- Câu hỏi JSON: trắc nghiệm text, hoặc **"click vào ô"** (vd: "Quân mã ở e4 có thể đi tới những ô nào?").
```ts
type Quiz = {
  id: string; topic: string; level: 1|2|3;
  kind: 'choice' | 'select-squares' | 'make-move';
  prompt: string; fen?: string;
  choices?: string[]; answer: string | string[];
  explanation: string;
};
```

### 5.2 Puzzle
- Nguồn: `lichess_db_puzzle.csv` (FEN, Moves, Rating, Themes, Popularity...). Script `scripts/build-puzzles.ts` lọc theo popularity cao, chia bucket rating 400–2800 bước 200 và theo theme (`fork`, `pin`, `mateIn1`, `mateIn2`, `endgame`...).
- Xuất ra `public/puzzles/{theme}/{bucket}.json` (mỗi file ≤ 500 bài) → load lười.
- Chế độ:
  - **Puzzle Rated**: rating người dùng (Glicko-2 đơn giản) → chọn puzzle gần rating.
  - **Theme Training**: luyện theo chủ đề.
  - **Puzzle Rush**: giải càng nhiều càng tốt trong 3/5 phút, sai 3 lần thì dừng.
  - **Daily Puzzle**: chọn theo seed ngày.
- Logic: nước đầu tiên trong `Moves` là nước của đối thủ (auto-play), sau đó người dùng phải đi đúng; **chấp nhận nước khác nếu cũng là chiếu hết** (kiểm tra bằng chess.js).
- Gợi ý: lần 1 highlight quân cần đi, lần 2 hiện mũi tên.

## 6. Module Play vs Bot — trọng tâm kỹ thuật

### 6.1 Trả lời câu hỏi: "Độ khó dựa vào đâu? Tự thiết lập hay dùng AI model?"

**Khuyến nghị: tự thiết lập dựa trên engine Stockfish + lớp "persona" do mình viết.** Không dùng LLM (ChatGPT/Claude…) để chọn nước đi vì:
- LLM chơi cờ kém ổn định, hay đi nước không hợp lệ, độ mạnh không kiểm soát được.
- Tốn phí API mỗi nước, có độ trễ, cần backend giữ API key.

LLM **có thể** dùng ở giai đoạn sau cho việc khác: *bình luận/giải thích* ván cờ bằng ngôn ngữ tự nhiên dựa trên output của Stockfish (xem §10).

### 6.2 Các "núm vặn" độ khó (đã có sẵn trong Stockfish)

| Tham số | Ý nghĩa | Dải |
|---|---|---|
| `Skill Level` | Stockfish cố tình chọn nước kém hơn | 0–20 |
| `UCI_LimitStrength` + `UCI_Elo` | Giới hạn theo Elo | ~1320–3190 |
| `depth` / `movetime` | Giới hạn độ sâu / thời gian nghĩ | depth 1–20+, 50 ms–3 s |
| `MultiPV` | Lấy N nước tốt nhất kèm điểm | 1–5 |

Vì Stockfish ở Elo thấp nhất vẫn ~1300 (quá mạnh với người mới), cần **lớp tự viết cho mức < 1300**:

```
chọn nước(position, persona):
  candidates = stockfish.go(depth=persona.depth, multipv=persona.multiPV)   // top N kèm eval
  if random() < persona.blunderRate:
       pick = random trong các nước hợp lệ (hoặc nước tệ vừa phải)
  else:
       score_i = eval_i + persona.styleBonus(move_i)        // xem 6.3
       pick = softmax(score_i / persona.temperature)        // temperature cao → "người" hơn, hay sai hơn
  delay theo persona.thinkTime (giả lập suy nghĩ)
```

### 6.3 Bảng mức độ khó đề xuất (Elo ước lượng)

| Bot | Elo ~ | Cấu hình |
|---|---|---|
| 🐣 Gà con | 250 | 60% nước ngẫu nhiên, còn lại depth 1 |
| 🐢 Rùa | 500 | blunderRate 30%, depth 2, temperature cao |
| 🦊 Cáo | 800 | blunderRate 15%, depth 4, MultiPV 4 |
| 🐺 Sói | 1100 | blunderRate 6%, depth 6 |
| 🦁 Sư tử | 1400 | `UCI_Elo=1400` |
| 🦅 Đại bàng | 1800 | `UCI_Elo=1800` |
| 🐉 Rồng | 2200 | `UCI_Elo=2200` |
| 👑 Master | 2800+ | Full strength, movetime 1–2 s |

Ngoài ra cho phép **"Custom"**: thanh trượt Elo 250–3000 → nội suy tham số. Elo bot chỉ là ước lượng; có thể **hiệu chỉnh** bằng cách cho các bot đấu với nhau / với Stockfish UCI_Elo đã biết (script offline).

**Adaptive (tuỳ chọn):** sau mỗi ván, điều chỉnh Elo bot gợi ý theo kết quả (thắng → +100, thua → −100), hoặc đo độ chính xác (accuracy) của người chơi.

### 6.4 Phong cách chơi (persona style)

Thực hiện bằng **điều chỉnh điểm của các nước ứng viên từ MultiPV** + **opening book riêng**:

| Style | Bonus khi chọn nước | Opening book |
|---|---|---|
| ⚔️ Tấn công | + nước chiếu, ăn quân, đẩy tốt vào cánh vua, thí quân nếu eval mất < X | e4, King's Gambit, Sicilian Dragon |
| 🛡️ Phòng thủ | + đổi quân khi đang hơn, + nước giữ cấu trúc tốt, − nước mở vua | d4, Caro-Kann, London |
| 🧠 Thế trận | + nước cải thiện quân yếu nhất, kiểm soát trung tâm | Queen's Gambit, English |
| 🎲 Hỗn loạn | temperature cao, ưu tiên nước giữ nhiều quân trên bàn | khai cuộc lạ (b4, Grob) |
| 🤖 Cân bằng | không bonus | book chuẩn |

Bonus chỉ áp dụng khi chênh lệch eval với nước tốt nhất ≤ ngưỡng (vd 80 centipawn) để bot vẫn "hợp lý". Opening book: file JSON `{fenKey: [{san, weight}]}` sinh từ PGN.

### 6.5 Tính năng khi chơi
- Chọn màu (trắng/đen/ngẫu nhiên), đồng hồ (không giới hạn, 10+0, 5+3...).
- Gợi ý (Hint), Undo (tắt ở chế độ "nghiêm túc"), Xin hòa, Đầu hàng.
- Thanh đánh giá (eval bar) bật/tắt.
- Bot "chat" câu thoại theo persona (text tĩnh, theo sự kiện: ăn quân, chiếu, thua...).
- **Game Review sau ván**: chạy Stockfish lên từng nước → phân loại *Brilliant / Best / Good / Inaccuracy / Mistake / Blunder* dựa trên mất mát win% (công thức win% từ centipawn như lichess), tính accuracy, đánh dấu nước then chốt.
- Lưu PGN vào IndexedDB, xuất/nhập PGN.

### 6.6 Giao tiếp Engine
```ts
interface Engine {
  init(): Promise<void>;
  setOptions(opts: Record<string, string | number>): void;
  analyze(fen: string, p: { depth?: number; movetime?: number; multiPV?: number }):
    Promise<{ lines: { moves: string[]; cp?: number; mate?: number }[] }>;
  stop(): void;
}
```
Một worker cho bot, một worker riêng cho phân tích/eval bar để không chặn nhau.

## 7. Giao diện & "hoa hòe"

- **Theme**: nền, bàn cờ, quân cờ, nút/menu, mũi tên… xem §7.2. Font xem §7.3, ngôn ngữ xem §7.4.
- **2D mặc định**, **3D tuỳ chọn** (toggle): react-three-fiber, model GLTF (nguồn CC0/miễn phí hoặc tự dựng Blender), camera xoay, bóng đổ. Lazy-load để không ảnh hưởng tốc độ trang.
- Hiệu ứng: animation trượt quân, rung khi chiếu, confetti khi thắng/giải puzzle, particle khi phong cấp.
- Âm thanh: nhạc nền theo màn + hiệu ứng, xem §7.1.
- Avatar + thoại cho từng bot.
- Gamification: streak ngày, XP, huy hiệu (hoàn thành chương, 100 puzzle, hạ bot Rồng...).
- Responsive mobile (tap-to-move), dark mode.

### 7.1 Âm thanh & nhạc nền

**Ba nhóm âm thanh**, mỗi nhóm có âm lượng riêng:

| Nhóm | Ví dụ |
|---|---|
| 🎵 Nhạc nền (Music) | Màn chờ/menu, Learn, Practice, Puzzle Rush, Đấu bot (theo độ khó) |
| ♟️ Hiệu ứng cờ (SFX) | Đi quân, ăn quân, chiếu, nhập thành, phong cấp, hết giờ, đồng hồ tích tắc khi < 10 s, thắng/thua/hòa, giải đúng/sai puzzle |
| 🖱️ Giao diện (UI) | Click nút, hover, mở menu, nhận huy hiệu/XP |

**Nhạc nền theo màn / theo độ khó bot:**

| Màn | Không khí nhạc |
|---|---|
| Màn chờ / menu | Nhẹ nhàng, chào đón |
| Learn | Lo-fi / piano nhẹ, giúp tập trung |
| Practice / Puzzle | Tập trung, nhịp vừa |
| Puzzle Rush | Nhanh, dồn dập |
| Bot 🐣🐢 (250–500) | Vui vẻ, thư giãn |
| Bot 🦊🐺 (800–1100) | Nhẹ, có nhịp |
| Bot 🦁🦅 (1400–1800) | Tập trung, hơi căng |
| Bot 🐉👑 (2200+) | Căng thẳng, gấp gáp, kiểu "đấu trùm" |
| Kết thúc ván | Đoạn nhạc ngắn (stinger) thắng / thua / hòa |

- **Căng thẳng động (tuỳ chọn):** chuyển sang bản nhạc gấp hơn khi đồng hồ của mình < 30 s hoặc thế cờ đang thua nặng (dựa vào eval). Cách làm đơn giản: mỗi mức có 2 bản (bình thường / căng), crossfade 1–2 s giữa 2 bản. Không cần nhạc nhiều layer (stem) ở bản đầu.
- Chuyển màn → **crossfade** nhạc (không cắt đột ngột). Lúc đang có SFX lớn (thắng/thua) → giảm nhỏ nhạc tạm thời (ducking).
- Chuyển tab / thu nhỏ trình duyệt → tạm dừng nhạc (`visibilitychange`).

**Kỹ thuật:**
- **Howler.js**: loop, fade, sprite cho SFX, tự xử lý Web Audio/HTML5 fallback.
- `AudioManager` (singleton, trong `lib/audio/`): `playMusic(sceneKey)`, `playSfx(name)`, `setVolume(group, v)`, `setTension(level)`. UI và game core chỉ gọi tên sự kiện, không gọi file trực tiếp.
- **Chặn autoplay của trình duyệt:** trình duyệt không cho phát âm thanh trước khi người dùng tương tác. Màn "Chọn người chơi" (bấm vào tên) chính là cú click mở khoá âm thanh → bắt đầu nhạc menu từ đó.
- **Định dạng & dung lượng:** nhạc `.webm/.ogg (Opus)` + fallback `.mp3`, mỗi bản 1–2 phút loop liền mạch, ~1–2 MB. SFX gộp thành 1 file sprite (< 300 KB), preload lúc vào app. Nhạc **lazy-load theo màn**, không tải hết từ đầu.
- **Sound pack** (như theme): mỗi pack = 1 bộ SFX (vd *Gỗ cổ điển*, *Arcade 8-bit*, *Fantasy*). Nhạc nền là bộ riêng, không gắn với pack.

**Cài đặt (trang Settings, lưu trong `profiles.settings` → mỗi người chơi 1 cấu hình):**
```ts
audio: {
  master: number;        // 0–1
  music: number;         // 0–1 (mặc định thấp, ~0.4)
  sfx: number;
  ui: number;
  muted: boolean;        // nút loa tắt nhanh trên header
  musicMode: 'auto' | 'fixed' | 'off'; // auto = theo màn & độ khó bot
  fixedTrack?: string;   // khi musicMode = 'fixed'
  dynamicTension: boolean;
  soundPack: 'classic' | 'arcade' | 'fantasy';
}
```
Có nút "nghe thử" cạnh mỗi lựa chọn.

**Nguồn nhạc & license:**
- SFX: Kenney.nl (CC0), Freesound (lọc CC0), hoặc tự tạo bằng jsfxr (8-bit).
- Nhạc: OpenGameArt (lọc CC0/CC-BY), Pixabay Music, hoặc nhạc tạo bằng AI (Suno/Udio — cần gói trả phí mới được dùng thương mại, kiểm tra điều khoản).
- **Không** lấy âm thanh từ chess.com/lichess hay nhạc có bản quyền. Lưu nguồn + license mỗi file trong `public/audio/CREDITS.md`.

### 7.2 Hệ thống Theme

**Nguyên tắc:** chọn 1 **theme có sẵn** là đổi đồng bộ mọi thứ; sau đó người chơi có thể **tự thay từng phần** (nền, bàn cờ, quân, màu nhấn…) → theme thành "Tuỳ chỉnh".

**Các phần thay đổi được:**

| Phần | Lựa chọn |
|---|---|
| 🖼️ Nền (màn chờ & menu) | Màu đơn sắc (bảng màu gợi ý + color picker) · Gradient · **Ảnh chất lượng cao** có sẵn · (tuỳ chọn) ảnh tự tải lên · (tuỳ chọn) nền động nhẹ (hạt bay, cánh hoa rơi) |
| 🖼️ Nền trong ván | Giống màn chờ / làm mờ + tối đi / màu trơn (để tập trung) |
| ♟️ Bàn cờ | Cặp màu ô sáng/tối hoặc texture ảnh (gỗ, cẩm thạch, đá…), hiện/ẩn toạ độ, viền bàn |
| ♞ Quân cờ | Các bộ SVG (cổ điển, hiện đại, tối giản, pixel, fantasy…), có ảnh xem trước |
| 🎯 Highlight & mũi tên | Màu/kiểu: nước vừa đi, nước hợp lệ (chấm/vòng), ô bị chiếu, mũi tên gợi ý/phân tích |
| 🔘 Giao diện (nút, menu, panel) | Màu nhấn, bo góc, kiểu nút (phẳng / gỗ / kính mờ / neon phát sáng / pixel), font tiêu đề |
| 🔊 Gợi ý sound pack | Theme gợi ý pack hợp (vd Arcade ↔ 8-bit), không bắt buộc |

**Theme có sẵn đề xuất:**

| Theme | Nền | Bàn / Quân | Nút & menu | Font tiêu đề |
|---|---|---|---|---|
| Classic (mặc định) | Xanh rêu trơn | Xanh lá–kem / cổ điển | Phẳng, bo góc | Baloo 2 |
| Gỗ (Wood) | Ảnh thư phòng gỗ | Texture gỗ / Staunton | Nút vân gỗ | Playfair Display |
| Cẩm thạch (Marble) | Ảnh sảnh đá | Texture đá trắng–xám | Viền vàng, sang trọng | Cormorant Garamond |
| Neon / Cyber | Thành phố đêm | Ô tối viền phát sáng / quân trong suốt | Neon glow | Chakra Petch |
| Arcade 8-bit | Pixel art | Ô pixel / quân pixel | Nút pixel | VT323 |
| Fantasy | Lâu đài, rừng | Đá cổ / quân hiệp sĩ–rồng | Khung cuộn giấy, kim loại | Philosopher |
| Sakura 🌸 | Hoa anh đào (cánh hoa rơi) | Hồng–trắng / tối giản | Bo tròn, pastel | M PLUS Rounded 1c |
| Midnight | Gradient tím–đen | Xanh dương đậm | Kính mờ (glassmorphism) | Lexend |

**Kỹ thuật:**
- Mỗi theme là 1 manifest JSON + thư mục asset `public/themes/<id>/`:
  ```ts
  type Theme = {
    id: string; name: Record<Locale, string>;
    background: { type: 'color' | 'gradient' | 'image'; value: string;
                  overlay?: { dim: number; blur: number }; animated?: 'petals' | 'particles' };
    board: { light: string; dark: string; texture?: string; frame?: string };
    pieceSet: string;                               // public/pieces/<set>/wK.svg ...
    highlight: { lastMove: string; legal: string; check: string; arrow: string; arrowAlt: string };
    ui: { accent: string; surface: string; text: string; radius: string;
          buttonStyle: 'flat' | 'wood' | 'glass' | 'neon' | 'pixel'; headingFont: string };
    suggestedSoundPack?: string;
  };
  ```
- Áp dụng bằng **CSS variables** + thuộc tính `data-theme` / `data-button-style` trên `<html>`; Tailwind đọc biến CSS → đổi theme tức thì, không reload. Nút có texture (gỗ, cuộn giấy) dùng `border-image` 9-slice để co giãn không vỡ hình.
- Quân cờ & bàn: truyền `customPieces`, `customDarkSquareStyle`, `customArrowColor`… vào react-chessboard (bàn 3D dùng bảng màu/material tương ứng).
- **Ảnh nền:** WebP/AVIF, 2560 px cho desktop + bản crop dọc cho mobile, ~200–400 KB/ảnh, có placeholder mờ (blur) lúc đang tải. Chỉ tải ảnh của theme đang dùng. Thanh trượt làm tối/làm mờ nền để chữ luôn dễ đọc.
- **Ảnh tự tải lên** (tuỳ chọn): resize phía client còn ≤ 2560 px, lưu Blob trong IndexedDB. Khi export save, có checkbox "kèm ảnh nền" (vì làm file nặng).
- Nền động tự tắt khi người dùng bật `prefers-reduced-motion` hoặc máy yếu.
- Trang Settings → Giao diện: lưới thẻ xem trước theme, xem trước trực tiếp (live preview) trên 1 bàn cờ mẫu trước khi áp dụng.
- Lưu: `profiles.settings.theme = { presetId, overrides: { background?, board?, pieceSet?, accent?, buttonStyle? } }`.

**Nguồn hình ảnh & license:**
- Ảnh nền: Unsplash / Pexels (license cho phép dùng miễn phí), hoặc tạo bằng AI (Midjourney, DALL·E, Imagen… kiểm tra điều khoản thương mại của từng dịch vụ).
- Bộ quân: repo lichess có nhiều bộ SVG, **mỗi bộ license khác nhau** (cburnett CC BY-SA, một số GPL/CC BY-NC…) → chỉ chọn bộ cho phép, ghi công. Bộ quân riêng cho theme Pixel/Fantasy/Neon: tự vẽ hoặc AI-generate rồi vector hoá.
- Ghi nguồn mọi asset vào `public/themes/CREDITS.md`.

### 7.3 Font chữ

Đã kiểm tra trên Google Fonts: tất cả font dưới đây đều có **subset tiếng Việt** (trừ Noto Sans JP chỉ dùng cho tiếng Nhật). Load bằng `next/font/google` → tự host, không nhảy font (no layout shift), chỉ tải phần ký tự cần dùng.

| Vai trò | Font | Lý do |
|---|---|---|
| **Chữ chính (UI, bài học)** | **Be Vietnam Pro** | Thiết kế bởi người Việt, dấu xếp chồng (ệ, ở, ữ…) đẹp và rõ, nhiều độ đậm, đọc tốt ở cỡ nhỏ |
| Tiêu đề / logo (mặc định) | **Baloo 2** | Tròn, vui, đúng chất game, có tiếng Việt |
| Tiêu đề theo theme | Playfair Display, Cormorant Garamond, Chakra Petch, VT323, Philosopher, M PLUS Rounded 1c, Lexend | Mỗi theme 1 font tiêu đề (xem §7.2); chữ chính vẫn là Be Vietnam Pro để luôn dễ đọc |
| Đồng hồ, ký hiệu nước đi | Be Vietnam Pro + `font-variant-numeric: tabular-nums` (hoặc JetBrains Mono) | Số không bị nhảy khi đồng hồ chạy |
| **Tiếng Nhật** | **Noto Sans JP** (chữ chính) + **M PLUS Rounded 1c** (tiêu đề) | Đủ Kanji/Kana; M PLUS Rounded 1c hợp không khí game và cũng có tiếng Việt |

Font bị loại vì **không có tiếng Việt**: Cinzel, Fredoka, Press Start 2P, Pixelify Sans, Silkscreen, Orbitron, MedievalSharp, Zen Maru Gothic.

Font stack theo ngôn ngữ (tự đổi khi đổi language):
```css
:root[lang='vi'], :root[lang='en'] { --font-body: 'Be Vietnam Pro', system-ui, sans-serif; }
:root[lang='ja'] { --font-body: 'Noto Sans JP', 'Be Vietnam Pro', sans-serif;
                   --font-heading: 'M PLUS Rounded 1c', sans-serif; }
```
Font tiếng Nhật nặng → chỉ tải khi chọn tiếng Nhật (Google Fonts đã chia nhỏ theo unicode-range nên chỉ tải phần chữ xuất hiện trên trang).

### 7.4 Ngôn ngữ (i18n)

- **Ngôn ngữ:** 🇻🇳 Tiếng Việt (mặc định) · 🇬🇧 English · 🇯🇵 日本語.
- Lần đầu vào: tự đoán theo `navigator.language`; sau đó theo lựa chọn trong Settings → Language, lưu trong `profiles.settings.locale` (mỗi người chơi 1 ngôn ngữ). Màn chọn người chơi có nút đổi ngôn ngữ.
- Thư viện **use-intl** (lõi của next-intl, chạy phía client — ADR 0005), không dùng URL prefix (`/en/...`); đổi ngôn ngữ tức thì, không reload.
- **Mọi chuỗi giao diện dùng key** từ ngày đầu (`t('play.resign')`), không viết cứng chữ trong component — làm sau sẽ rất tốn công sửa.
- Cấu trúc:
  ```
  messages/vi.json  messages/en.json  messages/ja.json   # UI, thoại bot, tên theme, huy hiệu
  content/learn/vi/...  content/learn/en/...  content/learn/ja/...   # bài học MDX
  content/quiz/{vi,en,ja}.json
  ```
- Thiếu bản dịch bài học → hiện bản tiếng Anh (hoặc tiếng Việt) kèm thông báo "Bài này chưa có bản dịch".
- **Thuật ngữ cờ** có bảng glossary riêng mỗi ngôn ngữ (Tốt/Pawn/ポーン, Mã/Knight/ナイト, Nhập thành/Castling/キャスリング…). Ký hiệu nước đi dùng **dạng hình quân** (♘f3) để không phụ thuộc ngôn ngữ; có tuỳ chọn chuyển sang chữ.
- Puzzle theme, tên bot, thoại bot, thông báo kết quả đều dịch.
- Ngày giờ, số: dùng `Intl` theo locale.
- Kiểm tra layout với tiếng Nhật (chữ dày, không có khoảng trắng để ngắt dòng → dùng `word-break: auto-phrase` / `line-break: strict`) và tiếng Việt (dấu cao, cần `line-height` ≥ 1.5).
- Dịch: làm vi trước → dùng AI dịch sang en/ja → tự duyệt (với tiếng Nhật nên nhờ người biết tiếng duyệt thuật ngữ).

## 8. Hồ sơ người chơi & lưu tiến độ (không login)

### 8.1 Cấp 1 — Hồ sơ cục bộ (MVP)
- Vào app lần đầu → nhập tên → tạo profile. Lần sau → màn **"Chọn người chơi"** (kiểu profile Netflix), bấm tên là chơi tiếp.
- Nhiều người dùng chung 1 máy được (mỗi người 1 profile).
- Lưu trong IndexedDB của trình duyệt → **chỉ có trên đúng máy + trình duyệt đó**. Mất nếu xoá dữ liệu trình duyệt / dùng tab ẩn danh.
- Gọi `navigator.storage.persist()` để giảm khả năng trình duyệt tự dọn dữ liệu.
- Ván đang chơi dở được autosave (FEN + PGN) → mở lại là đánh tiếp.

```ts
profiles  { id (uuid), name, avatar, createdAt, lastActive, xp, streak,
            puzzleRating, puzzleRD, settings }
lessons   { profileId, lessonId, status: 'todo'|'done', score, completedAt }
puzzles   { profileId, puzzleId, solved, attempts, timeMs, at }
games     { id, profileId, pgn, botId, color, result, accuracy, createdAt,
            status: 'ongoing'|'finished' }
```

### 8.2 Cấp 2 — Xuất/nhập save (MVP, gần như miễn phí công sức)
- Nút **Xuất save** → tải file `master-chess-<name>.json` (hoặc copy 1 đoạn mã).
- Nút **Nhập save** trên máy khác → khôi phục profile. Có `schemaVersion` để migrate khi cấu trúc đổi.

> **Quyết định (2026-10-13):** chỉ làm Cấp 1 + Cấp 2 (IndexedDB + import/export). Không dùng server/database. Cấp 3 dưới đây chỉ để tham khảo nếu sau này đổi ý.

### 8.3 Cấp 3 — Cloud save bằng Tên + PIN (KHÔNG làm, để tham khảo)
- Muốn nhập tên ở **máy khác** mà ra đúng tiến độ thì bắt buộc phải lưu ở server — không có cách nào chỉ dùng trình duyệt.
- Giải pháp nhẹ: **Upstash Redis** (tích hợp sẵn trên Vercel Marketplace, free tier) + 2 API route:
  - `POST /api/save` `{ name, pin, data }` · `POST /api/load` `{ name, pin }`
  - Key = tên chuẩn hoá (lowercase, bỏ dấu); PIN 4–6 số, lưu dạng hash (bcrypt/scrypt), giới hạn số lần thử sai (rate limit).
- Vì sao cần PIN: nếu chỉ dùng tên, ai gõ trùng tên cũng xem/ghi đè được tiến độ của bạn, và 2 người cùng tên sẽ đụng nhau.
- Đồng bộ: local là nguồn chính; tự đẩy lên cloud sau mỗi ván / bài học; khi load chọn bản có `updatedAt` mới hơn.

## 9. Deploy & hiệu năng

- Vercel: build `next build`, hầu hết là static (SSG). Không cần server/API ở MVP.
- **Tên miền:** dùng subdomain của blog, vd `chess.mrquannguyenn.net` (blog WordPress vẫn ở hosting cũ, không bị ảnh hưởng).
  - Vercel → Project → Settings → Domains → thêm `chess.mrquannguyenn.net`.
  - Ở nơi quản lý DNS của tên miền (cPanel/nhà đăng ký): thêm bản ghi `CNAME  chess  →  cname.vercel-dns.com` (dùng đúng giá trị Vercel hiển thị).
  - Vercel tự cấp SSL. Giữ được auto-deploy từ GitHub, preview deploy cho mỗi PR, và API route cho các phase sau (AI Coach, tài khoản).
  - Phương án dự phòng (không dùng): static export (`output: 'export'`, `basePath: '/master-chess'`) upload lên `public_html/master-chess/` — chạy được Phase 0–6 nhưng mất auto-deploy và API route.
- File Stockfish (.js + .wasm ~7 MB) đặt ở `public/engine/`, cache dài hạn (`Cache-Control: immutable`).
- Nếu dùng bản multi-thread: thêm header `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp` trong `next.config` / `vercel.json` (ảnh hưởng tới việc nhúng tài nguyên bên ngoài → để sau).
- Puzzle JSON chia nhỏ, load theo nhu cầu. 3D assets lazy-load.
- Mục tiêu: Lighthouse ≥ 90 trên trang Learn; bot trả lời ≤ 1 s ở mức thấp/trung.

## 10. Mở rộng giai đoạn sau

| Tính năng | Cần thêm |
|---|---|
| Tài khoản, đồng bộ tiến độ | Supabase (Auth + Postgres) hoặc Vercel Postgres |
| PvP online | WebSocket (Supabase Realtime / Ably / PartyKit) — Vercel serverless không giữ kết nối lâu |
| AI Coach giải thích nước đi | API route gọi Claude, input = FEN + PV Stockfish + phân loại nước → giải thích tiếng Việt |
| Bot "giống người" hơn | Maia (mạng neural bắt chước người theo Elo, chạy qua lc0 WASM/ONNX) — nặng, cần thử nghiệm |
| Phân tích ván từ chess.com/lichess | Import PGN qua API công khai của lichess |

## 11. Giấy phép (cần lưu ý)

| Thành phần | License | Hệ quả |
|---|---|---|
| Stockfish | **GPL-3.0** | Phân phối kèm web app → phải công bố mã nguồn của engine (và an toàn nhất là để repo public / ghi rõ link source + license) |
| chess.js | BSD-2 | Thoải mái |
| react-chessboard | MIT | Thoải mái |
| chessground (nếu dùng) | GPL-3.0 | Như Stockfish |
| Lichess puzzles | CC0 | Thoải mái, nên ghi nguồn |
| Quân cờ cburnett | CC BY-SA 3.0 | Ghi công |

Nếu dự án là cá nhân/học tập, để repo public trên GitHub là đơn giản nhất.

## 12. Rủi ro & độ khả thi

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Elo bot không đúng "cảm giác" | Trung bình | Script tự đấu để hiệu chỉnh; cho người dùng feedback "quá dễ/khó" |
| Stockfish WASM chậm trên mobile yếu | Thấp–TB | Bản lite, giới hạn depth/movetime, giữ 1 worker |
| Biên soạn nội dung Learn tốn thời gian | **Cao** | Bắt đầu 10–15 bài cốt lõi; template MDX; có thể dùng AI hỗ trợ soạn rồi tự duyệt |
| 3D tốn công & nặng | Trung bình | Để giai đoạn sau, tách bundle |
| Kích thước puzzle DB | Thấp | Lọc trước bằng script, chỉ ship vài MB |

**Kết luận khả thi:** cao. Toàn bộ phần khó (luật cờ, engine, dữ liệu puzzle) đều có thư viện/dữ liệu mở sẵn. Phần tốn công nhất là **nội dung bài học** và **tinh chỉnh persona bot**, không phải hạ tầng.

## 13. Nguyên tắc xuyên suốt: Performance · Scale · Maintain

> Áp dụng cho **mọi phase**. Mỗi PR/feature phải qua checklist "Definition of Done" ở [PLAN.md](PLAN.md#definition-of-done-chung-cho-mọi-phase). **Ưu tiên tính năng trước** (quyết định 2026-10-13): budget dưới đây là **mục tiêu tham khảo**, CI chỉ *cảnh báo* khi vượt, không chặn merge. Chỉ những điểm bắt buộc mới chặn: typecheck, lint, test, build. Khi tính năng ổn định sẽ dành 1 đợt tối ưu riêng.

### 13.1 Ngân sách hiệu năng (performance budget)

| Chỉ số | Mục tiêu | Đo bằng |
|---|---|---|
| LCP (tải trang) | < 2.0 s trên mobile tầm trung, 4G | Lighthouse CI, Vercel Speed Insights |
| INP (độ trễ khi bấm/kéo quân) | < 200 ms | Speed Insights |
| CLS (nhảy layout) | < 0.05 | Lighthouse CI |
| JS tải lần đầu (trang chủ) | ≤ 170 KB gzip | `size-limit` / `@next/bundle-analyzer` |
| JS mỗi route | ≤ 250 KB gzip (không tính Stockfish, 3D) | `size-limit` |
| Kéo-thả quân | 60 fps, không giật khi đồng hồ chạy | Chrome Performance panel |
| Bot trả lời | ≤ 1 s mức thấp/trung, ≤ 3 s mức Master | test tự động trong worker |
| Lighthouse Performance | ≥ 90 (Home, Learn), ≥ 80 (Play) | Lighthouse CI |

### 13.2 Kỹ thuật đảm bảo performance

**Tải ít, tải đúng lúc**
- **Code splitting theo route + `dynamic import`** cho phần nặng: Stockfish (chỉ tải ở Play / Review / gợi ý puzzle), 3D (react-three-fiber chỉ tải khi bật 3D), Howler + nhạc, trang Settings theme.
- Preload Stockfish khi người dùng **đang ở màn chọn bot** (lúc rảnh, `requestIdleCallback`) → vào ván là có engine ngay.
- Ảnh tối ưu **lúc build** bằng script `sharp` → AVIF/WebP nhiều kích thước, phục vụ như file tĩnh (tránh dùng hết hạn mức Image Optimization của gói Vercel miễn phí).
- Nhạc dài phát dạng stream (`html5: true` trong Howler), SFX gộp sprite. Puzzle JSON chia nhỏ, chỉ tải bucket cần.
- Font qua `next/font` (`display: swap`, chỉ preload font chữ chính; font Nhật tải khi cần).
- Asset có hash trong tên + `Cache-Control: immutable`; PWA service worker cache app shell, puzzle, theme, nhạc đã nghe.

**Không chặn luồng chính (main thread)**
- Stockfish **luôn chạy trong Web Worker**, tái sử dụng worker giữa các ván (không tạo lại), `stop` khi rời trang, giới hạn `Hash` (16 MB trên mobile).
- Game Review (phân tích 40–80 nước) chạy trong worker, trả kết quả **dần dần** (hiện từng nước khi xong), có thể huỷ.
- Lọc/sắp xếp danh sách lớn (lịch sử ván, puzzle) làm trong worker hoặc IndexedDB index, không trong render.

**Render hiệu quả**
- **React Server Components / SSG** cho trang tĩnh (Learn, danh sách bài) → gần như không có JS; chỉ phần tương tác (bàn cờ, quiz) là client component ("islands").
- Zustand với **selector** để component chỉ re-render khi đúng phần state nó cần đổi. Đồng hồ là component riêng, tick không làm re-render bàn cờ.
- `React.memo` cho Board, ô cờ; tránh tạo object/hàm mới mỗi render khi truyền vào board.
- Danh sách dài dùng virtualization (`@tanstack/react-virtual`).
- Animation chỉ dùng `transform`/`opacity`; nền động dùng 1 canvas, giới hạn số hạt, dừng khi ẩn tab.

**Chế độ máy yếu (tự phát hiện)**
- Dựa vào `navigator.hardwareConcurrency`, `navigator.deviceMemory`, FPS đo được, `prefers-reduced-motion`, `Save-Data` → tự tắt nền động, 3D, hiệu ứng hạt; giảm depth engine cho phân tích nền. Người dùng có thể ghi đè trong Settings → Hiệu năng.

**Dữ liệu cục bộ**
- IndexedDB có index theo `profileId`, `createdAt`; phân trang khi đọc lịch sử.
- Lưu PGN (chuỗi gọn) thay vì mảng object từng nước. Autosave ván: ghi sau mỗi nước, gộp ghi (debounce) khi đi nhanh.

### 13.3 Dễ scale

**Người dùng:** toàn bộ tính toán ở trình duyệt + file tĩnh qua CDN của Vercel → số người chơi tăng **không làm tăng chi phí server** (không có server). Thứ tốn băng thông nhất là Stockfish (~7 MB), nhạc, ảnh nền → cache dài hạn để mỗi người chỉ tải 1 lần. Theo dõi băng thông trên dashboard Vercel; nếu vượt hạn mức gói miễn phí (lưu ý gói Hobby chỉ cho mục đích phi thương mại), chuyển asset nặng sang Cloudflare R2 / CDN khác mà không phải sửa code (chỉ đổi `ASSET_BASE_URL`).

**Nội dung & tính năng — thêm mới mà không sửa code lõi (registry pattern):**

| Muốn thêm | Chỉ cần |
|---|---|
| Bài học | Thêm file MDX vào `content/learn/<locale>/` |
| Bot | Thêm persona JSON vào `content/bots/` |
| Theme | Thêm thư mục `public/themes/<id>/` + `manifest.json` |
| Bộ quân / sound pack | Thêm thư mục + đăng ký trong manifest |
| Ngôn ngữ | Thêm `messages/<locale>.json` + thư mục nội dung, khai báo locale |
| Quiz / puzzle | Thêm JSON / chạy lại script build |

Registry được sinh tự động lúc build (quét thư mục), **validate bằng zod** — file sai cấu trúc làm build fail thay vì lỗi lúc người dùng chơi.

**Dữ liệu:** Dexie `version()` + hàm migrate cho mỗi lần đổi schema; file save có `schemaVersion` và chuỗi migrate tương ứng → người chơi không mất tiến độ khi cập nhật app.

**Mở rộng lên cloud sau này:** mọi truy cập dữ liệu đi qua interface `ProfileRepository`, `GameRepository`… (bản đầu dùng IndexedDB). Thêm cloud save/tài khoản = viết thêm 1 implementation, UI không đổi.

### 13.4 Dễ maintain

**Kiến trúc phân lớp (dependency chỉ đi một chiều):**
```
src/
  core/        ← TS thuần, KHÔNG import React/DOM: luật (bọc chess.js), bot persona, rating Glicko,
                 phân loại nước đi, puzzle validator. Test được 100% bằng unit test.
  services/    ← giao tiếp bên ngoài, sau interface: engine (worker), db (Dexie), audio, theme, i18n
  features/    ← learn/ practice/ play/ settings/ profile/ — mỗi feature tự chứa components, hooks, store
  components/ui/ ← nút, modal, card… dùng chung (shadcn/ui), chỉ nhận props, không gọi service
  app/         ← routes Next.js, mỏng, chỉ ghép feature
```
- Quy tắc import (`features` không import lẫn nhau; `core` không import gì của UI) được **ép bằng ESLint** (`eslint-plugin-boundaries` hoặc `dependency-cruiser`).
- **TypeScript `strict`**, cấm `any`; dữ liệu từ ngoài (file save import, JSON nội dung) luôn qua **zod**.
- Không "magic number": tham số bot, budget, thời gian animation để trong file config có tên rõ ràng.

**Chất lượng code tự động:**
- ESLint + Prettier, Husky + lint-staged (kiểm tra trước khi commit), Conventional Commits.
- Script `check-i18n`: mọi locale có đủ key giống nhau; key thừa/thiếu → CI fail.
- Script `check-assets`: mọi asset có dòng trong `CREDITS.md`, ảnh không vượt dung lượng cho phép.

**Kiểm thử (test pyramid):**

| Tầng | Công cụ | Phạm vi |
|---|---|---|
| Unit | Vitest | `core/` (mục tiêu coverage ≥ 80%), migrate dữ liệu, parser UCI |
| Component | Vitest + Testing Library | Board, Quiz, Settings |
| E2E | Playwright (desktop + mobile viewport) | Chơi hết 1 ván với bot, giải puzzle, import/export save, đổi ngôn ngữ/theme, autosave + mở lại |
| Hiệu năng | Lighthouse CI, size-limit | Theo budget §13.1 |

**CI/CD (GitHub Actions + Vercel):**
- Mỗi PR: `typecheck → lint → test → build → size-limit → check-i18n → check-assets → Playwright → Lighthouse CI` trên bản preview Vercel. **Chặn merge:** typecheck, lint, unit test, build, check-i18n. **Chỉ cảnh báo:** size-limit, Lighthouse CI, Playwright (cho đến khi bộ E2E ổn định).
- Merge vào `main` → Vercel tự deploy production.
- Renovate/Dependabot cập nhật thư viện định kỳ, chạy lại toàn bộ CI.

**Theo dõi sau khi deploy:**
- Vercel Speed Insights / Web Vitals (số liệu thực từ người dùng).
- (Tuỳ chọn) Sentry gói free để bắt lỗi JS — không gửi dữ liệu cá nhân (tên người chơi).

**Tài liệu:**
- `README.md` (chạy local, cấu trúc), `CONTRIBUTING.md` (hướng dẫn thêm bài học / bot / theme / ngôn ngữ).
- `docs/adr/` — mỗi quyết định kiến trúc quan trọng 1 file ngắn (vd "Vì sao chọn react-chessboard", "Vì sao không dùng server").
