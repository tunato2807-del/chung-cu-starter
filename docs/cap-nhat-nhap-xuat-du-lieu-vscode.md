# Nhập / xuất Excel và PDF — code đầy đủ từng file cho VS Code

> Có bản sửa mới: [mã cư dân và thông báo nhập PDF — code đầy đủ 7 file](cap-nhat-ma-cu-dan-va-nhap-pdf-vscode.md). Sau khi áp dụng bản sửa, không chép lại worker, service, giao diện cư dân/nhập dữ liệu và CSS cũ bên dưới đè lên.

Bản tiếp theo sau [bản xuất báo cáo ffb4666](https://github.com/tunato2807-del/chung-cu-starter/tree/ffb4666a442dcb6efbfb09f658e1c85af0d90df3). Dành cho dự án đã có căn hộ/cư trú, phương tiện, hóa đơn, bảo trì, tiện ích và thu chi/quỹ. Hướng dẫn này chứa **26 file chạy ứng dụng** với code đầy đủ để chép, không cần tải ZIP. Không lấy lại service/CSS/App từ hướng dẫn cũ đè lên sau khi áp dụng bản này.

## Những phần được bổ sung

| Phần | Nhập Excel | Nhập PDF biểu mẫu | Xuất Excel / PDF |
|---|---|---|---|
| Căn hộ | Thêm mới, tự tạo tài khoản căn | Có | Danh sách, diện tích, số cư dân |
| Cư dân | Hồ sơ và đợt cư trú đầu | Có | Mã cư dân, điện thoại, căn hiện tại |
| Phương tiện | Đăng ký mới cho cư dân đang ở | Có | Danh sách theo loại/trạng thái/căn |
| Chỉ số điện nước | Kỳ mới, kiểm tra kỳ liền trước | Có | Chỉ số theo kỳ/căn |
| Thiết bị | Hồ sơ mới và lịch bảo trì | Có | Danh sách theo lịch/loại/trạng thái |
| Hóa đơn | Qua màn lập/duyệt hiện có | — | Danh sách theo kỳ/trạng thái/căn |
| Phiếu bảo trì | Qua màn thiết bị hiện có | — | Danh sách theo hạn/KTV/trạng thái |
| Lượt đặt tiện ích | Qua màn đặt/duyệt hiện có | — | Danh sách theo ngày/tiện ích/trạng thái |
| Công nợ, thu phí, sổ quỹ | Qua nghiệp vụ hiện có | — | Giữ chức năng xuất đã làm trước |

**PDF nhập là biểu mẫu có ô điền**, tải từ hệ thống rồi mở bằng Chrome hoặc Adobe Acrobat, điền và **Lưu / Save**. Không phải mọi PDF đều nhập được: ảnh scan, PDF báo cáo dạng bảng và bản In/Print to PDF đã làm phẳng không còn ô dữ liệu. Dùng mẫu Excel cho bảng nhiều dòng. Bản này không có OCR tự đoán nội dung.

## Cập nhật trong VS Code trên Windows

1. Dừng backend và frontend bằng Ctrl+C. Giữ `.env`, `.certs`, database và ảnh/chứng từ. Lưu các thay đổi cá nhân trước khi thay code.
2. Trong thư mục dự án `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`, tạo các file đánh dấu **Tạo mới** bên dưới, tạo cả thư mục cha nếu chưa có. Các mục **Thay toàn bộ** là file đã tồn tại: thay đủ nội dung, không nối cuối file. Chỉ chép phần bên trong khối mã, không chép dấu ```.
3. Đặc biệt tạo file SQL mới **014_data_imports.sql** đúng đường dẫn. Không sửa 001–013 đã chạy. Các file service và app.js/App.jsx cần thay cùng đợt.
4. Mở PowerShell tại thư mục gốc (nơi có package.json), chạy:

```powershell
npm install -w backend --save-exact exceljs@4.4.0 pdfmake@0.2.23 pdf-lib@1.17.1 @pdf-lib/fontkit@1.1.1 yauzl@3.4.0
npm run db:migrate
npm run dev:backend
```

`npm install` tự cập nhật package-lock.json ở gốc, không chép tay lockfile. Nếu database chưa chạy, dùng `npm run db:up` trước migrate. Không cần seed lại. Migration 014 chỉ thêm lịch sử/chống trùng nhập, không nhập demo hoặc thay hồ sơ cũ. Font tiếng Việt nằm trong dependency, không cần cài font hệ điều hành. pdf-parse vẫn là thư viện kiểm thử, không xử lý PDF người dùng.

5. Terminal thứ hai tại gốc, tiếp tục dùng cách khởi động đang hoạt động:

```powershell
npm run dev:frontend:https
```

Nếu trước đó đang dùng HTTP LAN, có thể giữ lệnh Vite cũ. Camera QR trong web cần HTTPS như cấu hình đã làm; nhập/xuất không đổi cổng hoặc chứng chỉ. Chỉ chạy một frontend trên cổng 5173. Sau khi sửa, Ctrl+F5 để tải lại giao diện.

Nếu lấy toàn bộ mã nguồn bằng Git thay vì chép thủ công, hãy lưu thay đổi local, cập nhật nhánh `codex/auth-qr-incidents` rồi dùng `npm ci` theo lockfile và `npm run db:migrate`. Không cần tải thêm ZIP.

## Cách sử dụng

Đăng nhập **BQL** → **Nhập / xuất Excel, PDF** ở menu, chọn phần dữ liệu. Các danh sách phù hợp cũng có nút **Nhập Excel / PDF**, **Xuất Excel**, **Xuất PDF** ngay trên màn hiện tại.

1. Bấm **Tải mẫu Excel**: sheet `Nhap` chỉ có hàng tên cột, sheet `Huong dan` có ví dụ và ý nghĩa. Điền dữ liệu thật ở `Nhap` từ dòng 2, không đổi tên cột. Số căn/điện thoại để dạng Text, giữ số 0 đầu. Ngày YYYY-MM-DD; số thập phân dùng dấu chấm, không thêm dấu phân cách hàng nghìn.
2. Hoặc chọn số hồ sơ 1/3/5/10 rồi **Tải mẫu PDF**. Mỗi trang là một hồ sơ; mở, điền ô và Save. Trang để trống được bỏ qua. Không Print to PDF.
3. Chọn tệp vừa điền → **Xem trước tệp**. Bảng hiển thị từng dòng/trang và lỗi cụ thể; trên điện thoại cuộn ngang để xem đủ cột. Chưa có hồ sơ nào được lưu.
4. Có lỗi: sửa trong tệp, chọn lại rồi xem trước lại. Khi tất cả hợp lệ, bấm **Xác nhận nhập N dòng**. Hệ thống kiểm tra lại: một dòng lỗi thì không lưu dòng nào. Không bấm làm mới trong lúc đang lưu.
5. Thành công: mở danh sách để kiểm tra, xem **20 lần nhập gần nhất của bạn**. Cùng tệp/yêu cầu gửi lại không tạo trùng. Nếu tệp thay đổi sau bản xem trước hoặc xem trước quá 15 phút/server khởi động lại, cần xem trước lại.

Thứ tự nên dùng: **Căn hộ → Cư dân → Phương tiện**. Thiết bị độc lập. Chỉ số nhập từ kỳ đầu đến các kỳ tiếp theo, chỉ số đầu kỳ bằng cuối kỳ liền trước. Không nhập lại kỳ đã có để sửa; dùng màn Chỉ số điện nước với kiểm tra phiên bản.

Nhập chủ hộ không tự thay người phụ trách đang có: xử lý bàn giao bằng màn cư trú/tài khoản. Số điện thoại đã có hồ sơ cư dân báo trùng, dùng chức năng nhập cư/chuyển căn thay vì tạo bản sao. Phương tiện phải chọn mã cư dân từ tệp xuất danh sách cư dân và đúng số căn đang ở; không nhập xe lùi vào kỳ đã chốt hóa đơn.

Khi tạo căn hoặc gắn chủ hộ đầu tiên, **mật khẩu tạm thời chỉ hiện một lần** trong kết quả nhập thành công. Sao chép và bàn giao riêng; không có trong tệp xuất/lịch sử. Nếu mất response hoặc tải lại trang, vào **Tài khoản căn hộ** để cấp lại mật khẩu và ngắt phiên cũ. Không lưu mật khẩu vào file báo cáo.

## Xuất theo bộ lọc và giới hạn

Ở màn danh sách: áp dụng bộ lọc như thường lệ rồi Xuất Excel/PDF. Tệp lấy toàn bộ dòng phù hợp, gồm các trang chưa mở; không chỉ lấy 20 dòng đang xem. Trang Nhập / xuất có lọc tìm kiếm đơn giản; để dùng đủ bộ lọc, theo liên kết mở màn danh sách tương ứng.

Excel thật có sheet Tổng hợp và Chi tiết, mã/điện thoại giữ số 0 đầu. PDF thật khổ A4 ngang có tiếng Việt, header bảng lặp và số trang. Báo cáo tài chính vẫn giữ cách tính số tiền chính xác và các bộ lọc hiện có. File danh sách chỉ là bản đối chiếu; muốn nhập mới dùng mẫu nhập, không đưa nguyên file báo cáo vào ô nhập.

- Nhập: 1 tệp tối đa **5 MB**, Excel **1–100 dòng không trống**, PDF **1–10 trang**. Công thức, macro, liên kết trong ô hoặc tệp nén quá lớn bị chặn.
- Xuất: Excel tối đa **10.000 dòng**, PDF **1.000 dòng** sau bộ lọc. Vượt thì báo lỗi để thu hẹp bộ lọc hoặc chọn Excel, không tự cắt dữ liệu.
- Mỗi tài khoản xử lý một tệp tại một thời điểm, toàn máy chủ tối đa hai. Nếu báo đang xử lý, đợi lượt cũ hoàn tất rồi thử lại.
- Chỉ BQL được nhập/xuất các danh sách quản lý. Cư dân/KTV không được dùng API này để đọc danh sách hoặc tạo dữ liệu.
- Các nghiệp vụ duyệt hóa đơn, xác nhận đã thu, ghi sổ/đảo phiếu, bàn giao chủ hộ, duyệt lịch và nghiệm thu vẫn đi qua các màn hiện có.

## Kiểm tra nhanh sau cập nhật

1. Vào Nhập / xuất, tải mẫu Excel căn hộ, điền một dòng căn chưa có. Xem trước rồi mở danh sách khác để đối chiếu: căn chưa được lưu. Quay lại xem trước và xác nhận, căn/tài khoản mới xuất hiện.
2. Nhập thiết bị với một dòng hợp lệ và một dòng loại sai. Có lỗi từng dòng, nút xác nhận bị khóa. Sửa rồi nhập lại, toàn lô được lưu cùng nhau.
3. Điền tên có dấu vào mẫu PDF thiết bị, Save và chọn lại trên web. Bản xem trước giữ đúng tên; trang trống không tạo hồ sơ.
4. Thử lại đúng tệp đã nhập: báo đã có/trùng, không tạo bản sao. Nếu mất response trong lúc commit, gửi lại với cùng bản xem trước được nhận diện là đã nhập.
5. Tìm một nhóm có trên 20 căn/cư dân, chuyển sang trang 2 và xuất. Tệp có đủ dòng theo bộ lọc, không thiếu trang 1.

Bộ kiểm thử tự động gồm nhập thật vào MySQL riêng: quyền, rollback preview, token gắn tệp/phiên, retry, căn/tài khoản, chủ hộ, xe, chỉ số, PDF Unicode, tệp sai/công thức/quá giới hạn, xuất đủ 8 phần. Kiểm thử trình duyệt có cả 1440 px và 375 px. Nếu lấy cả checkout có test, chạy `npm test` rồi `npm run test:e2e`; không chạy đồng thời vì dùng chung database test.

## Danh sách file

1. [backend/package.json](../backend/package.json) — Thay toàn bộ.
2. [database/migrations/014_data_imports.sql](../database/migrations/014_data_imports.sql) — Tạo mới.
3. [backend/src/lib/db.js](../backend/src/lib/db.js) — Thay toàn bộ.
4. [backend/src/modules/report-exports/report-files.js](../backend/src/modules/report-exports/report-files.js) — Thay toàn bộ.
5. [backend/src/modules/residency/residency.service.js](../backend/src/modules/residency/residency.service.js) — Thay toàn bộ.
6. [backend/src/modules/vehicles/vehicles.service.js](../backend/src/modules/vehicles/vehicles.service.js) — Thay toàn bộ.
7. [backend/src/modules/billing/billing.service.js](../backend/src/modules/billing/billing.service.js) — Thay toàn bộ.
8. [backend/src/modules/maintenance/maintenance.service.js](../backend/src/modules/maintenance/maintenance.service.js) — Thay toàn bộ.
9. [backend/src/modules/amenities/amenities.service.js](../backend/src/modules/amenities/amenities.service.js) — Thay toàn bộ.
10. [backend/src/modules/data-exchange/catalog.js](../backend/src/modules/data-exchange/catalog.js) — Tạo mới.
11. [backend/src/modules/data-exchange/import-parser.worker.js](../backend/src/modules/data-exchange/import-parser.worker.js) — Tạo mới.
12. [backend/src/modules/data-exchange/import-files.js](../backend/src/modules/data-exchange/import-files.js) — Tạo mới.
13. [backend/src/modules/data-exchange/import.service.js](../backend/src/modules/data-exchange/import.service.js) — Tạo mới.
14. [backend/src/modules/data-exchange/export.service.js](../backend/src/modules/data-exchange/export.service.js) — Tạo mới.
15. [backend/src/modules/data-exchange/data-exchange.routes.js](../backend/src/modules/data-exchange/data-exchange.routes.js) — Tạo mới.
16. [backend/src/app.js](../backend/src/app.js) — Thay toàn bộ.
17. [frontend/src/shared/ReportExport.jsx](../frontend/src/shared/ReportExport.jsx) — Thay toàn bộ.
18. [frontend/src/shared/DataTools.jsx](../frontend/src/shared/DataTools.jsx) — Tạo mới.
19. [frontend/src/features/data-exchange/DataExchange.jsx](../frontend/src/features/data-exchange/DataExchange.jsx) — Tạo mới.
20. [frontend/src/features/residency/Residency.jsx](../frontend/src/features/residency/Residency.jsx) — Thay toàn bộ.
21. [frontend/src/features/vehicles/Vehicles.jsx](../frontend/src/features/vehicles/Vehicles.jsx) — Thay toàn bộ.
22. [frontend/src/features/billing/Billing.jsx](../frontend/src/features/billing/Billing.jsx) — Thay toàn bộ.
23. [frontend/src/features/maintenance/Maintenance.jsx](../frontend/src/features/maintenance/Maintenance.jsx) — Thay toàn bộ.
24. [frontend/src/features/amenities/Amenities.jsx](../frontend/src/features/amenities/Amenities.jsx) — Thay toàn bộ.
25. [frontend/src/app/App.jsx](../frontend/src/app/App.jsx) — Thay toàn bộ.
26. [frontend/src/styles/global.css](../frontend/src/styles/global.css) — Thay toàn bộ.

## Code đầy đủ

### 1. `backend/package.json` — Thay toàn bộ

```json
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --env-file-if-exists=../.env --watch src/server.js",
    "start": "node --env-file-if-exists=../.env src/server.js",
    "db:migrate": "node --env-file-if-exists=../.env scripts/migrate.js",
    "db:seed": "node --env-file-if-exists=../.env scripts/seed.js",
    "test": "node --env-file-if-exists=../.env --test --test-concurrency=1 test/*.test.js"
  },
  "dependencies": {
    "@pdf-lib/fontkit": "1.1.1",
    "bcryptjs": "^3.0.3",
    "exceljs": "4.4.0",
    "express": "^5.1.0",
    "jose": "^6.2.12",
    "multer": "^2.4.0",
    "mysql2": "^3.24.6",
    "pdf-lib": "1.17.1",
    "pdfmake": "0.2.23",
    "sharp": "^0.35.5",
    "yauzl": "3.4.0"
  },
  "devDependencies": {
    "pdf-parse": "1.1.1"
  }
}
```

### 2. `database/migrations/014_data_imports.sql` — Tạo mới

```sql
CREATE TABLE dot_nhap_du_lieu (
  ma_dot_nhap BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_nhap INT UNSIGNED NOT NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  phan_he VARCHAR(30) NOT NULL,
  sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  so_dong SMALLINT UNSIGNED NOT NULL,
  ket_qua JSON NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_import_request (ma_nguoi_nhap,khoa_yeu_cau),
  UNIQUE KEY uq_import_file (ma_nguoi_nhap,phan_he,sha256),
  FOREIGN KEY (ma_nguoi_nhap) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (so_dong BETWEEN 1 AND 100)
) ENGINE=InnoDB;
```

### 3. `backend/src/lib/db.js` — Thay toàn bộ

```js
import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "chung_cu",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "chung_cu",
  connectionLimit: 10,
  timezone: "Z",
  charset: "utf8mb4",
  dateStrings: true,
});
export async function transaction(work, connection = null) {
  // Batch imports reuse the same domain operations inside one outer transaction.
  if (connection) return work(connection);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
export async function rows(db, sql, values = []) {
  const [result] = await db.execute(sql, values);
  return result;
}
```

### 4. `backend/src/modules/report-exports/report-files.js` — Thay toàn bộ

```js
import { choice, fail } from "../../lib/http.js";
import { pagination } from "../billing/billing.validation.js";
export const limits = { xlsx: 10000, pdf: 1000 };
export const format = (query) =>
  choice(query.dinh_dang || "xlsx", "dinh_dang", ["xlsx", "pdf"]);
export function reportPage(query, exportFormat) {
  const { page, offset } = pagination(exportFormat ? { page: 1 } : query);
  const limit = exportFormat
    ? limits[choice(exportFormat, "dinh_dang", ["xlsx", "pdf"])]
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
          `Báo cáo có ${Number(total).toLocaleString("vi-VN")} dòng, vượt giới hạn ${limit.toLocaleString("vi-VN")} dòng cho ${exportFormat === "pdf" ? "PDF" : "Excel"}. Hãy thu hẹp bộ lọc${exportFormat === "pdf" ? " hoặc chọn Excel" : ""}. Không có dữ liệu nào bị cắt bớt.`,
        );
    },
  };
}
// Two file renderers at a time, at most one per account, with bounded output rows.
// Load font/renderer code only when an export is requested; ordinary reads stay light.
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
  const meta = wb.addWorksheet("Tổng hợp"),
    data = wb.addWorksheet("Chi tiết");
  meta.columns = [{ width: 38 }, { width: 75 }];
  meta.addRow(["CHUNG CƯ · QUẢN LÝ VẬN HÀNH"]);
  meta.mergeCells("A1:B1");
  meta.addRow([report.title]);
  meta.mergeCells("A2:B2");
  meta.addRow(["Thời điểm dữ liệu (Việt Nam)", time(report.at)]);
  meta.addRow(["Số dòng chi tiết", report.rows.length]);
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
  data.views = [{ state: "frozen", ySplit: 1 }];
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
let printerPromise;
async function printer() {
  if (!printerPromise)
    printerPromise = Promise.all([
      import("pdfmake"),
      import("pdfmake/build/vfs_fonts.js"),
    ])
      .then(
        ([{ default: PdfPrinter }, { default: vfs }]) =>
          new PdfPrinter({
            Roboto: {
              normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
              bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
              italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
              bolditalics: Buffer.from(
                vfs["Roboto-MediumItalic.ttf"],
                "base64",
              ),
            },
          }),
      )
      .catch((error) => {
        printerPromise = undefined;
        throw error;
      });
  return printerPromise;
}
export async function pdf(report) {
  const render = await printer(),
    wide = report.columns.length >= 9,
    pageWidth = 841.89,
    usable = pageWidth - 64;
  const weights = report.columns.map((c) => c.pdfWidth || 1),
    sum = weights.reduce((a, b) => a + b, 0),
    tableWidths = weights.map(
      (n) => ((usable - report.columns.length * 9) * n) / sum,
    );
  const definition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [32, 30, 32, 38],
    info: {
      title: report.title,
      author: "Quản lý chung cư",
      subject: "Báo cáo theo dữ liệu đã ghi nhận",
    },
    defaultStyle: { font: "Roboto", fontSize: wide ? 7 : 8, color: "#183c3b" },
    footer: (current, total) => ({
      margin: [32, 12, 32, 0],
      columns: [
        { text: "CHUNG CƯ · QUẢN LÝ VẬN HÀNH", fontSize: 7, color: "#627c73" },
        {
          text: `Trang ${current} / ${total}${report.currency === false ? "" : " · Đơn vị: đồng"}`,
          alignment: "right",
          fontSize: 7,
          color: "#627c73",
        },
      ],
    }),
    content: [
      {
        text: "CHUNG CƯ · QUẢN LÝ VẬN HÀNH",
        fontSize: 9,
        color: "#14635a",
        bold: true,
        margin: [0, 0, 0, 6],
      },
      {
        text: clean(report.title),
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      {
        text: `Dữ liệu lúc ${time(report.at)} (Việt Nam) · ${report.rows.length.toLocaleString("vi-VN")} dòng chi tiết`,
        color: "#627c73",
        margin: [0, 0, 0, 6],
      },
      {
        text: report.filters.map(([k, v]) => `${k}: ${clean(v)}`).join("  ·  "),
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ["*", "*"],
          body: report.summary.map((s) => [
            { text: s.label, bold: true },
            {
              text: s.type === "money" ? money(s.value) : clean(s.value),
              alignment: "right",
              bold: true,
            },
          ]),
        },
        layout: {
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => "#dce5df",
          fillColor: (i) => (i % 2 === 0 ? "#f2f6f4" : null),
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 0, 0, 10],
      },
      ...report.notes.map((note) => ({
        text: clean(note),
        color: "#627c73",
        fontSize: 7,
        margin: [0, 0, 0, 4],
      })),
      {
        text: "CHI TIẾT BÁO CÁO",
        bold: true,
        color: "#14635a",
        margin: [0, 10, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: [
            report.columns.map((c) => ({
              text: c.title,
              bold: true,
              color: "white",
            })),
            ...report.rows.map((r) =>
              report.columns.map((c) => ({
                text:
                  c.type === "money" ? money(c.value(r)) : clean(c.value(r)),
                alignment: ["money", "count"].includes(c.type)
                  ? "right"
                  : "left",
              })),
            ),
          ],
        },
        layout: {
          fillColor: (i) =>
            i === 0 ? "#14635a" : i % 2 === 0 ? "#f2f6f4" : null,
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => "#dce5df",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
      ...(!report.rows.length
        ? [
            {
              text: "Không có dữ liệu phù hợp với bộ lọc.",
              margin: [0, 12, 0, 0],
            },
          ]
        : []),
    ],
  };
  const doc = render.createPdfKitDocument(definition);
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (x) => chunks.push(x));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
export async function send(res, report, exportFormat) {
  const body = await (exportFormat === "xlsx" ? excel(report) : pdf(report));
  res.set(
    "Content-Type",
    exportFormat === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf",
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

### 5. `backend/src/modules/residency/residency.service.js` — Thay toàn bộ

```js
import { reportPage } from "../report-exports/report-files.js";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
import { lockApartment } from "../billing/billing.guards.js";
import {
  finishStayVehicles,
  carryStayVehicles,
} from "../vehicles/vehicles.service.js";

import {
  accountForApartment,
  ensureApartmentAccount,
  assignHouseholder,
  releaseHouseholder,
  ownerPhoneChanged,
} from "./apartment-accounts.service.js";

function search(query) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  return { q: `%${q}%`, page, offset: (page - 1) * 20 };
}
function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Dữ liệu đã thay đổi. Hãy tải lại trước khi sửa.",
    );
}
async function one(db, table, key, id, lock = false) {
  // table/key are internal constants, never request parameters.
  const [row] = await rows(
    db,
    `SELECT * FROM ${table} WHERE ${key}=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hồ sơ hoặc căn hộ.");
  return row;
}
async function checkAccount(db, id, previous) {
  if (id === null) return;
  const account = await one(db, "nguoi_dung", "ma_nguoi_dung", id, true);
  if (
    account.ma_can_ho_thanh_toan !== null ||
    account.vai_tro !== "CU_DAN" ||
    (!account.dang_hoat_dong && id !== previous)
  )
    fail(422, "INVALID_ACCOUNT", "Chỉ gắn tài khoản cư dân đang hoạt động.");
}

export async function listApartments(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  const conditions = ["(so_can_ho LIKE ? OR khoi LIKE ?)"];
  const values = [q, q];
  if (query.tang !== undefined && query.tang !== "") {
    const floor = integer(query.tang, "tang");
    if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
    conditions.push("tang=?");
    values.push(floor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM can_ho ${where}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function availableAccounts(query) {
  const { q, page, offset } = search(query);
  const where = `WHERE u.vai_tro='CU_DAN' AND u.dang_hoat_dong=1 AND u.ma_can_ho_thanh_toan IS NULL
    AND (u.ho_va_ten LIKE ? OR u.so_dien_thoai LIKE ?)
    AND NOT EXISTS (SELECT 1 FROM cu_dan c WHERE c.ma_nguoi_dung=u.ma_nguoi_dung)`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM nguoi_dung u ${where}`,
    [q, q],
  );
  const data = await rows(
    pool,
    `SELECT u.ma_nguoi_dung,u.ho_va_ten,u.so_dien_thoai FROM nguoi_dung u ${where} ORDER BY u.ho_va_ten,u.ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
    [q, q],
  );
  return { data, total: count.total, page };
}
export async function apartmentDetail(id) {
  const data = await one(pool, "can_ho", "ma_can_ho", id);
  const residents = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,c.so_dien_thoai,l.quan_he,l.tu_ngay FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE l.ma_can_ho=? AND l.den_ngay IS NULL ORDER BY c.ho_va_ten`,
    [id],
  );
  return {
    ...data,
    residents,
    tai_khoan_can_ho: await accountForApartment(id),
    lich_su_ban_giao: await rows(
      pool,
      "SELECT b.*,u.ho_va_ten AS nguoi_thuc_hien FROM lich_su_ban_giao_can_ho b JOIN nguoi_dung u ON u.ma_nguoi_dung=b.ma_nguoi_thuc_hien WHERE b.ma_can_ho=? ORDER BY b.ma_ban_giao DESC LIMIT 50",
      [id],
    ),
  };
}
export async function saveApartment(id, body, user, connection = null) {
  const values = valid.apartment(body);
  return transaction(async (db) => {
    if (id) {
      const current = await one(db, "can_ho", "ma_can_ho", id, true);
      version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE can_ho SET so_can_ho=?,khoi=?,tang=?,dien_tich_m2=?,tinh_phi_dich_vu=?,phien_ban=phien_ban+1 WHERE ma_can_ho=?",
        [...values, id],
      );
    } else {
      const result = await rows(
        db,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,?,?,?)",
        values,
      );
      id = result.insertId;
    }
    const apartment = await one(db, "can_ho", "ma_can_ho", id);
    const created = await ensureApartmentAccount(db, apartment, user);
    return {
      ...apartment,
      tai_khoan_can_ho:
        created.credentials || (await accountForApartment(id, db)),
    };
  }, connection);
}

const residentJoin = `FROM cu_dan c LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL LEFT JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho`;
export async function listResidents(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  const conditions = ["(c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ?)"];
  const values = [q, q];
  if (query.ma_can_ho) {
    conditions.push("l.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ma_cu_dan) {
    conditions.push("c.ma_cu_dan=?");
    values.push(integer(query.ma_cu_dan, "ma_cu_dan"));
  }
  if (query.trang_thai === "DANG_O") conditions.push("l.ma_can_ho IS NOT NULL");
  else if (query.trang_thai === "DA_CHUYEN_DI")
    conditions.push("l.ma_can_ho IS NULL");
  else if (query.trang_thai)
    fail(422, "INVALID_STATUS", "Bộ lọc cư trú không hợp lệ.");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${residentJoin} ${where}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*,l.ma_lich_su_cu_tru,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function residentDetail(id) {
  const resident = await one(pool, "cu_dan", "ma_cu_dan", id);
  const history = await rows(
    pool,
    `SELECT l.*,a.so_can_ho,u.ho_va_ten AS nguoi_ghi_nhan FROM lich_su_cu_tru l JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi_nhan WHERE l.ma_cu_dan=? ORDER BY l.tu_ngay DESC,l.ma_lich_su_cu_tru DESC`,
    [id],
  );
  return {
    ...resident,
    history,
    tai_khoan_can_ho:
      (
        await rows(
          pool,
          "SELECT ma_can_ho_thanh_toan,ten_dang_nhap,dang_hoat_dong FROM nguoi_dung WHERE ma_cu_dan_phu_trach=?",
          [id],
        )
      )[0] || null,
  };
}
export async function saveResident(id, body, user, connection = null) {
  const values = valid.resident(body);
  const initialStay = id ? null : valid.stay(body);
  return transaction(async (db) => {
    let previousAccount = null,
      previousPhone = null,
      credentials = null;
    if (id) {
      const current = await one(db, "cu_dan", "ma_cu_dan", id, true);
      version(current, body.phien_ban);
      previousAccount = current.ma_nguoi_dung;
      previousPhone = current.so_dien_thoai;
    }
    await checkAccount(db, values[2], previousAccount);
    if (id) {
      await rows(
        db,
        "UPDATE cu_dan SET ho_va_ten=?,so_dien_thoai=?,ma_nguoi_dung=?,phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
        [...values, id],
      );
      if (previousPhone !== values[1]) await ownerPhoneChanged(db, id, user);
    } else {
      const apartment = await lockApartment(db, initialStay[0]);
      const result = await rows(
        db,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES (?,?,?)",
        values,
      );
      id = result.insertId;
      await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...initialStay, user.ma_nguoi_dung],
      );
      if (initialStay[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          apartment,
          id,
          user,
          body.xac_nhan_ban_giao,
        );
    }
    return {
      ...(await one(db, "cu_dan", "ma_cu_dan", id)),
      tai_khoan_can_ho: credentials,
    };
  }, connection);
}

export async function changeStay(id, action, body, user) {
  const day = valid.date(body.ngay);
  const next = action === "chuyen_di" ? null : valid.stay(body);
  if (
    body.chuyen_phuong_tien !== undefined &&
    typeof body.chuyen_phuong_tien !== "boolean"
  )
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Lựa chọn chuyển xe cần là có hoặc không.",
    );
  if (body.chuyen_phuong_tien && action !== "chuyen_can")
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Chỉ chuyển đăng ký xe khi chuyển căn.",
    );
  return transaction(async (db) => {
    const resident = await one(db, "cu_dan", "ma_cu_dan", id, true);
    version(resident, body.phien_ban);
    const history = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? ORDER BY tu_ngay DESC,ma_lich_su_cu_tru DESC FOR UPDATE",
      [id],
    );
    const current = history.find((stay) => stay.den_ngay === null);
    if (action === "nhap_cu") {
      if (current)
        fail(
          409,
          "ALREADY_RESIDENT",
          "Cư dân đang ở một căn hộ. Hãy dùng Chuyển căn.",
        );
      if (history.some((stay) => !stay.den_ngay || stay.den_ngay > day))
        fail(
          422,
          "OVERLAPPING_STAY",
          "Ngày nhập cư phải từ ngày kết thúc đợt cư trú gần nhất.",
        );
    } else {
      if (!current)
        fail(409, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi. Hãy tải lại hồ sơ.");
      if (day < current.tu_ngay)
        fail(
          422,
          "INVALID_END_DATE",
          "Ngày chuyển không được trước ngày bắt đầu đợt cư trú hiện tại.",
        );
      if (next && next[0] === current.ma_can_ho)
        fail(422, "SAME_APARTMENT", "Cần chọn căn hộ khác để chuyển căn.");
    }
    if (next) await one(db, "can_ho", "ma_can_ho", next[0]);
    for (const apartmentId of [
      ...new Set([current?.ma_can_ho, next?.[0]].filter(Boolean)),
    ].sort((a, b) => a - b))
      await lockApartment(db, apartmentId);
    const vehicles = current
      ? await finishStayVehicles(
          db,
          current.ma_lich_su_cu_tru,
          day,
          user.ma_nguoi_dung,
          action === "chuyen_can" ? "Chuyển căn" : "Chuyển đi",
        )
      : [];
    if (current) await releaseHouseholder(db, current.ma_can_ho, id, user);
    if (current)
      await rows(
        db,
        "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
        [day, current.ma_lich_su_cu_tru],
      );
    let credentials = null;
    if (next) {
      const inserted = await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...next, user.ma_nguoi_dung],
      );
      if (next[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          await one(db, "can_ho", "ma_can_ho", next[0]),
          id,
          user,
          body.xac_nhan_ban_giao,
        );
      if (body.chuyen_phuong_tien)
        await carryStayVehicles(
          db,
          vehicles,
          { ma_can_ho: next[0], ma_lich_su_cu_tru: inserted.insertId },
          day,
          user.ma_nguoi_dung,
        );
    }
    await rows(
      db,
      "UPDATE cu_dan SET phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
      [id],
    );
    return {
      ma_cu_dan: id,
      phien_ban: resident.phien_ban + 1,
      tai_khoan_can_ho: credentials,
    };
  });
}
```

### 6. `backend/src/modules/vehicles/vehicles.service.js` — Thay toàn bộ

```js
import { reportPage } from "../report-exports/report-files.js";
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";
import * as valid from "./vehicles.validation.js";
import {
  lockApartment,
  assertVehiclePeriodOpen,
} from "../billing/billing.guards.js";

const joins = `FROM phuong_tien v JOIN cu_dan c ON c.ma_cu_dan=v.ma_cu_dan JOIN can_ho a ON a.ma_can_ho=v.ma_can_ho`;
const columns = `v.*,c.ho_va_ten,c.so_dien_thoai,a.so_can_ho`;
async function residentLock(db, id) {
  const [resident] = await rows(
    db,
    "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [id],
  );
  if (!resident) fail(404, "NOT_FOUND", "Không tìm thấy cư dân.");
}
export async function list(query, exportFormat = null) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  const where = [
    "(v.ma_dang_ky LIKE ? OR v.bien_so LIKE ? OR c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ? OR a.so_can_ho LIKE ?)",
  ];
  const values = [
    `%${q}%`,
    `%${q.toUpperCase().replace(/[\s.-]/g, "")}%`,
    `%${q}%`,
    `%${q}%`,
    `%${q}%`,
  ];
  if (query.loai_xe) {
    where.push("v.loai_xe=?");
    values.push(choice(query.loai_xe, "loai_xe", valid.types));
  }
  if (query.trang_thai) {
    choice(query.trang_thai, "trang_thai", ["DANG_GUI", "DA_KET_THUC"]);
    where.push(
      query.trang_thai === "DANG_GUI"
        ? "v.ngay_ket_thuc IS NULL"
        : "v.ngay_ket_thuc IS NOT NULL",
    );
  }
  for (const key of ["ma_cu_dan", "ma_can_ho"])
    if (query[key]) {
      where.push(`v.${key}=?`);
      values.push(integer(query[key], key));
    }
  const condition = `WHERE ${where.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${joins} ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT ${columns} ${joins} ${condition} ORDER BY v.ma_phuong_tien DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function detail(id) {
  const [record] = await rows(
    pool,
    `SELECT ${columns},l.tu_ngay,l.den_ngay,u.ho_va_ten AS nguoi_tao,k.ho_va_ten AS nguoi_ket_thuc,p.ma_dang_ky AS dang_ky_truoc ${joins} JOIN lich_su_cu_tru l ON l.ma_lich_su_cu_tru=v.ma_lich_su_cu_tru JOIN nguoi_dung u ON u.ma_nguoi_dung=v.ma_nguoi_tao LEFT JOIN nguoi_dung k ON k.ma_nguoi_dung=v.ma_nguoi_ket_thuc LEFT JOIN phuong_tien p ON p.ma_phuong_tien=v.ma_dang_ky_truoc WHERE v.ma_phuong_tien=?`,
    [id],
  );
  if (!record) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
  return record;
}
async function insert(db, record, stay, userId, previous = null) {
  const result = await rows(
    db,
    `INSERT INTO phuong_tien (ma_dang_ky,ma_cu_dan,ma_can_ho,ma_lich_su_cu_tru,ma_dang_ky_truoc,loai_xe,bien_so,hang_xe,mau_sac,ngay_dang_ky,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      `XE-${randomBytes(6).toString("hex").toUpperCase()}`,
      record.ma_cu_dan,
      stay.ma_can_ho,
      stay.ma_lich_su_cu_tru,
      previous,
      record.loai_xe,
      record.bien_so,
      record.hang_xe,
      record.mau_sac,
      record.ngay_dang_ky,
      userId,
    ],
  );
  return { ma_phuong_tien: result.insertId };
}
export async function create(body, user, connection = null) {
  const data = valid.registration(body);
  return transaction(async (db) => {
    await residentLock(db, data.ma_cu_dan);
    const [stay] = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
      [data.ma_cu_dan],
    );
    if (!stay)
      fail(422, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi, chưa thể đăng ký xe.");
    if (stay.ma_lich_su_cu_tru !== data.ma_lich_su_cu_tru)
      fail(
        409,
        "STALE_RESIDENCY",
        "Cư dân đã đổi đợt cư trú. Hãy tải lại và chọn lại cư dân.",
      );
    if (
      body.ma_can_ho !== undefined &&
      integer(body.ma_can_ho, "ma_can_ho") !== stay.ma_can_ho
    )
      fail(
        422,
        "APARTMENT_MISMATCH",
        "Căn chịu phí phải là căn cư dân đang ở.",
      );
    if (data.ngay_dang_ky < stay.tu_ngay)
      fail(
        422,
        "INVALID_START_DATE",
        "Ngày đăng ký xe không được trước ngày bắt đầu đợt cư trú.",
      );
    await assertVehiclePeriodOpen(db, stay.ma_can_ho, data.ngay_dang_ky);
    if (data.bien_so) {
      const conflicts = await rows(
        db,
        `SELECT ma_phuong_tien FROM phuong_tien WHERE bien_so=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>ngay_dang_ky) FOR UPDATE`,
        [data.bien_so, data.ngay_dang_ky],
      );
      if (conflicts.length)
        fail(
          409,
          "PLATE_IN_USE",
          "Biển số đã có đăng ký đang gửi hoặc thời gian đăng ký chồng nhau.",
        );
    }
    return insert(db, data, stay, user.ma_nguoi_dung);
  }, connection);
}
export async function end(id, body, user) {
  const day = date(body.ngay_ket_thuc),
    reason = text(body.ly_do_ket_thuc, "ly_do_ket_thuc", 3, 255);
  const expectedVersion = integer(body.phien_ban, "phien_ban");
  return transaction(async (db) => {
    const [owner] = await rows(
      db,
      "SELECT ma_cu_dan,ma_can_ho FROM phuong_tien WHERE ma_phuong_tien=?",
      [id],
    );
    if (!owner) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
    // All writes lock resident -> stay/vehicle, matching the residency transfer order.
    await residentLock(db, owner.ma_cu_dan);
    await lockApartment(db, owner.ma_can_ho);
    const [record] = await rows(
      db,
      "SELECT * FROM phuong_tien WHERE ma_phuong_tien=? FOR UPDATE",
      [id],
    );
    if (record.ngay_ket_thuc) {
      if (record.ngay_ket_thuc === day) return { ma_phuong_tien: id };
      fail(
        409,
        "ALREADY_ENDED",
        "Đăng ký đã kết thúc. Không sửa lịch sử đăng ký cũ.",
      );
    }
    if (record.phien_ban !== expectedVersion)
      fail(409, "STALE_VERSION", "Đăng ký đã thay đổi. Hãy tải lại.");
    if (day < record.ngay_dang_ky)
      fail(
        422,
        "INVALID_END_DATE",
        "Ngày kết thúc không được trước ngày đăng ký xe.",
      );
    await assertVehiclePeriodOpen(db, record.ma_can_ho, day);
    await rows(
      db,
      "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_phuong_tien=?",
      [day, reason, user.ma_nguoi_dung, id],
    );
    return { ma_phuong_tien: id };
  });
}

// Called inside the residency transaction, after its resident row is locked.
export async function finishStayVehicles(db, stayId, day, userId, reason) {
  const [stay] = await rows(
    db,
    "SELECT ma_can_ho FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?",
    [stayId],
  );
  await lockApartment(db, stay.ma_can_ho);
  const records = await rows(
    db,
    "SELECT * FROM phuong_tien WHERE ma_lich_su_cu_tru=? ORDER BY ma_phuong_tien FOR UPDATE",
    [stayId],
  );
  if (
    records.some(
      (v) => v.ngay_dang_ky > day || (v.ngay_ket_thuc && v.ngay_ket_thuc > day),
    )
  )
    fail(
      422,
      "VEHICLE_DATE_CONFLICT",
      "Ngày chuyển không được trước ngày đăng ký hoặc kết thúc xe trong đợt cư trú này.",
    );
  const active = records.filter((v) => !v.ngay_ket_thuc);
  if (active.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  await rows(
    db,
    "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_lich_su_cu_tru=? AND ngay_ket_thuc IS NULL",
    [day, reason, userId, stayId],
  );
  return active;
}
export async function carryStayVehicles(db, records, stay, day, userId) {
  if (records.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  for (const record of records)
    await insert(
      db,
      { ...record, ngay_dang_ky: day },
      stay,
      userId,
      record.ma_phuong_tien,
    );
}
```

### 7. `backend/src/modules/billing/billing.service.js` — Thay toàn bộ

```js
import { reportPage } from "../report-exports/report-files.js";
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "./billing.guards.js";
import { vietQR } from "./billing.qr.js";
import * as v from "./billing.validation.js";
import { electricityConfig, electricityLines } from "./billing.electricity.js";

const json = (x) => (typeof x === "string" ? JSON.parse(x) : x);
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, stable(x[k])]),
    );
  return x;
}
const digest = (x) =>
  createHash("sha256")
    .update(JSON.stringify(stable(x)))
    .digest("hex");
const fixed = ["DA_DUYET", "DA_GUI", "DA_THANH_TOAN"];
const state = (row, allowed) => {
  if (!allowed.includes(row.trang_thai))
    fail(
      409,
      "INVALID_STATE",
      "Trạng thái hóa đơn không cho phép thao tác này.",
    );
};
const opts = (row, body = {}) =>
  v.options(
    Object.fromEntries(
      ["tinh_nuoc", "tinh_dien", "tinh_xe"].map((key) => [
        key,
        key in body ? body[key] : !!row[key],
      ]),
    ),
  );
async function log(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_hoa_don (ma_hoa_don,ma_nguoi_ghi,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}

export async function rates(query) {
  const { page, offset } = v.pagination(query),
    values = [],
    where = [];
  if (query.loai_phi) {
    where.push("c.loai_phi=?");
    values.push(choice(query.loai_phi, "loai_phi", v.feeTypes));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM cau_hinh_phi c ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi ${condition} ORDER BY c.ma_cau_hinh_phi DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function createRate(body, user) {
  const type = choice(body.loai_phi, "loai_phi", v.feeTypes),
    config = electricityConfig(body, type),
    price =
      config.cach_tinh === "BAC_THANG"
        ? "0.00"
        : v.decimal(v.scaled(body.don_gia), 2),
    from = v.day(body.tu_ngay, true);
  return transaction(async (db) => {
    await rows(
      db,
      "SELECT loai_phi FROM loai_phi WHERE loai_phi=? FOR UPDATE",
      [type],
    );
    const [last] = await rows(
      db,
      "SELECT * FROM cau_hinh_phi WHERE loai_phi=? ORDER BY tu_ngay DESC LIMIT 1 FOR UPDATE",
      [type],
    );
    if (last) {
      if (from <= last.tu_ngay)
        fail(
          422,
          "RATE_ORDER",
          "Ngày áp dụng mới phải sau phiên bản giá gần nhất.",
        );
      const used = await rows(
        db,
        "SELECT h.ma_hoa_don FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE d.ma_cau_hinh_phi=? AND h.trang_thai<>'HUY' AND h.ngay_chot_phi>=? LIMIT 1",
        [last.ma_cau_hinh_phi, from],
      );
      if (used.length)
        fail(
          409,
          "RATE_IN_USE",
          "Ngày áp dụng mới trùng khoảng giá đã dùng. Chọn ngày sau ngày chốt hóa đơn đã lập.",
        );
      await rows(
        db,
        "UPDATE cau_hinh_phi SET den_ngay=? WHERE ma_cau_hinh_phi=?",
        [from, last.ma_cau_hinh_phi],
      );
    }
    const result = await rows(
      db,
      "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,ma_nguoi_tao,cach_tinh,thue_gtgt,bac_dien) VALUES (?,?,?,?,?,?,?)",
      [
        type,
        price,
        from,
        user.ma_nguoi_dung,
        config.cach_tinh,
        config.thue_gtgt,
        config.bac_dien === null ? null : JSON.stringify(config.bac_dien),
      ],
    );
    return { ma_cau_hinh_phi: result.insertId };
  });
}
export async function meters(query, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    values = [],
    where = [];
  if (query.ma_can_ho) {
    where.push("m.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ky_thanh_toan) {
    where.push("m.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM chi_so_dich_vu m ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function saveMeter(body, user, connection = null) {
  const apartmentId = integer(body.ma_can_ho, "ma_can_ho"),
    type = choice(body.loai_dich_vu, "loai_dich_vu", ["DIEN", "NUOC"]),
    month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot, month);
  const old = v.scaled(body.chi_so_cu, 3, 9),
    next = v.scaled(body.chi_so_moi, 3, 9),
    note = text(body.ghi_chu ?? "", "ghi_chu", 0, 255);
  if (next < old)
    fail(422, "METER_DECREASE", "Chỉ số mới không được nhỏ hơn chỉ số cũ.");
  return transaction(async (db) => {
    await lockApartment(db, apartmentId);
    const billed = await rows(
      db,
      "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') LIMIT 1 FOR UPDATE",
      [apartmentId, month],
    );
    if (billed.length)
      fail(
        409,
        "METER_LOCKED",
        "Kỳ này đã có hóa đơn được duyệt. Hủy hóa đơn chưa thanh toán trước khi điều chỉnh chỉ số.",
      );
    const records = await rows(
      db,
      "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? ORDER BY ky_thanh_toan DESC FOR UPDATE",
      [apartmentId, type],
    );
    if (records[0]?.ky_thanh_toan > month)
      fail(
        409,
        "METER_LATER_PERIOD",
        "Chỉ ghi hoặc sửa kỳ mới nhất; đã có chỉ số kỳ sau.",
      );
    const current = records.find((r) => r.ky_thanh_toan === month),
      previous = records.find((r) => r.ky_thanh_toan < month);
    if (previous) {
      const prior = new Date(`${month}-01T00:00:00Z`);
      prior.setUTCMonth(prior.getUTCMonth() - 1);
      if (previous.ky_thanh_toan !== prior.toISOString().slice(0, 7))
        fail(
          422,
          "MISSING_PREVIOUS_METER",
          "Thiếu chỉ số kỳ liền trước. Hãy bổ sung trước khi ghi kỳ này.",
        );
      if (old !== v.scaled(previous.chi_so_moi, 3, 9))
        fail(
          422,
          "METER_CHAIN",
          "Chỉ số cũ phải bằng chỉ số mới của kỳ liền trước.",
        );
    } else if (!current && body.ky_dau !== true)
      fail(
        422,
        "FIRST_METER",
        "Kỳ đầu cần xác nhận nhập cả chỉ số đầu và cuối.",
      );
    if (current) {
      v.version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE chi_so_dich_vu SET chi_so_cu=?,chi_so_moi=?,ngay_chot=?,ghi_chu=?,ma_nguoi_ghi=?,ngay_ghi=CURRENT_TIMESTAMP,phien_ban=phien_ban+1 WHERE ma_chi_so_dich_vu=?",
        [
          v.decimal(old, 3),
          v.decimal(next, 3),
          day,
          note,
          user.ma_nguoi_dung,
          current.ma_chi_so_dich_vu,
        ],
      );
      return { ma_chi_so_dich_vu: current.ma_chi_so_dich_vu };
    }
    const result = await rows(
      db,
      "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ghi_chu,ma_nguoi_ghi) VALUES (?,?,?,?,?,?,?,?)",
      [
        apartmentId,
        type,
        month,
        v.decimal(old, 3),
        v.decimal(next, 3),
        day,
        note,
        user.ma_nguoi_dung,
      ],
    );
    return { ma_chi_so_dich_vu: result.insertId };
  }, connection);
}

async function calculate(db, apartment, month, day, options) {
  await rows(db, "SELECT loai_phi FROM loai_phi ORDER BY loai_phi FOR UPDATE");
  const rates = await rows(
    db,
    "SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi WHERE c.tu_ngay<=? AND (c.den_ngay IS NULL OR c.den_ngay>?) ORDER BY c.loai_phi FOR UPDATE",
    [day, day],
  );
  const meters = await rows(
    db,
    "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY loai_dich_vu FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  const cars = options.tinh_xe
    ? await rows(
        db,
        "SELECT ma_phuong_tien,loai_xe FROM phuong_tien WHERE ma_can_ho=? AND ngay_dang_ky<=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) ORDER BY ma_phuong_tien FOR UPDATE",
        [apartment.ma_can_ho, day, day],
      )
    : [];
  const lines = [],
    errors = [];
  function add(type, quantity, source = {}, meterId = null) {
    const rate = rates.find((r) => r.loai_phi === type);
    if (!rate) {
      errors.push(`Thiếu đơn giá ${type} tại ngày chốt.`);
      return;
    }
    const qty = v.decimal(v.scaled(quantity, 3, 9), 3),
      price = v.decimal(v.scaled(rate.don_gia), 2);
    lines.push({
      loai_phi: type,
      dien_giai: rate.ten_phi,
      don_vi_tinh: rate.don_vi_tinh,
      so_luong: qty,
      don_gia: price,
      thanh_tien: v.lineTotal(qty, price),
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: source,
    });
  }
  if (apartment.tinh_phi_dich_vu) add("PHI_QUAN_LY", apartment.dien_tich_m2);
  if (options.tinh_xe)
    for (const [type, fee] of [
      ["O_TO", "GUI_O_TO"],
      ["XE_MAY", "GUI_XE_MAY"],
      ["XE_DAP", "GUI_XE_DAP"],
    ]) {
      const selected = cars.filter((r) => r.loai_xe === type);
      if (selected.length)
        add(fee, String(selected.length), {
          ma_dang_ky: selected.map((r) => r.ma_phuong_tien),
        });
    }
  for (const [type, enabled] of [
    ["NUOC", options.tinh_nuoc],
    ["DIEN", options.tinh_dien],
  ])
    if (enabled) {
      const meter = meters.find((r) => r.loai_dich_vu === type);
      if (!meter || meter.ngay_chot !== day) {
        errors.push(`Thiếu chỉ số ${type} đúng ngày chốt ${day}.`);
        continue;
      }
      const used =
        v.scaled(meter.chi_so_moi, 3, 9) - v.scaled(meter.chi_so_cu, 3, 9);
      if (type === "DIEN") {
        const rate = rates.find((r) => r.loai_phi === "TIEN_DIEN");
        if (!rate) errors.push("Thiếu đơn giá TIEN_DIEN tại ngày chốt.");
        else {
          // Preserve legacy flat/no-VAT snapshots byte-for-byte for existing drafts.
          if (rate.cach_tinh === "BAC_THANG" || v.scaled(rate.thue_gtgt) > 0n) {
            lines.push(
              ...electricityLines(
                rate,
                used,
                {
                  chi_so_cu: meter.chi_so_cu,
                  chi_so_moi: meter.chi_so_moi,
                  phien_ban: meter.phien_ban,
                },
                meter.ma_chi_so_dich_vu,
              ),
            );
            continue;
          }
        }
        if (!rate) continue;
      }
      add(
        `TIEN_${type}`,
        v.decimal(used, 3),
        {
          chi_so_cu: meter.chi_so_cu,
          chi_so_moi: meter.chi_so_moi,
          phien_ban: meter.phien_ban,
        },
        meter.ma_chi_so_dich_vu,
      );
    }
  if (!lines.length) errors.push("Chưa có khoản phí hợp lệ được áp dụng.");
  const total = lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n);
  if (total > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Tổng hóa đơn vượt giới hạn.");
  return {
    lines,
    errors,
    total: total.toString(),
    hash: digest({ lines, errors }),
  };
}
async function storeSnapshot(db, id, snapshot) {
  await rows(db, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [id]);
  for (const l of snapshot.lines)
    await rows(
      db,
      "INSERT INTO chi_tiet_hoa_don (ma_hoa_don,ma_cau_hinh_phi,ma_chi_so_dich_vu,loai_phi,dien_giai,don_vi_tinh,so_luong,don_gia,thanh_tien,du_lieu_nguon) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        l.ma_cau_hinh_phi,
        l.ma_chi_so_dich_vu,
        l.loai_phi,
        l.dien_giai,
        l.don_vi_tinh,
        l.so_luong,
        l.don_gia,
        l.thanh_tien,
        JSON.stringify(l.du_lieu_nguon),
      ],
    );
  await rows(
    db,
    "UPDATE hoa_don SET tong_tien=?,loi_du_lieu=?,dau_van_tay=? WHERE ma_hoa_don=?",
    [snapshot.total, JSON.stringify(snapshot.errors), snapshot.hash, id],
  );
}
async function makeDraft(db, apartment, body, user, previous = null) {
  const month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot_phi, month),
    options = v.options(body);
  const existing = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY lan_lap DESC FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  if (existing.some((h) => h.trang_thai !== "HUY"))
    fail(
      409,
      "BILL_EXISTS",
      "Căn đã có hóa đơn còn hiệu lực trong kỳ. Mở hóa đơn nháp để tính lại.",
    );
  if (
    existing.length &&
    (!previous || existing[0].ma_hoa_don !== previous.ma_hoa_don)
  )
    fail(
      409,
      "REPLACEMENT_REQUIRED",
      "Hãy lập thay thế từ hóa đơn hủy gần nhất.",
    );
  const snapshot = await calculate(db, apartment, month, day, options);
  const result = await rows(
    db,
    "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,loi_du_lieu,dau_van_tay,ma_nguoi_lap,ma_hoa_don_thay_the_cho) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      `HD${month.replace("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`,
      apartment.ma_can_ho,
      month,
      day,
      (existing[0]?.lan_lap || 0) + 1,
      options.tinh_nuoc,
      options.tinh_dien,
      options.tinh_xe,
      "[]",
      snapshot.hash,
      user.ma_nguoi_dung,
      previous?.ma_hoa_don || null,
    ],
  );
  await storeSnapshot(db, result.insertId, snapshot);
  await log(db, result.insertId, user, previous ? "LAP_THAY_THE" : "LAP_NHAP");
  return { ma_hoa_don: result.insertId };
}
export async function generate(body, user) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(async (db) =>
    makeDraft(db, await lockApartment(db, id), body, user),
  );
}
async function lockedBill(db, id) {
  const [row] = await rows(
    db,
    "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
  const apartment = await lockApartment(db, row.ma_can_ho);
  const [bill] = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
    [id],
  );
  return { bill, apartment };
}
export async function action(id, action, body, user) {
  return transaction(async (db) => {
    const { bill, apartment } = await lockedBill(db, id);
    if (
      action === "xac_nhan_thanh_toan" &&
      bill.trang_thai === "DA_THANH_TOAN"
    ) {
      if (
        v.amount(body.so_tien).toString() === bill.so_tien_da_thu &&
        text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100) === bill.ma_tham_chieu
      )
        return { ma_hoa_don: id };
      fail(409, "ALREADY_PAID", "Hóa đơn đã được xác nhận thu.");
    }
    v.version(bill, body.phien_ban);
    if (action === "lap_thay_the") {
      state(bill, ["HUY"]);
      return makeDraft(
        db,
        apartment,
        {
          ky_thanh_toan: bill.ky_thanh_toan,
          ngay_chot_phi: body.ngay_chot_phi ?? bill.ngay_chot_phi,
          ...opts(bill, body),
        },
        user,
        bill,
      );
    }
    if (action === "tinh_lai") {
      state(bill, ["NHAP"]);
      const day = v.monthDay(
          body.ngay_chot_phi ?? bill.ngay_chot_phi,
          bill.ky_thanh_toan,
        ),
        options = opts(bill, body);
      await storeSnapshot(
        db,
        id,
        await calculate(db, apartment, bill.ky_thanh_toan, day, options),
      );
      await rows(
        db,
        "UPDATE hoa_don SET ngay_chot_phi=?,tinh_nuoc=?,tinh_dien=?,tinh_xe=? WHERE ma_hoa_don=?",
        [day, options.tinh_nuoc, options.tinh_dien, options.tinh_xe, id],
      );
    } else if (action === "duyet") {
      state(bill, ["NHAP"]);
      const current = await calculate(
        db,
        apartment,
        bill.ky_thanh_toan,
        bill.ngay_chot_phi,
        opts(bill),
      );
      if (current.errors.length || BigInt(current.total) <= 0n)
        fail(
          422,
          "INCOMPLETE_BILL",
          "Hóa đơn còn thiếu dữ liệu hoặc tổng bằng 0. Bổ sung và tính lại bản nháp.",
        );
      if (current.hash !== bill.dau_van_tay || current.total !== bill.tong_tien)
        fail(
          409,
          "STALE_BILL_SOURCE",
          "Dữ liệu nguồn đã thay đổi. Hãy tính lại bản nháp trước khi duyệt.",
        );
      const saved = await rows(
        db,
        "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
        [id],
      );
      const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
        ...l,
        du_lieu_nguon: json(l.du_lieu_nguon),
      }));
      if (
        digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay
      )
        fail(
          409,
          "BILL_TOTAL_MISMATCH",
          "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const due = v.day(body.han_thanh_toan, true),
        bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
        account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
        name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
      if (
        due < bill.ngay_chot_phi ||
        due < v.today() ||
        !/^\d{6}$/.test(bin) ||
        !/^\d{6,30}$/.test(account)
      )
        fail(
          422,
          "INVALID_PAYMENT_DETAILS",
          "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_GUI',han_thanh_toan=?,ma_ngan_hang=?,so_tai_khoan=?,ten_nguoi_nhan=?,ma_nguoi_gui=?,ngay_gui=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [due, bin, account, name, user.ma_nguoi_dung, id],
      );
    } else if (action === "huy") {
      state(bill, ["NHAP", "DA_DUYET", "DA_GUI"]);
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='HUY',ly_do_huy=?,ma_nguoi_huy=?,ngay_huy=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [reason, user.ma_nguoi_dung, id],
      );
    } else if (action === "xac_nhan_thanh_toan") {
      state(bill, ["DA_GUI"]);
      const amount = v.amount(body.so_tien),
        reference = text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100);
      if (amount !== BigInt(bill.tong_tien))
        fail(
          422,
          "WRONG_AMOUNT",
          "Chỉ xác nhận khi số tiền đã đối soát bằng đúng tổng hóa đơn.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=UTC_TIMESTAMP() WHERE ma_hoa_don=?",
        [amount.toString(), reference, user.ma_nguoi_dung, id],
      );
    } else fail(404, "NOT_FOUND", "Không có thao tác hóa đơn này.");
    await rows(
      db,
      "UPDATE hoa_don SET phien_ban=phien_ban+1 WHERE ma_hoa_don=?",
      [id],
    );
    await log(
      db,
      id,
      user,
      action.toUpperCase(),
      action === "huy" ? text(body.ly_do, "ly_do", 3, 255) : "",
    );
    return { ma_hoa_don: id };
  });
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  if (user.ma_can_ho_thanh_toan !== null) {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.ma_can_ho_thanh_toan=h.ma_can_ho AND u.dang_hoat_dong=1 AND u.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.phien_ban_token);
  } else {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
    );
    values.push(user.ma_nguoi_dung);
  }
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    where = [],
    values = [];
  access(user, where, values);
  if (query.ky_thanh_toan) {
    where.push("h.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  if (query.trang_thai) {
    where.push("h.trang_thai=?");
    values.push(
      choice(query.trang_thai, "trang_thai", [
        "NHAP",
        "DA_DUYET",
        "DA_GUI",
        "DA_THANH_TOAN",
        "HUY",
      ]),
    );
  }
  if (query.ma_can_ho) {
    where.push("h.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.q) {
    const q = text(query.q, "q", 1, 100);
    where.push("(h.so_hoa_don LIKE ? OR a.so_can_ho LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho,c.ho_va_ten AS nguoi_phu_trach_thanh_toan FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=h.ma_can_ho LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!row)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy hóa đơn hoặc bạn không còn quyền xem.",
    );
  const lines = await rows(
    pool,
    "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
    [id],
  );
  if (user.vai_tro === "QUAN_TRI_VIEN")
    return {
      ...summary(row),
      loi_du_lieu: json(row.loi_du_lieu),
      lines: lines.map((l) => ({ ...l, du_lieu_nguon: json(l.du_lieu_nguon) })),
      history: await rows(
        pool,
        "SELECT l.*,u.ho_va_ten FROM lich_su_hoa_don l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi WHERE ma_hoa_don=? ORDER BY l.ma_lich_su_hoa_don",
        [id],
      ),
      qr_payload: vietQR(row),
    };
  const allowed = [
    "ma_hoa_don",
    "so_hoa_don",
    "so_can_ho",
    "nguoi_phu_trach_thanh_toan",
    "ky_thanh_toan",
    "ngay_chot_phi",
    "trang_thai",
    "tong_tien",
    "han_thanh_toan",
    "ma_ngan_hang",
    "so_tai_khoan",
    "ten_nguoi_nhan",
    "ngay_thanh_toan",
    "so_tien_da_thu",
    "ma_tham_chieu",
  ];
  return {
    ...summary(Object.fromEntries(allowed.map((k) => [k, row[k]]))),
    lines: lines.map((l) =>
      Object.fromEntries(
        ["dien_giai", "don_vi_tinh", "so_luong", "don_gia", "thanh_tien"].map(
          (k) => [k, l[k]],
        ),
      ),
    ),
    qr_payload: vietQR(row),
  };
}
```

### 8. `backend/src/modules/maintenance/maintenance.service.js` — Thay toàn bộ

```js
import { reportPage } from "../report-exports/report-files.js";
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text, integer } from "../../lib/http.js";
import { day, pagination } from "../billing/billing.validation.js";
import * as v from "./maintenance.validation.js";
const admin = (user) => user.vai_tro === "QUAN_TRI_VIEN";
const notFound = () =>
  fail(
    404,
    "NOT_FOUND",
    "Không tìm thấy dữ liệu bảo trì hoặc bạn không còn quyền xem.",
  );
const openSql = "('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU')";
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function staff(db, id) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung,ho_va_ten FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 FOR SHARE",
    [id],
  );
  if (!u) fail(422, "INVALID_TECHNICIAN", "Chọn kỹ thuật viên đang hoạt động.");
  return u;
}
async function lockEquipment(db, id) {
  const [e] = await rows(
    db,
    "SELECT * FROM thiet_bi WHERE ma_thiet_bi=? FOR UPDATE",
    [id],
  );
  if (!e) notFound();
  return e;
}
async function audit(db, e, j, user, event, note, data) {
  await rows(
    db,
    "INSERT INTO lich_su_bao_tri (ma_thiet_bi,ma_phieu_bao_tri,ma_nguoi_thuc_hien,su_kien,ghi_chu,du_lieu) VALUES (?,?,?,?,?,?)",
    [e, j, user.ma_nguoi_dung, event, note, JSON.stringify(data)],
  );
}
const history = (db, e, j) =>
  rows(
    db,
    `SELECT l.ma_lich_su,l.su_kien,l.ghi_chu,l.ngay_tao,u.ho_va_ten FROM lich_su_bao_tri l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_thuc_hien WHERE l.ma_thiet_bi=? AND ${j ? "l.ma_phieu_bao_tri=?" : "l.ma_phieu_bao_tri IS NULL"} ORDER BY l.ma_lich_su`,
    j ? [e, j] : [e],
  );
