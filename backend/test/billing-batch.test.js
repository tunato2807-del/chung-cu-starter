import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { generate } from "../src/modules/billing/billing.service.js";
import { batchBills } from "../src/modules/billing/billing-batch.service.js";

test("batch bills: preview, source fingerprints, atomic drafts and durable idempotency", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const users = [],
    apartments = [],
    prices = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api/hoa_don/hang_loat`;
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
  let admin, other, resident, tech;
  const common = {
    ky_thanh_toan: "1902-05",
    ngay_chot_phi: "1902-05-31",
    tinh_nuoc: false,
    tinh_dien: false,
    tinh_xe: false,
  };
  const body = (ids = apartments.slice(0, 2)) => ({
    ...common,
    ma_can_ho: ids,
  });
  async function req(action, input, user = admin, csrf = true) {
    const response = await fetch(`${base}/${action}`, {
      method: "POST",
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
        "Content-Type": "application/json",
        ...(user ? { Cookie: user.cookie } : {}),
      },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  }
  async function preview(input = body()) {
    const r = await req("xem_truoc", input);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.data;
  }
  async function counts() {
    return (
      await rows(
        pool,
        "SELECT (SELECT COUNT(*) FROM hoa_don WHERE ma_nguoi_lap=?) AS bills,(SELECT COUNT(*) FROM dot_lap_hoa_don WHERE ma_nguoi_lap=?) AS batches,(SELECT COUNT(*) FROM lich_su_hoa_don WHERE ma_nguoi_ghi=?) AS audit",
        [admin.ma_nguoi_dung, admin.ma_nguoi_dung, admin.ma_nguoi_dung],
      )
    )[0];
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
    admin = await account("QUAN_TRI_VIEN");
    other = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    for (let n = 0; n < 6; n++)
      apartments.push(
        (
          await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,'40')",
            [`B-${suffix}-${n}`, `B${suffix}`],
          )
        ).insertId,
      );
    for (const [type, amount] of [
      ["PHI_QUAN_LY", "12000"],
      ["TIEN_NUOC", "15000"],
    ])
      prices.push(
        (
          await rows(
            pool,
            "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,den_ngay,ma_nguoi_tao) VALUES (?,?,'1902-05-01','1902-06-01',?)",
            [type, amount, admin.ma_nguoi_dung],
          )
        ).insertId,
      );
    await t.test(
      "management authorization, CSRF, bounds and strict options",
      async () => {
        assert.equal((await req("xem_truoc", body(), null)).status, 401);
        for (const user of [resident, tech])
          assert.equal((await req("xac_nhan", body(), user)).status, 403);
        assert.equal(
          (await req("xem_truoc", body(), admin, false)).status,
          403,
        );
        for (const changes of [
          { ma_can_ho: [] },
          { ma_can_ho: Array(51).fill(1) },
          { ma_can_ho: [apartments[0], apartments[0]] },
          { ma_can_ho: [0] },
          { tinh_dien: "false" },
          { ngay_chot_phi: "1902-06-01" },
        ])
          assert.equal(
            (await req("xem_truoc", { ...body(), ...changes })).status,
            422,
          );
        assert.deepEqual(await counts(), { bills: 0, batches: 0, audit: 0 });
      },
    );
    await t.test(
      "preview returns full fee details but writes no bills, ledger or audit",
      async () => {
        const r = await preview();
        assert.equal(r.so_can_loi, 0);
        assert.equal(r.tong_tien, "960000");
        assert.equal(r.rows[0].chi_tiet[0].so_luong, "40.000");
        assert.ok(r.xac_nhan);
        assert.deepEqual(await counts(), { bills: 0, batches: 0, audit: 0 });
      },
    );
    await t.test(
      "missing meter and already billed/canceled apartments produce row errors and no confirmation token",
      async () => {
        const input = { ...body(), tinh_nuoc: true };
        await rows(
          pool,
          "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ma_nguoi_ghi) VALUES (?,'NUOC','1902-05',0,5,'1902-05-31',?)",
          [apartments[0], admin.ma_nguoi_dung],
        );
        const r = await preview(input);
        assert.equal(r.so_can_loi, 1);
        assert.equal(r.tong_tien, "555000");
        assert.equal(r.xac_nhan, null);
        assert.match(r.rows[1].loi[0], /Thiếu chỉ số NUOC/);
        assert.equal(
          (
            await req("xac_nhan", {
              ...input,
              khoa_yeu_cau: randomUUID(),
              xac_nhan: null,
            })
          ).status,
          409,
        );
        const bill = await generate(
          { ...body([apartments[2]]), ma_can_ho: apartments[2] },
          admin,
        );
        assert.match(
          (await preview(body([apartments[2]]))).rows[0].loi[0],
          /hóa đơn còn hiệu lực/,
        );
        await rows(
          pool,
          "UPDATE hoa_don SET trang_thai='HUY' WHERE ma_hoa_don=?",
          [bill.ma_hoa_don],
        );
        assert.match(
          (await preview(body([apartments[2]]))).rows[0].loi[0],
          /lập thay thế/,
        );
      },
    );
    await t.test(
      "confirmation is bound to actor, options and a fresh source quote",
      async () => {
        const p = await preview(),
          key = randomUUID();
        assert.equal(
          (
            await req(
              "xac_nhan",
              { ...body(), khoa_yeu_cau: key, xac_nhan: p.xac_nhan },
              other,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await req("xac_nhan", {
              ...body(),
              tinh_xe: true,
              khoa_yeu_cau: key,
              xac_nhan: p.xac_nhan,
            })
          ).status,
          409,
        );
        await rows(
          pool,
          "UPDATE can_ho SET dien_tich_m2=41 WHERE ma_can_ho=?",
          [apartments[0]],
        );
        const before = await counts();
        const changed = await req("xac_nhan", {
          ...body(),
          khoa_yeu_cau: key,
          xac_nhan: p.xac_nhan,
        });
        assert.equal(changed.body.error.code, "BATCH_CHANGED");
        assert.deepEqual(await counts(), before);
        const fresh = await preview(),
          now = Date.now;
        try {
          Date.now = () => now() + 901000;
          await assert.rejects(
            batchBills(
              {
                ...body(),
                khoa_yeu_cau: randomUUID(),
                xac_nhan: fresh.xac_nhan,
              },
              admin,
              true,
            ),
            (e) => e.code === "PREVIEW_EXPIRED",
          );
        } finally {
          Date.now = now;
        }
      },
    );
    await t.test(
      "failure on the second audit rolls back every draft, detail and batch row",
      async () => {
        const p = await preview(),
          before = await counts();
        ddl(
          `DELIMITER $$\nCREATE TRIGGER fail_batch_${suffix} BEFORE INSERT ON lich_su_hoa_don FOR EACH ROW BEGIN IF EXISTS (SELECT 1 FROM hoa_don WHERE ma_hoa_don=NEW.ma_hoa_don AND ma_can_ho=${apartments[1]}) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='batch test failure'; END IF; END$$\nDELIMITER ;\n`,
        );
        try {
          assert.equal(
            (
              await req("xac_nhan", {
                ...body(),
                khoa_yeu_cau: randomUUID(),
                xac_nhan: p.xac_nhan,
              })
            ).status,
            500,
          );
          assert.deepEqual(await counts(), before);
        } finally {
          ddl(`DROP TRIGGER IF EXISTS fail_batch_${suffix}`);
        }
      },
    );
    await t.test(
      "concurrent retries create exactly one atomic batch and recover IDs even with an expired token",
      async () => {
        const p = await preview(),
          input = {
            ...body(),
            khoa_yeu_cau: randomUUID(),
            xac_nhan: p.xac_nhan,
          };
        const result = await Promise.all([
          req("xac_nhan", input),
          req("xac_nhan", input),
        ]);
        for (const r of result)
          assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(result.filter((r) => r.body.data.da_lap_truoc).length, 1);
        assert.deepEqual(
          result[0].body.data.hoa_don,
          result[1].body.data.hoa_don,
        );
        const replay = await req("xac_nhan", {
          ...input,
          xac_nhan: "invalid-after-restart",
        });
        assert.equal(replay.status, 201);
        assert.equal(replay.body.data.da_lap_truoc, true);
        assert.equal(
          (await req("xac_nhan", { ...input, tinh_xe: true })).body.error.code,
          "BATCH_KEY_CONFLICT",
        );
        for (const r of replay.body.data.hoa_don) {
          const [record] = await rows(
            pool,
            "SELECT trang_thai,ma_nguoi_duyet,ma_nguoi_gui FROM hoa_don WHERE ma_hoa_don=?",
            [r.ma_hoa_don],
          );
          assert.deepEqual(record, {
            trang_thai: "NHAP",
            ma_nguoi_duyet: null,
            ma_nguoi_gui: null,
          });
        }
      },
    );
    await t.test(
      "separate request keys racing for overlapping apartments cannot duplicate invoices",
      async () => {
        const input = body(apartments.slice(3, 5)),
          p = await preview(input);
        const result = await Promise.all([
          req("xac_nhan", {
            ...input,
            xac_nhan: p.xac_nhan,
            khoa_yeu_cau: randomUUID(),
          }),
          req("xac_nhan", {
            ...input,
            xac_nhan: p.xac_nhan,
            khoa_yeu_cau: randomUUID(),
          }),
        ]);
        assert.equal(result.filter((r) => r.status === 201).length, 1);
        assert.equal(result.filter((r) => r.status === 409).length, 1);
      },
    );
    await t.test(
      "revoked management session cannot write through the service",
      async () => {
        const input = body([apartments[5]]),
          p = await preview(input);
        await rows(
          pool,
          "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [admin.ma_nguoi_dung],
        );
        const before = await counts();
        await assert.rejects(
          batchBills(
            { ...input, xac_nhan: p.xac_nhan, khoa_yeu_cau: randomUUID() },
            admin,
            true,
          ),
          (e) => e.status === 401,
        );
        assert.deepEqual(await counts(), before);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    ddl(`DROP TRIGGER IF EXISTS fail_batch_${suffix}`);
    for (const id of users) {
      await rows(
        pool,
        "DELETE d FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE h.ma_nguoi_lap=?",
        [id],
      );
      await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_nguoi_ghi=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM dot_lap_hoa_don WHERE ma_nguoi_lap=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM hoa_don WHERE ma_nguoi_lap=?", [id]);
    }
    for (const id of apartments) {
      await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [id]);
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    }
    for (const id of prices)
      await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
        id,
      ]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
