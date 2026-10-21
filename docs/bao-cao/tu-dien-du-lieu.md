# Từ điển dữ liệu vật lý

Sinh từ metadata MySQL bằng `scripts/export-schema.js`. Không đọc dữ liệu nghiệp vụ, thông tin đăng nhập hoặc nội dung ảnh. Phản ánh schema tại lúc xuất; không tự phát hiện mọi thay đổi DDL thủ công ngoài migration.

Nguồn: 18 migration, cuối cùng **018_equipment_qr.sql**. Tổng **38 bảng**, **395 cột**, **87 ràng buộc khóa ngoại**.

`NULL` là không có giá trị; `—` ở mặc định nghĩa metadata không có mặc định khác NULL. Kiểu, chỉ mục, biểu thức cột sinh và CHECK bên dưới lấy từ MySQL. Quan hệ nullable không bắt buộc có bản ghi cha; UNIQUE của cột sinh có thể chỉ áp dụng cho bản ghi đang hoạt động, cần đọc biểu thức sinh và service.

## Danh mục bảng

- [can_ho](#can_ho)
- [cau_hinh_phi](#cau_hinh_phi)
- [chi_so_dich_vu](#chi_so_dich_vu)
- [chi_tiet_hoa_don](#chi_tiet_hoa_don)
- [chung_tu_thu_chi](#chung_tu_thu_chi)
- [cu_dan](#cu_dan)
- [dat_lich_tien_ich](#dat_lich_tien_ich)
- [dot_lap_hoa_don](#dot_lap_hoa_don)
- [dot_nhap_du_lieu](#dot_nhap_du_lieu)
- [dot_xu_ly_hoa_don](#dot_xu_ly_hoa_don)
- [gioi_han_gui](#gioi_han_gui)
- [hinh_anh_phan_anh](#hinh_anh_phan_anh)
- [hoa_don](#hoa_don)
- [khoi_toa_nha](#khoi_toa_nha)
- [lich_su_ban_giao_can_ho](#lich_su_ban_giao_can_ho)
- [lich_su_bao_tri](#lich_su_bao_tri)
- [lich_su_cu_tru](#lich_su_cu_tru)
- [lich_su_dat_lich](#lich_su_dat_lich)
- [lich_su_hoa_don](#lich_su_hoa_don)
- [lich_su_lien_ket_qr](#lich_su_lien_ket_qr)
- [lich_su_phan_anh](#lich_su_phan_anh)
- [lich_su_thong_bao](#lich_su_thong_bao)
- [lich_su_thu_chi](#lich_su_thu_chi)
- [loai_phi](#loai_phi)
- [nguoi_dung](#nguoi_dung)
- [phan_anh](#phan_anh)
- [phieu_bao_tri](#phieu_bao_tri)
- [phieu_thu_chi](#phieu_thu_chi)
- [phuong_tien](#phuong_tien)
- [quy_tai_chinh](#quy_tai_chinh)
- [schema_migrations](#schema_migrations)
- [tang_toa_nha](#tang_toa_nha)
- [thiet_bi](#thiet_bi)
- [thong_bao](#thong_bao)
- [thong_bao_da_doc](#thong_bao_da_doc)
- [tien_ich](#tien_ich)
- [vi_tri_qr](#vi_tri_qr)
- [yeu_cau_gui](#yeu_cau_gui)

## can_ho

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_can_ho | int unsigned | Không | — | auto_increment |
| so_can_ho | varchar(20) | Không | — |  |
| khoi | varchar(10) | Không | — |  |
| tang | smallint unsigned | Không | — |  |
| dien_tich_m2 | decimal(8,2) | Không | — |  |
| tinh_phi_dich_vu | tinyint(1) | Không | 1 |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- idx_floor (INDEX): khoi, tang.
- PRIMARY (UNIQUE): ma_can_ho.
- so_can_ho (UNIQUE): so_can_ho.
- FK fk_apartment_floor: (khoi, tang) → tang_toa_nha (khoi, tang); UPDATE CASCADE, DELETE NO ACTION.
- CHECK can_ho_chk_1: (&#96;dien_tich_m2&#96; > 0).

## cau_hinh_phi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_cau_hinh_phi | int unsigned | Không | — | auto_increment |
| loai_phi | varchar(30) | Không | — |  |
| don_gia | decimal(12,2) | Không | — |  |
| tu_ngay | date | Không | — |  |
| den_ngay | date | Có | — |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| cach_tinh | enum('DON_GIA','BAC_THANG') | Không | DON_GIA |  |
| thue_gtgt | decimal(5,2) | Không | 0.00 |  |
| bac_dien | json | Có | — |  |

**Chỉ mục**

- loai_phi (UNIQUE): loai_phi, tu_ngay.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- PRIMARY (UNIQUE): ma_cau_hinh_phi.
- FK cau_hinh_phi_ibfk_1: (loai_phi) → loai_phi (loai_phi); UPDATE NO ACTION, DELETE NO ACTION.
- FK cau_hinh_phi_ibfk_2: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK cau_hinh_phi_chk_1: (&#96;don_gia&#96; >= 0).
- CHECK cau_hinh_phi_chk_2: ((&#96;den_ngay&#96; is null) or (&#96;den_ngay&#96; > &#96;tu_ngay&#96;)).
- CHECK chk_fee_electricity: (((&#96;loai_phi&#96; = _utf8mb4\'TIEN_DIEN\') and (((&#96;cach_tinh&#96; = _utf8mb4\'DON_GIA\') and (&#96;bac_dien&#96; is null)) or ((&#96;cach_tinh&#96; = _utf8mb4\'BAC_THANG\') and (&#96;bac_dien&#96; is not null) and (&#96;don_gia&#96; = 0)))) or ((&#96;loai_phi&#96; <> _utf8mb4\'TIEN_DIEN\') and (&#96;cach_tinh&#96; = _utf8mb4\'DON_GIA\') and (&#96;thue_gtgt&#96; = 0) and (&#96;bac_dien&#96; is null))).
- CHECK chk_fee_vat: ((&#96;thue_gtgt&#96; >= 0) and (&#96;thue_gtgt&#96; <= 100)).

## chi_so_dich_vu

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chi_so_dich_vu | int unsigned | Không | — | auto_increment |
| ma_can_ho | int unsigned | Không | — |  |
| loai_dich_vu | enum('DIEN','NUOC') | Không | — |  |
| ky_thanh_toan | char(7) | Không | — |  |
| chi_so_cu | decimal(12,3) | Không | — |  |
| chi_so_moi | decimal(12,3) | Không | — |  |
| ngay_chot | date | Không | — |  |
| ghi_chu | varchar(255) | Không |  |  |
| ma_nguoi_ghi | int unsigned | Không | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_ghi | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- ma_can_ho (UNIQUE): ma_can_ho, loai_dich_vu, ky_thanh_toan.
- ma_nguoi_ghi (INDEX): ma_nguoi_ghi.
- PRIMARY (UNIQUE): ma_chi_so_dich_vu.
- FK chi_so_dich_vu_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_so_dich_vu_ibfk_2: (ma_nguoi_ghi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chi_so_dich_vu_chk_1: ((&#96;chi_so_cu&#96; >= 0) and (&#96;chi_so_moi&#96; >= &#96;chi_so_cu&#96;)).

## chi_tiet_hoa_don

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chi_tiet_hoa_don | int unsigned | Không | — | auto_increment |
| ma_hoa_don | int unsigned | Không | — |  |
| ma_cau_hinh_phi | int unsigned | Không | — |  |
| ma_chi_so_dich_vu | int unsigned | Có | — |  |
| loai_phi | varchar(30) | Không | — |  |
| dien_giai | varchar(255) | Không | — |  |
| don_vi_tinh | varchar(20) | Không | — |  |
| so_luong | decimal(12,3) | Không | — |  |
| don_gia | decimal(16,2) | Không | — |  |
| thanh_tien | decimal(14,0) | Không | — |  |
| du_lieu_nguon | json | Không | — |  |

**Chỉ mục**

- ma_cau_hinh_phi (INDEX): ma_cau_hinh_phi.
- ma_chi_so_dich_vu (INDEX): ma_chi_so_dich_vu.
- ma_hoa_don (INDEX): ma_hoa_don.
- PRIMARY (UNIQUE): ma_chi_tiet_hoa_don.
- FK chi_tiet_hoa_don_ibfk_1: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_tiet_hoa_don_ibfk_2: (ma_cau_hinh_phi) → cau_hinh_phi (ma_cau_hinh_phi); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_tiet_hoa_don_ibfk_3: (ma_chi_so_dich_vu) → chi_so_dich_vu (ma_chi_so_dich_vu); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chi_tiet_hoa_don_chk_1: ((&#96;so_luong&#96; >= 0) and (&#96;don_gia&#96; >= 0) and (&#96;thanh_tien&#96; >= 0)).

## chung_tu_thu_chi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chung_tu | int unsigned | Không | — | auto_increment |
| ma_phieu | int unsigned | Không | — |  |
| ten_tep | varchar(120) | Không | — |  |
| loai_tep | enum('image/jpeg','application/pdf') | Không | — |  |
| kich_thuoc | int unsigned | Không | — |  |
| bam_sha256 | char(64) | Không | — |  |
| noi_dung | mediumblob | Không | — |  |
| ma_nguoi_tai | int unsigned | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- ma_nguoi_tai (INDEX): ma_nguoi_tai.
- ma_phieu (UNIQUE): ma_phieu, bam_sha256.
- PRIMARY (UNIQUE): ma_chung_tu.
- FK chung_tu_thu_chi_ibfk_1: (ma_phieu) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE CASCADE.
- FK chung_tu_thu_chi_ibfk_2: (ma_nguoi_tai) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chung_tu_thu_chi_chk_1: (&#96;kich_thuoc&#96; between 1 and 5242880).
- CHECK chung_tu_thu_chi_chk_2: (&#96;kich_thuoc&#96; = length(&#96;noi_dung&#96;)).

## cu_dan

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_cu_dan | int unsigned | Không | — | auto_increment |
| ho_va_ten | varchar(100) | Không | — |  |
| so_dien_thoai | varchar(15) | Không | — |  |
| ma_nguoi_dung | int unsigned | Có | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- ma_nguoi_dung (UNIQUE): ma_nguoi_dung.
- PRIMARY (UNIQUE): ma_cu_dan.
- FK cu_dan_ibfk_1: (ma_nguoi_dung) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## dat_lich_tien_ich

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dat_lich | int unsigned | Không | — | auto_increment |
| ma_tien_ich | int unsigned | Không | — |  |
| ma_can_ho | int unsigned | Không | — |  |
| ma_nguoi_dat | int unsigned | Không | — |  |
| ma_cu_dan | int unsigned | Không | — |  |
| ma_lich_su_cu_tru | int unsigned | Không | — |  |
| ten_tien_ich | varchar(120) | Không | — |  |
| vi_tri | varchar(160) | Không | — |  |
| ten_nguoi_dat | varchar(100) | Không | — |  |
| bat_dau | datetime | Không | — |  |
| ket_thuc | datetime | Không | — |  |
| so_nguoi | smallint unsigned | Không | — |  |
| ghi_chu | varchar(1000) | Không | — |  |
| trang_thai | enum('CHO_DUYET','DA_DUYET','TU_CHOI','DA_HUY') | Không | CHO_DUYET |  |
| phien_ban | int unsigned | Không | 0 |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| van_tay | char(64) | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_booking_apartment (INDEX): ma_can_ho, bat_dau, ma_dat_lich.
- idx_booking_creator (INDEX): ma_nguoi_dat, bat_dau, ma_dat_lich.
- idx_booking_overlap (INDEX): ma_tien_ich, trang_thai, bat_dau, ket_thuc.
- khoa_yeu_cau (UNIQUE): khoa_yeu_cau.
- ma_cu_dan (INDEX): ma_cu_dan.
- ma_lich_su_cu_tru (INDEX): ma_lich_su_cu_tru.
- PRIMARY (UNIQUE): ma_dat_lich.
- FK dat_lich_tien_ich_ibfk_1: (ma_tien_ich) → tien_ich (ma_tien_ich); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_3: (ma_nguoi_dat) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_4: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_5: (ma_lich_su_cu_tru) → lich_su_cu_tru (ma_lich_su_cu_tru); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dat_lich_tien_ich_chk_1: (&#96;so_nguoi&#96; between 1 and 1000).
- CHECK dat_lich_tien_ich_chk_2: ((&#96;ket_thuc&#96; > &#96;bat_dau&#96;) and (cast(&#96;bat_dau&#96; as date) = cast(&#96;ket_thuc&#96; as date))).
- CHECK dat_lich_tien_ich_chk_3: ((second(&#96;bat_dau&#96;) = 0) and (minute(&#96;bat_dau&#96;) in (0,30)) and (second(&#96;ket_thuc&#96;) = 0) and (minute(&#96;ket_thuc&#96;) in (0,30))).
- CHECK dat_lich_tien_ich_chk_4: (timestampdiff(MINUTE,&#96;bat_dau&#96;,&#96;ket_thuc&#96;) between 30 and 360).

## dot_lap_hoa_don

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_lap | int unsigned | Không | — | auto_increment |
| ma_nguoi_lap | int unsigned | Không | — |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| dau_vao_sha256 | char(64) | Không | — |  |
| ket_qua | json | Có | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_lap.
- uq_bill_batch_request (UNIQUE): ma_nguoi_lap, khoa_yeu_cau.
- FK dot_lap_hoa_don_ibfk_1: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_lap_hoa_don_chk_1: ((&#96;ket_qua&#96; is null) or (json_type(&#96;ket_qua&#96;) = _utf8mb4\'OBJECT\')).

## dot_nhap_du_lieu

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_nhap | bigint unsigned | Không | — | auto_increment |
| ma_nguoi_nhap | int unsigned | Không | — |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| phan_he | varchar(30) | Không | — |  |
| sha256 | char(64) | Không | — |  |
| so_dong | smallint unsigned | Không | — |  |
| ket_qua | json | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_nhap.
- uq_import_file (UNIQUE): ma_nguoi_nhap, phan_he, sha256.
- uq_import_request (UNIQUE): ma_nguoi_nhap, khoa_yeu_cau.
- FK dot_nhap_du_lieu_ibfk_1: (ma_nguoi_nhap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_nhap_du_lieu_chk_1: (&#96;so_dong&#96; between 1 and 100).

## dot_xu_ly_hoa_don

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_xu_ly | int unsigned | Không | — | auto_increment |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| thao_tac | enum('DUYET','GUI') | Không | — |  |
| dau_vao_sha256 | char(64) | Không | — |  |
| ket_qua | json | Có | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_xu_ly.
- uq_bill_action_request (UNIQUE): ma_nguoi_thuc_hien, khoa_yeu_cau.
- FK dot_xu_ly_hoa_don_ibfk_1: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_xu_ly_hoa_don_chk_1: ((&#96;ket_qua&#96; is null) or (json_type(&#96;ket_qua&#96;) = _utf8mb4\'OBJECT\')).

## gioi_han_gui

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoa | char(64) | Không | — |  |
| cac_moc_thoi_gian | json | Không | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): khoa.

## hinh_anh_phan_anh

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_hinh_anh_phan_anh | int unsigned | Không | — | auto_increment |
| ma_phan_anh | int unsigned | Không | — |  |
| duong_dan_tep | varchar(80) | Không | — |  |
| loai | enum('PHAN_ANH','NGHIEM_THU') | Không | — |  |
| luot_xu_ly | int unsigned | Không | — |  |
| ma_nguoi_tai_len | int unsigned | Có | — |  |
| ngay_tai_len | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- duong_dan_tep (UNIQUE): duong_dan_tep.
- ma_nguoi_tai_len (INDEX): ma_nguoi_tai_len.
- ma_phan_anh (INDEX): ma_phan_anh.
- PRIMARY (UNIQUE): ma_hinh_anh_phan_anh.
- FK hinh_anh_phan_anh_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- FK hinh_anh_phan_anh_ibfk_2: (ma_nguoi_tai_len) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## hoa_don

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_hoa_don | int unsigned | Không | — | auto_increment |
| so_hoa_don | varchar(25) | Không | — |  |
| ma_can_ho | int unsigned | Không | — |  |
| ky_thanh_toan | char(7) | Không | — |  |
| ngay_chot_phi | date | Không | — |  |
| lan_lap | int unsigned | Không | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| trang_thai | enum('NHAP','DA_DUYET','DA_GUI','DA_THANH_TOAN','HUY') | Không | NHAP |  |
| tinh_nuoc | tinyint(1) | Không | — |  |
| tinh_dien | tinyint(1) | Không | — |  |
| tinh_xe | tinyint(1) | Không | — |  |
| tong_tien | decimal(14,0) | Không | 0 |  |
| loi_du_lieu | json | Không | — |  |
| dau_van_tay | char(64) | Không | — |  |
| han_thanh_toan | date | Có | — |  |
| ma_ngan_hang | char(6) | Không |  |  |
| so_tai_khoan | varchar(30) | Không |  |  |
| ten_nguoi_nhan | varchar(100) | Không |  |  |
| ma_hoa_don_thay_the_cho | int unsigned | Có | — |  |
| ma_nguoi_lap | int unsigned | Không | — |  |
| ma_nguoi_duyet | int unsigned | Có | — |  |
| ma_nguoi_gui | int unsigned | Có | — |  |
| ma_nguoi_huy | int unsigned | Có | — |  |
| ma_nguoi_xac_nhan | int unsigned | Có | — |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| ngay_duyet | datetime | Có | — |  |
| ngay_gui | datetime | Có | — |  |
| ngay_huy | datetime | Có | — |  |
| ngay_thanh_toan | datetime | Có | — |  |
| ly_do_huy | varchar(255) | Không |  |  |
| so_tien_da_thu | decimal(14,0) | Không | 0 |  |
| ma_tham_chieu | varchar(100) | Có | — |  |
| hieu_luc | tinyint | Có | — | STORED GENERATED; (case when (&#96;trang_thai&#96; = _utf8mb4\'HUY\') then NULL else 1 end) |

**Chỉ mục**

- idx_bill_source (INDEX): ma_can_ho, trang_thai, ngay_chot_phi.
- ma_can_ho (UNIQUE): ma_can_ho, ky_thanh_toan, lan_lap.
- ma_can_ho_2 (UNIQUE): ma_can_ho, ky_thanh_toan, hieu_luc.
- ma_hoa_don_thay_the_cho (UNIQUE): ma_hoa_don_thay_the_cho.
- ma_nguoi_duyet (INDEX): ma_nguoi_duyet.
- ma_nguoi_gui (INDEX): ma_nguoi_gui.
- ma_nguoi_huy (INDEX): ma_nguoi_huy.
- ma_nguoi_lap (INDEX): ma_nguoi_lap.
- ma_nguoi_xac_nhan (INDEX): ma_nguoi_xac_nhan.
- ma_tham_chieu (UNIQUE): ma_tham_chieu.
- PRIMARY (UNIQUE): ma_hoa_don.
- so_hoa_don (UNIQUE): so_hoa_don.
- FK hoa_don_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_2: (ma_hoa_don_thay_the_cho) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_3: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_4: (ma_nguoi_duyet) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_5: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_6: (ma_nguoi_huy) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_7: (ma_nguoi_xac_nhan) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK hoa_don_chk_1: ((&#96;tong_tien&#96; >= 0) and (&#96;so_tien_da_thu&#96; >= 0)).
- CHECK hoa_don_chk_2: ((&#96;trang_thai&#96; <> _utf8mb4\'DA_THANH_TOAN\') or ((&#96;so_tien_da_thu&#96; = &#96;tong_tien&#96;) and (&#96;ma_tham_chieu&#96; is not null))).

## khoi_toa_nha

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoi | varchar(10) | Không | — |  |
| ten_khoi | varchar(100) | Không |  |  |
| mo_ta | varchar(255) | Không |  |  |
| giu_khi_trong | tinyint(1) | Không | 1 |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): khoi.

## lich_su_ban_giao_can_ho

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_ban_giao | int unsigned | Không | — | auto_increment |
| ma_can_ho | int unsigned | Không | — |  |
| ma_cu_dan_cu | int unsigned | Có | — |  |
| ma_cu_dan_moi | int unsigned | Có | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| su_kien | varchar(30) | Không | — |  |
| ngay_thuc_hien | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_handover_apartment (INDEX): ma_can_ho, ma_ban_giao.
- ma_cu_dan_cu (INDEX): ma_cu_dan_cu.
- ma_cu_dan_moi (INDEX): ma_cu_dan_moi.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- PRIMARY (UNIQUE): ma_ban_giao.
- FK lich_su_ban_giao_can_ho_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_ban_giao_can_ho_ibfk_4: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_bao_tri

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | int unsigned | Không | — | auto_increment |
| ma_thiet_bi | int unsigned | Không | — |  |
| ma_phieu_bao_tri | int unsigned | Có | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| su_kien | varchar(30) | Không | — |  |
| ghi_chu | text | Không | — |  |
| du_lieu | json | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_maintenance_history (INDEX): ma_thiet_bi, ma_phieu_bao_tri, ma_lich_su.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- ma_phieu_bao_tri (INDEX): ma_phieu_bao_tri.
- PRIMARY (UNIQUE): ma_lich_su.
- FK lich_su_bao_tri_ibfk_1: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_bao_tri_ibfk_2: (ma_phieu_bao_tri) → phieu_bao_tri (ma_phieu_bao_tri); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_bao_tri_ibfk_3: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_cu_tru

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_cu_tru | int unsigned | Không | — | auto_increment |
| ma_cu_dan | int unsigned | Không | — |  |
| ma_can_ho | int unsigned | Không | — |  |
| quan_he | enum('CHU_HO','THANH_VIEN','NGUOI_THUE') | Không | — |  |
| tu_ngay | date | Không | — |  |
| den_ngay | date | Có | — |  |
| ma_nguoi_ghi_nhan | int unsigned | Không | — |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| cu_dan_dang_o | int unsigned | Có | — | STORED GENERATED; (case when (&#96;den_ngay&#96; is null) then &#96;ma_cu_dan&#96; else NULL end) |

**Chỉ mục**

- cu_dan_dang_o (UNIQUE): cu_dan_dang_o.
- idx_apartment_period (INDEX): ma_can_ho, tu_ngay, den_ngay.
- idx_resident_period (INDEX): ma_cu_dan, tu_ngay, den_ngay.
- ma_nguoi_ghi_nhan (INDEX): ma_nguoi_ghi_nhan.
- PRIMARY (UNIQUE): ma_lich_su_cu_tru.
- FK lich_su_cu_tru_ibfk_1: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_cu_tru_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_cu_tru_ibfk_3: (ma_nguoi_ghi_nhan) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_cu_tru_thu_tu_ngay: ((&#96;den_ngay&#96; is null) or (&#96;den_ngay&#96; >= &#96;tu_ngay&#96;)).

## lich_su_dat_lich

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | int unsigned | Không | — | auto_increment |
| ma_dat_lich | int unsigned | Không | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| su_kien | enum('DAT_LICH','DUYET','TU_CHOI','HUY') | Không | — |  |
| ghi_chu | varchar(1000) | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_booking_history (INDEX): ma_dat_lich, ma_lich_su.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- PRIMARY (UNIQUE): ma_lich_su.
- FK lich_su_dat_lich_ibfk_1: (ma_dat_lich) → dat_lich_tien_ich (ma_dat_lich); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_dat_lich_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_hoa_don

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_hoa_don | int unsigned | Không | — | auto_increment |
| ma_hoa_don | int unsigned | Không | — |  |
| su_kien | varchar(30) | Không | — |  |
| ma_nguoi_ghi | int unsigned | Không | — |  |
| ghi_chu | varchar(255) | Không |  |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- ma_hoa_don (INDEX): ma_hoa_don.
- ma_nguoi_ghi (INDEX): ma_nguoi_ghi.
- PRIMARY (UNIQUE): ma_lich_su_hoa_don.
- FK lich_su_hoa_don_ibfk_1: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_hoa_don_ibfk_2: (ma_nguoi_ghi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_lien_ket_qr

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | int unsigned | Không | — | auto_increment |
| ma_vi_tri_qr | int unsigned | Không | — |  |
| ma_thiet_bi_cu | int unsigned | Có | — |  |
| ma_thiet_bi_moi | int unsigned | Có | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_qr_link_history (INDEX): ma_vi_tri_qr, ma_lich_su.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- ma_thiet_bi_cu (INDEX): ma_thiet_bi_cu.
- ma_thiet_bi_moi (INDEX): ma_thiet_bi_moi.
- PRIMARY (UNIQUE): ma_lich_su.
- FK lich_su_lien_ket_qr_ibfk_1: (ma_vi_tri_qr) → vi_tri_qr (ma_vi_tri_qr); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_lien_ket_qr_ibfk_2: (ma_thiet_bi_cu) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_lien_ket_qr_ibfk_3: (ma_thiet_bi_moi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_lien_ket_qr_ibfk_4: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_phan_anh

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_phan_anh | int unsigned | Không | — | auto_increment |
| ma_phan_anh | int unsigned | Không | — |  |
| loai_su_kien | varchar(40) | Không | — |  |
| trang_thai_cu | varchar(20) | Có | — |  |
| trang_thai_moi | varchar(20) | Không | — |  |
| ma_nguoi_thay_doi | int unsigned | Có | — |  |
| ma_ky_thuat_vien_cu | int unsigned | Có | — |  |
| ma_ky_thuat_vien_moi | int unsigned | Có | — |  |
| ghi_chu | varchar(500) | Không |  |  |
| noi_dung_cong_khai | varchar(500) | Không |  |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- ma_ky_thuat_vien_cu (INDEX): ma_ky_thuat_vien_cu.
- ma_ky_thuat_vien_moi (INDEX): ma_ky_thuat_vien_moi.
- ma_nguoi_thay_doi (INDEX): ma_nguoi_thay_doi.
- ma_phan_anh (INDEX): ma_phan_anh.
- PRIMARY (UNIQUE): ma_lich_su_phan_anh.
- FK lich_su_phan_anh_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_2: (ma_nguoi_thay_doi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_3: (ma_ky_thuat_vien_cu) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_4: (ma_ky_thuat_vien_moi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_thong_bao

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | int unsigned | Không | — | auto_increment |
| ma_thong_bao | int unsigned | Không | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| su_kien | varchar(30) | Không | — |  |
| ghi_chu | varchar(255) | Có | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_announcement_history (INDEX): ma_thong_bao, ma_lich_su.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- PRIMARY (UNIQUE): ma_lich_su.
- FK lich_su_thong_bao_ibfk_1: (ma_thong_bao) → thong_bao (ma_thong_bao); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_thong_bao_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## lich_su_thu_chi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | int unsigned | Không | — | auto_increment |
| ma_phieu | int unsigned | Không | — |  |
| ma_nguoi_thuc_hien | int unsigned | Không | — |  |
| su_kien | varchar(30) | Không | — |  |
| ghi_chu | text | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_treasury_history (INDEX): ma_phieu, ma_lich_su.
- ma_nguoi_thuc_hien (INDEX): ma_nguoi_thuc_hien.
- PRIMARY (UNIQUE): ma_lich_su.
- FK lich_su_thu_chi_ibfk_1: (ma_phieu) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_thu_chi_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.

## loai_phi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| loai_phi | varchar(30) | Không | — |  |
| ten_phi | varchar(80) | Không | — |  |
| don_vi_tinh | varchar(20) | Không | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): loai_phi.

## nguoi_dung

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_nguoi_dung | int unsigned | Không | — | auto_increment |
| ho_va_ten | varchar(100) | Không | — |  |
| so_dien_thoai | varchar(15) | Có | — |  |
| mat_khau_ma_hoa | varchar(255) | Không | — |  |
| vai_tro | enum('QUAN_TRI_VIEN','KY_THUAT_VIEN','CU_DAN') | Không | — |  |
| chuyen_mon | varchar(100) | Không |  |  |
| dang_hoat_dong | tinyint(1) | Không | 1 |  |
| phien_ban_token | int unsigned | Không | 0 |  |
| so_lan_dang_nhap_sai | int unsigned | Không | 0 |  |
| khoa_den_luc | datetime | Có | — |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| ten_dang_nhap | varchar(30) | Có | — |  |
| ma_can_ho_thanh_toan | int unsigned | Có | — |  |
| ma_cu_dan_phu_trach | int unsigned | Có | — |  |
| phien_ban_ban_giao | int unsigned | Không | 0 |  |

**Chỉ mục**

- ma_can_ho_thanh_toan (UNIQUE): ma_can_ho_thanh_toan.
- ma_cu_dan_phu_trach (UNIQUE): ma_cu_dan_phu_trach.
- PRIMARY (UNIQUE): ma_nguoi_dung.
- so_dien_thoai (UNIQUE): so_dien_thoai.
- ten_dang_nhap (UNIQUE): ten_dang_nhap.
- FK fk_account_apartment: (ma_can_ho_thanh_toan) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE CASCADE.
- FK fk_account_owner: (ma_cu_dan_phu_trach) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE SET NULL.
- CHECK chk_apartment_account: (((&#96;ma_can_ho_thanh_toan&#96; is null) and (&#96;ten_dang_nhap&#96; is null)) or ((&#96;ma_can_ho_thanh_toan&#96; is not null) and (&#96;ten_dang_nhap&#96; is not null) and (&#96;so_dien_thoai&#96; is null) and (&#96;vai_tro&#96; = _utf8mb4\'CU_DAN\'))).

## phan_anh

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phan_anh | int unsigned | Không | — | auto_increment |
| ma_tra_cuu | char(64) | Không | — |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| ma_vi_tri_qr | int unsigned | Không | — |  |
| ma_nguoi_gui | int unsigned | Có | — |  |
| ten_nguoi_gui | varchar(100) | Không | — |  |
| so_dien_thoai_nguoi_gui | varchar(15) | Không | — |  |
| can_ho_khai_bao | varchar(40) | Không |  |  |
| tieu_de | varchar(150) | Không | — |  |
| noi_dung | text | Không | — |  |
| loai_su_co | enum('DIEN','NUOC','THANG_MAY','VE_SINH','AN_NINH','KHAC') | Không | — |  |
| do_uu_tien | enum('THAP','TRUNG_BINH','CAO','KHAN_CAP') | Không | TRUNG_BINH |  |
| trang_thai | enum('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY','DA_DONG','TU_CHOI','TRUNG') | Không | MOI |  |
| ma_ky_thuat_vien | int unsigned | Có | — |  |
| ma_phan_anh_goc | int unsigned | Có | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| luot_xu_ly | int unsigned | Không | 1 |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| ngay_dong | datetime | Có | — |  |
| ma_thiet_bi | int unsigned | Có | — |  |
| ma_tai_san_luc_gui | varchar(30) | Có | — |  |
| ten_thiet_bi_luc_gui | varchar(150) | Có | — |  |
| vi_tri_thiet_bi_luc_gui | varchar(160) | Có | — |  |

**Chỉ mục**

- idx_assigned (INDEX): ma_ky_thuat_vien, trang_thai.
- idx_incident_equipment (INDEX): ma_thiet_bi, ma_phan_anh.
- idx_location (INDEX): ma_vi_tri_qr, loai_su_co, trang_thai.
- idx_sender (INDEX): ma_nguoi_gui.
- idx_status (INDEX): trang_thai.
- khoa_yeu_cau (UNIQUE): khoa_yeu_cau.
- ma_phan_anh_goc (INDEX): ma_phan_anh_goc.
- ma_tra_cuu (UNIQUE): ma_tra_cuu.
- PRIMARY (UNIQUE): ma_phan_anh.
- FK fk_incident_equipment: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_1: (ma_vi_tri_qr) → vi_tri_qr (ma_vi_tri_qr); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_2: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_3: (ma_ky_thuat_vien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_4: (ma_phan_anh_goc) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_incident_equipment_snapshot: (((&#96;ma_thiet_bi&#96; is null) and (&#96;ma_tai_san_luc_gui&#96; is null) and (&#96;ten_thiet_bi_luc_gui&#96; is null) and (&#96;vi_tri_thiet_bi_luc_gui&#96; is null)) or ((&#96;ma_thiet_bi&#96; is not null) and (&#96;ma_tai_san_luc_gui&#96; is not null) and (&#96;ten_thiet_bi_luc_gui&#96; is not null) and (&#96;vi_tri_thiet_bi_luc_gui&#96; is not null))).
- CHECK phan_anh_chk_1: ((&#96;trang_thai&#96; <> _utf8mb4\'TRUNG\') or (&#96;ma_phan_anh_goc&#96; is not null)).

## phieu_bao_tri

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phieu_bao_tri | int unsigned | Không | — | auto_increment |
| ma_thiet_bi | int unsigned | Không | — |  |
| loai | enum('DINH_KY','DOT_XUAT') | Không | — |  |
| tieu_de | varchar(180) | Không | — |  |
| noi_dung | varchar(2000) | Không | — |  |
| ten_thiet_bi_luc_lap | varchar(150) | Không | — |  |
| vi_tri_luc_lap | varchar(160) | Không | — |  |
| ngay_lap | date | Không | — |  |
| ngay_den_han | date | Không | — |  |
| chu_ky_ngay | smallint unsigned | Có | — |  |
| do_uu_tien | enum('THUONG','CAO','KHAN_CAP') | Không | THUONG |  |
| trang_thai | enum('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU','HOAN_THANH','HUY') | Không | MOI |  |
| ma_ky_thuat_vien | int unsigned | Có | — |  |
| ma_nguoi_lap | int unsigned | Không | — |  |
| ma_nguoi_nghiem_thu | int unsigned | Có | — |  |
| ma_nguoi_huy | int unsigned | Có | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| luot_thuc_hien | int unsigned | Không | 1 |  |
| ngay_thuc_hien | date | Có | — |  |
| ket_qua | text | Không | — |  |
| nhan_xet_nghiem_thu | varchar(1000) | Không |  |  |
| ly_do_huy | varchar(500) | Không |  |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |
| ngay_bat_dau | datetime(6) | Có | — |  |
| ngay_bao_cao | datetime(6) | Có | — |  |
| ngay_nghiem_thu | datetime(6) | Có | — |  |
| ngay_huy | datetime(6) | Có | — |  |
| khoa_yeu_cau | char(36) | Không | — |  |
| van_tay | char(64) | Không | — |  |
| dinh_ky_dang_mo | int unsigned | Có | — | STORED GENERATED; (case when ((&#96;loai&#96; = _utf8mb4\'DINH_KY\') and (&#96;trang_thai&#96; not in (_utf8mb4\'HOAN_THANH\',_utf8mb4\'HUY\'))) then &#96;ma_thiet_bi&#96; else NULL end) |

**Chỉ mục**

- idx_maintenance_assigned (INDEX): ma_ky_thuat_vien, trang_thai, ngay_den_han.
- idx_maintenance_due (INDEX): trang_thai, ngay_den_han.
- idx_maintenance_equipment (INDEX): ma_thiet_bi, trang_thai, ma_phieu_bao_tri.
- khoa_yeu_cau (UNIQUE): khoa_yeu_cau.
- ma_nguoi_huy (INDEX): ma_nguoi_huy.
- ma_nguoi_lap (INDEX): ma_nguoi_lap.
- ma_nguoi_nghiem_thu (INDEX): ma_nguoi_nghiem_thu.
- PRIMARY (UNIQUE): ma_phieu_bao_tri.
- uq_open_periodic (UNIQUE): dinh_ky_dang_mo.
- FK phieu_bao_tri_ibfk_1: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_2: (ma_ky_thuat_vien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_3: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_4: (ma_nguoi_nghiem_thu) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_5: (ma_nguoi_huy) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_maintenance_period_strict: (((&#96;loai&#96; = _utf8mb4\'DINH_KY\') and (&#96;chu_ky_ngay&#96; is not null) and (&#96;chu_ky_ngay&#96; between 1 and 3650)) or ((&#96;loai&#96; = _utf8mb4\'DOT_XUAT\') and (&#96;chu_ky_ngay&#96; is null))).
- CHECK phieu_bao_tri_chk_1: (((&#96;loai&#96; = _utf8mb4\'DINH_KY\') and (&#96;chu_ky_ngay&#96; between 1 and 3650)) or ((&#96;loai&#96; = _utf8mb4\'DOT_XUAT\') and (&#96;chu_ky_ngay&#96; is null))).
- CHECK phieu_bao_tri_chk_2: ((&#96;trang_thai&#96; not in (_utf8mb4\'DA_PHAN_CONG\',_utf8mb4\'DANG_THUC_HIEN\',_utf8mb4\'CHO_NGHIEM_THU\',_utf8mb4\'HOAN_THANH\')) or (&#96;ma_ky_thuat_vien&#96; is not null)).
- CHECK phieu_bao_tri_chk_3: ((&#96;trang_thai&#96; not in (_utf8mb4\'CHO_NGHIEM_THU\',_utf8mb4\'HOAN_THANH\')) or ((&#96;ngay_thuc_hien&#96; is not null) and (char_length(&#96;ket_qua&#96;) >= 10))).
- CHECK phieu_bao_tri_chk_4: ((&#96;ngay_thuc_hien&#96; is null) or (&#96;ngay_thuc_hien&#96; >= &#96;ngay_lap&#96;)).
- CHECK phieu_bao_tri_chk_5: ((&#96;trang_thai&#96; <> _utf8mb4\'HOAN_THANH\') or ((&#96;ma_nguoi_nghiem_thu&#96; is not null) and (&#96;ngay_nghiem_thu&#96; is not null))).
- CHECK phieu_bao_tri_chk_6: ((&#96;trang_thai&#96; <> _utf8mb4\'HUY\') or ((&#96;ma_nguoi_huy&#96; is not null) and (char_length(&#96;ly_do_huy&#96;) >= 3))).

## phieu_thu_chi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phieu | int unsigned | Không | — | auto_increment |
| ma_quy | int unsigned | Không | — |  |
| loai | enum('THU','CHI') | Không | — |  |
| nhom | varchar(30) | Không | — |  |
| ngay_hach_toan | date | Không | — |  |
| so_tien | decimal(14,0) | Không | — |  |
| doi_tac | varchar(150) | Không | — |  |
| dien_giai | varchar(1000) | Không | — |  |
| trang_thai | enum('NHAP','DA_GHI_SO','HUY') | Không | NHAP |  |
| phien_ban | int unsigned | Không | 0 |  |
| ma_nguoi_lap | int unsigned | Không | — |  |
| ma_nguoi_duyet | int unsigned | Có | — |  |
| ngay_duyet | datetime(6) | Có | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |
| ma_phieu_goc | int unsigned | Có | — |  |
| khoa_yeu_cau | char(36) | Có | — |  |
| van_tay | char(64) | Có | — |  |

**Chỉ mục**

- idx_treasury_fund (INDEX): ma_quy, trang_thai, ngay_hach_toan, ma_phieu.
- idx_treasury_queue (INDEX): trang_thai, ma_phieu.
- khoa_yeu_cau (UNIQUE): khoa_yeu_cau.
- ma_nguoi_duyet (INDEX): ma_nguoi_duyet.
- ma_nguoi_lap (INDEX): ma_nguoi_lap.
- ma_phieu_goc (UNIQUE): ma_phieu_goc.
- PRIMARY (UNIQUE): ma_phieu.
- FK phieu_thu_chi_ibfk_1: (ma_quy) → quy_tai_chinh (ma_quy); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_2: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_3: (ma_nguoi_duyet) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_4: (ma_phieu_goc) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK phieu_thu_chi_chk_1: (&#96;so_tien&#96; > 0).
- CHECK phieu_thu_chi_chk_2: (((&#96;khoa_yeu_cau&#96; is not null) and (&#96;van_tay&#96; is not null) and (&#96;ma_phieu_goc&#96; is null)) or ((&#96;khoa_yeu_cau&#96; is null) and (&#96;van_tay&#96; is null) and (&#96;ma_phieu_goc&#96; is not null) and (&#96;trang_thai&#96; = _utf8mb4\'DA_GHI_SO\') and (&#96;nhom&#96; = _utf8mb4\'DIEU_CHINH\'))).
- CHECK phieu_thu_chi_chk_3: ((&#96;trang_thai&#96; <> _utf8mb4\'DA_GHI_SO\') or ((&#96;ma_nguoi_duyet&#96; is not null) and (&#96;ngay_duyet&#96; is not null))).

## phuong_tien

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phuong_tien | int unsigned | Không | — | auto_increment |
| ma_dang_ky | varchar(20) | Không | — |  |
| ma_cu_dan | int unsigned | Không | — |  |
| ma_can_ho | int unsigned | Không | — |  |
| ma_lich_su_cu_tru | int unsigned | Không | — |  |
| ma_dang_ky_truoc | int unsigned | Có | — |  |
| loai_xe | enum('O_TO','XE_MAY','XE_DAP') | Không | — |  |
| bien_so | varchar(15) | Có | — |  |
| hang_xe | varchar(50) | Không |  |  |
| mau_sac | varchar(50) | Không |  |  |
| ngay_dang_ky | date | Không | — |  |
| ngay_ket_thuc | date | Có | — |  |
| ly_do_ket_thuc | varchar(255) | Không |  |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ma_nguoi_ket_thuc | int unsigned | Có | — |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |
| bien_so_dang_hoat_dong | varchar(15) | Có | — | STORED GENERATED; (case when (&#96;ngay_ket_thuc&#96; is null) then &#96;bien_so&#96; else NULL end) |

**Chỉ mục**

- bien_so_dang_hoat_dong (UNIQUE): bien_so_dang_hoat_dong.
- idx_xe_apartment_period (INDEX): ma_can_ho, ngay_dang_ky, ngay_ket_thuc.
- idx_xe_plate_period (INDEX): bien_so, ngay_dang_ky, ngay_ket_thuc.
- idx_xe_resident (INDEX): ma_cu_dan, ngay_ket_thuc.
- idx_xe_stay (INDEX): ma_lich_su_cu_tru, ngay_ket_thuc.
- ma_dang_ky (UNIQUE): ma_dang_ky.
- ma_dang_ky_truoc (UNIQUE): ma_dang_ky_truoc.
- ma_nguoi_ket_thuc (INDEX): ma_nguoi_ket_thuc.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- PRIMARY (UNIQUE): ma_phuong_tien.
- FK phuong_tien_ibfk_1: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_3: (ma_lich_su_cu_tru) → lich_su_cu_tru (ma_lich_su_cu_tru); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_4: (ma_dang_ky_truoc) → phuong_tien (ma_phuong_tien); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_5: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_6: (ma_nguoi_ket_thuc) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_xe_bien_so: ((&#96;loai_xe&#96; = _utf8mb4\'XE_DAP\') or (&#96;bien_so&#96; is not null)).
- CHECK chk_xe_ket_thuc: (((&#96;ngay_ket_thuc&#96; is null) and (&#96;ma_nguoi_ket_thuc&#96; is null) and (&#96;ly_do_ket_thuc&#96; = _utf8mb4\'\')) or ((&#96;ngay_ket_thuc&#96; is not null) and (&#96;ma_nguoi_ket_thuc&#96; is not null) and (char_length(trim(&#96;ly_do_ket_thuc&#96;)) > 0))).
- CHECK chk_xe_ngay: ((&#96;ngay_ket_thuc&#96; is null) or (&#96;ngay_ket_thuc&#96; >= &#96;ngay_dang_ky&#96;)).

## quy_tai_chinh

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_quy | int unsigned | Không | — | auto_increment |
| ten_quy | varchar(120) | Không | — |  |
| mo_ta | varchar(1000) | Không | — |  |
| dang_hoat_dong | tinyint(1) | Không | 1 |  |
| nhan_thu_hoa_don | tinyint(1) | Không | 0 |  |
| quy_hoa_don | tinyint | Có | — | STORED GENERATED; if(&#96;nhan_thu_hoa_don&#96;,1,NULL) |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_quy.
- quy_hoa_don (UNIQUE): quy_hoa_don.
- CHECK quy_tai_chinh_chk_1: ((&#96;nhan_thu_hoa_don&#96; = 0) or (&#96;dang_hoat_dong&#96; = 1)).

## schema_migrations

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| name | varchar(100) | Không | — |  |
| checksum | char(64) | Không | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): name.

## tang_toa_nha

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoi | varchar(10) | Không | — |  |
| tang | smallint unsigned | Không | — |  |
| ten_tang | varchar(100) | Không |  |  |
| mo_ta | varchar(255) | Không |  |  |
| giu_khi_trong | tinyint(1) | Không | 1 |  |
| phien_ban | int unsigned | Không | 0 |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

**Chỉ mục**

- PRIMARY (UNIQUE): khoi, tang.
- FK fk_floor_block: (khoi) → khoi_toa_nha (khoi); UPDATE CASCADE, DELETE NO ACTION.
- CHECK tang_toa_nha_chk_1: (&#96;tang&#96; <= 200).

## thiet_bi

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thiet_bi | int unsigned | Không | — | auto_increment |
| ma_tai_san | varchar(30) | Không | — |  |
| ten_thiet_bi | varchar(150) | Không | — |  |
| loai | enum('THANG_MAY','MAY_BOM','PCCC','DIEN','NUOC','CAMERA','KHAC') | Không | — |  |
| vi_tri | varchar(160) | Không | — |  |
| so_serial | varchar(100) | Không |  |  |
| ngay_lap_dat | date | Có | — |  |
| ghi_chu | varchar(1000) | Không |  |  |
| trang_thai | enum('DANG_SU_DUNG','TAM_DUNG','NGUNG_SU_DUNG') | Không | DANG_SU_DUNG |  |
| chu_ky_ngay | smallint unsigned | Có | — |  |
| ngay_bao_tri_tiep_theo | date | Có | — |  |
| nhac_truoc_ngay | tinyint unsigned | Không | 7 |  |
| phien_ban | int unsigned | Không | 0 |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |
| ngay_cap_nhat | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_equipment_due (INDEX): trang_thai, ngay_bao_tri_tiep_theo.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- ma_tai_san (UNIQUE): ma_tai_san.
- PRIMARY (UNIQUE): ma_thiet_bi.
- FK thiet_bi_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_equipment_plan_pair_strict: (((&#96;chu_ky_ngay&#96; is null) and (&#96;ngay_bao_tri_tiep_theo&#96; is null)) or ((&#96;chu_ky_ngay&#96; is not null) and (&#96;chu_ky_ngay&#96; between 1 and 3650) and (&#96;ngay_bao_tri_tiep_theo&#96; is not null))).
- CHECK thiet_bi_chk_1: (((&#96;chu_ky_ngay&#96; is null) and (&#96;ngay_bao_tri_tiep_theo&#96; is null)) or ((&#96;chu_ky_ngay&#96; between 1 and 3650) and (&#96;ngay_bao_tri_tiep_theo&#96; is not null))).
- CHECK thiet_bi_chk_2: (&#96;nhac_truoc_ngay&#96; <= 90).
- CHECK thiet_bi_chk_3: ((&#96;trang_thai&#96; <> _utf8mb4\'NGUNG_SU_DUNG\') or (&#96;chu_ky_ngay&#96; is null)).

## thong_bao

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thong_bao | int unsigned | Không | — | auto_increment |
| loai | enum('THONG_BAO','NHAC_PHI') | Không | THONG_BAO |  |
| tieu_de | varchar(160) | Không | — |  |
| noi_dung | text | Không | — |  |
| pham_vi | enum('TOAN_BO','KHOI','CAN_HO') | Không | — |  |
| khoi | varchar(10) | Có | — |  |
| ma_can_ho | int unsigned | Có | — |  |
| muc_do | enum('THUONG','QUAN_TRONG') | Không | THUONG |  |
| trang_thai | enum('NHAP','DA_GUI','THU_HOI') | Không | NHAP |  |
| phien_ban | int unsigned | Không | 0 |  |
| ma_hoa_don | int unsigned | Có | — |  |
| ngay_nhac | date | Có | — |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ma_nguoi_gui | int unsigned | Có | — |  |
| ma_nguoi_thu_hoi | int unsigned | Có | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |
| ngay_gui | datetime(6) | Có | — |  |
| ngay_thu_hoi | datetime(6) | Có | — |  |
| ly_do_thu_hoi | varchar(255) | Có | — |  |

**Chỉ mục**

- idx_announcement_inbox (INDEX): trang_thai, ngay_gui, ma_thong_bao.
- ma_can_ho (INDEX): ma_can_ho.
- ma_nguoi_gui (INDEX): ma_nguoi_gui.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- ma_nguoi_thu_hoi (INDEX): ma_nguoi_thu_hoi.
- PRIMARY (UNIQUE): ma_thong_bao.
- uq_bill_reminder_day (UNIQUE): ma_hoa_don, ngay_nhac.
- FK thong_bao_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_2: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_3: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_4: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_5: (ma_nguoi_thu_hoi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK thong_bao_chk_1: (((&#96;pham_vi&#96; = _utf8mb4\'TOAN_BO\') and (&#96;khoi&#96; is null) and (&#96;ma_can_ho&#96; is null)) or ((&#96;pham_vi&#96; = _utf8mb4\'KHOI\') and (&#96;khoi&#96; is not null) and (&#96;ma_can_ho&#96; is null)) or ((&#96;pham_vi&#96; = _utf8mb4\'CAN_HO\') and (&#96;khoi&#96; is null) and (&#96;ma_can_ho&#96; is not null))).
- CHECK thong_bao_chk_2: (((&#96;loai&#96; = _utf8mb4\'THONG_BAO\') and (&#96;ma_hoa_don&#96; is null) and (&#96;ngay_nhac&#96; is null)) or ((&#96;loai&#96; = _utf8mb4\'NHAC_PHI\') and (&#96;ma_hoa_don&#96; is not null) and (&#96;ngay_nhac&#96; is not null) and (&#96;pham_vi&#96; = _utf8mb4\'CAN_HO\'))).

## thong_bao_da_doc

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thong_bao | int unsigned | Không | — |  |
| ma_nguoi_dung | int unsigned | Không | — |  |
| nguoi_tiep_nhan | int unsigned | Không | 0 |  |
| ngay_doc | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- ma_nguoi_dung (INDEX): ma_nguoi_dung.
- PRIMARY (UNIQUE): ma_thong_bao, ma_nguoi_dung, nguoi_tiep_nhan.
- FK thong_bao_da_doc_ibfk_1: (ma_thong_bao) → thong_bao (ma_thong_bao); UPDATE NO ACTION, DELETE CASCADE.
- FK thong_bao_da_doc_ibfk_2: (ma_nguoi_dung) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE CASCADE.

## tien_ich

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_tien_ich | int unsigned | Không | — | auto_increment |
| ten_tien_ich | varchar(120) | Không | — |  |
| vi_tri | varchar(160) | Không | — |  |
| mo_ta | text | Không | — |  |
| suc_chua | smallint unsigned | Không | — |  |
| gio_mo | time | Không | — |  |
| gio_dong | time | Không | — |  |
| toi_da_phut | smallint unsigned | Không | — |  |
| dat_truoc_ngay | smallint unsigned | Không | — |  |
| dang_mo | tinyint(1) | Không | 1 |  |
| phien_ban | int unsigned | Không | 0 |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ngay_tao | datetime(6) | Không | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED |

**Chỉ mục**

- idx_amenities_open (INDEX): dang_mo, ma_tien_ich.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- PRIMARY (UNIQUE): ma_tien_ich.
- FK tien_ich_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK tien_ich_chk_1: (&#96;suc_chua&#96; between 1 and 1000).
- CHECK tien_ich_chk_2: ((&#96;gio_mo&#96; >= _utf8mb4\'00:00:00\') and (&#96;gio_mo&#96; < &#96;gio_dong&#96;) and (&#96;gio_dong&#96; <= _utf8mb4\'23:30:00\')).
- CHECK tien_ich_chk_3: ((second(&#96;gio_mo&#96;) = 0) and (minute(&#96;gio_mo&#96;) in (0,30)) and (second(&#96;gio_dong&#96;) = 0) and (minute(&#96;gio_dong&#96;) in (0,30))).
- CHECK tien_ich_chk_4: ((&#96;toi_da_phut&#96; between 30 and 360) and ((&#96;toi_da_phut&#96; % 30) = 0)).
- CHECK tien_ich_chk_5: (&#96;dat_truoc_ngay&#96; between 1 and 90).

## vi_tri_qr

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_vi_tri_qr | int unsigned | Không | — | auto_increment |
| ten_vi_tri | varchar(100) | Không | — |  |
| loai | enum('KHU_VUC','THIET_BI') | Không | KHU_VUC |  |
| mo_ta | varchar(255) | Không |  |  |
| token_qr | char(36) | Không | — |  |
| dang_hoat_dong | tinyint(1) | Không | 1 |  |
| ma_nguoi_tao | int unsigned | Không | — |  |
| ngay_tao | datetime | Không | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| ma_thiet_bi | int unsigned | Có | — |  |
| phien_ban | int unsigned | Không | 0 |  |

**Chỉ mục**

- fk_qr_equipment (INDEX): ma_thiet_bi.
- ma_nguoi_tao (INDEX): ma_nguoi_tao.
- PRIMARY (UNIQUE): ma_vi_tri_qr.
- token_qr (UNIQUE): token_qr.
- FK fk_qr_equipment: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK vi_tri_qr_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_qr_equipment_type: ((&#96;ma_thiet_bi&#96; is null) or (&#96;loai&#96; = _utf8mb4\'THIET_BI\')).

## yeu_cau_gui

Engine: InnoDB; đối chiếu: utf8mb4_0900_ai_ci.

| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoa | char(36) | Không | — |  |
| van_tay | char(64) | Không | — |  |
| ma_phan_anh | int unsigned | Có | — |  |

**Chỉ mục**

- ma_phan_anh (INDEX): ma_phan_anh.
- PRIMARY (UNIQUE): khoa.
- FK yeu_cau_gui_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.

## Checksum nguồn

| Migration | SHA-256 |
|---|---|
| 001_auth_qr_incidents.sql | fb0a3105f5cd0d47a3e0f1d0e43d990b1e2f2b4580052ae3e99df1a4264de1a6 |
| 002_residency.sql | f5beef3cb8f0f9bd45005eecea1d9fa3b9fcf301a9c95742dcde7d212d89ad43 |
| 003_same_day_residency.sql | 07cab0bc506f92ee5e84981150730d33c1e55ef1f3dbd5c76fdd83be7fbd616b |
| 004_vehicles.sql | b5c5e6f93398971060cb975f29575158ebc789445f21daa0d886f194059028d6 |
| 005_billing.sql | 1a2beca9699b8fd63656256f3c963abe5e36d85d621c68147cde9672a1eb66a5 |
| 006_electricity_tiers.sql | 4d4ff9f2fc52d0f415b6ea838fd410471814514649fb78ee3e626a5dee7332b3 |
| 007_apartment_accounts.sql | 391946b9be75c27855bccfd7c40eab800d32df1561c662fbb1f368b44cbcb4a6 |
| 008_handover_audit_locks.sql | d336d61a28cd029f99633ddc5739a549aa4c49f85d04e33c164bbfef730b841d |
| 009_announcements.sql | 998eca44d1a892c90e736fed984bd7575f1f2a4623d35a2561319a97ceff3f1e |
| 010_maintenance.sql | 798ddbc1cfac40b6281a91c592ef3b2f66894f5fe16331bd2ded082b243a5956 |
| 011_maintenance_plan_checks.sql | bcdc18d9cfbc309208194b4ba8db2b70c938a54883d2a1111010fba7a103827f |
| 012_amenity_bookings.sql | 3be17754436c953de3dc9234cbd3c21fc7dca1609027953f35a1ca640b98209c |
| 013_treasury.sql | 0fb57d350dd1faa96cc0398ff8e2da66344fb2d3c3411bd88c823bb40246cc03 |
| 014_data_imports.sql | b8aee2c4321a3d009e0be55188089768811138b93c01d6e1f728e353ccb01253 |
| 015_bill_batches.sql | af72e1cf7ecbadd9495d74d6b222e441f5b20ba1f2589e231b5170fbe515a23d |
| 016_bill_actions.sql | 6e1970a3449344d37ca362b538ff8edf84365d4b4ba0d41f24db03f6b445ec1f |
| 017_building_structure.sql | a9e755d0456c864b03fb4fbc7c4ce3195e47cbde27537d1c50812362f4e7b6aa |
| 018_equipment_qr.sql | 6e961ea5cf9140d1c1e020e888bb826f50b11e679c08fedd8727edaf5792b7f8 |