function dueState(e, today) {
  if (e.trang_thai === "NGUNG_SU_DUNG") return "NGUNG_THEO_DOI";
  if (!e.ngay_bao_tri_tiep_theo) return "CHUA_CAU_HINH";
  if (e.ngay_bao_tri_tiep_theo < today) return "QUA_HAN";
  return e.ngay_bao_tri_tiep_theo <= v.addDays(today, e.nhac_truoc_ngay)
    ? "SAP_DEN_HAN"
    : "CHUA_DEN_HAN";
}
const equipmentSelect = `SELECT e.*,(SELECT j.ma_phieu_bao_tri FROM phieu_bao_tri j WHERE j.dinh_ky_dang_mo=e.ma_thiet_bi) AS phieu_dinh_ky_dang_mo FROM thiet_bi e`;
export async function equipmentList(query, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    today = v.today(),
    where = ["1=1"],
    values = [];
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ? OR e.vi_tri LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.loai) {
    where.push("e.loai=?");
    values.push(choice(query.loai, "loai", v.types));
  }
  if (query.trang_thai) {
    where.push("e.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.equipmentStates));
  }
  if (query.lich) {
    const filter = choice(query.lich, "lich", [
      "QUA_HAN",
      "SAP_DEN_HAN",
      "CHUA_CAU_HINH",
    ]);
    where.push("e.trang_thai<>'NGUNG_SU_DUNG'");
    if (filter === "CHUA_CAU_HINH") where.push("e.chu_ky_ngay IS NULL");
    else if (filter === "QUA_HAN") {
      where.push("e.ngay_bao_tri_tiep_theo<?");
      values.push(today);
    } else {
      where.push(
        "e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)",
      );
      values.push(today, today);
    }
  }
  const condition = where.join(" AND ");
  const [summary] = await rows(
    pool,
    `SELECT COUNT(*) AS total,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo<?),0) AS UNSIGNED) AS qua_han,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)),0) AS UNSIGNED) AS sap_den_han FROM thiet_bi e WHERE ${condition}`,
    [today, today, today, ...values],
  );
  check(summary.total);
  const data = await rows(
    pool,
    `${equipmentSelect} WHERE ${condition} ORDER BY e.ngay_bao_tri_tiep_theo IS NULL,e.ngay_bao_tri_tiep_theo,e.ma_thiet_bi LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return {
    data: data.map((e) => ({ ...e, tinh_trang_lich: dueState(e, today) })),
    summary,
    total: summary.total,
    page,
    ngay_hien_tai: today,
  };
}
export async function equipmentDetail(id) {
  const [e] = await rows(pool, `${equipmentSelect} WHERE e.ma_thiet_bi=?`, [
    id,
  ]);
  if (!e) notFound();
  return {
    ...e,
    tinh_trang_lich: dueState(e, v.today()),
    history: await history(pool, id, null),
  };
}
export async function createEquipment(body, user, connection = null) {
  const code = v.assetCode(body.ma_tai_san),
    fields = v.equipment(body);
  return transaction(async (db) => {
    await actor(db, user);
    const keys = Object.keys(fields);
    const result = await rows(
      db,
      `INSERT INTO thiet_bi (ma_tai_san,${keys.join(",")},ma_nguoi_tao) VALUES (${Array(
        keys.length + 2,
      )
        .fill("?")
        .join(",")})`,
      [code, ...Object.values(fields), user.ma_nguoi_dung],
    );
    await audit(
      db,
      result.insertId,
      null,
      user,
      "TAO_THIET_BI",
      "Tạo thiết bị và cấu hình lịch bảo trì.",
      { ma_tai_san: code, ...fields },
    );
    return { ma_thiet_bi: result.insertId };
  }, connection);
}
export async function updateEquipment(id, body, user) {
  const fields = v.equipment(body);
  return transaction(async (db) => {
    const old = await lockEquipment(db, id);
    await actor(db, user);
    v.version(old, body.phien_ban);
    if (body.ma_tai_san && v.assetCode(body.ma_tai_san) !== old.ma_tai_san)
      fail(422, "IMMUTABLE_ASSET_CODE", "Mã tài sản được giữ cố định.");
    const planChanged = [
      "chu_ky_ngay",
      "ngay_bao_tri_tiep_theo",
      "nhac_truoc_ngay",
    ].some((k) => fields[k] !== old[k]);
    if (planChanged) {
      const existing = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [id],
      );
      if (existing.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Hoàn thành hoặc hủy phiếu định kỳ đang mở trước khi đổi lịch.",
        );
    }
    if (fields.trang_thai === "NGUNG_SU_DUNG") {
      const active = await rows(
        db,
        `SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE ma_thiet_bi=? AND trang_thai IN ${openSql} LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (active.length)
        fail(
          409,
          "OPEN_MAINTENANCE_JOB",
          "Thiết bị còn phiếu chưa kết thúc. Hãy nghiệm thu hoặc hủy phiếu trước.",
        );
    }
    await rows(
      db,
      `UPDATE thiet_bi SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(
          ",",
        )},phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?`,
      [...Object.values(fields), id],
    );
    await audit(
      db,
      id,
      null,
      user,
      "SUA_THIET_BI",
      "Cập nhật thông tin thiết bị/lịch bảo trì.",
      { truoc: old, sau: fields },
    );
    return { ma_thiet_bi: id };
  });
}
export async function technicians(query) {
  const { page, offset } = pagination(query),
    q = query.q ? `%${text(query.q, "q", 1, 100)}%` : "%";
  const [count] = await rows(
    pool,
    "SELECT COUNT(*) AS total FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ?",
    [q],
  );
  return {
    data: await rows(
      pool,
      `SELECT ma_nguoi_dung,ho_va_ten,chuyen_mon FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ? ORDER BY ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
      [q],
    ),
    total: count.total,
    page,
  };
}
export async function createJob(equipmentId, body, user) {
  const type = choice(body.loai, "loai", ["DINH_KY", "DOT_XUAT"]),
    key = v.requestKey(body.khoa_yeu_cau);
  const data = {
    loai: type,
    ma_ky_thuat_vien: body.ma_ky_thuat_vien
      ? v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien")
      : null,
    do_uu_tien: choice(body.do_uu_tien || "THUONG", "do_uu_tien", [
      "THUONG",
      "CAO",
      "KHAN_CAP",
    ]),
  };
  if (type === "DOT_XUAT")
    Object.assign(data, {
      tieu_de: text(body.tieu_de, "tieu_de", 3, 180),
      noi_dung: text(body.noi_dung, "noi_dung", 3, 2000),
      ngay_den_han: day(body.ngay_den_han, true),
    });
  else
    data.phien_ban_thiet_bi = integer(
      body.phien_ban_thiet_bi,
      "phien_ban_thiet_bi",
    );
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ equipmentId, user: user.ma_nguoi_dung, ...data }))
    .digest("hex");
  return transaction(async (db) => {
    const e = await lockEquipment(db, equipmentId);
    await actor(db, user);
    const [old] = await rows(
      db,
      "SELECT ma_phieu_bao_tri,van_tay FROM phieu_bao_tri WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (old) {
      if (old.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho phiếu khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu_bao_tri: old.ma_phieu_bao_tri, replay: true };
    }
    if (e.trang_thai === "NGUNG_SU_DUNG")
      fail(409, "EQUIPMENT_RETIRED", "Thiết bị đã ngừng sử dụng.");
    if (type === "DINH_KY") {
      v.version(e, data.phien_ban_thiet_bi);
      if (!e.chu_ky_ngay)
        fail(
          409,
          "NO_PLAN",
          "Cấu hình chu kỳ và ngày bảo trì trước khi lập phiếu định kỳ.",
        );
      const active = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [equipmentId],
      );
      if (active.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Đã có phiếu định kỳ đang mở cho thiết bị này.",
        );
      Object.assign(data, {
        tieu_de: `Bảo trì định kỳ: ${e.ten_thiet_bi}`,
        noi_dung:
          "Thực hiện bảo trì định kỳ theo hướng dẫn kỹ thuật của thiết bị và ghi rõ kết quả.",
        ngay_den_han: e.ngay_bao_tri_tiep_theo,
      });
    }
    const assignee = data.ma_ky_thuat_vien
      ? await staff(db, data.ma_ky_thuat_vien)
      : null;
    const result = await rows(
      db,
      "INSERT INTO phieu_bao_tri (ma_thiet_bi,loai,tieu_de,noi_dung,ten_thiet_bi_luc_lap,vi_tri_luc_lap,ngay_lap,ngay_den_han,chu_ky_ngay,do_uu_tien,trang_thai,ma_ky_thuat_vien,ma_nguoi_lap,ket_qua,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'',?,?)",
      [
        equipmentId,
        type,
        data.tieu_de,
        data.noi_dung,
        e.ten_thiet_bi,
        e.vi_tri,
        v.today(),
        data.ngay_den_han,
        type === "DINH_KY" ? e.chu_ky_ngay : null,
        data.do_uu_tien,
        assignee ? "DA_PHAN_CONG" : "MOI",
        data.ma_ky_thuat_vien,
        user.ma_nguoi_dung,
        key,
        fingerprint,
      ],
    );
    await audit(
      db,
      equipmentId,
      result.insertId,
      user,
      "LAP_PHIEU",
      `Lập phiếu bảo trì${assignee ? ` và giao ${assignee.ho_va_ten}` : " chưa phân công"}.`,
      { ...data, chu_ky_ngay: type === "DINH_KY" ? e.chu_ky_ngay : null },
    );
    return { ma_phieu_bao_tri: result.insertId, replay: false };
  });
}
const jobFrom =
  "FROM phieu_bao_tri j JOIN thiet_bi e ON e.ma_thiet_bi=j.ma_thiet_bi LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=j.ma_ky_thuat_vien";
const jobFields =
  "j.ma_phieu_bao_tri,j.ma_thiet_bi,j.loai,j.tieu_de,j.ngay_den_han,j.trang_thai,j.ma_ky_thuat_vien,j.phien_ban,j.do_uu_tien,j.ten_thiet_bi_luc_lap,j.vi_tri_luc_lap,e.ma_tai_san,u.ho_va_ten AS ky_thuat_vien";
function scope(user, where, values) {
  if (!admin(user)) {
    where.push(
      "j.ma_ky_thuat_vien=? AND EXISTS (SELECT 1 FROM nguoi_dung actor WHERE actor.ma_nguoi_dung=? AND actor.dang_hoat_dong=1 AND actor.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.ma_nguoi_dung, user.phien_ban_token);
  }
}
export async function jobs(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    where = ["1=1"],
    values = [],
    today = v.today();
  scope(user, where, values);
  if (query.ma_thiet_bi) {
    where.push("j.ma_thiet_bi=?");
    values.push(v.positive(query.ma_thiet_bi, "ma_thiet_bi"));
  }
  if (query.trang_thai) {
    where.push("j.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.jobStates));
  }
  if (query.loai) {
    where.push("j.loai=?");
    values.push(choice(query.loai, "loai", ["DINH_KY", "DOT_XUAT"]));
  }
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(j.tieu_de LIKE ? OR e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.qua_han) {
    choice(query.qua_han, "qua_han", ["0", "1"]);
    if (query.qua_han === "1") {
      where.push(`j.trang_thai IN ${openSql} AND j.ngay_den_han<?`);
      values.push(today);
    }
  }
  const condition = where.join(" AND ");
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${jobFrom} WHERE ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT ${jobFields},(j.trang_thai IN ${openSql} AND j.ngay_den_han<?) AS qua_han ${jobFrom} WHERE ${condition} ORDER BY (j.trang_thai IN ${openSql}) DESC,j.ngay_den_han,j.ma_phieu_bao_tri DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    [today, ...values],
  );
  check(data.length);
  return { data, total: count.total, page, ngay_hien_tai: today };
}
export async function jobDetail(id, user) {
  const where = ["j.ma_phieu_bao_tri=?"],
    values = [id];
  scope(user, where, values);
  const [j] = await rows(
    pool,
    `SELECT ${jobFields},j.noi_dung,j.ngay_lap,j.chu_ky_ngay,j.luot_thuc_hien,j.ngay_thuc_hien,j.ket_qua,j.nhan_xet_nghiem_thu,j.ly_do_huy,j.ngay_tao,j.ngay_bat_dau,j.ngay_bao_cao,j.ngay_nghiem_thu,e.ten_thiet_bi AS ten_hien_tai,e.vi_tri AS vi_tri_hien_tai,e.trang_thai AS trang_thai_thiet_bi ${jobFrom} WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!j) notFound();
  return {
    ...j,
    qua_han: v.openStates.includes(j.trang_thai) && j.ngay_den_han < v.today(),
    history: await history(pool, j.ma_thiet_bi, id),
  };
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const [hint] = await rows(
      db,
      "SELECT ma_thiet_bi FROM phieu_bao_tri WHERE ma_phieu_bao_tri=?",
      [id],
    );
    if (!hint) notFound();
    const e = await lockEquipment(db, hint.ma_thiet_bi),
      [j] = await rows(
        db,
        "SELECT * FROM phieu_bao_tri WHERE ma_phieu_bao_tri=? FOR UPDATE",
        [id],
      );
    await actor(db, user);
    if (!admin(user) && j.ma_ky_thuat_vien !== user.ma_nguoi_dung) notFound();
    if (!admin(user) && !["bat_dau", "bao_cao"].includes(action))
      fail(403, "FORBIDDEN", "Chỉ BQL được thực hiện thao tác này.");
    if (admin(user) && ["bat_dau", "bao_cao"].includes(action))
      fail(
        403,
        "FORBIDDEN",
        "Kỹ thuật viên được giao phiếu thực hiện và ghi kết quả.",
      );
    v.version(j, body.phien_ban);
    const requireState = (allowed) => {
      if (!allowed.includes(j.trang_thai))
        fail(
          409,
          "INVALID_STATE",
          "Phiếu không ở trạng thái cho phép thực hiện thao tác này.",
        );
    };
    let fields = {},
      note = "";
    if (action === "phan_cong") {
      requireState(["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"]);
      const target = await staff(
        db,
        v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien"),
      );
      if (target.ma_nguoi_dung === j.ma_ky_thuat_vien)
        fail(
          409,
          "SAME_TECHNICIAN",
          "Phiếu đã được giao cho kỹ thuật viên này.",
        );
      const reason = text(
        body.ghi_chu || "",
        "ghi_chu",
        j.ma_ky_thuat_vien ? 3 : 0,
        500,
      );
      fields = {
        ma_ky_thuat_vien: target.ma_nguoi_dung,
        trang_thai: "DA_PHAN_CONG",
        ngay_bat_dau: null,
      };
      note = `Giao phiếu cho ${target.ho_va_ten}.${reason ? ` ${reason}` : ""}`;
    } else if (action === "doi_lich") {
      requireState(["MOI", "DA_PHAN_CONG"]);
      const due = day(body.ngay_den_han, true);
      note = text(body.ly_do, "ly_do", 3, 500);
      fields = { ngay_den_han: due };
      if (j.loai === "DINH_KY")
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [due, e.ma_thiet_bi],
        );
      note = `Đổi hạn từ ${j.ngay_den_han} sang ${due}. ${note}`;
    } else if (action === "bat_dau") {
      requireState(["DA_PHAN_CONG"]);
      fields = { trang_thai: "DANG_THUC_HIEN" };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bat_dau=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = "Kỹ thuật viên bắt đầu thực hiện.";
    } else if (action === "bao_cao") {
      requireState(["DANG_THUC_HIEN"]);
      const date = day(body.ngay_thuc_hien);
      if (date < j.ngay_lap)
        fail(
          422,
          "INVALID_WORK_DATE",
          "Ngày thực hiện không được trước ngày lập phiếu.",
        );
      fields = {
        trang_thai: "CHO_NGHIEM_THU",
        ngay_thuc_hien: date,
        ket_qua: v.recordText(body.ket_qua, "ket_qua", 10, 4000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bao_cao=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Báo cáo lượt ${j.luot_thuc_hien}, thực hiện ngày ${date}:\n${fields.ket_qua}`;
    } else if (action === "tra_lai") {
      requireState(["CHO_NGHIEM_THU"]);
      note = text(body.ly_do, "ly_do", 3, 1000);
      fields = {
        trang_thai: "DANG_THUC_HIEN",
        ket_qua: "",
        ngay_thuc_hien: null,
        luot_thuc_hien: j.luot_thuc_hien + 1,
      };
      note = `Trả lại thực hiện: ${note}`;
    } else if (action === "nghiem_thu") {
      requireState(["CHO_NGHIEM_THU"]);
      fields = {
        trang_thai: "HOAN_THANH",
        ma_nguoi_nghiem_thu: user.ma_nguoi_dung,
        nhan_xet_nghiem_thu: text(body.nhan_xet, "nhan_xet", 3, 1000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_nghiem_thu=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Nghiệm thu đạt. ${fields.nhan_xet_nghiem_thu}`;
      if (j.loai === "DINH_KY") {
        const next = v.addDays(j.ngay_thuc_hien, j.chu_ky_ngay);
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [next, e.ma_thiet_bi],
        );
        note += ` Ngày bảo trì kế tiếp: ${next}.`;
      }
    } else if (action === "huy") {
      requireState(v.openStates);
      fields = {
        trang_thai: "HUY",
        ma_nguoi_huy: user.ma_nguoi_dung,
        ly_do_huy: v.recordText(body.ly_do, "ly_do", 3, 500),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_huy=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Hủy phiếu: ${fields.ly_do_huy}`;
    }
    await rows(
      db,
      `UPDATE phieu_bao_tri SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(",")},phien_ban=phien_ban+1 WHERE ma_phieu_bao_tri=?`,
      [...Object.values(fields), id],
    );
    await audit(db, e.ma_thiet_bi, id, user, action.toUpperCase(), note, {
      truoc: {
        trang_thai: j.trang_thai,
        ma_ky_thuat_vien: j.ma_ky_thuat_vien,
        ngay_den_han: j.ngay_den_han,
        luot_thuc_hien: j.luot_thuc_hien,
      },
      sau: fields,
    });
    return { ma_phieu_bao_tri: id };
  });
}
```

### 9. `backend/src/modules/amenities/amenities.service.js` — Thay toàn bộ

```js
import { reportPage } from "../report-exports/report-files.js";
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as v from "./amenities.validation.js";
const active = "('CHO_DUYET','DA_DUYET')";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy lịch đặt hoặc tiện ích.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
  return u;
}
const contextFrom = `FROM nguoi_dung u
 JOIN cu_dan c ON (u.ma_can_ho_thanh_toan IS NULL AND c.ma_nguoi_dung=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan IS NOT NULL AND c.ma_cu_dan=u.ma_cu_dan_phu_trach)
 JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL
 JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho
 WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=?
 AND (u.ma_can_ho_thanh_toan IS NULL OR (u.ma_can_ho_thanh_toan=a.ma_can_ho AND l.quan_he='CHU_HO'))`;
export async function context(user) {
  const [c] = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,l.ma_lich_su_cu_tru,a.ma_can_ho,a.so_can_ho,a.khoi ${contextFrom}`,
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  return c || null;
}
// Same order as residency/handover: resident -> apartment -> amenity -> booking -> account.
// A resident row freezes the current stay while residency writes wait on that row.
async function lockContext(db, user) {
  const [hint] = await rows(db, `SELECT c.ma_cu_dan ${contextFrom}`, [
    user.ma_nguoi_dung,
    user.phien_ban_token,
  ]);
  if (!hint)
    fail(
      403,
      "NO_RESIDENCE",
      "Cần hồ sơ cư trú hiện tại; tài khoản căn hộ cần chủ hộ đang phụ trách. Liên hệ BQL để liên kết.",
    );
  const [c] = await rows(
    db,
    "SELECT * FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [hint.ma_cu_dan],
  );
  const [l] = await rows(
    db,
    "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
    [hint.ma_cu_dan],
  );
  if (!l)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Thông tin cư trú đã thay đổi. Hãy tải lại trang.",
    );
  const [a] = await rows(
    db,
    "SELECT ma_can_ho,so_can_ho FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
    [l.ma_can_ho],
  );
  return { ...c, ...l, so_can_ho: a.so_can_ho };
}
function confirmContext(c, u) {
  const valid = u.ma_can_ho_thanh_toan
    ? u.ma_can_ho_thanh_toan === c.ma_can_ho &&
      u.ma_cu_dan_phu_trach === c.ma_cu_dan &&
      c.quan_he === "CHU_HO"
    : c.ma_nguoi_dung === u.ma_nguoi_dung;
  if (!valid)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Người phụ trách hoặc hồ sơ cư trú đã đổi. Hãy đăng nhập lại.",
    );
}
async function lockedFacility(db, id) {
  const [f] = await rows(
    db,
    "SELECT * FROM tien_ich WHERE ma_tien_ich=? FOR UPDATE",
    [id],
  );
  if (!f) missing();
  return f;
}
const fields =
  "ten_tien_ich,vi_tri,mo_ta,suc_chua,gio_mo,gio_dong,toi_da_phut,dat_truoc_ngay,dang_mo";
