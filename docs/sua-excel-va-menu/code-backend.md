# Code backend đầy đủ — sửa Excel và menu

[Quay lại hướng dẫn cập nhật](../cap-nhat-excel-va-menu-vscode.md). Chép nội dung vào đúng đường dẫn; đây là bản đầy đủ nghiệp vụ trên nhánh `codex/editorial-business-ui`.

## backend/src/modules/data-exchange/import-files.js

```js
import { Worker } from "node:worker_threads";
import { extname } from "node:path";
import { fail } from "../../lib/http.js";
import { catalog } from "./catalog.js";

export async function parseFile(file, kind) {
  if (!file)
    fail(422, "FILE_REQUIRED", "Chọn tệp Excel .xlsx đã điền dữ liệu.");
  const extension = extname(file.originalname).slice(1).toLowerCase();
  if (!Object.hasOwn(catalog, kind) || !catalog[kind].importable)
    fail(422, "IMPORT_UNSUPPORTED", "Phần dữ liệu này không hỗ trợ nhập tệp.");
  if (
    extension !== "xlsx" ||
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.subarray(0, 2).toString() !== "PK"
  )
    fail(
      422,
      "INVALID_FILE",
      "Chỉ nhận tệp Excel .xlsx. PDF, .xls, macro và ảnh không được hỗ trợ.",
    );
  if (file.buffer.length > 5 * 1024 * 1024)
    fail(413, "IMPORT_UPLOAD_LIMIT", "Tệp Excel tối đa 5 MB.");
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./import-parser.worker.js", import.meta.url),
      {
        workerData: { bytes: file.buffer, extension, kind },
        resourceLimits: {
          maxOldGenerationSizeMb: 128,
          maxYoungGenerationSizeMb: 32,
          stackSizeMb: 4,
        },
      },
    );
    const stop = () => {
      clearTimeout(timer);
      void worker.terminate();
    };
    const timer = setTimeout(() => {
      stop();
      reject(
        Object.assign(
          new Error("Tệp quá phức tạp. Dùng mẫu hoặc chia thành tệp nhỏ hơn."),
          { status: 422, code: "IMPORT_TIMEOUT" },
        ),
      );
    }, 15000);
    worker.once("message", (message) => {
      stop();
      if (message.error)
        reject(
          Object.assign(new Error(message.error), {
            status: 422,
            code: message.code || "INVALID_FILE",
          }),
        );
      else resolve(message.records);
    });
    worker.once("error", () => {
      stop();
      reject(
        Object.assign(
          new Error("Không đọc được tệp hoặc tệp vượt giới hạn xử lý."),
          { status: 422, code: "INVALID_FILE" },
        ),
      );
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(
          Object.assign(new Error("Không đọc được tệp."), {
            status: 422,
            code: "INVALID_FILE",
          }),
        );
      }
    });
  });
}
export async function template(kind, format = "xlsx") {
  const config = Object.hasOwn(catalog, kind) && catalog[kind];
  if (!config?.importable)
    fail(422, "IMPORT_UNSUPPORTED", "Phần dữ liệu này không hỗ trợ nhập tệp.");
  if (format !== "xlsx")
    fail(422, "INVALID_FORMAT", "Chỉ hỗ trợ mẫu Excel .xlsx.");
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Quản lý chung cư";
  const sheet = wb.addWorksheet("Nhap");
  sheet.columns = config.fields.map((f) => ({
    header: f.key,
    key: f.key,
    width: 25,
    style: { numFmt: "@" },
  }));
  sheet.views = [
    { state: "frozen", ySplit: 1, activeCell: "A2", tabSelected: true },
  ];
  wb.views = [{ activeTab: 0, firstSheet: 0 }];
  sheet.getRow(1).height = 30;
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF171917" },
  };
  config.fields.forEach((f, index) => {
    sheet.getRow(1).getCell(index + 1).note =
      `${f.label}\n${f.hint || ""}\nVí dụ: ${f.example || "có thể để trống"}`;
  });
  const guide = wb.addWorksheet("Huong dan");
  guide.columns = [{ width: 28 }, { width: 28 }, { width: 28 }, { width: 85 }];
  guide.addRow([`Mẫu nhập ${config.title}`]);
  guide.addRow([config.note]);
  guide.addRow([
    "MẪU TRỐNG: điền sheet Nhap từ dòng 2 trước khi tải lên. Giữ nguyên tên cột. Tối đa 100 dòng mỗi tệp.",
  ]);
  guide.addRow([
    "Sheet Vi du chỉ minh họa cách điền, không được nhập tự động. Không dùng tệp xuất Chi tiết để nhập lại.",
  ]);
  guide.addRow(["Tên cột", "Ý nghĩa", "Ví dụ", "Hướng dẫn"]);
  config.fields.forEach((f) =>
    guide.addRow([f.key, f.label, f.example, f.hint]),
  );
  guide.eachRow((r) => {
    r.alignment = { wrapText: true, vertical: "top" };
    r.height = 42;
  });
  const example = wb.addWorksheet("Vi du");
  example.columns = config.fields.map((f) => ({
    header: f.key,
    key: f.key,
    width: 25,
    style: { numFmt: "@" },
  }));
  example.addRow(config.fields.map((f) => f.example));
  example.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
```

## backend/src/modules/data-exchange/import-parser.worker.js

```js
import { parentPort, workerData } from "node:worker_threads";
import { catalog } from "./catalog.js";

function invalid(message, code = "INVALID_FILE") {
  throw Object.assign(new Error(message), { publicMessage: true, code });
}
function wrongKind(actual, expected) {
  invalid(
    `Bạn đang chọn “${catalog[expected].title}” nhưng tệp thuộc phần “${catalog[actual].title}”. Hãy chọn “${catalog[actual].title}” ở Phần dữ liệu rồi xem trước lại.`,
    "IMPORT_KIND_MISMATCH",
  );
}
function scalar(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (!["string", "number", "boolean"].includes(typeof value))
    invalid(
      "Không dùng công thức, liên kết hoặc ô văn bản có định dạng phức tạp.",
    );
  const result = String(value).trim();
  if (result.length > 1000) invalid("Mỗi ô tối đa 1.000 ký tự.");
  return result;
}
async function zipCheck(buffer) {
  const { default: yauzl } = await import("yauzl");
  await new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error) return reject(new Error("Tệp Excel không hợp lệ."));
      let total = 0,
        count = 0;
      zip.on("error", () => reject(new Error("Tệp Excel bị hỏng.")));
      zip.on("entry", (entry) => {
        total += entry.uncompressedSize;
        count++;
        if (
          total > 20 * 1024 * 1024 ||
          entry.uncompressedSize > 8 * 1024 * 1024 ||
          count > 1000 ||
          /vbaProject/i.test(entry.fileName)
        ) {
          zip.close();
          reject(
            new Error(
              "Excel quá lớn sau giải nén hoặc chứa macro. Dùng tệp mẫu .xlsx tối đa 100 dòng.",
            ),
          );
        } else zip.readEntry();
      });
      zip.on("end", resolve);
      zip.readEntry();
    });
  });
}
async function excel(buffer, fields, kind) {
  await zipCheck(buffer);
  const { default: ExcelJS } = await import("exceljs"),
    wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.getWorksheet("Nhap");
  if (!sheet)
    invalid(
      wb.getWorksheet("Chi tiết")
        ? "Đây là tệp xuất báo cáo, không phải mẫu nhập. Tải mẫu Excel, điền sheet Nhap rồi xem trước lại."
        : "Không tìm thấy sheet Nhap. Tải mẫu Excel và điền dữ liệu từ dòng 2 trong sheet Nhap.",
      "IMPORT_SHEET_REQUIRED",
    );
  if (
    !sheet ||
    wb.worksheets.length > 3 ||
    sheet.rowCount > 1001 ||
    sheet.columnCount > 20
  )
    invalid("Dùng sheet Nhap với đúng cột trong mẫu, tối đa 100 dòng dữ liệu.");
  const headers = Array.from({ length: sheet.columnCount }, (_, i) =>
    scalar(sheet.getRow(1).getCell(i + 1).value),
  );
  const detected = Object.keys(catalog).find(
    (key) =>
      catalog[key].fields?.length === headers.length &&
      new Set(headers).size === headers.length &&
      headers.every((h) => catalog[key].fields.some((f) => f.key === h)),
  );
  if (detected && detected !== kind) wrongKind(detected, kind);
  if (
    headers.length !== fields.length ||
    new Set(headers).size !== fields.length ||
    headers.some((h) => !fields.some((f) => f.key === h))
  )
    invalid(
      "Tên cột Excel không khớp phần đang nhập. Tải mẫu và giữ nguyên hàng tên cột.",
    );
  const records = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n),
      values = {};
    let error;
    headers.forEach((key, i) => {
      try {
        values[key] = scalar(row.getCell(i + 1).value);
      } catch (e) {
        error = `${key}: ${e.message}`;
      }
    });
    if (error || Object.values(values).some((v) => v !== ""))
      records.push({ line: n, values, error });
  }
  return records;
}
try {
  const { kind, extension, bytes } = workerData,
    buffer = Buffer.from(bytes),
    fields = catalog[kind].fields;
  if (extension !== "xlsx") invalid("Chỉ nhận tệp Excel .xlsx.");
  const records = await excel(buffer, fields, kind);
  if (!records.length)
    invalid(
      "Chưa có dữ liệu trong sheet Nhap. Mẫu tải về là mẫu trống; điền từ dòng 2 rồi chọn lại tệp đã lưu. Sheet Huong dan và Vi du không được nhập.",
      "IMPORT_EMPTY",
    );
  if (records.length > 100)
    invalid(
      "Tệp có hơn 100 dòng dữ liệu. Chia thành nhiều tệp, tối đa 100 dòng mỗi tệp. Không có dòng nào được cắt bớt.",
      "IMPORT_TOO_MANY_ROWS",
    );
  parentPort.postMessage({ records });
} catch (error) {
  parentPort.postMessage({
    code: error.publicMessage ? error.code : "INVALID_FILE",
    error: error.publicMessage
      ? error.message
      : error.message.startsWith("Tệp") ||
          /Dùng sheet|Tên cột|Excel quá/.test(error.message)
        ? error.message
        : "Không đọc được tệp. Dùng mẫu Excel .xlsx không có mật khẩu bảo vệ.",
  });
}
```

