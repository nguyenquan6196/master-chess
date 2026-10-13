# 0007 — Ưu tiên tính năng

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Quyết định.** Ưu tiên ra tính năng. Performance chỉ cần hợp lý (không giật, lazy-load phần nặng). Budget ở spec §13.1 là mục tiêu tham khảo; CI chỉ chặn typecheck, lint, unit test, check-i18n, build — size-limit/Lighthouse (khi thêm) chỉ cảnh báo.

**Hệ quả.** Sẽ cần 1 đợt tối ưu riêng khi tính năng ổn định.