export async function facilities(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = ["1=1"];
  if (query.q) {
    where.push("(ten_tien_ich LIKE ? OR vi_tri LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  if (query.dang_mo) {
    if (!["0", "1"].includes(query.dang_mo))
      fail(422, "VALIDATION", "Trạng thái không hợp lệ.");
    where.push("dang_mo=?");
    args.push(Number(query.dang_mo));
  }
  const clause = where.join(" AND ");
  const [n] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM tien_ich WHERE ${clause}`,
    args,
  );
  const data = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ${clause} ORDER BY dang_mo DESC,ma_tien_ich DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: n.total, page };
}
export async function facilityDetail(id) {
  const [f] = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ma_tien_ich=?`,
    [id],
  );
  if (!f) missing();
  return f;
}
export async function saveFacility(id, body, user) {
  const data = v.facility(body);
  return transaction(async (db) => {
    if (id) {
      const old = await lockedFacility(db, id);
      await actor(db, user);
      v.version(old, body.phien_ban);
      // Pausing stops new reservations; existing reservations remain valid.
      // Policy edits may not invalidate any live future reservation, including pending ones.
      const conflicts = await rows(
        db,
        `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND ket_thuc>? AND (so_nguoi>? OR TIME(bat_dau)<? OR TIME(ket_thuc)>? OR TIMESTAMPDIFF(MINUTE,bat_dau,ket_thuc)>?) LIMIT 1 FOR UPDATE`,
        [
          id,
          v.nowVN(),
          data.suc_chua,
          data.gio_mo,
          data.gio_dong,
          data.toi_da_phut,
        ],
      );
      if (conflicts.length)
        fail(
          409,
          "EXISTING_BOOKINGS",
          "Cấu hình mới ảnh hưởng lịch đang giữ chỗ. Xử lý các lịch đó trước khi đổi.",
        );
      await rows(
        db,
        `UPDATE tien_ich SET ${Object.keys(data)
          .map((k) => `${k}=?`)
          .join(",")},phien_ban=phien_ban+1 WHERE ma_tien_ich=?`,
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        `INSERT INTO tien_ich (${fields},ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [...Object.values(data), user.ma_nguoi_dung],
      );
      id = r.insertId;
    }
    return { ma_tien_ich: id };
  });
}
export async function calendar(id, query) {
  const f = await facilityDetail(id),
    day = v.calendarDay(query.ngay),
    now = v.nowVN();
  if (day < now.slice(0, 10) || day > v.addDays(now.slice(0, 10), 90))
    fail(
      422,
      "CALENDAR_RANGE",
      "Lịch trống chỉ tra cứu từ hôm nay đến 90 ngày tới.",
    );
  const busy = await rows(
    pool,
    `SELECT bat_dau,ket_thuc FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau>=? AND bat_dau<? ORDER BY bat_dau`,
    [id, `${day} 00:00:00`, `${v.addDays(day, 1)} 00:00:00`],
  );
  const slots = [];
  const label = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  for (let m = v.minutes(f.gio_mo); m < v.minutes(f.gio_dong); m += 30) {
    const start = `${day} ${label(m)}:00`,
      end = `${day} ${label(m + 30)}:00`;
    slots.push({
      gio_bat_dau: label(m),
      gio_ket_thuc: label(m + 30),
      da_dat: busy.some((b) => b.bat_dau < end && b.ket_thuc > start),
      co_the_dat:
        !!f.dang_mo &&
        start > now &&
        day <= v.addDays(now.slice(0, 10), f.dat_truoc_ngay),
    });
  }
  // Aggregate occupancy only: no other apartment, applicant, notes or booking identifiers.
  return { ngay: day, slots };
}
export async function createBooking(id, body, user) {
  const data = v.booking(body),
    key = v.key(body.khoa_yeu_cau),
    policyVersion = integer(body.phien_ban_tien_ich, "phien_ban_tien_ich");
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({ id, user: user.ma_nguoi_dung, policyVersion, ...data }),
    )
    .digest("hex");
  return transaction(async (db) => {
    const c = await lockContext(db, user),
      f = await lockedFacility(db, id),
      u = await actor(db, user);
    confirmContext(c, u);
    const [prior] = await rows(
      db,
      "SELECT ma_dat_lich,van_tay FROM dat_lich_tien_ich WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã được dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_dat_lich: prior.ma_dat_lich, replay: true };
    }
    v.version(f, policyVersion);
    v.checkBooking(f, data);
    // Parent-row mutex serializes every create/decision/cancel/policy edit for this amenity.
    // Locking reads see committed writes after a waiter acquires that mutex.
    const clash = await rows(
      db,
      `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau<? AND ket_thuc>? LIMIT 1 FOR UPDATE`,
      [id, data.ket_thuc, data.bat_dau],
    );
    if (clash.length)
      fail(
        409,
        "BOOKING_CONFLICT",
        "Khung giờ này đã có người giữ chỗ. Hãy tải lại lịch trống và chọn giờ khác.",
      );
    const r = await rows(
      db,
      `INSERT INTO dat_lich_tien_ich (ma_tien_ich,ma_can_ho,ma_nguoi_dat,ma_cu_dan,ma_lich_su_cu_tru,ten_tien_ich,vi_tri,ten_nguoi_dat,bat_dau,ket_thuc,so_nguoi,ghi_chu,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        c.ma_can_ho,
        u.ma_nguoi_dung,
        c.ma_cu_dan,
        c.ma_lich_su_cu_tru,
        f.ten_tien_ich,
        f.vi_tri,
        c.ho_va_ten,
        ...Object.values(data),
        key,
        fingerprint,
      ],
    );
    await audit(db, r.insertId, user, "DAT_LICH", data.ghi_chu);
    return { ma_dat_lich: r.insertId, replay: false };
  });
}
async function audit(db, id, user, event, note) {
  await rows(
    db,
    "INSERT INTO lich_su_dat_lich (ma_dat_lich,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// Personal accounts retain read access to their own history after moving. Fixed accounts
// read apartment history only while their custodian is a current householder there.
function scope(user, args) {
  args.push(user.ma_nguoi_dung, user.phien_ban_token);
  return `EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=? AND ((u.ma_can_ho_thanh_toan IS NULL AND b.ma_nguoi_dat=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan=b.ma_can_ho AND EXISTS (SELECT 1 FROM lich_su_cu_tru l WHERE l.ma_cu_dan=u.ma_cu_dan_phu_trach AND l.ma_can_ho=b.ma_can_ho AND l.den_ngay IS NULL AND l.quan_he='CHU_HO'))))`;
}
const selection = `b.ma_dat_lich,b.ma_tien_ich,b.ma_can_ho,b.ma_nguoi_dat,b.ten_tien_ich,b.vi_tri,b.ten_nguoi_dat,b.bat_dau,b.ket_thuc,b.so_nguoi,b.ghi_chu,b.trang_thai,b.phien_ban,b.ngay_tao,a.so_can_ho,a.khoi`;
export async function bookings(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    args = [],
    where = ["1=1"];
  if (user.vai_tro !== "QUAN_TRI_VIEN") where.push(scope(user, args));
  if (query.ma_tien_ich) {
    where.push("b.ma_tien_ich=?");
    args.push(v.positive(query.ma_tien_ich, "ma_tien_ich"));
  }
  if (query.trang_thai) {
    where.push("b.trang_thai=?");
    args.push(v.state(query.trang_thai));
  }
  if (query.ngay) {
    where.push("b.bat_dau>=? AND b.bat_dau<?");
    const d = v.calendarDay(query.ngay);
    args.push(`${d} 00:00:00`, `${v.addDays(d, 1)} 00:00:00`);
  }
  if (query.q) {
    where.push(
      "(a.so_can_ho LIKE ? OR b.ten_tien_ich LIKE ? OR b.ten_nguoi_dat LIKE ?)",
    );
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q, q);
  }
  const from = `FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE ${where.join(" AND ")}`;
  const [n] = await rows(pool, `SELECT COUNT(*) AS total ${from}`, args);
  check(n.total);
  const data = await rows(
    pool,
    `SELECT ${selection} ${from} ORDER BY b.bat_dau DESC,b.ma_dat_lich DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    args,
  );
  check(data.length);
  return { data, total: n.total, page };
}
export async function bookingDetail(id, user) {
  const args = [id],
    own = user.vai_tro !== "QUAN_TRI_VIEN" ? ` AND ${scope(user, args)}` : "";
  const [b] = await rows(
    pool,
    `SELECT ${selection} FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE b.ma_dat_lich=?${own}`,
    args,
  );
  if (!b) missing();
  b.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_dat_lich h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_dat_lich=? ORDER BY h.ma_lich_su",
    [id],
  );
  const c = user.vai_tro === "CU_DAN" ? await context(user) : null;
  b.co_the_huy =
    activeState(b) &&
    b.bat_dau > v.nowVN() &&
    (user.vai_tro === "QUAN_TRI_VIEN" ||
      !!(
        c &&
        c.ma_can_ho === b.ma_can_ho &&
        (user.ma_can_ho_thanh_toan ||
          (b.ma_nguoi_dat === user.ma_nguoi_dung &&
            (
              await rows(
                pool,
                "SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_dat_lich=? AND ma_lich_su_cu_tru=?",
                [id, c.ma_lich_su_cu_tru],
              )
            ).length))
      ));
  return b;
}
function activeState(b) {
  return ["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai);
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const c = user.vai_tro === "CU_DAN" ? await lockContext(db, user) : null;
    const [hint] = await rows(
      db,
      "SELECT ma_tien_ich FROM dat_lich_tien_ich WHERE ma_dat_lich=?",
      [id],
    );
    if (!hint) missing();
    await lockedFacility(db, hint.ma_tien_ich);
    const [b] = await rows(
      db,
      "SELECT * FROM dat_lich_tien_ich WHERE ma_dat_lich=? FOR UPDATE",
      [id],
    );
    if (!b) missing();
    const u = await actor(db, user);
    if (c) {
      confirmContext(c, u);
      if (
        action !== "huy" ||
        c.ma_can_ho !== b.ma_can_ho ||
        (!u.ma_can_ho_thanh_toan &&
          (b.ma_nguoi_dat !== u.ma_nguoi_dung ||
            b.ma_lich_su_cu_tru !== c.ma_lich_su_cu_tru))
      )
        missing();
    }
    v.version(b, body.phien_ban);
    if (b.bat_dau <= v.nowVN())
      fail(
        409,
        "BOOKING_STARTED",
        "Lịch đã tới giờ bắt đầu; không thể duyệt, từ chối hoặc hủy nữa.",
      );
    if (!activeState(b) || (action !== "huy" && b.trang_thai !== "CHO_DUYET"))
      fail(
        409,
        "INVALID_STATE",
        "Lịch không còn ở trạng thái cho phép thao tác này.",
      );
    const note = text(
      body.ghi_chu || "",
      "ghi_chu",
      action === "duyet" ? 0 : 5,
      1000,
    );
    const state = { duyet: "DA_DUYET", tu_choi: "TU_CHOI", huy: "DA_HUY" }[
      action
    ];
    if (!state) fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    await rows(
      db,
      "UPDATE dat_lich_tien_ich SET trang_thai=?,phien_ban=phien_ban+1 WHERE ma_dat_lich=?",
      [state, id],
    );
    await audit(db, id, user, action.toUpperCase(), note);
    return { ma_dat_lich: id };
  });
}
```

### 10. `backend/src/modules/data-exchange/catalog.js` — Tạo mới

```js
// Public column allowlists: never export account secrets, tokens or internal audit JSON.
const field = (key, label, example, hint = "") => ({
  key,
  label,
  example,
  hint,
});
export const catalog = {
  can_ho: {
    title: "Căn hộ",
    path: "/quan-tri/can-ho",
    importable: true,
    note: "Thêm căn mới và tài khoản căn hộ. Không thay đổi căn đã có. Mật khẩu mới chỉ hiện một lần sau khi lưu.",
    fields: [
      field("so_can_ho", "Số căn hộ", "A101"),
      field("khoi", "Khối", "A"),
      field("tang", "Tầng", "1"),
      field(
        "dien_tich_m2",
        "Diện tích (m²)",
        "75.5",
        "Dùng dấu chấm cho phần thập phân.",
      ),
      field("tinh_phi_dich_vu", "Tính phí dịch vụ", "1", "1 = có, 0 = không."),
    ],
  },
  cu_dan: {
    title: "Cư dân",
    path: "/quan-tri/cu-dan",
    importable: true,
    note: "Thêm hồ sơ và đợt cư trú đầu tiên. Số điện thoại đã có hồ sơ sẽ báo trùng. Không tự bàn giao tài khoản của chủ hộ đang có.",
    fields: [
      field("ho_va_ten", "Họ và tên", "Nguyễn Văn An"),
      field(
        "so_dien_thoai",
        "Số điện thoại",
        "0901234567",
        "Giữ số 0 đầu, lưu ô Excel dạng văn bản.",
      ),
      field("so_can_ho", "Số căn hộ", "A101"),
      field(
        "quan_he",
        "Quan hệ với căn hộ",
        "THANH_VIEN",
        "CHU_HO / THANH_VIEN / NGUOI_THUE.",
      ),
      field(
        "ngay",
        "Ngày bắt đầu cư trú",
        "2026-10-01",
        "YYYY-MM-DD, không sau hôm nay.",
      ),
    ],
  },
  phuong_tien: {
    title: "Phương tiện",
    path: "/quan-tri/phuong-tien",
    importable: true,
    note: "Đăng ký xe cho cư dân đang ở căn đã chọn. Thời gian đã chốt hóa đơn và biển số trùng vẫn được kiểm tra.",
    fields: [
      field(
        "ma_cu_dan",
        "Mã cư dân",
        "1",
        "Lấy mã từ danh sách cư dân xuất Excel.",
      ),
      field("so_can_ho", "Số căn hộ chịu phí", "A101"),
      field("loai_xe", "Loại xe", "XE_MAY", "O_TO / XE_MAY / XE_DAP."),
      field("bien_so", "Biển số", "59A12345", "Có thể trống với xe đạp."),
      field("hang_xe", "Hãng xe", "Honda"),
      field("mau_sac", "Màu sắc", "Trắng"),
      field(
        "ngay_dang_ky",
        "Ngày đăng ký",
        "2026-10-01",
        "YYYY-MM-DD, không sau hôm nay.",
      ),
    ],
  },
  chi_so: {
    title: "Chỉ số điện nước",
    path: "/quan-tri/chi-so",
    importable: true,
    note: "Thêm chỉ số kỳ chưa có, theo thứ tự kỳ tăng dần. Không ghi đè chỉ số cũ. Kỳ đầu cần ky_dau = 1.",
    fields: [
      field("so_can_ho", "Số căn hộ", "A101"),
      field("loai_dich_vu", "Dịch vụ", "NUOC", "DIEN / NUOC."),
      field("ky_thanh_toan", "Kỳ", "2026-10", "YYYY-MM."),
      field(
        "chi_so_cu",
        "Chỉ số cũ",
        "100",
        "Tối đa 3 số lẻ, dấu chấm thập phân.",
      ),
      field("chi_so_moi", "Chỉ số mới", "105.5"),
      field(
        "ngay_chot",
        "Ngày chốt",
        "2026-10-01",
        "YYYY-MM-DD, thuộc kỳ đã chọn.",
      ),
      field("ky_dau", "Xác nhận kỳ đầu", "1", "1 = kỳ đầu, 0 = kỳ tiếp theo."),
      field("ghi_chu", "Ghi chú", ""),
    ],
  },
  thiet_bi: {
    title: "Thiết bị",
    path: "/quan-tri/thiet-bi",
    importable: true,
    note: "Thêm thiết bị và lịch bảo trì. Không nhập phiếu nghiệm thu hoặc sửa thiết bị đã có.",
    fields: [
      field(
        "ma_tai_san",
        "Mã tài sản",
        "BOM-A01",
        "Mã duy nhất: chữ không dấu, số, - hoặc _.",
      ),
      field("ten_thiet_bi", "Tên thiết bị", "Máy bơm A"),
      field(
        "loai",
        "Loại thiết bị",
        "MAY_BOM",
        "THANG_MAY / MAY_BOM / PCCC / DIEN / NUOC / CAMERA / KHAC.",
      ),
      field("vi_tri", "Vị trí", "Tầng hầm A"),
      field("so_serial", "Số serial", "SN001"),
      field("ngay_lap_dat", "Ngày lắp đặt", "", "YYYY-MM-DD hoặc để trống."),
      field(
        "trang_thai",
        "Trạng thái",
        "DANG_SU_DUNG",
        "DANG_SU_DUNG / TAM_DUNG / NGUNG_SU_DUNG.",
      ),
      field(
        "chu_ky_ngay",
        "Chu kỳ (ngày)",
        "",
        "Để trống cả chu kỳ và ngày kế tiếp nếu chưa cấu hình.",
      ),
      field(
        "ngay_bao_tri_tiep_theo",
        "Ngày bảo trì kế tiếp",
        "",
        "YYYY-MM-DD.",
      ),
      field("nhac_truoc_ngay", "Nhắc trước (ngày)", "7", "0–90."),
      field("ghi_chu", "Ghi chú", ""),
    ],
  },
  hoa_don: { title: "Hóa đơn", path: "/quan-tri/hoa-don" },
  bao_tri: { title: "Phiếu bảo trì", path: "/quan-tri/bao-tri" },
  dat_lich: { title: "Lượt đặt tiện ích", path: "/quan-tri/dat-lich" },
};
export function publicCatalog() {
  return Object.entries(catalog).map(([key, value]) => ({ key, ...value }));
}
```

### 11. `backend/src/modules/data-exchange/import-parser.worker.js` — Tạo mới

```js
import { parentPort, workerData } from "node:worker_threads";
import { catalog } from "./catalog.js";

function invalid(message) {
  throw new Error(message);
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
async function excel(buffer, fields) {
  await zipCheck(buffer);
  const { default: ExcelJS } = await import("exceljs"),
    wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.getWorksheet("Nhap") || wb.worksheets[0];
  if (
    !sheet ||
    wb.worksheets.length > 3 ||
    sheet.rowCount > 1001 ||
    sheet.columnCount !== fields.length
  )
    invalid("Dùng sheet Nhap với đúng cột trong mẫu, tối đa 100 dòng dữ liệu.");
  const headers = fields.map((_, i) =>
    scalar(sheet.getRow(1).getCell(i + 1).value),
  );
  if (
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
async function pdf(buffer, kind, fields) {
  const { PDFDocument, PDFTextField } = await import("pdf-lib");
  const doc = await PDFDocument.load(buffer);
  if (doc.getPageCount() > 10) invalid("PDF biểu mẫu tối đa 10 trang.");
  const form = doc.getForm();
  if (form.getTextField("cc_import").getText() !== `CC-IMPORT/1:${kind}`)
    invalid("PDF không đúng mẫu của phần đang nhập.");
  const allowed = new Set(fields.map((f) => f.key)),
    records = new Map();
  if (form.getFields().length > 120)
    invalid("PDF có quá nhiều trường dữ liệu.");
  for (const field of form.getFields()) {
    if (field.getName() === "cc_import") continue;
    const match = /^r([1-9]|10)\.([a-z_0-9]+)$/.exec(field.getName());
    if (!match || !allowed.has(match[2]) || !(field instanceof PDFTextField))
      invalid("PDF chứa trường khác mẫu. Tải lại mẫu PDF biểu mẫu.");
    const n = Number(match[1]);
    if (!records.has(n)) records.set(n, { line: n, values: {} });
    records.get(n).values[match[2]] = scalar(field.getText());
  }
  return [...records.values()]
    .filter((r) => Object.values(r.values).some((v) => v !== ""))
    .sort((a, b) => a.line - b.line);
}
try {
  const { kind, extension, bytes } = workerData,
    buffer = Buffer.from(bytes),
    fields = catalog[kind].fields;
  const records = await (extension === "xlsx"
    ? excel(buffer, fields)
    : pdf(buffer, kind, fields));
  if (!records.length || records.length > 100)
    invalid(
      "Tệp cần có từ 1 đến 100 dòng không trống (PDF tối đa 10 trang). Không có dòng nào được cắt bớt.",
    );
  parentPort.postMessage({ records });
} catch (error) {
  parentPort.postMessage({
    error: /PDF|pdf|encrypt|field|Expected/.test(error.message)
      ? "PDF cần là biểu mẫu tải từ hệ thống, được điền và Lưu (Save). PDF scan, bản in hoặc PDF đã làm phẳng không còn ô điền để nhập."
      : error.message.startsWith("Tệp") ||
          /Dùng sheet|Tên cột|Tệp cần|Excel quá/.test(error.message)
        ? error.message
        : "Không đọc được tệp. Dùng tệp mẫu Excel hoặc PDF biểu mẫu, không đặt mật khẩu bảo vệ tệp.",
  });
}
```

### 12. `backend/src/modules/data-exchange/import-files.js` — Tạo mới

```js
import { Worker } from "node:worker_threads";
import { extname } from "node:path";
import { fail, integer } from "../../lib/http.js";
import { catalog } from "./catalog.js";

export async function parseFile(file, kind) {
  if (!file) fail(422, "FILE_REQUIRED", "Chọn tệp Excel hoặc PDF biểu mẫu.");
  const extension = extname(file.originalname).slice(1).toLowerCase();
  if (
    !["xlsx", "pdf"].includes(extension) ||
    (extension === "pdf"
      ? file.buffer.subarray(0, 5).toString() !== "%PDF-"
      : file.buffer.subarray(0, 2).toString() !== "PK")
  )
    fail(
      422,
      "INVALID_FILE",
      "Chỉ nhận .xlsx hoặc PDF biểu mẫu đúng định dạng. Không nhận .xls, macro hay ảnh scan.",
    );
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
            code: "INVALID_FILE",
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
export async function template(kind, format, query) {
  const config = catalog[kind];
  if (format === "xlsx") {
    const { default: ExcelJS } = await import("exceljs"),
      wb = new ExcelJS.Workbook(),
      sheet = wb.addWorksheet("Nhap");
    sheet.columns = config.fields.map((f) => ({
      header: f.key,
      key: f.key,
      width: 25,
      style: { numFmt: "@" },
    }));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF14635A" },
    };
    const guide = wb.addWorksheet("Huong dan");
    guide.columns = [
      { width: 28 },
      { width: 28 },
      { width: 28 },
      { width: 85 },
    ];
    guide.addRow([`Mẫu nhập ${config.title}`]);
    guide.addRow([config.note]);
    guide.addRow([
      "Điền sheet Nhap từ dòng 2. Không đổi tên cột. Các dòng ví dụ dưới đây không được nhập tự động.",
    ]);
    guide.addRow(["Tên cột", "Ý nghĩa", "Ví dụ", "Hướng dẫn"]);
    config.fields.forEach((f) =>
      guide.addRow([f.key, f.label, f.example, f.hint]),
    );
    guide.eachRow((r) => {
      r.alignment = { wrapText: true, vertical: "top" };
      r.height = 36;
    });
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
  const count = integer(query.so_dong || 3, "so_dong");
  if (count < 1 || count > 10)
    fail(
      422,
      "INVALID_COUNT",
      "Mẫu PDF từ 1 đến 10 trang, mỗi trang một hồ sơ.",
    );
  const [{ PDFDocument, rgb }, { default: fontkit }, { default: vfs }] =
    await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
      import("pdfmake/build/vfs_fonts.js"),
    ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
      Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
    ),
    form = doc.getForm();
  const meta = form.createTextField("cc_import");
  meta.setText(`CC-IMPORT/1:${kind}`);
  meta.enableReadOnly();
  for (let n = 1; n <= count; n++) {
    const page = doc.addPage([595.28, 841.89]);
    const draw = (s, x, y, size = 10) =>
      page.drawText(s, { x, y, font, size, color: rgb(0.08, 0.3, 0.28) });
    draw(`MẪU NHẬP · ${config.title.toUpperCase()} · Hồ sơ ${n}`, 32, 805, 15);
    draw(
      "Điền các ô, chọn Lưu/Save. Không dùng In/Print to PDF (sẽ mất ô điền).",
      32,
      783,
      9,
    );
    draw(
      "Ngày: YYYY-MM-DD · Số thập phân dùng dấu chấm · Có/không: 1/0.",
      32,
      767,
      9,
    );
    const step = Math.min(72, 650 / config.fields.length);
    config.fields.forEach((f, i) => {
      const y = 735 - i * step;
      draw(`${i + 1}. ${f.label} (${f.key})`, 32, y, 10);
      const input = form.createTextField(`r${n}.${f.key}`);
      input.setMaxLength(1000);
      input.addToPage(page, {
        x: 32,
        y: y - 29,
        width: 530,
        height: 23,
        font,
        fontSize: 10,
        borderWidth: 0.5,
        borderColor: rgb(0.5, 0.65, 0.62),
      });
      const hint =
        f.hint || (f.example ? `Ví dụ: ${f.example}` : "Có thể để trống.");
      draw(hint, 32, y - 42, hint.length > 90 ? 7 : 8);
    });
    draw(
      "Trang trống được bỏ qua. Kiểm tra bản xem trước trên web trước khi lưu.",
      32,
      30,
      9,
    );
  }
  form.updateFieldAppearances(font);
  return Buffer.from(await doc.save());
}
```

### 13. `backend/src/modules/data-exchange/import.service.js` — Tạo mới

```js
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { pool, rows } from "../../lib/db.js";
import { fail, phone, text } from "../../lib/http.js";
import { saveApartment, saveResident } from "../residency/residency.service.js";
import { create as createVehicle } from "../vehicles/vehicles.service.js";
import { saveMeter } from "../billing/billing.service.js";
import { createEquipment } from "../maintenance/maintenance.service.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { parseFile } from "./import-files.js";

// Preview tokens expire on restart and after 15 minutes. No uploaded file is kept on disk.
const signingKey = randomBytes(32);
function signature(payload) {
  return createHmac("sha256", signingKey).update(payload).digest("base64url");
}
function tokenFor(kind, sha, user) {
  const payload = Buffer.from(
    JSON.stringify({
      kind,
      sha,
      actor: user.ma_nguoi_dung,
      version: user.phien_ban_token,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
function verify(token, kind, sha, user) {
  const [payload = "", mac = ""] =
    typeof token === "string" ? token.split(".") : [];
  const expected = signature(payload);
  const actualBytes = Buffer.from(mac),
    expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  )
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Hãy xem trước đúng tệp trước khi xác nhận nhập.",
    );
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    fail(409, "PREVIEW_REQUIRED", "Hãy xem trước lại tệp.");
  }
  if (
    data.kind !== kind ||
    data.sha !== sha ||
    data.actor !== user.ma_nguoi_dung ||
    data.version !== user.phien_ban_token ||
    data.expires < Date.now()
  )
    fail(
      409,
      "PREVIEW_EXPIRED",
      "Tệp, phiên đăng nhập đã thay đổi hoặc bản xem trước hết hạn. Hãy xem trước lại.",
    );
}
function bool(value, key) {
  if (value !== "0" && value !== "1")
    fail(422, "INVALID_BOOLEAN", `${key}: nhập 1 hoặc 0.`);
  return value === "1";
}
async function apartment(db, value) {
  const code = text(value, "so_can_ho", 1, 20);
  const [record] = await rows(
    db,
    "SELECT ma_can_ho FROM can_ho WHERE so_can_ho=? FOR UPDATE",
    [code],
  );
  if (!record)
    fail(422, "APARTMENT_NOT_FOUND", `Chưa có căn ${code}. Nhập căn hộ trước.`);
  return record.ma_can_ho;
}
async function write(db, kind, input, user) {
  const body = { ...input };
  if (kind === "can_ho") {
    body.tinh_phi_dich_vu = bool(body.tinh_phi_dich_vu, "tinh_phi_dich_vu");
    return saveApartment(null, body, user, db);
  }
  if (kind === "cu_dan") {
    body.so_dien_thoai = phone(body.so_dien_thoai);
    const existing = await rows(
      db,
      "SELECT ma_cu_dan FROM cu_dan WHERE so_dien_thoai=? LIMIT 1 FOR UPDATE",
      [body.so_dien_thoai],
    );
    if (existing.length)
      fail(
        409,
        "RESIDENT_EXISTS",
        "Số điện thoại đã có hồ sơ cư dân. Dùng màn cư trú để chuyển/nhập căn.",
      );
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    return saveResident(null, body, user, db);
  }
  if (kind === "phuong_tien") {
    // Match the normal resident -> stay -> apartment write lock order.
    const residentId = text(body.ma_cu_dan, "ma_cu_dan", 1, 10);
    if (!/^\d+$/.test(residentId))
      fail(422, "INVALID_RESIDENT", "Mã cư dân cần là số nguyên.");
    await rows(
      db,
      "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
      [residentId],
    );
    const [stay] = await rows(
      db,
      "SELECT ma_lich_su_cu_tru FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
      [residentId],
    );
    if (!stay)
      fail(422, "NO_ACTIVE_STAY", "Cư dân không có đợt cư trú đang mở.");
    body.ma_lich_su_cu_tru = stay.ma_lich_su_cu_tru;
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    return createVehicle(body, user, db);
  }
  if (kind === "chi_so") {
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    body.ky_dau = bool(body.ky_dau, "ky_dau");
    const existing = await rows(
      db,
      "SELECT ma_chi_so_dich_vu FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? AND ky_thanh_toan=? FOR UPDATE",
      [body.ma_can_ho, body.loai_dich_vu, body.ky_thanh_toan],
    );
    if (existing.length)
      fail(
        409,
        "METER_EXISTS",
        "Chỉ số kỳ này đã có. Dùng màn chỉ số để sửa có kiểm tra phiên bản.",
      );
    return saveMeter(body, user, db);
  }
  return createEquipment(body, user, db);
}
async function actor(db, user) {
  const found = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!found.length)
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Đăng nhập lại trước khi nhập dữ liệu.",
    );
}
function rowError(error) {
  if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code))
    throw error;
  if (error.code === "ER_DUP_ENTRY")
    return "Dữ liệu trùng với hệ thống hoặc dòng trước trong tệp.";
  if (error.status && error.status < 500)
    return [
      error.message,
      ...Object.entries(error.field_errors || {}).map(([k, v]) => `${k}: ${v}`),
    ].join(" ");
  throw error;
}
export async function importFile(kind, file, body, user, commit = false) {
  const records = await parseFile(file, kind),
    sha = createHash("sha256").update(file.buffer).digest("hex");
  const key = commit ? requestKey(body.khoa_yeu_cau) : null;
  if (commit) verify(body.xac_nhan, kind, sha, user);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    if (commit) {
      // Unique keys serialize duplicate requests, including retries on another server.
      const existing = await rows(
        db,
        "SELECT * FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=? AND (khoa_yeu_cau=? OR (phan_he=? AND sha256=?)) FOR UPDATE",
        [user.ma_nguoi_dung, key, kind, sha],
      );
      if (existing.length) {
        if (existing.some((r) => r.phan_he !== kind || r.sha256 !== sha))
          fail(
            409,
            "IMPORT_KEY_CONFLICT",
            "Mã yêu cầu đã dùng với tệp khác. Xem trước lại.",
          );
        await actor(db, user);
        return {
          ...JSON.parse(
            typeof existing[0].ket_qua === "string"
              ? existing[0].ket_qua
              : JSON.stringify(existing[0].ket_qua),
          ),
          da_nhap_truoc: true,
          tai_khoan_moi: [],
        };
      }
      // Store only a non-secret result. Plaintext temporary passwords are returned once.
      await rows(
        db,
        "INSERT INTO dot_nhap_du_lieu (ma_nguoi_nhap,khoa_yeu_cau,phan_he,sha256,so_dong,ket_qua) VALUES (?,?,?,?,?,?)",
        [user.ma_nguoi_dung, key, kind, sha, records.length, "{}"],
      );
    }
    const preview = [],
      results = [],
      credentials = [];
    for (const record of records) {
      await db.query("SAVEPOINT import_row");
      try {
        if (record.error) fail(422, "INVALID_CELL", record.error);
        const result = await write(db, kind, record.values, user);
        preview.push({ ...record, error: null });
        const idKey = {
          can_ho: "ma_can_ho",
          cu_dan: "ma_cu_dan",
          phuong_tien: "ma_phuong_tien",
          chi_so: "ma_chi_so_dich_vu",
          thiet_bi: "ma_thiet_bi",
        }[kind];
        results.push({ dong: record.line, [idKey]: result[idKey] });
        if (commit && result.tai_khoan_can_ho?.mat_khau_tam_thoi)
          credentials.push({ dong: record.line, ...result.tai_khoan_can_ho });
      } catch (error) {
        const message = rowError(error);
        await db.query("ROLLBACK TO SAVEPOINT import_row");
        preview.push({ ...record, error: message });
      }
    }
    await actor(db, user);
    const errors = preview.filter((r) => r.error).length;
    if (!commit)
      return {
        rows: preview,
        total: records.length,
        errors,
        xac_nhan: errors ? null : tokenFor(kind, sha, user),
      };
    if (errors)
      fail(
        409,
        "IMPORT_CHANGED",
        "Chưa lưu dòng nào. Có dữ liệu không hợp lệ hoặc hệ thống đã thay đổi. Xem trước lại để kiểm tra từng dòng.",
      );
    const result = { so_dong: results.length, ket_qua: results };
    await rows(
      db,
      "UPDATE dot_nhap_du_lieu SET ket_qua=? WHERE ma_nguoi_nhap=? AND khoa_yeu_cau=?",
      [JSON.stringify(result), user.ma_nguoi_dung, key],
    );
    await db.commit();
    return { ...result, tai_khoan_moi: credentials };
  } finally {
    // Preview, replay, errors and disconnected requests never leave partial writes.
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
```

### 14. `backend/src/modules/data-exchange/export.service.js` — Tạo mới

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
      pdfWidth: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 1.7 : 1,
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

### 15. `backend/src/modules/data-exchange/data-exchange.routes.js` — Tạo mới

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
      buffer = await template(req.params.kind, f, req.query);
    res.set(
      "Content-Type",
      f === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf",
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
                    "Chọn đúng một tệp Excel/PDF tối đa 5 MB và các trường xác nhận của biểu mẫu.",
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

### 16. `backend/src/app.js` — Thay toàn bộ

```js
import express from "express";
import { dataExchangeRouter } from "./modules/data-exchange/data-exchange.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext, fail } from "./lib/http.js";
import { pool } from "./lib/db.js";
import { authRouter, usersRouter } from "./modules/auth/auth.routes.js";
import { qrRouter, publicQrRouter } from "./modules/qr/qr.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import {
  ratesRouter,
  metersRouter,
  billsRouter,
  selfBillsRouter,
} from "./modules/billing/billing.routes.js";
import {
  apartmentsRouter,
  residentsRouter,
} from "./modules/residency/residency.routes.js";
import {
  publicIncidentsRouter,
  incidentsRouter,
} from "./modules/incidents/incidents.routes.js";

import {
  announcementsRouter,
  selfAnnouncementsRouter,
} from "./modules/announcements/announcements.routes.js";

import { financialReportsRouter } from "./modules/financial-reports/financial-reports.routes.js";

import {
  equipmentRouter,
  maintenanceRouter,
} from "./modules/maintenance/maintenance.routes.js";

import {
  amenitiesRouter,
  bookingsRouter,
  selfBookingsRouter,
} from "./modules/amenities/amenities.routes.js";

import {
  fundsRouter,
  vouchersRouter,
} from "./modules/treasury/treasury.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(requestContext);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/api/health", healthRouter);
app.get("/api/ready", async (req, res) => {
  try {
    const [migrations] = await pool.execute(
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
        "005_billing.sql",
        "006_electricity_tiers.sql",
        "007_apartment_accounts.sql",
        "008_handover_audit_locks.sql",
        "009_announcements.sql",
        "010_maintenance.sql",
        "011_maintenance_plan_checks.sql",
        "012_amenity_bookings.sql",
        "013_treasury.sql",
        "014_data_imports.sql",
      ],
    );
    if (migrations.length !== 14) throw new Error("Schema not initialized");
    await pool.query("SELECT 1 FROM phan_anh LIMIT 1");
  } catch {
    fail(
      503,
      "DATABASE_UNAVAILABLE",
      "Chưa kết nối được database hoặc chưa chạy migration.",
    );
  }
  res.json({ data: { status: "ok", database: "connected" } });
});
app.use("/api/xac_thuc", authRouter);
app.use("/api/trao_doi_du_lieu", dataExchangeRouter);
app.use("/api/nguoi_dung", usersRouter);
app.use("/api/can_ho", apartmentsRouter);
app.use("/api/cu_dan", residentsRouter);
app.use("/api/phuong_tien", vehiclesRouter);
app.use("/api/cau_hinh_phi", ratesRouter);
app.use("/api/chi_so_dich_vu", metersRouter);
app.use("/api/hoa_don", billsRouter);
app.use("/api/bao_cao", financialReportsRouter);
app.use("/api/quy", fundsRouter);
app.use("/api/phieu_thu_chi", vouchersRouter);
app.use("/api/tien_ich", amenitiesRouter);
app.use("/api/dat_lich_tien_ich", bookingsRouter);
app.use("/api/cua_toi/dat_lich", selfBookingsRouter);
app.use("/api/thiet_bi", equipmentRouter);
app.use("/api/bao_tri", maintenanceRouter);
app.use("/api/thong_bao", announcementsRouter);
app.use("/api/cua_toi/thong_bao", selfAnnouncementsRouter);
app.use("/api/cua_toi/hoa_don", selfBillsRouter);
app.use("/api/vi_tri_qr", qrRouter);
app.use("/api/cong_khai/vi_tri_qr", publicQrRouter);
app.use("/api/cong_khai/phan_anh", publicIncidentsRouter);
app.use("/api/phan_anh", incidentsRouter);
app.use((req, res) =>
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "API chưa tồn tại.",
      request_id: req.requestId,
    },
  }),
);
app.use(errorHandler);
```

### 17. `frontend/src/shared/ReportExport.jsx` — Thay toàn bộ

```jsx
import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
export default function ReportExport({
  path,
  disabled = false,
  template = false,
  templateRows = 3,
}) {
  const [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    [notice, setNotice] = useState(""),
    active = useRef(null),
    currentPath = useRef(path);
  currentPath.current = path;
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    setPending("");
    setError(null);
    setNotice("");
    return () => active.current?.abort();
  }, [path]);
  async function download(format) {
    const controller = new AbortController(),
      requestPath = path;
    active.current = controller;
    setPending(format);
    setError(null);
    setNotice("");
    try {
      const url = new URL("/api" + path, window.location.origin);
      url.searchParams.set("dinh_dang", format);
      const r = await fetch(url, {
        credentials: "same-origin",
        headers: { "X-App-Request": "1" },
        signal: controller.signal,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(
          data.error?.message || `Không tải được báo cáo (${r.status}).`,
        );
      }
      const mime =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      if (!r.headers.get("Content-Type")?.startsWith(mime))
        throw new Error("Máy chủ trả tệp không đúng định dạng. Hãy thử lại.");
      const blob = await r.blob();
      if (controller.signal.aborted || currentPath.current !== requestPath)
        return;
      const file =
        r.headers
          .get("Content-Disposition")
          ?.match(/filename="([a-zA-Z0-9_.-]+)"/)?.[1] || `bao-cao.${format}`;
      const link = document.createElement("a"),
        objectURL = URL.createObjectURL(blob);
      link.href = objectURL;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
      setNotice(
        template
          ? "Đã tải mẫu. Điền dữ liệu rồi chọn tệp để xem trước."
          : `Đã tạo tệp ${format === "xlsx" ? "Excel" : "PDF"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
      );
    } catch (e) {
      if (!controller.signal.aborted && currentPath.current === requestPath)
        setError(
          e.name === "TypeError"
            ? new Error(
                "Không kết nối được máy chủ để tải báo cáo. Hãy thử lại.",
              )
            : e,
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending("");
      }
    }
  }
  return (
    <section className="report-export" aria-label="Xuất báo cáo">
      <div className="actions">
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("xlsx")}
        >
          {pending === "xlsx"
            ? "Đang tạo Excel…"
            : template
              ? "Tải mẫu Excel"
              : "Xuất Excel"}
        </button>
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("pdf")}
        >
          {pending === "pdf"
            ? "Đang tạo PDF…"
            : template
              ? "Tải mẫu PDF"
              : "Xuất PDF"}
        </button>
        <small>
          {template
            ? `Mẫu Excel tối đa 100 dòng. Mẫu PDF có ${templateRows} trang, mỗi trang một hồ sơ.`
            : "Xuất toàn bộ kết quả theo bộ lọc đã áp dụng."}
        </small>
      </div>
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
    </section>
  );
}
```

### 18. `frontend/src/shared/DataTools.jsx` — Tạo mới

```jsx
import React from "react";
import { Link } from "react-router-dom";
import ReportExport from "./ReportExport.jsx";
export default function DataTools({
  kind,
  params,
  importable = false,
  disabled = false,
}) {
  return (
    <div className="data-tools">
      <ReportExport
        path={`/trao_doi_du_lieu/${kind}/xuat?${params || ""}`}
        disabled={disabled}
      />
      {importable && (
        <Link className="button" to={`/quan-tri/nhap-xuat?phan_he=${kind}`}>
          Nhập Excel / PDF
        </Link>
      )}
    </div>
  );
}
```

### 19. `frontend/src/features/data-exchange/DataExchange.jsx` — Tạo mới

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";
import ReportExport from "../../shared/ReportExport.jsx";
import { newRequestKey as requestKey } from "../../shared/request-key.js";

function ImportPanel({ config, onDone }) {
  const [file, setFile] = useState(null),
    [templateRows, setTemplateRows] = useState(3),
    [preview, setPreview] = useState(null),
    [result, setResult] = useState(null),
    [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    request = useRef(null),
    key = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function run(commit) {
    const controller = new AbortController();
    request.current = controller;
    setPending(commit ? "commit" : "preview");
    setError(null);
    if (!commit) {
      setPreview(null);
      setResult(null);
      key.current = requestKey();
    }
    try {
      const body = new FormData();
      body.append("tep", file);
      if (commit) {
        body.append("xac_nhan", preview.xac_nhan);
        body.append("khoa_yeu_cau", key.current);
      }
      const response = await getJson(
        `/trao_doi_du_lieu/${config.key}/${commit ? "nhap" : "xem_truoc"}`,
        { method: "POST", body, signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (commit) {
        setResult(response.data);
        setPreview(null);
        onDone();
      } else setPreview(response.data);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e);
        if (
          ["IMPORT_CHANGED", "PREVIEW_EXPIRED", "PREVIEW_REQUIRED"].includes(
            e.code,
          )
        )
          setPreview(null);
      }
    } finally {
      if (!controller.signal.aborted) setPending("");
    }
  }
  return (
    <section className="card data-import" aria-label="Nhập dữ liệu">
      <p className="eyebrow">THÊM MỚI TỪ TỆP</p>
      <h2>Nhập {config.title.toLowerCase()}</h2>
      <p>{config.note}</p>
      <ol className="import-steps">
        <li>Tải và điền mẫu</li>
        <li>Chọn tệp, xem trước</li>
        <li>Kiểm tra rồi xác nhận</li>
      </ol>
      <Field label="Số hồ sơ trong mẫu PDF">
        <select
          value={templateRows}
          disabled={!!pending}
          onChange={(e) => setTemplateRows(Number(e.target.value))}
        >
          {[1, 3, 5, 10].map((n) => (
            <option key={n} value={n}>
              {n} hồ sơ / {n} trang
            </option>
          ))}
        </select>
      </Field>
      <ReportExport
        path={`/trao_doi_du_lieu/${config.key}/mau?so_dong=${templateRows}`}
        template
        templateRows={templateRows}
        disabled={!!pending}
      />
      <details className="import-help">
        <summary>Hướng dẫn Excel và PDF biểu mẫu</summary>
        <p>
          Excel: điền sheet <strong>Nhap</strong> từ dòng 2, giữ nguyên tên cột.
          Số điện thoại và mã căn cần là văn bản để giữ số 0 đầu. Ngày dùng
          YYYY-MM-DD, số thập phân dùng dấu chấm.
        </p>
        <p>
          PDF: tải mẫu, mở bằng Chrome hoặc Adobe Acrobat, điền các ô rồi chọn{" "}
          <strong>Lưu / Save</strong>. Không dùng In / Print to PDF vì ô điền sẽ
          bị mất. Trang trống được bỏ qua. PDF scan và PDF báo cáo không dùng để
          nhập dữ liệu.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cột</th>
                <th>Ý nghĩa</th>
                <th>Ví dụ / hướng dẫn</th>
              </tr>
            </thead>
            <tbody>
              {config.fields.map((f) => (
                <tr key={f.key}>
                  <td>
                    <code>{f.key}</code>
                  </td>
                  <td>{f.label}</td>
                  <td>
                    {f.example}
                    {f.example && f.hint ? " · " : ""}
                    {f.hint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <Field label="Chọn tệp Excel hoặc PDF biểu mẫu (tối đa 5 MB)">
        <input
          type="file"
          accept=".xlsx,.pdf"
          disabled={!!pending}
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            setFile(selected);
            setPreview(null);
            setResult(null);
            setError(
              selected?.size > 5 * 1024 * 1024
                ? new Error("Tệp tối đa 5 MB.")
                : null,
            );
            key.current = null;
          }}
        />
      </Field>
      <div className="actions">
        <button
          type="button"
          disabled={!file || file.size > 5 * 1024 * 1024 || !!pending}
          onClick={() => run(false)}
        >
          {pending === "preview" ? "Đang kiểm tra…" : "Xem trước tệp"}
        </button>
      </div>
      <ErrorBox error={error} />
      {preview && (
        <section aria-label="Bản xem trước" className="import-preview">
          <p className="muted">Vuốt hoặc cuộn ngang bảng để xem đủ các cột.</p>
          <h3>
            {preview.total} dòng · {preview.errors} dòng lỗi
          </h3>
          <p className="muted">
            Chưa lưu dữ liệu. Sửa tất cả dòng lỗi trong tệp rồi xem trước lại.
            Khi xác nhận, hệ thống kiểm tra lại và chỉ lưu nếu toàn bộ lô hợp
            lệ.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dòng / trang</th>
                  {config.fields.map((f) => (
                    <th key={f.key}>{f.label}</th>
                  ))}
                  <th>Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.line}>
                    <td>{r.line}</td>
                    {config.fields.map((f) => (
                      <td key={f.key}>{r.values[f.key] || "—"}</td>
                    ))}
                    <td className={r.error ? "import-row-error" : ""}>
                      {r.error || "Hợp lệ"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="primary"
            type="button"
            disabled={preview.errors > 0 || !preview.xac_nhan || !!pending}
            onClick={() => run(true)}
          >
            {pending === "commit"
              ? "Đang lưu toàn bộ lô…"
              : `Xác nhận nhập ${preview.total} dòng`}
          </button>
        </section>
      )}
      {result && (
        <section role="status" className="import-result">
          <h3>
            {result.da_nhap_truoc
              ? "Tệp này đã được nhập trước đó"
              : "Nhập thành công"}
          </h3>
          <p>
            Đã lưu {result.so_dong} dòng. Yêu cầu gửi lại không tạo dữ liệu
            trùng.
          </p>
          {!!result.tai_khoan_moi?.length && (
            <details open>
              <summary>
                Tài khoản căn hộ vừa cấp — chỉ hiện mật khẩu lần này
              </summary>
              <p>
                Sao chép và bàn giao riêng cho người phụ trách. Không đưa mật
                khẩu vào tệp danh sách.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Tên đăng nhập</th>
                      <th>Mật khẩu tạm thời</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tai_khoan_moi.map((a) => (
                      <tr key={a.dong}>
                        <td>{a.dong}</td>
                        <td>{a.ten_dang_nhap}</td>
                        <td>
                          <code>{a.mat_khau_tam_thoi}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {result.da_nhap_truoc && (
            <p>
              Mật khẩu không được trả lại khi gửi lại yêu cầu. Nếu chưa nhận
              được, cấp lại tại Tài khoản căn hộ.
            </p>
          )}
          <Link className="button" to={config.path}>
            Mở danh sách {config.title.toLowerCase()}
          </Link>
        </section>
      )}
    </section>
  );
}
export default function DataExchange() {
  const [params, setParams] = useSearchParams(),
    resource = useResource("/trao_doi_du_lieu"),
    history = useResource("/trao_doi_du_lieu/lich_su"),
    items = resource.result?.data || [],
    config = items.find((c) => c.key === (params.get("phan_he") || "can_ho"));
  const filters = new URLSearchParams(
    (config?.key === "chi_so" ? ["ma_can_ho", "ky_thanh_toan"] : ["q"]).map(
      (key) => [key, params.get(key) || ""],
    ),
  );
  return (
    <>
      <p className="eyebrow">DỮ LIỆU & BÁO CÁO</p>
      <h1>Nhập / xuất Excel và PDF</h1>
      <p>
        Nhập hồ sơ theo mẫu và xuất danh sách để đối chiếu. Chỉ ban quản lý được
        sử dụng chức năng này.
      </p>
      <ErrorBox error={resource.error || history.error} />
      {resource.loading && <Loading />}
      <section className="card">
        <Field label="Phần dữ liệu">
          <select
            value={config?.key || ""}
            onChange={(e) => {
              setParams({ phan_he: e.target.value });
            }}
          >
            {items.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
                {c.importable ? " · Nhập / xuất" : " · Xuất danh sách"}
              </option>
            ))}
          </select>
        </Field>
      </section>
      {!resource.loading && !config && (
        <p>Phần dữ liệu không hợp lệ. Chọn lại trong danh sách.</p>
      )}
      {config && (
        <>
          <section className="card">
            <h2>Xuất {config.title.toLowerCase()}</h2>
            <p>
              Xuất toàn bộ kết quả, tối đa 10.000 dòng Excel hoặc 1.000 dòng
              PDF. Có thể xuất theo bộ lọc ngay tại{" "}
              <Link to={config.path}>màn danh sách</Link>.
            </p>
            <form
              className="filters"
              key={params.toString()}
              onSubmit={(e) => {
                e.preventDefault();
                setParams({
                  phan_he: config.key,
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              {config.key === "chi_so" ? (
                <>
                  <Field label="Mã căn hộ">
                    <input
                      name="ma_can_ho"
                      defaultValue={params.get("ma_can_ho") || ""}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </Field>
                  <Field label="Kỳ">
                    <input
                      type="month"
                      name="ky_thanh_toan"
                      defaultValue={params.get("ky_thanh_toan") || ""}
                    />
                  </Field>
                </>
              ) : (
                <Field label="Tìm kiếm">
                  <input
                    name="q"
                    maxLength={100}
                    defaultValue={params.get("q") || ""}
                  />
                </Field>
              )}
              <button>Áp dụng bộ lọc xuất</button>
            </form>
            <ReportExport
              path={`/trao_doi_du_lieu/${config.key}/xuat?${filters}`}
            />
          </section>
          {config.importable ? (
            <ImportPanel
              key={config.key}
              config={config}
              onDone={history.reload}
            />
          ) : (
            <section className="card">
              <p>
                Phần này xuất dữ liệu đã ghi nhận. Tạo, duyệt hoặc xác nhận
                thanh toán tại màn nghiệp vụ để giữ đúng lịch sử.
              </p>
            </section>
          )}
        </>
      )}
      <section className="card">
        <h2>20 lần nhập gần nhất của bạn</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Phần dữ liệu</th>
                <th>Số dòng</th>
                <th>Thời điểm (Việt Nam)</th>
              </tr>
            </thead>
            <tbody>
              {(history.result?.data || []).map((r) => (
                <tr key={r.ma_dot_nhap}>
                  <td>
                    {items.find((i) => i.key === r.phan_he)?.title || r.phan_he}
                  </td>
                  <td>{r.so_dong}</td>
                  <td>
                    {new Date(
                      r.ngay_tao.replace(" ", "T") + "Z",
                    ).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!history.loading && !history.result?.data?.length && (
          <p className="muted">Chưa có lần nhập nào.</p>
        )}
      </section>
      <section className="card">
        <h2>Báo cáo tài chính</h2>
        <div className="actions">
          <Link to="/quan-tri/bao-cao-tai-chinh">
            Công nợ & thu phí · Excel / PDF
          </Link>
          <Link to="/quan-tri/quy">Sổ quỹ · Excel / PDF</Link>
        </div>
      </section>
    </>
  );
}
```

