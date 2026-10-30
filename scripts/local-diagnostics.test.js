import test from "node:test";
import assert from "node:assert/strict";
import { acceptanceDatabase } from "./start-acceptance.js";
import {
  credentialFile,
  databaseSummary,
  diagnosticOptions,
} from "./diagnose-local.js";

test("acceptance startup selects an explicit sample DB even in a new terminal", () => {
  assert.equal(acceptanceDatabase([]), "chung_cu_nghiem_thu");
  assert.equal(
    acceptanceDatabase(["chung_cu_nghiem_thu_b2"]),
    "chung_cu_nghiem_thu_b2",
  );
  for (const args of [
    ["chung_cu"],
    ["../other"],
    ["chung_cu_nghiem_thu", "extra"],
  ])
    assert.throws(() => acceptanceDatabase(args));
});

test("diagnostics refuse remote API requests and malformed QR input", () => {
  assert.equal(diagnosticOptions([]).api, "http://127.0.0.1:3000");
  for (const api of [
    "https://example.com",
    "http://127.0.0.1/api",
    "file:///tmp/log",
    "http://user:pass@localhost",
  ])
    assert.throws(() => diagnosticOptions(["--api", api]));
  assert.throws(() => diagnosticOptions(["--unknown", "value"]));
  assert.throws(() => diagnosticOptions(["--api"]));
  assert.throws(() => diagnosticOptions(["--qr", "javascript:alert(1)"]));
  const token = "ddbf627e-2b1a-4ab9-92a3-657de51fdab9";
  assert.equal(
    diagnosticOptions(["--qr", `http://192.168.1.10:5173/r/${token}`]).token,
    token,
  );
});

test("credential paths are specific to the selected DB, with no path traversal", () => {
  assert.equal(credentialFile("chung_cu"), "backend/.demo-credentials");
  assert.equal(
    credentialFile("chung_cu_nghiem_thu"),
    "backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md",
  );
  assert.equal(credentialFile("../private"), null);
});

test("database diagnostics only SELECT aggregate status and bind QR tokens", async () => {
  const calls = [];
  const db = {
    async query(sql) {
      calls.push({ sql });
      return [[{ total: 1, available: 1, temporarily_locked: 0, active: 1 }]];
    },
    async execute(sql, parameters) {
      calls.push({ sql, parameters });
      return [[{ found: 1, active: 1 }]];
    },
  };
  const token = "test-token-with-quote'";
  const result = await databaseSummary(db, "db`with`quotes", token);
  assert.deepEqual(result.match, { found: 1, active: 1 });
  for (const { sql } of calls) {
    assert.match(sql, /^SELECT\s/);
    assert.doesNotMatch(sql, /mat_khau|password|ho_va_ten|so_dien_thoai/i);
    assert.doesNotMatch(sql, /test-token/);
    assert.match(sql, /`db``with``quotes`\./);
  }
  assert.deepEqual(calls.at(-1).parameters, [token]);
});
