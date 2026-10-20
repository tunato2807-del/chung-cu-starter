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