### 20. `frontend/src/features/residency/Residency.jsx` — Thay toàn bộ

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const relations = {
  CHU_HO: "Chủ hộ",
  THANH_VIEN: "Thành viên",
  NGUOI_THUE: "Người thuê",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const values = (event) => Object.fromEntries(new FormData(event.currentTarget));
const displayDay = (day) => day.split("-").reverse().join("/");

function Pager({ resource }) {
  const [params, setParams] = useSearchParams();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(next) {
    const p = new URLSearchParams(params);
    p.set("page", String(next));
    setParams(p);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} hồ sơ
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function useChange(reload) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(),
    [credentials, setCredentials] = useState(null);
  async function change(path, method, body, done) {
    setPending(true);
    setError(null);
    setCredentials(null);
    try {
      const result = await getJson(path, { method, body });
      const fresh = result.data?.tai_khoan_can_ho || result.data;
      if (fresh?.mat_khau_tam_thoi) setCredentials(fresh);
      done?.(result.data);
      reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    change,
    credentials,
    clearCredentials: () => setCredentials(null),
  };
}
function Credentials({ action }) {
  const account = action.credentials;
  return (
    account && (
      <section className="card" aria-label="Thông tin bàn giao tài khoản">
        <h2>Thông tin đăng nhập tài khoản căn hộ</h2>
        <p>
          Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong>
        </p>
        {account.dien_thoai_phu_trach && (
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach}</strong>
          </p>
        )}
        <p>
          Mật khẩu mới:{" "}
          <code style={{ overflowWrap: "anywhere" }}>
            {account.mat_khau_tam_thoi}
          </code>
        </p>
        <p>
          {account.nguoi_phu_trach
            ? `Bàn giao cho: ${account.nguoi_phu_trach}.`
            : "Chưa gắn cư dân phụ trách."}{" "}
          Mật khẩu chỉ hiển thị lần này. Chủ hộ nên đổi mật khẩu tại mục Tài
          khoản sau khi nhận.
        </p>
        <button onClick={action.clearCredentials}>
          Đã lưu thông tin, ẩn mật khẩu
        </button>
      </section>
    )
  );
}
export function ApartmentAccount({ id, onChange }) {
  const resource = useResource(`/can_ho/${id}`);
  const action = useChange(() => {
      resource.reload();
      onChange?.();
    }),
    apartment = resource.result?.data,
    account = apartment?.tai_khoan_can_ho;
  const owners = (apartment?.residents || []).filter(
    (r) => r.quan_he === "CHU_HO",
  );
  return (
    <section className="card">
      <h2>Tài khoản thanh toán căn hộ</h2>
      {apartment && <p>Căn {apartment.so_can_ho}</p>}
      <Credentials action={action} />
      {resource.loading && <Loading />}
      <ErrorBox error={action.error || resource.error} />
      {account ? (
        <>
          <p>
            Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong> ·{" "}
            {account.dang_hoat_dong ? "Đang hoạt động" : "Đang khóa"}
          </p>
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach || "Chưa gắn chủ hộ"}</strong>
          </p>
          <p>
            Người phụ trách:{" "}
            {account.ma_cu_dan_phu_trach ? (
              <Link to={`/quan-tri/cu-dan/${account.ma_cu_dan_phu_trach}`}>
                {account.nguoi_phu_trach}
              </Link>
            ) : (
              "Chưa gắn cư dân"
            )}
          </p>
          <p className="note">
            Tài khoản đi theo căn hộ và xem các hóa đơn đã gửi của căn. Bàn giao
            hoặc cấp lại mật khẩu sẽ ngắt mọi phiên cũ. Khi người phụ trách
            chuyển đi, tài khoản tạm khóa đến khi BQL bàn giao/cấp lại.
          </p>
          <button
            disabled={action.pending}
            onClick={() =>
              action.change(
                `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                "POST",
                {
                  thao_tac: "cap_lai_mat_khau",
                  phien_ban_ban_giao: account.phien_ban_ban_giao,
                },
              )
            }
          >
            Cấp lại mật khẩu và ngắt phiên cũ
          </button>
          {owners.some((r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const body = values(e);
                body.thao_tac = "ban_giao";
                body.phien_ban_ban_giao = account.phien_ban_ban_giao;
                body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                action.change(
                  `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                  "POST",
                  body,
                );
              }}
            >
              <fieldset disabled={action.pending}>
                <h3>Bàn giao người phụ trách</h3>
                <Field label="Chủ hộ nhận tài khoản">
                  <select name="ma_cu_dan" required defaultValue="">
                    <option value="">Chọn chủ hộ đang ở</option>
                    {owners
                      .filter(
                        (r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach,
                      )
                      .map((r) => (
                        <option key={r.ma_cu_dan} value={r.ma_cu_dan}>
                          {r.ho_va_ten} · {r.so_dien_thoai}
                        </option>
                      ))}
                  </select>
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="xac_nhan_ban_giao"
                    value="1"
                    required={!!account.ma_cu_dan_phu_trach}
                  />
                  Xác nhận bàn giao và đổi mật khẩu tài khoản căn hộ
                </label>
                <button className="primary">Bàn giao tài khoản</button>
              </fieldset>
            </form>
          )}
        </>
      ) : (
        <p>
          Tài khoản chưa được khởi tạo. Hãy chạy migration mới nhất và tải lại.
        </p>
      )}
      {apartment?.lich_su_ban_giao?.length > 0 && (
        <details>
          <summary>Lịch sử bàn giao tài khoản</summary>
          <ul>
            {apartment.lich_su_ban_giao.map((row) => (
              <li key={row.ma_ban_giao}>
                {row.ngay_thuc_hien} ·{" "}
                {
                  {
                    TAO_TAI_KHOAN: "Tạo tài khoản",
                    BAN_GIAO_CHU_HO: "Bàn giao chủ hộ",
                    CAP_LAI_MAT_KHAU: "Cấp lại mật khẩu",
                    NGUNG_PHU_TRACH: "Ngừng phụ trách",
                    DOI_SO_DIEN_THOAI: "Đổi số điện thoại đăng nhập",
                  }[row.su_kien]
                }{" "}
                · {row.nguoi_thuc_hien}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function Apartments() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/can_ho?${params}`);
  const [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null);
  const action = useChange(() => {
    resource.reload();
    setSelected(null);
  });
  return (
    <>
      <h1>Căn hộ</h1>
      <DataTools
        kind="can_ho"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>Trạng thái có người ở được xác định từ các đợt cư trú đang mở.</p>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số căn hộ hoặc khối"
          name="q"
          defaultValue={params.get("q") || ""}
          maxLength={100}
        />
        <Field
          label="Tầng (tùy chọn)"
          name="tang"
          type="number"
          min={0}
          max={200}
          defaultValue={params.get("tang") || ""}
        />
        <button>Tìm kiếm</button>
      </form>
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      <div className="detail-grid">
        <section className="card">
          <h2>Danh sách căn hộ</h2>
          {resource.loading && <Loading />}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Căn hộ</th>
                  <th>Khối / tầng</th>
                  <th>Diện tích</th>
                  <th>Cư dân</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((a) => (
                  <tr key={a.ma_can_ho}>
                    <td>{a.so_can_ho}</td>
                    <td>
                      {a.khoi} / {a.tang}
                    </td>
                    <td>{a.dien_tich_m2} m²</td>
                    <td>{a.so_cu_dan ? `${a.so_cu_dan} đang ở` : "Trống"}</td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            action.clearCredentials();
                            setSelected(a.ma_can_ho);
                          }}
                        >
                          Xem
                        </button>
                        <button
                          disabled={action.pending}
                          onClick={() => setEditing(a)}
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!resource.loading && resource.result?.total === 0 && (
            <p>Chưa có căn hộ phù hợp.</p>
          )}
          <Pager resource={resource} />
        </section>
        <section className="card">
          <h2>{editing ? `Sửa căn ${editing.so_can_ho}` : "Thêm căn hộ"}</h2>
          <form
            key={editing?.ma_can_ho || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                body = values(e);
              body.tinh_phi_dich_vu = body.tinh_phi_dich_vu === "1";
              if (editing) body.phien_ban = editing.phien_ban;
              action.change(
                `/can_ho${editing ? `/${editing.ma_can_ho}` : ""}`,
                editing ? "PATCH" : "POST",
                body,
                () => {
                  form.reset();
                  setEditing(null);
                },
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <Field
                label="Số căn hộ"
                name="so_can_ho"
                required
                maxLength={20}
                defaultValue={editing?.so_can_ho || ""}
              />
              <div className="form-grid">
                <Field
                  label="Khối"
                  name="khoi"
                  required
                  maxLength={10}
                  defaultValue={editing?.khoi || ""}
                />
                <Field
                  label="Tầng"
                  name="tang"
                  type="number"
                  required
                  min={0}
                  max={200}
                  defaultValue={editing?.tang ?? 1}
                />
              </div>
              <Field
                label="Diện tích (m²)"
                name="dien_tich_m2"
                type="number"
                required
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={editing?.dien_tich_m2 || ""}
              />
              <Field label="Tính phí dịch vụ">
                <select
                  name="tinh_phi_dich_vu"
                  defaultValue={editing?.tinh_phi_dich_vu === 0 ? "0" : "1"}
                >
                  <option value="1">Có</option>
                  <option value="0">Không</option>
                </select>
              </Field>
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu căn hộ"}
              </button>
            </fieldset>
          </form>
          {editing && (
            <button disabled={action.pending} onClick={() => setEditing(null)}>
              Hủy sửa
            </button>
          )}
        </section>
      </div>
      {selected && <ApartmentResidents id={selected} />}
    </>
  );
}
function ApartmentResidents({ id: selected }) {
  const detail = useResource(`/can_ho/${selected}`);
  return (
    <section className="card">
      {detail.loading && <Loading />}
      <ErrorBox error={detail.error} />
      <ApartmentAccount id={selected} key={selected} />
      {detail.result && (
        <>
          <h2>Cư dân căn {detail.result.data.so_can_ho}</h2>
          <Link
            className="button"
            to={`/quan-tri/cu-dan?ma_can_ho=${selected}&so=${encodeURIComponent(detail.result.data.so_can_ho)}`}
          >
            Thêm hoặc xem cư dân căn này
          </Link>
          <ul>
            {detail.result.data.residents.map((r) => (
              <li key={r.ma_cu_dan}>
                <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                  {r.ho_va_ten}
                </Link>{" "}
                · {r.so_dien_thoai} · {relations[r.quan_he]} · Từ {r.tu_ngay}
              </li>
            ))}
          </ul>
          {!detail.result.data.residents.length && (
            <p>Chưa có cư dân đang ở.</p>
          )}
        </>
      )}
    </section>
  );
}

function ApartmentPicker({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`);
  const apartments = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập số căn hộ hoặc khối"
        />
      </Field>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !apartments.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn hộ #${id}`}</option>
          )}
          {apartments.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho} · Khối {a.khoi} · Tầng {a.tang}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} căn phù hợp. Nhập số căn cụ thể để thu hẹp
          danh sách.
        </small>
      )}
    </>
  );
}

