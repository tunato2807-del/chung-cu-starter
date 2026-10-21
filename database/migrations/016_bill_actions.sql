CREATE TABLE dot_xu_ly_hoa_don (
  ma_dot_xu_ly INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  thao_tac ENUM('DUYET','GUI') NOT NULL,
  dau_vao_sha256 CHAR(64) NOT NULL,
  ket_qua JSON NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_bill_action_request (ma_nguoi_thuc_hien,khoa_yeu_cau),
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (ket_qua IS NULL OR JSON_TYPE(ket_qua)='OBJECT')
) ENGINE=InnoDB;
