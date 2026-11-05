import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { configurePostgresql } from "./configure-postgresql.js";
import { transferOptions, canonicalValue } from "./migrate-mysql-postgresql.js";

test("PostgreSQL config keeps signing key and leaves MySQL config intact; never overwrites output", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "cc-pg-config-"));
  try {
    const source = path.join(dir, ".env.mysql"),
      output = path.join(dir, ".env.postgresql");
    const original =
      "DB_PORT=3306\nDB_PASSWORD=old-synthetic-test-only\nDB_NAME=chung_cu_nghiem_thu\nJWT_SECRET=synthetic-signing-key-never-printed\nCOOKIE_SECURE=true\n";
    await writeFile(source, original);
    await configurePostgresql(source, output);
    const next = parseEnv(await readFile(output, "utf8"));
    assert.equal(next.DB_ENGINE, "postgresql");
    assert.equal(next.DB_PORT, "5432");
    assert.equal(next.DB_NAME, "chung_cu_nghiem_thu");
    assert.equal(next.JWT_SECRET, "synthetic-signing-key-never-printed");
    assert.equal(next.COOKIE_SECURE, "true");
    assert.notEqual(next.DB_PASSWORD, "old-synthetic-test-only");
    assert.equal(await readFile(source, "utf8"), original);
    await assert.rejects(configurePostgresql(source, output), {
      code: "EEXIST",
    });
    await assert.rejects(configurePostgresql(source, source));
    assert.equal(
      parseEnv(await readFile(output, "utf8")).DB_PASSWORD,
      next.DB_PASSWORD,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("transfer requires separate source config and rejects malformed database identifiers", () => {
  assert.throws(() => transferOptions([]));
  assert.throws(() =>
    transferOptions(["--source-env=old", "--target-db=live;DROP TABLE x"]),
  );
  assert.throws(() => transferOptions(["--source-env=old", "--reset"]));
  assert.throws(() =>
    transferOptions(["--source-env=old", "--source-env=other"]),
  );
  assert.equal(
    transferOptions(["--source-env=.env.mysql", "--target-db=chung_cu"])[
      "target-db"
    ],
    "chung_cu",
  );
});

test("verification normalizes fractional timestamps without losing numeric text or binary bytes", () => {
  assert.equal(
    canonicalValue("2026-10-01 12:01:02.123400", "datetime"),
    canonicalValue("2026-10-01 12:01:02.1234", "datetime"),
  );
  assert.equal(
    canonicalValue("9007199254740991.25", "decimal"),
    "9007199254740991.25",
  );
  assert.deepEqual(canonicalValue(Buffer.from([0, 255, 128]), "mediumblob"), [
    "bytes",
    "00ff80",
  ]);
  assert.throws(() => canonicalValue("0000-00-00 00:00:00", "datetime"));
});
