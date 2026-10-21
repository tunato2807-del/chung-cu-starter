import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`apartment login → automatic householder binding → password reset → handover at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(18).toString("hex"),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      apartmentName = `TK-${suffix}`,
      names = [`Chủ hộ một ${suffix}`, `Chủ hộ hai ${suffix}`],
      ownerPhones = [0, 1].map(
        () =>
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      ),
      date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      adminContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      ownerContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      admin = await adminContext.newPage(),
      owner = await ownerContext.newPage(),
      errors = [];
    let adminId, apartmentId, billId, priceId;
    for (const page of [admin, owner])
      page.on("pageerror", (e) => errors.push(e.message));
    async function login(page, username, secret, kind = "TU_DONG") {
      await page.goto("/dang-nhap");
      await page
        .getByLabel("Số điện thoại hoặc tài khoản căn hộ", { exact: true })
        .fill(username);
      await page
        .getByLabel("Loại tài khoản", { exact: true })
        .selectOption(kind);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(secret);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(page).toHaveURL(
        /^CH/i.test(username) || kind === "CAN_HO"
          ? /\/cu-dan\/hoa-don$/
          : /\/quan-tri$/,
      );
    }
    async function post(path, data) {
      const response = await adminContext.request.post(`/api${path}`, {
        headers: { "X-App-Request": "1" },
        data,
      });
      expect(response.ok()).toBe(true);
      return (await response.json()).data;
    }
    async function saveResponse(path, button) {
      const response = admin.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api${path}` &&
          r.request().method() === "POST",
      );
      await admin.getByRole("button", { name: button, exact: true }).click();
      const result = await response;
      expect(result.ok()).toBe(true);
      return (await result.json()).data;
    }
    try {
      const result = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [suffix, phone, await bcrypt.hash(password, 10)],
      );
      adminId = result.insertId;
      await login(admin, phone, password);
      await rows(
        pool,
        "INSERT INTO khoi_toa_nha (khoi) VALUES ('TK') ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await rows(
        pool,
        "INSERT INTO tang_toa_nha (khoi,tang) VALUES ('TK',1) ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await admin.getByRole("link", { name: "Căn hộ", exact: true }).click();
      await admin.getByLabel("Số căn hộ", { exact: true }).fill(apartmentName);
      await admin.getByLabel("Khối", { exact: true }).selectOption("TK");
      await admin.getByLabel("Tầng", { exact: true }).selectOption("1");
      await admin.getByLabel("Diện tích (m²)", { exact: true }).fill("50");
      const apartment = await saveResponse("/can_ho", "Lưu căn hộ");
      apartmentId = apartment.ma_can_ho;
      const initial = apartment.tai_khoan_can_ho;
      const initialNotice = admin.getByRole("region", {
        name: "Thông tin bàn giao tài khoản",
      });
      await expect(initialNotice).toContainText(initial.ten_dang_nhap);
      await expect(initialNotice).toContainText(initial.mat_khau_tam_thoi);
      // The new apartment account can be used immediately, even before a profile exists.
      await login(owner, initial.ten_dang_nhap, initial.mat_khau_tam_thoi);
      await expect(owner).toHaveURL(/\/cu-dan\/hoa-don$/);
      priceId = (
        await post("/cau_hinh_phi", {
          loai_phi: "PHI_QUAN_LY",
          don_gia: "1000",
          tu_ngay: "2020-01-01",
        })
      ).ma_cau_hinh_phi;
      billId = (
        await post("/hoa_don/lap", {
          ma_can_ho: apartmentId,
          ky_thanh_toan: "2026-09",
          ngay_chot_phi: "2026-09-30",
          tinh_dien: false,
          tinh_nuoc: false,
          tinh_xe: false,
        })
      ).ma_hoa_don;
      await post(`/hoa_don/${billId}/duyet`, { phien_ban: 0 });
      await post(`/hoa_don/${billId}/gui`, {
        phien_ban: 1,
        han_thanh_toan: date,
        ma_ngan_hang: "970436",
        so_tai_khoan: "1234567890",
        ten_nguoi_nhan: "BQL DEMO",
      });
      async function createOwner(index) {
        await admin.goto(
          `/quan-tri/cu-dan?ma_can_ho=${apartmentId}&so=${apartmentName}`,
        );
        await admin
          .getByRole("button", { name: "Thêm cư dân", exact: true })
          .click();
        await admin.getByLabel("Họ tên", { exact: true }).fill(names[index]);
        await admin
          .getByLabel("Số điện thoại", { exact: true })
          .fill(ownerPhones[index]);
        await admin
          .getByLabel("Quan hệ với căn hộ", { exact: true })
          .selectOption("CHU_HO");
        await admin
          .getByLabel("Ngày bắt đầu / chuyển căn", { exact: true })
          .fill(date);
        if (index)
          await admin
            .getByLabel("Bàn giao tài khoản nếu căn đang có người phụ trách", {
              exact: false,
            })
            .check();
        const profile = await saveResponse("/cu_dan", "Lưu cư dân");
        const notice = admin.getByRole("region", {
          name: "Thông tin bàn giao tài khoản",
        });
        await expect(
          admin.getByRole("link", { name: names[index], exact: true }),
        ).toBeVisible();
        // The credential notice must survive the resource reload after the form closes.
        await expect(notice).toContainText(
          profile.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
        await expect(notice).toContainText(initial.ten_dang_nhap);
        return profile;
      }
      const first = await createOwner(0);
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(
        owner,
        ownerPhones[0],
        first.tai_khoan_can_ho.mat_khau_tam_thoi,
        "CAN_HO",
      );
      await owner.goto(`/cu-dan/hoa-don/${billId}`);
      await expect(
        owner.getByRole("heading", {
          name: "Tổng cộng: 50.000 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(owner.getByAltText(/^VietQR hóa đơn/)).toBeVisible();
      await admin
        .getByRole("link", { name: "Tài khoản căn hộ", exact: true })
        .click();
      await admin
        .getByLabel("Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại")
        .fill(ownerPhones[0]);
      await admin
        .getByRole("button", { name: "Tìm tài khoản căn hộ", exact: true })
        .click();
      await expect(admin.locator("tbody tr")).toHaveCount(1);
      await expect(
        admin.getByRole("cell", { name: initial.ten_dang_nhap, exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("cell", { name: ownerPhones[0], exact: true }),
      ).toBeVisible();
      await admin
        .getByRole("button", { name: "Quản lý tài khoản", exact: true })
        .click();
      await expect(
        admin.getByRole("heading", {
          name: "Tài khoản thanh toán căn hộ",
          exact: true,
        }),
      ).toBeVisible();
      const reset = await saveResponse(
        `/can_ho/${apartmentId}/tai_khoan`,
        "Cấp lại mật khẩu và ngắt phiên cũ",
      );
      await expect(
        admin.getByText("Người phụ trách:", { exact: false }),
      ).toBeVisible();
      await expect(
        admin.getByRole("region", { name: "Thông tin bàn giao tài khoản" }),
      ).toContainText(reset.mat_khau_tam_thoi);
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(owner, ownerPhones[0], reset.mat_khau_tam_thoi, "CAN_HO");
      await expect(owner).toHaveURL(/\/cu-dan\/hoa-don$/);
      const second = await createOwner(1);
      expect(second.tai_khoan_can_ho.ma_nguoi_dung).toBe(
        first.tai_khoan_can_ho.ma_nguoi_dung,
      );
      expect(second.tai_khoan_can_ho.mat_khau_tam_thoi).not.toBe(
        reset.mat_khau_tam_thoi,
      );
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(
        owner,
        ownerPhones[1],
        second.tai_khoan_can_ho.mat_khau_tam_thoi,
        "CAN_HO",
      );
      await owner.goto(`/cu-dan/hoa-don/${billId}`);
      await expect(
        owner.getByRole("heading", {
          name: "Tổng cộng: 50.000 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        owner.getByText(`Người phụ trách thanh toán hiện tại: ${names[1]}`, {
          exact: true,
        }),
      ).toBeVisible();
      const oldAlias = await ownerContext.request.post(
        "/api/xac_thuc/dang_nhap",
        {
          headers: { "X-App-Request": "1" },
          data: {
            so_dien_thoai: ownerPhones[0],
            mat_khau: second.tai_khoan_can_ho.mat_khau_tam_thoi,
            loai_tai_khoan: "CAN_HO",
          },
        },
      );
      expect(oldAlias.status()).toBe(401);
      await admin
        .getByRole("link", { name: "Tài khoản căn hộ", exact: true })
        .click();
      await admin
        .getByLabel("Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại")
        .fill(apartmentName);
      await admin
        .getByRole("button", { name: "Tìm tài khoản căn hộ", exact: true })
        .click();
      await expect(admin.locator("tbody tr")).toHaveCount(1);
      await expect(
        admin.getByRole("cell", { name: ownerPhones[1], exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("link", { name: names[1], exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("cell", { name: ownerPhones[0], exact: true }),
      ).toHaveCount(0);
      for (const page of [admin, owner])
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await adminContext.close();
      await ownerContext.close();
      if (billId) {
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
          billId,
        ]);
        await rows(pool, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [
          billId,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [billId]);
      }
      const profiles = await rows(
        pool,
        "SELECT ma_cu_dan FROM cu_dan WHERE ho_va_ten IN (?,?)",
        names,
      );
      for (const { ma_cu_dan: id } of profiles) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      if (apartmentId)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartmentId]);
      if (priceId)
        await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
          priceId,
        ]);
      if (adminId)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          adminId,
        ]);
    }
  });
