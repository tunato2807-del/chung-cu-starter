# Thu chi và quỹ chung cư — code từng file cho VS Code

> Bản tiếp theo: [Xuất báo cáo Excel/PDF — code đầy đủ 11 file](cap-nhat-xuat-bao-cao-vscode.md). Nếu đã cập nhật xuất báo cáo, không dùng service/giao diện/CSS bên dưới đè lên bản mới.

Bản tiếp theo sau `e73e4c4` (đặt lịch tiện ích). Chép đủ **9 file** dưới đây vào dự án đang có, không cần tải ZIP hoặc cài thêm thư viện. Nếu chưa có phần tiện ích, cập nhật [bản 8 file đặt lịch tiện ích](cap-nhat-dat-lich-tien-ich-vscode.md) trước. Bản này giữ các chức năng đã triển khai và bổ sung mục BQL **Thu chi & quỹ**.

## Cách cập nhật trên Windows

1. Dừng backend và frontend bằng Ctrl+C, lưu lại thay đổi riêng trước khi thay nội dung file. Giữ `.env`, `.certs`, database và thư mục ảnh hiện trường.
2. Tạo file mới ở mục 1–5 và 7, thay **toàn bộ nội dung** file ở mục 6, 8, 9. Tạo thư mục `treasury` nếu chưa có. Mỗi mục chứa đầy đủ code của file đó; chỉ chép phần bên trong khối mã.
3. Mở PowerShell tại thư mục gốc (nơi có package.json):

```powershell
npm run db:migrate
npm run dev:backend
```

Migration **013_treasury.sql** thêm bốn bảng và một danh mục quỹ vận hành. Không sửa 001–012, không xóa database/volume, không chạy SQL schema cũ hoặc seed lại. Không có tiền/phiếu được tạo tự động khi migrate. Khi chạy lại, migration chỉ xác minh checksum và không thêm quỹ vận hành lần nữa. Nếu báo lỗi, xử lý lỗi trước khi chạy backend.

4. Mở terminal thứ hai tại thư mục gốc, dùng lệnh HTTPS đang chạy trên máy bạn:

```powershell
npm run dev:frontend:https
```

Sau đó Ctrl+F5 trên trình duyệt. Nếu thử thu chi bằng HTTP vẫn dùng lệnh mở Vite LAN trước đây; camera QR trong web tiếp tục cần HTTPS. Không chạy hai Vite cùng cổng.

5. Không chép app.js/App.jsx/global.css từ hướng dẫn cũ đè lên sau bản này vì sẽ mất menu/router mới.

## Cách dùng quỹ

Đăng nhập tài khoản BQL → **Thu chi & quỹ**. Cư dân, tài khoản căn hộ và KTV không được vào màn này hoặc tải chứng từ.

- **Quỹ vận hành** có sẵn, tự tổng hợp tiền của hóa đơn đã được xác nhận thu trên hệ thống, kể cả khoản đã xác nhận trước ngày cập nhật. Hóa đơn chưa thu/nháp/hủy không vào sổ. Không lập thêm phiếu thu khác cho cùng khoản hóa đơn; gửi lại thao tác xác nhận hóa đơn cũng chỉ có một khoản trong sổ.
- Có thể đổi tên/mô tả quỹ nhận hóa đơn; nguồn nhận hóa đơn là cố định và quỹ này luôn hoạt động. Bản này không tự tách tiền điện/nước/bảo trì trên một hóa đơn sang các quỹ khác.
- **Tạo quỹ** để theo dõi riêng, ví dụ một quỹ bảo trì. Quỹ mới bắt đầu từ 0. Muốn ghi số tiền ban đầu đã được kiểm tra, lập phiếu Thu → Bổ sung quỹ → nhập ngày/số tiền/nguồn nộp → duyệt ghi sổ. Chỉ ghi tiền chưa được phản ánh ở nguồn khác; cần đối soát với tiền mặt/ngân hàng thực tế.
- Tạm ngừng một quỹ riêng chặn lập/duyệt phiếu mới, giữ lịch sử và vẫn cho hủy nháp hoặc đảo phiếu đã ghi sổ nếu đủ điều kiện. Mở lại bằng **Sửa quỹ**.

## Lập và duyệt phiếu

Mở quỹ → **Lập phiếu thu / chi**:

1. Chọn Thu hoặc Chi. Thu có Bổ sung quỹ/Thu khác; Chi có Vận hành/Bảo trì/Mua sắm/Chi khác.
2. Nhập ngày hạch toán không sau hôm nay, số tiền nguyên đồng dương tối đa 14 chữ số (ví dụ `1500000`, không nhập dấu phân cách), người nộp/người nhận và diễn giải ít nhất 5 ký tự.
3. **Lưu phiếu nháp**. Nháp chưa thay đổi số dư; có thể sửa thông tin hoặc hủy nháp. Quỹ và loại phiếu đã tạo được giữ cố định; cần đổi thì hủy nháp và lập phiếu khác.
4. Trong chi tiết, chọn chứng từ ảnh/PDF → chờ dòng số tệp đã chọn → **Tải chứng từ lên**. Chỉ chọn trong thư viện chưa gửi tệp lên; phải bấm nút tải và thấy tệp xuất hiện trong danh sách. Nếu gửi lỗi, danh sách tệp đang chọn vẫn giữ để thử lại.
5. Kiểm tra khoản tiền thực tế và chứng từ, rồi **Xác nhận duyệt và ghi sổ**. Phiếu chi cần ít nhất một chứng từ và số dư hiện tại đủ. Hai người duyệt chi cùng lúc được kiểm tra trong transaction để không vượt quỹ. Tác vụ này ghi nhận tiền trên phần mềm, không chuyển tiền ngân hàng.

Phiếu có mã PT… cho thu, PC… cho chi. **Phiếu thu / chi** liệt kê cả nháp, đã ghi sổ, đã hủy; có tìm người nộp/nhận hoặc diễn giải, lọc quỹ/loại/trạng thái và phân trang. Nhấn mã để xem lịch sử. Cùng tài khoản BQL hiện tại có thể lập và duyệt phiếu; chưa có vai trò kế toán/thủ quỹ tách riêng.

## Chứng từ và lưu trữ

- Tối đa **5 tệp mỗi phiếu**, mỗi tệp tối đa **5 MB**. Nhận JPEG, PNG, WebP tĩnh hoặc PDF. Ảnh được xoay, thu nhỏ, chuyển JPEG và bỏ metadata; chưa nhận HEIC/HEIF.
- Tệp trùng nội dung đã lưu sẽ không tạo bản sao, kể cả bấm thử lại sau lỗi mạng. Nếu tải cả tệp trùng và tệp mới khi có người khác sửa phiếu, cần tải lại trang để lấy phiên bản hiện tại.
- Nháp cho phép xóa chứng từ. Phiếu đã ghi sổ giữ nguyên toàn bộ chứng từ và không tải thêm/xóa. Tải tệp từ liên kết trong danh sách, PDF chỉ tải xuống, không nhúng trình xem PDF.
- Chứng từ thu chi được lưu **trong database** và bảo vệ theo quyền BQL, không có đường dẫn public. Sao lưu database để giữ chứng từ; ảnh phản ánh cũ vẫn ở `backend/storage/images` và vẫn cần sao lưu thư mục đó. Không thêm thư mục chứng từ hoặc thay cấu hình storage cũ.

## Sửa sai bằng phiếu đảo

Phiếu đã ghi sổ không sửa/hủy lại. Mở phiếu gốc → nhập **Lý do đảo phiếu** → **Lập phiếu đảo**:

- Tạo ngay một phiếu ngược chiều cùng số tiền/quỹ, hạch toán **hôm nay**. Ví dụ chi 250.000 đ đã hoàn trả → phiếu đảo thu 250.000 đ. Đảo khoản thu tạo khoản chi, phải đủ số dư hiện tại.
- Giữ nguyên trạng thái và nội dung gốc, hiển thị liên kết hai chiều, giữ lịch sử thao tác. Chứng từ gốc vẫn nằm ở phiếu gốc, không cần upload bản sao.
- Mỗi phiếu gốc chỉ đảo một lần, không đảo tiếp phiếu đảo. Gửi lại cùng tài khoản/lý do trả đúng phiếu đảo đã tạo, không cộng trừ lần nữa. Không dùng chức năng này để hoàn hóa đơn cư dân đã thu; sổ quỹ chỉ đọc nguồn hóa đơn hiện có.
- Tổng thu/chi báo cáo giữ cả dòng gốc và đối ứng để thấy lịch sử; chênh lệch ròng của cặp bằng 0 khi cùng nằm trong khoảng ngày.

## Xem sổ quỹ và báo cáo tháng

Mở quỹ, chọn từ ngày/đến ngày → **Lọc sổ quỹ**. Ngày hạch toán là ngày Việt Nam; hóa đơn dùng ngày BQL xác nhận thu quy đổi từ UTC, không phải kỳ hóa đơn hoặc ngày chuyển tiền ngân hàng khai báo.

- **Đầu kỳ** = thu − chi trước ngày đầu.
- **Thu trong kỳ / Chi trong kỳ** tính cả ngày đầu và ngày cuối.
- **Cuối kỳ** = đầu kỳ + thu − chi.
- Chế độ từng khoản có liên kết hóa đơn/phiếu, lọc nguồn, loại và từ khóa. Các bộ lọc này chỉ thay danh sách, không làm lệch tổng số dư toàn quỹ trong khoảng ngày.
- **Tổng hợp theo tháng** hiển thị các tháng có giao dịch trong khoảng ngày, tổng thu/chi và chênh lệch; không áp dụng lọc nguồn/loại/từ khóa chi tiết. Các tháng ở biên chỉ tính ngày nằm trong khoảng đã chọn.

Phần mềm bắt đầu từ 0 trước dữ liệu đầu tiên và chưa tự đối soát ngân hàng. Nếu database đã có thu hóa đơn cũ nhưng thiếu chi cũ, số dư chưa phản ánh đầy đủ tiền thực tế; BQL cần kiểm tra và ghi nhận đúng các khoản còn thiếu. Không nhập lại các khoản đã có. Bản này chưa khóa sổ kỳ: hạch toán lùi ngày có thể thay số dư báo cáo quá khứ, thậm chí làm một kỳ quá khứ âm dù tại lúc duyệt chi quỹ đủ tiền. Kiểm tra đủ quỹ dùng số dư hiện tại lúc duyệt, không khóa theo ngày quá khứ.

Chưa có chuyển giữa quỹ, ngân sách dự toán, chia phương thức tiền mặt/tài khoản ngân hàng, xuất Excel/PDF hoặc chuyển tiền thật trong bản này.

## Thử nhanh

1. Tạo một quỹ riêng → phiếu Thu/Bổ sung quỹ 1.000.000 đ → lưu nháp. Mở sổ vẫn 0; duyệt phiếu rồi sổ thành 1.000.000 đ.
2. Tạo phiếu Chi 250.000 đ. Thử duyệt khi chưa chứng từ phải bị chặn; tải ảnh/PDF, duyệt lại → cuối kỳ 750.000 đ.
3. Mở phiếu chi đã ghi sổ: không sửa hoặc xóa chứng từ được. Đảo phiếu với lý do hoàn tiền → cuối kỳ trở về 1.000.000 đ, liên kết phiếu đảo/gốc còn đủ.
4. Lập hai phiếu chi 700.000 đ có chứng từ, mở hai tab và duyệt gần nhau. Chỉ một phiếu được ghi sổ; phiếu còn lại báo không đủ quỹ (nếu chưa có thu thêm).
5. Xem quỹ vận hành, xác nhận một hóa đơn chưa thu trong Phí & hóa đơn. Sổ tự thêm một dòng hóa đơn; gửi lại cùng xác nhận không thêm dòng thứ hai.
6. Xem tổng hợp theo tháng và lọc từng nguồn ở chế độ từng khoản. Tài khoản cư dân/KTV không được xem hoặc tải chứng từ.

