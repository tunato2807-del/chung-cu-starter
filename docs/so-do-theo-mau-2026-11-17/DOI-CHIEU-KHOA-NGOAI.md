# Đối chiếu ERD hợp nhất với khóa chính / khóa ngoại

ERD hiện hành chỉ có **một canvas** và đủ **31 bảng, 362 cột, 81 khóa ngoại**. Bảng sau cho phép tìm đúng ràng buộc theo mã R01–R81 trên hình thoi và thuộc tính oval. Không gộp hai FK có vai trò khác nhau thành một quan hệ.

Nguồn: [`001_thesis_schema.sql`](../../database/thesis-mysql/001_thesis_schema.sql), mã nghiệp vụ `cceb904`. SHA-256: `57d700e4983eb494829a0f32de155bb8657d5abfe1f9511b2e8ac70562e17226`.

## Tính liên thông

- 29 bảng có liên kết PK/FK trực tiếp hoặc gián tiếp: cùng một ERD.
- `gioi_han_gui`, `schema_migrations` không có FK khai báo: vẫn đặt trên canvas đó, không dựng quan hệ giả.
- `nhat_ky_nghiep_vu` có 14 FK inline; đã tính đủ bên cạnh 67 FK trong `ALTER TABLE`.
- Tự tham chiếu và FK ghép vẫn giữ đủ; tám view lịch sử không được tính thành bảng vật lý mới.

## 81 ràng buộc, mỗi ràng buộc ứng với một hình thoi

Bội số ở đầu bảng cha biểu diễn số bản ghi cha cho một bản ghi con (`1` hoặc `0..1`). Đầu bảng con là số con cho một bản ghi cha (`0..N` hoặc `0..1` nếu cột FK có khóa duy nhất). Đây là bội số suy từ PK/UNIQUE/NULL của SQL; CHECK nghiệp vụ có thể áp dụng điều kiện chặt hơn cho một loại nhật ký.

