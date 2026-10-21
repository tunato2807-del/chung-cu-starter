ALTER TABLE nguoi_dung
  MODIFY COLUMN so_dien_thoai VARCHAR(15) NULL,
  ADD COLUMN ten_dang_nhap VARCHAR(30) NULL UNIQUE,
  ADD COLUMN ma_can_ho_thanh_toan INT UNSIGNED NULL UNIQUE,
  ADD COLUMN ma_cu_dan_phu_trach INT UNSIGNED NULL UNIQUE,
  ADD COLUMN phien_ban_ban_giao INT UNSIGNED NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_account_apartment FOREIGN KEY (ma_can_ho_thanh_toan) REFERENCES can_ho(ma_can_ho) ON DELETE CASCADE,
  ADD CONSTRAINT fk_account_owner FOREIGN KEY (ma_cu_dan_phu_trach) REFERENCES cu_dan(ma_cu_dan) ON DELETE SET NULL,
  ADD CONSTRAINT chk_apartment_account CHECK (
    (ma_can_ho_thanh_toan IS NULL AND ten_dang_nhap IS NULL) OR
    (ma_can_ho_thanh_toan IS NOT NULL AND ten_dang_nhap IS NOT NULL AND so_dien_thoai IS NULL AND vai_tro='CU_DAN')
  );
CREATE TABLE IF NOT EXISTS lich_su_ban_giao_can_ho (
  ma_ban_giao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_can_ho INT UNSIGNED NOT NULL,
  ma_cu_dan_cu INT UNSIGNED NULL,
  ma_cu_dan_moi INT UNSIGNED NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ngay_thuc_hien DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho) ON DELETE CASCADE,
  FOREIGN KEY (ma_cu_dan_cu) REFERENCES cu_dan(ma_cu_dan) ON DELETE SET NULL,
  FOREIGN KEY (ma_cu_dan_moi) REFERENCES cu_dan(ma_cu_dan) ON DELETE SET NULL,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_handover_apartment (ma_can_ho, ma_ban_giao)
) ENGINE=InnoDB;
INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,mat_khau_ma_hoa,dang_hoat_dong,ten_dang_nhap,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach)
SELECT CONCAT('Tài khoản căn ',a.so_can_ho),NULL,'CU_DAN',CONCAT('!',HEX(RANDOM_BYTES(32))),0,
  CONCAT('CH',LPAD(CAST(a.ma_can_ho AS CHAR),GREATEST(6,CHAR_LENGTH(CAST(a.ma_can_ho AS CHAR))),'0')),a.ma_can_ho,
  (SELECT IF(COUNT(*)=1,MAX(l.ma_cu_dan),NULL) FROM lich_su_cu_tru l WHERE l.ma_can_ho=a.ma_can_ho AND l.den_ngay IS NULL AND l.quan_he='CHU_HO')
FROM can_ho a;
