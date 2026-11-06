import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import {
  adminIdentity,
  initializeAdmin,
} from "../backend/src/modules/auth/initial-admin.service.js";
import { databaseConfig, pool } from "../backend/src/lib/db.js";
import { migrate } from "../backend/scripts/migrate.js";

// Every identity below is a test fixture; none is included in installation data.
const identity = { name: "Quản trị kiểm thử", phone: "0909999988" };

test("administrator identity needs entered information, normalizes phones and respects schema limits", () => {
  assert.deepEqual(
    adminIdentity({ name: "  Quản trị kiểm thử  ", phone: "+84909999988" }),
    identity,
  );
  for (const input of [
    { name: "", phone: identity.phone },
    { ...identity, name: "x".repeat(101) },
    { ...identity, name: "Tên\nkhác" },
    { ...identity, phone: "" },
    { ...identity, phone: "1234567890" },
  ])
    assert.throws(() => adminIdentity(input), { code: "VALIDATION" });
});

test("noninteractive install refuses instead of creating preset users or printing credentials", () => {
  for (const script of ["setup-admin.js", "seed.js"]) {
    const result = spawnSync(process.execPath, [`backend/scripts/${script}`], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        DB_ENGINE: "mysql",
        DB_HOST: "127.0.0.1",
        DB_PORT: "1",
      },
      encoding: "utf8",
      timeout: 10000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /terminal tương tác/);
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /090000000[123]|mat_khau|ECONNREFUSED/,
    );
  }
});

