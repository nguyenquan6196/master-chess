# 0004 — Kiến trúc phân lớp

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Bối cảnh.** Dự án sẽ có nhiều tính năng (học, puzzle, bot, review, theme, âm thanh, 3D) và được phát triển lâu dài, nhiều phần do AI hỗ trợ viết — cần ranh giới rõ để code không rối.

**Quyết định.** `app → features → services → core`, cộng `components` (UI thuần, chỉ dùng `core`). Feature không import feature khác. `core` là TypeScript thuần, có unit test. Ép bằng `no-restricted-imports` trong `eslint.config.mjs`.

**Hệ quả.** Logic cờ test được độc lập với UI; thay storage/engine chỉ đổi `services`. Đôi khi phải chuyển code xuống lớp dưới khi 2 feature cần dùng chung.
