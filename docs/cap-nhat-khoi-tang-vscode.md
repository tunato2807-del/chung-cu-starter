# Khối & tầng độc lập — code từng file cho VS Code

> Đã có bản tiếp theo [Thiết bị → QR → phản ánh](cap-nhat-thiet-bi-qr-vscode.md), cần migration 018. Nếu đã cập nhật bản đó, giữ `backend/src/app.js` theo hướng dẫn mới; chép app.js của bản 017 đè lên sẽ lùi kiểm tra readiness.

Áp dụng sau bản sơ đồ `4b21d18` trên nhánh `codex/auth-qr-incidents`. **12 file để chạy tính năng** (5 tạo mới, 7 thay toàn bộ), kèm **7 file kiểm thử/công cụ test tùy chọn** ở cuối. Có migration **017_building_structure.sql**, không thêm thư viện. Không cần tải ZIP; chép từng file bên dưới.

## Chức năng mới

Bản này đã đạt **206 kiểm tra backend, 45 kịch bản E2E và build**. Đã thử giao diện 1440/375 px và chạy lại migration 017 thành công. Vẫn cần thử trên máy Windows/điện thoại của bạn.

BQL → **Khối & tầng** hoặc `/quan-tri/cau-truc-toa-nha`:

- Tạo khối chưa có tầng, tạo tầng chưa có căn; đặt tên hiển thị và mô tả. Sơ đồ vẫn hiển thị các mục được khai báo riêng dù chưa có căn.
- Sửa khối/tầng. Đổi mã khối hoặc số tầng cập nhật mọi căn thuộc mục đó trong cùng transaction; giữ nguyên ID/số căn, tài khoản căn, đợt cư trú và hóa đơn. Các biểu mẫu căn/tầng cũ phải tải lại trước khi lưu.
- Xóa tầng chỉ khi chưa có căn; xóa khối chỉ khi không còn tầng. Có xác nhận xóa, kiểm tra phiên bản và khóa ngoại bảo vệ ở database. Không gộp mã/số đã tồn tại.
- Form **Căn hộ** chuyển sang **chọn khối và tầng** từ danh mục. Muốn thêm khối/tầng mới, khai báo trước rồi dùng **Tải lại khối/tầng** ở form.
- Tầng dùng số nguyên 0–200; có thể đặt tên “Tầng trệt” cho tầng 0. Mã khối tối đa 10 ký tự, tên hiển thị 100, mô tả 255. Đổi tên hiển thị không cần đổi mã.
- Chỉ BQL được quản lý. Cư dân/KTV không mở được màn hình/API này.

Migration tự lấy khối/tầng từ tất cả căn đã có, không tạo lại căn, cư dân hay hóa đơn. Dữ liệu cũ khác chữ hoa/thường theo collation DB vẫn chọn được mục cha tương ứng. Không đổi mã khối chỉ bằng hoa/thường/dấu nếu DB xem hai mã là một; hãy dùng tên hiển thị hoặc một mã khác.

Nhập Excel/API cũ vẫn nhận khối/tầng dạng chữ/số: server tạo đủ mục cha trong cùng giao dịch với căn. Nếu tạo/sửa căn hay lô nhập lỗi, mục cha vừa tạo cũng rollback. Mục khai báo hoặc sửa trong Khối & tầng được giữ hiển thị khi trống; khối tự phát sinh từ API cũ không còn căn và không có tầng khai báo riêng được ẩn khỏi danh mục, không xóa cha khỏi DB.

## Cập nhật trên Windows

1. Lưu các thay đổi riêng. Dừng frontend/backend bằng Ctrl+C, giữ `.env`, `.certs`, database và ảnh/chứng từ. Mở thư mục `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents` trong VS Code.
2. Tạo/thay đủ **file 1–12** bên dưới. Chép nội dung trong khối mã, không chép dấu backtick hoặc nối cuối file. Các file đã bao gồm các chức năng hiện có đến bản `4b21d18`.
3. Giữ nguyên migration 001–016; tạo mới 017 đúng tên/nội dung. Khi database đang chạy, tại thư mục gốc:

```powershell
npm run db:migrate
```

Phải thấy `Schema current: 017_building_structure.sql`. Backend mới yêu cầu đủ 17 migration. Không chạy `db:seed`, không xóa database/volume, không sửa migration cũ. Nếu DB Docker đang dừng, chạy `npm run db:up` trước.

4. Không cần `npm install`. Khởi động backend:

```powershell
npm run dev:backend
```

Terminal khác giữ lệnh frontend đang dùng, ví dụ HTTPS:

```powershell
npm run dev:frontend:https
```

Chỉ chạy một Vite ở cổng 5173. Ctrl+F5 rồi đăng nhập BQL. Nếu lấy bằng Git, lưu sửa đổi cá nhân trước, cập nhật nhánh `codex/auth-qr-incidents`, chạy migration và restart. Sau bản này không chép app.js/App.jsx, Residency.jsx hoặc service sơ đồ/cư trú từ hướng dẫn cũ đè lên.

## Cách thử

1. **Khối & tầng → Thêm khối**, nhập mã A, tên “Khối Đông” → Lưu. Mở sơ đồ: thấy khối A dù chưa có tầng.
2. Chọn khối A → **Thêm tầng** số 0, tên “Tầng trệt”. Sơ đồ có tầng 0 với 0 căn; không đếm thành một căn trống.
3. Vào Căn hộ → thêm căn: chọn A, tầng 0. Căn mới vẫn tự có tài khoản thanh toán như trước.
4. Khối & tầng → Sửa tầng 0 thành 2. Căn giữ ID/số căn/tài khoản, chuyển sang tầng 2. Đổi mã A thành B cập nhật tất cả tầng/căn thuộc khối đó.
5. Mở sửa căn ở tab khác trước khi đổi tầng/khối; thử lưu sau khi đổi. Server báo đã thay đổi, giữ nội dung form. Tải lại trang rồi mở sửa/chọn lại danh mục để dùng phiên bản căn/tầng mới nhất.
6. Tầng có căn bị chặn xóa; khối còn tầng bị chặn xóa. Tạo tầng 9 chưa có căn → Xóa → Giữ lại vẫn còn; xác nhận xóa mới mất. Không tự xóa hoặc gộp các căn.
7. Thử nhập Excel căn hộ như trước. Căn và mục cha chỉ lưu khi cả lô hợp lệ. Không cần sửa mẫu Excel để dùng bản này.

Sơ đồ là cấu trúc dữ liệu, chưa phải bản vẽ kiến trúc có tọa độ. Xem [bảng đối chiếu đề cương đã cập nhật](doi-chieu-de-cuong-1250080221.md).

## Danh sách file chạy tính năng

| STT | Đường dẫn | Thao tác |
|---|---|---|
| 1 | `database/migrations/017_building_structure.sql` | Tạo mới |
| 2 | `backend/src/modules/residency/building-structure.service.js` | Tạo mới |
| 3 | `backend/src/modules/residency/building-structure.routes.js` | Tạo mới |
| 4 | `backend/src/modules/residency/building-map.service.js` | Thay toàn bộ |
| 5 | `backend/src/modules/residency/residency.service.js` | Thay toàn bộ |
| 6 | `backend/src/app.js` | Thay toàn bộ |
| 7 | `frontend/src/features/residency/ApartmentFloorPicker.jsx` | Tạo mới |
| 8 | `frontend/src/features/residency/BuildingStructure.jsx` | Tạo mới |
| 9 | `frontend/src/features/residency/BuildingMap.jsx` | Thay toàn bộ |
| 10 | `frontend/src/features/residency/BuildingMap.css` | Thay toàn bộ |
| 11 | `frontend/src/features/residency/Residency.jsx` | Thay toàn bộ |
| 12 | `frontend/src/app/App.jsx` | Thay toàn bộ |

## File kiểm thử/công cụ tùy chọn

Không cần chép file 13–19 để chạy web. Nếu muốn chạy lại `npm test` và `npm run test:e2e`, hãy chép đủ nhóm này. Hai bộ test dùng database riêng `chung_cu_test`, chạy nối tiếp. Script test cài trigger hỗ trợ fixture cũ **chỉ trong DB test**; production không có trigger tự tạo khối/tầng. Test mới có ca tắt trigger để kiểm tra đường lưu thật.

| STT | Đường dẫn | Thao tác |
|---|---|---|
| 13 | `scripts/test-local.js` | Thay toàn bộ |
| 14 | `backend/test/building-structure.test.js` | Tạo mới |
| 15 | `backend/test/building-map.test.js` | Thay toàn bộ |
| 16 | `e2e/building-structure.spec.js` | Tạo mới |
| 17 | `e2e/building-map.spec.js` | Thay toàn bộ |
| 18 | `e2e/residency.spec.js` | Thay toàn bộ |
| 19 | `e2e/apartment-accounts.spec.js` | Thay toàn bộ |

## 1. database/migrations/017_building_structure.sql

Tạo mới.

```sql
CREATE TABLE IF NOT EXISTS khoi_toa_nha (
  khoi VARCHAR(10) NOT NULL PRIMARY KEY,
  ten_khoi VARCHAR(100) NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) NOT NULL DEFAULT '',
  giu_khi_trong BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS tang_toa_nha (
  khoi VARCHAR(10) NOT NULL,
  tang SMALLINT UNSIGNED NOT NULL,
  ten_tang VARCHAR(100) NOT NULL DEFAULT '',
  mo_ta VARCHAR(255) NOT NULL DEFAULT '',
  giu_khi_trong BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (khoi,tang),
  CHECK (tang <= 200),
  CONSTRAINT fk_floor_block FOREIGN KEY (khoi) REFERENCES khoi_toa_nha(khoi) ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO khoi_toa_nha (khoi)
SELECT MIN(khoi) FROM can_ho GROUP BY khoi
ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
INSERT INTO tang_toa_nha (khoi,tang)
SELECT b.khoi,c.tang FROM can_ho c JOIN khoi_toa_nha b ON b.khoi=c.khoi GROUP BY b.khoi,c.tang
ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;
ALTER TABLE can_ho
  ADD CONSTRAINT fk_apartment_floor FOREIGN KEY (khoi,tang)
  REFERENCES tang_toa_nha(khoi,tang) ON UPDATE CASCADE;
```

## 2. backend/src/modules/residency/building-structure.service.js

Tạo mới.

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";

const optionalText = (value, field, max) => text(value ?? "", field, 0, max);
function floorNumber(value) {
  const floor = integer(value, "tang");
  if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
  return floor;
}
function version(row, body) {
  if (row.phien_ban !== integer(body.phien_ban, "phien_ban"))
    fail(
      409,
      "STALE_STRUCTURE",
      "Khối/tầng đã thay đổi. Hãy tải lại danh mục trước khi sửa.",
    );
}
async function block(db, code) {
  const [row] = await rows(
    db,
    "SELECT * FROM khoi_toa_nha WHERE khoi=? FOR UPDATE",
    [code],
  );
  if (!row)
    fail(404, "BLOCK_NOT_FOUND", "Không tìm thấy khối. Hãy tải lại danh mục.");
  return row;
}
async function floor(db, code, number) {
  const [row] = await rows(
    db,
    "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=? FOR UPDATE",
    [code, number],
  );
  if (!row)
    fail(404, "FLOOR_NOT_FOUND", "Không tìm thấy tầng. Hãy tải lại danh mục.");
  return row;
}

