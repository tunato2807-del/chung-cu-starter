import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375]) {
  test(`service catalog: search, categories, empty state and guest access at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("/");
      const catalog = page.getByRole("region", {
        name: "Chọn dịch vụ bạn cần",
      });
      const list = catalog.getByRole("list", { name: "Danh sách dịch vụ" });
      await expect(list.getByRole("link")).toHaveCount(6);
      const search = page.getByLabel("Tìm dịch vụ", { exact: true });
      await search.fill("hoa don");
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      await expect(list.getByRole("link")).toHaveCount(1);
      await expect(
        list.getByRole("link", { name: "Hóa đơn & thanh toán", exact: true }),
      ).toBeVisible();
      await catalog
        .getByRole("button", { name: "Tài khoản", exact: true })
        .click();
      await expect(
        catalog.getByRole("heading", { name: "Chưa tìm thấy dịch vụ phù hợp" }),
      ).toBeVisible();
      await catalog
        .getByRole("button", { name: "Xem tất cả dịch vụ", exact: true })
        .click();
      await expect(search).toHaveValue("");
      await expect(list.getByRole("link")).toHaveCount(6);
      await catalog
        .getByRole("button", { name: "Phản ánh & hỗ trợ", exact: true })
        .click();
      await expect(list.getByRole("link")).toHaveCount(2);
      await list
        .getByRole("link", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(page).toHaveURL(/\/quet-qr$/);
      await expect(
        page.getByRole("heading", { name: "Quét mã QR", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const [role, width, title, path, query, label] of [
  [
    "QUAN_TRI_VIEN",
    1440,
    "Hóa đơn & thanh toán",
    "/quan-tri/hoa-don",
    "hoadon",
    "Phí & hóa đơn",
  ],
  [
    "CU_DAN",
    375,
    "Hóa đơn & thanh toán",
    "/cu-dan/hoa-don",
    "hoadon",
    "Hóa đơn của tôi",
  ],
  [
    "KY_THUAT_VIEN",
    768,
    "Đặt lịch tiện ích",
    "/ky-thuat/cong-viec",
    "baotri",
    "Bảo trì thiết bị",
  ],
]) {
  test(`service intent and function search use the signed-in role: ${role}`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const password = randomBytes(16).toString("hex");
    let id;
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    try {
      id = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [
            `Tìm dịch vụ ${suffix}`,
            phone,
            await bcrypt.hash(password, 10),
            role,
          ],
        )
      ).insertId;
      await page.goto("/");
      await page
        .getByRole("list", { name: "Danh sách dịch vụ" })
        .getByRole("link", { name: title, exact: true })
        .click();
      await expect(page).toHaveURL(/\/dang-nhap$/);
      // Phiên thật từ service, không tiêu thụ hạn mức đăng nhập HTTP dùng chung.
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
      await page.getByLabel("Số điện thoại hoặc tài khoản căn hộ").fill(phone);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      const search = page.getByRole("searchbox", {
        name: "Tìm chức năng",
        exact: true,
      });
      await search.fill(query);
      const results = page.getByRole("list", { name: "Kết quả tìm chức năng" });
      await expect(results.getByRole("link")).toHaveCount(1);
      await search.press("ArrowDown");
      await expect(
        results.getByRole("link", { name: new RegExp(label) }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(search).toBeFocused();
      await expect(results).not.toBeVisible();
      await search.fill("khongtimthaychucnang");
      await expect(results.getByRole("link")).toHaveCount(0);
      await search.fill(query);
      await search.press("Enter");
      if (role === "KY_THUAT_VIEN")
        await expect(page).toHaveURL(/\/ky-thuat\/bao-tri$/);
      else await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(results).not.toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (role === "QUAN_TRI_VIEN") {
        await page.goto("/quan-tri/bao-tri");
        await expect(
          page
            .getByRole("navigation", { name: "Chức năng" })
            .getByRole("link", { name: "Thiết bị & bảo trì", exact: true }),
        ).toHaveAttribute("aria-current", "page");
        await expect(
          page
            .getByRole("navigation", { name: "Chức năng" })
            .locator('[aria-current="page"]'),
        ).toHaveCount(1);
      }
      if (role === "KY_THUAT_VIEN") {
        await page.goto("/");
        const catalog = page.getByRole("list", { name: "Danh sách dịch vụ" });
        await expect(
          catalog.getByRole("link", {
            name: "Công việc được giao",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          catalog.getByRole("link", {
            name: "Hóa đơn & thanh toán",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Hóa đơn", exact: true }),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "Bảo trì", exact: true })
          .click();
        await expect(catalog.getByRole("link")).toHaveCount(1);
        await expect(
          catalog.getByRole("link", { name: "Bảo trì thiết bị", exact: true }),
        ).toBeVisible();
      }
    } finally {
      await context.close();
      if (id)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
}
