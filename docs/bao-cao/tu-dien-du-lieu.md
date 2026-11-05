# Từ điển dữ liệu vật lý

Sinh từ metadata PostgreSQL bằng `scripts/export-schema.js`. Không đọc dữ liệu nghiệp vụ, thông tin đăng nhập hoặc nội dung ảnh. Phản ánh schema tại lúc xuất; không tự phát hiện mọi thay đổi DDL thủ công ngoài migration.

Nguồn: 19 migration, cuối cùng **019_incident_sender_privacy.sql**. Tổng **38 bảng**, **397 cột**, **88 ràng buộc khóa ngoại**.

`NULL` là không có giá trị; `—` ở mặc định nghĩa metadata không có mặc định khác NULL. Kiểu, chỉ mục, biểu thức cột sinh và CHECK bên dưới lấy từ PostgreSQL. Quan hệ nullable không bắt buộc có bản ghi cha; UNIQUE của cột sinh có thể chỉ áp dụng cho bản ghi đang hoạt động, cần đọc biểu thức sinh và service.

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

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_can_ho | bigint | Không | — | identity |
| so_can_ho | character varying(20) | Không | — | collation: app_ci |
| khoi | character varying(10) | Không | — | collation: app_ci |
| tang | integer | Không | — |  |
| dien_tich_m2 | numeric(8,2) | Không | — |  |
| tinh_phi_dich_vu | smallint | Không | 1 |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_can_ho.
- can_ho_idx_floor (INDEX): khoi, tang.
- can_ho_so_can_ho_key (UNIQUE): so_can_ho.
- FK fk_apartment_floor: (khoi, tang) → tang_toa_nha (khoi, tang); UPDATE CASCADE, DELETE NO ACTION.
- CHECK can_ho_chk_1: (dien_tich_m2 > (0)::numeric).
- CHECK can_ho_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK can_ho_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK can_ho_tang_check: ((tang >= 0) AND (tang <= 65535)).
- CHECK can_ho_tinh_phi_dich_vu_check: (tinh_phi_dich_vu = ANY (ARRAY[0, 1])).

## cau_hinh_phi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_cau_hinh_phi | bigint | Không | — | identity |
| loai_phi | character varying(30) | Không | — | collation: app_ci |
| don_gia | numeric(12,2) | Không | — |  |
| tu_ngay | date | Không | — |  |
| den_ngay | date | Có | — |  |
| ma_nguoi_tao | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| cach_tinh | character varying(50) | Không | 'DON_GIA'::character varying | collation: default |
| thue_gtgt | numeric(5,2) | Không | 0 |  |
| bac_dien | json | Có | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_cau_hinh_phi.
- cau_hinh_phi_loai_phi_tu_ngay_key (UNIQUE): loai_phi, tu_ngay.
- FK cau_hinh_phi_ibfk_1: (loai_phi) → loai_phi (loai_phi); UPDATE NO ACTION, DELETE NO ACTION.
- FK cau_hinh_phi_ibfk_2: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK cau_hinh_phi_cach_tinh_check: ((cach_tinh)::text = ANY ((ARRAY['DON_GIA'::character varying, 'BAC_THANG'::character varying])::text[])).
- CHECK cau_hinh_phi_chk_1: (don_gia >= (0)::numeric).
- CHECK cau_hinh_phi_chk_2: ((den_ngay IS NULL) OR (den_ngay > tu_ngay)).
- CHECK cau_hinh_phi_ma_cau_hinh_phi_check: ((ma_cau_hinh_phi >= 0) AND (ma_cau_hinh_phi <= '4294967295'::bigint)).
- CHECK cau_hinh_phi_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK chk_fee_electricity: ((((loai_phi)::text = 'TIEN_DIEN'::text) AND ((((cach_tinh)::text = 'DON_GIA'::text) AND (bac_dien IS NULL)) OR (((cach_tinh)::text = 'BAC_THANG'::text) AND (bac_dien IS NOT NULL) AND (don_gia = (0)::numeric)))) OR (((loai_phi)::text <> 'TIEN_DIEN'::text) AND ((cach_tinh)::text = 'DON_GIA'::text) AND (thue_gtgt = (0)::numeric) AND (bac_dien IS NULL))).
- CHECK chk_fee_vat: ((thue_gtgt >= (0)::numeric) AND (thue_gtgt <= (100)::numeric)).

