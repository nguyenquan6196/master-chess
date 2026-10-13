# 0003 — Deploy Vercel tại subdomain

- Ngày: 2026-10-13 · Trạng thái: Chấp nhận

**Bối cảnh.** Đã có blog WordPress + hosting tại `mrquannguyenn.net`. Cân nhắc upload static export vào `/master-chess/` trên hosting.

**Quyết định.** Deploy trên Vercel, gắn subdomain `chess.mrquannguyenn.net` bằng bản ghi CNAME.

**Hệ quả.** Giữ auto-deploy, preview cho mỗi PR, SSL miễn phí, và đường mở cho API route sau này. Blog không bị ảnh hưởng. Lưu ý gói Hobby dành cho mục đích phi thương mại.
