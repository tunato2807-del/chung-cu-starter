# Từ điển thuộc tính của ERD hợp nhất

Đủ 362 cột của 31 bảng trên một ERD. Kiểu dữ liệu, PK và tính NULL đọc từ schema SQL. Đây là tài liệu tra cứu thuộc tính, không phải sơ đồ phân hệ tách riêng.

## can_ho

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_can_ho` | `int unsigned` | ✓ |  | Không |
| `so_can_ho` | `varchar(20)` |  |  | Không |
| `khoi` | `varchar(10)` |  | R01 | Không |
| `tang` | `smallint unsigned` |  | R01 | Không |
| `dien_tich_m2` | `decimal(8,2)` |  |  | Không |
| `tinh_phi_dich_vu` | `tinyint(1)` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime` |  |  | Không |

## cau_hinh_phi

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_cau_hinh_phi` | `int unsigned` | ✓ |  | Không |
| `loai_phi` | `varchar(30)` |  | R02 | Không |
| `don_gia` | `decimal(12,2)` |  |  | Không |
| `tu_ngay` | `date` |  |  | Không |
| `den_ngay` | `date` |  |  | Có |
| `ma_nguoi_tao` | `int unsigned` |  | R03 | Không |
| `ngay_tao` | `datetime` |  |  | Không |
| `cach_tinh` | `enum('DON_GIA','BAC_THANG')` |  |  | Không |
| `thue_gtgt` | `decimal(5,2)` |  |  | Không |
| `bac_dien` | `json` |  |  | Có |

## chi_so_dich_vu

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_chi_so_dich_vu` | `int unsigned` | ✓ |  | Không |
| `ma_can_ho` | `int unsigned` |  | R04 | Không |
| `loai_dich_vu` | `enum('DIEN','NUOC')` |  |  | Không |
| `ky_thanh_toan` | `char(7)` |  |  | Không |
| `chi_so_cu` | `decimal(12,3)` |  |  | Không |
| `chi_so_moi` | `decimal(12,3)` |  |  | Không |
| `ngay_chot` | `date` |  |  | Không |
| `ghi_chu` | `varchar(255)` |  |  | Không |
| `ma_nguoi_ghi` | `int unsigned` |  | R05 | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_ghi` | `datetime` |  |  | Không |

## chi_tiet_hoa_don

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_chi_tiet_hoa_don` | `int unsigned` | ✓ |  | Không |
| `ma_hoa_don` | `int unsigned` |  | R06 | Không |
| `ma_cau_hinh_phi` | `int unsigned` |  | R07 | Không |
| `ma_chi_so_dich_vu` | `int unsigned` |  | R08 | Có |
| `loai_phi` | `varchar(30)` |  |  | Không |
| `dien_giai` | `varchar(255)` |  |  | Không |
| `don_vi_tinh` | `varchar(20)` |  |  | Không |
| `so_luong` | `decimal(12,3)` |  |  | Không |
| `don_gia` | `decimal(16,2)` |  |  | Không |
| `thanh_tien` | `decimal(14,0)` |  |  | Không |
| `du_lieu_nguon` | `json` |  |  | Không |

