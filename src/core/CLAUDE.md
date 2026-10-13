# src/core — logic thuần

- **TypeScript thuần**: không import React, Next, DOM API (`window`, `document`, `localStorage`), Dexie, Howler, zustand. ESLint chặn tự động.
- Chỉ được dùng thư viện thuần logic (chess.js, zod…).
- **Hàm thuần, dữ liệu bất biến**: nhận input → trả output mới, không giữ state ẩn. Ví dụ: `applyMove(snapshot, move)` trả snapshot mới hoặc `null`, không throw cho trường hợp "nước đi không hợp lệ".
- Kiểu dữ liệu snapshot phải serialize được (lưu IndexedDB / file save) — không chứa class instance (vd không lưu object `Chess`).
- **Bắt buộc có unit test** (`*.test.ts` cạnh file), chạy bằng `npm run test`. Test cả trường hợp biên (chiếu hết, hòa, phong cấp, nhập thành, bắt tốt qua đường…).
- Không chuỗi hiển thị cho người dùng ở đây: trả về mã/enum (vd `{ kind: 'draw', reason: 'stalemate' }`), UI tự dịch bằng i18n.
- Cấu trúc: mỗi miền 1 thư mục — `chess/`, sau này `bot/`, `rating/`, `review/`, `puzzle/`.
