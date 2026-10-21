import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "chung_cu",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "chung_cu",
  connectionLimit: 10,
  timezone: "Z",
  charset: "utf8mb4",
  dateStrings: true,
});
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
