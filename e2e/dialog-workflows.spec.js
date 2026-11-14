import { test, expect } from "@playwright/test";

const user = {
  ma_nguoi_dung: 1,
  ho_va_ten: "Quản trị kiểm thử",
  vai_tro: "QUAN_TRI_VIEN",
};
const apartments = Array.from({ length: 20 }, (_, i) => ({
  ma_can_ho: i + 1,
  so_can_ho: `A${101 + i}`,
  khoi: "A",
  tang: 1,
  dien_tich_m2: "72.5",
  so_cu_dan: 1,
  tinh_phi_dich_vu: 1,
  phien_ban: 0,
}));
const residents = apartments.map((a, i) => ({
  ma_cu_dan: i + 1,
  ho_va_ten: i ? `Cư dân kiểm thử ${i + 1}` : "Nguyễn Minh An",
  so_dien_thoai: `090000${String(i + 1).padStart(4, "0")}`,
  so_can_ho: a.so_can_ho,
  quan_he: "CHU_HO",
  phien_ban: 0,
}));

async function fixtures(page, overrides = {}) {
  const state = {
    name: residents[0].ho_va_ten,
    phone: residents[0].so_dien_thoai,
    patches: [],
    accountReads: 0,
  };
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        path = url.pathname;
      if (overrides.handle && (await overrides.handle(route, state))) return;
      if (path === "/api/xac_thuc/toi")
        return route.fulfill({ json: { data: user } });
      if (path === "/api/can_ho/so_do")
        return route.fulfill({
          json: {
            data: {
              khoi: [
                {
                  khoi: "A",
                  ten_khoi: "Khối A",
                  tang: [{ tang: 1, phien_ban: 0, can_ho: apartments }],
                },
              ],
            },
          },
        });
      if (path === "/api/can_ho")
        return route.fulfill({
          json: {
            data: apartments,
            page: Number(url.searchParams.get("page") || 1),
            total: 40,
          },
        });
      if (path === "/api/cu_dan" && request.method() === "GET")
        return route.fulfill({
          json: {
            data: residents.map((r) =>
              r.ma_cu_dan === 1 ? { ...r, ho_va_ten: state.name } : r,
            ),
            page: Number(url.searchParams.get("page") || 1),
            total: 40,
          },
        });
      if (path === "/api/cu_dan/1" && request.method() === "PATCH") {
        const body = request.postDataJSON();
        state.patches.push(body);
        state.name = body.ho_va_ten;
        state.phone = body.so_dien_thoai;
        return route.fulfill({ json: { data: { ma_cu_dan: 1 } } });
      }
      if (path === "/api/cu_dan/1")
        return route.fulfill({
          json: {
            data: {
              ...residents[0],
              ho_va_ten: state.name,
              so_dien_thoai: state.phone,
              history: [
                {
                  ma_lich_su_cu_tru: 1,
                  ma_can_ho: 1,
                  so_can_ho: "A101",
                  quan_he: "CHU_HO",
                  tu_ngay: "2026-01-01",
                  den_ngay: null,
                  nguoi_ghi_nhan: "Ban quản lý",
                },
              ],
            },
          },
        });
      if (path === "/api/can_ho/1") {
        state.accountReads++;
        return route.fulfill({
          json: {
            data: {
              ...apartments[0],
              residents: [residents[0]],
              lich_su_ban_giao: [],
              tai_khoan_can_ho: {
                ten_dang_nhap: "CH000001",
                ma_cu_dan_phu_trach: 1,
                nguoi_phu_trach: state.name,
                dien_thoai_phu_trach: state.phone,
                dang_hoat_dong: 1,
                phien_ban_ban_giao: 0,
              },
            },
          },
        });
      }
      if (path === "/api/can_ho/1/tai_khoan")
        return route.fulfill({
          json: {
            data: {
              ten_dang_nhap: "CH000001",
              mat_khau_tam_thoi: "Fixture-only-password-123",
              nguoi_phu_trach: state.name,
              dien_thoai_phu_trach: state.phone,
            },
          },
        });
      return route.fulfill({ json: { data: [], total: 0, page: 1 } });
    },
  );
  return { state, errors };
}

