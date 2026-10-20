import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`batch preview → missing data → source change → lost response → retry at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      page = await context.newPage(),
      apartments = [],
      prices = [],
      errors = [];
    let admin;
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Lô ${suffix}`, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
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
      // The project's UUID helper must also work when native randomUUID is unavailable on LAN HTTP.
      await context.addInitScript(() =>
        Object.defineProperty(crypto, "randomUUID", {
          value: undefined,
          configurable: true,
        }),
      );
      for (let n = 0; n < 2; n++)
        apartments.push(
          (
            await rows(
              pool,
              "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
              [`BL-${suffix}-${n}`, `BL${suffix}`],
            )
          ).insertId,
        );
      for (const [type, price] of [
        ["PHI_QUAN_LY", "13000"],
        ["TIEN_NUOC", "15000"],
      ])
        prices.push(
          (
            await rows(
              pool,
              "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,den_ngay,ma_nguoi_tao) VALUES (?,?,'1903-04-01','1903-05-01',?)",
              [type, price, admin],
            )
          ).insertId,
        );
      async function meter(id) {
        await rows(
          pool,
          "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ma_nguoi_ghi) VALUES (?,'NUOC','1903-04',0,5,'1903-04-30',?)",
          [id, admin],
        );
      }
      async function count() {
        return (
          await rows(
            pool,
            "SELECT COUNT(*) AS n FROM hoa_don WHERE ma_nguoi_lap=?",
            [admin],
          )
        )[0].n;
      }
      await meter(apartments[0]);
      await page.goto("/quan-tri/hoa-don");
      await page
        .getByRole("button", { name: "Lập hàng loạt", exact: true })
        .click();
      const batch = page.locator(".batch-bills");
      await batch.getByLabel("Kỳ lập hàng loạt").fill("1903-04");
      await batch.getByLabel("Ngày chốt hàng loạt").fill("1903-04-30");
      await batch.getByLabel("Tiền điện", { exact: true }).uncheck();
      await batch.getByLabel("Phí gửi xe", { exact: true }).uncheck();
      await batch.getByLabel("Tìm căn cho đợt hóa đơn").fill(`BL-${suffix}`);
      await batch
        .getByRole("button", { name: "Chọn các căn trên trang", exact: true })
        .click();
      await expect(batch.locator(".batch-selection")).toContainText(
        "Đã chọn 2/50 căn",
      );
      const previewButton = batch.getByRole("button", {
        name: "Xem trước đợt hóa đơn",
        exact: true,
      });
      await previewButton.click();
      await expect(batch.locator(".batch-preview")).toContainText("1 căn lỗi");
      await expect(batch.locator(".batch-preview")).toContainText(
        "Thiếu chỉ số NUOC",
      );
      expect(await count()).toBe(0);
      await expect(
        batch.getByRole("button", { name: /^Xác nhận tạo/ }),
      ).toHaveCount(0);
      await batch
        .getByRole("button", { name: "Chỉ giữ căn hợp lệ", exact: true })
        .click();
      await expect(batch.locator(".batch-selection")).toContainText(
        "Đã chọn 1/50 căn",
      );
      await batch
        .getByRole("checkbox", { name: new RegExp(`^BL-${suffix}-1`) })
        .check();
      await meter(apartments[1]);
      await previewButton.click();
      await expect(batch.locator(".batch-preview")).toContainText("0 căn lỗi");
      await batch.getByRole("checkbox", { name: /^Tôi đã kiểm tra/ }).check();
      await rows(pool, "UPDATE can_ho SET dien_tich_m2=61 WHERE ma_can_ho=?", [
        apartments[0],
      ]);
      await batch
        .getByRole("button", { name: "Xác nhận tạo 2 bản nháp", exact: true })
        .click();
      await expect(batch.getByRole("alert")).toContainText(
        "Chưa tạo hóa đơn nào",
      );
      expect(await count()).toBe(0);
      await previewButton.click();
      await expect(batch.locator(".batch-preview")).toContainText("0 căn lỗi");
      await batch.getByRole("checkbox", { name: /^Tôi đã kiểm tra/ }).check();
      let intercepted = false;
      const keys = [];
      await page.route("**/api/hoa_don/hang_loat/xac_nhan", async (route) => {
        keys.push(route.request().postDataJSON().khoa_yeu_cau);
        if (!intercepted) {
          intercepted = true;
          const response = await route.fetch();
          expect(response.status()).toBe(201);
          await route.abort("failed");
        } else await route.continue();
      });
      await batch
        .getByRole("button", { name: "Xác nhận tạo 2 bản nháp", exact: true })
        .click();
      await expect(batch.getByRole("alert")).toContainText(
        "Không kết nối được máy chủ",
      );
      expect(await count()).toBe(2);
      await batch
        .getByRole("button", { name: "Xác nhận tạo 2 bản nháp", exact: true })
        .click();
      await expect(batch.locator(".batch-result")).toContainText(
        "Đợt này đã được tạo trước đó",
      );
      await expect(batch.locator(".batch-result a")).toHaveCount(2);
      expect(keys).toHaveLength(2);
      expect(keys[0]).toBe(keys[1]);
      expect(await count()).toBe(2);
      const records = await rows(
        pool,
        "SELECT trang_thai FROM hoa_don WHERE ma_nguoi_lap=?",
        [admin],
      );
      expect(records.map((r) => r.trang_thai)).toEqual(["NHAP", "NHAP"]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await batch.screenshot({ path: `/tmp/chung-cu-batch-${width}.png` });
      await batch.locator(".batch-result a").first().click();
      await expect(
        page.getByRole("button", { name: "Duyệt hóa đơn", exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (admin) {
        await rows(
          pool,
          "DELETE d FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE h.ma_nguoi_lap=?",
          [admin],
        );
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_nguoi_ghi=?", [
          admin,
        ]);
        await rows(pool, "DELETE FROM dot_lap_hoa_don WHERE ma_nguoi_lap=?", [
          admin,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_nguoi_lap=?", [admin]);
      }
      for (const id of apartments) {
        await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [id]);
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      }
      for (const id of prices)
        await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
          id,
        ]);
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });
