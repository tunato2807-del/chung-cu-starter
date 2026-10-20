import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { today } from "../src/modules/billing/billing.validation.js";

test("operations dashboard: exact money, Vietnam dates, queues, authorization and one read-only snapshot", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    day = today(),
    shift = (n) =>
      new Date(new Date(`${day}T00:00:00Z`).getTime() + n * 86400000)
        .toISOString()
        .slice(0, 10),
    utc = (d) =>
      new Date(`${d}T00:00:00+07:00`)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
    secret = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(secret, 10),
    users = [],
    apartments = [],
    equipment = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let admin, resident, tech, location, facility, person, stay, baseline;
  async function account(role) {
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const r = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      [`Tổng quan ${suffix}`, phone, hash, role],
    );
    users.push(r.insertId);
    return {
      id: r.insertId,
      cookie:
        "session=" +
        (await login({ so_dien_thoai: phone, mat_khau: secret })).token,
    };
  }
  async function req(path = "/tong_quan", cookie = admin?.cookie) {
    const r = await fetch(base + path, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    return { status: r.status, headers: r.headers, body: await r.json() };
  }
  async function read() {
    const r = await req();
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.data;
  }
  async function bill(status, amount, due = null, paidAt = null) {
    const [n] = await rows(
        pool,
        "SELECT COUNT(*) AS n FROM hoa_don WHERE ma_nguoi_lap=?",
        [admin.id],
      ),
      month = new Date(Date.UTC(2020, n.n, 1)).toISOString().slice(0, 7);
    return rows(
      pool,
      "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan,ngay_thanh_toan,so_tien_da_thu,ma_tham_chieu) VALUES (?,?,?, ?,1,0,0,0,?,'[]',?,?,?,?,?,?,?)",
      [
        `O-${suffix}-${n.n}`,
        apartments[0],
        month,
        `${month}-01`,
        amount,
        "a".repeat(64),
        admin.id,
        status,
        due,
        paidAt,
        status === "DA_THANH_TOAN" ? amount : "0",
        status === "DA_THANH_TOAN" ? `O-${suffix}-${n.n}` : null,
      ],
    );
  }
  async function incident(status, priority = "TRUNG_BINH") {
    return rows(
      pool,
      "INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co,do_uu_tien,trang_thai) VALUES (?,?,?,?,?,? ,?,?,'DIEN',?,?)",
      [
        randomBytes(32).toString("hex"),
        randomUUID(),
        location,
        resident.id,
        "Người thử",
        "0901234567",
        `Việc ${suffix}`,
        "Nội dung công việc cần xử lý.",
        priority,
        status,
      ],
    );
  }
  try {
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    await t.test(
      "dashboard only permits BQL and returns explicit uncached zero-safe aggregates",
      async () => {
        assert.equal((await req("/tong_quan", null)).status, 401);
        assert.equal((await req("/tong_quan", resident.cookie)).status, 403);
        assert.equal((await req("/tong_quan", tech.cookie)).status, 403);
        const r = await req();
        assert.equal(r.headers.get("cache-control"), "no-store");
        baseline = r.body.data;
        for (const key of ["con_phai_thu", "no_qua_han", "thu_trong_thang"])
          assert.match(baseline.tai_chinh[key], /^\d+$/);
        assert.equal(baseline.ngay_hien_tai, day);
        assert.equal(baseline.den_ngay_thu, day);
        assert.doesNotMatch(
          JSON.stringify(baseline),
          /mat_khau|ma_tra_cuu|so_dien_thoai|ma_tham_chieu|khoa_yeu_cau/,
        );
      },
    );
    const apt = await rows(
      pool,
      "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
      [`OV-${suffix}`, `O${suffix}`],
    );
    apartments.push(apt.insertId);
    await t.test(
      "debt excludes drafts, approved and canceled bills; due today/null are not overdue; large totals stay exact",
      async () => {
        for (const state of ["NHAP", "DA_DUYET", "HUY"])
          await bill(state, "777777", shift(-1));
        await bill("DA_GUI", "100000", shift(-1));
        await bill("DA_GUI", "200000", day);
        await bill("DA_GUI", "300000", null);
        for (let n = 0; n < 12; n++)
          await bill("DA_GUI", "99999999999999", day);
        const r = await read();
        assert.equal(
          r.tai_chinh.con_phai_thu,
          (
            BigInt(baseline.tai_chinh.con_phai_thu) +
            600000n +
            12n * 99999999999999n
          ).toString(),
        );
        assert.equal(
          r.tai_chinh.no_qua_han,
          (BigInt(baseline.tai_chinh.no_qua_han) + 100000n).toString(),
        );
        assert.equal(
          r.tai_chinh.hoa_don_chua_thu,
          baseline.tai_chinh.hoa_don_chua_thu + 15,
        );
        assert.equal(r.tai_chinh.can_con_no, baseline.tai_chinh.can_con_no + 1);
        assert.equal(
          r.tai_chinh.hoa_don_qua_han,
          baseline.tai_chinh.hoa_don_qua_han + 1,
        );
        assert.ok(r.tai_chinh.hoa_don.length <= 5);
        const detail = await req("/bao_cao/cong_no");
        assert.equal(
          r.tai_chinh.con_phai_thu,
          detail.body.summary.con_phai_thu,
        );
        assert.equal(r.tai_chinh.no_qua_han, detail.body.summary.no_qua_han);
      },
    );
    await t.test(
      "receipts follow Vietnam collection day rather than invoice month, including exact midnight boundaries",
      async () => {
        const start = `${day.slice(0, 7)}-01`,
          before = new Date(
            new Date(`${start}T00:00:00+07:00`).getTime() - 1000,
          )
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        await bill("DA_THANH_TOAN", "100", null, before);
        await bill("DA_THANH_TOAN", "200", null, utc(start));
        await bill("DA_THANH_TOAN", "300", null, utc(day));
        await bill("DA_THANH_TOAN", "400", null, utc(shift(1)));
        const r = await read();
        assert.equal(
          r.tai_chinh.thu_trong_thang,
          (BigInt(baseline.tai_chinh.thu_trong_thang) + 500n).toString(),
        );
        const detail = await req(
          `/bao_cao/thu_phi?tu_ngay=${start}&den_ngay=${day}`,
        );
        assert.equal(
          r.tai_chinh.thu_trong_thang,
          detail.body.summary.tong_da_thu,
        );
      },
    );
    location = (
      await rows(
        pool,
        "INSERT INTO vi_tri_qr (ten_vi_tri,token_qr,ma_nguoi_tao) VALUES (?,?,?)",
        [`Vị trí ${suffix}`, randomUUID(), admin.id],
      )
    ).insertId;
    await t.test(
      "open incident counts and drill-down exclude closed/rejected records, retain account scope and cap queues",
      async () => {
        for (const state of [
          "MOI",
          "MOI",
          "DA_PHAN_CONG",
          "DANG_XU_LY",
          "DA_XU_LY",
          "DA_DONG",
          "TU_CHOI",
        ])
          await incident(state);
        const r = await read();
        assert.equal(r.phan_anh.dang_mo, baseline.phan_anh.dang_mo + 5);
        assert.equal(r.phan_anh.moi, baseline.phan_anh.moi + 2);
        const detail = await req("/phan_anh?trang_thai=DANG_MO");
        assert.equal(detail.body.meta.total, r.phan_anh.dang_mo);
        const scoped = await req(
          `/phan_anh?trang_thai=DANG_MO&q=${suffix}`,
          tech.cookie,
        );
        assert.equal(scoped.body.meta.total, 0);
        assert.ok(r.phan_anh.danh_sach.length <= 5);
        for (const record of r.phan_anh.danh_sach)
          assert.ok(
            ["MOI", "DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY"].includes(
              record.trang_thai,
            ),
          );
      },
    );
    await t.test(
      "maintenance dates match existing equipment/job filters and exclude canceled jobs or retired assets",
      async () => {
        for (const due of [shift(-1), day, shift(7), shift(8), null]) {
          equipment.push(
            (
              await rows(
                pool,
                "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,trang_thai,chu_ky_ngay,ngay_bao_tri_tiep_theo,nhac_truoc_ngay,ma_nguoi_tao) VALUES (?,?,'DIEN','Tầng 1',?,?,?,7,?)",
                [
                  `OV-${suffix}-${equipment.length}`,
                  "Thiết bị tổng quan",
                  due ? "DANG_SU_DUNG" : "NGUNG_SU_DUNG",
                  due ? 30 : null,
                  due,
                  admin.id,
                ],
              )
            ).insertId,
          );
        }
        for (const [state, due] of [
          ["MOI", shift(-1)],
          ["CHO_NGHIEM_THU", day],
          ["DA_PHAN_CONG", day],
          ["HUY", shift(-1)],
        ])
          await rows(
            pool,
            "INSERT INTO phieu_bao_tri (ma_thiet_bi,loai,tieu_de,noi_dung,ten_thiet_bi_luc_lap,vi_tri_luc_lap,ngay_lap,ngay_den_han,trang_thai,ma_ky_thuat_vien,ma_nguoi_lap,khoa_yeu_cau,van_tay,ket_qua,ngay_thuc_hien,ma_nguoi_huy,ly_do_huy) VALUES (?,'DOT_XUAT','Theo dõi tổng quan','Kiểm tra thiết bị','Thiết bị','Tầng 1',?,?,?,?,?,?,?, ?,?,?,?)",
            [
              equipment[0],
              shift(-30),
              due,
              state,
              ["CHO_NGHIEM_THU", "DA_PHAN_CONG"].includes(state)
                ? tech.id
                : null,
              admin.id,
              randomUUID(),
              "a".repeat(64),
              state === "CHO_NGHIEM_THU"
                ? "Đã thực hiện kiểm tra thiết bị."
                : "",
              state === "CHO_NGHIEM_THU" ? day : null,
              state === "HUY" ? admin.id : null,
              state === "HUY" ? "Hủy thử nghiệm" : "",
            ],
          );
        const r = await read();
        assert.equal(
          r.bao_tri.phieu_qua_han,
          baseline.bao_tri.phieu_qua_han + 1,
        );
        assert.equal(
          r.bao_tri.cho_nghiem_thu,
          baseline.bao_tri.cho_nghiem_thu + 1,
        );
        assert.equal(
          r.bao_tri.thiet_bi_qua_han,
          baseline.bao_tri.thiet_bi_qua_han + 1,
        );
        assert.equal(
          r.bao_tri.thiet_bi_sap_den_han,
          baseline.bao_tri.thiet_bi_sap_den_han + 2,
        );
        assert.equal(
          r.bao_tri.thiet_bi_qua_han,
          (await req("/thiet_bi?lich=QUA_HAN")).body.total,
        );
        assert.equal(
          r.bao_tri.phieu_qua_han,
          (await req("/bao_tri?qua_han=1")).body.total,
        );
        assert.ok(r.bao_tri.danh_sach.length <= 5);
      },
    );
    await t.test(
      "amenities keep past pending counts but omit expired/rejected/canceled bookings from upcoming queue",
      async () => {
        person = (
          await rows(
            pool,
            "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES ('Cư dân tổng quan','0901234567',?)",
            [resident.id],
          )
        ).insertId;
        stay = (
          await rows(
            pool,
            "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN',?,?)",
            [person, apartments[0], shift(-30), admin.id],
          )
        ).insertId;
        facility = (
          await rows(
            pool,
            "INSERT INTO tien_ich (ten_tien_ich,vi_tri,mo_ta,suc_chua,gio_mo,gio_dong,toi_da_phut,dat_truoc_ngay,ma_nguoi_tao) VALUES (?,'Tầng 1','Thử tổng quan',20,'06:00','23:30',120,30,?)",
            [`Tiện ích ${suffix}`, admin.id],
          )
        ).insertId;
        for (const [state, when] of [
          ["DA_DUYET", day],
          ["DA_DUYET", shift(1)],
          ["CHO_DUYET", shift(1)],
          ["CHO_DUYET", shift(-1)],
          ["DA_HUY", shift(1)],
          ["TU_CHOI", shift(1)],
        ])
          await rows(
            pool,
            "INSERT INTO dat_lich_tien_ich (ma_tien_ich,ma_can_ho,ma_nguoi_dat,ma_cu_dan,ma_lich_su_cu_tru,ten_tien_ich,vi_tri,ten_nguoi_dat,bat_dau,ket_thuc,so_nguoi,ghi_chu,trang_thai,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,'Tầng 1','Cư dân',?,?,2,'',?,?,?)",
            [
              facility,
              apartments[0],
              resident.id,
              person,
              stay,
              `Tiện ích ${suffix}`,
              `${when} 06:00:00`,
              `${when} 07:00:00`,
              state,
              randomUUID(),
              "b".repeat(64),
            ],
          );
        const r = await read();
        assert.equal(r.tien_ich.cho_duyet, baseline.tien_ich.cho_duyet + 2);
        assert.equal(
          r.tien_ich.da_duyet_hom_nay,
          baseline.tien_ich.da_duyet_hom_nay + 1,
        );
        assert.ok(r.tien_ich.danh_sach.length <= 5);
        assert.equal(
          r.tien_ich.cho_duyet,
          (await req("/dat_lich_tien_ich?trang_thai=CHO_DUYET")).body.total,
        );
        for (const record of r.tien_ich.danh_sach) {
          assert.ok(["CHO_DUYET", "DA_DUYET"].includes(record.trang_thai));
          assert.ok(record.ket_thuc > r.gio_hien_tai);
        }
      },
    );
    await t.test(
      "a concurrent write between financial and incident reads appears only in the next snapshot",
      async () => {
        const before = await read(),
          original = pool.getConnection;
        let changed = false;
        pool.getConnection = async function () {
          const db = await original.call(pool),
            execute = db.execute,
            release = db.release;
          db.execute = async function (sql, values) {
            const result = await execute.call(db, sql, values);
            if (!changed && sql.includes("AS thu_trong_thang")) {
              changed = true;
              await incident("MOI", "KHAN_CAP");
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
          const r = await read();
          assert.ok(changed);
          assert.equal(r.phan_anh.dang_mo, before.phan_anh.dang_mo);
        } finally {
          pool.getConnection = original;
        }
        const after = await read();
        assert.equal(after.phan_anh.dang_mo, before.phan_anh.dang_mo + 1);
        assert.equal(after.phan_anh.danh_sach[0].do_uu_tien, "KHAN_CAP");
      },
    );
    await t.test(
      "refresh GETs never alter domain states or create audit records",
      async () => {
        const counts = async () =>
          (
            await rows(
              pool,
              "SELECT (SELECT COUNT(*) FROM lich_su_hoa_don) AS bills,(SELECT COUNT(*) FROM lich_su_bao_tri) AS maintenance,(SELECT COUNT(*) FROM lich_su_dat_lich) AS bookings,(SELECT COUNT(*) FROM lich_su_phan_anh) AS incidents",
            )
          )[0];
        const before = await counts();
        await read();
        await read();
        assert.deepEqual(await counts(), before);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    if (location) {
      await rows(pool, "DELETE FROM phan_anh WHERE ma_vi_tri_qr=?", [location]);
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
        location,
      ]);
    }
    if (facility) {
      await rows(pool, "DELETE FROM dat_lich_tien_ich WHERE ma_tien_ich=?", [
        facility,
      ]);
      await rows(pool, "DELETE FROM tien_ich WHERE ma_tien_ich=?", [facility]);
    }
    if (stay)
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?", [
        stay,
      ]);
    if (person)
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [person]);
    for (const id of equipment) {
      await rows(pool, "DELETE FROM phieu_bao_tri WHERE ma_thiet_bi=?", [id]);
      await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
    }
    for (const id of apartments) {
      await rows(pool, "DELETE FROM hoa_don WHERE ma_can_ho=?", [id]);
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    }
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
