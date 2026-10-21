import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login as createSession } from "../backend/src/modules/auth/auth.service.js";
import {
  today,
  addDays,
} from "../backend/src/modules/maintenance/maintenance.validation.js";

for (const width of [1440, 375])
  test(`equipment → periodic work → technician report → return → acceptance → one-off cancellation at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10),
      users = [],
      phones = [],
      errors = [],
      assetCode = `TM-${suffix}`,
      assetName = `Thang máy ${suffix}`,
      d = today();
    let equipmentId;
    const adminContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      techContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      page = await adminContext.newPage(),
      tech = await techContext.newPage();
    for (const p of [page, tech])
      p.on("pageerror", (e) => errors.push(e.message));
    const dateVN = (x) => x.split("-").reverse().join("/");
    const code = (id) => `BT${String(id).padStart(6, "0")}`;
    async function waitPost(p, path, click) {
      const loaded = p.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === path && r.request().method() === "POST",
      );
      await click();
      const response = await loaded;
      expect(response.status()).toBeLessThan(300);
      return response.json();
    }
    async function chooseTechnician() {
      await page
        .getByLabel("Tìm kỹ thuật viên theo tên")
        .fill(`KTV BT ${suffix}`);
      await expect(
        page.getByRole("option", {
          name: `KTV BT ${suffix} · Điện nước`,
          exact: true,
        }),
      ).toBeAttached();
      await page
        .getByLabel("Kỹ thuật viên nhận phiếu")
        .selectOption(String(users[1]));
    }
    try {
      for (const [i, role] of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN"].entries()) {
        const phone =
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
        const r = await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro,chuyen_mon) VALUES (?,?,?,?,?)",
          [
            `${i === 0 ? "BQL" : "KTV"} BT ${suffix}`,
            phone,
            hash,
            role,
            i === 1 ? "Điện nước" : "",
          ],
        );
        users.push(r.insertId);
        phones.push(phone);
        // Real auth-service sessions, without consuming the shared HTTP login rate limit.
        const { token } = await createSession({
          so_dien_thoai: phone,
          mat_khau: password,
        });
        await (i === 0 ? adminContext : techContext).addCookies([
          {
            name: "session",
            value: token,
            url: "http://127.0.0.1:5174",
            httpOnly: true,
            sameSite: "Strict",
          },
        ]);
      }
      await page.goto("/quan-tri/thiet-bi");
      await expect(
        page.getByRole("heading", {
          name: "Thiết bị và lịch bảo trì",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Thêm thiết bị", exact: true })
        .first()
        .click();
      await page.getByLabel("Mã tài sản", { exact: true }).fill(assetCode);
      await page.getByLabel("Tên thiết bị", { exact: true }).fill(assetName);
      await page.getByLabel("Vị trí lắp đặt").fill("Khối A · tầng 1");
      await page.getByLabel("Số serial").fill(`SN-${suffix}`);
      await page.getByLabel("Ngày lắp đặt").fill("2020-01-01");
      await page.getByLabel("Chu kỳ bảo trì (ngày)").fill("30");
      await page.getByLabel("Ngày bảo trì kế tiếp").fill(addDays(d, -1));
      await page
        .getByLabel("Ghi chú thiết bị")
        .fill("Kiểm tra cửa và phanh trước vận hành.");
      const created = await waitPost(page, "/api/thiet_bi", () =>
        page
          .getByRole("button", { name: "Thêm thiết bị", exact: true })
          .last()
          .click(),
      );
      equipmentId = created.data.ma_thiet_bi;
      await expect(
        page.getByRole("heading", { name: assetName, exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Quá hạn", { exact: true })).toBeVisible();
      await page
        .getByRole("button", { name: "Lập phiếu định kỳ", exact: true })
        .click();
      await chooseTechnician();
      const job = await waitPost(
          page,
          `/api/thiet_bi/${equipmentId}/phieu_bao_tri`,
          () =>
            page
              .getByRole("button", { name: "Tạo phiếu bảo trì", exact: true })
              .click(),
        ),
        jobId = job.data.ma_phieu_bao_tri;
      await expect(
        page.getByRole("heading", {
          name: `Bảo trì định kỳ: ${assetName}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Đã phân công", { exact: true }),
      ).toBeVisible();
      await tech.goto("/ky-thuat/bao-tri");
      await tech.getByRole("link", { name: code(jobId), exact: true }).click();
      await waitPost(tech, `/api/bao_tri/${jobId}/bat_dau`, () =>
        tech
          .getByRole("button", { name: "Bắt đầu bảo trì", exact: true })
          .click(),
      );
      await expect(tech.getByLabel("Kết quả bảo trì")).toBeVisible();
      const firstResult =
        "Lượt một đã kiểm tra cửa, cần làm lại phanh.\n<script>window.maintenanceInjected=true</script>";
      await tech.getByLabel("Kết quả bảo trì").fill(firstResult);
      await waitPost(tech, `/api/bao_tri/${jobId}/bao_cao`, () =>
        tech
          .getByRole("button", { name: "Gửi báo cáo bảo trì", exact: true })
          .click(),
      );
      await expect(
        tech.getByText("Chờ nghiệm thu", { exact: true }),
      ).toBeVisible();
      expect(
        await tech.evaluate(() => window.maintenanceInjected),
      ).toBeUndefined();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Kết quả thực hiện", exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Lý do chưa đạt")
        .fill("Kiểm tra và chạy thử phanh thêm một lượt.");
      await waitPost(page, `/api/bao_tri/${jobId}/tra_lai`, () =>
        page
          .getByRole("button", { name: "Trả lại kỹ thuật viên", exact: true })
          .click(),
      );
      await expect(
        page.getByText("Đang thực hiện", { exact: true }),
      ).toBeVisible();
      await tech.reload();
      await expect(tech.getByLabel("Kết quả bảo trì")).toHaveValue("");
      await expect(tech.getByText(/Lượt một đã kiểm tra cửa/)).toBeVisible();
      const finalResult =
        "Lượt hai đã kiểm tra phanh, vệ sinh và chạy thử đầy đủ, hoạt động ổn định.";
      await tech.getByLabel("Kết quả bảo trì").fill(finalResult);
      await waitPost(tech, `/api/bao_tri/${jobId}/bao_cao`, () =>
        tech
          .getByRole("button", { name: "Gửi báo cáo bảo trì", exact: true })
          .click(),
      );
      await expect(
        tech.getByText("Chờ nghiệm thu", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await page
        .getByLabel("Nhận xét nghiệm thu")
        .fill("Đã kiểm tra và chạy thử đạt yêu cầu.");
      await waitPost(page, `/api/bao_tri/${jobId}/nghiem_thu`, () =>
        page
          .getByRole("button", { name: "Nghiệm thu đạt", exact: true })
          .click(),
      );
      await expect(page.getByText("Hoàn thành", { exact: true })).toBeVisible();
      await page
        .getByRole("link", { name: "Mở hồ sơ thiết bị", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: assetName, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(dateVN(addDays(d, 30)), { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Lập phiếu định kỳ", exact: true }),
      ).toBeEnabled();
      await page.screenshot({
        path: `/tmp/chung-cu-maintenance-equipment-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Lập phiếu đột xuất", exact: true })
        .click();
      await page.getByLabel("Tiêu đề công việc").fill(`Tiếng ồn ${suffix}`);
      await page
        .getByLabel("Nội dung cần thực hiện")
        .fill("Kiểm tra tiếng ồn bất thường và báo cáo tình trạng.");
      await page.getByLabel("Ưu tiên", { exact: true }).selectOption("CAO");
      const oneOff = await waitPost(
          page,
          `/api/thiet_bi/${equipmentId}/phieu_bao_tri`,
          () =>
            page
              .getByRole("button", { name: "Tạo phiếu bảo trì", exact: true })
              .click(),
        ),
        oneOffId = oneOff.data.ma_phieu_bao_tri;
      await expect(
        page.getByText("Chưa phân công", { exact: true }).first(),
      ).toBeVisible();
      await tech.goto("/ky-thuat/bao-tri");
      await expect(
        tech.getByRole("link", { name: code(oneOffId), exact: true }),
      ).toHaveCount(0);
      await chooseTechnician();
      await waitPost(page, `/api/bao_tri/${oneOffId}/phan_cong`, () =>
        page
          .getByRole("button", { name: "Lưu phân công", exact: true })
          .click(),
      );
      await expect(
        page.getByText("Đã phân công", { exact: true }),
      ).toBeVisible();
      await page.getByLabel("Hạn thực hiện mới").fill(addDays(d, 2));
      await page
        .getByLabel("Lý do đổi lịch")
        .fill("Thực hiện theo lịch nhà cung cấp.");
      await waitPost(page, `/api/bao_tri/${oneOffId}/doi_lich`, () =>
        page.getByRole("button", { name: "Lưu lịch mới", exact: true }).click(),
      );
      await expect(page.getByLabel("Hạn thực hiện mới")).toHaveValue(
        addDays(d, 2),
      );
      await tech.reload();
      await tech
        .getByRole("link", { name: code(oneOffId), exact: true })
        .click();
      await expect(
        tech.getByRole("button", { name: "Bắt đầu bảo trì", exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Lý do hủy phiếu")
        .fill("Tạm hoãn kiểm tra đột xuất.");
      await waitPost(page, `/api/bao_tri/${oneOffId}/huy`, () =>
        page
          .getByRole("button", { name: "Hủy phiếu bảo trì", exact: true })
          .click(),
      );
      await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
      await tech.reload();
      await expect(tech.getByText("Đã hủy", { exact: true })).toBeVisible();
      await expect(
        tech.getByRole("button", { name: "Bắt đầu bảo trì", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("link", { name: "Mở hồ sơ thiết bị", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Sửa thiết bị / lịch", exact: true })
        .click();
      await page
        .getByLabel("Trạng thái thiết bị", { exact: true })
        .selectOption("NGUNG_SU_DUNG");
      const saved = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api/thiet_bi/${equipmentId}` &&
          r.request().method() === "PUT",
      );
      await page
        .getByRole("button", { name: "Lưu thiết bị", exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      await expect(
        page.getByText("Ngừng theo dõi", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Lập phiếu định kỳ", exact: true }),
      ).toHaveCount(0);
      for (const p of [page, tech])
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await Promise.allSettled([adminContext.close(), techContext.close()]);
      // Find by unique asset code too, so cleanup survives a failed assertion after POST.
      const fixtures = await rows(
        pool,
        "SELECT ma_thiet_bi FROM thiet_bi WHERE ma_tai_san=?",
        [assetCode],
      );
      for (const { ma_thiet_bi: id } of fixtures) {
        await rows(pool, "DELETE FROM phieu_bao_tri WHERE ma_thiet_bi=?", [id]);
        await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
      }
      for (const id of users)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
