# Phạm vi ERD và thuộc tính của từng bảng

Theo yêu cầu mới nhất: giữ một ERD nghiệp vụ trọng tâm, lược bảng phụ nhưng **không lược thuộc tính của các bảng được giữ**. Hình hiện có **18 bảng, đủ 218 thuộc tính và đủ 46 khóa ngoại giữa chúng**. Mỗi bảng là một cột oval dọc; chữ thường, không in đậm; khóa chính gạch liền, khóa ngoại gạch đứt.

18 bảng này chính là nhóm “Nghiệp vụ trọng tâm của đề cương” trong [tài liệu CSDL](../csdl-do-an/README.md). Schema thực tế giữ nguyên 31 bảng, 362 cột, 81 FK; đây không phải thao tác xóa bảng hay xóa cột trong database.

## 18 bảng được giữ — đầy đủ mọi cột

| Bảng | Vai trò | Số thuộc tính được vẽ / số cột thật |
|---|---|---|
| `can_ho` | Lưu căn hộ và diện tích tính phí | 8 / 8 |
| `cau_hinh_phi` | Thiết lập đơn giá và kỳ áp dụng | 10 / 10 |
| `chi_so_dich_vu` | Ghi chỉ số điện, nước theo kỳ | 11 / 11 |
| `chi_tiet_hoa_don` | Lưu các khoản phí của hóa đơn | 11 / 11 |
| `cu_dan` | Quản lý hồ sơ và liên hệ cư dân | 6 / 6 |
| `hinh_anh_phan_anh` | Lưu ảnh gửi và ảnh xử lý | 7 / 7 |
| `hoa_don` | Lập và theo dõi hóa đơn theo kỳ | 33 / 33 |
| `khoi_toa_nha` | Quản lý các khối tòa nhà | 6 / 6 |
| `lich_su_cu_tru` | Ghi nhận các đợt cư trú | 9 / 9 |
| `loai_phi` | Danh mục các loại phí | 3 / 3 |
| `nguoi_dung` | Quản lý tài khoản và vai trò | 15 / 15 |
| `phan_anh` | Tiếp nhận và theo dõi phản ánh | 25 / 25 |
| `phuong_tien` | Quản lý đăng ký xe cư dân | 18 / 18 |
| `tang_toa_nha` | Quản lý tầng trong mỗi khối | 7 / 7 |
| `thiet_bi` | Quản lý tài sản và vị trí thiết bị | 16 / 16 |
| `thong_bao` | Gửi và theo dõi thông báo | 19 / 19 |
| `thong_bao_da_doc` | Theo dõi người đã đọc thông báo | 4 / 4 |
| `vi_tri_qr` | Gắn QR với vị trí hoặc thiết bị | 10 / 10 |

## 13 bảng lược khỏi hình

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

Các bảng lược vẫn tồn tại trong ứng dụng và từ điển dữ liệu. Không có bảng lược nào được giấu dưới một lớp vẽ khác. Đây là một hình rút gọn phạm vi bảng, không phải các ERD phân hệ độc lập.
