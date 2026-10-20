import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { parseFile } from "../src/modules/data-exchange/import-files.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";

test("import parser rejects a small ZIP whose Excel string expands beyond the entry budget", async () => {
  const wb = new ExcelJS.Workbook(),
    sheet = wb.addWorksheet("Nhap");
  sheet.addRow(catalog.can_ho.fields.map((f) => f.key));
  sheet.addRow(["x".repeat(9 * 1024 * 1024), "A", "1", "50", "1"]);
  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  assert.ok(
    buffer.length < 100000,
    "fixture must exercise decompression, not the HTTP file size limit",
  );
  await assert.rejects(
    parseFile({ originalname: "small.xlsx", buffer }, "can_ho"),
    (error) => error.status === 422 && /sau giải nén/.test(error.message),
  );
});

test("import parser preserves text phone/code and converts an Excel date without accepting formulas", async () => {
  const wb = new ExcelJS.Workbook(),
    sheet = wb.addWorksheet("Nhap");
  sheet.addRow(catalog.cu_dan.fields.map((f) => f.key));
  sheet.addRow([
    "Nguyễn Thị Ánh",
    "0901234567",
    "00101",
    "THANH_VIEN",
    new Date("2026-10-01T00:00:00Z"),
  ]);
  sheet.addRow([
    "Công thức",
    { formula: "1+1", result: 2 },
    "00101",
    "THANH_VIEN",
    "2026-10-01",
  ]);
  const buffer = Buffer.from(await wb.xlsx.writeBuffer()),
    records = await parseFile(
      { originalname: "residents.xlsx", buffer },
      "cu_dan",
    );
  assert.equal(records[0].values.so_dien_thoai, "0901234567");
  assert.equal(records[0].values.so_can_ho, "00101");
  assert.equal(records[0].values.ngay, "2026-10-01");
  assert.match(records[1].error, /công thức/);
});
