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
      json: { data: { ten_vi_tri: "Thử camera trong trang", mo_ta: "" } },
    }),
  );
  await page.goto("/r/00000000-0000-4000-8000-000000000011");
  await page.locator('[name="tieu_de"]').fill("Đèn sảnh không sáng");
  await page
    .locator('[name="noi_dung"]')
    .fill("Đèn sảnh không sáng từ buổi sáng hôm nay.");
  await page.locator('[name="ten_nguoi_gui"]').fill("Người thử camera");
  await page.locator('[name="so_dien_thoai"]').fill("0901234567");
});

async function fakeCamera(page, deferred = false) {
  await page.evaluate((wait) => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    context.fillStyle = "#4488aa";
    context.fillRect(0, 0, 320, 240);
    const stream = canvas.captureStream(10);
    const timer = setInterval(() => {
      if (stream.getTracks().every((track) => track.readyState === "ended")) {
        clearInterval(timer);
        return;
      }
      context.fillRect(0, 0, 320, 240);
    }, 50);
    window.__photoStream = stream;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () =>
        wait
          ? new Promise((resolve) => {
              window.__resolvePhotoCamera = () => resolve(stream);
            })
          : Promise.resolve(stream),
    });
  }, deferred);
}

test("capture creates a visible JPEG, attaches it to FormData and stops the camera", async ({
  page,
}) => {
  await fakeCamera(page);
  let submitted;
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    submitted = route.request().postDataBuffer();
    return route.fulfill({
      status: 201,
      json: { data: { ma_tra_cuu: "b".repeat(64) } },
    });
  });
  await page.getByRole("button", { name: "Chụp ảnh", exact: true }).click();
  const capture = page.getByRole("button", {
    name: "Chụp ảnh này",
    exact: true,
  });
  await expect(capture).toBeEnabled();
  await capture.click();
  await expect(page.getByText("Đã chọn 1 ảnh.", { exact: true })).toBeVisible();
  const preview = page.getByRole("img", { name: /Xem trước hien-truong-/ });
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((img) => img.naturalWidth))
    .toBe(320);
  await expect(
    page.getByRole("group", { name: "Camera chụp ảnh hiện trường" }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__photoStream
          .getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
  await expect(page.locator('[name="tieu_de"]')).toHaveValue(
    "Đèn sảnh không sáng",
  );
  expect(submitted).toBeUndefined();
  const attached = await page
    .locator('input[type="file"]')
    .evaluate((input) => {
      const files = new FormData(input.form).getAll("hinh_anh");
      return { count: files.length, type: files[0].type, size: files[0].size };
    });
  expect(attached.count).toBe(1);
  expect(attached.type).toBe("image/jpeg");
  expect(attached.size).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
  ).toBeVisible();
  expect(submitted.toString("utf8")).toMatch(/filename="hien-truong-\d+\.jpg"/);
  const start = submitted.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  const end = submitted.indexOf(Buffer.from([0xff, 0xd9]), start) + 2;
  const image = await sharp(submitted.subarray(start, end)).metadata();
  expect(image.format).toBe("jpeg");
  expect(image.width).toBe(320);
  expect(image.height).toBe(240);
});

test("denied camera permission preserves typed content and allows library selection", async ({
  page,
}) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Denied", "NotAllowedError");
      },
    }),
  );
  await page.getByRole("button", { name: "Chụp ảnh", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Bạn chưa cho phép Camera",
  );
  await expect(page.locator('[name="tieu_de"]')).toHaveValue(
    "Đèn sảnh không sáng",
  );
  await expect(
    page.getByRole("button", { name: "Chọn ảnh từ thư viện" }),
  ).toBeEnabled();
  const image = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#4488aa" },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: image });
  await expect(page.getByAltText("Xem trước photo.jpg")).toBeVisible();
});

test("closing a pending camera or leaving the form stops its stream", async ({
  page,
}) => {
  await fakeCamera(page, true);
  await page.getByRole("button", { name: "Chụp ảnh", exact: true }).click();
  await page.getByRole("button", { name: "Đóng camera", exact: true }).click();
  await page.evaluate(() => window.__resolvePhotoCamera());
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__photoStream
          .getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("group", { name: "Camera chụp ảnh hiện trường" }),
  ).toHaveCount(0);
  await fakeCamera(page);
  await page.getByRole("button", { name: "Chụp ảnh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Chụp ảnh này", exact: true }),
  ).toBeEnabled();
  await page.locator("a.brand").click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__photoStream
          .getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
});
