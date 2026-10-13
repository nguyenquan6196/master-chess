# src/features — từng tính năng

Mỗi feature là 1 thư mục tự chứa, vd `local-game/`:
```
local-game/
  LocalGame.tsx         # component gốc, được route trong src/app/ render
  GameStatusBanner.tsx  # component con, chỉ dùng trong feature này
  useXxx.ts             # hook riêng (nếu có)
  store.ts              # zustand store riêng (nếu cần state sống qua nhiều component)
```

Quy tắc:
- **Không import feature khác** (ESLint chặn). Cần dùng chung → chuyển xuống `src/components/` (UI thuần) hoặc `src/services/` (có side effect) hoặc `src/core/` (logic thuần).
- Logic cờ / tính toán → đặt ở `src/core/` và viết test, feature chỉ gọi.
- Component có chữ → `'use client'` + `useTranslations('<namespace>')` từ `use-intl`. Thêm key vào **cả** `messages/vi.json`, `en.json`, `ja.json`; key được type-check theo `vi.json`.
- Màu/font: chỉ dùng class theme (`bg-surface`, `text-muted`, `text-accent`, `border-border`, `font-display`…) hoặc `var(--mc-*)`. Không hex/rgb.
- Route trong `src/app/<path>/page.tsx` chỉ render component gốc của feature + `metadata`.
- Kiểm tra trên trình duyệt (desktop + mobile 375px) trước khi báo xong.
