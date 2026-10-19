import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { today } from "../src/modules/billing/billing.validation.js";

test("apartment accounts: automatic creation, owner handover, isolated invoices, revocation, races and rollback", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    suffix = randomBytes(5).toString("hex"),
    password = randomBytes(18).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    profiles = [],
    prices = [],
    bills = [];
  let admin, initial, first, second, active, moved, latestPassword;
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
  async function login(credentials) {
    return req("/xac_thuc/dang_nhap", "POST", {
      ten_dang_nhap: credentials.ten_dang_nhap.toLowerCase(),
      mat_khau: credentials.mat_khau_tam_thoi,
    });
  }
  async function detail(index) {
    return (await req(`/can_ho/${apartments[index]}`, "GET", null, admin)).body
      .data;
  }
  async function profile(name, role = "CHU_HO", confirmed = false) {
    const r = await req(
      "/cu_dan",
      "POST",
      {
        ho_va_ten: `${suffix}-${name}`,
        so_dien_thoai: "0901234567",
        ma_can_ho: apartments[0],
        quan_he: role,
        ngay: today(),
        xac_nhan_ban_giao: confirmed,
      },
      admin,
    );
    if (r.status === 201) profiles.push(r.body.data.ma_cu_dan);
    return r;
  }
  const ddl = (sql) =>
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
      ],
      { input: sql },
    );
  try {
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const u = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
      [suffix, phone, hash],
    );
    users.push(u.insertId);
    admin = (
      await req("/xac_thuc/dang_nhap", "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      })
    ).cookie;
    await t.test(
      "new apartments receive unique working usernames and one-time passwords, never readable in GET",
      async () => {
        for (let i = 0; i < 2; i++) {
          const r = await req(
            "/can_ho",
            "POST",
            {
              so_can_ho: `TK-${suffix}-${i}`,
              khoi: "TK",
              tang: 1,
              dien_tich_m2: "50",
              tinh_phi_dich_vu: true,
            },
            admin,
          );
          assert.equal(r.status, 201);
          apartments.push(r.body.data.ma_can_ho);
          const c = r.body.data.tai_khoan_can_ho;
          assert.match(c.ten_dang_nhap, /^CH\d{6,10}$/);
          assert.ok(c.mat_khau_tam_thoi.length >= 20);
          const d = await detail(i);
          assert.equal(d.tai_khoan_can_ho.mat_khau_tam_thoi, undefined);
          assert.equal(d.tai_khoan_can_ho.mat_khau_ma_hoa, undefined);
          assert.equal(d.tai_khoan_can_ho.ma_cu_dan_phu_trach, null);
          if (!i) initial = c;
        }
        active = await login(initial);
        assert.equal(active.status, 200);
        assert.equal(active.body.data.ma_can_ho_thanh_toan, apartments[0]);
        assert.equal(
          (
            await req(
              `/can_ho/${apartments[0]}/tai_khoan`,
              "POST",
              { thao_tac: "cap_lai_mat_khau", phien_ban_ban_giao: 0 },
              active.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await req(
              `/nguoi_dung/${initial.ma_nguoi_dung}`,
              "PATCH",
              { dang_hoat_dong: true },
              admin,
            )
          ).status,
          409,
        );
        const [saved] = await rows(
          pool,
          "SELECT mat_khau_ma_hoa FROM nguoi_dung WHERE ma_nguoi_dung=?",
          [initial.ma_nguoi_dung],
        );
        assert.notEqual(saved.mat_khau_ma_hoa, initial.mat_khau_tam_thoi);
        assert.ok(
          await bcrypt.compare(
            initial.mat_khau_tam_thoi,
            saved.mat_khau_ma_hoa,
          ),
        );
      },
    );
    await t.test(
      "fixed account sees sent invoices for its apartment, including earlier periods, and no other apartment",
      async () => {
        const rate = await req(
          "/cau_hinh_phi",
          "POST",
          { loai_phi: "PHI_QUAN_LY", don_gia: "1000", tu_ngay: "2020-01-01" },
          admin,
        );
        assert.equal(rate.status, 201);
        prices.push(rate.body.data.ma_cau_hinh_phi);
        for (const apt of apartments) {
          const r = await req(
            "/hoa_don/lap",
            "POST",
            {
              ma_can_ho: apt,
              ky_thanh_toan: "2026-09",
              ngay_chot_phi: "2026-09-30",
              tinh_nuoc: false,
              tinh_dien: false,
              tinh_xe: false,
            },
            admin,
          );
          assert.equal(r.status, 201);
          const id = r.body.data.ma_hoa_don;
          bills.push(id);
          assert.equal(
            (await req(`/cua_toi/hoa_don/${id}`, "GET", null, active.cookie))
              .status,
            404,
          );
          assert.equal(
            (await req(`/hoa_don/${id}/duyet`, "POST", { phien_ban: 0 }, admin))
              .status,
            200,
          );
          assert.equal(
            (
              await req(
                `/hoa_don/${id}/gui`,
                "POST",
                {
                  phien_ban: 1,
                  han_thanh_toan: today(),
                  ma_ngan_hang: "970436",
                  so_tai_khoan: "1234567890",
                  ten_nguoi_nhan: "BQL DEMO",
                },
                admin,
              )
            ).status,
            200,
          );
        }
        const mine = await req(
          `/cua_toi/hoa_don/${bills[0]}`,
          "GET",
          null,
          active.cookie,
        );
        assert.equal(mine.status, 200);
        assert.equal(mine.body.data.tong_tien, "50000");
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${bills[1]}`,
              "GET",
              null,
              active.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (await req("/cua_toi/hoa_don", "GET", null, active.cookie)).body
            .total,
          1,
        );
      },
    );
    await t.test(
      "householder is automatically bound and old sessions/passwords are revoked; member profiles do not take ownership",
      async () => {
        const r = await profile("Chủ hộ 1");
        assert.equal(r.status, 201);
        first = r.body.data;
        const c = first.tai_khoan_can_ho;
        assert.equal(c.ma_nguoi_dung, initial.ma_nguoi_dung);
        assert.equal(c.ma_cu_dan_phu_trach, first.ma_cu_dan);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        assert.equal((await login(initial)).status, 401);
        active = await login(c);
        assert.equal(active.status, 200);
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${bills[0]}`,
              "GET",
              null,
              active.cookie,
            )
          ).status,
          200,
        );
        const member = await profile("Thành viên", "THANH_VIEN");
        assert.equal(member.status, 201);
        assert.equal(member.body.data.tai_khoan_can_ho, null);
        const [u] = await rows(
          pool,
          "SELECT ma_cu_dan_phu_trach FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
          [apartments[0]],
        );
        assert.equal(u.ma_cu_dan_phu_trach, first.ma_cu_dan);
        assert.equal(
          (
            await req(
              "/cu_dan",
              "POST",
              {
                ho_va_ten: suffix,
                so_dien_thoai: "0901234567",
                ma_nguoi_dung: initial.ma_nguoi_dung,
                ma_can_ho: apartments[0],
                quan_he: "THANH_VIEN",
                ngay: today(),
              },
              admin,
            )
          ).status,
          422,
        );
      },
    );
    await t.test(
      "replacement owner requires explicit handover, leaves old profile intact and rotates account credentials",
      async () => {
        const denied = await profile("Chủ hộ 2");
        assert.equal(denied.status, 409);
        assert.equal(denied.body.error.code, "HANDOVER_REQUIRED");
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM cu_dan WHERE ho_va_ten=?",
          [`${suffix}-Chủ hộ 2`],
        );
        assert.equal(count.n, 0);
        const r = await profile("Chủ hộ 2", "CHU_HO", true);
        assert.equal(r.status, 201);
        second = r.body.data;
        assert.equal(
          second.tai_khoan_can_ho.ma_nguoi_dung,
          initial.ma_nguoi_dung,
        );
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        assert.equal((await login(first.tai_khoan_can_ho)).status, 401);
        active = await login(second.tai_khoan_can_ho);
        assert.equal(active.status, 200);
        assert.equal(
          (await req(`/cu_dan/${first.ma_cu_dan}`, "GET", null, admin)).body
            .data.tai_khoan_can_ho,
          null,
        );
        assert.equal(
          (await req(`/cu_dan/${second.ma_cu_dan}`, "GET", null, admin)).body
            .data.tai_khoan_can_ho.ten_dang_nhap,
          initial.ten_dang_nhap,
        );
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${bills[0]}`,
              "GET",
              null,
              active.cookie,
            )
          ).body.data.nguoi_phu_trach_thanh_toan,
          `${suffix}-Chủ hộ 2`,
        );
      },
    );
    await t.test(
      "explicit handover validates current householder and requires confirmation",
      async () => {
        const account = (await detail(0)).tai_khoan_can_ho;
        const path = `/can_ho/${apartments[0]}/tai_khoan`;
        const body = {
          thao_tac: "ban_giao",
          phien_ban_ban_giao: account.phien_ban_ban_giao,
          ma_cu_dan: profiles[1],
          xac_nhan_ban_giao: true,
        };
        assert.equal((await req(path, "POST", body, admin)).status, 422);
        assert.equal(
          (
            await req(
              path,
              "POST",
              { ...body, ma_cu_dan: first.ma_cu_dan, xac_nhan_ban_giao: false },
              admin,
            )
          ).status,
          409,
        );
        const firstAgain = await req(
          path,
          "POST",
          { ...body, ma_cu_dan: first.ma_cu_dan },
          admin,
        );
        assert.equal(firstAgain.status, 200);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        const back = await req(
          path,
          "POST",
          {
            ...body,
            ma_cu_dan: second.ma_cu_dan,
            phien_ban_ban_giao: firstAgain.body.data.phien_ban_ban_giao,
          },
          admin,
        );
        assert.equal(back.status, 200);
        second.tai_khoan_can_ho = back.body.data;
        active = await login(second.tai_khoan_can_ho);
        assert.equal(active.status, 200);
      },
    );
    await t.test(
      "simultaneous reset requests yield exactly one new password and reject stale handover state",
      async () => {
        const account = (await detail(0)).tai_khoan_can_ho;
        const results = await Promise.all(
          [1, 2].map(() =>
            req(
              `/can_ho/${apartments[0]}/tai_khoan`,
              "POST",
              {
                thao_tac: "cap_lai_mat_khau",
                phien_ban_ban_giao: account.phien_ban_ban_giao,
              },
              admin,
            ),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        second.tai_khoan_can_ho = results.find(
          (r) => r.status === 200,
        ).body.data;
        active = await login(second.tai_khoan_can_ho);
        assert.equal(active.status, 200);
      },
    );
    await t.test(
      "failed handover audit rolls back the new resident, owner binding, password and token changes",
      async () => {
        ddl(
          "CREATE TRIGGER test_account_audit_fail BEFORE INSERT ON lich_su_ban_giao_can_ho FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test rollback';",
        );
        try {
          assert.equal(
            (await profile("Không được lưu", "CHU_HO", true)).status,
            500,
          );
          const [before] = await rows(
            pool,
            "SELECT COUNT(*) AS n FROM nguoi_dung",
          );
          assert.equal(
            (
              await req(
                "/can_ho",
                "POST",
                {
                  so_can_ho: `FAIL-${suffix}`,
                  khoi: "TK",
                  tang: 1,
                  dien_tich_m2: "50",
                  tinh_phi_dich_vu: true,
                },
                admin,
              )
            ).status,
            500,
          );
          const [after] = await rows(
            pool,
            "SELECT COUNT(*) AS n FROM nguoi_dung",
          );
          assert.equal(after.n, before.n);
          const [notSaved] = await rows(
            pool,
            "SELECT COUNT(*) AS n FROM can_ho WHERE so_can_ho=?",
            [`FAIL-${suffix}`],
          );
          assert.equal(notSaved.n, 0);
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_account_audit_fail;");
        }
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM cu_dan WHERE ho_va_ten=?",
          [`${suffix}-Không được lưu`],
        );
        assert.equal(count.n, 0);
        assert.equal((await login(second.tai_khoan_can_ho)).status, 200);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          200,
        );
        assert.equal(
          (await detail(0)).tai_khoan_can_ho.ma_cu_dan_phu_trach,
          second.ma_cu_dan,
        );
      },
    );
    await t.test(
      "moving the responsible owner disables the old apartment account and binds a separate account at the new apartment",
      async () => {
        const d = (await req(`/cu_dan/${second.ma_cu_dan}`, "GET", null, admin))
          .body.data;
        const r = await req(
          `/cu_dan/${second.ma_cu_dan}/chuyen_can`,
          "POST",
          {
            phien_ban: d.phien_ban,
            ma_can_ho: apartments[1],
            quan_he: "CHU_HO",
            ngay: today(),
            chuyen_phuong_tien: false,
          },
          admin,
        );
        assert.equal(r.status, 200);
        moved = r.body.data.tai_khoan_can_ho;
        assert.notEqual(moved.ten_dang_nhap, initial.ten_dang_nhap);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        assert.equal((await login(second.tai_khoan_can_ho)).status, 401);
        const previous = (await detail(0)).tai_khoan_can_ho;
        assert.equal(previous.dang_hoat_dong, 0);
        assert.equal(previous.ma_cu_dan_phu_trach, null);
        active = await login(moved);
        assert.equal(active.status, 200);
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${bills[0]}`,
              "GET",
              null,
              active.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${bills[1]}`,
              "GET",
              null,
              active.cookie,
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "householder can change their password; all existing sessions then expire",
      async () => {
        const fresh = randomBytes(18).toString("hex");
        latestPassword = fresh;
        assert.equal(
          (
            await req(
              "/xac_thuc/doi_mat_khau",
              "POST",
              { mat_khau_cu: moved.mat_khau_tam_thoi, mat_khau_moi: fresh },
              active.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, active.cookie)).status,
          401,
        );
        assert.equal((await login(moved)).status, 401);
        assert.equal(
          (await login({ ...moved, mat_khau_tam_thoi: fresh })).status,
          200,
        );
      },
    );
    await t.test(
      "a password reset racing departure cannot leave a former owner's account enabled",
      async () => {
        const account = (await detail(1)).tai_khoan_can_ho;
        const person = (
          await req(`/cu_dan/${second.ma_cu_dan}`, "GET", null, admin)
        ).body.data;
        const session = await login({
          ...moved,
          mat_khau_tam_thoi: latestPassword,
        });
        assert.equal(session.status, 200);
        const [reset, departure] = await Promise.all([
          req(
            `/can_ho/${apartments[1]}/tai_khoan`,
            "POST",
            {
              thao_tac: "cap_lai_mat_khau",
              phien_ban_ban_giao: account.phien_ban_ban_giao,
            },
            admin,
          ),
          req(
            `/cu_dan/${second.ma_cu_dan}/chuyen_di`,
            "POST",
            { phien_ban: person.phien_ban, ngay: today() },
            admin,
          ),
        ]);
        assert.equal(departure.status, 200);
        assert.ok([200, 409].includes(reset.status));
        assert.equal((await detail(1)).tai_khoan_can_ho.dang_hoat_dong, 0);
        assert.equal(
          (await req("/xac_thuc/toi", "GET", null, session.cookie)).status,
          401,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of bills.reverse()) {
      await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [id]);
      await rows(pool, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [id]);
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
    }
    for (const id of profiles) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of prices)
      await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
        id,
      ]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
