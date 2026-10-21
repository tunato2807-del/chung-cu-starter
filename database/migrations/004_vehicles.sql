CREATE TABLE IF NOT EXISTS phuong_tien (
  ma_phuong_tien INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_dang_ky VARCHAR(20) NOT NULL UNIQUE,
  ma_cu_dan INT UNSIGNED NOT NULL,
  ma_can_ho INT UNSIGNED NOT NULL,
  ma_lich_su_cu_tru INT UNSIGNED NOT NULL,
  ma_dang_ky_truoc INT UNSIGNED NULL UNIQUE,
  loai_xe ENUM('O_TO','XE_MAY','XE_DAP') NOT NULL,
  bien_so VARCHAR(15) CHARACTER SET ascii COLLATE ascii_bin NULL,
  hang_xe VARCHAR(50) NOT NULL DEFAULT '',
  mau_sac VARCHAR(50) NOT NULL DEFAULT '',
  ngay_dang_ky DATE NOT NULL,
  ngay_ket_thuc DATE NULL,
  ly_do_ket_thuc VARCHAR(255) NOT NULL DEFAULT '',
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ma_nguoi_ket_thuc INT UNSIGNED NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  bien_so_dang_hoat_dong VARCHAR(15) CHARACTER SET ascii COLLATE ascii_bin
    GENERATED ALWAYS AS (CASE WHEN ngay_ket_thuc IS NULL THEN bien_so ELSE NULL END) STORED,
  UNIQUE (bien_so_dang_hoat_dong),
  CONSTRAINT chk_xe_ngay CHECK (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= ngay_dang_ky),
  CONSTRAINT chk_xe_bien_so CHECK (loai_xe='XE_DAP' OR bien_so IS NOT NULL),
  CONSTRAINT chk_xe_ket_thuc CHECK (
    (ngay_ket_thuc IS NULL AND ma_nguoi_ket_thuc IS NULL AND ly_do_ket_thuc='') OR
    (ngay_ket_thuc IS NOT NULL AND ma_nguoi_ket_thuc IS NOT NULL AND CHAR_LENGTH(TRIM(ly_do_ket_thuc))>0)
  ),
  FOREIGN KEY (ma_cu_dan) REFERENCES cu_dan(ma_cu_dan),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_lich_su_cu_tru) REFERENCES lich_su_cu_tru(ma_lich_su_cu_tru),
  FOREIGN KEY (ma_dang_ky_truoc) REFERENCES phuong_tien(ma_phuong_tien),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_ket_thuc) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_xe_resident (ma_cu_dan, ngay_ket_thuc),
  INDEX idx_xe_stay (ma_lich_su_cu_tru, ngay_ket_thuc),
  INDEX idx_xe_apartment_period (ma_can_ho, ngay_dang_ky, ngay_ket_thuc),
  INDEX idx_xe_plate_period (bien_so, ngay_dang_ky, ngay_ket_thuc)
) ENGINE=InnoDB;
