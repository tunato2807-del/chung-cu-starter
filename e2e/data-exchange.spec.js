import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import { catalog } from "../backend/src/modules/data-exchange/catalog.js";

for (const width of [1440, 375])
  test(`BQL imports Excel and filled PDF with previews and exports complete filtered lists at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      block = `D${suffix}`,
      password = randomBytes(16).toString("hex"),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      errors = [],
      context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      }),
      page = await context.newPage();
    let user;
    page.on("pageerror", (e) => errors.push(e.message));
    async function download(label) {
      const waiting = page.waitForEvent("download");
      await page.getByRole("button", { name: label, exact: true }).click();
      const file = await waiting;
      expect(await file.failure()).toBeNull();
      return await readFile(await file.path());
    }
    async function excel(items) {
      const wb = new ExcelJS.Workbook(),
        sheet = wb.addWorksheet("Nhap");
      sheet.addRow(catalog.thiet_bi.fields.map((f) => f.key));
      items.forEach((r) =>
        sheet.addRow(catalog.thiet_bi.fields.map((f) => r[f.key] || "")),
      );
      return Buffer.from(await wb.xlsx.writeBuffer());
    }
    const asset = (n) => ({
      ma_tai_san: `E-${suffix}-${n}`,
      ten_thiet_bi: `Máy bơm Ánh ${suffix}`,
      loai: "MAY_BOM",
      vi_tri: "Tầng hầm A",
      trang_thai: "DANG_SU_DUNG",
      nhac_truoc_ngay: "7",
    });
    try {
      const u = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [`Nhập ${suffix}`, phone, await bcrypt.hash(password, 10)],
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
      for (let i = 0; i < 25; i++)
        await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
          [`00-${suffix}-${i}`, block],
        );
      await page.goto("/quan-tri/nhap-xuat?phan_he=thiet_bi");
      await expect(
        page.getByRole("heading", {
          name: "Nhập / xuất Excel và PDF",
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel("Tìm kiếm", { exact: true }).fill(suffix);
      await page
        .getByRole("button", { name: "Áp dụng bộ lọc xuất", exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`q=${suffix}`));
      await page.getByLabel("Phần dữ liệu").selectOption("can_ho");
      await expect(page.getByLabel("Tìm kiếm", { exact: true })).toHaveValue(
        "",
      );
      await page.goBack();
      await expect(page.getByLabel("Phần dữ liệu")).toHaveValue("thiet_bi");
      await expect(page.getByLabel("Tìm kiếm", { exact: true })).toHaveValue(
        suffix,
      );
      const template = await download("Tải mẫu Excel"),
        wb = new ExcelJS.Workbook();
      await wb.xlsx.load(template);
      expect(wb.getWorksheet("Nhap").rowCount).toBe(1);
      const pdfTemplate = await download("Tải mẫu PDF"),
        pdf = await PDFDocument.load(pdfTemplate);
      expect(pdf.getPageCount()).toBe(3);
      const picker = page.getByLabel(
        "Chọn tệp Excel hoặc PDF biểu mẫu (tối đa 5 MB)",
      );
      await picker.setInputFiles({
        name: "bad.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: await excel([asset("01"), { ...asset("02"), loai: "WRONG" }]),
      });
      await page
        .getByRole("button", { name: "Xem trước tệp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "2 dòng · 1 dòng lỗi" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Xác nhận nhập 2 dòng" }),
      ).toBeDisabled();
      expect(
        (
          await rows(
            pool,
            "SELECT ma_thiet_bi FROM thiet_bi WHERE ma_nguoi_tao=?",
            [user],
          )
        ).length,
      ).toBe(0);
      await picker.setInputFiles({
        name: "good.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: await excel([asset("01"), asset("02")]),
      });
      await page
        .getByRole("button", { name: "Xem trước tệp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "2 dòng · 0 dòng lỗi" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/chung-cu-data-import-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("button", { name: "Xác nhận nhập 2 dòng" }).click();
      await expect(
        page.getByRole("heading", { name: "Nhập thành công" }),
      ).toBeVisible();
      expect(
        (
          await rows(
            pool,
            "SELECT ma_thiet_bi FROM thiet_bi WHERE ma_nguoi_tao=?",
            [user],
          )
        ).length,
      ).toBe(2);
      const fields = asset("PDF");
      for (const [key, value] of Object.entries(fields))
        pdf.getForm().getTextField(`r1.${key}`).setText(value);
      await picker.setInputFiles({
        name: "filled.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(await pdf.save({ updateFieldAppearances: false })),
      });
      await page
        .getByRole("button", { name: "Xem trước tệp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "1 dòng · 0 dòng lỗi" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Xác nhận nhập 1 dòng" }).click();
      await expect(
        page.getByRole("heading", { name: "Nhập thành công" }),
      ).toBeVisible();
      expect(
        (
          await rows(
            pool,
            "SELECT ma_thiet_bi FROM thiet_bi WHERE ma_nguoi_tao=?",
            [user],
          )
        ).length,
      ).toBe(3);
      const plain = await PDFDocument.create();
      plain.addPage();
      await picker.setInputFiles({
        name: "scan.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(await plain.save()),
      });
      await page
        .getByRole("button", { name: "Xem trước tệp", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText(
        "PDF cần là biểu mẫu",
      );
      await page.getByLabel("Phần dữ liệu").selectOption("can_ho");
      await expect(
        page.getByRole("button", { name: "Xem trước tệp", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /Xác nhận nhập/ }),
      ).toHaveCount(0);
      await picker.setInputFiles({
        name: "02_cu_dan.pdf",
        mimeType: "application/pdf",
        buffer: await readFile(
          new URL("../samples/nhap-du-lieu/02_cu_dan.pdf", import.meta.url),
        ),
      });
      await page
        .getByRole("button", { name: "Xem trước tệp", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText(
        "Bạn đang chọn “Căn hộ” nhưng tệp thuộc phần “Cư dân”",
      );
      await expect(page.getByRole("alert")).not.toContainText("scan");
      await expect(page.getByLabel("Phần dữ liệu")).toHaveValue("can_ho");
      await page.goto(`/quan-tri/can-ho?q=${block}&page=2`);
      await expect(
        page.getByRole("button", { name: "Xuất Excel", exact: true }),
      ).toBeEnabled();
      const report = await download("Xuất Excel"),
        result = new ExcelJS.Workbook();
      await result.xlsx.load(report);
      expect(result.getWorksheet("Chi tiết").rowCount).toBe(26);
      const exportedPDF = await download("Xuất PDF");
      expect(exportedPDF.subarray(0, 5).toString()).toBe("%PDF-");
      await expect(
        page.getByRole("link", { name: "Nhập Excel / PDF", exact: true }),
      ).toHaveAttribute("href", "/quan-tri/nhap-xuat?phan_he=can_ho");
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (user) {
        await rows(pool, "DELETE FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=?", [
          user,
        ]);
        await rows(pool, "DELETE FROM thiet_bi WHERE ma_nguoi_tao=?", [user]);
        await rows(pool, "DELETE FROM can_ho WHERE khoi=?", [block]);
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          user,
        ]);
      }
    }
  });