// Existing Excel/API clients may still send free-text block/floor values.
// Provision both parents inside the SAME transaction as the apartment write.
export async function apartmentFloor(db, code, number, body) {
  if (
    body.chon_cau_truc !== undefined &&
    typeof body.chon_cau_truc !== "boolean"
  )
    fail(422, "VALIDATION", "Lựa chọn cấu trúc không hợp lệ.");
  if (body.chon_cau_truc) {
    const [parent] = await rows(
      db,
      "SELECT khoi FROM khoi_toa_nha WHERE khoi=? FOR SHARE",
      [code],
    );
    const [selected] = await rows(
      db,
      "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=? FOR SHARE",
      [code, number],
    );
    if (
      !parent ||
      !selected ||
      selected.phien_ban !== integer(body.phien_ban_tang, "phien_ban_tang")
    )
      fail(
        409,
        "STALE_STRUCTURE",
        "Khối/tầng đã đổi hoặc không còn tồn tại. Hãy tải lại danh mục và chọn lại.",
      );
    return selected.khoi;
  }
  await rows(
    db,
    "INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (?,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi",
    [code],
  );
  await rows(
    db,
    "INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (?,?,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang",
    [code, number],
  );
  const [selected] = await rows(
    db,
    "SELECT khoi FROM tang_toa_nha WHERE khoi=? AND tang=?",
    [code, number],
  );
  return selected.khoi;
}

export async function saveBlock(previous, body) {
  const code = text(body.khoi, "khoi", 1, 10),
    name = optionalText(body.ten_khoi, "ten_khoi", 100),
    note = optionalText(body.mo_ta, "mo_ta", 255);
  return transaction(async (db) => {
    if (previous !== null) {
      const current = await block(db, previous);
      version(current, body);
      if (code !== current.khoi) {
        const [equal] = await rows(
          db,
          "SELECT khoi FROM khoi_toa_nha WHERE khoi=?",
          [code],
        );
        if (equal?.khoi === current.khoi)
          fail(
            422,
            "SAME_BLOCK_CODE",
            "Không đổi mã khối chỉ bằng chữ hoa/thường hoặc dấu. Hãy dùng mã khác.",
          );
      }
      await rows(
        db,
        "UPDATE khoi_toa_nha SET khoi=?,ten_khoi=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=?",
        [code, name, note, current.khoi],
      );
      if (code !== current.khoi) {
        // FK cascades keys; versions also change so open apartment/floor forms
        // cannot silently move apartments back to the old structure.
        await rows(
          db,
          "UPDATE tang_toa_nha SET phien_ban=phien_ban+1 WHERE khoi=?",
          [code],
        );
        await rows(db, "UPDATE can_ho SET phien_ban=phien_ban+1 WHERE khoi=?", [
          code,
        ]);
      }
    } else {
      const [existing] = await rows(
        db,
        "SELECT * FROM khoi_toa_nha WHERE khoi=? FOR UPDATE",
        [code],
      );
      if (existing && !existing.giu_khi_trong) {
        const [used] = await rows(
          db,
          "SELECT (EXISTS (SELECT 1 FROM can_ho WHERE khoi=?) OR EXISTS (SELECT 1 FROM tang_toa_nha WHERE khoi=? AND giu_khi_trong=1)) AS n",
          [existing.khoi, existing.khoi],
        );
        if (used.n)
          fail(409, "ALREADY_EXISTS", "Khối đã tồn tại. Hãy chọn Sửa khối.");
        await rows(
          db,
          "UPDATE khoi_toa_nha SET ten_khoi=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=?",
          [name, note, existing.khoi],
        );
      } else
        await rows(
          db,
          "INSERT INTO khoi_toa_nha (khoi,ten_khoi,mo_ta) VALUES (?,?,?)",
          [code, name, note],
        );
    }
    return (
      await rows(db, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [code])
    )[0];
  });
}
export async function saveFloor(code, previous, body) {
  const number = floorNumber(body.tang),
    name = optionalText(body.ten_tang, "ten_tang", 100),
    note = optionalText(body.mo_ta, "mo_ta", 255);
  return transaction(async (db) => {
    const parent = await block(db, text(code, "khoi", 1, 10));
    if (previous !== null) {
      const current = await floor(db, parent.khoi, floorNumber(previous));
      version(current, body);
      await rows(
        db,
        "UPDATE tang_toa_nha SET tang=?,ten_tang=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=? AND tang=?",
        [number, name, note, parent.khoi, current.tang],
      );
      if (number !== current.tang)
        await rows(
          db,
          "UPDATE can_ho SET phien_ban=phien_ban+1 WHERE khoi=? AND tang=?",
          [parent.khoi, number],
        );
    } else {
      await rows(
        db,
        "INSERT INTO tang_toa_nha (khoi,tang,ten_tang,mo_ta) VALUES (?,?,?,?)",
        [parent.khoi, number, name, note],
      );
    }
    return (
      await rows(db, "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=?", [
        parent.khoi,
        number,
      ])
    )[0];
  });
}
export async function deleteStructure(code, number, body) {
  return transaction(async (db) => {
    const parent = await block(db, text(code, "khoi", 1, 10));
    if (number === null) {
      version(parent, body);
      const [count] = await rows(
        db,
        "SELECT COUNT(*) AS n FROM tang_toa_nha WHERE khoi=?",
        [parent.khoi],
      );
      if (count.n)
        fail(
          409,
          "STRUCTURE_IN_USE",
          "Khối còn tầng. Chỉ xóa được khối không có tầng; hãy xử lý từng tầng trước.",
        );
      await rows(db, "DELETE FROM khoi_toa_nha WHERE khoi=?", [parent.khoi]);
    } else {
      const selected = await floor(db, parent.khoi, floorNumber(number));
      version(selected, body);
      const [count] = await rows(
        db,
        "SELECT COUNT(*) AS n FROM can_ho WHERE khoi=? AND tang=?",
        [parent.khoi, selected.tang],
      );
      if (count.n)
        fail(
          409,
          "STRUCTURE_IN_USE",
          "Tầng đang có căn hộ. Hãy chuyển cấu trúc của các căn trước khi xóa tầng.",
        );
      await rows(db, "DELETE FROM tang_toa_nha WHERE khoi=? AND tang=?", [
        parent.khoi,
        selected.tang,
      ]);
    }
    return { da_xoa: true };
  });
}
```

## 3. backend/src/modules/residency/building-structure.routes.js

Tạo mới.

```js
import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { buildingMap } from "./building-map.service.js";
import {
  saveBlock,
  saveFloor,
  deleteStructure,
} from "./building-structure.service.js";

export const structureRouter = Router();
structureRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
structureRouter.get("/", async (req, res) => res.json(await buildingMap()));
structureRouter.post("/khoi", async (req, res) =>
  res.status(201).json({ data: await saveBlock(null, req.body) }),
);
structureRouter.patch("/khoi/:khoi", async (req, res) =>
  res.json({ data: await saveBlock(req.params.khoi, req.body) }),
);
structureRouter.delete("/khoi/:khoi", async (req, res) =>
  res.json({ data: await deleteStructure(req.params.khoi, null, req.body) }),
);
structureRouter.post("/khoi/:khoi/tang", async (req, res) =>
  res
    .status(201)
    .json({ data: await saveFloor(req.params.khoi, null, req.body) }),
);
structureRouter.patch("/khoi/:khoi/tang/:tang", async (req, res) =>
  res.json({
    data: await saveFloor(req.params.khoi, req.params.tang, req.body),
  }),
);
structureRouter.delete("/khoi/:khoi/tang/:tang", async (req, res) =>
  res.json({
    data: await deleteStructure(req.params.khoi, req.params.tang, req.body),
  }),
);
```

## 4. backend/src/modules/residency/building-map.service.js

Thay toàn bộ.

```js
import { pool, rows } from "../../lib/db.js";

