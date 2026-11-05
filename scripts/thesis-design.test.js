import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { configureThesis } from "./configure-thesis-mysql.js";
import { splitSql } from "../backend/src/lib/sql-script.js";
import { historyRecord } from "../backend/src/lib/history.js";
import { copyOptions } from "./copy-thesis-data.js";

test("new thesis config preserves MySQL credentials and signing key without replacing source/output", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "thesis-config-"));
  try {
    const source = path.join(dir, ".env.mysql"),
      output = path.join(dir, ".env.thesis");
    const original =
      "DB_ENGINE=mysql\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=synthetic-test-password\nDB_NAME=chung_cu\nJWT_SECRET=synthetic-signing-key-only\nCOOKIE_SECURE=true\n";
    await writeFile(source, original);
    await configureThesis(source, output);
    const next = parseEnv(await readFile(output, "utf8"));
    assert.equal(next.DB_NAME, "chung_cu_do_an");
    assert.equal(next.DB_PASSWORD, "synthetic-test-password");
    assert.equal(next.JWT_SECRET, "synthetic-signing-key-only");
    assert.equal(next.COOKIE_SECURE, "true");
    assert.equal(await readFile(source, "utf8"), original);
    await assert.rejects(configureThesis(source, output), { code: "EEXIST" });
    await assert.rejects(configureThesis(source, source));
    await writeFile(source, "DB_ENGINE=postgresql\n");
    await assert.rejects(configureThesis(source, path.join(dir, "other")));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("SQL script parser keeps literal semicolons and JSON-schema quotes intact", () => {
  const sql =
    "-- ignore ;\nCREATE TABLE t(id INT, note VARCHAR(20) DEFAULT 'a;b');\nINSERT INTO t VALUES (1,'c;d'); /* ; */ SELECT `semi;colon`;";
  const statements = splitSql(sql);
  assert.equal(statements.length, 3);
  assert.match(statements[0], /'a;b'/);
  assert.match(statements[1], /'c;d'/);
  assert.match(statements[2], /`semi;colon`/);
});
test("serialized audit snapshots preserve exact JSON integers while original IDs remain separate", () => {
  const record = historyRecord(
    "lich_su_bao_tri",
    {
      ma_lich_su: 25,
      ma_thiet_bi: 1,
      ma_nguoi_thuc_hien: 1,
      su_kien: "TAO",
      ghi_chu: "Giữ snapshot",
      du_lieu: '{"amount":9007199254740993}',
    },
    true,
  );
  assert.ok(record.chi_tiet.includes("9007199254740993"));
  assert.equal(record.ma_goc, 25);
  assert.equal(record.ma_nhat_ky, "205");
});
test("copy requires explicit source and rejects duplicate options, resets and identifier injection", () => {
  assert.throws(() => copyOptions([]));
  assert.throws(() => copyOptions(["--source-env=old", "--reset"]));
  assert.throws(() =>
    copyOptions(["--source-env=old", "--target-db=a;DROP TABLE x"]),
  );
  assert.throws(() => copyOptions(["--source-env=old", "--source-env=other"]));
  assert.equal(
    copyOptions(["--source-env=.env.mysql", "--target-db=chung_cu_do_an"])[
      "target-db"
    ],
    "chung_cu_do_an",
  );
});
