import mysql from "mysql2/promise";
export function databaseConfig(overrides = {}) {
  if (process.env.DB_ENGINE && process.env.DB_ENGINE !== "mysql")
    throw new Error(
      "Bản đồ án dùng MySQL. Xem docs/csdl-do-an-mysql.md; giữ cấu hình/database cũ và dùng database đích mới.",
    );
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "chung_cu",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "chung_cu_do_an",
    connectionLimit: 10,
    connectTimeout: 5000,
    timezone: "Z",
    charset: "utf8mb4",
    dateStrings: true,
    ...overrides,
  };
}
export const pool = mysql.createPool(databaseConfig());

export async function transaction(work, connection = null) {
  // Batch imports reuse the same domain operations inside one outer transaction.
  if (connection) return work(connection);
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
  const [result] = await db.execute(sql, values);
  return result;
}
