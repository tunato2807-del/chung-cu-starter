CREATE TABLE IF NOT EXISTS nguoi_dung (
  ma_nguoi_dung INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ho_va_ten VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL UNIQUE,
  mat_khau_ma_hoa VARCHAR(255) NOT NULL,
  vai_tro ENUM('QUAN_TRI_VIEN','KY_THUAT_VIEN','CU_DAN') NOT NULL,
  chuyen_mon VARCHAR(100) NOT NULL DEFAULT '',
  dang_hoat_dong BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban_token INT UNSIGNED NOT NULL DEFAULT 0,
  so_lan_dang_nhap_sai INT UNSIGNED NOT NULL DEFAULT 0,
  khoa_den_luc DATETIME NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS vi_tri_qr (
  ma_vi_tri_qr INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ten_vi_tri VARCHAR(100) NOT NULL,
  loai ENUM('KHU_VUC','THIET_BI') NOT NULL DEFAULT 'KHU_VUC',
  mo_ta VARCHAR(255) NOT NULL DEFAULT '',
  token_qr CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  dang_hoat_dong BOOLEAN NOT NULL DEFAULT TRUE,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS phan_anh (
  ma_phan_anh INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_tra_cuu CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  ma_vi_tri_qr INT UNSIGNED NOT NULL,
  ma_nguoi_gui INT UNSIGNED NULL,
  ten_nguoi_gui VARCHAR(100) NOT NULL,
  so_dien_thoai_nguoi_gui VARCHAR(15) NOT NULL,
  can_ho_khai_bao VARCHAR(40) NOT NULL DEFAULT '',
  tieu_de VARCHAR(150) NOT NULL,
  noi_dung TEXT NOT NULL,
  loai_su_co ENUM('DIEN','NUOC','THANG_MAY','VE_SINH','AN_NINH','KHAC') NOT NULL,
  do_uu_tien ENUM('THAP','TRUNG_BINH','CAO','KHAN_CAP') NOT NULL DEFAULT 'TRUNG_BINH',
  trang_thai ENUM('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY','DA_DONG','TU_CHOI','TRUNG') NOT NULL DEFAULT 'MOI',
  ma_ky_thuat_vien INT UNSIGNED NULL,
  ma_phan_anh_goc INT UNSIGNED NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  luot_xu_ly INT UNSIGNED NOT NULL DEFAULT 1,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_dong DATETIME NULL,
  FOREIGN KEY (ma_vi_tri_qr) REFERENCES vi_tri_qr(ma_vi_tri_qr),
  FOREIGN KEY (ma_nguoi_gui) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_ky_thuat_vien) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_phan_anh_goc) REFERENCES phan_anh(ma_phan_anh),
  CHECK (trang_thai <> 'TRUNG' OR ma_phan_anh_goc IS NOT NULL),
  INDEX idx_status (trang_thai),
  INDEX idx_assigned (ma_ky_thuat_vien, trang_thai),
  INDEX idx_sender (ma_nguoi_gui),
  INDEX idx_location (ma_vi_tri_qr, loai_su_co, trang_thai)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS lich_su_phan_anh (
  ma_lich_su_phan_anh INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phan_anh INT UNSIGNED NOT NULL,
  loai_su_kien VARCHAR(40) NOT NULL,
  trang_thai_cu VARCHAR(20) NULL,
  trang_thai_moi VARCHAR(20) NOT NULL,
  ma_nguoi_thay_doi INT UNSIGNED NULL,
  ma_ky_thuat_vien_cu INT UNSIGNED NULL,
  ma_ky_thuat_vien_moi INT UNSIGNED NULL,
  ghi_chu VARCHAR(500) NOT NULL DEFAULT '',
  noi_dung_cong_khai VARCHAR(500) NOT NULL DEFAULT '',
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_phan_anh) REFERENCES phan_anh(ma_phan_anh),
  FOREIGN KEY (ma_nguoi_thay_doi) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_ky_thuat_vien_cu) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_ky_thuat_vien_moi) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS hinh_anh_phan_anh (
  ma_hinh_anh_phan_anh INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phan_anh INT UNSIGNED NOT NULL,
  duong_dan_tep VARCHAR(80) NOT NULL UNIQUE,
  loai ENUM('PHAN_ANH','NGHIEM_THU') NOT NULL,
  luot_xu_ly INT UNSIGNED NOT NULL,
  ma_nguoi_tai_len INT UNSIGNED NULL,
  ngay_tai_len DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_phan_anh) REFERENCES phan_anh(ma_phan_anh),
  FOREIGN KEY (ma_nguoi_tai_len) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS yeu_cau_gui (
  khoa CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  van_tay CHAR(64) NOT NULL,
  ma_phan_anh INT UNSIGNED NULL,
  FOREIGN KEY (ma_phan_anh) REFERENCES phan_anh(ma_phan_anh)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS gioi_han_gui (
  khoa CHAR(64) PRIMARY KEY,
  cac_moc_thoi_gian JSON NOT NULL
) ENGINE=InnoDB;
