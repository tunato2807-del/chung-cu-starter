# Xuất báo cáo Excel / PDF — code từng file cho VS Code

> Có bản mới hơn: [nhập/xuất dữ liệu theo phân hệ — code từng file](cap-nhat-nhap-xuat-du-lieu-vscode.md). Sau khi cài bản mới, không chép service, ReportExport hoặc CSS cũ trong hướng dẫn này đè lại.

Bản tiếp theo sau `d3d62cf` (thu chi và quỹ). Chép đủ **11 file** dưới đây vào dự án hiện có, không cần tải ZIP. Nếu chưa có thu chi, cập nhật [bản 9 file thu chi/quỹ](cap-nhat-thu-chi-quy-vscode.md) trước. Bản này thêm nút xuất ngay tại báo cáo công nợ, thu phí và sổ quỹ; không tạo menu mới.

## Cách cập nhật trên Windows

1. Dừng backend/frontend bằng Ctrl+C, lưu lại các thay đổi cá nhân trước khi thay file. Giữ database, `.env`, `.certs`, ảnh và chứng từ.
2. Tạo file mới ở mục 2, 3, 8 (tạo thư mục `report-exports` nếu chưa có); thay toàn bộ nội dung các file ở mục 1, 4–7, 9–11. Mỗi mục bên dưới là code đầy đủ, chỉ chép bên trong khối mã.
3. Mở PowerShell tại thư mục gốc (nơi có package.json), chạy:

```powershell
npm install -w backend --save-exact exceljs@4.4.0 pdfmake@0.2.23
npm run dev:backend
```

Hai thư viện tạo XLSX/PDF được cài theo phiên bản đã kiểm thử. `pdf-parse` trong devDependencies dùng riêng để kiểm tra nội dung PDF khi chạy test và được npm cài cùng chế độ phát triển; không xử lý PDF cư dân tải lên. File `package-lock.json` ở gốc được **npm cập nhật tự động**, không chép tay nội dung lockfile. Nếu lấy toàn bộ checkout GitHub tại đúng commit, dùng `npm ci` để cài theo lock đã lưu.

Không cần migration mới hoặc chạy seed lại; schema giữ đến 013. Không sửa/xóa migration, database hoặc volume để cập nhật xuất báo cáo. Font Roboto tiếng Việt nằm trong gói pdfmake, không cần tải file font riêng hoặc cài font hệ điều hành.

4. Terminal thứ hai tại gốc, tiếp tục dùng lệnh HTTPS đang hoạt động:

```powershell
npm run dev:frontend:https
```

Sau đó Ctrl+F5. Thu chi/xuất báo cáo vẫn dùng được qua HTTP LAN nếu bạn đang dùng lệnh Vite cũ; camera QR trong web cần giữ HTTPS. Không chạy hai Vite cùng cổng.

5. Giữ app.js/App.jsx hiện có; bản này không thay hai file đó. Không lấy service/CSS cũ từ các hướng dẫn trước đè lên sau bản này.

## Xuất công nợ và thu phí

Đăng nhập BQL → **Công nợ & thu phí**:

- Chọn Công nợ theo kỳ hóa đơn hoặc Thu phí theo ngày xác nhận.
- Chọn kỳ/ngày, khối, số căn và **bấm Xem báo cáo** để áp dụng. Chọn cách xem chi tiết (theo căn, hóa đơn chưa thu, theo kỳ; hoặc từng khoản thu, theo ngày), chọn chỉ quá hạn nếu cần.
- Bấm **Xuất Excel** hoặc **Xuất PDF**. Tệp xuất tất cả dòng phù hợp, bao gồm các trang bạn chưa mở; không chỉ lấy 20 dòng đang hiện. Đang ở trang 2 cũng vẫn xuất đủ toàn bộ kết quả đã lọc.
- Nếu mới gõ bộ lọc nhưng chưa áp dụng, tệp tiếp tục dùng bộ lọc đang được áp dụng trên báo cáo. Thông báo sau tạo tệp cho biết số dòng và nhắc kiểm tra Tệp đã tải xuống của trình duyệt.

Mỗi file có thời điểm dữ liệu tại Việt Nam, bộ lọc/cách xem và phần tổng hợp. Công nợ vẫn là công nợ hiện tại theo kỳ đã chọn; chưa gửi/nháp/hủy không cộng. Lọc quá hạn chỉ thay chi tiết, không đổi tổng hợp kỳ/khối/căn. Hóa đơn chưa thu chỉ liệt kê các hóa đơn còn nợ, trong khi tổng hợp vẫn có cả số đã thu như trên web. Ngày đến hạn hôm nay chưa là quá hạn.

Thu phí vẫn dựa trên ngày BQL xác nhận tại phần mềm quy đổi giờ Việt Nam, không phải kỳ hóa đơn hoặc ngày cư dân chuyển khoản. Giữ nguyên số 0 đầu của mã tham chiếu.

## Xuất sổ quỹ

BQL → **Thu chi & quỹ** → mở quỹ → chọn từ ngày/đến ngày → **Lọc sổ quỹ**, rồi **Xuất Excel/PDF**.

- Từng khoản thu/chi: xuất ngày hạch toán, chứng từ, nguồn, nhóm, đối tác, diễn giải và cột Thu/Chi. Chỉ có phiếu đã ghi sổ và hóa đơn đã xác nhận thu.
- Tổng hợp theo tháng: xuất các tháng có giao dịch trong khoảng ngày, tổng thu/chi và chênh lệch. Các tháng ở biên chỉ tính ngày thuộc khoảng chọn. Bộ lọc nguồn/loại/từ khóa không áp dụng cho cách xem tháng, giống giao diện.
- Đầu kỳ + thu trong kỳ − chi trong kỳ = cuối kỳ. Lọc chi tiết nguồn/loại/từ khóa không làm đổi tổng toàn quỹ trong khoảng ngày; file có ghi chú này để tránh hiểu nhầm khi cộng một danh sách đã lọc hẹp.
- Phiếu gốc và phiếu đảo đều giữ để xem lịch sử, không xóa hoặc cộng lại tiền hóa đơn thành phiếu thủ công. Số dư vẫn theo dữ liệu phần mềm và cần đối soát với thực tế; hạch toán lùi ngày có thể thay đổi báo cáo quá khứ.

## Định dạng tệp

**Excel .xlsx thật** gồm hai sheet:

- **Tổng hợp**: tên báo cáo, thời điểm, số dòng, bộ lọc, tổng tiền/số lượng và ghi chú.
- **Chi tiết**: đầy đủ dữ liệu khớp lọc, hàng tiêu đề cố định, bộ lọc cột, định dạng tiền và màu dòng xen kẽ. Mã căn, điện thoại, tham chiếu luôn dạng văn bản để giữ số 0 đầu. Nội dung bắt đầu bằng `=`, `+`, `-`, `@` vẫn là văn bản, không thành công thức tự chạy.

Tiền nguyên đồng tối đa **15 chữ số** được ghi ô số để sử dụng thông thường. Số tiền/tổng lớn hơn 15 chữ số được ghi **chuỗi thập phân nguyên gốc**, giữ đủ chữ số; Excel có thể báo số lưu dạng văn bản. Không chuyển những ô này sang Number/General nếu cần giữ chính xác. Tổng trong file lấy trực tiếp từ dữ liệu và BigInt, không dùng công thức SUM Excel có thể làm tròn số lớn.

**PDF thật** khổ A4 ngang, nhúng font Roboto tiếng Việt, có bộ lọc, tổng hợp, thời điểm dữ liệu, bảng nhiều trang lặp tiêu đề và số trang. Tải trực tiếp, không mở cửa sổ in hoặc tab dịch vụ ngoài. Nội dung dài được xuống dòng và tiếp tục sang trang, không cắt bớt để vừa một hàng.

File chỉ chứa các cột báo cáo được cho phép; không chứa mật khẩu/hash, chi tiết tài khoản ngân hàng hoặc binary chứng từ. Tệp tải xuống chỉ BQL tạo được; không có link lưu trữ công khai.

## Giới hạn và xử lý lỗi

- Excel tối đa **10.000 dòng**, PDF tối đa **1.000 dòng**, tính trên kết quả sau cách xem/bộ lọc. Nếu vượt, hệ thống **báo lỗi trước khi tạo file**, không âm thầm cắt dữ liệu. Thu hẹp ngày/khối/căn/quỹ, chọn tổng hợp hoặc chọn Excel nếu vượt PDF.
- Mỗi tài khoản tạo một tệp tại một thời điểm, toàn tiến trình tối đa hai tệp. Nếu báo đang tạo báo cáo, chờ lượt cũ xong rồi thử lại. Nút được khóa khi đang tải.
- Đổi bộ lọc/đường dẫn hoặc rời trang hủy tải phía trình duyệt và bỏ response cũ để không tải nhầm file màn trước. Lỗi hiển thị ngay phần xuất, không mất bộ lọc hoặc dữ liệu trên màn.
- File là snapshot **tại lúc xuất**. Nếu có người thu/ghi sổ sau lần tải màn hình trước đó, file có thể mới hơn màn; xem thời điểm hoặc bấm Cập nhật số liệu/sổ quỹ để đối chiếu. Trong cùng một file, tổng, số dòng và chi tiết dùng cùng snapshot.
- Tên file có loại báo cáo và ngày, ví dụ `cong-no-can-ho-2026-10-20.xlsx`, `so-quy-2-giao-dich-2026-10-20.pdf`.

## Thử nhanh

1. Dùng BQL chọn một khối có hơn 20 căn nợ, chuyển sang trang 2 rồi xuất Excel. Sheet Chi tiết phải đủ tất cả căn khớp lọc, không chỉ trang đang mở; Tổng hợp vẫn khớp quy tắc báo cáo trên web.
2. Xuất PDF công nợ/thu phí, mở bằng trình xem PDF: tên cư dân tiếng Việt có dấu, mã và tiền đúng, tiêu đề bảng lặp khi nhiều trang.
3. Mở quỹ, xuất từng giao dịch và tổng hợp tháng. Kiểm tra đầu kỳ/cuối kỳ, cột Thu/Chi và chênh lệch tháng.
4. Thử tài khoản cư dân/KTV: không có quyền xuất. Khi tệp lỗi/vượt giới hạn, bộ lọc và báo cáo đang xem vẫn giữ nguyên.

