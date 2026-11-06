import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../src/lib/db.js";
import { initializeAdmin } from "../src/modules/auth/initial-admin.service.js";

export async function main() {
  let prompt;
  try {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error(
        "Mở terminal tương tác trong VS Code rồi chạy npm run setup:admin. Không có thông tin cá nhân mặc định.",
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      "Chỉ khởi tạo quản trị viên trên database chưa có tài khoản; không tạo căn hộ, cư dân hoặc QR mẫu.",
    );
    prompt = createInterface({ input: process.stdin, output: process.stdout });
    const name = await prompt.question("Họ tên quản trị viên: ");
    const phone = await prompt.question("Số điện thoại đăng nhập: ");
    const result = await initializeAdmin(pool, { name, phone });
    console.log(`Đã tạo quản trị viên trong database ${result.database}.`);
    console.log(`Đọc tài khoản và mật khẩu tại ${result.credentialFile}.`);
    console.log(
      "Giữ tệp này trên máy, không đưa lên GitHub. Đổi mật khẩu trong trang Tài khoản sau khi đăng nhập.",
    );
  } catch (error) {
    const messages = {
      VALIDATION:
        "Họ tên hoặc số điện thoại chưa hợp lệ. Nhập tên thật và số điện thoại Việt Nam.",
      EXISTING_ACCOUNTS:
        "Database đã có tài khoản. Giữ tài khoản/mật khẩu hiện có; lệnh này không cấp lại hoặc đổi mật khẩu.",
      SETUP_LOCKED:
        "Một tiến trình khác đang khởi tạo. Chờ tiến trình đó hoàn tất.",
      TEST_DATABASE:
        "Đây là database kiểm thử/nghiệm thu. Dùng quy trình kiểm thử riêng.",
      MIGRATION_REQUIRED:
        "Chạy npm run db:migrate trên database mới trước khi khởi tạo.",
      EEXIST:
        "Tệp tài khoản của database này đã tồn tại. Giữ nguyên tệp và kiểm tra database; không ghi đè mật khẩu cũ.",
      COMMIT_UNCERTAIN:
        "Chưa xác định được kết quả lưu database. Tệp mật khẩu đã được giữ lại. Kiểm tra database trước khi chạy lại.",
    };
    console.error(
      messages[error.code] ||
        "Chưa tạo được quản trị viên. Kiểm tra MySQL, migration và quyền ghi backend/storage/setup; không xóa dữ liệu hiện có.",
    );
    process.exitCode = 1;
  } finally {
    prompt?.close();
    await pool.end();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