function ProfileFields({ resident }) {
  const [q, setQ] = useState(""),
    [accountId, setAccountId] = useState(String(resident?.ma_nguoi_dung || ""));
  const users = useResource(`/cu_dan/tai_khoan?q=${encodeURIComponent(q)}`);
  const accounts = users.result?.data || [];
  return (
    <>
      <Field
        label="Họ tên"
        name="ho_va_ten"
        required
        minLength={2}
        maxLength={100}
        defaultValue={resident?.ho_va_ten || ""}
      />
      <Field
        label="Số điện thoại"
        name="so_dien_thoai"
        type="tel"
        required
        maxLength={15}
        defaultValue={resident?.so_dien_thoai || ""}
      />
      <ErrorBox error={users.error} />
      <Field label="Tìm tài khoản cá nhân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <input type="hidden" name="ma_nguoi_dung" value={accountId} />
      <Field label="Tài khoản cá nhân (tùy chọn)">
        <select
          disabled={users.loading || !!users.error}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Chưa gắn tài khoản</option>
          {accountId &&
            !accounts.some((u) => String(u.ma_nguoi_dung) === accountId) && (
              <option value={accountId}>Tài khoản đã chọn #{accountId}</option>
            )}
          {accounts.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten} · {u.so_dien_thoai}
            </option>
          ))}
        </select>
      </Field>
      {users.result?.total > 20 && (
        <small>
          Nhập tên hoặc số điện thoại cụ thể để tìm trong {users.result.total}{" "}
          tài khoản.
        </small>
      )}
      <small>
        Đây là tài khoản cá nhân tùy chọn. Khi chọn vai trò Chủ hộ, hệ thống tự
        gắn thêm tài khoản thanh toán cố định của căn, không cần tạo thủ công
        tại mục Nhân sự.
      </small>
    </>
  );
}
function StayFields({
  current,
  initialId,
  initialLabel,
  minDay = "1900-01-01",
}) {
  const [relation, setRelation] = useState(current?.quan_he || "THANH_VIEN");
  return (
    <>
      <ApartmentPicker initialId={initialId} initialLabel={initialLabel} />
      <Field label="Quan hệ với căn hộ">
        <select
          name="quan_he"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        >
          <Options values={relations} />
        </select>
      </Field>
      {relation === "CHU_HO" && (
        <>
          <p className="note">
            Tự gắn tài khoản thanh toán của căn cho chủ hộ này và cấp mật khẩu
            mới để bàn giao.
          </p>
          <label className="checkbox">
            <input type="checkbox" name="xac_nhan_ban_giao" value="1" />
            Bàn giao tài khoản nếu căn đang có người phụ trách (ngắt mọi phiên
            cũ)
          </label>
        </>
      )}
      <Field
        label="Ngày bắt đầu / chuyển căn"
        name="ngay"
        type="date"
        required
        min={minDay}
        max={today()}
        defaultValue={today()}
      />
      {!current && (
        <small>
          Nhập ngày thực tế bắt đầu ở căn hộ, có thể trước ngày lập hồ sơ.
        </small>
      )}
    </>
  );
}

