import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`prices + electricity tiers → incomplete draft → meters → approve → send → resident QR → collect at ${width}px`, async ({
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
      const vehicles = [
        ["O_TO", "2020-01-01", null],
        ["XE_MAY", "2020-01-01", null],
        ["XE_MAY", "2020-01-01", null],
        ["XE_DAP", "2020-01-01", null],
        ["XE_DAP", "2020-01-01", null],
        ["XE_DAP", "2020-01-01", null],
        // These registrations must not count at the September cutoff.
        ["XE_MAY", "2020-01-01", "2026-09-30"],
        ["O_TO", "2026-10-01", null],
      ];
      for (const [i, [type, from, to]] of vehicles.entries())
        await rows(
          pool,
          "INSERT INTO phuong_tien (ma_dang_ky,ma_cu_dan,ma_can_ho,ma_lich_su_cu_tru,loai_xe,bien_so,ngay_dang_ky,ngay_ket_thuc,ma_nguoi_tao,ma_nguoi_ket_thuc,ly_do_ket_thuc) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          [
            `HD-${suffix}-${i}`,
            profileId,
            apartmentId,
            stay.insertId,
            type,
            `T${suffix}${i}`,
            from,
            to,
            users[0],
            to ? users[0] : null,
            to ? "Đã ngừng gửi" : "",
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
        ["GUI_O_TO", "1200000"],
        ["GUI_XE_DAP", "50000"],
        ["TIEN_NUOC", "15000"],
        ["TIEN_DIEN", null],
      ]) {
        await page.getByLabel("Loại phí", { exact: true }).selectOption(type);
        if (type === "TIEN_DIEN") {
          await page
            .getByRole("button", {
              name: "Điền mẫu 6 bậc và thuế 8%",
              exact: true,
            })
            .click();
          await expect(
            page.getByLabel("Đơn giá bậc 1 (đồng/kWh)", { exact: true }),
          ).toHaveValue("1984");
          await expect(
            page.getByLabel("Thuế GTGT điện (%)", { exact: true }),
          ).toHaveValue("8");
        } else {
          await page
            .getByLabel("Đơn giá (đồng/đơn vị)", { exact: true })
            .fill(price);
        }
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
      await page.getByLabel("BQL thu tiền điện", { exact: true }).check();
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
      await page.getByLabel("Chỉ số cuối kỳ").fill("125.125");
      await page.getByLabel("Ngày chốt chỉ số").fill("2026-09-30");
      await page
        .getByLabel("Đây là kỳ đầu tiên của căn đối với dịch vụ này")
        .check();
      await page
        .getByRole("button", { name: "Lưu chỉ số", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(1);
      await page.getByLabel("Dịch vụ", { exact: true }).selectOption("DIEN");
      await page.getByLabel("Chỉ số đầu kỳ").fill("100");
      await page.getByLabel("Chỉ số cuối kỳ").fill("400");
      await page
        .getByRole("button", { name: "Lưu chỉ số", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await page.goto(`/quan-tri/hoa-don/${id}`);
      await page
        .getByRole("button", { name: "Tính lại bản nháp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Tổng cộng: 3.370.535 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      for (const [fee, qty, unitPrice] of [
        ["Gửi ô tô", "1", "1.200.000 đ"],
        ["Gửi xe máy", "2", "100.000 đ"],
        ["Gửi xe đạp", "3", "50.000 đ"],
        ["Phí quản lý", "70", "12.000 đ"],
        ["Tiền nước", "12,125", "15.000 đ"],
      ]) {
        const row = page
          .getByRole("row")
          .filter({ has: page.getByRole("cell", { name: fee, exact: true }) });
        await expect(row.getByRole("cell").nth(1)).toHaveText(qty);
        await expect(row.getByRole("cell").nth(3)).toHaveText(unitPrice);
      }
      await page
        .getByRole("button", { name: "Duyệt hóa đơn", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Gửi hóa đơn cho cư dân",
          exact: true,
        }),
      ).toBeVisible();
      const bank = page.getByLabel("Ngân hàng nhận tiền", { exact: true });
      await expect(bank).toHaveValue("");
      await page
        .getByLabel("Tìm ngân hàng", { exact: true })
        .fill("ngoai thuong");
      await expect(
        bank.getByRole("option", { name: /^Vietcombank/ }),
      ).toHaveCount(1);
      await bank.selectOption("970436");
      // Filtering again must not silently change the receiving bank.
      await page.getByLabel("Tìm ngân hàng", { exact: true }).fill("ACB");
      await expect(bank).toHaveValue("970436");
      await page
        .getByLabel("Tìm ngân hàng", { exact: true })
        .fill("khong co ngan hang nay");
      await expect(
        page.getByText(
          "Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.",
        ),
      ).toBeVisible();
      await expect(bank).toHaveValue("970436");
      await page.getByLabel("Tìm ngân hàng", { exact: true }).fill("");
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
      expect(bill.ma_ngan_hang).toBe("970436");
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
      await expect(
        resident.getByRole("cell", {
          name: "Tiền điện bậc 4 (200–300 kWh)",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        resident.getByRole("cell", {
          name: "Thuế GTGT điện 8.00% trên 739.500 đ",
          exact: true,
        }),
      ).toBeVisible();
      const qr = resident.getByAltText(`VietQR hóa đơn ${bill.so_hoa_don}`);
      await expect(qr).toBeVisible();
      await expect
        .poll(() => qr.evaluate((img) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect(
        resident.getByRole("button", { name: "Xác nhận đã thu", exact: true }),
      ).toHaveCount(0);
      const payment = resident.getByRole("region", {
        name: "Thông tin thanh toán hóa đơn",
      });
      // Section has an accessible name; its QR must sit in the center at both sizes.
      const qrBox = await qr.boundingBox(),
        cardBox = await payment.boundingBox();
      expect(
        Math.abs(qrBox.x + qrBox.width / 2 - cardBox.x - cardBox.width / 2),
      ).toBeLessThan(2);
      await expect(
        payment.getByText("Vietcombank", { exact: true }),
      ).toBeVisible();
      await expect(
        payment.getByText("3.370.535 đ", { exact: true }),
      ).toBeVisible();
      await expect(
        payment.getByRole("link", { name: "Tải mã QR", exact: true }),
      ).toHaveAttribute("href", /^data:image\/png/);
      await payment.screenshot({ path: `/tmp/chung-cu-payment-${width}.png` });
      await page.getByLabel("Mã tham chiếu giao dịch").fill(`E2E-${suffix}`);
      await page.getByLabel("Đã đối soát đủ số tiền hóa đơn").check();
      await page
        .getByRole("button", { name: "Xác nhận đã thu", exact: true })
        .click();
      await expect(
        page.getByText("Đã ghi nhận 3.370.535 đ", { exact: false }),
      ).toBeVisible();
      await resident.reload();
      await expect(
        resident.getByText("Đã ghi nhận 3.370.535 đ", { exact: false }),
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
