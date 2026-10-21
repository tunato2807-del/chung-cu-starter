import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`building structure: empty block/floor → apartment picker → rename → stale form → safe delete at ${width}px`, async ({
    page,
    context,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(3).toString("hex"),
      codes = ["A", "B", "C"].map((ending) => `T${suffix}${ending}`);
    const [a, b, c] = codes,
      name = `${suffix}-101`,
      password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const errors = [];
    let admin, apt, stale;
    page.on("pageerror", (error) => errors.push(error.message));
    async function save() {
      const response = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.startsWith("/api/cau_truc_toa_nha/khoi") &&
          ["PATCH", "POST"].includes(r.request().method()),
      );
      await page
        .getByRole("button", { name: "Lưu cấu trúc", exact: true })
        .click();
      const result = await response;
      expect(result.status()).toBeLessThan(300);
      await expect(
        page.getByRole("region", { name: "Biểu mẫu khối tầng" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Tải lại danh mục", exact: true }),
      ).toBeEnabled();
    }
    async function addBlock(code) {
      await page
        .getByRole("button", { name: "Thêm khối", exact: true })
        .click();
      await page.getByLabel("Mã khối", { exact: true }).fill(code);
      await page.getByLabel("Tên hiển thị khối").fill("Khối Đông");
      await save();
      await expect(page.getByLabel("Khối cần quản lý")).toHaveValue(code);
    }
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [suffix, phone, await bcrypt.hash(password, 10)],
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
      await page.goto("/quan-tri/cau-truc-toa-nha");
      await addBlock(a);
      await expect(
        page.getByText("Khối chưa có tầng. Bấm Thêm tầng để khai báo.", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await expect(
        page.getByText("Khối chưa có tầng.", { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Quản lý khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(a);
      await page
        .getByRole("button", { name: "Thêm tầng", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("0");
      await page.getByLabel("Tên hiển thị tầng").fill("Tầng trệt");
      await save();
      await expect(
        page.getByRole("cell", { name: "Tầng trệt", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "0 căn phù hợp" }),
      ).toHaveText("0 căn phù hợp · Trang 1");
      await page
        .getByRole("link", { name: "Quản lý căn hộ", exact: true })
        .click();
      await page.getByLabel("Số căn hộ", { exact: true }).fill(name);
      await page.getByLabel("Khối", { exact: true }).selectOption(a);
      await page.getByLabel("Tầng", { exact: true }).selectOption("0");
      await page.getByLabel("Diện tích (m²)").fill("65.5");
      const created = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/can_ho" &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      const response = await created;
      expect(response.status()).toBe(201);
      apt = (await response.json()).data.ma_can_ho;
      stale = await context.newPage();
      stale.on("pageerror", (error) => errors.push(error.message));
      await stale.goto(`/quan-tri/can-ho?ma_can_ho=${apt}`);
      await stale.getByRole("button", { name: "Sửa", exact: true }).click();
      await expect(stale.getByLabel("Tầng", { exact: true })).toHaveValue("0");
      await stale.getByLabel("Diện tích (m²)").fill("80");

      await page
        .getByRole("link", { name: "Khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(a);
      await expect(
        page.getByRole("button", { name: "Xóa tầng 0", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Xóa khối", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Sửa tầng 0", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("2");
      await page.getByLabel("Tên hiển thị tầng").fill("Tầng hai");
      await save();
      await expect(
        page.getByRole("cell", { name: "Tầng 2", exact: true }),
      ).toBeVisible();
      await stale
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      await expect(stale.getByRole("alert")).toContainText("Khối/tầng đã đổi");
      await expect(stale.getByLabel("Diện tích (m²)")).toHaveValue("80");
      await stale.close();
      stale = null;

      await page.getByRole("button", { name: "Sửa khối", exact: true }).click();
      await page.getByLabel("Mã khối", { exact: true }).fill(b);
      await save();
      await expect(page.getByLabel("Khối cần quản lý")).toHaveValue(b);
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${b} `) })
        .click();
      await expect(
        page.getByRole("heading", { name: `Căn ${name}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Tầng 2 / }),
      ).toContainText("Tầng hai");
      expect(
        (
          await rows(
            pool,
            "SELECT khoi,tang,ma_can_ho FROM can_ho WHERE ma_can_ho=?",
            [apt],
          )
        )[0],
      ).toEqual({ khoi: b, tang: 2, ma_can_ho: apt });

      await page
        .getByRole("link", { name: "Quản lý khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(b);
      await page
        .getByRole("button", { name: "Thêm tầng", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("9");
      await save();
      await page
        .getByRole("button", { name: "Xóa tầng 9", exact: true })
        .click();
      const confirmation = page.getByRole("alertdialog", {
        name: "Xác nhận xóa cấu trúc",
      });
      await confirmation
        .getByRole("button", { name: "Giữ lại", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: "Tầng 9", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Xóa tầng 9", exact: true })
        .click();
      await confirmation
        .getByRole("button", { name: "Xác nhận xóa", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: "Tầng 9", exact: true }),
      ).toHaveCount(0);
      await addBlock(c);
      await page.getByRole("button", { name: "Xóa khối", exact: true }).click();
      await confirmation
        .getByRole("button", { name: "Xác nhận xóa", exact: true })
        .click();
      await expect(
        page.getByRole("option", { name: new RegExp(`^Khối ${c} `) }),
      ).toHaveCount(0);
      await page.getByLabel("Khối cần quản lý").selectOption(b);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/building-structure-${width}.png`,
        fullPage: true,
      });
      await page.route("**/api/cau_truc_toa_nha", (route) =>
        route.fulfill({
          status: 503,
          json: { error: { message: "Danh mục tạm ngắt" } },
        }),
      );
      await page
        .getByRole("button", { name: "Tải lại danh mục", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText("Danh mục tạm ngắt");
      await page.unroute("**/api/cau_truc_toa_nha");
      await page
        .getByRole("button", { name: "Tải lại danh mục", exact: true })
        .click();
      await expect(page.getByLabel("Khối cần quản lý")).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      if (stale) await stale.close();
      if (apt) await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apt]);
      for (const code of codes) {
        await rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=?", [code]);
        await rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [code]);
      }
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });
