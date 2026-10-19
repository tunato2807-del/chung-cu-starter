import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`register motorbike and bicycle → duplicate → carry on same-day move → end at ${width}px`, async ({
    page,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10);
    const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      ownerName = `Xe E2E ${suffix}`,
      plate = `E${suffix.toUpperCase()}9`;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const apartments = [],
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let userId, ownerId;
    try {
      const user = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`BQL ${suffix}`, phone, hash, "QUAN_TRI_VIEN"],
      );
      userId = user.insertId;
      for (const index of [1, 2]) {
        const a = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,?)",
          [`VX-${suffix}-${index}`, "VX", 2, 70],
        );
        apartments.push(a.insertId);
      }
      const owner = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
        [ownerName, phone],
      );
      ownerId = owner.insertId;
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [ownerId, apartments[0], "THANH_VIEN", day, userId],
      );
      await page.goto("/dang-nhap");
      await page.getByLabel("Số điện thoại").fill(phone);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Phương tiện", exact: true }),
      ).toBeVisible();
      await page.goto(`/quan-tri/cu-dan/${ownerId}`);
      await page
        .getByRole("link", { name: "Phương tiện của cư dân", exact: true })
        .click();
      async function startRegistration() {
        await page
          .getByRole("button", { name: "Đăng ký xe", exact: true })
          .click();
        await expect(
          page.getByRole("option", { name: new RegExp(phone) }),
        ).toBeAttached();
        await page
          .getByLabel("Cư dân đăng ký xe", { exact: true })
          .selectOption(String(ownerId));
      }
      await startRegistration();
      await page.getByLabel("Biển số", { exact: true }).fill(`e-${suffix}9`);
      await page.getByLabel("Hãng xe", { exact: true }).fill("Honda");
      await page.getByLabel("Màu sắc", { exact: true }).fill("Đen");
      await page
        .getByRole("button", { name: "Lưu đăng ký xe", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Đã tạo đăng ký xe." }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell").filter({ hasText: plate }),
      ).toBeVisible();
      await startRegistration();
      await page.getByLabel("Loại xe", { exact: true }).selectOption("XE_DAP");
      await expect(
        page.getByLabel("Biển số (tùy chọn)", { exact: true }),
      ).not.toHaveAttribute("required");
      await page
        .getByRole("button", { name: "Lưu đăng ký xe", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await startRegistration();
      await page.getByLabel("Biển số", { exact: true }).fill(plate);
      await page
        .getByRole("button", { name: "Lưu đăng ký xe", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText(
        "Biển số đã có đăng ký",
      );
      await expect(page.getByLabel("Biển số", { exact: true })).toHaveValue(
        plate,
      );
      await page
        .getByRole("button", { name: "Đóng biểu mẫu", exact: true })
        .click();

      const original = await rows(
        pool,
        "SELECT * FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien",
        [ownerId],
      );
      expect(original).toHaveLength(2);
      await page.goto(`/quan-tri/cu-dan/${ownerId}`);
      await page
        .getByRole("button", { name: "Chuyển căn", exact: true })
        .click();
      await expect(
        page.getByLabel("Chuyển đăng ký xe đang gửi sang căn mới"),
      ).toBeChecked();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(`VX-${suffix}-2`);
      await expect(
        page.getByRole("option", { name: new RegExp(`VX-${suffix}-2`) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[1]));
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByText(`Đang ở căn VX-${suffix}-2`, { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Phương tiện của cư dân", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(4);
      const records = await rows(
        pool,
        "SELECT * FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien",
        [ownerId],
      );
      expect(
        records
          .slice(0, 2)
          .every(
            (v) => v.ma_can_ho === apartments[0] && v.ngay_ket_thuc === day,
          ),
      ).toBe(true);
      expect(
        records
          .slice(2)
          .every(
            (v) => v.ma_can_ho === apartments[1] && v.ngay_ket_thuc === null,
          ),
      ).toBe(true);
      const bike = records.find(
        (v) => v.loai_xe === "XE_DAP" && !v.ngay_ket_thuc,
      );
      const bikeRow = page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", { name: bike.ma_dang_ky, exact: true }),
        });
      await bikeRow
        .getByRole("button", { name: "Chi tiết", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Chi tiết đăng ký xe", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(`Lý do kết thúc:`, { exact: false }),
      ).toHaveCount(0);
      await bikeRow
        .getByRole("button", { name: "Kết thúc", exact: true })
        .click();
      await page
        .getByLabel("Lý do kết thúc", { exact: true })
        .fill("Không gửi xe đạp nữa");
      await page
        .getByRole("button", { name: "Xác nhận kết thúc", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Đã kết thúc đăng ký xe." }),
      ).toBeVisible();
      await expect(
        bikeRow.getByRole("button", { name: "Kết thúc", exact: true }),
      ).toHaveCount(0);

      await page.goto(`/quan-tri/cu-dan/${ownerId}`);
      await page
        .getByRole("button", { name: "Chuyển căn", exact: true })
        .click();
      await page
        .getByLabel("Chuyển đăng ký xe đang gửi sang căn mới")
        .uncheck();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(`VX-${suffix}-1`);
      await expect(
        page.getByRole("option", { name: new RegExp(`VX-${suffix}-1`) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[0]));
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByText(`Đang ở căn VX-${suffix}-1`, { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Phương tiện của cư dân", exact: true })
        .click();
      await page
        .getByLabel("Tình trạng đăng ký", { exact: true })
        .selectOption("DANG_GUI");
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      await expect(
        page.getByText("Chưa có đăng ký xe phù hợp.", { exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Tình trạng đăng ký", { exact: true })
        .selectOption("DA_KET_THUC");
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      await expect(page.locator("tbody tr")).toHaveCount(4);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      if (ownerId) {
        await rows(
          pool,
          "DELETE FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
          [ownerId],
        );
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
          ownerId,
        ]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [ownerId]);
      }
      for (const id of apartments)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      if (userId)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          userId,
        ]);
    }
  });