## chi_so_dich_vu

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chi_so_dich_vu | bigint | Không | — | identity |
| ma_can_ho | bigint | Không | — |  |
| loai_dich_vu | character varying(50) | Không | — | collation: default |
| ky_thanh_toan | character varying(7) | Không | — | collation: app_ci |
| chi_so_cu | numeric(12,3) | Không | — |  |
| chi_so_moi | numeric(12,3) | Không | — |  |
| ngay_chot | date | Không | — |  |
| ghi_chu | character varying(255) | Không | ''::character varying | collation: app_ci |
| ma_nguoi_ghi | bigint | Không | — |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_ghi | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_chi_so_dich_vu.
- chi_so_dich_vu_ma_can_ho_loai_dich_vu_ky_thanh_toan_key (UNIQUE): ma_can_ho, loai_dich_vu, ky_thanh_toan.
- FK chi_so_dich_vu_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_so_dich_vu_ibfk_2: (ma_nguoi_ghi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chi_so_dich_vu_chk_1: ((chi_so_cu >= (0)::numeric) AND (chi_so_moi >= chi_so_cu)).
- CHECK chi_so_dich_vu_loai_dich_vu_check: ((loai_dich_vu)::text = ANY ((ARRAY['DIEN'::character varying, 'NUOC'::character varying])::text[])).
- CHECK chi_so_dich_vu_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK chi_so_dich_vu_ma_chi_so_dich_vu_check: ((ma_chi_so_dich_vu >= 0) AND (ma_chi_so_dich_vu <= '4294967295'::bigint)).
- CHECK chi_so_dich_vu_ma_nguoi_ghi_check: ((ma_nguoi_ghi >= 0) AND (ma_nguoi_ghi <= '4294967295'::bigint)).
- CHECK chi_so_dich_vu_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## chi_tiet_hoa_don

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chi_tiet_hoa_don | bigint | Không | — | identity |
| ma_hoa_don | bigint | Không | — |  |
| ma_cau_hinh_phi | bigint | Không | — |  |
| ma_chi_so_dich_vu | bigint | Có | — |  |
| loai_phi | character varying(30) | Không | — | collation: app_ci |
| dien_giai | character varying(255) | Không | — | collation: app_ci |
| don_vi_tinh | character varying(20) | Không | — | collation: app_ci |
| so_luong | numeric(12,3) | Không | — |  |
| don_gia | numeric(16,2) | Không | — |  |
| thanh_tien | numeric(14,0) | Không | — |  |
| du_lieu_nguon | json | Không | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_chi_tiet_hoa_don.
- FK chi_tiet_hoa_don_ibfk_1: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_tiet_hoa_don_ibfk_2: (ma_cau_hinh_phi) → cau_hinh_phi (ma_cau_hinh_phi); UPDATE NO ACTION, DELETE NO ACTION.
- FK chi_tiet_hoa_don_ibfk_3: (ma_chi_so_dich_vu) → chi_so_dich_vu (ma_chi_so_dich_vu); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chi_tiet_hoa_don_chk_1: ((so_luong >= (0)::numeric) AND (don_gia >= (0)::numeric) AND (thanh_tien >= (0)::numeric)).
- CHECK chi_tiet_hoa_don_ma_cau_hinh_phi_check: ((ma_cau_hinh_phi >= 0) AND (ma_cau_hinh_phi <= '4294967295'::bigint)).
- CHECK chi_tiet_hoa_don_ma_chi_so_dich_vu_check: ((ma_chi_so_dich_vu >= 0) AND (ma_chi_so_dich_vu <= '4294967295'::bigint)).
- CHECK chi_tiet_hoa_don_ma_chi_tiet_hoa_don_check: ((ma_chi_tiet_hoa_don >= 0) AND (ma_chi_tiet_hoa_don <= '4294967295'::bigint)).
- CHECK chi_tiet_hoa_don_ma_hoa_don_check: ((ma_hoa_don >= 0) AND (ma_hoa_don <= '4294967295'::bigint)).

## chung_tu_thu_chi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_chung_tu | bigint | Không | — | identity |
| ma_phieu | bigint | Không | — |  |
| ten_tep | character varying(120) | Không | — | collation: app_ci |
| loai_tep | character varying(50) | Không | — | collation: default |
| kich_thuoc | bigint | Không | — |  |
| bam_sha256 | character varying(64) | Không | — | collation: app_ci |
| noi_dung | bytea | Không | — |  |
| ma_nguoi_tai | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_chung_tu.
- chung_tu_thu_chi_ma_phieu_bam_sha256_key (UNIQUE): ma_phieu, bam_sha256.
- FK chung_tu_thu_chi_ibfk_1: (ma_phieu) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE CASCADE.
- FK chung_tu_thu_chi_ibfk_2: (ma_nguoi_tai) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chung_tu_thu_chi_chk_1: ((kich_thuoc >= 1) AND (kich_thuoc <= 5242880)).
- CHECK chung_tu_thu_chi_chk_2: (kich_thuoc = octet_length(noi_dung)).
- CHECK chung_tu_thu_chi_kich_thuoc_check: ((kich_thuoc >= 0) AND (kich_thuoc <= '4294967295'::bigint)).
- CHECK chung_tu_thu_chi_loai_tep_check: ((loai_tep)::text = ANY ((ARRAY['image/jpeg'::character varying, 'application/pdf'::character varying])::text[])).
- CHECK chung_tu_thu_chi_ma_chung_tu_check: ((ma_chung_tu >= 0) AND (ma_chung_tu <= '4294967295'::bigint)).
- CHECK chung_tu_thu_chi_ma_nguoi_tai_check: ((ma_nguoi_tai >= 0) AND (ma_nguoi_tai <= '4294967295'::bigint)).
- CHECK chung_tu_thu_chi_ma_phieu_check: ((ma_phieu >= 0) AND (ma_phieu <= '4294967295'::bigint)).

## cu_dan

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_cu_dan | bigint | Không | — | identity |
| ho_va_ten | character varying(100) | Không | — | collation: app_ci |
| so_dien_thoai | character varying(15) | Không | — | collation: app_ci |
| ma_nguoi_dung | bigint | Có | — |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_cu_dan.
- cu_dan_ma_nguoi_dung_key (UNIQUE): ma_nguoi_dung.
- FK cu_dan_ibfk_1: (ma_nguoi_dung) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK cu_dan_ma_cu_dan_check: ((ma_cu_dan >= 0) AND (ma_cu_dan <= '4294967295'::bigint)).
- CHECK cu_dan_ma_nguoi_dung_check: ((ma_nguoi_dung >= 0) AND (ma_nguoi_dung <= '4294967295'::bigint)).
- CHECK cu_dan_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## dat_lich_tien_ich

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dat_lich | bigint | Không | — | identity |
| ma_tien_ich | bigint | Không | — |  |
| ma_can_ho | bigint | Không | — |  |
| ma_nguoi_dat | bigint | Không | — |  |
| ma_cu_dan | bigint | Không | — |  |
| ma_lich_su_cu_tru | bigint | Không | — |  |
| ten_tien_ich | character varying(120) | Không | — | collation: app_ci |
| vi_tri | character varying(160) | Không | — | collation: app_ci |
| ten_nguoi_dat | character varying(100) | Không | — | collation: app_ci |
| bat_dau | timestamp(6) without time zone | Không | — |  |
| ket_thuc | timestamp(6) without time zone | Không | — |  |
| so_nguoi | integer | Không | — |  |
| ghi_chu | character varying(1000) | Không | — | collation: app_ci |
| trang_thai | character varying(50) | Không | 'CHO_DUYET'::character varying | collation: default |
| phien_ban | bigint | Không | 0 |  |
| khoa_yeu_cau | character varying(36) | Không | — | collation: app_ci |
| van_tay | character varying(64) | Không | — | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dat_lich.
- dat_lich_tien_ich_idx_booking_apartment (INDEX): ma_can_ho, bat_dau, ma_dat_lich.
- dat_lich_tien_ich_idx_booking_creator (INDEX): ma_nguoi_dat, bat_dau, ma_dat_lich.
- dat_lich_tien_ich_idx_booking_overlap (INDEX): ma_tien_ich, trang_thai, bat_dau, ket_thuc.
- dat_lich_tien_ich_khoa_yeu_cau_key (UNIQUE): khoa_yeu_cau.
- FK dat_lich_tien_ich_ibfk_1: (ma_tien_ich) → tien_ich (ma_tien_ich); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_3: (ma_nguoi_dat) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_4: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK dat_lich_tien_ich_ibfk_5: (ma_lich_su_cu_tru) → lich_su_cu_tru (ma_lich_su_cu_tru); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dat_lich_tien_ich_chk_1: ((so_nguoi >= 1) AND (so_nguoi <= 1000)).
- CHECK dat_lich_tien_ich_chk_2: ((ket_thuc > bat_dau) AND (date(bat_dau) = date(ket_thuc))).
- CHECK dat_lich_tien_ich_chk_3: ((EXTRACT(second FROM bat_dau) = (0)::numeric) AND (EXTRACT(minute FROM bat_dau) = ANY (ARRAY[(0)::numeric, (30)::numeric])) AND (EXTRACT(second FROM ket_thuc) = (0)::numeric) AND (EXTRACT(minute FROM ket_thuc) = ANY (ARRAY[(0)::numeric, (30)::numeric]))).
- CHECK dat_lich_tien_ich_chk_4: (((EXTRACT(epoch FROM (ket_thuc - bat_dau)) / (60)::numeric) >= (30)::numeric) AND ((EXTRACT(epoch FROM (ket_thuc - bat_dau)) / (60)::numeric) <= (360)::numeric)).
- CHECK dat_lich_tien_ich_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_ma_cu_dan_check: ((ma_cu_dan >= 0) AND (ma_cu_dan <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_ma_dat_lich_check: ((ma_dat_lich >= 0) AND (ma_dat_lich <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_ma_lich_su_cu_tru_check: ((ma_lich_su_cu_tru >= 0) AND (ma_lich_su_cu_tru <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_ma_nguoi_dat_check: ((ma_nguoi_dat >= 0) AND (ma_nguoi_dat <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_ma_tien_ich_check: ((ma_tien_ich >= 0) AND (ma_tien_ich <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK dat_lich_tien_ich_so_nguoi_check: ((so_nguoi >= 0) AND (so_nguoi <= 65535)).
- CHECK dat_lich_tien_ich_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['CHO_DUYET'::character varying, 'DA_DUYET'::character varying, 'TU_CHOI'::character varying, 'DA_HUY'::character varying])::text[])).

## dot_lap_hoa_don

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_lap | bigint | Không | — | identity |
| ma_nguoi_lap | bigint | Không | — |  |
| khoa_yeu_cau | character varying(36) | Không | — | collation: C |
| dau_vao_sha256 | character varying(64) | Không | — | collation: app_ci |
| ket_qua | json | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_lap.
- uq_bill_batch_request (UNIQUE): ma_nguoi_lap, khoa_yeu_cau.
- FK dot_lap_hoa_don_ibfk_1: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_lap_hoa_don_chk_1: ((ket_qua IS NULL) OR (json_typeof(ket_qua) = 'object'::text)).
- CHECK dot_lap_hoa_don_ma_dot_lap_check: ((ma_dot_lap >= 0) AND (ma_dot_lap <= '4294967295'::bigint)).
- CHECK dot_lap_hoa_don_ma_nguoi_lap_check: ((ma_nguoi_lap >= 0) AND (ma_nguoi_lap <= '4294967295'::bigint)).

## dot_nhap_du_lieu

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_nhap | bigint | Không | — | identity |
| ma_nguoi_nhap | bigint | Không | — |  |
| khoa_yeu_cau | character varying(36) | Không | — | collation: C |
| phan_he | character varying(30) | Không | — | collation: app_ci |
| sha256 | character varying(64) | Không | — | collation: C |
| so_dong | integer | Không | — |  |
| ket_qua | json | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_nhap.
- uq_import_file (UNIQUE): ma_nguoi_nhap, phan_he, sha256.
- uq_import_request (UNIQUE): ma_nguoi_nhap, khoa_yeu_cau.
- FK dot_nhap_du_lieu_ibfk_1: (ma_nguoi_nhap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_nhap_du_lieu_chk_1: ((so_dong >= 1) AND (so_dong <= 100)).
- CHECK dot_nhap_du_lieu_ma_dot_nhap_check: ((ma_dot_nhap >= 0) AND (ma_dot_nhap <= '9223372036854775807'::bigint)).
- CHECK dot_nhap_du_lieu_ma_nguoi_nhap_check: ((ma_nguoi_nhap >= 0) AND (ma_nguoi_nhap <= '4294967295'::bigint)).
- CHECK dot_nhap_du_lieu_so_dong_check: ((so_dong >= 0) AND (so_dong <= 65535)).

## dot_xu_ly_hoa_don

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_dot_xu_ly | bigint | Không | — | identity |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| khoa_yeu_cau | character varying(36) | Không | — | collation: C |
| thao_tac | character varying(50) | Không | — | collation: default |
| dau_vao_sha256 | character varying(64) | Không | — | collation: app_ci |
| ket_qua | json | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_dot_xu_ly.
- uq_bill_action_request (UNIQUE): ma_nguoi_thuc_hien, khoa_yeu_cau.
- FK dot_xu_ly_hoa_don_ibfk_1: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK dot_xu_ly_hoa_don_chk_1: ((ket_qua IS NULL) OR (json_typeof(ket_qua) = 'object'::text)).
- CHECK dot_xu_ly_hoa_don_ma_dot_xu_ly_check: ((ma_dot_xu_ly >= 0) AND (ma_dot_xu_ly <= '4294967295'::bigint)).
- CHECK dot_xu_ly_hoa_don_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK dot_xu_ly_hoa_don_thao_tac_check: ((thao_tac)::text = ANY ((ARRAY['DUYET'::character varying, 'GUI'::character varying])::text[])).

## gioi_han_gui

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoa | character varying(64) | Không | — | collation: app_ci |
| cac_moc_thoi_gian | json | Không | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): khoa.

## hinh_anh_phan_anh

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_hinh_anh_phan_anh | bigint | Không | — | identity |
| ma_phan_anh | bigint | Không | — |  |
| duong_dan_tep | character varying(80) | Không | — | collation: app_ci |
| loai | character varying(50) | Không | — | collation: default |
| luot_xu_ly | bigint | Không | — |  |
| ma_nguoi_tai_len | bigint | Có | — |  |
| ngay_tai_len | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_hinh_anh_phan_anh.
- hinh_anh_phan_anh_duong_dan_tep_key (UNIQUE): duong_dan_tep.
- FK hinh_anh_phan_anh_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- FK hinh_anh_phan_anh_ibfk_2: (ma_nguoi_tai_len) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK hinh_anh_phan_anh_loai_check: ((loai)::text = ANY ((ARRAY['PHAN_ANH'::character varying, 'NGHIEM_THU'::character varying])::text[])).
- CHECK hinh_anh_phan_anh_luot_xu_ly_check: ((luot_xu_ly >= 0) AND (luot_xu_ly <= '4294967295'::bigint)).
- CHECK hinh_anh_phan_anh_ma_hinh_anh_phan_anh_check: ((ma_hinh_anh_phan_anh >= 0) AND (ma_hinh_anh_phan_anh <= '4294967295'::bigint)).
- CHECK hinh_anh_phan_anh_ma_nguoi_tai_len_check: ((ma_nguoi_tai_len >= 0) AND (ma_nguoi_tai_len <= '4294967295'::bigint)).
- CHECK hinh_anh_phan_anh_ma_phan_anh_check: ((ma_phan_anh >= 0) AND (ma_phan_anh <= '4294967295'::bigint)).

## hoa_don

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_hoa_don | bigint | Không | — | identity |
| so_hoa_don | character varying(25) | Không | — | collation: app_ci |
| ma_can_ho | bigint | Không | — |  |
| ky_thanh_toan | character varying(7) | Không | — | collation: app_ci |
| ngay_chot_phi | date | Không | — |  |
| lan_lap | bigint | Không | — |  |
| phien_ban | bigint | Không | 0 |  |
| trang_thai | character varying(50) | Không | 'NHAP'::character varying | collation: default |
| tinh_nuoc | smallint | Không | — |  |
| tinh_dien | smallint | Không | — |  |
| tinh_xe | smallint | Không | — |  |
| tong_tien | numeric(14,0) | Không | 0 |  |
| loi_du_lieu | json | Không | — |  |
| dau_van_tay | character varying(64) | Không | — | collation: app_ci |
| han_thanh_toan | date | Có | — |  |
| ma_ngan_hang | character varying(6) | Không | ''::character varying | collation: app_ci |
| so_tai_khoan | character varying(30) | Không | ''::character varying | collation: app_ci |
| ten_nguoi_nhan | character varying(100) | Không | ''::character varying | collation: app_ci |
| ma_hoa_don_thay_the_cho | bigint | Có | — |  |
| ma_nguoi_lap | bigint | Không | — |  |
| ma_nguoi_duyet | bigint | Có | — |  |
| ma_nguoi_gui | bigint | Có | — |  |
| ma_nguoi_huy | bigint | Có | — |  |
| ma_nguoi_xac_nhan | bigint | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| ngay_duyet | timestamp(6) without time zone | Có | — |  |
| ngay_gui | timestamp(6) without time zone | Có | — |  |
| ngay_huy | timestamp(6) without time zone | Có | — |  |
| ngay_thanh_toan | timestamp(6) without time zone | Có | — |  |
| ly_do_huy | character varying(255) | Không | ''::character varying | collation: app_ci |
| so_tien_da_thu | numeric(14,0) | Không | 0 |  |
| ma_tham_chieu | character varying(100) | Có | — | collation: app_ci |
| hieu_luc | smallint | Có | — | STORED GENERATED;  CASE     WHEN ((trang_thai)::text = 'HUY'::text) THEN NULL::integer     ELSE 1 END |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_hoa_don.
- hoa_don_idx_bill_source (INDEX): ma_can_ho, trang_thai, ngay_chot_phi.
- hoa_don_ma_can_ho_ky_thanh_toan_hieu_luc_key (UNIQUE): ma_can_ho, ky_thanh_toan, hieu_luc.
- hoa_don_ma_can_ho_ky_thanh_toan_lan_lap_key (UNIQUE): ma_can_ho, ky_thanh_toan, lan_lap.
- hoa_don_ma_hoa_don_thay_the_cho_key (UNIQUE): ma_hoa_don_thay_the_cho.
- hoa_don_ma_tham_chieu_key (UNIQUE): ma_tham_chieu.
- hoa_don_so_hoa_don_key (UNIQUE): so_hoa_don.
- FK hoa_don_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_2: (ma_hoa_don_thay_the_cho) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_3: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_4: (ma_nguoi_duyet) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_5: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_6: (ma_nguoi_huy) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK hoa_don_ibfk_7: (ma_nguoi_xac_nhan) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK hoa_don_chk_1: ((tong_tien >= (0)::numeric) AND (so_tien_da_thu >= (0)::numeric)).
- CHECK hoa_don_chk_2: (((trang_thai)::text <> 'DA_THANH_TOAN'::text) OR ((so_tien_da_thu = tong_tien) AND (ma_tham_chieu IS NOT NULL))).
- CHECK hoa_don_lan_lap_check: ((lan_lap >= 0) AND (lan_lap <= '4294967295'::bigint)).
- CHECK hoa_don_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK hoa_don_ma_hoa_don_check: ((ma_hoa_don >= 0) AND (ma_hoa_don <= '4294967295'::bigint)).
- CHECK hoa_don_ma_hoa_don_thay_the_cho_check: ((ma_hoa_don_thay_the_cho >= 0) AND (ma_hoa_don_thay_the_cho <= '4294967295'::bigint)).
- CHECK hoa_don_ma_nguoi_duyet_check: ((ma_nguoi_duyet >= 0) AND (ma_nguoi_duyet <= '4294967295'::bigint)).
- CHECK hoa_don_ma_nguoi_gui_check: ((ma_nguoi_gui >= 0) AND (ma_nguoi_gui <= '4294967295'::bigint)).
- CHECK hoa_don_ma_nguoi_huy_check: ((ma_nguoi_huy >= 0) AND (ma_nguoi_huy <= '4294967295'::bigint)).
- CHECK hoa_don_ma_nguoi_lap_check: ((ma_nguoi_lap >= 0) AND (ma_nguoi_lap <= '4294967295'::bigint)).
- CHECK hoa_don_ma_nguoi_xac_nhan_check: ((ma_nguoi_xac_nhan >= 0) AND (ma_nguoi_xac_nhan <= '4294967295'::bigint)).
- CHECK hoa_don_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK hoa_don_tinh_dien_check: (tinh_dien = ANY (ARRAY[0, 1])).
- CHECK hoa_don_tinh_nuoc_check: (tinh_nuoc = ANY (ARRAY[0, 1])).
- CHECK hoa_don_tinh_xe_check: (tinh_xe = ANY (ARRAY[0, 1])).
- CHECK hoa_don_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['NHAP'::character varying, 'DA_DUYET'::character varying, 'DA_GUI'::character varying, 'DA_THANH_TOAN'::character varying, 'HUY'::character varying])::text[])).

## khoi_toa_nha

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoi | character varying(10) | Không | — | collation: app_ci |
| ten_khoi | character varying(100) | Không | ''::character varying | collation: app_ci |
| mo_ta | character varying(255) | Không | ''::character varying | collation: app_ci |
| giu_khi_trong | smallint | Không | 1 |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): khoi.
- CHECK khoi_toa_nha_giu_khi_trong_check: (giu_khi_trong = ANY (ARRAY[0, 1])).
- CHECK khoi_toa_nha_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## lich_su_ban_giao_can_ho

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_ban_giao | bigint | Không | — | identity |
| ma_can_ho | bigint | Không | — |  |
| ma_cu_dan_cu | bigint | Có | — |  |
| ma_cu_dan_moi | bigint | Có | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| su_kien | character varying(30) | Không | — | collation: app_ci |
| ngay_thuc_hien | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_ban_giao.
- lich_su_ban_giao_can_ho_idx_handover_apartment (INDEX): ma_can_ho, ma_ban_giao.
- FK lich_su_ban_giao_can_ho_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_ban_giao_can_ho_ibfk_4: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_ban_giao_can_ho_ma_ban_giao_check: ((ma_ban_giao >= 0) AND (ma_ban_giao <= '4294967295'::bigint)).
- CHECK lich_su_ban_giao_can_ho_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK lich_su_ban_giao_can_ho_ma_cu_dan_cu_check: ((ma_cu_dan_cu >= 0) AND (ma_cu_dan_cu <= '4294967295'::bigint)).
- CHECK lich_su_ban_giao_can_ho_ma_cu_dan_moi_check: ((ma_cu_dan_moi >= 0) AND (ma_cu_dan_moi <= '4294967295'::bigint)).
- CHECK lich_su_ban_giao_can_ho_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).

## lich_su_bao_tri

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | bigint | Không | — | identity |
| ma_thiet_bi | bigint | Không | — |  |
| ma_phieu_bao_tri | bigint | Có | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| su_kien | character varying(30) | Không | — | collation: app_ci |
| ghi_chu | text | Không | — | collation: app_ci |
| du_lieu | json | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su.
- lich_su_bao_tri_idx_maintenance_history (INDEX): ma_thiet_bi, ma_phieu_bao_tri, ma_lich_su.
- FK lich_su_bao_tri_ibfk_1: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_bao_tri_ibfk_2: (ma_phieu_bao_tri) → phieu_bao_tri (ma_phieu_bao_tri); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_bao_tri_ibfk_3: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_bao_tri_ma_lich_su_check: ((ma_lich_su >= 0) AND (ma_lich_su <= '4294967295'::bigint)).
- CHECK lich_su_bao_tri_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK lich_su_bao_tri_ma_phieu_bao_tri_check: ((ma_phieu_bao_tri >= 0) AND (ma_phieu_bao_tri <= '4294967295'::bigint)).
- CHECK lich_su_bao_tri_ma_thiet_bi_check: ((ma_thiet_bi >= 0) AND (ma_thiet_bi <= '4294967295'::bigint)).

## lich_su_cu_tru

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_cu_tru | bigint | Không | — | identity |
| ma_cu_dan | bigint | Không | — |  |
| ma_can_ho | bigint | Không | — |  |
| quan_he | character varying(50) | Không | — | collation: default |
| tu_ngay | date | Không | — |  |
| den_ngay | date | Có | — |  |
| ma_nguoi_ghi_nhan | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| cu_dan_dang_o | bigint | Có | — | STORED GENERATED;  CASE     WHEN (den_ngay IS NULL) THEN ma_cu_dan     ELSE NULL::bigint END |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su_cu_tru.
- lich_su_cu_tru_cu_dan_dang_o_key (UNIQUE): cu_dan_dang_o.
- lich_su_cu_tru_idx_apartment_period (INDEX): ma_can_ho, tu_ngay, den_ngay.
- lich_su_cu_tru_idx_resident_period (INDEX): ma_cu_dan, tu_ngay, den_ngay.
- FK lich_su_cu_tru_ibfk_1: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_cu_tru_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_cu_tru_ibfk_3: (ma_nguoi_ghi_nhan) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_cu_tru_thu_tu_ngay: ((den_ngay IS NULL) OR (den_ngay >= tu_ngay)).
- CHECK lich_su_cu_tru_cu_dan_dang_o_check: ((cu_dan_dang_o >= 0) AND (cu_dan_dang_o <= '4294967295'::bigint)).
- CHECK lich_su_cu_tru_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK lich_su_cu_tru_ma_cu_dan_check: ((ma_cu_dan >= 0) AND (ma_cu_dan <= '4294967295'::bigint)).
- CHECK lich_su_cu_tru_ma_lich_su_cu_tru_check: ((ma_lich_su_cu_tru >= 0) AND (ma_lich_su_cu_tru <= '4294967295'::bigint)).
- CHECK lich_su_cu_tru_ma_nguoi_ghi_nhan_check: ((ma_nguoi_ghi_nhan >= 0) AND (ma_nguoi_ghi_nhan <= '4294967295'::bigint)).
- CHECK lich_su_cu_tru_quan_he_check: ((quan_he)::text = ANY ((ARRAY['CHU_HO'::character varying, 'THANH_VIEN'::character varying, 'NGUOI_THUE'::character varying])::text[])).

## lich_su_dat_lich

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | bigint | Không | — | identity |
| ma_dat_lich | bigint | Không | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| su_kien | character varying(50) | Không | — | collation: default |
| ghi_chu | character varying(1000) | Không | — | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su.
- lich_su_dat_lich_idx_booking_history (INDEX): ma_dat_lich, ma_lich_su.
- FK lich_su_dat_lich_ibfk_1: (ma_dat_lich) → dat_lich_tien_ich (ma_dat_lich); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_dat_lich_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_dat_lich_ma_dat_lich_check: ((ma_dat_lich >= 0) AND (ma_dat_lich <= '4294967295'::bigint)).
- CHECK lich_su_dat_lich_ma_lich_su_check: ((ma_lich_su >= 0) AND (ma_lich_su <= '4294967295'::bigint)).
- CHECK lich_su_dat_lich_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK lich_su_dat_lich_su_kien_check: ((su_kien)::text = ANY ((ARRAY['DAT_LICH'::character varying, 'DUYET'::character varying, 'TU_CHOI'::character varying, 'HUY'::character varying])::text[])).

## lich_su_hoa_don

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_hoa_don | bigint | Không | — | identity |
| ma_hoa_don | bigint | Không | — |  |
| su_kien | character varying(30) | Không | — | collation: app_ci |
| ma_nguoi_ghi | bigint | Không | — |  |
| ghi_chu | character varying(255) | Không | ''::character varying | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su_hoa_don.
- FK lich_su_hoa_don_ibfk_1: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_hoa_don_ibfk_2: (ma_nguoi_ghi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_hoa_don_ma_hoa_don_check: ((ma_hoa_don >= 0) AND (ma_hoa_don <= '4294967295'::bigint)).
- CHECK lich_su_hoa_don_ma_lich_su_hoa_don_check: ((ma_lich_su_hoa_don >= 0) AND (ma_lich_su_hoa_don <= '4294967295'::bigint)).
- CHECK lich_su_hoa_don_ma_nguoi_ghi_check: ((ma_nguoi_ghi >= 0) AND (ma_nguoi_ghi <= '4294967295'::bigint)).

## lich_su_lien_ket_qr

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | bigint | Không | — | identity |
| ma_vi_tri_qr | bigint | Không | — |  |
| ma_thiet_bi_cu | bigint | Có | — |  |
| ma_thiet_bi_moi | bigint | Có | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su.
- lich_su_lien_ket_qr_idx_qr_link_history (INDEX): ma_vi_tri_qr, ma_lich_su.
- FK lich_su_lien_ket_qr_ibfk_1: (ma_vi_tri_qr) → vi_tri_qr (ma_vi_tri_qr); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_lien_ket_qr_ibfk_2: (ma_thiet_bi_cu) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_lien_ket_qr_ibfk_3: (ma_thiet_bi_moi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_lien_ket_qr_ibfk_4: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_lien_ket_qr_ma_lich_su_check: ((ma_lich_su >= 0) AND (ma_lich_su <= '4294967295'::bigint)).
- CHECK lich_su_lien_ket_qr_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK lich_su_lien_ket_qr_ma_thiet_bi_cu_check: ((ma_thiet_bi_cu >= 0) AND (ma_thiet_bi_cu <= '4294967295'::bigint)).
- CHECK lich_su_lien_ket_qr_ma_thiet_bi_moi_check: ((ma_thiet_bi_moi >= 0) AND (ma_thiet_bi_moi <= '4294967295'::bigint)).
- CHECK lich_su_lien_ket_qr_ma_vi_tri_qr_check: ((ma_vi_tri_qr >= 0) AND (ma_vi_tri_qr <= '4294967295'::bigint)).

## lich_su_phan_anh

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su_phan_anh | bigint | Không | — | identity |
| ma_phan_anh | bigint | Không | — |  |
| loai_su_kien | character varying(40) | Không | — | collation: app_ci |
| trang_thai_cu | character varying(20) | Có | — | collation: app_ci |
| trang_thai_moi | character varying(20) | Không | — | collation: app_ci |
| ma_nguoi_thay_doi | bigint | Có | — |  |
| ma_ky_thuat_vien_cu | bigint | Có | — |  |
| ma_ky_thuat_vien_moi | bigint | Có | — |  |
| ghi_chu | character varying(500) | Không | ''::character varying | collation: app_ci |
| noi_dung_cong_khai | character varying(500) | Không | ''::character varying | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su_phan_anh.
- FK lich_su_phan_anh_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_2: (ma_nguoi_thay_doi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_3: (ma_ky_thuat_vien_cu) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK lich_su_phan_anh_ibfk_4: (ma_ky_thuat_vien_moi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_phan_anh_ma_ky_thuat_vien_cu_check: ((ma_ky_thuat_vien_cu >= 0) AND (ma_ky_thuat_vien_cu <= '4294967295'::bigint)).
- CHECK lich_su_phan_anh_ma_ky_thuat_vien_moi_check: ((ma_ky_thuat_vien_moi >= 0) AND (ma_ky_thuat_vien_moi <= '4294967295'::bigint)).
- CHECK lich_su_phan_anh_ma_lich_su_phan_anh_check: ((ma_lich_su_phan_anh >= 0) AND (ma_lich_su_phan_anh <= '4294967295'::bigint)).
- CHECK lich_su_phan_anh_ma_nguoi_thay_doi_check: ((ma_nguoi_thay_doi >= 0) AND (ma_nguoi_thay_doi <= '4294967295'::bigint)).
- CHECK lich_su_phan_anh_ma_phan_anh_check: ((ma_phan_anh >= 0) AND (ma_phan_anh <= '4294967295'::bigint)).

## lich_su_thong_bao

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | bigint | Không | — | identity |
| ma_thong_bao | bigint | Không | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| su_kien | character varying(30) | Không | — | collation: app_ci |
| ghi_chu | character varying(255) | Có | — | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su.
- lich_su_thong_bao_idx_announcement_history (INDEX): ma_thong_bao, ma_lich_su.
- FK lich_su_thong_bao_ibfk_1: (ma_thong_bao) → thong_bao (ma_thong_bao); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_thong_bao_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_thong_bao_ma_lich_su_check: ((ma_lich_su >= 0) AND (ma_lich_su <= '4294967295'::bigint)).
- CHECK lich_su_thong_bao_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK lich_su_thong_bao_ma_thong_bao_check: ((ma_thong_bao >= 0) AND (ma_thong_bao <= '4294967295'::bigint)).

## lich_su_thu_chi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_lich_su | bigint | Không | — | identity |
| ma_phieu | bigint | Không | — |  |
| ma_nguoi_thuc_hien | bigint | Không | — |  |
| su_kien | character varying(30) | Không | — | collation: app_ci |
| ghi_chu | text | Không | — | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_lich_su.
- lich_su_thu_chi_idx_treasury_history (INDEX): ma_phieu, ma_lich_su.
- FK lich_su_thu_chi_ibfk_1: (ma_phieu) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE CASCADE.
- FK lich_su_thu_chi_ibfk_2: (ma_nguoi_thuc_hien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK lich_su_thu_chi_ma_lich_su_check: ((ma_lich_su >= 0) AND (ma_lich_su <= '4294967295'::bigint)).
- CHECK lich_su_thu_chi_ma_nguoi_thuc_hien_check: ((ma_nguoi_thuc_hien >= 0) AND (ma_nguoi_thuc_hien <= '4294967295'::bigint)).
- CHECK lich_su_thu_chi_ma_phieu_check: ((ma_phieu >= 0) AND (ma_phieu <= '4294967295'::bigint)).

## loai_phi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| loai_phi | character varying(30) | Không | — | collation: app_ci |
| ten_phi | character varying(80) | Không | — | collation: app_ci |
| don_vi_tinh | character varying(20) | Không | — | collation: app_ci |

**Chỉ mục**

- PRIMARY (UNIQUE): loai_phi.

## nguoi_dung

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_nguoi_dung | bigint | Không | — | identity |
| ho_va_ten | character varying(100) | Không | — | collation: app_ci |
| so_dien_thoai | character varying(15) | Có | — | collation: app_ci |
| mat_khau_ma_hoa | character varying(255) | Không | — | collation: app_ci |
| vai_tro | character varying(50) | Không | — | collation: default |
| chuyen_mon | character varying(100) | Không | ''::character varying | collation: app_ci |
| dang_hoat_dong | smallint | Không | 1 |  |
| phien_ban_token | bigint | Không | 0 |  |
| so_lan_dang_nhap_sai | bigint | Không | 0 |  |
| khoa_den_luc | timestamp(6) without time zone | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| ten_dang_nhap | character varying(30) | Có | — | collation: app_ci |
| ma_can_ho_thanh_toan | bigint | Có | — |  |
| ma_cu_dan_phu_trach | bigint | Có | — |  |
| phien_ban_ban_giao | bigint | Không | 0 |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_nguoi_dung.
- nguoi_dung_ma_can_ho_thanh_toan_key (UNIQUE): ma_can_ho_thanh_toan.
- nguoi_dung_ma_cu_dan_phu_trach_key (UNIQUE): ma_cu_dan_phu_trach.
- nguoi_dung_so_dien_thoai_key (UNIQUE): so_dien_thoai.
- nguoi_dung_ten_dang_nhap_key (UNIQUE): ten_dang_nhap.
- FK fk_account_apartment: (ma_can_ho_thanh_toan) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE CASCADE.
- FK fk_account_owner: (ma_cu_dan_phu_trach) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE SET NULL.
- CHECK chk_apartment_account: (((ma_can_ho_thanh_toan IS NULL) AND (ten_dang_nhap IS NULL)) OR ((ma_can_ho_thanh_toan IS NOT NULL) AND (ten_dang_nhap IS NOT NULL) AND (so_dien_thoai IS NULL) AND ((vai_tro)::text = 'CU_DAN'::text))).
- CHECK nguoi_dung_dang_hoat_dong_check: (dang_hoat_dong = ANY (ARRAY[0, 1])).
- CHECK nguoi_dung_ma_can_ho_thanh_toan_check: ((ma_can_ho_thanh_toan >= 0) AND (ma_can_ho_thanh_toan <= '4294967295'::bigint)).
- CHECK nguoi_dung_ma_cu_dan_phu_trach_check: ((ma_cu_dan_phu_trach >= 0) AND (ma_cu_dan_phu_trach <= '4294967295'::bigint)).
- CHECK nguoi_dung_ma_nguoi_dung_check: ((ma_nguoi_dung >= 0) AND (ma_nguoi_dung <= '4294967295'::bigint)).
- CHECK nguoi_dung_phien_ban_ban_giao_check: ((phien_ban_ban_giao >= 0) AND (phien_ban_ban_giao <= '4294967295'::bigint)).
- CHECK nguoi_dung_phien_ban_token_check: ((phien_ban_token >= 0) AND (phien_ban_token <= '4294967295'::bigint)).
- CHECK nguoi_dung_so_lan_dang_nhap_sai_check: ((so_lan_dang_nhap_sai >= 0) AND (so_lan_dang_nhap_sai <= '4294967295'::bigint)).
- CHECK nguoi_dung_vai_tro_check: ((vai_tro)::text = ANY ((ARRAY['QUAN_TRI_VIEN'::character varying, 'KY_THUAT_VIEN'::character varying, 'CU_DAN'::character varying])::text[])).

## phan_anh

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phan_anh | bigint | Không | — | identity |
| ma_tra_cuu | character varying(64) | Không | — | collation: C |
| khoa_yeu_cau | character varying(36) | Không | — | collation: C |
| ma_vi_tri_qr | bigint | Không | — |  |
| ma_nguoi_gui | bigint | Có | — |  |
| ten_nguoi_gui | character varying(100) | Không | — | collation: app_ci |
| so_dien_thoai_nguoi_gui | character varying(15) | Không | — | collation: app_ci |
| can_ho_khai_bao | character varying(40) | Không | ''::character varying | collation: app_ci |
| tieu_de | character varying(150) | Không | — | collation: app_ci |
| noi_dung | text | Không | — | collation: app_ci |
| loai_su_co | character varying(50) | Không | — | collation: default |
| do_uu_tien | character varying(50) | Không | 'TRUNG_BINH'::character varying | collation: default |
| trang_thai | character varying(50) | Không | 'MOI'::character varying | collation: default |
| ma_ky_thuat_vien | bigint | Có | — |  |
| ma_phan_anh_goc | bigint | Có | — |  |
| phien_ban | bigint | Không | 0 |  |
| luot_xu_ly | bigint | Không | 1 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| ngay_dong | timestamp(6) without time zone | Có | — |  |
| ma_thiet_bi | bigint | Có | — |  |
| ma_tai_san_luc_gui | character varying(30) | Có | — | collation: app_ci |
| ten_thiet_bi_luc_gui | character varying(150) | Có | — | collation: app_ci |
| vi_tri_thiet_bi_luc_gui | character varying(160) | Có | — | collation: app_ci |
| ma_cu_dan_nguoi_gui | bigint | Có | — |  |
| gui_tu_tai_khoan_can_ho | smallint | Không | 0 |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_phan_anh.
- phan_anh_idx_assigned (INDEX): ma_ky_thuat_vien, trang_thai.
- phan_anh_idx_incident_equipment (INDEX): ma_thiet_bi, ma_phan_anh.
- phan_anh_idx_incident_sender_account (INDEX): ma_nguoi_gui, gui_tu_tai_khoan_can_ho, ma_phan_anh.
- phan_anh_idx_incident_sender_resident (INDEX): ma_cu_dan_nguoi_gui, ma_phan_anh.
- phan_anh_idx_location (INDEX): ma_vi_tri_qr, loai_su_co, trang_thai.
- phan_anh_idx_sender (INDEX): ma_nguoi_gui.
- phan_anh_idx_status (INDEX): trang_thai.
- phan_anh_khoa_yeu_cau_key (UNIQUE): khoa_yeu_cau.
- phan_anh_ma_tra_cuu_key (UNIQUE): ma_tra_cuu.
- FK fk_incident_equipment: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK fk_incident_sender_resident: (ma_cu_dan_nguoi_gui) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_1: (ma_vi_tri_qr) → vi_tri_qr (ma_vi_tri_qr); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_2: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_3: (ma_ky_thuat_vien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phan_anh_ibfk_4: (ma_phan_anh_goc) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_incident_equipment_snapshot: (((ma_thiet_bi IS NULL) AND (ma_tai_san_luc_gui IS NULL) AND (ten_thiet_bi_luc_gui IS NULL) AND (vi_tri_thiet_bi_luc_gui IS NULL)) OR ((ma_thiet_bi IS NOT NULL) AND (ma_tai_san_luc_gui IS NOT NULL) AND (ten_thiet_bi_luc_gui IS NOT NULL) AND (vi_tri_thiet_bi_luc_gui IS NOT NULL))).
- CHECK phan_anh_chk_1: (((trang_thai)::text <> 'TRUNG'::text) OR (ma_phan_anh_goc IS NOT NULL)).
- CHECK phan_anh_do_uu_tien_check: ((do_uu_tien)::text = ANY ((ARRAY['THAP'::character varying, 'TRUNG_BINH'::character varying, 'CAO'::character varying, 'KHAN_CAP'::character varying])::text[])).
- CHECK phan_anh_gui_tu_tai_khoan_can_ho_check: (gui_tu_tai_khoan_can_ho = ANY (ARRAY[0, 1])).
- CHECK phan_anh_loai_su_co_check: ((loai_su_co)::text = ANY ((ARRAY['DIEN'::character varying, 'NUOC'::character varying, 'THANG_MAY'::character varying, 'VE_SINH'::character varying, 'AN_NINH'::character varying, 'KHAC'::character varying])::text[])).
- CHECK phan_anh_luot_xu_ly_check: ((luot_xu_ly >= 0) AND (luot_xu_ly <= '4294967295'::bigint)).
- CHECK phan_anh_ma_cu_dan_nguoi_gui_check: ((ma_cu_dan_nguoi_gui >= 0) AND (ma_cu_dan_nguoi_gui <= '4294967295'::bigint)).
- CHECK phan_anh_ma_ky_thuat_vien_check: ((ma_ky_thuat_vien >= 0) AND (ma_ky_thuat_vien <= '4294967295'::bigint)).
- CHECK phan_anh_ma_nguoi_gui_check: ((ma_nguoi_gui >= 0) AND (ma_nguoi_gui <= '4294967295'::bigint)).
- CHECK phan_anh_ma_phan_anh_check: ((ma_phan_anh >= 0) AND (ma_phan_anh <= '4294967295'::bigint)).
- CHECK phan_anh_ma_phan_anh_goc_check: ((ma_phan_anh_goc >= 0) AND (ma_phan_anh_goc <= '4294967295'::bigint)).
- CHECK phan_anh_ma_thiet_bi_check: ((ma_thiet_bi >= 0) AND (ma_thiet_bi <= '4294967295'::bigint)).
- CHECK phan_anh_ma_vi_tri_qr_check: ((ma_vi_tri_qr >= 0) AND (ma_vi_tri_qr <= '4294967295'::bigint)).
- CHECK phan_anh_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK phan_anh_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['MOI'::character varying, 'DA_PHAN_CONG'::character varying, 'DANG_XU_LY'::character varying, 'DA_XU_LY'::character varying, 'DA_DONG'::character varying, 'TU_CHOI'::character varying, 'TRUNG'::character varying])::text[])).

## phieu_bao_tri

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phieu_bao_tri | bigint | Không | — | identity |
| ma_thiet_bi | bigint | Không | — |  |
| loai | character varying(50) | Không | — | collation: default |
| tieu_de | character varying(180) | Không | — | collation: app_ci |
| noi_dung | character varying(2000) | Không | — | collation: app_ci |
| ten_thiet_bi_luc_lap | character varying(150) | Không | — | collation: app_ci |
| vi_tri_luc_lap | character varying(160) | Không | — | collation: app_ci |
| ngay_lap | date | Không | — |  |
| ngay_den_han | date | Không | — |  |
| chu_ky_ngay | integer | Có | — |  |
| do_uu_tien | character varying(50) | Không | 'THUONG'::character varying | collation: default |
| trang_thai | character varying(50) | Không | 'MOI'::character varying | collation: default |
| ma_ky_thuat_vien | bigint | Có | — |  |
| ma_nguoi_lap | bigint | Không | — |  |
| ma_nguoi_nghiem_thu | bigint | Có | — |  |
| ma_nguoi_huy | bigint | Có | — |  |
| phien_ban | bigint | Không | 0 |  |
| luot_thuc_hien | bigint | Không | 1 |  |
| ngay_thuc_hien | date | Có | — |  |
| ket_qua | text | Không | — | collation: app_ci |
| nhan_xet_nghiem_thu | character varying(1000) | Không | ''::character varying | collation: app_ci |
| ly_do_huy | character varying(500) | Không | ''::character varying | collation: app_ci |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |
| ngay_bat_dau | timestamp(6) without time zone | Có | — |  |
| ngay_bao_cao | timestamp(6) without time zone | Có | — |  |
| ngay_nghiem_thu | timestamp(6) without time zone | Có | — |  |
| ngay_huy | timestamp(6) without time zone | Có | — |  |
| khoa_yeu_cau | character varying(36) | Không | — | collation: C |
| van_tay | character varying(64) | Không | — | collation: app_ci |
| dinh_ky_dang_mo | bigint | Có | — | STORED GENERATED;  CASE     WHEN (((loai)::text = 'DINH_KY'::text) AND ((trang_thai)::text <> ALL ((ARRAY['HOAN_THANH'::character varying, 'HUY'::character varying])::text[]))) THEN ma_thiet_bi     ELSE NULL::bigint END |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_phieu_bao_tri.
- phieu_bao_tri_idx_maintenance_assigned (INDEX): ma_ky_thuat_vien, trang_thai, ngay_den_han.
- phieu_bao_tri_idx_maintenance_due (INDEX): trang_thai, ngay_den_han.
- phieu_bao_tri_idx_maintenance_equipment (INDEX): ma_thiet_bi, trang_thai, ma_phieu_bao_tri.
- phieu_bao_tri_khoa_yeu_cau_key (UNIQUE): khoa_yeu_cau.
- uq_open_periodic (UNIQUE): dinh_ky_dang_mo.
- FK phieu_bao_tri_ibfk_1: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_2: (ma_ky_thuat_vien) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_3: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_4: (ma_nguoi_nghiem_thu) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_bao_tri_ibfk_5: (ma_nguoi_huy) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_maintenance_period_strict: ((((loai)::text = 'DINH_KY'::text) AND (chu_ky_ngay IS NOT NULL) AND ((chu_ky_ngay >= 1) AND (chu_ky_ngay <= 3650))) OR (((loai)::text = 'DOT_XUAT'::text) AND (chu_ky_ngay IS NULL))).
- CHECK phieu_bao_tri_chk_1: ((((loai)::text = 'DINH_KY'::text) AND ((chu_ky_ngay >= 1) AND (chu_ky_ngay <= 3650))) OR (((loai)::text = 'DOT_XUAT'::text) AND (chu_ky_ngay IS NULL))).
- CHECK phieu_bao_tri_chk_2: (((trang_thai)::text <> ALL ((ARRAY['DA_PHAN_CONG'::character varying, 'DANG_THUC_HIEN'::character varying, 'CHO_NGHIEM_THU'::character varying, 'HOAN_THANH'::character varying])::text[])) OR (ma_ky_thuat_vien IS NOT NULL)).
- CHECK phieu_bao_tri_chk_3: (((trang_thai)::text <> ALL ((ARRAY['CHO_NGHIEM_THU'::character varying, 'HOAN_THANH'::character varying])::text[])) OR ((ngay_thuc_hien IS NOT NULL) AND (char_length(ket_qua) >= 10))).
- CHECK phieu_bao_tri_chk_4: ((ngay_thuc_hien IS NULL) OR (ngay_thuc_hien >= ngay_lap)).
- CHECK phieu_bao_tri_chk_5: (((trang_thai)::text <> 'HOAN_THANH'::text) OR ((ma_nguoi_nghiem_thu IS NOT NULL) AND (ngay_nghiem_thu IS NOT NULL))).
- CHECK phieu_bao_tri_chk_6: (((trang_thai)::text <> 'HUY'::text) OR ((ma_nguoi_huy IS NOT NULL) AND (char_length((ly_do_huy)::text) >= 3))).
- CHECK phieu_bao_tri_chu_ky_ngay_check: ((chu_ky_ngay >= 0) AND (chu_ky_ngay <= 65535)).
- CHECK phieu_bao_tri_dinh_ky_dang_mo_check: ((dinh_ky_dang_mo >= 0) AND (dinh_ky_dang_mo <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_do_uu_tien_check: ((do_uu_tien)::text = ANY ((ARRAY['THUONG'::character varying, 'CAO'::character varying, 'KHAN_CAP'::character varying])::text[])).
- CHECK phieu_bao_tri_loai_check: ((loai)::text = ANY ((ARRAY['DINH_KY'::character varying, 'DOT_XUAT'::character varying])::text[])).
- CHECK phieu_bao_tri_luot_thuc_hien_check: ((luot_thuc_hien >= 0) AND (luot_thuc_hien <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_ky_thuat_vien_check: ((ma_ky_thuat_vien >= 0) AND (ma_ky_thuat_vien <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_nguoi_huy_check: ((ma_nguoi_huy >= 0) AND (ma_nguoi_huy <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_nguoi_lap_check: ((ma_nguoi_lap >= 0) AND (ma_nguoi_lap <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_nguoi_nghiem_thu_check: ((ma_nguoi_nghiem_thu >= 0) AND (ma_nguoi_nghiem_thu <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_phieu_bao_tri_check: ((ma_phieu_bao_tri >= 0) AND (ma_phieu_bao_tri <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_ma_thiet_bi_check: ((ma_thiet_bi >= 0) AND (ma_thiet_bi <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK phieu_bao_tri_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['MOI'::character varying, 'DA_PHAN_CONG'::character varying, 'DANG_THUC_HIEN'::character varying, 'CHO_NGHIEM_THU'::character varying, 'HOAN_THANH'::character varying, 'HUY'::character varying])::text[])).

## phieu_thu_chi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phieu | bigint | Không | — | identity |
| ma_quy | bigint | Không | — |  |
| loai | character varying(50) | Không | — | collation: default |
| nhom | character varying(30) | Không | — | collation: app_ci |
| ngay_hach_toan | date | Không | — |  |
| so_tien | numeric(14,0) | Không | — |  |
| doi_tac | character varying(150) | Không | — | collation: app_ci |
| dien_giai | character varying(1000) | Không | — | collation: app_ci |
| trang_thai | character varying(50) | Không | 'NHAP'::character varying | collation: default |
| phien_ban | bigint | Không | 0 |  |
| ma_nguoi_lap | bigint | Không | — |  |
| ma_nguoi_duyet | bigint | Có | — |  |
| ngay_duyet | timestamp(6) without time zone | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |
| ma_phieu_goc | bigint | Có | — |  |
| khoa_yeu_cau | character varying(36) | Có | — | collation: app_ci |
| van_tay | character varying(64) | Có | — | collation: app_ci |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_phieu.
- phieu_thu_chi_idx_treasury_fund (INDEX): ma_quy, trang_thai, ngay_hach_toan, ma_phieu.
- phieu_thu_chi_idx_treasury_queue (INDEX): trang_thai, ma_phieu.
- phieu_thu_chi_khoa_yeu_cau_key (UNIQUE): khoa_yeu_cau.
- phieu_thu_chi_ma_phieu_goc_key (UNIQUE): ma_phieu_goc.
- FK phieu_thu_chi_ibfk_1: (ma_quy) → quy_tai_chinh (ma_quy); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_2: (ma_nguoi_lap) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_3: (ma_nguoi_duyet) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phieu_thu_chi_ibfk_4: (ma_phieu_goc) → phieu_thu_chi (ma_phieu); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK phieu_thu_chi_chk_1: (so_tien > (0)::numeric).
- CHECK phieu_thu_chi_chk_2: (((khoa_yeu_cau IS NOT NULL) AND (van_tay IS NOT NULL) AND (ma_phieu_goc IS NULL)) OR ((khoa_yeu_cau IS NULL) AND (van_tay IS NULL) AND (ma_phieu_goc IS NOT NULL) AND ((trang_thai)::text = 'DA_GHI_SO'::text) AND ((nhom)::text = 'DIEU_CHINH'::text))).
- CHECK phieu_thu_chi_chk_3: (((trang_thai)::text <> 'DA_GHI_SO'::text) OR ((ma_nguoi_duyet IS NOT NULL) AND (ngay_duyet IS NOT NULL))).
- CHECK phieu_thu_chi_loai_check: ((loai)::text = ANY ((ARRAY['THU'::character varying, 'CHI'::character varying])::text[])).
- CHECK phieu_thu_chi_ma_nguoi_duyet_check: ((ma_nguoi_duyet >= 0) AND (ma_nguoi_duyet <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_ma_nguoi_lap_check: ((ma_nguoi_lap >= 0) AND (ma_nguoi_lap <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_ma_phieu_check: ((ma_phieu >= 0) AND (ma_phieu <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_ma_phieu_goc_check: ((ma_phieu_goc >= 0) AND (ma_phieu_goc <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_ma_quy_check: ((ma_quy >= 0) AND (ma_quy <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK phieu_thu_chi_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['NHAP'::character varying, 'DA_GHI_SO'::character varying, 'HUY'::character varying])::text[])).

## phuong_tien

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_phuong_tien | bigint | Không | — | identity |
| ma_dang_ky | character varying(20) | Không | — | collation: app_ci |
| ma_cu_dan | bigint | Không | — |  |
| ma_can_ho | bigint | Không | — |  |
| ma_lich_su_cu_tru | bigint | Không | — |  |
| ma_dang_ky_truoc | bigint | Có | — |  |
| loai_xe | character varying(50) | Không | — | collation: default |
| bien_so | character varying(15) | Có | — | collation: C |
| hang_xe | character varying(50) | Không | ''::character varying | collation: app_ci |
| mau_sac | character varying(50) | Không | ''::character varying | collation: app_ci |
| ngay_dang_ky | date | Không | — |  |
| ngay_ket_thuc | date | Có | — |  |
| ly_do_ket_thuc | character varying(255) | Không | ''::character varying | collation: app_ci |
| ma_nguoi_tao | bigint | Không | — |  |
| ma_nguoi_ket_thuc | bigint | Có | — |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |
| bien_so_dang_hoat_dong | character varying(15) | Có | — | STORED GENERATED;  CASE     WHEN (ngay_ket_thuc IS NULL) THEN bien_so     ELSE NULL::character varying END; collation: C |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_phuong_tien.
- phuong_tien_bien_so_dang_hoat_dong_key (UNIQUE): bien_so_dang_hoat_dong.
- phuong_tien_idx_xe_apartment_period (INDEX): ma_can_ho, ngay_dang_ky, ngay_ket_thuc.
- phuong_tien_idx_xe_plate_period (INDEX): bien_so, ngay_dang_ky, ngay_ket_thuc.
- phuong_tien_idx_xe_resident (INDEX): ma_cu_dan, ngay_ket_thuc.
- phuong_tien_idx_xe_stay (INDEX): ma_lich_su_cu_tru, ngay_ket_thuc.
- phuong_tien_ma_dang_ky_key (UNIQUE): ma_dang_ky.
- phuong_tien_ma_dang_ky_truoc_key (UNIQUE): ma_dang_ky_truoc.
- FK phuong_tien_ibfk_1: (ma_cu_dan) → cu_dan (ma_cu_dan); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_2: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_3: (ma_lich_su_cu_tru) → lich_su_cu_tru (ma_lich_su_cu_tru); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_4: (ma_dang_ky_truoc) → phuong_tien (ma_phuong_tien); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_5: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK phuong_tien_ibfk_6: (ma_nguoi_ket_thuc) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_xe_bien_so: (((loai_xe)::text = 'XE_DAP'::text) OR (bien_so IS NOT NULL)).
- CHECK chk_xe_ket_thuc: (((ngay_ket_thuc IS NULL) AND (ma_nguoi_ket_thuc IS NULL) AND ((ly_do_ket_thuc)::text = ''::text)) OR ((ngay_ket_thuc IS NOT NULL) AND (ma_nguoi_ket_thuc IS NOT NULL) AND (char_length(TRIM(BOTH FROM ly_do_ket_thuc)) > 0))).
- CHECK chk_xe_ngay: ((ngay_ket_thuc IS NULL) OR (ngay_ket_thuc >= ngay_dang_ky)).
- CHECK phuong_tien_loai_xe_check: ((loai_xe)::text = ANY ((ARRAY['O_TO'::character varying, 'XE_MAY'::character varying, 'XE_DAP'::character varying])::text[])).
- CHECK phuong_tien_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_cu_dan_check: ((ma_cu_dan >= 0) AND (ma_cu_dan <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_dang_ky_truoc_check: ((ma_dang_ky_truoc >= 0) AND (ma_dang_ky_truoc <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_lich_su_cu_tru_check: ((ma_lich_su_cu_tru >= 0) AND (ma_lich_su_cu_tru <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_nguoi_ket_thuc_check: ((ma_nguoi_ket_thuc >= 0) AND (ma_nguoi_ket_thuc <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK phuong_tien_ma_phuong_tien_check: ((ma_phuong_tien >= 0) AND (ma_phuong_tien <= '4294967295'::bigint)).
- CHECK phuong_tien_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## quy_tai_chinh

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_quy | bigint | Không | — | identity |
| ten_quy | character varying(120) | Không | — | collation: app_ci |
| mo_ta | character varying(1000) | Không | — | collation: app_ci |
| dang_hoat_dong | smallint | Không | 1 |  |
| nhan_thu_hoa_don | smallint | Không | 0 |  |
| quy_hoa_don | smallint | Có | — | STORED GENERATED;  CASE     WHEN (nhan_thu_hoa_don = 1) THEN 1     ELSE NULL::integer END |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_quy.
- quy_tai_chinh_quy_hoa_don_key (UNIQUE): quy_hoa_don.
- CHECK quy_tai_chinh_chk_1: ((nhan_thu_hoa_don = 0) OR (dang_hoat_dong = 1)).
- CHECK quy_tai_chinh_dang_hoat_dong_check: (dang_hoat_dong = ANY (ARRAY[0, 1])).
- CHECK quy_tai_chinh_ma_quy_check: ((ma_quy >= 0) AND (ma_quy <= '4294967295'::bigint)).
- CHECK quy_tai_chinh_nhan_thu_hoa_don_check: (nhan_thu_hoa_don = ANY (ARRAY[0, 1])).
- CHECK quy_tai_chinh_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## schema_migrations

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| name | character varying(100) | Không | — | collation: default |
| checksum | character(64) | Không | — | collation: default |

**Chỉ mục**

- PRIMARY (UNIQUE): name.

## tang_toa_nha

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoi | character varying(10) | Không | — | collation: app_ci |
| tang | integer | Không | — |  |
| ten_tang | character varying(100) | Không | ''::character varying | collation: app_ci |
| mo_ta | character varying(255) | Không | ''::character varying | collation: app_ci |
| giu_khi_trong | smallint | Không | 1 |  |
| phien_ban | bigint | Không | 0 |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |

**Chỉ mục**

- PRIMARY (UNIQUE): khoi, tang.
- FK fk_floor_block: (khoi) → khoi_toa_nha (khoi); UPDATE CASCADE, DELETE NO ACTION.
- CHECK tang_toa_nha_chk_1: (tang <= 200).
- CHECK tang_toa_nha_giu_khi_trong_check: (giu_khi_trong = ANY (ARRAY[0, 1])).
- CHECK tang_toa_nha_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK tang_toa_nha_tang_check: ((tang >= 0) AND (tang <= 65535)).

## thiet_bi

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thiet_bi | bigint | Không | — | identity |
| ma_tai_san | character varying(30) | Không | — | collation: app_ci |
| ten_thiet_bi | character varying(150) | Không | — | collation: app_ci |
| loai | character varying(50) | Không | — | collation: default |
| vi_tri | character varying(160) | Không | — | collation: app_ci |
| so_serial | character varying(100) | Không | ''::character varying | collation: app_ci |
| ngay_lap_dat | date | Có | — |  |
| ghi_chu | character varying(1000) | Không | ''::character varying | collation: app_ci |
| trang_thai | character varying(50) | Không | 'DANG_SU_DUNG'::character varying | collation: default |
| chu_ky_ngay | integer | Có | — |  |
| ngay_bao_tri_tiep_theo | date | Có | — |  |
| nhac_truoc_ngay | smallint | Không | 7 |  |
| phien_ban | bigint | Không | 0 |  |
| ma_nguoi_tao | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |
| ngay_cap_nhat | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_thiet_bi.
- thiet_bi_idx_equipment_due (INDEX): trang_thai, ngay_bao_tri_tiep_theo.
- thiet_bi_ma_tai_san_key (UNIQUE): ma_tai_san.
- FK thiet_bi_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_equipment_plan_pair_strict: (((chu_ky_ngay IS NULL) AND (ngay_bao_tri_tiep_theo IS NULL)) OR ((chu_ky_ngay IS NOT NULL) AND ((chu_ky_ngay >= 1) AND (chu_ky_ngay <= 3650)) AND (ngay_bao_tri_tiep_theo IS NOT NULL))).
- CHECK thiet_bi_chk_1: (((chu_ky_ngay IS NULL) AND (ngay_bao_tri_tiep_theo IS NULL)) OR (((chu_ky_ngay >= 1) AND (chu_ky_ngay <= 3650)) AND (ngay_bao_tri_tiep_theo IS NOT NULL))).
- CHECK thiet_bi_chk_2: (nhac_truoc_ngay <= 90).
- CHECK thiet_bi_chk_3: (((trang_thai)::text <> 'NGUNG_SU_DUNG'::text) OR (chu_ky_ngay IS NULL)).
- CHECK thiet_bi_chu_ky_ngay_check: ((chu_ky_ngay >= 0) AND (chu_ky_ngay <= 65535)).
- CHECK thiet_bi_loai_check: ((loai)::text = ANY ((ARRAY['THANG_MAY'::character varying, 'MAY_BOM'::character varying, 'PCCC'::character varying, 'DIEN'::character varying, 'NUOC'::character varying, 'CAMERA'::character varying, 'KHAC'::character varying])::text[])).
- CHECK thiet_bi_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK thiet_bi_ma_thiet_bi_check: ((ma_thiet_bi >= 0) AND (ma_thiet_bi <= '4294967295'::bigint)).
- CHECK thiet_bi_nhac_truoc_ngay_check: ((nhac_truoc_ngay >= 0) AND (nhac_truoc_ngay <= 255)).
- CHECK thiet_bi_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK thiet_bi_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['DANG_SU_DUNG'::character varying, 'TAM_DUNG'::character varying, 'NGUNG_SU_DUNG'::character varying])::text[])).

## thong_bao

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thong_bao | bigint | Không | — | identity |
| loai | character varying(50) | Không | 'THONG_BAO'::character varying | collation: default |
| tieu_de | character varying(160) | Không | — | collation: app_ci |
| noi_dung | text | Không | — | collation: app_ci |
| pham_vi | character varying(50) | Không | — | collation: default |
| khoi | character varying(10) | Có | — | collation: app_ci |
| ma_can_ho | bigint | Có | — |  |
| muc_do | character varying(50) | Không | 'THUONG'::character varying | collation: default |
| trang_thai | character varying(50) | Không | 'NHAP'::character varying | collation: default |
| phien_ban | bigint | Không | 0 |  |
| ma_hoa_don | bigint | Có | — |  |
| ngay_nhac | date | Có | — |  |
| ma_nguoi_tao | bigint | Không | — |  |
| ma_nguoi_gui | bigint | Có | — |  |
| ma_nguoi_thu_hoi | bigint | Có | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |
| ngay_gui | timestamp(6) without time zone | Có | — |  |
| ngay_thu_hoi | timestamp(6) without time zone | Có | — |  |
| ly_do_thu_hoi | character varying(255) | Có | — | collation: app_ci |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_thong_bao.
- thong_bao_idx_announcement_inbox (INDEX): trang_thai, ngay_gui, ma_thong_bao.
- uq_bill_reminder_day (UNIQUE): ma_hoa_don, ngay_nhac.
- FK thong_bao_ibfk_1: (ma_can_ho) → can_ho (ma_can_ho); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_2: (ma_hoa_don) → hoa_don (ma_hoa_don); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_3: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_4: (ma_nguoi_gui) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- FK thong_bao_ibfk_5: (ma_nguoi_thu_hoi) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK thong_bao_chk_1: ((((pham_vi)::text = 'TOAN_BO'::text) AND (khoi IS NULL) AND (ma_can_ho IS NULL)) OR (((pham_vi)::text = 'KHOI'::text) AND (khoi IS NOT NULL) AND (ma_can_ho IS NULL)) OR (((pham_vi)::text = 'CAN_HO'::text) AND (khoi IS NULL) AND (ma_can_ho IS NOT NULL))).
- CHECK thong_bao_chk_2: ((((loai)::text = 'THONG_BAO'::text) AND (ma_hoa_don IS NULL) AND (ngay_nhac IS NULL)) OR (((loai)::text = 'NHAC_PHI'::text) AND (ma_hoa_don IS NOT NULL) AND (ngay_nhac IS NOT NULL) AND ((pham_vi)::text = 'CAN_HO'::text))).
- CHECK thong_bao_loai_check: ((loai)::text = ANY ((ARRAY['THONG_BAO'::character varying, 'NHAC_PHI'::character varying])::text[])).
- CHECK thong_bao_ma_can_ho_check: ((ma_can_ho >= 0) AND (ma_can_ho <= '4294967295'::bigint)).
- CHECK thong_bao_ma_hoa_don_check: ((ma_hoa_don >= 0) AND (ma_hoa_don <= '4294967295'::bigint)).
- CHECK thong_bao_ma_nguoi_gui_check: ((ma_nguoi_gui >= 0) AND (ma_nguoi_gui <= '4294967295'::bigint)).
- CHECK thong_bao_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK thong_bao_ma_nguoi_thu_hoi_check: ((ma_nguoi_thu_hoi >= 0) AND (ma_nguoi_thu_hoi <= '4294967295'::bigint)).
- CHECK thong_bao_ma_thong_bao_check: ((ma_thong_bao >= 0) AND (ma_thong_bao <= '4294967295'::bigint)).
- CHECK thong_bao_muc_do_check: ((muc_do)::text = ANY ((ARRAY['THUONG'::character varying, 'QUAN_TRONG'::character varying])::text[])).
- CHECK thong_bao_pham_vi_check: ((pham_vi)::text = ANY ((ARRAY['TOAN_BO'::character varying, 'KHOI'::character varying, 'CAN_HO'::character varying])::text[])).
- CHECK thong_bao_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK thong_bao_trang_thai_check: ((trang_thai)::text = ANY ((ARRAY['NHAP'::character varying, 'DA_GUI'::character varying, 'THU_HOI'::character varying])::text[])).

## thong_bao_da_doc

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_thong_bao | bigint | Không | — |  |
| ma_nguoi_dung | bigint | Không | — |  |
| nguoi_tiep_nhan | bigint | Không | 0 |  |
| ngay_doc | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_thong_bao, ma_nguoi_dung, nguoi_tiep_nhan.
- FK thong_bao_da_doc_ibfk_1: (ma_thong_bao) → thong_bao (ma_thong_bao); UPDATE NO ACTION, DELETE CASCADE.
- FK thong_bao_da_doc_ibfk_2: (ma_nguoi_dung) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE CASCADE.
- CHECK thong_bao_da_doc_ma_nguoi_dung_check: ((ma_nguoi_dung >= 0) AND (ma_nguoi_dung <= '4294967295'::bigint)).
- CHECK thong_bao_da_doc_ma_thong_bao_check: ((ma_thong_bao >= 0) AND (ma_thong_bao <= '4294967295'::bigint)).
- CHECK thong_bao_da_doc_nguoi_tiep_nhan_check: ((nguoi_tiep_nhan >= 0) AND (nguoi_tiep_nhan <= '4294967295'::bigint)).

## tien_ich

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_tien_ich | bigint | Không | — | identity |
| ten_tien_ich | character varying(120) | Không | — | collation: app_ci |
| vi_tri | character varying(160) | Không | — | collation: app_ci |
| mo_ta | text | Không | — | collation: app_ci |
| suc_chua | integer | Không | — |  |
| gio_mo | time without time zone | Không | — |  |
| gio_dong | time without time zone | Không | — |  |
| toi_da_phut | integer | Không | — |  |
| dat_truoc_ngay | integer | Không | — |  |
| dang_mo | smallint | Không | 1 |  |
| phien_ban | bigint | Không | 0 |  |
| ma_nguoi_tao | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP(6) |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_tien_ich.
- tien_ich_idx_amenities_open (INDEX): dang_mo, ma_tien_ich.
- FK tien_ich_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK tien_ich_chk_1: ((suc_chua >= 1) AND (suc_chua <= 1000)).
- CHECK tien_ich_chk_2: ((gio_mo >= '00:00:00'::time without time zone) AND (gio_mo < gio_dong) AND (gio_dong <= '23:30:00'::time without time zone)).
- CHECK tien_ich_chk_3: ((EXTRACT(second FROM gio_mo) = (0)::numeric) AND (EXTRACT(minute FROM gio_mo) = ANY (ARRAY[(0)::numeric, (30)::numeric])) AND (EXTRACT(second FROM gio_dong) = (0)::numeric) AND (EXTRACT(minute FROM gio_dong) = ANY (ARRAY[(0)::numeric, (30)::numeric]))).
- CHECK tien_ich_chk_4: (((toi_da_phut >= 30) AND (toi_da_phut <= 360)) AND (mod(toi_da_phut, 30) = 0)).
- CHECK tien_ich_chk_5: ((dat_truoc_ngay >= 1) AND (dat_truoc_ngay <= 90)).
- CHECK tien_ich_dang_mo_check: (dang_mo = ANY (ARRAY[0, 1])).
- CHECK tien_ich_dat_truoc_ngay_check: ((dat_truoc_ngay >= 0) AND (dat_truoc_ngay <= 65535)).
- CHECK tien_ich_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK tien_ich_ma_tien_ich_check: ((ma_tien_ich >= 0) AND (ma_tien_ich <= '4294967295'::bigint)).
- CHECK tien_ich_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).
- CHECK tien_ich_suc_chua_check: ((suc_chua >= 0) AND (suc_chua <= 65535)).
- CHECK tien_ich_toi_da_phut_check: ((toi_da_phut >= 0) AND (toi_da_phut <= 65535)).

## vi_tri_qr

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| ma_vi_tri_qr | bigint | Không | — | identity |
| ten_vi_tri | character varying(100) | Không | — | collation: app_ci |
| loai | character varying(50) | Không | 'KHU_VUC'::character varying | collation: default |
| mo_ta | character varying(255) | Không | ''::character varying | collation: app_ci |
| token_qr | character varying(36) | Không | — | collation: C |
| dang_hoat_dong | smallint | Không | 1 |  |
| ma_nguoi_tao | bigint | Không | — |  |
| ngay_tao | timestamp(6) without time zone | Không | CURRENT_TIMESTAMP |  |
| ma_thiet_bi | bigint | Có | — |  |
| phien_ban | bigint | Không | 0 |  |

**Chỉ mục**

- PRIMARY (UNIQUE): ma_vi_tri_qr.
- vi_tri_qr_token_qr_key (UNIQUE): token_qr.
- FK fk_qr_equipment: (ma_thiet_bi) → thiet_bi (ma_thiet_bi); UPDATE NO ACTION, DELETE NO ACTION.
- FK vi_tri_qr_ibfk_1: (ma_nguoi_tao) → nguoi_dung (ma_nguoi_dung); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK chk_qr_equipment_type: ((ma_thiet_bi IS NULL) OR ((loai)::text = 'THIET_BI'::text)).
- CHECK vi_tri_qr_dang_hoat_dong_check: (dang_hoat_dong = ANY (ARRAY[0, 1])).
- CHECK vi_tri_qr_loai_check: ((loai)::text = ANY ((ARRAY['KHU_VUC'::character varying, 'THIET_BI'::character varying])::text[])).
- CHECK vi_tri_qr_ma_nguoi_tao_check: ((ma_nguoi_tao >= 0) AND (ma_nguoi_tao <= '4294967295'::bigint)).
- CHECK vi_tri_qr_ma_thiet_bi_check: ((ma_thiet_bi >= 0) AND (ma_thiet_bi <= '4294967295'::bigint)).
- CHECK vi_tri_qr_ma_vi_tri_qr_check: ((ma_vi_tri_qr >= 0) AND (ma_vi_tri_qr <= '4294967295'::bigint)).
- CHECK vi_tri_qr_phien_ban_check: ((phien_ban >= 0) AND (phien_ban <= '4294967295'::bigint)).

## yeu_cau_gui

Engine: PostgreSQL; đối chiếu mặc định database: en_US.utf8 (xem collation từng cột bên dưới).

| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |
|---|---|---|---|---|
| khoa | character varying(36) | Không | — | collation: C |
| van_tay | character varying(64) | Không | — | collation: app_ci |
| ma_phan_anh | bigint | Có | — |  |

**Chỉ mục**

- PRIMARY (UNIQUE): khoa.
- FK yeu_cau_gui_ibfk_1: (ma_phan_anh) → phan_anh (ma_phan_anh); UPDATE NO ACTION, DELETE NO ACTION.
- CHECK yeu_cau_gui_ma_phan_anh_check: ((ma_phan_anh >= 0) AND (ma_phan_anh <= '4294967295'::bigint)).

## Checksum nguồn

| Migration | SHA-256 |
|---|---|
| 001_auth_qr_incidents.sql | 4dda9168b0778251705b4e6a14c299c2db75e389c241b4b65f693b6ff136e59d |
| 002_residency.sql | 44f2e1513f9333d06cca96af230b69f27925c779249430f234da42ca78189de7 |
| 003_same_day_residency.sql | 371ae42e5aa76d34fd2aa1a4a75cff7bca8cbee51d73e193062ca0411e99c650 |
| 004_vehicles.sql | 7ca5eac211acfeef201b9f6e8680d97755b03af075a596256aac0c465ae5692c |
| 005_billing.sql | 80dc37cfcef3beac5165bd8fec356bfb28848eafa51ea1e13a71a9bdb38b5f58 |
| 006_electricity_tiers.sql | e64968a851a91267b3f2643f074d580a0fc2286a1758e88c04a4c8d9f7848f7f |
| 007_apartment_accounts.sql | 4e5917a58222997aa4acc692c32f543d6145d4adae178dd43a30d0d976562731 |
| 008_handover_audit_locks.sql | 11f8e1a8ad3a435c3d61cc72069afddce6f230b80ceb09904ba18e43a0d65659 |
| 009_announcements.sql | 0c53d07f5ad268ea72642da9402da554a891248b3083fb0d2397d102890bfe12 |
| 010_maintenance.sql | 57a9af181bc2d4fe50e07ebe873947263b86e53eeefbc3c21352e74fb30bd572 |
| 011_maintenance_plan_checks.sql | 3ef23b6e950089b6cad4f5d0ed8a375d5db8540f50cf0877c6ab7171bd634cc0 |
| 012_amenity_bookings.sql | c42b88fd2d5a4aa6ef4a888ef608ee609a14286f2695f56b9f367ea32e80bc2f |
| 013_treasury.sql | dfdd44ee50ce161decfbdcd2e034e15c55b176a875493780d66bf88765ffc246 |
| 014_data_imports.sql | 4820fc13f88fc725e0437092e3d556b38fc5708404379610551265f0dc115fb9 |
| 015_bill_batches.sql | 46c451107e716b932fc8aa87e02e1e661db8e1f9fb10a662d05993d6a8891d1f |
| 016_bill_actions.sql | aecb08ed7510151b1546f015457f0ee8f7e3fda58f0fcd7bb8196778c8dadc11 |
| 017_building_structure.sql | 1634fa6772d8d037a0a540f4dba042182e944224bf89ea1ae186e6b499bfa098 |
| 018_equipment_qr.sql | f22d147e715a4b7a81ab385ea86b18e7a07100bf659207a744a1e3872649e090 |
| 019_incident_sender_privacy.sql | 9257b23f79d9f3d6f4a7e4c5d7ab2ea8fbc9d1eb12179d8bfd727269b2040dfb |
