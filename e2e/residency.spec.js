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
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill("2020-01-01");
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
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill("2021-01-01");
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByText(`Đang ở căn ${apartments[1].so_can_ho}`, {
          exact: false,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "2021-01-01", exact: true }),
      ).toHaveCount(2);
      await page
        .getByRole("button", { name: "Ghi nhận chuyển đi", exact: true })
        .click();
      await page
        .getByLabel("Ngày chuyển đi", { exact: true })
        .fill("2022-01-01");
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
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill("2023-01-01");
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
