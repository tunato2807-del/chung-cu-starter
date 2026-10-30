import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../../../", import.meta.url));
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--config",
    "frontend/vite.config.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5186",
    "--strictPort",
    "frontend",
  ],
  { cwd, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "",
  browser;
vite.stdout.on("data", (value) => (logs += value));
vite.stderr.on("data", (value) => (logs += value));
try {
  for (let i = 0; i < 80; i++) {
    if (vite.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch("http://127.0.0.1:5186")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.UI_QA_CHROMIUM || "/tmp/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote"],
  });
  const page = await browser.newPage();
  let signedIn = false,
    expired = false;
  const user = {
    ma_nguoi_dung: 900,
    ho_va_ten: "BQL dữ liệu kiểm tra",
    vai_tro: "QUAN_TRI_VIEN",
  };
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    (route) => {
      const endpoint = new URL(route.request().url()).pathname;
      if (endpoint === "/api/xac_thuc/dang_nhap") {
        signedIn = true;
        return route.fulfill({ json: { data: user } });
      }
      if (endpoint === "/api/xac_thuc/toi" && signedIn && !expired)
        return route.fulfill({ json: { data: user } });
      if (expired || endpoint === "/api/xac_thuc/toi")
        return route.fulfill({
          status: 401,
          json: {
            error: {
              code: "SESSION_EXPIRED",
              message: "Phiên đã hết hạn. Vui lòng đăng nhập lại.",
            },
          },
        });
      return route.fulfill({
        status: 503,
        json: {
          error: {
            code: "FIXTURE",
            message:
              "Không có dữ liệu nghiệp vụ trong kịch bản chỉ kiểm tra phiên.",
          },
        },
      });
    },
  );
  await page.goto("http://127.0.0.1:5186/dang-nhap");
  await page
    .getByLabel("Số điện thoại hoặc tài khoản căn hộ")
    .fill("0900000000");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("ReviewOnlyNotARealPassword");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/quan-tri");
  await page
    .getByRole("button", { name: "Cập nhật số liệu", exact: true })
    .waitFor();
  expired = true;
  await page
    .getByRole("button", { name: "Cập nhật số liệu", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Phiên đã hết hạn" })
    .waitFor();
  await page.evaluate(() => {
    history.pushState({}, "", "/dang-nhap");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForURL("**/quan-tri");
  const loginFormsAfterSpaNavigation = await page
    .getByRole("heading", { name: "Đăng nhập", exact: true })
    .count();
  assert.equal(loginFormsAfterSpaNavigation, 0);
  await page.reload();
  await page.getByRole("heading", { name: "Đăng nhập", exact: true }).waitFor();
  console.log(
    JSON.stringify(
      {
        harness: "API stubs only; no credentials or database accessed",
        observed:
          "401 does not clear React user; SPA login redirects back to protected page",
        loginFormsAfterSpaNavigation,
        hardReloadRecoversLogin: true,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  vite.kill("SIGTERM");
}
