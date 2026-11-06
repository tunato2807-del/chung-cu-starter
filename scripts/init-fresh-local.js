import { randomBytes } from "node:crypto";
import { writeFile, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { freshDatabasePattern } from "./fresh-config-status.js";

export function freshConfig() {
  const database = `chung_cu_nghiem_thu_moi${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  return {
    database,
    contents: [
      "# Fresh native MySQL installation; enter the local MySQL password below.",
      "FRESH_INSTALL=1",
      "DB_ENGINE=mysql",
      "DB_HOST=127.0.0.1",
      "DB_PORT=3306",
      "DB_USER=root",
      'DB_PASSWORD=""',
      `DB_NAME=${database}`,
      `JWT_SECRET=${randomBytes(48).toString("hex")}`,
      "PORT=3000",
      "COOKIE_SECURE=false",
      "",
    ].join("\n"),
  };
}

export async function initializeFresh(filename) {
  const result = freshConfig();
  // No reads, copying, overwrite, or deletion of any previous local configuration.
  await writeFile(filename, result.contents, { flag: "wx", mode: 0o600 });
  return { database: result.database };
}

function serializeEnv(env) {
  const lines = [
    "# Fresh local configuration. MySQL connection values are preserved by --repair.",
  ];
  for (const [key, value] of Object.entries(env)) {
    // Keep values exact, including #, quotes, backslashes and newlines.
    const candidate = [
      '"' + value + '"',
      "'" + value + "'",
      "`" + value + "`",
      value,
    ].find((literal) => {
      try {
        return parseEnv(`VALUE=${literal}\n`).VALUE === value;
      } catch {
        return false;
      }
    });
    if (candidate === undefined)
      throw Object.assign(
        new Error("Cannot safely encode configuration value"),
        { code: "ENV_ENCODING" },
      );
    lines.push(`${key}=${candidate}`);
  }
  return lines.join("\n") + "\n";
}

export async function repairFresh(filename) {
  const target =
    filename instanceof URL ? fileURLToPath(filename) : path.resolve(filename);
  let source;
  try {
    source = await readFile(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { ...(await initializeFresh(target)), changed: true, backup: null };
  }
  const current = parseEnv(source);
  if (current.DB_ENGINE && current.DB_ENGINE !== "mysql")
    throw Object.assign(
      new Error("Repair is only for the fresh MySQL configuration"),
      { code: "MYSQL_CONFIG_REQUIRED" },
    );
  const defaults = parseEnv(freshConfig().contents);
  const next = {
    ...defaults,
    ...current,
    FRESH_INSTALL: "1",
    DB_ENGINE: "mysql",
  };
  for (const key of ["DB_HOST", "DB_PORT", "DB_USER", "PORT", "COOKIE_SECURE"])
    if (!current[key]) next[key] = defaults[key];
  if (!freshDatabasePattern.test(current.DB_NAME || ""))
    next.DB_NAME = defaults.DB_NAME;
  if (!current.JWT_SECRET || current.JWT_SECRET.trim().length < 32)
    next.JWT_SECRET = defaults.JWT_SECRET;
  const changes = Object.keys(next).filter((key) => next[key] !== current[key]);
  if (!changes.length)
    return { database: current.DB_NAME, changed: false, backup: null };
  const contents = serializeEnv(next);
  const suffix = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  const backup = `${target}.before-fresh-repair-${suffix}`;
  const temporary = `${target}.repair-${suffix}`;
  // Save a private backup, then replace atomically; never delete database data.
  await writeFile(backup, source, { flag: "wx", mode: 0o600, flush: true });
  try {
    await writeFile(temporary, contents, {
      flag: "wx",
      mode: 0o600,
      flush: true,
    });
    if ((await readFile(target, "utf8")) !== source)
      throw Object.assign(new Error("Configuration changed during repair"), {
        code: "ENV_CHANGED",
      });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  return { database: next.DB_NAME, changed: true, backup };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    if (args.length && !(args.length === 1 && args[0] === "--repair"))
      throw Object.assign(new Error("Unexpected arguments"), {
        code: "INVALID_ARGUMENTS",
      });
    const result = args.length
      ? await repairFresh(new URL("../.env", import.meta.url))
      : await initializeFresh(new URL("../.env", import.meta.url));
    console.log(
      result.changed === false
        ? "Cấu hình .env đã đủ; không thay database hoặc JWT_SECRET."
        : `Đã chuẩn bị .env. Database: ${result.database}`,
    );
    if (result.backup)
      console.log(
        `Bản sao cấu hình trước sửa: ${path.basename(result.backup)} (giữ riêng, không đưa lên GitHub).`,
      );
    console.log(
      "Chỉ sửa dòng DB_PASSWORD trong .env theo MySQL trên máy (DB_USER/DB_PORT nếu khác mặc định). Không thay toàn bộ tệp; giữ FRESH_INSTALL, DB_NAME và JWT_SECRET.",
    );
    console.log(
      "Sau khi lưu .env, chạy npm run config:check trước khi tạo dữ liệu hoặc khởi động backend.",
    );
  } catch (error) {
    console.error(
      error.code === "EEXIST"
        ? "Đã có .env. Chạy npm run config:check; nếu cấu hình cài mới bị thiếu, dùng npm run init:fresh -- --repair để sửa có sao lưu."
        : error.code === "MYSQL_CONFIG_REQUIRED"
          ? "Tệp đang cấu hình hệ database khác. Kiểm tra đúng thư mục bản MySQL cài mới trước khi sửa."
          : error.code === "ENV_CHANGED"
            ? "Tệp .env vừa được sửa trong lúc chạy. Giữ bản sao lưu, lưu/đóng trình soạn thảo rồi kiểm tra lại."
            : error.code === "ENV_ENCODING"
              ? "Không ghi lại được một giá trị .env một cách an toàn. Tệp hiện có được giữ nguyên; sửa cấu hình thủ công."
              : "Không khởi tạo được cấu hình mới. Chạy npm run init:fresh trong thư mục clone mới và kiểm tra quyền ghi.",
    );
    process.exitCode = 1;
  }
}
