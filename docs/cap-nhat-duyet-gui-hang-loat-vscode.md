# Duyệt và gửi hóa đơn hàng loạt — code đầy đủ 9 file cho VS Code

> Đã có bản mới [Sơ đồ tòa nhà](cap-nhat-so-do-toa-nha-vscode.md). Nếu đã cập nhật sơ đồ, giữ `frontend/src/app/App.jsx` theo hướng dẫn mới; chép App.jsx ở bản này đè lên sẽ làm mất menu/route sơ đồ.

Áp dụng sau bản lập nháp hàng loạt `7d53dcd` trên nhánh `codex/auth-qr-incidents`. Thay/tạo đủ **9 file** bên dưới. Có migration mới **016_bill_actions.sql**, không thêm thư viện. Giữ nguyên migration 001–015 và dữ liệu đang có. Không cần tải lại ZIP.

## Chức năng mới

BQL → **Phí & hóa đơn → Duyệt/gửi hàng loạt**. Hai thao tác riêng, mỗi thao tác chọn tối đa 50 hóa đơn:

| Thao tác | Hóa đơn được chọn | Kết quả sau xác nhận |
|---|---|---|
| Duyệt bản nháp | Bản nháp hợp lệ, đủ dữ liệu, số tiền dương, nguồn chưa đổi | Đã duyệt, chưa hiển thị cho cư dân |
| Gửi hóa đơn đã duyệt | Hóa đơn đã duyệt, phiên bản còn khớp, hạn và ngân hàng hợp lệ | Đã gửi, hiển thị trong Hóa đơn của tôi của cư dân theo quyền hiện có, có VietQR |

Không tự gộp duyệt rồi gửi. Sau đợt duyệt, có nút **Chuyển sang chọn hóa đơn để gửi**: danh sách chuyển sang hóa đơn đã duyệt để bạn chọn lại và kiểm tra thông tin nhận tiền.

**Lọc và chọn:** chọn kỳ, nhập số hóa đơn/số căn. Chọn từng hóa đơn hoặc **Chọn hóa đơn trên trang**. Giữ lựa chọn khi chuyển trang/đổi bộ lọc, liệt kê rõ số hóa đơn đã chọn; đổi thao tác thì bỏ lựa chọn. Chia đợt nếu hơn 50 hóa đơn. Nút **Tải lại và chọn lại** bỏ lựa chọn/phiên bản cũ để lấy dữ liệu mới.

**Xem trước:** bấm **Xem trước thao tác**, kiểm tra từng dòng và tổng tiền các dòng hợp lệ. Chưa thay đổi trạng thái hoặc ghi lịch sử ở bước này. Có lỗi thì không có token/nút xác nhận. Mở hóa đơn để bổ sung/tính lại, hoặc **Chỉ giữ hóa đơn hợp lệ**, sau đó phải xem trước lại.

**Khi gửi:** chọn ngân hàng từ danh sách có tìm kiếm, nhập hạn trả/tài khoản/tên người nhận **áp dụng chung cho mọi hóa đơn đã chọn**. Hạn từ hôm nay và không trước ngày chốt từng hóa đơn. Bản xem trước hiển thị lại ngân hàng, số tài khoản, tên người nhận và hạn để kiểm tra. Thay thông tin nhận tiền sẽ bỏ bản xem trước cũ. Nếu cần tài khoản/hạn khác nhau, chia đợt.

**Xác nhận:** tích đã kiểm tra rồi bấm **Xác nhận duyệt/gửi N hóa đơn**. Bản xem trước hạn 15 phút. Hệ thống khóa và kiểm tra lại từng phiên bản/trạng thái; nguồn duyệt cũng phải còn khớp. Nếu có hóa đơn lỗi/đã đổi, chưa xử lý dòng nào. Nếu lỗi ghi lịch sử ở dòng sau thì cả dòng trước và đợt cũng rollback.

Tiền của hóa đơn đã duyệt được giữ nguyên khi gửi, không tự tính lại theo nguồn giá/diện tích mới. Cần điều chỉnh hóa đơn đã duyệt thì dùng quy trình hủy/thay thế hiện có. Gửi lên web không phải xác nhận đã thu tiền hoặc nhắc phí; các bước này vẫn thực hiện riêng tại chi tiết hóa đơn.

**Mất mạng:** giữ nguyên thông tin và bấm xác nhận lại. Nếu máy chủ đã xử lý xong nhưng trình duyệt mất phản hồi, kết quả cũ được trả về với đúng ID, không ghi trạng thái/lịch sử lần hai. Đợt đã hoàn tất trả lại receipt gốc kể cả token hết hạn hoặc máy chủ restart; mở từng hóa đơn để xem trạng thái hiện tại vì hóa đơn có thể đã được thanh toán sau đó. Nếu chưa xử lý và token hết hạn, cần xem trước lại. Chờ kết quả trước khi rời trang.

## Chép vào VS Code trên Windows

1. Lưu các sửa đổi riêng rồi dừng backend/frontend bằng Ctrl+C. Giữ `.env`, `.certs`, database, ảnh/chứng từ.
2. Mở thư mục `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`. Tạo mới/thay toàn bộ đúng đường dẫn 9 file bên dưới. Chỉ chép nội dung bên trong khối mã, không chép dấu ba backtick, không nối cuối file.
3. `billing-batch.service.js` vẫn phục vụ lập nháp nhưng thêm các helper dùng chung. `billing.service.js` giữ quy trình đơn lẻ và bổ sung khả năng dùng cùng transaction cho đợt. Thay đủ các file cùng lần để các import khớp. Giữ `BatchBills.jsx`, `BatchBills.css`, `banks.js`, helper UUID và những file không nằm trong danh sách ở bản đã có.
4. Tạo mới **016_bill_actions.sql**, không sửa 001–015. Bảng mới chỉ lưu kết quả đợt để chống lặp, không tự duyệt/gửi hoặc backfill hóa đơn cũ. Tại thư mục gốc, khi database đang chạy:

```powershell
npm run db:migrate
```

Nếu database Docker đang dừng thì chạy `npm run db:up` trước. Sau migration phải thấy `Schema current: 016_bill_actions.sql`. API ready mới yêu cầu đủ 16 migration. Không cần `npm install` hoặc `db:seed` cho bản này.

5. Terminal thứ nhất:

```powershell
npm run dev:backend
```

Terminal thứ hai giữ lệnh frontend đang dùng, ví dụ HTTPS:

```powershell
npm run dev:frontend:https
```

Chỉ chạy một Vite trên cổng 5173, nhấn **Ctrl+F5** trình duyệt rồi đăng nhập BQL. Helper UUID có fallback cho HTTP LAN; quy tắc HTTPS khi dùng camera giữ như trước.

Nếu lấy bằng Git, lưu các sửa đổi cá nhân rồi cập nhật nhánh `codex/auth-qr-incidents`, chạy migration và restart. Sau bản này không chép app.js, service/router hóa đơn, billing-batch.service.js hoặc Billing.jsx từ hướng dẫn cũ đè lên.

## Thử lại

1. Dùng chức năng lập hàng loạt trước để có hai bản nháp hợp lệ cùng kỳ. Vào Duyệt/gửi hàng loạt, chọn đúng kỳ/số căn, chọn hai hóa đơn và xem trước: không có lỗi và tổng khớp.
2. Tích xác nhận rồi duyệt. Kết quả có hai liên kết và lịch sử Duyệt ở từng hóa đơn. Cư dân chưa thấy hóa đơn chỉ mới duyệt.
3. Chuyển sang chọn hóa đơn để gửi, chọn lại các hóa đơn đã duyệt. Điền ngân hàng/hạn/tài khoản/tên người nhận chung, xem trước và kiểm tra. Đổi số tài khoản phải làm mất bản xem trước để buộc kiểm tra lại.
4. Xác nhận gửi. Cư dân đúng căn xem được hóa đơn, thông tin nhận tiền và VietQR. Không tự chuyển hóa đơn sang đã thanh toán.
5. Thử thay đổi nguồn một nháp trước khi duyệt: phải tính lại nháp. Nếu phiên bản đã đổi sau lúc chọn, dùng Tải lại và chọn lại; không đoán phiên bản hoặc tự sửa SQL.
6. Với điện thoại, thử chọn/bỏ, tìm ngân hàng, mở liên kết; bảng cuộn ngang bên trong. Chỉ BQL có nút hàng loạt, KTV/cư dân không có quyền API này.

## Danh sách file