// One read keeps hierarchy, counts and empty configured floors consistent.
// Legacy API/imports may provision parents automatically; hide those blocks
// after their last apartment is removed unless BQL explicitly configured them.
export async function buildingMap() {
  const data = await rows(
    pool,
    `SELECT k.khoi,k.ten_khoi,k.mo_ta AS mo_ta_khoi,k.phien_ban AS phien_ban_khoi,
    t.tang,t.ten_tang,t.mo_ta,t.phien_ban,COUNT(c.ma_can_ho) AS so_can_ho,
    SUM(CASE WHEN COALESCE(l.so_cu_dan,0)>0 THEN 1 ELSE 0 END) AS co_nguoi_o,
    SUM(COALESCE(l.so_cu_dan,0)) AS so_cu_dan
    FROM khoi_toa_nha k LEFT JOIN tang_toa_nha t ON t.khoi=k.khoi
    LEFT JOIN can_ho c ON c.khoi=t.khoi AND c.tang=t.tang
    LEFT JOIN (SELECT ma_can_ho,COUNT(*) AS so_cu_dan FROM lich_su_cu_tru
      WHERE den_ngay IS NULL GROUP BY ma_can_ho) l ON l.ma_can_ho=c.ma_can_ho
    WHERE k.giu_khi_trong=1
      OR EXISTS (SELECT 1 FROM can_ho a WHERE a.khoi=k.khoi)
      OR EXISTS (SELECT 1 FROM tang_toa_nha f WHERE f.khoi=k.khoi AND f.giu_khi_trong=1)
    GROUP BY k.khoi,k.ten_khoi,k.mo_ta,k.phien_ban,t.tang,t.ten_tang,t.mo_ta,t.phien_ban
    ORDER BY k.khoi,t.tang DESC`,
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
  for (const row of data) {
    if (!blocks.has(row.khoi))
      blocks.set(row.khoi, {
        khoi: row.khoi,
        ten_khoi: row.ten_khoi,
        mo_ta: row.mo_ta_khoi,
        phien_ban: row.phien_ban_khoi,
        so_can_ho: 0,
        co_nguoi_o: 0,
        trong: 0,
        so_cu_dan: 0,
        tang: [],
      });
    if (row.tang === null) continue;
    const floor = {
      khoi: row.khoi,
      tang: Number(row.tang),
      ten_tang: row.ten_tang,
      mo_ta: row.mo_ta,
      phien_ban: row.phien_ban,
      so_can_ho: Number(row.so_can_ho),
      co_nguoi_o: Number(row.co_nguoi_o),
      so_cu_dan: Number(row.so_cu_dan),
    };
    floor.trong = floor.so_can_ho - floor.co_nguoi_o;
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

## 5. backend/src/modules/residency/residency.service.js

Thay toàn bộ.

```js
import { reportPage } from "../report-exports/report-files.js";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
import { lockApartment } from "../billing/billing.guards.js";
import { apartmentFloor } from "./building-structure.service.js";
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
    `SELECT c.*, (SELECT k.khoi FROM khoi_toa_nha k WHERE k.khoi=c.khoi) AS khoi_danh_muc, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
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
    values[1] = await apartmentFloor(db, values[1], values[2], body);
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

## 6. backend/src/app.js

Thay toàn bộ.

```js
import express from "express";
import { structureRouter } from "./modules/residency/building-structure.routes.js";
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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        "017_building_structure.sql",
      ],
    );
    if (migrations.length !== 17) throw new Error("Schema not initialized");
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
app.use("/api/cau_truc_toa_nha", structureRouter);
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

## 7. frontend/src/features/residency/ApartmentFloorPicker.jsx

Tạo mới.

```jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";

export default function ApartmentFloorPicker({ apartment }) {
  const resource = useResource("/can_ho/so_do");
  const [code, setCode] = useState(
      apartment?.khoi_danh_muc || apartment?.khoi || "",
    ),
    [number, setNumber] = useState(apartment ? String(apartment.tang) : "");
  const block = resource.result?.data.khoi.find((item) => item.khoi === code);
  const floor = block?.tang.find((item) => String(item.tang) === number);
  return (
    <>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <div className="form-grid">
        <Field label="Khối">
          <select
            name="khoi"
            required
            value={block ? code : ""}
            onChange={(event) => {
              setCode(event.target.value);
              setNumber("");
            }}
          >
            <option value="">Chọn khối</option>
            {resource.result?.data.khoi.map((item) => (
              <option key={item.khoi} value={item.khoi}>
                {item.khoi}
                {item.ten_khoi ? ` · ${item.ten_khoi}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tầng">
          <select
            name="tang"
            required
            value={floor ? number : ""}
            onChange={(event) => setNumber(event.target.value)}
          >
            <option value="">Chọn tầng</option>
            {block?.tang.map((item) => (
              <option key={item.tang} value={item.tang}>
                Tầng {item.tang}
                {item.ten_tang ? ` · ${item.ten_tang}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <input
        type="hidden"
        name="phien_ban_tang"
        value={floor?.phien_ban ?? ""}
      />
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading}
          onClick={() => resource.reload()}
        >
          Tải lại khối/tầng
        </button>
        <Link to="/quan-tri/cau-truc-toa-nha">Khai báo khối/tầng mới</Link>
      </div>
    </>
  );
}
```

## 8. frontend/src/features/residency/BuildingStructure.jsx

Tạo mới.

```jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";
import "./BuildingMap.css";

export default function BuildingStructure() {
  const resource = useResource("/cau_truc_toa_nha");
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState(null),
    [confirmation, setConfirmation] = useState(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  const blocks = resource.result?.data.khoi || [];
  const block = blocks.find((item) => item.khoi === selected) || blocks[0];
  function open(value) {
    setEditor(value);
    setConfirmation(null);
    setError(null);
    setNotice("");
  }
  async function change(path, method, body) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const result = await getJson(path, { method, body });
      setSelected(result.data.khoi || block?.khoi || "");
      setEditor(null);
      setConfirmation(null);
      setNotice(
        method === "DELETE"
          ? "Đã xóa mục chưa sử dụng."
          : "Đã lưu cấu trúc tòa nhà.",
      );
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="building-map">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DANH MỤC TÒA NHÀ</p>
          <h1>Khối & tầng</h1>
        </div>
        <Link className="button" to="/quan-tri/so-do-toa-nha">
          Xem sơ đồ tòa nhà
        </Link>
      </div>
      <p>
        Khai báo khối và tầng trước khi thêm căn hộ. Khối/tầng được khai báo ở
        đây vẫn xuất hiện khi chưa có căn.
      </p>
      <div className="actions">
        <button
          className="primary"
          disabled={pending}
          onClick={() => open({ type: "block", row: null })}
        >
          Thêm khối
        </button>
        <button
          disabled={pending || resource.loading}
          onClick={() => {
            setEditor(null);
            setConfirmation(null);
            setError(null);
            resource.reload();
          }}
        >
          Tải lại danh mục
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      <ErrorBox error={error || resource.error} />
      {resource.loading && <Loading />}
      {resource.result && (
        <section
          className="card building-structure-list"
          aria-label="Danh mục khối và tầng"
        >
          {!blocks.length ? (
            <p>Chưa có khối. Bấm Thêm khối để bắt đầu.</p>
          ) : (
            <>
              <Field label="Khối cần quản lý">
                <select
                  value={block?.khoi || ""}
                  disabled={pending}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    open(null);
                  }}
                >
                  {blocks.map((item) => (
                    <option key={item.khoi} value={item.khoi}>
                      Khối {item.khoi}
                      {item.ten_khoi ? ` · ${item.ten_khoi}` : ""} ·{" "}
                      {item.so_can_ho} căn
                    </option>
                  ))}
                </select>
              </Field>
              <h2>
                Khối {block.khoi}
                {block.ten_khoi ? ` · ${block.ten_khoi}` : ""}
              </h2>
              {block.mo_ta && <p>{block.mo_ta}</p>}
              <p>
                {block.tang.length} tầng · {block.so_can_ho} căn hộ ·{" "}
                {block.so_cu_dan} cư dân đang ở
              </p>
              <div className="actions">
                <button
                  disabled={pending}
                  onClick={() => open({ type: "block", row: block })}
                >
                  Sửa khối
                </button>
                <button
                  disabled={pending}
                  onClick={() =>
                    open({ type: "floor", khoi: block.khoi, row: null })
                  }
                >
                  Thêm tầng
                </button>
                <button
                  className="danger"
                  disabled={pending || block.tang.length > 0}
                  onClick={() => {
                    setEditor(null);
                    setConfirmation({
                      type: "block",
                      khoi: block.khoi,
                      row: block,
                    });
                    setError(null);
                  }}
                >
                  Xóa khối
                </button>
              </div>
              <p className="muted">
                Chỉ xóa tầng không có căn hộ và khối không còn tầng. Đổi mã khối
                hoặc số tầng sẽ cập nhật vị trí cấu trúc của các căn, giữ nguyên
                mã căn, cư trú và hóa đơn.
              </p>
              {!block.tang.length ? (
                <p>Khối chưa có tầng. Bấm Thêm tầng để khai báo.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tầng</th>
                        <th>Tên hiển thị</th>
                        <th>Căn hộ</th>
                        <th>Mô tả</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.tang.map((item) => (
                        <tr key={item.tang}>
                          <td>Tầng {item.tang}</td>
                          <td>{item.ten_tang || "—"}</td>
                          <td>{item.so_can_ho}</td>
                          <td>{item.mo_ta || "—"}</td>
                          <td>
                            <div className="actions">
                              <button
                                disabled={pending}
                                onClick={() =>
                                  open({
                                    type: "floor",
                                    khoi: block.khoi,
                                    row: item,
                                  })
                                }
                              >
                                Sửa tầng {item.tang}
                              </button>
                              <button
                                className="danger"
                                disabled={pending || item.so_can_ho > 0}
                                onClick={() => {
                                  setEditor(null);
                                  setConfirmation({
                                    type: "floor",
                                    khoi: block.khoi,
                                    row: item,
                                  });
                                  setError(null);
                                }}
                              >
                                Xóa tầng {item.tang}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {editor && (
        <section
          className="card building-structure-editor"
          aria-label="Biểu mẫu khối tầng"
        >
          <h2>
            {editor.row ? "Sửa" : "Thêm"}{" "}
            {editor.type === "block" ? "khối" : `tầng · Khối ${editor.khoi}`}
          </h2>
          <form
            key={`${editor.type}:${editor.khoi}:${editor.row?.khoi}:${editor.row?.tang}:${editor.row?.phien_ban}`}
            onSubmit={(event) => {
              event.preventDefault();
              const body = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              if (editor.row) body.phien_ban = editor.row.phien_ban;
              const path =
                editor.type === "block"
                  ? `/cau_truc_toa_nha/khoi${editor.row ? `/${encodeURIComponent(editor.row.khoi)}` : ""}`
                  : `/cau_truc_toa_nha/khoi/${encodeURIComponent(editor.khoi)}/tang${editor.row ? `/${editor.row.tang}` : ""}`;
              change(path, editor.row ? "PATCH" : "POST", body);
            }}
          >
            <fieldset disabled={pending}>
              {editor.type === "block" ? (
                <>
                  <Field
                    label="Mã khối"
                    name="khoi"
                    required
                    maxLength={10}
                    defaultValue={editor.row?.khoi || ""}
                  />
                  <Field
                    label="Tên hiển thị khối"
                    name="ten_khoi"
                    maxLength={100}
                    defaultValue={editor.row?.ten_khoi || ""}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Số tầng"
                    name="tang"
                    type="number"
                    required
                    min={0}
                    max={200}
                    step={1}
                    defaultValue={editor.row?.tang ?? 0}
                  />
                  <Field
                    label="Tên hiển thị tầng"
                    name="ten_tang"
                    maxLength={100}
                    defaultValue={editor.row?.ten_tang || ""}
                    placeholder="Ví dụ: Tầng trệt"
                  />
                </>
              )}
              <Field
                label="Mô tả"
                name="mo_ta"
                maxLength={255}
                defaultValue={editor.row?.mo_ta || ""}
              />
              {editor.row && (
                <p>
                  Đổi mã khối/số tầng áp dụng cho tất cả căn trong mục này. Các
                  biểu mẫu cũ phải tải lại trước khi lưu.
                </p>
              )}
              <div className="actions">
                <button className="primary">
                  {pending ? "Đang lưu…" : "Lưu cấu trúc"}
                </button>
                <button type="button" onClick={() => open(null)}>
                  Hủy sửa
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
      {confirmation && (
        <section
          className="card building-structure-editor"
          role="alertdialog"
          aria-label="Xác nhận xóa cấu trúc"
        >
          <h2>
            Xóa{" "}
            {confirmation.type === "block"
              ? `khối ${confirmation.khoi}`
              : `tầng ${confirmation.row.tang} · Khối ${confirmation.khoi}`}
            ?
          </h2>
          <p>
            Hệ thống sẽ kiểm tra lại mục này chưa được sử dụng trước khi xóa.
          </p>
          <div className="actions">
            <button
              className="danger"
              disabled={pending}
              onClick={() =>
                change(
                  `/cau_truc_toa_nha/khoi/${encodeURIComponent(confirmation.khoi)}${confirmation.type === "floor" ? `/tang/${confirmation.row.tang}` : ""}`,
                  "DELETE",
                  { phien_ban: confirmation.row.phien_ban },
                )
              }
            >
              Xác nhận xóa
            </button>
            <button disabled={pending} onClick={() => setConfirmation(null)}>
              Giữ lại
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
```

## 9. frontend/src/features/residency/BuildingMap.jsx

Thay toàn bộ.

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
          <Link className="button" to="/quan-tri/cau-truc-toa-nha">
            Quản lý khối & tầng
          </Link>
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
            hiện tình trạng mua bán, cho thuê hoặc miễn phí dịch vụ. Khối/tầng
            đã khai báo vẫn hiển thị khi chưa có căn hộ.
          </p>
          {!data.khoi.length ? (
            <section className="card">
              <h2>Chưa có khối để lập sơ đồ</h2>
              <Link to="/quan-tri/cau-truc-toa-nha">
                Khai báo khối đầu tiên
              </Link>
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
                    {item.ten_khoi && <span>{item.ten_khoi}</span>}
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
                          {item.ten_tang && <span>{item.ten_tang}</span>}
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
                    {!block.tang.length ? (
                      <p>
                        Khối chưa có tầng.{" "}
                        <Link to="/quan-tri/cau-truc-toa-nha">
                          Khai báo tầng
                        </Link>
                      </p>
                    ) : !floor ? (
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

## 10. frontend/src/features/residency/BuildingMap.css

Thay toàn bộ.

```css
.building-map {
  min-width: 0;
}
.building-map .card.building-structure-list,
.building-map .card.building-structure-editor {
  margin-top: 20px;
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

## 11. frontend/src/features/residency/Residency.jsx

Thay toàn bộ.

```jsx
import DataTools from "../../shared/DataTools.jsx";
import ApartmentFloorPicker from "./ApartmentFloorPicker.jsx";
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
              body.chon_cau_truc = true;
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
              <ApartmentFloorPicker apartment={editing} />
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

## 12. frontend/src/app/App.jsx

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
import BuildingStructure from "../features/residency/BuildingStructure.jsx";
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
          ["/quan-tri/cau-truc-toa-nha", "Khối & tầng"],
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
              ["/quan-tri/cau-truc-toa-nha", <BuildingStructure />],
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

## 13. scripts/test-local.js

Thay toàn bộ.

```js
import { spawnSync } from "node:child_process";
const run = (cmd, args, env = process.env) => {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status || 1);
};
// Test data lives in a separate database; never clear the development database.
run("docker", [
  "compose",
  "exec",
  "-T",
  "db",
  "sh",
  "-c",
  "MYSQL_PWD=\"$MYSQL_ROOT_PASSWORD\" mysql -u root -e \"CREATE DATABASE IF NOT EXISTS chung_cu_test CHARACTER SET utf8mb4; GRANT ALL ON chung_cu_test.* TO 'chung_cu'@'%';\"",
]);
const env = { ...process.env, DB_NAME: "chung_cu_test" };
run("npm", ["run", "db:migrate", "-w", "backend"], env);
// Older integration fixtures insert apartments directly. Provision their
// parents only in the isolated test DB; production has no such triggers and
// must provision/validate the hierarchy in saveApartment's transaction.
const fixtureResult = spawnSync(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "db",
    "sh",
    "-c",
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
  ],
  {
    stdio: ["pipe", "inherit", "inherit"],
    input: `DROP TRIGGER IF EXISTS test_floor_parent;
CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha FOR EACH ROW
INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (NEW.khoi,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
DROP TRIGGER IF EXISTS test_apartment_parent;
CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho FOR EACH ROW
INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (NEW.khoi,NEW.tang,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;`,
  },
);
if (fixtureResult.status !== 0) process.exit(fixtureResult.status || 1);
if (process.argv.includes("e2e"))
  run(
    "node",
    [
      "--env-file-if-exists=.env",
      "node_modules/@playwright/test/cli.js",
      "test",
    ],
    env,
  );
else run("npm", ["test", "-w", "backend"], env);
```

## 14. backend/test/building-structure.test.js

Tạo mới.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("building catalog: empty parents, production provisioning, safe rename/delete and stale forms", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(3).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const codes = ["A", "B", "C", "D", "E", "L", "X"].map(
    (ending) => suffix + ending,
  );
  const [a, b, c, d, e, legacy, rollback] = codes;
  const accounts = [],
    apartments = [],
    residents = [];
  let invoice;
  const ddl = (sql) =>
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
      ],
      { input: sql },
    );
  async function request(path, cookie, method = "GET", body, csrf = true) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  let admin, tech, resident, apt;
  try {
    for (const role of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN", "CU_DAN"]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const row = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(row.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      if (role === "KY_THUAT_VIEN") tech = login.cookie;
      if (role === "CU_DAN") resident = login.cookie;
    }
    await t.test(
      "all catalog actions are management-only and writes require CSRF header",
      async () => {
        for (const [path, method, body] of [
          ["/cau_truc_toa_nha", "GET"],
          ["/cau_truc_toa_nha/khoi", "POST", { khoi: a }],
          [`/cau_truc_toa_nha/khoi/${a}`, "PATCH", { khoi: b, phien_ban: 0 }],
          [`/cau_truc_toa_nha/khoi/${a}`, "DELETE", { phien_ban: 0 }],
          [`/cau_truc_toa_nha/khoi/${a}/tang`, "POST", { tang: 0 }],
        ]) {
          assert.equal((await request(path, null, method, body)).status, 401);
          for (const cookie of [tech, resident])
            assert.equal(
              (await request(path, cookie, method, body)).status,
              403,
            );
        }
        assert.equal(
          (
            await request(
              "/cau_truc_toa_nha/khoi",
              admin,
              "POST",
              { khoi: a },
              false,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "configured blocks and floors exist with no apartments; duplicates and invalid numbers are rejected",
      async () => {
        assert.equal(
          (
            await request("/cau_truc_toa_nha/khoi", admin, "POST", {
              khoi: a,
              ten_khoi: "Khối Đông",
              mo_ta: "Có thể thêm căn sau",
            })
          ).status,
          201,
        );
        assert.equal(
          (await request("/cau_truc_toa_nha/khoi", admin, "POST", { khoi: b }))
            .status,
          201,
        );
        let map = (await request("/can_ho/so_do", admin)).body.data;
        assert.equal(map.khoi.find((item) => item.khoi === a).tang.length, 0);
        for (const number of [0, 9])
          assert.equal(
            (
              await request(`/cau_truc_toa_nha/khoi/${a}/tang`, admin, "POST", {
                tang: number,
                ten_tang: number === 0 ? "Tầng trệt" : "Tầng kỹ thuật",
              })
            ).status,
            201,
          );
        map = (await request("/can_ho/so_do", admin)).body.data;
        const block = map.khoi.find((item) => item.khoi === a);
        assert.equal(block.so_can_ho, 0);
        assert.equal(block.co_nguoi_o, 0);
        assert.deepEqual(
          block.tang.map((item) => item.tang),
          [9, 0],
        );
        assert.equal(block.tang[1].ten_tang, "Tầng trệt");
        for (const body of [
          { tang: -1 },
          { tang: 201 },
          { tang: "1.2" },
          { tang: 1, ten_tang: "x".repeat(101) },
        ])
          assert.equal(
            (
              await request(
                `/cau_truc_toa_nha/khoi/${a}/tang`,
                admin,
                "POST",
                body,
              )
            ).status,
            422,
          );
        assert.equal(
          (
            await request("/cau_truc_toa_nha/khoi", admin, "POST", {
              khoi: a.toUpperCase(),
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}/tang`, admin, "POST", {
              tang: 0,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${rollback}/tang`,
              admin,
              "POST",
              { tang: 0 },
            )
          ).status,
          404,
        );
        await assert.rejects(
          rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [a]),
          (error) => error.code === "ER_ROW_IS_REFERENCED_2",
        );
      },
    );
    await t.test(
      "existing mixed-case block text resolves to its catalog option",
      async () => {
        const room = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,9,60)",
          [`${suffix}-case`, a.toLowerCase()],
        );
        apartments.push(room.insertId);
        const selected = (
          await request(`/can_ho?ma_can_ho=${room.insertId}`, admin)
        ).body.data[0];
        assert.equal(selected.khoi_danh_muc, a);
        assert.equal(selected.khoi, a.toLowerCase());
      },
    );
    await t.test(
      "legacy API provisions parents atomically WITHOUT test fixture triggers",
      async () => {
        ddl(
          "DROP TRIGGER IF EXISTS test_apartment_parent; DROP TRIGGER IF EXISTS test_floor_parent;",
        );
        try {
          const created = await request("/can_ho", admin, "POST", {
            so_can_ho: `${suffix}-legacy`,
            khoi: legacy,
            tang: 7,
            dien_tich_m2: "60",
            tinh_phi_dich_vu: true,
          });
          assert.equal(created.status, 201);
          apartments.push(created.body.data.ma_can_ho);
          assert.equal(
            (
              await rows(
                pool,
                "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=7",
                [legacy],
              )
            ).length,
            1,
          );
          const failed = await request("/can_ho", admin, "POST", {
            so_can_ho: `${suffix}-legacy`,
            khoi: rollback,
            tang: 8,
            dien_tich_m2: "60",
            tinh_phi_dich_vu: true,
          });
          assert.equal(failed.status, 409);
          assert.equal(
            (
              await rows(pool, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [
                rollback,
              ])
            ).length,
            0,
          );
          await assert.rejects(
            rows(
              pool,
              "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
              [`${suffix}-bad`, rollback],
            ),
            (error) => error.code === "ER_NO_REFERENCED_ROW_2",
          );
        } finally {
          ddl(`CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha FOR EACH ROW INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (NEW.khoi,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho FOR EACH ROW INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (NEW.khoi,NEW.tang,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;`);
        }
      },
    );
    await t.test(
      "selected floors must still exist at the selected version; no orphan on failure",
      async () => {
        const body = {
          so_can_ho: `${suffix}-strict`,
          khoi: a,
          tang: 0,
          dien_tich_m2: "60",
          tinh_phi_dich_vu: true,
          chon_cau_truc: true,
          phien_ban_tang: 0,
        };
        for (const override of [
          { tang: 8 },
          { phien_ban_tang: 9 },
          { khoi: rollback },
        ])
          assert.equal(
            (await request("/can_ho", admin, "POST", { ...body, ...override }))
              .status,
            409,
          );
        const created = await request("/can_ho", admin, "POST", body);
        assert.equal(created.status, 201);
        apt = created.body.data;
        apartments.push(apt.ma_can_ho);
        const person = await rows(
          pool,
          "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
          [suffix, "0901234567"],
        );
        residents.push(person.insertId);
        await rows(
          pool,
          "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?)",
          [person.insertId, apt.ma_can_ho, accounts[0]],
        );
        invoice = (
          await rows(
            pool,
            "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap) VALUES (?,?,'2020-01','2020-01-01',1,0,0,0,100,'[]',?,?)",
            [`STRUCT-${suffix}`, apt.ma_can_ho, "a".repeat(64), accounts[0]],
          )
        ).insertId;
      },
    );
    await t.test(
      "used floors/blocks cannot be deleted through API or foreign keys",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}`, admin, "DELETE", {
              phien_ban: 0,
            })
          ).body.error.code,
          "STRUCTURE_IN_USE",
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${a}/tang/0`,
              admin,
              "DELETE",
              { phien_ban: 0 },
            )
          ).body.error.code,
          "STRUCTURE_IN_USE",
        );
        await assert.rejects(
          rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=? AND tang=0", [a]),
          (error) => error.code === "ER_ROW_IS_REFERENCED_2",
        );
      },
    );
    await t.test(
      "renumber and rename cascade while keeping account, stay, invoice IDs and history",
      async () => {
        const before = (
          await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
            residents[0],
          ])
        )[0];
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${a}/tang/0`,
              admin,
              "PATCH",
              { tang: 2, ten_tang: "Tầng hai", phien_ban: 0 },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}`, admin, "PATCH", {
              khoi: c,
              ten_khoi: "Khối mới",
              phien_ban: 0,
            })
          ).status,
          200,
        );
        const current = (
          await rows(pool, "SELECT * FROM can_ho WHERE ma_can_ho=?", [
            apt.ma_can_ho,
          ])
        )[0];
        assert.equal(current.khoi, c);
        assert.equal(current.tang, 2);
        assert.equal(current.phien_ban, 2);
        assert.equal(current.so_can_ho, apt.so_can_ho);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
              [invoice],
            )
          )[0].ma_can_ho,
          apt.ma_can_ho,
        );
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_can_ho_thanh_toan FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
              [apt.ma_can_ho],
            )
          ).length,
          1,
        );
        assert.deepEqual(
          (
            await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
              residents[0],
            ])
          )[0],
          before,
        );
        const stale = await request(
          `/can_ho/${apt.ma_can_ho}`,
          admin,
          "PATCH",
          { ...apt, khoi: a, tang: 0, tinh_phi_dich_vu: true },
        );
        assert.equal(stale.status, 409);
        assert.equal(
          (await rows(pool, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [a]))
            .length,
          0,
        );
        assert.equal(
          (
            await request("/can_ho", admin, "POST", {
              so_can_ho: `${suffix}-stale`,
              khoi: c,
              tang: 2,
              dien_tich_m2: 60,
              tinh_phi_dich_vu: true,
              chon_cau_truc: true,
              phien_ban_tang: 0,
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "conflicts do not merge structures and concurrent edits have one winner",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${c}`, admin, "PATCH", {
              khoi: b,
              phien_ban: 1,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${c}/tang/2`,
              admin,
              "PATCH",
              { tang: 9, phien_ban: 2 },
            )
          ).status,
          409,
        );
        const race = await Promise.all(
          [d, e].map((code) =>
            request(`/cau_truc_toa_nha/khoi/${c}`, admin, "PATCH", {
              khoi: code,
              phien_ban: 1,
            }),
          ),
        );
        assert.deepEqual(race.map((item) => item.status).sort(), [200, 404]);
        const active = race[0].status === 200 ? d : e;
        assert.equal(
          (
            await rows(pool, "SELECT khoi FROM can_ho WHERE ma_can_ho=?", [
              apt.ma_can_ho,
            ])
          )[0].khoi,
          active,
        );
      },
    );
    await t.test(
      "empty floors and blocks may be deleted with current versions",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${b}/tang`, admin, "POST", {
              tang: 1,
            })
          ).status,
          201,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${b}/tang/1`,
              admin,
              "DELETE",
              { phien_ban: 9 },
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${b}/tang/1`,
              admin,
              "DELETE",
              { phien_ban: 0 },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${b}`, admin, "DELETE", {
              phien_ban: 0,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/can_ho/so_do", admin)).body.data.khoi.some(
            (item) => item.khoi === b,
          ),
          false,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (invoice)
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [invoice]);
    for (const id of residents) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const code of codes) {
      await rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=?", [code]);
      await rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [code]);
    }
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
```

## 15. backend/test/building-map.test.js

Thay toàn bộ.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("MySQL: building hierarchy, occupancy, filters and live changes", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex");
  const hash = await bcrypt.hash(password, 10);
  const accounts = [],
    apartments = [],
    residents = [];
  const a = suffix + "A",
    b = suffix + "B";
  async function request(path, cookie, method = "GET", body) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "X-App-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  let admin, tech, resident;
  try {
    for (const role of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN", "CU_DAN"]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const user = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(user.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      if (role === "KY_THUAT_VIEN") tech = login.cookie;
      if (role === "CU_DAN") resident = login.cookie;
    }
    for (let i = 0; i < 24; i++) {
      const row = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,?,?,?)",
        [
          `${suffix}-${i}`,
          i === 23 ? b : a,
          i === 22 ? 10 : 0,
          "65.50",
          i !== 0,
        ],
      );
      apartments.push(row.insertId);
    }
    for (let i = 0; i < 3; i++) {
      const row = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
        [`Private ${suffix}-${i}`, "0901234567"],
      );
      residents.push(row.insertId);
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,den_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?,?)",
        [
          row.insertId,
          apartments[i === 2 ? 1 : 0],
          i === 2 ? "2020-02-01" : null,
          accounts[0],
        ],
      );
    }
    await t.test(
      "hierarchy and apartment directory reject other roles and guests",
      async () => {
        for (const path of [
          "/can_ho/so_do",
          `/can_ho?khoi=${a}&trang_thai=TRONG`,
        ]) {
          assert.equal((await request(path)).status, 401);
          for (const cookie of [tech, resident])
            assert.equal((await request(path, cookie)).status, 403);
        }
      },
    );
    await t.test(
      "counts apartments once, excludes ended stays and includes every floor",
      async () => {
        const response = await request("/can_ho/so_do", admin);
        assert.equal(response.status, 200);
        const data = response.body.data;
        const block = data.khoi.find((item) => item.khoi === a);
        assert.equal(block.so_can_ho, 23);
        assert.equal(block.co_nguoi_o, 1);
        assert.equal(block.trong, 22);
        assert.equal(block.so_cu_dan, 2);
        assert.deepEqual(
          block.tang.map((item) => item.tang),
          [10, 0],
        );
        assert.equal(block.tang[1].so_can_ho, 22);
        assert.equal(data.khoi.find((item) => item.khoi === b).trong, 1);
        for (const key of ["so_can_ho", "co_nguoi_o", "trong", "so_cu_dan"])
          assert.equal(
            data.tong[key],
            data.khoi.reduce((sum, item) => sum + item[key], 0),
          );
        assert.equal(
          data.tong.so_tang,
          data.khoi.reduce((sum, item) => sum + item.tang.length, 0),
        );
        const json = JSON.stringify(data);
        for (const secret of [
          "Private",
          "so_dien_thoai",
          "token",
          "mat_khau",
          "ho_va_ten",
        ])
          assert.ok(!json.includes(secret));
      },
    );
    await t.test(
      "floor/status filters are exact, paginated and validated",
      async () => {
        const prefix = `/can_ho?khoi=${a}&tang=0`;
        const first = (await request(prefix, admin)).body;
        const second = (await request(prefix + "&page=2", admin)).body;
        assert.equal(first.total, 22);
        assert.equal(first.data.length, 20);
        assert.equal(second.data.length, 2);
        assert.equal(
          new Set([...first.data, ...second.data].map((item) => item.ma_can_ho))
            .size,
          22,
        );
        const occupied = (await request(prefix + "&trang_thai=DANG_O", admin))
          .body;
        assert.equal(occupied.total, 1);
        assert.equal(occupied.data[0].so_cu_dan, 2);
        assert.equal(occupied.data[0].tinh_phi_dich_vu, 0);
        assert.equal(
          (await request(prefix + "&trang_thai=TRONG", admin)).body.total,
          21,
        );
        assert.equal(
          (await request(`/can_ho?khoi=${a}&tang=10`, admin)).body.total,
          1,
        );
        assert.equal(
          (await request(`/can_ho?khoi=${suffix}`, admin)).body.total,
          0,
        );
        const single = (
          await request(`/can_ho?ma_can_ho=${apartments[0]}`, admin)
        ).body;
        assert.equal(single.total, 1);
        assert.equal(single.data[0].ma_can_ho, apartments[0]);
        for (const query of [
          "tang=201",
          "trang_thai=KHAC",
          "ma_can_ho=x",
          "khoi=12345678901",
          "khoi=A&khoi=B",
        ])
          assert.equal((await request(`/can_ho?${query}`, admin)).status, 422);
      },
    );
    await t.test(
      "transfers change occupancy without rewriting history",
      async () => {
        for (const id of residents.slice(0, 2)) {
          const moved = await request(
            `/cu_dan/${id}/chuyen_can`,
            admin,
            "POST",
            {
              ma_can_ho: apartments[23],
              quan_he: "THANH_VIEN",
              ngay: "2021-01-01",
              phien_ban: 0,
            },
          );
          assert.equal(moved.status, 200);
        }
        const map = (await request("/can_ho/so_do", admin)).body.data;
        const oldBlock = map.khoi.find((item) => item.khoi === a);
        const newBlock = map.khoi.find((item) => item.khoi === b);
        assert.equal(oldBlock.co_nguoi_o, 0);
        assert.equal(oldBlock.so_cu_dan, 0);
        assert.equal(newBlock.co_nguoi_o, 1);
        assert.equal(newBlock.so_cu_dan, 2);
        assert.equal(
          (
            await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_can_ho=?", [
              apartments[0],
            ])
          ).length,
          2,
        );
      },
    );
    await t.test(
      "editing a room updates the derived structure without a second source",
      async () => {
        const changed = await request(
          `/can_ho/${apartments[22]}`,
          admin,
          "PATCH",
          {
            so_can_ho: `${suffix}-22`,
            khoi: b,
            tang: 3,
            dien_tich_m2: "70",
            tinh_phi_dich_vu: true,
            phien_ban: 0,
          },
        );
        assert.equal(changed.status, 200);
        const map = (await request("/can_ho/so_do", admin)).body.data;
        assert.deepEqual(
          map.khoi
            .find((item) => item.khoi === a)
            .tang.map((item) => item.tang),
          [10, 0],
        );
        assert.deepEqual(
          map.khoi
            .find((item) => item.khoi === b)
            .tang.map((item) => item.tang),
          [3, 0],
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    for (const id of residents) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
```

## 16. e2e/building-structure.spec.js

Tạo mới.

```js
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`building structure: empty block/floor → apartment picker → rename → stale form → safe delete at ${width}px`, async ({
    page,
    context,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(3).toString("hex"),
      codes = ["A", "B", "C"].map((ending) => `T${suffix}${ending}`);
    const [a, b, c] = codes,
      name = `${suffix}-101`,
      password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const errors = [];
    let admin, apt, stale;
    page.on("pageerror", (error) => errors.push(error.message));
    async function save() {
      const response = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.startsWith("/api/cau_truc_toa_nha/khoi") &&
          ["PATCH", "POST"].includes(r.request().method()),
      );
      await page
        .getByRole("button", { name: "Lưu cấu trúc", exact: true })
        .click();
      const result = await response;
      expect(result.status()).toBeLessThan(300);
      await expect(
        page.getByRole("region", { name: "Biểu mẫu khối tầng" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Tải lại danh mục", exact: true }),
      ).toBeEnabled();
    }
    async function addBlock(code) {
      await page
        .getByRole("button", { name: "Thêm khối", exact: true })
        .click();
      await page.getByLabel("Mã khối", { exact: true }).fill(code);
      await page.getByLabel("Tên hiển thị khối").fill("Khối Đông");
      await save();
      await expect(page.getByLabel("Khối cần quản lý")).toHaveValue(code);
    }
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [suffix, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await context.addCookies([
        {
          name: "session",
          value: (await login({ so_dien_thoai: phone, mat_khau: password }))
            .token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      await page.goto("/quan-tri/cau-truc-toa-nha");
      await addBlock(a);
      await expect(
        page.getByText("Khối chưa có tầng. Bấm Thêm tầng để khai báo.", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await expect(
        page.getByText("Khối chưa có tầng.", { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Quản lý khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(a);
      await page
        .getByRole("button", { name: "Thêm tầng", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("0");
      await page.getByLabel("Tên hiển thị tầng").fill("Tầng trệt");
      await save();
      await expect(
        page.getByRole("cell", { name: "Tầng trệt", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "0 căn phù hợp" }),
      ).toHaveText("0 căn phù hợp · Trang 1");
      await page
        .getByRole("link", { name: "Quản lý căn hộ", exact: true })
        .click();
      await page.getByLabel("Số căn hộ", { exact: true }).fill(name);
      await page.getByLabel("Khối", { exact: true }).selectOption(a);
      await page.getByLabel("Tầng", { exact: true }).selectOption("0");
      await page.getByLabel("Diện tích (m²)").fill("65.5");
      const created = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/can_ho" &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      const response = await created;
      expect(response.status()).toBe(201);
      apt = (await response.json()).data.ma_can_ho;
      stale = await context.newPage();
      stale.on("pageerror", (error) => errors.push(error.message));
      await stale.goto(`/quan-tri/can-ho?ma_can_ho=${apt}`);
      await stale.getByRole("button", { name: "Sửa", exact: true }).click();
      await expect(stale.getByLabel("Tầng", { exact: true })).toHaveValue("0");
      await stale.getByLabel("Diện tích (m²)").fill("80");

      await page
        .getByRole("link", { name: "Khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(a);
      await expect(
        page.getByRole("button", { name: "Xóa tầng 0", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Xóa khối", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Sửa tầng 0", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("2");
      await page.getByLabel("Tên hiển thị tầng").fill("Tầng hai");
      await save();
      await expect(
        page.getByRole("cell", { name: "Tầng 2", exact: true }),
      ).toBeVisible();
      await stale
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      await expect(stale.getByRole("alert")).toContainText("Khối/tầng đã đổi");
      await expect(stale.getByLabel("Diện tích (m²)")).toHaveValue("80");
      await stale.close();
      stale = null;

      await page.getByRole("button", { name: "Sửa khối", exact: true }).click();
      await page.getByLabel("Mã khối", { exact: true }).fill(b);
      await save();
      await expect(page.getByLabel("Khối cần quản lý")).toHaveValue(b);
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`^Khối ${b} `) })
        .click();
      await expect(
        page.getByRole("heading", { name: `Căn ${name}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Tầng 2 / }),
      ).toContainText("Tầng hai");
      expect(
        (
          await rows(
            pool,
            "SELECT khoi,tang,ma_can_ho FROM can_ho WHERE ma_can_ho=?",
            [apt],
          )
        )[0],
      ).toEqual({ khoi: b, tang: 2, ma_can_ho: apt });

      await page
        .getByRole("link", { name: "Quản lý khối & tầng", exact: true })
        .click();
      await page.getByLabel("Khối cần quản lý").selectOption(b);
      await page
        .getByRole("button", { name: "Thêm tầng", exact: true })
        .click();
      await page.getByLabel("Số tầng", { exact: true }).fill("9");
      await save();
      await page
        .getByRole("button", { name: "Xóa tầng 9", exact: true })
        .click();
      const confirmation = page.getByRole("alertdialog", {
        name: "Xác nhận xóa cấu trúc",
      });
      await confirmation
        .getByRole("button", { name: "Giữ lại", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: "Tầng 9", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Xóa tầng 9", exact: true })
        .click();
      await confirmation
        .getByRole("button", { name: "Xác nhận xóa", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: "Tầng 9", exact: true }),
      ).toHaveCount(0);
      await addBlock(c);
      await page.getByRole("button", { name: "Xóa khối", exact: true }).click();
      await confirmation
        .getByRole("button", { name: "Xác nhận xóa", exact: true })
        .click();
      await expect(
        page.getByRole("option", { name: new RegExp(`^Khối ${c} `) }),
      ).toHaveCount(0);
      await page.getByLabel("Khối cần quản lý").selectOption(b);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/building-structure-${width}.png`,
        fullPage: true,
      });
      await page.route("**/api/cau_truc_toa_nha", (route) =>
        route.fulfill({
          status: 503,
          json: { error: { message: "Danh mục tạm ngắt" } },
        }),
      );
      await page
        .getByRole("button", { name: "Tải lại danh mục", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText("Danh mục tạm ngắt");
      await page.unroute("**/api/cau_truc_toa_nha");
      await page
        .getByRole("button", { name: "Tải lại danh mục", exact: true })
        .click();
      await expect(page.getByLabel("Khối cần quản lý")).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      if (stale) await stale.close();
      if (apt) await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apt]);
      for (const code of codes) {
        await rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=?", [code]);
        await rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [code]);
      }
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });
```

## 17. e2e/building-map.spec.js

Thay toàn bộ.

```js
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375])
  test(`building map: hierarchy, filters, pagination, editing and recovery at ${width}px`, async ({
    page,
    context,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const suffix = randomBytes(4).toString("hex");
    const a = `${suffix}A`,
      b = `${suffix}B`,
      password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const apartments = [],
      residents = [],
      errors = [];
    let admin;
    page.on("pageerror", (error) => errors.push(error.message));
    const map = page.locator(".building-map");
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Sơ đồ ${suffix}`, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await context.addCookies([
        {
          name: "session",
          value: (await login({ so_dien_thoai: phone, mat_khau: password }))
            .token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      for (let i = 0; i < 24; i++) {
        const row = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,65.5)",
          [`${suffix}-${i}`, i === 23 ? b : a, i === 22 ? 10 : 0],
        );
        apartments.push(row.insertId);
      }
      for (let i = 0; i < 2; i++) {
        const resident = await rows(
          pool,
          "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
          [`Sơ đồ ${suffix}-${i}`, "0901234567"],
        );
        residents.push(resident.insertId);
        await rows(
          pool,
          "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?)",
          [resident.insertId, apartments[0], admin],
        );
      }
      await page.goto(`/quan-tri/so-do-toa-nha?khoi=${a}&tang=0`);
      await expect(
        map.getByRole("heading", { name: "Sơ đồ tòa nhà", exact: true }),
      ).toBeVisible();
      const rooms = map.getByRole("region", { name: "Căn hộ trên sơ đồ" });
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      await expect(
        map
          .getByRole("navigation", { name: "Chọn khối" })
          .getByRole("button", { name: new RegExp(`Khối ${a}`) }),
      ).toContainText("23 căn · 22 trống");
      await expect(rooms.locator("article")).toHaveCount(20);
      await rooms
        .getByRole("button", { name: "Trang sau", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 2",
      );
      await expect(rooms.locator("article")).toHaveCount(2);
      await page.reload();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 2",
      );
      await map.getByLabel("Tình trạng cư trú").selectOption("DANG_O");
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await expect(rooms.locator("article")).toHaveCount(1);
      await expect(
        rooms.getByText("Có người ở · 2 cư dân", { exact: true }),
      ).toBeVisible();
      await map.getByLabel("Tình trạng cư trú").selectOption("TRONG");
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "21 căn phù hợp · Trang 1",
      );
      await rooms
        .getByRole("button", { name: "Xóa bộ lọc", exact: true })
        .click();
      await expect(map.getByLabel("Tình trạng cư trú")).toHaveValue("");
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      await map.getByLabel("Tìm căn hộ trong tầng").fill(`${suffix}-0`);
      await rooms
        .getByRole("button", { name: "Lọc căn hộ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await rooms
        .getByRole("button", { name: "Xóa bộ lọc", exact: true })
        .click();
      await map.getByRole("button", { name: /^Tầng 10 / }).click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-22`, exact: true }),
      ).toBeVisible();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${b} `) })
        .click();
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-23`, exact: true }),
      ).toBeVisible();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await map.getByRole("button", { name: /^Tầng 0 / }).click();
      await expect(rooms.getByRole("status")).toHaveText(
        "22 căn phù hợp · Trang 1",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/building-map-${width}.png`,
        fullPage: true,
      });

      await rooms
        .getByRole("link", { name: `Xem / sửa căn ${suffix}-0`, exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `${suffix}-0`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: `${suffix}-1`, exact: true }),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Sửa", exact: true }).click();
      const createdFloor = await page.request.post(
        `/api/cau_truc_toa_nha/khoi/${a}/tang`,
        { headers: { "X-App-Request": "1" }, data: { tang: 2 } },
      );
      expect(createdFloor.ok()).toBe(true);
      await page
        .getByRole("button", { name: "Tải lại khối/tầng", exact: true })
        .click();
      await page.getByLabel("Tầng", { exact: true }).selectOption("2");
      await page
        .getByRole("button", { name: "Lưu căn hộ", exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `${a} / 2`, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Xem sơ đồ tòa nhà", exact: true })
        .click();
      await map
        .getByRole("button", { name: new RegExp(`^Khối ${a} `) })
        .click();
      await map.getByRole("button", { name: /^Tầng 2 / }).click();
      await expect(
        rooms.getByRole("heading", { name: `Căn ${suffix}-0`, exact: true }),
      ).toBeVisible();
      await rooms
        .getByRole("link", { name: `Cư dân căn ${suffix}-0`, exact: true })
        .click();
      await expect(
        page.getByRole("cell", { name: `Sơ đồ ${suffix}-0`, exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );

      await page.route("**/api/can_ho/so_do", (route) =>
        route.fulfill({
          status: 503,
          json: { error: { message: "Tạm ngắt dữ liệu sơ đồ" } },
        }),
      );
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(map.getByRole("alert")).toContainText(
        "Tạm ngắt dữ liệu sơ đồ",
      );
      await expect(map.locator("article")).toHaveCount(0);
      await page.unroute("**/api/can_ho/so_do");
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(rooms.getByRole("status")).toHaveText(
        "1 căn phù hợp · Trang 1",
      );
      await page.goto(`/quan-tri/so-do-toa-nha?khoi=${a}&tang=199`);
      await expect(map.getByRole("status")).toContainText(
        "Tầng trong liên kết không còn",
      );
      await expect(map.locator("article")).toHaveCount(0);
      await page.goto("/quan-tri/so-do-toa-nha?khoi=NOTFOUND");
      await expect(map.getByRole("status")).toContainText(
        "Khối trong liên kết không còn",
      );
      await page.route("**/api/can_ho/so_do", (route) =>
        route.fulfill({
          json: {
            data: {
              tong: {
                so_khoi: 0,
                so_tang: 0,
                so_can_ho: 0,
                co_nguoi_o: 0,
                trong: 0,
                so_cu_dan: 0,
              },
              khoi: [],
            },
          },
        }),
      );
      await map
        .getByRole("button", { name: "Cập nhật sơ đồ", exact: true })
        .click();
      await expect(
        map.getByRole("heading", {
          name: "Chưa có khối để lập sơ đồ",
          exact: true,
        }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      for (const id of residents) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      for (const id of apartments)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });

test("building map discards slow responses and blocks residents", async ({
  page,
}) => {
  let role = "QUAN_TRI_VIEN",
    listRequests = 0;
  await page.route("**/api/xac_thuc/toi", (route) =>
    route.fulfill({
      json: { data: { ma_nguoi_dung: 98765, ho_va_ten: "BQL", vai_tro: role } },
    }),
  );
  await page.route("**/api/can_ho/so_do", (route) =>
    route.fulfill({
      json: {
        data: {
          tong: {
            so_khoi: 1,
            so_tang: 2,
            so_can_ho: 2,
            co_nguoi_o: 0,
            trong: 2,
            so_cu_dan: 0,
          },
          khoi: [
            {
              khoi: "RACE",
              so_can_ho: 2,
              co_nguoi_o: 0,
              trong: 2,
              so_cu_dan: 0,
              tang: [2, 1].map((tang) => ({
                tang,
                so_can_ho: 1,
                co_nguoi_o: 0,
                trong: 1,
                so_cu_dan: 0,
              })),
            },
          ],
        },
      },
    }),
  );
  let release;
  const slow = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/can_ho?**", async (route) => {
    listRequests++;
    const floor = new URL(route.request().url()).searchParams.get("tang");
    if (floor === "2") await slow;
    await route
      .fulfill({
        json: {
          data: [
            {
              ma_can_ho: Number(floor),
              so_can_ho: `RACE-${floor}`,
              so_cu_dan: 0,
              dien_tich_m2: "50",
              tinh_phi_dich_vu: 1,
            },
          ],
          total: 1,
          page: 1,
        },
      })
      .catch(() => {});
  });
  await page.goto("/quan-tri/so-do-toa-nha?khoi=RACE&tang=2");
  await expect.poll(() => listRequests).toBeGreaterThan(0);
  await page.getByRole("button", { name: /^Tầng 1 / }).click();
  await expect(
    page.getByRole("heading", { name: "Căn RACE-1", exact: true }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "Căn RACE-2", exact: true }),
  ).toHaveCount(0);
  role = "CU_DAN";
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Bạn không có quyền mở trang này",
      exact: true,
    }),
  ).toBeVisible();
});
```

## 18. e2e/residency.spec.js

Thay toàn bộ.

```js
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`apartment → resident → profile → transfer → departure → return at ${width}px`, async ({
    page,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    // Exercise copying on LAN HTTP where the modern clipboard API is unavailable.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      document.addEventListener("copy", () => {
        const input = document.activeElement;
        if (input?.tagName === "TEXTAREA")
          window.__copiedResidentCode = input.value.slice(
            input.selectionStart,
            input.selectionEnd,
          );
      });
    });
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      hash = await bcrypt.hash(password, 10);
    const apartmentName = `E2E-${suffix}`,
      residentName = `Cư dân E2E ${suffix}`;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const accounts = [],
      phones = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let profileId;
    try {
      for (const role of ["QUAN_TRI_VIEN", "CU_DAN"]) {
        const phone =
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
        const result = await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [`${role} ${suffix}`, phone, hash, role],
        );
        accounts.push(result.insertId);
        phones.push(phone);
      }
      await page.goto("/dang-nhap");
      await rows(
        pool,
        "INSERT INTO khoi_toa_nha (khoi) VALUES ('E2E') ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await rows(
        pool,
        "INSERT INTO tang_toa_nha (khoi,tang) VALUES ('E2E',5) ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await page.getByLabel("Số điện thoại").fill(phones[0]);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await page.getByRole("link", { name: "Căn hộ", exact: true }).click();
      await page.getByLabel("Tìm số căn hộ hoặc khối").fill(apartmentName);
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      for (const ending of ["A", "B"]) {
        await page
          .getByLabel("Số căn hộ", { exact: true })
          .fill(`${apartmentName}-${ending}`);
        await page.getByLabel("Khối", { exact: true }).selectOption("E2E");
        await page.getByLabel("Tầng", { exact: true }).selectOption("5");
        await page.getByLabel("Diện tích (m²)").fill("75.50");
        await page.getByRole("button", { name: "Lưu căn hộ" }).click();
        await expect(
          page.getByRole("cell", {
            name: `${apartmentName}-${ending}`,
            exact: true,
          }),
        ).toBeVisible();
      }
      const apartments = await rows(
        pool,
        "SELECT ma_can_ho,so_can_ho FROM can_ho WHERE so_can_ho LIKE ? ORDER BY so_can_ho",
        [`${apartmentName}%`],
      );
      expect(apartments).toHaveLength(2);
      const row = page.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: apartments[0].so_can_ho,
          exact: true,
        }),
      });
      await row.getByRole("button", { name: "Sửa", exact: true }).click();
      await page.getByLabel("Diện tích (m²)").fill("80.25");
      await page.getByRole("button", { name: "Lưu căn hộ" }).click();
      await expect(row.getByText("80.25 m²")).toBeVisible();
      await row.getByRole("button", { name: "Xem", exact: true }).click();
      await page
        .getByRole("link", { name: "Thêm hoặc xem cư dân căn này" })
        .click();
      await page
        .getByRole("button", { name: "Thêm cư dân", exact: true })
        .click();
      await page.getByLabel("Họ tên", { exact: true }).fill(residentName);
      await page.getByLabel("Số điện thoại", { exact: true }).fill(phones[1]);
      await page
        .getByLabel("Tìm tài khoản cá nhân theo tên hoặc số điện thoại")
        .fill(phones[1]);
      await expect(
        page.getByRole("option", { name: new RegExp(phones[1]) }),
      ).toBeAttached();
      await page
        .getByLabel("Tài khoản cá nhân (tùy chọn)")
        .selectOption(String(accounts[1]));
      await page.getByLabel("Quan hệ với căn hộ").selectOption("NGUOI_THUE");
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Lưu cư dân", exact: true })
        .click();
      await page.getByRole("link", { name: residentName, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: residentName, exact: true }),
      ).toBeVisible();
      profileId = Number(page.url().split("/").at(-1));
      await expect(page.locator(".resident-code code")).toHaveText(
        String(profileId),
      );
      await page
        .getByRole("button", {
          name: `Sao chép mã cư dân ${profileId}`,
          exact: true,
        })
        .click();
      await expect(page.locator(".resident-code [role='status']")).toHaveText(
        `Đã sao chép mã ${profileId}.`,
      );
      expect(await page.evaluate(() => window.__copiedResidentCode)).toBe(
        String(profileId),
      );
      await page.screenshot({
        path: `/tmp/chung-cu-resident-code-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole("link", { name: "← Danh sách cư dân", exact: true })
        .click();
      await page.getByLabel("Mã cư dân (tùy chọn)").fill(String(profileId));
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      await expect(
        page.getByRole("columnheader", { name: "Mã cư dân", exact: true }),
      ).toBeVisible();
      await expect(page.locator("tbody .resident-code code")).toHaveText(
        String(profileId),
      );
      await page.getByRole("link", { name: residentName, exact: true }).click();

      // A slow account selector must not silently unlink an existing account.
      await page.evaluate(() => {
        const original = window.fetch;
        window.__originalFetch = original;
        window.fetch = (...args) =>
          String(args[0]).startsWith("/api/cu_dan/tai_khoan?")
            ? new Promise((resolve) => {
                window.__resumeAccounts = resolve;
              }).then(() => original(...args))
            : original(...args);
      });
      await page
        .getByRole("button", { name: "Sửa hồ sơ", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => typeof window.__resumeAccounts))
        .toBe("function");
      await page
        .getByLabel("Họ tên", { exact: true })
        .fill(residentName + " sửa");
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: residentName + " sửa", exact: true }),
      ).toBeVisible();
      await page.evaluate(() => {
        window.__resumeAccounts();
        window.fetch = window.__originalFetch;
      });
      const [linked] = await rows(
        pool,
        "SELECT ma_nguoi_dung FROM cu_dan WHERE ma_cu_dan=?",
        [profileId],
      );
      expect(linked.ma_nguoi_dung).toBe(accounts[1]);

      await page
        .getByRole("button", { name: "Chuyển căn", exact: true })
        .click();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(apartments[1].so_can_ho);
      await expect(
        page.getByRole("option", { name: new RegExp(apartments[1].so_can_ho) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[1].ma_can_ho));
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByText(`Đang ở căn ${apartments[1].so_can_ho}`, {
          exact: false,
        }),
      ).toBeVisible();
      await expect(
        page.locator("tbody small").filter({ hasText: "Chuyển trong ngày" }),
      ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Ghi nhận chuyển đi", exact: true })
        .click();
      await page.getByLabel("Ngày chuyển đi", { exact: true }).fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Ghi nhận quay lại", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Ghi nhận quay lại", exact: true })
        .click();
      await page
        .getByLabel("Tìm căn hộ", { exact: true })
        .fill(apartments[0].so_can_ho);
      await expect(
        page.getByRole("option", { name: new RegExp(apartments[0].so_can_ho) }),
      ).toBeAttached();
      await page
        .getByLabel("Căn hộ", { exact: true })
        .selectOption(String(apartments[0].ma_can_ho));
      await page.getByLabel("Ngày bắt đầu / chuyển căn").fill(day);
      await page
        .getByRole("button", { name: "Xác nhận lưu", exact: true })
        .click();
      await page.reload();
      await expect(
        page.getByText(`Đang ở căn ${apartments[0].so_can_ho}`, {
          exact: false,
        }),
      ).toBeVisible();
      await expect(page.locator("tbody tr")).toHaveCount(3);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      // Clean only this run's fixtures, including rows created before an assertion failed.
      const profiles = await rows(
        pool,
        "SELECT ma_cu_dan FROM cu_dan WHERE ho_va_ten LIKE ?",
        [`${residentName}%`],
      );
      for (const { ma_cu_dan: id } of profiles) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      await rows(pool, "DELETE FROM can_ho WHERE so_can_ho LIKE ?", [
        `${apartmentName}%`,
      ]);
      for (const id of accounts)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });

// Same-day moves are available immediately; earlier dates and future dates remain invalid.
for (const width of [1440, 375])
  test(`same-day transfer accepts today and keeps profile editing available at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.install({ time: new Date("2026-10-19T08:00:00Z") });
    await page.route("**/api/xac_thuc/toi", (route) =>
      route.fulfill({
        json: {
          data: {
            ma_nguoi_dung: 1,
            ho_va_ten: "BQL thử ngày",
            vai_tro: "QUAN_TRI_VIEN",
          },
        },
      }),
    );
    await page.route("**/api/cu_dan/999", (route) =>
      route.fulfill({
        json: {
          data: {
            ma_cu_dan: 999,
            ho_va_ten: "Cư dân cùng ngày",
            so_dien_thoai: "0901234567",
            ma_nguoi_dung: null,
            phien_ban: 0,
            history: [
              {
                ma_lich_su_cu_tru: 1,
                ma_can_ho: 1,
                so_can_ho: "101",
                quan_he: "THANH_VIEN",
                tu_ngay: "2026-10-19",
                den_ngay: null,
                nguoi_ghi_nhan: "BQL",
              },
            ],
          },
        },
      }),
    );
    await page.route("**/api/can_ho?**", (route) =>
      route.fulfill({ json: { data: [], total: 0, page: 1 } }),
    );
    await page.route("**/api/cu_dan/tai_khoan?**", (route) =>
      route.fulfill({ json: { data: [], total: 0, page: 1 } }),
    );
    let writes = 0;
    await page.route("**/api/cu_dan/999/*", (route) => {
      writes++;
      return route.fulfill({ status: 500, json: {} });
    });
    await page.goto("/quan-tri/cu-dan/999");
    await expect(
      page.getByText("Đợt cư trú hiện tại bắt đầu ngày 19/10/2026.", {
        exact: true,
      }),
    ).toBeVisible();
    for (const label of ["Chuyển căn", "Ghi nhận chuyển đi"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Có thể chọn ngày" }),
      ).toContainText("kể cả chuyển căn trong ngày bắt đầu ở");
      await expect(
        page.getByRole("button", { name: "Xác nhận lưu", exact: true }),
      ).toBeEnabled();
      const date = page.locator('input[name="ngay"]');
      await expect(date).toHaveAttribute("min", "2026-10-19");
      await expect(date).toHaveAttribute("max", "2026-10-19");
      await expect(date).toBeEnabled();
      await date.fill("2026-10-18");
      expect(
        await date.evaluate((input) => input.validity.rangeUnderflow),
      ).toBe(true);
      await date.fill("2026-10-20");
      expect(await date.evaluate((input) => input.validity.rangeOverflow)).toBe(
        true,
      );
      await date.fill("2026-10-19");
      expect(await date.evaluate((input) => input.validity.valid)).toBe(true);
    }
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Sửa hồ sơ", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Xác nhận lưu", exact: true }),
    ).toBeEnabled();
    await expect(page.getByLabel("Họ tên", { exact: true })).toBeEditable();
  });
```

## 19. e2e/apartment-accounts.spec.js

Thay toàn bộ.

```js
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";

for (const width of [1440, 375])
  test(`apartment login → automatic householder binding → password reset → handover at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(18).toString("hex"),
      phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      apartmentName = `TK-${suffix}`,
      names = [`Chủ hộ một ${suffix}`, `Chủ hộ hai ${suffix}`],
      ownerPhones = [0, 1].map(
        () =>
          "09" +
          String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      ),
      date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      adminContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      ownerContext = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      admin = await adminContext.newPage(),
      owner = await ownerContext.newPage(),
      errors = [];
    let adminId, apartmentId, billId, priceId;
    for (const page of [admin, owner])
      page.on("pageerror", (e) => errors.push(e.message));
    async function login(page, username, secret, kind = "TU_DONG") {
      await page.goto("/dang-nhap");
      await page
        .getByLabel("Số điện thoại hoặc tài khoản căn hộ", { exact: true })
        .fill(username);
      await page
        .getByLabel("Loại tài khoản", { exact: true })
        .selectOption(kind);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(secret);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(page).toHaveURL(
        /^CH/i.test(username) || kind === "CAN_HO"
          ? /\/cu-dan\/hoa-don$/
          : /\/quan-tri$/,
      );
    }
    async function post(path, data) {
      const response = await adminContext.request.post(`/api${path}`, {
        headers: { "X-App-Request": "1" },
        data,
      });
      expect(response.ok()).toBe(true);
      return (await response.json()).data;
    }
    async function saveResponse(path, button) {
      const response = admin.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/api${path}` &&
          r.request().method() === "POST",
      );
      await admin.getByRole("button", { name: button, exact: true }).click();
      const result = await response;
      expect(result.ok()).toBe(true);
      return (await result.json()).data;
    }
    try {
      const result = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
        [suffix, phone, await bcrypt.hash(password, 10)],
      );
      adminId = result.insertId;
      await login(admin, phone, password);
      await rows(
        pool,
        "INSERT INTO khoi_toa_nha (khoi) VALUES ('TK') ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await rows(
        pool,
        "INSERT INTO tang_toa_nha (khoi,tang) VALUES ('TK',1) ON DUPLICATE KEY UPDATE giu_khi_trong=1",
      );
      await admin.getByRole("link", { name: "Căn hộ", exact: true }).click();
      await admin.getByLabel("Số căn hộ", { exact: true }).fill(apartmentName);
      await admin.getByLabel("Khối", { exact: true }).selectOption("TK");
      await admin.getByLabel("Tầng", { exact: true }).selectOption("1");
      await admin.getByLabel("Diện tích (m²)", { exact: true }).fill("50");
      const apartment = await saveResponse("/can_ho", "Lưu căn hộ");
      apartmentId = apartment.ma_can_ho;
      const initial = apartment.tai_khoan_can_ho;
      const initialNotice = admin.getByRole("region", {
        name: "Thông tin bàn giao tài khoản",
      });
      await expect(initialNotice).toContainText(initial.ten_dang_nhap);
      await expect(initialNotice).toContainText(initial.mat_khau_tam_thoi);
      // The new apartment account can be used immediately, even before a profile exists.
      await login(owner, initial.ten_dang_nhap, initial.mat_khau_tam_thoi);
      await expect(owner).toHaveURL(/\/cu-dan\/hoa-don$/);
      priceId = (
        await post("/cau_hinh_phi", {
          loai_phi: "PHI_QUAN_LY",
          don_gia: "1000",
          tu_ngay: "2020-01-01",
        })
      ).ma_cau_hinh_phi;
      billId = (
        await post("/hoa_don/lap", {
          ma_can_ho: apartmentId,
          ky_thanh_toan: "2026-09",
          ngay_chot_phi: "2026-09-30",
          tinh_dien: false,
          tinh_nuoc: false,
          tinh_xe: false,
        })
      ).ma_hoa_don;
      await post(`/hoa_don/${billId}/duyet`, { phien_ban: 0 });
      await post(`/hoa_don/${billId}/gui`, {
        phien_ban: 1,
        han_thanh_toan: date,
        ma_ngan_hang: "970436",
        so_tai_khoan: "1234567890",
        ten_nguoi_nhan: "BQL DEMO",
      });
      async function createOwner(index) {
        await admin.goto(
          `/quan-tri/cu-dan?ma_can_ho=${apartmentId}&so=${apartmentName}`,
        );
        await admin
          .getByRole("button", { name: "Thêm cư dân", exact: true })
          .click();
        await admin.getByLabel("Họ tên", { exact: true }).fill(names[index]);
        await admin
          .getByLabel("Số điện thoại", { exact: true })
          .fill(ownerPhones[index]);
        await admin
          .getByLabel("Quan hệ với căn hộ", { exact: true })
          .selectOption("CHU_HO");
        await admin
          .getByLabel("Ngày bắt đầu / chuyển căn", { exact: true })
          .fill(date);
        if (index)
          await admin
            .getByLabel("Bàn giao tài khoản nếu căn đang có người phụ trách", {
              exact: false,
            })
            .check();
        const profile = await saveResponse("/cu_dan", "Lưu cư dân");
        const notice = admin.getByRole("region", {
          name: "Thông tin bàn giao tài khoản",
        });
        await expect(
          admin.getByRole("link", { name: names[index], exact: true }),
        ).toBeVisible();
        // The credential notice must survive the resource reload after the form closes.
        await expect(notice).toContainText(
          profile.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
        await expect(notice).toContainText(initial.ten_dang_nhap);
        return profile;
      }
      const first = await createOwner(0);
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(
        owner,
        ownerPhones[0],
        first.tai_khoan_can_ho.mat_khau_tam_thoi,
        "CAN_HO",
      );
      await owner.goto(`/cu-dan/hoa-don/${billId}`);
      await expect(
        owner.getByRole("heading", {
          name: "Tổng cộng: 50.000 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(owner.getByAltText(/^VietQR hóa đơn/)).toBeVisible();
      await admin
        .getByRole("link", { name: "Tài khoản căn hộ", exact: true })
        .click();
      await admin
        .getByLabel("Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại")
        .fill(ownerPhones[0]);
      await admin
        .getByRole("button", { name: "Tìm tài khoản căn hộ", exact: true })
        .click();
      await expect(admin.locator("tbody tr")).toHaveCount(1);
      await expect(
        admin.getByRole("cell", { name: initial.ten_dang_nhap, exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("cell", { name: ownerPhones[0], exact: true }),
      ).toBeVisible();
      await admin
        .getByRole("button", { name: "Quản lý tài khoản", exact: true })
        .click();
      await expect(
        admin.getByRole("heading", {
          name: "Tài khoản thanh toán căn hộ",
          exact: true,
        }),
      ).toBeVisible();
      const reset = await saveResponse(
        `/can_ho/${apartmentId}/tai_khoan`,
        "Cấp lại mật khẩu và ngắt phiên cũ",
      );
      await expect(
        admin.getByText("Người phụ trách:", { exact: false }),
      ).toBeVisible();
      await expect(
        admin.getByRole("region", { name: "Thông tin bàn giao tài khoản" }),
      ).toContainText(reset.mat_khau_tam_thoi);
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(owner, ownerPhones[0], reset.mat_khau_tam_thoi, "CAN_HO");
      await expect(owner).toHaveURL(/\/cu-dan\/hoa-don$/);
      const second = await createOwner(1);
      expect(second.tai_khoan_can_ho.ma_nguoi_dung).toBe(
        first.tai_khoan_can_ho.ma_nguoi_dung,
      );
      expect(second.tai_khoan_can_ho.mat_khau_tam_thoi).not.toBe(
        reset.mat_khau_tam_thoi,
      );
      expect(
        (await ownerContext.request.get("/api/xac_thuc/toi")).status(),
      ).toBe(401);
      await login(
        owner,
        ownerPhones[1],
        second.tai_khoan_can_ho.mat_khau_tam_thoi,
        "CAN_HO",
      );
      await owner.goto(`/cu-dan/hoa-don/${billId}`);
      await expect(
        owner.getByRole("heading", {
          name: "Tổng cộng: 50.000 đ",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        owner.getByText(`Người phụ trách thanh toán hiện tại: ${names[1]}`, {
          exact: true,
        }),
      ).toBeVisible();
      const oldAlias = await ownerContext.request.post(
        "/api/xac_thuc/dang_nhap",
        {
          headers: { "X-App-Request": "1" },
          data: {
            so_dien_thoai: ownerPhones[0],
            mat_khau: second.tai_khoan_can_ho.mat_khau_tam_thoi,
            loai_tai_khoan: "CAN_HO",
          },
        },
      );
      expect(oldAlias.status()).toBe(401);
      await admin
        .getByRole("link", { name: "Tài khoản căn hộ", exact: true })
        .click();
      await admin
        .getByLabel("Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại")
        .fill(apartmentName);
      await admin
        .getByRole("button", { name: "Tìm tài khoản căn hộ", exact: true })
        .click();
      await expect(admin.locator("tbody tr")).toHaveCount(1);
      await expect(
        admin.getByRole("cell", { name: ownerPhones[1], exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("link", { name: names[1], exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole("cell", { name: ownerPhones[0], exact: true }),
      ).toHaveCount(0);
      for (const page of [admin, owner])
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await adminContext.close();
      await ownerContext.close();
      if (billId) {
        await rows(pool, "DELETE FROM lich_su_hoa_don WHERE ma_hoa_don=?", [
          billId,
        ]);
        await rows(pool, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [
          billId,
        ]);
        await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [billId]);
      }
      const profiles = await rows(
        pool,
        "SELECT ma_cu_dan FROM cu_dan WHERE ho_va_ten IN (?,?)",
        names,
      );
      for (const { ma_cu_dan: id } of profiles) {
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
        await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
      }
      if (apartmentId)
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [apartmentId]);
      if (priceId)
        await rows(pool, "DELETE FROM cau_hinh_phi WHERE ma_cau_hinh_phi=?", [
          priceId,
        ]);
      if (adminId)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          adminId,
        ]);
    }
  });
```