Kiểm thử tự động dùng database riêng `chung_cu_test`, không xóa dữ liệu phát triển. Bao gồm phân quyền/CSRF, tiền chính xác vượt giới hạn số nguyên JavaScript khi cộng nhiều phiếu, UUID lặp, duyệt chi đồng thời, nguồn hóa đơn/ngày Việt Nam, chứng từ/rollback, đảo một lần, phân trang và báo cáo snapshot. Trình duyệt chạy luồng ghi sổ ở 1440 px/375 px. Nếu đã chép cả file test từ GitHub, chạy lần lượt `npm test`, `npm run test:e2e`, `npm run build`; các file test không cần để sử dụng chức năng.

## 1. `database/migrations/013_treasury.sql`

```sql
CREATE TABLE quy_tai_chinh (
  ma_quy INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ten_quy VARCHAR(120) NOT NULL,
  mo_ta VARCHAR(1000) NOT NULL,
  dang_hoat_dong BOOLEAN NOT NULL DEFAULT TRUE,
  nhan_thu_hoa_don BOOLEAN NOT NULL DEFAULT FALSE,
  quy_hoa_don TINYINT GENERATED ALWAYS AS (IF(nhan_thu_hoa_don,1,NULL)) STORED UNIQUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CHECK (nhan_thu_hoa_don=0 OR dang_hoat_dong=1)
) ENGINE=InnoDB;
-- No financial entry is seeded. Existing confirmed invoice receipts are read directly.
INSERT INTO quy_tai_chinh (ten_quy,mo_ta,nhan_thu_hoa_don) VALUES
 ('Quỹ vận hành','Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0.',TRUE);
CREATE TABLE phieu_thu_chi (
  ma_phieu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_quy INT UNSIGNED NOT NULL,
  loai ENUM('THU','CHI') NOT NULL,
  nhom VARCHAR(30) NOT NULL,
  ngay_hach_toan DATE NOT NULL,
  so_tien DECIMAL(14,0) NOT NULL,
  doi_tac VARCHAR(150) NOT NULL,
  dien_giai VARCHAR(1000) NOT NULL,
  trang_thai ENUM('NHAP','DA_GHI_SO','HUY') NOT NULL DEFAULT 'NHAP',
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_nguoi_lap INT UNSIGNED NOT NULL,
  ma_nguoi_duyet INT UNSIGNED NULL,
  ngay_duyet DATETIME(6) NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ma_phieu_goc INT UNSIGNED NULL UNIQUE,
  khoa_yeu_cau CHAR(36) NULL UNIQUE,
  van_tay CHAR(64) NULL,
  CHECK (so_tien>0),
  CHECK ((khoa_yeu_cau IS NOT NULL AND van_tay IS NOT NULL AND ma_phieu_goc IS NULL) OR
         (khoa_yeu_cau IS NULL AND van_tay IS NULL AND ma_phieu_goc IS NOT NULL AND trang_thai='DA_GHI_SO' AND nhom='DIEU_CHINH')),
  CHECK (trang_thai<>'DA_GHI_SO' OR (ma_nguoi_duyet IS NOT NULL AND ngay_duyet IS NOT NULL)),
  FOREIGN KEY (ma_quy) REFERENCES quy_tai_chinh(ma_quy),
  FOREIGN KEY (ma_nguoi_lap) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_duyet) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_phieu_goc) REFERENCES phieu_thu_chi(ma_phieu),
  INDEX idx_treasury_fund (ma_quy,trang_thai,ngay_hach_toan,ma_phieu),
  INDEX idx_treasury_queue (trang_thai,ma_phieu)
) ENGINE=InnoDB;
CREATE TABLE chung_tu_thu_chi (
  ma_chung_tu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phieu INT UNSIGNED NOT NULL,
  ten_tep VARCHAR(120) NOT NULL,
  loai_tep ENUM('image/jpeg','application/pdf') NOT NULL,
  kich_thuoc INT UNSIGNED NOT NULL,
  bam_sha256 CHAR(64) NOT NULL,
  noi_dung MEDIUMBLOB NOT NULL,
  ma_nguoi_tai INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE (ma_phieu,bam_sha256),
  CHECK (kich_thuoc BETWEEN 1 AND 5242880),
  CHECK (kich_thuoc=OCTET_LENGTH(noi_dung)),
  FOREIGN KEY (ma_phieu) REFERENCES phieu_thu_chi(ma_phieu) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_tai) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE lich_su_thu_chi (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_phieu INT UNSIGNED NOT NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ghi_chu TEXT NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_phieu) REFERENCES phieu_thu_chi(ma_phieu) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_treasury_history (ma_phieu,ma_lich_su)
) ENGINE=InnoDB;
```

## 2. `backend/src/modules/treasury/treasury.validation.js`

```js
import { choice, fail, integer, text } from "../../lib/http.js";
import {
  amount,
  day,
  pagination,
  today,
} from "../billing/billing.validation.js";
export { pagination, today, day };
export const categories = {
  THU: ["BO_SUNG_QUY", "THU_KHAC"],
  CHI: ["VAN_HANH", "BAO_TRI", "MUA_SAM", "CHI_KHAC"],
};
export function positive(value, field) {
  const n = integer(value, field);
  if (n < 1) fail(422, "VALIDATION", "Mã phải lớn hơn 0.");
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Phiếu hoặc quỹ đã thay đổi. Hãy tải lại trang.",
    );
}
export function fund(body) {
  if (typeof body.dang_hoat_dong !== "boolean")
    fail(422, "VALIDATION", "Chọn rõ trạng thái quỹ.");
  return {
    ten_quy: text(body.ten_quy, "ten_quy", 2, 120),
    mo_ta: text(body.mo_ta || "", "mo_ta", 0, 1000),
    dang_hoat_dong: body.dang_hoat_dong,
  };
}
export function voucher(body) {
  const type = choice(body.loai, "loai", ["THU", "CHI"]),
    sum = amount(body.so_tien);
  if (sum <= 0n)
    fail(422, "INVALID_AMOUNT", "Số tiền phải là số nguyên đồng lớn hơn 0.");
  return {
    ma_quy: positive(body.ma_quy, "ma_quy"),
    loai: type,
    nhom: choice(body.nhom, "nhom", categories[type]),
    ngay_hach_toan: day(body.ngay_hach_toan),
    so_tien: sum.toString(),
    doi_tac: text(body.doi_tac, "doi_tac", 2, 150),
    dien_giai: text(body.dien_giai, "dien_giai", 5, 1000),
  };
}
export function key(value) {
  const s = text(value, "khoa_yeu_cau", 36, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s))
    fail(
      422,
      "INVALID_REQUEST_KEY",
      "Mã yêu cầu không hợp lệ. Hãy mở lại biểu mẫu.",
    );
  return s;
}
export function range(query) {
  const current = today(),
    from = day(query.tu_ngay || `${current.slice(0, 7)}-01`),
    to = day(query.den_ngay || current);
  if (from > to)
    fail(422, "INVALID_DATE_RANGE", "Từ ngày không được sau đến ngày.");
  return { tu_ngay: from, den_ngay: to };
}
export function reason(value) {
  return text(value, "ly_do", 5, 1000);
}
```

## 3. `backend/src/modules/treasury/treasury.proofs.js`

```js
import multer from "multer";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { fail } from "../../lib/http.js";
const parse = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
    fields: 2,
    fieldSize: 100,
    parts: 7,
  },
}).array("chung_tu", 5);
export function upload(req, res, next) {
  parse(req, res, (error) => {
    if (error)
      return next(
        Object.assign(
          new Error(
            "Tối đa 5 chứng từ, mỗi tệp không quá 5 MB; chỉ dùng trường chung_tu và phien_ban.",
          ),
          { status: 413, code: "PROOF_UPLOAD_LIMIT" },
        ),
      );
    next();
  });
}
export async function prepare(files = []) {
  if (!files.length) fail(422, "PROOF_REQUIRED", "Chọn ít nhất một chứng từ.");
  const result = [];
  for (const file of files) {
    let buffer,
      type,
      name =
        file.originalname
          .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
          .slice(0, 110) || "Chứng từ";
    if (file.buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
      // PDF is served as a download with sandbox/nosniff, never embedded or executed.
      if (!/%%EOF\s*$/.test(file.buffer.subarray(-1024).toString("latin1")))
        fail(422, "PROOF_INVALID", "Tệp PDF chưa đầy đủ hoặc không hợp lệ.");
      buffer = file.buffer;
      type = "application/pdf";
    } else {
      try {
        const img = sharp(file.buffer, {
            limitInputPixels: 25_000_000,
            animated: false,
          }),
          info = await img.metadata();
        if (
          !["jpeg", "png", "webp"].includes(info.format) ||
          (info.pages || 1) > 1
        )
          throw new Error("format");
        buffer = await img
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        type = "image/jpeg";
        name = name.replace(/\.[^.]*$/, "") + ".jpg";
      } catch {
        fail(
          422,
          "PROOF_INVALID",
          "Chỉ nhận PDF hoặc ảnh JPEG, PNG, WebP tĩnh hợp lệ, tối đa 25 triệu điểm ảnh.",
        );
      }
    }
    if (buffer.length > 5 * 1024 * 1024)
      fail(422, "PROOF_TOO_LARGE", "Chứng từ sau xử lý vượt 5 MB.");
    result.push({
      name,
      type,
      buffer,
      hash: createHash("sha256").update(buffer).digest("hex"),
    });
  }
  return [...new Map(result.map((x) => [x.hash, x])).values()];
}
```

## 4. `backend/src/modules/treasury/treasury.service.js`

