import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
export async function configureThesis(source, output) {
  if (path.resolve(source) === path.resolve(output))
    throw new Error("Giữ tệp nguồn riêng; không ghi đè.");
  const old = parseEnv(await readFile(source, "utf8"));
  if (old.DB_ENGINE && old.DB_ENGINE !== "mysql")
    throw new Error(
      "Chọn tệp cấu hình MySQL đã sao lưu, không dùng cấu hình PostgreSQL.",
    );
  const next = {
    ...old,
    DB_ENGINE: "mysql",
    DB_HOST: old.DB_HOST || "127.0.0.1",
    DB_PORT: old.DB_PORT || "3306",
    DB_USER: old.DB_USER || "root",
    DB_NAME: "chung_cu_do_an",
  };
  const lines = Object.entries(next).map(([key, value]) => {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || /[\r\n']/.test(value))
      throw new Error("Cấu hình có ký tự cần sao chép bằng trình soạn thảo.");
    return `${key}='${value}'`;
  });
  await writeFile(
    output,
    "# CSDL đồ án mới; giữ nguyên file/DB nguồn.\n" + lines.join("\n") + "\n",
    { flag: "wx", mode: 0o600 },
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 2)
      throw new Error(
        "Dùng node scripts/configure-thesis-mysql.js .env.mysql .env.thesis",
      );
    await configureThesis(args[0] || ".env.mysql", args[1] || ".env.thesis");
    console.log(
      "Đã tạo cấu hình MySQL đích riêng; giữ mật khẩu DB/khóa ký phiên cũ, không in chúng. Mở .env.thesis để kiểm tra cổng và DB_NAME đích.",
    );
  } catch (error) {
    console.error(
      error.code
        ? `Không tạo được cấu hình (${error.code}); tệp đã có không bị ghi đè.`
        : error.message,
    );
    process.exitCode = 1;
  }
}
