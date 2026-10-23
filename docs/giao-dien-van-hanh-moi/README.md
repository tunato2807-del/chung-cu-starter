# Giao diện mới cho bản đầy đủ nghiệp vụ

Nhánh `codex/appfolio-business-ui`, dựa trên `codex/auth-qr-incidents` tại 2f00acd. Giữ toàn bộ router, AuthProvider, menu theo vai trò và API nghiệp vụ. Bộ main xem trước không được dùng trong bản này.

Thiết kế mới chuyển sang navy/xanh dương, cổng cư dân có ảnh lớn và hành động rõ, tìm kiếm/danh mục dịch vụ mới, trang đăng nhập cùng hệ màu, sidebar nghiệp vụ tối màu và breadcrumb. Bảng, biểu mẫu, dashboard, hóa đơn/QR dùng chung stylesheet mới. Carousel ảnh thật giữ tự chuyển, dừng, chọn ảnh và hỗ trợ giảm chuyển động.

**Cập nhật trên máy:** [code đầy đủ 5 file để copy vào VS Code](../cap-nhat-giao-dien-moi-ban-nghiep-vu-vscode.md). Cần tạo cả Portal.jsx và residence.css, nạp residence.css cuối cùng trong main.jsx. Giữ global.css/professional.css của bản nghiệp vụ, không dùng hai file đó từ main.

| Màn hình | Xem ảnh |
|---|---|
| Cổng dịch vụ cư dân | [Desktop](cong-cu-dan-1440.png) · [Điện thoại 320px](cong-cu-dan-320.png) |
| Đăng nhập | [Desktop](dang-nhap-1440.png) |
| Tổng quan quản trị | [Desktop](tong-quan-1440.png) · [Điện thoại](tong-quan-320.png) |
| Bảng và form căn hộ | [Desktop](can-ho-1440.png) |

Ảnh tổng quan/bảng dùng fixture trong kiểm tra UI, không phải dữ liệu thật. Ảnh tòa nhà dùng lại ảnh có trong dự án; không cần tải ảnh mới. [Quyết định thiết kế](design-contract.md) · [Kiểm chứng và giới hạn](verification.md).

AppFolio được người dùng đề xuất nhưng truy cập trực tiếp và proxy bị từ chối trong môi trường thực hiện. Không tuyên bố đã xem hoặc sao chép thiết kế đó; bản mới là thiết kế độc lập cho hệ thống chung cư này.
