-- PostgreSQL migration. Legacy MySQL migrations are preserved unchanged.
ALTER TABLE phan_anh
  ADD COLUMN ma_cu_dan_nguoi_gui BIGINT NULL CHECK (ma_cu_dan_nguoi_gui BETWEEN 0 AND 4294967295),
  ADD COLUMN gui_tu_tai_khoan_can_ho SMALLINT NOT NULL DEFAULT 0 CHECK (gui_tu_tai_khoan_can_ho IN (0,1)),
  ADD CONSTRAINT fk_incident_sender_resident FOREIGN KEY (ma_cu_dan_nguoi_gui) REFERENCES cu_dan(ma_cu_dan) DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX phan_anh_idx_incident_sender_resident ON phan_anh (ma_cu_dan_nguoi_gui,ma_phan_anh);

CREATE INDEX phan_anh_idx_incident_sender_account ON phan_anh (ma_nguoi_gui,gui_tu_tai_khoan_can_ho,ma_phan_anh);

UPDATE phan_anh p SET gui_tu_tai_khoan_can_ho=1 FROM nguoi_dung u
  WHERE u.ma_nguoi_dung=p.ma_nguoi_gui AND u.ma_can_ho_thanh_toan IS NOT NULL;
