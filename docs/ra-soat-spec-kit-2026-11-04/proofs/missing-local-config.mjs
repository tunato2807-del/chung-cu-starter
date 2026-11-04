import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const absent = "/tmp/chung-cu-spec-review-intentionally-missing.env";
await assert.rejects(access(absent));
const env = { ...process.env };
for (const key of Object.keys(env))
  if (/^(DB_|JWT_SECRET$|MYSQL_ROOT_PASSWORD$)/.test(key)) delete env[key];
// Only load the pool configuration in a child: no getConnection/query/execute.
const defaults = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    "const {pool}=await import('./backend/src/lib/db.js'); console.log(JSON.stringify({port:pool.pool.config.connectionConfig.port})); await pool.end();",
  ],
  { cwd: root, env, encoding: "utf8", timeout: 10000 },
);
assert.equal(defaults.status, 0);
assert.equal(JSON.parse(defaults.stdout).port, 3307);
const startup = spawnSync(
  process.execPath,
  [`--env-file-if-exists=${absent}`, "backend/src/server.js"],
  { cwd: root, env, encoding: "utf8", timeout: 10000 },
);
assert.equal(startup.status, 1);
assert.match(startup.stderr, /JWT_SECRET.*at least 32|JWT_SECRET.*contain/i);
assert.match(startup.stderr, /init:local/);
console.log(
  JSON.stringify({
    evidenceFor: "d226254",
    readRealEnvFile: false,
    databaseConnected: false,
    fallbackPort: 3307,
    startupExit: startup.status,
    messageSuggestsInitLocal: true,
    migrationWasNotRun: true,
  }),
);