## chung_tu_thu_chi

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_chung_tu` | `int unsigned` | ✓ |  | Không |
| `ma_phieu` | `int unsigned` |  | R09 | Không |
| `ten_tep` | `varchar(120)` |  |  | Không |
| `loai_tep` | `enum('image/jpeg','application/pdf')` |  |  | Không |
| `kich_thuoc` | `int unsigned` |  |  | Không |
| `bam_sha256` | `char(64)` |  |  | Không |
| `noi_dung` | `mediumblob` |  |  | Không |
| `ma_nguoi_tai` | `int unsigned` |  | R10 | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## cu_dan

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_cu_dan` | `int unsigned` | ✓ |  | Không |
| `ho_va_ten` | `varchar(100)` |  |  | Không |
| `so_dien_thoai` | `varchar(15)` |  |  | Không |
| `ma_nguoi_dung` | `int unsigned` |  | R11 | Có |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime` |  |  | Không |

## dat_lich_tien_ich

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_dat_lich` | `int unsigned` | ✓ |  | Không |
| `ma_tien_ich` | `int unsigned` |  | R12 | Không |
| `ma_can_ho` | `int unsigned` |  | R13 | Không |
| `ma_nguoi_dat` | `int unsigned` |  | R14 | Không |
| `ma_cu_dan` | `int unsigned` |  | R15 | Không |
| `ma_lich_su_cu_tru` | `int unsigned` |  | R16 | Không |
| `ten_tien_ich` | `varchar(120)` |  |  | Không |
| `vi_tri` | `varchar(160)` |  |  | Không |
| `ten_nguoi_dat` | `varchar(100)` |  |  | Không |
| `bat_dau` | `datetime` |  |  | Không |
| `ket_thuc` | `datetime` |  |  | Không |
| `so_nguoi` | `smallint unsigned` |  |  | Không |
| `ghi_chu` | `varchar(1000)` |  |  | Không |
| `trang_thai` | `enum('CHO_DUYET','DA_DUYET','TU_CHOI','DA_HUY')` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `van_tay` | `char(64)` |  |  | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## dot_lap_hoa_don

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_dot_lap` | `int unsigned` | ✓ |  | Không |
| `ma_nguoi_lap` | `int unsigned` |  | R17 | Không |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `dau_vao_sha256` | `char(64)` |  |  | Không |
| `ket_qua` | `json` |  |  | Có |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## dot_nhap_du_lieu

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_dot_nhap` | `bigint unsigned` | ✓ |  | Không |
| `ma_nguoi_nhap` | `int unsigned` |  | R18 | Không |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `phan_he` | `varchar(30)` |  |  | Không |
| `sha256` | `char(64)` |  |  | Không |
| `so_dong` | `smallint unsigned` |  |  | Không |
| `ket_qua` | `json` |  |  | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## dot_xu_ly_hoa_don

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_dot_xu_ly` | `int unsigned` | ✓ |  | Không |
| `ma_nguoi_thuc_hien` | `int unsigned` |  | R19 | Không |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `thao_tac` | `enum('DUYET','GUI')` |  |  | Không |
| `dau_vao_sha256` | `char(64)` |  |  | Không |
| `ket_qua` | `json` |  |  | Có |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## gioi_han_gui

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `khoa` | `char(64)` | ✓ |  | Không |
| `cac_moc_thoi_gian` | `json` |  |  | Không |

## hinh_anh_phan_anh

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_hinh_anh_phan_anh` | `int unsigned` | ✓ |  | Không |
| `ma_phan_anh` | `int unsigned` |  | R20 | Không |
| `duong_dan_tep` | `varchar(80)` |  |  | Không |
| `loai` | `enum('PHAN_ANH','NGHIEM_THU')` |  |  | Không |
| `luot_xu_ly` | `int unsigned` |  |  | Không |
| `ma_nguoi_tai_len` | `int unsigned` |  | R21 | Có |
| `ngay_tai_len` | `datetime` |  |  | Không |

## hoa_don

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_hoa_don` | `int unsigned` | ✓ |  | Không |
| `so_hoa_don` | `varchar(25)` |  |  | Không |
| `ma_can_ho` | `int unsigned` |  | R22 | Không |
| `ky_thanh_toan` | `char(7)` |  |  | Không |
| `ngay_chot_phi` | `date` |  |  | Không |
| `lan_lap` | `int unsigned` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `trang_thai` | `enum('NHAP','DA_DUYET','DA_GUI','DA_THANH_TOAN','HUY')` |  |  | Không |
| `tinh_nuoc` | `tinyint(1)` |  |  | Không |
| `tinh_dien` | `tinyint(1)` |  |  | Không |
| `tinh_xe` | `tinyint(1)` |  |  | Không |
| `tong_tien` | `decimal(14,0)` |  |  | Không |
| `loi_du_lieu` | `json` |  |  | Không |
| `dau_van_tay` | `char(64)` |  |  | Không |
| `han_thanh_toan` | `date` |  |  | Có |
| `ma_ngan_hang` | `char(6)` |  |  | Không |
| `so_tai_khoan` | `varchar(30)` |  |  | Không |
| `ten_nguoi_nhan` | `varchar(100)` |  |  | Không |
| `ma_hoa_don_thay_the_cho` | `int unsigned` |  | R23 | Có |
| `ma_nguoi_lap` | `int unsigned` |  | R24 | Không |
| `ma_nguoi_duyet` | `int unsigned` |  | R25 | Có |
| `ma_nguoi_gui` | `int unsigned` |  | R26 | Có |
| `ma_nguoi_huy` | `int unsigned` |  | R27 | Có |
| `ma_nguoi_xac_nhan` | `int unsigned` |  | R28 | Có |
| `ngay_tao` | `datetime` |  |  | Không |
| `ngay_duyet` | `datetime` |  |  | Có |
| `ngay_gui` | `datetime` |  |  | Có |
| `ngay_huy` | `datetime` |  |  | Có |
| `ngay_thanh_toan` | `datetime` |  |  | Có |
| `ly_do_huy` | `varchar(255)` |  |  | Không |
| `so_tien_da_thu` | `decimal(14,0)` |  |  | Không |
| `ma_tham_chieu` | `varchar(100)` |  |  | Có |
| `hieu_luc` | `tinyint` |  |  | Có |

## khoi_toa_nha

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `khoi` | `varchar(10)` | ✓ |  | Không |
| `ten_khoi` | `varchar(100)` |  |  | Không |
| `mo_ta` | `varchar(255)` |  |  | Không |
| `giu_khi_trong` | `tinyint(1)` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime` |  |  | Không |

