# Thiết kế mới cho bản đầy đủ nghiệp vụ

Nền: codex/auth-qr-incidents tại 2f00acd, phát triển trong codex/appfolio-business-ui. Không lấy App hoặc navigation từ main. Đã đọc README, docs/architecture.md, App.jsx, Layout.jsx, Portal, PhotoCarousel và dashboard; giữ router, AuthProvider, API và dữ liệu nghiệp vụ.

Người dùng đề xuất https://www.appfolio.com/. Truy cập HTML nhận HTTP 403; Chromium nhận ERR_TUNNEL_CONNECTION_FAILED; bản văn bản công khai cũng bị proxy từ chối. Không tuyên bố đã xem hoặc sao chép giao diện AppFolio. Thiết kế dưới đây là phương án độc lập cho phần mềm vận hành chung cư, theo nhu cầu người dùng: giao diện khác rõ rệt, ảnh thật, bố cục dễ sử dụng.

- Màn hình: cổng cư dân, đăng nhập và bố cục dùng chung của BQL/cư dân/kỹ thuật; bảng, form, dashboard và QR thanh toán theo cùng hệ màu.
- Hành động: tìm/chọn dịch vụ; QR và tra cứu công khai; các dịch vụ riêng tiếp tục luồng đăng nhập hiện có. Không thêm API, dữ liệu mẫu, tùy chọn vai trò hay chức năng giả.
- Phân cấp: header trắng, hero chữ lớn với ảnh thật có điều khiển tự chuyển, khối tìm kiếm rõ nhãn, danh mục dịch vụ, quy trình hỗ trợ và footer có liên kết thực. Workspace dùng sidebar navy, breadcrumb và nội dung sáng.
- Token: navy #102a43, xanh dương #1565d8, nền #f4f7fc, chữ #172b4d, đường viền #dbe3ee. Màu vàng/xanh lá cũ không còn là hệ màu chính. Khoảng cách theo bội 4px; góc 8px cho control, 12px cho panel.
- Responsive: 320/768/1024/1440; mobile hero một cột, dịch vụ một cột, menu nghiệp vụ có mở rộng; không bỏ chức năng. Bảng cuộn trong wrapper sẵn có.
- Trạng thái: giữ loading/error/empty, bộ lọc URL, biểu đồ hiện/ẩn, nút chờ gửi và lỗi API. PhotoCarousel giữ pause, chọn ảnh, tự dừng khi không hiện/hover/focus và reduced motion.
- Kiểm chứng: build, browser smoke cổng công khai và fixture API cho ba vai trò; desktop/mobile, focus/keyboard, search, login redirect, menu nhóm, console và axe. Fixture chỉ dùng trong script QA, không đưa vào runtime.
