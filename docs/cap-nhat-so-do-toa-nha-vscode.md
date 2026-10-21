# Sơ đồ tòa nhà — code đầy đủ 7 file cho VS Code

Áp dụng sau bản duyệt/gửi hóa đơn hàng loạt `2e4a153` trên nhánh `codex/auth-qr-incidents`. **Tạo mới 3 file, thay toàn bộ 4 file. Không thêm thư viện, không migration mới.** Các chức năng trước đó được giữ trong code bên dưới; không cần tải ZIP.

Đã đối chiếu đề cương của bạn: [nghiệp vụ đã có và phần còn thiếu](doi-chieu-de-cuong-1250080221.md). Bản này bổ sung một màn hình còn thiếu trong phần cấu trúc tòa nhà, không đồng nghĩa đã hoàn thành toàn bộ tài liệu đồ án hoặc nghiệm thu mọi điện thoại.

## Chức năng mới

BQL → **Sơ đồ tòa nhà** hoặc `/quan-tri/so-do-toa-nha`:

- Chọn khối → tầng → xem các thẻ căn. Tầng xếp từ trên xuống; có tầng 0.
- Tổng khối/tầng/căn/cư dân; tách số căn có người ở và căn trống. Hai cư dân cùng căn vẫn tính một căn có người ở.
- Lọc căn theo số căn và tình trạng; phân trang 20 căn, không bỏ sót các căn ngoài trang đầu.
- **Xem / sửa căn…** mở danh sách chỉ có căn đã chọn, sau đó dùng Xem/Sửa như trước. **Cư dân căn…** mở danh sách cư dân đúng căn.
- Đổi tầng/chuyển căn không tạo bản sao dữ liệu. Nhấn **Cập nhật sơ đồ** sau khi người khác thêm/sửa/chuyển cư dân. Bộ lọc giữ trong URL khi tải lại/quay lại.
- Chỉ BQL có quyền. Giao diện dùng chữ kèm màu, hỗ trợ nút bàn phím; điện thoại cuộn ngang riêng danh sách tầng.

“Trống” nghĩa là không có đợt cư trú đang mở; không quyết định tình trạng sở hữu/cho thuê hoặc có tính phí hay không. Khối/tầng lấy từ căn đã tạo nên **chưa khai báo được khối/tầng trống**, chưa có đổi tên toàn khối hay bản vẽ mặt bằng kiến trúc. Tổng hợp và danh sách đọc riêng; có người thay đổi dữ liệu thì cập nhật lại cả sơ đồ để xem số mới nhất.

## Cập nhật trên Windows

1. Lưu các thay đổi riêng, dừng frontend/backend bằng **Ctrl+C**. Giữ `.env`, `.certs`, database và thư mục ảnh/chứng từ.
2. Trong VS Code mở `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`. Tạo mới/thay đúng **7 file** phía dưới. Chỉ chép nội dung trong khối mã, không chép dấu ba backtick, không nối vào cuối file.
3. Không sửa migration 001–016. Nếu bản trước đã chạy đủ 016 thì **không cần** `npm install`, `npm run db:migrate` hoặc `npm run db:seed` cho riêng bản này.
4. Khởi động backend từ thư mục gốc:

```powershell
npm run dev:backend
```

Terminal khác giữ lệnh frontend hiện dùng, ví dụ bản HTTPS đã thiết lập:

```powershell
npm run dev:frontend:https
```

Nếu không dùng HTTPS, dùng `npm run dev:frontend` hoặc lệnh Vite LAN trước đây. Chỉ chạy một Vite trên cổng 5173. Nhấn Ctrl+F5, đăng nhập BQL rồi mở Sơ đồ tòa nhà.

Nếu cập nhật qua Git: lưu thay đổi cá nhân trước, lấy bản mới của nhánh `codex/auth-qr-incidents`. Không cần tải lại toàn bộ project. Sau khi thêm sơ đồ, không chép `App.jsx`, `Residency.jsx` hoặc service/router cư trú từ các hướng dẫn cũ đè lên vì sẽ mất phần mới.

## Thử nhanh

1. Tạo hai căn ở cùng một khối nhưng khác tầng → kiểm tra cả hai tầng xuất hiện.
2. Thêm hai cư dân vào một căn → cập nhật sơ đồ: một căn có người ở, hai cư dân; căn còn lại trống.
3. Chọn Có người ở/Trống, nhập số căn rồi Lọc; Xóa bộ lọc phải trả danh sách đầy đủ tầng.
4. Bấm Xem / sửa căn, sửa tầng → mở lại sơ đồ. Căn thuộc tầng mới, không còn ở tầng cũ; tầng không còn căn sẽ không xuất hiện.
5. Chuyển cư dân sang căn khác → cập nhật: chỉ đổi căn khi chuyển hết người. Lịch sử cũ được giữ.
6. Thử hơn 20 căn trong một tầng → Trang sau hiển thị các căn còn lại. Tải lại vẫn giữ tầng/trang.
7. Tài khoản cư dân/KTV không thấy menu và không mở được đường dẫn sơ đồ.

Hai file kiểm thử bổ sung có trong repository: `backend/test/building-map.test.js`, `e2e/building-map.spec.js`; không bắt buộc chép chúng để chạy chức năng.

## Danh sách file

Bản trong repository đã đạt **196 kiểm tra backend, 43 kịch bản E2E và build frontend**. Kiểm thử giao diện gồm 1440/375 px; bạn vẫn cần chạy lại checklist trên máy Windows và điện thoại của mình.

| STT | File | Thao tác |
|---|---|---|
| 1 | `backend/src/modules/residency/building-map.service.js` | Tạo mới |
| 2 | `backend/src/modules/residency/residency.service.js` | Thay toàn bộ |
| 3 | `backend/src/modules/residency/residency.routes.js` | Thay toàn bộ |
| 4 | `frontend/src/features/residency/BuildingMap.css` | Tạo mới |
| 5 | `frontend/src/features/residency/BuildingMap.jsx` | Tạo mới |
| 6 | `frontend/src/features/residency/Residency.jsx` | Thay toàn bộ |
| 7 | `frontend/src/app/App.jsx` | Thay toàn bộ |

## 1. backend/src/modules/residency/building-map.service.js

Tạo mới.

