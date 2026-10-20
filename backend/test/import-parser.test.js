import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { parseFile } from "../src/modules/data-exchange/import-files.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";

test("shipped filled PDFs can be read; wrong PDF/Excel category names the actual and selected modules", async () => {
  for (const [index, kind] of [
    "can_ho",
    "cu_dan",
    "phuong_tien",
    "chi_so",
    "thiet_bi",
  ].entries()) {
    const name = `${String(index + 1).padStart(2, "0")}_${kind}`;
    const pdf = await readFile(
      new URL(`../../samples/nhap-du-lieu/${name}.pdf`, import.meta.url),
    );
    const records = await parseFile(
      { originalname: `${name}.pdf`, buffer: pdf },
      kind,
    );
    assert.ok(records.length > 0);
    if (kind === "cu_dan")
      assert.match(records[0].values.ho_va_ten, /Nguyễn Minh An/);
    const wrong = kind === "can_ho" ? "cu_dan" : "can_ho";
    for (const format of ["xlsx", "pdf"]) {
      const buffer =
        format === "pdf"
          ? pdf
          : await readFile(
              new URL(
                `../../samples/nhap-du-lieu/${name}.xlsx`,
                import.meta.url,
              ),
            );
      await assert.rejects(
        parseFile({ originalname: `${name}.${format}`, buffer }, wrong),
        (error) => {
          assert.equal(error.code, "IMPORT_KIND_MISMATCH");
          assert.match(error.message, new RegExp(catalog[kind].title));
          assert.match(error.message, new RegExp(catalog[wrong].title));
          assert.doesNotMatch(error.message, /scan|làm phẳng/);
          return true;
        },
      );
    }
  }
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
