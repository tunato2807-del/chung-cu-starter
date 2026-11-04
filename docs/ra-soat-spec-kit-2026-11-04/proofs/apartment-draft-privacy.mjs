import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import serverlessChromium from "@sparticuz/chromium";

// Two legitimate owners have the same billing-account ID but different resident
// IDs. API stubs change the owner after reload; all form/draft code is real.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const port = 5187,
  token = "00000000-0000-4000-8000-000000000001";
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "frontend",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let browser;
try {
  await Promise.race([
    new Promise((resolve) =>
      vite.stdout.on("data", (data) => {
        if (String(data).includes("Local:")) resolve();
      }),
    ),
    once(vite, "exit").then(() => {
      throw new Error("Vite did not start");
    }),
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Vite start timeout")),
        20000,
      );
      timer.unref();
    }),
  ]);
  browser = await chromium.launch({
    executablePath:
      process.env.UI_QA_CHROMIUM || (await serverlessChromium.executablePath()),
    headless: true,
    args: serverlessChromium.args.filter((arg) => arg !== "--single-process"),
  });
  const page = await browser.newPage();
  let resident = 12;
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/xac_thuc/toi")
        return route.fulfill({
          json: {
            data: {
              ma_nguoi_dung: 7,
              ma_can_ho_thanh_toan: 3,
              ma_cu_dan: resident,
              vai_tro: "CU_DAN",
              ho_va_ten: resident === 12 ? "Owner A" : "Owner B",
              phien_ban_token: resident,
            },
          },
        });
      if (pathname === `/api/cong_khai/vi_tri_qr/${token}`)
        return route.fulfill({
          json: { data: { ten_vi_tri: "Vị trí thử bản nháp", mo_ta: "" } },
        });
      return route.fulfill({ json: { data: [], total: 0, chua_doc: 0 } });
    },
  );
  await page.goto(`http://127.0.0.1:${port}/r/${token}`);
  const title = page.locator('[name="tieu_de"]'),
    name = page.locator('[name="ten_nguoi_gui"]');
  await title.waitFor();
  await title.fill("Nội dung nháp riêng của chủ A");
  await page
    .locator('[name="noi_dung"]')
    .fill("Mô tả hiện trường riêng của chủ A cần giữ kín.");
  await name.fill("Tên riêng của chủ A");
  await page.locator('[name="so_dien_thoai"]').fill("0901111111");
  const saved = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)),
    `chung-cu:report-draft:${token}:7`,
  );
  assert.equal(saved.values.tieu_de, "Nội dung nháp riêng của chủ A");
  resident = 13;
  await page.reload();
  await title.waitFor();
  const current = await page.evaluate(() =>
    fetch("/api/xac_thuc/toi").then((r) => r.json()),
  );
  const leaked = {
    title: await title.inputValue(),
    body: await page.locator('[name="noi_dung"]').inputValue(),
    name: await name.inputValue(),
    phone: await page.locator('[name="so_dien_thoai"]').inputValue(),
  };
  assert.equal(current.data.ma_cu_dan, 13);
  assert.equal(leaked.title, "Nội dung nháp riêng của chủ A");
  assert.equal(leaked.body, "Mô tả hiện trường riêng của chủ A cần giữ kín.");
  assert.equal(leaked.name, "Tên riêng của chủ A");
  assert.equal(leaked.phone, "0901111111");
  console.log(
    JSON.stringify({
      evidenceFor: "d226254",
      databaseAccess: false,
      sameBrowserTab: true,
      currentResident: current.data.ma_cu_dan,
      previousResidentDraftVisible: true,
      leakedFields: Object.keys(leaked),
    }),
  );
} finally {
  await browser?.close();
  if (vite.exitCode === null) {
    vite.kill("SIGTERM");
    await once(vite, "exit");
  }
}
