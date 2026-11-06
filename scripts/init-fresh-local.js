import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 2)
      throw Object.assign(new Error("Unexpected arguments"), {
        code: "INVALID_ARGUMENTS",
      });
    const result = await initializeFresh(new URL("../.env", import.meta.url));
    console.log(`Đã tạo .env mới. Database mới: ${result.database}`);
    console.log(
      "Mở .env, nhập DB_USER/DB_PASSWORD của dịch vụ MySQL trên máy. Giữ DB_NAME và JWT_SECRET mới được sinh.",
    );
    console.log(
      "Chạy npm run db:realistic:fresh -- --origin=http://localhost:5173 sau khi lưu .env.",
    );
  } catch (error) {
    console.error(
      error.code === "EEXIST"
        ? "Đã có .env. Lệnh dừng, không dùng lại hoặc ghi đè. Chạy init:fresh trong thư mục clone mới chưa có .env."
        : "Không khởi tạo được cấu hình mới. Chạy npm run init:fresh trong thư mục clone mới và kiểm tra quyền ghi.",
    );
    process.exitCode = 1;
  }
}
