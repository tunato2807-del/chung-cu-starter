import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import { cleanupImages } from "../backend/src/lib/images.js";

for (const width of [1440, 375])
  test(`equipment QR → photo report → reassignment → stale form → snapshot/filter → unlink at ${width}px`, async ({
    page,
    context,
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const guestContext = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const guest = await guestContext.newPage(),
      stale = await guestContext.newPage();
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      locationName = `Tem thiết bị ${suffix}`;
    const devices = [],
      errors = [];
    let admin, location;
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    for (const p of [page, guest, stale])
      p.on("pageerror", (error) => errors.push(error.message));
    async function fillReport(p, title) {
      await p.getByLabel("Tiêu đề", { exact: true }).fill(title);
      await p
        .getByLabel("Mô tả chi tiết")
        .fill("Thiết bị chạy ồn bất thường, cần kiểm tra tại hiện trường.");
      await p.getByLabel("Họ tên", { exact: true }).fill("Cư dân demo");
      await p.getByLabel("Số điện thoại", { exact: true }).fill(phone);
    }
    async function saveLink(editor) {
      await editor.getByRole("checkbox").check();
      await editor
        .getByRole("button", { name: "Lưu liên kết", exact: true })
        .click();
      await expect(editor).toHaveCount(0);
    }
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [suffix, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await context.addCookies([
        {
          name: "session",
          value: (await login({ so_dien_thoai: phone, mat_khau: password }))
            .token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      for (let i = 0; i < 22; i++) {
        const ending = i === 0 ? "A" : i === 21 ? "B" : String(i);
        const row = await rows(
          pool,
          "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,so_serial,ghi_chu,ma_nguoi_tao) VALUES (?,?,'DIEN','Hầm xe','PRIVATE-SERIAL','PRIVATE-NOTE',?)",
          [`EQ-${suffix}-${ending}`, `Máy ${suffix}-${ending}`, admin],
        );
        devices.push(row.insertId);
      }
      const a = devices[0],
        b = devices[21];
      await page.goto("/quan-tri/vi-tri-qr");
      await page.getByLabel("Tên vị trí", { exact: true }).fill(locationName);
      await page
        .getByLabel("Loại vị trí", { exact: true })
        .selectOption("THIET_BI");
      await page.getByLabel("Tìm thiết bị theo mã hoặc tên").fill(suffix);
      await expect(
        page.getByRole("button", { name: "Trang thiết bị sau", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Trang thiết bị sau", exact: true })
        .click();
      await page
        .getByLabel("Chọn thiết bị", { exact: true })
        .selectOption(String(b));
      await expect(
        page.getByText(`Đã chọn: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      // Selection survives subsequent searching rather than becoming the first
      // item of a new result page.
      await page
        .getByLabel("Tìm thiết bị theo mã hoặc tên")
        .fill(`EQ-${suffix}-A`);
      await expect(
        page.getByText(`Đã chọn: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      const created = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/vi_tri_qr" &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Tạo vị trí và mã QR", exact: true })
        .click();
      const r = await created;
      expect(r.status()).toBe(201);
      location = (await r.json()).data;
      expect(location.ma_thiet_bi).toBe(b);
      const locationRow = page
        .locator(".location-list > li")
        .filter({ hasText: locationName });
      await locationRow
        .getByRole("button", { name: "Xem QR", exact: true })
        .click();
      await expect(page.getByAltText(`Mã QR ${locationName}`)).toBeVisible();
      await guest.goto(`/r/${location.token_qr}`);
      await expect(
        guest.getByText(`Thiết bị: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      await fillReport(guest, `Phản ánh máy B ${suffix}`);
      const image = await sharp({
        create: { width: 40, height: 40, channels: 3, background: "#339988" },
      })
        .png()
        .toBuffer();
      await guest.locator("input[type=file][multiple]").setInputFiles({
        name: "hien-truong.png",
        mimeType: "image/png",
        buffer: image,
      });
      await expect(guest.getByAltText(/Xem trước/)).toBeVisible();
      await guest
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(
        guest.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
      ).toBeVisible();
      const receipt = await guest.getByLabel("Mã tra cứu riêng").inputValue();
      expect(receipt).toHaveLength(64);
      const [reportB] = await rows(
        pool,
        "SELECT * FROM phan_anh WHERE ma_vi_tri_qr=? AND tieu_de=?",
        [location.ma_vi_tri_qr, `Phản ánh máy B ${suffix}`],
      );
      expect(reportB.ma_thiet_bi).toBe(b);
      await stale.goto(`/r/${location.token_qr}`);
      await fillReport(stale, `Bản nháp chưa gửi ${suffix}`);
      await locationRow
        .getByRole("button", { name: "Liên kết thiết bị", exact: true })
        .click();
      const editor = page.getByRole("region", {
        name: "Liên kết thiết bị với QR",
      });
      await editor
        .getByLabel("Tìm thiết bị theo mã hoặc tên")
        .fill(`EQ-${suffix}-A`);
      await editor
        .getByLabel("Chọn thiết bị", { exact: true })
        .selectOption(String(a));
      await saveLink(editor);
      expect(
        (
          await rows(
            pool,
            "SELECT token_qr FROM vi_tri_qr WHERE ma_vi_tri_qr=?",
            [location.ma_vi_tri_qr],
          )
        )[0].token_qr,
      ).toBe(location.token_qr);
      await stale
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(stale.getByRole("alert")).toContainText(
        "Liên kết vị trí đã thay đổi",
      );
      await expect(stale.getByLabel("Tiêu đề", { exact: true })).toHaveValue(
        `Bản nháp chưa gửi ${suffix}`,
      );
      await stale.reload();
      await expect(
        stale.getByText(`Thiết bị: EQ-${suffix}-A · Máy ${suffix}-A`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(stale.getByLabel("Tiêu đề", { exact: true })).toHaveValue(
        `Bản nháp chưa gửi ${suffix}`,
      );
      await stale
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(
        stale.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
      ).toBeVisible();

      await page.goto(`/quan-tri/phan-anh/${reportB.ma_phan_anh}`);
      await expect(
        page.getByText(`Thiết bị lúc gửi: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator(".image-grid img")).toHaveCount(1);
      await page
        .getByRole("link", { name: "Mở hồ sơ thiết bị", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: `Máy ${suffix}-B`, exact: true }),
      ).toBeVisible();
      const connections = page.getByRole("region", {
        name: "QR và phản ánh của thiết bị",
      });
      await expect(connections).toContainText("0 vị trí QR đang liên kết");
      await expect(connections).toContainText(
        "1 phản ánh ghi nhận thiết bị này lúc gửi",
      );
      await connections
        .getByRole("link", { name: "Xem phản ánh của thiết bị", exact: true })
        .click();
      await expect(
        page.getByRole("link", {
          name: `#${reportB.ma_phan_anh} · Phản ánh máy B ${suffix}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: new RegExp(`Bản nháp chưa gửi ${suffix}`),
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Bỏ lọc thiết bị", exact: true }),
      ).toBeVisible();

      await page.goto(`/quan-tri/thiet-bi/${a}`);
      await connections
        .getByRole("link", { name: "Quản lý QR của thiết bị", exact: true })
        .click();
      await expect(locationRow).toBeVisible();
      await locationRow
        .getByRole("button", { name: "Liên kết thiết bị", exact: true })
        .click();
      await editor
        .getByRole("button", { name: "Bỏ chọn thiết bị", exact: true })
        .click();
      await saveLink(editor);
      await guest.goto(`/r/${location.token_qr}`);
      await expect(
        guest.getByRole("heading", { name: locationName, exact: true }),
      ).toBeVisible();
      await expect(guest.getByText(/Thiết bị: EQ-/)).toHaveCount(0);
      await page.goto(`/quan-tri/phan-anh/${reportB.ma_phan_anh}`);
      await expect(
        page.getByText(`Thiết bị lúc gửi: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/equipment-qr-${width}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    } finally {
      await guestContext.close();
      if (location) {
        const tickets = await rows(
          pool,
          "SELECT ma_phan_anh FROM phan_anh WHERE ma_vi_tri_qr=?",
          [location.ma_vi_tri_qr],
        );
        for (const ticket of tickets) {
          const images = await rows(
            pool,
            "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=?",
            [ticket.ma_phan_anh],
          );
          await cleanupImages(images.map((i) => i.duong_dan_tep));
          for (const table of [
            "hinh_anh_phan_anh",
            "lich_su_phan_anh",
            "yeu_cau_gui",
          ])
            await rows(pool, `DELETE FROM ${table} WHERE ma_phan_anh=?`, [
              ticket.ma_phan_anh,
            ]);
          await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [
            ticket.ma_phan_anh,
          ]);
        }
        await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
          location.ma_vi_tri_qr,
        ]);
      }
      for (const id of devices)
        await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });
