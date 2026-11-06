import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { freshConfig, initializeFresh } from "./init-fresh-local.js";
import { freshDataOptions } from "./create-fresh-data.js";
import { acceptanceOptions, launch } from "./create-acceptance-data.js";
import { ensureDatabase } from "./mysql-admin.js";
import { databaseConfig, pool } from "../backend/src/lib/db.js";

test("fresh configuration has a new database and signing key, independent of old environment variables", () => {
  const a = freshConfig(),
    b = freshConfig();
  const first = parseEnv(a.contents),
    second = parseEnv(b.contents);
  assert.equal(first.FRESH_INSTALL, "1");
  assert.equal(first.DB_ENGINE, "mysql");
  assert.equal(first.DB_PORT, "3306");
  assert.equal(first.DB_USER, "root");
  assert.equal(first.DB_PASSWORD, "");
  assert.equal(first.DB_NAME, a.database);
  assert.notEqual(first.DB_NAME, second.DB_NAME);
  assert.notEqual(first.JWT_SECRET, second.JWT_SECRET);
  assert.ok(first.JWT_SECRET.length >= 64);
  assert.equal(
    acceptanceOptions([`--database=${a.database}`]).database,
    a.database,
  );
});

test("fresh setup never reads or overwrites an existing config file", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "fresh-install-test-"),
  );
  const filename = path.join(directory, ".env");
  try {
    const result = await initializeFresh(filename);
    const content = await readFile(filename, "utf8");
    assert.equal(parseEnv(content).DB_NAME, result.database);
    if (process.platform !== "win32")
      assert.equal((await stat(filename)).mode & 0o777, 0o600);
    await assert.rejects(initializeFresh(filename), { code: "EEXIST" });
    assert.equal(await readFile(filename, "utf8"), content);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("fresh data command uses the generated target, never a previous default or override", () => {
  const env = parseEnv(freshConfig().contents);
  assert.deepEqual(freshDataOptions([], env), [
    `--database=${env.DB_NAME}`,
    "--origin=http://localhost:5173",
  ]);
  assert.deepEqual(
    freshDataOptions(["--origin=https://192.168.1.208:5173"], env),
    [`--database=${env.DB_NAME}`, "--origin=https://192.168.1.208:5173"],
  );
  for (const input of [
    {},
    { DB_NAME: env.DB_NAME },
    { FRESH_INSTALL: "1", DB_NAME: "chung_cu" },
    { FRESH_INSTALL: "1", DB_NAME: "chung_cu_nghiem_thu_quymo" },
  ])
    assert.throws(() => freshDataOptions([], input), {
      code: "FRESH_CONFIG_REQUIRED",
    });
  for (const args of [
    ["--reset"],
    ["--database=chung_cu_nghiem_thu_old"],
    ["--origin=http://localhost:5173", "--origin=http://localhost:5174"],
  ])
    assert.throws(() => freshDataOptions(args, env));
});

test(
  "fresh MySQL provisioning refuses existing databases before migrations or seed and keeps every existing row",
  { skip: process.env.FRESH_DB_TEST !== "1", timeout: 30000 },
  async () => {
    assert.equal(process.env.DB_NAME, "chung_cu_test");
    const name = `chung_cu_nghiem_thu_moi${randomBytes(6).toString("hex")}`;
    const { connectionLimit, ...config } = databaseConfig();
    let created = false,
      db;
    try {
      await ensureDatabase(config, name, { newOnly: true });
      created = true;
      db = await mysql.createConnection({ ...config, database: name });
      await db.query(
        "CREATE TABLE preserved_record(id INT PRIMARY KEY,note VARCHAR(30))",
      );
      await db.execute("INSERT INTO preserved_record VALUES(1,?)", [
        "fixture remains untouched",
      ]);
      await assert.rejects(
        launch([`--database=${name}`], "realistic", { newDatabaseOnly: true }),
        { code: "ER_DB_CREATE_EXISTS" },
      );
      assert.deepEqual((await db.query("SELECT * FROM preserved_record"))[0], [
        { id: 1, note: "fixture remains untouched" },
      ]);
      const [tables] = await db.query(
        "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema=DATABASE()",
      );
      assert.deepEqual(
        tables.map((t) => t.name),
        ["preserved_record"],
      );
      // The legacy ensure-if-missing behavior stays compatible for existing workflows.
      await ensureDatabase(config, name);
      assert.equal(
        (await db.query("SELECT COUNT(*) AS n FROM preserved_record"))[0][0].n,
        1,
      );
    } finally {
      if (db) {
        if (created) await db.query(`DROP DATABASE ${mysql.escapeId(name)}`);
        await db.end();
      }
      await pool.end();
    }
  },
);
