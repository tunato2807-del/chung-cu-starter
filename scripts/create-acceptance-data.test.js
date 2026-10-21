import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { acceptanceOptions } from "./create-acceptance-data.js";

test("bộ mẫu mặc định dùng database riêng và origin xác định", () => {
  assert.deepEqual(acceptanceOptions([]), {
    database: "chung_cu_nghiem_thu",
    origin: "https://localhost:5173",
    docker: false,
  });
  assert.deepEqual(
    acceptanceOptions([
      "--docker",
      "--database=chung_cu_nghiem_thu_b2",
      "--origin=https://192.168.1.208:5173/",
    ]),
    {
      database: "chung_cu_nghiem_thu_b2",
      origin: "https://192.168.1.208:5173",
      docker: true,
    },
  );
});
test("chặn database thật, test, tên tùy ý và SQL injection trước provisioning", () => {
  for (const name of [
    "chung_cu",
    "chung_cu_test",
    "production",
    "chung_cu_nghiem_thu_",
    "chung_cu_nghiem_thu_x;DROP DATABASE chung_cu",
    "chung_cu_nghiem_thu_../../tmp",
  ])
    assert.throws(
      () => acceptanceOptions([`--database=${name}`]),
      /DB thật\/test/,
    );
});
test("origin QR không chấp nhận script, mật khẩu, query hoặc đường dẫn", () => {
  for (const origin of [
    "javascript:alert(1)",
    "file:///tmp",
    "https://user:secret@example.com",
    "https://example.com/r/code",
    "https://example.com/?secret=abc",
    "https://example.com/#token",
  ])
    assert.throws(() => acceptanceOptions([`--origin=${origin}`]));
  assert.throws(() => acceptanceOptions(["--reset"]));
});
test("CLI từ chối database thật với mã lỗi, không chạy Docker hay migration", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("./create-acceptance-data.js", import.meta.url)),
      "--database=chung_cu",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DB thật\/test/);
  assert.doesNotMatch(result.stdout, /Schema current|Database nghiệm thu/);
});
