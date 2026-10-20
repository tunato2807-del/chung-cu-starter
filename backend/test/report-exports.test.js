import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import parsePdf from "pdf-parse/lib/pdf-parse.js";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { today } from "../src/modules/billing/billing.validation.js";
import * as financial from "../src/modules/financial-reports/financial-reports.service.js";
import * as treasury from "../src/modules/treasury/treasury.service.js";
import {
  reserve,
  reportPage,
} from "../src/modules/report-exports/report-files.js";

test("report exports: complete snapshot, real XLSX/PDF, exact money, filters and permissions", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    block = `X${suffix}`,
    secret = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(secret, 10),
    users = [],
    apartments = [],
    bills = [],
    funds = [],
    dir = await mkdtemp(path.join(tmpdir(), "condo-exports-")),
    day = today(),
    yesterday = new Date(new Date(`${day}T00:00:00Z`).getTime() - 86400000)
      .toISOString()
      .slice(0, 10),
    first = day.slice(0, 7) + "-01";
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let admin, resident, tech, fund, largeFund, owner;
  async function account(role) {
    const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      r = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`Nguyễn Thị Ánh ${suffix}`, phone, hash, role],
      );
    users.push(r.insertId);
    return {
      id: r.insertId,
      cookie:
        "session=" +
        (await login({ so_dien_thoai: phone, mat_khau: secret })).token,
    };
  }
  async function req(uri, cookie = admin?.cookie) {
    const r = await fetch(base + uri, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    return {
      status: r.status,
      headers: r.headers,
      buffer: Buffer.from(await r.arrayBuffer()),
    };
  }
  async function workbook(uri) {
    const r = await req(uri);
    assert.equal(r.status, 200, r.buffer.toString());
    assert.match(r.headers.get("content-type"), /spreadsheetml/);
    assert.match(
      r.headers.get("content-disposition"),
      /attachment; filename="[a-z0-9_.-]+\.xlsx"/,
    );
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(r.buffer);
    return {
      r,
      wb,
      data: wb.getWorksheet("Chi tiết"),
      meta: wb.getWorksheet("Tổng hợp"),
    };
  }
  function summary(sheet, label) {
    let value;
    sheet.eachRow((r) => {
      if (r.getCell(1).value === label) value = r.getCell(2).value;
    });
    return value;
  }
  async function textPDF(uri, name) {
    const r = await req(uri);
    assert.equal(r.status, 200, r.buffer.toString());
    assert.match(r.headers.get("content-type"), /application\/pdf/);
    assert.equal(r.buffer.subarray(0, 5).toString(), "%PDF-");
    const file = path.join(dir, name + ".pdf");
    await writeFile(file, r.buffer);
    return {
      r,
      file,
      text: (await parsePdf(r.buffer)).text,
    };
  }
  async function newFund(name) {
    const r = await rows(
      pool,
      "INSERT INTO quy_tai_chinh (ten_quy,mo_ta) VALUES (?,?)",
      [name, "Quỹ kiểm tra xuất file"],
    );
    funds.push(r.insertId);
    return r.insertId;
  }
  async function voucher(
    id,
    sum,
    desc = "Thu hoạt động cộng đồng",
    date = day,
  ) {
    const r = await rows(
      pool,
      "INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,khoa_yeu_cau,van_tay) VALUES (?,'THU','THU_KHAC',?,?,?,?,'DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?,?)",
      [
        id,
        date,
        sum,
        `Nguyễn Thị Ánh ${suffix}`,
        desc,
        admin.id,
        admin.id,
        randomUUID(),
        "b".repeat(64),
      ],
    );
    return r.insertId;
  }
  try {
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    fund = await newFund(`Quỹ cộng đồng ${suffix}`);
    for (let i = 0; i < 50; i++) {
      const apt = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
        [`00${suffix}-${String(i).padStart(2, "0")}`, block],
      );
      apartments.push(apt.insertId);
      const paid = i % 2 === 0,
        status = paid ? "DA_THANH_TOAN" : "DA_GUI",
        sum = String(100000 + i),
        timestamp = new Date(`${day}T00:05:00+07:00`)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
      const bill = await rows(
        pool,
        "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan,ngay_thanh_toan,so_tien_da_thu,ma_tham_chieu,ma_nguoi_xac_nhan) VALUES (?,?,?, ?,1,0,0,0,?,'[]',?,?,?,?,?,?,?,?)",
        [
          `EX-${suffix}-${i}`,
          apt.insertId,
          day.slice(0, 7),
          day,
          sum,
          "a".repeat(64),
          admin.id,
          status,
          i % 2 === 0 ? yesterday : day,
          paid ? timestamp : null,
          paid ? sum : "0",
          paid ? `000PAY-${suffix}-${i}` : null,
          paid ? admin.id : null,
        ],
      );
      bills.push(bill.insertId);
      await voucher(
        fund,
        String(200000 + i),
        i === 0
          ? '=HYPERLINK("https://example.invalid","Nguyễn Thị Ánh")'
          : `Nội dung ${suffix} ${i}`,
      );
    }
    const profile = await rows(
      pool,
      "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
      [`Nguyễn Thị Ánh ${suffix}`, "0901234567"],
    );
    owner = profile.insertId;
    await rows(
      pool,
      "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'CHU_HO',?,?)",
      [owner, apartments[1], day, admin.id],
    );
    await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,mat_khau_ma_hoa,vai_tro,dang_hoat_dong,ten_dang_nhap,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach) VALUES (?,?,'CU_DAN',0,?,?,?)",
      ["Tài khoản xuất", hash, `EX${suffix}`, apartments[1], owner],
    );
    await t.test(
      "exports are management-only and validate format/date/scope",
      async () => {
        for (const uri of [
          "/bao_cao/cong_no/xuat",
          "/bao_cao/thu_phi/xuat",
          `/quy/${fund}/so_quy/xuat`,
        ]) {
          assert.equal((await req(uri, null)).status, 401);
          for (const u of [resident, tech])
            assert.equal((await req(uri, u.cookie)).status, 403);
          assert.equal((await req(uri + "?dinh_dang=csv")).status, 422);
        }
        assert.equal(
          (await req("/bao_cao/thu_phi/xuat?tu_ngay=2026-02-30")).status,
          422,
        );
        assert.equal((await req("/quy/999999999/so_quy/xuat")).status, 404);
      },
    );
    await t.test(
      "Excel exports every matching row across pages, retains codes/phones and neutralizes formulas",
      async () => {
        const r = await workbook(
            `/bao_cao/cong_no/xuat?dinh_dang=xlsx&khoi=${block}&page=2&che_do=CAN_HO`,
          ),
          normal = await financial.debts({ khoi: block, che_do: "CAN_HO" });
        assert.equal(r.data.rowCount - 1, normal.total);
        assert.equal(Number(r.r.headers.get("x-export-rows")), normal.total);
        assert.equal(
          summary(r.meta, "Tổng hóa đơn đã gửi"),
          Number(normal.summary.tong_da_gui),
        );
        const codes = [];
        r.data.eachRow((row, index) => {
          if (index > 1) codes.push(row.getCell(1).value);
        });
        assert.ok(
          codes.every((x) => typeof x === "string" && x.startsWith("00")),
        );
        const ownerRow = r.data
          .getRows(2, r.data.rowCount - 1)
          .find((row) => row.getCell(3).value === `Nguyễn Thị Ánh ${suffix}`);
        assert.equal(ownerRow.getCell(4).value, "0901234567");
        const ledger = await workbook(
          `/quy/${fund}/so_quy/xuat?dinh_dang=xlsx&page=2`,
        );
        assert.equal(ledger.data.rowCount - 1, 50);
        assert.equal(ledger.data.autoFilter, "A1:H51");
        assert.equal(ledger.data.views[0].ySplit, 1);
        const malicious = ledger.data
          .getRows(2, 50)
          .find((row) => String(row.getCell(6).value).startsWith("="));
        assert.equal(typeof malicious.getCell(6).value, "string");
        assert.equal(malicious.getCell(6).type, ExcelJS.ValueType.String);
        for (const sheet of ledger.wb.worksheets)
          sheet.eachRow((row) =>
            row.eachCell((cell) =>
              assert.notEqual(cell.type, ExcelJS.ValueType.Formula),
            ),
          );
        assert.equal((await treasury.ledger(fund, {})).data.length, 20);
      },
    );
    await t.test(
      "all financial views keep exactly their JSON filters and summaries",
      async () => {
        for (const view of ["CAN_HO", "HOA_DON", "THEO_KY"]) {
          const query = {
              khoi: block,
              che_do: view,
              ...(view === "HOA_DON" ? { qua_han: "1" } : {}),
            },
            json = await financial.debts(query, "xlsx"),
            x = await workbook(
              "/bao_cao/cong_no/xuat?" +
                new URLSearchParams({ ...query, dinh_dang: "xlsx" }),
            );
          assert.equal(x.data.rowCount - 1, json.total);
          assert.equal(
            summary(x.meta, "Còn phải thu"),
            Number(json.summary.con_phai_thu),
          );
        }
        for (const view of ["GIAO_DICH", "THEO_NGAY"]) {
          const query = {
              khoi: block,
              che_do: view,
              tu_ngay: day,
              den_ngay: day,
            },
            json = await financial.collections(query, "xlsx"),
            x = await workbook(
              "/bao_cao/thu_phi/xuat?" +
                new URLSearchParams({ ...query, dinh_dang: "xlsx" }),
            );
          assert.equal(x.data.rowCount - 1, json.total);
          assert.equal(
            summary(x.meta, "Đã ghi nhận thu"),
            Number(json.summary.tong_da_thu),
          );
          if (view === "GIAO_DICH")
            assert.ok(
              x.data
                .getRows(2, json.total)
                .every((row) =>
                  String(row.getCell(6).value).startsWith("000PAY-"),
                ),
            );
        }
        const x = await workbook(
          `/quy/${fund}/so_quy/xuat?dinh_dang=xlsx&nguon=HOA_DON`,
        );
        assert.equal(x.data.rowCount, 1);
        assert.equal(summary(x.meta, "Thu trong kỳ"), 10001225);
        const month = await workbook(
          `/quy/${fund}/so_quy/xuat?dinh_dang=xlsx&che_do=THEO_THANG&q=ignored`,
        );
        assert.equal(month.data.rowCount, 2);
        assert.equal(month.data.getCell("B2").value, 10001225);
      },
    );
    await t.test(
      "real PDF embeds Vietnamese, exact text and repeated headers across pages",
      async () => {
        // More than one page, without truncating the long narrative or a later row.
        for (let i = 50; i < 90; i++)
          await voucher(
            fund,
            "1000",
            `Dòng ${String(i).padStart(3, "0")} · Nguyễn Thị Ánh · ${"Nội dung cần giữ đủ. ".repeat(10)}`,
          );
        const r = await textPDF(
          `/quy/${fund}/so_quy/xuat?dinh_dang=pdf&page=5`,
          "ledger",
        );
        assert.match(r.text, /Quỹ cộng đồng/);
        assert.match(r.text, /Nguyễn Thị Ánh/);
        assert.match(r.text, /Dòng 089/);
        assert.match(r.text, /90 dòng chi tiết/);
        assert.ok(r.text.split("Ngày hạch toán").length > 2);
        assert.match(r.text, /Trang 2/);
        assert.equal(Number(r.r.headers.get("x-export-rows")), 90);
        for (const [uri, name, needle] of [
          [
            `/bao_cao/cong_no/xuat?khoi=${block}&dinh_dang=pdf`,
            "debts",
            "Báo cáo công nợ",
          ],
          [
            `/bao_cao/thu_phi/xuat?khoi=${block}&tu_ngay=${day}&den_ngay=${day}&dinh_dang=pdf`,
            "collections",
            "Báo cáo thu phí",
          ],
        ]) {
          const p = await textPDF(uri, name);
          assert.ok(p.text.includes(needle));
          assert.ok(p.text.includes(block));
        }
        await writeFile(
          "/tmp/chung-cu-export-ledger.pdf",
          await (
            await req(`/quy/${fund}/so_quy/xuat?dinh_dang=pdf`)
          ).buffer,
        );
      },
    );
    await t.test(
      "amounts above Excel precision remain exact text and PDF never rounds them",
      async () => {
        const huge = "99999999999999",
          sum = (BigInt(huge) * 93n).toString(),
          id = await newFund(`Chính xác ${suffix}`);
        for (let i = 0; i < 93; i++) await voucher(id, huge);
        const x = await workbook(`/quy/${id}/so_quy/xuat?dinh_dang=xlsx`);
        assert.equal(summary(x.meta, "Cuối kỳ"), sum);
        assert.equal(typeof summary(x.meta, "Cuối kỳ"), "string");
        assert.equal(x.data.getCell("G2").value, Number(huge));
        const p = await textPDF(
          `/quy/${id}/so_quy/xuat?dinh_dang=pdf&che_do=THEO_THANG`,
          "huge",
        );
        assert.ok(p.text.includes(BigInt(sum).toLocaleString("vi-VN")));
      },
    );
    await t.test(
      "empty exports still have proper headers, summary and selected filters",
      async () => {
        const x = await workbook(
          `/bao_cao/cong_no/xuat?dinh_dang=xlsx&khoi=NONE${suffix.slice(0, 4)}`,
        );
        assert.equal(x.data.rowCount, 1);
        assert.equal(summary(x.meta, "Còn phải thu"), 0);
        const p = await textPDF(
          `/quy/${fund}/so_quy/xuat?dinh_dang=pdf&q=NO_MATCH_${suffix}`,
          "empty",
        );
        assert.match(p.text, /Không có dữ liệu phù hợp/);
        assert.match(p.text, /NO_MATCH_/);
      },
    );
    await t.test(
      "limits are checked before detail selection, never silently truncated; JSON remains paginated",
      async () => {
        largeFund = await newFund(`Giới hạn ${suffix}`);
        const common = [largeFund, day, admin.id, admin.id];
        for (let start = 0; start < 10001; start += 250) {
          const size = Math.min(250, 10001 - start),
            params = [];
          const groups = Array.from({ length: size }, () => {
            params.push(...common, randomUUID(), "c".repeat(64));
            return "(?,'THU','THU_KHAC',?,1,'Ban quản lý','Nội dung kiểm tra giới hạn','DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?,?)";
          });
          await rows(
            pool,
            `INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,khoa_yeu_cau,van_tay) VALUES ${groups.join(",")}`,
            params,
          );
        }
        for (const type of ["pdf", "xlsx"]) {
          const r = await req(
            `/quy/${largeFund}/so_quy/xuat?dinh_dang=${type}`,
          );
          assert.equal(r.status, 422);
          assert.equal(JSON.parse(r.buffer).error.code, "EXPORT_TOO_LARGE");
        }
        const normal = await treasury.ledger(largeFund, {});
        assert.equal(normal.total, 10001);
        assert.equal(normal.data.length, 20);
        // Export failure releases the account slot, so a narrowed request works immediately.
        const x = await workbook(
          `/quy/${largeFund}/so_quy/xuat?dinh_dang=xlsx&q=NOT_FOUND`,
        );
        assert.equal(x.data.rowCount, 1);
        assert.doesNotThrow(() => reportPage({}, "pdf").check(1000));
        assert.throws(
          () => reportPage({}, "pdf").check(1001),
          (e) => e.code === "EXPORT_TOO_LARGE",
        );
      },
    );
    await t.test(
      "summary/count/all rows use one consistent read-only snapshot during a concurrent posting",
      async () => {
        const id = await newFund(`Snapshot xuất ${suffix}`);
        await voucher(id, "100");
        const original = pool.getConnection;
        let interleaved = false;
        pool.getConnection = async function () {
          const db = await original.call(pool),
            execute = db.execute,
            release = db.release;
          db.execute = async function (sql, args) {
            const result = await execute.call(db, sql, args);
            if (!interleaved && sql.includes("AS dau_ky")) {
              interleaved = true;
              await voucher(id, "20");
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
          const x = await workbook(`/quy/${id}/so_quy/xuat?dinh_dang=xlsx`);
          assert.equal(interleaved, true);
          assert.equal(summary(x.meta, "Cuối kỳ"), 100);
          assert.equal(x.data.rowCount, 2);
        } finally {
          pool.getConnection = original;
        }
        assert.equal((await treasury.fundDetail(id)).so_du, "120");
      },
    );
    await t.test(
      "export concurrency is bounded and release is reliable",
      async () => {
        const a = reserve(admin.id),
          b = reserve(resident.id);
        try {
          assert.throws(
            () => reserve(admin.id),
            (e) => e.code === "EXPORT_BUSY",
          );
          const r = await req(`/quy/${fund}/so_quy/xuat`);
          assert.equal(r.status, 429);
          assert.equal(r.headers.get("retry-after"), "3");
          assert.throws(
            () => reserve(99999999),
            (e) => e.code === "EXPORT_BUSY",
          );
        } finally {
          a();
          b();
        }
        const r = await workbook(
          `/quy/${fund}/so_quy/xuat?dinh_dang=xlsx&q=none`,
        );
        assert.equal(r.data.rowCount, 1);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of funds) {
      await rows(pool, "DELETE FROM phieu_thu_chi WHERE ma_quy=?", [id]);
      await rows(pool, "DELETE FROM quy_tai_chinh WHERE ma_quy=?", [id]);
    }
    for (const id of bills)
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
    if (owner) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [owner]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [owner]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
    await rm(dir, { recursive: true, force: true });
  }
});
