# Đối chiếu ERD hợp nhất với khóa chính / khóa ngoại

ERD hiện hành chỉ có **một canvas**, giữ **31 bảng, 185 thuộc tính chọn lọc và mọi cột PK/FK**. File gốc chứa đủ **81 FK**: bản xem chính hiện **39 FK nghiệp vụ**, **42 FK kiểm soát** có thể bật qua **View → Layers**. Bảng dưới ghi rõ lớp của mỗi FK; không có ràng buộc nào bị xóa khỏi mô hình.

Nguồn: [`001_thesis_schema.sql`](../../database/thesis-mysql/001_thesis_schema.sql), mã nghiệp vụ `cceb904`. SHA-256: `57d700e4983eb494829a0f32de155bb8657d5abfe1f9511b2e8ac70562e17226`.

## Tính liên thông

- 29 bảng có liên kết PK/FK trực tiếp hoặc gián tiếp: cùng một ERD.
- `gioi_han_gui`, `schema_migrations` không có FK khai báo: vẫn đặt trên canvas đó, không dựng quan hệ giả.
- `nhat_ky_nghiep_vu` có 14 FK inline; đã tính đủ bên cạnh 67 FK trong `ALTER TABLE`.
- Tự tham chiếu và FK ghép vẫn giữ đủ; tám view lịch sử không được tính thành bảng vật lý mới.

## 81 ràng buộc trong file gốc, mỗi ràng buộc ứng với một hình thoi

Bội số ở đầu bảng cha biểu diễn số bản ghi cha cho một bản ghi con (`1` hoặc `0..1`). Đầu bảng con là số con cho một bản ghi cha (`0..N` hoặc `0..1` nếu cột FK có khóa duy nhất). Đây là bội số suy từ PK/UNIQUE/NULL của SQL; CHECK nghiệp vụ có thể áp dụng điều kiện chặt hơn cho một loại nhật ký.

