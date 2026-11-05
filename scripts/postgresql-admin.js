import pg from "pg";
import { quoteIdentifier } from "../backend/src/lib/postgresql.js";

// CREATE DATABASE cannot run in a transaction. This never resets an existing DB.
export async function ensureDatabase(config, database) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(database))
    throw new Error("Tên database PostgreSQL không hợp lệ.");
  const admin = new pg.Client({
    ...config,
    database: "postgres",
    max: undefined,
  });
  try {
    await admin.connect();
    const result = await admin.query(
      "SELECT 1 FROM pg_catalog.pg_database WHERE datname=$1",
      [database],
    );
    if (!result.rows.length) {
      try {
        await admin.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
      } catch (error) {
        if (error.code !== "42P04") throw error;
      }
    }
  } finally {
    await admin.end();
  }
}
