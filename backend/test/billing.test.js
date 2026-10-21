import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { lineTotal, today } from "../src/modules/billing/billing.validation.js";
import { crc16 } from "../src/modules/billing/billing.qr.js";

test("MySQL billing: exact totals, snapshots, source locks, resident access, payment and replacement", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const users = [],
    apartments = [],
    profiles = [],
    prices = [];
  let main, second, owner;
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
  async function account(role) {
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const r = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      [suffix, phone, hash, role],
    );
    users.push(r.insertId);
    const login = await req("/xac_thuc/dang_nhap", "POST", {
      so_dien_thoai: phone,
      mat_khau: password,
    });
    assert.equal(login.status, 200);
    return { id: r.insertId, cookie: login.cookie };
  }
  let admin, resident, outsider, tech;
  const options = {
    ky_thanh_toan: "2026-09",
    ngay_chot_phi: "2026-09-30",
    tinh_nuoc: true,
    tinh_dien: false,
    tinh_xe: true,
  };
  const meter = {
    loai_dich_vu: "NUOC",
    ky_thanh_toan: "2026-09",
    ngay_chot: "2026-09-30",
    chi_so_cu: "113",
    chi_so_moi: "125",
    ky_dau: true,
  };
  async function get(id, cookie = admin.cookie) {
    return req(`/hoa_don/${id}`, "GET", null, cookie);
  }
  async function act(id, action, body = {}) {
    const detail = await get(id);
    return req(
      `/hoa_don/${id}/${action}`,
      "POST",
      { phien_ban: detail.body.data.phien_ban, ...body },
      admin.cookie,
    );
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
  const bank = {
    han_thanh_toan: today(),
    ma_ngan_hang: "970436",
    so_tai_khoan: "1234567890",
    ten_nguoi_nhan: "BQL DEMO",
  };
  try {
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    outsider = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    for (let i = 0; i < 3; i++) {
      const r = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,?)",
        [`HD-${suffix}-${i}`, "HD", 1, "70"],
      );
      apartments.push(r.insertId);
    }
    for (const [i, u] of [resident, outsider].entries()) {
      const r = await req(
        "/cu_dan",
        "POST",
        {
          ho_va_ten: "Chủ hóa đơn " + suffix,
          so_dien_thoai: "0901234567",
          ma_nguoi_dung: u.id,
          ma_can_ho: apartments[i],
          quan_he: "CHU_HO",
          ngay: "2020-01-01",
        },
        admin.cookie,
      );
      assert.equal(r.status, 201);
      profiles.push(r.body.data.ma_cu_dan);
    }
    owner = (await req(`/cu_dan/${profiles[0]}`, "GET", null, admin.cookie))
      .body.data;
    for (let i = 0; i < 2; i++) {
      const r = await req(
        "/phuong_tien",
        "POST",
        {
          ma_cu_dan: profiles[0],
          ma_lich_su_cu_tru: owner.history[0].ma_lich_su_cu_tru,
          loai_xe: "XE_MAY",
          bien_so: `H${suffix}${i}`,
          ngay_dang_ky: "2020-01-01",
        },
        admin.cookie,
      );
      assert.equal(r.status, 201);
    }
    await t.test(
      "admin-only source data, private resident views and exact rounding",
      async () => {
        for (const path of ["/hoa_don", "/cau_hinh_phi", "/chi_so_dich_vu"]) {
          assert.equal((await req(path)).status, 401);
          assert.equal((await req(path, "GET", null, tech.cookie)).status, 403);
          assert.equal(
            (await req(path, "GET", null, resident.cookie)).status,
            403,
          );
        }
        assert.equal(
          (await req("/cua_toi/hoa_don", "GET", null, tech.cookie)).status,
          403,
        );
        assert.equal(lineTotal("0.005", "100"), "1");
        assert.equal(lineTotal("2.555", "10.10"), "26");
        assert.equal(lineTotal("70", "12000"), "840000");
        assert.equal(crc16("123456789"), "29B1");
      },
    );
    await t.test(
      "incomplete drafts report missing data and cannot approve or appear to residents",
      async () => {
        const r = await req(
          "/hoa_don/lap",
          "POST",
          { ...options, ma_can_ho: apartments[0], tong_tien: "1" },
          admin.cookie,
        );
        assert.equal(r.status, 201);
        main = r.body.data.ma_hoa_don;
        const bill = (await get(main)).body.data;
        assert.ok(bill.loi_du_lieu.length >= 3);
        assert.equal(bill.tong_tien, "0");
        assert.equal((await act(main, "duyet")).status, 422);
        assert.equal(
          (await req(`/cua_toi/hoa_don/${main}`, "GET", null, resident.cookie))
            .status,
          404,
        );
        assert.equal(
          (
            await req(
              "/hoa_don/lap",
              "POST",
              { ...options, ma_can_ho: apartments[0] },
              admin.cookie,
            )
          ).status,
          409,
        );
      },
    );
    await t.test(
      "effective prices, meter continuity, recalculation and stale source protection",
      async () => {
        for (const [type, price] of [
          ["PHI_QUAN_LY", "12000"],
          ["GUI_XE_MAY", "100000"],
          ["TIEN_NUOC", "15000"],
        ]) {
          const r = await req(
            "/cau_hinh_phi",
            "POST",
            { loai_phi: type, don_gia: price, tu_ngay: "2020-01-01" },
            admin.cookie,
          );
          assert.equal(r.status, 201);
          prices.push(r.body.data.ma_cau_hinh_phi);
        }
        assert.equal(
          (
            await req(
              "/cau_hinh_phi",
              "POST",
              { loai_phi: "TIEN_NUOC", don_gia: "-1", tu_ngay: "2026-01-01" },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              { ...meter, ma_can_ho: apartments[0], ky_dau: false },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              { ...meter, ma_can_ho: apartments[0] },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              {
                ...meter,
                ma_can_ho: apartments[0],
                chi_so_moi: "112",
                phien_ban: 0,
              },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal((await act(main, "tinh_lai")).status, 200);
        let bill = (await get(main)).body.data;
        assert.equal(bill.tong_tien, "1220000");
        assert.equal(bill.lines.length, 3);
        assert.deepEqual(bill.loi_du_lieu, []);
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              {
                ...meter,
                ma_can_ho: apartments[0],
                chi_so_moi: "126",
                phien_ban: 0,
              },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await act(main, "duyet")).body.error.code,
          "STALE_BILL_SOURCE",
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              { ...meter, ma_can_ho: apartments[0], phien_ban: 1 },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal((await act(main, "tinh_lai")).status, 200);
        assert.equal((await act(main, "duyet")).status, 200);
        bill = (await get(main)).body.data;
        assert.equal(bill.trang_thai, "DA_DUYET");
        assert.equal(bill.tong_tien, "1220000");
        assert.equal((await act(main, "tinh_lai")).status, 409);
      },
    );
    await t.test(
      "approved invoices lock meters, historical vehicle changes and price intervals",
      async () => {
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              { ...meter, ma_can_ho: apartments[0], phien_ban: 2 },
              admin.cookie,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await req(
              "/cau_hinh_phi",
              "POST",
              {
                loai_phi: "PHI_QUAN_LY",
                don_gia: "13000",
                tu_ngay: "2026-09-30",
              },
              admin.cookie,
            )
          ).status,
          409,
        );
        const rate = await req(
          "/cau_hinh_phi",
          "POST",
          { loai_phi: "PHI_QUAN_LY", don_gia: "13000", tu_ngay: "2026-10-01" },
          admin.cookie,
        );
        assert.equal(rate.status, 201);
        prices.push(rate.body.data.ma_cau_hinh_phi);
        const cars = (
          await req(
            `/phuong_tien?ma_cu_dan=${profiles[0]}&trang_thai=DANG_GUI`,
            "GET",
            null,
            admin.cookie,
          )
        ).body.data;
        assert.equal(
          (
            await req(
              `/phuong_tien/${cars[0].ma_phuong_tien}/ket_thuc`,
              "POST",
              {
                ngay_ket_thuc: "2026-09-30",
                ly_do_ket_thuc: "Ngừng xe",
                phien_ban: 0,
              },
              admin.cookie,
            )
          ).body.error.code,
          "BILLED_VEHICLE_PERIOD",
        );
        assert.equal(
          (
            await req(
              `/cu_dan/${profiles[0]}/chuyen_can`,
              "POST",
              {
                ma_can_ho: apartments[1],
                quan_he: "CHU_HO",
                ngay: "2026-09-30",
                phien_ban: 0,
                chuyen_phuong_tien: true,
              },
              admin.cookie,
            )
          ).status,
          409,
        );
        assert.equal(
          (await get(main)).body.data.lines.find(
            (l) => l.loai_phi === "PHI_QUAN_LY",
          ).don_gia,
          "12000.00",
        );
      },
    );
    await t.test(
      "send snapshots bank details, local VietQR payload and private read-only access",
      async () => {
        assert.equal(
          (await act(main, "gui", { ...bank, ma_ngan_hang: "abcdef" })).status,
          422,
        );
        assert.equal((await act(main, "gui", bank)).status, 200);
        const view = await req(
          `/cua_toi/hoa_don/${main}`,
          "GET",
          null,
          resident.cookie,
        );
        assert.equal(view.status, 200);
        assert.equal(view.body.data.tong_tien, "1220000");
        assert.equal(view.body.data.history, undefined);
        assert.equal(view.body.data.lines[0].du_lieu_nguon, undefined);
        assert.equal(
          (await req(`/cua_toi/hoa_don/${main}`, "GET", null, outsider.cookie))
            .status,
          404,
        );
        const bill = view.body.data,
          payload = bill.qr_payload;
        assert.ok(payload.includes("5303704"));
        assert.ok(payload.includes("54071220000"));
        assert.ok(payload.includes("970436"));
        assert.ok(payload.includes("1234567890"));
        assert.ok(payload.includes(bill.so_hoa_don));
        assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
        assert.equal(
          (
            await req(
              `/hoa_don/${main}/xac_nhan_thanh_toan`,
              "POST",
              { so_tien: "1220000", ma_tham_chieu: "tamper", phien_ban: 4 },
              resident.cookie,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "payment requires exact funds and retries do not record a second collection",
      async () => {
        assert.equal(
          (
            await act(main, "xac_nhan_thanh_toan", {
              so_tien: "1",
              ma_tham_chieu: "PAY-" + suffix,
            })
          ).status,
          422,
        );
        const bill = (await get(main)).body.data,
          body = {
            phien_ban: bill.phien_ban,
            so_tien: "1220000",
            ma_tham_chieu: "PAY-" + suffix,
          };
        const result = await Promise.all(
          [1, 2].map(() =>
            req(
              `/hoa_don/${main}/xac_nhan_thanh_toan`,
              "POST",
              body,
              admin.cookie,
            ),
          ),
        );
        assert.deepEqual(
          result.map((r) => r.status),
          [200, 200],
        );
        const paid = (await get(main)).body.data;
        assert.equal(paid.trang_thai, "DA_THANH_TOAN");
        assert.equal(paid.qr_payload, null);
        assert.equal(
          paid.history.filter((h) => h.su_kien === "XAC_NHAN_THANH_TOAN")
            .length,
          1,
        );
        assert.equal(
          (await act(main, "huy", { ly_do: "Không được hủy" })).status,
          409,
        );
      },
    );
    await t.test(
      "cancel and replace preserve old lines and enforce one active bill per apartment/month",
      async () => {
        const r = await req(
          "/hoa_don/lap",
          "POST",
          {
            ...options,
            ma_can_ho: apartments[1],
            tinh_nuoc: false,
            tinh_xe: true,
          },
          admin.cookie,
        );
        assert.equal(r.status, 201);
        second = r.body.data.ma_hoa_don;
        assert.equal((await act(second, "duyet")).status, 200);
        assert.equal((await act(second, "gui", bank)).status, 200);
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${second}`,
              "GET",
              null,
              outsider.cookie,
            )
          ).status,
          200,
        );
        const newcomer = await req(
          "/cu_dan",
          "POST",
          {
            ho_va_ten: "Chuyển xe " + suffix,
            so_dien_thoai: "0901234567",
            ma_can_ho: apartments[2],
            quan_he: "THANH_VIEN",
            ngay: "2020-01-01",
          },
          admin.cookie,
        );
        assert.equal(newcomer.status, 201);
        const newcomerId = newcomer.body.data.ma_cu_dan;
        profiles.push(newcomerId);
        const newcomerStay = (
          await req(`/cu_dan/${newcomerId}`, "GET", null, admin.cookie)
        ).body.data.history[0].ma_lich_su_cu_tru;
        assert.equal(
          (
            await req(
              "/phuong_tien",
              "POST",
              {
                ma_cu_dan: newcomerId,
                ma_lich_su_cu_tru: newcomerStay,
                loai_xe: "XE_MAY",
                bien_so: `N${suffix}9`,
                ngay_dang_ky: "2020-01-01",
              },
              admin.cookie,
            )
          ).status,
          201,
        );
        const incoming = await req(
          `/cu_dan/${newcomerId}/chuyen_can`,
          "POST",
          {
            ma_can_ho: apartments[1],
            quan_he: "THANH_VIEN",
            ngay: "2026-09-30",
            phien_ban: 0,
            chuyen_phuong_tien: true,
          },
          admin.cookie,
        );
        assert.equal(incoming.body.error.code, "BILLED_VEHICLE_PERIOD");
        assert.equal(
          (await req(`/cu_dan/${newcomerId}`, "GET", null, admin.cookie)).body
            .data.history.length,
          1,
        );
        const before = (await get(second)).body.data.lines;
        assert.equal(
          (
            await act(second, "huy", {
              ly_do: " ".repeat(300) + "Điều chỉnh theo yêu cầu",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await req(
              `/cua_toi/hoa_don/${second}`,
              "GET",
              null,
              outsider.cookie,
            )
          ).status,
          404,
        );
        const canceled = (await get(second)).body.data;
        const replacements = await Promise.all(
          [1, 2].map(() =>
            req(
              `/hoa_don/${second}/lap_thay_the`,
              "POST",
              { phien_ban: canceled.phien_ban },
              admin.cookie,
            ),
          ),
        );
        assert.deepEqual(replacements.map((r) => r.status).sort(), [200, 409]);
        const replacement = (
          await get(
            replacements.find((r) => r.status === 200).body.data.ma_hoa_don,
          )
        ).body.data;
        assert.equal(replacement.lan_lap, 2);
        assert.equal(replacement.ma_hoa_don_thay_the_cho, second);
        assert.equal(replacement.trang_thai, "NHAP");
        assert.deepEqual((await get(second)).body.data.lines, before);
      },
    );
    await t.test(
      "moving residents immediately revokes old apartment invoice access",
      async () => {
        assert.equal(
          (
            await req(
              `/cu_dan/${profiles[0]}/chuyen_can`,
              "POST",
              {
                ma_can_ho: apartments[2],
                quan_he: "CHU_HO",
                ngay: "2026-10-01",
                phien_ban: 0,
                chuyen_phuong_tien: true,
              },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await req(`/cua_toi/hoa_don/${main}`, "GET", null, resident.cookie))
            .status,
          404,
        );
        assert.equal(
          (await req("/cua_toi/hoa_don", "GET", null, resident.cookie)).body
            .total,
          0,
        );
      },
    );
    await t.test(
      "meter sequences require the immediate previous month and preserve approved history",
      async () => {
        const next = {
          ...meter,
          ky_thanh_toan: "2026-10",
          ngay_chot: "2026-10-01",
          ma_can_ho: apartments[0],
          chi_so_cu: "126",
          chi_so_moi: "130",
          ky_dau: false,
        };
        assert.equal(
          (await req("/chi_so_dich_vu", "PUT", next, admin.cookie)).body.error
            .code,
          "METER_CHAIN",
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              { ...next, chi_so_cu: "125" },
              admin.cookie,
            )
          ).status,
          200,
        );
        const initial = {
          ...meter,
          ma_can_ho: apartments[2],
          ky_thanh_toan: "2026-07",
          ngay_chot: "2026-07-31",
          chi_so_cu: "0",
          chi_so_moi: "1",
        };
        assert.equal(
          (await req("/chi_so_dich_vu", "PUT", initial, admin.cookie)).status,
          200,
        );
        assert.equal(
          (
            await req(
              "/chi_so_dich_vu",
              "PUT",
              {
                ...initial,
                ky_thanh_toan: "2026-09",
                ngay_chot: "2026-09-30",
                chi_so_cu: "1",
                chi_so_moi: "2",
              },
              admin.cookie,
            )
          ).body.error.code,
          "MISSING_PREVIOUS_METER",
        );
      },
    );
    await t.test(
      "failed audit insert rolls back the complete draft transaction",
      async () => {
        const [before] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM hoa_don WHERE ma_can_ho=?",
          [apartments[2]],
        );
        ddl(
          "CREATE TRIGGER test_billing_fail BEFORE INSERT ON lich_su_hoa_don FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test billing rollback';",
        );
        try {
          assert.equal(
            (
              await req(
                "/hoa_don/lap",
                "POST",
                {
                  ...options,
                  ma_can_ho: apartments[2],
                  tinh_nuoc: false,
                  tinh_xe: false,
                },
                admin.cookie,
              )
            ).status,
            500,
          );
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_billing_fail;");
        }
        const [after] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM hoa_don WHERE ma_can_ho=?",
          [apartments[2]],
        );
        assert.equal(after.n, before.n);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const apt of apartments) {
      const bills = await rows(
        pool,
        "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? ORDER BY ma_hoa_don DESC",
        [apt],
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
      await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [apt]);
    }
    for (const profile of profiles) {
      await rows(
        pool,
        "DELETE FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
        [profile],
      );
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
        profile,
      ]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profile]);
    }
    for (const price of prices.reverse())
      await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
        price,
      ]);
    for (const apt of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apt]);
    for (const u of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [u]);
    await pool.end();
  }
});
