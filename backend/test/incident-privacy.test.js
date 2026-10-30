import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { cleanupImages } from "../src/lib/images.js";
import { action } from "../src/modules/billing/billing.service.js";
import { findUser } from "../src/modules/auth/auth.repository.js";
import { today } from "../src/modules/billing/billing.validation.js";

test("MySQL: household handover inherits bills, never the previous person's reports or photos", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(18).toString("hex");
  const number = () =>
    "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
  const reports = [],
    residents = [],
    images = [],
    users = [];
  let apartment, location, bill;
  async function req(path, method = "GET", body, cookie) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "X-App-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    const data = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.arrayBuffer();
    return {
      status: response.status,
      body: data,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const login = async (credentials) => {
    const r = await req("/xac_thuc/dang_nhap", "POST", credentials);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.cookie;
  };
  const accountLogin = (c) =>
    login({ ten_dang_nhap: c.ten_dang_nhap, mat_khau: c.mat_khau_tam_thoi });
  try {
    const adminPhone = number();
    const adminId = (
      await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [suffix, adminPhone, await bcrypt.hash(password, 10)],
      )
    ).insertId;
    users.push(adminId);
    const admin = await login({
      so_dien_thoai: adminPhone,
      mat_khau: password,
    });
    const a = await req(
      "/can_ho",
      "POST",
      {
        so_can_ho: `PR-${suffix}`,
        khoi: "PR",
        tang: 1,
        dien_tich_m2: "50",
        tinh_phi_dich_vu: false,
      },
      admin,
    );
    assert.equal(a.status, 201, JSON.stringify(a.body));
    apartment = a.body.data.ma_can_ho;
    const initial = a.body.data.tai_khoan_can_ho;
    users.push(initial.ma_nguoi_dung);
    const loc = await req(
      "/vi_tri_qr",
      "POST",
      { ten_vi_tri: `Privacy-${suffix}`, loai: "KHU_VUC" },
      admin,
    );
    assert.equal(loc.status, 201);
    location = loc.body.data.ma_vi_tri_qr;
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#00aa55" },
    })
      .png()
      .toBuffer();
    async function send(cookie, extra = {}) {
      const form = new FormData();
      const key = randomUUID();
      for (const [k, v] of Object.entries({
        token_qr: loc.body.data.token_qr,
        khoa_yeu_cau: key,
        tieu_de: `Đèn hỏng ${suffix}`,
        noi_dung: "Nội dung phản ánh riêng của người gửi",
        ten_nguoi_gui: "Người gửi riêng",
        so_dien_thoai: number(),
        loai_su_co: "DIEN",
        xac_nhan_gui: "true",
        ...extra,
      }))
        form.set(k, v);
      form.append(
        "hinh_anh",
        new Blob([png], { type: "image/png" }),
        "test.png",
      );
      const r = await req("/cong_khai/phan_anh", "POST", form, cookie);
      if (r.status === 201) {
        const [saved] = await rows(
          pool,
          "SELECT * FROM phan_anh WHERE khoa_yeu_cau=?",
          [key],
        );
        reports.push(saved.ma_phan_anh);
        images.push(
          ...(
            await rows(
              pool,
              "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=?",
              [saved.ma_phan_anh],
            )
          ).map((i) => i.duong_dan_tep),
        );
        return { ...r, saved };
      }
      return r;
    }
    const unassigned = await send(await accountLogin(initial));
    assert.equal(unassigned.status, 422);
    assert.equal(unassigned.body.error.code, "HOUSEHOLDER_REQUIRED");
    async function owner(name, confirmed = false) {
      const r = await req(
        "/cu_dan",
        "POST",
        {
          ho_va_ten: `${suffix}-${name}`,
          so_dien_thoai: number(),
          ma_can_ho: apartment,
          quan_he: "CHU_HO",
          ngay: today(),
          xac_nhan_ban_giao: confirmed,
        },
        admin,
      );
      assert.equal(r.status, 201, JSON.stringify(r.body));
      residents.push(r.body.data.ma_cu_dan);
      return r.body.data;
    }
    const first = await owner("owner1");
    let firstCookie = await accountLogin(first.tai_khoan_can_ho);
    const own = await send(firstCookie, { ma_cu_dan_nguoi_gui: 99999999 });
    assert.equal(own.status, 201, JSON.stringify(own.body));
    assert.equal(own.saved.ma_cu_dan_nguoi_gui, first.ma_cu_dan);
    assert.equal(own.saved.gui_tu_tai_khoan_can_ho, 1);
    const id = own.saved.ma_phan_anh;
    const d = await req(`/phan_anh/${id}`, "GET", null, firstCookie);
    const imageId = d.body.data.hinh_anh[0].ma_hinh_anh_phan_anh;
    assert.equal(
      (
        await req(
          `/phan_anh/${id}/hinh_anh/${imageId}`,
          "GET",
          null,
          firstCookie,
        )
      ).status,
      200,
    );
    // Legacy apartment report: no reliable sender identity. It must not be guessed.
    const legacy = (
      await rows(
        pool,
        `INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co,gui_tu_tai_khoan_can_ho) VALUES (?,?,?,?,?,?,?,?,?,1)`,
        [
          randomBytes(32).toString("hex"),
          randomUUID(),
          location,
          initial.ma_nguoi_dung,
          "Legacy",
          number(),
          "Phản ánh cũ",
          "Dữ liệu chưa có danh tính",
          "DIEN",
        ],
      )
    ).insertId;
    reports.push(legacy);
    assert.equal(
      (await req(`/phan_anh/${legacy}`, "GET", null, firstCookie)).status,
      404,
    );
    // Existing sent invoice remains attached to the apartment across handover.
    bill = (
      await rows(
        pool,
        "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,tong_tien) VALUES (?,?, '2026-09','2026-09-30',1,0,0,0,JSON_ARRAY(),?,?,'DA_GUI',100000)",
        [`PR-${suffix}`, apartment, "a".repeat(64), adminId],
      )
    ).insertId;
    const second = await owner("owner2", true);
    let secondCookie = await accountLogin(second.tai_khoan_can_ho);
    assert.equal(
      (await req(`/phan_anh/${id}`, "GET", null, firstCookie)).status,
      401,
    );
    assert.equal(
      (await req(`/phan_anh/${id}`, "GET", null, secondCookie)).status,
      404,
    );
    assert.equal(
      (await req(`/phan_anh/${legacy}`, "GET", null, secondCookie)).status,
      404,
    );
    assert.equal(
      (
        await req(
          `/phan_anh/${id}/hinh_anh/${imageId}`,
          "GET",
          null,
          secondCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await req("/phan_anh", "GET", null, secondCookie)).body.meta.total,
      0,
    );
    assert.equal(
      (await req(`/phan_anh/${id}`, "GET", null, admin)).status,
      200,
    );
    assert.equal(
      (await req(`/cua_toi/hoa_don/${bill}`, "GET", null, secondCookie)).status,
      200,
    );
    const secondReport = await send(secondCookie);
    assert.equal(secondReport.status, 201);
    const reset = await req(
      `/can_ho/${apartment}/tai_khoan`,
      "POST",
      {
        thao_tac: "cap_lai_mat_khau",
        phien_ban_ban_giao: second.tai_khoan_can_ho.phien_ban_ban_giao,
      },
      admin,
    );
    assert.equal(reset.status, 200);
    secondCookie = await accountLogin(reset.body.data);
    assert.equal(
      (
        await req(
          `/phan_anh/${secondReport.saved.ma_phan_anh}`,
          "GET",
          null,
          secondCookie,
        )
      ).status,
      200,
    );
    // Same person via a personal account retains only their own report.
    const personalPhone = number();
    const personal = (
      await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'CU_DAN')",
        [suffix, personalPhone, await bcrypt.hash(password, 10)],
      )
    ).insertId;
    users.push(personal);
    await rows(pool, "UPDATE cu_dan SET ma_nguoi_dung=? WHERE ma_cu_dan=?", [
      personal,
      first.ma_cu_dan,
    ]);
    const personalCookie = await login({
      so_dien_thoai: personalPhone,
      mat_khau: password,
      loai_tai_khoan: "CA_NHAN",
    });
    assert.equal(
      (await req(`/phan_anh/${id}`, "GET", null, personalCookie)).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/phan_anh/${secondReport.saved.ma_phan_anh}`,
          "GET",
          null,
          personalCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await req("/phan_anh", "GET", null, personalCookie)).body.meta.total,
      1,
    );

    await t.test(
      "real row-lock wait: revoked collector cannot confirm payment or append audit",
      async () => {
        const collector = await findUser(adminId);
        const blocker = await pool.getConnection();
        const writer = await pool.getConnection();
        try {
          await blocker.beginTransaction();
          await writer.beginTransaction();
          await rows(
            blocker,
            "SELECT ma_can_ho FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
            [apartment],
          );
          let entered;
          const waiting = new Promise((resolve) => {
            entered = resolve;
          });
          const connection = {
            execute(sql, values) {
              const result = writer.execute(sql, values);
              if (sql === "SELECT * FROM can_ho WHERE ma_can_ho=? FOR UPDATE")
                entered();
              return result;
            },
          };
          const pending = action(
            bill,
            "xac_nhan_thanh_toan",
            { phien_ban: 0, so_tien: "100000", ma_tham_chieu: `PR-${suffix}` },
            collector,
            connection,
          );
          const denied = assert.rejects(pending, {
            status: 401,
            code: "SESSION_EXPIRED",
          });
          // Observe the real locking query being dispatched, without sleeps or
          // privileged performance_schema access in the ordinary test account.
          await waiting;
          // While the apartment is locked, no invoice mutation can pass. Revocation
          // commits first; releasing the blocker then allows a current locking read.
          await rows(
            pool,
            "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
            [adminId],
          );
          await blocker.commit();
          await denied;
          const [h] = await rows(
            pool,
            "SELECT trang_thai,phien_ban FROM hoa_don WHERE ma_hoa_don=?",
            [bill],
          );
          assert.equal(h.trang_thai, "DA_GUI");
          assert.equal(h.phien_ban, 0);
          const [audit] = await rows(
            pool,
            "SELECT COUNT(*) AS n FROM lich_su_hoa_don WHERE ma_hoa_don=?",
            [bill],
          );
          assert.equal(audit.n, 0);
        } finally {
          await writer.rollback();
          writer.release();
          await blocker.rollback();
          blocker.release();
        }
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of reports.reverse()) {
      await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM hinh_anh_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE ma_phan_anh=?", [id]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [id]);
    }
    await cleanupImages(images);
    if (bill)
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [bill]);
    if (location)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
        location,
      ]);
    for (const id of residents) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    if (apartment)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartment]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
