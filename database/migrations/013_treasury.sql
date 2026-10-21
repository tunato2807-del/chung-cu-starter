CREATE TABLE quy_tai_chinh (
  ma_quy INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ten_quy VARCHAR(120) NOT NULL,
  mo_ta VARCHAR(1000) NOT NULL,
  dang_hoat_dong BOOLEAN NOT NULL DEFAULT TRUE,
  nhan_thu_hoa_don BOOLEAN NOT NULL DEFAULT FALSE,
  quy_hoa_don TINYINT GENERATED ALWAYS AS (IF(nhan_thu_hoa_don,1,NULL)) STORED UNIQUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CHECK (nhan_thu_hoa_don=0 OR dang_hoat_dong=1)
) ENGINE=InnoDB;
-- No financial entry is seeded. Existing confirmed invoice receipts are read directly.
INSERT INTO quy_tai_chinh (ten_quy,mo_ta,nhan_thu_hoa_don) VALUES
 ('Quỹ vận hành','Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0.',TRUE);
CREATE TABLE phieu_thu_chi (
  ma_phieu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_quy INT UNSIGNED NOT NULL,
  loai ENUM('THU','CHI') NOT NULL,
  nhom VARCHAR(30) NOT NULL,
  ngay_hach_toan DATE NOT NULL,
  so_tien DECIMAL(14,0) NOT NULL,
  doi_tac VARCHAR(150) NOT NULL,
  dien_giai VARCHAR(1000) NOT NULL,
  trang_thai ENUM('NHAP','DA_GHI_SO','HUY') NOT NULL DEFAULT 'NHAP',
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_nguoi_lap INT UNSIGNED NOT NULL,
  ma_nguoi_duyet INT UNSIGNED NULL,
  ngay_duyet DATETIME(6) NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ma_phieu_goc INT UNSIGNED NULL UNIQUE,
  khoa_yeu_cau CHAR(36) NULL UNIQUE,
  van_tay CHAR(64) NULL,
  CHECK (so_tien>0),
  CHECK ((khoa_yeu_cau IS NOT NULL AND van_tay IS NOT NULL AND ma_phieu_goc IS NULL) OR
         (khoa_yeu_cau IS NULL AND van_tay IS NULL AND ma_phieu_goc IS NOT NULL AND trang_thai='DA_GHI_SO' AND nhom='DIEU_CHINH')),
  CHECK (trang_thai<>'DA_GHI_SO' OR (ma_nguoi_duyet IS NOT NULL AND ngay_duyet IS NOT NULL)),
  FOREIGN KEY (ma_quy) REFERENCES quy_tai_chinh(ma_quy),
  FOREIGN KEY (ma_nguoi_lap) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_duyet) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_phieu_goc) REFERENCES phieu_thu_chi(ma_phieu),
  INDEX idx_treasury_fund (ma_quy,trang_thai,ngay_hach_toan,ma_phieu),
  INDEX idx_treasury_queue (trang_thai,ma_phieu)
) ENGINE=InnoDB;
CREATE TABLE chung_tu_thu_chi (
  ma_chung_tu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phieu INT UNSIGNED NOT NULL,
  ten_tep VARCHAR(120) NOT NULL,
  loai_tep ENUM('image/jpeg','application/pdf') NOT NULL,
  kich_thuoc INT UNSIGNED NOT NULL,
  bam_sha256 CHAR(64) NOT NULL,
  noi_dung MEDIUMBLOB NOT NULL,
  ma_nguoi_tai INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE (ma_phieu,bam_sha256),
  CHECK (kich_thuoc BETWEEN 1 AND 5242880),
  CHECK (kich_thuoc=OCTET_LENGTH(noi_dung)),
  FOREIGN KEY (ma_phieu) REFERENCES phieu_thu_chi(ma_phieu) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_tai) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE lich_su_thu_chi (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phieu INT UNSIGNED NOT NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ghi_chu TEXT NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_phieu) REFERENCES phieu_thu_chi(ma_phieu) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_treasury_history (ma_phieu,ma_lich_su)
) ENGINE=InnoDB;
