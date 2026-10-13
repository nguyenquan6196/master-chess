# 0002 — Hồ sơ người chơi lưu IndexedDB + import/export

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Bối cảnh.** Muốn người chơi nhập tên và chơi tiếp tiến độ cũ, nhưng không muốn login hay database.

**Quyết định.** Profile theo tên, lưu IndexedDB (Dexie) trên trình duyệt; chuyển máy bằng file save JSON (export/import) có `schemaVersion`. Không làm cloud save (spec §8.3 chỉ để tham khảo).

**Hệ quả.** Dữ liệu chỉ có trên máy + trình duyệt đó; mất nếu xoá dữ liệu trình duyệt. Mọi thay đổi schema phải có migrate (Dexie `version()` + migrate file save). Phase 0 tạm lưu settings ở localStorage, Phase 1 chuyển vào profile.