1. [database/migrations/016_bill_actions.sql](../database/migrations/016_bill_actions.sql) — **Tạo mới**.
2. [backend/src/modules/billing/billing-batch-actions.service.js](../backend/src/modules/billing/billing-batch-actions.service.js) — **Tạo mới**.
3. [backend/src/modules/billing/billing-batch.service.js](../backend/src/modules/billing/billing-batch.service.js) — **Thay toàn bộ**.
4. [backend/src/modules/billing/billing.service.js](../backend/src/modules/billing/billing.service.js) — **Thay toàn bộ**.
5. [backend/src/modules/billing/billing.routes.js](../backend/src/modules/billing/billing.routes.js) — **Thay toàn bộ**.
6. [backend/src/app.js](../backend/src/app.js) — **Thay toàn bộ**.
7. [frontend/src/features/billing/BatchBillActions.jsx](../frontend/src/features/billing/BatchBillActions.jsx) — **Tạo mới**.
8. [frontend/src/features/billing/BatchBillActions.css](../frontend/src/features/billing/BatchBillActions.css) — **Tạo mới**.
9. [frontend/src/features/billing/Billing.jsx](../frontend/src/features/billing/Billing.jsx) — **Thay toàn bộ**.

## Code đầy đủ

### 1. `database/migrations/016_bill_actions.sql`

Tạo mới.

```sql
CREATE TABLE dot_xu_ly_hoa_don (
  ma_dot_xu_ly INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  thao_tac ENUM('DUYET','GUI') NOT NULL,
  dau_vao_sha256 CHAR(64) NOT NULL,
  ket_qua JSON NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_bill_action_request (ma_nguoi_thuc_hien,khoa_yeu_cau),
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (ket_qua IS NULL OR JSON_TYPE(ket_qua)='OBJECT')
) ENGINE=InnoDB;
```

### 2. `backend/src/modules/billing/billing-batch-actions.service.js`

Tạo mới.

```js
import { pool, rows } from "../../lib/db.js";
import { choice, fail, integer } from "../../lib/http.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { lockApartment } from "./billing.guards.js";
import {
  action,
  prepareBillAction,
  paymentDetails,
} from "./billing.service.js";
import { hash, actor, tokenFor, verify } from "./billing-batch.service.js";

function input(raw) {
  const operation = choice(raw.thao_tac, "thao_tac", ["DUYET", "GUI"]);
  if (
    !Array.isArray(raw.hoa_don) ||
    !raw.hoa_don.length ||
    raw.hoa_don.length > 50
  )
    fail(422, "BATCH_SIZE", "Chọn từ 1 đến 50 hóa đơn mỗi đợt.");
  const invoices = raw.hoa_don.map((bill) => ({
    ma_hoa_don: integer(bill?.ma_hoa_don, "ma_hoa_don"),
    phien_ban: integer(bill?.phien_ban, "phien_ban"),
  }));
  if (
    invoices.some((b) => b.ma_hoa_don < 1) ||
    new Set(invoices.map((b) => b.ma_hoa_don)).size !== invoices.length
  )
    fail(422, "BATCH_INVOICES", "Mã hóa đơn phải hợp lệ và không lặp.");
  // Relative due-date checks happen in prepareBillAction; old successful requests remain replayable.
  return {
    thao_tac: operation,
    hoa_don: invoices.sort((a, b) => a.ma_hoa_don - b.ma_hoa_don),
    ...(operation === "GUI" ? paymentDetails(raw, "1900-01-01", false) : {}),
  };
}
async function quote(db, body) {
  const ids = body.hoa_don.map((b) => b.ma_hoa_don),
    placeholders = ids.map(() => "?").join(",");
  const hints = await rows(
    db,
    `SELECT ma_hoa_don,ma_can_ho FROM hoa_don WHERE ma_hoa_don IN (${placeholders})`,
    ids,
  );
  const apartments = new Map();
  for (const id of [...new Set(hints.map((b) => b.ma_can_ho))].sort(
    (a, b) => a - b,
  ))
    apartments.set(id, await lockApartment(db, id));
  const bills = await rows(
    db,
    `SELECT * FROM hoa_don WHERE ma_hoa_don IN (${placeholders}) ORDER BY ma_can_ho,ma_hoa_don FOR UPDATE`,
    ids,
  );
  const result = [];
  for (const requested of body.hoa_don) {
    const bill = bills.find((b) => b.ma_hoa_don === requested.ma_hoa_don),
      apartment = bill && apartments.get(bill.ma_can_ho);
    const row = {
      ma_hoa_don: requested.ma_hoa_don,
      so_hoa_don: bill?.so_hoa_don || `#${requested.ma_hoa_don}`,
      so_can_ho: apartment?.so_can_ho || "—",
      ky_thanh_toan: bill?.ky_thanh_toan || "",
      tong_tien: bill?.tong_tien || "0",
      trang_thai: bill?.trang_thai || "",
      phien_ban: bill?.phien_ban ?? null,
      dau_van_tay: bill?.dau_van_tay || "",
      loi: [],
    };
    try {
      if (!bill || !apartment)
        fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
      await prepareBillAction(
        db,
        bill,
        apartment,
        body.thao_tac.toLowerCase(),
        { ...body, phien_ban: requested.phien_ban },
      );
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      row.loi = [error.message];
    }
    result.push(row);
  }
  return result;
}
export async function batchBillActions(raw, user, commit = false) {
  const body = input(raw),
    bodyHash = hash(body),
    key = commit ? requestKey(raw.khoa_yeu_cau) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    let batchId;
    if (commit) {
      await rows(
        db,
        "INSERT INTO dot_xu_ly_hoa_don (ma_nguoi_thuc_hien,khoa_yeu_cau,thao_tac,dau_vao_sha256) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE khoa_yeu_cau=khoa_yeu_cau",
        [user.ma_nguoi_dung, key, body.thao_tac, bodyHash],
      );
      const [record] = await rows(
        db,
        "SELECT * FROM dot_xu_ly_hoa_don WHERE ma_nguoi_thuc_hien=? AND khoa_yeu_cau=? FOR UPDATE",
        [user.ma_nguoi_dung, key],
      );
      if (record.dau_vao_sha256 !== bodyHash)
        fail(
          409,
          "BATCH_KEY_CONFLICT",
          "Mã yêu cầu đã dùng với thao tác hoặc dữ liệu khác. Xem trước một đợt mới.",
        );
      batchId = record.ma_dot_xu_ly;
      if (record.ket_qua !== null) {
        await actor(db, user);
        return {
          ...(typeof record.ket_qua === "string"
            ? JSON.parse(record.ket_qua)
            : record.ket_qua),
          da_xu_ly_truoc: true,
        };
      }
    }
    const expected = commit ? verify(raw.xac_nhan, bodyHash, user) : null;
    const preview = await quote(db, body),
      errors = preview.filter((r) => r.loi.length).length;
    await actor(db, user);
    const total = preview
      .filter((r) => !r.loi.length)
      .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
      .toString();
    if (!commit)
      return {
        thao_tac: body.thao_tac,
        rows: preview.map(({ dau_van_tay, ...r }) => r),
        so_hoa_don: preview.length,
        so_loi: errors,
        tong_tien: total,
        xac_nhan: errors ? null : tokenFor(bodyHash, hash(preview), user),
      };
    if (errors || hash(preview) !== expected)
      fail(
        409,
        "BATCH_CHANGED",
        "Chưa xử lý hóa đơn nào. Phiên bản, trạng thái hoặc dữ liệu nguồn đã đổi. Hãy chọn lại phiên bản mới và xem trước lại.",
      );
    for (const requested of body.hoa_don)
      await action(
        requested.ma_hoa_don,
        body.thao_tac.toLowerCase(),
        { ...body, phien_ban: requested.phien_ban },
        user,
        db,
      );
    await actor(db, user);
    const result = {
      ma_dot_xu_ly: batchId,
      thao_tac: body.thao_tac,
      so_hoa_don: preview.length,
      tong_tien: total,
      hoa_don: preview.map((r) => ({
        ma_hoa_don: r.ma_hoa_don,
        so_hoa_don: r.so_hoa_don,
        so_can_ho: r.so_can_ho,
        tong_tien: r.tong_tien,
        trang_thai_luc_xu_ly: body.thao_tac === "DUYET" ? "DA_DUYET" : "DA_GUI",
      })),
    };
    await rows(
      db,
      "UPDATE dot_xu_ly_hoa_don SET ket_qua=? WHERE ma_dot_xu_ly=?",
      [JSON.stringify(result), batchId],
    );
    await db.commit();
    return { ...result, da_xu_ly_truoc: false };
  } finally {
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
```

### 3. `backend/src/modules/billing/billing-batch.service.js`

Thay toàn bộ.

```js
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { pool, rows } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
import { period, monthDay, options } from "./billing.validation.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { lockApartment } from "./billing.guards.js";
import { generate, prepareDraft } from "./billing.service.js";

const signingKey = randomBytes(32);
export const hash = (x) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
const mac = (s) =>
  createHmac("sha256", signingKey).update(s).digest("base64url");
function input(body) {
  const month = period(body.ky_thanh_toan);
  if (
    !Array.isArray(body.ma_can_ho) ||
    body.ma_can_ho.length < 1 ||
    body.ma_can_ho.length > 50
  )
    fail(422, "BATCH_SIZE", "Chọn từ 1 đến 50 căn hộ mỗi đợt.");
  const ids = body.ma_can_ho.map((id) => integer(id, "ma_can_ho"));
  if (ids.some((id) => id < 1) || new Set(ids).size !== ids.length)
    fail(422, "BATCH_APARTMENTS", "Mã căn phải hợp lệ và không lặp trong đợt.");
  return {
    ma_can_ho: ids.sort((a, b) => a - b),
    ky_thanh_toan: month,
    ngay_chot_phi: monthDay(body.ngay_chot_phi, month),
    ...options(body),
  };
}
export async function actor(db, user) {
  const found = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!found.length)
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Đăng nhập lại trước khi xử lý hóa đơn.",
    );
}
export function tokenFor(bodyHash, quoteHash, user) {
  const payload = Buffer.from(
    JSON.stringify({
      bodyHash,
      quoteHash,
      actor: user.ma_nguoi_dung,
      version: user.phien_ban_token,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return `${payload}.${mac(payload)}`;
}
export function verify(token, bodyHash, user) {
  const [payload, signature, extra] =
    typeof token === "string" ? token.split(".") : [];
  if (!payload || !signature || extra || token.length > 2000)
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Hãy xem trước đợt hóa đơn trước khi xác nhận.",
    );
  const expected = Buffer.from(mac(payload)),
    actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Bản xem trước không hợp lệ hoặc máy chủ đã khởi động lại. Hãy xem trước lại.",
    );
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    fail(409, "PREVIEW_REQUIRED", "Hãy xem trước lại đợt hóa đơn.");
  }
  if (
    data.bodyHash !== bodyHash ||
    data.actor !== user.ma_nguoi_dung ||
    data.version !== user.phien_ban_token ||
    data.expires < Date.now()
  )
    fail(
      409,
      "PREVIEW_EXPIRED",
      "Dữ liệu, phiên đăng nhập đã đổi hoặc bản xem trước quá 15 phút. Hãy xem trước lại.",
    );
  return data.quoteHash;
}
async function quote(db, body) {
  // Acquire every apartment in ascending order before taking shared fee-source locks.
  const apartments = [];
  for (const id of body.ma_can_ho) {
    try {
      apartments.push(await lockApartment(db, id));
    } catch (error) {
      if (error.code !== "NOT_FOUND") throw error;
      apartments.push({ ma_can_ho: id, so_can_ho: `#${id}`, missing: true });
    }
  }
  const result = [];
  for (const apartment of apartments) {
    const row = {
      ma_can_ho: apartment.ma_can_ho,
      so_can_ho: apartment.so_can_ho,
      khoi: apartment.khoi || "",
      tong_tien: "0",
      loi: [],
      chi_tiet: [],
    };
    try {
      if (apartment.missing) fail(404, "NOT_FOUND", "Không tìm thấy căn hộ.");
      const { snapshot } = await prepareDraft(db, apartment, body);
      row.tong_tien = snapshot.total;
      row.loi = snapshot.errors;
      row.chi_tiet = snapshot.lines;
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      row.loi = [error.message];
    }
    result.push(row);
  }
  return result;
}
export async function batchBills(raw, user, commit = false) {
  const body = input(raw),
    bodyHash = hash(body),
    key = commit ? requestKey(raw.khoa_yeu_cau) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    let batchId;
    if (commit) {
      // The unique request row serializes retries, including requests on another server.
      await rows(
        db,
        "INSERT INTO dot_lap_hoa_don (ma_nguoi_lap,khoa_yeu_cau,dau_vao_sha256) VALUES (?,?,?) ON DUPLICATE KEY UPDATE khoa_yeu_cau=khoa_yeu_cau",
        [user.ma_nguoi_dung, key, bodyHash],
      );
      const [batch] = await rows(
        db,
        "SELECT * FROM dot_lap_hoa_don WHERE ma_nguoi_lap=? AND khoa_yeu_cau=? FOR UPDATE",
        [user.ma_nguoi_dung, key],
      );
      if (batch.dau_vao_sha256 !== bodyHash)
        fail(
          409,
          "BATCH_KEY_CONFLICT",
          "Mã yêu cầu đã dùng cho dữ liệu khác. Hãy xem trước một đợt mới.",
        );
      batchId = batch.ma_dot_lap;
      if (batch.ket_qua !== null) {
        await actor(db, user);
        const result =
          typeof batch.ket_qua === "string"
            ? JSON.parse(batch.ket_qua)
            : batch.ket_qua;
        return { ...result, da_lap_truoc: true };
      }
    }
    const expected = commit ? verify(raw.xac_nhan, bodyHash, user) : null;
    const preview = await quote(db, body);
    const errors = preview.filter((r) => r.loi.length).length;
    await actor(db, user);
    if (!commit)
      return {
        rows: preview,
        so_can: preview.length,
        so_can_loi: errors,
        tong_tien: preview
          .filter((r) => !r.loi.length)
          .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
          .toString(),
        xac_nhan: errors ? null : tokenFor(bodyHash, hash(preview), user),
      };
    if (errors || hash(preview) !== expected)
      fail(
        409,
        "BATCH_CHANGED",
        "Chưa tạo hóa đơn nào. Đơn giá, chỉ số, xe hoặc hóa đơn đã thay đổi. Hãy xem trước lại từng căn.",
      );
    const invoices = [];
    for (const row of preview) {
      const result = await generate(
        { ...body, ma_can_ho: row.ma_can_ho },
        user,
        db,
      );
      invoices.push({
        ma_can_ho: row.ma_can_ho,
        so_can_ho: row.so_can_ho,
        ...result,
        tong_tien: row.tong_tien,
      });
    }
    await actor(db, user);
    const result = {
      ma_dot_lap: batchId,
      so_hoa_don: invoices.length,
      tong_tien: preview
        .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
        .toString(),
      hoa_don: invoices,
    };
    await rows(db, "UPDATE dot_lap_hoa_don SET ket_qua=? WHERE ma_dot_lap=?", [
      JSON.stringify(result),
      batchId,
    ]);
    await db.commit();
    return { ...result, da_lap_truoc: false };
  } finally {
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
```

### 4. `backend/src/modules/billing/billing.service.js`

Thay toàn bộ.

```js
import { reportPage } from "../report-exports/report-files.js";
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "./billing.guards.js";
import { vietQR } from "./billing.qr.js";
import * as v from "./billing.validation.js";
import { electricityConfig, electricityLines } from "./billing.electricity.js";

const json = (x) => (typeof x === "string" ? JSON.parse(x) : x);
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, stable(x[k])]),
    );
  return x;
}
const digest = (x) =>
  createHash("sha256")
    .update(JSON.stringify(stable(x)))
    .digest("hex");
