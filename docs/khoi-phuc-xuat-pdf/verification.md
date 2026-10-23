# Kiểm chứng khôi phục Xuất PDF — 23/10/2026

- Cài `pdfmake@0.2.23` ở backend; `pdf-parse@1.1.1` là devDependency để đọc lại tệp trong kiểm thử. Không khôi phục pdf-lib, mẫu nhập PDF hoặc parser nhập PDF.
- Xác minh đúng lệnh `NODE_ENV=production npm ci --include=dev --workspaces --include-workspace-root --bin-links=true`: cài đủ dependency, có Vite và build thành công. Không sửa script build hoặc cài Vite toàn cục.
- `npm run build`: đạt, 160 modules. Cảnh báo chunk >500 kB và directive use client của React Router vẫn như trước, không sửa ngưỡng để giấu cảnh báo.
- `node scripts/check-local.js`: 0 lỗi file/dependency.
- 20 kiểm thử API/MySQL data-exchange/report-exports đạt: 8 danh sách xuất PDF có MIME và chữ ký thật, báo cáo tài chính theo bộ lọc, Unicode, nhiều trang, lặp tiêu đề bảng, số tiền vượt độ chính xác Excel, tệp rỗng, giới hạn PDF/Excel, snapshot và quyền BQL. Mẫu nhập PDF vẫn bị từ chối; luồng nhập Excel vẫn đạt.
- 4 ca trình duyệt đạt ở 1440/375px: nhập Excel và tải Excel/PDF danh sách; tải PDF công nợ, thu phí, sổ quỹ; tên tệp, nội dung, lỗi giới hạn được hiển thị tại chỗ và giữ nguyên bộ lọc. Không lỗi JavaScript.
- Xem PDF được dựng thật bằng pdfmake và ảnh trang đầu. `mau-cong-no.pdf` trong thư mục này dùng 3 dòng giả lập, không phải dữ liệu database của người dùng hoặc chứng từ thật.

Giới hạn: máy thực thi là Linux/Node 24.19.0; chưa truy cập máy Windows của người dùng để xác nhận nguyên nhân cụ thể khiến vite.cmd thiếu. Lệnh cài đã được xác minh cả khi NODE_ENV=production bỏ qua dev theo mặc định. Kiểm thử nghiệp vụ chỉ chạy trên chung_cu_test; không thay đổi database vận hành. Không chạy lại toàn bộ backend suite hoặc camera/thiết bị thật vì không thuộc phần xuất PDF.

Lệnh API/DB yêu cầu database chung_cu_test được chuẩn bị theo scripts/test-local.js. Lệnh trình duyệt dùng cấu hình playwright.config.js, với backend thử nghiệm 3101 và frontend 5174:

```text
node --env-file-if-exists=.env --test --test-concurrency=1 backend/test/data-exchange.test.js backend/test/report-exports.test.js
node --env-file-if-exists=.env node_modules/@playwright/test/cli.js test e2e/data-exchange.spec.js e2e/report-exports.spec.js
```

Đọc [hướng dẫn cập nhật và code đầy đủ](../cap-nhat-xuat-pdf-va-vite-vscode.md).
