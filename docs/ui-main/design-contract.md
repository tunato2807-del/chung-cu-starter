# Thiết kế giao diện trên main

Cơ sở: main tại 59bd4ae. Đã đọc App.jsx (bố cục và menu), SystemStatus.jsx (health thật), ModulePlaceholder.jsx (màn hình nghiệp vụ), README và tài liệu module. Chưa có Figma cụ thể; dùng hệ màu teal/ink của dự án và ưu tiên tìm kiếm, danh mục rõ, nội dung dễ đọc mà người dùng đã chọn. Không coi bản nghiệp vụ ở nhánh khác là nguồn code của main.

- Công việc chính: tìm và mở các màn hình xem trước theo bốn nhóm; hiểu phần nào đang hoạt động.
- Bố cục: sidebar cố định theo chiều rộng trên desktop, thanh tìm kiếm ở đầu nội dung, danh mục dạng hàng có mô tả, bảng trạng thái phụ bên phải. Một h1, h2 theo khu vực; không lặp tiêu đề ở placeholder.
- Hành động: tìm tên màn hình có/không dấu, chọn nhóm và màn hình, kiểm tra lại API; không thêm nút nghiệp vụ giả.
- Trạng thái: đang kiểm tra, API hoạt động/MySQL chưa cấu hình, mất kết nối, timeout, phản hồi không hợp lệ, tìm kiếm không có kết quả, nghiệp vụ chưa triển khai.
- Responsive: 320px menu mở/đóng trong luồng trang, một cột; 768px danh mục vẫn dễ đọc; 1024px có sidebar; từ 1200px nội dung chia hai cột. Nội dung dài xuống dòng, không tràn ngang.
- Ngôn ngữ thị giác: teal #155e75, nền xanh xám nhẹ, chữ ink, đường viền mảnh, góc 6–8px, khoảng cách bội số 4px. Không gradient, số liệu mẫu, ảnh trang trí lớn hoặc hoạt ảnh tự chạy.
- Trợ năng: skip link, focus rõ, nhãn thật, trạng thái kết nối được thông báo, hỗ trợ bàn phím và reduced motion. Chọn nhóm là xem trước, không phải xác thực/phân quyền.
- Kiểm chứng: build, health thật, 19 mục của bốn nhóm, search/empty/reset, menu mobile, keyboard, 320/768/1024/1440, zoom chữ 200%, console và axe.