test("detail and nested edit keep filters, data on validation error, focus and scroll", async ({
  page,
}) => {
  let failures = 1;
  const { state, errors } = await fixtures(page, {
    handle: async (route) => {
      if (
        new URL(route.request().url()).pathname === "/api/cu_dan/1" &&
        route.request().method() === "PATCH" &&
        failures--
      ) {
        await route.fulfill({
          status: 422,
          json: {
            error: {
              message: "Vui lòng kiểm tra hồ sơ.",
              field_errors: { so_dien_thoai: "Số điện thoại chưa hợp lệ." },
            },
          },
        });
        return true;
      }
    },
  });
  const original = "/quan-tri/cu-dan?q=Minh&page=2";
  await page.goto(original);
  const trigger = page.getByRole("link", {
    name: "Nguyễn Minh An",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await trigger.click();
  const detail = page.getByRole("dialog", {
    name: "Chi tiết cư dân",
    exact: true,
  });
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Sửa hồ sơ", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Sửa hồ sơ", exact: true });
  await edit.getByLabel("Họ tên", { exact: true }).fill("Nguyễn Minh Anh");
  await edit.getByRole("button", { name: "Xác nhận lưu" }).click();
  await expect(edit.getByRole("alert")).toContainText(
    "Số điện thoại chưa hợp lệ",
  );
  await expect(edit.getByLabel("Họ tên", { exact: true })).toHaveValue(
    "Nguyễn Minh Anh",
  );
  await edit.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
  await edit.getByRole("button", { name: "Xác nhận lưu" }).click();
  await expect(edit).toHaveCount(0);
  await expect(detail).toContainText("Nguyễn Minh Anh");
  expect(state.patches[0]).toMatchObject({
    phien_ban: 0,
    ho_va_ten: "Nguyễn Minh Anh",
    so_dien_thoai: "0901234567",
  });
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(new RegExp(original.replace("?", "\\?") + "$"));
  await expect(page.getByLabel("Tìm tên hoặc số điện thoại")).toHaveValue(
    "Minh",
  );
  await expect(
    page.getByRole("link", { name: "Nguyễn Minh Anh", exact: true }),
  ).toBeFocused();
  expect(Math.abs((await page.evaluate(() => scrollY)) - scroll)).toBeLessThan(
    65,
  );
  expect(errors).toEqual([]);
});

