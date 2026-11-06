import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { imageDir } from "../../src/lib/images.js";
import * as treasury from "../../src/modules/treasury/treasury.service.js";
import { verifyForeignKeys } from "../../../scripts/copy-thesis-data.js";
import { exceptions } from "../../../scripts/realistic-data-plan.js";

export async function verifyData(c) {
  const tables = await c.rows(
    c.pool,
    "SELECT TABLE_NAME AS name,TABLE_TYPE AS type FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME",
  );
  c.check(
    "31 bảng thật và 8 view lịch sử",
    tables.filter((t) => t.type === "BASE TABLE").length === 31 &&
      tables.filter((t) => t.type === "VIEW").length === 8,
  );
  for (const table of tables) {
    if (!/^[a-z0-9_]+$/.test(table.name))
      throw new Error("Unexpected table name.");
    const [count] = await c.rows(
      c.pool,
      `SELECT COUNT(*) AS n FROM \`${table.name}\``,
    );
    const reason = exceptions[table.name] || null;
    const record = {
      table: table.name,
      type: table.type,
      rows: Number(count.n),
      minimum: reason ? null : 100,
      reason,
    };
    c.manifest.tables.push(record);
    c.check(
      `${table.name}: ${reason ? "danh mục hợp lý" : "tối thiểu 100 dòng"}`,
      reason ? record.rows > 0 : record.rows >= 100,
    );
  }
  c.check(
    "81 khóa ngoại không có bản ghi mồ côi",
    (await verifyForeignKeys(c.pool)) === 81,
  );
  for (const [label, sql] of [
    [
      "Tổng hóa đơn bằng tổng chi tiết",
      "SELECT COUNT(*) AS n FROM hoa_don h WHERE h.tong_tien<>(SELECT COALESCE(SUM(d.thanh_tien),0) FROM chi_tiet_hoa_don d WHERE d.ma_hoa_don=h.ma_hoa_don)",
    ],
    [
      "Số đã thu khớp hóa đơn thanh toán",
      "SELECT COUNT(*) AS n FROM hoa_don WHERE (trang_thai='DA_THANH_TOAN' AND (so_tien_da_thu<>tong_tien OR ngay_thanh_toan IS NULL)) OR (trang_thai<>'DA_THANH_TOAN' AND so_tien_da_thu<>0)",
    ],
    [
      "Chủ hộ phụ trách đang cư trú đúng căn",
      "SELECT COUNT(*) AS n FROM nguoi_dung u LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=u.ma_cu_dan_phu_trach AND l.ma_can_ho=u.ma_can_ho_thanh_toan AND l.den_ngay IS NULL AND l.quan_he='CHU_HO' WHERE u.ma_can_ho_thanh_toan IS NOT NULL AND l.ma_lich_su_cu_tru IS NULL",
    ],
    [
      "Mỗi cư dân chỉ có một đợt cư trú hiện tại",
      "SELECT COUNT(*) AS n FROM (SELECT ma_cu_dan FROM lich_su_cu_tru WHERE den_ngay IS NULL GROUP BY ma_cu_dan HAVING COUNT(*)>1) x",
    ],
    [
      "Chuỗi chỉ số liên tục qua các kỳ",
      "SELECT COUNT(*) AS n FROM (SELECT chi_so_cu,LAG(chi_so_moi) OVER(PARTITION BY ma_can_ho,loai_dich_vu ORDER BY ky_thanh_toan) AS truoc FROM chi_so_dich_vu) x WHERE truoc IS NOT NULL AND chi_so_cu<>truoc",
    ],
    [
      "Lịch tiện ích đang giữ chỗ không trùng giờ",
      "SELECT COUNT(*) AS n FROM dat_lich_tien_ich a JOIN dat_lich_tien_ich b ON a.ma_tien_ich=b.ma_tien_ich AND a.ma_dat_lich<b.ma_dat_lich AND a.bat_dau<b.ket_thuc AND b.bat_dau<a.ket_thuc WHERE a.trang_thai IN ('CHO_DUYET','DA_DUYET') AND b.trang_thai IN ('CHO_DUYET','DA_DUYET')",
    ],
    [
      "Mốc hóa đơn đúng thứ tự",
      "SELECT COUNT(*) AS n FROM hoa_don WHERE ngay_duyet<ngay_tao OR ngay_gui<ngay_duyet OR ngay_thanh_toan<ngay_gui",
    ],
    [
      "Lịch bảo trì kế tiếp khớp ngày hoàn thành lịch sử",
      "SELECT COUNT(*) AS n FROM phieu_bao_tri p JOIN thiet_bi t ON t.ma_thiet_bi=p.ma_thiet_bi WHERE p.loai='DINH_KY' AND p.trang_thai='HOAN_THANH' AND t.ngay_bao_tri_tiep_theo<>DATE_ADD(p.ngay_thuc_hien,INTERVAL p.chu_ky_ngay DAY)",
    ],
  ]) {
    const [result] = await c.rows(c.pool, sql);
    c.check(label, Number(result.n) === 0);
  }
  const funds = await c.rows(
    c.pool,
    "SELECT ma_quy,nhan_thu_hoa_don FROM quy_tai_chinh",
  );
  for (const fund of funds) {
    const detail = await treasury.fundDetail(fund.ma_quy);
    const [sum] = fund.nhan_thu_hoa_don
      ? await c.rows(
          c.pool,
          "SELECT CAST(COALESCE(SUM(so_tien_da_thu),0) AS CHAR) AS amount FROM hoa_don WHERE trang_thai='DA_THANH_TOAN'",
        )
      : await c.rows(
          c.pool,
          "SELECT CAST(COALESCE(SUM(IF(loai='THU',so_tien,-so_tien)),0) AS CHAR) AS amount FROM phieu_thu_chi WHERE ma_quy=? AND trang_thai='DA_GHI_SO'",
          [fund.ma_quy],
        );
    c.check(
      `Quỹ ${fund.ma_quy}: số dư khớp nguồn thu/chi`,
      detail.so_du === sum.amount && BigInt(detail.so_du) >= 0n,
    );
  }
  const images = await c.rows(
    c.pool,
    "SELECT duong_dan_tep FROM hinh_anh_phan_anh",
  );
  for (const image of images)
    await access(path.join(imageDir, image.duong_dan_tep));
  c.check("Tất cả ảnh đính kèm có tệp trên đĩa", images.length >= 100);
}

