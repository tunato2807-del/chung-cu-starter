import { test, expect } from "@playwright/test";
import { publicCatalog } from "../backend/src/modules/data-exchange/catalog.js";

for (const width of [320, 768, 1024, 1440]) {
  test(`header and BQL menu stay aligned while scrolling at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(
      (url) => url.pathname.startsWith("/api/"),
      (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/api/xac_thuc/toi")
          return route.fulfill({
            json: {
              data: {
                ma_nguoi_dung: 1,
                vai_tro: "QUAN_TRI_VIEN",
                ho_va_ten: "Ban quản lý",
              },
            },
          });
        if (path === "/api/trao_doi_du_lieu")
          return route.fulfill({ json: { data: publicCatalog() } });
        if (path === "/api/trao_doi_du_lieu/lich_su")
          return route.fulfill({ json: { data: [] } });
        return route.fulfill({
          status: 503,
          json: { error: { message: "Chưa có dữ liệu kiểm thử." } },
        });
      },
    );
    try {
      await page.goto("/quan-tri/nhap-xuat?phan_he=phuong_tien");
      await expect(
        page.getByRole("heading", { name: "Nhập phương tiện", exact: true }),
      ).toBeVisible();
      await page.locator(".import-help").evaluate((el) => (el.open = true));
      if (process.env.UI_QA_AXE) {
        await page.addScriptTag({ path: process.env.UI_QA_AXE });
        const violations = await page.evaluate(async () =>
          (
            await window.axe.run(document, {
              runOnly: {
                type: "tag",
                values: [
                  "wcag2a",
                  "wcag2aa",
                  "wcag21a",
                  "wcag21aa",
                  "best-practice",
                ],
              },
            })
          ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        );
        expect(violations).toEqual([]);
      }
      await page.screenshot({
        path: `/tmp/chung-cu-excel-menu-${width}-top.png`,
        fullPage: true,
      });
      await page.evaluate(() => window.scrollTo(0, 600));
      const header = await page.locator(".topbar").boundingBox();
      const sidebar = await page.locator(".sidebar").boundingBox();
      if (width > 900) {
        expect(Math.abs(header.y)).toBeLessThan(1);
        expect(Math.abs(sidebar.y - (header.y + header.height))).toBeLessThan(
          2,
        );
        const brand = await page.locator(".brand").boundingBox();
        expect(brand.y).toBeGreaterThanOrEqual(0);
        expect(brand.y + brand.height).toBeLessThanOrEqual(header.height + 1);
      } else {
        expect(header.y).toBeLessThan(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await expect(
        page.getByRole("button", { name: "Tải mẫu PDF", exact: true }),
      ).toHaveCount(0);
      await page.screenshot({
        path: `/tmp/chung-cu-excel-menu-${width}-scroll.png`,
      });
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
