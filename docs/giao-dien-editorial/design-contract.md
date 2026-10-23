# Giao diện vận hành — hướng biên tập hình ảnh

Nền: bản đầy đủ nghiệp vụ tại 236df19, nhánh codex/editorial-business-ui. Đọc hướng dẫn AGENTS.md và frontend-ui-engineering từ main; phần mô tả main là scaffold không áp dụng cho bản nghiệp vụ đang sửa.

Người dùng đề xuất Nike và các website nổi tiếng. Truy cập Nike và Apple ngày 23/10/2026 bị proxy trả CONNECT 403, chưa quan sát được trang hiện tại. Các lựa chọn dưới đây là định hướng độc lập: ảnh kiến trúc lớn, chữ mạnh, bảng màu tiết chế, điều hướng trực tiếp. Không sao chép thương hiệu, hình ảnh hay nội dung của các trang tham khảo.

- Cổng cư dân: ảnh panorama có chuyển ảnh và nút dừng, thông điệp ngắn trên ảnh, đường dẫn nhanh hoạt động, tìm kiếm có nhãn và lọc danh mục, danh sách dịch vụ đánh số, hướng dẫn phản ánh.
- Khu nghiệp vụ: sidebar sáng có nhóm chức năng, mục hiện tại nền đen; bảng và form nền trắng; đường kẻ thay bóng đổ; chỉ số nổi bật; cùng hệ chữ/nút ở BQL, kỹ thuật và cư dân.
- Phạm vi: hệ giao diện dùng chung cho mọi tuyến hiện có; chỉnh cấu trúc trang chủ, header/footer và bố cục quản trị. Không đổi API, dữ liệu, router, hợp đồng phân quyền hay yêu cầu biểu mẫu.
- Token: chữ #171917, nền #f5f5f1, nền trắng, nền tối #171917, nhấn olive #52612b và lime #ddea9a. Bo góc 4px cho panel, 6px control; nút chính công khai dạng viên. Giữ màu đỏ/vàng/xanh cho trạng thái nghiệp vụ có nhãn.
- Responsive: 320, 768, 1024, 1440. Hero co chiều cao theo nội dung, không cắt chữ; danh sách 2 cột thành 1; không chèn ảnh trang trí vào bảng nghiệp vụ; giữ cuộn bảng và menu điện thoại.
- Accessibility: đủ tương phản chữ trên ảnh, focus rõ, keyboard, nhãn trường, trạng thái rỗng/lỗi/tải, giảm chuyển động và dừng slideshow. Không tự cuộn trang hay chuyển trang.
- Kiểm chứng: build, browser các vai trò và menu trên cả bốn kích thước, thao tác tìm kiếm/menu/carousel/đăng nhập, axe, console và kiểm tra ảnh chụp. API fixture chỉ ở script QA; không khẳng định đã nghiệm thu DB thực.