| Mã trên hình | Tên constraint | FK: bảng con (cột) | PK: bảng cha (cột) | Đầu cha | Đầu con |
|---|---|---|---|---|---|
| R01 | `fk_apartment_floor` | `can_ho(khoi, tang)` | `tang_toa_nha(khoi, tang)` | 1 | 0..N |
| R02 | `cau_hinh_phi_ibfk_1` | `cau_hinh_phi(loai_phi)` | `loai_phi(loai_phi)` | 1 | 0..N |
| R03 | `cau_hinh_phi_ibfk_2` | `cau_hinh_phi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R04 | `chi_so_dich_vu_ibfk_1` | `chi_so_dich_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N |
| R05 | `chi_so_dich_vu_ibfk_2` | `chi_so_dich_vu(ma_nguoi_ghi)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R06 | `chi_tiet_hoa_don_ibfk_1` | `chi_tiet_hoa_don(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 1 | 0..N |
| R07 | `chi_tiet_hoa_don_ibfk_2` | `chi_tiet_hoa_don(ma_cau_hinh_phi)` | `cau_hinh_phi(ma_cau_hinh_phi)` | 1 | 0..N |
| R08 | `chi_tiet_hoa_don_ibfk_3` | `chi_tiet_hoa_don(ma_chi_so_dich_vu)` | `chi_so_dich_vu(ma_chi_so_dich_vu)` | 0..1 | 0..N |
| R09 | `chung_tu_thu_chi_ibfk_1` | `chung_tu_thu_chi(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | 1 | 0..N |
| R10 | `chung_tu_thu_chi_ibfk_2` | `chung_tu_thu_chi(ma_nguoi_tai)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R11 | `cu_dan_ibfk_1` | `cu_dan(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..1 |
| R12 | `dat_lich_tien_ich_ibfk_1` | `dat_lich_tien_ich(ma_tien_ich)` | `tien_ich(ma_tien_ich)` | 1 | 0..N |
| R13 | `dat_lich_tien_ich_ibfk_2` | `dat_lich_tien_ich(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N |
| R14 | `dat_lich_tien_ich_ibfk_3` | `dat_lich_tien_ich(ma_nguoi_dat)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R15 | `dat_lich_tien_ich_ibfk_4` | `dat_lich_tien_ich(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N |
| R16 | `dat_lich_tien_ich_ibfk_5` | `dat_lich_tien_ich(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | 1 | 0..N |
| R17 | `dot_lap_hoa_don_ibfk_1` | `dot_lap_hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R18 | `dot_nhap_du_lieu_ibfk_1` | `dot_nhap_du_lieu(ma_nguoi_nhap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R19 | `dot_xu_ly_hoa_don_ibfk_1` | `dot_xu_ly_hoa_don(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R20 | `hinh_anh_phan_anh_ibfk_1` | `hinh_anh_phan_anh(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 1 | 0..N |
| R21 | `hinh_anh_phan_anh_ibfk_2` | `hinh_anh_phan_anh(ma_nguoi_tai_len)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R22 | `hoa_don_ibfk_1` | `hoa_don(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N |
| R23 | `hoa_don_ibfk_2` | `hoa_don(ma_hoa_don_thay_the_cho)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..1 |
| R24 | `hoa_don_ibfk_3` | `hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R25 | `hoa_don_ibfk_4` | `hoa_don(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R26 | `hoa_don_ibfk_5` | `hoa_don(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R27 | `hoa_don_ibfk_6` | `hoa_don(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R28 | `hoa_don_ibfk_7` | `hoa_don(ma_nguoi_xac_nhan)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R29 | `lich_su_cu_tru_ibfk_1` | `lich_su_cu_tru(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N |
| R30 | `lich_su_cu_tru_ibfk_2` | `lich_su_cu_tru(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N |
| R31 | `lich_su_cu_tru_ibfk_3` | `lich_su_cu_tru(ma_nguoi_ghi_nhan)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R32 | `fk_account_apartment` | `nguoi_dung(ma_can_ho_thanh_toan)` | `can_ho(ma_can_ho)` | 0..1 | 0..1 |
| R33 | `fk_account_owner` | `nguoi_dung(ma_cu_dan_phu_trach)` | `cu_dan(ma_cu_dan)` | 0..1 | 0..1 |
| R34 | `fk_incident_equipment` | `phan_anh(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N |
| R35 | `fk_incident_sender_resident` | `phan_anh(ma_cu_dan_nguoi_gui)` | `cu_dan(ma_cu_dan)` | 0..1 | 0..N |
| R36 | `phan_anh_ibfk_1` | `phan_anh(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | 1 | 0..N |
| R37 | `phan_anh_ibfk_2` | `phan_anh(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R38 | `phan_anh_ibfk_3` | `phan_anh(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R39 | `phan_anh_ibfk_4` | `phan_anh(ma_phan_anh_goc)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N |
| R40 | `phieu_bao_tri_ibfk_1` | `phieu_bao_tri(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 1 | 0..N |
| R41 | `phieu_bao_tri_ibfk_2` | `phieu_bao_tri(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R42 | `phieu_bao_tri_ibfk_3` | `phieu_bao_tri(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R43 | `phieu_bao_tri_ibfk_4` | `phieu_bao_tri(ma_nguoi_nghiem_thu)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R44 | `phieu_bao_tri_ibfk_5` | `phieu_bao_tri(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R45 | `phieu_thu_chi_ibfk_1` | `phieu_thu_chi(ma_quy)` | `quy_tai_chinh(ma_quy)` | 1 | 0..N |
| R46 | `phieu_thu_chi_ibfk_2` | `phieu_thu_chi(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R47 | `phieu_thu_chi_ibfk_3` | `phieu_thu_chi(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R48 | `phieu_thu_chi_ibfk_4` | `phieu_thu_chi(ma_phieu_goc)` | `phieu_thu_chi(ma_phieu)` | 0..1 | 0..1 |
| R49 | `phuong_tien_ibfk_1` | `phuong_tien(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | 1 | 0..N |
| R50 | `phuong_tien_ibfk_2` | `phuong_tien(ma_can_ho)` | `can_ho(ma_can_ho)` | 1 | 0..N |
| R51 | `phuong_tien_ibfk_3` | `phuong_tien(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | 1 | 0..N |
| R52 | `phuong_tien_ibfk_4` | `phuong_tien(ma_dang_ky_truoc)` | `phuong_tien(ma_phuong_tien)` | 0..1 | 0..1 |
| R53 | `phuong_tien_ibfk_5` | `phuong_tien(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R54 | `phuong_tien_ibfk_6` | `phuong_tien(ma_nguoi_ket_thuc)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R55 | `fk_floor_block` | `tang_toa_nha(khoi)` | `khoi_toa_nha(khoi)` | 1 | 0..N |
| R56 | `thiet_bi_ibfk_1` | `thiet_bi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R57 | `thong_bao_ibfk_1` | `thong_bao(ma_can_ho)` | `can_ho(ma_can_ho)` | 0..1 | 0..N |
| R58 | `thong_bao_ibfk_2` | `thong_bao(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..N |
| R59 | `thong_bao_ibfk_3` | `thong_bao(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R60 | `thong_bao_ibfk_4` | `thong_bao(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R61 | `thong_bao_ibfk_5` | `thong_bao(ma_nguoi_thu_hoi)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R62 | `thong_bao_da_doc_ibfk_1` | `thong_bao_da_doc(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | 1 | 0..N |
| R63 | `thong_bao_da_doc_ibfk_2` | `thong_bao_da_doc(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R64 | `tien_ich_ibfk_1` | `tien_ich(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R65 | `fk_qr_equipment` | `vi_tri_qr(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N |
| R66 | `vi_tri_qr_ibfk_1` | `vi_tri_qr(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | 1 | 0..N |
| R67 | `yeu_cau_gui_ibfk_1` | `yeu_cau_gui(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N |
| R68 | `fk_history_actor` | `nhat_ky_nghiep_vu(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R69 | `fk_history_ma_phan_anh` | `nhat_ky_nghiep_vu(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | 0..1 | 0..N |
| R70 | `fk_history_ma_hoa_don` | `nhat_ky_nghiep_vu(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | 0..1 | 0..N |
| R71 | `fk_history_ma_can_ho` | `nhat_ky_nghiep_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | 0..1 | 0..N |
| R72 | `fk_history_ma_thong_bao` | `nhat_ky_nghiep_vu(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | 0..1 | 0..N |
| R73 | `fk_history_ma_thiet_bi` | `nhat_ky_nghiep_vu(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N |
| R74 | `fk_history_ma_phieu_bao_tri` | `nhat_ky_nghiep_vu(ma_phieu_bao_tri)` | `phieu_bao_tri(ma_phieu_bao_tri)` | 0..1 | 0..N |
| R75 | `fk_history_ma_dat_lich` | `nhat_ky_nghiep_vu(ma_dat_lich)` | `dat_lich_tien_ich(ma_dat_lich)` | 0..1 | 0..N |
| R76 | `fk_history_ma_phieu` | `nhat_ky_nghiep_vu(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | 0..1 | 0..N |
| R77 | `fk_history_ma_vi_tri_qr` | `nhat_ky_nghiep_vu(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | 0..1 | 0..N |
| R78 | `fk_history_ma_ky_thuat_vien_cu` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_cu)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R79 | `fk_history_ma_ky_thuat_vien_moi` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_moi)` | `nguoi_dung(ma_nguoi_dung)` | 0..1 | 0..N |
| R80 | `fk_history_ma_thiet_bi_cu` | `nhat_ky_nghiep_vu(ma_thiet_bi_cu)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N |
| R81 | `fk_history_ma_thiet_bi_moi` | `nhat_ky_nghiep_vu(ma_thiet_bi_moi)` | `thiet_bi(ma_thiet_bi)` | 0..1 | 0..N |

## Kiểm kê đủ 31 bảng

| Bảng | Số cột trên hình | Khóa chính | FK đi | FK đến |
|---|---|---|---|---|
| `can_ho` | 8 | `ma_can_ho` | 1 | 8 |
| `cau_hinh_phi` | 10 | `ma_cau_hinh_phi` | 2 | 1 |
| `chi_so_dich_vu` | 11 | `ma_chi_so_dich_vu` | 2 | 1 |
| `chi_tiet_hoa_don` | 11 | `ma_chi_tiet_hoa_don` | 3 | 0 |
| `chung_tu_thu_chi` | 9 | `ma_chung_tu` | 2 | 0 |
| `cu_dan` | 6 | `ma_cu_dan` | 1 | 5 |
| `dat_lich_tien_ich` | 18 | `ma_dat_lich` | 5 | 1 |
| `dot_lap_hoa_don` | 6 | `ma_dot_lap` | 1 | 0 |
| `dot_nhap_du_lieu` | 8 | `ma_dot_nhap` | 1 | 0 |
| `dot_xu_ly_hoa_don` | 7 | `ma_dot_xu_ly` | 1 | 0 |
| `gioi_han_gui` | 2 | `khoa` | 0 | 0 |
| `hinh_anh_phan_anh` | 7 | `ma_hinh_anh_phan_anh` | 2 | 0 |
| `hoa_don` | 33 | `ma_hoa_don` | 7 | 4 |
| `khoi_toa_nha` | 6 | `khoi` | 0 | 1 |
| `lich_su_cu_tru` | 9 | `ma_lich_su_cu_tru` | 3 | 2 |
| `loai_phi` | 3 | `loai_phi` | 0 | 1 |
| `nguoi_dung` | 15 | `ma_nguoi_dung` | 2 | 35 |
| `phan_anh` | 25 | `ma_phan_anh` | 6 | 4 |
| `phieu_bao_tri` | 30 | `ma_phieu_bao_tri` | 5 | 1 |
| `phieu_thu_chi` | 17 | `ma_phieu` | 4 | 3 |
| `phuong_tien` | 18 | `ma_phuong_tien` | 6 | 1 |
| `quy_tai_chinh` | 8 | `ma_quy` | 0 | 1 |
| `schema_migrations` | 2 | `name` | 0 | 0 |
| `tang_toa_nha` | 7 | `khoi, tang` | 1 | 1 |
| `thiet_bi` | 16 | `ma_thiet_bi` | 1 | 6 |
| `thong_bao` | 19 | `ma_thong_bao` | 5 | 2 |
| `thong_bao_da_doc` | 4 | `ma_thong_bao, ma_nguoi_dung, nguoi_tiep_nhan` | 2 | 0 |
| `tien_ich` | 13 | `ma_tien_ich` | 1 | 1 |
| `vi_tri_qr` | 10 | `ma_vi_tri_qr` | 2 | 2 |
| `yeu_cau_gui` | 3 | `khoa` | 1 | 0 |
| `nhat_ky_nghiep_vu` | 21 | `ma_nhat_ky` | 14 | 0 |
