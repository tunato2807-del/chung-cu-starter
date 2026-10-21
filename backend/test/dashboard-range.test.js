import test from "node:test";
import assert from "node:assert/strict";
import { statisticsRange } from "../src/modules/dashboard/dashboard-statistics.service.js";

test("dashboard calendar ranges cover leap days, Monday weeks, quarters and years without timezone drift", () => {
  for (const [khoang, ngay, start, end, unit, length] of [
    ["NGAY", "2024-02-29", "2024-02-29", "2024-02-29", "GIO", 24],
    ["TUAN", "2023-01-01", "2022-12-26", "2023-01-01", "NGAY", 7],
    ["TUAN", "2024-01-01", "2024-01-01", "2024-01-07", "NGAY", 7],
    ["THANG", "2024-02-15", "2024-02-01", "2024-02-29", "NGAY", 29],
    ["THANG", "2023-02-15", "2023-02-01", "2023-02-28", "NGAY", 28],
    ["QUY", "2024-03-31", "2024-01-01", "2024-03-31", "THANG", 3],
    ["QUY", "2024-04-01", "2024-04-01", "2024-06-30", "THANG", 3],
    ["QUY", "2199-12-31", "2199-10-01", "2199-12-31", "THANG", 3],
    ["NAM", "2024-12-31", "2024-01-01", "2024-12-31", "THANG", 12],
  ]) {
    const r = statisticsRange({ khoang, ngay });
    assert.deepEqual(
      [r.tu_ngay, r.den_ngay, r.don_vi, r.diem.length],
      [start, end, unit, length],
    );
    assert.equal(new Set(r.diem.map((p) => p.moc)).size, length);
  }
  assert.equal(statisticsRange({}, "2024-02-29").ngay, "2024-02-29");
  for (const query of [
    { khoang: "NOPE" },
    { khoang: ["NAM"] },
    { ngay: "2023-02-29" },
    { ngay: "2024-02-31" },
    { ngay: "2200-01-01" },
    { ngay: "2024-01-01' OR 1=1" },
    { ngay: ["2024-01-01"] },
  ])
    assert.throws(
      () => statisticsRange(query),
      (e) => e.status === 422,
    );
});
