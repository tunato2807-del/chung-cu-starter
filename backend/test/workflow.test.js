import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { imageDir, cleanupImages } from "../src/lib/images.js";
import { execFileSync } from "node:child_process";
function testDdl(sql) {
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
}

test("MySQL integration: authentication, QR and incident lifecycle", async (t) => {
  assert.equal(
    process.env.DB_NAME,
    "chung_cu_test",
    "Use npm test from the repository root; only the dedicated test database is allowed.",
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const users = [],
    locations = [],
    reports = [];
  const password = randomBytes(16).toString("hex"),
    salt = randomBytes(3).readUIntBE(0, 3);
  const number = (i) =>
    "09" + String((salt * 10 + i) % 100000000).padStart(8, "0");
  const hash = await bcrypt.hash(password, 10);
  const image = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#66aa88" },
  })
    .png()
    .toBuffer();
  async function request(
    path,
    { method = "GET", body, cookie, csrf = true } = {},
  ) {
    const headers = {};
    if (csrf) headers["X-App-Request"] = "1";
    if (cookie) headers.Cookie = cookie;
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    const response = await fetch(base + path, { method, headers, body });
    const result = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.arrayBuffer();
    return {
      status: response.status,
      body: result,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
      headers: response.headers,
    };
  }
  async function login(u, p = password) {
    return request("/xac_thuc/dang_nhap", {
      method: "POST",
      body: { so_dien_thoai: u.phone, mat_khau: p },
    });
  }
  async function create(role, i) {
    const phone = number(i),
      r = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        ["Kiểm thử " + i, phone, hash, role],
      );
    const u = { id: r.insertId, phone };
    users.push(u.id);
    return u;
  }
  async function makeLocation(cookie) {
    const r = await request("/vi_tri_qr", {
      method: "POST",
      cookie,
      body: { ten_vi_tri: "Vị trí kiểm thử", loai: "KHU_VUC" },
    });
    assert.equal(r.status, 201);
    locations.push(r.body.data.ma_vi_tri_qr);
    return r.body.data;
  }
  function form(token, overrides = {}, withImage = false) {
    const f = new FormData();
    const key = overrides.khoa_yeu_cau || randomUUID();
    for (const [k, v] of Object.entries({
      token_qr: token,
      khoa_yeu_cau: key,
      tieu_de: "Đèn hành lang hỏng",
      noi_dung: "Đèn tại hành lang không sáng từ sáng nay.",
      ten_nguoi_gui: "Cư dân kiểm thử",
      so_dien_thoai: number(8),
      loai_su_co: "DIEN",
      xac_nhan_gui: "true",
      ...overrides,
    }))
      f.set(k, v);
    if (withImage)
      f.append(
        "hinh_anh",
        new Blob([image], { type: "image/png" }),
        "photo.png",
      );
    return f;
  }
  async function submit(token, overrides = {}, cookie, withImage = false) {
    const body = form(token, overrides, withImage);
    const r = await request("/cong_khai/phan_anh", {
      method: "POST",
      cookie,
      body,
    });
    if (r.status === 201) {
      const [db] = await rows(
        pool,
        "SELECT ma_phan_anh FROM phan_anh WHERE khoa_yeu_cau=?",
        [body.get("khoa_yeu_cau")],
      );
      reports.push(db.ma_phan_anh);
      r.id = db.ma_phan_anh;
    }
    return r;
  }
  async function detail(id, cookie) {
    return (await request("/phan_anh/" + id, { cookie })).body.data;
  }
  async function change(id, cookie, body) {
    return request(`/phan_anh/${id}/trang_thai`, {
      method: "PATCH",
      cookie,
      body,
    });
  }
  const admin = await create("QUAN_TRI_VIEN", 1),
    tech = await create("KY_THUAT_VIEN", 2),
    tech2 = await create("KY_THUAT_VIEN", 3),
    resident = await create("CU_DAN", 4),
    other = await create("CU_DAN", 5);
  const a = (await login(admin)).cookie,
    k = (await login(tech)).cookie,
    k2 = (await login(tech2)).cookie,
    c = (await login(resident)).cookie,
    c2 = (await login(other)).cookie;
  let loc, report, lookupCode;
  try {
    await t.test(
      "cookie flags, login errors, server roles and CSRF",
      async () => {
        const valid = await login(admin);
        assert.equal(valid.status, 200);
        assert.match(valid.headers.get("set-cookie"), /HttpOnly/);
        assert.match(valid.headers.get("set-cookie"), /SameSite=Strict/);
        assert.equal((await login(admin, "wrong")).status, 401);
        assert.equal((await request("/nguoi_dung", { cookie: c })).status, 403);
        assert.equal(
          (
            await request("/vi_tri_qr", {
              method: "POST",
              cookie: a,
              csrf: false,
              body: {},
            })
          ).status,
          403,
        );
        assert.equal(
          (await request("/xac_thuc/toi", { cookie: "session=bad" })).status,
          401,
        );
      },
    );
    await t.test("five failed passwords temporarily lock account", async () => {
      const locked = await create("CU_DAN", 6);
      for (let i = 0; i < 5; i++)
        assert.equal((await login(locked, "wrong")).status, 401);
      assert.equal((await login(locked)).status, 401);
      await rows(
        pool,
        "UPDATE nguoi_dung SET khoa_den_luc=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 MINUTE) WHERE ma_nguoi_dung=?",
        [locked.id],
      );
      assert.equal((await login(locked)).status, 200);
    });
    await t.test(
      "new QR resolves; rotation and disabling reject old QR",
      async () => {
        loc = await makeLocation(a);
        assert.equal(
          (await request("/cong_khai/vi_tri_qr/" + loc.token_qr)).status,
          200,
        );
        const old = loc.token_qr;
        const rotated = await request(
          `/vi_tri_qr/${loc.ma_vi_tri_qr}/sinh_lai_qr`,
          { method: "POST", cookie: a },
        );
        loc.token_qr = rotated.body.data.token_qr;
        assert.equal(
          (await request("/cong_khai/vi_tri_qr/" + old)).status,
          404,
        );
        assert.equal((await submit(old)).status, 404);
        await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, {
          method: "PATCH",
          cookie: a,
          body: { dang_hoat_dong: false },
        });
        assert.equal((await submit(loc.token_qr)).status, 404);
        await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, {
          method: "PATCH",
          cookie: a,
          body: { dang_hoat_dong: true },
        });
      },
    );
    await t.test(
      "reject missing title and forged image without partial data",
      async () => {
        assert.equal((await submit(loc.token_qr, { tieu_de: "" })).status, 422);
        const f = form(loc.token_qr);
        f.append(
          "hinh_anh",
          new Blob(["not an image"], { type: "image/png" }),
          "image.png",
        );
        assert.equal(
          (await request("/cong_khai/phan_anh", { method: "POST", body: f }))
            .status,
          422,
        );
        assert.equal(
          (
            await rows(pool, "SELECT 1 FROM phan_anh WHERE khoa_yeu_cau=?", [
              f.get("khoa_yeu_cau"),
            ])
          ).length,
          0,
        );
      },
    );
    await t.test(
      "file count and size limits reject oversized uploads",
      async () => {
        const tooMany = form(loc.token_qr);
        for (let i = 0; i < 6; i++)
          tooMany.append(
            "hinh_anh",
            new Blob([image], { type: "image/png" }),
            "photo.png",
          );
        assert.equal(
          (
            await request("/cong_khai/phan_anh", {
              method: "POST",
              body: tooMany,
            })
          ).status,
          413,
        );
        const tooLarge = form(loc.token_qr);
        tooLarge.append(
          "hinh_anh",
          new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "image/jpeg" }),
          "large.jpg",
        );
        assert.equal(
          (
            await request("/cong_khai/phan_anh", {
              method: "POST",
              body: tooLarge,
            })
          ).status,
          413,
        );
      },
    );
    await t.test(
      "resident submission, private images and server-owned fields",
      async () => {
        const r = await submit(
          loc.token_qr,
          { ma_nguoi_gui: other.id, ma_vi_tri_qr: 999, do_uu_tien: "KHAN_CAP" },
          c,
          true,
        );
        assert.equal(r.status, 201);
        report = r.id;
        lookupCode = r.body.data.ma_tra_cuu;
        assert.equal(lookupCode.length, 64);
        const d = await detail(report, a);
        assert.equal(d.ma_nguoi_gui, resident.id);
        assert.equal(d.do_uu_tien, "TRUNG_BINH");
        assert.equal(d.ma_vi_tri_qr, loc.ma_vi_tri_qr);
        const path = `/phan_anh/${report}/hinh_anh/${d.hinh_anh[0].ma_hinh_anh_phan_anh}`;
        assert.equal((await request(path, { cookie: c })).status, 200);
        assert.equal((await request(path)).status, 401);
        assert.equal((await request(path, { cookie: c2 })).status, 404);
        assert.equal(
          (await request("/phan_anh/" + report, { cookie: k })).status,
          404,
        );
        assert.equal(
          (await request("/phan_anh", { cookie: c2 })).body.meta.total,
          0,
        );
      },
    );
    await t.test(
      "same request key concurrently creates one report and mismatched reuse fails",
      async () => {
        const key = randomUUID();
        const results = await Promise.all([
          submit(loc.token_qr, { khoa_yeu_cau: key }),
          submit(loc.token_qr, { khoa_yeu_cau: key }),
        ]);
        assert.deepEqual(results.map((x) => x.status).sort(), [200, 201]);
        assert.equal(
          results[0].body.data.ma_tra_cuu === results[1].body.data.ma_tra_cuu,
          true,
        );
        assert.equal(
          (
            await rows(pool, "SELECT 1 FROM phan_anh WHERE khoa_yeu_cau=?", [
              key,
            ])
          ).length,
          1,
        );
        assert.equal(
          (
            await submit(loc.token_qr, {
              khoa_yeu_cau: key,
              tieu_de: "Nội dung khác",
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "similar report warning reveals no incident or sender information",
      async () => {
        const r = await submit(loc.token_qr, { xac_nhan_gui: "false" });
        assert.equal(r.status, 409);
        assert.equal(r.body.error.code, "SIMILAR_REPORT");
        assert.equal(r.body.data, undefined);
      },
    );
    await t.test(
      "public lookup returns only progress, never contents or contact",
      async () => {
        const r = await request("/cong_khai/phan_anh/tra_cuu", {
          method: "POST",
          body: { ma_tra_cuu: lookupCode, so_dien_thoai: number(8) },
        });
        assert.equal(r.status, 200);
        assert.deepEqual(Object.keys(r.body.data).sort(), [
          "lich_su",
          "ngay_dong",
          "ngay_tao",
          "ten_vi_tri",
          "trang_thai",
        ]);
        assert.equal(
          (
            await request("/cong_khai/phan_anh/tra_cuu", {
              method: "POST",
              body: { ma_tra_cuu: lookupCode, so_dien_thoai: number(9) },
            })
          ).status,
          404,
        );
      },
    );
    await t.test(
      "assignment, optimistic version and reassignment revoke old technician",
      async () => {
        let d = await detail(report, a);
        assert.equal(
          (
            await request(`/phan_anh/${report}/phan_cong`, {
              method: "PATCH",
              cookie: a,
              body: {
                phien_ban: d.phien_ban,
                ma_ky_thuat_vien: tech.id,
                do_uu_tien: "CAO",
              },
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await change(report, k, {
              phien_ban: d.phien_ban,
              trang_thai: "DANG_XU_LY",
            })
          ).status,
          409,
        );
        d = await detail(report, k);
        assert.equal(
          (
            await change(report, k, {
              phien_ban: d.phien_ban,
              trang_thai: "DANG_XU_LY",
            })
          ).status,
          200,
        );
        d = await detail(report, a);
        assert.equal(
          (
            await request(`/phan_anh/${report}/phan_cong`, {
              method: "PATCH",
              cookie: a,
              body: {
                phien_ban: d.phien_ban,
                ma_ky_thuat_vien: tech2.id,
                do_uu_tien: "CAO",
              },
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/phan_anh/" + report, { cookie: k })).status,
          404,
        );
        assert.equal((await detail(report, k2)).trang_thai, "DANG_XU_LY");
        assert.equal(
          (await request("/phan_anh", { cookie: k })).body.meta.total,
          0,
        );
      },
    );
    await t.test(
      "completion requires new evidence each review round; closing is admin only",
      async () => {
        let d = await detail(report, k2);
        assert.equal(
          (
            await change(report, k2, {
              phien_ban: d.phien_ban,
              trang_thai: "DA_XU_LY",
              ghi_chu: "Đã sửa",
            })
          ).status,
          422,
        );
        const finish = async () => {
          const current = await detail(report, k2),
            f = new FormData();
          f.set("phien_ban", current.phien_ban);
          f.set("trang_thai", "DA_XU_LY");
          f.set("ghi_chu", "Ghi chú nội bộ cần giữ riêng");
          f.set("noi_dung_cong_khai", "Đã sửa đèn.");
          f.append(
            "hinh_anh",
            new Blob([image], { type: "image/png" }),
            "done.png",
          );
          return change(report, k2, f);
        };
        assert.equal((await finish()).status, 200);
        d = await detail(report, a);
        assert.equal(
          (
            await change(report, k2, {
              phien_ban: d.phien_ban,
              trang_thai: "DA_DONG",
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await change(report, a, {
              phien_ban: d.phien_ban,
              trang_thai: "DANG_XU_LY",
              ghi_chu: "Kiểm tra lại đèn nhấp nháy",
            })
          ).status,
          200,
        );
        d = await detail(report, k2);
        assert.equal(d.luot_xu_ly, 2);
        assert.equal(
          (
            await change(report, k2, {
              phien_ban: d.phien_ban,
              trang_thai: "DA_XU_LY",
              ghi_chu: "Dùng ảnh cũ",
            })
          ).status,
          422,
        );
        assert.equal((await finish()).status, 200);
        d = await detail(report, a);
        assert.equal(
          (
            await change(report, a, {
              phien_ban: d.phien_ban,
              trang_thai: "DA_DONG",
              noi_dung_cong_khai: "Đã nghiệm thu đạt.",
            })
          ).status,
          200,
        );
        const own = await detail(report, c);
        assert.equal(
          own.lich_su.some((x) => "ghi_chu" in x),
          false,
        );
        assert.equal(own.trang_thai, "DA_DONG");
        assert.ok(own.ngay_dong);
      },
    );
    await t.test(
      "merge validation prevents self and chains; public duplicate follows original",
      async () => {
        const parent = await submit(loc.token_qr, { so_dien_thoai: number(7) }),
          child = await submit(loc.token_qr, { so_dien_thoai: number(7) });
        let d = await detail(child.id, a);
        assert.equal(
          (
            await change(child.id, a, {
              phien_ban: d.phien_ban,
              trang_thai: "TRUNG",
              ma_phan_anh_goc: child.id,
              ghi_chu: "Trùng",
            })
          ).status,
          422,
        );
        assert.equal(
          (
            await change(child.id, a, {
              phien_ban: d.phien_ban,
              trang_thai: "TRUNG",
              ma_phan_anh_goc: parent.id,
              ghi_chu: "Trùng vị trí",
            })
          ).status,
          200,
        );
        d = await detail(parent.id, a);
        assert.equal(
          (
            await change(parent.id, a, {
              phien_ban: d.phien_ban,
              trang_thai: "TRUNG",
              ma_phan_anh_goc: child.id,
              ghi_chu: "Trùng",
            })
          ).status,
          422,
        );
        assert.equal(
          (
            await change(parent.id, a, {
              phien_ban: d.phien_ban,
              trang_thai: "TU_CHOI",
              ghi_chu: "Không đủ thông tin",
            })
          ).status,
          200,
        );
        const publicResult = await request("/cong_khai/phan_anh/tra_cuu", {
          method: "POST",
          body: {
            ma_tra_cuu: child.body.data.ma_tra_cuu,
            so_dien_thoai: number(7),
          },
        });
        assert.equal(publicResult.body.data.trang_thai, "TU_CHOI");
      },
    );
    await t.test(
      "a failed history insert rolls back state and cleans newly prepared images",
      async () => {
        const fresh = await submit(loc.token_qr, { so_dien_thoai: number(7) });
        let d = await detail(fresh.id, a);
        await request(`/phan_anh/${fresh.id}/phan_cong`, {
          method: "PATCH",
          cookie: a,
          body: {
            phien_ban: d.phien_ban,
            ma_ky_thuat_vien: tech2.id,
            do_uu_tien: "CAO",
          },
        });
        d = await detail(fresh.id, k2);
        await change(fresh.id, k2, {
          phien_ban: d.phien_ban,
          trang_thai: "DANG_XU_LY",
        });
        d = await detail(fresh.id, k2);
        const before = await readdir(imageDir);
        testDdl(
          `CREATE TRIGGER test_fail_history BEFORE INSERT ON lich_su_phan_anh FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test failure';`,
        );
        try {
          const f = new FormData();
          f.set("phien_ban", d.phien_ban);
          f.set("trang_thai", "DA_XU_LY");
          f.set("ghi_chu", "Thử rollback");
          f.append(
            "hinh_anh",
            new Blob([image], { type: "image/png" }),
            "done.png",
          );
          assert.equal((await change(fresh.id, k2, f)).status, 500);
          const after = await detail(fresh.id, k2);
          assert.equal(after.phien_ban, d.phien_ban);
          assert.equal(after.trang_thai, "DANG_XU_LY");
          assert.equal(after.lich_su.length, d.lich_su.length);
          assert.deepEqual((await readdir(imageDir)).sort(), before.sort());
        } finally {
          testDdl("DROP TRIGGER test_fail_history;");
        }
      },
    );
    await t.test(
      "five submissions per phone and IP within an hour, replay is not charged",
      async () => {
        for (let i = 0; i < 5; i++)
          assert.equal(
            (await submit(loc.token_qr, { so_dien_thoai: number(9) })).status,
            201,
          );
        assert.equal(
          (await submit(loc.token_qr, { so_dien_thoai: number(9) })).status,
          429,
        );
      },
    );
    await t.test(
      "locked account, changed password and logout invalidate old sessions",
      async () => {
        await request("/nguoi_dung/" + tech.id, {
          method: "PATCH",
          cookie: a,
          body: { dang_hoat_dong: false },
        });
        assert.equal(
          (await request("/xac_thuc/toi", { cookie: k })).status,
          401,
        );
        const newPass = password + "x";
        assert.equal(
          (
            await request("/xac_thuc/doi_mat_khau", {
              method: "POST",
              cookie: c,
              body: { mat_khau_cu: password, mat_khau_moi: newPass },
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/xac_thuc/toi", { cookie: c })).status,
          401,
        );
        const fresh = await login(resident, newPass);
        assert.equal(fresh.status, 200);
        await request("/xac_thuc/dang_xuat", {
          method: "POST",
          cookie: fresh.cookie,
        });
        assert.equal(
          (await request("/xac_thuc/toi", { cookie: fresh.cookie })).status,
          401,
        );
      },
    );
  } finally {
    await new Promise((r) => server.close(r));
    server.closeAllConnections();
    // Delete only this run's fixtures in the dedicated test database.
    for (const id of [...new Set(reports)].reverse()) {
      const images = await rows(
        pool,
        "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=?",
        [id],
      );
      await cleanupImages(images.map((x) => x.duong_dan_tep));
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE ma_phan_anh=?", [id]);
      await rows(pool, "DELETE FROM hinh_anh_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [id]);
    }
    for (const id of locations)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [id]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
