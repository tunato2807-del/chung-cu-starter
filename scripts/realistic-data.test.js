import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { profileOptions } from "./create-acceptance-data.js";
import {
  plan,
  exceptions,
  personName,
  phoneNumber,
  monthAt,
  monthEnd,
  shiftDay,
  eventTime,
  bookingSlot,
} from "./realistic-data-plan.js";

test("large synthetic data remains isolated and respects the chosen frontend origin", () => {
  assert.equal(
    profileOptions([], "realistic").database,
    "chung_cu_nghiem_thu_quymo",
  );
  assert.equal(profileOptions([]).database, "chung_cu_nghiem_thu_doan");
  assert.deepEqual(
    profileOptions(
      [
        "--origin=https://192.168.1.208:5173",
        "--database=chung_cu_nghiem_thu_quymo2",
      ],
      "realistic",
    ),
    {
      database: "chung_cu_nghiem_thu_quymo2",
      origin: "https://192.168.1.208:5173",
      docker: false,
    },
  );
  assert.throws(() => profileOptions([], "../arbitrary-script"));
});

test("200 homes and 400 residents have natural synthetic names and unique telephone identifiers", () => {
  const homes = plan.blocks * plan.floorsPerBlock * plan.homesPerFloor;
  assert.equal(homes, 200);
  const names = Array.from({ length: homes * 2 }, (_, i) => personName(i));
  const phones = names.map((_, i) => phoneNumber(i));
  assert.equal(new Set(names).size, 400);
  assert.equal(new Set(phones).size, 400);
  assert.ok(
    Array.from(
      { length: homes },
      (_, i) =>
        names[i * 2].split(" ").slice(1).join(" ") !==
        names[i * 2 + 1].split(" ").slice(1).join(" "),
    ).every(Boolean),
  );
  assert.ok(names.every((name) => !/demo|test|nghiệm thu|NT ·|\d/i.test(name)));
  assert.ok(phones.every((phone) => /^0\d{9}$/.test(phone)));
  assert.throws(() => personName(-1));
  assert.throws(() => personName(600));
});

test("historical dates use the Vietnamese calendar, including leap years and year boundaries", () => {
  assert.equal(monthAt("2026-01-31", -1), "2025-12");
  assert.equal(monthEnd("2024-02"), "2024-02-29");
  assert.equal(monthEnd("2026-02"), "2026-02-28");
  assert.equal(shiftDay("2026-01-01", -1), "2025-12-31");
  assert.equal(
    eventTime("2026-11-06", 0, Date.parse("2026-11-06T01:00:00Z")),
    "2026-11-05 17:00:00",
  );
  assert.equal(
    eventTime("2026-11-06", 20, Date.parse("2026-11-05T17:02:00Z")),
    "2026-11-05 17:01:59",
  );
});

test("160 bookings have separate time slots, stay within opening hours and cross months correctly", () => {
  const slots = Array.from({ length: plan.bookings }, (_, i) =>
    bookingSlot(i, "2026-12-31"),
  );
  assert.equal(
    new Set(slots.map((s) => `${s.facility}|${s.date}|${s.start}`)).size,
    160,
  );
  assert.ok(
    slots.every(
      (s) =>
        s.date > "2026-12-31" &&
        s.date <= "2027-01-05" &&
        s.start >= "06:00" &&
        s.end <= "22:00",
    ),
  );
});

test("catalogue exceptions are explicit instead of fabricated migration, fee and fund rows", () => {
  assert.deepEqual(Object.keys(exceptions).sort(), [
    "cau_hinh_phi",
    "khoi_toa_nha",
    "loai_phi",
    "quy_tai_chinh",
    "schema_migrations",
    "tien_ich",
  ]);
  assert.equal(plan.blocks * plan.floorsPerBlock, 100);
  assert.ok(Object.values(exceptions).every((s) => s.length > 20));
});

test("large-data CLI rejects production databases, resets and script origins before connecting", () => {
  for (const arg of [
    "--database=chung_cu",
    "--database=chung_cu_do_an",
    "--database=chung_cu_test",
    "--reset",
    "--origin=javascript:alert(1)",
  ]) {
    const result = spawnSync(
      process.execPath,
      ["scripts/create-realistic-data.js", arg],
      { cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 10000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /Schema current|Database nghiệm thu|ECONNREFUSED/,
    );
  }
});
