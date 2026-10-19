import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`prices → incomplete draft → meters → approve → send → resident QR → collect at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      users = [],
      phones = [],
      prices = [];
    let apartmentId, profileId;
    const adminContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      residentContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      page = await adminContext.newPage(),
      resident = await residentContext.newPage(),
      errors = [];
    for (const p of [page, resident])
      p.on("pageerror", (e) => errors.push(e.message));
    try {
      for (const role of ["QUAN_TRI_VIEN", "CU_DAN"]) {
        const phone =
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
        const result = await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [`HD E2E ${suffix}`, phone, hash, role],
        );
        users.push(result.insertId);
        phones.push(phone);
      }
      const apartment = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,?)",
        [`HD-${suffix}`, "HD", 1, 70],
      );
      apartmentId = apartment.insertId;
      const owner = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES (?,?,?)",
        [`Cư dân ${suffix}`, phones[1], users[1]],
      );
      profileId = owner.insertId;
      const stay = await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [profileId, apartmentId, "CHU_HO", "2020-01-01", users[0]],
      );
      for (let i = 0; i < 2; i++)
        await rows(
          pool,
          "INSERT INTO phuong_tien (ma_dang_ky,ma_cu_dan,ma_can_ho,ma_lich_su_cu_tru,loai_xe,bien_so,ngay_dang_ky,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?)",
          [
            `HD-${suffix}-${i}`,
            profileId,
            apartmentId,
            stay.insertId,
            "XE_MAY",
            `T${suffix}${i}`,
            "2020-01-01",
            users[0],
          ],
        );
      async function login(p, i) {
        await p.goto("/dang-nhap");
        await p.getByLabel("Số điện thoại").fill(phones[i]);
        await p.getByLabel("Mật khẩu", { exact: true }).fill(password);
        await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      }
      async function chooseApartment() {
        await page.getByLabel("Tìm căn hộ để chọn").fill(`HD-${suffix}`);
        await expect(
          page.getByRole("option", { name: `HD-${suffix}`, exact: true }),
        ).toBeAttached();
        await page
          .getByLabel("Căn hộ", { exact: true })
          .selectOption(String(apartmentId));
      }
      await login(page, 0);
      await page
        .getByRole("link", { name: "Đơn giá phí", exact: true })
        .click();
      for (const [type, price] of [
        ["PHI_QUAN_LY", "12000"],
        ["GUI_XE_MAY", "100000"],
        ["TIEN_NUOC", "15000"],
      ]) {
        await page.getByLabel("Loại phí", { exact: true }).selectOption(type);
        await page
          .getByLabel("Đơn giá (đồng/đơn vị)", { exact: true })
          .fill(price);
        await page.getByLabel("Áp dụng từ ngày").fill("2020-01-01");
        await page
          .getByRole("button", { name: "Lưu đơn giá", exact: true })
          .click();
        await expect(page.locator("tbody tr")).toHaveCount(prices.length + 1);
        const [row] = await rows(
          pool,
          "SELECT ma_cau_hinh_phi FROM cau_hinh_phi WHERE loai_phi=? AND tu_ngay=?",
          [type, "2020-01-01"],
        );
        prices.push(row.ma_cau_hinh_phi);
      }
      await page
        .getByRole("link", { name: "Phí & hóa đơn", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Lập hóa đơn", exact: true })
        .click();
      await chooseApartment();
      await page.getByLabel("Kỳ hóa đơn", { exact: true }).fill("2026-09");
      await page
        .getByLabel("Ngày chốt phí", { exact: true })
        .fill("2026-09-30");
      await page
        .getByRole("button", { name: "Tạo bản nháp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: /^Hóa đơn HD/ }),
      ).toBeVisible();
      const id = Number(page.url().split("/").at(-1));
      await expect(page.getByRole("alert")).toContainText("Thiếu chỉ số NUOC");
      await expect(
        page.getByRole("button", { name: "Duyệt hóa đơn", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("link", { name: "Chỉ số điện nước", exact: true })
        .click();
      await chooseApartment();
      await page.getByLabel("Kỳ ghi chỉ số").fill("2026-09");
      await page.getByLabel("Chỉ số đầu kỳ").fill("113");
      await page.getByLabel("Chỉ số cuối kỳ").fill("125");
      await page.getByLabel("Ngày chốt chỉ số").fill("2026-09-30");
      await page
        .getByLabel("Đây là kỳ đầu tiên của căn đối với dịch vụ này")
        .check();
      await page
        .getByRole("button", { name: "Lưu chỉ số", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(1);
      await page.goto(`/quan-tri/hoa-don/${id}`);
      await page
        .getByRole("button", { name: "Tính lại bản nháp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Tổng cộng: 1.220.000 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Duyệt hóa đơn", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Gửi hóa đơn cho cư dân",
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel("BIN ngân hàng (6 số)").fill("970436");
      await page.getByLabel("Số tài khoản nhận").fill("1234567890");
      await page.getByLabel("Tên người nhận").fill("BQL DEMO");
      await page
        .getByRole("button", { name: "Gửi hóa đơn", exact: true })
        .click();
      const [bill] = await rows(
        pool,
        "SELECT * FROM hoa_don WHERE ma_hoa_don=?",
        [id],
      );
      await expect(
        page.getByAltText(`VietQR hóa đơn ${bill.so_hoa_don}`),
      ).toBeVisible();
      await login(resident, 1);
      await resident
        .getByRole("link", { name: "Hóa đơn của tôi", exact: true })
        .click();
      await resident
        .getByRole("link", { name: bill.so_hoa_don, exact: true })
        .click();
      const qr = resident.getByAltText(`VietQR hóa đơn ${bill.so_hoa_don}`);
      await expect(qr).toBeVisible();
      await expect
        .poll(() => qr.evaluate((img) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect(
        resident.getByRole("button", { name: "Xác nhận đã thu", exact: true }),
      ).toHaveCount(0);
      await page.getByLabel("Mã tham chiếu giao dịch").fill(`E2E-${suffix}`);
      await page.getByLabel("Đã đối soát đủ số tiền hóa đơn").check();
      await page
        .getByRole("button", { name: "Xác nhận đã thu", exact: true })
        .click();
      await expect(
        page.getByText("Đã ghi nhận 1.220.000 đ", { exact: false }),
      ).toBeVisible();
      await resident.reload();
      await expect(
        resident.getByText("Đã ghi nhận 1.220.000 đ", { exact: false }),
      ).toBeVisible();
      await expect(
        resident.getByAltText(`VietQR hóa đơn ${bill.so_hoa_don}`),
      ).toHaveCount(0);
      for (const p of [page, resident])
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await adminContext.close();
      await residentContext.close();
      if (apartmentId) {
        const bills = await rows(
          pool,
          "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? ORDER BY ma_hoa_don DESC",
          [apartmentId],
        );
        for (const { ma_hoa_don: id } of bills) {
          await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
            id,
          ]);
          await rows(pool, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [
            id,
          ]);
          await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
        }
        await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [
          apartmentId,
        ]);
      }
      if (profileId) {
        await rows(
          pool,
          "DELETE FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
          [profileId],
        );
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
          profileId,
        ]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profileId]);
      }
      for (const price of prices.reverse())
        await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
          price,
        ]);
      if (apartmentId)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartmentId]);
      for (const u of users)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [u]);
    }
  });