Bộ kiểm tra tự động đọc lại XLSX/PDF thật, kiểm tra dữ liệu vượt một trang, công thức/chuỗi, số lớn vượt độ chính xác Excel, tiếng Việt, PDF nhiều trang, mọi cách xem/bộ lọc, giới hạn, quyền và snapshot khi ghi sổ xen giữa. Các test dùng `chung_cu_test`, không xóa dữ liệu phát triển. Nếu chép cả file test từ GitHub, chạy lần lượt `npm test`, `npm run test:e2e`, `npm run build`; không cần cài chương trình đọc PDF hệ điều hành để chạy test xuất tệp mới. Các file test không bắt buộc để sử dụng chức năng.

## 1. `backend/package.json`

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
    "bcryptjs": "^3.0.3",
    "exceljs": "4.4.0",
    "express": "^5.1.0",
    "jose": "^6.2.12",
    "multer": "^2.4.0",
    "mysql2": "^3.24.6",
    "pdfmake": "0.2.23",
    "sharp": "^0.35.5"
  },
  "devDependencies": {
    "pdf-parse": "1.1.1"
  }
}
```

## 2. `backend/src/modules/report-exports/report-files.js`

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
    "Tiền trên 15 chữ số được lưu dạng văn bản để giữ nguyên giá trị; các mã và số điện thoại luôn là văn bản.",
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
  data.headerFooter.oddFooter =
    "&LQuản lý chung cư&CTrang &P / &N&RĐơn vị: đồng";
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
      subject: "Báo cáo tài chính theo dữ liệu đã ghi nhận",
    },
    defaultStyle: { font: "Roboto", fontSize: wide ? 7 : 8, color: "#183c3b" },
    footer: (current, total) => ({
      margin: [32, 12, 32, 0],
      columns: [
        { text: "CHUNG CƯ · QUẢN LÝ VẬN HÀNH", fontSize: 7, color: "#627c73" },
        {
          text: `Trang ${current} / ${total} · Đơn vị: đồng`,
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

## 3. `backend/src/modules/report-exports/report-exports.service.js`

```js
import * as financial from "../financial-reports/financial-reports.service.js";
import { ledger } from "../treasury/treasury.service.js";
import { today } from "../billing/billing.validation.js";
import { date, format, reserve, send, time } from "./report-files.js";
const col = (key, title, type = "text", width = 20, pdfWidth = 1) => ({
  title,
  type,
  width,
  pdfWidth,
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

## 4. `backend/src/modules/financial-reports/financial-reports.service.js`

```js
import { pool, rows } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { day, period, today } from "../billing/billing.validation.js";

import { reportPage } from "../report-exports/report-files.js";

// All queries in one response read the same committed snapshot, without locking bills.
async function snapshot(work) {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
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
function filters(query) {
  const result = {
    khoi: query.khoi ? text(query.khoi, "khoi", 1, 10) : "",
    q: query.q ? text(query.q, "q", 1, 100) : "",
  };
  if (query.ma_can_ho) {
    result.ma_can_ho = integer(query.ma_can_ho, "ma_can_ho");
    if (!result.ma_can_ho) fail(422, "VALIDATION", "Mã căn hộ không hợp lệ.");
  }
  return result;
}
function conditions(f) {
  const where = [],
    values = [];
  if (f.khoi) {
    where.push("a.khoi=?");
    values.push(f.khoi);
  }
  if (f.q) {
    where.push("a.so_can_ho LIKE ?");
    values.push(`%${f.q}%`);
  }
  if (f.ma_can_ho) {
    where.push("a.ma_can_ho=?");
    values.push(f.ma_can_ho);
  }
  return { where, values };
}
const from = "FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho";
const money = (expression) => `CAST(COALESCE(SUM(${expression}),0) AS CHAR)`;
const unpaid = "h.trang_thai='DA_GUI'";
const paid = "h.trang_thai='DA_THANH_TOAN'";
function aggregates(overdue) {
  return `${money("h.tong_tien")} AS tong_da_gui,
    ${money(`CASE WHEN ${paid} THEN h.so_tien_da_thu ELSE 0 END`)} AS da_thu,
    ${money(`CASE WHEN ${unpaid} THEN h.tong_tien ELSE 0 END`)} AS con_phai_thu,
    ${money(`CASE WHEN ${overdue} THEN h.tong_tien ELSE 0 END`)} AS no_qua_han,
    COUNT(*) AS so_hoa_don, CAST(COALESCE(SUM(${paid}),0) AS UNSIGNED) AS so_hoa_don_da_thu,
    CAST(COALESCE(SUM(${unpaid}),0) AS UNSIGNED) AS so_hoa_don_chua_thu,
    CAST(COALESCE(SUM(${overdue}),0) AS UNSIGNED) AS so_hoa_don_qua_han`;
}
export async function blocks() {
  return rows(pool, "SELECT DISTINCT khoi FROM can_ho ORDER BY khoi");
}
export async function debts(query, exportFormat) {
  const calendarDay = today(),
    f = filters(query),
    window = reportPage(query, exportFormat),
    { page, offset, limit } = window;
  f.tu_ky = query.tu_ky ? period(query.tu_ky) : "";
  f.den_ky = query.den_ky ? period(query.den_ky) : "";
  f.che_do = choice(query.che_do || "CAN_HO", "che_do", [
    "CAN_HO",
    "HOA_DON",
    "THEO_KY",
  ]);
  f.qua_han = choice(query.qua_han || "0", "qua_han", ["0", "1"]);
  if (f.tu_ky && f.den_ky && f.tu_ky > f.den_ky)
    fail(422, "INVALID_PERIOD_RANGE", "Từ kỳ không được sau đến kỳ.");
  if (f.che_do === "THEO_KY" && f.qua_han === "1")
    fail(
      422,
      "INVALID_FILTER",
      "Lọc quá hạn chỉ dùng cho danh sách căn hoặc hóa đơn chưa thu.",
    );
  const { where, values } = conditions(f);
  where.push("h.trang_thai IN ('DA_GUI','DA_THANH_TOAN')");
  if (f.tu_ky) {
    where.push("h.ky_thanh_toan>=?");
    values.push(f.tu_ky);
  }
  if (f.den_ky) {
    where.push("h.ky_thanh_toan<=?");
    values.push(f.den_ky);
  }
  const condition = where.join(" AND ");
  // Validated YYYY-MM-DD, interpolated once to keep summary/group parameters identical.
  const overdue = `(${unpaid} AND h.han_thanh_toan IS NOT NULL AND h.han_thanh_toan<'${calendarDay}')`;
  return snapshot(async (db) => {
    const [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [summary] = await rows(
      db,
      `SELECT ${aggregates(overdue)},COUNT(DISTINCT CASE WHEN ${unpaid} THEN h.ma_can_ho END) AS so_can_con_no ${from} WHERE ${condition}`,
      values,
    );
    summary.ty_le_da_thu =
      summary.tong_da_gui === "0"
        ? 0
        : Number(
            (BigInt(summary.da_thu) * 10000n +
              BigInt(summary.tong_da_gui) / 2n) /
              BigInt(summary.tong_da_gui),
          ) / 100;
    let source, order;
    const args = values;
    if (f.che_do === "CAN_HO") {
      const grouped = `SELECT h.ma_can_ho,COUNT(*) AS so_hoa_don_chua_thu,
        ${money("h.tong_tien")} AS con_phai_thu,
        ${money(`CASE WHEN ${overdue} THEN h.tong_tien ELSE 0 END`)} AS no_qua_han,
        MIN(h.han_thanh_toan) AS han_som_nhat
        ${from} WHERE ${condition} AND ${unpaid} GROUP BY h.ma_can_ho
        ${f.qua_han === "1" ? `HAVING SUM(${overdue})>0` : ""}`;
      source = `FROM (${grouped}) d JOIN can_ho a ON a.ma_can_ho=d.ma_can_ho
        LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=a.ma_can_ho
        LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach`;
      order =
        "ORDER BY CAST(d.no_qua_han AS DECIMAL(40,0)) DESC,CAST(d.con_phai_thu AS DECIMAL(40,0)) DESC,d.ma_can_ho";
    } else if (f.che_do === "HOA_DON") {
      source = `${from} WHERE ${condition} AND ${unpaid}${f.qua_han === "1" ? ` AND ${overdue}` : ""}`;
      order = `ORDER BY ${overdue} DESC,h.han_thanh_toan IS NULL,h.han_thanh_toan,h.ma_hoa_don`;
    } else {
      source = `FROM (SELECT h.ky_thanh_toan,${aggregates(overdue)} ${from} WHERE ${condition} GROUP BY h.ky_thanh_toan) d`;
      order = "ORDER BY d.ky_thanh_toan DESC";
    }
    const [count] = await rows(db, `SELECT COUNT(*) AS total ${source}`, args);
    const fields =
      f.che_do === "CAN_HO"
        ? "d.*,a.so_can_ho,a.khoi,c.ho_va_ten AS nguoi_phu_trach,c.so_dien_thoai AS dien_thoai_phu_trach"
        : f.che_do === "THEO_KY"
          ? "d.*"
          : `h.ma_hoa_don,h.so_hoa_don,h.ma_can_ho,h.ky_thanh_toan,h.tong_tien,h.han_thanh_toan,a.so_can_ho,a.khoi,${overdue} AS qua_han`;
    window.check(count.total);
    const data = await rows(
      db,
      `SELECT ${fields} ${source} ${order} LIMIT ${limit} OFFSET ${offset}`,
      args,
    );
    return {
      data,
      summary,
      total: count.total,
      page,
      filters: f,
      ngay_bao_cao: calendarDay,
      ...stamp,
    };
  });
}
function utcMidnight(vietnamDay, next = false) {
  const timestamp =
    new Date(`${vietnamDay}T00:00:00+07:00`).getTime() + (next ? 86400000 : 0);
  return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}
export async function collections(query, exportFormat) {
  const calendarDay = today(),
    f = filters(query),
    window = reportPage(query, exportFormat),
    { page, offset, limit } = window;
  f.tu_ngay = day(query.tu_ngay || `${calendarDay.slice(0, 7)}-01`);
  f.den_ngay = day(query.den_ngay || calendarDay);
  f.che_do = choice(query.che_do || "GIAO_DICH", "che_do", [
    "GIAO_DICH",
    "THEO_NGAY",
  ]);
  if (f.tu_ngay > f.den_ngay)
    fail(422, "INVALID_DATE_RANGE", "Từ ngày không được sau đến ngày.");
  const { where, values } = conditions(f);
  where.push(`${paid} AND h.ngay_thanh_toan>=? AND h.ngay_thanh_toan<?`);
  values.push(utcMidnight(f.tu_ngay), utcMidnight(f.den_ngay, true));
  const condition = where.join(" AND "),
    localDay =
      "DATE_FORMAT(CONVERT_TZ(h.ngay_thanh_toan,'+00:00','+07:00'),'%Y-%m-%d')";
  return snapshot(async (db) => {
    const [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [summary] = await rows(
      db,
      `SELECT ${money("h.so_tien_da_thu")} AS tong_da_thu,COUNT(*) AS so_khoan_thu,COUNT(DISTINCT h.ma_can_ho) AS so_can_da_thu ${from} WHERE ${condition}`,
      values,
    );
    const source =
      f.che_do === "THEO_NGAY"
        ? `FROM (SELECT ${localDay} AS ngay_thu,${money("h.so_tien_da_thu")} AS da_thu,COUNT(*) AS so_khoan_thu ${from} WHERE ${condition} GROUP BY ${localDay}) d`
        : `${from} LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_xac_nhan WHERE ${condition}`;
    const [count] = await rows(
      db,
      `SELECT COUNT(*) AS total ${source}`,
      values,
    );
    window.check(count.total);
    const fields =
      f.che_do === "THEO_NGAY"
        ? "d.*"
        : "h.ma_hoa_don,h.so_hoa_don,h.ma_can_ho,h.ky_thanh_toan,h.so_tien_da_thu,h.ma_tham_chieu,h.ngay_thanh_toan,a.so_can_ho,a.khoi,u.ho_va_ten AS nguoi_xac_nhan";
    const order =
      f.che_do === "THEO_NGAY"
        ? "d.ngay_thu DESC"
        : "h.ngay_thanh_toan DESC,h.ma_hoa_don DESC";
    const data = await rows(
      db,
      `SELECT ${fields} ${source} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
      values,
    );
    return {
      data,
      summary,
      total: count.total,
      page,
      filters: f,
      ngay_bao_cao: calendarDay,
      ...stamp,
    };
  });
}
```

## 5. `backend/src/modules/financial-reports/financial-reports.routes.js`

```js
import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./financial-reports.service.js";
import { download } from "../report-exports/report-exports.service.js";
export const financialReportsRouter = Router();
financialReportsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
financialReportsRouter.get("/bo_loc", async (req, res) =>
  res.json({ data: await service.blocks() }),
);
financialReportsRouter.get("/cong_no", async (req, res) =>
  res.json(await service.debts(req.query)),
);
financialReportsRouter.get("/thu_phi", async (req, res) =>
  res.json(await service.collections(req.query)),
);

for (const kind of ["cong_no", "thu_phi"])
  financialReportsRouter.get(`/${kind}/xuat`, async (req, res) =>
    download(req, res, kind),
  );
```

## 6. `backend/src/modules/treasury/treasury.service.js`

```js
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text } from "../../lib/http.js";
import * as v from "./treasury.validation.js";
import { prepare } from "./treasury.proofs.js";
import { reportPage } from "../report-exports/report-files.js";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy quỹ, phiếu hoặc chứng từ.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function snapshot(work) {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const r = await work(db);
    await db.commit();
    return r;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
async function getFund(db, id, lock = false) {
  const [f] = await rows(
    db,
    `SELECT * FROM quy_tai_chinh WHERE ma_quy=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!f) missing();
  return f;
}
function open(f) {
  if (!f.dang_hoat_dong)
    fail(409, "FUND_CLOSED", "Quỹ đang tạm ngừng lập và duyệt phiếu mới.");
}
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
// The receipt source is the existing immutable paid invoice, never a copied voucher.
// Fund IDs are validated internal integers; no user strings are interpolated here.
function source(id) {
  // Older installations can use a different utf8mb4 collation. Normalize text
  // in both sources instead of altering the existing financial tables.
  const u = (expression) =>
    `CONVERT(${expression} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
  const voucherCode =
    "CONCAT(IF(p.loai='THU','PT','PC'),LPAD(CAST(p.ma_phieu AS CHAR),GREATEST(6,CHAR_LENGTH(CAST(p.ma_phieu AS CHAR))),'0'))";
  return `(SELECT ${u("'PHIEU'")} AS nguon,p.ma_phieu AS ma_ban_ghi,p.ngay_hach_toan AS ngay,${u("p.loai")} AS loai,p.so_tien,${u("p.nhom")} AS nhom,${u("p.doi_tac")} AS doi_tac,${u("p.dien_giai")} AS dien_giai,p.ma_phieu_goc,${u(voucherCode)} AS so_chung_tu
    FROM phieu_thu_chi p WHERE p.ma_quy=${id} AND p.trang_thai='DA_GHI_SO'
    UNION ALL SELECT ${u("'HOA_DON'")},h.ma_hoa_don,DATE(CONVERT_TZ(h.ngay_thanh_toan,'+00:00','+07:00')),${u("'THU'")},h.so_tien_da_thu,${u("'THU_HOA_DON'")},${u("CONCAT('Căn ',a.so_can_ho)")},${u("CONCAT('Thu hóa đơn ',h.so_hoa_don,' · kỳ ',h.ky_thanh_toan)")},NULL,${u("h.so_hoa_don")}
    FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho JOIN quy_tai_chinh q ON q.ma_quy=${id} AND q.nhan_thu_hoa_don=1
    WHERE h.trang_thai='DA_THANH_TOAN' AND h.ngay_thanh_toan IS NOT NULL) s`;
}

async function balance(db, id) {
  const [r] = await rows(
    db,
    `SELECT CAST(COALESCE(SUM(IF(loai='THU',so_tien,-so_tien)),0) AS CHAR) AS so_du FROM ${source(id)} WHERE ngay<=?`,
    [v.today()],
  );
  return r.so_du;
}
export async function funds(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = query.q ? "WHERE ten_quy LIKE ?" : "";
  if (query.q) args.push(`%${text(query.q, "q", 1, 100)}%`);
  const [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total FROM quy_tai_chinh ${where}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT * FROM quy_tai_chinh ${where} ORDER BY nhan_thu_hoa_don DESC,ma_quy DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function fundDetail(id) {
  return snapshot(async (db) => ({
    ...(await getFund(db, id)),
    so_du: await balance(db, id),
  }));
}
export async function saveFund(id, body, user) {
  const data = v.fund(body);
  return transaction(async (db) => {
    if (id) {
      const old = await getFund(db, id, true);
      await actor(db, user);
      v.version(old, body.phien_ban);
      if (old.nhan_thu_hoa_don && !data.dang_hoat_dong)
        fail(422, "INVOICE_FUND", "Quỹ nhận thu hóa đơn cần luôn hoạt động.");
      await rows(
        db,
        "UPDATE quy_tai_chinh SET ten_quy=?,mo_ta=?,dang_hoat_dong=?,phien_ban=phien_ban+1 WHERE ma_quy=?",
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        "INSERT INTO quy_tai_chinh (ten_quy,mo_ta,dang_hoat_dong) VALUES (?,?,?)",
        Object.values(data),
      );
      id = r.insertId;
    }
    return { ma_quy: id };
  });
}
async function audit(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_thu_chi (ma_phieu,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// No non-locking read in the transaction before taking the fund mutex. In particular
// the immutable fund hint is read outside it, so approvals never reuse an older snapshot.
async function withVoucher(id, user, work) {
  const [hint] = await rows(
    pool,
    "SELECT ma_quy FROM phieu_thu_chi WHERE ma_phieu=?",
    [id],
  );
  if (!hint) missing();
  return transaction(async (db) => {
    const f = await getFund(db, hint.ma_quy, true);
    const [p] = await rows(
      db,
      "SELECT * FROM phieu_thu_chi WHERE ma_phieu=? FOR UPDATE",
      [id],
    );
    if (!p) missing();
    await actor(db, user);
    return work(db, f, p);
  });
}
function draft(p) {
  if (p.trang_thai !== "NHAP")
    fail(
      409,
      "IMMUTABLE_VOUCHER",
      "Chỉ sửa hoặc hủy phiếu nháp. Phiếu đã ghi sổ cần lập phiếu đảo.",
    );
}
const baseFields = "ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai";
export async function create(body, user) {
  const data = v.voucher(body),
    key = v.key(body.khoa_yeu_cau),
    hash = createHash("sha256")
      .update(JSON.stringify({ actor: user.ma_nguoi_dung, ...data }))
      .digest("hex");
  return transaction(async (db) => {
    const f = await getFund(db, data.ma_quy, true);
    await actor(db, user);
    const [prior] = await rows(
      db,
      "SELECT ma_phieu,van_tay FROM phieu_thu_chi WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== hash)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu: prior.ma_phieu, replay: true };
    }
    open(f);
    const r = await rows(
      db,
      `INSERT INTO phieu_thu_chi (${baseFields},ma_nguoi_lap,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [...Object.values(data), user.ma_nguoi_dung, key, hash],
    );
    await audit(db, r.insertId, user, "TAO_NHAP", JSON.stringify(data));
    return { ma_phieu: r.insertId, replay: false };
  });
}
export async function edit(id, body, user) {
  const data = v.voucher(body);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    open(f);
    v.version(p, body.phien_ban);
    if (data.ma_quy !== p.ma_quy || data.loai !== p.loai)
      fail(
        422,
        "IMMUTABLE_FUND",
        "Không đổi quỹ hoặc loại của phiếu đã lập. Hủy nháp và tạo phiếu mới.",
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET nhom=?,ngay_hach_toan=?,so_tien=?,doi_tac=?,dien_giai=?,phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [
        data.nhom,
        data.ngay_hach_toan,
        data.so_tien,
        data.doi_tac,
        data.dien_giai,
        id,
      ],
    );
    await audit(db, id, user, "SUA_NHAP", JSON.stringify(data));
    return { ma_phieu: id };
  });
}
export async function act(id, action, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    if (action === "dao") {
      const reason = v.reason(body.ly_do);
      const [prior] = await rows(
        db,
        "SELECT ma_phieu,dien_giai,ma_nguoi_lap FROM phieu_thu_chi WHERE ma_phieu_goc=? FOR UPDATE",
        [id],
      );
      if (prior) {
        if (
          prior.dien_giai !== reason ||
          prior.ma_nguoi_lap !== user.ma_nguoi_dung
        )
          fail(
            409,
            "ALREADY_REVERSED",
            "Phiếu đã được đảo. Mở phiếu đảo trong chi tiết để kiểm tra.",
          );
        return { ma_phieu: prior.ma_phieu, replay: true };
      }
      v.version(p, body.phien_ban);
      if (p.trang_thai !== "DA_GHI_SO" || p.ma_phieu_goc)
        fail(
          409,
          "INVALID_REVERSAL",
          "Chỉ đảo một lần phiếu gốc đã ghi sổ; không đảo tiếp phiếu đảo.",
        );
      const type = p.loai === "THU" ? "CHI" : "THU";
      if (
        type === "CHI" &&
        BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien)
      )
        fail(
          409,
          "INSUFFICIENT_FUNDS",
          "Quỹ không đủ số dư hiện tại để đảo khoản thu này.",
        );
      const r = await rows(
        db,
        "INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,ma_phieu_goc) VALUES (?,?,'DIEU_CHINH',?,?,?,?,'DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?)",
        [
          p.ma_quy,
          type,
          v.today(),
          p.so_tien,
          p.doi_tac,
          reason,
          user.ma_nguoi_dung,
          user.ma_nguoi_dung,
          id,
        ],
      );
      await rows(
        db,
        "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(
        db,
        id,
        user,
        "DAO_PHIEU",
        `${code({ ...p, ma_phieu: r.insertId, loai: type })}: ${reason}`,
      );
      await audit(db, r.insertId, user, "TAO_DAO", `${code(p)}: ${reason}`);
      return { ma_phieu: r.insertId, replay: false };
    }
    v.version(p, body.phien_ban);
    draft(p);
    if (action === "huy") {
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='HUY',phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(db, id, user, "HUY", v.reason(body.ly_do));
    } else if (action === "duyet") {
      open(f);
      v.day(p.ngay_hach_toan);
      if (p.loai === "CHI") {
        const [n] = await rows(
          db,
          "SELECT COUNT(*) AS total FROM chung_tu_thu_chi WHERE ma_phieu=?",
          [id],
        );
        if (!n.total)
          fail(
            422,
            "PROOF_REQUIRED",
            "Phiếu chi cần ít nhất một chứng từ trước khi duyệt.",
          );
        if (BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien))
          fail(
            409,
            "INSUFFICIENT_FUNDS",
            "Quỹ không đủ số dư hiện tại để duyệt chi.",
          );
      }
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='DA_GHI_SO',ma_nguoi_duyet=?,ngay_duyet=UTC_TIMESTAMP(6),phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [user.ma_nguoi_dung, id],
      );
      await audit(
        db,
        id,
        user,
        "GHI_SO",
        text(body.ghi_chu || "", "ghi_chu", 0, 1000),
      );
    } else fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    return { ma_phieu: id };
  });
}
const select = `p.ma_phieu,p.ma_quy,p.loai,p.nhom,p.ngay_hach_toan,p.so_tien,p.doi_tac,p.dien_giai,p.trang_thai,p.phien_ban,p.ma_phieu_goc,p.ngay_tao,p.ngay_duyet,q.ten_quy,r.ma_phieu AS ma_phieu_dao`;
const from =
  "FROM phieu_thu_chi p JOIN quy_tai_chinh q ON q.ma_quy=p.ma_quy LEFT JOIN phieu_thu_chi r ON r.ma_phieu_goc=p.ma_phieu";
export async function list(query) {
  const { page, offset } = v.pagination(query),
    where = ["1=1"],
    args = [];
  if (query.ma_quy) {
    where.push("p.ma_quy=?");
    args.push(v.positive(query.ma_quy, "ma_quy"));
  }
  if (query.loai) {
    where.push("p.loai=?");
    args.push(choice(query.loai, "loai", ["THU", "CHI"]));
  }
  if (query.trang_thai) {
    where.push("p.trang_thai=?");
    args.push(
      choice(query.trang_thai, "trang_thai", ["NHAP", "DA_GHI_SO", "HUY"]),
    );
  }
  if (query.q) {
    where.push("(p.doi_tac LIKE ? OR p.dien_giai LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  const clause = where.join(" AND "),
    [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total ${from} WHERE ${clause}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT ${select} ${from} WHERE ${clause} ORDER BY p.ma_phieu DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function detail(id) {
  const [p] = await rows(
    pool,
    `SELECT ${select},u.ho_va_ten AS nguoi_lap,d.ho_va_ten AS nguoi_duyet ${from} JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_lap LEFT JOIN nguoi_dung d ON d.ma_nguoi_dung=p.ma_nguoi_duyet WHERE p.ma_phieu=?`,
    [id],
  );
  if (!p) missing();
  p.chung_tu = await rows(
    pool,
    "SELECT ma_chung_tu,ten_tep,loai_tep,kich_thuoc,ngay_tao FROM chung_tu_thu_chi WHERE ma_phieu=? ORDER BY ma_chung_tu",
    [id],
  );
  p.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_thu_chi h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_phieu=? ORDER BY h.ma_lich_su",
    [id],
  );
  return p;
}
export async function attach(id, body, files, user) {
  const prepared = await prepare(files);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    const existing = await rows(
        db,
        "SELECT ma_chung_tu,bam_sha256 FROM chung_tu_thu_chi WHERE ma_phieu=?",
        [id],
      ),
      fresh = prepared.filter(
        (x) => !existing.some((y) => y.bam_sha256 === x.hash),
      );
    if (!fresh.length) return { ma_phieu: id, replay: true };
    v.version(p, body.phien_ban);
    if (existing.length + fresh.length > 5)
      fail(422, "PROOF_LIMIT", "Mỗi phiếu giữ tối đa 5 chứng từ.");
    for (const file of fresh)
      await rows(
        db,
        "INSERT INTO chung_tu_thu_chi (ma_phieu,ten_tep,loai_tep,kich_thuoc,bam_sha256,noi_dung,ma_nguoi_tai) VALUES (?,?,?,?,?,?,?)",
        [
          id,
          file.name,
          file.type,
          file.buffer.length,
          file.hash,
          file.buffer,
          user.ma_nguoi_dung,
        ],
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(
      db,
      id,
      user,
      "THEM_CHUNG_TU",
      fresh.map((f) => f.name).join(", "),
    );
    return { ma_phieu: id, replay: false };
  });
}
export async function removeProof(id, proofId, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    v.version(p, body.phien_ban);
    const r = await rows(
      db,
      "DELETE FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
      [id, proofId],
    );
    if (!r.affectedRows) missing();
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(db, id, user, "XOA_CHUNG_TU", `Chứng từ #${proofId}`);
    return { ma_phieu: id };
  });
}
export async function proof(id, proofId) {
  const [f] = await rows(
    pool,
    "SELECT loai_tep,noi_dung FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
    [id, proofId],
  );
  if (!f) missing();
  return f;
}
export async function ledger(id, query, exportFormat) {
  const range = v.range(query),
    window = reportPage(query, exportFormat),
    { page, offset, limit } = window,
    mode = choice(query.che_do || "GIAO_DICH", "che_do", [
      "GIAO_DICH",
      "THEO_THANG",
    ]);
  return snapshot(async (db) => {
    const fund = await getFund(db, id),
      [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [s] = await rows(
      db,
      `SELECT CAST(COALESCE(SUM(IF(ngay<?,IF(loai='THU',so_tien,-so_tien),0)),0) AS CHAR) AS dau_ky,CAST(COALESCE(SUM(IF(ngay>=? AND loai='THU',so_tien,0)),0) AS CHAR) AS tong_thu,CAST(COALESCE(SUM(IF(ngay>=? AND loai='CHI',so_tien,0)),0) AS CHAR) AS tong_chi FROM ${source(id)} WHERE ngay<=?`,
      [range.tu_ngay, range.tu_ngay, range.tu_ngay, range.den_ngay],
    );
    s.cuoi_ky = (
      BigInt(s.dau_ky) +
      BigInt(s.tong_thu) -
      BigInt(s.tong_chi)
    ).toString();
    const args = [range.tu_ngay, range.den_ngay],
      where = ["ngay>=?", "ngay<=?"];
    if (mode === "GIAO_DICH") {
      if (query.loai) {
        where.push("loai=?");
        args.push(choice(query.loai, "loai", ["THU", "CHI"]));
      }
      if (query.nguon) {
        where.push("nguon=?");
        args.push(choice(query.nguon, "nguon", ["PHIEU", "HOA_DON"]));
      }
      if (query.q) {
        where.push(
          "(so_chung_tu LIKE ? OR doi_tac LIKE ? OR dien_giai LIKE ?)",
        );
        const q = `%${text(query.q, "q", 1, 100)}%`;
        args.push(q, q, q);
      }
    }
    const clause = where.join(" AND "),
      grouped = mode === "THEO_THANG",
      dataFrom = grouped
        ? `FROM (SELECT DATE_FORMAT(ngay,'%Y-%m') AS ky,CAST(SUM(IF(loai='THU',so_tien,0)) AS CHAR) AS tong_thu,CAST(SUM(IF(loai='CHI',so_tien,0)) AS CHAR) AS tong_chi ${"FROM " + source(id)} WHERE ${clause} GROUP BY DATE_FORMAT(ngay,'%Y-%m')) m`
        : `FROM ${source(id)} WHERE ${clause}`;
    const [n] = await rows(db, `SELECT COUNT(*) AS total ${dataFrom}`, args);
    window.check(n.total);
    const data = await rows(
      db,
      `SELECT ${grouped ? "m.*" : "s.*"} ${dataFrom} ORDER BY ${grouped ? "ky DESC" : "ngay DESC,nguon,ma_ban_ghi DESC"} LIMIT ${limit} OFFSET ${offset}`,
      args,
    );
    return {
      fund,
      data,
      total: n.total,
      page,
      summary: s,
      filters: {
        ...range,
        che_do: mode,
        loai: grouped ? "" : query.loai || "",
        nguon: grouped ? "" : query.nguon || "",
        q: grouped ? "" : (query.q || "").trim(),
      },
      ...stamp,
    };
  });
}
```

## 7. `backend/src/modules/treasury/treasury.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./treasury.service.js";
import { upload } from "./treasury.proofs.js";
import { download } from "../report-exports/report-exports.service.js";
export const fundsRouter = Router(),
  vouchersRouter = Router();
for (const router of [fundsRouter, vouchersRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
fundsRouter.get("/", async (req, res) =>
  res.json(await service.funds(req.query)),
);
fundsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveFund(null, req.body, req.user) }),
);
fundsRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.fundDetail(integer(req.params.id, "id")) }),
);
fundsRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.saveFund(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
fundsRouter.get("/:id/so_quy", async (req, res) =>
  res.json(await service.ledger(integer(req.params.id, "id"), req.query)),
);
vouchersRouter.get("/", async (req, res) =>
  res.json(await service.list(req.query)),
);
vouchersRouter.post("/", async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(data.replay ? 200 : 201).json({ data });
});
vouchersRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(integer(req.params.id, "id")) }),
);
vouchersRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.edit(integer(req.params.id, "id"), req.body, req.user),
  }),
);
for (const action of ["duyet", "huy", "dao"])
  vouchersRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.act(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
vouchersRouter.post("/:id/chung_tu", upload, async (req, res) =>
  res.json({
    data: await service.attach(
      integer(req.params.id, "id"),
      req.body,
      req.files,
      req.user,
    ),
  }),
);
vouchersRouter.delete("/:id/chung_tu/:proof", async (req, res) =>
  res.json({
    data: await service.removeProof(
      integer(req.params.id, "id"),
      integer(req.params.proof, "proof"),
      req.body,
      req.user,
    ),
  }),
);
vouchersRouter.get("/:id/chung_tu/:proof", async (req, res) => {
  const f = await service.proof(
    integer(req.params.id, "id"),
    integer(req.params.proof, "proof"),
  );
  res.set("Content-Type", f.loai_tep);
  res.set(
    "Content-Disposition",
    `attachment; filename="chung-tu-${integer(req.params.proof, "proof")}.${f.loai_tep === "application/pdf" ? "pdf" : "jpg"}"`,
  );
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  res.send(f.noi_dung);
});

fundsRouter.get("/:id/so_quy/xuat", async (req, res) =>
  download(req, res, "so_quy", integer(req.params.id, "id")),
);
```

## 8. `frontend/src/shared/ReportExport.jsx`

```jsx
import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
export default function ReportExport({ path, disabled = false }) {
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
        `Đã tạo tệp ${format === "xlsx" ? "Excel" : "PDF"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
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
          disabled={disabled || !!pending}
          onClick={() => download("xlsx")}
        >
          {pending === "xlsx" ? "Đang tạo Excel…" : "Xuất Excel"}
        </button>
        <button
          disabled={disabled || !!pending}
          onClick={() => download("pdf")}
        >
          {pending === "pdf" ? "Đang tạo PDF…" : "Xuất PDF"}
        </button>
        <small>Xuất toàn bộ kết quả theo bộ lọc đã áp dụng.</small>
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

## 9. `frontend/src/features/financial-reports/FinancialReports.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";

import ReportExport from "../../shared/ReportExport.jsx";

const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const day = (value) =>
  value ? value.split("-").reverse().join("/") : "Chưa đặt hạn";
const time = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value.replace(" ", "T") + "Z"))
    : "—";
