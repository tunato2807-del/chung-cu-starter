import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool } from "../src/lib/db.js";
const db = await pool.getConnection();
try {
  const [[lock]] = await db.query(
    "SELECT GET_LOCK('chung_cu_migrations', 30) AS acquired",
  );
  if (!lock.acquired) throw new Error("Migration is already running");
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL)",
  );
  const name = "001_auth_qr_incidents.sql";
  const sql = await readFile(
    new URL(`../../database/migrations/${name}`, import.meta.url),
    "utf8",
  );
  const checksum = createHash("sha256").update(sql).digest("hex");
  const [old] = await db.execute(
    "SELECT checksum FROM schema_migrations WHERE name=?",
    [name],
  );
  if (old.length && old[0].checksum !== checksum)
    throw new Error("Applied migration changed. Add a new migration instead.");
  if (!old.length) {
    // MySQL DDL commits implicitly. A partial failure must be investigated, never marked applied.
    for (const statement of sql.split(";").filter((x) => x.trim()))
      await db.query(statement);
    await db.execute("INSERT INTO schema_migrations VALUES (?,?)", [
      name,
      checksum,
    ]);
  }
  console.log("Schema current: 001_auth_qr_incidents");
} finally {
  await db.query("SELECT RELEASE_LOCK('chung_cu_migrations')");
  db.release();
  await pool.end();
}
