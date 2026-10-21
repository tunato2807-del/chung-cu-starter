import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { findUser } from "../src/modules/auth/auth.repository.js";
import * as service from "../src/modules/treasury/treasury.service.js";
import { today } from "../src/modules/treasury/treasury.validation.js";

test("treasury: exact ledger, proof isolation, concurrent spending, reversal and invoice integration", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    fundIds = [],
    bills = [],
    apts = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let admin, resident, tech, revoked, main, receipt, invoiceFund;
  async function req(
    path,
    method = "GET",
    body,
    cookie = admin?.cookie,
    csrf = true,
  ) {
    const form = body instanceof FormData,
      r = await fetch(base + path, {
        method,
        headers: {
          ...(csrf ? { "X-App-Request": "1" } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...(body && !form ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? (form ? body : JSON.stringify(body)) : undefined,
      });
    return { status: r.status, body: await r.json() };
  }
  async function account(role) {
    const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      r = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`Quỹ ${suffix}`, phone, hash, role],
      );
    users.push(r.insertId);
    const { token } = await login({ so_dien_thoai: phone, mat_khau: password });
    return { id: r.insertId, cookie: `session=${token}` };
  }
  async function fund(name = `Quỹ ${suffix}`) {
    const r = await req("/quy", "POST", {
      ten_quy: name,
      mo_ta: "Theo dõi quỹ thử",
      dang_hoat_dong: true,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    fundIds.push(r.body.data.ma_quy);
    return r.body.data.ma_quy;
  }
  const data = (extra = {}) => ({
    ma_quy: main,
    loai: "THU",
    nhom: "BO_SUNG_QUY",
    ngay_hach_toan: today(),
    so_tien: "100000",
    doi_tac: "Ban quản lý",
    dien_giai: "Khoản thu thử nghiệm",
    khoa_yeu_cau: randomUUID(),
    ...extra,
  });
  async function create(extra = {}) {
    const r = await req("/phieu_thu_chi", "POST", data(extra));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return r.body.data.ma_phieu;
  }
  const detail = (id) => req(`/phieu_thu_chi/${id}`);
  async function act(id, action = "duyet", extra = {}) {
    const p = (await detail(id)).body.data;
    return req(`/phieu_thu_chi/${id}/${action}`, "POST", {
      phien_ban: p.phien_ban,
      ly_do: "Điều chỉnh sai thông tin",
      ...extra,
    });
  }
  const current = (id) => req(`/quy/${id}`);
  async function pdf(
    id,
    extra = {},
    name = "bien-lai.pdf",
    content = "%PDF-1.4\nProof fixture\n%%EOF\n",
  ) {
    const p = (await detail(id)).body.data,
      body = new FormData();
    body.set("phien_ban", extra.phien_ban ?? p.phien_ban);
    body.append(
      "chung_tu",
      new Blob([content], { type: "application/pdf" }),
      name,
    );
    return req(`/phieu_thu_chi/${id}/chung_tu`, "POST", body);
  }
  async function seed(id, sum) {
    const p = await create({ ma_quy: id, so_tien: String(sum) });
    assert.equal((await act(p)).status, 200);
    return p;
  }
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
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    revoked = await account("QUAN_TRI_VIEN");
    main = await fund();
    invoiceFund = (
      await rows(
        pool,
        "SELECT ma_quy FROM quy_tai_chinh WHERE nhan_thu_hoa_don=1",
      )
    )[0].ma_quy;
    await t.test(
      "management-only routes, CSRF and strict monetary/date/category validation",
      async () => {
        for (const cookie of [resident.cookie, tech.cookie])
          for (const path of ["/quy", "/phieu_thu_chi", `/quy/${main}/so_quy`])
            assert.equal((await req(path, "GET", null, cookie)).status, 403);
        assert.equal((await req("/quy", "GET", null, null)).status, 401);
        assert.equal(
          (await req("/phieu_thu_chi", "POST", data(), admin.cookie, false))
            .status,
          403,
        );
        for (const extra of [
          { so_tien: "0" },
          { so_tien: "1.5" },
          { so_tien: "-1" },
          { so_tien: "100000000000000" },
          { ngay_hach_toan: "2199-01-01" },
          { nhom: "THU_HOA_DON" },
          { nhom: "BAO_TRI" },
          { ma_quy: 0 },
          { khoa_yeu_cau: "bad" },
        ])
          assert.equal(
            (await req("/phieu_thu_chi", "POST", data(extra))).status,
            422,
            JSON.stringify(extra),
          );
        assert.equal(
          (await req(`/quy/${main}/so_quy?tu_ngay=2026-02-30`)).status,
          422,
        );
        assert.equal((await req("/quy?page=0")).status, 422);
      },
    );
    await t.test(
      "concurrent create retries return one draft without changing balance",
      async () => {
        const body = data();
        const rs = await Promise.all(
          [1, 2, 3].map(() => req("/phieu_thu_chi", "POST", body)),
        );
        assert.deepEqual(rs.map((r) => r.status).sort(), [200, 200, 201]);
        receipt = rs[0].body.data.ma_phieu;
        assert.ok(rs.every((r) => r.body.data.ma_phieu === receipt));
        assert.equal((await current(main)).body.data.so_du, "0");
        assert.equal(
          (await req("/phieu_thu_chi", "POST", { ...body, so_tien: "200000" }))
            .status,
          409,
        );
        assert.equal((await detail(receipt)).body.data.van_tay, undefined);
        assert.equal((await detail(receipt)).body.data.khoa_yeu_cau, undefined);
      },
    );
    await t.test(
      "draft edit, immutable fund/type and versioned one-time posting",
      async () => {
        const p = (await detail(receipt)).body.data;
        assert.equal(
          (
            await req(`/phieu_thu_chi/${receipt}`, "PUT", {
              ...p,
              loai: "CHI",
              nhom: "BAO_TRI",
            })
          ).status,
          422,
        );
        assert.equal(
          (
            await req(`/phieu_thu_chi/${receipt}`, "PUT", {
              ...p,
              so_tien: "150000",
              dien_giai: "Sửa phiếu trước ghi sổ",
            })
          ).status,
          200,
        );
        assert.equal(
          (await act(receipt, "duyet", { phien_ban: 0 })).status,
          409,
        );
        assert.equal((await act(receipt)).status, 200);
        assert.equal((await current(main)).body.data.so_du, "150000");
        assert.equal((await act(receipt)).status, 409);
        assert.equal(
          (
            await req(`/phieu_thu_chi/${receipt}`, "PUT", {
              ...p,
              phien_ban: 2,
            })
          ).status,
          409,
        );
        assert.equal((await act(receipt, "huy")).status, 409);
      },
    );
    await t.test(
      "proof uploads validate content, re-encode images, deduplicate retries and isolate downloads",
      async () => {
        const id = await create({
          loai: "CHI",
          nhom: "BAO_TRI",
          so_tien: "50000",
        });
        const body = new FormData();
        body.set("phien_ban", "0");
        body.append(
          "chung_tu",
          new Blob(
            [
              await sharp({
                create: {
                  width: 20,
                  height: 20,
                  channels: 3,
                  background: "#778899",
                },
              })
                .png()
                .toBuffer(),
            ],
            { type: "application/octet-stream" },
          ),
          "anh.png",
        );
        assert.equal(
          (await req(`/phieu_thu_chi/${id}/chung_tu`, "POST", body)).status,
          200,
        );
        let p = (await detail(id)).body.data;
        assert.equal(p.chung_tu[0].loai_tep, "image/jpeg");
        assert.equal(p.chung_tu[0].ten_tep, "anh.jpg");
        const proofId = p.chung_tu[0].ma_chung_tu,
          r = await fetch(`${base}/phieu_thu_chi/${id}/chung_tu/${proofId}`, {
            headers: { Cookie: admin.cookie },
          });
        assert.equal(r.status, 200);
        assert.match(r.headers.get("content-disposition"), /^attachment;/);
        assert.match(r.headers.get("content-security-policy"), /sandbox/);
        assert.equal(r.headers.get("x-content-type-options"), "nosniff");
        assert.equal(
          (await sharp(Buffer.from(await r.arrayBuffer())).metadata()).format,
          "jpeg",
        );
        assert.equal(
          (
            await fetch(`${base}/phieu_thu_chi/${id}/chung_tu/${proofId}`, {
              headers: { Cookie: resident.cookie },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await fetch(
              `${base}/phieu_thu_chi/${receipt}/chung_tu/${proofId}`,
              { headers: { Cookie: admin.cookie } },
            )
          ).status,
          404,
        );
        assert.equal((await pdf(id)).status, 200);
        const duplicate = await pdf(id, { phien_ban: 0 });
        assert.equal(duplicate.status, 200);
        assert.equal(duplicate.body.data.replay, true);
        assert.equal((await detail(id)).body.data.chung_tu.length, 2);
        assert.equal(
          (await pdf(id, {}, "evil.pdf", "<script>alert(1)</script>")).status,
          422,
        );
        assert.equal(
          (await pdf(id, {}, "broken.pdf", "%PDF-1.4 missing end")).status,
          422,
        );
        for (let i = 0; i < 3; i++)
          assert.equal(
            (await pdf(id, {}, `x${i}.pdf`, `%PDF-1.4\n${i}\n%%EOF\n`)).status,
            200,
          );
        assert.equal(
          (await pdf(id, {}, "last.pdf", "%PDF-1.4\nextra\n%%EOF\n")).status,
          422,
        );
        p = (await detail(id)).body.data;
        assert.equal(
          (
            await req(`/phieu_thu_chi/${id}/chung_tu/${proofId}`, "DELETE", {
              phien_ban: p.phien_ban,
            })
          ).status,
          200,
        );
        const huge = Buffer.alloc(5 * 1024 * 1024 + 1, 65);
        assert.equal((await pdf(id, {}, "large.pdf", huge)).status, 413);
      },
    );
    await t.test(
      "expenses require evidence; approval locks proofs and changes the ledger only once",
      async () => {
        const id = await create({
          loai: "CHI",
          nhom: "VAN_HANH",
          so_tien: "25000",
        });
        assert.equal((await act(id)).status, 422);
        assert.equal((await pdf(id)).status, 200);
        assert.equal((await act(id)).status, 200);
        assert.equal((await current(main)).body.data.so_du, "125000");
        assert.equal((await pdf(id)).status, 409);
        const p = (await detail(id)).body.data;
        assert.equal(
          (
            await req(
              `/phieu_thu_chi/${id}/chung_tu/${p.chung_tu[0].ma_chung_tu}`,
              "DELETE",
              { phien_ban: p.phien_ban },
            )
          ).status,
          409,
        );
        assert.equal((await pdf(receipt)).status, 409);
      },
    );
    await t.test(
      "fund mutex prevents two simultaneous expenses from overspending",
      async () => {
        const f = await fund(`Đồng thời ${suffix}`);
        await seed(f, 100000);
        const ids = [];
        for (let i = 0; i < 2; i++) {
          const id = await create({
            ma_quy: f,
            loai: "CHI",
            nhom: "CHI_KHAC",
            so_tien: "70000",
          });
          await pdf(id);
          ids.push(id);
        }
        const rs = await Promise.all(ids.map((id) => act(id)));
        assert.deepEqual(rs.map((r) => r.status).sort(), [200, 409]);
        assert.equal((await current(f)).body.data.so_du, "30000");
        const posted = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM phieu_thu_chi WHERE ma_quy=? AND loai='CHI' AND trang_thai='DA_GHI_SO'",
          [f],
        );
        assert.equal(posted[0].n, 1);
      },
    );
    await t.test(
      "reversal preserves the original, is one-time and idempotent, and cannot overdraw income",
      async () => {
        const f = await fund(`Đảo ${suffix}`),
          income = await seed(f, 100000),
          expense = await create({
            ma_quy: f,
            loai: "CHI",
            nhom: "CHI_KHAC",
            so_tien: "80000",
          });
        await pdf(expense);
        assert.equal((await act(expense)).status, 200);
        assert.equal((await act(income, "dao")).status, 409);
        const longReason = "L".repeat(998) + "🚀";
        const rs = await Promise.all(
          [1, 2].map(() => act(expense, "dao", { ly_do: longReason })),
        );
        assert.ok(rs.every((r) => r.status === 200));
        assert.equal(rs[0].body.data.ma_phieu, rs[1].body.data.ma_phieu);
        assert.equal((await current(f)).body.data.so_du, "100000");
        const reverse = rs[0].body.data.ma_phieu;
        assert.equal((await detail(expense)).body.data.trang_thai, "DA_GHI_SO");
        assert.equal((await detail(expense)).body.data.ma_phieu_dao, reverse);
        assert.equal((await detail(reverse)).body.data.ma_phieu_goc, expense);
        assert.ok(
          (await detail(expense)).body.data.history
            .at(-1)
            .ghi_chu.endsWith(longReason),
        );
        assert.ok(
          (await detail(reverse)).body.data.history
            .at(-1)
            .ghi_chu.endsWith(longReason),
        );
        assert.equal((await act(reverse, "dao")).status, 409);
        assert.equal(
          (await act(expense, "dao", { ly_do: "Một lý do khác hoàn toàn" }))
            .status,
          409,
        );
        assert.equal((await act(income, "dao")).status, 200);
        assert.equal((await current(f)).body.data.so_du, "0");
      },
    );
    await t.test(
      "canceled drafts never affect balance; closed funds block new posting but keep history",
      async () => {
        const f = await fund(`Tạm ngừng ${suffix}`),
          id = await create({ ma_quy: f });
        assert.equal((await act(id, "huy")).status, 200);
        assert.equal((await current(f)).body.data.so_du, "0");
        const pending = await create({ ma_quy: f }),
          before = (await current(f)).body.data;
        assert.equal(
          (await req(`/quy/${f}`, "PUT", { ...before, dang_hoat_dong: false }))
            .status,
          200,
        );
        assert.equal((await act(pending)).status, 409);
        assert.equal(
          (await req("/phieu_thu_chi", "POST", data({ ma_quy: f }))).status,
          409,
        );
        assert.equal((await act(pending, "huy")).status, 200);
        const def = (await current(invoiceFund)).body.data;
        assert.equal(
          (
            await req(`/quy/${invoiceFund}`, "PUT", {
              ...def,
              dang_hoat_dong: false,
            })
          ).status,
          422,
        );
      },
    );
    await t.test(
      "opening, period totals, monthly reports and detail filters use exact dates and money",
      async () => {
        const f = await fund(`Báo cáo ${suffix}`),
          first = `${today().slice(0, 7)}-01`,
          previous = new Date(
            new Date(first + "T00:00:00Z").getTime() - 86400000,
          )
            .toISOString()
            .slice(0, 10);
        const old = await create({
          ma_quy: f,
          so_tien: "100000",
          ngay_hach_toan: previous,
        });
        await act(old);
        const cost = await create({
          ma_quy: f,
          loai: "CHI",
          nhom: "VAN_HANH",
          so_tien: "40000",
          dien_giai: "Chi vận hành độc nhất",
        });
        await pdf(cost);
        await act(cost);
        await seed(f, 20000);
        await create({ ma_quy: f, so_tien: "900000" });
        const r = await req(
          `/quy/${f}/so_quy?tu_ngay=${first}&den_ngay=${today()}&loai=CHI&q=độc`,
        );
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.deepEqual(r.body.summary, {
          dau_ky: "100000",
          tong_thu: "20000",
          tong_chi: "40000",
          cuoi_ky: "80000",
        });
        assert.equal(r.body.total, 1);
        const months = await req(
          `/quy/${f}/so_quy?tu_ngay=${previous}&den_ngay=${today()}&che_do=THEO_THANG`,
        );
        assert.equal(months.status, 200, JSON.stringify(months.body));
        assert.equal(months.body.data.length, 2);
        assert.equal(months.body.data[0].tong_chi, "40000");
        const big = await fund(`Số lớn ${suffix}`);
        for (let i = 0; i < 93; i++) await seed(big, "99999999999999");
        assert.equal(
          (await current(big)).body.data.so_du,
          (99999999999999n * 93n).toString(),
        );
      },
    );
    await t.test(
      "confirmed invoices appear once automatically, by Vietnam confirmation date, and remain isolated to operating fund",
      async () => {
        const baseline = BigInt((await current(invoiceFund)).body.data.so_du),
          apt = await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,'TQ',1,50)",
            [`TQ-${suffix}`],
          );
        apts.push(apt.insertId);
        const bill = await rows(
          pool,
          "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai) VALUES (?,?,?, ?,1,0,0,0,54321,'[]',?,?,'DA_GUI')",
          [
            `TQ-${suffix}`,
            apt.insertId,
            today().slice(0, 7),
            today(),
            "a".repeat(64),
            admin.id,
          ],
        );
        bills.push(bill.insertId);
        const payment = {
          so_tien: "54321",
          ma_tham_chieu: `TQ-${suffix}`,
          phien_ban: 0,
        };
        for (let i = 0; i < 2; i++)
          assert.equal(
            (
              await req(
                `/hoa_don/${bill.insertId}/xac_nhan_thanh_toan`,
                "POST",
                payment,
              )
            ).status,
            200,
          );
        assert.equal(
          (await current(invoiceFund)).body.data.so_du,
          (baseline + 54321n).toString(),
        );
        const r = await req(
          `/quy/${invoiceFund}/so_quy?q=TQ-${suffix}&nguon=HOA_DON&tu_ngay=${today()}&den_ngay=${today()}`,
        );
        assert.equal(r.status, 200);
        assert.equal(r.body.total, 1);
        assert.equal(r.body.data[0].ngay, today());
        assert.equal(r.body.data[0].so_tien, "54321");
        assert.equal(r.body.data[0].nguon, "HOA_DON");
        assert.equal(
          (await req(`/quy/${main}/so_quy?q=TQ-${suffix}&nguon=HOA_DON`)).body
            .total,
          0,
        );
        const ids = await rows(
          pool,
          "SELECT ma_phieu FROM phieu_thu_chi WHERE dien_giai=?",
          [`Thu hóa đơn TQ-${suffix}`],
        );
        assert.equal(ids.length, 0);
        // +07:00 midnight is still the previous UTC day.
        const timestamp = new Date(`${today()}T00:05:00+07:00`)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        await rows(
          pool,
          "UPDATE hoa_don SET ngay_thanh_toan=? WHERE ma_hoa_don=?",
          [timestamp, bill.insertId],
        );
        assert.equal(
          (
            await req(
              `/quy/${invoiceFund}/so_quy?q=TQ-${suffix}&tu_ngay=${today()}&den_ngay=${today()}`,
            )
          ).body.data[0].ngay,
          today(),
        );
      },
    );
    await t.test(
      "a report is a consistent nonlocking snapshot while another request posts",
      async () => {
        const f = await fund(`Snapshot ${suffix}`);
        await seed(f, 100);
        const id = await create({ ma_quy: f, so_tien: "20" }),
          originalGet = pool.getConnection;
        let interleaved = false;
        pool.getConnection = async function () {
          const db = await originalGet.call(pool),
            execute = db.execute,
            release = db.release;
          db.execute = async function (sql, args) {
            const result = await execute.call(db, sql, args);
            if (!interleaved && sql.includes("AS dau_ky")) {
              interleaved = true;
              assert.equal((await act(id)).status, 200);
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
          const r = await req(`/quy/${f}/so_quy`);
          assert.equal(r.status, 200);
          assert.equal(interleaved, true);
          assert.equal(r.body.summary.cuoi_ky, "100");
          assert.equal(r.body.total, 1);
          assert.equal(r.body.data.length, 1);
        } finally {
          pool.getConnection = originalGet;
        }
        assert.equal((await current(f)).body.data.so_du, "120");
      },
    );
    await t.test(
      "failed audit rolls back draft, approval, proof and reversal atomically",
      async () => {
        const f = await fund(`Rollback ${suffix}`),
          original = await seed(f, 100000),
          id = await create({ ma_quy: f }),
          key = randomUUID(),
          before = (await detail(original)).body.data.phien_ban;
        rootSQL(
          "CREATE TRIGGER test_treasury_audit_failure BEFORE INSERT ON lich_su_thu_chi FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit failure';",
        );
        try {
          assert.equal(
            (
              await req(
                "/phieu_thu_chi",
                "POST",
                data({ ma_quy: f, khoa_yeu_cau: key }),
              )
            ).status,
            500,
          );
          assert.equal(
            (
              await rows(
                pool,
                "SELECT ma_phieu FROM phieu_thu_chi WHERE khoa_yeu_cau=?",
                [key],
              )
            ).length,
            0,
          );
          assert.equal((await act(id)).status, 500);
          assert.equal((await detail(id)).body.data.trang_thai, "NHAP");
          assert.equal((await current(f)).body.data.so_du, "100000");
          assert.equal((await pdf(id)).status, 500);
          assert.equal((await detail(id)).body.data.chung_tu.length, 0);
          assert.equal((await act(original, "dao")).status, 500);
          assert.equal((await detail(original)).body.data.phien_ban, before);
          assert.equal((await detail(original)).body.data.ma_phieu_dao, null);
        } finally {
          rootSQL("DROP TRIGGER IF EXISTS test_treasury_audit_failure;");
        }
      },
    );
    await t.test(
      "pagination covers every matching fund, voucher and ledger row",
      async () => {
        for (let i = 0; i < 21; i++) await fund(`Phân trang ${suffix} ${i}`);
        let a = await req(`/quy?q=Phân%20trang%20${suffix}`),
          b = await req(`/quy?q=Phân%20trang%20${suffix}&page=2`);
        assert.equal(a.body.data.length, 20);
        assert.equal(b.body.data.length, 1);
        assert.equal(
          new Set([...a.body.data, ...b.body.data].map((x) => x.ma_quy)).size,
          21,
        );
        const f = await fund(`Trang phiếu ${suffix}`);
        for (let i = 0; i < 23; i++) await seed(f, 100);
        a = await req(`/phieu_thu_chi?ma_quy=${f}`);
        b = await req(`/phieu_thu_chi?ma_quy=${f}&page=2`);
        assert.equal(a.body.data.length, 20);
        assert.equal(b.body.data.length, 3);
        a = await req(`/quy/${f}/so_quy`);
        b = await req(`/quy/${f}/so_quy?page=2`);
        assert.equal(a.body.total, 23);
        assert.equal(b.body.data.length, 3);
        assert.equal(a.body.summary.cuoi_ky, "2300");
      },
    );
    await t.test(
      "transactions reject an account revoked after middleware authentication",
      async () => {
        const stale = await findUser(revoked.id);
        await rows(
          pool,
          "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [revoked.id],
        );
        await assert.rejects(
          service.create(data(), stale),
          (e) => e.status === 401,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of fundIds) {
      await rows(
        pool,
        "DELETE FROM phieu_thu_chi WHERE ma_quy=? AND ma_phieu_goc IS NOT NULL",
        [id],
      );
      await rows(pool, "DELETE FROM phieu_thu_chi WHERE ma_quy=?", [id]);
      await rows(pool, "DELETE FROM quy_tai_chinh WHERE ma_quy=?", [id]);
    }
    for (const id of bills) {
      await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [id]);
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
    }
    for (const id of apts)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
