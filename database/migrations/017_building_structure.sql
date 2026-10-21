CREATE TABLE IF NOT EXISTS khoi_toa_nha (
  khoi VARCHAR(10) NOT NULL PRIMARY KEY,
  ten_khoi VARCHAR(100) NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) NOT NULL DEFAULT '',
  giu_khi_trong BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS tang_toa_nha (
  khoi VARCHAR(10) NOT NULL,
  tang SMALLINT UNSIGNED NOT NULL,
  ten_tang VARCHAR(100) NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) NOT NULL DEFAULT '',
  giu_khi_trong BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (khoi,tang),
  CHECK (tang <= 200),
  CONSTRAINT fk_floor_block FOREIGN KEY (khoi) REFERENCES khoi_toa_nha(khoi) ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO khoi_toa_nha (khoi)
SELECT MIN(khoi) FROM can_ho GROUP BY khoi
ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
INSERT INTO tang_toa_nha (khoi,tang)
SELECT b.khoi,c.tang FROM can_ho c JOIN khoi_toa_nha b ON b.khoi=c.khoi GROUP BY b.khoi,c.tang
ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;
ALTER TABLE can_ho
  ADD CONSTRAINT fk_apartment_floor FOREIGN KEY (khoi,tang)
  REFERENCES tang_toa_nha(khoi,tang) ON UPDATE CASCADE;