test("a pending mutation blocks Escape and close, then closes only its form", async ({
  page,
}) => {
  let release;
  await fixtures(page, {
    handle: async (route) => {
      if (
        new URL(route.request().url()).pathname === "/api/cu_dan/1" &&
        route.request().method() === "PATCH"
      ) {
        await new Promise((resolve) => {
          release = resolve;
        });
        await route.fulfill({ json: { data: { ma_cu_dan: 1 } } });
        return true;
      }
    },
  });
  await page.goto("/quan-tri/cu-dan");
  await page.getByRole("link", { name: "Nguyễn Minh An", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Chi tiết cư dân",
    exact: true,
  });
  await detail.getByRole("button", { name: "Sửa hồ sơ", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Sửa hồ sơ", exact: true });
  await edit.getByRole("button", { name: "Xác nhận lưu" }).click();
  await expect.poll(() => typeof release).toBe("function");
  await expect(
    edit.getByRole("button", { name: "Đóng cửa sổ", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(edit).toBeVisible();
  release();
  await expect(edit).toHaveCount(0);
  await expect(detail).toBeVisible();
});

test("related table opens above the record and closes back to the original context", async ({
  page,
}) => {
  const { errors } = await fixtures(page);
  await page.goto("/quan-tri/cu-dan?q=An");
  await page.getByRole("link", { name: "Nguyễn Minh An", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Chi tiết cư dân",
    exact: true,
  });
  await detail.getByRole("link", { name: "Phương tiện của cư dân" }).click();
  const vehicles = page.getByRole("dialog", {
    name: "Phương tiện cư dân",
    exact: true,
  });
  await expect(
    vehicles.getByRole("heading", { name: "Phương tiện", exact: true }),
  ).toBeVisible();
  await vehicles
    .getByRole("button", { name: "Đăng ký xe", exact: true })
    .click();
  const registration = page.getByRole("dialog", {
    name: "Đăng ký xe mới",
    exact: true,
  });
  await expect(
    registration.getByLabel("Loại xe", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(registration).toHaveCount(0);
  await expect(vehicles).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).toBeVisible();
  await detail
    .getByRole("button", { name: "Lịch sử cư trú", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Lịch sử cư trú", exact: true })
      .getByRole("table"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/quan-tri\/cu-dan\?q=An$/);
  expect(errors).toEqual([]);
});

test("temporary account credentials survive refresh and close above their parent", async ({
  page,
}) => {
  const { state, errors } = await fixtures(page);
  await page.goto("/quan-tri/can-ho");
  await page
    .getByRole("row")
    .filter({ hasText: "A101" })
    .getByRole("button", { name: "Xem", exact: true })
    .click();
  const apartment = page.getByRole("dialog", {
    name: "Chi tiết căn hộ",
    exact: true,
  });
  await apartment
    .getByRole("button", {
      name: "Cấp lại mật khẩu tài khoản căn hộ",
      exact: true,
    })
    .click();
  const reset = page.getByRole("dialog", {
    name: "Cấp lại mật khẩu tài khoản căn hộ",
    exact: true,
  });
  await reset
    .getByRole("button", {
      name: "Cấp lại mật khẩu và ngắt phiên cũ",
      exact: true,
    })
    .click();
  const credentials = page.getByRole("dialog", {
    name: "Thông tin đăng nhập tài khoản căn hộ",
    exact: true,
  });
  await expect(credentials).toContainText("Fixture-only-password-123");
  await expect.poll(() => state.accountReads).toBeGreaterThan(1);
  await expect(credentials).toContainText("Fixture-only-password-123");
  await page.keyboard.press("Escape");
  await expect(reset).toHaveCount(0);
  await expect(apartment).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  expect(errors).toEqual([]);
});

test("creating a record opens its detail, closes the completed form and keeps the list", async ({
  page,
}) => {
  const { errors } = await fixtures(page, {
    handle: async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/quy" && route.request().method() === "POST") {
        await route.fulfill({ json: { data: { ma_quy: 7 } } });
        return true;
      }
      if (path.startsWith("/api/quy/7/")) {
        await route.fulfill({
          status: 503,
          json: {
            error: { message: "Sổ quỹ đang cập nhật, vui lòng thử lại." },
          },
        });
        return true;
      }
    },
  });
  await page.goto("/quan-tri/quy?q=van-hanh");
  await page.getByRole("button", { name: "Tạo quỹ", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Tạo quỹ", exact: true });
  await form
    .getByLabel("Tên quỹ", { exact: true })
    .fill("Quỹ sinh hoạt cộng đồng");
  await form.getByRole("button", { name: "Lưu quỹ", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Chi tiết quỹ",
    exact: true,
  });
  await expect(detail.getByRole("alert")).toContainText("Sổ quỹ đang cập nhật");
  await expect(form).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/quan-tri\/quy\?q=van-hanh$/);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("expired authentication removes record dialogs and private content", async ({
  page,
}) => {
  await fixtures(page, {
    handle: async (route) => {
      if (
        new URL(route.request().url()).pathname === "/api/cu_dan/1" &&
        route.request().method() === "PATCH"
      ) {
        await route.fulfill({
          status: 401,
          json: {
            error: { code: "SESSION_EXPIRED", message: "Phiên đã hết hạn." },
          },
        });
        return true;
      }
    },
  });
  await page.goto("/quan-tri/cu-dan");
  await page.getByRole("link", { name: "Nguyễn Minh An", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Chi tiết cư dân", exact: true })
    .getByRole("button", { name: "Sửa hồ sơ", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Sửa hồ sơ", exact: true })
    .getByRole("button", { name: "Xác nhận lưu" })
    .click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.getByText("Nguyễn Minh An", { exact: true })).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});

for (const width of [320, 768, 1024, 1440]) {
  test(`apartment editor fits ${width}px, traps keyboard focus and returns to its trigger`, async ({
    page,
  }, testInfo) => {
    const { errors } = await fixtures(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/quan-tri/can-ho?q=A&page=2");
    const trigger = page.getByRole("button", {
      name: "Thêm căn hộ",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Thêm căn hộ",
      exact: true,
    });
    await expect(dialog.getByLabel("Số căn hộ", { exact: true })).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(901);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.screenshot({
      path: testInfo.outputPath(`dialog-form-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByLabel("Tìm số căn hộ hoặc khối")).toHaveValue("A");
    await expect(page).toHaveURL(/\/quan-tri\/can-ho\?q=A&page=2$/);
    expect(errors).toEqual([]);
  });
}

for (const [path, trigger, title, field] of [
  ["/quan-tri/cu-dan", "Thêm cư dân", "Thêm cư dân", "Họ tên"],
  ["/quan-tri/phuong-tien", "Đăng ký xe", "Đăng ký xe mới", "Loại xe"],
  ["/quan-tri/nhan-su", "Cấp tài khoản", "Cấp tài khoản", "Họ tên"],
  ["/quan-tri/don-gia", "Thêm phiên bản giá", "Thêm phiên bản giá", null],
  ["/quan-tri/chi-so", "Ghi chỉ số", "Ghi chỉ số", null],
  ["/quan-tri/vi-tri-qr", "Thêm vị trí", "Thêm vị trí", "Tên vị trí"],
  ["/quan-tri/thiet-bi", "Thêm thiết bị", "Đăng ký thiết bị", null],
  ["/quan-tri/tien-ich", "Thêm tiện ích", "Thêm tiện ích", null],
  ["/quan-tri/quy", "Tạo quỹ", "Tạo quỹ", "Tên quỹ"],
]) {
  test(`action opens directly and dismisses on ${path}`, async ({ page }) => {
    const { errors } = await fixtures(page);
    await page.goto(path);
    const button = page.getByRole("button", { name: trigger, exact: true });
    await button.click();
    const dialog = page.getByRole("dialog", { name: title, exact: true });
    await expect(dialog).toBeVisible();
    if (field)
      await expect(dialog.getByLabel(field, { exact: true })).toBeVisible();
    await dialog
      .getByRole("button", { name: "Đóng cửa sổ", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
    expect(errors).toEqual([]);
  });
}
