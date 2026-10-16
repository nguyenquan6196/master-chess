# 0008 — Bàn cờ 3D dựng bằng code, tải lười

- Ngày: 2026-10-17 · Trạng thái: Chấp nhận

**Bối cảnh.** Phase 6 thêm bàn 3D tuỳ chọn. Spec gợi ý react-three-fiber + drei và model GLTF; dự án đã chốt mọi asset là tự tạo (không tải file ngoài).

**Quyết định.**
- Dùng `three` + `@react-three/fiber` (không dùng drei; OrbitControls lấy từ `three/examples`).
- Quân 3D dựng bằng code: các phần tiện tròn là `LatheGeometry` từ đúng profile Staunton của bộ quân Gỗ 2D (`STAUNTON_PROFILES`), đầu ngựa là đường SVG đùn (`ExtrudeGeometry`). Chất liệu đổi theo bộ quân (`components/board3d/materials.ts`); màu bàn và highlight đọc từ biến CSS của theme.
- Hình học thuần (ô ↔ toạ độ, quân từ FEN, nước nào được animate, quỹ đạo) nằm ở `core/board3d` và có test.
- `Board3D` là chunk riêng (`React.lazy`), chỉ tải khi bật 3D; chỉ các bàn chơi chính (`allow3d`) mới dùng, bài học/quiz/xem trước giữ 2D để tránh nhiều WebGL context. Không có WebGL → 2D.

**Hệ quả.** Không có file model, không cần CREDITS; quân 3D cùng một dáng Staunton cho mọi bộ (chỉ khác chất liệu) — bộ quân 3D theo hình dáng từng theme để sau. Kéo-thả trong 3D chưa có (bấm để đi).
