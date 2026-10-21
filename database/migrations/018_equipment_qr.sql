ALTER TABLE vi_tri_qr
  ADD COLUMN ma_thiet_bi INT UNSIGNED NULL,
  ADD COLUMN phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_qr_equipment FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi),
  ADD CONSTRAINT chk_qr_equipment_type CHECK (ma_thiet_bi IS NULL OR loai='THIET_BI');
ALTER TABLE phan_anh
  ADD COLUMN ma_thiet_bi INT UNSIGNED NULL,
  ADD COLUMN ma_tai_san_luc_gui VARCHAR(30) NULL,
  ADD COLUMN ten_thiet_bi_luc_gui VARCHAR(150) NULL,
  ADD COLUMN vi_tri_thiet_bi_luc_gui VARCHAR(160) NULL,
  ADD CONSTRAINT fk_incident_equipment FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi),
  ADD CONSTRAINT chk_incident_equipment_snapshot CHECK (
    (ma_thiet_bi IS NULL AND ma_tai_san_luc_gui IS NULL AND ten_thiet_bi_luc_gui IS NULL AND vi_tri_thiet_bi_luc_gui IS NULL)
    OR (ma_thiet_bi IS NOT NULL AND ma_tai_san_luc_gui IS NOT NULL AND ten_thiet_bi_luc_gui IS NOT NULL AND vi_tri_thiet_bi_luc_gui IS NOT NULL)
  ),
  ADD INDEX idx_incident_equipment (ma_thiet_bi,ma_phan_anh);
CREATE TABLE lich_su_lien_ket_qr (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_vi_tri_qr INT UNSIGNED NOT NULL,
  ma_thiet_bi_cu INT UNSIGNED NULL,
  ma_thiet_bi_moi INT UNSIGNED NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_vi_tri_qr) REFERENCES vi_tri_qr(ma_vi_tri_qr) ON DELETE CASCADE,
  FOREIGN KEY (ma_thiet_bi_cu) REFERENCES thiet_bi(ma_thiet_bi),
  FOREIGN KEY (ma_thiet_bi_moi) REFERENCES thiet_bi(ma_thiet_bi),
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_qr_link_history (ma_vi_tri_qr,ma_lich_su)
) ENGINE=InnoDB;
