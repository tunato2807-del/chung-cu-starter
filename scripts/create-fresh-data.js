import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./create-acceptance-data.js";
import { freshConfigIssues } from "./fresh-config-status.js";

export function freshDataOptions(args, environment = process.env) {
  if (freshConfigIssues(environment).length)
    throw Object.assign(
      new Error(
        `Cấu hình cài mới chưa hợp lệ: ${freshConfigIssues(environment).join(", ")}. Chạy npm run config:check; sửa có sao lưu bằng npm run init:fresh -- --repair.`,
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
    if (error.code === "FRESH_CONFIG_REQUIRED")
      console.error(
        "Lệnh dừng trước bước tạo dữ liệu. Chỉ khởi động backend sau khi config:check báo OK và bộ dữ liệu đã báo Hoàn tất.",
      );
    else if (error.code === "ER_DB_CREATE_EXISTS")
      console.error(
        "Chỉ chạy npm run dev:backend nếu lần tạo trước đã báo Hoàn tất; nếu chưa, giữ bộ dở dang để kiểm tra.",
      );
    process.exitCode = 1;
  }
}
