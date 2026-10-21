import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("equipment QR: versioned links, immutable incident snapshots and private equipment scope", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const accounts = [],
    devices = [],
    locations = [],
    reports = [],
    requestKeys = [];
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
  async function request(path, cookie, method = "GET", body, csrf = true) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
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
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  let admin, tech, otherTech, resident, loc, oldManual, reportB, reportNone;
  async function createLocation(body) {
    const result = await request("/vi_tri_qr", admin, "POST", {
      ten_vi_tri: `QR ${suffix}`,
      loai: "THIET_BI",
      ...body,
    });
    assert.equal(result.status, 201);
    locations.push(result.body.data.ma_vi_tri_qr);
    return result.body.data;
  }
  function form(token, version, extra = {}) {
    const body = new FormData();
    const key = randomUUID();
    requestKeys.push(key);
    for (const [k, v] of Object.entries({
      token_qr: token,
      khoa_yeu_cau: key,
      tieu_de: `Sự cố ${suffix}`,
      noi_dung: "Thiết bị phát tiếng ồn cần kiểm tra ngay.",
      ten_nguoi_gui: "Cư dân kiểm thử",
      so_dien_thoai:
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      loai_su_co: "DIEN",
      ...(version !== undefined ? { phien_ban_qr: version } : {}),
      ...extra,
    }))
      body.set(k, v);
    return body;
  }
  async function send(body, cookie) {
    const result = await request("/cong_khai/phan_anh", cookie, "POST", body);
    if (result.status === 201) {
      const [row] = await rows(
        pool,
        "SELECT * FROM phan_anh WHERE khoa_yeu_cau=?",
        [body.get("khoa_yeu_cau")],
      );
      reports.push(row.ma_phan_anh);
      result.report = row;
    }
    return result;
  }
  const link = (location, id, version) =>
    request(`/vi_tri_qr/${location.ma_vi_tri_qr}/thiet_bi`, admin, "PUT", {
      ma_thiet_bi: id,
      phien_ban: version,
      xac_nhan_doi_lien_ket: true,
    });
  try {
    for (const role of [
      "QUAN_TRI_VIEN",
      "KY_THUAT_VIEN",
      "KY_THUAT_VIEN",
      "CU_DAN",
    ]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const row = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(row.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      else if (role === "CU_DAN") resident = login.cookie;
      else if (!tech) tech = login.cookie;
      else otherTech = login.cookie;
    }
    for (let i = 0; i < 3; i++) {
      const row = await rows(
        pool,
        "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,so_serial,ghi_chu,trang_thai,ma_nguoi_tao) VALUES (?,?,'DIEN',?,?,?, ?,?)",
        [
          `EQ-${suffix}-${i}`,
          `Thiết bị ${suffix}-${i}`,
          "Hầm xe",
          "PRIVATE-SERIAL",
          "PRIVATE-NOTE",
          i === 2 ? "NGUNG_SU_DUNG" : "DANG_SU_DUNG",
          accounts[0],
        ],
      );
      devices.push(row.insertId);
    }
    loc = await createLocation({ ma_thiet_bi: devices[0] });
    oldManual = await createLocation({ ten_vi_tri: `QR cũ ${suffix}` });
    await t.test(
      "list/detail/link reject guests, other roles and missing CSRF",
      async () => {
        for (const path of ["/vi_tri_qr", `/vi_tri_qr/${loc.ma_vi_tri_qr}`]) {
          assert.equal((await request(path)).status, 401);
          for (const cookie of [tech, otherTech, resident])
            assert.equal((await request(path, cookie)).status, 403);
        }
        const path = `/vi_tri_qr/${loc.ma_vi_tri_qr}/thiet_bi`,
          body = {
            ma_thiet_bi: devices[1],
            phien_ban: 0,
            xac_nhan_doi_lien_ket: true,
          };
        for (const cookie of [tech, resident])
          assert.equal((await request(path, cookie, "PUT", body)).status, 403);
        assert.equal(
          (await request(path, admin, "PUT", body, false)).status,
          403,
        );
      },
    );
    await t.test(
      "creation validates equipment/type and public QR exposes only display fields",
      async () => {
        for (const override of [
          { loai: "KHU_VUC", ma_thiet_bi: devices[0] },
          { ma_thiet_bi: devices[2] },
          { ma_thiet_bi: 4294967295 },
        ])
          assert.equal(
            (
              await request("/vi_tri_qr", admin, "POST", {
                ten_vi_tri: "Vị trí sai",
                loai: "THIET_BI",
                ...override,
              })
            ).status,
            422,
          );
        const publicQr = await request(`/cong_khai/vi_tri_qr/${loc.token_qr}`);
        assert.deepEqual(publicQr.body.data.thiet_bi, {
          ma_tai_san: `EQ-${suffix}-0`,
          ten_thiet_bi: `Thiết bị ${suffix}-0`,
        });
        const json = JSON.stringify(publicQr.body);
        for (const forbidden of [
          "PRIVATE",
          "so_serial",
          "ghi_chu",
          "ma_nguoi_tao",
          "lich_su",
          "ngay_bao_tri",
          "ma_thiet_bi",
        ])
          assert.ok(!json.includes(forbidden));
        assert.equal((await link(loc, devices[1], 99)).status, 409);
        assert.equal(
          (
            await request(
              `/vi_tri_qr/${loc.ma_vi_tri_qr}/thiet_bi`,
              admin,
              "PUT",
              { ma_thiet_bi: devices[1], phien_ban: 0 },
            )
          ).status,
          422,
        );
        const legacy = await send(form(oldManual.token_qr));
        assert.equal(legacy.status, 201);
        assert.equal(legacy.report.ma_thiet_bi, null);
      },
    );
    let retryBody, receipt;
    await t.test(
      "stale forms are rejected; submitted device identity comes only from the locked QR",
      async () => {
        assert.equal((await link(loc, devices[1], 0)).status, 200);
        const stale = await send(form(loc.token_qr, 0));
        assert.equal(stale.status, 409);
        assert.equal(stale.body.error.code, "QR_CHANGED");
        assert.equal(
          (await send(form(loc.token_qr))).body.error.code,
          "QR_CHANGED",
        );
        retryBody = form(loc.token_qr, 1, {
          ma_thiet_bi: devices[0],
          ma_tai_san_luc_gui: "SPOOF",
          ten_thiet_bi_luc_gui: "SPOOF",
        });
        const sent = await send(retryBody);
        assert.equal(sent.status, 201);
        reportB = sent.report;
        receipt = sent.body.data.ma_tra_cuu;
        assert.equal(reportB.ma_thiet_bi, devices[1]);
        assert.equal(reportB.ma_tai_san_luc_gui, `EQ-${suffix}-1`);
        assert.equal(reportB.ten_thiet_bi_luc_gui, `Thiết bị ${suffix}-1`);
        assert.equal(reportB.vi_tri_thiet_bi_luc_gui, "Hầm xe");
      },
    );
    await t.test(
      "unlink preserves snapshots and idempotent receipts, never retroactively links old tickets",
      async () => {
        assert.equal((await link(loc, null, 1)).status, 200);
        const replay = await send(retryBody);
        assert.equal(replay.status, 200);
        assert.equal(replay.body.data.ma_tra_cuu, receipt);
        const next = await send(form(loc.token_qr, 2));
        assert.equal(next.status, 201);
        reportNone = next.report;
        assert.equal(reportNone.ma_thiet_bi, null);
        const row = (await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, admin))
          .body.data;
        assert.equal(row.token_qr, loc.token_qr);
        assert.equal(row.lich_su_lien_ket.length, 3);
        assert.equal((await link(oldManual, devices[0], 0)).status, 200);
        const [old] = await rows(
          pool,
          "SELECT ma_thiet_bi FROM phan_anh WHERE ma_vi_tri_qr=?",
          [oldManual.ma_vi_tri_qr],
        );
        assert.equal(old.ma_thiet_bi, null);
        const invalidMerge = await request(
          `/phan_anh/${reportNone.ma_phan_anh}/trang_thai`,
          admin,
          "PATCH",
          {
            trang_thai: "TRUNG",
            phien_ban: 0,
            ma_phan_anh_goc: reportB.ma_phan_anh,
            ghi_chu: "Kiểm tra gộp",
          },
        );
        assert.equal(invalidMerge.body.error.code, "MERGE_INVALID");
      },
    );
    await t.test(
      "equipment filters preserve ticket permissions and public lookup stays private after renaming",
      async () => {
        await rows(
          pool,
          "UPDATE thiet_bi SET ten_thiet_bi='Tên mới',vi_tri='Vị trí mới' WHERE ma_thiet_bi=?",
          [devices[1]],
        );
        const snapshot = (
          await request(`/phan_anh/${reportB.ma_phan_anh}`, admin)
        ).body.data;
        assert.equal(snapshot.ten_thiet_bi_luc_gui, `Thiết bị ${suffix}-1`);
        assert.equal(snapshot.vi_tri_thiet_bi_luc_gui, "Hầm xe");
        const adminList = (
          await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, admin)
        ).body;
        assert.deepEqual(
          adminList.data.map((r) => r.ma_phan_anh),
          [reportB.ma_phan_anh],
        );
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, resident)).body
            .meta.total,
          0,
        );
        const assigned = await request(
          `/phan_anh/${reportB.ma_phan_anh}/phan_cong`,
          admin,
          "PATCH",
          {
            phien_ban: 0,
            ma_ky_thuat_vien: accounts[1],
            do_uu_tien: "TRUNG_BINH",
          },
        );
        assert.equal(assigned.status, 200);
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, tech)).body.meta
            .total,
          1,
        );
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, otherTech)).body
            .meta.total,
          0,
        );
        assert.equal(
          (await request(`/thiet_bi/${devices[1]}`, tech)).status,
          403,
        );
        const publicLookup = await request(
          "/cong_khai/phan_anh/tra_cuu",
          null,
          "POST",
          {
            ma_tra_cuu: receipt,
            so_dien_thoai: retryBody.get("so_dien_thoai"),
          },
        );
        assert.equal(publicLookup.status, 200);
        for (const field of [
          "ma_thiet_bi",
          "ma_tai_san_luc_gui",
          "so_serial",
          "ghi_chu",
        ])
          assert.ok(!JSON.stringify(publicLookup.body).includes(field));
        assert.equal(
          (await request("/phan_anh?ma_thiet_bi=abc", admin)).status,
          422,
        );
      },
    );
    await t.test(
      "failed link audit rolls back target and version atomically",
      async () => {
        const auditLoc = await createLocation({ ma_thiet_bi: devices[0] });
        ddl(
          "CREATE TRIGGER test_qr_link_audit BEFORE INSERT ON lich_su_lien_ket_qr FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit rollback';",
        );
        try {
          assert.equal((await link(auditLoc, devices[1], 0)).status, 500);
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_qr_link_audit;");
        }
        const after = (
          await request(`/vi_tri_qr/${auditLoc.ma_vi_tri_qr}`, admin)
        ).body.data;
        assert.equal(after.ma_thiet_bi, devices[0]);
        assert.equal(after.phien_ban, 0);
        assert.equal(after.lich_su_lien_ket.length, 1);
      },
    );
    await t.test(
      "concurrent changes have one winner and old report identities remain unchanged",
      async () => {
        const race = await Promise.all(
          [devices[0], devices[1]].map((id) => link(loc, id, 2)),
        );
        assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
        const detail = (await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, admin))
          .body.data;
        assert.equal(detail.phien_ban, 3);
        assert.equal(detail.token_qr, loc.token_qr);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_thiet_bi FROM phan_anh WHERE ma_phan_anh=?",
              [reportB.ma_phan_anh],
            )
          )[0].ma_thiet_bi,
          devices[1],
        );
      },
    );
    await t.test(
      "location search and pagination include all matching records without leaking device internals",
      async () => {
        for (let i = 0; i < 22; i++)
          await createLocation({
            ten_vi_tri: `PAGE-${suffix}-${i}`,
            loai: "KHU_VUC",
          });
        const first = (await request(`/vi_tri_qr?q=PAGE-${suffix}`, admin))
            .body,
          second = (await request(`/vi_tri_qr?q=PAGE-${suffix}&page=2`, admin))
            .body;
        assert.equal(first.total, 22);
        assert.equal(first.data.length, 20);
        assert.equal(second.data.length, 2);
        assert.equal(
          new Set([...first.data, ...second.data].map((r) => r.ma_vi_tri_qr))
            .size,
          22,
        );
        assert.equal((await request("/vi_tri_qr?page=0", admin)).status, 422);
        const list = await request(
          `/vi_tri_qr?ma_thiet_bi=${devices[0]}`,
          admin,
        );
        for (const row of list.body.data)
          assert.equal(row.ma_thiet_bi, devices[0]);
        assert.ok(!JSON.stringify(list.body).includes("PRIVATE"));
      },
    );
  } finally {
    ddl("DROP TRIGGER IF EXISTS test_qr_link_audit;");
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    for (const id of reports) {
      await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE ma_phan_anh=?", [id]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [id]);
    }
    for (const key of requestKeys)
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE khoa=?", [key]);
    for (const id of locations)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [id]);
    for (const id of devices)
      await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
