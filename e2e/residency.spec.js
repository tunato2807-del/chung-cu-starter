import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`apartment → resident → profile → transfer → departure → return at ${width}px`, async ({
    page,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10);
    const apartmentName = `E2E-${suffix}`,
      residentName = `Cư dân E2E ${suffix}`;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const accounts = [],
      phones = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let profileId;
    try {
      for (const role of ["QUAN_TRI_VIEN", "CU_DAN"]) {
        const phone =
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
        const result = await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [`${role} ${suffix}`, phone, hash, role],
        );
        accounts.push(result.insertId);
        phones.push(phone);
      }
      await page.goto("/dang-nhap");
      await page.getByLabel("Số điện thoại").fill(phones[0]);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await page.getByRole("link", { name: "Căn hộ", exact: true }).click();
      await page.getByLabel("Tìm số căn hộ hoặc khối").fill(apartmentName);
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      for (const ending of ["A", "B"]) {
        await page
          .getByLabel("Số căn hộ", { exact: true })
          .fill(`${apartmentName}-${ending}`);
        await page.getByLabel("Khối", { exact: true }).fill("E2E");
        await page.getByLabel("Tầng", { exact: true }).fill("5");
        await page.getByLabel("Diện tích (m²)").fill("75.50");
        await page.getByRole("button", { name: "Lưu căn hộ" }).click();
        await expect(
          page.getByRole("cell", {
            name: `${apartmentName}-${ending}`,
            exact: true,
          }),
        ).toBeVisible();
      }
      const apartments = await rows(
        pool,
        "SELECT ma_can_ho,so_can_ho FROM can_ho WHERE so_can_ho LIKE ? ORDER BY so_can_ho",
        [`${apartmentName}%`],
      );
      expect(apartments).toHaveLength(2);
      const row = page.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: apartments[0].so_can_ho,
          exact: true,
        }),
      });
      await row.getByRole("button", { name: "Sửa", exact: true }).click();
      await page.getByLabel("Diện tích (m²)").fill("80.25");
      await page.getByRole("button", { name: "Lưu căn hộ" }).click();
      await expect(row.getByText("80.25 m²")).toBeVisible();
      await row.getByRole("button", { name: "Xem", exact: true }).click();
      await page
        .getByRole("link", { name: "Thêm hoặc xem cư dân căn này" })
        .click();
      await page
        .getByRole("button", { name: "Thêm cư dân", exact: true })
        .click();
      await page.getByLabel("Họ tên", { exact: true }).fill(residentName);
      await page.getByLabel("Số điện thoại", { exact: true }).fill(phones[1]);
      await page
        .getByLabel("Tìm tài khoản theo tên hoặc số điện thoại")
        .fill(phones[1]);
      await expect(
        page.getByRole("option", { name: new RegExp(phones[1]) }),
      ).toBeAttached();
      await page
        .getByLabel("Tài khoản cư dân (tùy chọn)")
        .selectOption(String(accounts[1]));
      await page.getByLabel("Quan hệ với căn hộ").selectOption("NGUOI_THUE");
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Lưu cư dân", exact: true })
        .click();
      await page.getByRole("link", { name: residentName, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: residentName, exact: true }),
      ).toBeVisible();
      profileId = Number(page.url().split("/").at(-1));

      // A slow account selector must not silently unlink an existing account.
      await page.evaluate(() => {
        const original = window.fetch;
        window.__originalFetch = original;
        window.fetch = (...args) =>
          String(args[0]).startsWith("/api/cu_dan/tai_khoan?")
            ? new Promise((resolve) => {
                window.__resumeAccounts = resolve;
              }).then(() => original(...args))
            : original(...args);
      });
      await page
        .getByRole("button", { name: "Sửa hồ sơ", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => typeof window.__resumeAccounts))
        .toBe("function");
      await page
        .getByLabel("Họ tên", { exact: true })
        .fill(residentName + " sửa");
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: residentName + " sửa", exact: true }),
      ).toBeVisible();
      await page.evaluate(() => {
        window.__resumeAccounts();
        window.fetch = window.__originalFetch;
      });
      const [linked] = await rows(
        pool,
        "SELECT ma_nguoi_dung FROM cu_dan WHERE ma_cu_dan=?",
        [profileId],
      );
      expect(linked.ma_nguoi_dung).toBe(accounts[1]);

      await page
        .getByRole("button", { name: "Chuyển căn", exact: true })
        .click();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(apartments[1].so_can_ho);
      await expect(
        page.getByRole("option", { name: new RegExp(apartments[1].so_can_ho) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[1].ma_can_ho));
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByText(`Đang ở căn ${apartments[1].so_can_ho}`, {
          exact: false,
        }),
      ).toBeVisible();
      await expect(
        page.locator("tbody small").filter({ hasText: "Chuyển trong ngày" }),
      ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Ghi nhận chuyển đi", exact: true })
        .click();
      await page.getByLabel("Ngày chuyển đi", { exact: true }).fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Ghi nhận quay lại", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Ghi nhận quay lại", exact: true })
        .click();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(apartments[0].so_can_ho);
      await expect(
        page.getByRole("option", { name: new RegExp(apartments[0].so_can_ho) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[0].ma_can_ho));
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await page.reload();
      await expect(
        page.getByText(`Đang ở căn ${apartments[0].so_can_ho}`, {
          exact: false,
        }),
      ).toBeVisible();
      await expect(page.locator("tbody tr")).toHaveCount(3);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      // Clean only this run's fixtures, including rows created before an assertion failed.
      const profiles = await rows(
        pool,
        "SELECT ma_cu_dan FROM cu_dan WHERE ho_va_ten LIKE ?",
        [`${residentName}%`],
      );
      for (const { ma_cu_dan: id } of profiles) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      await rows(pool, "DELETE FROM can_ho WHERE so_can_ho LIKE ?", [
        `${apartmentName}%`,
      ]);
      for (const id of accounts)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });

// Same-day moves are available immediately; earlier dates and future dates remain invalid.
for (const width of [1440, 375])
  test(`same-day transfer accepts today and keeps profile editing available at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.install({ time: new Date("2026-10-19T08:00:00Z") });
    await page.route("**/api/xac_thuc/toi", (route) =>
      route.fulfill({
        json: {
          data: {
            ma_nguoi_dung: 1,
            ho_va_ten: "BQL thử ngày",
            vai_tro: "QUAN_TRI_VIEN",
          },
        },
      }),
    );
    await page.route("**/api/cu_dan/999", (route) =>
      route.fulfill({
        json: {
          data: {
            ma_cu_dan: 999,
            ho_va_ten: "Cư dân cùng ngày",
            so_dien_thoai: "0901234567",
            ma_nguoi_dung: null,
            phien_ban: 0,
            history: [
              {
                ma_lich_su_cu_tru: 1,
                ma_can_ho: 1,
                so_can_ho: "101",
                quan_he: "THANH_VIEN",
                tu_ngay: "2026-10-19",
                den_ngay: null,
                nguoi_ghi_nhan: "BQL",
              },
            ],
          },
        },
      }),
    );
    await page.route("**/api/can_ho?**", (route) =>
      route.fulfill({ json: { data: [], total: 0, page: 1 } }),
    );
    await page.route("**/api/cu_dan/tai_khoan?**", (route) =>
      route.fulfill({ json: { data: [], total: 0, page: 1 } }),
    );
    let writes = 0;
    await page.route("**/api/cu_dan/999/*", (route) => {
      writes++;
      return route.fulfill({ status: 500, json: {} });
    });
    await page.goto("/quan-tri/cu-dan/999");
    await expect(
      page.getByText("Đợt cư trú hiện tại bắt đầu ngày 19/10/2026.", {
        exact: true,
      }),
    ).toBeVisible();
    for (const label of ["Chuyển căn", "Ghi nhận chuyển đi"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Có thể chọn ngày" }),
      ).toContainText("kể cả chuyển căn trong ngày bắt đầu ở");
      await expect(
        page.getByRole("button", { name: "Xác nhận lưu", exact: true }),
      ).toBeEnabled();
      const date = page.locator('input[name="ngay"]');
      await expect(date).toHaveAttribute("min", "2026-10-19");
      await expect(date).toHaveAttribute("max", "2026-10-19");
      await expect(date).toBeEnabled();
      await date.fill("2026-10-18");
      expect(
        await date.evaluate((input) => input.validity.rangeUnderflow),
      ).toBe(true);
      await date.fill("2026-10-20");
      expect(await date.evaluate((input) => input.validity.rangeOverflow)).toBe(
        true,
      );
      await date.fill("2026-10-19");
      expect(await date.evaluate((input) => input.validity.valid)).toBe(true);
    }
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Sửa hồ sơ", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Xác nhận lưu", exact: true }),
    ).toBeEnabled();
    await expect(page.getByLabel("Họ tên", { exact: true })).toBeEditable();
  });
