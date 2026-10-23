# Kiểm chứng giao diện — 23/10/2026

## Kết quả

- `npm run build`: đạt, 160 modules. Không thay dependency/lockfile. Vite vẫn báo cảnh báo chunk >500 kB và directive `use client` của React Router như trước; chưa tối ưu chia bundle trong nhiệm vụ này.
- `git diff --check`: đạt.
- Nội dung 6 file trong hướng dẫn copy khớp hoàn toàn mã nguồn hiện tại.
- Chromium: 28 tuyến menu của ba vai trò × 4 kích thước (320, 768, 1024, 1440), tổng 112 lượt kiểm tra bố cục. Không tràn ngang toàn trang, không lỗi JavaScript, không lỗi tải tài nguyên tĩnh.
- 32 lần quét axe với WCAG 2 A/AA, 2.1 A/AA và best-practice: không vi phạm trong các trang/trạng thái đã quét. Có trang chủ, đăng nhập, workspace ba vai trò, căn hộ, quét QR, tra cứu và hóa đơn.
- Kiểm tra tìm dịch vụ không dấu, danh mục, rỗng/reset, chuyển sang đăng nhập khi cần; nút/chọn ảnh, tự chuyển và dừng ảnh; liên kết khám phá dịch vụ.
- Kiểm tra danh mục đúng ba vai trò, tìm chức năng bằng bàn phím, mở/đóng menu điện thoại. Bảng khoản thu được thêm tabindex/region/nhãn để truy cập vùng cuộn bằng bàn phím; nhãn chuyển khoản được tăng tương phản.
- Xem ảnh chụp desktop và mobile: trang chủ, đăng nhập, tổng quan, căn hộ, thanh toán. Ảnh minh họa dùng nguồn cục bộ có sẵn.

## Phạm vi thực tế

Các API trong browser QA là fixture chỉ nằm trong `verify-ui.mjs`; không ghi chúng vào code chạy web. Tổng quan, căn hộ và hóa đơn có dữ liệu giả lập. Những API khác trả 503 có chủ đích để kiểm tra bố cục trạng thái lỗi và điều hướng; 112 lượt không có nghĩa 112 nghiệp vụ với database thật đã được nghiệm thu.

Không đọc/ghi database, không đăng nhập tài khoản thật, không quét camera điện thoại, không gửi phản ánh hay chuyển tiền. QR trong screenshot thanh toán chứa `UI-TEST-ONLY-NOT-A-PAYMENT-CODE`, không có tài khoản ngân hàng thật. Không chạy lại backend suite vì không sửa backend/API. Chưa kiểm tra bằng trình đọc màn hình hoặc thiết bị di động vật lý.

## Chạy lại

Script nhận `UI_QA_PLAYWRIGHT` (đường dẫn module playwright-core), `UI_QA_CHROMIUM` (binary), `UI_QA_AXE` (axe.min.js), `UI_QA_ORIGIN` (mặc định http://127.0.0.1:5182), `UI_QA_OUTPUT` (mặc định thư mục /tmp). Đây là công cụ QA, không phải dependency runtime. Khởi động Vite riêng tại origin rồi chạy `node docs/giao-dien-editorial/verify-ui.mjs`.

Báo cáo chi tiết: [verification-report.json](verification-report.json).
