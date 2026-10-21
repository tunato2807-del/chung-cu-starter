import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`building map: hierarchy, filters, pagination, editing and recovery at ${width}px`, async ({
    page,
    context,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(4).toString("hex");
    const a = `${suffix}A`,
      b = `${suffix}B`,
      password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const apartments = [],
      residents = [],
      errors = [];
    let admin;
    page.on("pageerror", (error) => errors.push(error.message));
    const map = page.locator(".building-map");
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Sơ đồ ${suffix}`, phone, await bcrypt.hash(password, 10)],
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
      for (let i = 0; i < 24; i++) {
        const row = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,65.5)",
          [`${suffix}-${i}`, i === 23 ? b : a, i === 22 ? 10 : 0],
        );
        apartments.push(row.insertId);
      }
      for (let i = 0; i < 2; i++) {
        const resident = await rows(
          pool,
          "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
          [`Sơ đồ ${suffix}-${i}`, "0901234567"],
        );
        residents.push(resident.insertId);
        await rows(
          pool,
          "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?)",
          [resident.insertId, apartments[0], admin],
        );
      }
      await page.goto(`/quan-tri/so-do-toa-nha?khoi=${a}&tang=0`);
      await expect(
        map.getByRole("heading", { name: "Sơ đồ tòa nhà", exact: true }),
      ).toBeVisible();
      const rooms = map.getByRole("region", { name: "Căn hộ trên sơ đồ" });
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      await expect(
        map
          .getByRole("navigation", { name: "Chọn khối" })
          .getByRole("button", { name: new RegExp(`Khối ${a}`) }),
      ).toContainText("23 căn · 22 trống");
      await expect(rooms.locator("article")).toHaveCount(20);
      await rooms
        .getByRole("button", { name: "Trang sau", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 2",
      );
      await expect(rooms.locator("article")).toHaveCount(2);
      await page.reload();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 2",
      );
      await map.getByLabel("Tình trạng cư trú").selectOption("DANG_O");
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await expect(rooms.locator("article")).toHaveCount(1);
      await expect(
        rooms.getByText("Có người ở · 2 cư dân", { exact: true }),
      ).toBeVisible();
      await map.getByLabel("Tình trạng cư trú").selectOption("TRONG");
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "21 căn phù hợp · Trang 1",
      );
      await rooms
        .getByRole("button", { name: "Xóa bộ lọc", exact: true })
        .click();
      await expect(map.getByLabel("Tình trạng cư trú")).toHaveValue("");
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      await map.getByLabel("Tìm căn hộ trong tầng").fill(`${suffix}-0`);
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await rooms
        .getByRole("button", { name: "Xóa bộ lọc", exact: true })
        .click();
      await map.getByRole("button", { name: /^Tầng 10 / }).click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-22`, exact: true }),
      ).toBeVisible();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${b} `) })
        .click();
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-23`, exact: true }),
      ).toBeVisible();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await map.getByRole("button", { name: /^Tầng 0 / }).click();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/building-map-${width}.png`,
        fullPage: true,
      });

      await rooms
        .getByRole("link", { name: `Xem / sửa căn ${suffix}-0`, exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `${suffix}-0`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: `${suffix}-1`, exact: true }),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Sửa", exact: true }).click();
      await page.getByLabel("Tầng", { exact: true }).fill("2");
      await page
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `${a} / 2`, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await map.getByRole("button", { name: /^Tầng 2 / }).click();
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-0`, exact: true }),
      ).toBeVisible();
      await rooms
        .getByRole("link", { name: `Cư dân căn ${suffix}-0`, exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `Sơ đồ ${suffix}-0`, exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );

      await page.route("**/api/can_ho/so_do", (route) =>
        route.fulfill({
          status: 503,
          json: { error: { message: "Tạm ngắt dữ liệu sơ đồ" } },
        }),
      );
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(map.getByRole("alert")).toContainText(
        "Tạm ngắt dữ liệu sơ đồ",
      );
      await expect(map.locator("article")).toHaveCount(0);
      await page.unroute("**/api/can_ho/so_do");
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await page.goto(`/quan-tri/so-do-toa-nha?khoi=${a}&tang=199`);
      await expect(map.getByRole("status")).toContainText(
        "Tầng trong liên kết không còn",
      );
      await expect(map.locator("article")).toHaveCount(0);
      await page.goto("/quan-tri/so-do-toa-nha?khoi=NOTFOUND");
      await expect(map.getByRole("status")).toContainText(
        "Khối trong liên kết không còn",
      );
      await page.route("**/api/can_ho/so_do", (route) =>
        route.fulfill({
          json: {
            data: {
              tong: {
                so_khoi: 0,
                so_tang: 0,
                so_can_ho: 0,
                co_nguoi_o: 0,
                trong: 0,
                so_cu_dan: 0,
              },
              khoi: [],
            },
          },
        }),
      );
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(
        map.getByRole("heading", {
          name: "Chưa có căn hộ để lập sơ đồ",
          exact: true,
        }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      for (const id of residents) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      for (const id of apartments)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });

test("building map discards slow responses and blocks residents", async ({
  page,
}) => {
  let role = "QUAN_TRI_VIEN",
    listRequests = 0;
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      json: { data: { ma_nguoi_dung: 98765, ho_va_ten: "BQL", vai_tro: role } },
    }),
  );
  await page.route("**/api/can_ho/so_do", (route) =>
    route.fulfill({
      json: {
        data: {
          tong: {
            so_khoi: 1,
            so_tang: 2,
            so_can_ho: 2,
            co_nguoi_o: 0,
            trong: 2,
            so_cu_dan: 0,
          },
          khoi: [
            {
              khoi: "RACE",
              so_can_ho: 2,
              co_nguoi_o: 0,
              trong: 2,
              so_cu_dan: 0,
              tang: [2, 1].map((tang) => ({
                tang,
                so_can_ho: 1,
                co_nguoi_o: 0,
                trong: 1,
                so_cu_dan: 0,
              })),
            },
          ],
        },
      },
    }),
  );
  let release;
  const slow = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/can_ho?**", async (route) => {
    listRequests++;
    const floor = new URL(route.request().url()).searchParams.get("tang");
    if (floor === "2") await slow;
    await route
      .fulfill({
        json: {
          data: [
            {
              ma_can_ho: Number(floor),
              so_can_ho: `RACE-${floor}`,
              so_cu_dan: 0,
              dien_tich_m2: "50",
              tinh_phi_dich_vu: 1,
            },
          ],
          total: 1,
          page: 1,
        },
      })
      .catch(() => {});
  });
  await page.goto("/quan-tri/so-do-toa-nha?khoi=RACE&tang=2");
  await expect.poll(() => listRequests).toBeGreaterThan(0);
  await page.getByRole("button", { name: /^Tầng 1 / }).click();
  await expect(
    page.getByRole("heading", { name: "Căn RACE-1", exact: true }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "Căn RACE-2", exact: true }),
  ).toHaveCount(0);
  role = "CU_DAN";
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Bạn không có quyền mở trang này",
      exact: true,
    }),
  ).toBeVisible();
});
