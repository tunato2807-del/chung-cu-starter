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
