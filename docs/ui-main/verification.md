# Kiểm chứng giao diện

Ngày kiểm tra: 23/10/2026. Nền: main tại 59bd4ae, Node 24.19.0, Vite 7.3.7. Browser QA: Chromium headless qua Playwright, axe-core 4.11.0. Xem [báo cáo máy](verification-report.json).

## Đã chạy

- `npm ci --cache /tmp/chung-cu-ui-npm-cache`: cài theo lockfile. Dùng cache ghi được của workspace, không thay package hoặc bỏ kiểm tra integrity.
- `npm run build`: thành công; 32 module, CSS 10,52 kB và JS 237,72 kB trước gzip.
- `git diff --check`: không có lỗi whitespace.
- Backend thật tại cổng 3000 và Vite tại 5173: `/api/health` trả HTTP 200 với `{"data":{"status":"ok","database":"not_configured"}}`.
- 19 mục điều hướng của cả bốn nhóm; chuyển nhóm đưa về mục đầu; chỉ có một h1 trên mỗi màn hình.
- Responsive 320, 768, 1024, 1440px: không có tràn ngang ở các màn hình đã kiểm tra; menu mở/đóng ở mobile; chọn mục/nhóm đóng menu.
- Tìm kiếm có dấu, không dấu, chữ hoa; kết quả rỗng và xóa tìm kiếm; chọn lại trang đang mở rồi nhập tìm kiếm vẫn giữ focus tại ô nhập.
- Bàn phím: skip link, Tab/Enter chọn mục, focus tới h1; Escape đóng menu và trả focus về nút menu.
- Phóng chữ 200% ở 320px, cả khi menu mở: không tràn ngang. Reduced motion tắt hoạt ảnh loading.
- Health: thành công thật; mô phỏng HTTP 503, dữ liệu JSON sai status, timeout sau 5 giây, loading và retry trở lại API thật.
- 26 lượt axe với WCAG 2 A/AA, 2.1 A/AA và best practices: không có violation. Bao gồm bốn kích thước, 19 màn hình, tìm kiếm rỗng, menu mobile mở và lỗi API.
- Không có lỗi JavaScript, console error hoặc HTTP lỗi ngoài những tình huống lỗi API chủ động mô phỏng.

Rà soát tĩnh bổ sung đã sửa mô tả soạn/gửi thông báo khi nhóm xem là cư dân/kỹ thuật viên. Chưa có bộ script lint, typecheck hoặc test nghiệp vụ trên main. Kiểm tra này không xác nhận đăng nhập, database, camera, QR thật hay thanh toán vì các nghiệp vụ ấy chưa được triển khai ở nhánh này. Kiểm tra trình duyệt chưa thay thế thử nghiệm trên thiết bị thật và trình đọc màn hình.

## Chạy lại browser QA

`verify-ui.mjs` là công cụ QA, không được import vào frontend. Dùng Playwright/Chromium và axe-core được cài riêng ngoài dependencies ứng dụng. Thiết lập các biến dưới đây tới đường dẫn thực tế của máy kiểm tra:

```bash
export UI_QA_PLAYWRIGHT=/duong-dan/playwright-core/index.mjs
export UI_QA_CHROMIUM=/duong-dan/chromium
export UI_QA_AXE=/duong-dan/axe-core/axe.min.js
export UI_QA_ORIGIN=http://127.0.0.1:5173
export UI_QA_OUTPUT=/tmp/chung-cu-main-ui-results
node docs/ui-main/verify-ui.mjs
```

Backend và Vite cần đang chạy đúng cổng, cùng checkout. Script gọi health thật trước, chỉ giả lập lỗi cho các tình huống kiểm tra, rồi quay về API thật. Mỗi lần chạy xuất ảnh và report.json vào thư mục output, báo lỗi bằng exit code nếu assertion không đạt.

Trong workspace lần kiểm tra này, sandbox chặn bind cổng và khởi động Chromium. Các tiến trình local được chạy bằng quyền thực thi đã được công cụ duyệt để hoàn thành browser QA, sau đó dừng. Không triển khai hoặc mở dịch vụ ra Internet.
