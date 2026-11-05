import pg from "pg";
import { compileParameters, identityColumns } from "./postgresql.js";

// Preserve the public API: safe IDs/counts are numbers, money is exact text,
// and DATE / UTC timestamp-without-zone values are strings, never local Dates.
pg.types.setTypeParser(20, (value) => {
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : value;
});
pg.types.setTypeParser(16, (value) => (value === "t" ? 1 : 0));
pg.types.setTypeParser(1082, (value) => value);
pg.types.setTypeParser(1114, (value) => value);

export function databaseConfig(overrides = {}) {
  const engine = process.env.DB_ENGINE;
  const port = Number(process.env.DB_PORT || 5432);
  if (engine && engine !== "postgresql")
    throw new Error(
      "Ứng dụng đã chuyển sang PostgreSQL. Dùng cấu hình DB_ENGINE=postgresql theo docs/chuyen-postgresql-vscode.md.",
    );
  if (!engine && [3306, 3307].includes(port))
    throw new Error(
      "Cấu hình hiện tại còn dùng cổng MySQL. Chuẩn bị cấu hình PostgreSQL riêng theo docs/chuyen-postgresql-vscode.md; không ghi đè/xóa database MySQL.",
    );
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port,
    user: process.env.DB_USER || "chung_cu",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "chung_cu",
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    options: "-c timezone=UTC -c statement_timeout=30000 -c lock_timeout=10000",
    application_name: "chung-cu",
    ...overrides,
  };
}

function prepare(sql) {
  const insert = /^\s*INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\b/i.exec(sql);
  const key = insert && identityColumns[insert[1].toLowerCase()];
  if (key && !/\bRETURNING\b/i.test(sql))
    sql = sql.trimEnd().replace(/;$/, "") + ` RETURNING ${key}`;
  return { text: compileParameters(sql), key };
}
function connection(client) {
  const execute = async (sql, values = []) => {
    const { text, key } = prepare(sql);
    let result = await client.query(
      text,
      values.map((v) => (typeof v === "boolean" ? Number(v) : v)),
    );
    if (Array.isArray(result)) result = result.at(-1);
    if (["INSERT", "UPDATE", "DELETE"].includes(result.command)) {
      const id = key ? result.rows[0]?.[key] : undefined;
      if (id !== undefined && !Number.isSafeInteger(Number(id)))
        throw new Error("Database ID exceeds JavaScript's safe integer range");
      return [
        {
          insertId: id === undefined ? 0 : Number(id),
          affectedRows: result.rowCount,
        },
      ];
    }
    return [result.rows || [], result.fields];
  };
  return {
    native: client,
    query: execute,
    execute,
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    release: () => client.release(),
  };
}
export function createDatabasePool(config = databaseConfig()) {
  const native = new pg.Pool(config);
  native.on("error", (error) =>
    console.error({ code: error.code || "POSTGRES_POOL_ERROR" }),
  );
  const base = connection(native);
  return {
    ...base,
    native,
    getConnection: async () => connection(await native.connect()),
    end: () => native.end(),
  };
}
export const pool = createDatabasePool();
export async function transaction(work, existing = null) {
  if (existing) return work(existing);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
export async function rows(db, sql, values = []) {
  return (await db.execute(sql, values))[0];
}
