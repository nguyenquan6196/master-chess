# 0005 — i18n bằng use-intl phía client

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận (thay cho ghi chú "next-intl" trong spec)

**Bối cảnh.** Ngôn ngữ là lựa chọn của từng người chơi (lưu cục bộ), không cần URL riêng cho từng ngôn ngữ; app là static, không có server để đọc cookie.

**Quyết định.** Dùng `use-intl` (lõi của next-intl) với `IntlProvider` phía client. `messages/vi.json` được bundle sẵn; en/ja tải động khi chọn. Key được type-check theo `vi.json`. Script `check-i18n` đảm bảo 3 file đủ key.

**Hệ quả.** HTML static luôn render tiếng Việt trước; người dùng en/ja có thể thấy chữ tiếng Việt chớp ~1 khung hình khi tải trang. Theme và `lang` được áp trước khi vẽ bằng script inline nên không bị chớp. Nếu sau này cần SEO đa ngôn ngữ cho trang Learn → cân nhắc routing `/[locale]` (ADR mới).
