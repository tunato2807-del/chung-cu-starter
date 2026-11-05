-- PostgreSQL migration. Legacy MySQL migrations are preserved unchanged.
ALTER TABLE cau_hinh_phi
  ADD COLUMN cach_tinh VARCHAR(50) NOT NULL DEFAULT 'DON_GIA' CHECK (cach_tinh IN ('DON_GIA','BAC_THANG')),
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

ALTER TABLE chi_tiet_hoa_don
  ALTER COLUMN don_gia TYPE NUMERIC(16,2);
