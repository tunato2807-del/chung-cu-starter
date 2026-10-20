import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`fund → receipt → expense/proofs → posting → reversal → monthly ledger at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      name = `Quỹ riêng ${suffix}`,
      errors = [];
    let user, fund, receipt, expense;
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    async function saved(path, method, click) {
      const waiting = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === path && r.request().method() === method,
      );
      await click();
      const r = await waiting;
      expect(r.status()).toBeLessThan(300);
      return (await r.json()).data;
    }
    async function newDraft(type, sum, description) {
      await page.goto(`/quan-tri/quy/${fund}`);
      await page
        .getByRole("link", { name: "Lập phiếu thu / chi", exact: true })
        .click();
      await page.getByLabel("Loại phiếu", { exact: true }).selectOption(type);
      await page.getByLabel("Số tiền (đồng)").fill(sum);
      await page
        .getByLabel("Người nộp / người nhận")
        .fill("Ban quản lý thử nghiệm");
      await page.getByLabel("Diễn giải thu / chi").fill(description);
      const p = await saved("/api/phieu_thu_chi", "POST", () =>
        page
          .getByRole("button", { name: "Lưu phiếu nháp", exact: true })
          .click(),
      );
      await expect(page.getByText("Bản nháp", { exact: true })).toBeVisible();
      return p.ma_phieu;
    }
    async function post(id) {
      await page
        .getByLabel("Ghi chú duyệt phiếu")
        .fill("Đã kiểm tra số tiền và chứng từ.");
      await saved(`/api/phieu_thu_chi/${id}/duyet`, "POST", () =>
        page
          .getByRole("button", {
            name: "Xác nhận duyệt và ghi sổ",
            exact: true,
          })
          .click(),
      );
      await expect(page.getByText("Đã ghi sổ", { exact: true })).toBeVisible();
    }
    try {
      const u = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`BQL quỹ ${suffix}`, phone, hash, "QUAN_TRI_VIEN"],
      );
      user = u.insertId;
      const { token } = await login({
        so_dien_thoai: phone,
        mat_khau: password,
      });
      await context.addCookies([
        {
          name: "session",
          value: token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      await page.goto("/quan-tri/quy");
      await page.getByRole("button", { name: "Tạo quỹ", exact: true }).click();
      await page.getByLabel("Tên quỹ", { exact: true }).fill(name);
      await page
        .getByLabel("Mô tả quỹ")
        .fill("Theo dõi thu chi và chứng từ riêng.");
      fund = (
        await saved("/api/quy", "POST", () =>
          page.getByRole("button", { name: "Lưu quỹ", exact: true }).click(),
        )
      ).ma_quy;
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      receipt = await newDraft("THU", "1000000", "Bổ sung quỹ ban đầu");
      await post(receipt);
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page.getByLabel("Tổng hợp số dư")).toContainText(
        "1.000.000 đ",
      );
      expense = await newDraft(
        "CHI",
        "250000",
        "Sửa thiết bị cộng đồng\n<script>window.treasuryInjected=true</script>",
      );
      const blocked = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api/phieu_thu_chi/${expense}/duyet` &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Xác nhận duyệt và ghi sổ", exact: true })
        .click();
      expect((await blocked).status()).toBe(422);
      await expect(page.getByRole("alert")).toContainText(
        "cần ít nhất một chứng từ",
      );
      await page.getByLabel("Chọn chứng từ ảnh hoặc PDF").setInputFiles([
        {
          name: "hoa-don.png",
          mimeType: "image/png",
          buffer: await sharp({
            create: {
              width: 40,
              height: 40,
              channels: 3,
              background: "#77aa88",
            },
          })
            .png()
            .toBuffer(),
        },
        {
          name: "bien-lai.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\nReceipt fixture\n%%EOF\n"),
        },
      ]);
      await expect(
        page.getByRole("status").filter({ hasText: "Đã chọn 2 tệp" }),
      ).toBeVisible();
      await saved(`/api/phieu_thu_chi/${expense}/chung_tu`, "POST", () =>
        page
          .getByRole("button", { name: "Tải chứng từ lên", exact: true })
          .click(),
      );
      await expect(
        page.getByRole("link", { name: "hoa-don.jpg", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "bien-lai.pdf", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await post(expense);
      expect(
        await page.evaluate(() => window.treasuryInjected),
      ).toBeUndefined();
      await expect(
        page.getByRole("button", { name: "Sửa phiếu nháp", exact: true }),
      ).toHaveCount(0);
      await page.screenshot({
        path: `/tmp/chung-cu-treasury-voucher-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page.getByLabel("Tổng hợp số dư")).toContainText(
        "750.000 đ",
      );
      await page.getByLabel("Cách xem sổ quỹ").selectOption("THEO_THANG");
      await page
        .getByRole("button", { name: "Lọc sổ quỹ", exact: true })
        .click();
      await expect(
        page.getByRole("columnheader", { name: "Chênh lệch", exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("Nguồn ghi sổ")).toBeDisabled();
      await page.screenshot({
        path: `/tmp/chung-cu-treasury-ledger-${width}.png`,
        fullPage: true,
      });
      await page.goto(`/quan-tri/phieu-thu-chi/${expense}`);
      await page
        .getByLabel("Lý do đảo phiếu")
        .fill("Nhà cung cấp hoàn trả khoản chi.");
      const reversed = await saved(
        `/api/phieu_thu_chi/${expense}/dao`,
        "POST",
        () =>
          page
            .getByRole("button", { name: "Lập phiếu đảo", exact: true })
            .click(),
      );
      await expect(
        page.getByText("Đây là phiếu đảo của", { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Lập phiếu đảo", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("link", { name: "phiếu gốc", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("link", { name: "phiếu đảo", exact: true }),
      ).toBeVisible();
      expect(
        (
          await rows(
            pool,
            "SELECT ma_phieu_goc FROM phieu_thu_chi WHERE ma_phieu=?",
            [reversed.ma_phieu],
          )
        )[0].ma_phieu_goc,
      ).toBe(expense);
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page.getByLabel("Tổng hợp số dư")).toContainText(
        "1.000.000 đ",
      );
      // A fresh draft can be edited and canceled without changing the posted balance.
      const draft = await newDraft("THU", "30000", "Khoản nháp cần kiểm tra");
      await page
        .getByRole("button", { name: "Sửa phiếu nháp", exact: true })
        .click();
      await page.getByLabel("Số tiền (đồng)").fill("40000");
      await saved(`/api/phieu_thu_chi/${draft}`, "PUT", () =>
        page
          .getByRole("button", { name: "Lưu phiếu nháp", exact: true })
          .click(),
      );
      await expect(
        page.getByText("40.000 đ", { exact: true }).first(),
      ).toBeVisible();
      await page
        .getByLabel("Lý do hủy phiếu")
        .fill("Không phát sinh khoản thu thực tế.");
      await saved(`/api/phieu_thu_chi/${draft}/huy`, "POST", () =>
        page
          .getByRole("button", { name: "Xác nhận hủy nháp", exact: true })
          .click(),
      );
      await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      const found = await rows(
        pool,
        "SELECT ma_quy FROM quy_tai_chinh WHERE ten_quy=?",
        [name],
      );
      for (const { ma_quy: id } of found) {
        await rows(
          pool,
          "DELETE FROM phieu_thu_chi WHERE ma_quy=? AND ma_phieu_goc IS NOT NULL",
          [id],
        );
        await rows(pool, "DELETE FROM phieu_thu_chi WHERE ma_quy=?", [id]);
        await rows(pool, "DELETE FROM quy_tai_chinh WHERE ma_quy=?", [id]);
      }
      if (user)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          user,
        ]);
    }
  });