export async function verifyApi(c) {
  const { app } = await import("../../src/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const req = async (url, cookie = "", body, status = 200) => {
    const response = await fetch(base + url, {
      method: body ? "POST" : "GET",
      headers: {
        "X-App-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60000),
    });
    c.check(`HTTP ${status} ${url}`, response.status === status);
    return response;
  };
  const login = async (account, identifier = account.login) => {
    const response = await req("/xac_thuc/dang_nhap", "", {
      ten_dang_nhap: identifier,
      mat_khau: account.password,
      loai_tai_khoan: account.kind,
    });
    return response.headers.get("set-cookie").split(";")[0];
  };
  try {
    await req("/ready");
    const admin = c.manifest.accounts.find((a) => a.role === "QUAN_TRI_VIEN"),
      cookie = await login(admin);
    for (const endpoint of [
      "/tong_quan",
      "/can_ho",
      "/can_ho/so_do",
      "/cu_dan",
      "/phuong_tien",
      "/thiet_bi",
      "/bao_tri",
      "/thong_bao",
      "/dat_lich_tien_ich",
      "/quy",
      "/bao_cao/cong_no",
      "/bao_cao/thu_phi",
      "/trao_doi_du_lieu/lich_su",
    ])
      await req(endpoint, cookie);
    for (const range of ["NGAY", "TUAN", "THANG", "QUY", "NAM"])
      await req(`/tong_quan/thong_ke?khoang=${range}&ngay=${c.day}`, cookie);
    for (const kind of [
      "can_ho",
      "cu_dan",
      "phuong_tien",
      "chi_so",
      "thiet_bi",
      "bao_tri",
      "hoa_don",
      "dat_lich",
    ]) {
      const query =
        kind === "chi_so" ? `&ky_thanh_toan=${c.day.slice(0, 7)}` : "";
      const response = await req(
        `/trao_doi_du_lieu/${kind}/xuat?dinh_dang=xlsx${query}`,
        cookie,
      );
      const buffer = Buffer.from(await response.arrayBuffer());
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      c.check(
        `Excel ${kind} có bảng Chi tiết và tối thiểu 100 dòng`,
        wb.getWorksheet("Chi tiết")?.rowCount >= 101,
      );
      await writeFile(path.join(c.out, "xuat", `${kind}.xlsx`), buffer);
    }
    for (const kind of ["cong_no", "thu_phi"])
      for (const format of ["xlsx", "pdf"]) {
        const response = await req(
          `/bao_cao/${kind}/xuat?dinh_dang=${format}`,
          cookie,
        );
        const buffer = Buffer.from(await response.arrayBuffer());
        c.check(
          `Định dạng ${kind}.${format}`,
          buffer.subarray(0, format === "pdf" ? 4 : 2).toString() ===
            (format === "pdf" ? "%PDF" : "PK"),
        );
        await writeFile(path.join(c.out, "xuat", `${kind}.${format}`), buffer);
      }
    const payer = c.manifest.accounts.find(
        (a) => a.kind === "CAN_HO" && a.phone,
      ),
      payerCookie = await login(payer);
    await login(payer, payer.phone);
    for (const endpoint of [
      "/cua_toi/hoa_don",
      "/cua_toi/thong_bao",
      "/cua_toi/dat_lich",
      "/phan_anh",
    ])
      await req(endpoint, payerCookie);
    await req("/nguoi_dung", payerCookie, undefined, 403);
    const technician = c.manifest.accounts.find(
        (a) => a.role === "KY_THUAT_VIEN" && a.active,
      ),
      techCookie = await login(technician);
    await req("/bao_tri", techCookie);
    await req("/phan_anh", techCookie);
    await req("/can_ho", techCookie, undefined, 403);
    const locked = c.manifest.accounts.find((a) => !a.active);
    await req(
      "/xac_thuc/dang_nhap",
      "",
      { so_dien_thoai: locked.login, mat_khau: locked.password },
      401,
    );
    const activeQr = c.manifest.qr.find((q) => q.active);
    await req(
      `/cong_khai/vi_tri_qr/${new URL(activeQr.url).pathname.split("/").at(-1)}`,
    );
    const lookup = c.manifest.scenarios.find(
      (s) => typeof s === "object" && s.lookup,
    );
    await req("/cong_khai/phan_anh/tra_cuu", "", {
      ma_tra_cuu: lookup.lookup,
      so_dien_thoai: lookup.phone,
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
