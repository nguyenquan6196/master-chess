# ♞ Master Chess

Web app cờ vua để **học**, **luyện tập** (quiz, puzzle) và **đấu với bot** — chạy hoàn toàn trên trình duyệt.
Giao diện tiếng Việt / English / 日本語.

> Production: https://chess.mrquannguyenn.net (sau khi kết nối Vercel)

## Chạy local

Yêu cầu: Node.js 24+.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run typecheck` | Kiểm tra kiểu (sinh route types trước) |
| `npm run lint` / `lint:fix` | ESLint (gồm quy tắc chia lớp) |
| `npm run format` | Prettier |
| `npm run test` | Unit test (Vitest) |
| `npm run check-i18n` | Kiểm tra 3 file ngôn ngữ đủ key |
| `npm run check` | Chạy tất cả kiểm tra ở trên |

## Cấu trúc

```
src/
  app/          route Next.js (mỏng)
  features/     từng tính năng: home, local-game, settings, shell…
  services/     i18n, theme, settings (sau: engine, db, audio)
  components/   UI dùng chung: ui/, board/
  core/         logic cờ thuần TypeScript + unit test
  styles/       token theme (CSS variables)
messages/       chuỗi giao diện vi / en / ja
docs/           PLAN, TECH_SPEC, GLOSSARY, ADR
```

Tài liệu: [Kế hoạch](docs/PLAN.md) · [Tech spec](docs/TECH_SPEC.md) · [Thuật ngữ](docs/GLOSSARY.md) · [ADR](docs/adr/) · [Đóng góp](CONTRIBUTING.md)

## Tech stack

Next.js 16 (App Router, static) · React 19 · TypeScript strict · Tailwind CSS 4 · chess.js · react-chessboard · zustand · use-intl · Vitest · ESLint + Prettier · Husky.

## License

Code: sẽ chốt khi tích hợp Stockfish (GPL-3.0, xem spec §11). Asset bên thứ ba: xem các file `CREDITS.md`.
