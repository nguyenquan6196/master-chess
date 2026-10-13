# 0001 — App chạy hoàn toàn ở client

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Bối cảnh.** Mục đích là học, luyện tập, đấu bot — không cần chơi online người-người ở giai đoạn đầu. Engine Stockfish có bản WASM chạy trong trình duyệt.

**Quyết định.** Mọi tính toán (luật, engine, chấm puzzle) chạy ở client. Next.js prerender toàn bộ trang thành static. Không có API route/server/database.

**Hệ quả.** Không tốn chi phí server, scale theo CDN, có thể chơi offline (PWA). Tính năng cần server (AI Coach, PvP, cloud save) để Phase 7 và cần ADR mới.
