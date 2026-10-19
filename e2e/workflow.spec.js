import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { pool, rows } from "../backend/src/lib/db.js";
import { cleanupImages } from "../backend/src/lib/images.js";

test("guest → management → technician → acceptance → private public lookup", async ({
  browser,
}) => {
  expect(process.env.DB_NAME).toBe("chung_cu_test");
  const password = randomBytes(16).toString("hex"),
    suffix = randomBytes(3).readUIntBE(0, 3),
    hash = await bcrypt.hash(password, 10);
  const locationName = `Hành lang kiểm thử ${suffix}`;
  const reportTitle = `Đèn hành lang hỏng ${suffix}`;
  const users = [],
    phones = [];
  let locationId, reportId;
  for (const [i, role] of [
    "QUAN_TRI_VIEN",
    "KY_THUAT_VIEN",
    "CU_DAN",
  ].entries()) {
    const phone = "09" + String((suffix * 10 + i) % 100000000).padStart(8, "0");
    phones.push(phone);
    const r = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      ["E2E " + role + " " + suffix, phone, hash, role],
    );
    users.push(r.insertId);
  }
  const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    techContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
    }),
    guestContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
  const admin = await adminContext.newPage(),
    tech = await techContext.newPage(),
    guest = await guestContext.newPage();
  const errors = [];
  for (const p of [admin, tech, guest])
    p.on("pageerror", (e) => errors.push(e.message));
  const origin = "http://127.0.0.1:5174";
  async function login(page, index) {
    await page.goto(origin + "/dang-nhap");
    await page.getByLabel("Số điện thoại").fill(phones[index]);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  }
  async function fit(page) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  try {
    await login(admin, 0);
    await expect(
      admin.getByRole("heading", { name: "Tổng quan phản ánh" }),
    ).toBeVisible();
    await admin.getByRole("link", { name: "Vị trí & QR", exact: true }).click();
    await admin.getByLabel("Tên vị trí").fill(locationName);
    await admin.getByRole("button", { name: "Tạo vị trí và mã QR" }).click();
    await expect(admin.getByText(locationName, { exact: true })).toBeVisible();
    const [loc] = await rows(
      pool,
      "SELECT * FROM vi_tri_qr WHERE ma_nguoi_tao=?",
      [users[0]],
    );
    locationId = loc.ma_vi_tri_qr;
    await admin
      .locator("li")
      .filter({ hasText: locationName })
      .getByRole("button", { name: "Xem QR", exact: true })
      .click();
    await expect(admin.getByAltText(`Mã QR ${locationName}`)).toBeVisible();
    await guest.goto(origin + "/r/" + loc.token_qr);
    await expect(
      guest.getByRole("link", { name: "Đăng nhập", exact: true }),
    ).toBeVisible();
    await expect(
      guest.getByRole("heading", { name: locationName }),
    ).toBeVisible();
    await fit(guest);
    await guest.getByLabel("Tiêu đề", { exact: true }).fill(reportTitle);
    await guest
      .getByLabel("Mô tả chi tiết")
      .fill("Đèn hành lang không sáng, vui lòng kiểm tra lại.");
    await guest.getByLabel("Họ tên", { exact: true }).fill("Khách kiểm thử");
    await guest.getByLabel("Số điện thoại").fill(phones[2]);
    const image = await sharp({
      create: { width: 30, height: 30, channels: 3, background: "#669977" },
    })
      .png()
      .toBuffer();
    await guest.locator("input[type=file]").setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: image,
    });
    await guest
      .getByRole("button", { name: "Gửi phản ánh", exact: true })
      .click();
    await expect(
      guest.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
    ).toBeVisible();
    const code = await guest.getByLabel("Mã tra cứu riêng").inputValue();
    expect(code.length).toBe(64);
    const [r] = await rows(
      pool,
      "SELECT ma_phan_anh,ma_nguoi_gui FROM phan_anh WHERE ma_vi_tri_qr=?",
      [locationId],
    );
    reportId = r.ma_phan_anh;
    expect(r.ma_nguoi_gui).toBeNull();
    await admin.getByRole("link", { name: "Phản ánh", exact: true }).click();
    await admin.getByRole("link", { name: new RegExp(reportTitle) }).click();
    await expect(
      admin.getByRole("heading", { name: reportTitle }),
    ).toBeVisible();
    await expect(admin.locator(".action-panel")).toBeVisible();
    await admin
      .getByLabel("Kỹ thuật viên", { exact: true })
      .selectOption(String(users[1]));
    await admin.getByRole("button", { name: "Lưu phân công" }).click();
    await expect(
      admin.locator(".page-heading .badge").filter({ hasText: "Đã phân công" }),
    ).toBeVisible();
    await fit(admin);
    await login(tech, 1);
    await tech.getByRole("link", { name: new RegExp(reportTitle) }).click();
    await fit(tech);
    await tech
      .getByRole("button", { name: "Bắt đầu xử lý", exact: true })
      .click();
    await expect(tech.getByLabel("Kết quả xử lý (bắt buộc)")).toBeVisible();
    await tech
      .getByLabel("Kết quả xử lý (bắt buộc)")
      .fill("Đã thay bóng đèn và kiểm tra hoạt động.");
    await tech.locator("input[type=file]").setInputFiles({
      name: "result.png",
      mimeType: "image/png",
      buffer: image,
    });
    await tech
      .getByRole("button", { name: "Hoàn thành và gửi nghiệm thu" })
      .click();
    await expect(
      tech.getByText("Kết quả đã gửi, đang chờ Ban quản lý nghiệm thu."),
    ).toBeVisible();
    await admin.reload();
    await admin
      .getByLabel("Phản hồi công khai", { exact: true })
      .fill("Đã kiểm tra và nghiệm thu đạt.");
    await admin.getByRole("button", { name: "Xác nhận quyết định" }).click();
    await expect(
      admin.getByText("Không có thao tác cập nhật ở trạng thái này."),
    ).toBeVisible();
    await guest
      .getByRole("link", { name: "Tra cứu tiến độ", exact: true })
      .click();
    await guest.getByLabel("Số điện thoại").fill(phones[2]);
    await guest.getByRole("button", { name: "Tra cứu", exact: true }).click();
    await expect(
      guest.getByRole("heading", { name: locationName }),
    ).toBeVisible();
    await expect(
      guest.getByText("Đã kiểm tra và nghiệm thu đạt."),
    ).toBeVisible();
    await fit(guest);
    await admin.goto(origin + "/quan-tri");
    await expect(
      admin.getByRole("heading", { name: "Tổng quan phản ánh" }),
    ).toBeVisible();
    await admin.screenshot({
      path: "test-results/dashboard-desktop.png",
      fullPage: true,
    });
    await guest.goto(origin + "/r/" + loc.token_qr);
    await expect(guest.getByLabel("Tiêu đề", { exact: true })).toBeVisible();
    await guest.screenshot({
      path: "test-results/report-mobile.png",
      fullPage: true,
    });
    await guest.goto(origin + "/quet-qr");
    await guest
      .getByLabel("Hoặc dán liên kết QR của tòa nhà")
      .fill("https://example.com/r/" + loc.token_qr);
    await guest.getByRole("button", { name: "Mở biểu mẫu" }).click();
    await expect(guest.getByRole("alert")).toContainText(
      "không thuộc hệ thống",
    );
    await guest.getByRole("button", { name: "Mở camera", exact: true }).click();
    await expect(guest.getByRole("alert")).toContainText(
      "Không mở được camera",
    );
    expect(errors).toEqual([]);
  } finally {
    await Promise.all([
      adminContext.close(),
      techContext.close(),
      guestContext.close(),
    ]);
    if (reportId) {
      const imgs = await rows(
        pool,
        "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=?",
        [reportId],
      );
      await cleanupImages(imgs.map((x) => x.duong_dan_tep));
      for (const table of [
        "yeu_cau_gui",
        "hinh_anh_phan_anh",
        "lich_su_phan_anh",
      ])
        await rows(pool, `DELETE FROM ${table} WHERE ma_phan_anh=?`, [
          reportId,
        ]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [reportId]);
    }
    if (locationId)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
        locationId,
      ]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
