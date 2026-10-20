# Sửa mã cư dân và thông báo nhập PDF — code đầy đủ 7 file

Áp dụng sau bản nhập/xuất `7b48d59` và bộ mẫu `0a842ec`. Không cần thêm thư viện hoặc migration. Thay **đủ 7 file** dưới đây; mỗi mục chứa toàn bộ nội dung file để chép vào VS Code. Giữ database, .env, .certs, ảnh và chứng từ hiện có.

## Lỗi trong ảnh và cách sửa

Ảnh nhập PDF có URL `phan_he=can_ho`, nhưng tệp được chọn là `02_cu_dan.pdf`. Tệp thuộc **Cư dân** nên phải chọn **Cư dân** ở Phần dữ liệu trước khi xem trước. Thông báo cũ đã che lỗi chọn sai phần bằng câu về PDF scan/làm phẳng. Bản này phân biệt và ghi rõ phần đang chọn cùng phần đúng của tệp, áp dụng cho cả PDF và Excel.

PDF biểu mẫu vẫn được giữ: kiểm thử đã đọc cả 5 PDF mẫu và gửi PDF cư dân qua đúng API, xem trước/lưu thành công 4 hồ sơ trong database test. Không nhận ảnh scan hay PDF đã In/Print thành bản phẳng. Khi sửa ô trong PDF, dùng Lưu/Save. Hệ thống không tự đổi phần hoặc tự lưu sang phần khác khi tệp không khớp.

Trong ảnh hồ sơ `/quan-tri/cu-dan/12`, **mã cư dân là 12**; **CH000009 là tên đăng nhập tài khoản căn hộ**. Mã 12 là giá trị dùng ở cột `ma_cu_dan` khi nhập phương tiện của người này.

## Bản sửa có gì

- Danh sách cư dân có cột **Mã cư dân**, nút **Sao chép** và bộ lọc theo mã số.
- Hồ sơ cư dân hiển thị mã ngay dưới tên, có sao chép và giải thích khác tên đăng nhập căn hộ CH...
- Sao chép hoạt động trên HTTPS/localhost và có phương án cho HTTP LAN như `http://192.168.1.208:5173`. Nếu trình duyệt chặn cả hai cách, báo rõ để bôi đen mã và sao chép thủ công.
- Gần ô chọn tệp hiển thị **Phần đang nhập** để vẫn thấy khi cuộn xuống. Phần phương tiện có liên kết mở cư dân và hướng dẫn thay placeholder.
- Mã cư dân không phải số, ví dụ `THAY_MA_CU_DAN_1`, được báo cách lấy mã cụ thể, không còn dừng ở thông báo kiểm tra thông tin chung.

## Chép vào VS Code

1. Dừng backend/frontend bằng Ctrl+C. Lưu các thay đổi riêng của bạn trước khi thay toàn bộ nội dung file.
2. Mở thư mục dự án, thay đủ 7 file theo các khối code dưới đây. Giữ nguyên tên/đường dẫn, đặc biệt `import-parser.worker.js`. Chỉ chép nội dung trong khối mã, không chép dấu ba backtick.
3. Không cần `npm install`, migrate hoặc seed lại cho riêng bản sửa này. Khởi động backend tại thư mục gốc:

```powershell
npm run dev:backend
```

Terminal thứ hai tiếp tục lệnh đang dùng, ví dụ:

```powershell
npm run dev:frontend:https
```

Nếu đang dùng HTTP LAN có thể giữ lệnh Vite cũ. Chỉ chạy một Vite trên cổng 5173. Sau đó Ctrl+F5. Restart backend để worker đọc file mới, không chỉ reload trình duyệt.

Nếu dùng Git để lấy bản sửa, lưu thay đổi local rồi cập nhật nhánh `codex/auth-qr-incidents`. Đây là cập nhật hiển thị/validation, không đổi schema hay liên kết tài khoản hiện có.

## Thử lại theo ảnh của bạn

1. BQL → Cư dân & cư trú → mở Nguyễn Minh An (TEST X). Mã cư dân hiển thị **12** như đường dẫn trong ảnh. Bấm Sao chép để lấy số 12.
2. Mở `03_phuong_tien.xlsx`, sheet Nhap: thay **mọi ô** `THAY_MA_CU_DAN_1` bằng `12`. Đối với `THAY_MA_CU_DAN_2`, mở hồ sơ Lê Quang Bình (TEST X) để lấy mã thật của người đó; không đoán mã liên tiếp, không dùng số điện thoại/tên đăng nhập CH...
3. Giữ đúng số căn và tên cột. Chọn phần Phương tiện rồi chọn lại tệp đã sửa → Xem trước → Xác nhận khi không còn lỗi. Cư dân phải đang ở đúng căn chịu phí, ngày xe không trước ngày bắt đầu cư trú.
4. Thử PDF: chọn **Cư dân** rồi chọn `02_cu_dan.pdf` (bộ P). Các căn `T261020P01/P02/P03` phải đã được nhập từ `01_can_ho.pdf`; bộ Excel X và bộ PDF P có mã căn khác nhau. Nếu căn chưa có, xem trước sẽ báo thiếu căn chứ không phải lỗi đọc PDF. Không nhập lặp hồ sơ đã có.
5. Thử chọn Căn hộ với `02_cu_dan.pdf`: phải nhận thông báo **Bạn đang chọn “Căn hộ” nhưng tệp thuộc phần “Cư dân”**, chưa có dữ liệu nào được lưu.

Các tệp mẫu giữ nguyên, có thể tải lại ở [bộ mẫu nhập dữ liệu](../samples/nhap-du-lieu/README.md). Không cần xóa PDF hoặc tải lại cả dự án.

## Danh sách file

1. [backend/src/modules/data-exchange/import-parser.worker.js](../backend/src/modules/data-exchange/import-parser.worker.js) — thay toàn bộ.
2. [backend/src/modules/data-exchange/import-files.js](../backend/src/modules/data-exchange/import-files.js) — thay toàn bộ.
3. [backend/src/modules/data-exchange/catalog.js](../backend/src/modules/data-exchange/catalog.js) — thay toàn bộ.
4. [backend/src/modules/data-exchange/import.service.js](../backend/src/modules/data-exchange/import.service.js) — thay toàn bộ.
5. [frontend/src/features/residency/Residency.jsx](../frontend/src/features/residency/Residency.jsx) — thay toàn bộ.
6. [frontend/src/features/data-exchange/DataExchange.jsx](../frontend/src/features/data-exchange/DataExchange.jsx) — thay toàn bộ.
7. [frontend/src/styles/global.css](../frontend/src/styles/global.css) — thay toàn bộ.

## Code đầy đủ

