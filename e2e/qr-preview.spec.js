import { test, expect } from "@playwright/test";
import QRCode from "qrcode";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const locations = [
  {
    ma_vi_tri_qr: 11,
    ten_vi_tri: "Bãi xe khối D",
    token_qr: "00000000-0000-4000-8000-000000000011",
    loai: "KHU_VUC",
    dang_hoat_dong: 1,
    phien_ban: 0,
  },
  {
    ma_vi_tri_qr: 12,
    ten_vi_tri: "Cổng ra vào khối D",
    token_qr: "00000000-0000-4000-8000-000000000012",
    loai: "KHU_VUC",
    dang_hoat_dong: 1,
    phien_ban: 0,
  },
  {
    ma_vi_tri_qr: 13,
    ten_vi_tri: "Lối thoát hiểm khối D",
    token_qr: "00000000-0000-4000-8000-000000000013",
    loai: "KHU_VUC",
    dang_hoat_dong: 0,
    phien_ban: 0,
  },
];

test.beforeEach(async ({ page }) => {
  // All API responses are fixtures; no real account or database is accessed.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/xac_thuc/toi")
        return route.fulfill({
          json: {
            data: {
              ma_nguoi_dung: 1,
              ho_va_ten: "Quản trị kiểm thử",
              vai_tro: "QUAN_TRI_VIEN",
            },
          },
        });
      if (url.pathname === "/api/vi_tri_qr")
        return route.fulfill({
          json: { data: locations, total: locations.length, page: 1 },
        });
      return route.fulfill({ json: { data: [], total: 0, page: 1 } });
    },
  );
});

async function expectQr(image, url) {
  const expected = await QRCode.toBuffer(url, {
    width: 512,
    margin: 3,
    errorCorrectionLevel: "M",
  });
  const pixels = (buffer) => sharp(buffer).ensureAlpha().raw().toBuffer();
  expect(await pixels(image)).toEqual(await pixels(expected));
}

for (const width of [1440, 375]) {
  test(`QR-only preview stays by its trigger, dismisses and switches correctly at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/quan-tri/vi-tri-qr");
    const row = page
      .locator(".location-list > li")
      .filter({ hasText: locations[0].ten_vi_tri });
    const trigger = row.getByRole("button", { name: "Xem QR", exact: true });
    await trigger.click();
    const preview = page.getByRole("dialog", {
      name: `Mã QR ${locations[0].ten_vi_tri}`,
      exact: true,
    });
    const image = preview.getByRole("img");
    await expect(image).toBeVisible();
    await expect(preview).toBeFocused();
    expect((await preview.textContent()).trim()).toBe("");
    await expect(preview.locator("button,a,h1,h2,p")).toHaveCount(0);
    await expect(page.locator(".qr-print")).toHaveCount(0);
    await expect(
      page.getByText("In mã tại vị trí", { exact: true }),
    ).toHaveCount(0);
    const box = await preview.boundingBox(),
      anchor = await trigger.boundingBox();
    expect(box.width).toBeLessThanOrEqual(260);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(1000);
    expect(
      Math.min(
        Math.abs(box.y - anchor.y - anchor.height),
        Math.abs(box.y + box.height - anchor.y),
      ),
    ).toBeLessThanOrEqual(9);
    const src = await image.getAttribute("src");
    await expectQr(
      Buffer.from(src.split(",")[1], "base64"),
      `${new URL(page.url()).origin}/r/${locations[0].token_qr}`,
    );
    await page.screenshot({
      path: `/tmp/chung-cu-qr-popover-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(preview).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(preview).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(preview).toHaveCount(0);
    await expect(
      row.getByRole("button", { name: "Tải ảnh QR", exact: true }),
    ).toBeFocused();
    await trigger.click();
    // Click the page gutter, away from navigation links and the preview.
    await page.mouse.click(width - 8, 500);
    await expect(preview).toHaveCount(0);
    await trigger.click();
    await trigger.click();
    await expect(preview).toHaveCount(0);
    await trigger.click();
    const otherRow = page
      .locator(".location-list > li")
      .filter({ hasText: locations[1].ten_vi_tri });
    await otherRow.getByRole("button", { name: "Xem QR", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(
      page.getByAltText(`Mã QR ${locations[1].ten_vi_tri}`, { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const inactive = page
      .locator(".location-list > li")
      .filter({ hasText: locations[2].ten_vi_tri });
    for (const name of ["Xem QR", "Tải ảnh QR", "In mã này"])
      await expect(
        inactive.getByRole("button", { name, exact: true }),
      ).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test(`QR download and print keep the current origin and only print the code at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/quan-tri/vi-tri-qr");
    const row = page
      .locator(".location-list > li")
      .filter({ hasText: locations[0].ten_vi_tri });
    const downloadPromise = page.waitForEvent("download");
    await row.getByRole("button", { name: "Tải ảnh QR", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("vi-tri-11.png");
    const image = await readFile(await download.path());
    await expectQr(
      image,
      `${new URL(page.url()).origin}/r/${locations[0].token_qr}`,
    );
    await page.evaluate(() => {
      const originalOpen = window.open.bind(window);
      window.open = (...args) => {
        const popup = originalOpen(...args);
        if (popup)
          popup.print = () => {
            window.__qrPrint = {
              text: popup.document.body.textContent,
              images: [...popup.document.images].map((image) => image.src),
            };
            popup.dispatchEvent(new Event("afterprint"));
          };
        return popup;
      };
    });
    await row.getByRole("button", { name: "In mã này", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__qrPrint)).toBeTruthy();
    const printed = await page.evaluate(() => window.__qrPrint);
    expect(printed.text.trim()).toBe("");
    expect(printed.images).toHaveLength(1);
    await expectQr(
      Buffer.from(printed.images[0].split(",")[1], "base64"),
      `${new URL(page.url()).origin}/r/${locations[0].token_qr}`,
    );
    await expect(
      row.getByRole("link", { name: "Mở thử biểu mẫu", exact: true }),
    ).toHaveAttribute("href", `/r/${locations[0].token_qr}`);
  });
}