## lich_su_cu_tru

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_lich_su_cu_tru` | `int unsigned` | ✓ |  | Không |
| `ma_cu_dan` | `int unsigned` |  | R29 | Không |
| `ma_can_ho` | `int unsigned` |  | R30 | Không |
| `quan_he` | `enum('CHU_HO','THANH_VIEN','NGUOI_THUE')` |  |  | Không |
| `tu_ngay` | `date` |  |  | Không |
| `den_ngay` | `date` |  |  | Có |
| `ma_nguoi_ghi_nhan` | `int unsigned` |  | R31 | Không |
| `ngay_tao` | `datetime` |  |  | Không |
| `cu_dan_dang_o` | `int unsigned` |  |  | Có |

## loai_phi

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `loai_phi` | `varchar(30)` | ✓ |  | Không |
| `ten_phi` | `varchar(80)` |  |  | Không |
| `don_vi_tinh` | `varchar(20)` |  |  | Không |

## nguoi_dung

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_nguoi_dung` | `int unsigned` | ✓ |  | Không |
| `ho_va_ten` | `varchar(100)` |  |  | Không |
| `so_dien_thoai` | `varchar(15)` |  |  | Có |
| `mat_khau_ma_hoa` | `varchar(255)` |  |  | Không |
| `vai_tro` | `enum('QUAN_TRI_VIEN','KY_THUAT_VIEN','CU_DAN')` |  |  | Không |
| `chuyen_mon` | `varchar(100)` |  |  | Không |
| `dang_hoat_dong` | `tinyint(1)` |  |  | Không |
| `phien_ban_token` | `int unsigned` |  |  | Không |
| `so_lan_dang_nhap_sai` | `int unsigned` |  |  | Không |
| `khoa_den_luc` | `datetime` |  |  | Có |
| `ngay_tao` | `datetime` |  |  | Không |
| `ten_dang_nhap` | `varchar(30)` |  |  | Có |
| `ma_can_ho_thanh_toan` | `int unsigned` |  | R32 | Có |
| `ma_cu_dan_phu_trach` | `int unsigned` |  | R33 | Có |
| `phien_ban_ban_giao` | `int unsigned` |  |  | Không |

## phan_anh

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_phan_anh` | `int unsigned` | ✓ |  | Không |
| `ma_tra_cuu` | `char(64)` |  |  | Không |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `ma_vi_tri_qr` | `int unsigned` |  | R36 | Không |
| `ma_nguoi_gui` | `int unsigned` |  | R37 | Có |
| `ten_nguoi_gui` | `varchar(100)` |  |  | Không |
| `so_dien_thoai_nguoi_gui` | `varchar(15)` |  |  | Không |
| `can_ho_khai_bao` | `varchar(40)` |  |  | Không |
| `tieu_de` | `varchar(150)` |  |  | Không |
| `noi_dung` | `text` |  |  | Không |
| `loai_su_co` | `enum('DIEN','NUOC','THANG_MAY','VE_SINH','AN_NINH','KHAC')` |  |  | Không |
| `do_uu_tien` | `enum('THAP','TRUNG_BINH','CAO','KHAN_CAP')` |  |  | Không |
| `trang_thai` | `enum('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY','DA_DONG','TU_CHOI','TRUNG')` |  |  | Không |
| `ma_ky_thuat_vien` | `int unsigned` |  | R38 | Có |
| `ma_phan_anh_goc` | `int unsigned` |  | R39 | Có |
| `phien_ban` | `int unsigned` |  |  | Không |
| `luot_xu_ly` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime` |  |  | Không |
| `ngay_dong` | `datetime` |  |  | Có |
| `ma_thiet_bi` | `int unsigned` |  | R34 | Có |
| `ma_tai_san_luc_gui` | `varchar(30)` |  |  | Có |
| `ten_thiet_bi_luc_gui` | `varchar(150)` |  |  | Có |
| `vi_tri_thiet_bi_luc_gui` | `varchar(160)` |  |  | Có |
| `ma_cu_dan_nguoi_gui` | `int unsigned` |  | R35 | Có |
| `gui_tu_tai_khoan_can_ho` | `tinyint(1)` |  |  | Không |

