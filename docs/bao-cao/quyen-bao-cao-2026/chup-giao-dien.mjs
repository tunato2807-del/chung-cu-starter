// Capture the current UI with explicitly synthetic API fixtures. No DB/env file.
import { createServer } from "vite";
import { chromium } from "playwright";
import browserBinary from "@sparticuz/chromium";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, "../../..");
const frontend = path.join(root, "frontend");
const token = "00000000-0000-4000-8000-000000000011";
let server, browser;
const errors = [],
  captures = [];
try {
  server = await createServer({
    root: frontend,
    configFile: path.join(frontend, "vite.config.js"),
    envDir: false,
    server: { host: "127.0.0.1", port: 0, strictPort: true },
  });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({
    executablePath: await browserBinary.executablePath(),
    args: browserBinary.args.filter((arg) => arg !== "--single-process"),
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  let admin = false;
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/xac_thuc/toi")
        return route.fulfill(
          admin
            ? {
                json: {
                  data: {
                    ma_nguoi_dung: 1,
                    ho_va_ten: "Ban quản lý",
                    vai_tro: "QUAN_TRI_VIEN",
                  },
                },
              }
            : {
                status: 401,
                json: {
                  error: { code: "UNAUTHORIZED", message: "Chưa đăng nhập." },
                },
              },
        );
      if (url.pathname.startsWith("/api/cong_khai/vi_tri_qr/"))
        return route.fulfill({
          json: {
            data: {
              ten_vi_tri: "Sảnh sinh hoạt khối A",
              mo_ta: "Khu sinh hoạt chung tại tầng 1",
              phien_ban_qr: 0,
              thiet_bi: null,
            },
          },
        });
      if (url.pathname === "/api/vi_tri_qr")
        return route.fulfill({
          json: {
            data: [
              {
                ma_vi_tri_qr: 11,
                ten_vi_tri: "Sảnh sinh hoạt khối A",
                loai: "KHU_VUC",
                token_qr: token,
                dang_hoat_dong: 1,
                phien_ban: 0,
              },
            ],
            total: 1,
            page: 1,
          },
        });
      if (url.pathname === "/api/cu_dan")
        return route.fulfill({
          json: {
            data: [
              {
                ma_cu_dan: 101,
                ho_va_ten: "Nguyễn Minh An",
                so_dien_thoai: "0900000101",
                so_can_ho: "A0101",
                ma_can_ho: 1,
                quan_he: "CHU_HO",
              },
              {
                ma_cu_dan: 102,
                ho_va_ten: "Trần Thanh Hà",
                so_dien_thoai: "0900000102",
                so_can_ho: "A0101",
                ma_can_ho: 1,
                quan_he: "THANH_VIEN",
              },
              {
                ma_cu_dan: 103,
                ho_va_ten: "Lê Hoàng Nam",
                so_dien_thoai: "0900000103",
                so_can_ho: "A0102",
                ma_can_ho: 2,
                quan_he: "NGUOI_THUE",
              },
            ],
            total: 3,
            page: 1,
          },
        });
      return route.fulfill({ json: { data: [], total: 0, page: 1 } });
    },
  );
  const save = async (name, details, options = {}) => {
    await page.screenshot({
      path: path.join(output, "hinh", name),
      ...options,
    });
    captures.push({
      file: name,
      route: new URL(page.url()).pathname,
      fixture: true,
      viewport: page.viewportSize(),
      details,
    });
  };
  await page.goto(`${origin}/dang-nhap`);
  await page.getByRole("heading", { name: "Đăng nhập", exact: true }).waitFor();
  // Crop to our form; third-party carousel photographs are not reproduced.
  await page
    .locator(".auth-form")
    .screenshot({ path: path.join(output, "hinh", "giao-dien-dang-nhap.png") });
  captures.push({
    file: "giao-dien-dang-nhap.png",
    fixture: true,
    viewport: page.viewportSize(),
    details:
      "Current form only; no real account/login attempt; third-party photographs excluded.",
  });
  await page.setViewportSize({ width: 375, height: 950 });
  await page.goto(`${origin}/r/${token}`);
  const form = page.getByRole("heading", {
    name: "Sảnh sinh hoạt khối A",
    exact: true,
  });
  await form.waitFor();
  await form.scrollIntoViewIfNeeded();
  await save(
    "giao-dien-phan-anh.png",
    "Current public form, synthetic location; no camera or submission test.",
  );

  admin = true;
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(`${origin}/quan-tri/vi-tri-qr`);
  const trigger = page.getByRole("button", { name: "Xem QR", exact: true });
  await trigger.click();
  const preview = page.getByRole("dialog", {
    name: "Mã QR Sảnh sinh hoạt khối A",
    exact: true,
  });
  await preview.getByRole("img").waitFor();
  const box = await preview.boundingBox(),
    anchor = await trigger.boundingBox();
  const y = Math.max(0, Math.min(box.y, anchor.y) - 45);
  await save(
    "giao-dien-qr.png",
    "Current QR-only popover with synthetic location; preview points to ephemeral test origin.",
    {
      clip: {
        x: Math.max(0, anchor.x - 20),
        y,
        width: Math.min(820, 1280 - anchor.x + 20),
        height: Math.min(440, 1000 - y),
      },
    },
  );
  await page.keyboard.press("Escape");
  await page.goto(`${origin}/quan-tri/cu-dan`);
  const table = page.getByRole("table").first();
  await table.waitFor();
  await table.screenshot({
    path: path.join(output, "hinh", "giao-dien-cu-dan.png"),
  });
  captures.push({
    file: "giao-dien-cu-dan.png",
    fixture: true,
    viewport: page.viewportSize(),
    details:
      "Synthetic residents; no real identities, phone numbers or DB accessed.",
  });
  if (errors.length) throw new Error(errors.join("\n"));
  await writeFile(
    path.join(output, "kiem-chung", "giao-dien.json"),
    JSON.stringify(
      {
        date: "2026-11-06",
        source_commit: "56ebfe8",
        scope: "UI screenshots with mocked API only",
        errors,
        captures,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Captured ${captures.length} UI illustrations; no page errors or real DB requests.`,
  );
} finally {
  await browser?.close();
  await server?.close();
}
