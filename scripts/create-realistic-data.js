import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./create-acceptance-data.js";

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  launch(process.argv.slice(2), "realistic").catch((error) => {
    console.error(
      error.code
        ? `Chưa tạo được bộ dữ liệu (${error.code}); kiểm tra MySQL và quyền tạo database.`
        : error.message,
    );
    process.exitCode = 1;
  });
