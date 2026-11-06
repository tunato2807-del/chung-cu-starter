import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { databaseConfig, pool } from "../backend/src/lib/db.js";

test(
  "full-sized generated data satisfies counts and refuses any rerun without changing database or credential files",
  { skip: process.env.REALISTIC_DATA_TEST !== "1", timeout: 60000 },
  async () => {
    assert.equal(process.env.DB_NAME, "chung_cu_test");
    const database = process.env.REALISTIC_TARGET_DATABASE;
    assert.match(database, /^chung_cu_nghiem_thu_quymo[a-z0-9]{0,12}$/);
    const db = mysql.createPool(databaseConfig({ database }));
    const directory = path.resolve("backend/storage/acceptance", database);
    try {
      const report = JSON.parse(
        await readFile(path.join(directory, "SO-LUONG-BANG.json"), "utf8"),
      );
      assert.equal(report.dataset_kind, "SYNTHETIC_REALISTIC");
      assert.equal(report.tables.length, 39);
      assert.equal(
        report.tables.filter((t) => t.type === "BASE TABLE" && t.rows >= 100)
          .length,
        25,
      );
      assert.equal(
        report.tables.filter((t) => t.type === "VIEW" && t.rows >= 100).length,
        8,
      );
      assert.ok(report.checks.length >= 111);
      assert.ok(report.checks.every((c) => c.status === "DAT"));
      for (const [table, expected] of Object.entries({
        can_ho: 200,
        cu_dan: 400,
        tang_toa_nha: 100,
        thiet_bi: 160,
        phan_anh: 240,
        dat_lich_tien_ich: 160,
        loai_phi: 6,
        schema_migrations: 1,
      }))
        assert.equal(
          report.tables.find((t) => t.table === table).rows,
          expected,
        );
      const [[names]] = await db.query(
        "SELECT COUNT(*) AS n FROM cu_dan WHERE ho_va_ten REGEXP 'demo|NT ·|nghiệm thu|test'",
      );
      assert.equal(Number(names.n), 0);
      const counts = async () => {
        const result = {};
        for (const table of report.tables)
          result[table.table] = Number(
            (
              await db.query(
                `SELECT COUNT(*) AS n FROM ${mysql.escapeId(table.table)}`,
              )
            )[0][0].n,
          );
        return result;
      };
      const before = await counts();
      const files = ["manifest.json", "TAI-KHOAN.md", "SO-LUONG-BANG.json"];
      const beforeFiles = await Promise.all(
        files.map(async (file) => {
          const info = await stat(path.join(directory, file));
          return [info.size, info.mtimeMs];
        }),
      );
      const run = spawnSync(
        process.execPath,
        [
          "scripts/create-realistic-data.js",
          `--database=${database}`,
          "--origin=https://192.168.1.208:5173",
        ],
        {
          cwd: new URL("..", import.meta.url),
          env: { ...process.env },
          encoding: "utf8",
          timeout: 45000,
        },
      );
      assert.ifError(run.error);
      assert.equal(run.status, 1);
      assert.match(run.stderr, /TARGET_NOT_EMPTY/);
      assert.doesNotMatch(run.stdout, /Nhà ở, cư dân|Hoàn tất:/);
      assert.deepEqual(await counts(), before);
      const afterFiles = await Promise.all(
        files.map(async (file) => {
          const info = await stat(path.join(directory, file));
          return [info.size, info.mtimeMs];
        }),
      );
      assert.deepEqual(afterFiles, beforeFiles);
    } finally {
      await db.end();
      await pool.end();
    }
  },
);
