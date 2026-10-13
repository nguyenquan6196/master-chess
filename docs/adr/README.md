# Architecture Decision Records

Mỗi quyết định kiến trúc quan trọng = 1 file ngắn `NNNN-ten-quyet-dinh.md`: Bối cảnh → Quyết định → Hệ quả.
Không sửa ADR cũ khi đổi ý; tạo ADR mới và đánh dấu ADR cũ là "Bị thay thế bởi NNNN".

| # | Quyết định | Trạng thái |
|---|---|---|
| [0001](0001-client-only-static-app.md) | App chạy hoàn toàn ở client, không server/database | Chấp nhận |
| [0002](0002-local-profiles-indexeddb.md) | Hồ sơ người chơi lưu IndexedDB + import/export | Chấp nhận |
| [0003](0003-vercel-subdomain.md) | Deploy Vercel tại subdomain `chess.mrquannguyenn.net` | Chấp nhận |
| [0004](0004-layered-architecture.md) | Kiến trúc phân lớp core/services/features, ép bằng ESLint | Chấp nhận |
| [0005](0005-use-intl-client-i18n.md) | i18n bằng `use-intl` phía client, không routing theo ngôn ngữ | Chấp nhận |
| [0006](0006-board-and-rules-libraries.md) | chess.js + react-chessboard | Chấp nhận |
| [0007](0007-features-first.md) | Ưu tiên tính năng; performance budget chỉ cảnh báo | Chấp nhận |
