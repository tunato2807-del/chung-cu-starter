# Đối chiếu đủ 38 bảng với bộ ERD rút gọn

Phân nhóm phục vụ trình bày báo cáo, không xóa hoặc gộp bảng vật lý. Schema hiện tại: **24 bảng nghiệp vụ + 8 bảng lịch sử + 6 bảng kỹ thuật = 38 bảng**. Một bảng có thể xuất hiện ở nhiều hình để trình bày từng quan hệ; nó vẫn chỉ là một bảng trong MySQL.

**`lich_su_cu_tru` được xếp vào nghiệp vụ** vì là quan hệ cư dân–căn hộ theo thời gian, được xe/hóa đơn/quyền truy cập sử dụng; không phải một log có thể bỏ khỏi mô hình. Hai bảng lịch sử phản ánh/bảo trì được vẽ thêm ở các hình nghiệp vụ để làm rõ trọng tâm vận hành.

## 24 bảng nghiệp vụ

| STT | Bảng thực tế | Vai trò | Vị trí trong báo cáo |
|---:|---|---|---|
| 1 | `nguoi_dung` | Tài khoản, vai trò và phiên | [Hình 0](00-tong-quan-12-bang.svg), [Hình 1](01-nha-o-cu-tru-xe.svg), [Hình 2](02-qr-phan-anh.svg), [Hình 3](03-phi-chi-so-hoa-don.svg), [Hình 4](04-thiet-bi-bao-tri.svg), [Hình 5](05-tien-ich-thong-bao.svg), [Hình 6](06-quy-thu-chi.svg) |
| 2 | `khoi_toa_nha` | Khối độc lập kể cả khi trống | [Hình 1](01-nha-o-cu-tru-xe.svg) |
| 3 | `tang_toa_nha` | Tầng độc lập, khóa ghép với khối | [Hình 1](01-nha-o-cu-tru-xe.svg) |
| 4 | `can_ho` | Căn hộ, diện tích, cờ tính phí | [Hình 0](00-tong-quan-12-bang.svg), [Hình 1](01-nha-o-cu-tru-xe.svg), [Hình 3](03-phi-chi-so-hoa-don.svg), [Hình 5](05-tien-ich-thong-bao.svg) |
| 5 | `cu_dan` | Hồ sơ cư dân | [Hình 0](00-tong-quan-12-bang.svg), [Hình 1](01-nha-o-cu-tru-xe.svg) |
| 6 | `lich_su_cu_tru` | Quan hệ cư dân–căn theo đợt ở; là dữ liệu nghiệp vụ | [Hình 0](00-tong-quan-12-bang.svg), [Hình 1](01-nha-o-cu-tru-xe.svg) |
| 7 | `phuong_tien` | Đăng ký xe gắn đợt ở/căn chịu phí | [Hình 1](01-nha-o-cu-tru-xe.svg) |
| 8 | `vi_tri_qr` | Vị trí và token QR, liên kết thiết bị hiện tại | [Hình 0](00-tong-quan-12-bang.svg), [Hình 2](02-qr-phan-anh.svg) |
| 9 | `phan_anh` | Phản ánh, phân công, trạng thái và snapshot thiết bị | [Hình 0](00-tong-quan-12-bang.svg), [Hình 2](02-qr-phan-anh.svg) |
| 10 | `hinh_anh_phan_anh` | Ảnh hiện trường/nghiệm thu theo lượt | [Hình 2](02-qr-phan-anh.svg) |
| 11 | `loai_phi` | Danh mục và điểm khóa để cập nhật cấu hình phí | [Hình 3](03-phi-chi-so-hoa-don.svg) |
| 12 | `cau_hinh_phi` | Đơn giá/bậc điện/thuế theo hiệu lực | [Hình 3](03-phi-chi-so-hoa-don.svg) |
| 13 | `chi_so_dich_vu` | Chuỗi chỉ số điện nước theo kỳ | [Hình 3](03-phi-chi-so-hoa-don.svg) |
| 14 | `hoa_don` | Hóa đơn và thông tin thanh toán | [Hình 0](00-tong-quan-12-bang.svg), [Hình 3](03-phi-chi-so-hoa-don.svg) |
| 15 | `chi_tiet_hoa_don` | Snapshot từng khoản thu | [Hình 3](03-phi-chi-so-hoa-don.svg) |
| 16 | `thiet_bi` | Hồ sơ thiết bị và lịch định kỳ | [Hình 0](00-tong-quan-12-bang.svg), [Hình 2](02-qr-phan-anh.svg), [Hình 4](04-thiet-bi-bao-tri.svg) |
| 17 | `phieu_bao_tri` | Công việc bảo trì và nghiệm thu | [Hình 0](00-tong-quan-12-bang.svg), [Hình 4](04-thiet-bi-bao-tri.svg) |
| 18 | `tien_ich` | Danh mục tiện ích và chính sách | [Hình 0](00-tong-quan-12-bang.svg), [Hình 5](05-tien-ich-thong-bao.svg) |
| 19 | `dat_lich_tien_ich` | Lượt đặt và trạng thái duyệt | [Hình 0](00-tong-quan-12-bang.svg), [Hình 5](05-tien-ich-thong-bao.svg) |
| 20 | `thong_bao` | Nội dung, phạm vi nhận và nhắc phí | [Hình 0](00-tong-quan-12-bang.svg), [Hình 5](05-tien-ich-thong-bao.svg) |
| 21 | `thong_bao_da_doc` | Biên nhận đọc theo người nhận/bàn giao | [Hình 5](05-tien-ich-thong-bao.svg) |
| 22 | `quy_tai_chinh` | Danh mục quỹ | [Hình 6](06-quy-thu-chi.svg) |
| 23 | `phieu_thu_chi` | Phiếu nháp/ghi sổ/đảo | [Hình 6](06-quy-thu-chi.svg) |
| 24 | `chung_tu_thu_chi` | Chứng từ đính kèm | [Hình 6](06-quy-thu-chi.svg) |

