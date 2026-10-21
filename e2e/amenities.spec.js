import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import {
  today,
  addDays,
} from "../backend/src/modules/amenities/amenities.validation.js";

for (const width of [1440, 375])
  test(`amenity creation → household booking → overlap error → approval → cancellation → rejection at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      users = [],
      errors = [],
      contexts = [],
      day = addDays(today(), 1),
      name = `Phòng cộng đồng ${suffix}`;
    let apt, profile, facility;
    const adminContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      residentContext = await browser.newContext({
        viewport: { width, height: 1000 },
      });
    contexts.push(adminContext, residentContext);
    const page = await adminContext.newPage(),
      resident = await residentContext.newPage();
    for (const p of [page, resident])
      p.on("pageerror", (e) => errors.push(e.message));
    async function session(context, name, secret = password) {
      const r = await login({ so_dien_thoai: name, mat_khau: secret });
      await context.addCookies([
        {
          name: "session",
          value: r.token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
    }
    async function post(path, body) {
      const r = await adminContext.request.post("/api" + path, {
        data: body,
        headers: { "X-App-Request": "1" },
      });
      expect(r.status()).toBeLessThan(300);
      return (await r.json()).data;
    }
    async function waitSave(p, path, method, click) {
      const waiting = p.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === path && r.request().method() === method,
      );
      await click();
      const r = await waiting;
      expect(r.status()).toBeLessThan(300);
      return (await r.json()).data;
    }
    async function openBookingForm() {
      await resident.goto(`/cu-dan/tien-ich/${facility}`);
      await resident.getByLabel("Ngày sử dụng", { exact: true }).fill(day);
      await expect(
        resident.getByRole("heading", {
          name: `Lịch trống ngày ${day.split("-").reverse().join("/")}`,
        }),
      ).toBeVisible();
    }
    async function submitBooking() {
      await resident
        .getByRole("button", { name: "08:00 – 08:30: Còn trống", exact: true })
        .click();
      await resident.getByLabel("Giờ kết thúc", { exact: true }).fill("09:00");
      await resident.getByLabel("Số người tham gia").fill("5");
      await resident
        .getByLabel("Ghi chú đặt lịch")
        .fill(
          "Sinh hoạt gia đình\n<script>window.amenityInjected=true</script>",
        );
      return waitSave(
        resident,
        `/api/tien_ich/${facility}/dat_lich`,
        "POST",
        () =>
          resident
            .getByRole("button", { name: "Gửi yêu cầu đặt lịch", exact: true })
            .click(),
      );
    }
    try {
      for (const role of ["QUAN_TRI_VIEN", "CU_DAN"]) {
        const phone =
            "09" +
            String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
          r = await rows(
            pool,
            "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
            [`Đặt lịch ${suffix}`, phone, hash, role],
          );
        users.push(r.insertId);
        if (role === "QUAN_TRI_VIEN") await session(adminContext, phone);
        else {
          const a = await post("/can_ho", {
            so_can_ho: `DL-${suffix}`,
            khoi: "DL",
            tang: 2,
            dien_tich_m2: "50",
            tinh_phi_dich_vu: true,
          });
          apt = a.ma_can_ho;
          const c = await post("/cu_dan", {
            ho_va_ten: `Chủ hộ ${suffix}`,
            so_dien_thoai: phone,
            ma_nguoi_dung: r.insertId,
            ma_can_ho: apt,
            quan_he: "CHU_HO",
            ngay: today(),
          });
          profile = c.ma_cu_dan;
          await session(
            residentContext,
            c.tai_khoan_can_ho.ten_dang_nhap,
            c.tai_khoan_can_ho.mat_khau_tam_thoi,
          );
        }
      }
      await page.goto("/quan-tri/tien-ich");
      await page
        .getByRole("button", { name: "Thêm tiện ích", exact: true })
        .click();
      await page.getByLabel("Tên tiện ích", { exact: true }).fill(name);
      await page.getByLabel("Vị trí tiện ích").fill("Khối A · tầng 2");
      await page
        .getByLabel("Mô tả và quy định")
        .fill("Giữ vệ sinh và sử dụng đúng khung giờ.");
      await page.getByLabel("Sức chứa (người)").fill("20");
      const f = await waitSave(page, "/api/tien_ich", "POST", () =>
        page.getByRole("button", { name: "Lưu tiện ích", exact: true }).click(),
      );
      facility = f.ma_tien_ich;
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      await openBookingForm();
      await expect(
        resident.getByText(`Chủ hộ ${suffix}`, { exact: false }),
      ).toBeVisible();
      const first = await submitBooking(),
        id = first.ma_dat_lich;
      await expect(
        resident.getByText("Chờ duyệt", { exact: true }),
      ).toBeVisible();
      expect(
        await resident.evaluate(() => window.amenityInjected),
      ).toBeUndefined();
      await openBookingForm();
      await expect(
        resident.getByRole("button", {
          name: "08:00 – 08:30: Đã đặt",
          exact: true,
        }),
      ).toBeDisabled();
      await resident.getByLabel("Giờ bắt đầu", { exact: true }).fill("08:00");
      await resident.getByLabel("Giờ kết thúc", { exact: true }).fill("09:00");
      await resident
        .getByLabel("Ghi chú đặt lịch")
        .fill("Giữ nội dung khi gửi bị trùng");
      const conflict = resident.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api/tien_ich/${facility}/dat_lich` &&
          r.request().method() === "POST",
      );
      await resident
        .getByRole("button", { name: "Gửi yêu cầu đặt lịch", exact: true })
        .click();
      expect((await conflict).status()).toBe(409);
      await expect(resident.getByRole("alert")).toContainText(
        "đã có người giữ chỗ",
      );
      await expect(resident.getByLabel("Ghi chú đặt lịch")).toHaveValue(
        "Giữ nội dung khi gửi bị trùng",
      );
      await page.goto("/quan-tri/dat-lich");
      await page.getByLabel("Tìm lượt đặt").fill(suffix);
      await page
        .getByRole("button", { name: "Lọc lịch đặt", exact: true })
        .click();
      await page
        .getByRole("link", {
          name: `DL${String(id).padStart(6, "0")}`,
          exact: true,
        })
        .click();
      await page
        .getByLabel("Ghi chú duyệt")
        .fill("Đã sắp xếp phòng, sử dụng đúng giờ.");
      await waitSave(page, `/api/dat_lich_tien_ich/${id}/duyet`, "POST", () =>
        page.getByRole("button", { name: "Duyệt lịch", exact: true }).click(),
      );
      await expect(page.getByText("Đã duyệt", { exact: true })).toBeVisible();
      await resident.goto(`/cu-dan/dat-lich/${id}`);
      await expect(
        resident.getByText("Đã duyệt", { exact: true }),
      ).toBeVisible();
      await resident.screenshot({
        path: `/tmp/chung-cu-amenity-booking-${width}.png`,
        fullPage: true,
      });
      await resident
        .getByLabel("Lý do hủy lịch")
        .fill("Gia đình đổi kế hoạch sử dụng.");
      await waitSave(resident, `/api/cua_toi/dat_lich/${id}/huy`, "POST", () =>
        resident
          .getByRole("button", { name: "Xác nhận hủy lịch", exact: true })
          .click(),
      );
      await expect(resident.getByText("Đã hủy", { exact: true })).toBeVisible();
      await openBookingForm();
      const next = await submitBooking(),
        second = next.ma_dat_lich;
      await page.goto(`/quan-tri/dat-lich/${second}`);
      await page
        .getByLabel("Lý do từ chối")
        .fill("Tạm dành phòng cho kiểm tra bảo trì.");
      await waitSave(
        page,
        `/api/dat_lich_tien_ich/${second}/tu_choi`,
        "POST",
        () =>
          page
            .getByRole("button", { name: "Từ chối lịch", exact: true })
            .click(),
      );
      await expect(
        page.getByText("Từ chối", { exact: true }).first(),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem tiện ích và lịch trống", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Sửa tiện ích", exact: true })
        .click();
      await page.getByLabel("Mở nhận lịch").selectOption("0");
      await waitSave(page, `/api/tien_ich/${facility}`, "PUT", () =>
        page.getByRole("button", { name: "Lưu tiện ích", exact: true }).click(),
      );
      await expect(
        page.getByText("Tạm ngừng nhận lịch mới", { exact: true }),
      ).toBeVisible();
      await openBookingForm();
      await expect(
        resident.getByRole("button", {
          name: "Gửi yêu cầu đặt lịch",
          exact: true,
        }),
      ).toBeDisabled();
      await resident.screenshot({
        path: `/tmp/chung-cu-amenity-calendar-${width}.png`,
        fullPage: true,
      });
      for (const p of [page, resident])
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await Promise.allSettled(contexts.map((c) => c.close()));
      const found = await rows(
        pool,
        "SELECT ma_tien_ich FROM tien_ich WHERE ten_tien_ich=?",
        [name],
      );
      for (const { ma_tien_ich: id } of found) {
        await rows(pool, "DELETE FROM dat_lich_tien_ich WHERE ma_tien_ich=?", [
          id,
        ]);
        await rows(pool, "DELETE FROM tien_ich WHERE ma_tien_ich=?", [id]);
      }
      if (profile) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
          profile,
        ]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profile]);
      }
      if (apt) await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apt]);
      for (const id of users)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
