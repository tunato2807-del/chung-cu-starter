import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../src/lib/db.js";
import { splitSql } from "../src/lib/sql-script.js";
export async function migrate(databasePool = pool) {
  const db = await databasePool.getConnection();
  let locked = false,
    current;
  try {
    const [[version]] = await db.query("SELECT VERSION() AS version");
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.version);
    if (
      !match ||
      Number(match[1]) !== 8 ||
      (Number(match[2]) === 0 && Number(match[3]) < 21)
    )
      throw Object.assign(new Error("Use MySQL 8.0.21+ or 8.4."), {
        code: "MYSQL_VERSION",
      });
    const [[lock]] = await db.query(
      "SELECT GET_LOCK(CONCAT('thesis:migrate:',LEFT(SHA2(DATABASE(),256),40)),10) AS acquired",
    );
    if (Number(lock.acquired) !== 1) throw new Error("Migration is locked.");
    locked = true;
    const [existing] = await db.query(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'",
    );
    if (existing.some((row) => row.name !== "schema_migrations")) {
      const [ledger] = existing.some((row) => row.name === "schema_migrations")
        ? await db.query("SELECT name FROM schema_migrations")
        : [[]];
      if (!ledger.some((row) => row.name === "001_thesis_schema.sql"))
        throw Object.assign(
          new Error("Use a fresh destination; keep the existing database."),
          { code: "USE_FRESH_DATABASE" },
        );
    }
    await db.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL)",
    );
    const directory = new URL("../../database/thesis-mysql/", import.meta.url);
    const names = (await readdir(directory))
      .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
      .sort();
    const [applied] = await db.query(
      "SELECT name,checksum FROM schema_migrations ORDER BY name",
    );
    if (applied.some((row) => !names.includes(row.name)))
      throw Object.assign(new Error("Schema belongs to another model."), {
        code: "USE_FRESH_DATABASE",
      });
    for (const name of names) {
      current = name;
      const sql = await readFile(new URL(name, directory), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const old = applied.find((row) => row.name === name);
      if (old && old.checksum !== checksum)
        throw Object.assign(new Error("Applied migration changed."), {
          code: "CHECKSUM_MISMATCH",
        });
      if (old) continue;
      for (const statement of splitSql(sql)) await db.query(statement);
      await db.execute(
        "INSERT INTO schema_migrations (name,checksum) VALUES (?,?)",
        [name, checksum],
      );
    }
    console.log(
      `MySQL thesis schema current: ${names.at(-1)} (31 tables, 8 history views)`,
    );
  } catch (error) {
    error.migrationName = current;
    throw error;
  } finally {
    if (locked)
      await db
        .query(
          "SELECT RELEASE_LOCK(CONCAT('thesis:migrate:',LEFT(SHA2(DATABASE(),256),40)))",
        )
        .catch(() => {});
    db.release();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await migrate();
  } catch (error) {
    console.error({
      code: error.code || "MIGRATION_ERROR",
      migration: error.migrationName,
      message:
        "Không khởi tạo được CSDL đồ án. Dùng MySQL 8.0.21+/8.4 và database đích mới theo docs/csdl-do-an-mysql.md; MySQL DDL không rollback toàn bộ, giữ DB dở dang để kiểm tra.",
    });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