## phieu_bao_tri

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_phieu_bao_tri` | `int unsigned` | ✓ |  | Không |
| `ma_thiet_bi` | `int unsigned` |  | R40 | Không |
| `loai` | `enum('DINH_KY','DOT_XUAT')` |  |  | Không |
| `tieu_de` | `varchar(180)` |  |  | Không |
| `noi_dung` | `varchar(2000)` |  |  | Không |
| `ten_thiet_bi_luc_lap` | `varchar(150)` |  |  | Không |
| `vi_tri_luc_lap` | `varchar(160)` |  |  | Không |
| `ngay_lap` | `date` |  |  | Không |
| `ngay_den_han` | `date` |  |  | Không |
| `chu_ky_ngay` | `smallint unsigned` |  |  | Có |
| `do_uu_tien` | `enum('THUONG','CAO','KHAN_CAP')` |  |  | Không |
| `trang_thai` | `enum('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU','HOAN_THANH','HUY')` |  |  | Không |
| `ma_ky_thuat_vien` | `int unsigned` |  | R41 | Có |
| `ma_nguoi_lap` | `int unsigned` |  | R42 | Không |
| `ma_nguoi_nghiem_thu` | `int unsigned` |  | R43 | Có |
| `ma_nguoi_huy` | `int unsigned` |  | R44 | Có |
| `phien_ban` | `int unsigned` |  |  | Không |
| `luot_thuc_hien` | `int unsigned` |  |  | Không |
| `ngay_thuc_hien` | `date` |  |  | Có |
| `ket_qua` | `text` |  |  | Không |
| `nhan_xet_nghiem_thu` | `varchar(1000)` |  |  | Không |
| `ly_do_huy` | `varchar(500)` |  |  | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |
| `ngay_bat_dau` | `datetime(6)` |  |  | Có |
| `ngay_bao_cao` | `datetime(6)` |  |  | Có |
| `ngay_nghiem_thu` | `datetime(6)` |  |  | Có |
| `ngay_huy` | `datetime(6)` |  |  | Có |
| `khoa_yeu_cau` | `char(36)` |  |  | Không |
| `van_tay` | `char(64)` |  |  | Không |
| `dinh_ky_dang_mo` | `int unsigned` |  |  | Có |

## phieu_thu_chi

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_phieu` | `int unsigned` | ✓ |  | Không |
| `ma_quy` | `int unsigned` |  | R45 | Không |
| `loai` | `enum('THU','CHI')` |  |  | Không |
| `nhom` | `varchar(30)` |  |  | Không |
| `ngay_hach_toan` | `date` |  |  | Không |
| `so_tien` | `decimal(14,0)` |  |  | Không |
| `doi_tac` | `varchar(150)` |  |  | Không |
| `dien_giai` | `varchar(1000)` |  |  | Không |
| `trang_thai` | `enum('NHAP','DA_GHI_SO','HUY')` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ma_nguoi_lap` | `int unsigned` |  | R46 | Không |
| `ma_nguoi_duyet` | `int unsigned` |  | R47 | Có |
| `ngay_duyet` | `datetime(6)` |  |  | Có |
| `ngay_tao` | `datetime(6)` |  |  | Không |
| `ma_phieu_goc` | `int unsigned` |  | R48 | Có |
| `khoa_yeu_cau` | `char(36)` |  |  | Có |
| `van_tay` | `char(64)` |  |  | Có |

## phuong_tien

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_phuong_tien` | `int unsigned` | ✓ |  | Không |
| `ma_dang_ky` | `varchar(20)` |  |  | Không |
| `ma_cu_dan` | `int unsigned` |  | R49 | Không |
| `ma_can_ho` | `int unsigned` |  | R50 | Không |
| `ma_lich_su_cu_tru` | `int unsigned` |  | R51 | Không |
| `ma_dang_ky_truoc` | `int unsigned` |  | R52 | Có |
| `loai_xe` | `enum('O_TO','XE_MAY','XE_DAP')` |  |  | Không |
| `bien_so` | `varchar(15)` |  |  | Có |
| `hang_xe` | `varchar(50)` |  |  | Không |
| `mau_sac` | `varchar(50)` |  |  | Không |
| `ngay_dang_ky` | `date` |  |  | Không |
| `ngay_ket_thuc` | `date` |  |  | Có |
| `ly_do_ket_thuc` | `varchar(255)` |  |  | Không |
| `ma_nguoi_tao` | `int unsigned` |  | R53 | Không |
| `ma_nguoi_ket_thuc` | `int unsigned` |  | R54 | Có |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |
| `bien_so_dang_hoat_dong` | `varchar(15)` |  |  | Có |

