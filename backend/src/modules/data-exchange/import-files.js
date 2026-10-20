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
