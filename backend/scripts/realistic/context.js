import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { pool, rows } from "../../src/lib/db.js";
import { today } from "../../src/modules/billing/billing.validation.js";
import { catalog } from "../../src/modules/data-exchange/catalog.js";
import { importFile } from "../../src/modules/data-exchange/import.service.js";
import { acceptanceOptions } from "../../../scripts/create-acceptance-data.js";
import { assertEmptyDestination } from "../../../scripts/copy-thesis-data.js";
import { plan, monthAt } from "../../../scripts/realistic-data-plan.js";

export function context() {
  const options = acceptanceOptions([
    `--database=${process.env.DB_NAME || ""}`,
    `--origin=${process.env.ACCEPTANCE_ORIGIN || "https://localhost:5173"}`,
  ]);
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const day = today();
  const c = {
    root,
    options,
    day,
    pool,
    rows,
    beginning: `${monthAt(day, -13)}-01`,
    out: path.join(root, "backend/storage/acceptance", options.database),
    created: false,
    apartments: [],
    owners: [],
    members: [],
    payers: [],
    equipment: [],
    locations: [],
    technicians: [],
    manifest: {
      dataset_kind: "SYNTHETIC_REALISTIC",
      profile_version: 1,
      plan,
      database: options.database,
      origin: options.origin,
      ngay_tao: day,
      trang_thai: "DANG_TAO",
      accounts: [],
      qr: [],
      checks: [],
      scenarios: [],
      tables: [],
    },
  };
  c.save = () =>
    writeFile(
      path.join(c.out, "manifest.json"),
      JSON.stringify(c.manifest, null, 2) + "\n",
      { mode: 0o600 },
    );
  c.one = async (table, key, id) =>
    (await rows(pool, `SELECT * FROM ${table} WHERE ${key}=?`, [id]))[0];
  c.versioned = async (table, key, id, body = {}) => ({
    phien_ban: (await c.one(table, key, id)).phien_ban,
    ...body,
  });
  c.check = (name, valid) => {
    if (!valid) throw new Error(`Kiểm tra chưa đạt: ${name}`);
    c.manifest.checks.push({ name, status: "DAT" });
  };
  c.capture = async (credentials, details = {}) => {
    if (!credentials?.mat_khau_tam_thoi) return;
    const next = {
      name: details.name || `Tài khoản căn ${details.apartment}`,
      login: credentials.ten_dang_nhap,
      password: credentials.mat_khau_tam_thoi,
      role: "CU_DAN",
      kind: "CAN_HO",
      active: true,
      ...details,
    };
    const old = c.manifest.accounts.findIndex((a) => a.login === next.login);
    if (old === -1) c.manifest.accounts.push(next);
    else c.manifest.accounts[old] = next;
    await c.save();
  };
  c.createUser = async (name, phone, role, active = true) => {
    const password = randomBytes(18).toString("base64url");
    c.manifest.accounts.push({
      name,
      login: phone,
      password,
      role,
      kind: "CA_NHAN",
      active,
    });
    await c.save();
    const result = await rows(
      pool,
      "INSERT INTO nguoi_dung(ho_va_ten,so_dien_thoai,vai_tro,chuyen_mon,mat_khau_ma_hoa,dang_hoat_dong)VALUES(?,?,?,?,?,?)",
      [
        name,
        phone,
        role,
        role === "KY_THUAT_VIEN" ? "Điện nước và thiết bị tòa nhà" : "",
        await bcrypt.hash(password, 12),
        active,
      ],
    );
    return c.one("nguoi_dung", "ma_nguoi_dung", result.insertId);
  };
  c.importRows = async (kind, records, filename) => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Nhap");
    sheet.columns = catalog[kind].fields.map((f) => ({
      header: f.key,
      key: f.key,
      width: 24,
      style: { numFmt: "@" },
    }));
    for (const record of records)
      sheet.addRow(
        catalog[kind].fields.map((f) => String(record[f.key] ?? "")),
      );
    const file = {
      originalname: filename,
      buffer: Buffer.from(await wb.xlsx.writeBuffer()),
    };
    await writeFile(path.join(c.out, "nhap", filename), file.buffer);
    const preview = await importFile(kind, file, {}, c.admin);
    if (preview.errors)
      throw new Error(
        `Tệp ${filename}: ${preview.rows
          .map((r) => r.error)
          .filter(Boolean)
          .join("; ")}`,
      );
    return importFile(
      kind,
      file,
      { xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
      c.admin,
      true,
    );
  };
  return c;
}

export async function prepare(c) {
  const [[db]] = await c.pool.query("SELECT DATABASE() AS name");
  if (db.name !== c.options.database)
    throw new Error("Database đang kết nối không khớp database được chọn.");
  await assertEmptyDestination(c.pool);
  await mkdir(path.dirname(c.out), { recursive: true, mode: 0o700 });
  await mkdir(c.out, { mode: 0o700 });
  c.created = true;
  await c.save();
  for (const folder of ["nhap", "xuat", "qr", "anh"])
    await mkdir(path.join(c.out, folder), { mode: 0o700 });
}
