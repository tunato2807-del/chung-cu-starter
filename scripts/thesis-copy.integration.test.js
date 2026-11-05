import test from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { pool, databaseConfig } from "../backend/src/lib/db.js";
import { splitSql } from "../backend/src/lib/sql-script.js";
import { appendHistory } from "../backend/src/lib/history.js";
import { migrate } from "../backend/scripts/migrate.js";
import { copyData, assertEmptyDestination } from "./copy-thesis-data.js";

test(
  "real MySQL copy preserves all fields and old history IDs, rejects overwrites and rolls back corruption",
  { skip: process.env.THESIS_DB_TEST !== "1", timeout: 120000 },
  async (t) => {
    assert.equal(process.env.DB_ENGINE, "mysql");
    assert.equal(process.env.DB_NAME, "chung_cu_test");
    const suffix = randomBytes(5).toString("hex"),
      sourceName = `chung_cu_copy_test_${suffix}_src`,
      targetName = `chung_cu_copy_test_${suffix}_dst`;
    const { connectionLimit, ...config } = databaseConfig();
    const admin = await mysql.createConnection({
      ...config,
      database: undefined,
    });
    const created = [];
    let source, target, target19;
    try {
      for (const name of [sourceName, targetName]) {
        await admin.query(
          `CREATE DATABASE ${mysql.escapeId(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
        );
        created.push(name);
      }
      source = await mysql.createConnection({
        ...config,
        database: sourceName,
      });
      await source.query(
        "CREATE TABLE schema_migrations(name VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL)",
      );
      const dir = new URL("../database/migrations/", import.meta.url),
        names = (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort();
      for (const file of names.slice(0, 18)) {
        const sql = await readFile(new URL(file, dir), "utf8");
        for (const stmt of splitSql(sql)) await source.query(stmt);
        await source.execute("INSERT INTO schema_migrations VALUES(?,?)", [
          file,
          createHash("sha256").update(sql).digest("hex"),
        ]);
      }
      const password = "thesis-copy-test-password",
        encoded = await bcrypt.hash(password, 4);
      await source.execute(
        "INSERT INTO nguoi_dung(ma_nguoi_dung,ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro,ngay_tao)VALUES(41,'Nguyễn An','0909900001',?,'QUAN_TRI_VIEN','2024-01-01 00:00:00')",
        [encoded],
      );
      await source.query("ALTER TABLE nguoi_dung AUTO_INCREMENT=900");
      await source.query("INSERT INTO khoi_toa_nha(khoi)VALUES('A')");
      await source.query("INSERT INTO tang_toa_nha(khoi,tang)VALUES('A',1)");
      await source.query(
        "INSERT INTO can_ho(ma_can_ho,so_can_ho,khoi,tang,dien_tich_m2)VALUES(81,'A101','A',1,60)",
      );
      await source.execute(
        "INSERT INTO nguoi_dung(ma_nguoi_dung,ho_va_ten,ten_dang_nhap,mat_khau_ma_hoa,vai_tro,ma_can_ho_thanh_toan,dang_hoat_dong)VALUES(42,'Tài khoản căn','CH000081',?,'CU_DAN',81,0)",
        [encoded],
      );
      const qr = randomUUID();
      await source.execute(
        "INSERT INTO vi_tri_qr(ma_vi_tri_qr,ten_vi_tri,token_qr,ma_nguoi_tao)VALUES(51,'Sảnh ?',?,41)",
        [qr],
      );
      await source.execute(
        "INSERT INTO phan_anh(ma_phan_anh,ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co)VALUES(61,?,?,51,'Người gửi','0909900001','Đèn hỏng','Sảnh tối','DIEN')",
        ["a".repeat(64), randomUUID()],
      );
      await source.query(
        "UPDATE phan_anh SET ma_nguoi_gui=42 WHERE ma_phan_anh=61",
      );
      await source.query(
        "INSERT INTO lich_su_phan_anh(ma_lich_su_phan_anh,ma_phan_anh,loai_su_kien,trang_thai_moi)VALUES(100,61,'TIEP_NHAN','MOI')",
      );
      await source.query(
        "INSERT INTO lich_su_lien_ket_qr(ma_lich_su,ma_vi_tri_qr,ma_nguoi_thuc_hien)VALUES(100,51,41)",
      );
      await source.query("ALTER TABLE lich_su_phan_anh AUTO_INCREMENT=10000");
      await source.query(
        "INSERT INTO thiet_bi(ma_thiet_bi,ma_tai_san,ten_thiet_bi,loai,vi_tri,ma_nguoi_tao)VALUES(71,'TS_TEST','Bơm','MAY_BOM','Hầm',41)",
      );
      await source.execute(
        "INSERT INTO lich_su_bao_tri(ma_thiet_bi,ma_nguoi_thuc_hien,su_kien,ghi_chu,du_lieu)VALUES(71,41,'TAO','Ghi chú ?',?)",
        ['{"number":9007199254740993}'],
      );
      target = mysql.createPool({
        ...config,
        database: targetName,
        jsonStrings: true,
        supportBigNumbers: true,
        bigNumberStrings: true,
      });
      await migrate(target);
      const sourceConfig = { ...config, database: sourceName };
      await t.test(
        "audit failure rolls back copied parents, histories and migration default rows",
        async () => {
          await target.query(
            "CREATE TRIGGER fail_copy BEFORE INSERT ON nhat_ky_nghiep_vu FOR EACH ROW BEGIN IF NEW.loai_nhat_ky='lich_su_phan_anh' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='injected'; END IF; END",
          );
          try {
            await assert.rejects(
              copyData(sourceConfig, target, { quiet: true }),
              { code: "ER_SIGNAL_EXCEPTION" },
            );
            const [[n]] = await target.query(
              "SELECT COUNT(*) AS n FROM nguoi_dung",
            );
            assert.equal(Number(n.n), 0);
            await assertEmptyDestination(target);
          } finally {
            await target.query("DROP TRIGGER fail_copy");
          }
        },
      );
      await t.test(
        "verification detects a silently changed target field and rolls back",
        async () => {
          await target.query(
            "CREATE TRIGGER change_copy BEFORE INSERT ON vi_tri_qr FOR EACH ROW SET NEW.ten_vi_tri='Changed by test'",
          );
          try {
            await assert.rejects(
              copyData(sourceConfig, target, { quiet: true }),
              { code: "VERIFY_MISMATCH" },
            );
            await assertEmptyDestination(target);
          } finally {
            await target.query("DROP TRIGGER change_copy");
          }
        },
      );
      await t.test(
        "successful copy retains timestamps, passwords, QR, exact JSON, overlapping audit IDs and sequence gaps",
        async () => {
          const report = await copyData(sourceConfig, target, { quiet: true });
          assert.equal(report.verified, true);
          assert.equal(report.sourceSchema, 18);
          assert.equal(report.tables.length, 37);
          assert.equal(report.foreignKeys, 81);
          const [[user]] = await target.query(
            "SELECT mat_khau_ma_hoa,ngay_tao FROM nguoi_dung WHERE ma_nguoi_dung=41",
          );
          assert.equal(
            await bcrypt.compare(password, user.mat_khau_ma_hoa),
            true,
          );
          assert.equal(user.ngay_tao, "2024-01-01 00:00:00");
          const [[privacy]] = await target.query(
            "SELECT ma_cu_dan_nguoi_gui,gui_tu_tai_khoan_can_ho FROM phan_anh",
          );
          assert.equal(privacy.ma_cu_dan_nguoi_gui, null);
          assert.equal(privacy.gui_tu_tai_khoan_can_ho, 1);
          const [[location]] = await target.query(
            "SELECT token_qr FROM vi_tri_qr",
          );
          assert.equal(location.token_qr, qr);
          for (const [name, id] of [
            ["lich_su_phan_anh", "ma_lich_su_phan_anh"],
            ["lich_su_lien_ket_qr", "ma_lich_su"],
          ]) {
            const [[row]] = await target.query(
              `SELECT ${id} AS id FROM ${name}`,
            );
            assert.equal(Number(row.id), 100);
          }
          const [[data]] = await target.query(
            "SELECT JSON_UNQUOTE(JSON_EXTRACT(du_lieu,'$.number')) AS value FROM lich_su_bao_tri",
          );
          assert.equal(data.value, "9007199254740993");
          const event = await appendHistory(
            target,
            "lich_su_phan_anh",
            ["ma_phan_anh", "loai_su_kien", "trang_thai_moi"],
            [61, "TIEP_NHAN", "MOI"],
          );
          assert.ok(BigInt(event.insertId) >= 80001n);
          const [next] = await target.execute(
            "INSERT INTO nguoi_dung(ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro)VALUES('Test next','0909900002',?,'CU_DAN')",
            [encoded],
          );
          assert.equal(Number(next.insertId), 900);
          await assert.rejects(assertEmptyDestination(target), {
            code: "TARGET_NOT_EMPTY",
          });
          await assert.rejects(
            copyData(sourceConfig, target, { quiet: true }),
            { code: "TARGET_NOT_EMPTY" },
          );
          const [[original]] = await source.query(
            "SELECT COUNT(*) AS n FROM nguoi_dung",
          );
          assert.equal(original.n, 2);
        },
      );
      await t.test(
        "019 source preserves existing sender-privacy fields in a new destination",
        async () => {
          const file = names.at(-1),
            sql = await readFile(new URL(file, dir), "utf8");
          for (const stmt of splitSql(sql)) await source.query(stmt);
          await source.execute("INSERT INTO schema_migrations VALUES(?,?)", [
            file,
            createHash("sha256").update(sql).digest("hex"),
          ]);
          const oldPool = mysql.createPool({ ...config, database: sourceName });
          try {
            await assert.rejects(migrate(oldPool), {
              code: "USE_FRESH_DATABASE",
            });
          } finally {
            await oldPool.end();
          }
          const name = targetName + "19";
          await admin.query(
            `CREATE DATABASE ${mysql.escapeId(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
          );
          created.push(name);
          target19 = mysql.createPool({
            ...config,
            database: name,
            jsonStrings: true,
            supportBigNumbers: true,
            bigNumberStrings: true,
          });
          await migrate(target19);
          const report = await copyData(sourceConfig, target19, {
            quiet: true,
          });
          assert.equal(report.sourceSchema, 19);
          assert.equal(report.verified, true);
          const [[row]] = await target19.query(
            "SELECT ma_cu_dan_nguoi_gui,gui_tu_tai_khoan_can_ho FROM phan_anh",
          );
          assert.equal(row.ma_cu_dan_nguoi_gui, null);
          assert.equal(row.gui_tu_tai_khoan_can_ho, 1);
        },
      );
    } finally {
      await source?.end();
      await target?.end();
      await target19?.end();
      for (const name of created)
        await admin.query(`DROP DATABASE ${mysql.escapeId(name)}`);
      await admin.end();
      await pool.end();
    }
  },
);
