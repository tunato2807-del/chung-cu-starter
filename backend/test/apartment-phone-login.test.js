import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { today } from "../src/modules/billing/billing.validation.js";

const randomPhone = () =>
  "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
test("current householder phone login, dedicated directory, personal-account collisions and phone changes", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    suffix = randomBytes(4).toString("hex"),
    password = randomBytes(18).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    profiles = [],
    phones = [randomPhone(), randomPhone()];
  let admin, first, second, session;
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
  async function login(phone, secret, kind) {
    return req("/xac_thuc/dang_nhap", "POST", {
      so_dien_thoai: phone,
      mat_khau: secret,
      ...(kind ? { loai_tai_khoan: kind } : {}),
    });
  }
  try {
    const adminPhone = randomPhone();
    const r = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
      [suffix, adminPhone, hash],
    );
    users.push(r.insertId);
    admin = (await login(adminPhone, password)).cookie;
    for (let i = 0; i < 2; i++) {
      const a = await req(
        "/can_ho",
        "POST",
        {
          so_can_ho: `PH-${suffix}-${i}`,
          khoi: "PH",
          tang: 1,
          dien_tich_m2: "50",
          tinh_phi_dich_vu: true,
        },
        admin,
      );
      assert.equal(a.status, 201);
      apartments.push(a.body.data.ma_can_ho);
    }
    const owner = await req(
      "/cu_dan",
      "POST",
      {
        ho_va_ten: `Chủ hộ ${suffix}`,
        so_dien_thoai: phones[0],
        ma_can_ho: apartments[0],
        quan_he: "CHU_HO",
        ngay: today(),
      },
      admin,
    );
    assert.equal(owner.status, 201);
    first = owner.body.data;
    profiles.push(first.ma_cu_dan);
    await t.test(
      "phone and +84 aliases authenticate the bound apartment; account code still works",
      async () => {
        session = await login(
          phones[0],
          first.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
        assert.equal(session.status, 200);
        assert.equal(session.body.data.ma_can_ho_thanh_toan, apartments[0]);
        assert.equal(session.body.data.dien_thoai_dang_nhap, phones[0]);
        assert.equal(
          (
            await login(
              "+84" + phones[0].slice(1),
              first.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CAN_HO",
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await login(
              first.tai_khoan_can_ho.ten_dang_nhap,
              first.tai_khoan_can_ho.mat_khau_tam_thoi,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await login(
              phones[0],
              first.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CA_NHAN",
            )
          ).status,
          401,
        );
      },
    );
    await t.test(
      "directory is management-only, searchable by owner/contact/code and never returns passwords",
      async () => {
        assert.equal((await req("/can_ho/tai_khoan")).status, 401);
        assert.equal(
          (await req("/can_ho/tai_khoan", "GET", null, session.cookie)).status,
          403,
        );
        for (const q of [
          phones[0],
          `Chủ hộ ${suffix}`,
          first.tai_khoan_can_ho.ten_dang_nhap,
        ]) {
          const list = await req(
            `/can_ho/tai_khoan?q=${encodeURIComponent(q)}`,
            "GET",
            null,
            admin,
          );
          assert.equal(list.status, 200);
          assert.equal(list.body.total, 1);
          assert.equal(list.body.data[0].dien_thoai_phu_trach, phones[0]);
          assert.equal(list.body.data[0].mat_khau_ma_hoa, undefined);
          assert.equal(list.body.data[0].mat_khau_tam_thoi, undefined);
        }
        assert.equal(
          (await req("/can_ho/tai_khoan?page=0", "GET", null, admin)).status,
          422,
        );
        assert.equal(
          (await req("/can_ho/tai_khoan?trang_thai=FAKE", "GET", null, admin))
            .status,
          422,
        );
      },
    );
    await t.test(
      "directory pagination includes every matching account and status filters work",
      async () => {
        for (let i = 0; i < 21; i++) {
          const a = await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?, 'PG',1,50)",
            [`PG-${suffix}-${i}`],
          );
          apartments.push(a.insertId);
          await rows(
            pool,
            "INSERT INTO nguoi_dung (ho_va_ten,ten_dang_nhap,ma_can_ho_thanh_toan,mat_khau_ma_hoa,vai_tro,dang_hoat_dong) VALUES (?,?,?,?,'CU_DAN',?)",
            [
              suffix,
              `CH${String(a.insertId).padStart(6, "0")}`,
              a.insertId,
              hash,
              i % 2,
            ],
          );
        }
        const list = await req(
          `/can_ho/tai_khoan?q=PG-${suffix}`,
          "GET",
          null,
          admin,
        );
        const next = await req(
          `/can_ho/tai_khoan?q=PG-${suffix}&page=2`,
          "GET",
          null,
          admin,
        );
        assert.equal(list.body.total, 21);
        assert.equal(list.body.data.length, 20);
        assert.equal(next.body.data.length, 1);
        assert.equal(
          new Set(
            [...list.body.data, ...next.body.data].map((a) => a.ma_nguoi_dung),
          ).size,
          21,
        );
        const active = await req(
          `/can_ho/tai_khoan?q=PG-${suffix}&trang_thai=DANG_HOAT_DONG`,
          "GET",
          null,
          admin,
        );
        assert.equal(active.body.total, 10);
      },
    );
    await t.test(
      "personal and apartment accounts sharing a phone are never silently merged or guessed",
      async () => {
        const personal = await req(
          "/nguoi_dung",
          "POST",
          {
            ho_va_ten: suffix,
            so_dien_thoai: phones[0],
            mat_khau: first.tai_khoan_can_ho.mat_khau_tam_thoi,
            vai_tro: "CU_DAN",
          },
          admin,
        );
        assert.equal(personal.status, 201);
        users.push(personal.body.data.ma_nguoi_dung);
        const ambiguous = await login(
          phones[0],
          first.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
        assert.equal(ambiguous.status, 409);
        assert.equal(ambiguous.body.error.code, "LOGIN_ACCOUNT_CHOICE");
        const self = await login(
          phones[0],
          first.tai_khoan_can_ho.mat_khau_tam_thoi,
          "CA_NHAN",
        );
        assert.equal(self.status, 200);
        assert.equal(
          self.body.data.ma_nguoi_dung,
          personal.body.data.ma_nguoi_dung,
        );
        session = await login(
          phones[0],
          first.tai_khoan_can_ho.mat_khau_tam_thoi,
          "CAN_HO",
        );
        assert.equal(session.status, 200);
        assert.equal(
          session.body.data.ma_nguoi_dung,
          first.tai_khoan_can_ho.ma_nguoi_dung,
        );
        const [person] = await rows(
          pool,
          "SELECT so_lan_dang_nhap_sai FROM nguoi_dung WHERE ma_nguoi_dung=?",
          [personal.body.data.ma_nguoi_dung],
        );
        assert.equal(person.so_lan_dang_nhap_sai, 0);
      },
    );
    await t.test(
      "editing the responsible resident phone immediately changes the alias and expires prior sessions",
      async () => {
        const replacement = randomPhone();
        const r = await req(
          `/cu_dan/${first.ma_cu_dan}`,
          "PATCH",
          {
            ho_va_ten: first.ho_va_ten,
            so_dien_thoai: replacement,
            ma_nguoi_dung: null,
            phien_ban: first.phien_ban,
          },
          admin,
        );
        assert.equal(r.status, 200);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, session.cookie)).status,
          401,
        );
        assert.equal(
          (
            await login(
              phones[0],
              first.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CAN_HO",
            )
          ).status,
          401,
        );
        session = await login(
          replacement,
          first.tai_khoan_can_ho.mat_khau_tam_thoi,
          "CAN_HO",
        );
        assert.equal(session.status, 200);
        phones[0] = replacement;
        const list = await req(
          `/can_ho/tai_khoan?q=${replacement}`,
          "GET",
          null,
          admin,
        );
        assert.equal(list.body.data[0].dien_thoai_phu_trach, replacement);
      },
    );
    await t.test(
      "handover removes the old householder phone even when using the new password",
      async () => {
        const r = await req(
          "/cu_dan",
          "POST",
          {
            ho_va_ten: `Chủ mới ${suffix}`,
            so_dien_thoai: phones[1],
            ma_can_ho: apartments[0],
            quan_he: "CHU_HO",
            ngay: today(),
            xac_nhan_ban_giao: true,
          },
          admin,
        );
        assert.equal(r.status, 201);
        second = r.body.data;
        profiles.push(second.ma_cu_dan);
        assert.equal(
          second.tai_khoan_can_ho.ten_dang_nhap,
          first.tai_khoan_can_ho.ten_dang_nhap,
        );
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, session.cookie)).status,
          401,
        );
        assert.equal(
          (
            await login(
              phones[0],
              second.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CAN_HO",
            )
          ).status,
          401,
        );
        assert.equal(
          (
            await login(
              phones[1],
              first.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CAN_HO",
            )
          ).status,
          401,
        );
        session = await login(
          phones[1],
          second.tai_khoan_can_ho.mat_khau_tam_thoi,
          "CAN_HO",
        );
        assert.equal(session.status, 200);
        assert.equal(
          session.body.data.ma_nguoi_dung,
          first.tai_khoan_can_ho.ma_nguoi_dung,
        );
        const d = (await req(`/cu_dan/${second.ma_cu_dan}`, "GET", null, admin))
          .body.data;
        assert.equal(
          (
            await req(
              `/cu_dan/${second.ma_cu_dan}/chuyen_di`,
              "POST",
              { phien_ban: d.phien_ban, ngay: today() },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await login(
              phones[1],
              second.tai_khoan_can_ho.mat_khau_tam_thoi,
              "CAN_HO",
            )
          ).status,
          401,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of profiles) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
