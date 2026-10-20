import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import { today } from "../backend/src/modules/billing/billing.validation.js";

for (const width of [1440, 375])
  test(`operations dashboard: exact totals, links, refresh, empty/error states at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      context = await browser.newContext({ viewport: { width, height: 1000 } }),
      page = await context.newPage(),
      errors = [];
    let user, apartment, first;
    page.on("pageerror", (e) => errors.push(e.message));
    async function loaded(action) {
      const wait = page.waitForResponse(
        (r) => new URL(r.url()).pathname === "/api/tong_quan",
      );
      await action();
      const response = await wait;
      expect(response.status()).toBe(200);
      const result = (await response.json()).data;
      await expect(
        page.getByRole("button", { name: "Cập nhật số liệu", exact: true }),
      ).toBeEnabled();
      return result;
    }
    const debt = () =>
      page
        .locator(".overview-metric")
        .filter({ has: page.getByText("Còn phải thu", { exact: true }) });
    const money = (v) => `${BigInt(v).toLocaleString("vi-VN")} đ`;
    try {
      user = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Tổng quan ${suffix}`, phone, await bcrypt.hash(password, 10)],
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
      apartment = (
        await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
          [`D-${suffix}`, `D${suffix}`],
        )
      ).insertId;
      for (let n = 0; n < 12; n++) {
        const month = new Date(Date.UTC(2020, n, 1)).toISOString().slice(0, 7);
        const r = await rows(
          pool,
          "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan) VALUES (?,?,?, ?,1,0,0,0,'99999999999900','[]',?,?,'DA_GUI',?)",
          [
            `DB-${suffix}-${n}`,
            apartment,
            month,
            `${month}-01`,
            "a".repeat(64),
            user,
            today(),
          ],
        );
        first ||= r.insertId;
      }
      let current = await loaded(() => page.goto("/quan-tri"));
      await expect(
        page.getByRole("heading", { name: "Tổng quan vận hành", exact: true }),
      ).toBeVisible();
      await expect(debt().locator("strong")).toHaveText(
        money(current.tai_chinh.con_phai_thu),
      );
      expect(BigInt(current.tai_chinh.con_phai_thu)).toBeGreaterThan(
        999999999999999n,
      );
      for (const title of [
        "Công nợ cần theo dõi",
        "Phản ánh cần xử lý",
        "Bảo trì thiết bị",
        "Đặt lịch tiện ích",
      ])
        await expect(
          page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
      const charts = page.locator(".trends");
      await expect(charts.locator(".trend-card")).toHaveCount(4);
      const financeChart = charts.locator(".trend-card").filter({
        has: page.getByRole("heading", {
          name: "Thu phí và hạn công nợ",
          exact: true,
        }),
      });
      async function chartLoaded(action) {
        const response = page.waitForResponse(
          (r) => new URL(r.url()).pathname === "/api/tong_quan/thong_ke",
        );
        await action();
        const r = await response;
        expect(r.status()).toBe(200);
        await expect(
          charts.getByRole("button", { name: "Cập nhật biểu đồ", exact: true }),
        ).toBeEnabled();
        return (await r.json()).data;
      }
      for (const [period, count] of [
        ["NGAY", 24],
        ["TUAN", 7],
        [
          "THANG",
          new Date(
            Date.UTC(
              Number(today().slice(0, 4)),
              Number(today().slice(5, 7)),
              0,
            ),
          ).getUTCDate(),
        ],
        ["QUY", 3],
        ["NAM", 12],
      ]) {
        const result = await chartLoaded(() =>
          charts
            .getByLabel("Khoảng thống kê", { exact: true })
            .selectOption(period),
        );
        expect(result.diem).toHaveLength(count);
        await expect(financeChart.locator('svg g[role="button"]')).toHaveCount(
          count,
        );
        await expect(financeChart.locator(".trend-totals")).toContainText(
          money(result.tong.con_no),
        );
      }
      const columns = financeChart.locator('svg g[role="button"]');
      await columns.nth(1).focus();
      await page.keyboard.press("ArrowRight");
      await expect(columns.nth(2)).toBeFocused();
      await expect(financeChart.locator(".trend-detail > strong")).toHaveText(
        `Tháng 03/${today().slice(0, 4)}`,
      );
      await financeChart.locator("summary").click();
      await expect(financeChart.locator("tbody tr")).toHaveCount(12);
      await financeChart.locator("summary").click();
      await expect(
        page
          .locator(".overview-metric")
          .filter({ hasText: "Phản ánh đang mở" }),
      ).toHaveAttribute("href", "/quan-tri/phan-anh?trang_thai=DANG_MO");
      await expect(
        page.getByRole("link", { name: "Lượt chờ duyệt", exact: false }),
      ).toHaveAttribute("href", "/quan-tri/dat-lich?trang_thai=CHO_DUYET");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/chung-cu-dashboard-${width}.png`,
        fullPage: true,
      });
      await debt().click();
      await expect(page).toHaveURL(/che_do=HOA_DON/);
      current = await loaded(() => page.goto("/quan-tri"));
      await chartLoaded(() =>
        charts
          .getByLabel("Khoảng thống kê", { exact: true })
          .selectOption("NAM"),
      );
      await rows(
        pool,
        "UPDATE hoa_don SET tong_tien=tong_tien+1 WHERE ma_hoa_don=?",
        [first],
      );
      const updated = await loaded(() =>
        page
          .getByRole("button", { name: "Cập nhật số liệu", exact: true })
          .click(),
      );
      expect(BigInt(updated.tai_chinh.con_phai_thu)).toBe(
        BigInt(current.tai_chinh.con_phai_thu) + 1n,
      );
      await expect(debt().locator("strong")).toHaveText(
        money(updated.tai_chinh.con_phai_thu),
      );
      await expect(
        charts.getByLabel("Khoảng thống kê", { exact: true }),
      ).toHaveValue("NAM");
      await expect(charts.locator(".trend-card")).toHaveCount(4);
      const noData = await chartLoaded(() =>
        charts.getByLabel("Ngày trong kỳ", { exact: true }).fill("1901-01-01"),
      );
      expect(noData.tong.da_thu).toBe("0");
      await expect(charts.locator(".trend-empty")).toHaveCount(4);
      const chartFailure = async (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Không tải được biểu đồ. Hãy thử lại.",
            },
          }),
        });
      await page.route("**/api/tong_quan/thong_ke?*", chartFailure);
      await charts
        .getByRole("button", { name: "Cập nhật biểu đồ", exact: true })
        .click();
      await expect(charts.getByRole("alert")).toContainText(
        "Không tải được biểu đồ",
      );
      await expect(charts.locator(".trend-card")).toHaveCount(0);
      await page.unroute("**/api/tong_quan/thong_ke?*", chartFailure);
      await chartLoaded(() =>
        charts
          .getByRole("button", { name: "Về kỳ hiện tại", exact: true })
          .click(),
      );
      await expect(
        charts.getByLabel("Ngày trong kỳ", { exact: true }),
      ).toHaveValue(today());
      const failure = async (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Không tải được tổng quan. Hãy thử lại.",
            },
          }),
        });
      await page.route("**/api/tong_quan", failure);
      await page
        .getByRole("button", { name: "Cập nhật số liệu", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText(
        "Không tải được tổng quan",
      );
      await expect(page.locator(".overview-metrics")).toHaveCount(0);
      await page.unroute("**/api/tong_quan", failure);
      const empty = structuredClone(updated);
      for (const module of ["tai_chinh", "phan_anh", "bao_tri", "tien_ich"])
        for (const key of Object.keys(empty[module]))
          empty[module][key] = Array.isArray(empty[module][key])
            ? []
            : typeof empty[module][key] === "string"
              ? "0"
              : 0;
      await page.route("**/api/tong_quan", (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data: empty }),
        }),
      );
      await loaded(() =>
        page
          .getByRole("button", { name: "Cập nhật số liệu", exact: true })
          .click(),
      );
      await expect(debt().locator("strong")).toHaveText("0 đ");
      await expect(
        page.getByText("Không có phản ánh đang mở.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Không có phiếu bảo trì đang mở.", { exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (apartment) {
        await rows(pool, "DELETE FROM hoa_don WHERE ma_can_ho=?", [apartment]);
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartment]);
      }
      if (user)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          user,
        ]);
    }
  });
