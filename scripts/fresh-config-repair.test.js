import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  readdir,
  rm,
  stat,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { freshConfig, repairFresh } from "./init-fresh-local.js";
import { freshDataOptions } from "./create-fresh-data.js";
import { configReport } from "./check-fresh-config.js";

const cleanEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/^(DB_|JWT_SECRET$|FRESH_INSTALL$|PORT$|COOKIE_SECURE$|MYSQL_ROOT_PASSWORD$)/.test(
        key,
      ),
  ),
);

test("CLI reproduces native dotenv precedence, repairs the truncated file and diagnoses inherited JWT without exposing secrets", async (t) => {
  const { directory, file } = await fixture(
    t,
    freshConfig()
      .contents.replace(/^JWT_SECRET=.*\n/m, "")
      .replace('DB_PASSWORD=""', 'DB_PASSWORD="fake-password-only"'),
  );
  const scripts = path.join(directory, "scripts");
  await mkdir(scripts);
  await writeFile(path.join(directory, "package.json"), '{"type":"module"}');
  for (const name of [
    "init-fresh-local.js",
    "fresh-config-status.js",
    "check-fresh-config.js",
    "create-fresh-data.js",
    "create-acceptance-data.js",
  ])
    await copyFile(
      new URL(`./${name}`, import.meta.url),
      path.join(scripts, name),
    );
  const run = (args, extra = {}) =>
    spawnSync(process.execPath, args, {
      cwd: directory,
      env: { ...cleanEnvironment, ...extra },
      encoding: "utf8",
      timeout: 10000,
    });
  const failed = run(["--env-file=.env", "scripts/create-fresh-data.js"]);
  assert.ifError(failed.error);
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /JWT_SECRET/);
  assert.match(failed.stderr, /config:check/);
  assert.doesNotMatch(failed.stderr, /ECONNREFUSED|fake-password-only/);
  const repair = run(["scripts/init-fresh-local.js", "--repair"]);
  assert.ifError(repair.error);
  assert.equal(repair.status, 0);
  const parsed = parseEnv(await readFile(file, "utf8"));
  const checked = run(["--env-file=.env", "scripts/check-fresh-config.js"]);
  assert.ifError(checked.error);
  assert.equal(checked.status, 0);
  assert.match(checked.stdout, /\[OK\]/);
  const overridden = run(["--env-file=.env", "scripts/check-fresh-config.js"], {
    JWT_SECRET: "old-inherited-key",
  });
  assert.equal(overridden.status, 1);
  assert.match(overridden.stderr, /ENV_OVERRIDE: JWT_SECRET/);
  assert.match(overridden.stderr, /Remove-Item Env:JWT_SECRET/);
  const output =
    repair.stdout +
    repair.stderr +
    checked.stdout +
    checked.stderr +
    overridden.stdout +
    overridden.stderr;
  assert.ok(!output.includes(parsed.JWT_SECRET));
  assert.ok(!output.includes("fake-password-only"));
  assert.ok(!output.includes("old-inherited-key"));
});

test("backend reports the current fresh-config recovery command before connecting to MySQL", () => {
  const run = spawnSync(process.execPath, ["backend/src/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...cleanEnvironment,
      DB_ENGINE: "mysql",
      DB_HOST: "127.0.0.1",
      DB_PORT: "1",
      DB_NAME: "chung_cu_test",
      DB_PASSWORD: "fake-connect-password",
      JWT_SECRET: "invalid-fixture-key",
    },
    encoding: "utf8",
    timeout: 10000,
  });
  assert.ifError(run.error);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /config:check/);
  assert.doesNotMatch(
    run.stderr,
    /init:local|fake-connect-password|invalid-fixture-key|ECONNREFUSED/,
  );
});

async function fixture(t, content) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fresh-repair-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, ".env");
  if (content !== undefined) await writeFile(file, content);
  return { directory, file };
}