| Mã trên hình | Tên constraint | FK: bảng con (cột) | PK: bảng cha (cột) | Đầu cha | Đầu con | Lớp hiển thị |
|---|---|---|---|---|---|---|
| R01 | `fk_apartment_floor` | `can_ho(khoi, tang)` | `tang_toa_nha(khoi, tang)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R02 | `cau_hinh_phi_ibfk_1` | `cau_hinh_phi(loai_phi)` | `loai_phi(loai_phi)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R03 | `cau_hinh_phi_ibfk_2` | `cau_hinh_phi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R04 | `chi_so_dich_vu_ibfk_1` | `chi_so_dich_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R05 | `chi_so_dich_vu_ibfk_2` | `chi_so_dich_vu(ma_nguoi_ghi)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R06 | `chi_tiet_hoa_don_ibfk_1` | `chi_tiet_hoa_don(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R07 | `chi_tiet_hoa_don_ibfk_2` | `chi_tiet_hoa_don(ma_cau_hinh_phi)` | `cau_hinh_phi(ma_cau_hinh_phi)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R08 | `chi_tiet_hoa_don_ibfk_3` | `chi_tiet_hoa_don(ma_chi_so_dich_vu)` | `chi_so_dich_vu(ma_chi_so_dich_vu)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R09 | `chung_tu_thu_chi_ibfk_1` | `chung_tu_thu_chi(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R10 | `chung_tu_thu_chi_ibfk_2` | `chung_tu_thu_chi(ma_nguoi_tai)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R11 | `cu_dan_ibfk_1` | `cu_dan(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R12 | `dat_lich_tien_ich_ibfk_1` | `dat_lich_tien_ich(ma_tien_ich)` | `tien_ich(ma_tien_ich)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R13 | `dat_lich_tien_ich_ibfk_2` | `dat_lich_tien_ich(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R14 | `dat_lich_tien_ich_ibfk_3` | `dat_lich_tien_ich(ma_nguoi_dat)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R15 | `dat_lich_tien_ich_ibfk_4` | `dat_lich_tien_ich(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R16 | `dat_lich_tien_ich_ibfk_5` | `dat_lich_tien_ich(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R17 | `dot_lap_hoa_don_ibfk_1` | `dot_lap_hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R18 | `dot_nhap_du_lieu_ibfk_1` | `dot_nhap_du_lieu(ma_nguoi_nhap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R19 | `dot_xu_ly_hoa_don_ibfk_1` | `dot_xu_ly_hoa_don(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R20 | `hinh_anh_phan_anh_ibfk_1` | `hinh_anh_phan_anh(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R21 | `hinh_anh_phan_anh_ibfk_2` | `hinh_anh_phan_anh(ma_nguoi_tai_len)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R22 | `hoa_don_ibfk_1` | `hoa_don(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R23 | `hoa_don_ibfk_2` | `hoa_don(ma_hoa_don_thay_the_cho)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R24 | `hoa_don_ibfk_3` | `hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R25 | `hoa_don_ibfk_4` | `hoa_don(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R26 | `hoa_don_ibfk_5` | `hoa_don(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R27 | `hoa_don_ibfk_6` | `hoa_don(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R28 | `hoa_don_ibfk_7` | `hoa_don(ma_nguoi_xac_nhan)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R29 | `lich_su_cu_tru_ibfk_1` | `lich_su_cu_tru(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R30 | `lich_su_cu_tru_ibfk_2` | `lich_su_cu_tru(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R31 | `lich_su_cu_tru_ibfk_3` | `lich_su_cu_tru(ma_nguoi_ghi_nhan)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R32 | `fk_account_apartment` | `nguoi_dung(ma_can_ho_thanh_toan)` | `can_ho(ma_can_ho)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R33 | `fk_account_owner` | `nguoi_dung(ma_cu_dan_phu_trach)` | `cu_dan(ma_cu_dan)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R34 | `fk_incident_equipment` | `phan_anh(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R35 | `fk_incident_sender_resident` | `phan_anh(ma_cu_dan_nguoi_gui)` | `cu_dan(ma_cu_dan)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R36 | `phan_anh_ibfk_1` | `phan_anh(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R37 | `phan_anh_ibfk_2` | `phan_anh(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R38 | `phan_anh_ibfk_3` | `phan_anh(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R39 | `phan_anh_ibfk_4` | `phan_anh(ma_phan_anh_goc)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R40 | `phieu_bao_tri_ibfk_1` | `phieu_bao_tri(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R41 | `phieu_bao_tri_ibfk_2` | `phieu_bao_tri(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R42 | `phieu_bao_tri_ibfk_3` | `phieu_bao_tri(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R43 | `phieu_bao_tri_ibfk_4` | `phieu_bao_tri(ma_nguoi_nghiem_thu)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R44 | `phieu_bao_tri_ibfk_5` | `phieu_bao_tri(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R45 | `phieu_thu_chi_ibfk_1` | `phieu_thu_chi(ma_quy)` | `quy_tai_chinh(ma_quy)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R46 | `phieu_thu_chi_ibfk_2` | `phieu_thu_chi(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R47 | `phieu_thu_chi_ibfk_3` | `phieu_thu_chi(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R48 | `phieu_thu_chi_ibfk_4` | `phieu_thu_chi(ma_phieu_goc)` | `phieu_thu_chi(ma_phieu)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R49 | `phuong_tien_ibfk_1` | `phuong_tien(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R50 | `phuong_tien_ibfk_2` | `phuong_tien(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R51 | `phuong_tien_ibfk_3` | `phuong_tien(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R52 | `phuong_tien_ibfk_4` | `phuong_tien(ma_dang_ky_truoc)` | `phuong_tien(ma_phuong_tien)` | 0..1 | 0..1 | Nghiệp vụ chính — hiện |
| R53 | `phuong_tien_ibfk_5` | `phuong_tien(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R54 | `phuong_tien_ibfk_6` | `phuong_tien(ma_nguoi_ket_thuc)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R55 | `fk_floor_block` | `tang_toa_nha(khoi)` | `khoi_toa_nha(khoi)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R56 | `thiet_bi_ibfk_1` | `thiet_bi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R57 | `thong_bao_ibfk_1` | `thong_bao(ma_can_ho)` | `can_ho(ma_can_ho)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R58 | `thong_bao_ibfk_2` | `thong_bao(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R59 | `thong_bao_ibfk_3` | `thong_bao(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R60 | `thong_bao_ibfk_4` | `thong_bao(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R61 | `thong_bao_ibfk_5` | `thong_bao(ma_nguoi_thu_hoi)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R62 | `thong_bao_da_doc_ibfk_1` | `thong_bao_da_doc(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R63 | `thong_bao_da_doc_ibfk_2` | `thong_bao_da_doc(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Nghiệp vụ chính — hiện |
| R64 | `tien_ich_ibfk_1` | `tien_ich(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R65 | `fk_qr_equipment` | `vi_tri_qr(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R66 | `vi_tri_qr_ibfk_1` | `vi_tri_qr(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R67 | `yeu_cau_gui_ibfk_1` | `yeu_cau_gui(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N | Nghiệp vụ chính — hiện |
| R68 | `fk_history_actor` | `nhat_ky_nghiep_vu(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R69 | `fk_history_ma_phan_anh` | `nhat_ky_nghiep_vu(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R70 | `fk_history_ma_hoa_don` | `nhat_ky_nghiep_vu(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R71 | `fk_history_ma_can_ho` | `nhat_ky_nghiep_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R72 | `fk_history_ma_thong_bao` | `nhat_ky_nghiep_vu(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R73 | `fk_history_ma_thiet_bi` | `nhat_ky_nghiep_vu(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R74 | `fk_history_ma_phieu_bao_tri` | `nhat_ky_nghiep_vu(ma_phieu_bao_tri)` | `phieu_bao_tri(ma_phieu_bao_tri)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R75 | `fk_history_ma_dat_lich` | `nhat_ky_nghiep_vu(ma_dat_lich)` | `dat_lich_tien_ich(ma_dat_lich)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R76 | `fk_history_ma_phieu` | `nhat_ky_nghiep_vu(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R77 | `fk_history_ma_vi_tri_qr` | `nhat_ky_nghiep_vu(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R78 | `fk_history_ma_ky_thuat_vien_cu` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_cu)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R79 | `fk_history_ma_ky_thuat_vien_moi` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_moi)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R80 | `fk_history_ma_thiet_bi_cu` | `nhat_ky_nghiep_vu(ma_thiet_bi_cu)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |
| R81 | `fk_history_ma_thiet_bi_moi` | `nhat_ky_nghiep_vu(ma_thiet_bi_moi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N | Người thao tác / nhật ký — bật khi cần |

## Kiểm kê đủ 31 bảng

| Bảng | Số cột chọn / tổng | Khóa chính | FK đi | FK đến |
|---|---|---|---|---|
| `can_ho` | 5 / 8 | `ma_can_ho` | 1 | 8 |
| `cau_hinh_phi` | 6 / 10 | `ma_cau_hinh_phi` | 2 | 1 |
| `chi_so_dich_vu` | 7 / 11 | `ma_chi_so_dich_vu` | 2 | 1 |
| `chi_tiet_hoa_don` | 7 / 11 | `ma_chi_tiet_hoa_don` | 3 | 0 |
| `chung_tu_thu_chi` | 5 / 9 | `ma_chung_tu` | 2 | 0 |
| `cu_dan` | 4 / 6 | `ma_cu_dan` | 1 | 5 |
| `dat_lich_tien_ich` | 9 / 18 | `ma_dat_lich` | 5 | 1 |
| `dot_lap_hoa_don` | 4 / 6 | `ma_dot_lap` | 1 | 0 |
| `dot_nhap_du_lieu` | 4 / 8 | `ma_dot_nhap` | 1 | 0 |
| `dot_xu_ly_hoa_don` | 4 / 7 | `ma_dot_xu_ly` | 1 | 0 |
| `gioi_han_gui` | 2 / 2 | `khoa` | 0 | 0 |
| `hinh_anh_phan_anh` | 6 / 7 | `ma_hinh_anh_phan_anh` | 2 | 0 |
| `hoa_don` | 11 / 33 | `ma_hoa_don` | 7 | 4 |
| `khoi_toa_nha` | 2 / 6 | `khoi` | 0 | 1 |
| `lich_su_cu_tru` | 7 / 9 | `ma_lich_su_cu_tru` | 3 | 2 |
| `loai_phi` | 3 / 3 | `loai_phi` | 0 | 1 |
| `nguoi_dung` | 5 / 15 | `ma_nguoi_dung` | 2 | 35 |
| `phan_anh` | 10 / 25 | `ma_phan_anh` | 6 | 4 |
| `phieu_bao_tri` | 9 / 30 | `ma_phieu_bao_tri` | 5 | 1 |
| `phieu_thu_chi` | 8 / 17 | `ma_phieu` | 4 | 3 |
| `phuong_tien` | 9 / 18 | `ma_phuong_tien` | 6 | 1 |
| `quy_tai_chinh` | 3 / 8 | `ma_quy` | 0 | 1 |
| `schema_migrations` | 2 / 2 | `name` | 0 | 0 |
| `tang_toa_nha` | 3 / 7 | `khoi, tang` | 1 | 1 |
| `thiet_bi` | 5 / 16 | `ma_thiet_bi` | 1 | 6 |
| `thong_bao` | 9 / 19 | `ma_thong_bao` | 5 | 2 |
| `thong_bao_da_doc` | 4 / 4 | `ma_thong_bao, ma_nguoi_dung, nguoi_tiep_nhan` | 2 | 0 |
| `tien_ich` | 5 / 13 | `ma_tien_ich` | 1 | 1 |
| `vi_tri_qr` | 6 / 10 | `ma_vi_tri_qr` | 2 | 2 |
| `yeu_cau_gui` | 3 / 3 | `khoa` | 1 | 0 |
| `nhat_ky_nghiep_vu` | 18 / 21 | `ma_nhat_ky` | 14 | 0 |