```js
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text } from "../../lib/http.js";
import * as v from "./treasury.validation.js";
import { prepare } from "./treasury.proofs.js";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy quỹ, phiếu hoặc chứng từ.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function snapshot(work) {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const r = await work(db);
    await db.commit();
    return r;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
async function getFund(db, id, lock = false) {
  const [f] = await rows(
    db,
    `SELECT * FROM quy_tai_chinh WHERE ma_quy=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!f) missing();
  return f;
}
function open(f) {
  if (!f.dang_hoat_dong)
    fail(409, "FUND_CLOSED", "Quỹ đang tạm ngừng lập và duyệt phiếu mới.");
}
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
// The receipt source is the existing immutable paid invoice, never a copied voucher.
// Fund IDs are validated internal integers; no user strings are interpolated here.
function source(id) {
  // Older installations can use a different utf8mb4 collation. Normalize text
  // in both sources instead of altering the existing financial tables.
  const u = (expression) =>
    `CONVERT(${expression} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
  const voucherCode =
    "CONCAT(IF(p.loai='THU','PT','PC'),LPAD(CAST(p.ma_phieu AS CHAR),GREATEST(6,CHAR_LENGTH(CAST(p.ma_phieu AS CHAR))),'0'))";
  return `(SELECT ${u("'PHIEU'")} AS nguon,p.ma_phieu AS ma_ban_ghi,p.ngay_hach_toan AS ngay,${u("p.loai")} AS loai,p.so_tien,${u("p.nhom")} AS nhom,${u("p.doi_tac")} AS doi_tac,${u("p.dien_giai")} AS dien_giai,p.ma_phieu_goc,${u(voucherCode)} AS so_chung_tu
    FROM phieu_thu_chi p WHERE p.ma_quy=${id} AND p.trang_thai='DA_GHI_SO'
    UNION ALL SELECT ${u("'HOA_DON'")},h.ma_hoa_don,DATE(CONVERT_TZ(h.ngay_thanh_toan,'+00:00','+07:00')),${u("'THU'")},h.so_tien_da_thu,${u("'THU_HOA_DON'")},${u("CONCAT('Căn ',a.so_can_ho)")},${u("CONCAT('Thu hóa đơn ',h.so_hoa_don,' · kỳ ',h.ky_thanh_toan)")},NULL,${u("h.so_hoa_don")}
    FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho JOIN quy_tai_chinh q ON q.ma_quy=${id} AND q.nhan_thu_hoa_don=1
    WHERE h.trang_thai='DA_THANH_TOAN' AND h.ngay_thanh_toan IS NOT NULL) s`;
}

async function balance(db, id) {
  const [r] = await rows(
    db,
    `SELECT CAST(COALESCE(SUM(IF(loai='THU',so_tien,-so_tien)),0) AS CHAR) AS so_du FROM ${source(id)} WHERE ngay<=?`,
    [v.today()],
  );
  return r.so_du;
}
export async function funds(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = query.q ? "WHERE ten_quy LIKE ?" : "";
  if (query.q) args.push(`%${text(query.q, "q", 1, 100)}%`);
  const [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total FROM quy_tai_chinh ${where}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT * FROM quy_tai_chinh ${where} ORDER BY nhan_thu_hoa_don DESC,ma_quy DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function fundDetail(id) {
  return snapshot(async (db) => ({
    ...(await getFund(db, id)),
    so_du: await balance(db, id),
  }));
}
export async function saveFund(id, body, user) {
  const data = v.fund(body);
  return transaction(async (db) => {
    if (id) {
      const old = await getFund(db, id, true);
      await actor(db, user);
      v.version(old, body.phien_ban);
      if (old.nhan_thu_hoa_don && !data.dang_hoat_dong)
        fail(422, "INVOICE_FUND", "Quỹ nhận thu hóa đơn cần luôn hoạt động.");
      await rows(
        db,
        "UPDATE quy_tai_chinh SET ten_quy=?,mo_ta=?,dang_hoat_dong=?,phien_ban=phien_ban+1 WHERE ma_quy=?",
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        "INSERT INTO quy_tai_chinh (ten_quy,mo_ta,dang_hoat_dong) VALUES (?,?,?)",
        Object.values(data),
      );
      id = r.insertId;
    }
    return { ma_quy: id };
  });
}
async function audit(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_thu_chi (ma_phieu,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// No non-locking read in the transaction before taking the fund mutex. In particular
// the immutable fund hint is read outside it, so approvals never reuse an older snapshot.
async function withVoucher(id, user, work) {
  const [hint] = await rows(
    pool,
    "SELECT ma_quy FROM phieu_thu_chi WHERE ma_phieu=?",
    [id],
  );
  if (!hint) missing();
  return transaction(async (db) => {
    const f = await getFund(db, hint.ma_quy, true);
    const [p] = await rows(
      db,
      "SELECT * FROM phieu_thu_chi WHERE ma_phieu=? FOR UPDATE",
      [id],
    );
    if (!p) missing();
    await actor(db, user);
    return work(db, f, p);
  });
}
function draft(p) {
  if (p.trang_thai !== "NHAP")
    fail(
      409,
      "IMMUTABLE_VOUCHER",
      "Chỉ sửa hoặc hủy phiếu nháp. Phiếu đã ghi sổ cần lập phiếu đảo.",
    );
}
const baseFields = "ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai";
export async function create(body, user) {
  const data = v.voucher(body),
    key = v.key(body.khoa_yeu_cau),
    hash = createHash("sha256")
      .update(JSON.stringify({ actor: user.ma_nguoi_dung, ...data }))
      .digest("hex");
  return transaction(async (db) => {
    const f = await getFund(db, data.ma_quy, true);
    await actor(db, user);
    const [prior] = await rows(
      db,
      "SELECT ma_phieu,van_tay FROM phieu_thu_chi WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== hash)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu: prior.ma_phieu, replay: true };
    }
    open(f);
    const r = await rows(
      db,
      `INSERT INTO phieu_thu_chi (${baseFields},ma_nguoi_lap,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [...Object.values(data), user.ma_nguoi_dung, key, hash],
    );
    await audit(db, r.insertId, user, "TAO_NHAP", JSON.stringify(data));
    return { ma_phieu: r.insertId, replay: false };
  });
}
export async function edit(id, body, user) {
  const data = v.voucher(body);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    open(f);
    v.version(p, body.phien_ban);
    if (data.ma_quy !== p.ma_quy || data.loai !== p.loai)
      fail(
        422,
        "IMMUTABLE_FUND",
        "Không đổi quỹ hoặc loại của phiếu đã lập. Hủy nháp và tạo phiếu mới.",
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET nhom=?,ngay_hach_toan=?,so_tien=?,doi_tac=?,dien_giai=?,phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [
        data.nhom,
        data.ngay_hach_toan,
        data.so_tien,
        data.doi_tac,
        data.dien_giai,
        id,
      ],
    );
    await audit(db, id, user, "SUA_NHAP", JSON.stringify(data));
    return { ma_phieu: id };
  });
}
export async function act(id, action, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    if (action === "dao") {
      const reason = v.reason(body.ly_do);
      const [prior] = await rows(
        db,
        "SELECT ma_phieu,dien_giai,ma_nguoi_lap FROM phieu_thu_chi WHERE ma_phieu_goc=? FOR UPDATE",
        [id],
      );
      if (prior) {
        if (
          prior.dien_giai !== reason ||
          prior.ma_nguoi_lap !== user.ma_nguoi_dung
        )
          fail(
            409,
            "ALREADY_REVERSED",
            "Phiếu đã được đảo. Mở phiếu đảo trong chi tiết để kiểm tra.",
          );
        return { ma_phieu: prior.ma_phieu, replay: true };
      }
      v.version(p, body.phien_ban);
      if (p.trang_thai !== "DA_GHI_SO" || p.ma_phieu_goc)
        fail(
          409,
          "INVALID_REVERSAL",
          "Chỉ đảo một lần phiếu gốc đã ghi sổ; không đảo tiếp phiếu đảo.",
        );
      const type = p.loai === "THU" ? "CHI" : "THU";
      if (
        type === "CHI" &&
        BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien)
      )
        fail(
          409,
          "INSUFFICIENT_FUNDS",
          "Quỹ không đủ số dư hiện tại để đảo khoản thu này.",
        );
      const r = await rows(
        db,
        "INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,ma_phieu_goc) VALUES (?,?,'DIEU_CHINH',?,?,?,?,'DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?)",
        [
          p.ma_quy,
          type,
          v.today(),
          p.so_tien,
          p.doi_tac,
          reason,
          user.ma_nguoi_dung,
          user.ma_nguoi_dung,
          id,
        ],
      );
      await rows(
        db,
        "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(
        db,
        id,
        user,
        "DAO_PHIEU",
        `${code({ ...p, ma_phieu: r.insertId, loai: type })}: ${reason}`,
      );
      await audit(db, r.insertId, user, "TAO_DAO", `${code(p)}: ${reason}`);
      return { ma_phieu: r.insertId, replay: false };
    }
    v.version(p, body.phien_ban);
    draft(p);
    if (action === "huy") {
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='HUY',phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(db, id, user, "HUY", v.reason(body.ly_do));
    } else if (action === "duyet") {
      open(f);
      v.day(p.ngay_hach_toan);
      if (p.loai === "CHI") {
        const [n] = await rows(
          db,
          "SELECT COUNT(*) AS total FROM chung_tu_thu_chi WHERE ma_phieu=?",
          [id],
        );
        if (!n.total)
          fail(
            422,
            "PROOF_REQUIRED",
            "Phiếu chi cần ít nhất một chứng từ trước khi duyệt.",
          );
        if (BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien))
          fail(
            409,
            "INSUFFICIENT_FUNDS",
            "Quỹ không đủ số dư hiện tại để duyệt chi.",
          );
      }
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='DA_GHI_SO',ma_nguoi_duyet=?,ngay_duyet=UTC_TIMESTAMP(6),phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [user.ma_nguoi_dung, id],
      );
      await audit(
        db,
        id,
        user,
        "GHI_SO",
        text(body.ghi_chu || "", "ghi_chu", 0, 1000),
      );
    } else fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    return { ma_phieu: id };
  });
}
const select = `p.ma_phieu,p.ma_quy,p.loai,p.nhom,p.ngay_hach_toan,p.so_tien,p.doi_tac,p.dien_giai,p.trang_thai,p.phien_ban,p.ma_phieu_goc,p.ngay_tao,p.ngay_duyet,q.ten_quy,r.ma_phieu AS ma_phieu_dao`;
const from =
  "FROM phieu_thu_chi p JOIN quy_tai_chinh q ON q.ma_quy=p.ma_quy LEFT JOIN phieu_thu_chi r ON r.ma_phieu_goc=p.ma_phieu";