## quy_tai_chinh

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_quy` | `int unsigned` | ✓ |  | Không |
| `ten_quy` | `varchar(120)` |  |  | Không |
| `mo_ta` | `varchar(1000)` |  |  | Không |
| `dang_hoat_dong` | `tinyint(1)` |  |  | Không |
| `nhan_thu_hoa_don` | `tinyint(1)` |  |  | Không |
| `quy_hoa_don` | `tinyint` |  |  | Có |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## schema_migrations

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `name` | `varchar(100)` | ✓ |  | Không |
| `checksum` | `char(64)` |  |  | Không |

## tang_toa_nha

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `khoi` | `varchar(10)` | ✓ | R55 | Không |
| `tang` | `smallint unsigned` | ✓ |  | Không |
| `ten_tang` | `varchar(100)` |  |  | Không |
| `mo_ta` | `varchar(255)` |  |  | Không |
| `giu_khi_trong` | `tinyint(1)` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ngay_tao` | `datetime` |  |  | Không |

## thiet_bi

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_thiet_bi` | `int unsigned` | ✓ |  | Không |
| `ma_tai_san` | `varchar(30)` |  |  | Không |
| `ten_thiet_bi` | `varchar(150)` |  |  | Không |
| `loai` | `enum('THANG_MAY','MAY_BOM','PCCC','DIEN','NUOC','CAMERA','KHAC')` |  |  | Không |
| `vi_tri` | `varchar(160)` |  |  | Không |
| `so_serial` | `varchar(100)` |  |  | Không |
| `ngay_lap_dat` | `date` |  |  | Có |
| `ghi_chu` | `varchar(1000)` |  |  | Không |
| `trang_thai` | `enum('DANG_SU_DUNG','TAM_DUNG','NGUNG_SU_DUNG')` |  |  | Không |
| `chu_ky_ngay` | `smallint unsigned` |  |  | Có |
| `ngay_bao_tri_tiep_theo` | `date` |  |  | Có |
| `nhac_truoc_ngay` | `tinyint unsigned` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ma_nguoi_tao` | `int unsigned` |  | R56 | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |
| `ngay_cap_nhat` | `datetime(6)` |  |  | Không |

## thong_bao

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_thong_bao` | `int unsigned` | ✓ |  | Không |
| `loai` | `enum('THONG_BAO','NHAC_PHI')` |  |  | Không |
| `tieu_de` | `varchar(160)` |  |  | Không |
| `noi_dung` | `text` |  |  | Không |
| `pham_vi` | `enum('TOAN_BO','KHOI','CAN_HO')` |  |  | Không |
| `khoi` | `varchar(10)` |  |  | Có |
| `ma_can_ho` | `int unsigned` |  | R57 | Có |
| `muc_do` | `enum('THUONG','QUAN_TRONG')` |  |  | Không |
| `trang_thai` | `enum('NHAP','DA_GUI','THU_HOI')` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ma_hoa_don` | `int unsigned` |  | R58 | Có |
| `ngay_nhac` | `date` |  |  | Có |
| `ma_nguoi_tao` | `int unsigned` |  | R59 | Không |
| `ma_nguoi_gui` | `int unsigned` |  | R60 | Có |
| `ma_nguoi_thu_hoi` | `int unsigned` |  | R61 | Có |
| `ngay_tao` | `datetime(6)` |  |  | Không |
| `ngay_gui` | `datetime(6)` |  |  | Có |
| `ngay_thu_hoi` | `datetime(6)` |  |  | Có |
| `ly_do_thu_hoi` | `varchar(255)` |  |  | Có |

