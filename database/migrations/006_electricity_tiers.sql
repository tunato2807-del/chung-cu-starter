ALTER TABLE cau_hinh_phi
  ADD COLUMN cach_tinh ENUM('DON_GIA','BAC_THANG') NOT NULL DEFAULT 'DON_GIA',
  ADD COLUMN thue_gtgt DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN bac_dien JSON NULL,
  ADD CONSTRAINT chk_fee_vat CHECK (thue_gtgt >= 0 AND thue_gtgt <= 100),
  ADD CONSTRAINT chk_fee_electricity CHECK (
    (loai_phi='TIEN_DIEN' AND (
      (cach_tinh='DON_GIA' AND bac_dien IS NULL) OR
      (cach_tinh='BAC_THANG' AND bac_dien IS NOT NULL AND don_gia=0)
    )) OR
    (loai_phi<>'TIEN_DIEN' AND cach_tinh='DON_GIA' AND thue_gtgt=0 AND bac_dien IS NULL)
  );
ALTER TABLE chi_tiet_hoa_don MODIFY COLUMN don_gia DECIMAL(16,2) NOT NULL;
