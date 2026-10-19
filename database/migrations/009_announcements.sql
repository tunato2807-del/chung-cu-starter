CREATE TABLE thong_bao (
  ma_thong_bao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loai ENUM('THONG_BAO','NHAC_PHI') NOT NULL DEFAULT 'THONG_BAO',
  tieu_de VARCHAR(160) NOT NULL,
  noi_dung TEXT NOT NULL,
  pham_vi ENUM('TOAN_BO','KHOI','CAN_HO') NOT NULL,
  khoi VARCHAR(10) NULL,
  ma_can_ho INT UNSIGNED NULL,
  muc_do ENUM('THUONG','QUAN_TRONG') NOT NULL DEFAULT 'THUONG',
  trang_thai ENUM('NHAP','DA_GUI','THU_HOI') NOT NULL DEFAULT 'NHAP',
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_hoa_don INT UNSIGNED NULL,
  ngay_nhac DATE NULL,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ma_nguoi_gui INT UNSIGNED NULL,
  ma_nguoi_thu_hoi INT UNSIGNED NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ngay_gui DATETIME(6) NULL,
  ngay_thu_hoi DATETIME(6) NULL,
  ly_do_thu_hoi VARCHAR(255) NULL,
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_gui) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_thu_hoi) REFERENCES nguoi_dung(ma_nguoi_dung),
  UNIQUE KEY uq_bill_reminder_day (ma_hoa_don,ngay_nhac),
  INDEX idx_announcement_inbox (trang_thai,ngay_gui,ma_thong_bao),
  CHECK ((pham_vi='TOAN_BO' AND khoi IS NULL AND ma_can_ho IS NULL) OR
         (pham_vi='KHOI' AND khoi IS NOT NULL AND ma_can_ho IS NULL) OR
         (pham_vi='CAN_HO' AND khoi IS NULL AND ma_can_ho IS NOT NULL)),
  CHECK ((loai='THONG_BAO' AND ma_hoa_don IS NULL AND ngay_nhac IS NULL) OR
         (loai='NHAC_PHI' AND ma_hoa_don IS NOT NULL AND ngay_nhac IS NOT NULL AND pham_vi='CAN_HO'))
) ENGINE=InnoDB;
CREATE TABLE thong_bao_da_doc (
  ma_thong_bao INT UNSIGNED NOT NULL,
  ma_nguoi_dung INT UNSIGNED NOT NULL,
  -- Snapshot scope, deliberately not a resident FK: no reverse resident lock.
  nguoi_tiep_nhan INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_doc DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (ma_thong_bao,ma_nguoi_dung,nguoi_tiep_nhan),
  FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE lich_su_thong_bao (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_thong_bao INT UNSIGNED NOT NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ghi_chu VARCHAR(255) NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_announcement_history (ma_thong_bao,ma_lich_su)
) ENGINE=InnoDB;