```js
import { pool, rows } from "../../lib/db.js";

// One statement gives a consistent view of apartments and their active stays.
// Aggregate stays first so a household of five still counts as ONE apartment.
export async function buildingMap() {
  const floors = await rows(
    pool,
    `SELECT b.khoi,c.tang,COUNT(*) AS so_can_ho,
      SUM(CASE WHEN COALESCE(l.so_cu_dan,0)>0 THEN 1 ELSE 0 END) AS co_nguoi_o,
      SUM(COALESCE(l.so_cu_dan,0)) AS so_cu_dan
     FROM can_ho c
     JOIN (SELECT MIN(khoi) AS khoi FROM can_ho GROUP BY khoi) b ON b.khoi=c.khoi
     LEFT JOIN (
       SELECT ma_can_ho,COUNT(*) AS so_cu_dan FROM lich_su_cu_tru
       WHERE den_ngay IS NULL GROUP BY ma_can_ho
     ) l ON l.ma_can_ho=c.ma_can_ho
     GROUP BY b.khoi,c.tang ORDER BY b.khoi,c.tang DESC`,
  );
  const blocks = new Map();
  const total = {
    so_khoi: 0,
    so_tang: 0,
    so_can_ho: 0,
    co_nguoi_o: 0,
    trong: 0,
    so_cu_dan: 0,
  };
  for (const row of floors) {
    const floor = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        key === "khoi" ? value : Number(value),
      ]),
    );
    floor.trong = floor.so_can_ho - floor.co_nguoi_o;
    if (!blocks.has(row.khoi)) {
      blocks.set(row.khoi, {
        khoi: row.khoi,
        so_can_ho: 0,
        co_nguoi_o: 0,
        trong: 0,
        so_cu_dan: 0,
        tang: [],
      });
    }
    const block = blocks.get(row.khoi);
    block.tang.push(floor);
    for (const key of ["so_can_ho", "co_nguoi_o", "trong", "so_cu_dan"]) {
      block[key] += floor[key];
      total[key] += floor[key];
    }
    total.so_tang++;
  }
  total.so_khoi = blocks.size;
  return { data: { tong: total, khoi: [...blocks.values()] } };
}
```

## 2. backend/src/modules/residency/residency.service.js

Thay toàn bộ.

```js
import { reportPage } from "../report-exports/report-files.js";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
import { lockApartment } from "../billing/billing.guards.js";
import {
  finishStayVehicles,
  carryStayVehicles,
} from "../vehicles/vehicles.service.js";

import {
  accountForApartment,
  ensureApartmentAccount,
  assignHouseholder,
  releaseHouseholder,
  ownerPhoneChanged,
} from "./apartment-accounts.service.js";

function search(query) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  return { q: `%${q}%`, page, offset: (page - 1) * 20 };
}
function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Dữ liệu đã thay đổi. Hãy tải lại trước khi sửa.",
    );
}
async function one(db, table, key, id, lock = false) {
  // table/key are internal constants, never request parameters.
  const [row] = await rows(
    db,
    `SELECT * FROM ${table} WHERE ${key}=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hồ sơ hoặc căn hộ.");
  return row;
}
async function checkAccount(db, id, previous) {
  if (id === null) return;
  const account = await one(db, "nguoi_dung", "ma_nguoi_dung", id, true);
  if (
    account.ma_can_ho_thanh_toan !== null ||
    account.vai_tro !== "CU_DAN" ||
    (!account.dang_hoat_dong && id !== previous)
  )
    fail(422, "INVALID_ACCOUNT", "Chỉ gắn tài khoản cư dân đang hoạt động.");
}

