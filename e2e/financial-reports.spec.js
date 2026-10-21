import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { today } from "../backend/src/modules/billing/billing.validation.js";

for (const width of [1440, 375])
  test(`financial reports filters → overdue → invoice reminder/payment → Vietnam receipt date at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      block = `R${suffix}`,
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      apartments = [],
      bills = [],
      errors = [],
      d = today(),
      yesterday = new Date(new Date(`${d}T00:00:00Z`).getTime() - 86400000)
        .toISOString()
        .slice(0, 10);
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    let adminId, main;
    async function bill(apt, month, status, amount, due, paidAt = null) {
      const r = await rows(
        pool,
        "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan,ngay_thanh_toan,so_tien_da_thu,ma_tham_chieu,ma_nguoi_xac_nhan) VALUES (?,?,?,?,1,0,0,0,?,'[]',?,?,?,?,?,?,?,?)",
        [
          `RF-${suffix}-${bills.length}`,
          apt,
          month,
          `${month}-01`,
          amount,
          "a".repeat(64),
          adminId,
          status,
          due,
          paidAt,
          status === "DA_THANH_TOAN" ? amount : 0,
          status === "DA_THANH_TOAN" ? `RF-${suffix}-${bills.length}` : null,
          status === "DA_THANH_TOAN" ? adminId : null,
        ],
      );
      bills.push(r.insertId);
      return r.insertId;
    }
    async function apply() {
      const expected = await page
        .locator("form.finance-filters")
        .evaluate((form) => Object.fromEntries(new FormData(form)));
      const loaded = page.waitForResponse((r) => {
        const url = new URL(r.url());
        return (
          url.pathname.startsWith("/api/bao_cao/") &&
          url.pathname !== "/api/bao_cao/bo_loc" &&
          Object.entries(expected).every(
            ([key, value]) => url.searchParams.get(key) === value,
          )
        );
      });
      await page
        .getByRole("button", { name: "Xem báo cáo", exact: true })
        .click();
      expect((await loaded).status()).toBe(200);
      await expect(
        page.getByRole("button", { name: "Cập nhật số liệu", exact: true }),
      ).toBeEnabled();
      await expect(page.locator(".finance-snapshot")).toBeVisible();
    }
    async function pickBlock() {
      await expect(
        page.getByRole("option", { name: block, exact: true }),
      ).toBeAttached();
      await page.getByLabel("Khối", { exact: true }).selectOption(block);
      await apply();
    }
    const metrics = () => page.locator('[aria-label="Tổng hợp công nợ"]');
    try {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const u = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [`BQL ${suffix}`, phone, hash],
      );
      adminId = u.insertId;
      for (let i = 0; i < 3; i++) {
        const a = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
          [`RF-${suffix}-${i}`, i === 2 ? "EX" : block],
        );
        apartments.push(a.insertId);
      }
      main = await bill(
        apartments[0],
        "2026-09",
        "DA_GUI",
        "100000",
        yesterday,
      );
      await bill(apartments[0], "2026-10", "DA_GUI", "200000", d);
      await bill(
        apartments[0],
        "2026-08",
        "DA_THANH_TOAN",
        "300000",
        d,
        "2026-10-14 17:00:00",
      );
      await bill(apartments[0], "2026-07", "DA_DUYET", "900000", d);
      await bill(apartments[0], "2026-06", "HUY", "800000", d);
      await bill(apartments[1], "2026-10", "DA_GUI", "400000", yesterday);
      await bill(
        apartments[1],
        "2026-07",
        "DA_THANH_TOAN",
        "500000",
        d,
        "2026-10-15 16:59:59",
      );
      await bill(apartments[2], "2026-10", "DA_GUI", "9999999", yesterday);
      await page.goto("/dang-nhap");
      await page.getByLabel("Số điện thoại").fill(phone);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await page.waitForURL("**/quan-tri");
      await page
        .getByRole("link", { name: "Công nợ & thu phí", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Báo cáo công nợ và thu phí",
          exact: true,
        }),
      ).toBeVisible();
      await pickBlock();
      await expect(metrics()).toContainText("1.500.000 đ");
      await expect(metrics()).toContainText("800.000 đ");
      await expect(metrics()).toContainText("700.000 đ");
      await expect(metrics()).toContainText("500.000 đ");
      await expect(page.locator("tbody tr")).toHaveCount(2);
      const overdueLoaded = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/bao_cao/cong_no" &&
          new URL(r.url()).searchParams.get("qua_han") === "1",
      );
      await page.getByRole("button", { name: /^Nợ quá hạn/ }).click();
      expect((await overdueLoaded).status()).toBe(200);
      await expect(
        page.getByRole("link", { name: `RF-${suffix}-0`, exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("Chỉ hóa đơn quá hạn")).toBeChecked();
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await expect(metrics()).toContainText("700.000 đ");
      await page.getByLabel("Chỉ hóa đơn quá hạn").uncheck();
      await expect(page.locator("tbody tr")).toHaveCount(3);
      await expect(
        page.getByRole("cell", { name: "Chưa quá hạn", exact: true }),
      ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Tổng hợp theo kỳ", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(4);
      await page
        .getByRole("button", { name: "Công nợ theo căn", exact: true })
        .click();
      const aptRow = page.getByRole("row").filter({
        has: page.getByRole("cell", { name: new RegExp(`RF-${suffix}-0`) }),
      });
      await aptRow
        .getByRole("button", { name: "Xem hóa đơn", exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`ma_can_ho=${apartments[0]}`));
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await expect(metrics()).toContainText("600.000 đ");
      await page.reload();
      await expect(page.locator("tbody tr")).toHaveCount(2);
      const mainRow = page.getByRole("row").filter({
        has: page.getByRole("link", { name: `RF-${suffix}-0`, exact: true }),
      });
      await mainRow
        .getByRole("link", { name: "Kiểm tra / nhắc phí", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Nhắc thanh toán trên web", exact: true })
        .click();
      await expect(
        page.getByText("Đã gửi nhắc thanh toán vào hộp thông báo trên web.", {
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel("Mã tham chiếu giao dịch").fill(`RF-PAY-${suffix}`);
      await page.getByLabel("Đã đối soát đủ số tiền hóa đơn").check();
      await page
        .getByRole("button", { name: "Xác nhận đã thu", exact: true })
        .click();
      await expect(
        page.getByText("Đã ghi nhận 100.000 đ", { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Công nợ & thu phí", exact: true })
        .click();
      await pickBlock();
      await expect(metrics()).toContainText("900.000 đ");
      await expect(metrics()).toContainText("600.000 đ");
      await expect(metrics()).toContainText("400.000 đ");
      await page
        .getByRole("button", {
          name: "Thu phí theo ngày xác nhận",
          exact: true,
        })
        .click();
      await expect(page.getByLabel("Từ ngày xác nhận")).toHaveValue(
        `${d.slice(0, 7)}-01`,
      );
      await expect(page.getByLabel("Đến ngày xác nhận")).toHaveValue(d);
      await page.getByLabel("Từ ngày xác nhận").fill("2026-10-15");
      await page.getByLabel("Đến ngày xác nhận").fill("2026-10-15");
      await apply();
      await expect(
        page.locator('[aria-label="Tổng hợp thu phí"]'),
      ).toContainText("800.000 đ");
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await expect(page.getByRole("cell", { name: /2026-08/ })).toBeVisible();
      await page
        .getByRole("button", { name: "Tổng hợp theo ngày", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(1);
      await expect(
        page.getByRole("cell", { name: "15/10/2026", exact: true }),
      ).toBeVisible();
      await page.getByLabel("Từ ngày xác nhận").fill(d);
      await page.getByLabel("Đến ngày xác nhận").fill(d);
      await apply();
      await expect(
        page.locator('[aria-label="Tổng hợp thu phí"]'),
      ).toContainText("100.000 đ");
      await page
        .getByRole("button", { name: "Các khoản đã thu", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: `RF-${suffix}-0`, exact: true }),
      ).toBeVisible();
      await page.getByLabel("Tìm số căn hộ").fill("NO-RESULT-SENTINEL");
      await apply();
      await expect(
        page.getByText(
          "Chưa có khoản thu trong khoảng ngày và bộ lọc đã chọn.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Tổng hợp thu phí"]'),
      ).toContainText("0 đ");
      await page
        .getByRole("button", { name: "Xóa bộ lọc", exact: true })
        .click();
      await expect(page.getByLabel("Tìm số căn hộ")).toHaveValue("");
      await page
        .getByRole("button", { name: "Công nợ theo kỳ hóa đơn", exact: true })
        .click();
      await expect(page.getByLabel("Từ kỳ hóa đơn")).toBeVisible();
      await pickBlock();
      await page.getByLabel("Từ kỳ hóa đơn").fill("2026-09");
      await page.getByLabel("Đến kỳ hóa đơn").fill("2026-10");
      await apply();
      await expect(metrics()).toContainText("700.000 đ");
      await expect(metrics()).toContainText("100.000 đ");
      await page
        .getByRole("button", { name: "Tổng hợp theo kỳ", exact: true })
        .click();
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await expect(
        page.getByRole("cell", { name: "2026-10", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "2026-09", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Cập nhật số liệu", exact: true }),
      ).toBeEnabled();
      await page.screenshot({
        path: `/tmp/chung-cu-finance-${width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close().catch(() => {});
      for (const id of bills.reverse()) {
        await rows(pool, "DELETE FROM thong_bao WHERE ma_hoa_don=?", [id]);
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
          id,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [id]);
      }
      for (const id of apartments)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      if (adminId)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          adminId,
        ]);
    }
  });
