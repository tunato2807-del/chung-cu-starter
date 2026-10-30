import { test, expect } from "@playwright/test";
import sharp from "sharp";

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

const sessionUser = {
  ma_nguoi_dung: 71,
  ho_va_ten: "Quản trị thử phiên hết hạn",
  vai_tro: "QUAN_TRI_VIEN",
  so_dien_thoai: "0900000071",
};
const sessionExpired = {
  error: {
    code: "SESSION_EXPIRED",
    message: "Phiên đã hết hạn. Vui lòng đăng nhập lại.",
  },
};

test("phiên hết hạn mở lại đăng nhập, giữ lỗi sai mật khẩu và bỏ qua 401 cũ sau đăng nhập mới", async ({
  page,
}) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({ json: { data: sessionUser } }),
  );
  let releaseOldRequest;
  const oldRequestHeld = new Promise((resolve) => {
    releaseOldRequest = resolve;
  });
  await page.route("**/api/old-session-request", async (route) => {
    await oldRequestHeld;
    await route.fulfill({ status: 401, json: sessionExpired });
  });
  await page.route("**/api/xac_thuc/doi_mat_khau", (route) =>
    route.fulfill({ status: 401, json: sessionExpired }),
  );
  let loginAttempts = 0;
  await page.route("**/api/xac_thuc/dang_nhap", (route) => {
    loginAttempts++;
    return loginAttempts === 1
      ? route.fulfill({
          status: 401,
          json: {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Số điện thoại hoặc mật khẩu không đúng.",
            },
          },
        })
      : route.fulfill({ json: { data: sessionUser } });
  });

  try {
    await page.goto("/tai-khoan");
    await expect(
      page.getByRole("heading", { name: "Tài khoản", exact: true }),
    ).toBeVisible();
    const oldRequestStarted = page.waitForRequest("**/api/old-session-request");
    await page.evaluate(() => {
      window.oldSessionResult = import("/src/shared/api/client.js").then(
        ({ getJson }) =>
          getJson("/old-session-request").catch((error) => error.status),
      );
    });
    await oldRequestStarted;
    await page
      .getByLabel("Mật khẩu hiện tại", { exact: true })
      .fill("MatKhauCu123!");
    await page
      .getByLabel("Mật khẩu mới (ít nhất 10 ký tự)", { exact: true })
      .fill("MatKhauMoi123!");
    await page
      .getByLabel("Nhập lại mật khẩu mới", { exact: true })
      .fill("MatKhauMoi123!");
    await page
      .getByRole("button", {
        name: "Đổi mật khẩu và kết thúc mọi phiên",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/dang-nhap$/);
    await expect(
      page.getByRole("heading", { name: "Đăng nhập", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Số điện thoại hoặc tài khoản căn hộ", { exact: true })
      .fill(sessionUser.so_dien_thoai);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("SaiMatKhau123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Số điện thoại hoặc mật khẩu không đúng.",
    );
    await expect(page).toHaveURL(/\/dang-nhap$/);

    await page.getByLabel("Mật khẩu", { exact: true }).fill("MatKhauDung123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/quan-tri$/);
    await expect(
      page.getByLabel(`Tùy chọn tài khoản ${sessionUser.ho_va_ten}`, {
        exact: true,
      }),
    ).toBeVisible();
    releaseOldRequest();
    expect(await page.evaluate(() => window.oldSessionResult)).toBe(401);
    await expect(
      page.getByLabel(`Tùy chọn tài khoản ${sessionUser.ho_va_ten}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/quan-tri$/);
  } finally {
    releaseOldRequest();
  }
});

test("phiên hết hạn trên biểu mẫu QR giữ nội dung và ảnh, không tự gửi lại dưới vai trò khách", async ({
  page,
}) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({ json: { data: sessionUser } }),
  );
  await page.route(`**/api/cong_khai/vi_tri_qr/${token}`, (route) =>
    route.fulfill({
      json: { data: { ten_vi_tri: "Sảnh thử phiên hết hạn", mo_ta: "" } },
    }),
  );
  let submissions = 0;
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    submissions++;
    return submissions === 1
      ? route.fulfill({ status: 401, json: sessionExpired })
      : route.fulfill({
          status: 201,
          json: { data: { ma_tra_cuu: "a".repeat(64) } },
        });
  });
  await page.goto(`/r/${token}`);
  await expect(
    page.getByRole("heading", { name: "Sảnh thử phiên hết hạn", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("Đèn sảnh cần sửa khi phiên hết hạn");
  await page
    .getByLabel("Mô tả chi tiết", { exact: true })
    .fill("Đèn không sáng, vui lòng kiểm tra và sửa giúp.");
  await page.getByLabel("Loại sự cố", { exact: true }).selectOption("NUOC");
  await page.getByLabel("Căn hộ (tùy chọn)", { exact: true }).fill("A701");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page
      .getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true })
      .click(),
  ]);
  await chooser.setFiles({
    name: "session-draft.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#77aa88" },
    })
      .png()
      .toBuffer(),
  });
  await expect(
    page.getByAltText("Xem trước session-draft.jpg", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText("Phiên đã hết hạn");
  await expect(
    page
      .locator(".top-links")
      .getByRole("link", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/r/${token}$`));
  await expect(page.getByLabel("Tiêu đề", { exact: true })).toHaveValue(
    "Đèn sảnh cần sửa khi phiên hết hạn",
  );
  await expect(page.getByLabel("Mô tả chi tiết", { exact: true })).toHaveValue(
    "Đèn không sáng, vui lòng kiểm tra và sửa giúp.",
  );
  await expect(page.getByLabel("Loại sự cố", { exact: true })).toHaveValue(
    "NUOC",
  );
  await expect(page.getByLabel("Họ tên", { exact: true })).toHaveValue(
    sessionUser.ho_va_ten,
  );
  await expect(page.getByLabel("Số điện thoại", { exact: true })).toHaveValue(
    sessionUser.so_dien_thoai,
  );
  await expect(
    page.getByLabel("Căn hộ (tùy chọn)", { exact: true }),
  ).toHaveValue("A701");
  await expect(
    page.getByAltText("Xem trước session-draft.jpg", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    /phiên.*hết hạn|đăng nhập lại/i,
  );
  await expect(
    page.getByRole("button", { name: "Gửi phản ánh", exact: true }),
  ).toBeEnabled();
  expect(submissions).toBe(1);
  await expect(
    page.getByAltText("Xem trước session-draft.jpg", { exact: true }),
  ).toBeVisible();
});

test("cookie hết hạn ngay khi mở trang hiển thị hướng dẫn đăng nhập lại", async ({
  page,
}) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({ status: 401, json: sessionExpired }),
  );
  await page.goto("/dang-nhap");

  await expect(
    page.getByRole("status").filter({ hasText: "Phiên đã hết hạn" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
});

test("tải báo cáo trả 401 cập nhật AuthContext và mở lại trang đăng nhập", async ({
  page,
}) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({ json: { data: sessionUser } }),
  );
  await page.route(
    (url) => url.pathname === "/api/phuong_tien",
    (route) => route.fulfill({ json: { data: [], page: 1, total: 0 } }),
  );
  await page.route(
    (url) => url.pathname === "/api/trao_doi_du_lieu/phuong_tien/xuat",
    (route) => route.fulfill({ status: 401, json: sessionExpired }),
  );
  await page.goto("/quan-tri/phuong-tien");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();

  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(
    page.getByRole("status").filter({ hasText: "Phiên đã hết hạn" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".top-links")
      .getByRole("link", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
});
