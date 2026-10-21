import { test, expect } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`photo carousel: local photographs, autoplay, pause, manual navigation and offscreen at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      hasTouch: width === 375,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.clock.install();
      await page.goto("/");
      const gallery = page.getByRole("region", {
        name: "Ảnh minh họa không gian sống",
      });
      await expect(gallery).toHaveAttribute("data-playing", "true");
      await expect
        .poll(() =>
          gallery
            .locator("img")
            .evaluateAll((images) =>
              images.every((img) => img.complete && img.naturalWidth > 0),
            ),
        )
        .toBe(true);
      await expect(gallery).toHaveAttribute("data-slide", "1");
      await page.clock.fastForward(6100);
      await expect(gallery).toHaveAttribute("data-slide", "2");
      if (width === 1440) {
        await gallery.locator(".photo-carousel-viewport").hover();
        await expect(gallery).toHaveAttribute("data-playing", "false");
        await page.clock.fastForward(13000);
        await expect(gallery).toHaveAttribute("data-slide", "2");
        await page.mouse.move(0, 0);
      }
      const activate = (locator) =>
        width === 375 ? locator.tap() : locator.click();
      await activate(
        gallery.getByRole("button", {
          name: "Dừng tự động chuyển ảnh",
          exact: true,
        }),
      );
      await page.mouse.move(0, 0);
      await page.clock.fastForward(13000);
      await expect(gallery).toHaveAttribute("data-slide", "2");
      await activate(
        gallery.getByRole("button", { name: "Ảnh tiếp theo", exact: true }),
      );
      await expect(gallery).toHaveAttribute("data-slide", "3");
      await gallery
        .getByRole("button", { name: "Xem ảnh 1", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(gallery).toHaveAttribute("data-slide", "1");
      await activate(
        gallery.getByRole("button", {
          name: "Bật tự động chuyển ảnh",
          exact: true,
        }),
      );
      await page.mouse.move(0, 0);
      await expect(gallery).toHaveAttribute("data-playing", "true");
      // Một trang desktop ngắn vẫn thấy ảnh khi footer vừa vào viewport cao.
      // Dùng cửa sổ thấp để thực sự cuộn toàn bộ khung ảnh ra ngoài màn hình.
      await page.setViewportSize({ width, height: 400 });
      await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
      await expect(gallery).toHaveAttribute("data-playing", "false");
      await page.clock.fastForward(13000);
      await expect(gallery).toHaveAttribute("data-slide", "1");
      await page.setViewportSize({ width, height: 900 });
      await gallery.scrollIntoViewIfNeeded();
      await expect(gallery).toHaveAttribute("data-playing", "true");
      await page.clock.fastForward(6100);
      await expect(gallery).toHaveAttribute("data-slide", "2");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("photo carousel respects reduced motion and changing photos never resets or submits the login form", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  let submissions = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/xac_thuc/dang_nhap")
      submissions++;
  });
  try {
    await page.clock.install();
    await page.goto("/dang-nhap");
    const gallery = page.getByRole("region", {
      name: "Ảnh minh họa không gian sống",
    });
    await expect(gallery).toHaveAttribute("data-playing", "false");
    await expect(gallery.locator(".is-current img")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.clock.fastForward(30000);
    await expect(gallery).toHaveAttribute("data-slide", "1");
    const phone = page.getByLabel("Số điện thoại hoặc tài khoản căn hộ");
    const password = page.getByLabel("Mật khẩu", { exact: true });
    await phone.fill("0901234567");
    await password.fill("mat-khau-thu-khong-dang-nhap");
    await gallery
      .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
      .click();
    await expect(gallery).toHaveAttribute("data-slide", "2");
    await expect(phone).toHaveValue("0901234567");
    await expect(password).toHaveValue("mat-khau-thu-khong-dang-nhap");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gallery
      .getByRole("button", { name: "Bật tự động chuyển ảnh", exact: true })
      .click();
    await page.mouse.move(0, 0);
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery).toHaveAttribute("data-playing", "true");
    await page.clock.fastForward(6100);
    await expect(gallery).toHaveAttribute("data-slide", "3");
    await expect(phone).toHaveValue("0901234567");
    await expect(password).toHaveValue("mat-khau-thu-khong-dang-nhap");
    expect(submissions).toBe(0);
  } finally {
    await context.close();
  }
});

test("missing photo files show a fallback and leave the login form usable", async ({
  page,
}) => {
  await page.route("**/images/residences/*", (route) => route.abort());
  await page.goto("/dang-nhap");
  const gallery = page.getByRole("region", {
    name: "Ảnh minh họa không gian sống",
  });
  await expect(gallery.locator(".is-current .photo-fallback")).toBeVisible();
  await expect(gallery).toHaveAttribute("data-playing", "false");
  const phone = page.getByLabel("Số điện thoại hoặc tài khoản căn hộ");
  await phone.fill("0901234567");
  await gallery
    .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
    .click();
  await expect(phone).toHaveValue("0901234567");
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeEnabled();
});
