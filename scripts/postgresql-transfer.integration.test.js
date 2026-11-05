// Explicit opt-in: uses two disposable local servers, never the configured app DB.
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2/promise";
import pg from "pg";
import bcrypt from "bcryptjs";
import { transfer, preflightDestination } from "./migrate-mysql-postgresql.js";
import {
  createDatabasePool,
  databaseConfig,
  pool,
} from "../backend/src/lib/db.js";
import { ensureDatabase } from "./postgresql-admin.js";
import { migrate } from "../backend/scripts/migrate.js";

test(
  "MySQL 018/019 -> PostgreSQL: exact values, rollback, sequence gaps and refusal to overwrite",
  { skip: process.env.POSTGRES_TRANSFER_TEST !== "1", timeout: 120000 },
  async (t) => {
    assert.equal(process.env.DB_ENGINE, "postgresql");
    assert.ok(process.env.MYSQL_TEST_PORT);
    const name = `chung_cu_migration_test_${randomBytes(5).toString("hex")}`;
    const sourceConfig = {
      host: "127.0.0.1",
      port: Number(process.env.MYSQL_TEST_PORT),
      user: "root",
      password: process.env.MYSQL_TEST_PASSWORD,
      database: name,
    };
    const mysqlAdmin = await mysql.createConnection({
      ...sourceConfig,
      database: undefined,
      multipleStatements: true,
    });
    const admin = new pg.Client(databaseConfig({ database: "postgres" }));
    let source, destination, version19Destination;
    try {
      await mysqlAdmin.query(
        `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
      );
      source = await mysql.createConnection({
        ...sourceConfig,
        multipleStatements: true,
      });
      await source.query(
        "CREATE TABLE schema_migrations (name VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL)",
      );
      const dir = new URL("../database/migrations/", import.meta.url);
      const names = (await readdir(dir))
        .filter((name) => name.endsWith(".sql"))
        .sort();
      for (const file of names.slice(0, 18)) {
        const sql = await readFile(new URL(file, dir), "utf8");
        await source.query(sql);
        await source.execute("INSERT INTO schema_migrations VALUES (?,?)", [
          file,
          createHash("sha256").update(sql).digest("hex"),
        ]);
      }
      const password = "synthetic-transfer-only-123";
      const encoded = await bcrypt.hash(password, 4);
      await source.execute(
        "INSERT INTO nguoi_dung (ma_nguoi_dung,ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro,ngay_tao) VALUES (41,'Nguyễn An','0909190041',?,'QUAN_TRI_VIEN','2026-10-01 00:00:00')",
        [encoded],
      );
      await source.query("ALTER TABLE nguoi_dung AUTO_INCREMENT=900");
      const token = "53fc20b8-b44a-4c75-a5de-7b476fe52ec4";
      await source.execute(
        "INSERT INTO vi_tri_qr (ma_vi_tri_qr,ten_vi_tri,token_qr,ma_nguoi_tao) VALUES (51,'Sảnh ?',?,41)",
        [token],
      );
      await source.execute("INSERT INTO gioi_han_gui VALUES (?,?)", [
        "a".repeat(64),
        JSON.stringify([1, 1735689600000]),
      ]);
      await source.execute(
        "INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co) VALUES (?, ?,51,41,'Nguyễn An','0909190041','Đèn hỏng','Nội dung giữ nguyên','DIEN')",
        ["b".repeat(64), "95487a5f-d8dd-4394-b3cc-c948a0cb61a2"],
      );
      await ensureDatabase(databaseConfig(), name);
      destination = createDatabasePool(databaseConfig({ database: name }));
      await preflightDestination(destination);
      await migrate(destination);
      await preflightDestination(destination);
      await destination.native.query(
        "CREATE FUNCTION force_transfer_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$",
      );
      await destination.native.query(
        "CREATE TRIGGER fail_transfer BEFORE INSERT ON vi_tri_qr FOR EACH ROW EXECUTE FUNCTION force_transfer_failure()",
      );
      await t.test(
        "failed copy rolls back earlier tables and default seeds",
        async () => {
          await assert.rejects(
            transfer(sourceConfig, destination, { quiet: true }),
            { code: "P0001" },
          );
          assert.equal(
            (
              await destination.native.query(
                "SELECT COUNT(*) AS n FROM nguoi_dung",
              )
            ).rows[0].n,
            0,
          );
          assert.equal(
            (
              await destination.native.query(
                "SELECT COUNT(*) AS n FROM loai_phi",
              )
            ).rows[0].n,
            6,
          );
          assert.equal(
            (
              await destination.native.query(
                "SELECT COUNT(*) AS n FROM quy_tai_chinh",
              )
            ).rows[0].n,
            1,
          );
        },
      );
      await destination.native.query(
        "DROP TRIGGER fail_transfer ON vi_tri_qr; DROP FUNCTION force_transfer_failure()",
      );
      await t.test(
        "verification detects silent target changes and rolls the copy back",
        async () => {
          await destination.native.query(
            "CREATE FUNCTION change_transfer_row() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.ten_vi_tri := 'changed by test'; RETURN NEW; END $$",
          );
          await destination.native.query(
            "CREATE TRIGGER change_transfer BEFORE INSERT ON vi_tri_qr FOR EACH ROW EXECUTE FUNCTION change_transfer_row()",
          );
          try {
            await assert.rejects(
              transfer(sourceConfig, destination, { quiet: true }),
              { code: "VERIFY_MISMATCH" },
            );
            assert.equal(
              (
                await destination.native.query(
                  "SELECT COUNT(*) AS n FROM nguoi_dung",
                )
              ).rows[0].n,
              0,
            );
          } finally {
            await destination.native.query(
              "DROP TRIGGER change_transfer ON vi_tri_qr; DROP FUNCTION change_transfer_row()",
            );
          }
        },
      );
      await t.test(
        "018 supported and IDs/password/date/QR/JSON plus next identity are preserved",
        async () => {
          const report = await transfer(sourceConfig, destination, {
            quiet: true,
          });
          assert.equal(report.sourceSchema, 18);
          assert.equal(report.verified, true);
          assert.equal(report.tables.length, 37);
          const user = (
            await destination.native.query(
              "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=41",
            )
          ).rows[0];
          assert.equal(user.mat_khau_ma_hoa, encoded);
          assert.equal(
            await bcrypt.compare(password, user.mat_khau_ma_hoa),
            true,
          );
          assert.equal(user.ngay_tao, "2026-10-01 00:00:00");
          assert.equal(
            (await destination.native.query("SELECT token_qr FROM vi_tri_qr"))
              .rows[0].token_qr,
            token,
          );
          const next = (
            await destination.native.query(
              "SELECT nextval(pg_get_serial_sequence('nguoi_dung','ma_nguoi_dung')) AS id",
            )
          ).rows[0].id;
          assert.equal(next, 900);
          await assert.rejects(
            transfer(sourceConfig, destination, { quiet: true }),
            { code: "TARGET_NOT_EMPTY" },
          );
          await assert.rejects(preflightDestination(destination), {
            code: "TARGET_NOT_EMPTY",
          });
          const [[unchanged]] = await source.query(
            "SELECT COUNT(*) AS n FROM nguoi_dung",
          );
          assert.equal(unchanged.n, 1);
        },
      );
      await t.test(
        "019 source copies to a fresh destination, while a bad source checksum blocks copying",
        async () => {
          const file = names.at(-1),
            sql = await readFile(new URL(file, dir), "utf8");
          await source.query(sql);
          await source.execute("INSERT INTO schema_migrations VALUES (?,?)", [
            file,
            createHash("sha256").update(sql).digest("hex"),
          ]);
          // A second fresh destination is not necessary to verify source checksum
          // validation runs before any destination data can be touched.
          await source.execute(
            "UPDATE schema_migrations SET checksum=? WHERE name=?",
            ["0".repeat(64), file],
          );
          await assert.rejects(
            transfer(sourceConfig, destination, { quiet: true }),
            { code: "SOURCE_CHECKSUM" },
          );
          await source.execute(
            "UPDATE schema_migrations SET checksum=? WHERE name=?",
            [createHash("sha256").update(sql).digest("hex"), file],
          );
          await assert.rejects(
            transfer(sourceConfig, destination, { quiet: true }),
            { code: "TARGET_NOT_EMPTY" },
          );
          await ensureDatabase(databaseConfig(), `${name}_v19`);
          version19Destination = createDatabasePool(
            databaseConfig({ database: `${name}_v19` }),
          );
          await migrate(version19Destination);
          const report = await transfer(sourceConfig, version19Destination, {
            quiet: true,
          });
          assert.equal(report.sourceSchema, 19);
          assert.equal(report.verified, true);
          const incident = (
            await version19Destination.native.query(
              "SELECT ma_cu_dan_nguoi_gui,gui_tu_tai_khoan_can_ho FROM phan_anh",
            )
          ).rows[0];
          assert.equal(incident.ma_cu_dan_nguoi_gui, null);
          assert.equal(incident.gui_tu_tai_khoan_can_ho, 0);
        },
      );
    } finally {
      await source?.end();
      await destination?.end();
      await version19Destination?.end();
      await mysqlAdmin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await mysqlAdmin.end();
      await admin.connect();
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.query(`DROP DATABASE IF EXISTS "${name}_v19" WITH (FORCE)`);
      await admin.end();
      await pool.end();
    }
  },
);
