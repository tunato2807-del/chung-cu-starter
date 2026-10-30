import { X509Certificate } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { checkApi } from "./check-local.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function diagnosticOptions(args, port = "3000") {
  const options = { api: `http://127.0.0.1:${port}`, token: null };
  for (let i = 0; i < args.length; i += 2) {
    const value = args[i + 1];
    if (!value || !["--api", "--qr"].includes(args[i]))
      throw new Error(
        'Dùng npm run diagnose [-- --api http://127.0.0.1:3000 --qr "liên kết QR"].',
      );
    if (args[i] === "--api") options.api = value;
    else {
      const url = new URL(value, "http://localhost");
      const token = url.pathname.split("/")[2];
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !uuid.test(token || "") ||
        url.pathname !== `/r/${token}`
      )
        throw new Error("Liên kết QR cần có dạng http(s)://địa-chỉ/r/UUID.");
      options.token = token;
    }
  }
  const api = new URL(options.api);
  if (
    !["http:", "https:"].includes(api.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(api.hostname) ||
    api.username ||
    api.password ||
    api.pathname !== "/" ||
    api.search ||
    api.hash
  )
    throw new Error("Chỉ kiểm tra API loopback của máy đang chạy lệnh.");
  return options;
}

export function credentialFile(database) {
  if (/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database))
    return `backend/storage/acceptance/${database}/TAI-KHOAN.md`;
  return database === "chung_cu" ? "backend/.demo-credentials" : null;
}

// Counts and account status only. Never read password hashes or credentials.
export async function databaseSummary(db, database, token) {
  const prefix = mysql.escapeId(database);
  const [[admin]] = await db.query(
    `SELECT COUNT(*) AS total,
      COALESCE(SUM(dang_hoat_dong=1 AND (khoa_den_luc IS NULL OR khoa_den_luc<=UTC_TIMESTAMP())),0) AS available,
      COALESCE(SUM(dang_hoat_dong=1 AND khoa_den_luc>UTC_TIMESTAMP()),0) AS temporarily_locked
      FROM ${prefix}.nguoi_dung WHERE vai_tro='QUAN_TRI_VIEN'`,
  );
  const [[qr]] = await db.query(
    `SELECT COUNT(*) AS total,COALESCE(SUM(dang_hoat_dong=1),0) AS active FROM ${prefix}.vi_tri_qr`,
  );
  let match;
  if (token) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS found,COALESCE(SUM(dang_hoat_dong=1),0) AS active FROM ${prefix}.vi_tri_qr WHERE token_qr=?`,
      [token],
    );
    match = { found: Number(row.found), active: Number(row.active) };
  }
  return { database, admin, qr, match };
}

async function main() {
  const options = diagnosticOptions(process.argv.slice(2), process.env.PORT);
  const selected = process.env.DB_NAME || "chung_cu";
  console.log(
    `Database cấu hình trong terminal này: ${JSON.stringify(selected)}`,
  );
  console.log(
    "Đối chiếu với dòng Database ở terminal backend; hai terminal có thể đặt DB_NAME khác nhau.",
  );
  console.log(
    `COOKIE_SECURE=${process.env.COOKIE_SECURE === "true"}; COOKIE_SECURE=true cần mở frontend qua HTTPS.`,
  );
  for (const check of await checkApi(options.api)) {
    console.log(`[${check.level.toUpperCase()}] ${check.message}`);
    if (check.level === "error") process.exitCode = 1;
  }

  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "chung_cu",
      password: process.env.DB_PASSWORD,
      connectTimeout: 5000,
    });
    const names = [...new Set([selected, "chung_cu", "chung_cu_nghiem_thu"])];
    const [available] = await db.execute(
      `SELECT SCHEMA_NAME AS name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN (${names.map(() => "?").join(",")})`,
      names,
    );
    if (!available.some(({ name }) => name === selected)) {
      console.log(
        "[ERROR] Database đang chọn chưa có hoặc tài khoản MySQL không có quyền đọc.",
      );
      process.exitCode = 1;
    }
    for (const { name } of available) {
      try {
        const summary = await databaseSummary(db, name, options.token);
        console.log(
          `[DB ${JSON.stringify(name)}] BQL: ${summary.admin.total} tài khoản, ${summary.admin.available} có thể đăng nhập, ${summary.admin.temporarily_locked} đang khóa tạm. QR: ${summary.qr.active}/${summary.qr.total} hoạt động.`,
        );
        if (summary.match)
          console.log(
            `[QR] ${summary.match.found ? (summary.match.active ? "Có mã đang hoạt động" : "Mã đã ngừng sử dụng") : "Không có token này"} trong ${JSON.stringify(name)}.`,
          );
        const file = credentialFile(name);
        if (file) {
          const exists = await access(path.join(root, file)).then(
            () => true,
            () => false,
          );
          console.log(
            `[FILE] ${file}: ${exists ? "có trên máy" : "chưa tìm thấy"}.`,
          );
        }
      } catch (error) {
        console.log(
          `[DB ${JSON.stringify(name)}] Chưa đọc được schema (${error.code || "DATABASE_ERROR"}); kiểm tra migration/quyền đọc.`,
        );
      }
    }
  } catch (error) {
    console.log(
      `[ERROR] Chưa kết nối được MySQL (${error.code || "DATABASE_ERROR"}). Kiểm tra dịch vụ, cổng và cấu hình kết nối.`,
    );
    process.exitCode = 1;
  } finally {
    await db?.end();
  }

  let certificate;
  try {
    certificate = new X509Certificate(
      await readFile(new URL("../.certs/dev-cert.pem", import.meta.url)),
    );
    console.log(`[TLS] Chứng chỉ phát triển hết hạn: ${certificate.validTo}.`);
  } catch {
    console.log(
      "[TLS] Chưa đọc được .certs/dev-cert.pem. Xem docs/https-local.md.",
    );
  }
  console.log(
    "Địa chỉ mạng hiện có (chọn adapter Wi-Fi đang dùng; VPN/VMware có thể không đến được từ điện thoại):",
  );
  for (const [name, addresses] of Object.entries(networkInterfaces()))
    for (const address of addresses || [])
      if (!address.internal && address.family === "IPv4")
        console.log(
          `  ${name}: https://${address.address}:5173/; ${certificate?.checkIP(address.address) ? "IP có trong chứng chỉ" : "chưa xác nhận IP trong chứng chỉ"}.`,
        );
  console.log(
    "Công cụ chỉ đọc trạng thái; không thử mật khẩu, không mở khóa tài khoản và không thay token QR.",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