test("repair restores missing fresh fields, preserves MySQL connection values and backs up exact original bytes", async (t) => {
  const source =
    '# local fixture only\r\nDB_HOST=127.0.0.1\r\nDB_PORT=3306\r\nDB_USER=root\r\nDB_PASSWORD="fake#password \' \\ path"\r\n';
  const { file } = await fixture(t, source);
  const original = parseEnv(source);
  const result = await repairFresh(file);
  const repaired = parseEnv(await readFile(file, "utf8"));
  assert.equal(result.changed, true);
  assert.equal(await readFile(result.backup, "utf8"), source);
  for (const key of ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD"])
    assert.equal(repaired[key], original[key]);
  assert.equal(repaired.FRESH_INSTALL, "1");
  assert.equal(repaired.DB_ENGINE, "mysql");
  assert.ok(repaired.JWT_SECRET.length >= 32);
  assert.ok(
    freshDataOptions([], repaired)[0].startsWith(
      "--database=chung_cu_nghiem_thu_moi",
    ),
  );
  if (process.platform !== "win32")
    assert.equal((await stat(result.backup)).mode & 0o777, 0o600);
});

test("repair keeps a valid current database and key, changes an invalid old target, and then becomes a no-op", async (t) => {
  const config = freshConfig();
  const { directory, file } = await fixture(
    t,
    config.contents.replace("FRESH_INSTALL=1", "FRESH_INSTALL=0"),
  );
  const result = await repairFresh(file);
  const fixed = parseEnv(await readFile(file, "utf8"));
  assert.equal(fixed.DB_NAME, config.database);
  assert.equal(fixed.JWT_SECRET, parseEnv(config.contents).JWT_SECRET);
  assert.equal(result.changed, true);
  const before = await readFile(file, "utf8"),
    files = await readdir(directory);
  assert.equal((await repairFresh(file)).changed, false);
  assert.equal(await readFile(file, "utf8"), before);
  assert.deepEqual(await readdir(directory), files);
  const other = await fixture(
    t,
    "DB_ENGINE=mysql\nDB_NAME=chung_cu\nJWT_SECRET=short\nDB_PASSWORD=fixture-only\n",
  );
  await repairFresh(other.file);
  const newEnv = parseEnv(await readFile(other.file, "utf8"));
  assert.notEqual(newEnv.DB_NAME, "chung_cu");
  assert.equal(newEnv.DB_PASSWORD, "fixture-only");
  assert.ok(newEnv.JWT_SECRET.length >= 32);
});

test("repair fills empty defaults, supports a missing file, and refuses a different database engine", async (t) => {
  const missing = await fixture(t);
  assert.equal((await repairFresh(missing.file)).backup, null);
  assert.equal(
    configReport(
      await readFile(missing.file, "utf8"),
      parseEnv(await readFile(missing.file, "utf8")),
    ).invalidFileFields.length,
    0,
  );
  const blank = await fixture(
    t,
    "DB_ENGINE=\nDB_HOST=\nDB_PORT=\nDB_USER=\nPORT=\n",
  );
  await repairFresh(blank.file);
  const repaired = parseEnv(await readFile(blank.file, "utf8"));
  assert.equal(repaired.DB_ENGINE, "mysql");
  assert.equal(repaired.DB_PORT, "3306");
  assert.equal(repaired.DB_USER, "root");
  assert.equal(repaired.PORT, "3000");
  const wrong = await fixture(
    t,
    "DB_ENGINE=postgres\nDB_PASSWORD=fixture-only\n",
  );
  await assert.rejects(repairFresh(wrong.file), {
    code: "MYSQL_CONFIG_REQUIRED",
  });
  assert.equal(
    await readFile(wrong.file, "utf8"),
    "DB_ENGINE=postgres\nDB_PASSWORD=fixture-only\n",
  );
});

test("diagnostics identify process overrides and expose only field names and key length", () => {
  const config = freshConfig(),
    parsed = parseEnv(config.contents);
  const report = configReport(config.contents, {
    ...parsed,
    JWT_SECRET: "old-short-key",
    DB_NAME: "chung_cu",
    DB_PASSWORD: "another-fake-secret",
  });
  assert.deepEqual(report.overrides.sort(), [
    "DB_NAME",
    "DB_PASSWORD",
    "JWT_SECRET",
  ]);
  assert.deepEqual(report.invalidFileFields, []);
  assert.deepEqual(report.invalidEffectiveFields.sort(), [
    "DB_NAME",
    "JWT_SECRET",
  ]);
  assert.equal(report.jwtLength, parsed.JWT_SECRET.length);
  const output = JSON.stringify(report);
  assert.ok(!output.includes(parsed.JWT_SECRET));
  assert.ok(!output.includes("another-fake-secret"));
  assert.ok(!output.includes("old-short-key"));
});

test("fresh data creation rejects missing and whitespace-only JWT before provisioning", () => {
  const env = parseEnv(freshConfig().contents);
  for (const JWT_SECRET of [undefined, "short", " ".repeat(40)])
    assert.throws(() => freshDataOptions([], { ...env, JWT_SECRET }), {
      code: "FRESH_CONFIG_REQUIRED",
    });
});

test("repair preserves quoted and multiline values without adding environment assignments", async (t) => {
  const source =
    "DB_PASSWORD='fixture\"quoted#password'\nCUSTOM_VALUE='line one\nDB_NAME=not-an-assignment\nline two'\n";
  const { file } = await fixture(t, source);
  const before = parseEnv(source);
  await repairFresh(file);
  const after = parseEnv(await readFile(file, "utf8"));
  assert.equal(after.DB_PASSWORD, before.DB_PASSWORD);
  assert.equal(after.CUSTOM_VALUE, before.CUSTOM_VALUE);
  assert.notEqual(after.DB_NAME, "not-an-assignment");
});
