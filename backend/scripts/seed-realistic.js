// Every identity, event, amount and attachment in this profile is synthetic.
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/lib/db.js";
import { context, prepare } from "./realistic/context.js";
import { housing } from "./realistic/housing.js";
import { finance } from "./realistic/finance.js";
import { operations } from "./realistic/operations.js";
import { community } from "./realistic/community.js";
import { verifyData, verifyApi } from "./realistic/verification.js";

// Only for the temporary local verification server; never rewrites .env.
process.env.JWT_SECRET ||= randomBytes(48).toString("base64url");
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
let c;
try {
  c = context();
  await prepare(c);
  for (const [label, work] of [
    ["Nhà ở, cư dân, tài khoản và đăng ký xe", housing],
    ["13 kỳ chỉ số, hóa đơn và thu phí", finance],
    ["Thiết bị, QR, phản ánh và bảo trì", operations],
    ["Tiện ích, thông báo và thu chi", community],
    ["Kiểm tra số lượng và toàn vẹn dữ liệu", verifyData],
    ["Kiểm tra đăng nhập, phân quyền, báo cáo và xuất tệp", verifyApi],
  ]) {
    console.log(label);
    await work(c);
    await c.save();
  }
  const accountLines = [
    "# Tài khoản bộ dữ liệu mô phỏng",
    "",
    `Database: ${c.options.database}. Ngày tạo: ${c.day}.`,
    "",
    "Mọi danh tính trong bộ này được tạo bằng thuật toán, không phải cư dân có thật. Mật khẩu ngẫu nhiên chỉ lưu trên máy bạn. Không đưa tệp này hoặc manifest.json lên GitHub.",
    "",
    "| Họ tên | Vai trò | Căn | Tên đăng nhập / SĐT chủ hộ | Mật khẩu | Trạng thái |",
    "|---|---|---|---|---|---|",
    ...c.manifest.accounts.map(
      (a) =>
        `| ${a.name} | ${a.role} | ${a.apartment || "—"} | ${a.login}${a.phone ? ` / ${a.phone}` : ""} | ${a.password} | ${a.active ? "Hoạt động" : "Đã khóa"} |`,
    ),
  ];
  await writeFile(
    path.join(c.out, "TAI-KHOAN.md"),
    accountLines.join("\n") + "\n",
    { mode: 0o600 },
  );
  await writeFile(
    path.join(c.out, "QR.html"),
    `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Danh sách QR vị trí</title><style>body{font:16px system-ui;margin:24px;background:#f5f6f3}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}article{background:white;padding:20px;border:1px solid #d9dfd8;border-radius:12px;text-align:center}img{width:220px;max-width:100%}a{overflow-wrap:anywhere}@media print{article{break-inside:avoid}}</style><h1>Danh sách QR vị trí</h1><p>Bộ dữ liệu mô phỏng · ${escape(c.options.database)} · ${escape(c.options.origin)}. Chạy backend đúng database này trước khi quét.</p><main>${c.manifest.qr.map((q) => `<article><h2>${escape(q.name)}</h2><img src="${escape(q.file)}" alt="QR vị trí"><p>${q.active ? "Hoạt động" : "Ngừng sử dụng"}</p><a href="${escape(q.url)}">${escape(q.url)}</a></article>`).join("")}</main></html>`,
  );
  const report = [
    "# Bộ dữ liệu mô phỏng sát nghiệp vụ",
    "",
    `Ngày tạo ${c.day}, database ${c.options.database}. Toàn bộ danh tính, liên hệ, số đo, chứng từ, ảnh minh họa và sự kiện đều là mô phỏng; không phải dữ liệu trích xuất từ website hay hồ sơ thực tế. Không chuyển tiền vào thông tin ngân hàng mô phỏng.`,
    "",
    "Tên trên các màn hình dùng tên tự nhiên; nguồn gốc được giữ tại tài liệu này và manifest.json. Các mốc thời gian lịch sử được đặt lùi chỉ trong bộ dữ liệu này để kiểm thử báo cáo, không thay đổi ngày giờ máy.",
    "",
    "Mở TAI-KHOAN.md để đăng nhập; mở QR.html để quét vị trí. Đăng nhập BQL vào Tổng quan, chọn Hiện biểu đồ và chuyển Ngày/Tuần/Tháng/Quý/Năm. Các file nhap/ đã nhập để tạo lịch sử; không nhập lại. Các file xuat/ là báo cáo sinh từ chính bộ dữ liệu này, gồm Excel chi tiết và PDF.",
    "",
    "## Số lượng từng bảng và view",
    "",
    "| Bảng / view | Số dòng | Mục tiêu / lý do ngoại lệ |",
    "|---|---:|---|",
    ...c.manifest.tables.map(
      (t) => `| ${t.table} | ${t.rows} | ${t.reason || "Tối thiểu 100"} |`,
    ),
    "",
    "## Các nghiệp vụ để kiểm thử",
    "",
    ...c.manifest.scenarios
      .filter((s) => typeof s === "string")
      .map((s) => `- ${s}`),
    "",
    "Mã tra cứu phản ánh và số điện thoại tương ứng ở manifest.json, không phát hành công khai tệp này.",
    "",
    "## Kiểm chứng tự động",
    "",
    ...c.manifest.checks.map((s) => `- ${s.status}: ${s.name}`),
    "",
    "Chạy lại sẽ dừng nếu database hoặc thư mục đầu ra đã có dữ liệu. Muốn bộ khác, dùng tên chung_cu_nghiem_thu_<mã mới>; không xóa hoặc reset database đang dùng.",
  ];
  await writeFile(path.join(c.out, "README.md"), report.join("\n") + "\n");
  await writeFile(
    path.join(c.out, "SO-LUONG-BANG.json"),
    JSON.stringify(
      {
        dataset_kind: c.manifest.dataset_kind,
        database: c.options.database,
        tables: c.manifest.tables,
        checks: c.manifest.checks,
      },
      null,
      2,
    ) + "\n",
  );
  c.manifest.trang_thai = "HOAN_TAT";
  await c.save();
  console.log(`Hoàn tất: ${path.relative(c.root, c.out)}`);
  console.log(
    `${c.manifest.tables.filter((t) => t.type === "BASE TABLE" && t.rows >= 100).length}/31 bảng đạt từ 100 dòng; các bảng danh mục còn lại có lý do trong README.md. ${c.manifest.checks.length} kiểm tra đạt.`,
  );
  console.log(
    "Đọc TAI-KHOAN.md trên máy để lấy mật khẩu; mở QR.html để thử quét. Không sửa .env hoặc database đang dùng.",
  );
} catch (error) {
  if (c?.created) {
    c.manifest.trang_thai = "CHUA_HOAN_TAT";
    c.manifest.error = error.code || error.message;
    await c.save().catch(() => {});
  }
  console.error(
    error.status
      ? `${error.code}: ${error.message}${error.field_errors ? ` (${JSON.stringify(error.field_errors)})` : ""}`
      : error.code || error.message,
  );
  console.error(
    "Bộ dữ liệu chưa hoàn tất. Giữ database và tệp đã tạo để kiểm tra; không xóa dữ liệu hoặc chạy lệnh reset.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
