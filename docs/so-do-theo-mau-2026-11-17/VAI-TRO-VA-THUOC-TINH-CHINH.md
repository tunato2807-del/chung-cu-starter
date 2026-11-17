# Phạm vi ERD và thuộc tính của từng bảng

Theo yêu cầu mới nhất về độ gọn, hình giữ **12 bảng, 56 thuộc tính và 12 quan hệ được chọn**. So với bản trước: 18 → 12 bảng, 218 → 56 thuộc tính, 46 → 12 quan hệ. Bản này không liệt kê đầy đủ mọi cột hay mọi khóa ngoại của các bảng được giữ. Mỗi bảng là một cột oval dọc; chữ thường, không in đậm; khóa chính gạch liền, khóa ngoại gạch đứt.

12 bảng này được chọn từ nhóm 18 bảng nghiệp vụ trọng tâm trong [tài liệu CSDL](../csdl-do-an/README.md), tập trung vào ba luồng nhà ở/cư trú, QR/phản ánh và hóa đơn. Schema thực tế giữ nguyên 31 bảng, 362 cột, 81 FK; đây không phải thao tác xóa bảng hay xóa cột trong database.

## 12 bảng được giữ — thuộc tính chọn lọc

| Bảng | Vai trò | Số thuộc tính được vẽ / số cột thật |
|---|---|---|
| `nguoi_dung` | Quản lý tài khoản và vai trò | 4 / 15 |
| `can_ho` | Lưu căn hộ và diện tích tính phí | 3 / 8 |
| `cu_dan` | Quản lý hồ sơ và liên hệ cư dân | 4 / 6 |
| `lich_su_cu_tru` | Ghi nhận các đợt cư trú | 6 / 9 |
| `thiet_bi` | Quản lý tài sản và vị trí thiết bị | 4 / 16 |
| `vi_tri_qr` | Gắn QR với vị trí hoặc thiết bị | 5 / 10 |
| `phan_anh` | Tiếp nhận và theo dõi phản ánh | 7 / 25 |
| `hinh_anh_phan_anh` | Lưu ảnh gửi và ảnh xử lý | 4 / 7 |
| `loai_phi` | Danh mục các loại phí | 3 / 3 |
| `cau_hinh_phi` | Thiết lập đơn giá và kỳ áp dụng | 5 / 10 |
| `hoa_don` | Lập và theo dõi hóa đơn theo kỳ | 5 / 33 |
| `chi_tiet_hoa_don` | Lưu các khoản phí của hóa đơn | 6 / 11 |

## 19 bảng lược khỏi hình

| Bảng | Lý do lược khi trình bày |
|---|---|
| `chung_tu_thu_chi` | Chứng từ của phần mở rộng quỹ, không cần trong hình nghiệp vụ trọng tâm. |
| `dat_lich_tien_ich` | Đặt lịch tiện ích là phần mở rộng, lược khỏi hình chính. |
| `dot_lap_hoa_don` | Bảng kỹ thuật quản lý đợt lập và chống xử lý lặp. |
| `dot_nhap_du_lieu` | Theo dõi lần nhập dữ liệu, không phải thực thể nghiệp vụ chính của hình. |
| `dot_xu_ly_hoa_don` | Bảng kỹ thuật theo dõi các đợt xử lý hóa đơn. |
| `gioi_han_gui` | Bảng giới hạn tần suất gửi. |
| `nhat_ky_nghiep_vu` | Nhật ký kiểm soát/lịch sử, lược để không tạo thêm nhiều đường nối. |
| `phieu_bao_tri` | Bảo trì là phần mở rộng ngoài nhóm 18 bảng trọng tâm của đề cương. |
| `phieu_thu_chi` | Phiếu thu chi quỹ thuộc phần mở rộng. |
| `quy_tai_chinh` | Quỹ tài chính thuộc phần mở rộng. |
| `schema_migrations` | Metadata phiên bản schema. |
| `tien_ich` | Danh mục tiện ích thuộc phần mở rộng. |
| `yeu_cau_gui` | Khóa kỹ thuật chống gửi phản ánh lặp. |
| `khoi_toa_nha` | Danh mục khối được lược khỏi hình tổng quan; vẫn có trong schema. |
| `tang_toa_nha` | Danh mục tầng được lược khỏi hình tổng quan; vẫn có trong schema. |
| `phuong_tien` | Quản lý xe là chi tiết phụ so với ba luồng được chọn. |
| `chi_so_dich_vu` | Chi tiết chốt chỉ số điện/nước lược khỏi hình tổng quan; số lượng/đơn giá/thành tiền giữ tại chi tiết hóa đơn. |
| `thong_bao` | Thông báo là chức năng hỗ trợ, lược khỏi hình tổng quan. |
| `thong_bao_da_doc` | Trạng thái đã đọc thông báo lược cùng bảng thông báo. |

Các bảng lược vẫn tồn tại trong ứng dụng và từ điển dữ liệu. Không có bảng lược nào được giấu dưới một lớp vẽ khác. Đây là một hình rút gọn phạm vi bảng, không phải các ERD phân hệ độc lập.
