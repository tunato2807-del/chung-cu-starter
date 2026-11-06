import mysql from "mysql2/promise";
export async function ensureDatabase(
  config,
  database,
  { newOnly = false } = {},
) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(database))
    throw new Error("Invalid database name");
  const { connectionLimit, ...base } = config;
  const useRoot = !!process.env.MYSQL_ROOT_PASSWORD && config.user !== "root";
  const db = await mysql.createConnection({
    ...base,
    database: undefined,
    ...(useRoot
      ? { user: "root", password: process.env.MYSQL_ROOT_PASSWORD }
      : {}),
  });
  try {
    await db.query(
      `CREATE DATABASE ${newOnly ? "" : "IF NOT EXISTS "}${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    if (useRoot)
      await db.query(
        `GRANT ALL ON ${mysql.escapeId(database)}.* TO ${mysql.escape(config.user)}@'%'`,
      );
  } finally {
    await db.end();
  }
}