export async function list(query) {
  const { page, offset } = v.pagination(query),
    where = ["1=1"],
    args = [];
  if (query.ma_quy) {
    where.push("p.ma_quy=?");
    args.push(v.positive(query.ma_quy, "ma_quy"));
  }
  if (query.loai) {
    where.push("p.loai=?");
    args.push(choice(query.loai, "loai", ["THU", "CHI"]));
  }
  if (query.trang_thai) {
    where.push("p.trang_thai=?");
    args.push(
      choice(query.trang_thai, "trang_thai", ["NHAP", "DA_GHI_SO", "HUY"]),
    );
  }
  if (query.q) {
    where.push("(p.doi_tac LIKE ? OR p.dien_giai LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  const clause = where.join(" AND "),
    [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total ${from} WHERE ${clause}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT ${select} ${from} WHERE ${clause} ORDER BY p.ma_phieu DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function detail(id) {
  const [p] = await rows(
    pool,
    `SELECT ${select},u.ho_va_ten AS nguoi_lap,d.ho_va_ten AS nguoi_duyet ${from} JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_lap LEFT JOIN nguoi_dung d ON d.ma_nguoi_dung=p.ma_nguoi_duyet WHERE p.ma_phieu=?`,
    [id],
  );
  if (!p) missing();
  p.chung_tu = await rows(
    pool,
    "SELECT ma_chung_tu,ten_tep,loai_tep,kich_thuoc,ngay_tao FROM chung_tu_thu_chi WHERE ma_phieu=? ORDER BY ma_chung_tu",
    [id],
  );
  p.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_thu_chi h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_phieu=? ORDER BY h.ma_lich_su",
    [id],
  );
  return p;
}
export async function attach(id, body, files, user) {
  const prepared = await prepare(files);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    const existing = await rows(
        db,
        "SELECT ma_chung_tu,bam_sha256 FROM chung_tu_thu_chi WHERE ma_phieu=?",
        [id],
      ),
      fresh = prepared.filter(
        (x) => !existing.some((y) => y.bam_sha256 === x.hash),
      );
    if (!fresh.length) return { ma_phieu: id, replay: true };
    v.version(p, body.phien_ban);
    if (existing.length + fresh.length > 5)
      fail(422, "PROOF_LIMIT", "Mỗi phiếu giữ tối đa 5 chứng từ.");
    for (const file of fresh)
      await rows(
        db,
        "INSERT INTO chung_tu_thu_chi (ma_phieu,ten_tep,loai_tep,kich_thuoc,bam_sha256,noi_dung,ma_nguoi_tai) VALUES (?,?,?,?,?,?,?)",
        [
          id,
          file.name,
          file.type,
          file.buffer.length,
          file.hash,
          file.buffer,
          user.ma_nguoi_dung,
        ],
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(
      db,
      id,
      user,
      "THEM_CHUNG_TU",
      fresh.map((f) => f.name).join(", "),
    );
    return { ma_phieu: id, replay: false };
  });
}
export async function removeProof(id, proofId, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    v.version(p, body.phien_ban);
    const r = await rows(
      db,
      "DELETE FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
      [id, proofId],
    );
    if (!r.affectedRows) missing();
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(db, id, user, "XOA_CHUNG_TU", `Chứng từ #${proofId}`);
    return { ma_phieu: id };
  });
}
export async function proof(id, proofId) {
  const [f] = await rows(
    pool,
    "SELECT loai_tep,noi_dung FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
    [id, proofId],
  );
  if (!f) missing();
  return f;
}
export async function ledger(id, query) {
  const range = v.range(query),
    { page, offset } = v.pagination(query),
    mode = choice(query.che_do || "GIAO_DICH", "che_do", [
      "GIAO_DICH",
      "THEO_THANG",
    ]);
  return snapshot(async (db) => {
    const fund = await getFund(db, id),
      [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [s] = await rows(
      db,
      `SELECT CAST(COALESCE(SUM(IF(ngay<?,IF(loai='THU',so_tien,-so_tien),0)),0) AS CHAR) AS dau_ky,CAST(COALESCE(SUM(IF(ngay>=? AND loai='THU',so_tien,0)),0) AS CHAR) AS tong_thu,CAST(COALESCE(SUM(IF(ngay>=? AND loai='CHI',so_tien,0)),0) AS CHAR) AS tong_chi FROM ${source(id)} WHERE ngay<=?`,
      [range.tu_ngay, range.tu_ngay, range.tu_ngay, range.den_ngay],
    );
    s.cuoi_ky = (
      BigInt(s.dau_ky) +
      BigInt(s.tong_thu) -
      BigInt(s.tong_chi)
    ).toString();
    const args = [range.tu_ngay, range.den_ngay],
      where = ["ngay>=?", "ngay<=?"];
    if (mode === "GIAO_DICH") {
      if (query.loai) {
        where.push("loai=?");
        args.push(choice(query.loai, "loai", ["THU", "CHI"]));
      }
      if (query.nguon) {
        where.push("nguon=?");
        args.push(choice(query.nguon, "nguon", ["PHIEU", "HOA_DON"]));
      }
      if (query.q) {
        where.push(
          "(so_chung_tu LIKE ? OR doi_tac LIKE ? OR dien_giai LIKE ?)",
        );
        const q = `%${text(query.q, "q", 1, 100)}%`;
        args.push(q, q, q);
      }
    }
    const clause = where.join(" AND "),
      grouped = mode === "THEO_THANG",
      dataFrom = grouped
        ? `FROM (SELECT DATE_FORMAT(ngay,'%Y-%m') AS ky,CAST(SUM(IF(loai='THU',so_tien,0)) AS CHAR) AS tong_thu,CAST(SUM(IF(loai='CHI',so_tien,0)) AS CHAR) AS tong_chi ${"FROM " + source(id)} WHERE ${clause} GROUP BY DATE_FORMAT(ngay,'%Y-%m')) m`
        : `FROM ${source(id)} WHERE ${clause}`;
    const [n] = await rows(db, `SELECT COUNT(*) AS total ${dataFrom}`, args),
      data = await rows(
        db,
        `SELECT ${grouped ? "m.*" : "s.*"} ${dataFrom} ORDER BY ${grouped ? "ky DESC" : "ngay DESC,nguon,ma_ban_ghi DESC"} LIMIT 20 OFFSET ${offset}`,
        args,
      );
    return {
      fund,
      data,
      total: n.total,
      page,
      summary: s,
      filters: { ...range, che_do: mode },
      ...stamp,
    };
  });
}
```

## 5. `backend/src/modules/treasury/treasury.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./treasury.service.js";
import { upload } from "./treasury.proofs.js";
export const fundsRouter = Router(),
  vouchersRouter = Router();
for (const router of [fundsRouter, vouchersRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
fundsRouter.get("/", async (req, res) =>
  res.json(await service.funds(req.query)),
);
fundsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveFund(null, req.body, req.user) }),
);
fundsRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.fundDetail(integer(req.params.id, "id")) }),
);
fundsRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.saveFund(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
fundsRouter.get("/:id/so_quy", async (req, res) =>
  res.json(await service.ledger(integer(req.params.id, "id"), req.query)),
);
vouchersRouter.get("/", async (req, res) =>
  res.json(await service.list(req.query)),
);
vouchersRouter.post("/", async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(data.replay ? 200 : 201).json({ data });
});
vouchersRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(integer(req.params.id, "id")) }),
);
vouchersRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.edit(integer(req.params.id, "id"), req.body, req.user),
  }),
);
for (const action of ["duyet", "huy", "dao"])
  vouchersRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.act(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
vouchersRouter.post("/:id/chung_tu", upload, async (req, res) =>
  res.json({
    data: await service.attach(
      integer(req.params.id, "id"),
      req.body,
      req.files,
      req.user,
    ),
  }),
);
vouchersRouter.delete("/:id/chung_tu/:proof", async (req, res) =>
  res.json({
    data: await service.removeProof(
      integer(req.params.id, "id"),
      integer(req.params.proof, "proof"),
      req.body,
      req.user,
    ),
  }),
);
vouchersRouter.get("/:id/chung_tu/:proof", async (req, res) => {
  const f = await service.proof(
    integer(req.params.id, "id"),
    integer(req.params.proof, "proof"),
  );
  res.set("Content-Type", f.loai_tep);
  res.set(
    "Content-Disposition",
    `attachment; filename="chung-tu-${integer(req.params.proof, "proof")}.${f.loai_tep === "application/pdf" ? "pdf" : "jpg"}"`,
  );
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  res.send(f.noi_dung);
});
```

## 6. `backend/src/app.js`

```js
import express from "express";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext, fail } from "./lib/http.js";
import { pool } from "./lib/db.js";
import { authRouter, usersRouter } from "./modules/auth/auth.routes.js";
import { qrRouter, publicQrRouter } from "./modules/qr/qr.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import {
  ratesRouter,
  metersRouter,
  billsRouter,
  selfBillsRouter,
} from "./modules/billing/billing.routes.js";
import {
  apartmentsRouter,
  residentsRouter,
} from "./modules/residency/residency.routes.js";
import {
  publicIncidentsRouter,
  incidentsRouter,
} from "./modules/incidents/incidents.routes.js";

import {
  announcementsRouter,
  selfAnnouncementsRouter,
} from "./modules/announcements/announcements.routes.js";

import { financialReportsRouter } from "./modules/financial-reports/financial-reports.routes.js";

import {
  equipmentRouter,
  maintenanceRouter,
} from "./modules/maintenance/maintenance.routes.js";

import {
  amenitiesRouter,
  bookingsRouter,
  selfBookingsRouter,
} from "./modules/amenities/amenities.routes.js";

import {
  fundsRouter,
  vouchersRouter,
} from "./modules/treasury/treasury.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(requestContext);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/api/health", healthRouter);
app.get("/api/ready", async (req, res) => {
  try {
    const [migrations] = await pool.execute(
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
        "005_billing.sql",
        "006_electricity_tiers.sql",
        "007_apartment_accounts.sql",
        "008_handover_audit_locks.sql",
        "009_announcements.sql",
        "010_maintenance.sql",
        "011_maintenance_plan_checks.sql",
        "012_amenity_bookings.sql",
        "013_treasury.sql",
      ],
    );
    if (migrations.length !== 13) throw new Error("Schema not initialized");
    await pool.query("SELECT 1 FROM phan_anh LIMIT 1");
  } catch {
    fail(
      503,
      "DATABASE_UNAVAILABLE",
      "Chưa kết nối được database hoặc chưa chạy migration.",
    );
  }
  res.json({ data: { status: "ok", database: "connected" } });
});
app.use("/api/xac_thuc", authRouter);
app.use("/api/nguoi_dung", usersRouter);
app.use("/api/can_ho", apartmentsRouter);
app.use("/api/cu_dan", residentsRouter);
app.use("/api/phuong_tien", vehiclesRouter);
app.use("/api/cau_hinh_phi", ratesRouter);
app.use("/api/chi_so_dich_vu", metersRouter);
app.use("/api/hoa_don", billsRouter);
app.use("/api/bao_cao", financialReportsRouter);
app.use("/api/quy", fundsRouter);
app.use("/api/phieu_thu_chi", vouchersRouter);
app.use("/api/tien_ich", amenitiesRouter);
app.use("/api/dat_lich_tien_ich", bookingsRouter);
app.use("/api/cua_toi/dat_lich", selfBookingsRouter);
app.use("/api/thiet_bi", equipmentRouter);
app.use("/api/bao_tri", maintenanceRouter);
app.use("/api/thong_bao", announcementsRouter);
app.use("/api/cua_toi/thong_bao", selfAnnouncementsRouter);
app.use("/api/cua_toi/hoa_don", selfBillsRouter);
app.use("/api/vi_tri_qr", qrRouter);
app.use("/api/cong_khai/vi_tri_qr", publicQrRouter);
app.use("/api/cong_khai/phan_anh", publicIncidentsRouter);
app.use("/api/phan_anh", incidentsRouter);
app.use((req, res) =>
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "API chưa tồn tại.",
      request_id: req.requestId,
    },
  }),
);
app.use(errorHandler);
```

## 7. `frontend/src/features/treasury/Treasury.jsx`

```jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (n) => (n ? n.split("-").reverse().join("/") : "—");
const time = (n) =>
  n
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(n.replace(" ", "T") + "Z"))
    : "—";
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
const types = { THU: "Phiếu thu", CHI: "Phiếu chi" },
  states = { NHAP: "Bản nháp", DA_GHI_SO: "Đã ghi sổ", HUY: "Đã hủy" };