function Metric({ label, amount, hint, tone = "", onClick, selected }) {
  const body = (
    <>
      <span className="finance-metric-label">{label}</span>
      <strong>{money(amount)}</strong>
      <small>{hint}</small>
    </>
  );
  return onClick ? (
    <button
      className={`finance-metric ${tone}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {body}
    </button>
  ) : (
    <div className={`finance-metric ${tone}`}>{body}</div>
  );
}
function Pager({ result, loading, go }) {
  return (
    <div className="actions finance-pager">
      <button
        disabled={loading || (result?.page || 1) <= 1}
        onClick={() => go(result.page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {result?.page || 1} · {result?.total || 0} bản ghi
      </span>
      <button
        disabled={loading || (result?.page || 1) * 20 >= (result?.total || 0)}
        onClick={() => go(result.page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
// Tag results with their request so switching report types never renders stale columns/totals.
function useReport(path) {
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

function OverdueFilter({ value, loading, label, onChange }) {
  const [checked, setChecked] = useState(value);
  useEffect(() => setChecked(value), [value]);
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        disabled={loading}
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          // Reflect the click immediately while router navigation updates the URL.
          setChecked(next);
          onChange(next);
        }}
      />
      {label}
    </label>
  );
}

export default function FinancialReports() {
  const calendarDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [params, setParams] = useSearchParams();
  const cash = params.get("bao_cao") === "THU_PHI",
    endpoint = cash ? "thu_phi" : "cong_no";
  const query = new URLSearchParams(params);
  query.delete("bao_cao");
  const resource = useReport(`/bao_cao/${endpoint}?${query}`),
    blocks = useResource("/bao_cao/bo_loc"),
    result = resource.result,
    f = result?.filters,
    s = result?.summary;
  const view = params.get("che_do") || (cash ? "GIAO_DICH" : "CAN_HO"),
    overdue = params.get("qua_han") === "1";
  function setView(che_do, more = {}) {
    const next = new URLSearchParams(params);
    next.set("che_do", che_do);
    next.delete("page");
    next.delete("qua_han");
    for (const [k, v] of Object.entries(more)) next.set(k, v);
    setParams(next);
  }
  function switchReport(report) {
    const next = new URLSearchParams();
    next.set("bao_cao", report);
    for (const k of ["khoi", "q"])
      if (params.get(k)) next.set(k, params.get(k));
    setParams(next);
  }
  function showApartment(id) {
    setView("HOA_DON", { ma_can_ho: String(id) });
  }
  const billLink = (b) => (
    <Link to={`/quan-tri/hoa-don/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi tài chính</p>
          <h1>Báo cáo công nợ và thu phí</h1>
        </div>
        <button disabled={resource.loading} onClick={resource.reload}>
          Cập nhật số liệu
        </button>
      </div>
      <div className="finance-tabs" role="group" aria-label="Loại báo cáo">
        <button
          className={!cash ? "primary" : ""}
          aria-pressed={!cash}
          onClick={() => switchReport("CONG_NO")}
        >
          Công nợ theo kỳ hóa đơn
        </button>
        <button
          className={cash ? "primary" : ""}
          aria-pressed={cash}
          onClick={() => switchReport("THU_PHI")}
        >
          Thu phí theo ngày xác nhận
        </button>
      </div>
      <p className="muted">
        {cash
          ? "Tổng tiền BQL đã ghi nhận thu trong khoảng ngày tại Việt Nam, gồm cả khoản thu cho kỳ hóa đơn cũ. Thời điểm xác nhận có thể khác ngày cư dân chuyển khoản."
          : "Công nợ hiện tại của các kỳ hóa đơn đã chọn. Tổng đã gửi = đã thu + còn phải thu; nợ quá hạn nằm trong số còn phải thu. Mặc định xem tất cả kỳ để không bỏ sót nợ cũ."}
      </p>
      <form
        className="filters finance-filters"
        key={`${endpoint}:${params}`}
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          next.set("bao_cao", cash ? "THU_PHI" : "CONG_NO");
          next.set("che_do", view);
          if (!cash && overdue && view !== "THEO_KY") next.set("qua_han", "1");
          setParams(next);
        }}
      >
        {cash ? (
          <>
            <Field
              label="Từ ngày xác nhận"
              type="date"
              name="tu_ngay"
              required
              max={calendarDay}
              defaultValue={
                params.get("tu_ngay") || `${calendarDay.slice(0, 7)}-01`
              }
            />
            <Field
              label="Đến ngày xác nhận"
              type="date"
              name="den_ngay"
              required
              max={calendarDay}
              defaultValue={params.get("den_ngay") || calendarDay}
            />
          </>
        ) : (
          <>
            <Field
              label="Từ kỳ hóa đơn"
              type="month"
              name="tu_ky"
              defaultValue={params.get("tu_ky") || ""}
            />
            <Field
              label="Đến kỳ hóa đơn"
              type="month"
              name="den_ky"
              defaultValue={params.get("den_ky") || ""}
            />
          </>
        )}
        <Field label="Khối">
          <select name="khoi" defaultValue={params.get("khoi") || ""}>
            <option value="">Tất cả khối</option>
            {params.get("khoi") &&
              !blocks.result?.data.some(
                (b) => b.khoi === params.get("khoi"),
              ) && (
                <option value={params.get("khoi")}>{params.get("khoi")}</option>
              )}
            {blocks.result?.data.map((b) => (
              <option value={b.khoi} key={b.khoi}>
                {b.khoi}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Tìm số căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        {params.get("ma_can_ho") && (
          <input
            type="hidden"
            name="ma_can_ho"
            value={params.get("ma_can_ho")}
          />
        )}
        <button className="primary" disabled={resource.loading}>
          Xem báo cáo
        </button>
        <button
          type="button"
          onClick={() => setParams({ bao_cao: cash ? "THU_PHI" : "CONG_NO" })}
        >
          Xóa bộ lọc
        </button>
      </form>
      <ReportExport
        path={`/bao_cao/${endpoint}/xuat?${query}`}
        disabled={resource.loading || !result}
      />
      <ErrorBox error={blocks.error} />
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {s && (
        <>
          <p className="finance-snapshot">
            Dữ liệu lúc {time(result.tai_luc)} · Giờ Việt Nam
            {!cash && ` · Xét quá hạn đến ${day(result.ngay_bao_cao)}`}
          </p>
          {cash ? (
            <div
              className="finance-metrics finance-metrics-cash"
              aria-label="Tổng hợp thu phí"
            >
              <Metric
                label="Đã ghi nhận thu"
                amount={s.tong_da_thu}
                hint={`${s.so_khoan_thu} khoản · ${s.so_can_da_thu} căn hộ`}
                tone="is-paid"
              />
              <div className="finance-date-range">
                <span>Khoảng ngày xác nhận</span>
                <strong>
                  {day(f.tu_ngay)} — {day(f.den_ngay)}
                </strong>
                <small>
                  Theo thời điểm xác nhận trên hệ thống, không phải kỳ hóa đơn.
                </small>
              </div>
            </div>
          ) : (
            <>
              <div className="finance-metrics" aria-label="Tổng hợp công nợ">
                <Metric
                  label="Tổng đã gửi"
                  amount={s.tong_da_gui}
                  hint={`${s.so_hoa_don} hóa đơn đã gửi hoặc đã thu`}
                />
                <Metric
                  label="Đã thu theo kỳ hóa đơn"
                  amount={s.da_thu}
                  hint={`${s.so_hoa_don_da_thu} hóa đơn đã thu`}
                  tone="is-paid"
                />
                <Metric
                  label="Còn phải thu"
                  amount={s.con_phai_thu}
                  hint={`${s.so_hoa_don_chua_thu} hóa đơn · ${s.so_can_con_no} căn còn nợ`}
                  onClick={() => setView("CAN_HO")}
                  selected={view === "CAN_HO" && !overdue}
                />
                <Metric
                  label="Nợ quá hạn"
                  amount={s.no_qua_han}
                  hint={`${s.so_hoa_don_qua_han} hóa đơn quá hạn · Bấm để xem`}
                  tone="is-overdue"
                  onClick={() => setView("HOA_DON", { qua_han: "1" })}
                  selected={view === "HOA_DON" && overdue}
                />
              </div>
              <div className="finance-progress">
                <div>
                  <strong>
                    Tỷ lệ đã thu:{" "}
                    {s.ty_le_da_thu.toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </strong>
                  <span>Tính theo giá trị hóa đơn</span>
                </div>
                <progress
                  value={s.ty_le_da_thu}
                  max="100"
                  aria-label="Tỷ lệ đã thu theo giá trị hóa đơn"
                />
              </div>
              <p className="muted">
                Không tính bản nháp, hóa đơn chưa gửi hoặc đã hủy. Đây là số dư
                hiện tại, không phải số dư hồi tố tại một ngày trong quá khứ.
              </p>
            </>
          )}
        </>
      )}
      <section className="card finance-results" aria-label="Chi tiết báo cáo">
        <div
          className="finance-tabs"
          role="group"
          aria-label="Cách xem chi tiết"
        >
          {(cash
            ? [
                ["GIAO_DICH", "Các khoản đã thu"],
                ["THEO_NGAY", "Tổng hợp theo ngày"],
              ]
            : [
                ["CAN_HO", "Công nợ theo căn"],
                ["HOA_DON", "Hóa đơn chưa thu"],
                ["THEO_KY", "Tổng hợp theo kỳ"],
              ]
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={view === key}
              className={view === key ? "primary" : ""}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {!cash && view !== "THEO_KY" && (
          <OverdueFilter
            value={overdue}
            loading={resource.loading}
            label={
              view === "CAN_HO"
                ? "Chỉ căn có nợ quá hạn"
                : "Chỉ hóa đơn quá hạn"
            }
            onChange={(checked) =>
              setView(view, { qua_han: checked ? "1" : "0" })
            }
          />
        )}
        {params.get("ma_can_ho") && (
          <p className="note">
            Đang xem riêng căn đã chọn.{" "}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("ma_can_ho");
                next.delete("page");
                setParams(next);
              }}
            >
              Xem mọi căn trong bộ lọc
            </button>
          </p>
        )}
        {!cash && (
          <p className="muted">
            Các số tổng ở trên theo bộ lọc kỳ/khối/căn. Chọn cách xem hoặc chỉ
            xem quá hạn chỉ đổi bảng chi tiết.
            {view === "CAN_HO" &&
              " Mỗi căn vẫn gồm toàn bộ nợ của các kỳ đã chọn. Người phụ trách là người hiện tại, không tự thay nghĩa vụ tài chính của hóa đơn cũ."}
          </p>
        )}
        {result && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {cash ? (
                      view === "THEO_NGAY" ? (
                        <>
                          <th>Ngày xác nhận (VN)</th>
                          <th>Số khoản</th>
                          <th>Đã thu</th>
                        </>
                      ) : (
                        <>
                          <th>Hóa đơn</th>
                          <th>Căn / khối / kỳ</th>
                          <th>Thời điểm xác nhận (VN)</th>
                          <th>Tham chiếu</th>
                          <th>Người xác nhận</th>
                          <th>Số tiền đã thu</th>
                        </>
                      )
                    ) : view === "CAN_HO" ? (
                      <>
                        <th>Căn / khối</th>
                        <th>Người phụ trách hiện tại</th>
                        <th>Hóa đơn chưa thu</th>
                        <th>Hạn sớm nhất</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                        <th>Chi tiết</th>
                      </>
                    ) : view === "HOA_DON" ? (
                      <>
                        <th>Hóa đơn</th>
                        <th>Căn / khối</th>
                        <th>Kỳ hóa đơn</th>
                        <th>Hạn thanh toán</th>
                        <th>Tình trạng</th>
                        <th>Còn phải thu</th>
                        <th>Xử lý</th>
                      </>
                    ) : (
                      <>
                        <th>Kỳ hóa đơn</th>
                        <th>Số hóa đơn</th>
                        <th>Tổng đã gửi</th>
                        <th>Đã thu</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, i) => (
                    <tr
                      key={
                        r.ma_hoa_don ||
                        r.ma_can_ho ||
                        r.ky_thanh_toan ||
                        r.ngay_thu ||
                        i
                      }
                    >
                      {cash ? (
                        view === "THEO_NGAY" ? (
                          <>
                            <td>{day(r.ngay_thu)}</td>
                            <td>{r.so_khoan_thu}</td>
                            <td className="finance-number">
                              {money(r.da_thu)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{billLink(r)}</td>
                            <td>
                              {r.so_can_ho} · {r.khoi}
                              <br />
                              {r.ky_thanh_toan}
                            </td>
                            <td>{time(r.ngay_thanh_toan)}</td>
                            <td>{r.ma_tham_chieu}</td>
                            <td>{r.nguoi_xac_nhan || "—"}</td>
                            <td className="finance-number">
                              {money(r.so_tien_da_thu)}
                            </td>
                          </>
                        )
                      ) : view === "CAN_HO" ? (
                        <>
                          <td>
                            <strong>{r.so_can_ho}</strong>
                            <br />
                            Khối {r.khoi}
                          </td>
                          <td>
                            {r.nguoi_phu_trach || "Chưa gắn chủ hộ"}
                            {r.dien_thoai_phu_trach && (
                              <small className="finance-contact">
                                {r.dien_thoai_phu_trach}
                              </small>
                            )}
                          </td>
                          <td>{r.so_hoa_don_chua_thu}</td>
                          <td>{day(r.han_som_nhat)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td
                            className={`finance-number ${r.no_qua_han !== "0" ? "finance-overdue" : ""}`}
                          >
                            {money(r.no_qua_han)}
                          </td>
                          <td>
                            <button onClick={() => showApartment(r.ma_can_ho)}>
                              Xem hóa đơn
                            </button>
                          </td>
                        </>
                      ) : view === "HOA_DON" ? (
                        <>
                          <td>{billLink(r)}</td>
                          <td>
                            {r.so_can_ho} · {r.khoi}
                          </td>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{day(r.han_thanh_toan)}</td>
                          <td>
                            {r.qua_han ? (
                              <span className="finance-overdue">Quá hạn</span>
                            ) : r.han_thanh_toan ? (
                              "Chưa quá hạn"
                            ) : (
                              "Chưa đặt hạn"
                            )}
                          </td>
                          <td className="finance-number">
                            {money(r.tong_tien)}
                          </td>
                          <td>
                            <Link
                              className="button"
                              to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}
                            >
                              Kiểm tra / nhắc phí
                            </Link>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{r.so_hoa_don}</td>
                          <td className="finance-number">
                            {money(r.tong_da_gui)}
                          </td>
                          <td className="finance-number">{money(r.da_thu)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td className="finance-number">
                            {money(r.no_qua_han)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.total === 0 && (
              <p className="finance-empty">
                {cash
                  ? "Chưa có khoản thu trong khoảng ngày và bộ lọc đã chọn."
                  : "Không có dữ liệu phù hợp với cách xem và bộ lọc đã chọn."}
              </p>
            )}
            <Pager
              result={result}
              loading={resource.loading}
              go={(page) => {
                const next = new URLSearchParams(params);
                next.set("page", page);
                setParams(next);
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
```

## 10. `frontend/src/features/treasury/Treasury.jsx`

```jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
import ReportExport from "../../shared/ReportExport.jsx";
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (n) => (n ? n.split("-").reverse().join("/") : "—");
const time = (n) =>
  n
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(n.replace(" ", "T") + "Z"))
    : "—";
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
const types = { THU: "Phiếu thu", CHI: "Phiếu chi" },
  states = { NHAP: "Bản nháp", DA_GHI_SO: "Đã ghi sổ", HUY: "Đã hủy" };
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
const allowed = {
  THU: ["BO_SUNG_QUY", "THU_KHAC"],
  CHI: ["VAN_HANH", "BAO_TRI", "MUA_SAM", "CHI_KHAC"],
};
const events = {
  TAO_NHAP: "Lập nháp",
  SUA_NHAP: "Sửa nháp",
  GHI_SO: "Duyệt và ghi sổ",
  HUY: "Hủy nháp",
  DAO_PHIEU: "Đảo phiếu gốc",
  TAO_DAO: "Lập phiếu đảo",
  THEM_CHUNG_TU: "Thêm chứng từ",
  XOA_CHUNG_TU: "Xóa chứng từ",
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
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
    reload: () => setRevision((x) => x + 1),
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
          ? "Đã mở lại kết quả đã lưu trước đó."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    notice,
    run,
    clear: () => {
      setError(null);
      setNotice("");
    },
  };
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
function Nav() {
  return (
    <div className="actions">
      <Link to="/quan-tri/quy">Danh sách quỹ</Link>
      <Link to="/quan-tri/phieu-thu-chi">Phiếu thu / chi</Link>
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
function FundForm({ fund, action, onSave, onCancel }) {
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_hoat_dong: fund?.nhan_thu_hoa_don
            ? true
            : b.dang_hoat_dong === "1",
          ...(fund ? { phien_ban: fund.phien_ban } : {}),
        });
      }}
    >
      <h2>{fund ? "Sửa thông tin quỹ" : "Tạo quỹ"}</h2>
      <Feedback action={action} />
      <Field label="Tên quỹ">
        <input
          name="ten_quy"
          required
          minLength={2}
          maxLength={120}
          defaultValue={fund?.ten_quy}
        />
      </Field>
      <Field label="Mô tả quỹ">
        <textarea
          name="mo_ta"
          rows={3}
          maxLength={1000}
          defaultValue={fund?.mo_ta}
        />
      </Field>
      <Field label="Trạng thái quỹ">
        <select
          name="dang_hoat_dong"
          disabled={!!fund?.nhan_thu_hoa_don}
          defaultValue={fund ? String(Number(fund.dang_hoat_dong)) : "1"}
        >
          <option value="1">Đang hoạt động</option>
          <option value="0">Tạm ngừng lập / duyệt phiếu mới</option>
        </select>
      </Field>
      <p className="muted">
        Quỹ mới bắt đầu từ 0. Ghi nhận số tiền ban đầu bằng phiếu Thu / Bổ sung
        quỹ và duyệt để ghi sổ. Chưa có chuyển tiền tự động giữa các quỹ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu quỹ
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Funds() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/quy?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TÀI CHÍNH CHUNG CƯ</p>
          <h1>Thu chi và quỹ</h1>
          <p>Theo dõi tiền đã ghi nhận, chứng từ và số dư từng quỹ.</p>
        </div>
        <button className="primary" onClick={() => setForm(true)}>
          Tạo quỹ
        </button>
      </div>
      <Nav />
      <p className="note">
        Tiền hóa đơn đã xác nhận thu tự xuất hiện trong quỹ vận hành. Không lập
        thêm phiếu thu khác cho cùng khoản tiền đó. Số dư phần mềm cần đối soát
        với tiền mặt và ngân hàng thực tế.
      </p>
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Tìm quỹ">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
          />
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FundForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/quy", "POST", b, (d) =>
              navigate(`/quan-tri/quy/${d.ma_quy}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="treasury-funds">
          {resource.result?.data.map((f) => (
            <article className="card" key={f.ma_quy}>
              <span
                className={`treasury-tag ${f.dang_hoat_dong ? "" : "treasury-closed"}`}
              >
                {f.dang_hoat_dong ? "Đang hoạt động" : "Tạm ngừng"}
              </span>
              <h2>
                <Link to={`/quan-tri/quy/${f.ma_quy}`}>{f.ten_quy}</Link>
              </h2>
              <p className="treasury-text">{f.mo_ta}</p>
              {!!f.nhan_thu_hoa_don && (
                <p className="muted">
                  Tự tổng hợp các hóa đơn đã xác nhận thu.
                </p>
              )}
              <Link className="button" to={`/quan-tri/quy/${f.ma_quy}`}>
                Mở sổ quỹ
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card">Chưa có quỹ phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
export function FundDetail() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    resource = useData(`/quy/${id}/so_quy?${params}`),
    [edit, setEdit] = useState(false),
    action = useAction(() => {
      setEdit(false);
      resource.reload();
    }),
    r = resource.result,
    f = r?.fund,
    s = r?.summary,
    monthly = r?.filters.che_do === "THEO_THANG";
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">SỔ QUỸ</p>
                <h1>{f.ten_quy}</h1>
                <p className="treasury-text">{f.mo_ta}</p>
              </div>
              <div className="actions">
                <button onClick={() => setEdit(true)}>Sửa quỹ</button>
                <Link
                  className="button primary"
                  to={`/quan-tri/phieu-thu-chi/moi?ma_quy=${id}`}
                >
                  Lập phiếu thu / chi
                </Link>
              </div>
            </div>
            {edit && (
              <FundForm
                fund={f}
                action={action}
                onCancel={() => setEdit(false)}
                onSave={(b) => action.run(`/quy/${id}`, "PUT", b)}
              />
            )}
            <p className="note">
              Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Dữ liệu lúc{" "}
              {time(r.tai_luc)}. Tổng hợp theo ngày hạch toán tại Việt Nam; bộ
              lọc nguồn/loại/tìm kiếm chỉ thay danh sách.
            </p>
            <form
              className="card treasury-filters"
              key={params.toString()}
              onSubmit={(e) => {
                e.preventDefault();
                setParams(values(e));
              }}
            >
              <Field label="Từ ngày hạch toán">
                <input
                  type="date"
                  name="tu_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.tu_ngay}
                />
              </Field>
              <Field label="Đến ngày hạch toán">
                <input
                  type="date"
                  name="den_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.den_ngay}
                />
              </Field>
              <Field label="Cách xem sổ quỹ">
                <select name="che_do" defaultValue={r.filters.che_do}>
                  <option value="GIAO_DICH">Từng khoản thu / chi</option>
                  <option value="THEO_THANG">Tổng hợp theo tháng</option>
                </select>
              </Field>
              <Field label="Nguồn ghi sổ">
                <select
                  name="nguon"
                  disabled={monthly}
                  defaultValue={params.get("nguon") || ""}
                >
                  <option value="">Tất cả nguồn</option>
                  <option value="PHIEU">Phiếu thu / chi</option>
                  <option value="HOA_DON">Hóa đơn</option>
                </select>
              </Field>
              <Field label="Loại giao dịch">
                <select
                  name="loai"
                  disabled={monthly}
                  defaultValue={params.get("loai") || ""}
                >
                  <Options values={{ THU: "Thu", CHI: "Chi" }} empty="Tất cả" />
                </select>
              </Field>
              <Field label="Tìm trong sổ quỹ">
                <input
                  name="q"
                  disabled={monthly}
                  maxLength={100}
                  defaultValue={params.get("q") || ""}
                />
              </Field>
              <button>Lọc sổ quỹ</button>
            </form>
            <ReportExport
              path={`/quy/${id}/so_quy/xuat?${params}`}
              disabled={resource.loading || !r}
            />
            <div className="treasury-metrics" aria-label="Tổng hợp số dư">
              {[
                ["Đầu kỳ", s.dau_ky],
                ["Thu trong kỳ", s.tong_thu],
                ["Chi trong kỳ", s.tong_chi],
                ["Cuối kỳ", s.cuoi_ky],
              ].map(([label, n]) => (
                <div className="card" key={label}>
                  <span>{label}</span>
                  <strong>{money(n)}</strong>
                </div>
              ))}
            </div>
            {BigInt(s.cuoi_ky) < 0n && (
              <p className="error">
                Số dư cuối kỳ âm. Kiểm tra dữ liệu đầu kỳ và các khoản hạch toán
                lùi ngày.
              </p>
            )}
            <section className="card">
              <div className="actions">
                <Link to={`/quan-tri/phieu-thu-chi?ma_quy=${id}`}>
                  Xem phiếu nháp / đã ghi sổ của quỹ
                </Link>
                <button onClick={resource.reload}>Cập nhật sổ quỹ</button>
              </div>
              <p className="muted">
                Số dư bắt đầu từ 0 trước dữ liệu đầu tiên. Hạch toán lùi ngày có
                thể làm số dư quá khứ âm dù lúc duyệt chi quỹ đủ tiền. Đây chưa
                phải báo cáo ngân hàng đã đối soát.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(monthly
                        ? ["Tháng", "Tổng thu", "Tổng chi", "Chênh lệch"]
                        : [
                            "Ngày hạch toán",
                            "Chứng từ / nguồn",
                            "Người nộp / nhận",
                            "Diễn giải",
                            "Thu",
                            "Chi",
                          ]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.map((p, i) =>
                      monthly ? (
                        <tr key={p.ky}>
                          <td>{p.ky}</td>
                          <td>{money(p.tong_thu)}</td>
                          <td>{money(p.tong_chi)}</td>
                          <td>
                            {money(BigInt(p.tong_thu) - BigInt(p.tong_chi))}
                          </td>
                        </tr>
                      ) : (
                        <tr key={`${p.nguon}-${p.ma_ban_ghi}`}>
                          <td>{day(p.ngay)}</td>
                          <td>
                            <Link
                              to={
                                p.nguon === "HOA_DON"
                                  ? `/quan-tri/hoa-don/${p.ma_ban_ghi}`
                                  : `/quan-tri/phieu-thu-chi/${p.ma_ban_ghi}`
                              }
                            >
                              {p.so_chung_tu}
                            </Link>
                            <small className="treasury-subtitle">
                              {categories[p.nhom] || p.nhom}
                            </small>
                          </td>
                          <td>{p.doi_tac}</td>
                          <td className="treasury-text">{p.dien_giai}</td>
                          <td className="treasury-money">
                            {p.loai === "THU" ? money(p.so_tien) : "—"}
                          </td>
                          <td className="treasury-money">
                            {p.loai === "CHI" ? money(p.so_tien) : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {!r.total && <p className="muted">Chưa có giao dịch phù hợp.</p>}
              <Pager resource={resource} />
            </section>
          </>
        )
      )}
    </>
  );
}
function VoucherForm({ fund, data, action, onSave, onCancel, onChange }) {
  const [type, setType] = useState(data?.loai || "THU");
  return (
    <form
      className="card"
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...values(e),
          ma_quy: fund.ma_quy,
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa phiếu nháp" : "Lập phiếu thu / chi"}</h2>
      <p>
        Quỹ: <strong>{fund.ten_quy}</strong>
      </p>
      <Feedback action={action} />
      <div className="treasury-form-grid">
        <Field label="Loại phiếu">
          <select
            name="loai"
            value={type}
            disabled={!!data}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        {data && <input type="hidden" name="loai" value={data.loai} />}
        <Field label="Nhóm thu / chi">
          <select
            name="nhom"
            key={type}
            defaultValue={data?.nhom || allowed[type][0]}
          >
            <Options
              values={Object.fromEntries(
                allowed[type].map((k) => [k, categories[k]]),
              )}
            />
          </select>
        </Field>
        <Field label="Ngày hạch toán">
          <input
            type="date"
            name="ngay_hach_toan"
            max={today()}
            required
            defaultValue={data?.ngay_hach_toan || today()}
          />
        </Field>
        <Field label="Số tiền (đồng)">
          <input
            name="so_tien"
            inputMode="numeric"
            pattern="[0-9]{1,14}"
            required
            defaultValue={data?.so_tien}
            placeholder="Ví dụ: 1500000"
          />
        </Field>
      </div>
      <Field label="Người nộp / người nhận">
        <input
          name="doi_tac"
          required
          minLength={2}
          maxLength={150}
          defaultValue={data?.doi_tac}
        />
      </Field>
      <Field label="Diễn giải thu / chi">
        <textarea
          name="dien_giai"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          defaultValue={data?.dien_giai}
        />
      </Field>
      <p className="muted">
        Lưu nháp chưa thay đổi số dư. Sau khi lưu, thêm chứng từ rồi duyệt để
        ghi sổ; phiếu chi bắt buộc có ít nhất một chứng từ. Không lập phiếu thu
        khác cho khoản hóa đơn đã được xác nhận thu.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu phiếu nháp
        </button>
        {onCancel && (
          <button type="button" disabled={action.pending} onClick={onCancel}>
            Đóng biểu mẫu
          </button>
        )}
      </div>
    </form>
  );
}
export function VoucherNew() {
  const [params] = useSearchParams(),
    id = params.get("ma_quy") || "0",
    resource = useData(`/quy/${id}`),
    navigate = useNavigate(),
    [key, setKey] = useState(newRequestKey),
    action = useAction(),
    fund = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        fund && (
          <VoucherForm
            fund={fund}
            action={action}
            onChange={() => setKey(newRequestKey())}
            onSave={(b) =>
              action.run(
                "/phieu_thu_chi",
                "POST",
                { ...b, khoa_yeu_cau: key },
                (d) => navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`),
              )
            }
          />
        )
      )}
    </>
  );
}
export function Vouchers() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/phieu_thu_chi?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHỨNG TỪ NỘI BỘ</p>
          <h1>Phiếu thu và phiếu chi</h1>
        </div>
        <Link
          className="button primary"
          to={
            params.get("ma_quy")
              ? `/quan-tri/phieu-thu-chi/moi?ma_quy=${params.get("ma_quy")}`
              : "/quan-tri/quy"
          }
        >
          Chọn quỹ để lập phiếu
        </Link>
      </div>
      <Nav />
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_quy")) b.ma_quy = params.get("ma_quy");
          setParams(b);
        }}
      >
        <Field label="Tìm phiếu thu chi">
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            maxLength={100}
            placeholder="Người nộp/nhận hoặc diễn giải"
          />
        </Field>
        <Field label="Lọc loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả" />
          </select>
        </Field>
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_quy") && (
        <p className="note">
          Đang lọc quỹ #{params.get("ma_quy")}.{" "}
          <Link to="/quan-tri/phieu-thu-chi">Bỏ lọc quỹ</Link>
        </p>
      )}
      <ErrorBox error={resource.error} />
      <section className="card">
        {resource.loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phiếu</th>
                    <th>Quỹ / đối tác</th>
                    <th>Ngày hạch toán</th>
                    <th>Diễn giải</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.result?.data.map((p) => (
                    <tr key={p.ma_phieu}>
                      <td>
                        <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu}`}>
                          {code(p)}
                        </Link>
                        <small className="treasury-subtitle">
                          {types[p.loai]}
                        </small>
                      </td>
                      <td>
                        {p.ten_quy}
                        <small className="treasury-subtitle">{p.doi_tac}</small>
                      </td>
                      <td>{day(p.ngay_hach_toan)}</td>
                      <td className="treasury-text">{p.dien_giai}</td>
                      <td className="treasury-money">{money(p.so_tien)}</td>
                      <td>
                        {states[p.trang_thai]}
                        {p.ma_phieu_goc && (
                          <small className="treasury-subtitle">Phiếu đảo</small>
                        )}
                        {p.ma_phieu_dao && (
                          <small className="treasury-subtitle">
                            Đã có phiếu đảo
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!resource.result?.total && (
              <p className="muted">Chưa có phiếu phù hợp.</p>
            )}
          </>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function Proofs({ p, reload }) {
  const [files, setFiles] = useState([]),
    form = useRef(null),
    action = useAction(reload);
  return (
    <section className="card">
      <h2>Chứng từ đính kèm</h2>
      <Feedback action={action} />
      {p.chung_tu.length === 0 ? (
        <p className="muted">Chưa có chứng từ.</p>
      ) : (
        <ul className="treasury-proofs">
          {p.chung_tu.map((f) => (
            <li key={f.ma_chung_tu}>
              <a
                href={`/api/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`}
                download
              >
                {f.ten_tep}
              </a>
              <small>
                {Math.ceil(f.kich_thuoc / 1024)} KB ·{" "}
                {f.loai_tep === "application/pdf" ? "PDF" : "Ảnh JPEG"}
              </small>
              {p.trang_thai === "NHAP" && (
                <button
                  className="danger"
                  disabled={action.pending}
                  onClick={() =>
                    action.run(
                      `/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`,
                      "DELETE",
                      { phien_ban: p.phien_ban },
                    )
                  }
                >
                  Xóa chứng từ #{f.ma_chung_tu}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {p.ma_phieu_goc && (
        <p className="note">
          Chứng từ gốc được giữ tại{" "}
          <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
            phiếu gốc
          </Link>
          .
        </p>
      )}
      {p.trang_thai === "NHAP" && (
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            const b = new FormData();
            b.set("phien_ban", p.phien_ban);
            for (const f of files) b.append("chung_tu", f, f.name);
            action.run(
              `/phieu_thu_chi/${p.ma_phieu}/chung_tu`,
              "POST",
              b,
              () => {
                setFiles([]);
                form.current?.reset();
              },
            );
          }}
        >
          <Field label="Chọn chứng từ ảnh hoặc PDF">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </Field>
          <p role="status">
            {files.length
              ? `Đã chọn ${files.length} tệp: ${files.map((f) => f.name).join(", ")}`
              : "Chưa chọn tệp để tải lên."}
          </p>
          <p className="muted">
            Tối đa 5 chứng từ mỗi phiếu, 5 MB mỗi tệp. Ảnh JPEG/PNG/WebP được
            chuyển JPEG và bỏ metadata; PDF chỉ tải xuống. Chọn tệp rồi bấm Tải
            chứng từ lên, sau đó mới duyệt phiếu.
          </p>
          <button disabled={action.pending || !files.length}>
            Tải chứng từ lên
          </button>
        </form>
      )}
    </section>
  );
}
function historyNote(h) {
  if (["TAO_NHAP", "SUA_NHAP"].includes(h.su_kien)) {
    try {
      const p = JSON.parse(h.ghi_chu);
      return `${p.dien_giai}\n${day(p.ngay_hach_toan)} · ${p.doi_tac} · ${money(p.so_tien)}`;
    } catch {
      return h.ghi_chu;
    }
  }
  return h.ghi_chu;
}
export function VoucherDetail() {
  const { id } = useParams(),
    resource = useData(`/phieu_thu_chi/${id}`),
    [editing, setEditing] = useState(false),
    action = useAction(() => {
      setEditing(false);
      resource.reload();
    }),
    navigate = useNavigate(),
    p = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        p && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{types[p.loai]}</p>
                  <h1>{code(p)}</h1>
                  <Link to={`/quan-tri/quy/${p.ma_quy}`}>{p.ten_quy}</Link>
                </div>
                <span className={`treasury-tag treasury-${p.trang_thai}`}>
                  {states[p.trang_thai]}
                </span>
              </div>
              <div className="treasury-voucher-summary">
                <div>
                  <span>Số tiền</span>
                  <strong>{money(p.so_tien)}</strong>
                  <span>{categories[p.nhom]}</span>
                </div>
                <div>
                  <span>Ngày hạch toán / người nộp, nhận</span>
                  <strong>{day(p.ngay_hach_toan)}</strong>
                  <span>{p.doi_tac}</span>
                </div>
              </div>
              <p className="treasury-text">{p.dien_giai}</p>
              <p className="muted">
                Lập bởi {p.nguoi_lap} · {time(p.ngay_tao)}
                {p.nguoi_duyet &&
                  ` · Duyệt bởi ${p.nguoi_duyet} lúc ${time(p.ngay_duyet)}`}
              </p>
              {p.ma_phieu_dao && (
                <p className="note">
                  Đã có{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_dao}`}>
                    phiếu đảo
                  </Link>
                  . Cả hai khoản được giữ trong sổ để theo dõi điều chỉnh.
                </p>
              )}
              {p.ma_phieu_goc && (
                <p className="note">
                  Đây là phiếu đảo của{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
                    phiếu gốc
                  </Link>
                  ; không đảo tiếp phiếu này.
                </p>
              )}
              {p.trang_thai === "NHAP" && (
                <button onClick={() => setEditing(true)}>Sửa phiếu nháp</button>
              )}
            </section>
            <Feedback action={action} />
            {editing && (
              <VoucherForm
                key={p.phien_ban}
                fund={{ ma_quy: p.ma_quy, ten_quy: p.ten_quy }}
                data={p}
                action={action}
                onCancel={() => setEditing(false)}
                onSave={(b) => action.run(`/phieu_thu_chi/${id}`, "PUT", b)}
              />
            )}
            <Proofs
              p={p}
              reload={() => {
                action.clear();
                resource.reload();
              }}
            />
            <div className="treasury-action-grid">
              {(p.trang_thai === "NHAP"
                ? ["duyet", "huy"]
                : p.trang_thai === "DA_GHI_SO" &&
                    !p.ma_phieu_goc &&
                    !p.ma_phieu_dao
                  ? ["dao"]
                  : []
              ).map((kind) => (
                <form
                  className="card"
                  key={`${kind}-${p.phien_ban}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    action.run(
                      `/phieu_thu_chi/${id}/${kind}`,
                      "POST",
                      { ...values(e), phien_ban: p.phien_ban },
                      kind === "dao"
                        ? (d) =>
                            navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`)
                        : undefined,
                    );
                  }}
                >
                  <h2>
                    {
                      {
                        duyet: "Duyệt và ghi sổ",
                        huy: "Hủy phiếu nháp",
                        dao: "Đảo phiếu đã ghi sổ",
                      }[kind]
                    }
                  </h2>
                  <p className="muted">
                    {
                      {
                        duyet:
                          "Chỉ duyệt khi khoản tiền thực tế và chứng từ đã được kiểm tra. Duyệt chi cần quỹ đủ số dư hiện tại.",
                        huy: "Hủy nháp không thay đổi số dư quỹ.",
                        dao: "Giữ phiếu gốc và tạo khoản ngược chiều cùng số tiền, hạch toán hôm nay. Đảo khoản thu cần quỹ đủ số dư.",
                      }[kind]
                    }
                  </p>
                  <Field
                    label={
                      kind === "duyet"
                        ? "Ghi chú duyệt phiếu"
                        : kind === "huy"
                          ? "Lý do hủy phiếu"
                          : "Lý do đảo phiếu"
                    }
                  >
                    <textarea
                      name={kind === "duyet" ? "ghi_chu" : "ly_do"}
                      rows={3}
                      maxLength={1000}
                      minLength={kind === "duyet" ? 0 : 5}
                      required={kind !== "duyet"}
                    />
                  </Field>
                  <button
                    className={kind === "duyet" ? "primary" : "danger"}
                    disabled={action.pending}
                  >
                    {
                      {
                        duyet: "Xác nhận duyệt và ghi sổ",
                        huy: "Xác nhận hủy nháp",
                        dao: "Lập phiếu đảo",
                      }[kind]
                    }
                  </button>
                </form>
              ))}
            </div>
            <section className="card">
              <h2>Lịch sử phiếu</h2>
              <ol className="treasury-history">
                {p.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien] || h.su_kien}</strong>
                    <small>
                      {time(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="treasury-text">{historyNote(h)}</p>
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

## 11. `frontend/src/styles/global.css`

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
```
