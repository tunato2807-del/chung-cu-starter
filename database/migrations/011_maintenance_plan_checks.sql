ALTER TABLE thiet_bi
  ADD CONSTRAINT chk_equipment_plan_pair_strict CHECK (
    (chu_ky_ngay IS NULL AND ngay_bao_tri_tiep_theo IS NULL) OR
    (chu_ky_ngay IS NOT NULL AND chu_ky_ngay BETWEEN 1 AND 3650 AND ngay_bao_tri_tiep_theo IS NOT NULL)
  );
ALTER TABLE phieu_bao_tri
  ADD CONSTRAINT chk_maintenance_period_strict CHECK (
    (loai='DINH_KY' AND chu_ky_ngay IS NOT NULL AND chu_ky_ngay BETWEEN 1 AND 3650) OR
    (loai='DOT_XUAT' AND chu_ky_ngay IS NULL)
  );
