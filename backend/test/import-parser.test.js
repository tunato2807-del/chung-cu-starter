import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import {
  template,
  parseFile,
} from "../src/modules/data-exchange/import-files.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";

test("shipped Excel files parse and wrong module names both categories", async () => {
  for (const [index, kind] of [
    "can_ho",
    "cu_dan",
    "phuong_tien",
    "chi_so",
    "thiet_bi",
  ].entries()) {
    const name = `${String(index + 1).padStart(2, "0")}_${kind}.xlsx`;
    const buffer = await readFile(
      new URL(`../../samples/nhap-du-lieu/${name}`, import.meta.url),
    );
    const records = await parseFile({ originalname: name, buffer }, kind);
    assert.ok(records.length > 0);
    if (kind === "cu_dan")
      assert.match(records[0].values.ho_va_ten, /Nguyễn Minh An/);
    const wrong = kind === "can_ho" ? "cu_dan" : "can_ho";
    await assert.rejects(
      parseFile({ originalname: name, buffer }, wrong),
      (e) => {
        assert.equal(e.code, "IMPORT_KIND_MISMATCH");
        assert.ok(e.message.includes(catalog[kind].title));
        assert.ok(e.message.includes(catalog[wrong].title));
        return true;
      },
    );
  }
});

test("every downloadable template gives actionable empty-sheet feedback and parses saved input", async () => {
  for (const [kind, config] of Object.entries(catalog).filter(
    ([, c]) => c.importable,
  )) {
    const buffer = await template(kind, "xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    assert.equal(wb.worksheets[0].name, "Nhap");
    assert.equal(wb.getWorksheet("Nhap").rowCount, 1);
    assert.equal(wb.getWorksheet("Vi du").rowCount, 2);
    await assert.rejects(
      parseFile({ originalname: "mau.xlsx", buffer }, kind),
      (e) => e.code === "IMPORT_EMPTY" && /dòng 2/.test(e.message),
    );
    wb.getWorksheet("Nhap").addRow(config.fields.map((f) => f.example));
    const filled = Buffer.from(await wb.xlsx.writeBuffer());
    assert.equal(
      (await parseFile({ originalname: "da-luu.xlsx", buffer: filled }, kind))
        .length,
      1,
    );
    await assert.rejects(template(kind, "pdf"), (e) => e.status === 422);
  }
});

test("PDF is rejected; missing Nhap/report files cannot be mistaken for imports; >100 rows are never truncated", async () => {
  await assert.rejects(
    parseFile(
      { originalname: "file.pdf", buffer: Buffer.from("%PDF-1.7") },
      "can_ho",
    ),
    (e) => e.status === 422 && /xlsx/.test(e.message),
  );
  for (const name of ["Chi tiết", "Sheet1"]) {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet(name).addRow(catalog.can_ho.fields.map((f) => f.key));
    await assert.rejects(
      parseFile(
        {
          originalname: "report.xlsx",
          buffer: Buffer.from(await wb.xlsx.writeBuffer()),
        },
        "can_ho",
      ),
      (e) => e.code === "IMPORT_SHEET_REQUIRED",
    );
  }
  const wb = new ExcelJS.Workbook(),
    sheet = wb.addWorksheet("Nhap");
  sheet.addRow(catalog.can_ho.fields.map((f) => f.key));
  for (let i = 0; i < 101; i++) sheet.addRow([`A${i}`, "A", "1", "75.5", "1"]);
  await assert.rejects(
    parseFile(
      {
        originalname: "101.xlsx",
        buffer: Buffer.from(await wb.xlsx.writeBuffer()),
      },
      "can_ho",
    ),
    (e) => e.code === "IMPORT_TOO_MANY_ROWS",
  );
});

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
