# Đóng góp

## Quy trình

1. Tạo branch từ `main`: `feat/<tên>`, `fix/<tên>`.
2. Code theo quy tắc trong [CLAUDE.md](CLAUDE.md) (kiến trúc phân lớp, không hardcode chữ/màu).
3. `npm run check` phải pass. Husky tự chạy ESLint + Prettier trên file đã stage khi commit.
4. Commit message theo [Conventional Commits](https://www.conventionalcommits.org/): `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`.
5. Mở PR → CI chạy typecheck, lint, test, check-i18n, build → Vercel tạo bản preview.
6. Tick checkbox tương ứng trong [docs/PLAN.md](docs/PLAN.md).

## Thêm chuỗi giao diện

1. Thêm key vào `messages/vi.json` (nguồn chuẩn, được type-check).
2. Thêm cùng key vào `messages/en.json` và `messages/ja.json` — dùng thuật ngữ trong [GLOSSARY](docs/GLOSSARY.md).
3. `npm run check-i18n`.

## Thêm theme (tạm thời, trước Phase 5)

1. Thêm block `[data-theme='<id>'] { --mc-...: ... }` vào `src/styles/themes.css` (đủ mọi biến như theme `classic`).
2. Thêm `<id>` vào `THEMES` trong `src/services/theme/themes.ts`.
3. Thêm tên hiển thị `settings.themes.<id>` vào 3 file ngôn ngữ.

## Thêm asset (ảnh, âm thanh, bộ quân, font)

- Chỉ dùng nguồn có license cho phép (CC0, CC-BY, Unsplash/Pexels…).
- Ghi tên file, nguồn, tác giả, license vào `CREDITS.md` trong cùng thư mục.

## Các hướng dẫn khác

Bài học, bot, quiz, theme theo manifest… sẽ có hướng dẫn (và skill cho Claude Code ở `.claude/skills/`) khi các phase tương ứng được làm.
