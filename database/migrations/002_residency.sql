CREATE TABLE IF NOT EXISTS can_ho (
  ma_can_ho INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  so_can_ho VARCHAR(20) NOT NULL UNIQUE,
  khoi VARCHAR(10) NOT NULL,
  tang SMALLINT UNSIGNED NOT NULL,
  dien_tich_m2 DECIMAL(8,2) NOT NULL,
  tinh_phi_dich_vu BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (dien_tich_m2 > 0),
  INDEX idx_floor (khoi, tang)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS cu_dan (
  ma_cu_dan INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ho_va_ten VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  ma_nguoi_dung INT UNSIGNED NULL UNIQUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS lich_su_cu_tru (
  ma_lich_su_cu_tru INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_cu_dan INT UNSIGNED NOT NULL,
  ma_can_ho INT UNSIGNED NOT NULL,
  quan_he ENUM('CHU_HO','THANH_VIEN','NGUOI_THUE') NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  ma_nguoi_ghi_nhan INT UNSIGNED NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cu_dan_dang_o INT UNSIGNED GENERATED ALWAYS AS
    (CASE WHEN den_ngay IS NULL THEN ma_cu_dan ELSE NULL END) STORED,
  UNIQUE (cu_dan_dang_o),
  CHECK (den_ngay IS NULL OR den_ngay > tu_ngay),
  FOREIGN KEY (ma_cu_dan) REFERENCES cu_dan(ma_cu_dan),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_nguoi_ghi_nhan) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_resident_period (ma_cu_dan, tu_ngay, den_ngay),
  INDEX idx_apartment_period (ma_can_ho, tu_ngay, den_ngay)
) ENGINE=InnoDB;
