import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import parsePdf from "pdf-parse/lib/pdf-parse.js";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import { today } from "../backend/src/modules/billing/billing.validation.js";

for (const width of [1440, 375])
  test(`download filtered Excel/PDF for debts, receipts and treasury across pages at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      block = `E${suffix}`,
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      apts = [],
      bills = [],
      errors = [],
      d = today(),
      month = d.slice(0, 7),
      prior = new Date(new Date(`${month}-01T00:00:00Z`).getTime() - 86400000)
        .toISOString()
        .slice(0, 7);
    let user, fund;
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    async function download(name) {
      const waiting = page.waitForEvent("download");
      await page.getByRole("button", { name, exact: true }).click();
      const file = await waiting;
      expect(await file.failure()).toBeNull();
      return { file, buffer: await readFile(await file.path()) };
    }
    async function xlsx(name = "Xuất Excel") {
      const r = await download(name),
        wb = new ExcelJS.Workbook();
      await wb.xlsx.load(r.buffer);
      return { ...r, wb, data: wb.getWorksheet("Chi tiết") };
    }
    async function pdf() {
      const r = await download("Xuất PDF");
      expect(r.buffer.subarray(0, 5).toString()).toBe("%PDF-");
      return {
        ...r,
        text: (await parsePdf(r.buffer)).text,
      };
    }
    try {
      const u = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [`Nguyễn Thị Ánh ${suffix}`, phone, hash],
      );
      user = u.insertId;
      await context.addCookies([
        {
          name: "session",
          value: (await login({ so_dien_thoai: phone, mat_khau: password }))
            .token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      const f = await rows(
        pool,
        "INSERT INTO quy_tai_chinh (ten_quy,mo_ta) VALUES (?,?)",
        [`Quỹ xuất ${suffix}`, "Báo cáo tải xuống"],
      );
      fund = f.insertId;
      for (let i = 0; i < 25; i++) {
        const a = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
          [`00-${suffix}-${i}`, block],
        );
        apts.push(a.insertId);
        for (const paid of [false, true]) {
          const p = paid ? prior : month,
            sum = paid ? "200000" : "100000",
            r = await rows(
              pool,
              "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan,ngay_thanh_toan,so_tien_da_thu,ma_tham_chieu,ma_nguoi_xac_nhan) VALUES (?,?,?, ?,1,0,0,0,?,'[]',?,?,?,?,?,?,?,?)",
              [
                `E-${suffix}-${i}-${paid ? "P" : "U"}`,
                a.insertId,
                p,
                p + "-01",
                sum,
                "a".repeat(64),
                user,
                paid ? "DA_THANH_TOAN" : "DA_GUI",
                d,
                paid
                  ? new Date().toISOString().slice(0, 19).replace("T", " ")
                  : null,
                paid ? sum : "0",
                paid ? `000-${suffix}-${i}` : null,
                paid ? user : null,
              ],
            );
          bills.push(r.insertId);
        }
        await rows(
          pool,
          "INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,khoa_yeu_cau,van_tay) VALUES (?,'THU','THU_KHAC',?,1000,?,?,'DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?,?)",
          [
            fund,
            d,
            "Nguyễn Thị Ánh",
            `Thu ${suffix} ${i}`,
            user,
            user,
            randomUUID(),
            "b".repeat(64),
          ],
        );
      }
      await page.goto(`/quan-tri/bao-cao-tai-chinh?khoi=${block}`);
      await expect(
        page.getByRole("button", { name: "Xuất Excel", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Trang sau", exact: true })
        .click();
      await expect(
        page.getByText("Trang 2 · 25 bản ghi", { exact: true }),
      ).toBeVisible();
      const debt = await xlsx();
      expect(debt.file.suggestedFilename()).toMatch(
        /^cong-no-can-ho-.*\.xlsx$/,
      );
      expect(debt.data.rowCount).toBe(26);
      await expect(
        page.getByRole("status").filter({ hasText: "25 dòng" }),
      ).toBeVisible();
      const debtPdf = await pdf();
      expect(debtPdf.text).toContain("Báo cáo công nợ");
      expect(debtPdf.text).toContain("25 dòng chi tiết");
      expect(debtPdf.text).toContain(block);
      await page
        .getByRole("button", {
          name: "Thu phí theo ngày xác nhận",
          exact: true,
        })
        .click();
      // Chờ chuyển loại báo cáo hoàn tất, thay vì thấy nút xuất của báo cáo
      // cũ còn bật trong khoảng chuyển trang rồi bấm vào yêu cầu bị hủy.
      await expect(page).toHaveURL(/[?&]bao_cao=THU_PHI(?:&|$)/);
      await expect(
        page.getByRole("button", { name: "Xuất Excel", exact: true }),
      ).toBeEnabled();
      const receipt = await xlsx();
      expect(receipt.data.rowCount).toBe(26);
      expect(receipt.data.getCell("F2").value).toMatch(/^000-/);
      const paidPdf = await pdf();
      expect(paidPdf.text).toContain("Báo cáo thu phí");
      expect(paidPdf.text).toContain("Nguyễn Thị Ánh");
      await page.goto(`/quan-tri/quy/${fund}?page=2`);
      await expect(
        page.getByText("Trang 2 · 25 bản ghi", { exact: true }),
      ).toBeVisible();
      const ledger = await xlsx();
      expect(ledger.data.rowCount).toBe(26);
      const cashPdf = await pdf();
      expect(cashPdf.text).toContain("Quỹ xuất");
      expect(cashPdf.text).toContain("25.000");
      await page.screenshot({
        path: `/tmp/chung-cu-export-controls-${width}.png`,
        fullPage: true,
      });
      if (width === 1440)
        await writeFile("/tmp/chung-cu-export-browser.pdf", cashPdf.buffer);
      await page.getByLabel("Cách xem sổ quỹ").selectOption("THEO_THANG");
      await page
        .getByRole("button", { name: "Lọc sổ quỹ", exact: true })
        .click();
      await expect(
        page.getByRole("columnheader", { name: "Chênh lệch", exact: true }),
      ).toBeVisible();
      expect((await xlsx()).data.rowCount).toBe(2);
      // An export error is presented in place and does not replace the report or its filters.
      await page.route("**/api/quy/*/so_quy/xuat*", (route) =>
        route.fulfill({
          status: 422,
          json: {
            error: {
              code: "EXPORT_TOO_LARGE",
              message:
                "Báo cáo vượt giới hạn PDF. Hãy thu hẹp bộ lọc hoặc chọn Excel.",
            },
          },
        }),
      );
      await page.getByRole("button", { name: "Xuất PDF", exact: true }).click();
      await expect(page.getByRole("alert")).toContainText("vượt giới hạn PDF");
      await expect(
        page.getByRole("heading", { name: `Quỹ xuất ${suffix}`, exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("Cách xem sổ quỹ")).toHaveValue(
        "THEO_THANG",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (fund) {
        await rows(pool, "DELETE FROM phieu_thu_chi WHERE ma_quy=?", [fund]);
        await rows(pool, "DELETE FROM quy_tai_chinh WHERE ma_quy=?", [fund]);
      }
      for (const id of bills)
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
      for (const id of apts)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      if (user)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          user,
        ]);
    }
  });
