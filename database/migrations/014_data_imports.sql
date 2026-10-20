CREATE TABLE dot_nhap_du_lieu (
  ma_dot_nhap BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_nhap INT UNSIGNED NOT NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  phan_he VARCHAR(30) NOT NULL,
  sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  so_dong SMALLINT UNSIGNED NOT NULL,
  ket_qua JSON NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_import_request (ma_nguoi_nhap,khoa_yeu_cau),
  UNIQUE KEY uq_import_file (ma_nguoi_nhap,phan_he,sha256),
  FOREIGN KEY (ma_nguoi_nhap) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (so_dong BETWEEN 1 AND 100)
) ENGINE=InnoDB;
