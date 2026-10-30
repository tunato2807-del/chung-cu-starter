import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 768, 320]) {
  test(`interface: keyboard access, password visibility, navigation and logout at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex");
    const password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let id;
    const fit = async () =>
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    try {
      id = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Giao diện ${suffix}`, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: /Sống an tâm\.\s*Kết nối dễ dàng\./,
        }),
      ).toBeVisible();
      await fit();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Đến nội dung chính" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();
      await page.goto("/dang-nhap");
      await page.getByLabel("Số điện thoại hoặc tài khoản căn hộ").fill(phone);
      const input = page.getByLabel("Mật khẩu", { exact: true });
      await input.fill(password);
      let loginRequests = 0;
      page.on("request", (request) => {
        if (new URL(request.url()).pathname === "/api/xac_thuc/dang_nhap")
          loginRequests++;
      });
      await page
        .getByRole("button", { name: "Hiện mật khẩu", exact: true })
        .click();
      await expect(input).toHaveAttribute("type", "text");
      await expect(input).toHaveValue(password);
      await page
        .getByRole("button", { name: "Ẩn mật khẩu", exact: true })
        .click();
      await expect(input).toHaveAttribute("type", "password");
      expect(loginRequests).toBe(0);
      await fit();
      // Kiểm tra UI bằng phiên thật, không cộng vào hạn mức HTTP đăng nhập
      // dùng chung của các kịch bản nghiệp vụ. Các spec khác kiểm tra endpoint.
      await page.route("**/api/xac_thuc/dang_nhap", async (route) => {
        const session = await login(route.request().postDataJSON());
        await context.addCookies([
          {
            name: "session",
            value: session.token,
            url: "http://127.0.0.1:5174",
            httpOnly: true,
            sameSite: "Strict",
          },
        ]);
        await route.fulfill({ json: { data: session.user } });
      });
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Tổng quan vận hành", exact: true }),
      ).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Chức năng" });
      await expect(nav.getByRole("link")).toHaveCount(20);
      await expect(
        nav.getByRole("link", { name: "Tổng quan", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      if (width <= 900) {
        const toggle = page.getByRole("button", {
          name: "Tất cả chức năng",
          exact: true,
        });
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await toggle.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("button", { name: "Thu gọn menu", exact: true }),
        ).toHaveAttribute("aria-expanded", "true");
        await nav.getByRole("link", { name: "Phản ánh", exact: true }).focus();
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
        await toggle.click();
      }
      await nav
        .getByRole("link", { name: "Nhập / xuất dữ liệu", exact: true })
        .click();
      await expect(page).toHaveURL(/\/quan-tri\/nhap-xuat$/);
      await expect(
        nav.getByRole("link", { name: "Nhập / xuất dữ liệu", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      if (width <= 900)
        await expect(
          page.getByRole("button", { name: "Tất cả chức năng", exact: true }),
        ).toHaveAttribute("aria-expanded", "false");
      await fit();
      const profile = page.locator(".profile-menu > summary");
      await profile.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(profile).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).not.toBeVisible();
      await profile.click();
      await page.getByRole("main").click({ position: { x: 5, y: 5 } });
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).not.toBeVisible();
      await profile.click();
      await page
        .getByRole("button", { name: "Đăng xuất", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Đăng nhập", exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (id)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
}
