import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { today } from "../backend/src/modules/billing/billing.validation.js";

for (const width of [1440, 375])
  test(`announcement draft → publish → unread/read → bill reminder → paid at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      users = [],
      phones = [],
      notifications = [];
    let apartmentId, profileId, billId;
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
        const r = await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [`TB ${suffix}`, phone, hash, role],
        );
        users.push(r.insertId);
        phones.push(phone);
      }
      const a = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
        [`TB-${suffix}`, "NT"],
      );
      apartmentId = a.insertId;
      const c = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES (?,?,?)",
        [`Chủ hộ ${suffix}`, phones[1], users[1]],
      );
      profileId = c.insertId;
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'CHU_HO',?,?)",
        [profileId, apartmentId, today(), users[0]],
      );
      await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,ten_dang_nhap,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?,?,'CU_DAN')",
        [
          `Căn ${suffix}`,
          `CH${String(apartmentId).padStart(6, "0")}`,
          apartmentId,
          profileId,
          hash,
        ],
      );
      const b = await rows(
        pool,
        "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap,trang_thai,han_thanh_toan) VALUES (?,?,?,?,1,0,0,0,150000,'[]',?,?,'DA_GUI',?)",
        [
          `TB-${suffix}`,
          apartmentId,
          today().slice(0, 7),
          today(),
          "a".repeat(64),
          users[0],
          today(),
        ],
      );
      billId = b.insertId;
      async function login(p, i) {
        await p.goto("/dang-nhap");
        await p.getByLabel("Số điện thoại").fill(phones[i]);
        await p.getByLabel("Loại tài khoản").selectOption("CA_NHAN");
        await p.getByLabel("Mật khẩu", { exact: true }).fill(password);
        await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await p.waitForURL(i === 0 ? "**/quan-tri" : "**/cu-dan/phan-anh");
      }
      await login(page, 0);
      await page.getByRole("link", { name: "Thông báo", exact: true }).click();
      await page
        .getByRole("button", { name: "Soạn thông báo", exact: true })
        .click();
      const title = `Bảo trì khu vực ${suffix}`;
      await page.getByLabel("Tiêu đề thông báo", { exact: true }).fill(title);
      const content =
        "Thông báo bảo trì.\n<script>window.notificationInjected=true</script>";
      await page
        .getByLabel("Nội dung thông báo", { exact: true })
        .fill(content);
      await page
        .getByLabel("Phạm vi nhận", { exact: true })
        .selectOption("CAN_HO");
      await page
        .getByLabel("Tìm căn hộ nhận thông báo", { exact: true })
        .fill(`TB-${suffix}`);
      await expect(
        page.getByRole("option", {
          name: `TB-${suffix} · Khối NT`,
          exact: true,
        }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ nhận thông báo", { exact: true })
        .selectOption(String(apartmentId));
      await page
        .getByLabel("Mức độ", { exact: true })
        .selectOption("QUAN_TRONG");
      await page
        .getByRole("button", { name: "Tạo bản nháp", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      const notificationId = Number(page.url().split("/").at(-1));
      notifications.push(notificationId);
      await login(resident, 1);
      await resident.getByRole("link", { name: /^Thông báo/ }).click();
      await expect(
        resident.getByRole("link", { name: title, exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", {
          name: "Phát hành thông báo đã lưu",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Đã phát hành", { exact: true }),
      ).toBeVisible();
      await resident.reload();
      await expect(
        resident.getByRole("link", { name: /^Thông báo/ }),
      ).toContainText("1");
      await expect(
        resident.locator(".notification-item.is-unread"),
      ).toHaveCount(1);
      await resident.getByRole("link", { name: title, exact: true }).click();
      await expect(resident.locator(".notification-body")).toHaveText(content);
      await expect(resident.getByText("Đã đọc", { exact: true })).toBeVisible();
      expect(
        await resident.evaluate(() => window.notificationInjected),
      ).toBeUndefined();
      await expect(resident.locator(".notification-count")).toHaveCount(0);
      await page.goto(`/quan-tri/hoa-don/${billId}`);
      const reminderResponse = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api/hoa_don/${billId}/nhac_phi` &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Nhắc thanh toán trên web", exact: true })
        .click();
      const reminderData = await (await reminderResponse).json();
      const reminderId = reminderData.data.ma_thong_bao;
      notifications.push(reminderId);
      await expect(
        page.getByText("Đã gửi nhắc thanh toán vào hộp thông báo trên web.", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Nhắc thanh toán trên web", exact: true })
        .click();
      await expect(
        page.getByText("Hóa đơn này đã được nhắc trên web hôm nay.", {
          exact: true,
        }),
      ).toBeVisible();
      await resident.goto("/cu-dan/thong-bao");
      await expect(
        resident.getByRole("link", { name: /^Thông báo/ }),
      ).toContainText("1");
      const reminderTitle = `Nhắc thanh toán hóa đơn TB-${suffix}`;
      await expect(
        resident.getByRole("link", { name: reminderTitle, exact: true }),
      ).toBeVisible();
      // Pay without reading: resolved reminder must disappear from unread, but remain accessible.
      await page.getByLabel("Mã tham chiếu giao dịch").fill(`TB-${suffix}`);
      await page.getByLabel("Đã đối soát đủ số tiền hóa đơn").check();
      await page
        .getByRole("button", { name: "Xác nhận đã thu", exact: true })
        .click();
      await expect(
        page.getByText("Đã ghi nhận 150.000 đ", { exact: false }),
      ).toBeVisible();
      await resident.reload();
      await expect(resident.locator(".notification-count")).toHaveCount(0);
      await resident
        .getByRole("link", { name: reminderTitle, exact: true })
        .click();
      await expect(
        resident.getByText("Hóa đơn đã được xác nhận thanh toán.", {
          exact: true,
        }),
      ).toBeVisible();
      await resident
        .getByRole("link", { name: "Xem hóa đơn", exact: true })
        .click();
      await expect(
        resident.getByText("Đã ghi nhận 150.000 đ", { exact: false }),
      ).toBeVisible();
      await page.goto(`/quan-tri/thong-bao/${notificationId}`);
      await page.getByLabel("Lý do thu hồi").fill("Lịch bảo trì đã thay đổi");
      await page
        .getByRole("button", { name: "Thu hồi thông báo", exact: true })
        .click();
      await expect(page.getByText("Đã thu hồi", { exact: true })).toBeVisible();
      await resident.goto("/cu-dan/thong-bao");
      await expect(
        resident.getByRole("link", { name: title, exact: true }),
      ).toHaveCount(0);
      await resident.screenshot({
        path: `/tmp/chung-cu-notifications-${width}.png`,
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
      await Promise.allSettled([adminContext.close(), residentContext.close()]);
      // Find every created record even if a browser assertion failed after its POST.
      await rows(pool, "DELETE FROM thong_bao WHERE ma_nguoi_tao=?", [
        users[0] || 0,
      ]);
      if (billId) {
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
          billId,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [billId]);
      }
      if (profileId) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
          profileId,
        ]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [profileId]);
      }
      if (apartmentId)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartmentId]);
      for (const id of users)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
