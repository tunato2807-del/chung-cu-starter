import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
const testDatabase = "chung_cu_test";
process.env.DB_NAME = testDatabase;
const env = { ...process.env, DB_NAME: testDatabase };

function runNode(args) {
  // Calling Node directly supports native Windows Node and Linux without
  // depending on npm.cmd being executable through spawnSync(shell:false).
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw Object.assign(new Error("Test subprocess failed."), {
      exitCode: result.status || 1,
    });
}

async function ensureTestDatabase() {
  const { databaseConfig } = await import("../backend/src/lib/db.js");
  const admin = new pg.Client(databaseConfig({ database: "postgres" }));
  try {
    await admin.connect();
    const existing = await admin.query(
      "SELECT datname FROM pg_database WHERE datname=$1",
      [testDatabase],
    );
    // Never reset a database. Only the fixed isolated test name is provisioned.
    if (!existing.rows.length)
      await admin.query('CREATE DATABASE "chung_cu_test"');
  } finally {
    await admin.end();
  }
}

try {
  await ensureTestDatabase();
  runNode(["backend/scripts/migrate.js"]);
  const { installParentFixtures } = await import("./test-db-fixtures.js");
  const { pool } = await import("../backend/src/lib/db.js");
  try {
    await installParentFixtures();
  } finally {
    await pool.end();
  }

  const args = process.argv.slice(2);
  if (args[0] === "e2e")
    runNode(["node_modules/@playwright/test/cli.js", "test", ...args.slice(1)]);
  else {
    const names = (await readdir(new URL("../backend/test/", import.meta.url)))
      .filter((name) => name.endsWith(".test.js"))
      .sort();
    runNode([
      "--test",
      "--test-concurrency=1",
      ...args,
      ...names.map((name) => `backend/test/${name}`),
    ]);
  }
} catch (error) {
  if (!error.exitCode) console.error(error.message);
  process.exitCode = error.exitCode || 1;
}
