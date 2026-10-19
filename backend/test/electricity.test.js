import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  electricityConfig,
  electricityLines,
} from "../src/modules/billing/billing.electricity.js";
import { scaled, today } from "../src/modules/billing/billing.validation.js";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

const tiers = [50, 100, 200, 300, 400, null].map((upper, i) => ({
  den_kwh: upper,
  don_gia: String([1984, 2050, 2380, 2998, 3350, 3460][i]),
}));
const config = { cach_tinh: "BAC_THANG", thue_gtgt: "8", bac_dien: tiers };
const rate = { ...config, ma_cau_hinh_phi: 1, don_gia: "0" };

test("progressive electricity thresholds, fractional kWh and tax rounding", () => {
  for (const [used, base, total] of [
    ["0", "0", "0"],
    ["50", "99200", "107136"],
    ["50.001", "99202", "107138"],
    ["100", "201700", "217836"],
    ["200", "439700", "474876"],
    ["300", "739500", "798660"],
    ["400", "1074500", "1160460"],
    ["401", "1077960", "1164197"],
    ["450", "1247500", "1347300"],
  ]) {
    const lines = electricityLines(rate, scaled(used, 3, 9), {}, 1);
    const energy = lines.filter((l) => l.don_vi_tinh === "kWh");
    assert.equal(
      energy.reduce((n, l) => n + scaled(l.so_luong, 3, 9), 0n),
      scaled(used, 3, 9),
    );
    assert.equal(
      energy.reduce((n, l) => n + BigInt(l.thanh_tien), 0n).toString(),
      base,
    );
    assert.equal(
      lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n).toString(),
      total,
    );
    assert.equal(lines.at(-1).du_lieu_nguon.tien_truoc_thue, base);
  }
  const noVat = electricityLines({ ...rate, thue_gtgt: "0" }, 300000n, {}, 1);
  assert.equal(noVat.length, 4);
  const flat = electricityLines(
    {
      cach_tinh: "DON_GIA",
      bac_dien: null,
      don_gia: "2000",
      thue_gtgt: "10",
      ma_cau_hinh_phi: 1,
    },
    300000n,
    {},
    1,
  );
  assert.equal(flat[0].thanh_tien, "600000");
  assert.equal(flat[1].thanh_tien, "60000");
});

test("reject malformed tiers, negative prices, incomplete ranges and invalid VAT", () => {
  for (const bad of [
    { ...config, thue_gtgt: "100.01" },
    { ...config, thue_gtgt: "-1" },
    { ...config, bac_dien: [] },
    { ...config, bac_dien: tiers.slice(0, -1) },
    {
      ...config,
      bac_dien: [
        { den_kwh: 50, don_gia: "1" },
        { den_kwh: 50, don_gia: "1" },
        { den_kwh: null, don_gia: "1" },
      ],
    },
    {
      ...config,
      bac_dien: [
        { den_kwh: 0.5, don_gia: "1" },
        { den_kwh: null, don_gia: "1" },
      ],
    },
    {
      ...config,
      bac_dien: [
        { den_kwh: 50, don_gia: "-1" },
        { den_kwh: null, don_gia: "1" },
      ],
    },
    { ...config, bac_dien: Array(13).fill({ den_kwh: null, don_gia: "1" }) },
  ])
    assert.throws(() => electricityConfig(bad, "TIEN_DIEN"), { status: 422 });
  assert.throws(() => electricityConfig(config, "TIEN_NUOC"), { status: 422 });
  assert.throws(
    () =>
      electricityConfig({ cach_tinh: "DON_GIA", bac_dien: tiers }, "TIEN_DIEN"),
    { status: 422 },
  );
  assert.deepEqual(electricityConfig({}, "TIEN_DIEN"), {
    cach_tinh: "DON_GIA",
    thue_gtgt: "0.00",
    bac_dien: null,
  });
});

