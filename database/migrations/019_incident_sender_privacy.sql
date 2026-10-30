-- Resident identity is independent of the reusable apartment billing account.
-- Never infer a historical sender from the apartment's current householder.
ALTER TABLE phan_anh
  ADD COLUMN ma_cu_dan_nguoi_gui INT UNSIGNED NULL,
  ADD COLUMN gui_tu_tai_khoan_can_ho BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT fk_incident_sender_resident FOREIGN KEY (ma_cu_dan_nguoi_gui) REFERENCES cu_dan(ma_cu_dan),
  ADD INDEX idx_incident_sender_resident (ma_cu_dan_nguoi_gui,ma_phan_anh),
  ADD INDEX idx_incident_sender_account (ma_nguoi_gui,gui_tu_tai_khoan_can_ho,ma_phan_anh);
-- Legacy apartment submissions remain visible to BQL and assigned technicians.
-- Their resident identity stays NULL until it can be verified independently.
UPDATE phan_anh p JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_gui
  SET p.gui_tu_tai_khoan_can_ho=TRUE
  WHERE u.ma_can_ho_thanh_toan IS NOT NULL;
