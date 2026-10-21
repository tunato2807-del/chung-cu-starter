# Excel chi tiết và ảnh chụp tự chuyển

[Code đầy đủ 7 file và hướng dẫn cập nhật VS Code](../cap-nhat-excel-chi-tiet-anh-that-vscode.md).

## Excel

Workbook danh sách/báo cáo có thứ tự **Chi tiết → Tổng hợp**, `activeTab=0`, giữ hàng tiêu đề và bộ lọc. Trang Tổng hợp có liên kết nội bộ tại A5 mở danh sách. Tệp [mẫu 19 căn](mau-danh-sach-can-ho.xlsx) xuất từ database nghiệm thu giả lập bằng endpoint của ứng dụng, gồm 7 cột, 19 dòng dữ liệu; không chứa tài khoản đăng nhập.

Kiểm tra workbook XML xác nhận `activeTab="0"`, Chi tiết là sheet đầu và `tabSelected="1"` của sheet Chi tiết. ExcelJS đọc lại được số dòng, bộ lọc, liên kết và ô A2 đang chọn. Parser ExcelJS 4.4 không giữ `tabSelected` khi đọc lại; kiểm thử dùng thứ tự sheet, activeTab, ô đang chọn và trạng thái cố định tiêu đề để xác nhận hành vi.

## Ảnh chụp

Ba ảnh WebP cục bộ tổng cộng 121.130 byte. [Nguồn ảnh và tệp gốc](../../frontend/public/images/residences/README.md). Trình chiếu 6 giây/lần, có dừng/chọn ảnh, tạm dừng khi tương tác hoặc ngoài màn hình/tab ẩn và tôn trọng giảm chuyển động. Các nút đều có `type="button"`; thay ảnh không reset hoặc gửi biểu mẫu.

Các ảnh xem trước chụp bằng Chromium ở 1440 và 375 px. Ngoài ra đã kiểm tra 768 và 320 px: không lỗi JavaScript hoặc tràn trang ngang.

- [Cổng cư dân desktop](cong-cu-dan-1440.png)
- [Đăng nhập desktop](dang-nhap-1440.png)
- [Cổng cư dân điện thoại](cong-cu-dan-375.png)
- [Đăng nhập điện thoại](dang-nhap-375.png)

## Kiểm tra

- `npm run build`: đạt; `node scripts/check-local.js`: 0 lỗi.
- `npm test`: 215 kiểm thử backend đạt, gồm xuất dữ liệu cho 8 phân hệ và báo cáo công nợ/thu phí/quỹ.
- `npm run test:e2e`: 54/54 kiểm thử trình duyệt đạt, gồm 4 kiểm thử mới cho ảnh chụp/trình chiếu.
- Kiểm thử trình chiếu: ảnh cục bộ tải được, tự chuyển, dừng/hover, chọn bằng bàn phím/chạm, cuộn ra ngoài màn hình, giảm chuyển động, lỗi tệp ảnh và giữ nội dung đăng nhập.