test("MySQL electricity: legacy flat drafts, tier snapshots, effective dates, resident details and source protection", async () => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    suffix = randomBytes(5).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    prices = [];
  let profile;
  async function req(path, method = "GET", body, cookie) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "X-App-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  try {
    const cookies = [];
    for (const role of ["QUAN_TRI_VIEN", "CU_DAN"]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const u = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      users.push(u.insertId);
      const login = await req("/xac_thuc/dang_nhap", "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      cookies.push(login.cookie);
    }
    const [admin, resident] = cookies;
    for (let i = 0; i < 2; i++) {
      const a = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,1,70,0)",
        [`DIEN-${suffix}-${i}`, "DIEN"],
      );
      apartments.push(a.insertId);
    }
    const person = await req(
      "/cu_dan",
      "POST",
      {
        ho_va_ten: suffix,
        so_dien_thoai: "0901234567",
        ma_nguoi_dung: users[1],
        ma_can_ho: apartments[1],
        quan_he: "CHU_HO",
        ngay: "2020-01-01",
      },
      admin,
    );
    assert.equal(person.status, 201);
    profile = person.body.data.ma_cu_dan;
    assert.equal(
      (
        await req(
          "/cau_hinh_phi",
          "POST",
          { loai_phi: "TIEN_DIEN", ...config, tu_ngay: "2026-01-01" },
          resident,
        )
      ).status,
      403,
    );
    async function addRate(body) {
      const r = await req(
        "/cau_hinh_phi",
        "POST",
        { loai_phi: "TIEN_DIEN", ...body },
        admin,
      );
      assert.equal(r.status, 201, JSON.stringify(r.body));
      prices.push(r.body.data.ma_cau_hinh_phi);
      return prices.at(-1);
    }
    await addRate({ don_gia: "2000", tu_ngay: "2020-01-01" });
    async function draft(index, month, cutoff, used) {
      const m = await req(
        "/chi_so_dich_vu",
        "PUT",
        {
          ma_can_ho: apartments[index],
          loai_dich_vu: "DIEN",
          ky_thanh_toan: month,
          ngay_chot: cutoff,
          chi_so_cu: "100",
          chi_so_moi: String(100 + used),
          ky_dau: true,
        },
        admin,
      );
      assert.equal(m.status, 200);
      const d = await req(
        "/hoa_don/lap",
        "POST",
        {
          ma_can_ho: apartments[index],
          ky_thanh_toan: month,
          ngay_chot_phi: cutoff,
          tinh_dien: true,
          tinh_nuoc: false,
          tinh_xe: false,
        },
        admin,
      );
      assert.equal(d.status, 201);
      return d.body.data.ma_hoa_don;
    }
    async function get(id, cookie = admin) {
      return (await req(`/hoa_don/${id}`, "GET", null, cookie)).body.data;
    }
    async function action(id, name, body = {}) {
      const bill = await get(id);
      return req(
        `/hoa_don/${id}/${name}`,
        "POST",
        { phien_ban: bill.phien_ban, ...body },
        admin,
      );
    }
    const oldId = await draft(0, "2025-09", "2025-09-30", 300);
    const legacy = await get(oldId);
    assert.equal(legacy.tong_tien, "600000");
    assert.equal(legacy.lines.length, 1);
    const tierId = await addRate({ ...config, tu_ngay: "2026-01-01" });
    // Closing the old interval after its cutoff must not invalidate its saved draft.
    assert.equal((await action(oldId, "duyet")).status, 200);
    const id = await draft(1, "2026-09", "2026-09-30", 300);
    const bill = await get(id);
    assert.equal(bill.tong_tien, "798660");
    assert.deepEqual(bill.loi_du_lieu, []);
    assert.equal(bill.lines.length, 5);
    assert.deepEqual(
      bill.lines.map((l) => l.thanh_tien),
      ["99200", "102500", "238000", "299800", "59160"],
    );
    assert.ok(bill.lines.every((l) => l.ma_cau_hinh_phi === tierId));
    assert.equal(
      (
        await req(
          "/cau_hinh_phi",
          "POST",
          { ...config, loai_phi: "TIEN_DIEN", tu_ngay: "2026-08-01" },
          admin,
        )
      ).status,
      409,
    );
    await addRate({ ...config, thue_gtgt: "10", tu_ngay: "2027-01-01" });
    assert.equal((await action(id, "duyet")).status, 200);
    assert.equal(
      (
        await action(id, "gui", {
          han_thanh_toan: today(),
          ma_ngan_hang: "970436",
          so_tai_khoan: "1234567890",
          ten_nguoi_nhan: "BQL DEMO",
        })
      ).status,
      200,
    );
    const publicBill = (
      await req(`/cua_toi/hoa_don/${id}`, "GET", null, resident)
    ).body.data;
    assert.equal(publicBill.tong_tien, "798660");
    assert.equal(publicBill.lines.length, 5);
    assert.match(publicBill.lines[4].dien_giai, /8.00% trên 739.500 đ/);
    assert.equal(publicBill.lines[4].du_lieu_nguon, undefined);
    assert.equal(publicBill.qr_payload.includes("798660"), true);
    assert.equal((await get(id)).lines[4].du_lieu_nguon.thue_gtgt, "8.00");
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const a of apartments) {
      const bills = await rows(
        pool,
        "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? ORDER BY ma_hoa_don DESC",
        [a],
      );
      for (const { ma_hoa_don: id } of bills) {
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
          id,
        ]);
        await rows(pool, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [
          id,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
      }
      await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [a]);
    }
    if (profile) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
        profile,
      ]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profile]);
    }
    for (const p of prices.reverse())
      await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [p]);
    for (const a of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [a]);
    for (const u of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [u]);
    await pool.end();
  }
});
