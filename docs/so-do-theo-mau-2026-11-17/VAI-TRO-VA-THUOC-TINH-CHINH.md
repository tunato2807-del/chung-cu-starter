# Vai trò và thuộc tính chính của từng bảng

ERD hiện hành giữ cả 31 bảng trên **một trang**. Mỗi bảng có một câu mô tả vai trò và các thuộc tính oval được chọn. Tổng số thuộc tính giảm từ **362 xuống 185**; **mọi cột PK/FK vẫn được giữ**. Số cột trong cơ sở dữ liệu không thay đổi.

Thuộc tính nghiệp vụ trong bảng dưới được chọn để giải thích nội dung chính. Ngoài chúng, hình luôn giữ các khóa của bảng. Các cột kỹ thuật còn lại xem [từ điển 362 cột](TU-DIEN-362-COT.md).

| Bảng | Vai trò chính | Thuộc tính nghiệp vụ được chọn | Cột trên hình / trong schema |
|---|---|---|---|
| `can_ho` | Lưu căn hộ và diện tích tính phí | `so_can_ho`, `dien_tich_m2` | 5 / 8 |
| `cau_hinh_phi` | Thiết lập đơn giá và kỳ áp dụng | `don_gia`, `tu_ngay`, `cach_tinh` | 6 / 10 |
| `chi_so_dich_vu` | Ghi chỉ số điện, nước theo kỳ | `loai_dich_vu`, `ky_thanh_toan`, `chi_so_cu`, `chi_so_moi` | 7 / 11 |
| `chi_tiet_hoa_don` | Lưu các khoản phí của hóa đơn | `so_luong`, `don_gia`, `thanh_tien` | 7 / 11 |
| `chung_tu_thu_chi` | Lưu tệp chứng từ của phiếu | `ten_tep`, `loai_tep` | 5 / 9 |
| `cu_dan` | Quản lý hồ sơ và liên hệ cư dân | `ho_va_ten`, `so_dien_thoai` | 4 / 6 |
| `dat_lich_tien_ich` | Đặt và theo dõi lịch tiện ích | `bat_dau`, `ket_thuc`, `trang_thai` | 9 / 18 |
| `dot_lap_hoa_don` | Theo dõi đợt lập hóa đơn | `ngay_tao`, `ket_qua` | 4 / 6 |
| `dot_nhap_du_lieu` | Theo dõi lần nhập dữ liệu | `phan_he`, `so_dong` | 4 / 8 |
| `dot_xu_ly_hoa_don` | Lưu kết quả xử lý hóa đơn | `thao_tac`, `ket_qua` | 4 / 7 |
| `gioi_han_gui` | Giới hạn tần suất gửi yêu cầu | `cac_moc_thoi_gian` | 2 / 2 |
| `hinh_anh_phan_anh` | Lưu ảnh gửi và ảnh xử lý | `duong_dan_tep`, `loai`, `luot_xu_ly` | 6 / 7 |
| `hoa_don` | Lập và theo dõi hóa đơn theo kỳ | `ky_thanh_toan`, `tong_tien`, `trang_thai` | 11 / 33 |
| `khoi_toa_nha` | Quản lý các khối tòa nhà | `ten_khoi` | 2 / 6 |
| `lich_su_cu_tru` | Ghi nhận các đợt cư trú | `tu_ngay`, `den_ngay`, `quan_he` | 7 / 9 |
| `loai_phi` | Danh mục các loại phí | `ten_phi`, `don_vi_tinh` | 3 / 3 |
| `nguoi_dung` | Quản lý tài khoản và vai trò | `ho_va_ten`, `vai_tro` | 5 / 15 |
| `phan_anh` | Tiếp nhận và theo dõi phản ánh | `tieu_de`, `noi_dung`, `trang_thai` | 10 / 25 |
| `phieu_bao_tri` | Lập và theo dõi việc bảo trì | `tieu_de`, `ngay_den_han`, `trang_thai` | 9 / 30 |
| `phieu_thu_chi` | Ghi nhận thu, chi của quỹ | `loai`, `so_tien`, `trang_thai` | 8 / 17 |
| `phuong_tien` | Quản lý đăng ký xe cư dân | `bien_so`, `loai_xe` | 9 / 18 |
| `quy_tai_chinh` | Quản lý danh mục quỹ | `ten_quy`, `dang_hoat_dong` | 3 / 8 |
| `schema_migrations` | Theo dõi phiên bản CSDL | `checksum` | 2 / 2 |
| `tang_toa_nha` | Quản lý tầng trong mỗi khối | `ten_tang` | 3 / 7 |
| `thiet_bi` | Quản lý tài sản và vị trí thiết bị | `ten_thiet_bi`, `vi_tri`, `trang_thai` | 5 / 16 |
| `thong_bao` | Gửi và theo dõi thông báo | `tieu_de`, `pham_vi`, `trang_thai` | 9 / 19 |
| `thong_bao_da_doc` | Theo dõi người đã đọc thông báo | `ngay_doc` | 4 / 4 |
| `tien_ich` | Quản lý tiện ích và sức chứa | `ten_tien_ich`, `suc_chua`, `dang_mo` | 5 / 13 |
| `vi_tri_qr` | Gắn QR với vị trí hoặc thiết bị | `ten_vi_tri`, `token_qr`, `dang_hoat_dong` | 6 / 10 |
| `yeu_cau_gui` | Chống gửi phản ánh trùng lặp | `van_tay` | 3 / 3 |
| `nhat_ky_nghiep_vu` | Lưu vết thay đổi nghiệp vụ | `loai_nhat_ky`, `su_kien`, `ngay_tao` | 18 / 21 |

## Cách giảm đường nối

Lớp **01 Nghiệp vụ chính** hiện mặc định 39 quan hệ: nhà ở/cư trú, hóa đơn, QR/phản ánh, giao việc kỹ thuật, tiện ích và quỹ. Lớp **02 FK người thao tác và nhật ký** giữ 42 FK còn lại, gồm các liên kết người lập/duyệt/gửi và 14 FK của nhật ký dùng chung. Có thể bật lớp 02 bằng **View → Layers** trong draw.io.

Đây là hai lớp hiển thị của **cùng một ERD**, không phải các sơ đồ phân hệ độc lập. Tất cả 31 thực thể luôn ở cùng trang; không tạo bản sao của bảng để né liên kết xuyên nhóm. PNG/SVG/PDF/Word dùng bản xem chính và không hiển thị 42 FK đang ẩn. [Bảng đối chiếu 81 FK](DOI-CHIEU-KHOA-NGOAI.md) ghi rõ từng quan hệ thuộc lớp nào.
