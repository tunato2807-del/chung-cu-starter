CREATE TABLE dot_lap_hoa_don (
  ma_dot_lap INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_lap INT UNSIGNED NOT NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  dau_vao_sha256 CHAR(64) NOT NULL,
  ket_qua JSON NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_bill_batch_request (ma_nguoi_lap,khoa_yeu_cau),
  FOREIGN KEY (ma_nguoi_lap) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (ket_qua IS NULL OR JSON_TYPE(ket_qua)='OBJECT')
) ENGINE=InnoDB;
