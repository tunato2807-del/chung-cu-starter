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