## 8 bảng lịch sử

| STT | Bảng thực tế | Vai trò | Vị trí trong báo cáo |
|---:|---|---|---|
| 25 | `lich_su_ban_giao_can_ho` | Bàn giao chủ hộ, cấp lại mật khẩu, thu hồi phiên | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_ban_giao_can_ho) |
| 26 | `lich_su_bao_tri` | Nhật ký thiết bị và phiếu bảo trì | [Hình 4](04-thiet-bi-bao-tri.svg) |
| 27 | `lich_su_dat_lich` | Nhật ký quyết định trên lượt đặt | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_dat_lich) |
| 28 | `lich_su_hoa_don` | Nhật ký lập/duyệt/gửi/thu/hủy | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_hoa_don) |
| 29 | `lich_su_lien_ket_qr` | Lịch sử đổi/bỏ liên kết QR | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_lien_ket_qr) |
| 30 | `lich_su_phan_anh` | Tiếp nhận, phân công, xử lý và nghiệm thu | [Hình 2](02-qr-phan-anh.svg) |
| 31 | `lich_su_thong_bao` | Tạo, sửa, phát hành và thu hồi | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_thong_bao) |
| 32 | `lich_su_thu_chi` | Lịch sử thay đổi/ghi sổ/đảo phiếu | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#lich_su_thu_chi) |

## 6 bảng kỹ thuật

| STT | Bảng thực tế | Vai trò | Vị trí trong báo cáo |
|---:|---|---|---|
| 33 | `dot_lap_hoa_don` | Chống lập lô hóa đơn trùng | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#dot_lap_hoa_don) |
| 34 | `dot_xu_ly_hoa_don` | Chống duyệt/gửi lô trùng | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#dot_xu_ly_hoa_don) |
| 35 | `dot_nhap_du_lieu` | Lịch sử và chống nhập file trùng | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#dot_nhap_du_lieu) |
| 36 | `gioi_han_gui` | Giới hạn gửi theo SĐT/IP | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#gioi_han_gui) |
| 37 | `yeu_cau_gui` | Biên nhận chống gửi phản ánh trùng | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#yeu_cau_gui) |
| 38 | `schema_migrations` | Phiên bản/checksum schema | [Phụ lục ERD vật lý](../erd-phan-he.md) / [từ điển](../tu-dien-du-lieu.md#schema_migrations) |

## Cách diễn đạt khi bảo vệ

> Hệ thống được triển khai với 38 bảng nhằm tách dữ liệu nghiệp vụ, lịch sử thao tác và cơ chế kỹ thuật. Báo cáo trình bày một ERD tổng quan gồm 12 bảng được chọn, sau đó phân rã theo phân hệ; sơ đồ vật lý và từ điển dữ liệu đầy đủ được đưa vào phụ lục. Việc rút gọn hình không làm thay đổi cấu trúc database hoặc loại bỏ chức năng đã triển khai.

Số bảng không phải thước đo duy nhất của tối ưu cơ sở dữ liệu. Việc đánh giá thiết kế còn dựa trên quan hệ, ràng buộc toàn vẹn, tránh lặp dữ liệu, truy vấn/chỉ mục và tính đúng đắn khi nhiều người thao tác. Bản này đáp ứng mục tiêu vẽ gọn; không kết luận đã đo/tối ưu hiệu năng database.
