# Giao diện bộ khung main

**Đang dùng bản có đăng nhập/QR/hóa đơn?** Đây là giao diện bộ khung main, không dùng để ghi đè bản nghiệp vụ. Nếu đã gặp trang trắng với lỗi `App.jsx ... filter`, dùng [bộ hai file khôi phục đúng bản](khoi-phuc-ban-nghiep-vu-vscode.md).

Thực hiện trên `codex/main-ui-refresh`, xuất phát từ `origin/main` tại `59bd4ae`.

Menu có biểu tượng và mô tả phân hệ, tìm kiếm tên có/không dấu, bố cục desktop và menu mở/đóng trên điện thoại. Giữ bốn nhóm và đủ 19 mục điều hướng gốc. Phản ánh và thông báo hiển thị phạm vi dự kiến theo từng nhóm. API health thật có loading, timeout 5 giây, lỗi và nút kiểm tra lại; trạng thái MySQL hiện đúng là chưa cấu hình.

Đây là giao diện của bộ khung main. Các module nghiệp vụ vẫn chưa triển khai như README gốc mô tả; không tạo số liệu vận hành hoặc dữ liệu cư dân giả.

- [Ảnh desktop](desktop.png)
- [Ảnh điện thoại 320px](mobile.png)
- [Màn hình phân hệ trên điện thoại](module-mobile.png)
- [Đầy đủ code tám file để chép trong VS Code](cap-nhat-tung-file-vscode.md)
- [Quyết định thiết kế](design-contract.md)
- [Kết quả và cách kiểm tra](verification.md)

Tám file runtime được sửa/thêm trong frontend. Không thay dependency, API hay backend. Nhánh `codex/auth-qr-incidents` chứa bản nghiệp vụ trước đó và được giữ nguyên; không chép đè App.jsx của nhánh đó bằng bộ file dành cho main.
