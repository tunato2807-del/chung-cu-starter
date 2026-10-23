import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { navigation } from "../../frontend/src/app/navigation.js";
const { chromium } = await import(
  pathToFileURL(process.env.UI_QA_PLAYWRIGHT).href
);
const origin = process.env.UI_QA_ORIGIN || "http://127.0.0.1:5182";
const output = process.env.UI_QA_OUTPUT || "/tmp/chung-cu-editorial-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.UI_QA_CHROMIUM,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-zygote",
    "--single-process",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [],
  failedRequests = [],
  report = {
    widths: [320, 768, 1024, 1440],
    axe: [],
    menuScreens: [],
    checks: [],
  };
let user = null;
page.on("pageerror", (error) => {
  errors.push(error.message);
  console.error("UI_PAGE_ERROR", error.message);
});
page.on("response", (response) => {
  if (!response.url().includes("/api/") && response.status() >= 400)
    failedRequests.push(response.url());
});
const overview = {
  tai_luc: "2026-10-23 07:00:00",
  ngay_hien_tai: "2026-10-23",
  tu_ngay_thu: "2026-10-01",
  den_ngay_thu: "2026-10-23",
  tai_chinh: {
    con_phai_thu: "12450000",
    can_con_no: 8,
    hoa_don_chua_thu: 12,
    thu_trong_thang: "38600000",
    no_qua_han: "4200000",
    hoa_don_qua_han: 3,
    hoa_don: [
      {
        ma_hoa_don: 11,
        so_hoa_don: "HD-202610-A101",
        so_can_ho: "A101",
        ky_thanh_toan: "2026-10",
        han_thanh_toan: "2026-10-20",
        qua_han: true,
        tong_tien: "1450000",
      },
    ],
  },
  phan_anh: {
    dang_mo: 7,
    moi: 3,
    da_phan_cong: 2,
    dang_xu_ly: 1,
    cho_nghiem_thu: 1,
    danh_sach: [
      {
        ma_phan_anh: 1,
        tieu_de: "Đèn hành lang tầng 2 chưa sáng",
        ten_vi_tri: "Khối A · Tầng 2",
        do_uu_tien: "CAO",
        ky_thuat_vien: "Kỹ thuật điện",
        trang_thai: "DANG_XU_LY",
      },
    ],
  },
  bao_tri: {
    phieu_qua_han: 2,
    thiet_bi_qua_han: 1,
    thiet_bi_sap_den_han: 3,
    cho_nghiem_thu: 1,
    danh_sach: [
      {
        ma_phieu_bao_tri: 1,
        tieu_de: "Kiểm tra thang máy định kỳ",
        ten_thiet_bi_luc_lap: "Thang máy A01",
        ngay_den_han: "2026-10-24",
        ky_thuat_vien: "Tổ kỹ thuật",
        trang_thai: "DA_PHAN_CONG",
      },
    ],
  },
  tien_ich: {
    cho_duyet: 4,
    da_duyet_hom_nay: 6,
    danh_sach: [
      {
        ma_dat_lich: 1,
        ten_tien_ich: "Phòng sinh hoạt cộng đồng",
        bat_dau: "2026-10-23 18:00:00",
        ket_thuc: "2026-10-23 20:00:00",
        so_can_ho: "A102",
        ten_nguoi_dat: "Cư dân kiểm thử",
        so_nguoi: 8,
        trang_thai: "CHO_DUYET",
      },
    ],
  },
};
await page.route(
  (url) => url.pathname.startsWith("/api/"),
  async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let status = 200,
      body;
    if (pathname === "/api/xac_thuc/toi") {
      status = user ? 200 : 401;
      body = user
        ? { data: user }
        : {
            error: { code: "UNAUTHENTICATED", message: "Bạn chưa đăng nhập." },
          };
    } else if (pathname === "/api/cua_toi/hoa_don/11") {
      body = {
        data: {
          so_hoa_don: "HD-KIEM-THU-UI",
          so_can_ho: "A101",
          ky_thanh_toan: "2026-10",
          ngay_chot_phi: "2026-10-23",
          han_thanh_toan: "2026-10-31",
          trang_thai: "DA_GUI",
          tong_tien: "1000000",
          nguoi_phu_trach_thanh_toan: "Cư dân kiểm thử",
          ma_ngan_hang: "970436",
          so_tai_khoan: "KHONG-PHAI-TAI-KHOAN-THAT",
          ten_nguoi_nhan: "DU LIEU KIEM THU UI",
          qr_payload: "UI-TEST-ONLY-NOT-A-PAYMENT-CODE",
          history: [],
          loi_du_lieu: [],
          lines: [
            {
              dien_giai: "Phí quản lý (kiểm thử)",
              so_luong: "75.000",
              don_vi_tinh: "m²",
              don_gia: "12000",
              thanh_tien: "900000",
            },
            {
              dien_giai: "Gửi xe máy (kiểm thử)",
              so_luong: "1.000",
              don_vi_tinh: "xe",
              don_gia: "100000",
              thanh_tien: "100000",
            },
          ],
        },
      };
    } else if (pathname === "/api/tong_quan") body = { data: overview };
    else if (pathname.endsWith("/thong_bao/chua_doc"))
      body = { data: { so_chua_doc: 0 } };
    else if (pathname === "/api/phan_anh")
      body = { data: [], meta: { page: 1, total: 0, page_size: 20 } };
    else if (pathname === "/api/can_ho/so_do")
      body = {
        data: {
          tong: {
            so_khoi: 1,
            so_tang: 1,
            so_can_ho: 2,
            co_nguoi_o: 1,
            trong: 1,
            so_cu_dan: 2,
          },
          khoi: [
            {
              khoi: "A",
              ten_khoi: "Khối A",
              so_can_ho: 2,
              trong: 1,
              so_cu_dan: 2,
              tang: [
                {
                  tang: 1,
                  ten_tang: "Tầng 1",
                  phien_ban: 1,
                  so_can_ho: 2,
                  co_nguoi_o: 1,
                  trong: 1,
                },
              ],
            },
          ],
        },
      };
    else if (pathname === "/api/can_ho")
      body = {
        data: [
          {
            ma_can_ho: 1,
            so_can_ho: "A101",
            khoi: "A",
            tang: 1,
            dien_tich_m2: "75.00",
            so_cu_dan: 2,
            trang_thai: "DANG_SU_DUNG",
            phien_ban: 1,
          },
          {
            ma_can_ho: 2,
            so_can_ho: "A102",
            khoi: "A",
            tang: 1,
            dien_tich_m2: "68.00",
            so_cu_dan: 0,
            trang_thai: "DANG_SU_DUNG",
            phien_ban: 1,
          },
        ],
        page: 1,
        total: 2,
      };
    else {
      status = 503;
      body = {
        error: {
          code: "UI_QA_UNAVAILABLE",
          message: "Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại.",
        },
      };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  },
);
async function goto(url) {
  await page.goto(origin + url);
  await page.waitForLoadState("networkidle");
}
async function checkLayout(label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    label,
  );
  assert.ok(await page.locator("#root").innerText(), label);
}
async function axe(label) {
  if (!process.env.UI_QA_AXE) return;
  await page.addScriptTag({ path: process.env.UI_QA_AXE });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  );
  report.axe.push({ label, violations });
  await writeFile(
    path.join(output, "axe-partial.json"),
    JSON.stringify(report.axe, null, 2),
  );
  assert.deepEqual(violations, [], label);
}
try {
  for (const width of report.widths) {
    await page.setViewportSize({ width, height: 1000 });
    await goto("/");
    await page.getByRole("heading", { name: /Sống an tâm/ }).waitFor();
    assert.equal(
      await page
        .getByRole("list", { name: "Danh sách dịch vụ" })
        .getByRole("listitem")
        .count(),
      6,
    );
    await checkLayout("portal " + width);
    await axe("portal " + width);
    await page.screenshot({
      path: path.join(output, `portal-${width}.png`),
      fullPage: true,
    });
  }
  for (const width of report.widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const url of ["/quet-qr", "/tra-cuu"]) {
      await goto(url);
      await checkLayout(url + " " + width);
      await axe(url + " " + width);
      if (width === 1440 || width === 320)
        await page.screenshot({
          path: path.join(output, `${url.slice(1)}-${width}.png`),
          fullPage: true,
        });
    }
  }
  await goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("searchbox", { name: "Tìm dịch vụ", exact: true })
    .fill("hoa don");
  assert.equal(
    await page
      .getByRole("list", { name: "Danh sách dịch vụ" })
      .getByRole("listitem")
      .count(),
    1,
  );
  await page
    .getByRole("link", { name: "Hóa đơn & thanh toán", exact: true })
    .click();
  await page
    .getByRole("heading", { level: 1, name: "Đăng nhập", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).pathname, "/dang-nhap");
  await axe("login 1440");
  await page.screenshot({
    path: path.join(output, "login-1440.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  await checkLayout("login 320");
  await axe("login 320");
  await page.screenshot({
    path: path.join(output, "login-320.png"),
    fullPage: true,
  });
  await goto("/");
  await page
    .getByRole("searchbox", { name: "Tìm dịch vụ", exact: true })
    .fill("khongtimthay");
  await page
    .getByRole("heading", { name: "Chưa tìm thấy dịch vụ phù hợp" })
    .waitFor();
  await page
    .getByRole("button", { name: "Xem tất cả dịch vụ", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Danh mục dịch vụ" })
    .getByRole("button", { name: "Phí & thanh toán", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("list", { name: "Danh sách dịch vụ" })
      .getByRole("listitem")
      .count(),
    1,
  );
  await goto("/");
  await page
    .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
    .click();
  assert.equal(
    await page.locator(".photo-carousel").getAttribute("data-slide"),
    "2",
  );
  await page.getByRole("button", { name: "Xem ảnh 1", exact: true }).click();
  assert.equal(
    await page.locator(".photo-carousel").getAttribute("data-slide"),
    "1",
  );
  report.checks.push(
    "service search accents/empty/reset/categories; login redirect; carousel controls",
  );
  for (const [role, screen] of [
    ["QUAN_TRI_VIEN", "/quan-tri"],
    ["CU_DAN", "/cu-dan/phan-anh"],
    ["KY_THUAT_VIEN", "/ky-thuat/cong-viec"],
  ]) {
    user = {
      ma_nguoi_dung: 1,
      vai_tro: role,
      ho_va_ten:
        role === "QUAN_TRI_VIEN" ? "Ban quản lý" : "Người dùng kiểm thử",
      so_dien_thoai: "0900000001",
    };
    for (const width of report.widths) {
      await page.setViewportSize({ width, height: 1000 });
      await goto(screen);
      await checkLayout(role + " " + width);
      const links = page
        .getByRole("navigation", { name: "Chức năng", exact: true })
        .getByRole("link");
      assert.equal(
        await links.count(),
        navigation[role].flatMap((g) => g.items).length,
      );
      await axe(role + " " + width);
      if (width === 1440 || width === 320)
        await page.screenshot({
          path: path.join(output, `${role}-${width}.png`),
          fullPage: true,
        });
    }
    if (role === "CU_DAN") {
      for (const width of report.widths) {
        await page.setViewportSize({ width, height: 1000 });
        await goto("/cu-dan/hoa-don/11");
        await page
          .getByRole("img", {
            name: "VietQR hóa đơn HD-KIEM-THU-UI",
            exact: true,
          })
          .waitFor();
        await checkLayout("payment " + width);
        await axe("payment " + width);
        if (width === 1440 || width === 320)
          await page.screenshot({
            path: path.join(output, `payment-${width}.png`),
            fullPage: true,
          });
      }
    }
    if (role === "QUAN_TRI_VIEN") {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await goto("/quan-tri");
      const search = page.getByRole("searchbox", {
        name: "Tìm chức năng",
        exact: true,
      });
      await search.fill("dien nuoc");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle");
      assert.equal(new URL(page.url()).pathname, "/quan-tri/chi-so");
      await goto("/quan-tri/can-ho");
      await page.getByRole("table").waitFor();
      await axe("apartments 1440");
      await page.screenshot({
        path: path.join(output, "apartments-1440.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 320, height: 1000 });
      await checkLayout("apartments 320");
      await axe("apartments 320");
      await page
        .getByRole("button", { name: "Tất cả chức năng", exact: true })
        .click();
      await checkLayout("expanded menu 320");
      await page
        .getByRole("navigation", { name: "Chức năng", exact: true })
        .getByRole("link", { name: "Căn hộ", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Tất cả chức năng", exact: true })
          .getAttribute("aria-expanded"),
        "false",
      );
      await page.screenshot({
        path: path.join(output, "apartments-320.png"),
        fullPage: true,
      });
    }
    for (const width of report.widths) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [url] of navigation[role].flatMap((g) => g.items)) {
        await goto(url);
        await checkLayout(role + " " + url + " " + width);
        report.menuScreens.push({ role, url, width });
      }
    }
  }
  user = null;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await goto("/");
  await page.mouse.move(8, 8);
  await page.waitForFunction(
    () => document.querySelector(".photo-carousel")?.dataset.playing === "true",
  );
  await page.clock.fastForward(6100);
  assert.equal(
    await page.locator(".photo-carousel").getAttribute("data-slide"),
    "2",
  );
  await page
    .getByRole("button", { name: "Dừng tự động chuyển ảnh", exact: true })
    .click();
  await page.clock.fastForward(6100);
  assert.equal(
    await page.locator(".photo-carousel").getAttribute("data-slide"),
    "2",
  );
  await page
    .getByRole("link", { name: "Khám phá dịch vụ", exact: true })
    .click();
  assert.ok((await page.locator("#dich-vu").boundingBox()).y < 300);
  report.checks.push("carousel autoplay, pause and discover-services anchor");
  assert.deepEqual(errors, [], "JavaScript page errors");
  assert.deepEqual(failedRequests, [], "static resource errors");
  report.checks.push(
    "real business navigation for 3 roles; function search keyboard; mobile menu; no route/filter TypeError",
  );
  report.scope =
    "UI fixtures only, no DB reads/writes or real login; unsupported API responses intentionally 503";
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        screens: report.menuScreens.length,
        axeScans: report.axe.length,
        violations: report.axe.filter((a) => a.violations.length),
        errors,
        failedRequests,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