## backend/src/modules/data-exchange/data-exchange.routes.js

```js
import { Router } from "express";
import multer from "multer";
import { pool, rows } from "../../lib/db.js";
import { choice, fail, rateLimit } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { format, reserve } from "../report-exports/report-files.js";
import { catalog, publicCatalog } from "./catalog.js";
import { template } from "./import-files.js";
import { importFile } from "./import.service.js";
import { exportData } from "./export.service.js";

export const dataExchangeRouter = Router();
dataExchangeRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
dataExchangeRouter.get("/", (req, res) => res.json({ data: publicCatalog() }));
dataExchangeRouter.get("/lich_su", async (req, res) =>
  res.json({
    data: await rows(
      pool,
      "SELECT ma_dot_nhap,phan_he,so_dong,ngay_tao FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=? ORDER BY ma_dot_nhap DESC LIMIT 20",
      [req.user.ma_nguoi_dung],
    ),
  }),
);
dataExchangeRouter.param("kind", (req, res, next, kind) => {
  choice(kind, "phan_he", Object.keys(catalog));
  next();
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 2,
    fieldSize: 4096,
    parts: 3,
  },
}).single("tep");
async function withLimit(req, work) {
  let release;
  try {
    release = reserve(req.user.ma_nguoi_dung);
  } catch (error) {
    if (error.code === "EXPORT_BUSY")
      fail(429, "FILE_BUSY", "Đang xử lý tệp. Chờ hoàn tất rồi thử lại.");
    throw error;
  }
  try {
    return await work();
  } finally {
    release();
  }
}
dataExchangeRouter.get("/:kind/mau", async (req, res) =>
  withLimit(req, async () => {
    if (!catalog[req.params.kind].importable)
      fail(422, "IMPORT_UNSUPPORTED", "Phần này chỉ hỗ trợ xuất danh sách.");
    const f = format(req.query),
      buffer = await template(req.params.kind, f);
    res.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.set(
      "Content-Disposition",
      `attachment; filename="mau-${req.params.kind}.${f}"`,
    );
    res.set("X-Export-Rows", "0");
    res.set("Content-Security-Policy", "sandbox; default-src 'none'");
    res.send(buffer);
  }),
);
dataExchangeRouter.get("/:kind/xuat", async (req, res) =>
  withLimit(req, () =>
    exportData(req.params.kind, req.query, req.user, format(req.query), res),
  ),
);
for (const [action, commit] of [
  ["xem_truoc", false],
  ["nhap", true],
])
  dataExchangeRouter.post(
    `/:kind/${action}`,
    rateLimit(30, 15 * 60 * 1000),
    async (req, res) =>
      withLimit(req, async () => {
        if (!catalog[req.params.kind].importable)
          fail(
            422,
            "IMPORT_UNSUPPORTED",
            "Phần này chỉ hỗ trợ xuất danh sách.",
          );
        await new Promise((resolve, reject) =>
          upload(req, res, (error) => {
            if (error)
              reject(
                Object.assign(
                  new Error(
                    "Chọn đúng một tệp Excel .xlsx tối đa 5 MB và các trường xác nhận của biểu mẫu.",
                  ),
                  { status: 413, code: "IMPORT_UPLOAD_LIMIT" },
                ),
              );
            else resolve();
          }),
        );
        const result = await importFile(
          req.params.kind,
          req.file,
          req.body,
          req.user,
          commit,
        );
        res.json({ data: result });
      }),
  );
```

## backend/src/modules/data-exchange/export.service.js

