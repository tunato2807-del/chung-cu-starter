import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  freshConfigIssues,
  environmentOverrides,
} from "./fresh-config-status.js";

export function configReport(contents, effective) {
  const file = parseEnv(contents);
  return {
    invalidFileFields: freshConfigIssues(file),
    invalidEffectiveFields: freshConfigIssues(effective),
    overrides: environmentOverrides(file, effective),
    jwtLength: (file.JWT_SECRET || "").length,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = configReport(
      await readFile(new URL("../.env", import.meta.url), "utf8"),
      process.env,
    );
    console.log(
      `JWT_SECRET trong .env: ${report.jwtLength} ký tự; không hiển thị giá trị.`,
    );
    if (report.invalidFileFields.length) {
      console.error(
        `[ERROR] FILE_FIELDS: ${report.invalidFileFields.join(", ")}. Chạy npm run init:fresh -- --repair.`,
      );
      process.exitCode = 1;
    }
    if (report.overrides.length) {
      console.error(
        `[ERROR] ENV_OVERRIDE: ${report.overrides.join(", ")}. Biến của terminal đang khác .env; trong PowerShell chạy:`,
      );
      console.error(
        `Remove-Item ${report.overrides.map((key) => `Env:${key}`).join(",")} -ErrorAction SilentlyContinue`,
      );
      console.error(
        "Sau đó chạy lại npm run config:check trong chính terminal đó.",
      );
      process.exitCode = 1;
    }
    if (
      report.invalidEffectiveFields.length &&
      !report.invalidFileFields.length &&
      !report.overrides.length
    ) {
      console.error(
        `[ERROR] PROCESS_FIELDS: ${report.invalidEffectiveFields.join(", ")}. Kiểm tra lệnh nạp .env và mở terminal mới.`,
      );
      process.exitCode = 1;
    }
    if (!process.exitCode)
      console.log(
        "[OK] Cấu hình cài mới hợp lệ và tiến trình nhận đúng .env. Chưa kiểm tra kết nối MySQL.",
      );
  } catch {
    console.error(
      "[ERROR] Chưa đọc được .env tại gốc dự án. Chạy npm run init:fresh; kiểm tra tên tệp không phải .env.txt.",
    );
    process.exitCode = 1;
  }
}
