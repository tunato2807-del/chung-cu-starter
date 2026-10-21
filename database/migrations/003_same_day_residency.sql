ALTER TABLE lich_su_cu_tru
  DROP CHECK lich_su_cu_tru_chk_1,
  ADD CONSTRAINT chk_cu_tru_thu_tu_ngay
    CHECK (den_ngay IS NULL OR den_ngay >= tu_ngay);
