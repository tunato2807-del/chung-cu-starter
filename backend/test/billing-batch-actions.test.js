import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import {
  generate,
  action,
  paymentDetails,
} from "../src/modules/billing/billing.service.js";
import { today } from "../src/modules/billing/billing.validation.js";
import { batchBillActions } from "../src/modules/billing/billing-batch-actions.service.js";

test("batch approve/publish: source checks, atomic transitions, common payment and replay", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    bills = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let admin,
    other,
    resident,
    tech,
    rate,
    profile,
    stay,
    approvedInput,
    sentInput;
  async function account(role) {
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const id = (
      await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      )
    ).insertId;
    users.push(id);
    return {
      ma_nguoi_dung: id,
      phien_ban_token: 0,
      cookie: `session=${(await login({ so_dien_thoai: phone, mat_khau: password })).token}`,
    };
  }
  async function request(
    path,
    body,
    user = admin,
    csrf = true,
    method = "POST",
  ) {
    const r = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
        ...(user ? { Cookie: user.cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json() };
  }
  const req = (name, body, user = admin, csrf = true) =>
    request(`/hoa_don/xu_ly_hang_loat/${name}`, body, user, csrf);
  const payment = {
    han_thanh_toan: today(),
    ma_ngan_hang: "970436",
    so_tai_khoan: "1234567890",
    ten_nguoi_nhan: "BAN QUAN LY",
  };
  async function input(operation = "DUYET", ids = bills.slice(0, 2)) {
    const result = [];
    for (const id of ids) {
      const [bill] = await rows(
        pool,
        "SELECT ma_hoa_don,phien_ban FROM hoa_don WHERE ma_hoa_don=?",
        [id],
      );
      result.push(bill);
    }
    return {
      thao_tac: operation,
      hoa_don: result,
      ...(operation === "GUI" ? payment : {}),
    };
  }
  async function preview(body) {
    const r = await req("xem_truoc", body);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.data;
  }
  async function records() {
    return rows(
      pool,
      "SELECT ma_hoa_don,trang_thai,phien_ban,ma_nguoi_duyet,ma_nguoi_gui,han_thanh_toan,ma_ngan_hang,so_tai_khoan FROM hoa_don WHERE ma_nguoi_lap=? ORDER BY ma_hoa_don",
      [admin.ma_nguoi_dung],
    );
  }
  async function audits() {
    return (
      await rows(
        pool,
        "SELECT COUNT(*) AS n FROM lich_su_hoa_don WHERE ma_nguoi_ghi=?",
        [admin.ma_nguoi_dung],
      )
    )[0].n;
  }
  async function batches() {
    return (
      await rows(
        pool,
        "SELECT COUNT(*) AS n FROM dot_xu_ly_hoa_don WHERE ma_nguoi_thuc_hien=?",
        [admin.ma_nguoi_dung],
      )
    )[0].n;
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
  async function failAudit(operation, body, token) {
    const before = await records(),
      count = await audits(),
      batchCount = await batches();
    ddl(
      `DELIMITER $$\nCREATE TRIGGER fail_actions_${suffix} BEFORE INSERT ON lich_su_hoa_don FOR EACH ROW BEGIN IF NEW.su_kien='${operation}' AND NEW.ma_hoa_don=${bills[1]} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='action batch test failure'; END IF; END$$\nDELIMITER ;\n`,
    );
    try {
      const r = await req("xac_nhan", {
        ...body,
        xac_nhan: token,
        khoa_yeu_cau: randomUUID(),
      });
      assert.equal(r.status, 500);
      assert.deepEqual(await records(), before);
      assert.equal(await audits(), count);
      assert.equal(await batches(), batchCount);
    } finally {
      ddl(`DROP TRIGGER IF EXISTS fail_actions_${suffix}`);
    }
  }
  try {
    admin = await account("QUAN_TRI_VIEN");
    other = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    rate = (
      await rows(
        pool,
        "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,den_ngay,ma_nguoi_tao) VALUES ('PHI_QUAN_LY',14000,'1904-01-01','1904-02-01',?)",
        [admin.ma_nguoi_dung],
      )
    ).insertId;
    for (let n = 0; n < 4; n++) {
      apartments.push(
        (
          await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
            [`AC-${suffix}-${n}`, `AC${suffix}`],
          )
        ).insertId,
      );
      bills.push(
        (
          await generate(
            {
              ma_can_ho: apartments[n],
              ky_thanh_toan: "1904-01",
              ngay_chot_phi: "1904-01-31",
              tinh_nuoc: n === 2,
              tinh_dien: false,
              tinh_xe: false,
            },
            admin,
          )
        ).ma_hoa_don,
      );
    }
    profile = (
      await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES ('Cư dân kiểm tra','0901234567',?)",
        [resident.ma_nguoi_dung],
      )
    ).insertId;
    stay = (
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'CHU_HO','1900-01-01',?)",
        [profile, apartments[0], admin.ma_nguoi_dung],
      )
    ).insertId;
    await t.test(
      "BQL/CSRF and strict action, ID/version, size and bank validation",
      async () => {
        const body = await input();
        assert.equal((await req("xem_truoc", body, null)).status, 401);
        for (const user of [resident, tech])
          assert.equal((await req("xac_nhan", body, user)).status, 403);
        assert.equal((await req("xem_truoc", body, admin, false)).status, 403);
        for (const bad of [
          { thao_tac: "HUY" },
          { hoa_don: [] },
          { hoa_don: Array(51).fill(body.hoa_don[0]) },
          { hoa_don: [body.hoa_don[0], body.hoa_don[0]] },
          { hoa_don: [{ ma_hoa_don: 0, phien_ban: 0 }] },
          { hoa_don: [{ ma_hoa_don: bills[0], phien_ban: -1 }] },
        ])
          assert.equal(
            (await req("xem_truoc", { ...body, ...bad })).status,
            422,
          );
        assert.equal(
          (
            await req("xem_truoc", {
              ...(await input("GUI")),
              so_tai_khoan: "BAD",
            })
          ).status,
          422,
        );
      },
    );
    await t.test(
      "approve preview is read-only and shows missing source, wrong version/state per bill",
      async () => {
        const before = await records(),
          count = await audits();
        const p = await preview(await input());
        assert.equal(p.so_loi, 0);
        assert.equal(p.tong_tien, "1680000");
        assert.ok(p.xac_nhan);
        assert.deepEqual(await records(), before);
        assert.equal(await audits(), count);
        assert.equal(await batches(), 0);
        const missing = await preview(await input("DUYET", bills.slice(1, 3)));
        assert.equal(missing.so_loi, 1);
        assert.equal(missing.xac_nhan, null);
        assert.equal(missing.tong_tien, "840000");
        const stale = await input();
        stale.hoa_don[0].phien_ban++;
        assert.equal((await preview(stale)).so_loi, 1);
        assert.equal((await preview(await input("GUI"))).so_loi, 2);
      },
    );
    await t.test(
      "source changes and stored detail tampering block all approvals",
      async () => {
        const body = await input(),
          p = await preview(body),
          before = await records();
        await rows(
          pool,
          "UPDATE can_ho SET dien_tich_m2=61 WHERE ma_can_ho=?",
          [apartments[0]],
        );
        const changed = await req("xac_nhan", {
          ...body,
          xac_nhan: p.xac_nhan,
          khoa_yeu_cau: randomUUID(),
        });
        assert.equal(changed.body.error.code, "BATCH_CHANGED");
        assert.deepEqual(await records(), before);
        assert.equal(await batches(), 0);
        await action(bills[0], "tinh_lai", { phien_ban: 0 }, admin);
        await rows(
          pool,
          "UPDATE chi_tiet_hoa_don SET so_luong=99 WHERE ma_hoa_don=?",
          [bills[1]],
        );
        const tampered = await preview(await input());
        assert.match(tampered.rows[1].loi[0], /Chi tiết hóa đơn không khớp/);
        await rows(
          pool,
          "UPDATE chi_tiet_hoa_don SET so_luong=60 WHERE ma_hoa_don=?",
          [bills[1]],
        );
      },
    );
    await t.test(
      "approval failure at the second audit rolls back versions and every state",
      async () => {
        const body = await input(),
          p = await preview(body);
        await failAudit("DUYET", body, p.xac_nhan);
      },
    );
    await t.test(
      "concurrent approval retries process once and do not publish resident bills",
      async () => {
        const body = await input(),
          p = await preview(body);
        approvedInput = {
          ...body,
          xac_nhan: p.xac_nhan,
          khoa_yeu_cau: randomUUID(),
        };
        const result = await Promise.all([
          req("xac_nhan", approvedInput),
          req("xac_nhan", approvedInput),
        ]);
        for (const r of result)
          assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(
          result.filter((r) => r.body.data.da_xu_ly_truoc).length,
          1,
        );
        assert.deepEqual(
          result[0].body.data.hoa_don,
          result[1].body.data.hoa_don,
        );
        const approved = (await records()).slice(0, 2);
        for (const row of approved) {
          assert.equal(row.trang_thai, "DA_DUYET");
          assert.equal(row.ma_nguoi_duyet, admin.ma_nguoi_dung);
          assert.equal(row.ma_nguoi_gui, null);
        }
        assert.equal(
          (
            await request(
              `/cua_toi/hoa_don/${bills[0]}`,
              null,
              resident,
              true,
              "GET",
            )
          ).status,
          404,
        );
      },
    );
    await t.test(
      "publish validates a current due date and binds common bank details and actor to preview",
      async () => {
        const body = await input("GUI");
        assert.equal(
          (await preview({ ...body, han_thanh_toan: "1904-01-31" })).so_loi,
          2,
        );
        assert.equal(
          paymentDetails(
            { ...payment, han_thanh_toan: "1904-01-31" },
            "1900-01-01",
            false,
          ).han_thanh_toan,
          "1904-01-31",
        );
        const p = await preview(body);
        assert.equal(p.so_loi, 0);
        const confirm = {
          ...body,
          xac_nhan: p.xac_nhan,
          khoa_yeu_cau: randomUUID(),
        };
        assert.equal((await req("xac_nhan", confirm, other)).status, 409);
        assert.equal(
          (await req("xac_nhan", { ...confirm, so_tai_khoan: "99999999" }))
            .status,
          409,
        );
        const now = Date.now;
        try {
          Date.now = () => now() + 901000;
          await assert.rejects(
            batchBillActions(confirm, admin, true),
            (e) => e.code === "PREVIEW_EXPIRED",
          );
        } finally {
          Date.now = now;
        }
        await failAudit("GUI", body, p.xac_nhan);
      },
    );
    await t.test(
      "overlapping publish requests update all bills once with approved frozen totals and common bank",
      async () => {
        const body = await input("GUI"),
          p = await preview(body);
        await rows(
          pool,
          "UPDATE can_ho SET dien_tich_m2=65 WHERE ma_can_ho=?",
          [apartments[0]],
        ); // Approved snapshots are frozen, not re-priced at publish.
        const requests = [0, 1].map(() => ({
          ...body,
          xac_nhan: p.xac_nhan,
          khoa_yeu_cau: randomUUID(),
        }));
        const results = await Promise.all(
          requests.map((b) => req("xac_nhan", b)),
        );
        assert.equal(results.filter((r) => r.status === 200).length, 1);
        assert.equal(results.filter((r) => r.status === 409).length, 1);
        sentInput = requests[results.findIndex((r) => r.status === 200)];
        for (const bill of (await records()).slice(0, 2)) {
          assert.equal(bill.trang_thai, "DA_GUI");
          assert.equal(bill.ma_ngan_hang, payment.ma_ngan_hang);
          assert.equal(bill.so_tai_khoan, payment.so_tai_khoan);
          assert.equal(bill.han_thanh_toan, payment.han_thanh_toan);
        }
        const visible = await request(
          `/cua_toi/hoa_don/${bills[0]}`,
          null,
          resident,
          true,
          "GET",
        );
        assert.equal(visible.status, 200);
        assert.ok(visible.body.data.qr_payload);
        assert.equal(await batches(), 2);
      },
    );
    await t.test(
      "replay returns the original receipt after later payment and does not downgrade or repeat audit",
      async () => {
        const [bill] = await rows(
          pool,
          "SELECT * FROM hoa_don WHERE ma_hoa_don=?",
          [bills[0]],
        );
        await action(
          bills[0],
          "xac_nhan_thanh_toan",
          {
            phien_ban: bill.phien_ban,
            so_tien: bill.tong_tien,
            ma_tham_chieu: `AC-${suffix}`,
          },
          admin,
        );
        const before = await records(),
          count = await audits();
        for (const body of [approvedInput, sentInput]) {
          const r = await req("xac_nhan", {
            ...body,
            xac_nhan: "expired-or-restarted",
          });
          assert.equal(r.status, 200);
          assert.equal(r.body.data.da_xu_ly_truoc, true);
        }
        assert.deepEqual(await records(), before);
        assert.equal(await audits(), count);
        assert.equal(
          (
            await req("xac_nhan", {
              ...sentInput,
              ten_nguoi_nhan: "OTHER NAME",
            })
          ).body.error.code,
          "BATCH_KEY_CONFLICT",
        );
        await rows(
          pool,
          "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [admin.ma_nguoi_dung],
        );
        await assert.rejects(
          batchBillActions(sentInput, admin, true),
          (e) => e.status === 401,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    ddl(`DROP TRIGGER IF EXISTS fail_actions_${suffix}`);
    if (stay)
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?", [
        stay,
      ]);
    if (profile)
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profile]);
    for (const id of users) {
      await rows(
        pool,
        "DELETE d FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE h.ma_nguoi_lap=?",
        [id],
      );
      await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_nguoi_ghi=?", [
        id,
      ]);
      await rows(
        pool,
        "DELETE FROM dot_xu_ly_hoa_don WHERE ma_nguoi_thuc_hien=?",
        [id],
      );
      await rows(pool, "DELETE FROM hoa_don WHERE ma_nguoi_lap=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    if (rate)
      await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
        rate,
      ]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