```js
import * as residency from "../residency/residency.service.js";
import * as vehicles from "../vehicles/vehicles.service.js";
import * as billing from "../billing/billing.service.js";
import * as maintenance from "../maintenance/maintenance.service.js";
import * as amenities from "../amenities/amenities.service.js";
import { date, send } from "../report-exports/report-files.js";
import { today } from "../billing/billing.validation.js";
import { catalog } from "./catalog.js";

const configs = {
  can_ho: {
    read: (q, u, f) => residency.listApartments(q, f),
    filters: ["q", "tang"],
    columns: [
      ["ma_can_ho", "Mã căn"],
      ["so_can_ho", "Căn hộ"],
      ["khoi", "Khối"],
      ["tang", "Tầng", "count"],
      ["dien_tich_m2", "Diện tích (m²)", "count"],
      ["so_cu_dan", "Cư dân đang ở", "count"],
      ["tinh_phi_dich_vu", "Tính phí dịch vụ", "flag"],
    ],
  },
  cu_dan: {
    read: (q, u, f) => residency.listResidents(q, f),
    filters: ["q", "ma_can_ho", "ma_cu_dan", "trang_thai"],
    columns: [
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Họ tên"],
      ["so_dien_thoai", "Điện thoại"],
      ["so_can_ho", "Căn đang ở"],
      ["quan_he", "Quan hệ"],
      ["tu_ngay", "Ngày vào", "date"],
    ],
  },
  phuong_tien: {
    read: (q, u, f) => vehicles.list(q, f),
    filters: ["q", "loai_xe", "trang_thai", "ma_can_ho", "ma_cu_dan"],
    columns: [
      ["ma_dang_ky", "Mã đăng ký"],
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Cư dân"],
      ["so_can_ho", "Căn hộ"],
      ["loai_xe", "Loại xe"],
      ["bien_so", "Biển số"],
      ["ngay_dang_ky", "Ngày đăng ký", "date"],
      ["ngay_ket_thuc", "Ngày kết thúc", "date"],
    ],
  },
  chi_so: {
    read: (q, u, f) => billing.meters(q, f),
    filters: ["ma_can_ho", "ky_thanh_toan"],
    columns: [
      ["so_can_ho", "Căn hộ"],
      ["loai_dich_vu", "Dịch vụ"],
      ["ky_thanh_toan", "Kỳ"],
      ["chi_so_cu", "Chỉ số cũ", "count"],
      ["chi_so_moi", "Chỉ số mới", "count"],
      ["ngay_chot", "Ngày chốt", "date"],
      ["ghi_chu", "Ghi chú"],
    ],
  },
  thiet_bi: {
    read: (q, u, f) => maintenance.equipmentList(q, f),
    filters: ["q", "loai", "trang_thai", "lich"],
    columns: [
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi", "Tên thiết bị"],
      ["loai", "Loại"],
      ["vi_tri", "Vị trí"],
      ["so_serial", "Serial"],
      ["trang_thai", "Trạng thái"],
      ["chu_ky_ngay", "Chu kỳ (ngày)"],
      ["ngay_bao_tri_tiep_theo", "Bảo trì kế tiếp", "date"],
    ],
  },
  hoa_don: {
    read: billing.list,
    filters: ["q", "ma_can_ho", "ky_thanh_toan", "trang_thai"],
    columns: [
      ["so_hoa_don", "Số hóa đơn"],
      ["so_can_ho", "Căn hộ"],
      ["ky_thanh_toan", "Kỳ"],
      ["ngay_chot_phi", "Ngày chốt", "date"],
      ["trang_thai", "Trạng thái"],
      ["tong_tien", "Tổng tiền", "money"],
      ["han_thanh_toan", "Hạn trả", "date"],
    ],
  },
  bao_tri: {
    read: maintenance.jobs,
    filters: ["q", "ma_thiet_bi", "loai", "trang_thai", "qua_han"],
    columns: [
      ["ma_phieu_bao_tri", "Mã phiếu"],
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi_luc_lap", "Thiết bị"],
      ["tieu_de", "Công việc"],
      ["loai", "Loại"],
      ["ngay_den_han", "Đến hạn", "date"],
      ["trang_thai", "Trạng thái"],
      ["ky_thuat_vien", "Kỹ thuật viên"],
    ],
  },
  dat_lich: {
    read: amenities.bookings,
    filters: ["q", "ma_tien_ich", "ngay", "trang_thai"],
    columns: [
      ["ma_dat_lich", "Mã lượt"],
      ["ten_tien_ich", "Tiện ích"],
      ["ten_nguoi_dat", "Người đặt"],
      ["so_can_ho", "Căn hộ"],
      ["bat_dau", "Bắt đầu (giờ VN)"],
      ["ket_thuc", "Kết thúc (giờ VN)"],
      ["so_nguoi", "Số người", "count"],
      ["trang_thai", "Trạng thái"],
    ],
  },
};
const labels = {
  q: "Tìm kiếm",
  tang: "Tầng",
  ma_can_ho: "Mã căn",
  ma_cu_dan: "Mã cư dân",
  loai_xe: "Loại xe",
  trang_thai: "Trạng thái",
  ky_thanh_toan: "Kỳ",
  loai: "Loại",
  lich: "Lịch bảo trì",
  ma_thiet_bi: "Mã thiết bị",
  qua_han: "Quá hạn",
  ma_tien_ich: "Mã tiện ích",
  ngay: "Ngày",
};
export async function exportData(kind, query, user, format, res) {
  const config = configs[kind],
    filters = Object.fromEntries(
      config.filters
        .filter((k) => query[k] !== undefined && query[k] !== "")
        .map((k) => [k, query[k]]),
    );
  const result = await config.read(filters, user, format);
  const report = {
    currency: kind === "hoa_don",
    title: `Danh sách ${catalog[kind].title.toLowerCase()}`,
    file: `danh-sach-${kind.replaceAll("_", "-")}`,
    day: today(),
    at: new Date().toISOString().slice(0, 19).replace("T", " "),
    rows: result.data,
    filters: Object.entries(filters).map(([k, v]) => [labels[k], v]),
    summary: [
      {
        label: "Số dòng theo bộ lọc",
        value: result.data.length,
        type: "count",
      },
    ],
    notes: [
      "Tệp danh sách phục vụ đối chiếu và báo cáo. Để nhập mới, dùng tệp mẫu tại Nhập / xuất dữ liệu.",
      "Không bao gồm mật khẩu hoặc thông tin phiên đăng nhập.",
    ],
    columns: config.columns.map(([key, title, type]) => ({
      title,
      type: ["count", "money"].includes(type) ? type : "text",
      width: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 32 : 21,
      value: (row) =>
        type === "date"
          ? date(row[key])
          : type === "flag"
            ? row[key]
              ? "Có"
              : "Không"
            : (row[key] ?? ""),
    })),
  };
  await send(res, report, format);
}
```