## thong_bao_da_doc

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_thong_bao` | `int unsigned` | ✓ | R62 | Không |
| `ma_nguoi_dung` | `int unsigned` | ✓ | R63 | Không |
| `nguoi_tiep_nhan` | `int unsigned` | ✓ |  | Không |
| `ngay_doc` | `datetime(6)` |  |  | Không |

## tien_ich

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_tien_ich` | `int unsigned` | ✓ |  | Không |
| `ten_tien_ich` | `varchar(120)` |  |  | Không |
| `vi_tri` | `varchar(160)` |  |  | Không |
| `mo_ta` | `text` |  |  | Không |
| `suc_chua` | `smallint unsigned` |  |  | Không |
| `gio_mo` | `time` |  |  | Không |
| `gio_dong` | `time` |  |  | Không |
| `toi_da_phut` | `smallint unsigned` |  |  | Không |
| `dat_truoc_ngay` | `smallint unsigned` |  |  | Không |
| `dang_mo` | `tinyint(1)` |  |  | Không |
| `phien_ban` | `int unsigned` |  |  | Không |
| `ma_nguoi_tao` | `int unsigned` |  | R64 | Không |
| `ngay_tao` | `datetime(6)` |  |  | Không |

## vi_tri_qr

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_vi_tri_qr` | `int unsigned` | ✓ |  | Không |
| `ten_vi_tri` | `varchar(100)` |  |  | Không |
| `loai` | `enum('KHU_VUC','THIET_BI')` |  |  | Không |
| `mo_ta` | `varchar(255)` |  |  | Không |
| `token_qr` | `char(36)` |  |  | Không |
| `dang_hoat_dong` | `tinyint(1)` |  |  | Không |
| `ma_nguoi_tao` | `int unsigned` |  | R66 | Không |
| `ngay_tao` | `datetime` |  |  | Không |
| `ma_thiet_bi` | `int unsigned` |  | R65 | Có |
| `phien_ban` | `int unsigned` |  |  | Không |

## yeu_cau_gui

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `khoa` | `char(36)` | ✓ |  | Không |
| `van_tay` | `char(64)` |  |  | Không |
| `ma_phan_anh` | `int unsigned` |  | R67 | Có |

## nhat_ky_nghiep_vu

| Cột | Kiểu dữ liệu | PK | FK trên hình | Cho phép NULL |
|---|---|---|---|---|
| `ma_nhat_ky` | `BIGINT UNSIGNED` | ✓ |  | Không |
| `loai_nhat_ky` | `VARCHAR(40)` |  |  | Không |
| `ma_goc` | `INT UNSIGNED` |  |  | Có |
| `ma_nguoi_thuc_hien` | `INT UNSIGNED` |  | R68 | Có |
| `su_kien` | `VARCHAR(40)` |  |  | Không |
| `ghi_chu` | `TEXT` |  |  | Có |
| `chi_tiet` | `JSON` |  |  | Không |
| `ngay_tao` | `DATETIME(6)` |  |  | Không |
| `ma_phan_anh` | `INT UNSIGNED` |  | R69 | Có |
| `ma_hoa_don` | `INT UNSIGNED` |  | R70 | Có |
| `ma_can_ho` | `INT UNSIGNED` |  | R71 | Có |
| `ma_thong_bao` | `INT UNSIGNED` |  | R72 | Có |
| `ma_thiet_bi` | `INT UNSIGNED` |  | R73 | Có |
| `ma_phieu_bao_tri` | `INT UNSIGNED` |  | R74 | Có |
| `ma_dat_lich` | `INT UNSIGNED` |  | R75 | Có |
| `ma_phieu` | `INT UNSIGNED` |  | R76 | Có |
| `ma_vi_tri_qr` | `INT UNSIGNED` |  | R77 | Có |
| `ma_ky_thuat_vien_cu` | `INT UNSIGNED` |  | R78 | Có |
| `ma_ky_thuat_vien_moi` | `INT UNSIGNED` |  | R79 | Có |
| `ma_thiet_bi_cu` | `INT UNSIGNED` |  | R80 | Có |
| `ma_thiet_bi_moi` | `INT UNSIGNED` |  | R81 | Có |
