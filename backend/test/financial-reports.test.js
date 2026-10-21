import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { today } from "../src/modules/billing/billing.validation.js";

test("financial reports: current debt, receipt dates, precision, snapshots and BQL isolation", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    block = `F${suffix}`,
    otherBlock = `G${suffix}`,
    largeBlock = `L${suffix}`,
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    profiles = [],
    bills = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    d = today(),
    shift = (n) =>
      new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000)
        .toISOString()
        .slice(0, 10);
  let admin, resident, tech, main, ownerId;
  async function req(path, cookie = admin, method = "GET", body) {
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
    const u = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      [suffix, phone, hash, role],
    );
    users.push(u.insertId);
    const login = await req("/xac_thuc/dang_nhap", null, "POST", {
      so_dien_thoai: phone,
      mat_khau: password,
    });
    assert.equal(login.status, 200);
    return login.cookie;
  }
  async function bill(
    apt,
    period,
    status,
    total,
    due,
    timestamp = null,
    version = 1,
    replaces = null,
  ) {
    const r = await rows(
      pool,
      "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan,ngay_thanh_toan,so_tien_da_thu,ma_tham_chieu,ma_nguoi_xac_nhan,ma_hoa_don_thay_the_cho) VALUES (?,?,?,?,?,0,0,0,?,'[]',?,?,?,?,?,?,?,?,?)",
      [
        `FR-${suffix}-${bills.length}`,
        apt,
        period,
        `${period}-01`,
        version,
        total,
        "a".repeat(64),
        users[0],
        status,
        due,
        timestamp,
        status === "DA_THANH_TOAN" ? total : "0",
        status === "DA_THANH_TOAN" ? `FR-${suffix}-${bills.length}` : null,
        status === "DA_THANH_TOAN" ? users[0] : null,
        replaces,
      ],
    );
    bills.push(r.insertId);
    return r.insertId;
  }
  const debt = (extra = "", cookie = admin) =>
    req(`/bao_cao/cong_no?khoi=${block}${extra}`, cookie);
  const cash = (extra = "", cookie = admin) =>
    req(
      `/bao_cao/thu_phi?khoi=${block}&tu_ngay=2026-10-15&den_ngay=2026-10-15${extra}`,
      cookie,
    );
  try {
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    for (const [i, khoi] of [block, block, otherBlock, largeBlock].entries()) {
      const a = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
        [`FR-${suffix}-${i}`, khoi],
      );
      apartments.push(a.insertId);
    }
    for (let i = 0; i < 2; i++) {
      const c = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
        [`Chủ hộ ${suffix} ${i}`, `090000000${i}`],
      );
      profiles.push(c.insertId);
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'CHU_HO','2020-01-01',?)",
        [c.insertId, apartments[0], users[0]],
      );
    }
    ownerId = profiles[0];
    await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,ten_dang_nhap,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?,?,'CU_DAN')",
      [
        suffix,
        `CH${String(apartments[0]).padStart(6, "0")}`,
        apartments[0],
        ownerId,
        hash,
      ],
    );
    main = await bill(apartments[0], "2026-08", "DA_GUI", "100000", shift(-1));
    await bill(apartments[0], "2026-09", "DA_GUI", "200000", d);
    await bill(
      apartments[0],
      "2026-10",
      "DA_THANH_TOAN",
      "300000",
      d,
      "2026-10-14 17:00:00",
    );
    await bill(apartments[0], "2026-07", "NHAP", "900000", d);
    await bill(apartments[0], "2026-06", "DA_DUYET", "800000", d);
    const canceled = await bill(apartments[0], "2026-05", "HUY", "700000", d);
    await bill(
      apartments[0],
      "2026-05",
      "DA_GUI",
      "400000",
      shift(1),
      null,
      2,
      canceled,
    );
    await bill(apartments[1], "2026-09", "DA_GUI", "500000", shift(-1));
    await bill(
      apartments[1],
      "2026-08",
      "DA_THANH_TOAN",
      "600000",
      d,
      "2026-10-15 16:59:59",
    );
    await bill(
      apartments[1],
      "2026-07",
      "DA_THANH_TOAN",
      "700000",
      d,
      "2026-10-14 16:59:59",
    );
    await bill(
      apartments[1],
      "2026-06",
      "DA_THANH_TOAN",
      "800000",
      d,
      "2026-10-15 17:00:00",
    );
    await bill(apartments[1], "2026-10", "DA_GUI", "900000", null);
    await bill(apartments[2], "2026-09", "DA_GUI", "999999", shift(-1));
    await t.test(
      "BQL-only APIs deny guests, residents and technicians including filter metadata",
      async () => {
        for (const path of [
          "/bao_cao/bo_loc",
          "/bao_cao/cong_no",
          "/bao_cao/thu_phi",
        ]) {
          assert.equal((await req(path, null)).status, 401);
          assert.equal((await req(path, resident)).status, 403);
          assert.equal((await req(path, tech)).status, 403);
        }
        assert.ok(
          (await req("/bao_cao/bo_loc")).body.data.some(
            (r) => r.khoi === block,
          ),
        );
      },
    );
    await t.test(
      "only sent/paid bills count; canceled replacement is excluded and all co-owners do not multiply amounts",
      async () => {
        const r = await debt();
        assert.equal(r.status, 200, JSON.stringify(r.body));
        const s = r.body.summary;
        assert.equal(s.tong_da_gui, "4500000");
        assert.equal(s.da_thu, "2400000");
        assert.equal(s.con_phai_thu, "2100000");
        assert.equal(s.no_qua_han, "600000");
        assert.equal(s.so_hoa_don, 9);
        assert.equal(s.so_hoa_don_da_thu, 4);
        assert.equal(s.so_hoa_don_chua_thu, 5);
        assert.equal(Number(s.so_hoa_don_qua_han), 2);
        assert.equal(s.so_can_con_no, 2);
        assert.equal(s.ty_le_da_thu, 53.33);
        assert.equal(r.body.total, 2);
        const a = r.body.data.find((a) => a.ma_can_ho === apartments[0]);
        assert.equal(a.con_phai_thu, "700000");
        assert.equal(a.nguoi_phu_trach, `Chủ hộ ${suffix} 0`);
        for (const forbidden of [
          "mat_khau_ma_hoa",
          "so_tai_khoan",
          "ma_ngan_hang",
        ])
          assert.ok(!JSON.stringify(r.body).includes(forbidden));
      },
    );
    await t.test(
      "period, block, apartment/search filters reconcile across views and zero results remain valid",
      async () => {
        const r = await debt("&tu_ky=2026-09&den_ky=2026-09&che_do=THEO_KY");
        assert.equal(r.status, 200);
        assert.equal(r.body.summary.tong_da_gui, "700000");
        assert.equal(r.body.data[0].tong_da_gui, "700000");
        assert.equal(r.body.data[0].no_qua_han, "500000");
        const apt = await debt(`&ma_can_ho=${apartments[0]}`);
        assert.equal(apt.body.summary.tong_da_gui, "1000000");
        assert.equal(
          (await debt(`&q=FR-${suffix}-0`)).body.summary.con_phai_thu,
          "700000",
        );
        const empty = await debt("&q=NO-MATCH-APARTMENT");
        assert.equal(empty.body.summary.tong_da_gui, "0");
        assert.equal(empty.body.summary.ty_le_da_thu, 0);
        assert.equal(empty.body.total, 0);
        const period = await debt("&che_do=THEO_KY");
        assert.equal(
          period.body.data.reduce((n, r) => n + BigInt(r.tong_da_gui), 0n),
          4500000n,
        );
      },
    );
    await t.test(
      "due today is not overdue, null due remains unpaid and overdue-only view does not change totals",
      async () => {
        const r = await debt("&che_do=HOA_DON&qua_han=1");
        assert.equal(r.body.total, 2);
        assert.equal(r.body.summary.con_phai_thu, "2100000");
        assert.ok(r.body.data.every((r) => r.qua_han === 1));
        const all = await debt("&che_do=HOA_DON");
        assert.equal(all.body.total, 5);
        const noDate = all.body.data.find((r) => r.han_thanh_toan === null);
        assert.equal(noDate.qua_han, 0);
        assert.equal(
          all.body.data.filter((r) => r.han_thanh_toan === d)[0].qua_han,
          0,
        );
        const apt = await debt("&qua_han=1");
        assert.equal(apt.body.total, 2);
        assert.equal(
          apt.body.data.reduce((n, r) => n + BigInt(r.con_phai_thu), 0n),
          2100000n,
        );
      },
    );
    await t.test(
      "receipt windows use Vietnam midnight, inclusive final day, independent of invoice periods",
      async () => {
        const r = await cash();
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.summary.tong_da_thu, "900000");
        assert.equal(r.body.summary.so_khoan_thu, 2);
        assert.equal(r.body.summary.so_can_da_thu, 2);
        assert.deepEqual(r.body.data.map((r) => r.so_tien_da_thu).sort(), [
          "300000",
          "600000",
        ]);
        assert.ok(r.body.data.some((r) => r.ky_thanh_toan === "2026-08"));
        const daily = await req(
          `/bao_cao/thu_phi?khoi=${block}&tu_ngay=2026-10-14&den_ngay=2026-10-16&che_do=THEO_NGAY`,
        );
        assert.equal(daily.body.summary.tong_da_thu, "2400000");
        assert.equal(daily.body.total, 3);
        assert.deepEqual(
          daily.body.data.map((r) => [r.ngay_thu, r.da_thu]),
          [
            ["2026-10-16", "800000"],
            ["2026-10-15", "900000"],
            ["2026-10-14", "700000"],
          ],
        );
        assert.equal(
          (await cash(`&ma_can_ho=${apartments[0]}`)).body.summary.tong_da_thu,
          "300000",
        );
      },
    );
    await t.test(
      "bad periods/date ranges/views and pages fail without SQL injection or disclosure",
      async () => {
        for (const extra of [
          "&tu_ky=2026-13",
          "&tu_ky=2026-10&den_ky=2026-01",
          "&page=0",
          "&page=100001",
          "&che_do=FAKE",
          "&qua_han=3",
          "&ma_can_ho=0",
          "&che_do=THEO_KY&qua_han=1",
          "&khoi=A",
        ])
          assert.equal((await debt(extra)).status, 422, extra);
        for (const path of [
          "/bao_cao/thu_phi?tu_ngay=2026-02-30",
          "/bao_cao/thu_phi?tu_ngay=2026-10-16&den_ngay=2026-10-15",
          "/bao_cao/thu_phi?den_ngay=2199-01-01",
          "/bao_cao/thu_phi?che_do=CAN_HO",
        ])
          assert.equal((await req(path)).status, 422, path);
        const search = await debt("&q=%27%20OR%201%3D1--");
        assert.equal(search.status, 200);
        assert.equal(search.body.total, 0);
      },
    );
    await t.test(
      "large aggregate totals remain exact decimal strings and pagination never truncates summary",
      async () => {
        for (let i = 0; i < 99; i++)
          await bill(
            apartments[3],
            `${2010 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`,
            "DA_GUI",
            "99999999999999",
            shift(-1),
          );
        const expected = (99999999999999n * 99n).toString();
        const first = await req(
          `/bao_cao/cong_no?khoi=${largeBlock}&che_do=HOA_DON`,
        );
        assert.equal(first.body.summary.con_phai_thu, expected);
        assert.equal(typeof first.body.summary.con_phai_thu, "string");
        assert.equal(first.body.total, 99);
        assert.equal(first.body.data.length, 20);
        const last = await req(
          `/bao_cao/cong_no?khoi=${largeBlock}&che_do=HOA_DON&page=5`,
        );
        assert.equal(last.body.data.length, 19);
        assert.equal(last.body.summary.con_phai_thu, expected);
        const keys = new Set();
        for (let page = 1; page <= 5; page++)
          for (const r of (
            await req(
              `/bao_cao/cong_no?khoi=${largeBlock}&che_do=HOA_DON&page=${page}`,
            )
          ).body.data)
            keys.add(r.ma_hoa_don);
        assert.equal(keys.size, 99);
        const per = await req(
          `/bao_cao/cong_no?khoi=${largeBlock}&che_do=THEO_KY`,
        );
        assert.equal(per.body.total, 99);
        assert.equal(per.body.data.length, 20);
      },
    );
    await t.test(
      "a payment updates both reports exactly once and report GETs never write financial data",
      async () => {
        const before = (
          await rows(
            pool,
            "SELECT COUNT(*) AS n FROM lich_su_hoa_don WHERE ma_hoa_don=?",
            [main],
          )
        )[0].n;
        const payment = {
          phien_ban: 0,
          so_tien: "100000",
          ma_tham_chieu: `FR-pay-${suffix}`,
        };
        // Commit a real payment after the report summary query, before its detail query.
        // This must not mix pre-payment totals with post-payment apartment rows.
        const originalGet = pool.getConnection;
        let interleaved = false;
        pool.getConnection = async function () {
          const db = await originalGet.call(pool),
            execute = db.execute,
            release = db.release;
          db.execute = async function (sql, values) {
            const result = await execute.call(db, sql, values);
            if (!interleaved && sql.includes("AS so_can_con_no")) {
              interleaved = true;
              assert.equal(
                (
                  await req(
                    `/hoa_don/${main}/xac_nhan_thanh_toan`,
                    admin,
                    "POST",
                    payment,
                  )
                ).status,
                200,
              );
            }
            return result;
          };
          db.release = function () {
            db.execute = execute;
            db.release = release;
            return release.call(db);
          };
          return db;
        };
        try {
          const inFlight = await debt();
          assert.equal(inFlight.status, 200, JSON.stringify(inFlight.body));
          assert.equal(interleaved, true);
          assert.equal(inFlight.body.summary.con_phai_thu, "2100000");
          assert.equal(
            inFlight.body.data.find((r) => r.ma_can_ho === apartments[0])
              .con_phai_thu,
            "700000",
          );
        } finally {
          pool.getConnection = originalGet;
        }
        // Replay the collection: no additional money or history entry.
        assert.equal(
          (
            await req(
              `/hoa_don/${main}/xac_nhan_thanh_toan`,
              admin,
              "POST",
              payment,
            )
          ).status,
          200,
        );
        const s = (await debt()).body.summary;
        assert.equal(s.da_thu, "2500000");
        assert.equal(s.con_phai_thu, "2000000");
        assert.equal(s.no_qua_han, "500000");
        assert.equal(s.tong_da_gui, "4500000");
        const paid = await req(
          `/bao_cao/thu_phi?khoi=${block}&tu_ngay=${d}&den_ngay=${d}`,
        );
        assert.equal(paid.body.summary.tong_da_thu, "100000");
        assert.equal(
          (
            await rows(
              pool,
              "SELECT COUNT(*) AS n FROM lich_su_hoa_don WHERE ma_hoa_don=?",
              [main],
            )
          )[0].n,
          before + 1,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of bills.reverse()) {
      await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [id]);
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
    }
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