## backend/src/modules/report-exports/report-files.js

```js
import { choice, fail } from "../../lib/http.js";
import { pagination } from "../billing/billing.validation.js";
export const limits = { xlsx: 10000 };
export const format = (query) =>
  choice(query.dinh_dang || "xlsx", "dinh_dang", ["xlsx"]);
export function reportPage(query, exportFormat) {
  const { page, offset } = pagination(exportFormat ? { page: 1 } : query);
  const limit = exportFormat
    ? limits[choice(exportFormat, "dinh_dang", ["xlsx"])]
    : 20;
  return {
    page,
    offset,
    limit,
    check(total) {
      if (exportFormat && BigInt(total) > BigInt(limit))
        fail(
          422,
          "EXPORT_TOO_LARGE",
          `Báo cáo có ${Number(total).toLocaleString("vi-VN")} dòng, vượt giới hạn ${limit.toLocaleString("vi-VN")} dòng cho Excel. Hãy thu hẹp bộ lọc. Không có dữ liệu nào bị cắt bớt.`,
        );
    },
  };
}
// Two Excel renderers at a time, at most one per account, with bounded output rows.
// Load workbook code only when requested; ordinary reads stay light.
const active = new Set();
export function reserve(userId) {
  if (active.has(userId) || active.size >= 2)
    fail(
      429,
      "EXPORT_BUSY",
      "Đang tạo báo cáo. Vui lòng chờ tải xong rồi thử lại.",
    );
  active.add(userId);
  return () => active.delete(userId);
}
export const clean = (value) =>
  String(value ?? "").replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,
    "",
  );
export const date = (value) =>
  value ? String(value).split("-").reverse().join("/") : "—";
export const money = (value) =>
  `${BigInt(value || 0).toLocaleString("vi-VN")} đ`;
export function time(value) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value.replace(" ", "T") + "Z"))
    : "—";
}
function cellValue(value, type) {
  if (type === "money") {
    const n = BigInt(value || 0),
      digits = (n < 0n ? -n : n).toString().length;
    // Excel stores only 15 significant decimal digits, even when JS Number is safe.
    return digits <= 15 ? Number(n) : n.toString();
  }
  if (type === "count") return Number(value || 0);
  return clean(value);
}
export async function excel(report) {
  const { default: ExcelJS } = await import("exceljs"),
    wb = new ExcelJS.Workbook();
  wb.creator = "Quản lý chung cư";
  wb.created = new Date();
  // Mở danh sách ngay cả trong ứng dụng bỏ qua activeTab của workbook.
  const data = wb.addWorksheet("Chi tiết", {
      properties: { tabColor: { argb: "FF14635A" } },
    }),
    meta = wb.addWorksheet("Tổng hợp");
  wb.views = [{ activeTab: 0, firstSheet: 0, visibility: "visible" }];
  meta.columns = [{ width: 38 }, { width: 75 }];
  meta.addRow(["CHUNG CƯ · QUẢN LÝ VẬN HÀNH"]);
  meta.mergeCells("A1:B1");
  meta.addRow([report.title]);
  meta.mergeCells("A2:B2");
  meta.addRow(["Thời điểm dữ liệu (Việt Nam)", time(report.at)]);
  meta.addRow(["Số dòng chi tiết", report.rows.length]);
  const detailLink = meta.addRow([
    {
      text: `Xem danh sách ${report.rows.length.toLocaleString("vi-VN")} dòng tại trang Chi tiết →`,
      hyperlink: "#'Chi tiết'!A1",
      tooltip: "Mở danh sách đầy đủ theo bộ lọc đã áp dụng",
    },
  ]);
  meta.mergeCells(detailLink.number, 1, detailLink.number, 2);
  for (const [label, value] of report.filters)
    meta.addRow([label, clean(value)]);
  meta.addRow([]);
  meta.addRow(["TỔNG HỢP", "Số tiền / số lượng"]);
  const summaryHeader = meta.rowCount;
  for (const s of report.summary) {
    const row = meta.addRow([s.label, cellValue(s.value, s.type)]);
    if (s.type === "money") row.getCell(2).numFmt = '#,##0" đ";[Red]-#,##0" đ"';
  }
  meta.addRow([]);
  for (const note of [
    ...report.notes,
    ...(report.currency === false
      ? [
          "Các mã và số điện thoại được lưu dạng văn bản để giữ nguyên số 0 đầu.",
        ]
      : [
          "Tiền trên 15 chữ số được lưu dạng văn bản để giữ nguyên giá trị; các mã và số điện thoại luôn là văn bản.",
        ]),
  ]) {
    const row = meta.addRow([clean(note)]);
    meta.mergeCells(row.number, 1, row.number, 2);
    row.height = 42;
  }
  meta.eachRow((row) => {
    row.font = { name: "Calibri", size: 11, color: { argb: "FF183C3B" } };
    row.alignment = { vertical: "top", wrapText: true };
  });
  detailLink.getCell(1).font = {
    name: "Calibri",
    size: 12,
    bold: true,
    underline: true,
    color: { argb: "FF14635A" },
  };
  detailLink.height = 30;
  meta.views = [{ showGridLines: false, tabSelected: false }];
  for (const n of [1, 2, summaryHeader]) {
    const row = meta.getRow(n);
    row.font = {
      name: "Calibri",
      size: n === 2 ? 16 : 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF14635A" },
    };
    row.height = n === 2 ? 36 : 26;
  }
  data.columns = report.columns.map((c) => ({
    header: c.title,
    width: c.width || 20,
  }));
  for (const item of report.rows) {
    const row = data.addRow(
      report.columns.map((c) => cellValue(c.value(item), c.type)),
    );
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { name: "Calibri", size: 10 };
    report.columns.forEach((c, i) => {
      if (c.type === "money")
        row.getCell(i + 1).numFmt = '#,##0" đ";[Red]-#,##0" đ"';
    });
    if (row.number % 2 === 0)
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F6F4" },
      };
  }
  data.getRow(1).height = 30;
  data.getRow(1).font = {
    name: "Calibri",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  data.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF14635A" },
  };
  data.getRow(1).alignment = { vertical: "middle", wrapText: true };
  data.views = [
    { state: "frozen", ySplit: 1, activeCell: "A2", tabSelected: true },
  ];
  data.getCell("A1").note =
    `${clean(report.title)}\nCó ${report.rows.length.toLocaleString("vi-VN")} dòng dữ liệu. Bộ lọc và số liệu tổng hợp nằm ở trang Tổng hợp.`;
  data.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, data.rowCount), column: report.columns.length },
  };
  data.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
  };
  data.headerFooter.oddFooter = `&LQuản lý chung cư&CTrang &P / &N${report.currency === false ? "" : "&RĐơn vị: đồng"}`;
  return Buffer.from(await wb.xlsx.writeBuffer());
}
export async function send(res, report, exportFormat = "xlsx") {
  format({ dinh_dang: exportFormat });
  const body = await excel(report);
  res.set(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.set(
    "Content-Disposition",
    `attachment; filename="${report.file}-${report.day}.${exportFormat}"`,
  );
  res.set("X-Export-Rows", String(report.rows.length));
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  res.send(body);
}
```