export async function listApartments(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  const conditions = ["(so_can_ho LIKE ? OR khoi LIKE ?)"];
  const values = [q, q];
  if (query.khoi !== undefined && query.khoi !== "") {
    conditions.push("khoi=?");
    values.push(text(query.khoi, "khoi", 1, 10));
  }
  if (query.ma_can_ho !== undefined && query.ma_can_ho !== "") {
    conditions.push("ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.trang_thai !== undefined && query.trang_thai !== "") {
    const status = choice(query.trang_thai, "trang_thai", ["DANG_O", "TRONG"]);
    conditions.push(
      `${status === "TRONG" ? "NOT " : ""}EXISTS (SELECT 1 FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL)`,
    );
  }
  if (query.tang !== undefined && query.tang !== "") {
    const floor = integer(query.tang, "tang");
    if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
    conditions.push("tang=?");
    values.push(floor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM can_ho c ${where}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function availableAccounts(query) {
  const { q, page, offset } = search(query);
  const where = `WHERE u.vai_tro='CU_DAN' AND u.dang_hoat_dong=1 AND u.ma_can_ho_thanh_toan IS NULL
    AND (u.ho_va_ten LIKE ? OR u.so_dien_thoai LIKE ?)
    AND NOT EXISTS (SELECT 1 FROM cu_dan c WHERE c.ma_nguoi_dung=u.ma_nguoi_dung)`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM nguoi_dung u ${where}`,
    [q, q],
  );
  const data = await rows(
    pool,
    `SELECT u.ma_nguoi_dung,u.ho_va_ten,u.so_dien_thoai FROM nguoi_dung u ${where} ORDER BY u.ho_va_ten,u.ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
    [q, q],
  );
  return { data, total: count.total, page };
}
export async function apartmentDetail(id) {
  const data = await one(pool, "can_ho", "ma_can_ho", id);
  const residents = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,c.so_dien_thoai,l.quan_he,l.tu_ngay FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE l.ma_can_ho=? AND l.den_ngay IS NULL ORDER BY c.ho_va_ten`,
    [id],
  );
  return {
    ...data,
    residents,
    tai_khoan_can_ho: await accountForApartment(id),
    lich_su_ban_giao: await rows(
      pool,
      "SELECT b.*,u.ho_va_ten AS nguoi_thuc_hien FROM lich_su_ban_giao_can_ho b JOIN nguoi_dung u ON u.ma_nguoi_dung=b.ma_nguoi_thuc_hien WHERE b.ma_can_ho=? ORDER BY b.ma_ban_giao DESC LIMIT 50",
      [id],
    ),
  };
}
export async function saveApartment(id, body, user, connection = null) {
  const values = valid.apartment(body);
  return transaction(async (db) => {
    if (id) {
      const current = await one(db, "can_ho", "ma_can_ho", id, true);
      version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE can_ho SET so_can_ho=?,khoi=?,tang=?,dien_tich_m2=?,tinh_phi_dich_vu=?,phien_ban=phien_ban+1 WHERE ma_can_ho=?",
        [...values, id],
      );
    } else {
      const result = await rows(
        db,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,?,?,?)",
        values,
      );
      id = result.insertId;
    }
    const apartment = await one(db, "can_ho", "ma_can_ho", id);
    const created = await ensureApartmentAccount(db, apartment, user);
    return {
      ...apartment,
      tai_khoan_can_ho:
        created.credentials || (await accountForApartment(id, db)),
    };
  }, connection);
}

const residentJoin = `FROM cu_dan c LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL LEFT JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho`;
export async function listResidents(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  const conditions = ["(c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ?)"];
  const values = [q, q];
  if (query.ma_can_ho) {
    conditions.push("l.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ma_cu_dan) {
    conditions.push("c.ma_cu_dan=?");
    values.push(integer(query.ma_cu_dan, "ma_cu_dan"));
  }
  if (query.trang_thai === "DANG_O") conditions.push("l.ma_can_ho IS NOT NULL");
  else if (query.trang_thai === "DA_CHUYEN_DI")
    conditions.push("l.ma_can_ho IS NULL");
  else if (query.trang_thai)
    fail(422, "INVALID_STATUS", "Bộ lọc cư trú không hợp lệ.");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${residentJoin} ${where}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*,l.ma_lich_su_cu_tru,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function residentDetail(id) {
  const resident = await one(pool, "cu_dan", "ma_cu_dan", id);
  const history = await rows(
    pool,
    `SELECT l.*,a.so_can_ho,u.ho_va_ten AS nguoi_ghi_nhan FROM lich_su_cu_tru l JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi_nhan WHERE l.ma_cu_dan=? ORDER BY l.tu_ngay DESC,l.ma_lich_su_cu_tru DESC`,
    [id],
  );
  return {
    ...resident,
    history,
    tai_khoan_can_ho:
      (
        await rows(
          pool,
          "SELECT ma_can_ho_thanh_toan,ten_dang_nhap,dang_hoat_dong FROM nguoi_dung WHERE ma_cu_dan_phu_trach=?",
          [id],
        )
      )[0] || null,
  };
}
export async function saveResident(id, body, user, connection = null) {
  const values = valid.resident(body);
  const initialStay = id ? null : valid.stay(body);
  return transaction(async (db) => {
    let previousAccount = null,
      previousPhone = null,
      credentials = null;
    if (id) {
      const current = await one(db, "cu_dan", "ma_cu_dan", id, true);
      version(current, body.phien_ban);
      previousAccount = current.ma_nguoi_dung;
      previousPhone = current.so_dien_thoai;
    }
    await checkAccount(db, values[2], previousAccount);
    if (id) {
      await rows(
        db,
        "UPDATE cu_dan SET ho_va_ten=?,so_dien_thoai=?,ma_nguoi_dung=?,phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
        [...values, id],
      );
      if (previousPhone !== values[1]) await ownerPhoneChanged(db, id, user);
    } else {
      const apartment = await lockApartment(db, initialStay[0]);
      const result = await rows(
        db,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES (?,?,?)",
        values,
      );
      id = result.insertId;
      await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...initialStay, user.ma_nguoi_dung],
      );
      if (initialStay[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          apartment,
          id,
          user,
          body.xac_nhan_ban_giao,
        );
    }
    return {
      ...(await one(db, "cu_dan", "ma_cu_dan", id)),
      tai_khoan_can_ho: credentials,
    };
  }, connection);
}

export async function changeStay(id, action, body, user) {
  const day = valid.date(body.ngay);
  const next = action === "chuyen_di" ? null : valid.stay(body);
  if (
    body.chuyen_phuong_tien !== undefined &&
    typeof body.chuyen_phuong_tien !== "boolean"
  )
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Lựa chọn chuyển xe cần là có hoặc không.",
    );
  if (body.chuyen_phuong_tien && action !== "chuyen_can")
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Chỉ chuyển đăng ký xe khi chuyển căn.",
    );
  return transaction(async (db) => {
    const resident = await one(db, "cu_dan", "ma_cu_dan", id, true);
    version(resident, body.phien_ban);
    const history = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? ORDER BY tu_ngay DESC,ma_lich_su_cu_tru DESC FOR UPDATE",
      [id],
    );
    const current = history.find((stay) => stay.den_ngay === null);
    if (action === "nhap_cu") {
      if (current)
        fail(
          409,
          "ALREADY_RESIDENT",
          "Cư dân đang ở một căn hộ. Hãy dùng Chuyển căn.",
        );
      if (history.some((stay) => !stay.den_ngay || stay.den_ngay > day))
        fail(
          422,
          "OVERLAPPING_STAY",
          "Ngày nhập cư phải từ ngày kết thúc đợt cư trú gần nhất.",
        );
    } else {
      if (!current)
        fail(409, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi. Hãy tải lại hồ sơ.");
      if (day < current.tu_ngay)
        fail(
          422,
          "INVALID_END_DATE",
          "Ngày chuyển không được trước ngày bắt đầu đợt cư trú hiện tại.",
        );
      if (next && next[0] === current.ma_can_ho)
        fail(422, "SAME_APARTMENT", "Cần chọn căn hộ khác để chuyển căn.");
    }
    if (next) await one(db, "can_ho", "ma_can_ho", next[0]);
    for (const apartmentId of [
      ...new Set([current?.ma_can_ho, next?.[0]].filter(Boolean)),
    ].sort((a, b) => a - b))
      await lockApartment(db, apartmentId);
    const vehicles = current
      ? await finishStayVehicles(
          db,
          current.ma_lich_su_cu_tru,
          day,
          user.ma_nguoi_dung,
          action === "chuyen_can" ? "Chuyển căn" : "Chuyển đi",
        )
      : [];
    if (current) await releaseHouseholder(db, current.ma_can_ho, id, user);
    if (current)
      await rows(
        db,
        "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
        [day, current.ma_lich_su_cu_tru],
      );
    let credentials = null;
    if (next) {
      const inserted = await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...next, user.ma_nguoi_dung],
      );
      if (next[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          await one(db, "can_ho", "ma_can_ho", next[0]),
          id,
          user,
          body.xac_nhan_ban_giao,
        );
      if (body.chuyen_phuong_tien)
        await carryStayVehicles(
          db,
          vehicles,
          { ma_can_ho: next[0], ma_lich_su_cu_tru: inserted.insertId },
          day,
          user.ma_nguoi_dung,
        );
    }
    await rows(
      db,
      "UPDATE cu_dan SET phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
      [id],
    );
    return {
      ma_cu_dan: id,
      phien_ban: resident.phien_ban + 1,
      tai_khoan_can_ho: credentials,
    };
  });
}
```

## 3. backend/src/modules/residency/residency.routes.js

Thay toàn bộ.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./residency.service.js";
import { buildingMap } from "./building-map.service.js";

import {
  manageApartmentAccount,
  listApartmentAccounts,
} from "./apartment-accounts.service.js";

export const apartmentsRouter = Router(),
  residentsRouter = Router();
for (const router of [apartmentsRouter, residentsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));

apartmentsRouter.get("/", async (req, res) =>
  res.json(await service.listApartments(req.query)),
);
apartmentsRouter.get("/tai_khoan", async (req, res) =>
  res.json(await listApartmentAccounts(req.query)),
);
apartmentsRouter.get("/so_do", async (req, res) =>
  res.json(await buildingMap()),
);
apartmentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.apartmentDetail(integer(req.params.id, "id")),
  }),
);
apartmentsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveApartment(null, req.body, req.user) }),
);
apartmentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveApartment(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);