### 1. `backend/src/modules/data-exchange/import-parser.worker.js`

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
  const sheet = wb.getWorksheet("Nhap") || wb.worksheets[0];
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
async function pdf(buffer, kind, fields) {
  const { PDFDocument, PDFTextField } = await import("pdf-lib");
  const doc = await PDFDocument.load(buffer);
  if (doc.getPageCount() > 10) invalid("PDF biểu mẫu tối đa 10 trang.");
  const form = doc.getForm();
  const marker = form.getTextField("cc_import").getText(),
    actual = /^CC-IMPORT\/1:([a-z_]+)$/.exec(marker || "")?.[1];
  if (
    actual !== kind &&
    Object.hasOwn(catalog, actual) &&
    catalog[actual].importable
  )
    wrongKind(actual, kind);
  if (marker !== `CC-IMPORT/1:${kind}`)
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
    ? excel(buffer, fields, kind)
    : pdf(buffer, kind, fields));
  if (!records.length || records.length > 100)
    invalid(
      "Tệp cần có từ 1 đến 100 dòng không trống (PDF tối đa 10 trang). Không có dòng nào được cắt bớt.",
    );
  parentPort.postMessage({ records });
} catch (error) {
  parentPort.postMessage({
    code: error.publicMessage ? error.code : "INVALID_FILE",
    error: error.publicMessage
      ? error.message
      : workerData.extension === "pdf"
        ? "PDF cần là biểu mẫu tải từ hệ thống, được điền và Lưu (Save). PDF scan, bản in hoặc PDF đã làm phẳng không còn ô điền để nhập."
        : error.message.startsWith("Tệp") ||
            /Dùng sheet|Tên cột|Tệp cần|Excel quá/.test(error.message)
          ? error.message
          : "Không đọc được tệp. Dùng tệp mẫu Excel hoặc PDF biểu mẫu, không đặt mật khẩu bảo vệ tệp.",
  });
}
```

### 2. `backend/src/modules/data-exchange/import-files.js`

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

### 3. `backend/src/modules/data-exchange/catalog.js`

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
        "Mở Cư dân, sao chép mã số trên danh sách/hồ sơ. Không dùng tên tài khoản CH...",
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

### 4. `backend/src/modules/data-exchange/import.service.js`

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
    const residentId =
      typeof body.ma_cu_dan === "string" ? body.ma_cu_dan.trim() : "";
    if (!/^\d{1,10}$/.test(residentId) || Number(residentId) === 0)
      fail(
        422,
        "INVALID_RESIDENT",
        "Mã cư dân phải là số. Mở Cư dân và sao chép mã của người đang ở đúng căn; thay THAY_MA_CU_DAN_1/2 bằng mã đó, không dùng tên tài khoản CH...",
      );
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

### 5. `frontend/src/features/residency/Residency.jsx`

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

function ResidentCode({ value, label = false }) {
  const [notice, setNotice] = useState("");
  async function copy() {
    const code = String(value);
    let copied = false;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        /* Use the LAN-compatible fallback below. */
      }
    }
    if (!copied) {
      const previous = document.activeElement,
        input = document.createElement("textarea");
      input.value = code;
      input.readOnly = true;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      try {
        input.focus();
        input.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        input.remove();
        previous?.focus?.({ preventScroll: true });
      }
    }
    setNotice(
      copied
        ? `Đã sao chép mã ${code}.`
        : "Chưa sao chép được. Hãy bôi đen mã số và sao chép thủ công.",
    );
  }
  return (
    <div className="resident-code">
      {label && <span>Mã cư dân:</span>}
      <code>{value}</code>
      <button
        type="button"
        aria-label={`Sao chép mã cư dân ${value}`}
        onClick={copy}
      >
        Sao chép
      </button>
      {notice && <small role="status">{notice}</small>}
    </div>
  );
}

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
        <Field
          label="Mã cư dân (tùy chọn)"
          name="ma_cu_dan"
          type="number"
          min={1}
          max={4294967295}
          step={1}
          defaultValue={params.get("ma_cu_dan") || ""}
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
                <th>Mã cư dân</th>
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
                    <ResidentCode value={r.ma_cu_dan} />
                  </td>
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
          <ResidentCode value={resident.ma_cu_dan} label />
          <p className="muted">
            Dùng mã số này khi nhập phương tiện. Tên đăng nhập CH... là tài
            khoản căn hộ, không phải mã cư dân.
          </p>
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

### 6. `frontend/src/features/data-exchange/DataExchange.jsx`

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
      <p className="note">
        Phần đang nhập: <strong>{config.title}</strong>. Tệp phải thuộc đúng
        phần này.
      </p>
      {config.key === "phuong_tien" && (
        <p className="note">
          Mở <Link to="/quan-tri/cu-dan">Cư dân &amp; cư trú</Link>, bấm Sao
          chép ở mã cư dân và điền số đó vào cột ma_cu_dan trong tệp xe. Thay
          các ô THAY_MA_CU_DAN_1/2; không dùng tên tài khoản CH...
        </p>
      )}
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

### 7. `frontend/src/styles/global.css`

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
.resident-code {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.resident-code code {
  padding: 4px 10px;
  background: #e4f2e9;
  border-radius: 6px;
  color: #14635a;
  font-size: 1rem;
  font-weight: 700;
}
.resident-code small {
  flex-basis: 100%;
  color: #41675b;
}
```
