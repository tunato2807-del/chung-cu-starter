import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import {
  generate,
  action,
} from "../backend/src/modules/billing/billing.service.js";

for (const width of [1440, 375])
  test(`bulk approve → stale source → review bank → lost publish response → resident QR at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      users = [],
      apartments = [],
      bills = [],
      errors = [];
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      residentContext = await browser.newContext(),
      page = await context.newPage(),
      residentPage = await residentContext.newPage();
    let rate, profile, stay;
    for (const p of [page, residentPage])
      p.on("pageerror", (error) => errors.push(error.message));
    try {
      for (const [n, role] of ["QUAN_TRI_VIEN", "CU_DAN"].entries()) {
        const phone =
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
        users.push(
          (
            await rows(
              pool,
              "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
              [suffix, phone, hash, role],
            )
          ).insertId,
        );
        await [context, residentContext][n].addCookies([
          {
            name: "session",
            value: (await login({ so_dien_thoai: phone, mat_khau: password }))
              .token,
            url: "http://127.0.0.1:5174",
            httpOnly: true,
            sameSite: "Strict",
          },
        ]);
      }
      await context.addInitScript(() =>
        Object.defineProperty(crypto, "randomUUID", {
          value: undefined,
          configurable: true,
        }),
      );
      rate = (
        await rows(
          pool,
          "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,den_ngay,ma_nguoi_tao) VALUES ('PHI_QUAN_LY',15000,'1905-06-01','1905-07-01',?)",
          [users[0]],
        )
      ).insertId;
      for (let n = 0; n < 2; n++) {
        apartments.push(
          (
            await rows(
              pool,
              "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
              [`BA-${suffix}-${n}`, `BA${suffix}`],
            )
          ).insertId,
        );
        bills.push(
          (
            await generate(
              {
                ma_can_ho: apartments[n],
                ky_thanh_toan: "1905-06",
                ngay_chot_phi: "1905-06-30",
                tinh_nuoc: false,
                tinh_dien: false,
                tinh_xe: false,
              },
              { ma_nguoi_dung: users[0] },
            )
          ).ma_hoa_don,
        );
      }
      profile = (
        await rows(
          pool,
          "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES ('Cư dân duyệt gửi','0901234567',?)",
          [users[1]],
        )
      ).insertId;
      stay = (
        await rows(
          pool,
          "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'CHU_HO','1900-01-01',?)",
          [profile, apartments[0], users[0]],
        )
      ).insertId;
      await page.goto("/quan-tri/hoa-don");
      await page
        .getByRole("button", { name: "Duyệt/gửi hàng loạt", exact: true })
        .click();
      const panel = page.locator(".batch-actions");
      await panel.getByLabel("Kỳ hóa đơn cần xử lý").fill("1905-06");
      await panel.getByLabel("Tìm hóa đơn để xử lý").fill(`BA-${suffix}`);
      const selectAll = panel.getByRole("button", {
          name: "Chọn hóa đơn trên trang",
          exact: true,
        }),
        preview = panel.getByRole("button", {
          name: "Xem trước thao tác",
          exact: true,
        });
      await selectAll.click();
      await expect(panel.locator(".batch-selection")).toContainText(
        "Đã chọn 2/50 hóa đơn",
      );
      await preview.click();
      await expect(panel.locator(".batch-preview")).toContainText(
        "0 hóa đơn lỗi",
      );
      await panel.getByRole("checkbox", { name: /^Tôi đã kiểm tra/ }).check();
      await rows(pool, "UPDATE can_ho SET dien_tich_m2=61 WHERE ma_can_ho=?", [
        apartments[0],
      ]);
      await panel
        .getByRole("button", { name: "Xác nhận duyệt 2 hóa đơn", exact: true })
        .click();
      await expect(panel.getByRole("alert")).toContainText(
        "Chưa xử lý hóa đơn nào",
      );
      const initial = await rows(
        pool,
        "SELECT trang_thai FROM hoa_don WHERE ma_nguoi_lap=?",
        [users[0]],
      );
      expect(initial.map((b) => b.trang_thai)).toEqual(["NHAP", "NHAP"]);
      await action(
        bills[0],
        "tinh_lai",
        { phien_ban: 0 },
        { ma_nguoi_dung: users[0] },
      );
      await panel
        .getByRole("button", { name: "Tải lại và chọn lại", exact: true })
        .click();
      await selectAll.click();
      await preview.click();
      await expect(panel.locator(".batch-preview")).toContainText(
        "0 hóa đơn lỗi",
      );
      await panel.getByRole("checkbox", { name: /^Tôi đã kiểm tra/ }).check();
      await panel
        .getByRole("button", { name: "Xác nhận duyệt 2 hóa đơn", exact: true })
        .click();
      await expect(panel.locator(".batch-result")).toContainText(
        "Đã duyệt 2 hóa đơn",
      );
      expect(
        (
          await residentContext.request.get(
            `http://127.0.0.1:5174/api/cua_toi/hoa_don/${bills[0]}`,
          )
        ).status(),
      ).toBe(404);
      await panel
        .getByRole("button", {
          name: "Chuyển sang chọn hóa đơn để gửi",
          exact: true,
        })
        .click();
      await expect(panel.getByLabel("Thao tác hàng loạt")).toHaveValue("GUI");
      await expect(panel.locator(".batch-selection")).toContainText(
        "Đã chọn 0/50 hóa đơn",
      );
      await panel.getByLabel("Tìm ngân hàng nhận chung").fill("Vietcombank");
      await panel
        .getByLabel("Ngân hàng nhận chung", { exact: true })
        .selectOption("970436");
      await panel.getByLabel("Số tài khoản nhận chung").fill("1234567890");
      await panel.getByLabel("Tên người nhận chung").fill("BAN QUAN LY");
      await selectAll.click();
      await preview.click();
      await expect(panel.locator(".bill-actions-summary")).toContainText(
        "1234567890",
      );
      await panel.getByLabel("Số tài khoản nhận chung").fill("1234567899");
      await expect(panel.locator(".batch-preview")).toHaveCount(0);
      await panel.getByLabel("Số tài khoản nhận chung").fill("1234567890");
      await preview.click();
      await expect(panel.locator(".batch-preview")).toContainText(
        "0 hóa đơn lỗi",
      );
      await panel.getByRole("checkbox", { name: /^Tôi đã kiểm tra/ }).check();
      let intercepted = false;
      const keys = [];
      await page.route(
        "**/api/hoa_don/xu_ly_hang_loat/xac_nhan",
        async (route) => {
          keys.push(route.request().postDataJSON().khoa_yeu_cau);
          if (!intercepted) {
            intercepted = true;
            const response = await route.fetch();
            expect(response.status()).toBe(200);
            await route.abort("failed");
          } else await route.continue();
        },
      );
      await panel
        .getByRole("button", { name: "Xác nhận gửi 2 hóa đơn", exact: true })
        .click();
      await expect(panel.getByRole("alert")).toContainText(
        "Không kết nối được máy chủ",
      );
      await panel
        .getByRole("button", { name: "Xác nhận gửi 2 hóa đơn", exact: true })
        .click();
      await expect(panel.locator(".batch-result")).toContainText(
        "Đợt này đã được xử lý trước đó",
      );
      await expect(panel.locator(".batch-result a")).toHaveCount(2);
      expect(keys).toHaveLength(2);
      expect(keys[0]).toBe(keys[1]);
      const state = await rows(
        pool,
        "SELECT trang_thai,ma_ngan_hang,so_tai_khoan FROM hoa_don WHERE ma_nguoi_lap=?",
        [users[0]],
      );
      for (const b of state)
        expect(b).toEqual({
          trang_thai: "DA_GUI",
          ma_ngan_hang: "970436",
          so_tai_khoan: "1234567890",
        });
      const audit = await rows(
        pool,
        "SELECT su_kien,COUNT(*) AS n FROM lich_su_hoa_don WHERE ma_nguoi_ghi=? AND su_kien IN ('DUYET','GUI') GROUP BY su_kien ORDER BY su_kien",
        [users[0]],
      );
      expect(audit).toEqual([
        { su_kien: "DUYET", n: 2 },
        { su_kien: "GUI", n: 2 },
      ]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await panel.screenshot({
        path: `/tmp/chung-cu-bill-actions-${width}.png`,
      });
      await residentPage.goto(`/cu-dan/hoa-don/${bills[0]}`);
      await expect(
        residentPage.getByRole("img", { name: /VietQR hóa đơn/ }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      await residentContext.close();
      if (stay)
        await rows(
          pool,
          "DELETE FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?",
          [stay],
        );
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
    }
  });