const categories = {
  BO_SUNG_QUY: "Bổ sung quỹ",
  THU_KHAC: "Thu khác",
  VAN_HANH: "Vận hành",
  BAO_TRI: "Bảo trì",
  MUA_SAM: "Mua sắm",
  CHI_KHAC: "Chi khác",
  DIEU_CHINH: "Đảo phiếu",
  THU_HOA_DON: "Thu hóa đơn",
};
const allowed = {
  THU: ["BO_SUNG_QUY", "THU_KHAC"],
  CHI: ["VAN_HANH", "BAO_TRI", "MUA_SAM", "CHI_KHAC"],
};
const events = {
  TAO_NHAP: "Lập nháp",
  SUA_NHAP: "Sửa nháp",
  GHI_SO: "Duyệt và ghi sổ",
  HUY: "Hủy nháp",
  DAO_PHIEU: "Đảo phiếu gốc",
  TAO_DAO: "Lập phiếu đảo",
  THEM_CHUNG_TU: "Thêm chứng từ",
  XOA_CHUNG_TU: "Xóa chứng từ",
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: c.signal })
      .then((result) => {
        if (!c.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!c.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => c.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((x) => x + 1),
  };
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice(
        r.data.replay
          ? "Đã mở lại kết quả đã lưu trước đó."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    notice,
    run,
    clear: () => {
      setError(null);
      setNotice("");
    },
  };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Nav() {
  return (
    <div className="actions">
      <Link to="/quan-tri/quy">Danh sách quỹ</Link>
      <Link to="/quan-tri/phieu-thu-chi">Phiếu thu / chi</Link>
    </div>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(n) {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function FundForm({ fund, action, onSave, onCancel }) {
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_hoat_dong: fund?.nhan_thu_hoa_don
            ? true
            : b.dang_hoat_dong === "1",
          ...(fund ? { phien_ban: fund.phien_ban } : {}),
        });
      }}
    >
      <h2>{fund ? "Sửa thông tin quỹ" : "Tạo quỹ"}</h2>
      <Feedback action={action} />
      <Field label="Tên quỹ">
        <input
          name="ten_quy"
          required
          minLength={2}
          maxLength={120}
          defaultValue={fund?.ten_quy}
        />
      </Field>
      <Field label="Mô tả quỹ">
        <textarea
          name="mo_ta"
          rows={3}
          maxLength={1000}
          defaultValue={fund?.mo_ta}
        />
      </Field>
      <Field label="Trạng thái quỹ">
        <select
          name="dang_hoat_dong"
          disabled={!!fund?.nhan_thu_hoa_don}
          defaultValue={fund ? String(Number(fund.dang_hoat_dong)) : "1"}
        >
          <option value="1">Đang hoạt động</option>
          <option value="0">Tạm ngừng lập / duyệt phiếu mới</option>
        </select>
      </Field>
      <p className="muted">
        Quỹ mới bắt đầu từ 0. Ghi nhận số tiền ban đầu bằng phiếu Thu / Bổ sung
        quỹ và duyệt để ghi sổ. Chưa có chuyển tiền tự động giữa các quỹ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu quỹ
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Funds() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/quy?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TÀI CHÍNH CHUNG CƯ</p>
          <h1>Thu chi và quỹ</h1>
          <p>Theo dõi tiền đã ghi nhận, chứng từ và số dư từng quỹ.</p>
        </div>
        <button className="primary" onClick={() => setForm(true)}>
          Tạo quỹ
        </button>
      </div>
      <Nav />
      <p className="note">
        Tiền hóa đơn đã xác nhận thu tự xuất hiện trong quỹ vận hành. Không lập
        thêm phiếu thu khác cho cùng khoản tiền đó. Số dư phần mềm cần đối soát
        với tiền mặt và ngân hàng thực tế.
      </p>
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Tìm quỹ">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
          />
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FundForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/quy", "POST", b, (d) =>
              navigate(`/quan-tri/quy/${d.ma_quy}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="treasury-funds">
          {resource.result?.data.map((f) => (
            <article className="card" key={f.ma_quy}>
              <span
                className={`treasury-tag ${f.dang_hoat_dong ? "" : "treasury-closed"}`}
              >
                {f.dang_hoat_dong ? "Đang hoạt động" : "Tạm ngừng"}
              </span>
              <h2>
                <Link to={`/quan-tri/quy/${f.ma_quy}`}>{f.ten_quy}</Link>
              </h2>
              <p className="treasury-text">{f.mo_ta}</p>
              {!!f.nhan_thu_hoa_don && (
                <p className="muted">
                  Tự tổng hợp các hóa đơn đã xác nhận thu.
                </p>
              )}
              <Link className="button" to={`/quan-tri/quy/${f.ma_quy}`}>
                Mở sổ quỹ
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card">Chưa có quỹ phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
export function FundDetail() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    resource = useData(`/quy/${id}/so_quy?${params}`),
    [edit, setEdit] = useState(false),
    action = useAction(() => {
      setEdit(false);
      resource.reload();
    }),
    r = resource.result,
    f = r?.fund,
    s = r?.summary,
    monthly = r?.filters.che_do === "THEO_THANG";
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">SỔ QUỸ</p>
                <h1>{f.ten_quy}</h1>
                <p className="treasury-text">{f.mo_ta}</p>
              </div>
              <div className="actions">
                <button onClick={() => setEdit(true)}>Sửa quỹ</button>
                <Link
                  className="button primary"
                  to={`/quan-tri/phieu-thu-chi/moi?ma_quy=${id}`}
                >
                  Lập phiếu thu / chi
                </Link>
              </div>
            </div>
            {edit && (
              <FundForm
                fund={f}
                action={action}
                onCancel={() => setEdit(false)}
                onSave={(b) => action.run(`/quy/${id}`, "PUT", b)}
              />
            )}
            <p className="note">
              Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Dữ liệu lúc{" "}
              {time(r.tai_luc)}. Tổng hợp theo ngày hạch toán tại Việt Nam; bộ
              lọc nguồn/loại/tìm kiếm chỉ thay danh sách.
            </p>
            <form
              className="card treasury-filters"
              key={params.toString()}
              onSubmit={(e) => {
                e.preventDefault();
                setParams(values(e));
              }}
            >
              <Field label="Từ ngày hạch toán">
                <input
                  type="date"
                  name="tu_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.tu_ngay}
                />
              </Field>
              <Field label="Đến ngày hạch toán">
                <input
                  type="date"
                  name="den_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.den_ngay}
                />
              </Field>
              <Field label="Cách xem sổ quỹ">
                <select name="che_do" defaultValue={r.filters.che_do}>
                  <option value="GIAO_DICH">Từng khoản thu / chi</option>
                  <option value="THEO_THANG">Tổng hợp theo tháng</option>
                </select>
              </Field>
              <Field label="Nguồn ghi sổ">
                <select
                  name="nguon"
                  disabled={monthly}
                  defaultValue={params.get("nguon") || ""}
                >
                  <option value="">Tất cả nguồn</option>
                  <option value="PHIEU">Phiếu thu / chi</option>
                  <option value="HOA_DON">Hóa đơn</option>
                </select>
              </Field>
              <Field label="Loại giao dịch">
                <select
                  name="loai"
                  disabled={monthly}
                  defaultValue={params.get("loai") || ""}
                >
                  <Options values={{ THU: "Thu", CHI: "Chi" }} empty="Tất cả" />
                </select>
              </Field>
              <Field label="Tìm trong sổ quỹ">
                <input
                  name="q"
                  disabled={monthly}
                  maxLength={100}
                  defaultValue={params.get("q") || ""}
                />
              </Field>
              <button>Lọc sổ quỹ</button>
            </form>
            <div className="treasury-metrics" aria-label="Tổng hợp số dư">
              {[
                ["Đầu kỳ", s.dau_ky],
                ["Thu trong kỳ", s.tong_thu],
                ["Chi trong kỳ", s.tong_chi],
                ["Cuối kỳ", s.cuoi_ky],
              ].map(([label, n]) => (
                <div className="card" key={label}>
                  <span>{label}</span>
                  <strong>{money(n)}</strong>
                </div>
              ))}
            </div>
            {BigInt(s.cuoi_ky) < 0n && (
              <p className="error">
                Số dư cuối kỳ âm. Kiểm tra dữ liệu đầu kỳ và các khoản hạch toán
                lùi ngày.
              </p>
            )}
            <section className="card">
              <div className="actions">
                <Link to={`/quan-tri/phieu-thu-chi?ma_quy=${id}`}>
                  Xem phiếu nháp / đã ghi sổ của quỹ
                </Link>
                <button onClick={resource.reload}>Cập nhật sổ quỹ</button>
              </div>
              <p className="muted">
                Số dư bắt đầu từ 0 trước dữ liệu đầu tiên. Hạch toán lùi ngày có
                thể làm số dư quá khứ âm dù lúc duyệt chi quỹ đủ tiền. Đây chưa
                phải báo cáo ngân hàng đã đối soát.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(monthly
                        ? ["Tháng", "Tổng thu", "Tổng chi", "Chênh lệch"]
                        : [
                            "Ngày hạch toán",
                            "Chứng từ / nguồn",
                            "Người nộp / nhận",
                            "Diễn giải",
                            "Thu",
                            "Chi",
                          ]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.map((p, i) =>
                      monthly ? (
                        <tr key={p.ky}>
                          <td>{p.ky}</td>
                          <td>{money(p.tong_thu)}</td>
                          <td>{money(p.tong_chi)}</td>
                          <td>
                            {money(BigInt(p.tong_thu) - BigInt(p.tong_chi))}
                          </td>
                        </tr>
                      ) : (
                        <tr key={`${p.nguon}-${p.ma_ban_ghi}`}>
                          <td>{day(p.ngay)}</td>
                          <td>
                            <Link
                              to={
                                p.nguon === "HOA_DON"
                                  ? `/quan-tri/hoa-don/${p.ma_ban_ghi}`
                                  : `/quan-tri/phieu-thu-chi/${p.ma_ban_ghi}`
                              }
                            >
                              {p.so_chung_tu}
                            </Link>
                            <small className="treasury-subtitle">
                              {categories[p.nhom] || p.nhom}
                            </small>
                          </td>
                          <td>{p.doi_tac}</td>
                          <td className="treasury-text">{p.dien_giai}</td>
                          <td className="treasury-money">
                            {p.loai === "THU" ? money(p.so_tien) : "—"}
                          </td>
                          <td className="treasury-money">
                            {p.loai === "CHI" ? money(p.so_tien) : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {!r.total && <p className="muted">Chưa có giao dịch phù hợp.</p>}
              <Pager resource={resource} />
            </section>
          </>
        )
      )}
    </>
  );
}
function VoucherForm({ fund, data, action, onSave, onCancel, onChange }) {
  const [type, setType] = useState(data?.loai || "THU");
  return (
    <form
      className="card"
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...values(e),
          ma_quy: fund.ma_quy,
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa phiếu nháp" : "Lập phiếu thu / chi"}</h2>
      <p>
        Quỹ: <strong>{fund.ten_quy}</strong>
      </p>
      <Feedback action={action} />
      <div className="treasury-form-grid">
        <Field label="Loại phiếu">
          <select
            name="loai"
            value={type}
            disabled={!!data}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        {data && <input type="hidden" name="loai" value={data.loai} />}
        <Field label="Nhóm thu / chi">
          <select
            name="nhom"
            key={type}
            defaultValue={data?.nhom || allowed[type][0]}
          >
            <Options
              values={Object.fromEntries(
                allowed[type].map((k) => [k, categories[k]]),
              )}
            />
          </select>
        </Field>
        <Field label="Ngày hạch toán">
          <input
            type="date"
            name="ngay_hach_toan"
            max={today()}
            required
            defaultValue={data?.ngay_hach_toan || today()}
          />
        </Field>
        <Field label="Số tiền (đồng)">
          <input
            name="so_tien"
            inputMode="numeric"
            pattern="[0-9]{1,14}"
            required
            defaultValue={data?.so_tien}
            placeholder="Ví dụ: 1500000"
          />
        </Field>
      </div>
      <Field label="Người nộp / người nhận">
        <input
          name="doi_tac"
          required
          minLength={2}
          maxLength={150}
          defaultValue={data?.doi_tac}
        />
      </Field>
      <Field label="Diễn giải thu / chi">
        <textarea
          name="dien_giai"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          defaultValue={data?.dien_giai}
        />
      </Field>
      <p className="muted">
        Lưu nháp chưa thay đổi số dư. Sau khi lưu, thêm chứng từ rồi duyệt để
        ghi sổ; phiếu chi bắt buộc có ít nhất một chứng từ. Không lập phiếu thu
        khác cho khoản hóa đơn đã được xác nhận thu.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu phiếu nháp
        </button>
        {onCancel && (
          <button type="button" disabled={action.pending} onClick={onCancel}>
            Đóng biểu mẫu
          </button>
        )}
      </div>
    </form>
  );
}
export function VoucherNew() {
  const [params] = useSearchParams(),
    id = params.get("ma_quy") || "0",
    resource = useData(`/quy/${id}`),
    navigate = useNavigate(),
    [key, setKey] = useState(newRequestKey),
    action = useAction(),
    fund = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        fund && (
          <VoucherForm
            fund={fund}
            action={action}
            onChange={() => setKey(newRequestKey())}
            onSave={(b) =>
              action.run(
                "/phieu_thu_chi",
                "POST",
                { ...b, khoa_yeu_cau: key },
                (d) => navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`),
              )
            }
          />
        )
      )}
    </>
  );
}
export function Vouchers() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/phieu_thu_chi?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHỨNG TỪ NỘI BỘ</p>
          <h1>Phiếu thu và phiếu chi</h1>
        </div>
        <Link
          className="button primary"
          to={
            params.get("ma_quy")
              ? `/quan-tri/phieu-thu-chi/moi?ma_quy=${params.get("ma_quy")}`
              : "/quan-tri/quy"
          }
        >
          Chọn quỹ để lập phiếu
        </Link>
      </div>
      <Nav />
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_quy")) b.ma_quy = params.get("ma_quy");
          setParams(b);
        }}
      >
        <Field label="Tìm phiếu thu chi">
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            maxLength={100}
            placeholder="Người nộp/nhận hoặc diễn giải"
          />
        </Field>
        <Field label="Lọc loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả" />
          </select>
        </Field>
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_quy") && (
        <p className="note">
          Đang lọc quỹ #{params.get("ma_quy")}.{" "}
          <Link to="/quan-tri/phieu-thu-chi">Bỏ lọc quỹ</Link>
        </p>
      )}
      <ErrorBox error={resource.error} />
      <section className="card">
        {resource.loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phiếu</th>
                    <th>Quỹ / đối tác</th>
                    <th>Ngày hạch toán</th>
                    <th>Diễn giải</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.result?.data.map((p) => (
                    <tr key={p.ma_phieu}>
                      <td>
                        <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu}`}>
                          {code(p)}
                        </Link>
                        <small className="treasury-subtitle">
                          {types[p.loai]}
                        </small>
                      </td>
                      <td>
                        {p.ten_quy}
                        <small className="treasury-subtitle">{p.doi_tac}</small>
                      </td>
                      <td>{day(p.ngay_hach_toan)}</td>
                      <td className="treasury-text">{p.dien_giai}</td>
                      <td className="treasury-money">{money(p.so_tien)}</td>
                      <td>
                        {states[p.trang_thai]}
                        {p.ma_phieu_goc && (
                          <small className="treasury-subtitle">Phiếu đảo</small>
                        )}
                        {p.ma_phieu_dao && (
                          <small className="treasury-subtitle">
                            Đã có phiếu đảo
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!resource.result?.total && (
              <p className="muted">Chưa có phiếu phù hợp.</p>
            )}
          </>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function Proofs({ p, reload }) {
  const [files, setFiles] = useState([]),
    form = useRef(null),
    action = useAction(reload);
  return (
    <section className="card">
      <h2>Chứng từ đính kèm</h2>
      <Feedback action={action} />
      {p.chung_tu.length === 0 ? (
        <p className="muted">Chưa có chứng từ.</p>
      ) : (
        <ul className="treasury-proofs">
          {p.chung_tu.map((f) => (
            <li key={f.ma_chung_tu}>
              <a
                href={`/api/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`}
                download
              >
                {f.ten_tep}
              </a>
              <small>
                {Math.ceil(f.kich_thuoc / 1024)} KB ·{" "}
                {f.loai_tep === "application/pdf" ? "PDF" : "Ảnh JPEG"}
              </small>
              {p.trang_thai === "NHAP" && (
                <button
                  className="danger"
                  disabled={action.pending}
                  onClick={() =>
                    action.run(
                      `/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`,
                      "DELETE",
                      { phien_ban: p.phien_ban },
                    )
                  }
                >
                  Xóa chứng từ #{f.ma_chung_tu}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {p.ma_phieu_goc && (
        <p className="note">
          Chứng từ gốc được giữ tại{" "}
          <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
            phiếu gốc
          </Link>
          .
        </p>
      )}
      {p.trang_thai === "NHAP" && (
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            const b = new FormData();
            b.set("phien_ban", p.phien_ban);
            for (const f of files) b.append("chung_tu", f, f.name);
            action.run(
              `/phieu_thu_chi/${p.ma_phieu}/chung_tu`,
              "POST",
              b,
              () => {
                setFiles([]);
                form.current?.reset();
              },
            );
          }}
        >
          <Field label="Chọn chứng từ ảnh hoặc PDF">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </Field>
          <p role="status">
            {files.length
              ? `Đã chọn ${files.length} tệp: ${files.map((f) => f.name).join(", ")}`
              : "Chưa chọn tệp để tải lên."}
          </p>
          <p className="muted">
            Tối đa 5 chứng từ mỗi phiếu, 5 MB mỗi tệp. Ảnh JPEG/PNG/WebP được
            chuyển JPEG và bỏ metadata; PDF chỉ tải xuống. Chọn tệp rồi bấm Tải
            chứng từ lên, sau đó mới duyệt phiếu.
          </p>
          <button disabled={action.pending || !files.length}>
            Tải chứng từ lên
          </button>
        </form>
      )}
    </section>
  );
}
function historyNote(h) {
  if (["TAO_NHAP", "SUA_NHAP"].includes(h.su_kien)) {
    try {
      const p = JSON.parse(h.ghi_chu);
      return `${p.dien_giai}\n${day(p.ngay_hach_toan)} · ${p.doi_tac} · ${money(p.so_tien)}`;
    } catch {
      return h.ghi_chu;
    }
  }
  return h.ghi_chu;
}
export function VoucherDetail() {
  const { id } = useParams(),
    resource = useData(`/phieu_thu_chi/${id}`),
    [editing, setEditing] = useState(false),
    action = useAction(() => {
      setEditing(false);
      resource.reload();
    }),
    navigate = useNavigate(),
    p = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        p && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{types[p.loai]}</p>
                  <h1>{code(p)}</h1>
                  <Link to={`/quan-tri/quy/${p.ma_quy}`}>{p.ten_quy}</Link>
                </div>
                <span className={`treasury-tag treasury-${p.trang_thai}`}>
                  {states[p.trang_thai]}
                </span>
              </div>
              <div className="treasury-voucher-summary">
                <div>
                  <span>Số tiền</span>
                  <strong>{money(p.so_tien)}</strong>
                  <span>{categories[p.nhom]}</span>
                </div>
                <div>
                  <span>Ngày hạch toán / người nộp, nhận</span>
                  <strong>{day(p.ngay_hach_toan)}</strong>
                  <span>{p.doi_tac}</span>
                </div>
              </div>
              <p className="treasury-text">{p.dien_giai}</p>
              <p className="muted">
                Lập bởi {p.nguoi_lap} · {time(p.ngay_tao)}
                {p.nguoi_duyet &&
                  ` · Duyệt bởi ${p.nguoi_duyet} lúc ${time(p.ngay_duyet)}`}
              </p>
              {p.ma_phieu_dao && (
                <p className="note">
                  Đã có{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_dao}`}>
                    phiếu đảo
                  </Link>
                  . Cả hai khoản được giữ trong sổ để theo dõi điều chỉnh.
                </p>
              )}
              {p.ma_phieu_goc && (
                <p className="note">
                  Đây là phiếu đảo của{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
                    phiếu gốc
                  </Link>
                  ; không đảo tiếp phiếu này.
                </p>
              )}
              {p.trang_thai === "NHAP" && (
                <button onClick={() => setEditing(true)}>Sửa phiếu nháp</button>
              )}
            </section>
            <Feedback action={action} />
            {editing && (
              <VoucherForm
                key={p.phien_ban}
                fund={{ ma_quy: p.ma_quy, ten_quy: p.ten_quy }}
                data={p}
                action={action}
                onCancel={() => setEditing(false)}
                onSave={(b) => action.run(`/phieu_thu_chi/${id}`, "PUT", b)}
              />
            )}
            <Proofs
              p={p}
              reload={() => {
                action.clear();
                resource.reload();
              }}
            />
            <div className="treasury-action-grid">
              {(p.trang_thai === "NHAP"
                ? ["duyet", "huy"]
                : p.trang_thai === "DA_GHI_SO" &&
                    !p.ma_phieu_goc &&
                    !p.ma_phieu_dao
                  ? ["dao"]
                  : []
              ).map((kind) => (
                <form
                  className="card"
                  key={`${kind}-${p.phien_ban}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    action.run(
                      `/phieu_thu_chi/${id}/${kind}`,
                      "POST",
                      { ...values(e), phien_ban: p.phien_ban },
                      kind === "dao"
                        ? (d) =>
                            navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`)
                        : undefined,
                    );
                  }}
                >
                  <h2>
                    {
                      {
                        duyet: "Duyệt và ghi sổ",
                        huy: "Hủy phiếu nháp",
                        dao: "Đảo phiếu đã ghi sổ",
                      }[kind]
                    }
                  </h2>
                  <p className="muted">
                    {
                      {
                        duyet:
                          "Chỉ duyệt khi khoản tiền thực tế và chứng từ đã được kiểm tra. Duyệt chi cần quỹ đủ số dư hiện tại.",
                        huy: "Hủy nháp không thay đổi số dư quỹ.",
                        dao: "Giữ phiếu gốc và tạo khoản ngược chiều cùng số tiền, hạch toán hôm nay. Đảo khoản thu cần quỹ đủ số dư.",
                      }[kind]
                    }
                  </p>
                  <Field
                    label={
                      kind === "duyet"
                        ? "Ghi chú duyệt phiếu"
                        : kind === "huy"
                          ? "Lý do hủy phiếu"
                          : "Lý do đảo phiếu"
                    }
                  >
                    <textarea
                      name={kind === "duyet" ? "ghi_chu" : "ly_do"}
                      rows={3}
                      maxLength={1000}
                      minLength={kind === "duyet" ? 0 : 5}
                      required={kind !== "duyet"}
                    />
                  </Field>
                  <button
                    className={kind === "duyet" ? "primary" : "danger"}
                    disabled={action.pending}
                  >
                    {
                      {
                        duyet: "Xác nhận duyệt và ghi sổ",
                        huy: "Xác nhận hủy nháp",
                        dao: "Lập phiếu đảo",
                      }[kind]
                    }
                  </button>
                </form>
              ))}
            </div>
            <section className="card">
              <h2>Lịch sử phiếu</h2>
              <ol className="treasury-history">
                {p.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien] || h.su_kien}</strong>
                    <small>
                      {time(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="treasury-text">{historyNote(h)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )
      )}
    </>
  );
}
```

## 8. `frontend/src/app/App.jsx`

```jsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AuthProvider,
  useAuth,
  Protected,
  Login,
  Account,
} from "../features/auth/Auth.jsx";
import {
  Announcements,
  AnnouncementDetail,
  useUnreadCount,
} from "../features/announcements/Announcements.jsx";
import FinancialReports from "../features/financial-reports/FinancialReports.jsx";
import {
  EquipmentList,
  EquipmentDetail,
  MaintenanceList,
  MaintenanceDetail,
} from "../features/maintenance/Maintenance.jsx";
import {
  Amenities,
  AmenityDetail,
  Bookings,
  BookingDetail,
} from "../features/amenities/Amenities.jsx";
import {
  Funds,
  FundDetail,
  Vouchers,
  VoucherNew,
  VoucherDetail,
} from "../features/treasury/Treasury.jsx";
import Users from "../features/auth/Users.jsx";
import ApartmentAccounts from "../features/residency/ApartmentAccounts.jsx";
import {
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import {
  Dashboard,
  ReportDetail,
  ReportList,
} from "../features/incidents/Reports.jsx";
import Locations from "../features/qr/Locations.jsx";
import Vehicles from "../features/vehicles/Vehicles.jsx";
import {
  Rates,
  Meters,
  Bills,
  BillDetail,
} from "../features/billing/Billing.jsx";
import {
  Apartments,
  Residents,
  ResidentDetail,
} from "../features/residency/Residency.jsx";
import { ErrorBox, homeFor, roleNames } from "../shared/ui.jsx";
const admin = ["QUAN_TRI_VIEN"],
  technician = ["KY_THUAT_VIEN"],
  resident = ["CU_DAN"];
function Shell() {
  const { user, logout } = useAuth(),
    location = useLocation(),
    [error, setError] = useState();
  const unread = useUnreadCount(user, location.pathname);
  const inWorkspace =
    !!user &&
    ["/quan-tri", "/ky-thuat", "/cu-dan", "/tai-khoan"].some((p) =>
      location.pathname.startsWith(p),
    );
  const links =
    user?.vai_tro === "QUAN_TRI_VIEN"
      ? [
          ["/quan-tri", "Tổng quan"],
          ["/quan-tri/phan-anh", "Phản ánh"],
          ["/quan-tri/can-ho", "Căn hộ"],
          ["/quan-tri/tai-khoan-can-ho", "Tài khoản căn hộ"],
          ["/quan-tri/cu-dan", "Cư dân & cư trú"],
          ["/quan-tri/phuong-tien", "Phương tiện"],
          ["/quan-tri/thiet-bi", "Thiết bị & bảo trì"],
          ["/quan-tri/tien-ich", "Tiện ích & đặt lịch"],
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/bao-cao-tai-chinh", "Công nợ & thu phí"],
          ["/quan-tri/quy", "Thu chi & quỹ"],
          ["/quan-tri/thong-bao", "Thông báo"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [
            ["/ky-thuat/cong-viec", "Công việc"],
            ["/ky-thuat/bao-tri", "Bảo trì thiết bị"],
          ]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
            ["/cu-dan/tien-ich", "Đặt lịch tiện ích"],
            ["/cu-dan/thong-bao", "Thông báo"],
          ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">CC</span>
          <span>
            CHUNG CƯ<small>QUẢN LÝ VẬN HÀNH</small>
          </span>
        </Link>
        <div className="top-links">
          <Link to="/tra-cuu">Tra cứu</Link>
          {user ? (
            <>
              <Link to={homeFor(user)}>{user.ho_va_ten}</Link>
              <button onClick={() => logout().catch(setError)}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link className="button" to="/dang-nhap">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>
      <ErrorBox error={error} />
      <div className={inWorkspace ? "workspace" : "public-space"}>
        {inWorkspace && (
          <aside className="sidebar">
            <p className="eyebrow">{roleNames[user.vai_tro]}</p>
            <nav aria-label="Chức năng">
              {[...links, ["/tai-khoan", "Tài khoản"]].map(([path, label]) => (
                <NavLink key={path} end={path === "/quan-tri"} to={path}>
                  {label}
                  {path === "/cu-dan/thong-bao" && unread > 0 && (
                    <span
                      className="notification-count"
                      aria-label={`${unread} chưa đọc`}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <Link className="public-link" to="/">
              Cổng dịch vụ ↗
            </Link>
          </aside>
        )}
        <main key={location.pathname}>
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/dang-nhap" element={<Login />} />
            <Route path="/quet-qr" element={<Scanner />} />
            <Route path="/r/:token" element={<SubmitReport />} />
            <Route
              path="/tra-cuu"
              element={<LookupReport initialCode={location.state?.code} />}
            />
            <Route
              path="/tai-khoan"
              element={
                <Protected>
                  <Account />
                </Protected>
              }
            />
            <Route
              path="/quan-tri"
              element={
                <Protected roles={admin}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/vi-tri-qr"
              element={
                <Protected roles={admin}>
                  <Locations />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/nhan-su"
              element={
                <Protected roles={admin}>
                  <Users />
                </Protected>
              }
            />
            {[
              ["/quan-tri/can-ho", <Apartments />],
              ["/quan-tri/tai-khoan-can-ho", <ApartmentAccounts />],
              ["/quan-tri/cu-dan", <Residents />],
              ["/quan-tri/cu-dan/:id", <ResidentDetail />],
              ["/quan-tri/phuong-tien", <Vehicles />],
              ["/quan-tri/quy", <Funds />],
              ["/quan-tri/quy/:id", <FundDetail />],
              ["/quan-tri/phieu-thu-chi", <Vouchers />],
              ["/quan-tri/phieu-thu-chi/moi", <VoucherNew />],
              ["/quan-tri/phieu-thu-chi/:id", <VoucherDetail />],
              ["/quan-tri/tien-ich", <Amenities />],
              ["/quan-tri/tien-ich/:id", <AmenityDetail />],
              ["/quan-tri/dat-lich", <Bookings />],
              ["/quan-tri/dat-lich/:id", <BookingDetail />],
              ["/quan-tri/thiet-bi", <EquipmentList />],
              ["/quan-tri/thiet-bi/:id", <EquipmentDetail />],
              ["/quan-tri/bao-tri", <MaintenanceList />],
              ["/quan-tri/bao-tri/:id", <MaintenanceDetail />],
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
              ["/quan-tri/bao-cao-tai-chinh", <FinancialReports />],
              ["/quan-tri/thong-bao", <Announcements />],
              ["/quan-tri/thong-bao/:id", <AnnouncementDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={admin}>{element}</Protected>}
              />
            ))}
            {[
              ["/quan-tri/phan-anh", admin],
              ["/ky-thuat/cong-viec", technician],
              ["/cu-dan/phan-anh", resident],
            ].map(([base, roles]) => (
              <React.Fragment key={base}>
                <Route
                  path={base}
                  element={
                    <Protected roles={roles}>
                      <ReportList />
                    </Protected>
                  }
                />
                <Route
                  path={`${base}/:id`}
                  element={
                    <Protected roles={roles}>
                      <ReportDetail />
                    </Protected>
                  }
                />
              </React.Fragment>
            ))}
            {[
              ["/cu-dan/tien-ich", <Amenities />],
              ["/cu-dan/tien-ich/:id", <AmenityDetail />],
              ["/cu-dan/dat-lich", <Bookings />],
              ["/cu-dan/dat-lich/:id", <BookingDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={resident}>{element}</Protected>}
              />
            ))}
            {["/ky-thuat/bao-tri", "/ky-thuat/bao-tri/:id"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={technician}>
                    {path.endsWith(":id") ? (
                      <MaintenanceDetail />
                    ) : (
                      <MaintenanceList />
                    )}
                  </Protected>
                }
              />
            ))}
            {[
              "/cu-dan/hoa-don",
              "/cu-dan/hoa-don/:id",
              "/cu-dan/thong-bao",
              "/cu-dan/thong-bao/:id",
            ].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={resident}>
                    {path.includes("thong-bao") ? (
                      path.endsWith(":id") ? (
                        <AnnouncementDetail />
                      ) : (
                        <Announcements />
                      )
                    ) : path.endsWith(":id") ? (
                      <BillDetail />
                    ) : (
                      <Bills />
                    )}
                  </Protected>
                }
              />
            ))}
            <Route
              path="*"
              element={
                <section className="card">
                  <h1>Không tìm thấy trang</h1>
                  <Link to="/">Về cổng dịch vụ</Link>
                </section>
              }
            />
          </Routes>
        </main>
      </div>
      <footer>Chung cư · Cổng tiếp nhận phản ánh & điều phối xử lý</footer>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## 9. `frontend/src/styles/global.css`

```css
:root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #183c3b;
  background: #f2f5f3;
  line-height: 1.6;
  font-synthesis: none;
  font-weight: 400;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
a {
  color: #14635a;
  text-underline-offset: 3px;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid #b7c9c3;
  border-radius: 8px;
  background: white;
  color: #224b44;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  line-height: 1.4;
}
button:hover,
.button:hover {
  background: #edf5f0;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: #14635a;
  color: white;
  border-color: #14635a;
}
.primary:hover {
  background: #0a4c45;
}
.danger {
  color: #a33e30;
  background: #fff5f1;
  border-color: #dfb4a9;
}
:focus-visible {
  outline: 3px solid #d99b27;
  outline-offset: 3px;
}
input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #b6c6c0;
  border-radius: 6px;
  color: #183c3b;
  background: #fff;
  max-width: 100%;
}
textarea {
  resize: vertical;
}
input[type="checkbox"] {
  width: 20px;
  min-height: 20px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4vw;
  border-bottom: 1px solid #dce5df;
  background: white;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-decoration: none;
  line-height: 1.4;
}
.brand-icon {
  background: #14635a;
  color: white;
  border-radius: 10px;
  padding: 10px;
  font-size: 18px;
}
.brand small {
  display: block;
  letter-spacing: 1.7px;
  font-size: 9px;
  color: #627c73;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.top-links > a {
  text-decoration: none;
}
.workspace {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 80vh;
  max-width: 1600px;
  margin: auto;
}
.sidebar {
  padding: 30px 18px;
  border-right: 1px solid #dce5df;
  background: #fff;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sidebar nav a {
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  text-decoration: none;
  color: #47645b;
}
.sidebar nav a.active {
  background: #e3f0e8;
  color: #13584a;
  font-weight: 700;
}
.public-link {
  display: block;
  margin: 30px 14px;
}
.workspace main {
  padding: 32px;
  min-width: 0;
}
.public-space {
  max-width: 1120px;
  margin: auto;
  padding: 40px 24px;
  min-height: 76vh;
}
h1 {
  font-size: 30px;
  line-height: 1.25;
  margin: 5px 0 24px;
  letter-spacing: -0.7px;
}
h2 {
  font-size: 19px;
  line-height: 1.4;
  margin: 0 0 16px;
}
h3 {
  font-size: 15px;
  margin: 24px 0 12px;
}
p {
  margin: 8px 0 18px;
}
small {
  font-size: 12px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #648379;
  margin-bottom: 8px;
}
.card {
  border: 1px solid #dbe5de;
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px #294d3a04;
}
.narrow {
  max-width: 650px;
  margin: 0 auto 24px;
}
.muted,
.note {
  color: #637b72;
}
.note {
  font-size: 13px;
  margin: 24px 0;
}
.hero {
  padding: 35px 0 50px;
  max-width: 800px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 18px 0 24px;
}
.hero p:not(.eyebrow) {
  max-width: 610px;
  color: #60776f;
  font-size: 18px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hero .actions {
  margin-top: 30px;
}
.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  display: block;
  color: #93aa9f;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.field > span,
.field > label {
  font-weight: 600;
}
.field small {
  color: #6d7e77;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full {
  width: 100%;
  margin-top: 20px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.error {
  padding: 12px 14px;
  background: #fff2ed;
  color: #9a3428;
  border: 1px solid #efc4b8;
  border-radius: 8px;
  font-size: 14px;
  margin: 15px 0;
  overflow-wrap: anywhere;
}
.error ul {
  padding-left: 20px;
  margin-bottom: 0;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-heading h1,
.page-heading h2 {
  margin-bottom: 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 28px 0;
}
.stat {
  text-decoration: none;
  color: inherit;
}
.stat span {
  font-size: 13px;
  color: #637b72;
}
.stat strong {
  display: block;
  font-size: 40px;
  font-weight: 650;
  line-height: 1.6;
}
.stat small {
  color: #14635a;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th {
  font-size: 11px;
  color: #698176;
  background: #f5f8f5;
  font-weight: 600;
  white-space: nowrap;
}
th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf1ed;
}
td:first-child {
  min-width: 220px;
}
td a {
  font-weight: 650;
  text-decoration: none;
}
td small {
  display: block;
  color: #71857c;
  margin-top: 5px;
}
td:last-child {
  white-space: nowrap;
  color: #698176;
}
.badge {
  display: inline-block;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf1ef;
  color: #52665b;
}
.status-MOI {
  background: #e6efff;
  color: #365c9b;
}
.status-DA_PHAN_CONG {
  background: #e8e7ff;
  color: #5c519b;
}
.status-DANG_XU_LY {
  background: #fff1d9;
  color: #9a6c18;
}
.status-DA_XU_LY {
  background: #e4f3f5;
  color: #2c737e;
}
.status-DA_DONG {
  background: #e3f3e8;
  color: #2c7351;
}
.status-TU_CHOI {
  background: #f9e8e2;
  color: #ad5244;
}
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}
.pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 24px;
}
.action-panel {
  align-self: start;
}
.tags {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #667e73;
  margin-bottom: 20px;
}
.metadata {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  font-size: 13px;
  border-top: 1px solid #e3eae4;
  padding-top: 20px;
}
.metadata dt {
  color: #74897f;
}
.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pre-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-grid img {
  width: 120px;
  height: 110px;
  object-fit: cover;
  border-radius: 7px;
  border: 1px solid #dce6de;
  max-width: 100%;
}
.timeline {
  list-style: none;
  padding: 0 0 0 18px;
  border-left: 2px solid #e0e9e1;
  margin-left: 5px;
}
.timeline li {
  position: relative;
  padding: 0 0 26px;
}
.timeline li:before {
  content: "";
  position: absolute;
  left: -25px;
  top: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #73a38c;
  border: 2px solid white;
}
.timeline li > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline time {
  font-size: 11px;
  color: #75877e;
}
.timeline p {
  font-size: 13px;
  margin: 8px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.timeline small {
  color: #75877e;
}
.location-list {
  list-style: none;
  padding: 0;
}
.location-list li {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
  border-top: 1px solid #e3ebe4;
  padding: 18px 0;
}
.location-list small {
  color: #71857c;
}
.location-list button {
  font-size: 12px;
  padding: 7px 10px;
}
.qr-print {
  text-align: center;
}
.qr-image {
  max-width: 100%;
  width: 280px;
  aspect-ratio: 1;
}
.qr-url {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.qr-print .actions {
  justify-content: center;
}
.qr-print .muted {
  font-size: 12px;
  margin-top: 24px;
}
.decision {
  border-top: 1px solid #e0e8e1;
  margin-top: 22px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #71857c;
}
.back {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 20px;
}
.lookup-result {
  border-top: 1px solid #e0e8e1;
  margin-top: 26px;
  padding-top: 24px;
}
.lookup-result .timeline {
  margin-top: 24px;
}
hr {
  border: 0;
  border-top: 1px solid #dce5df;
  margin: 25px 0;
}
#qr-reader {
  margin-bottom: 20px;
  overflow: hidden;
}
footer {
  font-size: 11px;
  text-align: center;
  color: #7c9085;
  border-top: 1px solid #dce5df;
  padding: 24px;
}
/* Invoice quantities use Vietnamese separators and align with their prices. */
.bill-lines th:nth-child(2),
.bill-lines th:nth-child(4),
.bill-lines th:nth-child(5),
.bill-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bill-lines .bill-line-total {
  color: #183c3b;
  font-weight: 600;
}
.bill-total {
  margin: 0;
  padding-top: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bank-picker {
  padding: 18px;
  margin-bottom: 18px;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  background: #f7faf8;
}
.bank-picker select {
  text-overflow: ellipsis;
}
.bank-selection {
  margin: 0;
  font-size: 13px;
  color: #47645b;
}
.bill-publish > .muted {
  font-size: 14px;
  margin-bottom: 24px;
}
.payment-card {
  padding: 0;
  overflow: hidden;
}
.payment-header {
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #dce8e2;
  background: linear-gradient(135deg, #f2f8f4, #eaf4ef);
}
.payment-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: #fff5da;
  color: #805800;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.payment-header p {
  color: #537168;
  margin: 0;
  font-size: 14px;
}
.payment-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px;
  text-align: center;
}
.payment-amount-label {
  margin: 0 0 4px;
  color: #637b72;
  font-size: 13px;
}
.payment-amount {
  margin: 0 0 24px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 750;
  line-height: 1.3;
  color: #13584a;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.payment-qr-frame {
  width: min(340px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d4e1d9;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px #1a4d3a0a;
}
.payment-qr-brand {
  display: block;
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #164e57;
}
.payment-qr-frame img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 1;
  margin: 8px auto;
}
.payment-qr-caption {
  display: block;
  font-size: 12px;
  color: #637b72;
}
.payment-details {
  margin: 28px auto 20px;
  max-width: 560px;
  text-align: left;
  font-size: 14px;
}
.payment-details > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ed;
}
.payment-details dt {
  color: #637b72;
}
.payment-details dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.payment-account {
  font-size: 17px;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
}
.payment-details .payment-reference {
  margin-top: 6px;
  padding: 14px 12px;
  border: 1px solid #d8e6dd;
  border-radius: 8px;
  background: #f2f8f4;
}
.payment-download {
  min-width: 180px;
}
.payment-notice {
  max-width: 500px;
  margin: 20px auto 0;
  font-size: 13px;
  color: #637b72;
}
@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 185px minmax(0, 1fr);
  }
  .workspace main {
    padding: 24px 20px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .topbar {
    padding: 12px 16px;
    align-items: start;
  }
  .brand {
    font-size: 12px;
    gap: 8px;
  }
  .brand-icon {
    padding: 8px;
    font-size: 13px;
  }
  .top-links {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: end;
    font-size: 12px;
    max-width: 55%;
  }
  .top-links .button,
  .top-links button {
    font-size: 11px;
    padding: 8px;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dce5df;
  }
  .sidebar .eyebrow {
    display: none;
  }
  .sidebar nav {
    flex-direction: row;
    overflow: auto;
  }
  .sidebar nav a {
    font-size: 12px;
    white-space: nowrap;
    padding: 10px;
  }
  .public-link {
    display: none;
  }
  .workspace main {
    padding: 24px 16px;
  }
  .public-space {
    padding: 28px 16px;
  }
  .three-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hero {
    padding-top: 10px;
  }
  .card {
    padding: 20px;
  }
  .payment-card {
    padding: 0;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-header {
    padding: 24px 18px 20px;
  }
  .payment-header h2 {
    font-size: 21px;
  }
  .payment-details {
    font-size: 13px;
  }
  .payment-details > div {
    gap: 10px;
  }
  .bank-picker {
    padding: 14px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
  h1 {
    font-size: 25px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 16px;
  }
  .stat strong {
    font-size: 32px;
  }
  .metadata {
    grid-template-columns: 115px 1fr;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .pagination span {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .image-grid img {
    width: 100px;
    height: 90px;
  }
}
@media print {
  body {
    background: white;
  }
  .topbar,
  .sidebar,
  footer,
  .no-print,
  .page-heading {
    display: none !important;
  }
  .workspace,
  .detail-grid {
    display: block;
  }
  .workspace main {
    padding: 0;
  }
  .qr-print {
    border: 0;
    box-shadow: none;
    margin: 0;
  }
  .qr-print .muted {
    display: none;
  }
}

.notification-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.1rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 1rem;
  background: #a33225;
  color: #fff;
  font-size: 0.8rem;
}
.notification-item {
  padding: 1.4rem 1rem;
  border-bottom: 1px solid #dce7e4;
  border-left: 4px solid transparent;
  overflow-wrap: anywhere;
}
.notification-item.is-unread {
  background: #f0f8f5;
  border-left-color: #16665c;
}
.notification-item h2 {
  margin: 0.7rem 0;
  font-size: 1.15rem;
}
.notification-item p {
  color: #55736e;
  margin-bottom: 0;
  white-space: pre-line;
}
.notification-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  color: #55736e;
  font-size: 0.85rem;
}
.notification-priority {
  border-radius: 0.4rem;
  padding: 0.2rem 0.5rem;
  background: #edf3f1;
}
.priority-QUAN_TRONG {
  color: #8a3c12;
  background: #fff0d8;
  font-weight: 700;
}
.notification-detail h1 {
  overflow-wrap: anywhere;
}
.notification-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  margin: 1.5rem 0;
}
.notification-bill {
  padding: 1.2rem;
  border: 1px solid #dce7e4;
  border-radius: 0.8rem;
  background: #f5f9f7;
}

.finance-filters {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 1rem;
}
.finance-filters .field {
  margin-bottom: 0;
}
.finance-filters > button {
  align-self: end;
  min-height: 44px;
}
@media (max-width: 1150px) {
  .finance-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-filters {
    grid-template-columns: minmax(0, 1fr);
  }
}

.finance-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.finance-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.finance-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
  background: white;
  text-align: left;
  min-width: 0;
  overflow-wrap: anywhere;
}
.finance-metric strong {
  font-size: clamp(1.15rem, 1.7vw, 1.65rem);
  letter-spacing: -0.02em;
  line-height: 1.4;
}
.finance-metric-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #47645b;
}
.finance-metric small {
  font-weight: 400;
  color: #627c73;
}
.finance-metric.is-paid {
  border-top: 4px solid #14635a;
}
.finance-metric.is-overdue {
  border-top: 4px solid #ad3f2b;
}
.finance-metric.is-overdue strong,
.finance-overdue {
  color: #a33225;
  font-weight: 700;
}
.finance-progress {
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  background: #e7f0eb;
}
.finance-progress > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.finance-progress progress {
  width: 100%;
  height: 0.6rem;
  accent-color: #14635a;
}
.finance-snapshot {
  font-size: 0.8rem;
  color: #627c73;
}
.finance-results th {
  white-space: nowrap;
}
.finance-results td {
  vertical-align: top;
}
.finance-number {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.finance-contact {
  display: block;
  color: #627c73;
}
.finance-pager {
  margin-top: 1rem;
}
.finance-empty {
  text-align: center;
  color: #627c73;
  padding: 1rem;
}
.finance-metrics-cash {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.finance-date-range {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
}
.finance-date-range small {
  color: #627c73;
}
@media (max-width: 1150px) {
  .finance-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-metrics,
  .finance-metrics-cash {
    grid-template-columns: minmax(0, 1fr);
  }
  .finance-results {
    padding: 1rem;
  }
  .finance-metric strong {
    font-size: 1.5rem;
  }
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-stats .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.maintenance-stats strong {
  font-size: 1.8rem;
}
.maintenance-overdue {
  color: #a33225;
}
.maintenance-tag {
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
  background: #edf3f1;
  color: #47645b;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.2rem;
}
.due-QUA_HAN,
.work-HUY {
  background: #fff0ea;
  color: #a33225;
}
.due-SAP_DEN_HAN,
.work-CHO_NGHIEM_THU {
  background: #fff2d9;
  color: #8a5416;
}
.work-HOAN_THANH {
  background: #e3f3e8;
  color: #225e46;
}
.work-DANG_THUC_HIEN {
  background: #e7effb;
  color: #275384;
}
.maintenance-subtitle {
  display: block;
  color: #627c73;
  margin-top: 0.4rem;
}
.maintenance-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  margin: 0 0 1.4rem;
}
.maintenance-info dt {
  color: #627c73;
  font-size: 0.85rem;
}
.maintenance-info dd {
  margin: 0.3rem 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.maintenance-text,
.maintenance-history p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.maintenance-staff {
  padding: 1rem;
  border: 1px solid #dce5df;
  border-radius: 0.6rem;
  margin-bottom: 1.2rem;
  background: #f8faf9;
}
.maintenance-staff .actions {
  font-size: 0.85rem;
}
.maintenance-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-action-grid .card {
  min-width: 0;
}
.maintenance-history {
  padding-left: 1.2rem;
}
.maintenance-history li {
  padding: 0 0 1rem 0.4rem;
  border-bottom: 1px solid #e4ebe7;
  margin-bottom: 1rem;
}
.maintenance-history li div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}
.maintenance-history time {
  color: #627c73;
  font-size: 0.8rem;
}
@media (max-width: 700px) {
  .maintenance-stats,
  .maintenance-info,
  .maintenance-action-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.amenity-cards,
.amenity-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.amenity-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.amenity-card h2 {
  margin-bottom: 0;
  overflow-wrap: anywhere;
}
.amenity-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex: 1;
}
.amenity-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: #627c73;
}
.amenity-open,
.amenity-status {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e3f3e8;
  color: #225e46;
}
.amenity-paused,
.amenity-TU_CHOI,
.amenity-DA_HUY {
  background: #fff0ea;
  color: #a33225;
}
.amenity-CHO_DUYET {
  background: #fff2d9;
  color: #8a5416;
}
.amenity-hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}
.amenity-hero h1 {
  overflow-wrap: anywhere;
}
.amenity-hero-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.4rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-hero-meta strong {
  font-size: 1.7rem;
}
.amenity-hero .amenity-text {
  grid-column: 1 / -1;
}
.amenity-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.amenity-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1.2rem;
}
.amenity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.amenity-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.amenity-calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
.amenity-calendar-toolbar .field {
  margin-bottom: 0;
  flex: 1 1 200px;
}
.amenity-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.7rem;
}
.amenity-slots button {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem;
  background: #edf7f0;
  color: #225e46;
  border-color: #bdd6c6;
}
.amenity-slots button small {
  font-weight: 400;
}
.amenity-slots button.amenity-slot-booked {
  background: #fff2d9;
  color: #8a5416;
  border-color: #e4d2ad;
  opacity: 1;
}
.amenity-slots button:disabled:not(.amenity-slot-booked) {
  background: #f0f2f1;
  color: #68756e;
  border-color: #dce3de;
}
.amenity-booking-form {
  max-width: none;
}
.amenity-booking-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.amenity-booking-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-booking-summary strong {
  font-size: 1.6rem;
}
.amenity-booking-summary span {
  overflow-wrap: anywhere;
}
.amenity-subtitle,
.amenity-history small {
  display: block;
  color: #627c73;
}
.amenity-history {
  padding-left: 1.3rem;
}
.amenity-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
@media (max-width: 700px) {
  .amenity-cards,
  .amenity-action-grid,
  .amenity-form-grid,
  .amenity-hero,
  .amenity-booking-summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .amenity-filters > button {
    width: 100%;
  }
  .amenity-slots {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .amenity-slots button {
    font-size: 0.8rem;
    padding: 0.6rem 0.3rem;
  }
}
.amenity-slots button.amenity-slot-selected {
  background: #14635a;
  color: white;
  border-color: #14635a;
  box-shadow: 0 0 0 2px #b7d9ca;
}

.treasury-funds,
.treasury-form-grid,
.treasury-action-grid,
.treasury-voucher-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.treasury-funds > .card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.treasury-funds h2 {
  overflow-wrap: anywhere;
}
.treasury-funds p {
  flex: 1;
}
.treasury-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.treasury-tag {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  background: #e3f3e8;
  color: #225e46;
  font-weight: 600;
  font-size: 0.8rem;
}
.treasury-NHAP {
  background: #fff2d9;
  color: #8a5416;
}
.treasury-HUY,
.treasury-closed {
  background: #fff0ea;
  color: #a33225;
}
.treasury-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.treasury-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.treasury-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.treasury-metrics .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.treasury-metrics strong {
  font-size: 1.5rem;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.treasury-subtitle,
.treasury-history small {
  display: block;
  color: #627c73;
}
.treasury-money {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.treasury-voucher-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.3rem;
  background: #f2f6f4;
  border-radius: 0.8rem;
  overflow-wrap: anywhere;
}
.treasury-voucher-summary strong {
  font-size: 1.7rem;
}
.treasury-history {
  padding-left: 1.3rem;
}
.treasury-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs {
  padding-left: 1.3rem;
}
.treasury-proofs li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs a {
  overflow-wrap: anywhere;
}
@media (max-width: 1100px) {
  .treasury-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .treasury-funds,
  .treasury-form-grid,
  .treasury-action-grid,
  .treasury-voucher-summary,
  .treasury-metrics {
    grid-template-columns: minmax(0, 1fr);
  }
  .treasury-filters > button {
    width: 100%;
  }
}
```