## backend/src/modules/report-exports/report-exports.service.js

```js
import * as financial from "../financial-reports/financial-reports.service.js";
import { ledger } from "../treasury/treasury.service.js";
import { today } from "../billing/billing.validation.js";
import { date, format, reserve, send, time } from "./report-files.js";
const col = (key, title, type = "text", width = 20) => ({
  title,
  type,
  width,
  value: typeof key === "function" ? key : (r) => r[key],
});
const metric = (label, value, type = "money") => ({ label, value, type });
const all = (v) => v || "Tất cả";
const categories = {
  BO_SUNG_QUY: "Bổ sung quỹ",
  THU_KHAC: "Thu khác",
  VAN_HANH: "Vận hành",
  BAO_TRI: "Bảo trì",
  MUA_SAM: "Mua sắm",
  CHI_KHAC: "Chi khác",
  DIEU_CHINH: "Đảo phiếu",
  THU_HOA_DON: "Thu hóa đơn",
};
const debtViews = {
  CAN_HO: "Theo căn hộ",
  HOA_DON: "Hóa đơn chưa thu",
  THEO_KY: "Tổng hợp theo kỳ",
};
export function debtModel(r) {
  const f = r.filters,
    s = r.summary,
    view = f.che_do;
  let columns;
  if (view === "CAN_HO")
    columns = [
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col(
        (x) => x.nguoi_phu_trach || "Chưa gắn chủ hộ",
        "Người phụ trách hiện tại",
        "text",
        28,
        1.4,
      ),
      col("dien_thoai_phu_trach", "Số điện thoại"),
      col("so_hoa_don_chua_thu", "Hóa đơn chưa thu", "count", 18, 0.7),
      col((x) => date(x.han_som_nhat), "Hạn sớm nhất"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  else if (view === "HOA_DON")
    columns = [
      col("so_hoa_don", "Hóa đơn"),
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col((x) => date(x.han_thanh_toan), "Hạn thanh toán"),
      col(
        (x) =>
          x.qua_han
            ? "Quá hạn"
            : x.han_thanh_toan
              ? "Chưa quá hạn"
              : "Chưa đặt hạn",
        "Tình trạng",
      ),
      col("tong_tien", "Còn phải thu", "money"),
    ];
  else
    columns = [
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col("so_hoa_don", "Số hóa đơn", "count", 15, 0.6),
      col("so_hoa_don_da_thu", "Đã thu (hóa đơn)", "count", 18, 0.7),
      col("so_hoa_don_chua_thu", "Chưa thu (hóa đơn)", "count", 18, 0.7),
      col("tong_da_gui", "Tổng đã gửi", "money"),
      col("da_thu", "Đã thu", "money"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  return {
    title: `Báo cáo công nợ · ${debtViews[view]}`,
    file: `cong-no-${view.toLowerCase().replaceAll("_", "-")}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    columns,
    filters: [
      ["Từ kỳ", all(f.tu_ky)],
      ["Đến kỳ", all(f.den_ky)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
      ["Chỉ quá hạn", f.qua_han === "1" ? "Có" : "Không"],
      ["Xét quá hạn đến", date(r.ngay_bao_cao)],
    ],
    summary: [
      metric("Tổng hóa đơn đã gửi", s.tong_da_gui),
      metric("Đã thu theo kỳ hóa đơn", s.da_thu),
      metric("Còn phải thu", s.con_phai_thu),
      metric("Nợ quá hạn", s.no_qua_han),
      metric("Số căn còn nợ", s.so_can_con_no, "count"),
      metric("Tỷ lệ đã thu (%)", String(s.ty_le_da_thu), "text"),
    ],
    notes: [
      "Công nợ hiện tại của các kỳ đã chọn; không phải số dư hồi tố tại một ngày trong quá khứ.",
      "Tổng hợp tính toàn bộ kỳ/khối/căn đã lọc. Cách xem hóa đơn chỉ liệt kê hóa đơn chưa thu; lọc quá hạn chỉ tác động chi tiết, không đổi tổng hợp.",
      "Ngày đến hạn hôm nay chưa là quá hạn. Người phụ trách là thông tin hiện tại; các bản nháp, chưa gửi và đã hủy không được cộng vào tổng.",
    ],
  };
}
export function collectionModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_NGAY";
  return {
    title: `Báo cáo thu phí · ${grouped ? "Tổng hợp theo ngày" : "Các khoản đã thu"}`,
    file: `thu-phi-${grouped ? "theo-ngay" : "giao-dich"}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Từ ngày xác nhận", date(f.tu_ngay)],
      ["Đến ngày xác nhận", date(f.den_ngay)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
    ],
    summary: [
      metric("Đã ghi nhận thu", s.tong_da_thu),
      metric("Số khoản thu", s.so_khoan_thu, "count"),
      metric("Số căn đã thu", s.so_can_da_thu, "count"),
    ],
    columns: grouped
      ? [
          col((x) => date(x.ngay_thu), "Ngày thu"),
          col("so_khoan_thu", "Số khoản thu", "count"),
          col("da_thu", "Đã thu", "money"),
        ]
      : [
          col("so_hoa_don", "Hóa đơn"),
          col("so_can_ho", "Căn hộ"),
          col("khoi", "Khối", "text", 12, 0.5),
          col("ky_thanh_toan", "Kỳ hóa đơn"),
          col(
            (x) => time(x.ngay_thanh_toan),
            "Thời điểm xác nhận (VN)",
            "text",
            28,
            1.3,
          ),
          col("ma_tham_chieu", "Mã tham chiếu", "text", 28, 1.2),
          col("nguoi_xac_nhan", "Người xác nhận", "text", 28, 1.2),
          col("so_tien_da_thu", "Đã thu", "money"),
        ],
    notes: [
      "Theo thời điểm BQL xác nhận thu trên phần mềm, quy đổi giờ Việt Nam, không phải kỳ hóa đơn hoặc ngày chuyển khoản ngân hàng.",
      "Khoảng ngày tính cả ngày đầu và ngày cuối. Chỉ các hóa đơn đã xác nhận thu mới được đưa vào báo cáo.",
    ],
  };
}
export function ledgerModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_THANG";
  return {
    title: `Sổ quỹ · ${r.fund.ten_quy} · ${grouped ? "Theo tháng" : "Từng khoản thu / chi"}`,
    file: `so-quy-${r.fund.ma_quy}-${grouped ? "theo-thang" : "giao-dich"}`,
    day: today(),
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Quỹ", r.fund.ten_quy],
      ["Từ ngày hạch toán", date(f.tu_ngay)],
      ["Đến ngày hạch toán", date(f.den_ngay)],
      [
        "Nguồn chi tiết",
        f.nguon === "PHIEU"
          ? "Phiếu thu / chi"
          : f.nguon === "HOA_DON"
            ? "Hóa đơn"
            : "Tất cả",
      ],
      [
        "Loại chi tiết",
        f.loai === "THU" ? "Thu" : f.loai === "CHI" ? "Chi" : "Tất cả",
      ],
      ["Tìm kiếm", all(f.q)],
    ],
    summary: [
      metric("Đầu kỳ", s.dau_ky),
      metric("Thu trong kỳ", s.tong_thu),
      metric("Chi trong kỳ", s.tong_chi),
      metric("Cuối kỳ", s.cuoi_ky),
    ],
    columns: grouped
      ? [
          col("ky", "Tháng"),
          col("tong_thu", "Tổng thu", "money"),
          col("tong_chi", "Tổng chi", "money"),
          col(
            (x) => (BigInt(x.tong_thu) - BigInt(x.tong_chi)).toString(),
            "Chênh lệch",
            "money",
          ),
        ]
      : [
          col((x) => date(x.ngay), "Ngày hạch toán", "text", 20, 0.8),
          col("so_chung_tu", "Chứng từ"),
          col(
            (x) => (x.nguon === "HOA_DON" ? "Hóa đơn" : "Phiếu thu / chi"),
            "Nguồn",
            "text",
            18,
            0.8,
          ),
          col((x) => categories[x.nhom] || x.nhom, "Nhóm", "text", 20, 0.8),
          col("doi_tac", "Người nộp / nhận", "text", 28, 1.2),
          col("dien_giai", "Diễn giải", "text", 60, 2.4),
          col(
            (x) => (x.loai === "THU" ? x.so_tien : "0"),
            "Thu",
            "money",
            22,
            1.1,
          ),
          col(
            (x) => (x.loai === "CHI" ? x.so_tien : "0"),
            "Chi",
            "money",
            22,
            1.1,
          ),
        ],
    notes: [
      "Số dư theo dữ liệu đã ghi nhận, cần đối soát tiền mặt và ngân hàng thực tế. Hạch toán lùi ngày có thể làm thay đổi số dư quá khứ.",
      "Tổng hợp là toàn quỹ trong khoảng ngày; nguồn/loại/tìm kiếm chỉ lọc chi tiết từng khoản. Chế độ tháng tổng hợp toàn quỹ, các tháng biên chỉ tính ngày thuộc khoảng đã chọn.",
      "Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Phiếu gốc và phiếu đảo đều được giữ để thể hiện đầy đủ lịch sử, không cộng lại một hóa đơn thành phiếu thu.",
    ],
  };
}
export async function download(req, res, kind, id) {
  const exportFormat = format(req.query);
  let release;
  try {
    release = reserve(req.user.ma_nguoi_dung);
    const result =
      kind === "cong_no"
        ? await financial.debts(req.query, exportFormat)
        : kind === "thu_phi"
          ? await financial.collections(req.query, exportFormat)
          : await ledger(id, req.query, exportFormat);
    const model =
      kind === "cong_no"
        ? debtModel(result)
        : kind === "thu_phi"
          ? collectionModel(result)
          : ledgerModel(result);
    await send(res, model, exportFormat);
  } catch (error) {
    if (error.code === "EXPORT_BUSY") res.set("Retry-After", "3");
    throw error;
  } finally {
    release?.();
  }
}
```
