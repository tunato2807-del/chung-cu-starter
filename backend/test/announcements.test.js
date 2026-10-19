import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { today } from "../src/modules/billing/billing.validation.js";
const phone = () =>
  "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");

test("announcements, current audiences, scoped receipts and bill reminders", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    profiles = [],
    notifications = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let admin,
    technician,
    owner,
    member,
    outsider,
    fixed,
    newFixed,
    fixedSecret,
    ownerId,
    memberId,
    fixedId,
    billId,
    reminderId;
  const block = `N${suffix}`;
  async function req(path, method = "GET", body, cookie, csrf = true) {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
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
  async function login(name, secret = password, kind) {
    const r = await req("/xac_thuc/dang_nhap", "POST", {
      so_dien_thoai: name,
      mat_khau: secret,
      ...(kind ? { loai_tai_khoan: kind } : {}),
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.cookie;
  }
  async function user(role) {
    const p = phone();
    const result = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      [`TB-${suffix}`, p, hash, role],
    );
    users.push(result.insertId);
    return { id: result.insertId, phone: p, cookie: await login(p) };
  }
  async function draft(scope = "TOAN_BO", extra = {}) {
    const r = await req(
      "/thong_bao",
      "POST",
      {
        tieu_de: `Thông báo ${suffix}`,
        noi_dung: "Nội dung cho cư dân\n<script>alert(1)</script>",
        pham_vi: scope,
        muc_do: "QUAN_TRONG",
        ...extra,
      },
      admin,
    );
    assert.equal(r.status, 201, JSON.stringify(r.body));
    notifications.push(r.body.data.ma_thong_bao);
    return r.body.data.ma_thong_bao;
  }
  async function publish(id) {
    const n = await req(`/thong_bao/${id}`, "GET", null, admin);
    const r = await req(
      `/thong_bao/${id}/phat_hanh`,
      "POST",
      { phien_ban: n.body.data.phien_ban },
      admin,
    );
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  const self = (cookie, tail = "") =>
    req(`/cua_toi/thong_bao${tail}`, "GET", null, cookie);
  const rootSQL = (sql) =>
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
      { input: sql, stdio: ["pipe", "pipe", "pipe"] },
    );
  try {
    admin = (await user("QUAN_TRI_VIEN")).cookie;
    technician = (await user("KY_THUAT_VIEN")).cookie;
    const o = await user("CU_DAN"),
      m = await user("CU_DAN"),
      x = await user("CU_DAN");
    owner = o.cookie;
    member = m.cookie;
    outsider = x.cookie;
    for (const [i, b] of [
      [0, block],
      [1, "OTHER"],
    ]) {
      const r = await req(
        "/can_ho",
        "POST",
        {
          so_can_ho: `TB-${suffix}-${i}`,
          khoi: b,
          tang: 1,
          dien_tich_m2: "50",
          tinh_phi_dich_vu: true,
        },
        admin,
      );
      assert.equal(r.status, 201);
      apartments.push(r.body.data.ma_can_ho);
    }
    for (const [u, apt, role] of [
      [o, apartments[0], "CHU_HO"],
      [m, apartments[0], "THANH_VIEN"],
      [x, apartments[1], "CHU_HO"],
    ]) {
      const r = await req(
        "/cu_dan",
        "POST",
        {
          ho_va_ten: `Cư dân ${suffix}`,
          so_dien_thoai: u.phone,
          ma_nguoi_dung: u.id,
          ma_can_ho: apt,
          quan_he: role,
          ngay: today(),
        },
        admin,
      );
      assert.equal(r.status, 201, JSON.stringify(r.body));
      profiles.push(r.body.data.ma_cu_dan);
      if (u === o) {
        ownerId = r.body.data.ma_cu_dan;
        fixedSecret = r.body.data.tai_khoan_can_ho.mat_khau_tam_thoi;
        fixed = await login(
          r.body.data.tai_khoan_can_ho.ten_dang_nhap,
          r.body.data.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
      }
      if (u === m) memberId = r.body.data.ma_cu_dan;
    }
    [fixedId] = (
      await rows(
        pool,
        "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
        [apartments[0]],
      )
    ).map((r) => r.ma_nguoi_dung);
    await t.test("role/CSRF protection and input validation", async () => {
      assert.equal((await req("/thong_bao")).status, 401);
      assert.equal((await req("/thong_bao", "GET", null, owner)).status, 403);
      assert.equal((await self(technician)).status, 403);
      assert.equal(
        (await req("/thong_bao", "POST", {}, admin, false)).status,
        403,
      );
      assert.equal(
        (
          await req(
            "/thong_bao",
            "POST",
            {
              tieu_de: "abc",
              noi_dung: "abc",
              pham_vi: "KHOI",
              khoi: "NO_MATCH",
              muc_do: "THUONG",
            },
            admin,
          )
        ).status,
        422,
      );
      assert.equal((await self(owner, "?page=0")).status, 422);
    });
    let all, blockNotice, apartmentNotice;
    await t.test(
      "draft edit/version/publish and exact all/block/apartment audiences",
      async () => {
        all = await draft();
        blockNotice = await draft("KHOI", { khoi: block });
        apartmentNotice = await draft("CAN_HO", { ma_can_ho: apartments[0] });
        assert.equal((await self(owner, `/${all}`)).status, 404);
        const body = {
          tieu_de: `Sửa thông báo ${suffix}`,
          noi_dung: "Dòng đầu\n<script>alert(1)</script>",
          pham_vi: "TOAN_BO",
          muc_do: "THUONG",
          phien_ban: 0,
        };
        assert.equal(
          (await req(`/thong_bao/${all}`, "PUT", body, admin)).status,
          200,
        );
        assert.equal(
          (await req(`/thong_bao/${all}`, "PUT", body, admin)).status,
          409,
        );
        for (const id of [all, blockNotice, apartmentNotice]) await publish(id);
        assert.equal(
          (
            await req(
              `/thong_bao/${all}`,
              "PUT",
              { ...body, phien_ban: 2 },
              admin,
            )
          ).status,
          409,
        );
        for (const cookie of [owner, member, fixed]) {
          const ids = (await self(cookie)).body.data.map((n) => n.ma_thong_bao);
          for (const id of [all, blockNotice, apartmentNotice])
            assert.ok(ids.includes(id));
        }
        const ids = (await self(outsider)).body.data.map((n) => n.ma_thong_bao);
        assert.ok(ids.includes(all));
        assert.ok(!ids.includes(blockNotice));
        assert.ok(!ids.includes(apartmentNotice));
        assert.equal((await self(outsider, `/${apartmentNotice}`)).status, 404);
        assert.equal(
          (await self(owner, `/${all}`)).body.data.noi_dung,
          body.noi_dung,
        );
      },
    );
    await t.test(
      "GET has no read side effect; POST receipts are idempotent and counted",
      async () => {
        await self(fixed, `/${all}`);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT * FROM thong_bao_da_doc WHERE ma_thong_bao=? AND ma_nguoi_dung=?",
              [all, fixedId],
            )
          ).length,
          0,
        );
        const before = (await self(fixed, "/chua_doc")).body.data.so_chua_doc;
        for (let i = 0; i < 2; i++)
          assert.equal(
            (await req(`/cua_toi/thong_bao/${all}/da_doc`, "POST", {}, fixed))
              .status,
            200,
          );
        assert.equal(
          (await self(fixed, "/chua_doc")).body.data.so_chua_doc,
          before - 1,
        );
        assert.equal(
          (
            await rows(
              pool,
              "SELECT * FROM thong_bao_da_doc WHERE ma_thong_bao=? AND ma_nguoi_dung=?",
              [all, fixedId],
            )
          ).length,
          1,
        );
        assert.ok(
          !(await self(fixed, "?chua_doc=1")).body.data.some(
            (n) => n.ma_thong_bao === all,
          ),
        );
        assert.equal(
          (
            await req(
              `/cua_toi/thong_bao/${apartmentNotice}/da_doc`,
              "POST",
              {},
              outsider,
            )
          ).status,
          404,
        );
      },
    );
    await t.test(
      "bill reminder is private, one per local day, concurrent-safe and version checked",
      async () => {
        const r = await rows(
          pool,
          "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan) VALUES (?,?,?, ?,1,0,0,0,150000,'[]',?,?, 'DA_GUI',?)",
          [
            `TB-${suffix}`,
            apartments[0],
            today().slice(0, 7),
            today(),
            "a".repeat(64),
            users[0],
            today(),
          ],
        );
        billId = r.insertId;
        assert.equal(
          (
            await req(
              `/hoa_don/${billId}/nhac_phi`,
              "POST",
              { phien_ban: 0 },
              owner,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await req(
              `/hoa_don/${billId}/nhac_phi`,
              "POST",
              { phien_ban: 9 },
              admin,
            )
          ).status,
          409,
        );
        const results = await Promise.all(
          [1, 2, 3].map(() =>
            req(`/hoa_don/${billId}/nhac_phi`, "POST", { phien_ban: 0 }, admin),
          ),
        );
        for (const r of results)
          assert.equal(r.status, 200, JSON.stringify(r.body));
        reminderId = results[0].body.data.ma_thong_bao;
        notifications.push(reminderId);
        assert.ok(
          results.every((r) => r.body.data.ma_thong_bao === reminderId),
        );
        assert.equal(results.filter((r) => !r.body.data.da_ton_tai).length, 1);
        for (const cookie of [fixed, owner])
          assert.equal((await self(cookie, `/${reminderId}`)).status, 200);
        for (const cookie of [member, outsider])
          assert.equal((await self(cookie, `/${reminderId}`)).status, 404);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT phien_ban FROM hoa_don WHERE ma_hoa_don=?",
              [billId],
            )
          )[0].phien_ban,
          0,
        );
      },
    );
    await t.test(
      "new custodian has unread scope; former custodian loses reminder access",
      async () => {
        await req(`/cua_toi/thong_bao/${reminderId}/da_doc`, "POST", {}, fixed);
        // Reproduce the committed custody change, including token revocation. Residency handover API is covered by apartment-account tests.
        await rows(
          pool,
          "UPDATE nguoi_dung SET ma_cu_dan_phu_trach=?,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [memberId, fixedId],
        );
        const [u] = await rows(
          pool,
          "SELECT ten_dang_nhap FROM nguoi_dung WHERE ma_nguoi_dung=?",
          [fixedId],
        );
        newFixed = await login(u.ten_dang_nhap, fixedSecret);
        assert.equal((await self(fixed)).status, 401);
        const n = await self(newFixed, `/${all}`);
        assert.equal(n.body.data.chua_doc, 1);
        assert.equal(
          (await self(newFixed, `/${reminderId}`)).body.data.chua_doc,
          1,
        );
        assert.equal((await self(owner, `/${reminderId}`)).status, 404);
        assert.equal((await self(member, `/${reminderId}`)).status, 200);
        assert.equal((await self(owner, `/${all}`)).status, 200);
        await req(`/cua_toi/thong_bao/${all}/da_doc`, "POST", {}, newFixed);
        const receipts = await rows(
          pool,
          "SELECT nguoi_tiep_nhan FROM thong_bao_da_doc WHERE ma_thong_bao=? AND ma_nguoi_dung=?",
          [all, fixedId],
        );
        assert.deepEqual(
          receipts.map((r) => r.nguoi_tiep_nhan).sort((a, b) => a - b),
          [ownerId, memberId].sort((a, b) => a - b),
        );
      },
    );
    await t.test(
      "personal reminders obey bill period access while fixed account retains apartment history",
      async () => {
        const previousDay = new Date(
          new Date(`${today()}T00:00:00Z`).getTime() - 86400000,
        )
          .toISOString()
          .slice(0, 10);
        await rows(
          pool,
          "UPDATE hoa_don SET ngay_chot_phi=? WHERE ma_hoa_don=?",
          [previousDay, billId],
        );
        try {
          assert.equal((await self(member, `/${reminderId}`)).status, 404);
          assert.equal((await self(newFixed, `/${reminderId}`)).status, 200);
          assert.equal(
            (await req(`/cua_toi/hoa_don/${billId}`, "GET", null, member))
              .status,
            404,
          );
        } finally {
          await rows(
            pool,
            "UPDATE hoa_don SET ngay_chot_phi=? WHERE ma_hoa_don=?",
            [today(), billId],
          );
        }
      },
    );
    await t.test(
      "payment resolves unread reminders; canceled invoices disappear",
      async () => {
        const before = (await self(newFixed, "/chua_doc")).body.data
          .so_chua_doc;
        await rows(
          pool,
          "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=tong_tien,ma_tham_chieu=? WHERE ma_hoa_don=?",
          [`TB-${suffix}`, billId],
        );
        assert.equal(
          (await self(newFixed, "/chua_doc")).body.data.so_chua_doc,
          before - 1,
        );
        const paid = await self(newFixed, `/${reminderId}`);
        assert.equal(paid.body.data.trang_thai_hoa_don, "DA_THANH_TOAN");
        assert.equal(paid.body.data.chua_doc, 0);
        assert.equal(
          (
            await req(
              `/hoa_don/${billId}/nhac_phi`,
              "POST",
              { phien_ban: 0 },
              admin,
            )
          ).status,
          409,
        );
        await rows(
          pool,
          "UPDATE hoa_don SET trang_thai='HUY' WHERE ma_hoa_don=?",
          [billId],
        );
        assert.equal((await self(newFixed, `/${reminderId}`)).status, 404);
      },
    );
    await t.test(
      "withdrawal is audited, removes visibility and needs reason/version",
      async () => {
        assert.equal(
          (
            await req(
              `/thong_bao/${apartmentNotice}/thu_hoi`,
              "POST",
              { phien_ban: 1, ly_do: "" },
              admin,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await req(
              `/thong_bao/${apartmentNotice}/thu_hoi`,
              "POST",
              { phien_ban: 1, ly_do: "Thông tin đã thay đổi" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal((await self(newFixed, `/${apartmentNotice}`)).status, 404);
        const n = (
          await req(`/thong_bao/${apartmentNotice}`, "GET", null, admin)
        ).body.data;
        assert.deepEqual(
          n.history.map((h) => h.su_kien),
          ["TAO_NHAP", "PHAT_HANH", "THU_HOI"],
        );
      },
    );
    await t.test(
      "moving out revokes the previous home inbox including direct ID access",
      async () => {
        await rows(
          pool,
          "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_cu_dan=? AND den_ngay IS NULL",
          [today(), ownerId],
        );
        assert.equal((await self(owner, `/${blockNotice}`)).status, 404);
        assert.equal((await self(owner, `/${all}`)).status, 404); // No current home: no condo inbox.
      },
    );
    await t.test(
      "failed audit rolls back draft publication and reminder creation",
      async () => {
        const id = await draft();
        rootSQL(
          "CREATE TRIGGER test_notification_audit_failure BEFORE INSERT ON lich_su_thong_bao FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit failure';",
        );
        try {
          const r = await req(
            `/thong_bao/${id}/phat_hanh`,
            "POST",
            { phien_ban: 0 },
            admin,
          );
          assert.equal(r.status, 500);
          assert.equal(
            (await req(`/thong_bao/${id}`, "GET", null, admin)).body.data
              .trang_thai,
            "NHAP",
          );
          await rows(pool, "DELETE FROM thong_bao WHERE ma_thong_bao=?", [
            reminderId,
          ]);
          await rows(
            pool,
            "UPDATE hoa_don SET trang_thai='DA_GUI' WHERE ma_hoa_don=?",
            [billId],
          );
          assert.equal(
            (
              await req(
                `/hoa_don/${billId}/nhac_phi`,
                "POST",
                { phien_ban: 0 },
                admin,
              )
            ).status,
            500,
          );
          assert.equal(
            (
              await rows(
                pool,
                "SELECT ma_thong_bao FROM thong_bao WHERE ma_hoa_don=?",
                [billId],
              )
            ).length,
            0,
          );
        } finally {
          rootSQL("DROP TRIGGER IF EXISTS test_notification_audit_failure;");
        }
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of notifications)
      await rows(pool, "DELETE FROM thong_bao WHERE ma_thong_bao=?", [id]);
    if (billId) {
      await rows(pool, "DELETE FROM thong_bao WHERE ma_hoa_don=?", [billId]);
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [billId]);
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
