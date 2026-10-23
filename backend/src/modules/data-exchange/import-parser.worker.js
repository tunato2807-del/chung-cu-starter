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