test(
  "initial administrator on real MySQL preserves existing users, credentials and empty business data",
  {
    skip: process.env.THESIS_DB_TEST !== "1",
    timeout: 60000,
  },
  async (t) => {
    assert.equal(process.env.DB_NAME, "chung_cu_test");
    const { connectionLimit, ...config } = databaseConfig();
    const root = await mkdtemp(path.join(os.tmpdir(), "initial-admin-test-"));
    const admin = await mysql.createConnection({
      ...config,
      database: undefined,
    });
    const databases = [];
    const pools = [];
    async function fixture(suffix) {
      // Only created inside the explicitly configured, isolated MySQL test server.
      const name = `chung_cu_init_${randomBytes(5).toString("hex")}_${suffix}`;
      await admin.query(
        `CREATE DATABASE ${mysql.escapeId(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
      );
      databases.push(name);
      const fixturePool = mysql.createPool({
        ...config,
        database: name,
        connectionLimit: 3,
      });
      pools.push(fixturePool);
      await migrate(fixturePool);
      return { name, db: fixturePool, directory: path.join(root, name) };
    }
    const count = async (db, table) =>
      Number(
        (
          await db.query(`SELECT COUNT(*) AS n FROM ${mysql.escapeId(table)}`)
        )[0][0].n,
      );
    try {
      const fixtureA = await fixture("a");
      const { name, db } = fixtureA;
      const filename = path.join(root, `${name}.initial-admin.json`);
      await t.test(
        "credential collision rolls back and never overwrites the file",
        async () => {
          await writeFile(filename, "existing credentials\n", { flag: "wx" });
          await assert.rejects(
            initializeAdmin(db, identity, { directory: root }),
            { code: "EEXIST" },
          );
          assert.equal(await count(db, "nguoi_dung"), 0);
          assert.equal(
            await readFile(filename, "utf8"),
            "existing credentials\n",
          );
        },
      );
      await t.test(
        "unwritable credential destination leaves no account without a password",
        async () => {
          await assert.rejects(
            initializeAdmin(db, identity, { directory: filename }),
          );
          assert.equal(await count(db, "nguoi_dung"), 0);
        },
      );
      let credentials;
      await t.test(
        "only the entered administrator is created, with a usable random password",
        async () => {
          const result = await initializeAdmin(db, identity, {
            directory: fixtureA.directory,
          });
          assert.equal(result.database, name);
          assert.deepEqual(Object.keys(result).sort(), [
            "credentialFile",
            "database",
            "userId",
          ]);
          credentials = JSON.parse(
            await readFile(result.credentialFile, "utf8"),
          );
          const [[user]] = await db.query("SELECT * FROM nguoi_dung");
          assert.equal(user.ho_va_ten, identity.name);
          assert.equal(user.so_dien_thoai, identity.phone);
          assert.equal(user.vai_tro, "QUAN_TRI_VIEN");
          assert.equal(user.dang_hoat_dong, 1);
          assert.equal(credentials.database, name);
          assert.equal(credentials.mat_khau.length, 32);
          assert.notEqual(credentials.mat_khau, user.mat_khau_ma_hoa);
          assert.equal(
            await bcrypt.compare(credentials.mat_khau, user.mat_khau_ma_hoa),
            true,
          );
          if (process.platform !== "win32")
            assert.equal(
              (await stat(result.credentialFile)).mode & 0o777,
              0o600,
            );
          for (const table of [
            "can_ho",
            "cu_dan",
            "vi_tri_qr",
            "phan_anh",
            "hoa_don",
            "phuong_tien",
            "thiet_bi",
            "phieu_thu_chi",
          ])
            assert.equal(await count(db, table), 0, table);
          assert.equal(await count(db, "nguoi_dung"), 1);
        },
      );
      await t.test(
        "rerun keeps the original login, password and session version",
        async () => {
          const before = (await db.query("SELECT * FROM nguoi_dung"))[0];
          await assert.rejects(
            initializeAdmin(
              db,
              { name: "Một người kiểm thử khác", phone: "0909999977" },
              { directory: path.join(root, "retry") },
            ),
            { code: "EXISTING_ACCOUNTS" },
          );
          assert.deepEqual(
            (await db.query("SELECT * FROM nguoi_dung"))[0],
            before,
          );
          assert.deepEqual(await readdir(fixtureA.directory), [
            `${name}.initial-admin.json`,
          ]);
        },
      );
      await t.test(
        "two simultaneous starts create exactly one administrator",
        async () => {
          const parallel = await fixture("parallel");
          const results = await Promise.allSettled([
            initializeAdmin(parallel.db, identity, {
              directory: parallel.directory,
            }),
            initializeAdmin(parallel.db, identity, {
              directory: parallel.directory,
            }),
          ]);
          assert.equal(
            results.filter((r) => r.status === "fulfilled").length,
            1,
          );
          assert.equal(
            results.find((r) => r.status === "rejected").reason.code,
            "EXISTING_ACCOUNTS",
          );
          assert.equal(await count(parallel.db, "nguoi_dung"), 1);
          assert.equal((await readdir(parallel.directory)).length, 1);
        },
      );
      await t.test(
        "lost commit acknowledgement keeps the only credential file",
        async () => {
          const uncertain = await fixture("uncertain");
          const wrapped = {
            async getConnection() {
              const connection = await uncertain.db.getConnection();
              return new Proxy(connection, {
                get(target, key) {
                  if (key === "commit")
                    return async () => {
                      await target.commit();
                      throw new Error("simulated lost acknowledgement");
                    };
                  const value = Reflect.get(target, key, target);
                  return typeof value === "function"
                    ? value.bind(target)
                    : value;
                },
              });
            },
          };
          await assert.rejects(
            initializeAdmin(wrapped, identity, {
              directory: uncertain.directory,
            }),
            { code: "COMMIT_UNCERTAIN" },
          );
          assert.equal(await count(uncertain.db, "nguoi_dung"), 1);
          const saved = JSON.parse(
            await readFile(
              path.join(
                uncertain.directory,
                `${uncertain.name}.initial-admin.json`,
              ),
              "utf8",
            ),
          );
          assert.equal(saved.mat_khau.length, 32);
          await assert.rejects(
            initializeAdmin(uncertain.db, identity, {
              directory: uncertain.directory,
            }),
            { code: "EXISTING_ACCOUNTS" },
          );
        },
      );
      await t.test(
        "test and acceptance databases cannot be initialized by the live setup command",
        async () => {
          await assert.rejects(
            initializeAdmin(pool, identity, { directory: root }),
            { code: "TEST_DATABASE" },
          );
        },
      );
    } finally {
      for (const fixturePool of pools) await fixturePool.end();
      for (const name of databases)
        await admin.query(`DROP DATABASE ${mysql.escapeId(name)}`);
      await admin.end();
      await pool.end();
      await rm(root, { recursive: true, force: true });
    }
  },
);
