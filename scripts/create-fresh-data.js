import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./create-acceptance-data.js";

export function freshDataOptions(args, environment = process.env) {
  if (
    environment.FRESH_INSTALL !== "1" ||
    !/^chung_cu_nghiem_thu_moi[a-z0-9]{1,17}$/.test(environment.DB_NAME || "")
  )
    throw Object.assign(
      new Error(
        "Cần .env mới được tạo bởi npm run init:fresh. Không dùng cấu hình cũ.",
      ),
      { code: "FRESH_CONFIG_REQUIRED" },
    );
  // The target comes only from the newly generated config, never a default old dataset.
  if (args.some((arg) => !arg.startsWith("--origin=")))
    throw new Error(
      "Chỉ nhận --origin=http(s)://host:port; không nhận --database hoặc --reset.",
    );
  if (args.filter((arg) => arg.startsWith("--origin=")).length > 1)
    throw new Error("Chỉ nhập một --origin.");
  return [
    `--database=${environment.DB_NAME}`,
    ...(args.length ? args : ["--origin=http://localhost:5173"]),
  ];
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = freshDataOptions(process.argv.slice(2));
    await launch(args, "realistic", { newDatabaseOnly: true });
    console.log(
      "Bản cài mới đã sẵn sàng. Backend dùng npm run dev:backend, tự đọc DB_NAME mới trong .env.",
    );
  } catch (error) {
    console.error(
      error.code === "ER_DB_CREATE_EXISTS"
        ? "Database đích đã tồn tại. Dừng trước migration và seed; không sử dụng hoặc thay đổi dữ liệu bên trong."
        : error.code === "FRESH_CONFIG_REQUIRED"
          ? error.message
          : error.code
            ? `Chưa tạo được bản cài mới (${error.code}). Kiểm tra MySQL và quyền tạo database.`
            : error.message,
    );
    console.error(
      "Nếu lần trước đã báo Hoàn tất, chạy npm run dev:backend để dùng đúng bản mới đó; không chạy lại lệnh tạo dữ liệu.",
    );
    process.exitCode = 1;
  }
}
