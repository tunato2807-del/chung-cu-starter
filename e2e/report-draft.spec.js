import { test, expect } from "@playwright/test";
import sharp from "sharp";

const token = "00000000-0000-4000-8000-000000000001";
const otherToken = "00000000-0000-4000-8000-000000000002";
const storageKey = `chung-cu:report-draft:${token}:guest`;
const formValues = {
  tieu_de: "Đèn hành lang bị hỏng",
  noi_dung: "Đèn không sáng từ tối qua, vui lòng kiểm tra.",
  ten_nguoi_gui: "Người thử form",
  so_dien_thoai: "0901234567",
  can_ho_khai_bao: "A101",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." } },
    }),
  );
  await page.route("**/api/cong_khai/vi_tri_qr/*", (route) =>
    route.fulfill({
      json: { data: { ten_vi_tri: "Sảnh thử lưu nháp", mo_ta: "" } },
    }),
  );
  await page.goto(`/r/${token}`);
  await expect(
    page.getByRole("heading", { name: "Sảnh thử lưu nháp" }),
  ).toBeVisible();
});

async function fill(page) {
  for (const [name, value] of Object.entries(formValues))
    await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="loai_su_co"]').selectOption("NUOC");
}
async function unchanged(page) {
  for (const [name, value] of Object.entries(formValues))
    await expect(page.locator(`[name="${name}"]`)).toHaveValue(value);
  await expect(page.locator('[name="loai_su_co"]')).toHaveValue("NUOC");
}
async function choose(page, button) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: button, exact: true }).click(),
  ]);
  return chooser;
}
async function photo() {
  return {
    name: "photo.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#77aa88" },
    })
      .png()
      .toBuffer(),
  };
}

test("gallery selection and cancellation preserve fields and never submit the form", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    submissions++;
    return route.fulfill({ json: { data: { ma_tra_cuu: "a".repeat(64) } } });
  });
  await fill(page);
  const gallery = await choose(page, "Chọn ảnh từ thư viện");
  expect(gallery.isMultiple()).toBe(true);
  await gallery.setFiles([]);
  await unchanged(page);
  const selected = await choose(page, "Chọn ảnh từ thư viện");
  await selected.setFiles(await photo());
  await expect(page.getByText("Đã chọn 1 ảnh.", { exact: true })).toBeVisible();
  await expect(page.getByAltText("Xem trước photo.jpg")).toBeVisible();
  await unchanged(page);
  expect(submissions).toBe(0);
  await page.getByRole("button", { name: "Bỏ ảnh đã chọn" }).click();
  await expect(page.getByText("Chưa chọn ảnh.", { exact: true })).toBeVisible();
  await unchanged(page);
});

test("reload restores draft and request key; successful upload clears draft", async ({
  page,
}) => {
  await fill(page);
  const before = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)),
    storageKey,
  );
  await (await choose(page, "Chọn ảnh từ thư viện")).setFiles(await photo());
  // File selection finishes before asynchronous resize/decoding does.
  await expect(page.getByAltText("Xem trước photo.jpg")).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Đã khôi phục nội dung bản nháp/)).toBeVisible();
  await unchanged(page);
  await expect(page.getByText("Chưa chọn ảnh.", { exact: true })).toBeVisible();
  const after = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)),
    storageKey,
  );
  expect(after.requestKey).toBe(before.requestKey);
  await (await choose(page, "Chọn ảnh từ thư viện")).setFiles(await photo());
  // File selection finishes before asynchronous resize/decoding does.
  await expect(page.getByAltText("Xem trước photo.jpg")).toBeVisible();
  let payload = "";
  await page.route("**/api/cong_khai/phan_anh", (route) => {
    payload = route.request().postDataBuffer().toString("utf8");
    return route.fulfill({
      status: 201,
      json: { data: { ma_tra_cuu: "a".repeat(64) } },
    });
  });
  await page.getByRole("button", { name: "Gửi phản ánh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
  ).toBeVisible();
  expect(payload).toContain(formValues.tieu_de);
  expect(payload).toContain(before.requestKey);
  expect(payload).toContain('filename="photo.jpg"');
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
  ).toBeNull();
  await page.reload();
  await expect(page.locator('[name="tieu_de"]')).toHaveValue("");
});

test("drafts are isolated by QR and account and expired drafts are removed", async ({
  page,
}) => {
  await fill(page);
  await page.goto(`/r/${otherToken}`);
  await expect(page.locator('[name="tieu_de"]')).toHaveValue("");
  await page.goto(`/r/${token}`);
  await unchanged(page);
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      json: {
        data: {
          ma_nguoi_dung: 91,
          ho_va_ten: "Tài khoản khác",
          so_dien_thoai: "0905555555",
          vai_tro: "CU_DAN",
        },
      },
    }),
  );
  await page.reload();
  await expect(page.locator('[name="tieu_de"]')).toHaveValue("");
  await expect(page.locator('[name="ten_nguoi_gui"]')).toHaveValue(
    "Tài khoản khác",
  );
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." } },
    }),
  );
  await page.evaluate((key) => {
    const draft = JSON.parse(sessionStorage.getItem(key));
    draft.savedAt = Date.now() - 3 * 60 * 60 * 1000;
    sessionStorage.setItem(key, JSON.stringify(draft));
  }, storageKey);
  await page.reload();
  await expect(page.locator('[name="tieu_de"]')).toHaveValue("");
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
  ).toBeNull();
});

test("blocked storage and invalid uploads keep text editable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    }),
  );
  await page.reload();
  await fill(page);
  await expect(page.getByText(/Trình duyệt không cho lưu nháp/)).toBeVisible();
  await (
    await choose(page, "Chọn ảnh từ thư viện")
  ).setFiles({
    name: "large.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText(/25 MB/);
  await unchanged(page);
  await (await choose(page, "Chọn ảnh từ thư viện")).setFiles(await photo());
  await expect(page.getByText("Đã chọn 1 ảnh.", { exact: true })).toBeVisible();
  await unchanged(page);
});
