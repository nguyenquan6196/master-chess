# 0006 — chess.js + react-chessboard

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Quyết định.** Luật cờ: chess.js (BSD-2). Bàn cờ 2D: react-chessboard v5 (MIT) — thay vì chessground (GPL-3.0).

**Hệ quả.** License thoải mái. react-chessboard v5 không có hộp chọn phong cấp → tự làm `PromotionPicker`. Màu ô/highlight lấy từ CSS variables của theme. Mọi truy cập chess.js đi qua `src/core/chess/` để dễ thay thư viện.
