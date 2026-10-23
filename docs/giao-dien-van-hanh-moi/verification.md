# Kiểm chứng giao diện mới

Ngày 23/10/2026; Node 24.19.0, React 19, Vite 7.3.7. Nền bản nghiệp vụ 2f00acd. Không đổi dependency hoặc backend.

## Build và mã nguồn

- Cài frontend theo lockfile bằng `npm ci --workspace frontend --include-workspace-root=false --cache /tmp/chung-cu-ui-npm-cache`. Giới hạn workspace để không cài thư viện test/backend không dùng cho kiểm tra UI này.
- `npm run build`: thành công, 160 module. Có các cảnh báo sẵn có về use client của React Router và chunk lớn; không nâng ngưỡng hoặc tắt cảnh báo.
- Định dạng năm file runtime mới/sửa bằng Prettier 3.6.2 mà root package đã khai báo; formatter chạy từ cache công cụ, không thêm package ứng dụng.
- `git diff --check`: đạt. App.jsx chỉ đổi import component Portal; router, auth và phân quyền giữ nguyên. navigation.js, global.css, professional.css, API client và backend không đổi.
- Nội dung năm khối code trong hướng dẫn copy đã được đối chiếu với file runtime.

## Trình duyệt

Chromium headless với Playwright và axe-core 4.11.0. Báo cáo [verification-report.json](verification-report.json).

- Cổng cư dân, đăng nhập và các workspace BQL/cư dân/kỹ thuật ở 320, 768, 1024, 1440px: không tràn ngang.
- Cổng cư dân hiển thị sáu dịch vụ cho khách; tìm `hoa don`, lọc nhóm, trạng thái rỗng, nút xem lại tất cả và chọn dịch vụ riêng chuyển đúng sang đăng nhập.
- Carousel: nút tiếp/chọn ảnh hoạt động; tự chuyển sau chu kỳ 6 giây khi giảm chuyển động tắt; nút dừng ngăn đổi ảnh ở chu kỳ sau. Kiểm tra thời gian bằng Playwright clock, không thay interval trong mã ứng dụng. Nút Khám phá dịch vụ cuộn tới đúng danh mục.
- Tìm chức năng `dien nuoc` bằng bàn phím ArrowDown/Enter chuyển đúng route chỉ số. Menu ba vai trò giữ đủ mục từ navigation thật. Menu điện thoại mở được và đóng khi chọn mục.
- 28 đường dẫn menu ở desktop: kiểm tra khung trang/điều hướng, không có pageerror. API không thuộc các fixture được chủ động trả 503 để kiểm tra trạng thái lỗi, không coi đó là xác nhận nghiệp vụ thành công.
- 20 lượt axe: cổng cư dân ở bốn kích thước, đăng nhập ở hai kích thước, ba workspace mỗi nhóm bốn kích thước và bảng/form căn hộ hai kích thước. Không có vi phạm trong nhóm WCAG 2 A/AA, 2.1 A/AA và best-practice.
- Không có lỗi JavaScript hoặc lỗi tải tài nguyên tĩnh. Các HTTP 401/503 API là tình huống chủ động của bài kiểm tra, không được tính là lỗi tài nguyên tĩnh.

## Phạm vi và chạy lại

Script `verify-ui.mjs` dùng fixture API trong trình duyệt, không thêm fixture vào runtime, không ghi DB, không đăng nhập tài khoản thật. Không chạy lại kiểm thử backend/MySQL vì thay đổi chỉ nằm ở UI. Chưa xác nhận camera trên điện thoại thật, giao dịch thanh toán hoặc ghi dữ liệu ở máy người dùng.

Mở Vite của đúng branch. Cấp các đường dẫn công cụ QA đã cài riêng; không cần thêm Playwright/axe vào dependency frontend:

```bash
export UI_QA_PLAYWRIGHT=/duong-dan/playwright-core/index.mjs
export UI_QA_CHROMIUM=/duong-dan/chromium
export UI_QA_AXE=/duong-dan/axe-core/axe.min.js
export UI_QA_ORIGIN=http://127.0.0.1:5173
export UI_QA_OUTPUT=/tmp/chung-cu-residence-qa
node docs/giao-dien-van-hanh-moi/verify-ui.mjs
```

Script chỉ chặn các URL bắt đầu `/api/`, không chặn module `src/shared/api/client.js`. Bất kỳ assertion/vi phạm axe nào cũng làm kiểm tra thất bại.
