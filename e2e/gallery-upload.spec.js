import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." } },
    }),
  );
  await page.route("**/api/cong_khai/vi_tri_qr/*", (route) =>
    route.fulfill({
      json: { data: { ten_vi_tri: "Thử ảnh thư viện", mo_ta: "" } },
    }),
  );
  await page.goto("/r/00000000-0000-4000-8000-000000000021");
  await page.locator('[name="tieu_de"]').fill("Ảnh từ thư viện điện thoại");
  await page
    .locator('[name="noi_dung"]')
    .fill("Kiểm tra gửi ảnh thư viện cùng nội dung phản ánh.");
  await page.locator('[name="ten_nguoi_gui"]').fill("Người thử thư viện");
  await page.locator('[name="so_dien_thoai"]').fill("0901234567");
});

test("large library JPEG with missing MIME is resized, previewed and sent after native FileList is cleared", async ({
  page,
}) => {
  const jpeg = await sharp({
    create: { width: 3000, height: 4000, channels: 3, background: "#77aa88" },
  })
    .jpeg()
    .toBuffer();
  const original = Buffer.concat([jpeg, Buffer.alloc(6 * 1024 * 1024)]);
  let payload;
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    payload = route.request().postDataBuffer();
    return route.fulfill({
      status: 201,
      json: { data: { ma_tra_cuu: "c".repeat(64) } },
    });
  });
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "anh-thu-vien", mimeType: "", buffer: original });
  await expect(page.getByText("Đã chọn 1 ảnh.", { exact: true })).toBeVisible();
  const image = page.getByAltText("Xem trước anh-thu-vien.jpg");
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img) => img.naturalHeight))
    .toBe(1600);
  const files = await page.locator('input[type="file"]').evaluate((input) => {
    const data = new FormData(input.form),
      file = data.get("hinh_anh");
    return {
      native: input.files.length,
      count: data.getAll("hinh_anh").length,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  });
  expect(files.native).toBe(0);
  expect(files.count).toBe(1);
  expect(files.name).toBe("anh-thu-vien.jpg");
  expect(files.size).toBeLessThan(5 * 1024 * 1024);
  expect(files.type).toBe("image/jpeg");
  await expect(page.locator('[name="tieu_de"]')).toHaveValue(
    "Ảnh từ thư viện điện thoại",
  );
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
  ).toBeVisible();
  expect(payload.toString("utf8")).toContain('filename="anh-thu-vien.jpg"');
  const start = payload.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  const end = payload.indexOf(Buffer.from([0xff, 0xd9]), start) + 2;
  const saved = await sharp(payload.subarray(start, end)).metadata();
  expect(saved.height).toBe(1600);
  expect(saved.width).toBe(1200);
});

test("submitting while decoding is blocked until the processed image is ready", async ({
  page,
}) => {
  await page.evaluate(() => {
    const original = window.createImageBitmap.bind(window);
    window.createImageBitmap = (...args) =>
      new Promise((resolve, reject) => {
        window.__resumeImage = () => original(...args).then(resolve, reject);
      });
  });
  let submissions = 0;
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    submissions++;
    return route.fulfill({
      status: 201,
      json: { data: { ma_tra_cuu: "d".repeat(64) } },
    });
  });
  const buffer = await sharp({
    create: { width: 40, height: 20, channels: 3, background: "#77aa88" },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer });
  await expect(page.getByText("Đang xử lý ảnh, vui lòng chờ…")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => typeof window.__resumeImage))
    .toBe("function");
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Ảnh đang được xử lý");
  expect(submissions).toBe(0);
  await page.evaluate(() => window.__resumeImage());
  await expect(page.getByAltText("Xem trước photo.jpg")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
  ).toBeVisible();
  expect(submissions).toBe(1);
});
