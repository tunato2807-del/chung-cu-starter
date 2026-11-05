-- MySQL 8.4; 31 physical tables, 8 history views. Fresh database only.
-- Original business fields/FKs are retained; eight event histories share one validated store.
SET NAMES utf8mb4;

CREATE TABLE `can_ho` (
  `ma_can_ho` int unsigned NOT NULL AUTO_INCREMENT,
  `so_can_ho` varchar(20) NOT NULL,
  `khoi` varchar(10) NOT NULL,
  `tang` smallint unsigned NOT NULL,
  `dien_tich_m2` decimal(8,2) NOT NULL,
  `tinh_phi_dich_vu` tinyint(1) NOT NULL DEFAULT '1',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_can_ho`),
  UNIQUE KEY `so_can_ho` (`so_can_ho`),
  KEY `idx_floor` (`khoi`,`tang`),
  CONSTRAINT `can_ho_chk_1` CHECK ((`dien_tich_m2` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cau_hinh_phi` (
  `ma_cau_hinh_phi` int unsigned NOT NULL AUTO_INCREMENT,
  `loai_phi` varchar(30) NOT NULL,
  `don_gia` decimal(12,2) NOT NULL,
  `tu_ngay` date NOT NULL,
  `den_ngay` date DEFAULT NULL,
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cach_tinh` enum('DON_GIA','BAC_THANG') NOT NULL DEFAULT 'DON_GIA',
  `thue_gtgt` decimal(5,2) NOT NULL DEFAULT '0.00',
  `bac_dien` json DEFAULT NULL,
  PRIMARY KEY (`ma_cau_hinh_phi`),
  UNIQUE KEY `loai_phi` (`loai_phi`,`tu_ngay`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  CONSTRAINT `cau_hinh_phi_chk_1` CHECK ((`don_gia` >= 0)),
  CONSTRAINT `cau_hinh_phi_chk_2` CHECK (((`den_ngay` is null) or (`den_ngay` > `tu_ngay`))),
  CONSTRAINT `chk_fee_electricity` CHECK ((((`loai_phi` = _utf8mb4'TIEN_DIEN') and (((`cach_tinh` = _utf8mb4'DON_GIA') and (`bac_dien` is null)) or ((`cach_tinh` = _utf8mb4'BAC_THANG') and (`bac_dien` is not null) and (`don_gia` = 0)))) or ((`loai_phi` <> _utf8mb4'TIEN_DIEN') and (`cach_tinh` = _utf8mb4'DON_GIA') and (`thue_gtgt` = 0) and (`bac_dien` is null)))),
  CONSTRAINT `chk_fee_vat` CHECK (((`thue_gtgt` >= 0) and (`thue_gtgt` <= 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chi_so_dich_vu` (
  `ma_chi_so_dich_vu` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_can_ho` int unsigned NOT NULL,
  `loai_dich_vu` enum('DIEN','NUOC') NOT NULL,
  `ky_thanh_toan` char(7) NOT NULL,
  `chi_so_cu` decimal(12,3) NOT NULL,
  `chi_so_moi` decimal(12,3) NOT NULL,
  `ngay_chot` date NOT NULL,
  `ghi_chu` varchar(255) NOT NULL DEFAULT '',
  `ma_nguoi_ghi` int unsigned NOT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_ghi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_chi_so_dich_vu`),
  UNIQUE KEY `ma_can_ho` (`ma_can_ho`,`loai_dich_vu`,`ky_thanh_toan`),
  KEY `ma_nguoi_ghi` (`ma_nguoi_ghi`),
  CONSTRAINT `chi_so_dich_vu_chk_1` CHECK (((`chi_so_cu` >= 0) and (`chi_so_moi` >= `chi_so_cu`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chi_tiet_hoa_don` (
  `ma_chi_tiet_hoa_don` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_hoa_don` int unsigned NOT NULL,
  `ma_cau_hinh_phi` int unsigned NOT NULL,
  `ma_chi_so_dich_vu` int unsigned DEFAULT NULL,
  `loai_phi` varchar(30) NOT NULL,
  `dien_giai` varchar(255) NOT NULL,
  `don_vi_tinh` varchar(20) NOT NULL,
  `so_luong` decimal(12,3) NOT NULL,
  `don_gia` decimal(16,2) NOT NULL,
  `thanh_tien` decimal(14,0) NOT NULL,
  `du_lieu_nguon` json NOT NULL,
  PRIMARY KEY (`ma_chi_tiet_hoa_don`),
  KEY `ma_hoa_don` (`ma_hoa_don`),
  KEY `ma_cau_hinh_phi` (`ma_cau_hinh_phi`),
  KEY `ma_chi_so_dich_vu` (`ma_chi_so_dich_vu`),
  CONSTRAINT `chi_tiet_hoa_don_chk_1` CHECK (((`so_luong` >= 0) and (`don_gia` >= 0) and (`thanh_tien` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chung_tu_thu_chi` (
  `ma_chung_tu` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu` int unsigned NOT NULL,
  `ten_tep` varchar(120) NOT NULL,
  `loai_tep` enum('image/jpeg','application/pdf') NOT NULL,
  `kich_thuoc` int unsigned NOT NULL,
  `bam_sha256` char(64) NOT NULL,
  `noi_dung` mediumblob NOT NULL,
  `ma_nguoi_tai` int unsigned NOT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_chung_tu`),
  UNIQUE KEY `ma_phieu` (`ma_phieu`,`bam_sha256`),
  KEY `ma_nguoi_tai` (`ma_nguoi_tai`),
  CONSTRAINT `chung_tu_thu_chi_chk_1` CHECK ((`kich_thuoc` between 1 and 5242880)),
  CONSTRAINT `chung_tu_thu_chi_chk_2` CHECK ((`kich_thuoc` = length(`noi_dung`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cu_dan` (
  `ma_cu_dan` int unsigned NOT NULL AUTO_INCREMENT,
  `ho_va_ten` varchar(100) NOT NULL,
  `so_dien_thoai` varchar(15) NOT NULL,
  `ma_nguoi_dung` int unsigned DEFAULT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_cu_dan`),
  UNIQUE KEY `ma_nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dat_lich_tien_ich` (
  `ma_dat_lich` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_tien_ich` int unsigned NOT NULL,
  `ma_can_ho` int unsigned NOT NULL,
  `ma_nguoi_dat` int unsigned NOT NULL,
  `ma_cu_dan` int unsigned NOT NULL,
  `ma_lich_su_cu_tru` int unsigned NOT NULL,
  `ten_tien_ich` varchar(120) NOT NULL,
  `vi_tri` varchar(160) NOT NULL,
  `ten_nguoi_dat` varchar(100) NOT NULL,
  `bat_dau` datetime NOT NULL,
  `ket_thuc` datetime NOT NULL,
  `so_nguoi` smallint unsigned NOT NULL,
  `ghi_chu` varchar(1000) NOT NULL,
  `trang_thai` enum('CHO_DUYET','DA_DUYET','TU_CHOI','DA_HUY') NOT NULL DEFAULT 'CHO_DUYET',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `khoa_yeu_cau` char(36) NOT NULL,
  `van_tay` char(64) NOT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_dat_lich`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  KEY `ma_cu_dan` (`ma_cu_dan`),
  KEY `ma_lich_su_cu_tru` (`ma_lich_su_cu_tru`),
  KEY `idx_booking_overlap` (`ma_tien_ich`,`trang_thai`,`bat_dau`,`ket_thuc`),
  KEY `idx_booking_apartment` (`ma_can_ho`,`bat_dau`,`ma_dat_lich`),
  KEY `idx_booking_creator` (`ma_nguoi_dat`,`bat_dau`,`ma_dat_lich`),
  CONSTRAINT `dat_lich_tien_ich_chk_1` CHECK ((`so_nguoi` between 1 and 1000)),
  CONSTRAINT `dat_lich_tien_ich_chk_2` CHECK (((`ket_thuc` > `bat_dau`) and (cast(`bat_dau` as date) = cast(`ket_thuc` as date)))),
  CONSTRAINT `dat_lich_tien_ich_chk_3` CHECK (((second(`bat_dau`) = 0) and (minute(`bat_dau`) in (0,30)) and (second(`ket_thuc`) = 0) and (minute(`ket_thuc`) in (0,30)))),
  CONSTRAINT `dat_lich_tien_ich_chk_4` CHECK ((timestampdiff(MINUTE,`bat_dau`,`ket_thuc`) between 30 and 360))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dot_lap_hoa_don` (
  `ma_dot_lap` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_lap` int unsigned NOT NULL,
  `khoa_yeu_cau` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dau_vao_sha256` char(64) NOT NULL,
  `ket_qua` json DEFAULT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_dot_lap`),
  UNIQUE KEY `uq_bill_batch_request` (`ma_nguoi_lap`,`khoa_yeu_cau`),
  CONSTRAINT `dot_lap_hoa_don_chk_1` CHECK (((`ket_qua` is null) or (json_type(`ket_qua`) = _utf8mb4'OBJECT')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dot_nhap_du_lieu` (
  `ma_dot_nhap` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_nhap` int unsigned NOT NULL,
  `khoa_yeu_cau` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `phan_he` varchar(30) NOT NULL,
  `sha256` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `so_dong` smallint unsigned NOT NULL,
  `ket_qua` json NOT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_dot_nhap`),
  UNIQUE KEY `uq_import_request` (`ma_nguoi_nhap`,`khoa_yeu_cau`),
  UNIQUE KEY `uq_import_file` (`ma_nguoi_nhap`,`phan_he`,`sha256`),
  CONSTRAINT `dot_nhap_du_lieu_chk_1` CHECK ((`so_dong` between 1 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dot_xu_ly_hoa_don` (
  `ma_dot_xu_ly` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_thuc_hien` int unsigned NOT NULL,
  `khoa_yeu_cau` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `thao_tac` enum('DUYET','GUI') NOT NULL,
  `dau_vao_sha256` char(64) NOT NULL,
  `ket_qua` json DEFAULT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_dot_xu_ly`),
  UNIQUE KEY `uq_bill_action_request` (`ma_nguoi_thuc_hien`,`khoa_yeu_cau`),
  CONSTRAINT `dot_xu_ly_hoa_don_chk_1` CHECK (((`ket_qua` is null) or (json_type(`ket_qua`) = _utf8mb4'OBJECT')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `gioi_han_gui` (
  `khoa` char(64) NOT NULL,
  `cac_moc_thoi_gian` json NOT NULL,
  PRIMARY KEY (`khoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hinh_anh_phan_anh` (
  `ma_hinh_anh_phan_anh` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_phan_anh` int unsigned NOT NULL,
  `duong_dan_tep` varchar(80) NOT NULL,
  `loai` enum('PHAN_ANH','NGHIEM_THU') NOT NULL,
  `luot_xu_ly` int unsigned NOT NULL,
  `ma_nguoi_tai_len` int unsigned DEFAULT NULL,
  `ngay_tai_len` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_hinh_anh_phan_anh`),
  UNIQUE KEY `duong_dan_tep` (`duong_dan_tep`),
  KEY `ma_phan_anh` (`ma_phan_anh`),
  KEY `ma_nguoi_tai_len` (`ma_nguoi_tai_len`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hoa_don` (
  `ma_hoa_don` int unsigned NOT NULL AUTO_INCREMENT,
  `so_hoa_don` varchar(25) NOT NULL,
  `ma_can_ho` int unsigned NOT NULL,
  `ky_thanh_toan` char(7) NOT NULL,
  `ngay_chot_phi` date NOT NULL,
  `lan_lap` int unsigned NOT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `trang_thai` enum('NHAP','DA_DUYET','DA_GUI','DA_THANH_TOAN','HUY') NOT NULL DEFAULT 'NHAP',
  `tinh_nuoc` tinyint(1) NOT NULL,
  `tinh_dien` tinyint(1) NOT NULL,
  `tinh_xe` tinyint(1) NOT NULL,
  `tong_tien` decimal(14,0) NOT NULL DEFAULT '0',
  `loi_du_lieu` json NOT NULL,
  `dau_van_tay` char(64) NOT NULL,
  `han_thanh_toan` date DEFAULT NULL,
  `ma_ngan_hang` char(6) NOT NULL DEFAULT '',
  `so_tai_khoan` varchar(30) NOT NULL DEFAULT '',
  `ten_nguoi_nhan` varchar(100) NOT NULL DEFAULT '',
  `ma_hoa_don_thay_the_cho` int unsigned DEFAULT NULL,
  `ma_nguoi_lap` int unsigned NOT NULL,
  `ma_nguoi_duyet` int unsigned DEFAULT NULL,
  `ma_nguoi_gui` int unsigned DEFAULT NULL,
  `ma_nguoi_huy` int unsigned DEFAULT NULL,
  `ma_nguoi_xac_nhan` int unsigned DEFAULT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_duyet` datetime DEFAULT NULL,
  `ngay_gui` datetime DEFAULT NULL,
  `ngay_huy` datetime DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT NULL,
  `ly_do_huy` varchar(255) NOT NULL DEFAULT '',
  `so_tien_da_thu` decimal(14,0) NOT NULL DEFAULT '0',
  `ma_tham_chieu` varchar(100) DEFAULT NULL,
  `hieu_luc` tinyint GENERATED ALWAYS AS ((case when (`trang_thai` = _utf8mb4'HUY') then NULL else 1 end)) STORED,
  PRIMARY KEY (`ma_hoa_don`),
  UNIQUE KEY `so_hoa_don` (`so_hoa_don`),
  UNIQUE KEY `ma_can_ho` (`ma_can_ho`,`ky_thanh_toan`,`lan_lap`),
  UNIQUE KEY `ma_hoa_don_thay_the_cho` (`ma_hoa_don_thay_the_cho`),
  UNIQUE KEY `ma_tham_chieu` (`ma_tham_chieu`),
  UNIQUE KEY `ma_can_ho_2` (`ma_can_ho`,`ky_thanh_toan`,`hieu_luc`),
  KEY `ma_nguoi_lap` (`ma_nguoi_lap`),
  KEY `ma_nguoi_duyet` (`ma_nguoi_duyet`),
  KEY `ma_nguoi_gui` (`ma_nguoi_gui`),
  KEY `ma_nguoi_huy` (`ma_nguoi_huy`),
  KEY `ma_nguoi_xac_nhan` (`ma_nguoi_xac_nhan`),
  KEY `idx_bill_source` (`ma_can_ho`,`trang_thai`,`ngay_chot_phi`),
  CONSTRAINT `hoa_don_chk_1` CHECK (((`tong_tien` >= 0) and (`so_tien_da_thu` >= 0))),
  CONSTRAINT `hoa_don_chk_2` CHECK (((`trang_thai` <> _utf8mb4'DA_THANH_TOAN') or ((`so_tien_da_thu` = `tong_tien`) and (`ma_tham_chieu` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `khoi_toa_nha` (
  `khoi` varchar(10) NOT NULL,
  `ten_khoi` varchar(100) NOT NULL DEFAULT '',
  `mo_ta` varchar(255) NOT NULL DEFAULT '',
  `giu_khi_trong` tinyint(1) NOT NULL DEFAULT '1',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`khoi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `lich_su_cu_tru` (
  `ma_lich_su_cu_tru` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_cu_dan` int unsigned NOT NULL,
  `ma_can_ho` int unsigned NOT NULL,
  `quan_he` enum('CHU_HO','THANH_VIEN','NGUOI_THUE') NOT NULL,
  `tu_ngay` date NOT NULL,
  `den_ngay` date DEFAULT NULL,
  `ma_nguoi_ghi_nhan` int unsigned NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cu_dan_dang_o` int unsigned GENERATED ALWAYS AS ((case when (`den_ngay` is null) then `ma_cu_dan` else NULL end)) STORED,
  PRIMARY KEY (`ma_lich_su_cu_tru`),
  UNIQUE KEY `cu_dan_dang_o` (`cu_dan_dang_o`),
  KEY `ma_nguoi_ghi_nhan` (`ma_nguoi_ghi_nhan`),
  KEY `idx_resident_period` (`ma_cu_dan`,`tu_ngay`,`den_ngay`),
  KEY `idx_apartment_period` (`ma_can_ho`,`tu_ngay`,`den_ngay`),
  CONSTRAINT `chk_cu_tru_thu_tu_ngay` CHECK (((`den_ngay` is null) or (`den_ngay` >= `tu_ngay`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `loai_phi` (
  `loai_phi` varchar(30) NOT NULL,
  `ten_phi` varchar(80) NOT NULL,
  `don_vi_tinh` varchar(20) NOT NULL,
  PRIMARY KEY (`loai_phi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `nguoi_dung` (
  `ma_nguoi_dung` int unsigned NOT NULL AUTO_INCREMENT,
  `ho_va_ten` varchar(100) NOT NULL,
  `so_dien_thoai` varchar(15) DEFAULT NULL,
  `mat_khau_ma_hoa` varchar(255) NOT NULL,
  `vai_tro` enum('QUAN_TRI_VIEN','KY_THUAT_VIEN','CU_DAN') NOT NULL,
  `chuyen_mon` varchar(100) NOT NULL DEFAULT '',
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `phien_ban_token` int unsigned NOT NULL DEFAULT '0',
  `so_lan_dang_nhap_sai` int unsigned NOT NULL DEFAULT '0',
  `khoa_den_luc` datetime DEFAULT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ten_dang_nhap` varchar(30) DEFAULT NULL,
  `ma_can_ho_thanh_toan` int unsigned DEFAULT NULL,
  `ma_cu_dan_phu_trach` int unsigned DEFAULT NULL,
  `phien_ban_ban_giao` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ma_nguoi_dung`),
  UNIQUE KEY `so_dien_thoai` (`so_dien_thoai`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  UNIQUE KEY `ma_can_ho_thanh_toan` (`ma_can_ho_thanh_toan`),
  UNIQUE KEY `ma_cu_dan_phu_trach` (`ma_cu_dan_phu_trach`),
  CONSTRAINT `chk_apartment_account` CHECK ((((`ma_can_ho_thanh_toan` is null) and (`ten_dang_nhap` is null)) or ((`ma_can_ho_thanh_toan` is not null) and (`ten_dang_nhap` is not null) and (`so_dien_thoai` is null) and (`vai_tro` = _utf8mb4'CU_DAN'))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `phan_anh` (
  `ma_phan_anh` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_tra_cuu` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `khoa_yeu_cau` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `ma_vi_tri_qr` int unsigned NOT NULL,
  `ma_nguoi_gui` int unsigned DEFAULT NULL,
  `ten_nguoi_gui` varchar(100) NOT NULL,
  `so_dien_thoai_nguoi_gui` varchar(15) NOT NULL,
  `can_ho_khai_bao` varchar(40) NOT NULL DEFAULT '',
  `tieu_de` varchar(150) NOT NULL,
  `noi_dung` text NOT NULL,
  `loai_su_co` enum('DIEN','NUOC','THANG_MAY','VE_SINH','AN_NINH','KHAC') NOT NULL,
  `do_uu_tien` enum('THAP','TRUNG_BINH','CAO','KHAN_CAP') NOT NULL DEFAULT 'TRUNG_BINH',
  `trang_thai` enum('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY','DA_DONG','TU_CHOI','TRUNG') NOT NULL DEFAULT 'MOI',
  `ma_ky_thuat_vien` int unsigned DEFAULT NULL,
  `ma_phan_anh_goc` int unsigned DEFAULT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `luot_xu_ly` int unsigned NOT NULL DEFAULT '1',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_dong` datetime DEFAULT NULL,
  `ma_thiet_bi` int unsigned DEFAULT NULL,
  `ma_tai_san_luc_gui` varchar(30) DEFAULT NULL,
  `ten_thiet_bi_luc_gui` varchar(150) DEFAULT NULL,
  `vi_tri_thiet_bi_luc_gui` varchar(160) DEFAULT NULL,
  `ma_cu_dan_nguoi_gui` int unsigned DEFAULT NULL,
  `gui_tu_tai_khoan_can_ho` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ma_phan_anh`),
  UNIQUE KEY `ma_tra_cuu` (`ma_tra_cuu`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  KEY `ma_phan_anh_goc` (`ma_phan_anh_goc`),
  KEY `idx_status` (`trang_thai`),
  KEY `idx_assigned` (`ma_ky_thuat_vien`,`trang_thai`),
  KEY `idx_sender` (`ma_nguoi_gui`),
  KEY `idx_location` (`ma_vi_tri_qr`,`loai_su_co`,`trang_thai`),
  KEY `idx_incident_equipment` (`ma_thiet_bi`,`ma_phan_anh`),
  KEY `idx_incident_sender_resident` (`ma_cu_dan_nguoi_gui`,`ma_phan_anh`),
  KEY `idx_incident_sender_account` (`ma_nguoi_gui`,`gui_tu_tai_khoan_can_ho`,`ma_phan_anh`),
  CONSTRAINT `chk_incident_equipment_snapshot` CHECK ((((`ma_thiet_bi` is null) and (`ma_tai_san_luc_gui` is null) and (`ten_thiet_bi_luc_gui` is null) and (`vi_tri_thiet_bi_luc_gui` is null)) or ((`ma_thiet_bi` is not null) and (`ma_tai_san_luc_gui` is not null) and (`ten_thiet_bi_luc_gui` is not null) and (`vi_tri_thiet_bi_luc_gui` is not null)))),
  CONSTRAINT `phan_anh_chk_1` CHECK (((`trang_thai` <> _utf8mb4'TRUNG') or (`ma_phan_anh_goc` is not null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `phieu_bao_tri` (
  `ma_phieu_bao_tri` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_thiet_bi` int unsigned NOT NULL,
  `loai` enum('DINH_KY','DOT_XUAT') NOT NULL,
  `tieu_de` varchar(180) NOT NULL,
  `noi_dung` varchar(2000) NOT NULL,
  `ten_thiet_bi_luc_lap` varchar(150) NOT NULL,
  `vi_tri_luc_lap` varchar(160) NOT NULL,
  `ngay_lap` date NOT NULL,
  `ngay_den_han` date NOT NULL,
  `chu_ky_ngay` smallint unsigned DEFAULT NULL,
  `do_uu_tien` enum('THUONG','CAO','KHAN_CAP') NOT NULL DEFAULT 'THUONG',
  `trang_thai` enum('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU','HOAN_THANH','HUY') NOT NULL DEFAULT 'MOI',
  `ma_ky_thuat_vien` int unsigned DEFAULT NULL,
  `ma_nguoi_lap` int unsigned NOT NULL,
  `ma_nguoi_nghiem_thu` int unsigned DEFAULT NULL,
  `ma_nguoi_huy` int unsigned DEFAULT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `luot_thuc_hien` int unsigned NOT NULL DEFAULT '1',
  `ngay_thuc_hien` date DEFAULT NULL,
  `ket_qua` text NOT NULL,
  `nhan_xet_nghiem_thu` varchar(1000) NOT NULL DEFAULT '',
  `ly_do_huy` varchar(500) NOT NULL DEFAULT '',
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ngay_bat_dau` datetime(6) DEFAULT NULL,
  `ngay_bao_cao` datetime(6) DEFAULT NULL,
  `ngay_nghiem_thu` datetime(6) DEFAULT NULL,
  `ngay_huy` datetime(6) DEFAULT NULL,
  `khoa_yeu_cau` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `van_tay` char(64) NOT NULL,
  `dinh_ky_dang_mo` int unsigned GENERATED ALWAYS AS ((case when ((`loai` = _utf8mb4'DINH_KY') and (`trang_thai` not in (_utf8mb4'HOAN_THANH',_utf8mb4'HUY'))) then `ma_thiet_bi` else NULL end)) STORED,
  PRIMARY KEY (`ma_phieu_bao_tri`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  UNIQUE KEY `uq_open_periodic` (`dinh_ky_dang_mo`),
  KEY `ma_nguoi_lap` (`ma_nguoi_lap`),
  KEY `ma_nguoi_nghiem_thu` (`ma_nguoi_nghiem_thu`),
  KEY `ma_nguoi_huy` (`ma_nguoi_huy`),
  KEY `idx_maintenance_equipment` (`ma_thiet_bi`,`trang_thai`,`ma_phieu_bao_tri`),
  KEY `idx_maintenance_assigned` (`ma_ky_thuat_vien`,`trang_thai`,`ngay_den_han`),
  KEY `idx_maintenance_due` (`trang_thai`,`ngay_den_han`),
  CONSTRAINT `chk_maintenance_period_strict` CHECK ((((`loai` = _utf8mb4'DINH_KY') and (`chu_ky_ngay` is not null) and (`chu_ky_ngay` between 1 and 3650)) or ((`loai` = _utf8mb4'DOT_XUAT') and (`chu_ky_ngay` is null)))),
  CONSTRAINT `phieu_bao_tri_chk_1` CHECK ((((`loai` = _utf8mb4'DINH_KY') and (`chu_ky_ngay` between 1 and 3650)) or ((`loai` = _utf8mb4'DOT_XUAT') and (`chu_ky_ngay` is null)))),
  CONSTRAINT `phieu_bao_tri_chk_2` CHECK (((`trang_thai` not in (_utf8mb4'DA_PHAN_CONG',_utf8mb4'DANG_THUC_HIEN',_utf8mb4'CHO_NGHIEM_THU',_utf8mb4'HOAN_THANH')) or (`ma_ky_thuat_vien` is not null))),
  CONSTRAINT `phieu_bao_tri_chk_3` CHECK (((`trang_thai` not in (_utf8mb4'CHO_NGHIEM_THU',_utf8mb4'HOAN_THANH')) or ((`ngay_thuc_hien` is not null) and (char_length(`ket_qua`) >= 10)))),
  CONSTRAINT `phieu_bao_tri_chk_4` CHECK (((`ngay_thuc_hien` is null) or (`ngay_thuc_hien` >= `ngay_lap`))),
  CONSTRAINT `phieu_bao_tri_chk_5` CHECK (((`trang_thai` <> _utf8mb4'HOAN_THANH') or ((`ma_nguoi_nghiem_thu` is not null) and (`ngay_nghiem_thu` is not null)))),
  CONSTRAINT `phieu_bao_tri_chk_6` CHECK (((`trang_thai` <> _utf8mb4'HUY') or ((`ma_nguoi_huy` is not null) and (char_length(`ly_do_huy`) >= 3))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `phieu_thu_chi` (
  `ma_phieu` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_quy` int unsigned NOT NULL,
  `loai` enum('THU','CHI') NOT NULL,
  `nhom` varchar(30) NOT NULL,
  `ngay_hach_toan` date NOT NULL,
  `so_tien` decimal(14,0) NOT NULL,
  `doi_tac` varchar(150) NOT NULL,
  `dien_giai` varchar(1000) NOT NULL,
  `trang_thai` enum('NHAP','DA_GHI_SO','HUY') NOT NULL DEFAULT 'NHAP',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ma_nguoi_lap` int unsigned NOT NULL,
  `ma_nguoi_duyet` int unsigned DEFAULT NULL,
  `ngay_duyet` datetime(6) DEFAULT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ma_phieu_goc` int unsigned DEFAULT NULL,
  `khoa_yeu_cau` char(36) DEFAULT NULL,
  `van_tay` char(64) DEFAULT NULL,
  PRIMARY KEY (`ma_phieu`),
  UNIQUE KEY `ma_phieu_goc` (`ma_phieu_goc`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  KEY `ma_nguoi_lap` (`ma_nguoi_lap`),
  KEY `ma_nguoi_duyet` (`ma_nguoi_duyet`),
  KEY `idx_treasury_fund` (`ma_quy`,`trang_thai`,`ngay_hach_toan`,`ma_phieu`),
  KEY `idx_treasury_queue` (`trang_thai`,`ma_phieu`),
  CONSTRAINT `phieu_thu_chi_chk_1` CHECK ((`so_tien` > 0)),
  CONSTRAINT `phieu_thu_chi_chk_2` CHECK ((((`khoa_yeu_cau` is not null) and (`van_tay` is not null) and (`ma_phieu_goc` is null)) or ((`khoa_yeu_cau` is null) and (`van_tay` is null) and (`ma_phieu_goc` is not null) and (`trang_thai` = _utf8mb4'DA_GHI_SO') and (`nhom` = _utf8mb4'DIEU_CHINH')))),
  CONSTRAINT `phieu_thu_chi_chk_3` CHECK (((`trang_thai` <> _utf8mb4'DA_GHI_SO') or ((`ma_nguoi_duyet` is not null) and (`ngay_duyet` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `phuong_tien` (
  `ma_phuong_tien` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_dang_ky` varchar(20) NOT NULL,
  `ma_cu_dan` int unsigned NOT NULL,
  `ma_can_ho` int unsigned NOT NULL,
  `ma_lich_su_cu_tru` int unsigned NOT NULL,
  `ma_dang_ky_truoc` int unsigned DEFAULT NULL,
  `loai_xe` enum('O_TO','XE_MAY','XE_DAP') NOT NULL,
  `bien_so` varchar(15) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `hang_xe` varchar(50) NOT NULL DEFAULT '',
  `mau_sac` varchar(50) NOT NULL DEFAULT '',
  `ngay_dang_ky` date NOT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `ly_do_ket_thuc` varchar(255) NOT NULL DEFAULT '',
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ma_nguoi_ket_thuc` int unsigned DEFAULT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `bien_so_dang_hoat_dong` varchar(15) CHARACTER SET ascii COLLATE ascii_bin GENERATED ALWAYS AS ((case when (`ngay_ket_thuc` is null) then `bien_so` else NULL end)) STORED,
  PRIMARY KEY (`ma_phuong_tien`),
  UNIQUE KEY `ma_dang_ky` (`ma_dang_ky`),
  UNIQUE KEY `ma_dang_ky_truoc` (`ma_dang_ky_truoc`),
  UNIQUE KEY `bien_so_dang_hoat_dong` (`bien_so_dang_hoat_dong`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  KEY `ma_nguoi_ket_thuc` (`ma_nguoi_ket_thuc`),
  KEY `idx_xe_resident` (`ma_cu_dan`,`ngay_ket_thuc`),
  KEY `idx_xe_stay` (`ma_lich_su_cu_tru`,`ngay_ket_thuc`),
  KEY `idx_xe_apartment_period` (`ma_can_ho`,`ngay_dang_ky`,`ngay_ket_thuc`),
  KEY `idx_xe_plate_period` (`bien_so`,`ngay_dang_ky`,`ngay_ket_thuc`),
  CONSTRAINT `chk_xe_bien_so` CHECK (((`loai_xe` = _utf8mb4'XE_DAP') or (`bien_so` is not null))),
  CONSTRAINT `chk_xe_ket_thuc` CHECK ((((`ngay_ket_thuc` is null) and (`ma_nguoi_ket_thuc` is null) and (`ly_do_ket_thuc` = _utf8mb4'')) or ((`ngay_ket_thuc` is not null) and (`ma_nguoi_ket_thuc` is not null) and (char_length(trim(`ly_do_ket_thuc`)) > 0)))),
  CONSTRAINT `chk_xe_ngay` CHECK (((`ngay_ket_thuc` is null) or (`ngay_ket_thuc` >= `ngay_dang_ky`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `quy_tai_chinh` (
  `ma_quy` int unsigned NOT NULL AUTO_INCREMENT,
  `ten_quy` varchar(120) NOT NULL,
  `mo_ta` varchar(1000) NOT NULL,
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `nhan_thu_hoa_don` tinyint(1) NOT NULL DEFAULT '0',
  `quy_hoa_don` tinyint GENERATED ALWAYS AS (if(`nhan_thu_hoa_don`,1,NULL)) STORED,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_quy`),
  UNIQUE KEY `quy_hoa_don` (`quy_hoa_don`),
  CONSTRAINT `quy_tai_chinh_chk_1` CHECK (((`nhan_thu_hoa_don` = 0) or (`dang_hoat_dong` = 1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `name` varchar(100) NOT NULL,
  `checksum` char(64) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tang_toa_nha` (
  `khoi` varchar(10) NOT NULL,
  `tang` smallint unsigned NOT NULL,
  `ten_tang` varchar(100) NOT NULL DEFAULT '',
  `mo_ta` varchar(255) NOT NULL DEFAULT '',
  `giu_khi_trong` tinyint(1) NOT NULL DEFAULT '1',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`khoi`,`tang`),
  CONSTRAINT `tang_toa_nha_chk_1` CHECK ((`tang` <= 200))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `thiet_bi` (
  `ma_thiet_bi` int unsigned NOT NULL AUTO_INCREMENT,
  `ma_tai_san` varchar(30) NOT NULL,
  `ten_thiet_bi` varchar(150) NOT NULL,
  `loai` enum('THANG_MAY','MAY_BOM','PCCC','DIEN','NUOC','CAMERA','KHAC') NOT NULL,
  `vi_tri` varchar(160) NOT NULL,
  `so_serial` varchar(100) NOT NULL DEFAULT '',
  `ngay_lap_dat` date DEFAULT NULL,
  `ghi_chu` varchar(1000) NOT NULL DEFAULT '',
  `trang_thai` enum('DANG_SU_DUNG','TAM_DUNG','NGUNG_SU_DUNG') NOT NULL DEFAULT 'DANG_SU_DUNG',
  `chu_ky_ngay` smallint unsigned DEFAULT NULL,
  `ngay_bao_tri_tiep_theo` date DEFAULT NULL,
  `nhac_truoc_ngay` tinyint unsigned NOT NULL DEFAULT '7',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ngay_cap_nhat` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_thiet_bi`),
  UNIQUE KEY `ma_tai_san` (`ma_tai_san`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  KEY `idx_equipment_due` (`trang_thai`,`ngay_bao_tri_tiep_theo`),
  CONSTRAINT `chk_equipment_plan_pair_strict` CHECK ((((`chu_ky_ngay` is null) and (`ngay_bao_tri_tiep_theo` is null)) or ((`chu_ky_ngay` is not null) and (`chu_ky_ngay` between 1 and 3650) and (`ngay_bao_tri_tiep_theo` is not null)))),
  CONSTRAINT `thiet_bi_chk_1` CHECK ((((`chu_ky_ngay` is null) and (`ngay_bao_tri_tiep_theo` is null)) or ((`chu_ky_ngay` between 1 and 3650) and (`ngay_bao_tri_tiep_theo` is not null)))),
  CONSTRAINT `thiet_bi_chk_2` CHECK ((`nhac_truoc_ngay` <= 90)),
  CONSTRAINT `thiet_bi_chk_3` CHECK (((`trang_thai` <> _utf8mb4'NGUNG_SU_DUNG') or (`chu_ky_ngay` is null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `thong_bao` (
  `ma_thong_bao` int unsigned NOT NULL AUTO_INCREMENT,
  `loai` enum('THONG_BAO','NHAC_PHI') NOT NULL DEFAULT 'THONG_BAO',
  `tieu_de` varchar(160) NOT NULL,
  `noi_dung` text NOT NULL,
  `pham_vi` enum('TOAN_BO','KHOI','CAN_HO') NOT NULL,
  `khoi` varchar(10) DEFAULT NULL,
  `ma_can_ho` int unsigned DEFAULT NULL,
  `muc_do` enum('THUONG','QUAN_TRONG') NOT NULL DEFAULT 'THUONG',
  `trang_thai` enum('NHAP','DA_GUI','THU_HOI') NOT NULL DEFAULT 'NHAP',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ma_hoa_don` int unsigned DEFAULT NULL,
  `ngay_nhac` date DEFAULT NULL,
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ma_nguoi_gui` int unsigned DEFAULT NULL,
  `ma_nguoi_thu_hoi` int unsigned DEFAULT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ngay_gui` datetime(6) DEFAULT NULL,
  `ngay_thu_hoi` datetime(6) DEFAULT NULL,
  `ly_do_thu_hoi` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ma_thong_bao`),
  UNIQUE KEY `uq_bill_reminder_day` (`ma_hoa_don`,`ngay_nhac`),
  KEY `ma_can_ho` (`ma_can_ho`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  KEY `ma_nguoi_gui` (`ma_nguoi_gui`),
  KEY `ma_nguoi_thu_hoi` (`ma_nguoi_thu_hoi`),
  KEY `idx_announcement_inbox` (`trang_thai`,`ngay_gui`,`ma_thong_bao`),
  CONSTRAINT `thong_bao_chk_1` CHECK ((((`pham_vi` = _utf8mb4'TOAN_BO') and (`khoi` is null) and (`ma_can_ho` is null)) or ((`pham_vi` = _utf8mb4'KHOI') and (`khoi` is not null) and (`ma_can_ho` is null)) or ((`pham_vi` = _utf8mb4'CAN_HO') and (`khoi` is null) and (`ma_can_ho` is not null)))),
  CONSTRAINT `thong_bao_chk_2` CHECK ((((`loai` = _utf8mb4'THONG_BAO') and (`ma_hoa_don` is null) and (`ngay_nhac` is null)) or ((`loai` = _utf8mb4'NHAC_PHI') and (`ma_hoa_don` is not null) and (`ngay_nhac` is not null) and (`pham_vi` = _utf8mb4'CAN_HO'))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `thong_bao_da_doc` (
  `ma_thong_bao` int unsigned NOT NULL,
  `ma_nguoi_dung` int unsigned NOT NULL,
  `nguoi_tiep_nhan` int unsigned NOT NULL DEFAULT '0',
  `ngay_doc` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_thong_bao`,`ma_nguoi_dung`,`nguoi_tiep_nhan`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tien_ich` (
  `ma_tien_ich` int unsigned NOT NULL AUTO_INCREMENT,
  `ten_tien_ich` varchar(120) NOT NULL,
  `vi_tri` varchar(160) NOT NULL,
  `mo_ta` text NOT NULL,
  `suc_chua` smallint unsigned NOT NULL,
  `gio_mo` time NOT NULL,
  `gio_dong` time NOT NULL,
  `toi_da_phut` smallint unsigned NOT NULL,
  `dat_truoc_ngay` smallint unsigned NOT NULL,
  `dang_mo` tinyint(1) NOT NULL DEFAULT '1',
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ngay_tao` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ma_tien_ich`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  KEY `idx_amenities_open` (`dang_mo`,`ma_tien_ich`),
  CONSTRAINT `tien_ich_chk_1` CHECK ((`suc_chua` between 1 and 1000)),
  CONSTRAINT `tien_ich_chk_2` CHECK (((`gio_mo` >= _utf8mb4'00:00:00') and (`gio_mo` < `gio_dong`) and (`gio_dong` <= _utf8mb4'23:30:00'))),
  CONSTRAINT `tien_ich_chk_3` CHECK (((second(`gio_mo`) = 0) and (minute(`gio_mo`) in (0,30)) and (second(`gio_dong`) = 0) and (minute(`gio_dong`) in (0,30)))),
  CONSTRAINT `tien_ich_chk_4` CHECK (((`toi_da_phut` between 30 and 360) and ((`toi_da_phut` % 30) = 0))),
  CONSTRAINT `tien_ich_chk_5` CHECK ((`dat_truoc_ngay` between 1 and 90))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vi_tri_qr` (
  `ma_vi_tri_qr` int unsigned NOT NULL AUTO_INCREMENT,
  `ten_vi_tri` varchar(100) NOT NULL,
  `loai` enum('KHU_VUC','THIET_BI') NOT NULL DEFAULT 'KHU_VUC',
  `mo_ta` varchar(255) NOT NULL DEFAULT '',
  `token_qr` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `ma_nguoi_tao` int unsigned NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ma_thiet_bi` int unsigned DEFAULT NULL,
  `phien_ban` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ma_vi_tri_qr`),
  UNIQUE KEY `token_qr` (`token_qr`),
  KEY `ma_nguoi_tao` (`ma_nguoi_tao`),
  KEY `fk_qr_equipment` (`ma_thiet_bi`),
  CONSTRAINT `chk_qr_equipment_type` CHECK (((`ma_thiet_bi` is null) or (`loai` = _utf8mb4'THIET_BI')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `yeu_cau_gui` (
  `khoa` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `van_tay` char(64) NOT NULL,
  `ma_phan_anh` int unsigned DEFAULT NULL,
  PRIMARY KEY (`khoa`),
  KEY `ma_phan_anh` (`ma_phan_anh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `can_ho` ADD CONSTRAINT `fk_apartment_floor` FOREIGN KEY (`khoi`, `tang`) REFERENCES `tang_toa_nha` (`khoi`, `tang`) ON UPDATE CASCADE;

ALTER TABLE `cau_hinh_phi` ADD CONSTRAINT `cau_hinh_phi_ibfk_1` FOREIGN KEY (`loai_phi`) REFERENCES `loai_phi` (`loai_phi`);

ALTER TABLE `cau_hinh_phi` ADD CONSTRAINT `cau_hinh_phi_ibfk_2` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `chi_so_dich_vu` ADD CONSTRAINT `chi_so_dich_vu_ibfk_1` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `chi_so_dich_vu` ADD CONSTRAINT `chi_so_dich_vu_ibfk_2` FOREIGN KEY (`ma_nguoi_ghi`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `chi_tiet_hoa_don` ADD CONSTRAINT `chi_tiet_hoa_don_ibfk_1` FOREIGN KEY (`ma_hoa_don`) REFERENCES `hoa_don` (`ma_hoa_don`);

ALTER TABLE `chi_tiet_hoa_don` ADD CONSTRAINT `chi_tiet_hoa_don_ibfk_2` FOREIGN KEY (`ma_cau_hinh_phi`) REFERENCES `cau_hinh_phi` (`ma_cau_hinh_phi`);

ALTER TABLE `chi_tiet_hoa_don` ADD CONSTRAINT `chi_tiet_hoa_don_ibfk_3` FOREIGN KEY (`ma_chi_so_dich_vu`) REFERENCES `chi_so_dich_vu` (`ma_chi_so_dich_vu`);

ALTER TABLE `chung_tu_thu_chi` ADD CONSTRAINT `chung_tu_thu_chi_ibfk_1` FOREIGN KEY (`ma_phieu`) REFERENCES `phieu_thu_chi` (`ma_phieu`) ON DELETE CASCADE;

ALTER TABLE `chung_tu_thu_chi` ADD CONSTRAINT `chung_tu_thu_chi_ibfk_2` FOREIGN KEY (`ma_nguoi_tai`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `cu_dan` ADD CONSTRAINT `cu_dan_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `dat_lich_tien_ich` ADD CONSTRAINT `dat_lich_tien_ich_ibfk_1` FOREIGN KEY (`ma_tien_ich`) REFERENCES `tien_ich` (`ma_tien_ich`);

ALTER TABLE `dat_lich_tien_ich` ADD CONSTRAINT `dat_lich_tien_ich_ibfk_2` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `dat_lich_tien_ich` ADD CONSTRAINT `dat_lich_tien_ich_ibfk_3` FOREIGN KEY (`ma_nguoi_dat`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `dat_lich_tien_ich` ADD CONSTRAINT `dat_lich_tien_ich_ibfk_4` FOREIGN KEY (`ma_cu_dan`) REFERENCES `cu_dan` (`ma_cu_dan`);

ALTER TABLE `dat_lich_tien_ich` ADD CONSTRAINT `dat_lich_tien_ich_ibfk_5` FOREIGN KEY (`ma_lich_su_cu_tru`) REFERENCES `lich_su_cu_tru` (`ma_lich_su_cu_tru`);

ALTER TABLE `dot_lap_hoa_don` ADD CONSTRAINT `dot_lap_hoa_don_ibfk_1` FOREIGN KEY (`ma_nguoi_lap`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `dot_nhap_du_lieu` ADD CONSTRAINT `dot_nhap_du_lieu_ibfk_1` FOREIGN KEY (`ma_nguoi_nhap`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `dot_xu_ly_hoa_don` ADD CONSTRAINT `dot_xu_ly_hoa_don_ibfk_1` FOREIGN KEY (`ma_nguoi_thuc_hien`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hinh_anh_phan_anh` ADD CONSTRAINT `hinh_anh_phan_anh_ibfk_1` FOREIGN KEY (`ma_phan_anh`) REFERENCES `phan_anh` (`ma_phan_anh`);

ALTER TABLE `hinh_anh_phan_anh` ADD CONSTRAINT `hinh_anh_phan_anh_ibfk_2` FOREIGN KEY (`ma_nguoi_tai_len`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_1` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_2` FOREIGN KEY (`ma_hoa_don_thay_the_cho`) REFERENCES `hoa_don` (`ma_hoa_don`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_3` FOREIGN KEY (`ma_nguoi_lap`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_4` FOREIGN KEY (`ma_nguoi_duyet`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_5` FOREIGN KEY (`ma_nguoi_gui`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_6` FOREIGN KEY (`ma_nguoi_huy`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `hoa_don` ADD CONSTRAINT `hoa_don_ibfk_7` FOREIGN KEY (`ma_nguoi_xac_nhan`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `lich_su_cu_tru` ADD CONSTRAINT `lich_su_cu_tru_ibfk_1` FOREIGN KEY (`ma_cu_dan`) REFERENCES `cu_dan` (`ma_cu_dan`);

ALTER TABLE `lich_su_cu_tru` ADD CONSTRAINT `lich_su_cu_tru_ibfk_2` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `lich_su_cu_tru` ADD CONSTRAINT `lich_su_cu_tru_ibfk_3` FOREIGN KEY (`ma_nguoi_ghi_nhan`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `nguoi_dung` ADD CONSTRAINT `fk_account_apartment` FOREIGN KEY (`ma_can_ho_thanh_toan`) REFERENCES `can_ho` (`ma_can_ho`) ON DELETE CASCADE;

ALTER TABLE `nguoi_dung` ADD CONSTRAINT `fk_account_owner` FOREIGN KEY (`ma_cu_dan_phu_trach`) REFERENCES `cu_dan` (`ma_cu_dan`) ON DELETE SET NULL;

ALTER TABLE `phan_anh` ADD CONSTRAINT `fk_incident_equipment` FOREIGN KEY (`ma_thiet_bi`) REFERENCES `thiet_bi` (`ma_thiet_bi`);

ALTER TABLE `phan_anh` ADD CONSTRAINT `fk_incident_sender_resident` FOREIGN KEY (`ma_cu_dan_nguoi_gui`) REFERENCES `cu_dan` (`ma_cu_dan`);

ALTER TABLE `phan_anh` ADD CONSTRAINT `phan_anh_ibfk_1` FOREIGN KEY (`ma_vi_tri_qr`) REFERENCES `vi_tri_qr` (`ma_vi_tri_qr`);

ALTER TABLE `phan_anh` ADD CONSTRAINT `phan_anh_ibfk_2` FOREIGN KEY (`ma_nguoi_gui`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phan_anh` ADD CONSTRAINT `phan_anh_ibfk_3` FOREIGN KEY (`ma_ky_thuat_vien`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phan_anh` ADD CONSTRAINT `phan_anh_ibfk_4` FOREIGN KEY (`ma_phan_anh_goc`) REFERENCES `phan_anh` (`ma_phan_anh`);

ALTER TABLE `phieu_bao_tri` ADD CONSTRAINT `phieu_bao_tri_ibfk_1` FOREIGN KEY (`ma_thiet_bi`) REFERENCES `thiet_bi` (`ma_thiet_bi`);

ALTER TABLE `phieu_bao_tri` ADD CONSTRAINT `phieu_bao_tri_ibfk_2` FOREIGN KEY (`ma_ky_thuat_vien`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_bao_tri` ADD CONSTRAINT `phieu_bao_tri_ibfk_3` FOREIGN KEY (`ma_nguoi_lap`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_bao_tri` ADD CONSTRAINT `phieu_bao_tri_ibfk_4` FOREIGN KEY (`ma_nguoi_nghiem_thu`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_bao_tri` ADD CONSTRAINT `phieu_bao_tri_ibfk_5` FOREIGN KEY (`ma_nguoi_huy`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_ibfk_1` FOREIGN KEY (`ma_quy`) REFERENCES `quy_tai_chinh` (`ma_quy`);

ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_ibfk_2` FOREIGN KEY (`ma_nguoi_lap`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_ibfk_3` FOREIGN KEY (`ma_nguoi_duyet`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_ibfk_4` FOREIGN KEY (`ma_phieu_goc`) REFERENCES `phieu_thu_chi` (`ma_phieu`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_1` FOREIGN KEY (`ma_cu_dan`) REFERENCES `cu_dan` (`ma_cu_dan`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_2` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_3` FOREIGN KEY (`ma_lich_su_cu_tru`) REFERENCES `lich_su_cu_tru` (`ma_lich_su_cu_tru`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_4` FOREIGN KEY (`ma_dang_ky_truoc`) REFERENCES `phuong_tien` (`ma_phuong_tien`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_5` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `phuong_tien` ADD CONSTRAINT `phuong_tien_ibfk_6` FOREIGN KEY (`ma_nguoi_ket_thuc`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `tang_toa_nha` ADD CONSTRAINT `fk_floor_block` FOREIGN KEY (`khoi`) REFERENCES `khoi_toa_nha` (`khoi`) ON UPDATE CASCADE;

ALTER TABLE `thiet_bi` ADD CONSTRAINT `thiet_bi_ibfk_1` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_ibfk_1` FOREIGN KEY (`ma_can_ho`) REFERENCES `can_ho` (`ma_can_ho`);

ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_ibfk_2` FOREIGN KEY (`ma_hoa_don`) REFERENCES `hoa_don` (`ma_hoa_don`);

ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_ibfk_3` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_ibfk_4` FOREIGN KEY (`ma_nguoi_gui`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_ibfk_5` FOREIGN KEY (`ma_nguoi_thu_hoi`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `thong_bao_da_doc` ADD CONSTRAINT `thong_bao_da_doc_ibfk_1` FOREIGN KEY (`ma_thong_bao`) REFERENCES `thong_bao` (`ma_thong_bao`) ON DELETE CASCADE;

ALTER TABLE `thong_bao_da_doc` ADD CONSTRAINT `thong_bao_da_doc_ibfk_2` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`) ON DELETE CASCADE;

ALTER TABLE `tien_ich` ADD CONSTRAINT `tien_ich_ibfk_1` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `vi_tri_qr` ADD CONSTRAINT `fk_qr_equipment` FOREIGN KEY (`ma_thiet_bi`) REFERENCES `thiet_bi` (`ma_thiet_bi`);

ALTER TABLE `vi_tri_qr` ADD CONSTRAINT `vi_tri_qr_ibfk_1` FOREIGN KEY (`ma_nguoi_tao`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

ALTER TABLE `yeu_cau_gui` ADD CONSTRAINT `yeu_cau_gui_ibfk_1` FOREIGN KEY (`ma_phan_anh`) REFERENCES `phan_anh` (`ma_phan_anh`);

CREATE TABLE nhat_ky_nghiep_vu (
  ma_nhat_ky BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  loai_nhat_ky VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ma_goc INT UNSIGNED NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NULL,
  su_kien VARCHAR(40) NOT NULL,
  ghi_chu TEXT NULL,
  chi_tiet JSON NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ma_phan_anh INT UNSIGNED NULL,
  ma_hoa_don INT UNSIGNED NULL,
  ma_can_ho INT UNSIGNED NULL,
  ma_thong_bao INT UNSIGNED NULL,
  ma_thiet_bi INT UNSIGNED NULL,
  ma_phieu_bao_tri INT UNSIGNED NULL,
  ma_dat_lich INT UNSIGNED NULL,
  ma_phieu INT UNSIGNED NULL,
  ma_vi_tri_qr INT UNSIGNED NULL,
  ma_ky_thuat_vien_cu INT UNSIGNED NULL,
  ma_ky_thuat_vien_moi INT UNSIGNED NULL,
  ma_thiet_bi_cu INT UNSIGNED NULL,
  ma_thiet_bi_moi INT UNSIGNED NULL,
  UNIQUE KEY uk_history_original (loai_nhat_ky,ma_goc),
  CONSTRAINT fk_history_actor FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  CONSTRAINT fk_history_ma_phan_anh FOREIGN KEY (ma_phan_anh) REFERENCES phan_anh(ma_phan_anh) ON DELETE RESTRICT,
  CONSTRAINT fk_history_ma_hoa_don FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don) ON DELETE RESTRICT,
  CONSTRAINT fk_history_ma_can_ho FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_thong_bao FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_thiet_bi FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_phieu_bao_tri FOREIGN KEY (ma_phieu_bao_tri) REFERENCES phieu_bao_tri(ma_phieu_bao_tri) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_dat_lich FOREIGN KEY (ma_dat_lich) REFERENCES dat_lich_tien_ich(ma_dat_lich) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_phieu FOREIGN KEY (ma_phieu) REFERENCES phieu_thu_chi(ma_phieu) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_vi_tri_qr FOREIGN KEY (ma_vi_tri_qr) REFERENCES vi_tri_qr(ma_vi_tri_qr) ON DELETE CASCADE,
  CONSTRAINT fk_history_ma_ky_thuat_vien_cu FOREIGN KEY (ma_ky_thuat_vien_cu) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE RESTRICT,
  CONSTRAINT fk_history_ma_ky_thuat_vien_moi FOREIGN KEY (ma_ky_thuat_vien_moi) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE RESTRICT,
  CONSTRAINT fk_history_ma_thiet_bi_cu FOREIGN KEY (ma_thiet_bi_cu) REFERENCES thiet_bi(ma_thiet_bi) ON DELETE RESTRICT,
  CONSTRAINT fk_history_ma_thiet_bi_moi FOREIGN KEY (ma_thiet_bi_moi) REFERENCES thiet_bi(ma_thiet_bi) ON DELETE RESTRICT,
  CONSTRAINT ck_history_0_target CHECK (loai_nhat_ky<>'lich_su_phan_anh' OR (ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_phan_anh IS NOT NULL AND ghi_chu IS NOT NULL AND (ghi_chu IS NULL OR CHAR_LENGTH(ghi_chu)<=500) AND CHAR_LENGTH(su_kien)<=40)),
  CONSTRAINT ck_history_0_payload CHECK (loai_nhat_ky<>'lich_su_phan_anh' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{\"trang_thai_cu\":{\"type\":[\"string\",\"null\"],\"maxLength\":20},\"trang_thai_moi\":{\"type\":\"string\",\"maxLength\":20},\"noi_dung_cong_khai\":{\"type\":\"string\",\"maxLength\":500}},\"required\":[\"trang_thai_cu\",\"trang_thai_moi\",\"noi_dung_cong_khai\"],\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_0 (loai_nhat_ky,ma_phan_anh,ma_nhat_ky),
  CONSTRAINT ck_history_1_target CHECK (loai_nhat_ky<>'lich_su_hoa_don' OR (ma_phan_anh IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_hoa_don IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NOT NULL AND (ghi_chu IS NULL OR CHAR_LENGTH(ghi_chu)<=255) AND CHAR_LENGTH(su_kien)<=30)),
  CONSTRAINT ck_history_1_payload CHECK (loai_nhat_ky<>'lich_su_hoa_don' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{},\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_1 (loai_nhat_ky,ma_hoa_don,ma_nhat_ky),
  CONSTRAINT ck_history_2_target CHECK (loai_nhat_ky<>'lich_su_ban_giao_can_ho' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_can_ho IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NULL AND CHAR_LENGTH(su_kien)<=30)),
  CONSTRAINT ck_history_2_payload CHECK (loai_nhat_ky<>'lich_su_ban_giao_can_ho' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{\"ma_cu_dan_cu\":{\"type\":[\"integer\",\"null\"],\"minimum\":0,\"maximum\":4294967295},\"ma_cu_dan_moi\":{\"type\":[\"integer\",\"null\"],\"minimum\":0,\"maximum\":4294967295}},\"required\":[\"ma_cu_dan_cu\",\"ma_cu_dan_moi\"],\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_2 (loai_nhat_ky,ma_can_ho,ma_nhat_ky),
  CONSTRAINT ck_history_3_target CHECK (loai_nhat_ky<>'lich_su_thong_bao' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_thong_bao IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND (ghi_chu IS NULL OR CHAR_LENGTH(ghi_chu)<=255) AND CHAR_LENGTH(su_kien)<=30)),
  CONSTRAINT ck_history_3_payload CHECK (loai_nhat_ky<>'lich_su_thong_bao' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{},\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_3 (loai_nhat_ky,ma_thong_bao,ma_nhat_ky),
  CONSTRAINT ck_history_4_target CHECK (loai_nhat_ky<>'lich_su_bao_tri' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_thiet_bi IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NOT NULL AND CHAR_LENGTH(su_kien)<=30)),
  CONSTRAINT ck_history_4_payload CHECK (loai_nhat_ky<>'lich_su_bao_tri' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{\"du_lieu\":{}},\"required\":[\"du_lieu\"],\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_4 (loai_nhat_ky,ma_thiet_bi,ma_phieu_bao_tri,ma_nhat_ky),
  CONSTRAINT ck_history_5_target CHECK (loai_nhat_ky<>'lich_su_dat_lich' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_phieu IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_dat_lich IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NOT NULL AND (ghi_chu IS NULL OR CHAR_LENGTH(ghi_chu)<=1000) AND CHAR_LENGTH(su_kien)<=30 AND su_kien IN ('DAT_LICH','DUYET','TU_CHOI','HUY'))),
  CONSTRAINT ck_history_5_payload CHECK (loai_nhat_ky<>'lich_su_dat_lich' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{},\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_5 (loai_nhat_ky,ma_dat_lich,ma_nhat_ky),
  CONSTRAINT ck_history_6_target CHECK (loai_nhat_ky<>'lich_su_thu_chi' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_vi_tri_qr IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_thiet_bi_cu IS NULL AND ma_thiet_bi_moi IS NULL AND ma_phieu IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NOT NULL AND CHAR_LENGTH(su_kien)<=30)),
  CONSTRAINT ck_history_6_payload CHECK (loai_nhat_ky<>'lich_su_thu_chi' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{},\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_6 (loai_nhat_ky,ma_phieu,ma_nhat_ky),
  CONSTRAINT ck_history_7_target CHECK (loai_nhat_ky<>'lich_su_lien_ket_qr' OR (ma_phan_anh IS NULL AND ma_hoa_don IS NULL AND ma_can_ho IS NULL AND ma_thong_bao IS NULL AND ma_thiet_bi IS NULL AND ma_phieu_bao_tri IS NULL AND ma_dat_lich IS NULL AND ma_phieu IS NULL AND ma_ky_thuat_vien_cu IS NULL AND ma_ky_thuat_vien_moi IS NULL AND ma_vi_tri_qr IS NOT NULL AND ma_nguoi_thuc_hien IS NOT NULL AND ghi_chu IS NULL AND CHAR_LENGTH(su_kien)<=30 AND su_kien='LIEN_KET_QR')),
  CONSTRAINT ck_history_7_payload CHECK (loai_nhat_ky<>'lich_su_lien_ket_qr' OR JSON_SCHEMA_VALID('{\"type\":\"object\",\"properties\":{},\"additionalProperties\":false}',chi_tiet)),
  KEY idx_history_7 (loai_nhat_ky,ma_vi_tri_qr,ma_nhat_ky),
  CONSTRAINT ck_history_topic CHECK (loai_nhat_ky IN ('lich_su_phan_anh','lich_su_hoa_don','lich_su_ban_giao_can_ho','lich_su_thong_bao','lich_su_bao_tri','lich_su_dat_lich','lich_su_thu_chi','lich_su_lien_ket_qr'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_phan_anh` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su_phan_anh`,
    `ma_phan_anh`,
    `ma_ky_thuat_vien_cu`,
    `ma_ky_thuat_vien_moi`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thay_doi`,
    su_kien AS `loai_su_kien`,
    ghi_chu,
    CAST(CASE WHEN JSON_TYPE(JSON_EXTRACT(chi_tiet,'$.trang_thai_cu'))='NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT(chi_tiet,'$.trang_thai_cu')) END AS CHAR(20) CHARACTER SET utf8mb4) AS `trang_thai_cu`,
    CAST(CASE WHEN JSON_TYPE(JSON_EXTRACT(chi_tiet,'$.trang_thai_moi'))='NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT(chi_tiet,'$.trang_thai_moi')) END AS CHAR(20) CHARACTER SET utf8mb4) AS `trang_thai_moi`,
    CAST(CASE WHEN JSON_TYPE(JSON_EXTRACT(chi_tiet,'$.noi_dung_cong_khai'))='NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT(chi_tiet,'$.noi_dung_cong_khai')) END AS CHAR(500) CHARACTER SET utf8mb4) AS `noi_dung_cong_khai`,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_phan_anh' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_hoa_don` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su_hoa_don`,
    `ma_hoa_don`,
    ma_nguoi_thuc_hien AS `ma_nguoi_ghi`,
    su_kien AS `su_kien`,
    ghi_chu,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_hoa_don' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_ban_giao_can_ho` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_ban_giao`,
    `ma_can_ho`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    su_kien AS `su_kien`,
    CAST(CASE WHEN JSON_TYPE(JSON_EXTRACT(chi_tiet,'$.ma_cu_dan_cu'))='NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT(chi_tiet,'$.ma_cu_dan_cu')) END AS UNSIGNED) AS `ma_cu_dan_cu`,
    CAST(CASE WHEN JSON_TYPE(JSON_EXTRACT(chi_tiet,'$.ma_cu_dan_moi'))='NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT(chi_tiet,'$.ma_cu_dan_moi')) END AS UNSIGNED) AS `ma_cu_dan_moi`,
    ngay_tao AS `ngay_thuc_hien`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_ban_giao_can_ho' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_thong_bao` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su`,
    `ma_thong_bao`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    su_kien AS `su_kien`,
    ghi_chu,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_thong_bao' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_bao_tri` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su`,
    `ma_thiet_bi`,
    `ma_phieu_bao_tri`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    su_kien AS `su_kien`,
    ghi_chu,
    JSON_EXTRACT(chi_tiet,'$.du_lieu') AS `du_lieu`,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_bao_tri' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_dat_lich` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su`,
    `ma_dat_lich`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    su_kien AS `su_kien`,
    ghi_chu,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_dat_lich' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_thu_chi` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su`,
    `ma_phieu`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    su_kien AS `su_kien`,
    ghi_chu,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_thu_chi' WITH CASCADED CHECK OPTION;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `lich_su_lien_ket_qr` AS
  SELECT CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS `ma_lich_su`,
    `ma_vi_tri_qr`,
    `ma_thiet_bi_cu`,
    `ma_thiet_bi_moi`,
    ma_nguoi_thuc_hien AS `ma_nguoi_thuc_hien`,
    ngay_tao AS `ngay_tao`
  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky='lich_su_lien_ket_qr' WITH CASCADED CHECK OPTION;

INSERT INTO loai_phi VALUES ('PHI_QUAN_LY','Phí quản lý','m²'),('GUI_O_TO','Gửi ô tô','xe'),('GUI_XE_MAY','Gửi xe máy','xe'),('GUI_XE_DAP','Gửi xe đạp','xe'),('TIEN_NUOC','Tiền nước','m³'),('TIEN_DIEN','Tiền điện','kWh');

INSERT INTO quy_tai_chinh (ten_quy,mo_ta,nhan_thu_hoa_don) VALUES ('Quỹ vận hành','Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0.',1);
