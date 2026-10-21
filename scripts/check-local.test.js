import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkLocal, checkApi, localImports } from "./check-local.js";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "chung-cu-check-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of [
    "backend/src",
    "backend/scripts",
    "frontend/src",
    "scripts",
    "database/migrations",
  ])
    await mkdir(path.join(root, directory), { recursive: true });
  for (const file of [
    "package.json",
    "backend/package.json",
    "frontend/package.json",
  ])
    await writeFile(path.join(root, file), '{"type":"module"}');
  for (const file of [
    "backend/src/app.js",
    "backend/scripts/migrate.js",
    "frontend/src/App.jsx",
    "scripts/init.js",
  ])
    await writeFile(path.join(root, file), "export const ready = true;\n");
  await writeFile(
    path.join(root, ".env"),
    "PRIVATE_VALUE_DO_NOT_PRINT=sentinel-secret\n",
  );
  return root;
}
test("báo đúng file service bị thiếu và đuôi .js.txt, giữ kín env", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/src/app.js"),
    'import * as service from "./building-structure.service.js";\n',
  );
  await writeFile(
    path.join(root, "backend/src/building-structure.service.js.txt"),
    "export default {};\n",
  );
  const checks = await checkLocal({ root, checkDependencies: false });
  const missing = checks.find((check) => check.code === "MISSING_IMPORT");
  assert.equal(missing.file, "backend/src/app.js");
  assert.equal(missing.line, 1);
  assert.match(missing.message, /building-structure\.service\.js.*\.txt/);
  assert.doesNotMatch(JSON.stringify(checks), /sentinel-secret/);
  await writeFile(
    path.join(root, "backend/src/building-structure.service.js"),
    "export default {};\n",
  );
  assert.equal(
    (await checkLocal({ root, checkDependencies: false })).filter(
      (check) => check.level === "error",
    ).length,
    0,
  );
});
test("phát hiện migration thiếu, import ngoài dự án và Node cũ", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/src/app.js"),
    'const migration = "018_equipment_qr.sql";\nimport "../../../outside.js";\n',
  );
  const codes = (
    await checkLocal({ root, nodeVersion: "22.11.0", checkDependencies: false })
  )
    .filter((check) => check.level === "error")
    .map((check) => check.code);
  assert.ok(codes.includes("NODE"));
  assert.ok(codes.includes("OUTSIDE_IMPORT"));
  assert.ok(codes.includes("MIGRATION_FILE"));
});
test("dependency chưa cài được báo với hướng dẫn npm ci", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/package.json"),
    '{"dependencies":{"missing-chung-cu-fixture":"1.0.0"}}',
  );
  assert.match(
    (await checkLocal({ root })).find(
      (check) => check.code === "DEPENDENCIES" && check.level === "error",
    ).message,
    /npm ci/,
  );
});
test("đọc import multiline, re-export, CSS, dynamic; bỏ comment", () => {
  const imports = localImports(
    '// import "./absent.js";\n/* import "./absent2.js"; */\nimport {\n value\n} from "./value.js";\nexport * from "./shared.js";\nimport "./style.css";\nconst module = import("./lazy.js");\n',
  );
  assert.deepEqual(
    imports.map((entry) => entry.target),
    ["./value.js", "./shared.js", "./style.css", "./lazy.js"],
  );
});
test("health ok không che ready 503; không đọc nội dung lỗi server", async () => {
  const checks = await checkApi("http://127.0.0.1:3000", async (url) =>
    url.pathname.endsWith("health")
      ? Response.json({ data: { status: "ok" } })
      : Response.json(
          { error: { message: "private-sentinel" } },
          { status: 503 },
        ),
  );
  assert.deepEqual(
    checks.map((check) => check.level),
    ["ok", "error"],
  );
  assert.doesNotMatch(JSON.stringify(checks), /private-sentinel/);
  await assert.rejects(checkApi("http://example.com"), /loopback/);
  await assert.rejects(checkApi("http://127.0.0.1:3000/private"), /loopback/);
  assert.ok(
    (
      await checkApi("http://127.0.0.1:3000", async () => {
        throw new Error("offline");
      })
    ).every((check) => check.level === "error"),
  );
});