export function Residents() {
  const [params, setParams] = useSearchParams(),
    [adding, setAdding] = useState(false);
  const filter = new URLSearchParams(params);
  filter.delete("so");
  const resource = useResource(`/cu_dan?${filter}`);
  const action = useChange(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>Cư dân</h1>
        <button
          className="primary"
          disabled={action.pending}
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Đóng biểu mẫu" : "Thêm cư dân"}
        </button>
      </div>
      {params.get("ma_can_ho") && (
        <p>
          Đang lọc căn {params.get("so") || `#${params.get("ma_can_ho")}`} ·{" "}
          <Link to="/quan-tri/cu-dan">Xem tất cả cư dân</Link>
        </p>
      )}
      <ErrorBox error={action.error} />
      <DataTools
        kind="cu_dan"
        params={filter}
        importable
        disabled={resource.loading}
      />
      <Credentials action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Hồ sơ và đợt cư trú đầu tiên</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const body = values(e);
              body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
              action.change("/cu_dan", "POST", body, () => setAdding(false));
            }}
          >
            <fieldset disabled={action.pending}>
              <ProfileFields />
              <StayFields
                initialId={params.get("ma_can_ho") || ""}
                initialLabel={params.get("so") || ""}
              />
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu cư dân"}
              </button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams(values(e));
          for (const key of ["ma_can_ho", "so"])
            if (params.has(key)) p.set(key, params.get(key));
          setParams(p);
        }}
      >
        <Field
          label="Tìm tên hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Tình trạng cư trú">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_O">Đang ở</option>
            <option value="DA_CHUYEN_DI">Đã chuyển đi</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Căn hộ hiện tại</th>
                <th>Quan hệ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cu_dan}>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                      {r.ho_va_ten}
                    </Link>
                  </td>
                  <td>{r.so_dien_thoai}</td>
                  <td>{r.so_can_ho || "Đã chuyển đi"}</td>
                  <td>{relations[r.quan_he] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có cư dân phù hợp.</p>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function ResidentDetail() {
  const { id } = useParams(),
    resource = useResource(`/cu_dan/${id}`);
  const [mode, setMode] = useState("");
  const action = useChange(resource.reload);
  const resident = resource.result?.data,
    current = resident?.history.find((s) => !s.den_ngay);
  const minDay = current
    ? current.tu_ngay
    : resident?.history[0]?.den_ngay || "1900-01-01";
  const dateBlocked = mode !== "profile" && minDay > today();
  return (
    <>
      <Link to="/quan-tri/cu-dan">← Danh sách cư dân</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      {resident && (
        <>
          <h1>{resident.ho_va_ten}</h1>
          <p>
            {resident.so_dien_thoai} ·{" "}
            {current ? `Đang ở căn ${current.so_can_ho}` : "Đã chuyển đi"}
          </p>
          {resident.tai_khoan_can_ho && (
            <p>
              Đang phụ trách tài khoản thanh toán{" "}
              <strong>{resident.tai_khoan_can_ho.ten_dang_nhap}</strong> ·{" "}
              {resident.tai_khoan_can_ho.dang_hoat_dong
                ? "Hoạt động"
                : "Đang khóa"}
            </p>
          )}
          {current && (
            <p>
              Đợt cư trú hiện tại bắt đầu ngày {displayDay(current.tu_ngay)}.
            </p>
          )}
          <p>
            <Link
              className="button"
              to={`/quan-tri/phuong-tien?ma_cu_dan=${id}`}
            >
              Phương tiện của cư dân
            </Link>
          </p>
          <div className="actions">
            {[
              ["profile", "Sửa hồ sơ"],
              ...(current
                ? [
                    ["chuyen_can", "Chuyển căn"],
                    ["chuyen_di", "Ghi nhận chuyển đi"],
                  ]
                : [["nhap_cu", "Ghi nhận quay lại"]]),
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={action.pending}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {mode && (
            <section className="card narrow">
              <h2>
                {
                  {
                    profile: "Sửa hồ sơ",
                    chuyen_can: "Chuyển căn",
                    chuyen_di: "Ghi nhận chuyển đi",
                    nhap_cu: "Ghi nhận quay lại",
                  }[mode]
                }
              </h2>
              {mode !== "profile" && (
                <p className="note" role="status">
                  {dateBlocked
                    ? `Chưa có ngày hợp lệ: ngày sớm nhất là ${displayDay(minDay)}, sau ngày hiện tại ${displayDay(today())}.`
                    : `Có thể chọn ngày từ ${displayDay(minDay)} đến ${displayDay(today())}, kể cả chuyển căn trong ngày bắt đầu ở. Lịch sử căn cũ vẫn được giữ.`}
                </p>
              )}
              <form
                key={`${mode}:${resident.phien_ban}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = { ...values(e), phien_ban: resident.phien_ban };
                  body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                  if (mode === "chuyen_can")
                    body.chuyen_phuong_tien = body.chuyen_phuong_tien === "1";
                  action.change(
                    `/cu_dan/${id}${mode === "profile" ? "" : `/${mode}`}`,
                    mode === "profile" ? "PATCH" : "POST",
                    body,
                    () => setMode(""),
                  );
                }}
              >
                <fieldset disabled={action.pending || dateBlocked}>
                  {mode === "profile" ? (
                    <ProfileFields resident={resident} />
                  ) : mode === "chuyen_di" ? (
                    <>
                      <p>Kết thúc đợt cư trú hiện tại và giữ lại lịch sử.</p>
                      <Field
                        label="Ngày chuyển đi"
                        name="ngay"
                        type="date"
                        required
                        min={minDay}
                        max={today()}
                        defaultValue={today()}
                      />
                    </>
                  ) : (
                    <StayFields current={current} minDay={minDay} />
                  )}
                  {mode === "chuyen_can" && (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="chuyen_phuong_tien"
                        value="1"
                        defaultChecked
                      />{" "}
                      Chuyển đăng ký xe đang gửi sang căn mới
                    </label>
                  )}
                  {mode === "chuyen_can" && (
                    <p>
                      Đăng ký xe ở căn cũ sẽ kết thúc cùng ngày chuyển. Khi chọn
                      chuyển xe, hệ thống tạo đăng ký mới và giữ lịch sử căn cũ.
                    </p>
                  )}
                  {mode === "chuyen_di" && (
                    <p>
                      Tất cả đăng ký xe đang gửi của cư dân sẽ kết thúc cùng
                      ngày chuyển đi và được giữ trong lịch sử.
                    </p>
                  )}
                  <button className="primary">
                    {action.pending ? "Đang lưu…" : "Xác nhận lưu"}
                  </button>
                </fieldset>
              </form>
              <button disabled={action.pending} onClick={() => setMode("")}>
                Hủy
              </button>
            </section>
          )}
          <section className="card">
            <h2>Lịch sử cư trú</h2>
            <p>
              Ngày kết thúc không thuộc đợt cũ; khi chuyển căn, đợt mới bắt đầu
              cùng ngày đó. Các đợt bắt đầu và kết thúc cùng ngày được giữ để
              ghi nhận chuyển trong ngày; hệ thống không phân chia theo giờ.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Quan hệ</th>
                    <th>Từ ngày</th>
                    <th>Đến trước ngày</th>
                    <th>Người ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {resident.history.map((s) => (
                    <tr key={s.ma_lich_su_cu_tru}>
                      <td>{s.so_can_ho}</td>
                      <td>{relations[s.quan_he]}</td>
                      <td>{s.tu_ngay}</td>
                      <td>
                        {s.den_ngay || "Đang ở"}
                        {s.den_ngay === s.tu_ngay && (
                          <small> · Chuyển trong ngày</small>
                        )}
                      </td>
                      <td>{s.nguoi_ghi_nhan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
```

### 21. `frontend/src/features/vehicles/Vehicles.jsx` — Thay toàn bộ

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const types = { O_TO: "Ô tô", XE_MAY: "Xe máy", XE_DAP: "Xe đạp" };
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const formValues = (event) =>
  Object.fromEntries(new FormData(event.currentTarget));

function OwnerPicker({ initialId, onChoose }) {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState(null);
  const resource = useResource(
    `/cu_dan?trang_thai=DANG_O&q=${encodeURIComponent(q)}${!q && initialId ? `&ma_cu_dan=${initialId}` : ""}`,
  );
  const matches = resource.result?.data || [];
  function choose(id) {
    const owner = matches.find((r) => String(r.ma_cu_dan) === id) || null;
    setSelected(owner);
    onChoose(owner);
  }
  return (
    <>
      <Field label="Tìm cư dân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Cư dân đăng ký xe">
        <select
          name="ma_cu_dan"
          required
          value={selected?.ma_cu_dan || ""}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="">Chọn cư dân đang ở</option>
          {selected &&
            !matches.some((r) => r.ma_cu_dan === selected.ma_cu_dan) && (
              <option value={selected.ma_cu_dan}>
                {selected.ho_va_ten} · {selected.so_dien_thoai} · Căn{" "}
                {selected.so_can_ho}
              </option>
            )}
          {matches.map((r) => (
            <option value={r.ma_cu_dan} key={r.ma_cu_dan}>
              {r.ho_va_ten} · {r.so_dien_thoai} · Căn {r.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      <input
        type="hidden"
        name="ma_lich_su_cu_tru"
        value={selected?.ma_lich_su_cu_tru || ""}
      />
      {selected && (
        <p>
          Căn chịu phí: <strong>{selected.so_can_ho}</strong> · Cư trú từ{" "}
          {selected.tu_ngay}.
        </p>
      )}
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} cư dân phù hợp. Nhập tên hoặc số điện thoại
          cụ thể để tìm.
        </small>
      )}
    </>
  );
}

function VehicleForm({ initialId, pending, onSave }) {
  const [type, setType] = useState("XE_MAY"),
    [owner, setOwner] = useState(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formValues(e));
      }}
    >
      <fieldset disabled={pending}>
        <OwnerPicker initialId={initialId} onChoose={setOwner} />
        <Field label="Loại xe">
          <select
            name="loai_xe"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        <Field
          label={type === "XE_DAP" ? "Biển số (tùy chọn)" : "Biển số"}
          name="bien_so"
          required={type !== "XE_DAP"}
          maxLength={30}
          placeholder="Ví dụ: 59A-123.45"
        />
        <div className="form-grid">
          <Field label="Hãng xe" name="hang_xe" maxLength={50} />
          <Field label="Màu sắc" name="mau_sac" maxLength={50} />
        </div>
        <Field
          label="Ngày đăng ký xe"
          name="ngay_dang_ky"
          type="date"
          required
          min={owner?.tu_ngay || "1900-01-01"}
          max={today()}
          defaultValue={today()}
        />
        <small>
          Ngày đăng ký từ ngày bắt đầu đợt cư trú đến hôm nay. Xe đạp không bắt
          buộc có biển số.
        </small>
        <button className="primary" disabled={!owner}>
          {pending ? "Đang lưu…" : "Lưu đăng ký xe"}
        </button>
      </fieldset>
    </form>
  );
}

function VehicleDetail({ id }) {
  const resource = useResource(`/phuong_tien/${id}`),
    record = resource.result?.data;
  return (
    <section className="card">
      <h2>Chi tiết đăng ký xe</h2>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {record && (
        <>
          <h3>
            {record.ma_dang_ky} · {types[record.loai_xe]} ·{" "}
            {record.bien_so || "Không có biển số"}
          </h3>
          <p>
            <Link to={`/quan-tri/cu-dan/${record.ma_cu_dan}`}>
              {record.ho_va_ten}
            </Link>{" "}
            · {record.so_dien_thoai} · Căn chịu phí: {record.so_can_ho}
          </p>
          <p>
            Hãng xe: {record.hang_xe || "—"} · Màu sắc: {record.mau_sac || "—"}
          </p>
          <p>
            Từ ngày {record.ngay_dang_ky} ·{" "}
            {record.ngay_ket_thuc
              ? `Kết thúc trước ngày ${record.ngay_ket_thuc}`
              : "Đang gửi"}{" "}
            · Người tạo: {record.nguoi_tao}
          </p>
          {record.ngay_ket_thuc && (
            <p>
              Lý do kết thúc: {record.ly_do_ket_thuc} · Người ghi nhận:{" "}
              {record.nguoi_ket_thuc}
            </p>
          )}
          {record.ngay_ket_thuc === record.ngay_dang_ky && (
            <p>Đăng ký kết thúc trong ngày; bản ghi được giữ để xem lịch sử.</p>
          )}
          {record.ma_dang_ky_truoc && (
            <p>
              Chuyển tiếp từ{" "}
              <Link
                to={`/quan-tri/phuong-tien?q=${encodeURIComponent(record.dang_ky_truoc)}`}
              >
                {record.dang_ky_truoc}
              </Link>
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function Vehicles() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/phuong_tien?${params}`);
  const [adding, setAdding] = useState(false),
    [ending, setEnding] = useState(null),
    [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function save(path, body, message) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      await getJson(path, { method: "POST", body });
      setAdding(false);
      setEnding(null);
      setSelected(null);
      setNotice(message);
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  function go(page) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  }
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phương tiện</h1>
          <p>Quản lý đăng ký xe và căn hộ chịu phí theo từng đợt cư trú.</p>
        </div>
        <button
          className="primary"
          disabled={pending}
          onClick={() => {
            setAdding(!adding);
            setEnding(null);
          }}
        >
          {adding ? "Đóng biểu mẫu" : "Đăng ký xe"}
        </button>
      </div>
      <DataTools
        kind="phuong_tien"
        params={params}
        importable
        disabled={resource.loading}
      />
      {params.get("ma_cu_dan") && (
        <p>
          Đang lọc xe của cư dân #{params.get("ma_cu_dan")} ·{" "}
          <Link to="/quan-tri/phuong-tien">Xem tất cả</Link>
        </p>
      )}
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
      {adding && (
        <section className="card narrow">
          <h2>Đăng ký xe mới</h2>
          <VehicleForm
            initialId={params.get("ma_cu_dan")}
            pending={pending}
            onSave={(body) => save("/phuong_tien", body, "Đã tạo đăng ký xe.")}
          />
        </section>
      )}
      {ending && (
        <section className="card narrow">
          <h2>Kết thúc đăng ký {ending.ma_dang_ky}</h2>
          <p>
            {ending.bien_so || types[ending.loai_xe]} · Căn {ending.so_can_ho}.
            Bản ghi cũ sẽ được giữ trong lịch sử.
          </p>
          <form
            key={ending.ma_phuong_tien}
            onSubmit={(e) => {
              e.preventDefault();
              save(
                `/phuong_tien/${ending.ma_phuong_tien}/ket_thuc`,
                { ...formValues(e), phien_ban: ending.phien_ban },
                "Đã kết thúc đăng ký xe.",
              );
            }}
          >
            <fieldset disabled={pending}>
              <Field
                label="Ngày kết thúc đăng ký xe"
                name="ngay_ket_thuc"
                type="date"
                required
                min={ending.ngay_dang_ky}
                max={today()}
                defaultValue={today()}
              />
              <Field
                label="Lý do kết thúc"
                name="ly_do_ket_thuc"
                required
                minLength={3}
                maxLength={255}
              />
              <button className="primary">
                {pending ? "Đang lưu…" : "Xác nhận kết thúc"}
              </button>
            </fieldset>
          </form>
          <button disabled={pending} onClick={() => setEnding(null)}>
            Hủy
          </button>
        </section>
      )}
      <form
        key={params.toString()}
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(formValues(e));
          if (params.has("ma_cu_dan"))
            next.set("ma_cu_dan", params.get("ma_cu_dan"));
          setParams(next);
        }}
      >
        <Field
          label="Tìm biển số, mã đăng ký, cư dân hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại xe">
          <select name="loai_xe" defaultValue={params.get("loai_xe") || ""}>
            <Options values={types} empty="Tất cả loại xe" />
          </select>
        </Field>
        <Field label="Tình trạng đăng ký">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả đăng ký</option>
            <option value="DANG_GUI">Đang gửi</option>
            <option value="DA_KET_THUC">Đã kết thúc</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đăng ký</th>
                <th>Loại / biển số</th>
                <th>Cư dân</th>
                <th>Căn chịu phí</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((v) => (
                <tr key={v.ma_phuong_tien}>
                  <td>{v.ma_dang_ky}</td>
                  <td>
                    {types[v.loai_xe]}
                    <br />
                    {v.bien_so || "Không có biển số"}
                  </td>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${v.ma_cu_dan}`}>
                      {v.ho_va_ten}
                    </Link>
                  </td>
                  <td>{v.so_can_ho}</td>
                  <td>
                    {v.ngay_dang_ky}
                    <br />
                    {v.ngay_ket_thuc
                      ? `Đến trước ${v.ngay_ket_thuc}`
                      : "Đang gửi"}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setSelected(v.ma_phuong_tien)}>
                        Chi tiết
                      </button>
                      {!v.ngay_ket_thuc && (
                        <button
                          disabled={pending}
                          onClick={() => {
                            setEnding(v);
                            setAdding(false);
                          }}
                        >
                          Kết thúc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có đăng ký xe phù hợp.</p>
        )}
        <div className="actions">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {total} đăng ký
          </span>
          <button
            disabled={resource.loading || page * 20 >= total}
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
      {selected && <VehicleDetail id={selected} />}
    </>
  );
}
```

### 22. `frontend/src/features/billing/Billing.jsx` — Thay toàn bộ

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { banks, bankName, bankSearch } from "./banks.js";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
// Format API decimal strings without losing precision or displaying trailing zeros.
const number = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ""));
  if (!match) return "—";
  const fraction = (match[2] || "").replace(/0+$/, "");
  return `${BigInt(match[1]).toLocaleString("vi-VN")}${fraction ? `,${fraction}` : ""}`;
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice(
        path.endsWith("/nhac_phi")
          ? r.data.da_ton_tai
            ? "Hóa đơn này đã được nhắc trên web hôm nay."
            : "Đã gửi nhắc thanh toán vào hộp thông báo trên web."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {number(tier.don_gia)} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      number(r.don_gia)
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {number(r.thue_gtgt)}%</small>
                    )}
                  </td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <DataTools
        kind="chi_so"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{number(r.chi_so_cu)}</td>
                  <td>{number(r.chi_so_moi)}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <button
            className="primary"
            disabled={action.pending}
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
          </button>
        )}
      </div>
      <Feedback action={action} />
      {admin && (
        <DataTools kind="hoa_don" params={params} disabled={resource.loading} />
      )}
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function BankSelect() {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const matches = banks.filter((bank) =>
    bankSearch(`${bank.shortName} ${bank.name} ${bank.bin}`).includes(
      bankSearch(query),
    ),
  );
  const current = banks.find((bank) => bank.bin === selected);
  const option = (bank) => (
    <option key={bank.bin} value={bank.bin}>
      {bank.shortName} — {bank.name}
    </option>
  );
  return (
    <div className="bank-picker">
      <Field label="Tìm ngân hàng">
        <input
          type="search"
          value={query}
          maxLength={100}
          placeholder="Nhập tên ngân hàng, ví dụ Vietcombank"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <Field label="Ngân hàng nhận tiền">
        <select
          name="ma_ngan_hang"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Chọn ngân hàng</option>
          {current &&
            !matches.some((bank) => bank.bin === selected) &&
            option(current)}
          {matches.map(option)}
        </select>
      </Field>
      {!matches.length && (
        <p className="muted">
          Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.
        </p>
      )}
      {current && (
        <p className="bank-selection">
          Đã chọn: <strong>{current.shortName}</strong>
        </p>
      )}
    </div>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section
      className="card payment-card"
      aria-label="Thông tin thanh toán hóa đơn"
    >
      <header className="payment-header">
        <span className="payment-status">Chờ thanh toán</span>
        <h2>Chuyển khoản bằng VietQR</h2>
        <p>
          Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan}
        </p>
      </header>
      <div className="payment-body">
        <p className="payment-amount-label">Số tiền cần thanh toán</p>
        <p className="payment-amount">{money(bill.tong_tien)}</p>
        <div className="payment-qr-frame">
          <span className="payment-qr-brand">VIETQR</span>
          {image ? (
            <img
              src={image}
              alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
              width="320"
              height="320"
            />
          ) : (
            !error && <p role="status">Đang tạo mã QR…</p>
          )}
          <ErrorBox error={error} />
          <span className="payment-qr-caption">
            Quét mã bằng ứng dụng ngân hàng
          </span>
        </div>
        <dl className="payment-details">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{bankName(bill.ma_ngan_hang)}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd className="payment-account">{bill.so_tai_khoan}</dd>
          </div>
          <div>
            <dt>Người nhận</dt>
            <dd>{bill.ten_nguoi_nhan}</dd>
          </div>
          <div className="payment-reference">
            <dt>Nội dung chuyển khoản</dt>
            <dd>{bill.so_hoa_don}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{bill.han_thanh_toan?.split("-").reverse().join("/")}</dd>
          </div>
        </dl>
        {image && (
          <a
            className="button payment-download"
            href={image}
            download={`VietQR-${bill.so_hoa_don}.png`}
          >
            Tải mã QR
          </a>
        )}
        <p className="payment-notice">
          Kiểm tra người nhận, số tiền và giữ đúng nội dung chuyển khoản. Ban
          quản lý sẽ xác nhận sau khi đối soát giao dịch.
        </p>
      </div>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          <p className="muted">
            Người phụ trách thanh toán hiện tại:{" "}
            <strong>
              {bill.nguoi_phu_trach_thanh_toan || "Chưa gắn chủ hộ"}
            </strong>
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card bill-lines">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td className="bill-number">{number(l.so_luong)}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td className="bill-number">{number(l.don_gia)} đ</td>
                      <td className="bill-number bill-line-total">
                        {money(l.thanh_tien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="bill-total">Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow bill-publish">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <p className="muted">
                Chọn ngân hàng và điền thông tin nhận tiền để tạo mã thanh toán
                cho hóa đơn.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <BankSelect />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Nhắc phí và xác nhận thu tiền</h2>
              <p className="muted">
                Gửi vào hộp thông báo của tài khoản căn hộ và người phụ trách
                thanh toán hiện tại. Mỗi hóa đơn được nhắc tối đa một lần trong
                ngày.
              </p>
              <button disabled={action.pending} onClick={() => run("nhac_phi")}>
                Nhắc thanh toán trên web
              </button>
              <h3>Xác nhận thu tiền</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```

### 23. `frontend/src/features/maintenance/Maintenance.jsx` — Thay toàn bộ

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
import { useAuth } from "../auth/Auth.jsx";
const types = {
  THANG_MAY: "Thang máy",
  MAY_BOM: "Máy bơm",
  PCCC: "PCCC",
  DIEN: "Điện",
  NUOC: "Nước",
  CAMERA: "Camera",
  KHAC: "Khác",
};
const equipmentStates = {
  DANG_SU_DUNG: "Đang sử dụng",
  TAM_DUNG: "Tạm dừng",
  NGUNG_SU_DUNG: "Ngừng sử dụng",
};
const states = {
  MOI: "Chưa phân công",
  DA_PHAN_CONG: "Đã phân công",
  DANG_THUC_HIEN: "Đang thực hiện",
  CHO_NGHIEM_THU: "Chờ nghiệm thu",
  HOAN_THANH: "Hoàn thành",
  HUY: "Đã hủy",
};
const levels = { THUONG: "Bình thường", CAO: "Cao", KHAN_CAP: "Khẩn cấp" };
const schedules = {
  QUA_HAN: "Quá hạn",
  SAP_DEN_HAN: "Sắp / đến hạn",
  CHUA_DEN_HAN: "Chưa đến hạn",
  CHUA_CAU_HINH: "Chưa có lịch",
  NGUNG_THEO_DOI: "Ngừng theo dõi",
};
const events = {
  TAO_THIET_BI: "Tạo thiết bị",
  SUA_THIET_BI: "Sửa thiết bị",
  LAP_PHIEU: "Lập phiếu",
  PHAN_CONG: "Phân công",
  DOI_LICH: "Đổi lịch",
  BAT_DAU: "Bắt đầu",
  BAO_CAO: "Báo cáo kết quả",
  TRA_LAI: "Trả lại thực hiện",
  NGHIEM_THU: "Nghiệm thu",
  HUY: "Hủy phiếu",
};
const day = (x) => (x ? x.split("-").reverse().join("/") : "—");
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const time = (x) =>
  x
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(x.replace(" ", "T") + "Z"))
    : "—";
const code = (id) => `BT${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((n) => n + 1),
  };
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice(
        r.data.replay
          ? "Phiếu đã được tạo trước đó. Đã mở lại đúng phiếu."
          : "Đã lưu thay đổi bảo trì.",
      );
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function History({ items, title = "Lịch sử thực hiện" }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ol className="maintenance-history">
        {items.map((h) => (
          <li key={h.ma_lich_su}>
            <div>
              <strong>{events[h.su_kien] || h.su_kien}</strong>
              <time>
                {time(h.ngay_tao)} · {h.ho_va_ten}
              </time>
            </div>
            <p>{h.ghi_chu}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(n) {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function TechnicianSelect({ required = false }) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(""),
    [label, setLabel] = useState(""),
    resource = useData(
      `/bao_tri/ky_thuat_vien?q=${encodeURIComponent(q)}&page=${page}`,
    ),
    matches = resource.result?.data || [];
  return (
    <div className="maintenance-staff">
      <Field label="Tìm kỹ thuật viên theo tên">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Kỹ thuật viên nhận phiếu">
        <select
          name="ma_ky_thuat_vien"
          required={required}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setLabel(e.target.selectedOptions[0].text);
          }}
        >
          <option value="">
            {required ? "Chọn kỹ thuật viên" : "Chưa phân công"}
          </option>
          {selected &&
            !matches.some((u) => String(u.ma_nguoi_dung) === selected) && (
              <option value={selected}>{label}</option>
            )}
          {matches.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten}
              {u.chuyen_mon ? ` · ${u.chuyen_mon}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading || page === 1}
          onClick={() => setPage((n) => n - 1)}
        >
          KTV trang trước
        </button>
        <span>Trang {page}</span>
        <button
          type="button"
          disabled={
            resource.loading || page * 20 >= (resource.result?.total || 0)
          }
          onClick={() => setPage((n) => n + 1)}
        >
          KTV trang sau
        </button>
      </div>
    </div>
  );
}
function EquipmentForm({ initial, action, onSave }) {
  return (
    <form
      key={initial?.phien_ban ?? "new"}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values(e));
      }}
    >
      <fieldset disabled={action.pending}>
        {!initial ? (
          <Field
            label="Mã tài sản"
            name="ma_tai_san"
            required
            minLength={2}
            maxLength={30}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,29}"
            placeholder="Ví dụ TM-A-01"
          />
        ) : (
          <p>
            Mã tài sản: <strong>{initial.ma_tai_san}</strong>
          </p>
        )}
        <div className="form-grid">
          <Field
            label="Tên thiết bị"
            name="ten_thiet_bi"
            required
            minLength={2}
            maxLength={150}
            defaultValue={initial?.ten_thiet_bi || ""}
          />
          <Field label="Loại thiết bị">
            <select name="loai" defaultValue={initial?.loai || "THANG_MAY"}>
              <Options values={types} />
            </select>
          </Field>
          <Field
            label="Vị trí lắp đặt"
            name="vi_tri"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initial?.vi_tri || ""}
          />
          <Field
            label="Số serial"
            name="so_serial"
            maxLength={100}
            defaultValue={initial?.so_serial || ""}
          />
          <Field
            label="Ngày lắp đặt"
            name="ngay_lap_dat"
            type="date"
            max={today()}
            defaultValue={initial?.ngay_lap_dat || ""}
          />
          <Field label="Trạng thái thiết bị">
            <select
              name="trang_thai"
              defaultValue={initial?.trang_thai || "DANG_SU_DUNG"}
            >
              <Options values={equipmentStates} />
            </select>
          </Field>
        </div>
        <Field label="Ghi chú thiết bị">
          <textarea
            name="ghi_chu"
            rows={3}
            maxLength={1000}
            defaultValue={initial?.ghi_chu || ""}
          />
        </Field>
        <h3>Lịch bảo trì định kỳ</h3>
        <p className="muted">
          Nhập cả chu kỳ và ngày kế tiếp; bỏ trống cả hai nếu chưa lập lịch.
          Ngày kế tiếp cập nhật sau khi BQL nghiệm thu phiếu định kỳ.
        </p>
        <div className="form-grid">
          <Field
            label="Chu kỳ bảo trì (ngày)"
            name="chu_ky_ngay"
            type="number"
            min="1"
            max="3650"
            step="1"
            defaultValue={initial?.chu_ky_ngay || ""}
          />
          <Field
            label="Ngày bảo trì kế tiếp"
            name="ngay_bao_tri_tiep_theo"
            type="date"
            defaultValue={initial?.ngay_bao_tri_tiep_theo || ""}
          />
          <Field
            label="Nhắc trước (ngày)"
            name="nhac_truoc_ngay"
            type="number"
            min="0"
            max="90"
            step="1"
            required
            defaultValue={initial?.nhac_truoc_ngay ?? 7}
          />
        </div>
        <button className="primary">
          {initial ? "Lưu thiết bị" : "Thêm thiết bị"}
        </button>
      </fieldset>
    </form>
  );
}
function NewJob({ equipment, type, action, onSave }) {
  const [key] = useState(newRequestKey);
  return (
    <section className="card narrow">
      <h2>{type === "DINH_KY" ? "Lập phiếu định kỳ" : "Lập phiếu đột xuất"}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...values(e),
            loai: type,
            khoa_yeu_cau: key,
            phien_ban_thiet_bi: equipment.phien_ban,
          });
        }}
      >
        <fieldset disabled={action.pending}>
          {type === "DINH_KY" ? (
            <p>
              Hạn thực hiện:{" "}
              <strong>{day(equipment.ngay_bao_tri_tiep_theo)}</strong> · Chu kỳ{" "}
              {equipment.chu_ky_ngay} ngày.
            </p>
          ) : (
            <>
              <Field
                label="Tiêu đề công việc"
                name="tieu_de"
                required
                minLength={3}
                maxLength={180}
              />
              <Field label="Nội dung cần thực hiện">
                <textarea
                  name="noi_dung"
                  required
                  minLength={3}
                  maxLength={2000}
                  rows={4}
                />
              </Field>
              <Field
                label="Hạn thực hiện"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={today()}
              />
            </>
          )}
          <Field label="Ưu tiên">
            <select name="do_uu_tien" defaultValue="THUONG">
              <Options values={levels} />
            </select>
          </Field>
          <TechnicianSelect />
          <button className="primary">Tạo phiếu bảo trì</button>
        </fieldset>
      </form>
    </section>
  );
}
export function EquipmentList() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/thiet_bi?${params}`),
    [adding, setAdding] = useState(false),
    action = useAction(),
    navigate = useNavigate(),
    s = resource.result?.summary;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vận hành thiết bị</p>
          <h1>Thiết bị và lịch bảo trì</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/quan-tri/bao-tri">
            Danh sách phiếu bảo trì
          </Link>
          <button className="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Đóng biểu mẫu" : "Thêm thiết bị"}
          </button>
        </div>
      </div>
      <Feedback action={action} />
      <DataTools
        kind="thiet_bi"
        params={params}
        importable
        disabled={resource.loading}
      />
      {adding && (
        <section className="card">
          <h2>Đăng ký thiết bị</h2>
          <EquipmentForm
            action={action}
            onSave={(body) =>
              action.run("/thiet_bi", "POST", body, (e) =>
                navigate(`/quan-tri/thiet-bi/${e.ma_thiet_bi}`),
              )
            }
          />
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm mã, tên hoặc vị trí thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại thiết bị">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả loại" />
          </select>
        </Field>
        <Field label="Lọc trạng thái thiết bị">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={equipmentStates} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Lọc lịch bảo trì">
          <select name="lich" defaultValue={params.get("lich") || ""}>
            <option value="">Tất cả lịch</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="SAP_DEN_HAN">Sắp / đến hạn</option>
            <option value="CHUA_CAU_HINH">Chưa có lịch</option>
          </select>
        </Field>
        <button>Lọc thiết bị</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {s && (
        <>
          <p className="muted">
            Trong bộ lọc · Ngày {day(resource.result.ngay_hien_tai)} tại Việt
            Nam
          </p>
          <div className="maintenance-stats">
            <div className="card">
              <span>Thiết bị</span>
              <strong>{s.total}</strong>
            </div>
            <div className="card">
              <span>Sắp / đến hạn</span>
              <strong>{s.sap_den_han}</strong>
            </div>
            <div className="card">
              <span>Quá hạn</span>
              <strong className="maintenance-overdue">{s.qua_han}</strong>
            </div>
          </div>
        </>
      )}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã / thiết bị</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Bảo trì kế tiếp</th>
                <th>Lịch</th>
                <th>Phiếu định kỳ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((e) => (
                <tr key={e.ma_thiet_bi}>
                  <td>
                    <Link to={`/quan-tri/thiet-bi/${e.ma_thiet_bi}`}>
                      {e.ma_tai_san}
                    </Link>
                    <small className="maintenance-subtitle">
                      {e.ten_thiet_bi} · {types[e.loai]}
                    </small>
                  </td>
                  <td>{e.vi_tri}</td>
                  <td>{equipmentStates[e.trang_thai]}</td>
                  <td>
                    {day(e.ngay_bao_tri_tiep_theo)}
                    {e.chu_ky_ngay && (
                      <small className="maintenance-subtitle">
                        Mỗi {e.chu_ky_ngay} ngày
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={`maintenance-tag due-${e.tinh_trang_lich}`}
                    >
                      {schedules[e.tinh_trang_lich]}
                    </span>
                  </td>
                  <td>
                    {e.phieu_dinh_ky_dang_mo ? (
                      <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                        {code(e.phieu_dinh_ky_dang_mo)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có thiết bị phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function EquipmentDetail() {
  const { id } = useParams(),
    resource = useData(`/thiet_bi/${id}`),
    e = resource.result?.data,
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(""),
    action = useAction(resource.reload),
    navigate = useNavigate();
  return (
    <>
      <Link to="/quan-tri/thiet-bi">← Danh sách thiết bị</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {e && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{e.ma_tai_san}</p>
              <h1>{e.ten_thiet_bi}</h1>
            </div>
            <button
              disabled={action.pending}
              onClick={() => {
                setEditing(!editing);
                setCreating("");
              }}
            >
              Sửa thiết bị / lịch
            </button>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Loại / trạng thái</dt>
                <dd>
                  {types[e.loai]} · {equipmentStates[e.trang_thai]}
                </dd>
              </div>
              <div>
                <dt>Vị trí</dt>
                <dd>{e.vi_tri}</dd>
              </div>
              <div>
                <dt>Serial / ngày lắp</dt>
                <dd>
                  {e.so_serial || "—"} · {day(e.ngay_lap_dat)}
                </dd>
              </div>
              <div>
                <dt>Ngày bảo trì kế tiếp</dt>
                <dd>
                  {day(e.ngay_bao_tri_tiep_theo)} ·{" "}
                  <span className={`maintenance-tag due-${e.tinh_trang_lich}`}>
                    {schedules[e.tinh_trang_lich]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Chu kỳ / nhắc trước</dt>
                <dd>
                  {e.chu_ky_ngay
                    ? `${e.chu_ky_ngay} ngày · nhắc trước ${e.nhac_truoc_ngay} ngày`
                    : "Chưa có lịch định kỳ"}
                </dd>
              </div>
            </dl>
            {e.ghi_chu && <p className="maintenance-text">{e.ghi_chu}</p>}
            <div className="actions">
              <Link
                className="button"
                to={`/quan-tri/bao-tri?ma_thiet_bi=${id}`}
              >
                Xem phiếu và lịch sử bảo trì
              </Link>
              {e.trang_thai !== "NGUNG_SU_DUNG" && (
                <>
                  <button
                    disabled={
                      !e.chu_ky_ngay ||
                      !!e.phieu_dinh_ky_dang_mo ||
                      action.pending
                    }
                    onClick={() => {
                      setCreating("DINH_KY");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu định kỳ
                  </button>
                  <button
                    disabled={action.pending}
                    onClick={() => {
                      setCreating("DOT_XUAT");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu đột xuất
                  </button>
                </>
              )}
              {e.phieu_dinh_ky_dang_mo && (
                <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                  Phiếu định kỳ đang mở: {code(e.phieu_dinh_ky_dang_mo)}
                </Link>
              )}
            </div>
          </section>
          {editing && (
            <section className="card">
              <h2>Sửa thông tin và lịch</h2>
              <EquipmentForm
                initial={e}
                action={action}
                onSave={(body) =>
                  action.run(
                    `/thiet_bi/${id}`,
                    "PUT",
                    { ...body, phien_ban: e.phien_ban },
                    () => setEditing(false),
                  )
                }
              />
            </section>
          )}
          {creating && (
            <NewJob
              key={creating}
              equipment={e}
              type={creating}
              action={action}
              onSave={(body) =>
                action.run(`/thiet_bi/${id}/phieu_bao_tri`, "POST", body, (j) =>
                  navigate(`/quan-tri/bao-tri/${j.ma_phieu_bao_tri}`),
                )
              }
            />
          )}
          <History items={e.history} title="Lịch sử thông tin thiết bị" />
        </>
      )}
    </>
  );
}
export function MaintenanceList() {
  const { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    [params, setParams] = useSearchParams(),
    resource = useData(`/bao_tri?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi thực hiện</p>
          <h1>{isAdmin ? "Phiếu bảo trì thiết bị" : "Bảo trì được giao"}</h1>
        </div>
        {isAdmin && (
          <Link className="button" to="/quan-tri/thiet-bi">
            Thiết bị và lịch
          </Link>
        )}
      </div>
      {isAdmin && (
        <DataTools kind="bao_tri" params={params} disabled={resource.loading} />
      )}
      <p className="muted">
        {isAdmin
          ? "Lập phiếu từ trang thiết bị. Phiếu định kỳ cập nhật lịch tiếp theo khi BQL nghiệm thu đạt."
          : "Chỉ hiển thị phiếu hiện đang được giao cho bạn. Báo cáo kết quả để BQL nghiệm thu."}
      </p>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams({
            ...values(e),
            ...(params.get("ma_thiet_bi")
              ? { ma_thiet_bi: params.get("ma_thiet_bi") }
              : {}),
          });
        }}
      >
        <Field
          label="Tìm phiếu, mã hoặc tên thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <option value="">Tất cả loại</option>
            <option value="DINH_KY">Định kỳ</option>
            <option value="DOT_XUAT">Đột xuất</option>
          </select>
        </Field>
        <Field label="Hạn thực hiện">
          <select name="qua_han" defaultValue={params.get("qua_han") || "0"}>
            <option value="0">Tất cả hạn</option>
            <option value="1">Chỉ phiếu quá hạn</option>
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_thiet_bi") && (
        <p className="note">
          Đang lọc riêng một thiết bị. <Link to={base}>Xem mọi thiết bị</Link>
        </p>
      )}
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Thiết bị</th>
                <th>Hạn / ưu tiên</th>
                <th>Trạng thái</th>
                <th>Kỹ thuật viên</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((j) => (
                <tr key={j.ma_phieu_bao_tri}>
                  <td>
                    <Link to={`${base}/${j.ma_phieu_bao_tri}`}>
                      {code(j.ma_phieu_bao_tri)}
                    </Link>
                    <small className="maintenance-subtitle">{j.tieu_de}</small>
                  </td>
                  <td>
                    {j.ma_tai_san}
                    <small className="maintenance-subtitle">
                      {j.ten_thiet_bi_luc_lap}
                    </small>
                  </td>
                  <td>
                    {day(j.ngay_den_han)} · {levels[j.do_uu_tien]}
                    {j.qua_han === 1 && (
                      <span className="maintenance-tag due-QUA_HAN">
                        Quá hạn
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`maintenance-tag work-${j.trang_thai}`}>
                      {states[j.trang_thai]}
                    </span>
                  </td>
                  <td>{j.ky_thuat_vien || "Chưa phân công"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có phiếu phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function ActionForm({ title, button, action, onSubmit, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values(e));
        }}
      >
        <fieldset disabled={action.pending}>
          {children}
          <button className="primary">{button}</button>
        </fieldset>
      </form>
    </section>
  );
}
export function MaintenanceDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    resource = useData(`/bao_tri/${id}`),
    j = resource.result?.data,
    action = useAction(resource.reload);
  const run = (name, body = {}) =>
    action.run(`/bao_tri/${id}/${name}`, "POST", {
      ...body,
      phien_ban: j.phien_ban,
    });
  const open = j && !["HOAN_THANH", "HUY"].includes(j.trang_thai);
  return (
    <>
      <Link to={base}>← Danh sách phiếu bảo trì</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {j && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {code(j.ma_phieu_bao_tri)} ·{" "}
                {j.loai === "DINH_KY" ? "Định kỳ" : "Đột xuất"}
              </p>
              <h1>{j.tieu_de}</h1>
            </div>
            <span className={`maintenance-tag work-${j.trang_thai}`}>
              {states[j.trang_thai]}
            </span>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Thiết bị lúc lập phiếu</dt>
                <dd>
                  {j.ma_tai_san} · {j.ten_thiet_bi_luc_lap}
                </dd>
              </div>
              <div>
                <dt>Vị trí lúc lập</dt>
                <dd>{j.vi_tri_luc_lap}</dd>
              </div>
              <div>
                <dt>Hạn thực hiện</dt>
                <dd>
                  {day(j.ngay_den_han)}
                  {j.qua_han && (
                    <span className="maintenance-tag due-QUA_HAN">Quá hạn</span>
                  )}{" "}
                  · {levels[j.do_uu_tien]}
                </dd>
              </div>
              <div>
                <dt>Kỹ thuật viên</dt>
                <dd>{j.ky_thuat_vien || "Chưa phân công"}</dd>
              </div>
              <div>
                <dt>Ngày lập / lượt thực hiện</dt>
                <dd>
                  {day(j.ngay_lap)} · Lượt {j.luot_thuc_hien}
                </dd>
              </div>
            </dl>
            <p className="maintenance-text">{j.noi_dung}</p>
            {(j.ten_hien_tai !== j.ten_thiet_bi_luc_lap ||
              j.vi_tri_hien_tai !== j.vi_tri_luc_lap) && (
              <p className="muted">
                Hiện tại: {j.ten_hien_tai} · {j.vi_tri_hien_tai}
              </p>
            )}
            {isAdmin && (
              <Link to={`/quan-tri/thiet-bi/${j.ma_thiet_bi}`}>
                Mở hồ sơ thiết bị
              </Link>
            )}
          </section>
          {j.ket_qua && (
            <section className="card">
              <h2>Kết quả thực hiện</h2>
              <p>
                Ngày thực hiện: {day(j.ngay_thuc_hien)} · Lượt{" "}
                {j.luot_thuc_hien}
              </p>
              <p className="maintenance-text">{j.ket_qua}</p>
              {j.nhan_xet_nghiem_thu && (
                <p className="note">
                  Nhận xét nghiệm thu: {j.nhan_xet_nghiem_thu}
                </p>
              )}
            </section>
          )}
          {!isAdmin && j.trang_thai === "DA_PHAN_CONG" && (
            <section className="card">
              <h2>Thực hiện công việc</h2>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() => run("bat_dau")}
              >
                Bắt đầu bảo trì
              </button>
            </section>
          )}
          {!isAdmin && j.trang_thai === "DANG_THUC_HIEN" && (
            <ActionForm
              title="Gửi kết quả để nghiệm thu"
              button="Gửi báo cáo bảo trì"
              action={action}
              onSubmit={(body) => run("bao_cao", body)}
            >
              <Field
                label="Ngày thực hiện"
                name="ngay_thuc_hien"
                type="date"
                required
                min={j.ngay_lap}
                max={today()}
                defaultValue={today()}
              />
              <Field label="Kết quả bảo trì">
                <textarea
                  name="ket_qua"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={6}
                  placeholder="Ghi rõ việc đã làm, tình trạng sau bảo trì và vấn đề còn lại."
                />
              </Field>
            </ActionForm>
          )}
          {isAdmin &&
            ["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"].includes(
              j.trang_thai,
            ) && (
              <ActionForm
                title={
                  j.ma_ky_thuat_vien ? "Đổi kỹ thuật viên" : "Giao công việc"
                }
                button="Lưu phân công"
                action={action}
                onSubmit={(body) => run("phan_cong", body)}
              >
                <TechnicianSelect required />
                <Field
                  label="Ghi chú / lý do đổi người"
                  name="ghi_chu"
                  required={!!j.ma_ky_thuat_vien}
                  minLength={j.ma_ky_thuat_vien ? 3 : 0}
                  maxLength={500}
                />
              </ActionForm>
            )}
          {isAdmin && ["MOI", "DA_PHAN_CONG"].includes(j.trang_thai) && (
            <ActionForm
              title="Điều chỉnh lịch thực hiện"
              button="Lưu lịch mới"
              action={action}
              onSubmit={(body) => run("doi_lich", body)}
            >
              <Field
                label="Hạn thực hiện mới"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={j.ngay_den_han}
              />
              <Field
                label="Lý do đổi lịch"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
            </ActionForm>
          )}
          {isAdmin && j.trang_thai === "CHO_NGHIEM_THU" && (
            <div className="maintenance-action-grid">
              <ActionForm
                title="Nghiệm thu kết quả"
                button="Nghiệm thu đạt"
                action={action}
                onSubmit={(body) => run("nghiem_thu", body)}
              >
                <Field label="Nhận xét nghiệm thu">
                  <textarea
                    name="nhan_xet"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                {j.loai === "DINH_KY" && (
                  <p className="muted">
                    Ngày bảo trì kế tiếp = ngày thực hiện đã nghiệm thu +{" "}
                    {j.chu_ky_ngay} ngày. Hệ thống không tự lập phiếu kỳ sau.
                  </p>
                )}
              </ActionForm>
              <ActionForm
                title="Yêu cầu thực hiện lại"
                button="Trả lại kỹ thuật viên"
                action={action}
                onSubmit={(body) => run("tra_lai", body)}
              >
                <Field label="Lý do chưa đạt">
                  <textarea
                    name="ly_do"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                <p className="muted">
                  Kết quả lượt trước giữ trong lịch sử. Kỹ thuật viên cần gửi
                  báo cáo mới.
                </p>
              </ActionForm>
            </div>
          )}
          {isAdmin && open && (
            <ActionForm
              title="Hủy phiếu"
              button="Hủy phiếu bảo trì"
              action={action}
              onSubmit={(body) => run("huy", body)}
            >
              <Field
                label="Lý do hủy phiếu"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
              <p className="muted">
                Hủy phiếu không cập nhật ngày bảo trì kế tiếp và không xóa lịch
                sử.
              </p>
            </ActionForm>
          )}
          {j.trang_thai === "HUY" && (
            <p className="note">Lý do hủy: {j.ly_do_huy}</p>
          )}
          <History items={j.history} />
        </>
      )}
    </>
  );
}
```

### 24. `frontend/src/features/amenities/Amenities.jsx` — Thay toàn bộ

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
const states = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
  DA_HUY: "Đã hủy",
};
const events = {
  DAT_LICH: "Đặt lịch",
  DUYET: "Duyệt lịch",
  TU_CHOI: "Từ chối",
  HUY: "Hủy lịch",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (s) => s.split("-").reverse().join("/");
const when = (s) => `${s.slice(11, 16)} · ${day(s.slice(0, 10))}`;
const auditTime = (s) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(s.replace(" ", "T") + "Z"));
const code = (id) => `DL${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) {
      setState({ path, revision, result: { data: null }, loading: false });
      return;
    }
    const c = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: c.signal })
      .then((result) => {
        if (!c.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!c.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => c.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((n) => n + 1),
  };
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice("Đã lưu thay đổi.");
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Status({ value }) {
  return (
    <span className={`amenity-status amenity-${value}`}>{states[value]}</span>
  );
}
function Nav({ admin, detail = false }) {
  const base = admin ? "/quan-tri" : "/cu-dan";
  return (
    <div className="actions">
      <Link to={`${base}/tien-ich`}>
        {detail ? "← Danh sách tiện ích" : "Tiện ích"}
      </Link>
      <Link to={`${base}/dat-lich`}>
        {admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}
      </Link>
    </div>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(n) {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function FacilityForm({ data, action, onSave, onCancel }) {
  return (
    <form
      className="card amenity-form"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_mo: b.dang_mo === "1",
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa tiện ích" : "Thêm tiện ích"}</h2>
      <Feedback action={action} />
      <Field label="Tên tiện ích">
        <input
          name="ten_tien_ich"
          required
          minLength={2}
          maxLength={120}
          defaultValue={data?.ten_tien_ich}
        />
      </Field>
      <Field label="Vị trí tiện ích">
        <input
          name="vi_tri"
          required
          minLength={2}
          maxLength={160}
          defaultValue={data?.vi_tri}
        />
      </Field>
      <Field label="Mô tả và quy định">
        <textarea
          name="mo_ta"
          rows={4}
          maxLength={2000}
          defaultValue={data?.mo_ta}
        />
      </Field>
      <div className="amenity-form-grid">
        <Field label="Sức chứa (người)">
          <input
            type="number"
            name="suc_chua"
            required
            min="1"
            max="1000"
            step="1"
            defaultValue={data?.suc_chua || 20}
          />
        </Field>
        <Field label="Mở nhận lịch">
          <select
            name="dang_mo"
            defaultValue={data ? String(Number(data.dang_mo)) : "1"}
          >
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng nhận lịch mới</option>
          </select>
        </Field>
        <Field label="Giờ mở cửa">
          <input
            type="time"
            name="gio_mo"
            step="1800"
            required
            defaultValue={data?.gio_mo.slice(0, 5) || "06:00"}
          />
        </Field>
        <Field label="Giờ đóng cửa">
          <input
            type="time"
            name="gio_dong"
            step="1800"
            required
            defaultValue={data?.gio_dong.slice(0, 5) || "22:00"}
          />
        </Field>
        <Field label="Tối đa mỗi lượt (phút)">
          <input
            type="number"
            name="toi_da_phut"
            min="30"
            max="360"
            step="30"
            required
            defaultValue={data?.toi_da_phut || 120}
          />
        </Field>
        <Field label="Được đặt trước tối đa (ngày)">
          <input
            type="number"
            name="dat_truoc_ngay"
            min="1"
            max="90"
            step="1"
            required
            defaultValue={data?.dat_truoc_ngay || 30}
          />
        </Field>
      </div>
      <p className="muted">
        Mỗi lượt dùng riêng tiện ích. Khung giờ theo bước 30 phút, trong cùng
        ngày. Tạm ngừng chỉ chặn lịch mới và giữ các lịch đã đặt. Cấu hình mới
        phải phù hợp với các lịch đang giữ chỗ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu tiện ích
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Amenities() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    [params, setParams] = useSearchParams(),
    resource = useData(`/tien_ich?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DỊCH VỤ CỘNG ĐỒNG</p>
          <h1>Tiện ích chung cư</h1>
          <p>Chọn không gian, xem lịch trống và đặt giờ sử dụng.</p>
        </div>
        {admin && (
          <button className="primary" onClick={() => setForm(true)}>
            Thêm tiện ích
          </button>
        )}
      </div>
      <Nav admin={admin} />
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(new URLSearchParams(values(e)));
        }}
      >
        <Field label="Tìm tiện ích">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tên hoặc vị trí"
          />
        </Field>
        <Field label="Trạng thái nhận lịch">
          <select name="dang_mo" defaultValue={params.get("dang_mo") ?? ""}>
            <option value="">Tất cả</option>
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FacilityForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/tien_ich", "POST", b, (d) =>
              navigate(`${base}/tien-ich/${d.ma_tien_ich}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-cards">
          {resource.result?.data.map((f) => (
            <article className="card amenity-card" key={f.ma_tien_ich}>
              <span
                className={`amenity-open ${f.dang_mo ? "" : "amenity-paused"}`}
              >
                {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch"}
              </span>
              <h2>
                <Link to={`${base}/tien-ich/${f.ma_tien_ich}`}>
                  {f.ten_tien_ich}
                </Link>
              </h2>
              <p>{f.vi_tri}</p>
              <p className="amenity-description">
                {f.mo_ta || "Chưa có mô tả."}
              </p>
              <div className="amenity-card-meta">
                <span>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </span>
                <span>Tối đa {f.suc_chua} người</span>
                <span>{f.toi_da_phut} phút / lượt</span>
              </div>
              <Link
                className="button primary"
                to={`${base}/tien-ich/${f.ma_tien_ich}`}
              >
                Xem lịch trống
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card muted">Chưa có tiện ích phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
function Availability({ id, date, refresh, onChoose, selected }) {
  const resource = useData(
    `/tien_ich/${id}/lich?ngay=${date}&refresh=${refresh}`,
  );
  return (
    <section className="card">
      <div className="page-heading">
        <div>
          <h2>Lịch trống ngày {day(date)}</h2>
          <p className="muted">
            Giờ Việt Nam · Ô đã đặt gồm lịch chờ duyệt và đã duyệt.
          </p>
        </div>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-slots">
          {resource.result?.data.slots.map((s) => (
            <button
              type="button"
              key={s.gio_bat_dau}
              disabled={s.da_dat || !s.co_the_dat}
              className={
                s.da_dat
                  ? "amenity-slot-booked"
                  : selected === s.gio_bat_dau
                    ? "amenity-slot-selected"
                    : ""
              }
              aria-pressed={selected === s.gio_bat_dau}
              onClick={() => onChoose?.(s)}
              aria-label={`${s.gio_bat_dau} – ${s.gio_ket_thuc}: ${s.da_dat ? "Đã đặt" : s.co_the_dat ? "Còn trống" : "Không nhận lịch"}`}
            >
              <strong>
                {s.gio_bat_dau} – {s.gio_ket_thuc}
              </strong>
              <small>
                {s.da_dat
                  ? "Đã đặt"
                  : s.co_the_dat
                    ? "Còn trống"
                    : "Không nhận lịch"}
              </small>
            </button>
          ))}
        </div>
      )}
      <p className="muted">
        Lịch trống có thể thay đổi. Hệ thống kiểm tra lại khi bạn gửi yêu cầu.
      </p>
    </section>
  );
}
export function AmenityDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    resource = useData(`/tien_ich/${id}`),
    [editing, setEditing] = useState(false),
    [date, setDate] = useState(today),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [refresh, setRefresh] = useState(0),
    [requestKey, setRequestKey] = useState(newRequestKey),
    context = useData(admin ? null : "/cua_toi/dat_lich/ngu_canh"),
    navigate = useNavigate();
  const edit = useAction(() => {
      setEditing(false);
      resource.reload();
      setRefresh((n) => n + 1);
    }),
    book = useAction(),
    f = resource.result?.data;
  // A changed form is a different request. An unchanged retry keeps its original key.
  function changed() {
    setRequestKey(newRequestKey());
  }
  return (
    <>
      <Nav admin={admin} detail />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <section className="card amenity-hero">
              <div>
                <p className="eyebrow">TIỆN ÍCH CỘNG ĐỒNG</p>
                <h1>{f.ten_tien_ich}</h1>
                <p>{f.vi_tri}</p>
                <span className="amenity-open">
                  {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch mới"}
                </span>
              </div>
              <div className="amenity-hero-meta">
                <strong>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </strong>
                <span>
                  {f.suc_chua} người · {f.toi_da_phut} phút / lượt
                </span>
                <span>Đặt trước tối đa {f.dat_truoc_ngay} ngày</span>
              </div>
              <p className="amenity-text">
                {f.mo_ta || "Chưa có quy định bổ sung."}
              </p>
              {admin && (
                <button onClick={() => setEditing(true)}>Sửa tiện ích</button>
              )}
            </section>
            {editing && (
              <FacilityForm
                key={f.phien_ban}
                data={f}
                action={edit}
                onCancel={() => setEditing(false)}
                onSave={(b) => edit.run(`/tien_ich/${id}`, "PUT", b)}
              />
            )}
            <div className="card amenity-calendar-toolbar">
              <Field label="Ngày sử dụng">
                <input
                  type="date"
                  value={date}
                  min={today()}
                  required
                  onChange={(e) => {
                    if (e.target.value) {
                      setDate(e.target.value);
                      setStart("");
                      setEnd("");
                      changed();
                    }
                  }}
                />
              </Field>
              <button type="button" onClick={() => setRefresh((n) => n + 1)}>
                Tải lại lịch trống
              </button>
            </div>
            <Availability
              id={id}
              date={date}
              refresh={refresh}
              selected={start}
              onChoose={(s) => {
                if (!admin) {
                  setStart(s.gio_bat_dau);
                  setEnd(s.gio_ket_thuc);
                  changed();
                }
              }}
            />
            {!admin && (
              <section className="card amenity-booking-form">
                <h2>Đặt lịch sử dụng</h2>
                <ErrorBox error={context.error} />
                {context.loading ? (
                  <Loading />
                ) : !context.result?.data ? (
                  <p className="note">
                    Cần liên kết tài khoản với cư dân đang ở; tài khoản căn hộ
                    cần chủ hộ đang phụ trách. Hãy liên hệ BQL để được cập nhật.
                  </p>
                ) : (
                  <>
                    <p>
                      Đặt cho{" "}
                      <strong>căn {context.result.data.so_can_ho}</strong> ·{" "}
                      {context.result.data.ho_va_ten}
                    </p>
                    <p className="muted">
                      Một lượt giữ riêng tiện ích. Chờ BQL duyệt trước khi sử
                      dụng. Bạn có thể hủy trước giờ bắt đầu. Chức năng này chưa
                      thu phí tiện ích.
                    </p>
                    <form
                      onChange={changed}
                      onSubmit={(e) => {
                        e.preventDefault();
                        book.run(
                          `/tien_ich/${id}/dat_lich`,
                          "POST",
                          {
                            ...values(e),
                            ngay: date,
                            khoa_yeu_cau: requestKey,
                            phien_ban_tien_ich: f.phien_ban,
                          },
                          (d) => navigate(`/cu-dan/dat-lich/${d.ma_dat_lich}`),
                        );
                      }}
                    >
                      <Feedback action={book} />
                      <div className="amenity-form-grid">
                        <Field label="Giờ bắt đầu">
                          <input
                            name="gio_bat_dau"
                            type="time"
                            step="1800"
                            required
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                          />
                        </Field>
                        <Field label="Giờ kết thúc">
                          <input
                            name="gio_ket_thuc"
                            type="time"
                            step="1800"
                            required
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                          />
                        </Field>
                        <Field label="Số người tham gia">
                          <input
                            name="so_nguoi"
                            type="number"
                            min="1"
                            max={f.suc_chua}
                            required
                            defaultValue="1"
                          />
                        </Field>
                      </div>
                      <Field label="Ghi chú đặt lịch">
                        <textarea name="ghi_chu" rows={3} maxLength={1000} />
                      </Field>
                      <button
                        className="primary"
                        disabled={book.pending || !f.dang_mo}
                      >
                        Gửi yêu cầu đặt lịch
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
export function Bookings() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    [params, setParams] = useSearchParams(),
    resource = useData(`${api}?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ĐẶT LỊCH TIỆN ÍCH</p>
          <h1>{admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}</h1>
          <p>
            {admin
              ? "Duyệt yêu cầu và điều phối khung giờ sử dụng."
              : "Tài khoản căn hộ xem lịch của căn; tài khoản cá nhân xem lịch tự đặt."}
          </p>
        </div>
      </div>
      <Nav admin={admin} />
      {admin && (
        <DataTools
          kind="dat_lich"
          params={params}
          disabled={resource.loading}
        />
      )}
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_tien_ich"))
            b.ma_tien_ich = params.get("ma_tien_ich");
          setParams(new URLSearchParams(b));
        }}
      >
        <Field label="Tìm lượt đặt">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tiện ích, căn hộ, người đặt"
          />
        </Field>
        <Field label="Ngày đặt sử dụng">
          <input
            type="date"
            name="ngay"
            defaultValue={params.get("ngay") || ""}
          />
        </Field>
        <Field label="Trạng thái lượt đặt">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc lịch đặt</button>
      </form>
      {params.get("ma_tien_ich") && (
        <p className="note">
          Đang lọc theo tiện ích #{params.get("ma_tien_ich")}.{" "}
          <Link to={`${base}/dat-lich`}>Xem tất cả</Link>
        </p>
      )}
      <section className="card">
        <ErrorBox error={resource.error} />
        {resource.loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lượt đặt</th>
                  <th>Tiện ích / căn hộ</th>
                  <th>Khung giờ</th>
                  <th>Số người</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((b) => (
                  <tr key={b.ma_dat_lich}>
                    <td>
                      <Link to={`${base}/dat-lich/${b.ma_dat_lich}`}>
                        {code(b.ma_dat_lich)}
                      </Link>
                    </td>
                    <td>
                      <strong>{b.ten_tien_ich}</strong>
                      <small className="amenity-subtitle">
                        Căn {b.so_can_ho} · {b.ten_nguoi_dat}
                      </small>
                    </td>
                    <td>
                      {when(b.bat_dau)}
                      <small className="amenity-subtitle">
                        đến {b.ket_thuc.slice(11, 16)}
                      </small>
                    </td>
                    <td>{b.so_nguoi}</td>
                    <td>
                      <Status value={b.trang_thai} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resource.result?.total === 0 && (
              <p className="muted">Chưa có lượt đặt phù hợp.</p>
            )}
          </div>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function BookingDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    resource = useData(`${api}/${id}`),
    action = useAction(resource.reload),
    b = resource.result?.data;
  return (
    <>
      <Link to={`${base}/dat-lich`}>← Danh sách lượt đặt</Link>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        b && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{code(b.ma_dat_lich)}</p>
                  <h1>{b.ten_tien_ich}</h1>
                  <p>{b.vi_tri}</p>
                </div>
                <Status value={b.trang_thai} />
              </div>
              <div className="amenity-booking-summary">
                <div>
                  <span>Khung giờ Việt Nam</span>
                  <strong>
                    {b.bat_dau.slice(11, 16)} – {b.ket_thuc.slice(11, 16)}
                  </strong>
                  <span>{day(b.bat_dau.slice(0, 10))}</span>
                </div>
                <div>
                  <span>Căn hộ / người đặt</span>
                  <strong>Căn {b.so_can_ho}</strong>
                  <span>
                    {b.ten_nguoi_dat} · {b.so_nguoi} người
                  </span>
                </div>
              </div>
              <p className="amenity-text">{b.ghi_chu || "Không có ghi chú."}</p>
              <div className="actions">
                <Link to={`${base}/tien-ich/${b.ma_tien_ich}`}>
                  Xem tiện ích và lịch trống
                </Link>
                {admin && (
                  <Link to={`${base}/dat-lich?ma_tien_ich=${b.ma_tien_ich}`}>
                    Các lịch của tiện ích này
                  </Link>
                )}
              </div>
              {["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai) &&
                new Date(b.bat_dau.replace(" ", "T") + "+07:00") <=
                  new Date() && (
                  <p className="note">
                    Đã tới giờ bắt đầu. Lịch này không còn cho phép duyệt, từ
                    chối hoặc hủy.
                    {b.trang_thai === "CHO_DUYET" &&
                      " Yêu cầu này chưa được duyệt để sử dụng."}
                  </p>
                )}
            </section>
            <Feedback action={action} />
            <div className="amenity-action-grid">
              {(admin && b.trang_thai === "CHO_DUYET" && b.co_the_huy
                ? ["duyet", "tu_choi"]
                : []
              )
                .concat(b.co_the_huy ? ["huy"] : [])
                .map((kind) => (
                  <form
                    className="card"
                    key={`${kind}-${b.phien_ban}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      action.run(`${api}/${id}/${kind}`, "POST", {
                        ...values(e),
                        phien_ban: b.phien_ban,
                      });
                    }}
                  >
                    <h2>
                      {
                        {
                          duyet: "Duyệt yêu cầu",
                          tu_choi: "Từ chối yêu cầu",
                          huy: "Hủy lượt đặt",
                        }[kind]
                      }
                    </h2>
                    <Field
                      label={
                        {
                          duyet: "Ghi chú duyệt",
                          tu_choi: "Lý do từ chối",
                          huy: "Lý do hủy lịch",
                        }[kind]
                      }
                    >
                      <textarea
                        name="ghi_chu"
                        maxLength={1000}
                        minLength={kind === "duyet" ? 0 : 5}
                        required={kind !== "duyet"}
                        rows={3}
                      />
                    </Field>
                    <button
                      className={kind === "duyet" ? "primary" : "danger"}
                      disabled={action.pending}
                    >
                      {
                        {
                          duyet: "Duyệt lịch",
                          tu_choi: "Từ chối lịch",
                          huy: "Xác nhận hủy lịch",
                        }[kind]
                      }
                    </button>
                  </form>
                ))}
            </div>
            <section className="card">
              <h2>Lịch sử đặt lịch</h2>
              <ol className="amenity-history">
                {b.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien]}</strong>
                    <small>
                      {auditTime(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="amenity-text">{h.ghi_chu}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )
      )}
    </>
  );
}
```

### 25. `frontend/src/app/App.jsx` — Thay toàn bộ

```jsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AuthProvider,
  useAuth,
  Protected,
  Login,
  Account,
} from "../features/auth/Auth.jsx";
import {
  Announcements,
  AnnouncementDetail,
  useUnreadCount,
} from "../features/announcements/Announcements.jsx";
import FinancialReports from "../features/financial-reports/FinancialReports.jsx";
import DataExchange from "../features/data-exchange/DataExchange.jsx";
import {
  EquipmentList,
  EquipmentDetail,
  MaintenanceList,
  MaintenanceDetail,
} from "../features/maintenance/Maintenance.jsx";
import {
  Amenities,
  AmenityDetail,
  Bookings,
  BookingDetail,
} from "../features/amenities/Amenities.jsx";
import {
  Funds,
  FundDetail,
  Vouchers,
  VoucherNew,
  VoucherDetail,
} from "../features/treasury/Treasury.jsx";
import Users from "../features/auth/Users.jsx";
import ApartmentAccounts from "../features/residency/ApartmentAccounts.jsx";
import {
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import {
  Dashboard,
  ReportDetail,
  ReportList,
} from "../features/incidents/Reports.jsx";
import Locations from "../features/qr/Locations.jsx";
import Vehicles from "../features/vehicles/Vehicles.jsx";
import {
  Rates,
  Meters,
  Bills,
  BillDetail,
} from "../features/billing/Billing.jsx";
import {
  Apartments,
  Residents,
  ResidentDetail,
} from "../features/residency/Residency.jsx";
import { ErrorBox, homeFor, roleNames } from "../shared/ui.jsx";
const admin = ["QUAN_TRI_VIEN"],
  technician = ["KY_THUAT_VIEN"],
  resident = ["CU_DAN"];
function Shell() {
  const { user, logout } = useAuth(),
    location = useLocation(),
    [error, setError] = useState();
  const unread = useUnreadCount(user, location.pathname);
  const inWorkspace =
    !!user &&
    ["/quan-tri", "/ky-thuat", "/cu-dan", "/tai-khoan"].some((p) =>
      location.pathname.startsWith(p),
    );
  const links =
    user?.vai_tro === "QUAN_TRI_VIEN"
      ? [
          ["/quan-tri", "Tổng quan"],
          ["/quan-tri/phan-anh", "Phản ánh"],
          ["/quan-tri/can-ho", "Căn hộ"],
          ["/quan-tri/tai-khoan-can-ho", "Tài khoản căn hộ"],
          ["/quan-tri/cu-dan", "Cư dân & cư trú"],
          ["/quan-tri/phuong-tien", "Phương tiện"],
          ["/quan-tri/thiet-bi", "Thiết bị & bảo trì"],
          ["/quan-tri/tien-ich", "Tiện ích & đặt lịch"],
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/bao-cao-tai-chinh", "Công nợ & thu phí"],
          ["/quan-tri/quy", "Thu chi & quỹ"],
          ["/quan-tri/nhap-xuat", "Nhập / xuất Excel, PDF"],
          ["/quan-tri/thong-bao", "Thông báo"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [
            ["/ky-thuat/cong-viec", "Công việc"],
            ["/ky-thuat/bao-tri", "Bảo trì thiết bị"],
          ]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
            ["/cu-dan/tien-ich", "Đặt lịch tiện ích"],
            ["/cu-dan/thong-bao", "Thông báo"],
          ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">CC</span>
          <span>
            CHUNG CƯ<small>QUẢN LÝ VẬN HÀNH</small>
          </span>
        </Link>
        <div className="top-links">
          <Link to="/tra-cuu">Tra cứu</Link>
          {user ? (
            <>
              <Link to={homeFor(user)}>{user.ho_va_ten}</Link>
              <button onClick={() => logout().catch(setError)}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link className="button" to="/dang-nhap">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>
      <ErrorBox error={error} />
      <div className={inWorkspace ? "workspace" : "public-space"}>
        {inWorkspace && (
          <aside className="sidebar">
            <p className="eyebrow">{roleNames[user.vai_tro]}</p>
            <nav aria-label="Chức năng">
              {[...links, ["/tai-khoan", "Tài khoản"]].map(([path, label]) => (
                <NavLink key={path} end={path === "/quan-tri"} to={path}>
                  {label}
                  {path === "/cu-dan/thong-bao" && unread > 0 && (
                    <span
                      className="notification-count"
                      aria-label={`${unread} chưa đọc`}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <Link className="public-link" to="/">
              Cổng dịch vụ ↗
            </Link>
          </aside>
        )}
        <main key={location.pathname}>
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/dang-nhap" element={<Login />} />
            <Route path="/quet-qr" element={<Scanner />} />
            <Route path="/r/:token" element={<SubmitReport />} />
            <Route
              path="/tra-cuu"
              element={<LookupReport initialCode={location.state?.code} />}
            />
            <Route
              path="/tai-khoan"
              element={
                <Protected>
                  <Account />
                </Protected>
              }
            />
            <Route
              path="/quan-tri"
              element={
                <Protected roles={admin}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/vi-tri-qr"
              element={
                <Protected roles={admin}>
                  <Locations />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/nhan-su"
              element={
                <Protected roles={admin}>
                  <Users />
                </Protected>
              }
            />
            {[
              ["/quan-tri/can-ho", <Apartments />],
              ["/quan-tri/tai-khoan-can-ho", <ApartmentAccounts />],
              ["/quan-tri/cu-dan", <Residents />],
              ["/quan-tri/cu-dan/:id", <ResidentDetail />],
              ["/quan-tri/phuong-tien", <Vehicles />],
              ["/quan-tri/quy", <Funds />],
              ["/quan-tri/quy/:id", <FundDetail />],
              ["/quan-tri/phieu-thu-chi", <Vouchers />],
              ["/quan-tri/phieu-thu-chi/moi", <VoucherNew />],
              ["/quan-tri/phieu-thu-chi/:id", <VoucherDetail />],
              ["/quan-tri/tien-ich", <Amenities />],
              ["/quan-tri/tien-ich/:id", <AmenityDetail />],
              ["/quan-tri/dat-lich", <Bookings />],
              ["/quan-tri/dat-lich/:id", <BookingDetail />],
              ["/quan-tri/thiet-bi", <EquipmentList />],
              ["/quan-tri/thiet-bi/:id", <EquipmentDetail />],
              ["/quan-tri/bao-tri", <MaintenanceList />],
              ["/quan-tri/bao-tri/:id", <MaintenanceDetail />],
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
              ["/quan-tri/bao-cao-tai-chinh", <FinancialReports />],
              ["/quan-tri/nhap-xuat", <DataExchange />],
              ["/quan-tri/thong-bao", <Announcements />],
              ["/quan-tri/thong-bao/:id", <AnnouncementDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={admin}>{element}</Protected>}
              />
            ))}
            {[
              ["/quan-tri/phan-anh", admin],
              ["/ky-thuat/cong-viec", technician],
              ["/cu-dan/phan-anh", resident],
            ].map(([base, roles]) => (
              <React.Fragment key={base}>
                <Route
                  path={base}
                  element={
                    <Protected roles={roles}>
                      <ReportList />
                    </Protected>
                  }
                />
                <Route
                  path={`${base}/:id`}
                  element={
                    <Protected roles={roles}>
                      <ReportDetail />
                    </Protected>
                  }
                />
              </React.Fragment>
            ))}
            {[
              ["/cu-dan/tien-ich", <Amenities />],
              ["/cu-dan/tien-ich/:id", <AmenityDetail />],
              ["/cu-dan/dat-lich", <Bookings />],
              ["/cu-dan/dat-lich/:id", <BookingDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={resident}>{element}</Protected>}
              />
            ))}
            {["/ky-thuat/bao-tri", "/ky-thuat/bao-tri/:id"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={technician}>
                    {path.endsWith(":id") ? (
                      <MaintenanceDetail />
                    ) : (
                      <MaintenanceList />
                    )}
                  </Protected>
                }
              />
            ))}
            {[
              "/cu-dan/hoa-don",
              "/cu-dan/hoa-don/:id",
              "/cu-dan/thong-bao",
              "/cu-dan/thong-bao/:id",
            ].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={resident}>
                    {path.includes("thong-bao") ? (
                      path.endsWith(":id") ? (
                        <AnnouncementDetail />
                      ) : (
                        <Announcements />
                      )
                    ) : path.endsWith(":id") ? (
                      <BillDetail />
                    ) : (
                      <Bills />
                    )}
                  </Protected>
                }
              />
            ))}
            <Route
              path="*"
              element={
                <section className="card">
                  <h1>Không tìm thấy trang</h1>
                  <Link to="/">Về cổng dịch vụ</Link>
                </section>
              }
            />
          </Routes>
        </main>
      </div>
      <footer>Chung cư · Cổng tiếp nhận phản ánh & điều phối xử lý</footer>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 26. `frontend/src/styles/global.css` — Thay toàn bộ

```css
:root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #183c3b;
  background: #f2f5f3;
  line-height: 1.6;
  font-synthesis: none;
  font-weight: 400;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
a {
  color: #14635a;
  text-underline-offset: 3px;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid #b7c9c3;
  border-radius: 8px;
  background: white;
  color: #224b44;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  line-height: 1.4;
}
button:hover,
.button:hover {
  background: #edf5f0;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: #14635a;
  color: white;
  border-color: #14635a;
}
.primary:hover {
  background: #0a4c45;
}
.danger {
  color: #a33e30;
  background: #fff5f1;
  border-color: #dfb4a9;
}
:focus-visible {
  outline: 3px solid #d99b27;
  outline-offset: 3px;
}
input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #b6c6c0;
  border-radius: 6px;
  color: #183c3b;
  background: #fff;
  max-width: 100%;
}
textarea {
  resize: vertical;
}
input[type="checkbox"] {
  width: 20px;
  min-height: 20px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4vw;
  border-bottom: 1px solid #dce5df;
  background: white;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-decoration: none;
  line-height: 1.4;
}
.brand-icon {
  background: #14635a;
  color: white;
  border-radius: 10px;
  padding: 10px;
  font-size: 18px;
}
.brand small {
  display: block;
  letter-spacing: 1.7px;
  font-size: 9px;
  color: #627c73;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.top-links > a {
  text-decoration: none;
}
.workspace {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 80vh;
  max-width: 1600px;
  margin: auto;
}
.sidebar {
  padding: 30px 18px;
  border-right: 1px solid #dce5df;
  background: #fff;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sidebar nav a {
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  text-decoration: none;
  color: #47645b;
}
.sidebar nav a.active {
  background: #e3f0e8;
  color: #13584a;
  font-weight: 700;
}
.public-link {
  display: block;
  margin: 30px 14px;
}
.workspace main {
  padding: 32px;
  min-width: 0;
}
.public-space {
  max-width: 1120px;
  margin: auto;
  padding: 40px 24px;
  min-height: 76vh;
}
h1 {
  font-size: 30px;
  line-height: 1.25;
  margin: 5px 0 24px;
  letter-spacing: -0.7px;
}
h2 {
  font-size: 19px;
  line-height: 1.4;
  margin: 0 0 16px;
}
h3 {
  font-size: 15px;
  margin: 24px 0 12px;
}
p {
  margin: 8px 0 18px;
}
small {
  font-size: 12px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #648379;
  margin-bottom: 8px;
}
.card {
  border: 1px solid #dbe5de;
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px #294d3a04;
}
.narrow {
  max-width: 650px;
  margin: 0 auto 24px;
}
.muted,
.note {
  color: #637b72;
}
.note {
  font-size: 13px;
  margin: 24px 0;
}
.hero {
  padding: 35px 0 50px;
  max-width: 800px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 18px 0 24px;
}
.hero p:not(.eyebrow) {
  max-width: 610px;
  color: #60776f;
  font-size: 18px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hero .actions {
  margin-top: 30px;
}
.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  display: block;
  color: #93aa9f;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.field > span,
.field > label {
  font-weight: 600;
}
.field small {
  color: #6d7e77;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full {
  width: 100%;
  margin-top: 20px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.error {
  padding: 12px 14px;
  background: #fff2ed;
  color: #9a3428;
  border: 1px solid #efc4b8;
  border-radius: 8px;
  font-size: 14px;
  margin: 15px 0;
  overflow-wrap: anywhere;
}
.error ul {
  padding-left: 20px;
  margin-bottom: 0;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-heading h1,
.page-heading h2 {
  margin-bottom: 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 28px 0;
}
.stat {
  text-decoration: none;
  color: inherit;
}
.stat span {
  font-size: 13px;
  color: #637b72;
}
.stat strong {
  display: block;
  font-size: 40px;
  font-weight: 650;
  line-height: 1.6;
}
.stat small {
  color: #14635a;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th {
  font-size: 11px;
  color: #698176;
  background: #f5f8f5;
  font-weight: 600;
  white-space: nowrap;
}
th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf1ed;
}
td:first-child {
  min-width: 220px;
}
td a {
  font-weight: 650;
  text-decoration: none;
}
td small {
  display: block;
  color: #71857c;
  margin-top: 5px;
}
td:last-child {
  white-space: nowrap;
  color: #698176;
}
.badge {
  display: inline-block;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf1ef;
  color: #52665b;
}
.status-MOI {
  background: #e6efff;
  color: #365c9b;
}
.status-DA_PHAN_CONG {
  background: #e8e7ff;
  color: #5c519b;
}
.status-DANG_XU_LY {
  background: #fff1d9;
  color: #9a6c18;
}
.status-DA_XU_LY {
  background: #e4f3f5;
  color: #2c737e;
}
.status-DA_DONG {
  background: #e3f3e8;
  color: #2c7351;
}
.status-TU_CHOI {
  background: #f9e8e2;
  color: #ad5244;
}
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}
.pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 24px;
}
.action-panel {
  align-self: start;
}
.tags {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #667e73;
  margin-bottom: 20px;
}
.metadata {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  font-size: 13px;
  border-top: 1px solid #e3eae4;
  padding-top: 20px;
}
.metadata dt {
  color: #74897f;
}
.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pre-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-grid img {
  width: 120px;
  height: 110px;
  object-fit: cover;
  border-radius: 7px;
  border: 1px solid #dce6de;
  max-width: 100%;
}
.timeline {
  list-style: none;
  padding: 0 0 0 18px;
  border-left: 2px solid #e0e9e1;
  margin-left: 5px;
}
.timeline li {
  position: relative;
  padding: 0 0 26px;
}
.timeline li:before {
  content: "";
  position: absolute;
  left: -25px;
  top: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #73a38c;
  border: 2px solid white;
}
.timeline li > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline time {
  font-size: 11px;
  color: #75877e;
}
.timeline p {
  font-size: 13px;
  margin: 8px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.timeline small {
  color: #75877e;
}
.location-list {
  list-style: none;
  padding: 0;
}
.location-list li {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
  border-top: 1px solid #e3ebe4;
  padding: 18px 0;
}
.location-list small {
  color: #71857c;
}
.location-list button {
  font-size: 12px;
  padding: 7px 10px;
}
.qr-print {
  text-align: center;
}
.qr-image {
  max-width: 100%;
  width: 280px;
  aspect-ratio: 1;
}
.qr-url {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.qr-print .actions {
  justify-content: center;
}
.qr-print .muted {
  font-size: 12px;
  margin-top: 24px;
}
.decision {
  border-top: 1px solid #e0e8e1;
  margin-top: 22px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #71857c;
}
.back {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 20px;
}
.lookup-result {
  border-top: 1px solid #e0e8e1;
  margin-top: 26px;
  padding-top: 24px;
}
.lookup-result .timeline {
  margin-top: 24px;
}
hr {
  border: 0;
  border-top: 1px solid #dce5df;
  margin: 25px 0;
}
#qr-reader {
  margin-bottom: 20px;
  overflow: hidden;
}
footer {
  font-size: 11px;
  text-align: center;
  color: #7c9085;
  border-top: 1px solid #dce5df;
  padding: 24px;
}
/* Invoice quantities use Vietnamese separators and align with their prices. */
.bill-lines th:nth-child(2),
.bill-lines th:nth-child(4),
.bill-lines th:nth-child(5),
.bill-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bill-lines .bill-line-total {
  color: #183c3b;
  font-weight: 600;
}
.bill-total {
  margin: 0;
  padding-top: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bank-picker {
  padding: 18px;
  margin-bottom: 18px;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  background: #f7faf8;
}
.bank-picker select {
  text-overflow: ellipsis;
}
.bank-selection {
  margin: 0;
  font-size: 13px;
  color: #47645b;
}
.bill-publish > .muted {
  font-size: 14px;
  margin-bottom: 24px;
}
.payment-card {
  padding: 0;
  overflow: hidden;
}
.payment-header {
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #dce8e2;
  background: linear-gradient(135deg, #f2f8f4, #eaf4ef);
}
.payment-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: #fff5da;
  color: #805800;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.payment-header p {
  color: #537168;
  margin: 0;
  font-size: 14px;
}
.payment-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px;
  text-align: center;
}
.payment-amount-label {
  margin: 0 0 4px;
  color: #637b72;
  font-size: 13px;
}
.payment-amount {
  margin: 0 0 24px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 750;
  line-height: 1.3;
  color: #13584a;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.payment-qr-frame {
  width: min(340px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d4e1d9;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px #1a4d3a0a;
}
.payment-qr-brand {
  display: block;
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #164e57;
}
.payment-qr-frame img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 1;
  margin: 8px auto;
}
.payment-qr-caption {
  display: block;
  font-size: 12px;
  color: #637b72;
}
.payment-details {
  margin: 28px auto 20px;
  max-width: 560px;
  text-align: left;
  font-size: 14px;
}
.payment-details > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ed;
}
.payment-details dt {
  color: #637b72;
}
.payment-details dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.payment-account {
  font-size: 17px;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
}
.payment-details .payment-reference {
  margin-top: 6px;
  padding: 14px 12px;
  border: 1px solid #d8e6dd;
  border-radius: 8px;
  background: #f2f8f4;
}
.payment-download {
  min-width: 180px;
}
.payment-notice {
  max-width: 500px;
  margin: 20px auto 0;
  font-size: 13px;
  color: #637b72;
}
@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 185px minmax(0, 1fr);
  }
  .workspace main {
    padding: 24px 20px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .topbar {
    padding: 12px 16px;
    align-items: start;
  }
  .brand {
    font-size: 12px;
    gap: 8px;
  }
  .brand-icon {
    padding: 8px;
    font-size: 13px;
  }
  .top-links {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: end;
    font-size: 12px;
    max-width: 55%;
  }
  .top-links .button,
  .top-links button {
    font-size: 11px;
    padding: 8px;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dce5df;
  }
  .sidebar .eyebrow {
    display: none;
  }
  .sidebar nav {
    flex-direction: row;
    overflow: auto;
  }
  .sidebar nav a {
    font-size: 12px;
    white-space: nowrap;
    padding: 10px;
  }
  .public-link {
    display: none;
  }
  .workspace main {
    padding: 24px 16px;
  }
  .public-space {
    padding: 28px 16px;
  }
  .three-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hero {
    padding-top: 10px;
  }
  .card {
    padding: 20px;
  }
  .payment-card {
    padding: 0;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-header {
    padding: 24px 18px 20px;
  }
  .payment-header h2 {
    font-size: 21px;
  }
  .payment-details {
    font-size: 13px;
  }
  .payment-details > div {
    gap: 10px;
  }
  .bank-picker {
    padding: 14px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
  h1 {
    font-size: 25px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 16px;
  }
  .stat strong {
    font-size: 32px;
  }
  .metadata {
    grid-template-columns: 115px 1fr;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .pagination span {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .image-grid img {
    width: 100px;
    height: 90px;
  }
}
@media print {
  body {
    background: white;
  }
  .topbar,
  .sidebar,
  footer,
  .no-print,
  .page-heading {
    display: none !important;
  }
  .workspace,
  .detail-grid {
    display: block;
  }
  .workspace main {
    padding: 0;
  }
  .qr-print {
    border: 0;
    box-shadow: none;
    margin: 0;
  }
  .qr-print .muted {
    display: none;
  }
}

.notification-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.1rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 1rem;
  background: #a33225;
  color: #fff;
  font-size: 0.8rem;
}
.notification-item {
  padding: 1.4rem 1rem;
  border-bottom: 1px solid #dce7e4;
  border-left: 4px solid transparent;
  overflow-wrap: anywhere;
}
.notification-item.is-unread {
  background: #f0f8f5;
  border-left-color: #16665c;
}
.notification-item h2 {
  margin: 0.7rem 0;
  font-size: 1.15rem;
}
.notification-item p {
  color: #55736e;
  margin-bottom: 0;
  white-space: pre-line;
}
.notification-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  color: #55736e;
  font-size: 0.85rem;
}
.notification-priority {
  border-radius: 0.4rem;
  padding: 0.2rem 0.5rem;
  background: #edf3f1;
}
.priority-QUAN_TRONG {
  color: #8a3c12;
  background: #fff0d8;
  font-weight: 700;
}
.notification-detail h1 {
  overflow-wrap: anywhere;
}
.notification-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  margin: 1.5rem 0;
}
.notification-bill {
  padding: 1.2rem;
  border: 1px solid #dce7e4;
  border-radius: 0.8rem;
  background: #f5f9f7;
}

.finance-filters {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 1rem;
}
.finance-filters .field {
  margin-bottom: 0;
}
.finance-filters > button {
  align-self: end;
  min-height: 44px;
}
@media (max-width: 1150px) {
  .finance-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-filters {
    grid-template-columns: minmax(0, 1fr);
  }
}

.finance-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.finance-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.finance-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
  background: white;
  text-align: left;
  min-width: 0;
  overflow-wrap: anywhere;
}
.finance-metric strong {
  font-size: clamp(1.15rem, 1.7vw, 1.65rem);
  letter-spacing: -0.02em;
  line-height: 1.4;
}
.finance-metric-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #47645b;
}
.finance-metric small {
  font-weight: 400;
  color: #627c73;
}
.finance-metric.is-paid {
  border-top: 4px solid #14635a;
}
.finance-metric.is-overdue {
  border-top: 4px solid #ad3f2b;
}
.finance-metric.is-overdue strong,
.finance-overdue {
  color: #a33225;
  font-weight: 700;
}
.finance-progress {
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  background: #e7f0eb;
}
.finance-progress > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.finance-progress progress {
  width: 100%;
  height: 0.6rem;
  accent-color: #14635a;
}
.finance-snapshot {
  font-size: 0.8rem;
  color: #627c73;
}
.finance-results th {
  white-space: nowrap;
}
.finance-results td {
  vertical-align: top;
}
.finance-number {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.finance-contact {
  display: block;
  color: #627c73;
}
.finance-pager {
  margin-top: 1rem;
}
.finance-empty {
  text-align: center;
  color: #627c73;
  padding: 1rem;
}
.finance-metrics-cash {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.finance-date-range {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
}
.finance-date-range small {
  color: #627c73;
}
@media (max-width: 1150px) {
  .finance-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-metrics,
  .finance-metrics-cash {
    grid-template-columns: minmax(0, 1fr);
  }
  .finance-results {
    padding: 1rem;
  }
  .finance-metric strong {
    font-size: 1.5rem;
  }
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-stats .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.maintenance-stats strong {
  font-size: 1.8rem;
}
.maintenance-overdue {
  color: #a33225;
}
.maintenance-tag {
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
  background: #edf3f1;
  color: #47645b;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.2rem;
}
.due-QUA_HAN,
.work-HUY {
  background: #fff0ea;
  color: #a33225;
}
.due-SAP_DEN_HAN,
.work-CHO_NGHIEM_THU {
  background: #fff2d9;
  color: #8a5416;
}
.work-HOAN_THANH {
  background: #e3f3e8;
  color: #225e46;
}
.work-DANG_THUC_HIEN {
  background: #e7effb;
  color: #275384;
}
.maintenance-subtitle {
  display: block;
  color: #627c73;
  margin-top: 0.4rem;
}
.maintenance-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  margin: 0 0 1.4rem;
}
.maintenance-info dt {
  color: #627c73;
  font-size: 0.85rem;
}
.maintenance-info dd {
  margin: 0.3rem 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.maintenance-text,
.maintenance-history p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.maintenance-staff {
  padding: 1rem;
  border: 1px solid #dce5df;
  border-radius: 0.6rem;
  margin-bottom: 1.2rem;
  background: #f8faf9;
}
.maintenance-staff .actions {
  font-size: 0.85rem;
}
.maintenance-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-action-grid .card {
  min-width: 0;
}
.maintenance-history {
  padding-left: 1.2rem;
}
.maintenance-history li {
  padding: 0 0 1rem 0.4rem;
  border-bottom: 1px solid #e4ebe7;
  margin-bottom: 1rem;
}
.maintenance-history li div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}
.maintenance-history time {
  color: #627c73;
  font-size: 0.8rem;
}
@media (max-width: 700px) {
  .maintenance-stats,
  .maintenance-info,
  .maintenance-action-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.amenity-cards,
.amenity-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.amenity-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.amenity-card h2 {
  margin-bottom: 0;
  overflow-wrap: anywhere;
}
.amenity-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex: 1;
}
.amenity-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: #627c73;
}
.amenity-open,
.amenity-status {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e3f3e8;
  color: #225e46;
}
.amenity-paused,
.amenity-TU_CHOI,
.amenity-DA_HUY {
  background: #fff0ea;
  color: #a33225;
}
.amenity-CHO_DUYET {
  background: #fff2d9;
  color: #8a5416;
}
.amenity-hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}
.amenity-hero h1 {
  overflow-wrap: anywhere;
}
.amenity-hero-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.4rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-hero-meta strong {
  font-size: 1.7rem;
}
.amenity-hero .amenity-text {
  grid-column: 1 / -1;
}
.amenity-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.amenity-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1.2rem;
}
.amenity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.amenity-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.amenity-calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
.amenity-calendar-toolbar .field {
  margin-bottom: 0;
  flex: 1 1 200px;
}
.amenity-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.7rem;
}
.amenity-slots button {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem;
  background: #edf7f0;
  color: #225e46;
  border-color: #bdd6c6;
}
.amenity-slots button small {
  font-weight: 400;
}
.amenity-slots button.amenity-slot-booked {
  background: #fff2d9;
  color: #8a5416;
  border-color: #e4d2ad;
  opacity: 1;
}
.amenity-slots button:disabled:not(.amenity-slot-booked) {
  background: #f0f2f1;
  color: #68756e;
  border-color: #dce3de;
}
.amenity-booking-form {
  max-width: none;
}
.amenity-booking-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.amenity-booking-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-booking-summary strong {
  font-size: 1.6rem;
}
.amenity-booking-summary span {
  overflow-wrap: anywhere;
}
.amenity-subtitle,
.amenity-history small {
  display: block;
  color: #627c73;
}
.amenity-history {
  padding-left: 1.3rem;
}
.amenity-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
@media (max-width: 700px) {
  .amenity-cards,
  .amenity-action-grid,
  .amenity-form-grid,
  .amenity-hero,
  .amenity-booking-summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .amenity-filters > button {
    width: 100%;
  }
  .amenity-slots {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .amenity-slots button {
    font-size: 0.8rem;
    padding: 0.6rem 0.3rem;
  }
}
.amenity-slots button.amenity-slot-selected {
  background: #14635a;
  color: white;
  border-color: #14635a;
  box-shadow: 0 0 0 2px #b7d9ca;
}

.treasury-funds,
.treasury-form-grid,
.treasury-action-grid,
.treasury-voucher-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.treasury-funds > .card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.treasury-funds h2 {
  overflow-wrap: anywhere;
}
.treasury-funds p {
  flex: 1;
}
.treasury-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.treasury-tag {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  background: #e3f3e8;
  color: #225e46;
  font-weight: 600;
  font-size: 0.8rem;
}
.treasury-NHAP {
  background: #fff2d9;
  color: #8a5416;
}
.treasury-HUY,
.treasury-closed {
  background: #fff0ea;
  color: #a33225;
}
.treasury-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.treasury-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.treasury-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.treasury-metrics .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.treasury-metrics strong {
  font-size: 1.5rem;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.treasury-subtitle,
.treasury-history small {
  display: block;
  color: #627c73;
}
.treasury-money {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.treasury-voucher-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.3rem;
  background: #f2f6f4;
  border-radius: 0.8rem;
  overflow-wrap: anywhere;
}
.treasury-voucher-summary strong {
  font-size: 1.7rem;
}
.treasury-history {
  padding-left: 1.3rem;
}
.treasury-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs {
  padding-left: 1.3rem;
}
.treasury-proofs li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs a {
  overflow-wrap: anywhere;
}
@media (max-width: 1100px) {
  .treasury-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .treasury-funds,
  .treasury-form-grid,
  .treasury-action-grid,
  .treasury-voucher-summary,
  .treasury-metrics {
    grid-template-columns: minmax(0, 1fr);
  }
  .treasury-filters > button {
    width: 100%;
  }
}

.report-export {
  margin: 1rem 0 1.5rem;
}
.report-export small {
  color: #627c73;
}
.report-export .note {
  margin: 0.6rem 0;
}
@media (max-width: 600px) {
  .report-export small {
    flex-basis: 100%;
  }
}
/* Data exchange shares the active list filters and keeps previews inside the card. */
.data-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}
.data-tools .report-export {
  margin: 0;
  flex: 1 1 360px;
  min-width: 0;
}
.data-import {
  margin-top: 20px;
  min-width: 0;
}
.import-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
  padding-left: 22px;
  color: #14635a;
}
.import-help {
  margin: 20px 0;
  padding: 16px;
  background: #f2f6f4;
  border-radius: 12px;
}
.import-help summary {
  cursor: pointer;
  font-weight: 700;
}
.import-preview {
  margin-top: 24px;
  border-top: 1px solid #dce5df;
  padding-top: 16px;
}
.import-preview .table-wrap {
  max-height: 520px;
  margin: 16px 0;
}
.import-row-error {
  color: #aa3424;
  min-width: 240px;
}
.import-result {
  padding: 20px;
  margin-top: 24px;
  background: #e4f2e9;
  border: 1px solid #bdd8c7;
  border-radius: 12px;
  overflow-wrap: anywhere;
}
.data-import input[type="file"] {
  max-width: 100%;
}
```