residentsRouter.get("/tai_khoan", async (req, res) =>
  res.json(await service.availableAccounts(req.query)),
);
residentsRouter.get("/", async (req, res) =>
  res.json(await service.listResidents(req.query)),
);
residentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.residentDetail(integer(req.params.id, "id")),
  }),
);
residentsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveResident(null, req.body, req.user) }),
);
residentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveResident(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
for (const action of ["chuyen_can", "chuyen_di", "nhap_cu"])
  residentsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.changeStay(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );

apartmentsRouter.post("/:id/tai_khoan", async (req, res) =>
  res.json({
    data: await manageApartmentAccount(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
```

## 4. frontend/src/features/residency/BuildingMap.css

Tạo mới.

```css
.building-map {
  min-width: 0;
}
.building-map-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 12px;
}
.building-map-stats > div {
  padding: 16px;
  background: white;
  border: 1px solid #dae6e2;
  border-radius: 12px;
}
.building-map-stats dt {
  color: #526e6b;
  font-size: 0.9rem;
}
.building-map-stats dd {
  margin: 8px 0 0;
  font-size: 1.6rem;
  font-weight: 750;
  color: #163f3b;
}
.building-map-blocks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0 18px;
}
.building-map-blocks button,
.building-map-floors button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  text-align: left;
}
.building-map button[aria-pressed="true"] {
  background: #e4f2eb;
  border-color: #16665e;
  box-shadow: inset 0 0 0 1px #16665e;
  color: #124c46;
}
.building-map-blocks span,
.building-map-floors span {
  font-size: 0.85rem;
  font-weight: 400;
}
.building-map-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.building-map-floors nav {
  display: grid;
  gap: 10px;
  max-height: 560px;
  overflow: auto;
  padding: 3px;
}
.building-map .card {
  min-width: 0;
  margin: 0;
}
.building-map .filters {
  align-items: end;
}
.building-map-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}
.building-map-tile {
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 18px;
  border: 1px solid #d6e5e0;
  border-top: 4px solid #237a68;
  border-radius: 12px;
  background: #f7fbf9;
}
.building-map-tile.vacant {
  border-top-color: #869a96;
  background: #fafbfb;
}
.building-map-tile h3 {
  margin: 0 0 10px;
}
.building-map-tile p {
  margin: 8px 0;
  font-size: 0.9rem;
}
.building-map-state {
  font-weight: 650;
}
.building-map-tile a {
  display: block;
  padding: 8px 0;
}
.building-map-pager {
  margin-top: 20px;
}
@media (max-width: 1100px) {
  .building-map-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .building-map-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .building-map-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .building-map-floors nav {
    display: flex;
    overflow-x: auto;
    max-height: none;
  }
  .building-map-floors button {
    flex: 0 0 auto;
  }
  .building-map-tiles {
    grid-template-columns: minmax(0, 1fr);
  }
  .building-map .filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .building-map-blocks button {
    flex: 1 1 130px;
  }
}
```

## 5. frontend/src/features/residency/BuildingMap.jsx

Tạo mới.

```jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import "./BuildingMap.css";

// Associate results with the current path/revision; old floors never flash when
// filters change, and a slow response cannot overwrite the latest selection.
function useMapData(path, revision) {
  const key = JSON.stringify([path, revision]);
  const [state, setState] = useState({});
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState({ key, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ key, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key, error, loading: false });
      });
    return () => controller.abort();
  }, [path, key]);
  if (!path) return { loading: false };
  return state.key === key ? state : { loading: true };
}

const number = (value) => Number(value).toLocaleString("vi-VN");
const states = {
  "": "Tất cả tình trạng",
  DANG_O: "Có người ở",
  TRONG: "Trống",
};