const fixed = ["DA_DUYET", "DA_GUI", "DA_THANH_TOAN"];
const state = (row, allowed) => {
  if (!allowed.includes(row.trang_thai))
    fail(
      409,
      "INVALID_STATE",
      "Trạng thái hóa đơn không cho phép thao tác này.",
    );
};
const opts = (row, body = {}) =>
  v.options(
    Object.fromEntries(
      ["tinh_nuoc", "tinh_dien", "tinh_xe"].map((key) => [
        key,
        key in body ? body[key] : !!row[key],
      ]),
    ),
  );
async function log(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_hoa_don (ma_hoa_don,ma_nguoi_ghi,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}

export async function rates(query) {
  const { page, offset } = v.pagination(query),
    values = [],
    where = [];
  if (query.loai_phi) {
    where.push("c.loai_phi=?");
    values.push(choice(query.loai_phi, "loai_phi", v.feeTypes));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM cau_hinh_phi c ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi ${condition} ORDER BY c.ma_cau_hinh_phi DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function createRate(body, user) {
  const type = choice(body.loai_phi, "loai_phi", v.feeTypes),
    config = electricityConfig(body, type),
    price =
      config.cach_tinh === "BAC_THANG"
        ? "0.00"
        : v.decimal(v.scaled(body.don_gia), 2),
    from = v.day(body.tu_ngay, true);
  return transaction(async (db) => {
    await rows(
      db,
      "SELECT loai_phi FROM loai_phi WHERE loai_phi=? FOR UPDATE",
      [type],
    );
    const [last] = await rows(
      db,
      "SELECT * FROM cau_hinh_phi WHERE loai_phi=? ORDER BY tu_ngay DESC LIMIT 1 FOR UPDATE",
      [type],
    );
    if (last) {
      if (from <= last.tu_ngay)
        fail(
          422,
          "RATE_ORDER",
          "Ngày áp dụng mới phải sau phiên bản giá gần nhất.",
        );
      const used = await rows(
        db,
        "SELECT h.ma_hoa_don FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE d.ma_cau_hinh_phi=? AND h.trang_thai<>'HUY' AND h.ngay_chot_phi>=? LIMIT 1",
        [last.ma_cau_hinh_phi, from],
      );
      if (used.length)
        fail(
          409,
          "RATE_IN_USE",
          "Ngày áp dụng mới trùng khoảng giá đã dùng. Chọn ngày sau ngày chốt hóa đơn đã lập.",
        );
      await rows(
        db,
        "UPDATE cau_hinh_phi SET den_ngay=? WHERE ma_cau_hinh_phi=?",
        [from, last.ma_cau_hinh_phi],
      );
    }
    const result = await rows(
      db,
      "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,ma_nguoi_tao,cach_tinh,thue_gtgt,bac_dien) VALUES (?,?,?,?,?,?,?)",
      [
        type,
        price,
        from,
        user.ma_nguoi_dung,
        config.cach_tinh,
        config.thue_gtgt,
        config.bac_dien === null ? null : JSON.stringify(config.bac_dien),
      ],
    );
    return { ma_cau_hinh_phi: result.insertId };
  });
}
export async function meters(query, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    values = [],
    where = [];
  if (query.ma_can_ho) {
    where.push("m.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ky_thanh_toan) {
    where.push("m.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM chi_so_dich_vu m ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function saveMeter(body, user, connection = null) {
  const apartmentId = integer(body.ma_can_ho, "ma_can_ho"),
    type = choice(body.loai_dich_vu, "loai_dich_vu", ["DIEN", "NUOC"]),
    month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot, month);
  const old = v.scaled(body.chi_so_cu, 3, 9),
    next = v.scaled(body.chi_so_moi, 3, 9),
    note = text(body.ghi_chu ?? "", "ghi_chu", 0, 255);
  if (next < old)
    fail(422, "METER_DECREASE", "Chỉ số mới không được nhỏ hơn chỉ số cũ.");
  return transaction(async (db) => {
    await lockApartment(db, apartmentId);
    const billed = await rows(
      db,
      "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') LIMIT 1 FOR UPDATE",
      [apartmentId, month],
    );
    if (billed.length)
      fail(
        409,
        "METER_LOCKED",
        "Kỳ này đã có hóa đơn được duyệt. Hủy hóa đơn chưa thanh toán trước khi điều chỉnh chỉ số.",
      );
    const records = await rows(
      db,
      "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? ORDER BY ky_thanh_toan DESC FOR UPDATE",
      [apartmentId, type],
    );
    if (records[0]?.ky_thanh_toan > month)
      fail(
        409,
        "METER_LATER_PERIOD",
        "Chỉ ghi hoặc sửa kỳ mới nhất; đã có chỉ số kỳ sau.",
      );
    const current = records.find((r) => r.ky_thanh_toan === month),
      previous = records.find((r) => r.ky_thanh_toan < month);
    if (previous) {
      const prior = new Date(`${month}-01T00:00:00Z`);
      prior.setUTCMonth(prior.getUTCMonth() - 1);
      if (previous.ky_thanh_toan !== prior.toISOString().slice(0, 7))
        fail(
          422,
          "MISSING_PREVIOUS_METER",
          "Thiếu chỉ số kỳ liền trước. Hãy bổ sung trước khi ghi kỳ này.",
        );
      if (old !== v.scaled(previous.chi_so_moi, 3, 9))
        fail(
          422,
          "METER_CHAIN",
          "Chỉ số cũ phải bằng chỉ số mới của kỳ liền trước.",
        );
    } else if (!current && body.ky_dau !== true)
      fail(
        422,
        "FIRST_METER",
        "Kỳ đầu cần xác nhận nhập cả chỉ số đầu và cuối.",
      );
    if (current) {
      v.version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE chi_so_dich_vu SET chi_so_cu=?,chi_so_moi=?,ngay_chot=?,ghi_chu=?,ma_nguoi_ghi=?,ngay_ghi=CURRENT_TIMESTAMP,phien_ban=phien_ban+1 WHERE ma_chi_so_dich_vu=?",
        [
          v.decimal(old, 3),
          v.decimal(next, 3),
          day,
          note,
          user.ma_nguoi_dung,
          current.ma_chi_so_dich_vu,
        ],
      );
      return { ma_chi_so_dich_vu: current.ma_chi_so_dich_vu };
    }
    const result = await rows(
      db,
      "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ghi_chu,ma_nguoi_ghi) VALUES (?,?,?,?,?,?,?,?)",
      [
        apartmentId,
        type,
        month,
        v.decimal(old, 3),
        v.decimal(next, 3),
        day,
        note,
        user.ma_nguoi_dung,
      ],
    );
    return { ma_chi_so_dich_vu: result.insertId };
  }, connection);
}

async function calculate(db, apartment, month, day, options) {
  await rows(db, "SELECT loai_phi FROM loai_phi ORDER BY loai_phi FOR UPDATE");
  const rates = await rows(
    db,
    "SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi WHERE c.tu_ngay<=? AND (c.den_ngay IS NULL OR c.den_ngay>?) ORDER BY c.loai_phi FOR UPDATE",
    [day, day],
  );
  const meters = await rows(
    db,
    "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY loai_dich_vu FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  const cars = options.tinh_xe
    ? await rows(
        db,
        "SELECT ma_phuong_tien,loai_xe FROM phuong_tien WHERE ma_can_ho=? AND ngay_dang_ky<=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) ORDER BY ma_phuong_tien FOR UPDATE",
        [apartment.ma_can_ho, day, day],
      )
    : [];
  const lines = [],
    errors = [];
  function add(type, quantity, source = {}, meterId = null) {
    const rate = rates.find((r) => r.loai_phi === type);
    if (!rate) {
      errors.push(`Thiếu đơn giá ${type} tại ngày chốt.`);
      return;
    }
    const qty = v.decimal(v.scaled(quantity, 3, 9), 3),
      price = v.decimal(v.scaled(rate.don_gia), 2);
    lines.push({
      loai_phi: type,
      dien_giai: rate.ten_phi,
      don_vi_tinh: rate.don_vi_tinh,
      so_luong: qty,
      don_gia: price,
      thanh_tien: v.lineTotal(qty, price),
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: source,
    });
  }
  if (apartment.tinh_phi_dich_vu) add("PHI_QUAN_LY", apartment.dien_tich_m2);
  if (options.tinh_xe)
    for (const [type, fee] of [
      ["O_TO", "GUI_O_TO"],
      ["XE_MAY", "GUI_XE_MAY"],
      ["XE_DAP", "GUI_XE_DAP"],
    ]) {
      const selected = cars.filter((r) => r.loai_xe === type);
      if (selected.length)
        add(fee, String(selected.length), {
          ma_dang_ky: selected.map((r) => r.ma_phuong_tien),
        });
    }
  for (const [type, enabled] of [
    ["NUOC", options.tinh_nuoc],
    ["DIEN", options.tinh_dien],
  ])
    if (enabled) {
      const meter = meters.find((r) => r.loai_dich_vu === type);
      if (!meter || meter.ngay_chot !== day) {
        errors.push(`Thiếu chỉ số ${type} đúng ngày chốt ${day}.`);
        continue;
      }
      const used =
        v.scaled(meter.chi_so_moi, 3, 9) - v.scaled(meter.chi_so_cu, 3, 9);
      if (type === "DIEN") {
        const rate = rates.find((r) => r.loai_phi === "TIEN_DIEN");
        if (!rate) errors.push("Thiếu đơn giá TIEN_DIEN tại ngày chốt.");
        else {
          // Preserve legacy flat/no-VAT snapshots byte-for-byte for existing drafts.
          if (rate.cach_tinh === "BAC_THANG" || v.scaled(rate.thue_gtgt) > 0n) {
            lines.push(
              ...electricityLines(
                rate,
                used,
                {
                  chi_so_cu: meter.chi_so_cu,
                  chi_so_moi: meter.chi_so_moi,
                  phien_ban: meter.phien_ban,
                },
                meter.ma_chi_so_dich_vu,
              ),
            );
            continue;
          }
        }
        if (!rate) continue;
      }
      add(
        `TIEN_${type}`,
        v.decimal(used, 3),
        {
          chi_so_cu: meter.chi_so_cu,
          chi_so_moi: meter.chi_so_moi,
          phien_ban: meter.phien_ban,
        },
        meter.ma_chi_so_dich_vu,
      );
    }
  if (!lines.length) errors.push("Chưa có khoản phí hợp lệ được áp dụng.");
  const total = lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n);
  if (total > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Tổng hóa đơn vượt giới hạn.");
  return {
    lines,
    errors,
    total: total.toString(),
    hash: digest({ lines, errors }),
  };
}
async function storeSnapshot(db, id, snapshot) {
  await rows(db, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [id]);
  for (const l of snapshot.lines)
    await rows(
      db,
      "INSERT INTO chi_tiet_hoa_don (ma_hoa_don,ma_cau_hinh_phi,ma_chi_so_dich_vu,loai_phi,dien_giai,don_vi_tinh,so_luong,don_gia,thanh_tien,du_lieu_nguon) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        l.ma_cau_hinh_phi,
        l.ma_chi_so_dich_vu,
        l.loai_phi,
        l.dien_giai,
        l.don_vi_tinh,
        l.so_luong,
        l.don_gia,
        l.thanh_tien,
        JSON.stringify(l.du_lieu_nguon),
      ],
    );
  await rows(
    db,
    "UPDATE hoa_don SET tong_tien=?,loi_du_lieu=?,dau_van_tay=? WHERE ma_hoa_don=?",
    [snapshot.total, JSON.stringify(snapshot.errors), snapshot.hash, id],
  );
}
export async function prepareDraft(db, apartment, body, previous = null) {
  const month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot_phi, month),
    options = v.options(body);
  const existing = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY lan_lap DESC FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  if (existing.some((h) => h.trang_thai !== "HUY"))
    fail(
      409,
      "BILL_EXISTS",
      "Căn đã có hóa đơn còn hiệu lực trong kỳ. Mở hóa đơn nháp để tính lại.",
    );
  if (
    existing.length &&
    (!previous || existing[0].ma_hoa_don !== previous.ma_hoa_don)
  )
    fail(
      409,
      "REPLACEMENT_REQUIRED",
      "Hãy lập thay thế từ hóa đơn hủy gần nhất.",
    );
  const snapshot = await calculate(db, apartment, month, day, options);
  return { month, day, options, existing, snapshot };
}
async function makeDraft(db, apartment, body, user, previous = null) {
  const { month, day, options, existing, snapshot } = await prepareDraft(
    db,
    apartment,
    body,
    previous,
  );
  const result = await rows(
    db,
    "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,loi_du_lieu,dau_van_tay,ma_nguoi_lap,ma_hoa_don_thay_the_cho) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      `HD${month.replace("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`,
      apartment.ma_can_ho,
      month,
      day,
      (existing[0]?.lan_lap || 0) + 1,
      options.tinh_nuoc,
      options.tinh_dien,
      options.tinh_xe,
      "[]",
      snapshot.hash,
      user.ma_nguoi_dung,
      previous?.ma_hoa_don || null,
    ],
  );
  await storeSnapshot(db, result.insertId, snapshot);
  await log(db, result.insertId, user, previous ? "LAP_THAY_THE" : "LAP_NHAP");
  return { ma_hoa_don: result.insertId };
}
export async function generate(body, user, connection = null) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(
    async (db) => makeDraft(db, await lockApartment(db, id), body, user),
    connection,
  );
}
async function lockedBill(db, id) {
  const [row] = await rows(
    db,
    "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
  const apartment = await lockApartment(db, row.ma_can_ho);
  const [bill] = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
    [id],
  );
  return { bill, apartment };
}
export function paymentDetails(body, cutoff = "1900-01-01", checkToday = true) {
  const due = v.day(body.han_thanh_toan, true),
    bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
    account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
    name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
  if (
    due < cutoff ||
    (checkToday && due < v.today()) ||
    !/^\d{6}$/.test(bin) ||
    !/^\d{6,30}$/.test(account)
  )
    fail(
      422,
      "INVALID_PAYMENT_DETAILS",
      "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
    );
  return {
    han_thanh_toan: due,
    ma_ngan_hang: bin,
    so_tai_khoan: account,
    ten_nguoi_nhan: name,
  };
}
export async function prepareBillAction(db, bill, apartment, operation, body) {
  v.version(bill, body.phien_ban);
  if (operation === "duyet") {
    state(bill, ["NHAP"]);
    const current = await calculate(
      db,
      apartment,
      bill.ky_thanh_toan,
      bill.ngay_chot_phi,
      opts(bill),
    );
    if (current.errors.length || BigInt(current.total) <= 0n)
      fail(
        422,
        "INCOMPLETE_BILL",
        "Hóa đơn còn thiếu dữ liệu hoặc tổng bằng 0. Bổ sung và tính lại bản nháp.",
      );
    if (current.hash !== bill.dau_van_tay || current.total !== bill.tong_tien)
      fail(
        409,
        "STALE_BILL_SOURCE",
        "Dữ liệu nguồn đã thay đổi. Hãy tính lại bản nháp trước khi duyệt.",
      );
    const saved = await rows(
      db,
      "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
      [bill.ma_hoa_don],
    );
    const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
      ...l,
      du_lieu_nguon: json(l.du_lieu_nguon),
    }));
    if (digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay)
      fail(
        409,
        "BILL_TOTAL_MISMATCH",
        "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
      );
    return {};
  }
  state(bill, ["DA_DUYET"]);
  return paymentDetails(body, bill.ngay_chot_phi);
}

export async function action(id, action, body, user, connection = null) {
  return transaction(async (db) => {
    const { bill, apartment } = await lockedBill(db, id);
    if (
      action === "xac_nhan_thanh_toan" &&
      bill.trang_thai === "DA_THANH_TOAN"
    ) {
      if (
        v.amount(body.so_tien).toString() === bill.so_tien_da_thu &&
        text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100) === bill.ma_tham_chieu
      )
        return { ma_hoa_don: id };
      fail(409, "ALREADY_PAID", "Hóa đơn đã được xác nhận thu.");
    }
    v.version(bill, body.phien_ban);
    if (action === "lap_thay_the") {
      state(bill, ["HUY"]);
      return makeDraft(
        db,
        apartment,
        {
          ky_thanh_toan: bill.ky_thanh_toan,
          ngay_chot_phi: body.ngay_chot_phi ?? bill.ngay_chot_phi,
          ...opts(bill, body),
        },
        user,
        bill,
      );
    }
    if (action === "tinh_lai") {
      state(bill, ["NHAP"]);
      const day = v.monthDay(
          body.ngay_chot_phi ?? bill.ngay_chot_phi,
          bill.ky_thanh_toan,
        ),
        options = opts(bill, body);
      await storeSnapshot(
        db,
        id,
        await calculate(db, apartment, bill.ky_thanh_toan, day, options),
      );
      await rows(
        db,
        "UPDATE hoa_don SET ngay_chot_phi=?,tinh_nuoc=?,tinh_dien=?,tinh_xe=? WHERE ma_hoa_don=?",
        [day, options.tinh_nuoc, options.tinh_dien, options.tinh_xe, id],
      );
    } else if (action === "duyet") {
      await prepareBillAction(db, bill, apartment, action, body);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const details = await prepareBillAction(
        db,
        bill,
        apartment,
        action,
        body,
      );
      const {
        han_thanh_toan: due,
        ma_ngan_hang: bin,
        so_tai_khoan: account,
        ten_nguoi_nhan: name,
      } = details;
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_GUI',han_thanh_toan=?,ma_ngan_hang=?,so_tai_khoan=?,ten_nguoi_nhan=?,ma_nguoi_gui=?,ngay_gui=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [due, bin, account, name, user.ma_nguoi_dung, id],
      );
    } else if (action === "huy") {
      state(bill, ["NHAP", "DA_DUYET", "DA_GUI"]);
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='HUY',ly_do_huy=?,ma_nguoi_huy=?,ngay_huy=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [reason, user.ma_nguoi_dung, id],
      );
    } else if (action === "xac_nhan_thanh_toan") {
      state(bill, ["DA_GUI"]);
      const amount = v.amount(body.so_tien),
        reference = text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100);
      if (amount !== BigInt(bill.tong_tien))
        fail(
          422,
          "WRONG_AMOUNT",
          "Chỉ xác nhận khi số tiền đã đối soát bằng đúng tổng hóa đơn.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=UTC_TIMESTAMP() WHERE ma_hoa_don=?",
        [amount.toString(), reference, user.ma_nguoi_dung, id],
      );
    } else fail(404, "NOT_FOUND", "Không có thao tác hóa đơn này.");
    await rows(
      db,
      "UPDATE hoa_don SET phien_ban=phien_ban+1 WHERE ma_hoa_don=?",
      [id],
    );
    await log(
      db,
      id,
      user,
      action.toUpperCase(),
      action === "huy" ? text(body.ly_do, "ly_do", 3, 255) : "",
    );
    return { ma_hoa_don: id };
  }, connection);
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  if (user.ma_can_ho_thanh_toan !== null) {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.ma_can_ho_thanh_toan=h.ma_can_ho AND u.dang_hoat_dong=1 AND u.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.phien_ban_token);
  } else {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
    );
    values.push(user.ma_nguoi_dung);
  }
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    where = [],
    values = [];
  access(user, where, values);
  if (query.ky_thanh_toan) {
    where.push("h.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  if (query.trang_thai) {
    where.push("h.trang_thai=?");
    values.push(
      choice(query.trang_thai, "trang_thai", [
        "NHAP",
        "DA_DUYET",
        "DA_GUI",
        "DA_THANH_TOAN",
        "HUY",
      ]),
    );
  }
  if (query.ma_can_ho) {
    where.push("h.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.q) {
    const q = text(query.q, "q", 1, 100);
    where.push("(h.so_hoa_don LIKE ? OR a.so_can_ho LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.phien_ban,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho,c.ho_va_ten AS nguoi_phu_trach_thanh_toan FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=h.ma_can_ho LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!row)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy hóa đơn hoặc bạn không còn quyền xem.",
    );
  const lines = await rows(
    pool,
    "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
    [id],
  );
  if (user.vai_tro === "QUAN_TRI_VIEN")
    return {
      ...summary(row),
      loi_du_lieu: json(row.loi_du_lieu),
      lines: lines.map((l) => ({ ...l, du_lieu_nguon: json(l.du_lieu_nguon) })),
      history: await rows(
        pool,
        "SELECT l.*,u.ho_va_ten FROM lich_su_hoa_don l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi WHERE ma_hoa_don=? ORDER BY l.ma_lich_su_hoa_don",
        [id],
      ),
      qr_payload: vietQR(row),
    };
  const allowed = [
    "ma_hoa_don",
    "so_hoa_don",
    "so_can_ho",
    "nguoi_phu_trach_thanh_toan",
    "ky_thanh_toan",
    "ngay_chot_phi",
    "trang_thai",
    "tong_tien",
    "han_thanh_toan",
    "ma_ngan_hang",
    "so_tai_khoan",
    "ten_nguoi_nhan",
    "ngay_thanh_toan",
    "so_tien_da_thu",
    "ma_tham_chieu",
  ];
  return {
    ...summary(Object.fromEntries(allowed.map((k) => [k, row[k]]))),
    lines: lines.map((l) =>
      Object.fromEntries(
        ["dien_giai", "don_vi_tinh", "so_luong", "don_gia", "thanh_tien"].map(
          (k) => [k, l[k]],
        ),
      ),
    ),
    qr_payload: vietQR(row),
  };
}
```

### 5. `backend/src/modules/billing/billing.routes.js`

Thay toàn bộ.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./billing.service.js";
import { remindBill } from "../announcements/announcements.service.js";
import { batchBills } from "./billing-batch.service.js";
import { batchBillActions } from "./billing-batch-actions.service.js";
export const ratesRouter = Router(),
  metersRouter = Router(),
  billsRouter = Router(),
  selfBillsRouter = Router();
for (const router of [ratesRouter, metersRouter, billsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfBillsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
ratesRouter.get("/", async (req, res) =>
  res.json(await service.rates(req.query)),
);
ratesRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.createRate(req.body, req.user) }),
);
metersRouter.get("/", async (req, res) =>
  res.json(await service.meters(req.query)),
);
metersRouter.put("/", async (req, res) =>
  res.json({ data: await service.saveMeter(req.body, req.user) }),
);
billsRouter.post("/lap", async (req, res) =>
  res.status(201).json({ data: await service.generate(req.body, req.user) }),
);
billsRouter.post("/hang_loat/xem_truoc", async (req, res) =>
  res.json({ data: await batchBills(req.body, req.user) }),
);
billsRouter.post("/hang_loat/xac_nhan", async (req, res) =>
  res.status(201).json({ data: await batchBills(req.body, req.user, true) }),
);
billsRouter.post("/xu_ly_hang_loat/xem_truoc", async (req, res) =>
  res.json({ data: await batchBillActions(req.body, req.user) }),
);
billsRouter.post("/xu_ly_hang_loat/xac_nhan", async (req, res) =>
  res.json({ data: await batchBillActions(req.body, req.user, true) }),
);
for (const router of [billsRouter, selfBillsRouter]) {
  router.get("/", async (req, res) =>
    res.json(await service.list(req.query, req.user)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.detail(integer(req.params.id, "id"), req.user),
    }),
  );
}
for (const action of [
  "tinh_lai",
  "duyet",
  "gui",
  "huy",
  "lap_thay_the",
  "xac_nhan_thanh_toan",
])
  billsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.action(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );

billsRouter.post("/:id/nhac_phi", async (req, res) =>
  res.json({
    data: await remindBill(integer(req.params.id, "id"), req.body, req.user),
  }),
);
```

### 6. `backend/src/app.js`

Thay toàn bộ.

```js
import express from "express";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { dataExchangeRouter } from "./modules/data-exchange/data-exchange.routes.js";
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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        "014_data_imports.sql",
        "015_bill_batches.sql",
        "016_bill_actions.sql",
      ],
    );
    if (migrations.length !== 16) throw new Error("Schema not initialized");
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
app.use("/api/tong_quan", dashboardRouter);
app.use("/api/trao_doi_du_lieu", dataExchangeRouter);
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

### 7. `frontend/src/features/billing/BatchBillActions.jsx`

Tạo mới.

```jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import { banks, bankName, bankSearch } from "./banks.js";
import "./BatchBills.css";
import "./BatchBillActions.css";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (s) => `${BigInt(s).toLocaleString("vi-VN")} đ`;
export default function BatchBillActions({ onDone, onBusy }) {
  const [operation, setOperation] = useState("DUYET"),
    [month, setMonth] = useState(() => today().slice(0, 7)),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [directory, setDirectory] = useState({ loading: true }),
    [selected, setSelected] = useState([]),
    [preview, setPreview] = useState(null),
    [confirmed, setConfirmed] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [result, setResult] = useState(null);
  const [bankQuery, setBankQuery] = useState(""),
    [payment, setPayment] = useState({
      han_thanh_toan: today(),
      ma_ngan_hang: "",
      so_tai_khoan: "",
      ten_nguoi_nhan: "",
    });
  const path = `/hoa_don?trang_thai=${operation === "DUYET" ? "NHAP" : "DA_DUYET"}&ky_thanh_toan=${month}&q=${encodeURIComponent(query)}&page=${page}`;
  useEffect(() => {
    const controller = new AbortController();
    setDirectory({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setDirectory({ path, revision, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setDirectory({ path, revision, error, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  const source =
    directory.path === path && directory.revision === revision
      ? directory
      : { loading: true };
  const matches = banks.filter((b) =>
    bankSearch(`${b.name} ${b.shortName} ${b.bin}`).includes(
      bankSearch(bankQuery),
    ),
  );
  const currentBank = banks.find((b) => b.bin === payment.ma_ngan_hang);
  function edit() {
    setPreview(null);
    setConfirmed(false);
    setResult(null);
    setError(null);
  }
  function switchOperation(next) {
    edit();
    setOperation(next);
    setSelected([]);
    setPage(1);
  }
  function toggle(bill) {
    edit();
    setSelected((old) =>
      old.some((b) => b.ma_hoa_don === bill.ma_hoa_don)
        ? old.filter((b) => b.ma_hoa_don !== bill.ma_hoa_don)
        : old.length < 50
          ? [...old, bill]
          : old,
    );
  }
  function changePayment(key, value) {
    edit();
    setPayment((old) => ({ ...old, [key]: value }));
  }
  async function run(commit) {
    setPending(true);
    onBusy(true);
    setError(null);
    try {
      const body = {
        thao_tac: operation,
        hoa_don: selected.map((b) => ({
          ma_hoa_don: b.ma_hoa_don,
          phien_ban: b.phien_ban,
        })),
        ...(operation === "GUI" ? payment : {}),
      };
      if (commit) {
        body.xac_nhan = preview.data.xac_nhan;
        body.khoa_yeu_cau = preview.key;
      }
      const { data } = await getJson(
        `/hoa_don/xu_ly_hang_loat/${commit ? "xac_nhan" : "xem_truoc"}`,
        { method: "POST", body },
      );
      if (commit) {
        setResult(data);
        setSelected([]);
        setPreview(null);
        setConfirmed(false);
        setRevision((n) => n + 1);
        onDone();
      } else {
        setPreview({ data, key: newRequestKey() });
        setConfirmed(false);
      }
    } catch (error) {
      setError(error);
      if (!commit || [401, 403, 409].includes(error.status)) {
        setPreview(null);
        setConfirmed(false);
      }
    } finally {
      setPending(false);
      onBusy(false);
    }
  }
  return (
    <section
      className="card batch-bills batch-actions"
      aria-labelledby="bill-actions-title"
    >
      <h2 id="bill-actions-title">Duyệt và gửi hóa đơn hàng loạt</h2>
      <p>
        Mỗi đợt chọn tối đa 50 hóa đơn. Xem trước chỉ kiểm tra; xác nhận chỉ
        thực hiện khi toàn bộ đợt còn hợp lệ.
      </p>
      <ErrorBox error={error} />
      <fieldset disabled={pending}>
        <div className="batch-settings">
          <Field label="Thao tác hàng loạt">
            <select
              value={operation}
              onChange={(e) => switchOperation(e.target.value)}
            >
              <option value="DUYET">Duyệt bản nháp</option>
              <option value="GUI">Gửi hóa đơn đã duyệt</option>
            </select>
          </Field>
          <Field label="Kỳ hóa đơn cần xử lý">
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
            />
          </Field>
        </div>
        <p>
          {operation === "DUYET"
            ? "Kiểm tra số liệu, nguồn phí và chi tiết từng bản nháp trước khi chuyển sang Đã duyệt."
            : "Gửi làm hóa đơn hiển thị trong Hóa đơn của tôi trên web cư dân kèm thông tin thanh toán VietQR. Hạn trả và tài khoản nhận bên dưới áp dụng chung cho các hóa đơn đã chọn."}
        </p>
        {operation === "GUI" && (
          <div className="bill-actions-payment">
            <Field label="Hạn thanh toán chung">
              <input
                type="date"
                min={today()}
                value={payment.han_thanh_toan}
                onChange={(e) =>
                  changePayment("han_thanh_toan", e.target.value)
                }
              />
            </Field>
            <Field label="Tìm ngân hàng nhận chung">
              <input
                value={bankQuery}
                maxLength={100}
                onChange={(e) => setBankQuery(e.target.value)}
              />
            </Field>
            <Field label="Ngân hàng nhận chung">
              <select
                value={payment.ma_ngan_hang}
                onChange={(e) => changePayment("ma_ngan_hang", e.target.value)}
              >
                <option value="">Chọn ngân hàng</option>
                {currentBank &&
                  !matches.some((b) => b.bin === currentBank.bin) && (
                    <option value={currentBank.bin}>
                      {currentBank.shortName} — {currentBank.name}
                    </option>
                  )}
                {matches.map((b) => (
                  <option key={b.bin} value={b.bin}>
                    {b.shortName} — {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Số tài khoản nhận chung">
              <input
                value={payment.so_tai_khoan}
                inputMode="numeric"
                maxLength={30}
                onChange={(e) => changePayment("so_tai_khoan", e.target.value)}
              />
            </Field>
            <Field label="Tên người nhận chung">
              <input
                value={payment.ten_nguoi_nhan}
                minLength={2}
                maxLength={100}
                onChange={(e) =>
                  changePayment("ten_nguoi_nhan", e.target.value)
                }
              />
            </Field>
          </div>
        )}
        <Field label="Tìm hóa đơn để xử lý">
          <input
            type="search"
            maxLength={100}
            value={query}
            placeholder="Số hóa đơn hoặc căn hộ"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <div className="actions bill-actions-tools">
          <button
            type="button"
            onClick={() => {
              edit();
              setSelected([]);
              setRevision((n) => n + 1);
            }}
          >
            Tải lại và chọn lại
          </button>
          <button
            type="button"
            disabled={!selected.length}
            onClick={() => {
              edit();
              setSelected([]);
            }}
          >
            Bỏ chọn mọi hóa đơn
          </button>
        </div>
        <ErrorBox error={source.error} />
        {source.loading && <Loading />}
        {source.data && (
          <>
            <button
              type="button"
              disabled={
                !source.data.data.length ||
                selected.length +
                  source.data.data.filter(
                    (b) => !selected.some((s) => s.ma_hoa_don === b.ma_hoa_don),
                  ).length >
                  50
              }
              onClick={() => {
                edit();
                setSelected((old) => [
                  ...old,
                  ...source.data.data.filter(
                    (b) => !old.some((s) => s.ma_hoa_don === b.ma_hoa_don),
                  ),
                ]);
              }}
            >
              Chọn hóa đơn trên trang
            </button>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>Hóa đơn / căn</th>
                    <th>Kỳ</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {source.data.data.map((b) => (
                    <tr key={b.ma_hoa_don}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Chọn hóa đơn ${b.so_hoa_don}`}
                          checked={selected.some(
                            (s) => s.ma_hoa_don === b.ma_hoa_don,
                          )}
                          disabled={
                            selected.length >= 50 &&
                            !selected.some((s) => s.ma_hoa_don === b.ma_hoa_don)
                          }
                          onChange={() => toggle(b)}
                        />
                      </td>
                      <td>
                        <Link to={`/quan-tri/hoa-don/${b.ma_hoa_don}`}>
                          {b.so_hoa_don}
                        </Link>
                        <small>Căn {b.so_can_ho}</small>
                      </td>
                      <td>{b.ky_thanh_toan}</td>
                      <td>{money(b.tong_tien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!source.data.total && (
              <p>Không có hóa đơn phù hợp với thao tác và bộ lọc.</p>
            )}
            <div className="actions">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                Trang hóa đơn trước
              </button>
              <span>
                Trang {page} · {source.data.total} hóa đơn
              </span>
              <button
                type="button"
                disabled={page * 20 >= source.data.total}
                onClick={() => setPage((n) => n + 1)}
              >
                Trang hóa đơn sau
              </button>
            </div>
          </>
        )}
        <div className="batch-selection">
          <strong>Đã chọn {selected.length}/50 hóa đơn</strong>
          <p className="muted">
            Giữ lựa chọn khi đổi bộ lọc; đổi thao tác sẽ bỏ lựa chọn. Nếu có
            phiên bản mới, bấm Tải lại và chọn lại.
          </p>
          <div className="actions">
            {selected.map((b) => (
              <button
                key={b.ma_hoa_don}
                type="button"
                aria-label={`Bỏ hóa đơn ${b.so_hoa_don}`}
                onClick={() => toggle(b)}
              >
                {b.so_hoa_don} ×
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!selected.length}
          onClick={() => run(false)}
        >
          {pending ? "Đang xử lý…" : "Xem trước thao tác"}
        </button>
        {preview && (
          <div className="batch-preview">
            <h3>
              {operation === "DUYET"
                ? "Kiểm tra đợt duyệt"
                : "Kiểm tra đợt gửi"}
            </h3>
            <p>
              {preview.data.so_hoa_don} hóa đơn · {preview.data.so_loi} hóa đơn
              lỗi · Tổng hợp lệ:{" "}
              <strong>{money(preview.data.tong_tien)}</strong>
            </p>
            {operation === "GUI" && (
              <p className="bill-actions-summary">
                Nhận tại <strong>{bankName(payment.ma_ngan_hang)}</strong> ·{" "}
                {payment.so_tai_khoan} · {payment.ten_nguoi_nhan}
                <br />
                Hạn trả: {payment.han_thanh_toan.split("-").reverse().join("/")}
              </p>
            )}
            {!!preview.data.so_loi && (
              <p className="note">
                Chưa xử lý hóa đơn nào. Mở hóa đơn để bổ sung/tính lại, hoặc bỏ
                hóa đơn lỗi rồi xem trước lại.
              </p>
            )}
            {!!preview.data.so_loi &&
              preview.data.so_loi < preview.data.so_hoa_don && (
                <button
                  type="button"
                  onClick={() => {
                    const valid = new Set(
                      preview.data.rows
                        .filter((r) => !r.loi.length)
                        .map((r) => r.ma_hoa_don),
                    );
                    edit();
                    setSelected((old) =>
                      old.filter((b) => valid.has(b.ma_hoa_don)),
                    );
                  }}
                >
                  Chỉ giữ hóa đơn hợp lệ
                </button>
              )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hóa đơn / căn</th>
                    <th>Kỳ / tiền</th>
                    <th>Kiểm tra</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.rows.map((r) => (
                    <tr key={r.ma_hoa_don}>
                      <td>
                        <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                          {r.so_hoa_don}
                        </Link>
                        <small>Căn {r.so_can_ho}</small>
                      </td>
                      <td>
                        {r.ky_thanh_toan}
                        <br />
                        {money(r.tong_tien)}
                      </td>
                      <td>
                        {r.loi.length ? (
                          <ul>
                            {r.loi.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        ) : (
                          "Hợp lệ"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!preview.data.so_loi && (
              <>
                <label className="batch-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  {operation === "DUYET"
                    ? "Tôi đã kiểm tra và đồng ý duyệt các hóa đơn đã chọn."
                    : "Tôi đã kiểm tra hóa đơn, hạn trả và thông tin ngân hàng chung trước khi gửi."}
                </label>
                <button
                  type="button"
                  className="primary"
                  disabled={!confirmed || !preview.data.xac_nhan}
                  onClick={() => run(true)}
                >
                  {operation === "DUYET" ? "Xác nhận duyệt" : "Xác nhận gửi"}{" "}
                  {preview.data.so_hoa_don} hóa đơn
                </button>
                <p className="muted">
                  Xem trước có hiệu lực 15 phút. Nếu lỗi mạng sau xác nhận, giữ
                  nguyên thông tin và bấm lại để lấy kết quả cũ.
                </p>
              </>
            )}
          </div>
        )}
        {result && (
          <div className="batch-result" role="status">
            <h3>
              {result.da_xu_ly_truoc
                ? "Đợt này đã được xử lý trước đó"
                : "Đã hoàn tất đợt xử lý"}
            </h3>
            <p>
              Đã {result.thao_tac === "DUYET" ? "duyệt" : "gửi"}{" "}
              {result.so_hoa_don} hóa đơn · {money(result.tong_tien)}. Mở từng
              hóa đơn để xem trạng thái hiện tại.
            </p>
            <ul>
              {result.hoa_don.map((r) => (
                <li key={r.ma_hoa_don}>
                  <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                    {r.so_hoa_don} · Căn {r.so_can_ho}
                  </Link>{" "}
                  · {money(r.tong_tien)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                edit();
                setSelected([]);
                setRevision((n) => n + 1);
              }}
            >
              Bắt đầu đợt xử lý mới
            </button>
            {result.thao_tac === "DUYET" && (
              <button type="button" onClick={() => switchOperation("GUI")}>
                Chuyển sang chọn hóa đơn để gửi
              </button>
            )}
          </div>
        )}
      </fieldset>
    </section>
  );
}
```

### 8. `frontend/src/features/billing/BatchBillActions.css`

Tạo mới.

```css
.batch-actions td {
  vertical-align: top;
}
.batch-actions td small {
  display: block;
  color: #607b70;
}
.batch-actions td:nth-child(2) {
  min-width: 145px;
}
.batch-actions th,
.batch-actions td {
  overflow-wrap: anywhere;
}
.batch-actions .actions {
  flex-wrap: wrap;
}
.bill-actions-tools {
  margin-bottom: 14px;
}
.bill-actions-payment {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
  padding: 16px;
  border-radius: 10px;
  background: #f3f7f4;
  margin-bottom: 16px;
}
.bill-actions-summary {
  border: 1px solid #bdd3c7;
  padding: 14px;
  border-radius: 9px;
  background: #f3f7f4;
  overflow-wrap: anywhere;
}
.batch-actions .batch-result button {
  margin: 4px 10px 4px 0;
}
@media (max-width: 600px) {
  .bill-actions-payment {
    grid-template-columns: 1fr;
  }
}
```

### 9. `frontend/src/features/billing/Billing.jsx`

Thay toàn bộ.

```jsx
import DataTools from "../../shared/DataTools.jsx";
import BatchBills from "./BatchBills.jsx";
import BatchBillActions from "./BatchBillActions.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { banks, bankName, bankSearch } from "./banks.js";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
// Format API decimal strings without losing precision or displaying trailing zeros.
const number = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ""));
  if (!match) return "—";
  const fraction = (match[2] || "").replace(/0+$/, "");
  return `${BigInt(match[1]).toLocaleString("vi-VN")}${fraction ? `,${fraction}` : ""}`;
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
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
        path.endsWith("/nhac_phi")
          ? r.data.da_ton_tai
            ? "Hóa đơn này đã được nhắc trên web hôm nay."
            : "Đã gửi nhắc thanh toán vào hộp thông báo trên web."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
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
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
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
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {number(tier.don_gia)} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      number(r.don_gia)
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {number(r.thue_gtgt)}%</small>
                    )}
                  </td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <DataTools
        kind="chi_so"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{number(r.chi_so_cu)}</td>
                  <td>{number(r.chi_so_moi)}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    [batchAdding, setBatchAdding] = useState(false),
    [batchProcessing, setBatchProcessing] = useState(false),
    [batchBusy, setBatchBusy] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <div className="actions">
            <button
              type="button"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setBatchProcessing(!batchProcessing);
                setBatchAdding(false);
                setAdding(false);
              }}
            >
              {batchProcessing
                ? "Đóng duyệt/gửi hàng loạt"
                : "Duyệt/gửi hàng loạt"}
            </button>
            <button
              type="button"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setBatchAdding(!batchAdding);
                setAdding(false);
                setBatchProcessing(false);
              }}
            >
              {batchAdding ? "Đóng lập hàng loạt" : "Lập hàng loạt"}
            </button>
            <button
              className="primary"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setAdding(!adding);
                setBatchAdding(false);
                setBatchProcessing(false);
              }}
            >
              {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
            </button>
          </div>
        )}
      </div>
      <Feedback action={action} />
      {batchProcessing && (
        <BatchBillActions onDone={resource.reload} onBusy={setBatchBusy} />
      )}
      {batchAdding && (
        <BatchBills onDone={resource.reload} onBusy={setBatchBusy} />
      )}
      {admin && (
        <DataTools kind="hoa_don" params={params} disabled={resource.loading} />
      )}
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function BankSelect() {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const matches = banks.filter((bank) =>
    bankSearch(`${bank.shortName} ${bank.name} ${bank.bin}`).includes(
      bankSearch(query),
    ),
  );
  const current = banks.find((bank) => bank.bin === selected);
  const option = (bank) => (
    <option key={bank.bin} value={bank.bin}>
      {bank.shortName} — {bank.name}
    </option>
  );
  return (
    <div className="bank-picker">
      <Field label="Tìm ngân hàng">
        <input
          type="search"
          value={query}
          maxLength={100}
          placeholder="Nhập tên ngân hàng, ví dụ Vietcombank"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <Field label="Ngân hàng nhận tiền">
        <select
          name="ma_ngan_hang"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Chọn ngân hàng</option>
          {current &&
            !matches.some((bank) => bank.bin === selected) &&
            option(current)}
          {matches.map(option)}
        </select>
      </Field>
      {!matches.length && (
        <p className="muted">
          Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.
        </p>
      )}
      {current && (
        <p className="bank-selection">
          Đã chọn: <strong>{current.shortName}</strong>
        </p>
      )}
    </div>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section
      className="card payment-card"
      aria-label="Thông tin thanh toán hóa đơn"
    >
      <header className="payment-header">
        <span className="payment-status">Chờ thanh toán</span>
        <h2>Chuyển khoản bằng VietQR</h2>
        <p>
          Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan}
        </p>
      </header>
      <div className="payment-body">
        <p className="payment-amount-label">Số tiền cần thanh toán</p>
        <p className="payment-amount">{money(bill.tong_tien)}</p>
        <div className="payment-qr-frame">
          <span className="payment-qr-brand">VIETQR</span>
          {image ? (
            <img
              src={image}
              alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
              width="320"
              height="320"
            />
          ) : (
            !error && <p role="status">Đang tạo mã QR…</p>
          )}
          <ErrorBox error={error} />
          <span className="payment-qr-caption">
            Quét mã bằng ứng dụng ngân hàng
          </span>
        </div>
        <dl className="payment-details">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{bankName(bill.ma_ngan_hang)}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd className="payment-account">{bill.so_tai_khoan}</dd>
          </div>
          <div>
            <dt>Người nhận</dt>
            <dd>{bill.ten_nguoi_nhan}</dd>
          </div>
          <div className="payment-reference">
            <dt>Nội dung chuyển khoản</dt>
            <dd>{bill.so_hoa_don}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{bill.han_thanh_toan?.split("-").reverse().join("/")}</dd>
          </div>
        </dl>
        {image && (
          <a
            className="button payment-download"
            href={image}
            download={`VietQR-${bill.so_hoa_don}.png`}
          >
            Tải mã QR
          </a>
        )}
        <p className="payment-notice">
          Kiểm tra người nhận, số tiền và giữ đúng nội dung chuyển khoản. Ban
          quản lý sẽ xác nhận sau khi đối soát giao dịch.
        </p>
      </div>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          <p className="muted">
            Người phụ trách thanh toán hiện tại:{" "}
            <strong>
              {bill.nguoi_phu_trach_thanh_toan || "Chưa gắn chủ hộ"}
            </strong>
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card bill-lines">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td className="bill-number">{number(l.so_luong)}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td className="bill-number">{number(l.don_gia)} đ</td>
                      <td className="bill-number bill-line-total">
                        {money(l.thanh_tien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="bill-total">Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow bill-publish">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <p className="muted">
                Chọn ngân hàng và điền thông tin nhận tiền để tạo mã thanh toán
                cho hóa đơn.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <BankSelect />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Nhắc phí và xác nhận thu tiền</h2>
              <p className="muted">
                Gửi vào hộp thông báo của tài khoản căn hộ và người phụ trách
                thanh toán hiện tại. Mỗi hóa đơn được nhắc tối đa một lần trong
                ngày.
              </p>
              <button disabled={action.pending} onClick={() => run("nhac_phi")}>
                Nhắc thanh toán trên web
              </button>
              <h3>Xác nhận thu tiền</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```
