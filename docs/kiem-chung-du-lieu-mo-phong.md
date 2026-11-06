# Kết quả kiểm chứng bộ dữ liệu mô phỏng quy mô lớn

Ngày kiểm chứng: 06/11/2026 (Việt Nam). Đây là dữ liệu mô phỏng được sinh bằng thuật toán, không phải dữ liệu thật của cư dân hoặc chung cư được trích xuất từ website.

Đã chạy trọn bộ trên MySQL 8.4 và MySQL 8.0.46 trong hai container riêng. Hai bộ có cùng số lượng từng bảng: **47,765 dòng ở 31 bảng thật**, 25 bảng có tối thiểu 100 dòng; cả 8 view lịch sử có ít nhất 100 dòng. Các view là phép chiếu từ bảng nhật ký, không tính thêm vào tổng dòng bảng thật.

Mỗi lượt chạy có **112 kiểm tra dữ liệu/API/tệp đạt**. Có 18 kiểm thử helper/CLI/schema đạt, cùng kiểm thử tích hợp chạy lại giữ nguyên số dòng của 39 bảng/view và kích thước/thời điểm sửa của tệp tài khoản, manifest và báo cáo trên cả hai phiên bản MySQL. Frontend build thành công; kiểm tra file/dependency báo 0 lỗi.

Không kết nối database trên máy người dùng, không thay .env và không đưa mật khẩu, token QR, mã tra cứu hoặc hồ sơ dòng chi tiết vào báo cáo này.

## 31 bảng thật

| Bảng | Số dòng | Mục tiêu / ngoại lệ |
| --- | ---: | --- |
| `can_ho` | 200 | Tối thiểu 100 |
| `cau_hinh_phi` | 6 | 6 biểu phí áp dụng trong kỳ mô phỏng; không tạo lịch sử đổi giá vô nghĩa. |
| `chi_so_dich_vu` | 5,200 | Tối thiểu 100 |
| `chi_tiet_hoa_don` | 21,806 | Tối thiểu 100 |
| `chung_tu_thu_chi` | 160 | Tối thiểu 100 |
| `cu_dan` | 400 | Tối thiểu 100 |
| `dat_lich_tien_ich` | 160 | Tối thiểu 100 |
| `dot_lap_hoa_don` | 130 | Tối thiểu 100 |
| `dot_nhap_du_lieu` | 100 | Tối thiểu 100 |
| `dot_xu_ly_hoa_don` | 260 | Tối thiểu 100 |
| `gioi_han_gui` | 200 | Tối thiểu 100 |
| `hinh_anh_phan_anh` | 330 | Tối thiểu 100 |
| `hoa_don` | 2,604 | Tối thiểu 100 |
| `khoi_toa_nha` | 4 | Một chung cư gồm 4 khối; không tạo 100 khối để đủ số dòng. |
| `lich_su_cu_tru` | 412 | Tối thiểu 100 |
| `loai_phi` | 6 | Ứng dụng hỗ trợ 6 loại phí cố định. |
| `nguoi_dung` | 211 | Tối thiểu 100 |
| `nhat_ky_nghiep_vu` | 12,910 | Tối thiểu 100 |
| `phan_anh` | 240 | Tối thiểu 100 |
| `phieu_bao_tri` | 160 | Tối thiểu 100 |
| `phieu_thu_chi` | 164 | Tối thiểu 100 |
| `phuong_tien` | 324 | Tối thiểu 100 |
| `quy_tai_chinh` | 4 | 4 quỹ có mục đích riêng; không nhân bản quỹ. |
| `schema_migrations` | 1 | Do công cụ migration quản lý; không chèn migration giả. |
| `tang_toa_nha` | 100 | Tối thiểu 100 |
| `thiet_bi` | 160 | Tối thiểu 100 |
| `thong_bao` | 160 | Tối thiểu 100 |
| `thong_bao_da_doc` | 925 | Tối thiểu 100 |
| `tien_ich` | 8 | 8 tiện ích phù hợp quy mô chung cư. |
| `vi_tri_qr` | 180 | Tối thiểu 100 |
| `yeu_cau_gui` | 240 | Tối thiểu 100 |

## 8 view lịch sử

| View | Số dòng |
| --- | ---: |
| `lich_su_ban_giao_can_ho` | 400 |
| `lich_su_bao_tri` | 549 |
| `lich_su_dat_lich` | 280 |
| `lich_su_hoa_don` | 10,034 |
| `lich_su_lien_ket_qr` | 161 |
| `lich_su_phan_anh` | 720 |
| `lich_su_thong_bao` | 298 |
| `lich_su_thu_chi` | 468 |

Các số lượng trên là của cấu hình mặc định 4 khối × 25 tầng × 2 căn, 13 kỳ hóa đơn, chạy ngày 06/11/2026. Ngày chạy khác làm thay đổi các kỳ và mốc lịch sử tương đối; số lượng theo cấu hình này được kiểm tra lại trước khi ghi HOAN_TAT.

Cách tạo trên máy bạn: [hướng dẫn Terminal VS Code](du-lieu-mo-phong-quy-mo.md).
