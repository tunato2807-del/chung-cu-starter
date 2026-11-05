-- PostgreSQL migration. Legacy MySQL migrations are preserved unchanged.
CREATE TABLE IF NOT EXISTS khoi_toa_nha (
  khoi VARCHAR(10) COLLATE app_ci NOT NULL PRIMARY KEY,
  ten_khoi VARCHAR(100) COLLATE app_ci NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) COLLATE app_ci NOT NULL DEFAULT '',
  giu_khi_trong SMALLINT NOT NULL DEFAULT 1 CHECK (giu_khi_trong IN (0,1)),
  phien_ban BIGINT NOT NULL DEFAULT 0 CHECK (phien_ban BETWEEN 0 AND 4294967295),
  ngay_tao TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tang_toa_nha (
  khoi VARCHAR(10) COLLATE app_ci NOT NULL,
  tang INTEGER NOT NULL CHECK (tang BETWEEN 0 AND 65535),
  ten_tang VARCHAR(100) COLLATE app_ci NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) COLLATE app_ci NOT NULL DEFAULT '',
  giu_khi_trong SMALLINT NOT NULL DEFAULT 1 CHECK (giu_khi_trong IN (0,1)),
  phien_ban BIGINT NOT NULL DEFAULT 0 CHECK (phien_ban BETWEEN 0 AND 4294967295),
  ngay_tao TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (khoi,tang),
  CONSTRAINT tang_toa_nha_chk_1 CHECK (tang <= 200),
  CONSTRAINT fk_floor_block FOREIGN KEY (khoi) REFERENCES khoi_toa_nha(khoi) ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE
);

INSERT INTO khoi_toa_nha (khoi)
SELECT MIN(khoi) FROM can_ho GROUP BY khoi
ON CONFLICT (khoi) DO NOTHING;

INSERT INTO tang_toa_nha (khoi,tang)
SELECT b.khoi,c.tang FROM can_ho c JOIN khoi_toa_nha b ON b.khoi=c.khoi GROUP BY b.khoi,c.tang
ON CONFLICT (khoi,tang) DO NOTHING;

ALTER TABLE can_ho
  ADD CONSTRAINT fk_apartment_floor FOREIGN KEY (khoi,tang)
  REFERENCES tang_toa_nha(khoi,tang) ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
