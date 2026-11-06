import { app } from "./app.js";
import { pool } from "./lib/db.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32)
  throw new Error(
    "JWT_SECRET cần ít nhất 32 ký tự trong cấu hình đang nạp. Với bản cài mới: từ thư mục gốc chạy npm run config:check; dùng npm run init:fresh -- --repair để sửa .env có sao lưu.",
  );
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`API: http://127.0.0.1:${port}/api/health`);
  const database = process.env.DB_NAME || "chung_cu_do_an";
  console.log(`Database: ${JSON.stringify(database)}`);
  if (/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database))
    console.log(
      `Tài khoản bộ này: backend/storage/acceptance/${database}/TAI-KHOAN.md`,
    );
  else if (database === "chung_cu")
    console.log(
      "Bản cũ: giữ tài khoản hiện có và backend/.demo-credentials nếu đã tạo trước đây.",
    );
  else
    console.log(
      "Database mới chưa có tài khoản: npm run setup:admin. Database đã có dữ liệu: giữ tài khoản/mật khẩu hiện có.",
    );
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
