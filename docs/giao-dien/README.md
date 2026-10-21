# Giao diện ứng dụng

[Hướng dẫn cập nhật VS Code và code đầy đủ 13 file](../cap-nhat-giao-dien-chuyen-nghiep-vscode.md).

Bố cục dùng chung nằm ở `frontend/src/app/Layout.jsx`; cấu hình menu theo vai trò nằm ở `navigation.js`. Phân quyền vẫn do `Protected` và API thực hiện. `professional.css` được nạp cuối trong `main.jsx`, sau `global.css` và CSS phân hệ, để thống nhất phong cách các màn hình hiện có.

## Quy ước giao diện

| Thành phần | Quy ước |
| --- | --- |
| Màu chính | `--brand: #126457`, `--brand-deep: #0b4d43` |
| Chữ và nền | `--ink: #1b303b`, `--muted: #5c6e79`, `--canvas: #f4f7f8` |
| Thẻ nội dung | Nền trắng, viền nhẹ, bo góc 12–14 px |
| Biểu mẫu | Nhãn liên kết input, vùng chạm tối thiểu 44 px cho input |
| Bảng | Giữ dữ liệu dạng bảng; cuộn trong khung khi nội dung rộng |
| Desktop | Menu có nhóm, cuộn riêng và bám khi cuộn nội dung |
| Đến 900 px | Menu ngang và nút mở rộng thành lưới |
| Đến 650 px | Biểu mẫu một cột; thẻ chỉ số hai cột; nút và tiêu đề xuống dòng |
| Truy cập | Tab, liên kết đến nội dung, focus rõ, Escape, giảm chuyển động |

Biểu đồ giữ tùy chọn hiển thị/kiểu và cách tính số liệu hiện tại. Các luồng API, ảnh/bản nháp, tài khoản, biểu mẫu và export giữ logic nghiệp vụ. Không thêm migration hoặc thư viện bên ngoài. Minh họa và biểu tượng SVG chạy cục bộ.

## Ảnh minh họa

Các ảnh chụp bằng Chromium với dữ liệu giả lập của database nghiệm thu, không chứa mật khẩu hoặc cookie phiên.

- [Cổng cư dân](cong-cu-dan.png)
- [Đăng nhập](dang-nhap.png)
- [Tổng quan BQL](tong-quan.png)
- [Tổng quan trên điện thoại](dien-thoai.png)
- [Menu điện thoại](menu-dien-thoai.png)
- [Thanh toán VietQR với tài khoản giả lập](thanh-toan.png)

## Phạm vi kiểm tra

- Build Vite thành công; kiểm tra import/dependency: 0 lỗi; định dạng code đạt Prettier.
- `npm run test:e2e`: **50/50 đạt**. `npm test`: **215/215 đạt**, chạy tuần tự trên database test.
- Kiểm tra `prefers-reduced-motion` bằng Chromium: spinner ngừng quay và nút không có transition khi bật tùy chọn giảm chuyển động.
- Đối chiếu toàn bộ khối `Routes` với phiên bản trước: không thay đổi route hoặc thành phần nghiệp vụ.
- Mở 22 màn hình danh sách/quản trị tại 320, 375, 768, 1440 px: 88 lượt kiểm tra, không tràn trang ngang hoặc lỗi JavaScript.
- Mở 21 màn hình chi tiết, biểu mẫu QR và không gian cư dân/kỹ thuật tại 320, 375, 1440 px: 63 lượt kiểm tra, không lỗi API/JavaScript hoặc tràn trang ngang. Khung bảng vẫn cho phép cuộn riêng.
- Kiểm thử giao diện mới: nhảy đến nội dung bằng bàn phím, hiện/ẩn mật khẩu giữ nguyên dữ liệu và không submit, mở/thu gọn menu, Escape, menu tài khoản, đóng khi bấm ngoài và đăng xuất.
- Các luồng nghiệp vụ đầy đủ chạy bằng `npm run test:e2e`. Kiểm thử camera dùng nguồn ảnh/camera giả lập trong trình duyệt; ảnh minh họa chụp từ viewport desktop/mobile của Chromium.

Các kiểm thử mới dùng tài khoản ngẫu nhiên trong `chung_cu_test` và tự dọn dữ liệu của mình. Chúng gọi dịch vụ đăng nhập để tạo phiên thật khi kiểm tra UI, tránh cộng thêm vào hạn mức HTTP đăng nhập dùng chung của bộ kiểm thử. Các kiểm thử nghiệp vụ khác tiếp tục đi qua endpoint đăng nhập; không thay đổi giới hạn của ứng dụng.
