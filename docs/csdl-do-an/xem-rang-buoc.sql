-- MySQL 8.0.21+ / 8.4: chi doc metadata, khong thay doi schema/du lieu.
-- Chon database dang dung trong Workbench hoac USE <ten_database> truoc.
-- Neu DATABASE() la NULL, cac truy van ben duoi chua the hien dung schema.

-- 1. Database, phien ban va che do thuc thi hien tai.
SELECT
  DATABASE() AS schema_hien_tai,
  VERSION() AS phien_ban_mysql,
  @@session.foreign_key_checks AS kiem_tra_khoa_ngoai,
  @@session.unique_checks AS kiem_tra_unique,
  @@session.sql_mode AS che_do_sql;

-- 2. So rang buoc theo tung BANG THAT. FK ghep chi duoc dem MOT lan.
SELECT
  t.TABLE_NAME AS bang,
  COALESCE(c.khoa_chinh, 0) AS primary_key,
  COALESCE(c.duy_nhat, 0) AS unique_key,
  COALESCE(c.khoa_ngoai, 0) AS foreign_key,
  COALESCE(c.dieu_kien, 0) AS check_constraint
FROM information_schema.TABLES AS t
LEFT JOIN (
  SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    SUM(CONSTRAINT_TYPE = 'PRIMARY KEY') AS khoa_chinh,
    SUM(CONSTRAINT_TYPE = 'UNIQUE') AS duy_nhat,
    SUM(CONSTRAINT_TYPE = 'FOREIGN KEY') AS khoa_ngoai,
    SUM(CONSTRAINT_TYPE = 'CHECK') AS dieu_kien
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
  GROUP BY TABLE_SCHEMA, TABLE_NAME
) AS c
  ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
ORDER BY t.TABLE_NAME;

-- 3. PK/UNIQUE: moi dong la MOT COT; cung ten rang buoc la khoa ghep.
SELECT
  tc.TABLE_NAME AS bang,
  tc.CONSTRAINT_TYPE AS loai,
  tc.CONSTRAINT_NAME AS ten_rang_buoc,
  kcu.ORDINAL_POSITION AS thu_tu_cot,
  kcu.COLUMN_NAME AS cot
FROM information_schema.TABLE_CONSTRAINTS AS tc
JOIN information_schema.KEY_COLUMN_USAGE AS kcu
  ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
  AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
  AND kcu.TABLE_NAME = tc.TABLE_NAME
  AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE tc.TABLE_SCHEMA = DATABASE()
  AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_TYPE, tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION;

-- 4. FK va xu ly UPDATE/DELETE. FK ghep co nhieu dong cot cung ten.
SELECT
  kcu.TABLE_NAME AS bang_con,
  kcu.CONSTRAINT_NAME AS ten_fk,
  kcu.ORDINAL_POSITION AS thu_tu_cot,
  kcu.COLUMN_NAME AS cot_con,
  kcu.REFERENCED_TABLE_NAME AS bang_cha,
  kcu.REFERENCED_COLUMN_NAME AS cot_cha,
  rc.UPDATE_RULE AS khi_sua_khoa_cha,
  rc.DELETE_RULE AS khi_xoa_cha
FROM information_schema.KEY_COLUMN_USAGE AS kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS AS rc
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
  AND rc.TABLE_NAME = kcu.TABLE_NAME
  AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION;

-- 5. Bieu thuc CHECK va trang thai thuc thi.
SELECT
  tc.TABLE_NAME AS bang,
  tc.CONSTRAINT_NAME AS ten_check,
  tc.ENFORCED AS dang_thuc_thi,
  cc.CHECK_CLAUSE AS bieu_thuc
FROM information_schema.TABLE_CONSTRAINTS AS tc
JOIN information_schema.CHECK_CONSTRAINTS AS cc
  ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
  AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE = 'CHECK'
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME;

-- 6. Kieu du lieu, NULL, DEFAULT, ENUM/UNSIGNED va cot sinh cua bang that.
SELECT
  c.TABLE_NAME AS bang,
  c.ORDINAL_POSITION AS thu_tu,
  c.COLUMN_NAME AS cot,
  c.COLUMN_TYPE AS kieu_du_lieu,
  c.IS_NULLABLE AS cho_phep_null,
  c.COLUMN_DEFAULT AS mac_dinh,
  c.EXTRA AS bo_sung,
  c.GENERATION_EXPRESSION AS bieu_thuc_cot_sinh,
  c.COLLATION_NAME AS quy_tac_so_sanh_chuoi
FROM information_schema.COLUMNS AS c
JOIN information_schema.TABLES AS t
  ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
WHERE c.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;

-- 7. Tong theo loai: khong cong NOT NULL/INDEX vao so constraint nay.
SELECT CONSTRAINT_TYPE AS loai, COUNT(*) AS so_luong
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY CONSTRAINT_TYPE
ORDER BY CONSTRAINT_TYPE;

-- 8. View duoc liet ke rieng; khong tinh thanh bang that co PK/FK rieng.
SELECT TABLE_NAME AS ten_view, SECURITY_TYPE AS kieu_quyen
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- 9. INDEX tim kiem thong thuong khong phai rang buoc UNIQUE.
SELECT
  TABLE_NAME AS bang,
  INDEX_NAME AS ten_chi_muc,
  NON_UNIQUE AS cho_phep_trung,
  SEQ_IN_INDEX AS thu_tu_cot,
  COLUMN_NAME AS cot,
  INDEX_TYPE AS loai_chi_muc
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
