import { test, expect } from "@playwright/test";

const token = "00000000-0000-4000-8000-000000000001";
const unknownToken = "00000000-0000-4000-8000-000000000099";
const printedOrigin = "http://192.168.1.100:5173";
const unauthorized = {
  error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." },
};

test.beforeEach(async ({ page }) => {
  // These recovery scenarios must not depend on, or change, live test accounts.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    (route) =>
      route.fulfill({
        status: 503,
        json: {
          error: { message: "Chưa có dữ liệu kiểm thử cho yêu cầu này." },
        },
      }),
  );
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({ status: 401, json: unauthorized }),
  );
});

test("QR đã in với IP cũ mở biểu mẫu và public API trên địa chỉ hiện tại", async ({
  page,
}) => {
  const oldHostRequests = [];
  const publicRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin === printedOrigin)
      oldHostRequests.push(request.url());
  });
  await page.route(`${printedOrigin}/**`, (route) => route.abort());
  await page.route(`**/api/cong_khai/vi_tri_qr/${token}`, (route) => {
    publicRequests.push(route.request().url());
    return route.fulfill({
      json: {
        data: {
          ma_vi_tri_qr: 1,
          ten_vi_tri: "Sảnh QR đã in",
          mo_ta: "Vị trí vẫn dùng được sau khi máy chủ đổi IP.",
        },
      },
    });
  });

  await page.goto("/quet-qr");
  const currentOrigin = new URL(page.url()).origin;
  await page
    .getByLabel("Hoặc dán liên kết QR của tòa nhà")
    .fill(`${printedOrigin}/r/${token}`);
  await page.getByRole("button", { name: "Mở biểu mẫu", exact: true }).click();

  await expect(page).toHaveURL(`${currentOrigin}/r/${token}`);
  await expect(
    page.getByRole("heading", { name: "Sảnh QR đã in", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Tiêu đề", { exact: true })).toBeVisible();
  expect(publicRequests.length).toBeGreaterThan(0);
  expect(
    publicRequests.every(
      (url) => url === `${currentOrigin}/api/cong_khai/vi_tri_qr/${token}`,
    ),
  ).toBe(true);
  expect(oldHostRequests).toEqual([]);
});

test("QR với IP cũ và token không tồn tại vẫn nhận lỗi 404 từ máy chủ hiện tại", async ({
  page,
}) => {
  const publicResponses = [];
  page.on("response", (response) => {
    if (
      new URL(response.url()).pathname ===
      `/api/cong_khai/vi_tri_qr/${unknownToken}`
    )
      publicResponses.push({ url: response.url(), status: response.status() });
  });
  await page.route(`${printedOrigin}/**`, (route) => route.abort());
  await page.route(`**/api/cong_khai/vi_tri_qr/${unknownToken}`, (route) =>
    route.fulfill({
      status: 404,
      json: {
        error: {
          code: "NOT_FOUND",
          message: "Mã QR không tồn tại hoặc đã ngừng sử dụng.",
        },
      },
    }),
  );

  await page.goto("/quet-qr");
  const currentOrigin = new URL(page.url()).origin;
  await page
    .getByLabel("Hoặc dán liên kết QR của tòa nhà")
    .fill(`${printedOrigin}/r/${unknownToken}`);
  await page.getByRole("button", { name: "Mở biểu mẫu", exact: true }).click();

  await expect(page).toHaveURL(`${currentOrigin}/r/${unknownToken}`);
  await expect(
    page.getByRole("heading", { name: "Không mở được vị trí", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(
    "Mã QR không tồn tại hoặc đã ngừng sử dụng.",
  );
  await expect(page.getByLabel("Tiêu đề", { exact: true })).toHaveCount(0);
  expect(publicResponses.length).toBeGreaterThan(0);
  expect(
    publicResponses.every(
      ({ url, status }) =>
        url === `${currentOrigin}/api/cong_khai/vi_tri_qr/${unknownToken}` &&
        status === 404,
    ),
  ).toBe(true);
});

for (const [description, value] of [
  ["host ngoài hệ thống", `https://example.com/r/${token}`],
  ["giao thức javascript", `javascript:/r/${token}`],
  [
    "URL chứa thông tin đăng nhập",
    `http://fixture-user:fixture-password@192.168.1.100:5173/r/${token}`,
  ],
]) {
  test(`trang quét QR từ chối ${description} trước khi mở biểu mẫu`, async ({
    page,
  }) => {
    await page.goto("/quet-qr");
    const currentOrigin = new URL(page.url()).origin;
    const rejectedRequests = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.origin !== currentOrigin ||
        url.pathname.startsWith("/api/cong_khai/vi_tri_qr/")
      )
        rejectedRequests.push(request.url());
    });
    await page.route(
      (url) => url.origin !== currentOrigin,
      (route) => route.abort(),
    );

    await page.getByLabel("Hoặc dán liên kết QR của tòa nhà").fill(value);
    await page
      .getByRole("button", { name: "Mở biểu mẫu", exact: true })
      .click();

    await expect(page.getByRole("alert")).toContainText(
      /không.*(hợp lệ|thuộc|hỗ trợ)/i,
    );
    await expect(page).toHaveURL(`${currentOrigin}/quet-qr`);
    expect(rejectedRequests).toEqual([]);
  });
}

test("đăng nhập được trả về tài khoản nhưng không lưu được phiên phải ở lại trang đăng nhập", async ({
  page,
}) => {
  const adminNavigations = [];
  page.on("framenavigated", (frame) => {
    if (
      frame === page.mainFrame() &&
      new URL(frame.url()).pathname.startsWith("/quan-tri")
    )
      adminNavigations.push(frame.url());
  });
  await page.route("**/api/xac_thuc/dang_nhap", (route) =>
    route.fulfill({
      json: {
        data: {
          ma_nguoi_dung: 1,
          ho_va_ten: "Quản trị thử phiên",
          vai_tro: "QUAN_TRI_VIEN",
          so_dien_thoai: "0900000000",
        },
      },
    }),
  );

  await page.goto("/dang-nhap");
  await page
    .getByLabel("Số điện thoại hoặc tài khoản căn hộ", { exact: true })
    .fill("0900000000");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("MatKhauThuNghiem123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText(
    /không.*lưu.*phiên|chưa.*lưu.*phiên|không.*duy trì.*phiên/i,
  );
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeEnabled();
  expect(adminNavigations).toEqual([]);
});
