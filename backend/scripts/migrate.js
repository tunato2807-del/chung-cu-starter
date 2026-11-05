import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool } from "../src/lib/db.js";

export async function migrate(databasePool = pool) {
  const db = await databasePool.getConnection();
  let locked = false;
  let migrationName;
  try {
    const [[version]] = await db.query(
      "SELECT current_setting('server_version_num')::integer AS version",
    );
    if (version.version < 170000)
      throw Object.assign(new Error("PostgreSQL 17 or newer required."), {
        code: "POSTGRES_VERSION",
      });
    // Session lock serializes migrations across processes and survives commits.
    await db.query("SELECT pg_advisory_lock(718251104)");
    locked = true;
    await db.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL)",
    );
    const directory = new URL("../../database/postgresql/", import.meta.url);
    const names = (await readdir(directory))
      .filter((n) => /^\d{3}_[a-z0-9_]+\.sql$/.test(n))
      .sort();
    const [applied] = await db.query("SELECT name FROM schema_migrations");
    if (applied.some(({ name }) => !names.includes(name)))
      throw new Error("An applied migration is missing from this checkout.");
    for (const name of names) {
      migrationName = name;
      const sql = await readFile(new URL(name, directory), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const [previous] = await db.execute(
        "SELECT checksum FROM schema_migrations WHERE name=?",
        [name],
      );
      if (previous.length && previous[0].checksum !== checksum)
        throw new Error(
          "Applied PostgreSQL migration changed. Add a new migration instead.",
        );
      if (!previous.length) {
        await db.beginTransaction();
        try {
          await db.native.query(sql);
          await db.execute(
            "INSERT INTO schema_migrations (name,checksum) VALUES (?,?)",
            [name, checksum],
          );
          await db.commit();
        } catch (error) {
          await db.rollback();
          throw error;
        }
      }
    }
    console.log(`PostgreSQL schema current: ${names.at(-1)}`);
  } catch (error) {
    error.migrationName = migrationName;
    throw error;
  } finally {
    if (locked) await db.query("SELECT pg_advisory_unlock(718251104)");
    db.release();
  }
}
const { fileURLToPath } = await import("node:url");
const { resolve } = await import("node:path");
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await migrate();
  } catch (error) {
    console.error({
      code: error.code || "MIGRATION_ERROR",
      migration: error.migrationName,
      message:
        "Không chạy được migration PostgreSQL. Kiểm tra cấu hình/phiên bản/checksum, không sửa database MySQL.",
    });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