export default function BuildingMap() {
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const summary = useMapData("/can_ho/so_do", revision);
  const data = summary.result?.data;
  const block = params.has("khoi")
    ? data?.khoi.find((item) => item.khoi === params.get("khoi"))
    : data?.khoi[0];
  const floor = params.has("tang")
    ? block?.tang.find((item) => String(item.tang) === params.get("tang"))
    : block?.tang[0];
  const filters = new URLSearchParams({
    khoi: block?.khoi || "",
    tang: String(floor?.tang ?? ""),
    trang_thai: params.get("trang_thai") || "",
    q: params.get("q") || "",
    page: params.get("page") || "1",
  });
  const apartments = useMapData(floor ? `/can_ho?${filters}` : null, revision);
  function choose(next) {
    const changed = new URLSearchParams(params);
    changed.delete("page");
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") changed.delete(key);
      else changed.set(key, String(value));
    }
    setParams(changed);
  }
  return (
    <div className="building-map">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CẤU TRÚC TÒA NHÀ</p>
          <h1>Sơ đồ tòa nhà</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/quan-tri/can-ho">
            Quản lý căn hộ
          </Link>
          <button
            onClick={() => setRevision((value) => value + 1)}
            disabled={summary.loading}
          >
            Cập nhật sơ đồ
          </button>
        </div>
      </div>
      <p>
        Sơ đồ phân cấp khối → tầng → căn hộ, được cập nhật từ danh sách căn hộ
        và các đợt cư trú đang mở.
      </p>
      {summary.loading && <Loading />}
      <ErrorBox error={summary.error} />
      {data && (
        <>
          <dl className="building-map-stats" aria-label="Tổng hợp tòa nhà">
            {[
              ["Khối", data.tong.so_khoi],
              ["Tầng trong các khối", data.tong.so_tang],
              ["Căn hộ", data.tong.so_can_ho],
              ["Có người ở", data.tong.co_nguoi_o],
              ["Trống", data.tong.trong],
              ["Cư dân đang ở", data.tong.so_cu_dan],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{number(value)}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            “Trống” nghĩa là chưa có cư dân đang ở trong hệ thống; không thể
            hiện tình trạng mua bán, cho thuê hoặc miễn phí dịch vụ. Chỉ hiển
            thị khối và tầng đã có căn hộ.
          </p>
          {!data.khoi.length ? (
            <section className="card">
              <h2>Chưa có căn hộ để lập sơ đồ</h2>
              <Link to="/quan-tri/can-ho">Thêm căn hộ đầu tiên</Link>
            </section>
          ) : (
            <>
              <nav className="building-map-blocks" aria-label="Chọn khối">
                {data.khoi.map((item) => (
                  <button
                    key={item.khoi}
                    type="button"
                    aria-pressed={block?.khoi === item.khoi}
                    onClick={() => choose({ khoi: item.khoi, tang: null })}
                  >
                    <strong>Khối {item.khoi}</strong>
                    <span>
                      {number(item.so_can_ho)} căn · {number(item.trong)} trống
                    </span>
                  </button>
                ))}
              </nav>
              {!block ? (
                <div className="card" role="status">
                  Khối trong liên kết không còn trên sơ đồ. Hãy chọn khối khác.
                </div>
              ) : (
                <div className="building-map-layout">
                  <section
                    className="card building-map-floors"
                    aria-label={`Các tầng khối ${block.khoi}`}
                  >
                    <h2>Khối {block.khoi}</h2>
                    <p>
                      {number(block.tang.length)} tầng ·{" "}
                      {number(block.so_cu_dan)} cư dân đang ở
                    </p>
                    <nav aria-label="Chọn tầng">
                      {block.tang.map((item) => (
                        <button
                          key={item.tang}
                          type="button"
                          aria-pressed={floor?.tang === item.tang}
                          onClick={() =>
                            choose({ khoi: block.khoi, tang: item.tang })
                          }
                        >
                          <strong>Tầng {item.tang}</strong>
                          <span>
                            {number(item.so_can_ho)} căn · {number(item.trong)}{" "}
                            trống
                          </span>
                        </button>
                      ))}
                    </nav>
                  </section>
                  <section
                    className="card building-map-rooms"
                    aria-label="Căn hộ trên sơ đồ"
                  >
                    {!floor ? (
                      <p role="status">
                        Tầng trong liên kết không còn thuộc khối này. Hãy chọn
                        tầng khác.
                      </p>
                    ) : (
                      <>
                        <h2>
                          Khối {block.khoi} · Tầng {floor.tang}
                        </h2>
                        <p>
                          {number(floor.so_can_ho)} căn ·{" "}
                          {number(floor.co_nguoi_o)} có người ở ·{" "}
                          {number(floor.trong)} trống
                        </p>
                        <form
                          className="filters"
                          key={`${block.khoi}:${floor.tang}:${params.get("q") || ""}:${params.get("trang_thai") || ""}`}
                          onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            choose({
                              khoi: block.khoi,
                              tang: floor.tang,
                              q: String(form.get("q")).trim(),
                              trang_thai: form.get("trang_thai"),
                            });
                          }}
                        >
                          <Field
                            label="Tìm căn hộ trong tầng"
                            name="q"
                            defaultValue={params.get("q") || ""}
                            maxLength={100}
                          />
                          <Field label="Tình trạng cư trú">
                            <select
                              name="trang_thai"
                              defaultValue={params.get("trang_thai") || ""}
                            >
                              {Object.entries(states).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <button>Lọc căn hộ</button>
                          <button
                            type="button"
                            onClick={() =>
                              choose({ q: null, trang_thai: null })
                            }
                          >
                            Xóa bộ lọc
                          </button>
                        </form>
                        {apartments.loading && <Loading />}
                        <ErrorBox error={apartments.error} />
                        {apartments.result && (
                          <>
                            <p role="status">
                              {number(apartments.result.total)} căn phù hợp ·
                              Trang {apartments.result.page}
                            </p>
                            <div className="building-map-tiles">
                              {apartments.result.data.map((item) => (
                                <article
                                  key={item.ma_can_ho}
                                  className={`building-map-tile ${item.so_cu_dan > 0 ? "occupied" : "vacant"}`}
                                >
                                  <h3>Căn {item.so_can_ho}</h3>
                                  <p className="building-map-state">
                                    {item.so_cu_dan > 0
                                      ? `Có người ở · ${number(item.so_cu_dan)} cư dân`
                                      : "Trống"}
                                  </p>
                                  <p>
                                    {number(item.dien_tich_m2)} m² ·{" "}
                                    {item.tinh_phi_dich_vu
                                      ? "Tính phí dịch vụ"
                                      : "Không tính phí dịch vụ"}
                                  </p>
                                  <Link
                                    to={`/quan-tri/can-ho?ma_can_ho=${item.ma_can_ho}`}
                                  >
                                    Xem / sửa căn {item.so_can_ho}
                                  </Link>
                                  <Link
                                    to={`/quan-tri/cu-dan?ma_can_ho=${item.ma_can_ho}&so=${encodeURIComponent(item.so_can_ho)}`}
                                  >
                                    Cư dân căn {item.so_can_ho}
                                  </Link>
                                </article>
                              ))}
                            </div>
                            {!apartments.result.total && (
                              <p>
                                Không có căn hộ phù hợp. Thử xóa bộ lọc hoặc
                                chọn tầng khác.
                              </p>
                            )}
                            <div className="actions building-map-pager">
                              <button
                                disabled={apartments.result.page <= 1}
                                onClick={() =>
                                  choose({ page: apartments.result.page - 1 })
                                }
                              >
                                Trang trước
                              </button>
                              <button
                                disabled={
                                  apartments.result.page * 20 >=
                                  apartments.result.total
                                }
                                onClick={() =>
                                  choose({ page: apartments.result.page + 1 })
                                }
                              >
                                Trang sau
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
```

## 6. frontend/src/features/residency/Residency.jsx

Thay toàn bộ.

```jsx
import DataTools from "../../shared/DataTools.jsx";
import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const relations = {
  CHU_HO: "Chủ hộ",
  THANH_VIEN: "Thành viên",
  NGUOI_THUE: "Người thuê",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const values = (event) => Object.fromEntries(new FormData(event.currentTarget));
const displayDay = (day) => day.split("-").reverse().join("/");

function ResidentCode({ value, label = false }) {
  const [notice, setNotice] = useState("");
  async function copy() {
    const code = String(value);
    let copied = false;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        /* Use the LAN-compatible fallback below. */
      }
    }
    if (!copied) {
      const previous = document.activeElement,
        input = document.createElement("textarea");
      input.value = code;
      input.readOnly = true;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      try {
        input.focus();
        input.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        input.remove();
        previous?.focus?.({ preventScroll: true });
      }
    }
    setNotice(
      copied
        ? `Đã sao chép mã ${code}.`
        : "Chưa sao chép được. Hãy bôi đen mã số và sao chép thủ công.",
    );
  }
  return (
    <div className="resident-code">
      {label && <span>Mã cư dân:</span>}
      <code>{value}</code>
      <button
        type="button"
        aria-label={`Sao chép mã cư dân ${value}`}
        onClick={copy}
      >
        Sao chép
      </button>
      {notice && <small role="status">{notice}</small>}
    </div>
  );
}

function Pager({ resource }) {
  const [params, setParams] = useSearchParams();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(next) {
    const p = new URLSearchParams(params);
    p.set("page", String(next));
    setParams(p);
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
        Trang {page} · {total} hồ sơ
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
function useChange(reload) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(),
    [credentials, setCredentials] = useState(null);
  async function change(path, method, body, done) {
    setPending(true);
    setError(null);
    setCredentials(null);
    try {
      const result = await getJson(path, { method, body });
      const fresh = result.data?.tai_khoan_can_ho || result.data;
      if (fresh?.mat_khau_tam_thoi) setCredentials(fresh);
      done?.(result.data);
      reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    change,
    credentials,
    clearCredentials: () => setCredentials(null),
  };
}
function Credentials({ action }) {
  const account = action.credentials;
  return (
    account && (
      <section className="card" aria-label="Thông tin bàn giao tài khoản">
        <h2>Thông tin đăng nhập tài khoản căn hộ</h2>
        <p>
          Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong>
        </p>
        {account.dien_thoai_phu_trach && (
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach}</strong>
          </p>
        )}
        <p>
          Mật khẩu mới:{" "}
          <code style={{ overflowWrap: "anywhere" }}>
            {account.mat_khau_tam_thoi}
          </code>
        </p>
        <p>
          {account.nguoi_phu_trach
            ? `Bàn giao cho: ${account.nguoi_phu_trach}.`
            : "Chưa gắn cư dân phụ trách."}{" "}
          Mật khẩu chỉ hiển thị lần này. Chủ hộ nên đổi mật khẩu tại mục Tài
          khoản sau khi nhận.
        </p>
        <button onClick={action.clearCredentials}>
          Đã lưu thông tin, ẩn mật khẩu
        </button>
      </section>
    )
  );
}
export function ApartmentAccount({ id, onChange }) {
  const resource = useResource(`/can_ho/${id}`);
  const action = useChange(() => {
      resource.reload();
      onChange?.();
    }),
    apartment = resource.result?.data,
    account = apartment?.tai_khoan_can_ho;
  const owners = (apartment?.residents || []).filter(
    (r) => r.quan_he === "CHU_HO",
  );
  return (
    <section className="card">
      <h2>Tài khoản thanh toán căn hộ</h2>
      {apartment && <p>Căn {apartment.so_can_ho}</p>}
      <Credentials action={action} />
      {resource.loading && <Loading />}
      <ErrorBox error={action.error || resource.error} />
      {account ? (
        <>
          <p>
            Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong> ·{" "}
            {account.dang_hoat_dong ? "Đang hoạt động" : "Đang khóa"}
          </p>
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach || "Chưa gắn chủ hộ"}</strong>
          </p>
          <p>
            Người phụ trách:{" "}
            {account.ma_cu_dan_phu_trach ? (
              <Link to={`/quan-tri/cu-dan/${account.ma_cu_dan_phu_trach}`}>
                {account.nguoi_phu_trach}
              </Link>
            ) : (
              "Chưa gắn cư dân"
            )}
          </p>
          <p className="note">
            Tài khoản đi theo căn hộ và xem các hóa đơn đã gửi của căn. Bàn giao
            hoặc cấp lại mật khẩu sẽ ngắt mọi phiên cũ. Khi người phụ trách
            chuyển đi, tài khoản tạm khóa đến khi BQL bàn giao/cấp lại.
          </p>
          <button
            disabled={action.pending}
            onClick={() =>
              action.change(
                `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                "POST",
                {
                  thao_tac: "cap_lai_mat_khau",
                  phien_ban_ban_giao: account.phien_ban_ban_giao,
                },
              )
            }
          >
            Cấp lại mật khẩu và ngắt phiên cũ
          </button>
          {owners.some((r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const body = values(e);
                body.thao_tac = "ban_giao";
                body.phien_ban_ban_giao = account.phien_ban_ban_giao;
                body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                action.change(
                  `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                  "POST",
                  body,
                );
              }}
            >
              <fieldset disabled={action.pending}>
                <h3>Bàn giao người phụ trách</h3>
                <Field label="Chủ hộ nhận tài khoản">
                  <select name="ma_cu_dan" required defaultValue="">
                    <option value="">Chọn chủ hộ đang ở</option>
                    {owners
                      .filter(
                        (r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach,
                      )
                      .map((r) => (
                        <option key={r.ma_cu_dan} value={r.ma_cu_dan}>
                          {r.ho_va_ten} · {r.so_dien_thoai}
                        </option>
                      ))}
                  </select>
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="xac_nhan_ban_giao"
                    value="1"
                    required={!!account.ma_cu_dan_phu_trach}
                  />
                  Xác nhận bàn giao và đổi mật khẩu tài khoản căn hộ
                </label>
                <button className="primary">Bàn giao tài khoản</button>
              </fieldset>
            </form>
          )}
        </>
      ) : (
        <p>
          Tài khoản chưa được khởi tạo. Hãy chạy migration mới nhất và tải lại.
        </p>
      )}
      {apartment?.lich_su_ban_giao?.length > 0 && (
        <details>
          <summary>Lịch sử bàn giao tài khoản</summary>
          <ul>
            {apartment.lich_su_ban_giao.map((row) => (
              <li key={row.ma_ban_giao}>
                {row.ngay_thuc_hien} ·{" "}
                {
                  {
                    TAO_TAI_KHOAN: "Tạo tài khoản",
                    BAN_GIAO_CHU_HO: "Bàn giao chủ hộ",
                    CAP_LAI_MAT_KHAU: "Cấp lại mật khẩu",
                    NGUNG_PHU_TRACH: "Ngừng phụ trách",
                    DOI_SO_DIEN_THOAI: "Đổi số điện thoại đăng nhập",
                  }[row.su_kien]
                }{" "}
                · {row.nguoi_thuc_hien}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function Apartments() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/can_ho?${params}`);
  const [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null);
  const action = useChange(() => {
    resource.reload();
    setSelected(null);
  });
  return (
    <>
      <h1>Căn hộ</h1>
      <Link className="button" to="/quan-tri/so-do-toa-nha">
        Xem sơ đồ tòa nhà
      </Link>
      {params.has("ma_can_ho") && (
        <p>
          Đang xem căn hộ được chọn từ sơ đồ.{" "}
          <Link to="/quan-tri/can-ho">Xem toàn bộ căn hộ</Link>
        </p>
      )}
      <DataTools
        kind="can_ho"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>Trạng thái có người ở được xác định từ các đợt cư trú đang mở.</p>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số căn hộ hoặc khối"
          name="q"
          defaultValue={params.get("q") || ""}
          maxLength={100}
        />
        <Field
          label="Tầng (tùy chọn)"
          name="tang"
          type="number"
          min={0}
          max={200}
          defaultValue={params.get("tang") || ""}
        />
        <button>Tìm kiếm</button>
      </form>
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      <div className="detail-grid">
        <section className="card">
          <h2>Danh sách căn hộ</h2>
          {resource.loading && <Loading />}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Căn hộ</th>
                  <th>Khối / tầng</th>
                  <th>Diện tích</th>
                  <th>Cư dân</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((a) => (
                  <tr key={a.ma_can_ho}>
                    <td>{a.so_can_ho}</td>
                    <td>
                      {a.khoi} / {a.tang}
                    </td>
                    <td>{a.dien_tich_m2} m²</td>
                    <td>{a.so_cu_dan ? `${a.so_cu_dan} đang ở` : "Trống"}</td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            action.clearCredentials();
                            setSelected(a.ma_can_ho);
                          }}
                        >
                          Xem
                        </button>
                        <button
                          disabled={action.pending}
                          onClick={() => setEditing(a)}
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!resource.loading && resource.result?.total === 0 && (
            <p>Chưa có căn hộ phù hợp.</p>
          )}
          <Pager resource={resource} />
        </section>
        <section className="card">
          <h2>{editing ? `Sửa căn ${editing.so_can_ho}` : "Thêm căn hộ"}</h2>
          <form
            key={editing?.ma_can_ho || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                body = values(e);
              body.tinh_phi_dich_vu = body.tinh_phi_dich_vu === "1";
              if (editing) body.phien_ban = editing.phien_ban;
              action.change(
                `/can_ho${editing ? `/${editing.ma_can_ho}` : ""}`,
                editing ? "PATCH" : "POST",
                body,
                () => {
                  form.reset();
                  setEditing(null);
                },
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <Field
                label="Số căn hộ"
                name="so_can_ho"
                required
                maxLength={20}
                defaultValue={editing?.so_can_ho || ""}
              />
              <div className="form-grid">
                <Field
                  label="Khối"
                  name="khoi"
                  required
                  maxLength={10}
                  defaultValue={editing?.khoi || ""}
                />
                <Field
                  label="Tầng"
                  name="tang"
                  type="number"
                  required
                  min={0}
                  max={200}
                  defaultValue={editing?.tang ?? 1}
                />
              </div>
              <Field
                label="Diện tích (m²)"
                name="dien_tich_m2"
                type="number"
                required
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={editing?.dien_tich_m2 || ""}
              />
              <Field label="Tính phí dịch vụ">
                <select
                  name="tinh_phi_dich_vu"
                  defaultValue={editing?.tinh_phi_dich_vu === 0 ? "0" : "1"}
                >
                  <option value="1">Có</option>
                  <option value="0">Không</option>
                </select>
              </Field>
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu căn hộ"}
              </button>
            </fieldset>
          </form>
          {editing && (
            <button disabled={action.pending} onClick={() => setEditing(null)}>
              Hủy sửa
            </button>
          )}
        </section>
      </div>
      {selected && <ApartmentResidents id={selected} />}
    </>
  );
}
function ApartmentResidents({ id: selected }) {
  const detail = useResource(`/can_ho/${selected}`);
  return (
    <section className="card">
      {detail.loading && <Loading />}
      <ErrorBox error={detail.error} />
      <ApartmentAccount id={selected} key={selected} />
      {detail.result && (
        <>
          <h2>Cư dân căn {detail.result.data.so_can_ho}</h2>
          <Link
            className="button"
            to={`/quan-tri/cu-dan?ma_can_ho=${selected}&so=${encodeURIComponent(detail.result.data.so_can_ho)}`}
          >
            Thêm hoặc xem cư dân căn này
          </Link>
          <ul>
            {detail.result.data.residents.map((r) => (
              <li key={r.ma_cu_dan}>
                <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                  {r.ho_va_ten}
                </Link>{" "}
                · {r.so_dien_thoai} · {relations[r.quan_he]} · Từ {r.tu_ngay}
              </li>
            ))}
          </ul>
          {!detail.result.data.residents.length && (
            <p>Chưa có cư dân đang ở.</p>
          )}
        </>
      )}
    </section>
  );
}

function ApartmentPicker({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`);
  const apartments = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập số căn hộ hoặc khối"
        />
      </Field>
      {resource.loading && <Loading />}
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
          {id && !apartments.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn hộ #${id}`}</option>
          )}
          {apartments.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho} · Khối {a.khoi} · Tầng {a.tang}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} căn phù hợp. Nhập số căn cụ thể để thu hẹp
          danh sách.
        </small>
      )}
    </>
  );
}

function ProfileFields({ resident }) {
  const [q, setQ] = useState(""),
    [accountId, setAccountId] = useState(String(resident?.ma_nguoi_dung || ""));
  const users = useResource(`/cu_dan/tai_khoan?q=${encodeURIComponent(q)}`);
  const accounts = users.result?.data || [];
  return (
    <>
      <Field
        label="Họ tên"
        name="ho_va_ten"
        required
        minLength={2}
        maxLength={100}
        defaultValue={resident?.ho_va_ten || ""}
      />
      <Field
        label="Số điện thoại"
        name="so_dien_thoai"
        type="tel"
        required
        maxLength={15}
        defaultValue={resident?.so_dien_thoai || ""}
      />
      <ErrorBox error={users.error} />
      <Field label="Tìm tài khoản cá nhân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <input type="hidden" name="ma_nguoi_dung" value={accountId} />
      <Field label="Tài khoản cá nhân (tùy chọn)">
        <select
          disabled={users.loading || !!users.error}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Chưa gắn tài khoản</option>
          {accountId &&
            !accounts.some((u) => String(u.ma_nguoi_dung) === accountId) && (
              <option value={accountId}>Tài khoản đã chọn #{accountId}</option>
            )}
          {accounts.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten} · {u.so_dien_thoai}
            </option>
          ))}
        </select>
      </Field>
      {users.result?.total > 20 && (
        <small>
          Nhập tên hoặc số điện thoại cụ thể để tìm trong {users.result.total}{" "}
          tài khoản.
        </small>
      )}
      <small>
        Đây là tài khoản cá nhân tùy chọn. Khi chọn vai trò Chủ hộ, hệ thống tự
        gắn thêm tài khoản thanh toán cố định của căn, không cần tạo thủ công
        tại mục Nhân sự.
      </small>
    </>
  );
}
function StayFields({
  current,
  initialId,
  initialLabel,
  minDay = "1900-01-01",
}) {
  const [relation, setRelation] = useState(current?.quan_he || "THANH_VIEN");
  return (
    <>
      <ApartmentPicker initialId={initialId} initialLabel={initialLabel} />
      <Field label="Quan hệ với căn hộ">
        <select
          name="quan_he"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        >
          <Options values={relations} />
        </select>
      </Field>
      {relation === "CHU_HO" && (
        <>
          <p className="note">
            Tự gắn tài khoản thanh toán của căn cho chủ hộ này và cấp mật khẩu
            mới để bàn giao.
          </p>
          <label className="checkbox">
            <input type="checkbox" name="xac_nhan_ban_giao" value="1" />
            Bàn giao tài khoản nếu căn đang có người phụ trách (ngắt mọi phiên
            cũ)
          </label>
        </>
      )}
      <Field
        label="Ngày bắt đầu / chuyển căn"
        name="ngay"
        type="date"
        required
        min={minDay}
        max={today()}
        defaultValue={today()}
      />
      {!current && (
        <small>
          Nhập ngày thực tế bắt đầu ở căn hộ, có thể trước ngày lập hồ sơ.
        </small>
      )}
    </>
  );
}

export function Residents() {
  const [params, setParams] = useSearchParams(),
    [adding, setAdding] = useState(false);
  const filter = new URLSearchParams(params);
  filter.delete("so");
  const resource = useResource(`/cu_dan?${filter}`);
  const action = useChange(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>Cư dân</h1>
        <button
          className="primary"
          disabled={action.pending}
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Đóng biểu mẫu" : "Thêm cư dân"}
        </button>
      </div>
      {params.get("ma_can_ho") && (
        <p>
          Đang lọc căn {params.get("so") || `#${params.get("ma_can_ho")}`} ·{" "}
          <Link to="/quan-tri/cu-dan">Xem tất cả cư dân</Link>
        </p>
      )}
      <ErrorBox error={action.error} />
      <DataTools
        kind="cu_dan"
        params={filter}
        importable
        disabled={resource.loading}
      />
      <Credentials action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Hồ sơ và đợt cư trú đầu tiên</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const body = values(e);
              body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
              action.change("/cu_dan", "POST", body, () => setAdding(false));
            }}
          >
            <fieldset disabled={action.pending}>
              <ProfileFields />
              <StayFields
                initialId={params.get("ma_can_ho") || ""}
                initialLabel={params.get("so") || ""}
              />
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu cư dân"}
              </button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams(values(e));
          for (const key of ["ma_can_ho", "so"])
            if (params.has(key)) p.set(key, params.get(key));
          setParams(p);
        }}
      >
        <Field
          label="Tìm tên hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Mã cư dân (tùy chọn)"
          name="ma_cu_dan"
          type="number"
          min={1}
          max={4294967295}
          step={1}
          defaultValue={params.get("ma_cu_dan") || ""}
        />
        <Field label="Tình trạng cư trú">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_O">Đang ở</option>
            <option value="DA_CHUYEN_DI">Đã chuyển đi</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã cư dân</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Căn hộ hiện tại</th>
                <th>Quan hệ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cu_dan}>
                  <td>
                    <ResidentCode value={r.ma_cu_dan} />
                  </td>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                      {r.ho_va_ten}
                    </Link>
                  </td>
                  <td>{r.so_dien_thoai}</td>
                  <td>{r.so_can_ho || "Đã chuyển đi"}</td>
                  <td>{relations[r.quan_he] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có cư dân phù hợp.</p>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function ResidentDetail() {
  const { id } = useParams(),
    resource = useResource(`/cu_dan/${id}`);
  const [mode, setMode] = useState("");
  const action = useChange(resource.reload);
  const resident = resource.result?.data,
    current = resident?.history.find((s) => !s.den_ngay);
  const minDay = current
    ? current.tu_ngay
    : resident?.history[0]?.den_ngay || "1900-01-01";
  const dateBlocked = mode !== "profile" && minDay > today();
  return (
    <>
      <Link to="/quan-tri/cu-dan">← Danh sách cư dân</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      {resident && (
        <>
          <h1>{resident.ho_va_ten}</h1>
          <ResidentCode value={resident.ma_cu_dan} label />
          <p className="muted">
            Dùng mã số này khi nhập phương tiện. Tên đăng nhập CH... là tài
            khoản căn hộ, không phải mã cư dân.
          </p>
          <p>
            {resident.so_dien_thoai} ·{" "}
            {current ? `Đang ở căn ${current.so_can_ho}` : "Đã chuyển đi"}
          </p>
          {resident.tai_khoan_can_ho && (
            <p>
              Đang phụ trách tài khoản thanh toán{" "}
              <strong>{resident.tai_khoan_can_ho.ten_dang_nhap}</strong> ·{" "}
              {resident.tai_khoan_can_ho.dang_hoat_dong
                ? "Hoạt động"
                : "Đang khóa"}
            </p>
          )}
          {current && (
            <p>
              Đợt cư trú hiện tại bắt đầu ngày {displayDay(current.tu_ngay)}.
            </p>
          )}
          <p>
            <Link
              className="button"
              to={`/quan-tri/phuong-tien?ma_cu_dan=${id}`}
            >
              Phương tiện của cư dân
            </Link>
          </p>
          <div className="actions">
            {[
              ["profile", "Sửa hồ sơ"],
              ...(current
                ? [
                    ["chuyen_can", "Chuyển căn"],
                    ["chuyen_di", "Ghi nhận chuyển đi"],
                  ]
                : [["nhap_cu", "Ghi nhận quay lại"]]),
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={action.pending}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {mode && (
            <section className="card narrow">
              <h2>
                {
                  {
                    profile: "Sửa hồ sơ",
                    chuyen_can: "Chuyển căn",
                    chuyen_di: "Ghi nhận chuyển đi",
                    nhap_cu: "Ghi nhận quay lại",
                  }[mode]
                }
              </h2>
              {mode !== "profile" && (
                <p className="note" role="status">
                  {dateBlocked
                    ? `Chưa có ngày hợp lệ: ngày sớm nhất là ${displayDay(minDay)}, sau ngày hiện tại ${displayDay(today())}.`
                    : `Có thể chọn ngày từ ${displayDay(minDay)} đến ${displayDay(today())}, kể cả chuyển căn trong ngày bắt đầu ở. Lịch sử căn cũ vẫn được giữ.`}
                </p>
              )}
              <form
                key={`${mode}:${resident.phien_ban}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = { ...values(e), phien_ban: resident.phien_ban };
                  body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                  if (mode === "chuyen_can")
                    body.chuyen_phuong_tien = body.chuyen_phuong_tien === "1";
                  action.change(
                    `/cu_dan/${id}${mode === "profile" ? "" : `/${mode}`}`,
                    mode === "profile" ? "PATCH" : "POST",
                    body,
                    () => setMode(""),
                  );
                }}
              >
                <fieldset disabled={action.pending || dateBlocked}>
                  {mode === "profile" ? (
                    <ProfileFields resident={resident} />
                  ) : mode === "chuyen_di" ? (
                    <>
                      <p>Kết thúc đợt cư trú hiện tại và giữ lại lịch sử.</p>
                      <Field
                        label="Ngày chuyển đi"
                        name="ngay"
                        type="date"
                        required
                        min={minDay}
                        max={today()}
                        defaultValue={today()}
                      />
                    </>
                  ) : (
                    <StayFields current={current} minDay={minDay} />
                  )}
                  {mode === "chuyen_can" && (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="chuyen_phuong_tien"
                        value="1"
                        defaultChecked
                      />{" "}
                      Chuyển đăng ký xe đang gửi sang căn mới
                    </label>
                  )}
                  {mode === "chuyen_can" && (
                    <p>
                      Đăng ký xe ở căn cũ sẽ kết thúc cùng ngày chuyển. Khi chọn
                      chuyển xe, hệ thống tạo đăng ký mới và giữ lịch sử căn cũ.
                    </p>
                  )}
                  {mode === "chuyen_di" && (
                    <p>
                      Tất cả đăng ký xe đang gửi của cư dân sẽ kết thúc cùng
                      ngày chuyển đi và được giữ trong lịch sử.
                    </p>
                  )}
                  <button className="primary">
                    {action.pending ? "Đang lưu…" : "Xác nhận lưu"}
                  </button>
                </fieldset>
              </form>
              <button disabled={action.pending} onClick={() => setMode("")}>
                Hủy
              </button>
            </section>
          )}
          <section className="card">
            <h2>Lịch sử cư trú</h2>
            <p>
              Ngày kết thúc không thuộc đợt cũ; khi chuyển căn, đợt mới bắt đầu
              cùng ngày đó. Các đợt bắt đầu và kết thúc cùng ngày được giữ để
              ghi nhận chuyển trong ngày; hệ thống không phân chia theo giờ.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Quan hệ</th>
                    <th>Từ ngày</th>
                    <th>Đến trước ngày</th>
                    <th>Người ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {resident.history.map((s) => (
                    <tr key={s.ma_lich_su_cu_tru}>
                      <td>{s.so_can_ho}</td>
                      <td>{relations[s.quan_he]}</td>
                      <td>{s.tu_ngay}</td>
                      <td>
                        {s.den_ngay || "Đang ở"}
                        {s.den_ngay === s.tu_ngay && (
                          <small> · Chuyển trong ngày</small>
                        )}
                      </td>
                      <td>{s.nguoi_ghi_nhan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
```

## 7. frontend/src/app/App.jsx

Thay toàn bộ.

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
import DataExchange from "../features/data-exchange/DataExchange.jsx";
import Dashboard from "../features/dashboard/Dashboard.jsx";
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
import BuildingMap from "../features/residency/BuildingMap.jsx";
import {
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import { ReportDetail, ReportList } from "../features/incidents/Reports.jsx";
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
          ["/quan-tri/so-do-toa-nha", "Sơ đồ tòa nhà"],
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
          ["/quan-tri/nhap-xuat", "Nhập / xuất Excel, PDF"],
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
              ["/quan-tri/so-do-toa-nha", <BuildingMap />],
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
              ["/quan-tri/nhap-xuat", <DataExchange />],
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
