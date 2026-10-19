# Danh sách tài khoản căn hộ và đăng nhập bằng SĐT chủ hộ

Bản cập nhật sau commit `714ffc2`, đã có tài khoản căn hộ và migration 007–008. Không cần tải ZIP: chép đủ **9 file** bên dưới vào VS Code. Không có dependency hoặc migration mới.

## Kết quả

- BQL có mục riêng **Tài khoản căn hộ** tại `/quan-tri/tai-khoan-can-ho`: xem căn, mã CH, chủ hộ phụ trách, SĐT đăng nhập, trạng thái; tìm kiếm/lọc/phân trang. Bấm **Quản lý tài khoản** để cấp mật khẩu hoặc bàn giao ngay trong trang.
- Đăng nhập bằng **SĐT của chủ hộ phụ trách hiện tại + mật khẩu tài khoản căn hộ**. Mã CH vẫn dùng được với cùng mật khẩu để chọn đúng căn.
- Khi bàn giao sang chủ hộ khác, dùng SĐT người mới và mật khẩu mới được cấp. SĐT người cũ không đăng nhập tài khoản căn đó được nữa, kể cả dùng mật khẩu mới; phiên/mật khẩu cũ cũng hết hiệu lực.
- Khi chỉ sửa SĐT của cùng chủ hộ trong hồ sơ, dùng số mới với mật khẩu hiện có; phiên cũ kết thúc. Không cần bàn giao hoặc cấp lại chỉ để cập nhật số.
- Người chưa được gắn phụ trách, kể cả có quan hệ Chủ hộ trong lịch sử, không tự trở thành số điện thoại đăng nhập. Hệ thống dùng người đang được gắn phụ trách hiển thị trên danh sách; mỗi căn có một người phụ trách hiện tại.
- Giữ nguyên tài khoản cá nhân riêng. Nếu SĐT có cả tài khoản cá nhân và căn hộ, chọn **Loại tài khoản → Tài khoản căn hộ** để vào sổ hóa đơn. Chọn **Tài khoản cá nhân / Ban quản lý** khi cần tài khoản cá nhân. Mặc định **Tự nhận diện** dùng khi xác định được duy nhất một tài khoản khớp mật khẩu. Khi nhiều tài khoản cùng khớp, hệ thống yêu cầu chọn loại hoặc nhập mã CH thay vì tự chọn.

## Chuẩn bị

Dừng backend/frontend bằng Ctrl+C. Giữ `.env`, `.certs`, ảnh upload, database và các migration đã chạy. Nếu đã tự sửa file, lưu bản riêng trước khi thay. Tạo file ApartmentAccounts.jsx mới và thay đầy đủ các file còn lại; file này dùng component quản lý tài khoản từ Residency.jsx bản mới.

Nếu đang ở bản trước khi có tài khoản căn, cập nhật [bản tài khoản căn 13 file](cap-nhat-tai-khoan-can-ho-vscode.md) và chạy migration đến 008 trước; sau đó chép bản mới bên dưới. Không chép source phiên bản trước đè lại bản này.

## 1. `backend/src/modules/auth/auth.repository.js`

Thay toàn bộ nội dung file.

```js
import { pool, rows } from "../../lib/db.js";
export const publicColumns =
  "ma_nguoi_dung, ho_va_ten, so_dien_thoai, ten_dang_nhap, ma_can_ho_thanh_toan, vai_tro, chuyen_mon, dang_hoat_dong, phien_ban_token";
export async function findUser(id, db = pool) {
  return (
    await rows(
      db,
      `SELECT ${publicColumns},(SELECT c.so_dien_thoai FROM cu_dan c WHERE c.ma_cu_dan=nguoi_dung.ma_cu_dan_phu_trach) AS dien_thoai_dang_nhap FROM nguoi_dung WHERE ma_nguoi_dung=?`,
      [id],
    )
  )[0];
}
export async function listUsers() {
  return rows(
    pool,
    `SELECT ${publicColumns} FROM nguoi_dung WHERE ma_can_ho_thanh_toan IS NULL ORDER BY ma_nguoi_dung LIMIT 200`,
  );
}
```

## 2. `backend/src/modules/auth/auth.service.js`

Thay toàn bộ nội dung file.

```js
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { pool, transaction, rows } from "../../lib/db.js";
import { fail, phone, text, choice } from "../../lib/http.js";
import { findUser, publicColumns } from "./auth.repository.js";
const secret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error(
      "JWT_SECRET must be at least 32 characters. Run npm run init:local.",
    );
  return new TextEncoder().encode(process.env.JWT_SECRET);
};
const dummyHash = bcrypt.hashSync("dummy-password-never-used", 12);
export function password(value, field = "mat_khau") {
  // bcrypt only processes 72 bytes. Reject rather than silently truncate.
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    Buffer.byteLength(value) > 72
  )
    fail(422, "VALIDATION", "Mật khẩu cần từ 10 ký tự và không quá 72 byte.", {
      [field]: "Cần từ 10 ký tự, tối đa 72 byte.",
    });
  return value;
}
export async function login(body) {
  const identifier = text(
    body.ten_dang_nhap ?? body.so_dien_thoai,
    "ten_dang_nhap",
    1,
    30,
  ).trim();
  const apartmentLogin = /^CH\d{6,10}$/i.test(identifier);
  const number = apartmentLogin ? identifier.toUpperCase() : phone(identifier);
  if (
    typeof body.mat_khau !== "string" ||
    Buffer.byteLength(body.mat_khau) > 72
  )
    fail(
      401,
      "LOGIN_FAILED",
      "Thông tin đăng nhập không đúng hoặc tài khoản tạm khóa.",
    );
  const kind = choice(body.loai_tai_khoan ?? "TU_DONG", "loai_tai_khoan", [
    "TU_DONG",
    "CAN_HO",
    "CA_NHAN",
  ]);
  // Resolve candidates outside the transaction. Its first consistent read must
  // happen after user locks, so a completed handover cannot leave an old alias.
  const candidates = apartmentLogin
    ? await rows(
        pool,
        "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ten_dang_nhap=?",
        [number],
      )
    : await rows(
        pool,
        `SELECT u.ma_nguoi_dung FROM nguoi_dung u WHERE
      (? <> 'CAN_HO' AND u.ma_can_ho_thanh_toan IS NULL AND u.so_dien_thoai=?) OR
      (? <> 'CA_NHAN' AND u.ma_can_ho_thanh_toan IS NOT NULL AND EXISTS
        (SELECT 1 FROM cu_dan c WHERE c.ma_cu_dan=u.ma_cu_dan_phu_trach AND c.so_dien_thoai=?))
      ORDER BY u.ma_nguoi_dung LIMIT 11`,
        [kind, number, kind, number],
      );
  const user = await transaction(async (db) => {
    if (!candidates.length || candidates.length > 10) {
      await bcrypt.compare(body.mat_khau, dummyHash);
      return null;
    }
    const accounts = await rows(
      db,
      `SELECT * FROM nguoi_dung WHERE ma_nguoi_dung IN (${candidates.map(() => "?").join(",")}) ORDER BY ma_nguoi_dung FOR UPDATE`,
      candidates.map((u) => u.ma_nguoi_dung),
    );
    const checked = [];
    for (const u of accounts) {
      let matches = apartmentLogin
        ? u.ten_dang_nhap === number
        : u.ma_can_ho_thanh_toan === null && u.so_dien_thoai === number;
      if (
        !apartmentLogin &&
        u.ma_can_ho_thanh_toan !== null &&
        kind !== "CA_NHAN"
      ) {
        const [owner] = await rows(
          db,
          "SELECT so_dien_thoai FROM cu_dan WHERE ma_cu_dan=?",
          [u.ma_cu_dan_phu_trach],
        );
        matches = owner?.so_dien_thoai === number;
      }
      if (!matches) continue;
      const valid = await bcrypt.compare(
        body.mat_khau,
        u.mat_khau_ma_hoa || dummyHash,
      );
      const available =
        u.dang_hoat_dong &&
        (!u.khoa_den_luc ||
          new Date(u.khoa_den_luc + "Z").getTime() <= Date.now());
      checked.push({ u, valid, available });
    }
    const matching = checked.filter((item) => item.valid && item.available);
    if (matching.length > 1)
      fail(
        409,
        "LOGIN_ACCOUNT_CHOICE",
        "Số điện thoại và mật khẩu khớp nhiều tài khoản. Chọn loại tài khoản, hoặc dùng mã CH của căn hộ.",
      );
    if (!matching.length) {
      for (const { u, valid, available } of checked)
        if (!valid && available)
          await rows(
            db,
            "UPDATE nguoi_dung SET so_lan_dang_nhap_sai=so_lan_dang_nhap_sai+1, khoa_den_luc=IF(so_lan_dang_nhap_sai>=5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL) WHERE ma_nguoi_dung=?",
            [u.ma_nguoi_dung],
          );
      return null;
    }
    const selected = matching[0].u;
    await rows(
      db,
      "UPDATE nguoi_dung SET so_lan_dang_nhap_sai=0,khoa_den_luc=NULL WHERE ma_nguoi_dung=?",
      [selected.ma_nguoi_dung],
    );
    return findUser(selected.ma_nguoi_dung, db);
  });
  if (!user)
    fail(
      401,
      "LOGIN_FAILED",
      "Thông tin đăng nhập không đúng hoặc tài khoản tạm khóa.",
    );
  const token = await new SignJWT({ version: user.phien_ban_token })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.ma_nguoi_dung))
    .setIssuer("chung-cu")
    .setAudience("chung-cu-web")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  return { user, token };
}
export async function authenticate(token) {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "chung-cu",
      audience: "chung-cu-web",
    });
    if (!/^\d+$/.test(payload.sub)) return null;
    const u = await findUser(Number(payload.sub));
    return u?.dang_hoat_dong && u.phien_ban_token === payload.version
      ? u
      : null;
  } catch (error) {
    if (error.code?.startsWith("ERR_J")) return null;
    throw error;
  }
}
export async function changePassword(user, body) {
  const fresh = password(body.mat_khau_moi, "mat_khau_moi");
  if (
    typeof body.mat_khau_cu !== "string" ||
    Buffer.byteLength(body.mat_khau_cu) > 72
  )
    fail(422, "PASSWORD", "Mật khẩu hiện tại không đúng.");
  await transaction(async (db) => {
    const [u] = await rows(
      db,
      "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? FOR UPDATE",
      [user.ma_nguoi_dung],
    );
    if (!(await bcrypt.compare(body.mat_khau_cu, u.mat_khau_ma_hoa)))
      fail(422, "PASSWORD", "Mật khẩu hiện tại không đúng.");
    await rows(
      db,
      "UPDATE nguoi_dung SET mat_khau_ma_hoa=?,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
      [await bcrypt.hash(fresh, 12), user.ma_nguoi_dung],
    );
  });
}
export async function createUser(body) {
  const name = text(body.ho_va_ten, "ho_va_ten", 2, 100),
    number = phone(body.so_dien_thoai);
  const role = choice(body.vai_tro, "vai_tro", ["KY_THUAT_VIEN", "CU_DAN"]);
  const hash = await bcrypt.hash(password(body.mat_khau), 12);
  return transaction(async (db) => {
    const r = await rows(
      db,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,mat_khau_ma_hoa,chuyen_mon) VALUES (?,?,?,?,?)",
      [
        name,
        number,
        role,
        hash,
        text(body.chuyen_mon || "", "chuyen_mon", 0, 100),
      ],
    );
    return findUser(r.insertId, db);
  });
}
export async function setUserActive(actor, id, active) {
  if (id === actor.ma_nguoi_dung)
    fail(422, "SELF_LOCK", "Không thể tự khóa tài khoản.");
  if (typeof active !== "boolean")
    fail(422, "VALIDATION", "Trạng thái tài khoản không hợp lệ.");
  return transaction(async (db) => {
    const [user] = await rows(
      db,
      `SELECT ${publicColumns} FROM nguoi_dung WHERE ma_nguoi_dung=? FOR UPDATE`,
      [id],
    );
    if (!user) fail(404, "NOT_FOUND", "Không tìm thấy tài khoản.");
    if (user.ma_can_ho_thanh_toan !== null)
      fail(
        409,
        "APARTMENT_ACCOUNT",
        "Quản lý tài khoản thanh toán trong mục Căn hộ để cấp mật khẩu mới khi mở lại.",
      );
    if (user.vai_tro === "QUAN_TRI_VIEN")
      fail(403, "FORBIDDEN", "Không khóa tài khoản quản trị trong luồng này.");
    await rows(
      db,
      "UPDATE nguoi_dung SET dang_hoat_dong=?,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
      [active, id],
    );
    return findUser(id, db);
  });
}
```

## 3. `backend/src/modules/residency/apartment-accounts.service.js`

Thay toàn bộ nội dung file.

```js
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "../billing/billing.guards.js";

const columns =
  "u.ma_nguoi_dung,u.ten_dang_nhap,u.ma_can_ho_thanh_toan,u.ma_cu_dan_phu_trach,u.dang_hoat_dong,u.phien_ban_ban_giao,c.ho_va_ten AS nguoi_phu_trach,c.so_dien_thoai AS dien_thoai_phu_trach";
export async function accountForApartment(id, db = pool) {
  const [account] = await rows(
    db,
    `SELECT ${columns} FROM nguoi_dung u LEFT JOIN cu_dan c ON c.ma_cu_dan=u.ma_cu_dan_phu_trach WHERE u.ma_can_ho_thanh_toan=?`,
    [id],
  );
  return account || null;
}
async function audit(db, apartmentId, old, next, actor, event) {
  await rows(
    db,
    "INSERT INTO lich_su_ban_giao_can_ho (ma_can_ho,ma_cu_dan_cu,ma_cu_dan_moi,ma_nguoi_thuc_hien,su_kien) VALUES (?,?,?,?,?)",
    [apartmentId, old, next, actor.ma_nguoi_dung, event],
  );
}
async function rotate(db, account, apartment, owner, actor, event) {
  const secret = randomBytes(18).toString("base64url");
  const changingOwner = owner !== account.ma_cu_dan_phu_trach;
  await rows(
    db,
    `UPDATE nguoi_dung SET mat_khau_ma_hoa=?,dang_hoat_dong=1,${changingOwner ? "ma_cu_dan_phu_trach=?," : ""}ho_va_ten=?,phien_ban_token=phien_ban_token+1,phien_ban_ban_giao=phien_ban_ban_giao+1,so_lan_dang_nhap_sai=0,khoa_den_luc=NULL WHERE ma_nguoi_dung=?`,
    [
      await bcrypt.hash(secret, 12),
      ...(changingOwner ? [owner] : []),
      `Tài khoản căn ${apartment.so_can_ho}`,
      account.ma_nguoi_dung,
    ],
  );
  await audit(
    db,
    apartment.ma_can_ho,
    account.ma_cu_dan_phu_trach,
    owner,
    actor,
    event,
  );
  return {
    ...(await accountForApartment(apartment.ma_can_ho, db)),
    mat_khau_tam_thoi: secret,
  };
}
// Caller holds the apartment lock; generated credentials are returned once only.
export async function ensureApartmentAccount(db, apartment, actor) {
  const [existing] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_can_ho_thanh_toan=? FOR UPDATE",
    [apartment.ma_can_ho],
  );
  if (existing) return { account: existing, credentials: null };
  const username = `CH${String(apartment.ma_can_ho).padStart(6, "0")}`;
  const secret = randomBytes(18).toString("base64url");
  const r = await rows(
    db,
    "INSERT INTO nguoi_dung (ho_va_ten,ten_dang_nhap,so_dien_thoai,vai_tro,mat_khau_ma_hoa,ma_can_ho_thanh_toan) VALUES (?,?,NULL,'CU_DAN',?,?)",
    [
      `Tài khoản căn ${apartment.so_can_ho}`,
      username,
      await bcrypt.hash(secret, 12),
      apartment.ma_can_ho,
    ],
  );
  await audit(db, apartment.ma_can_ho, null, null, actor, "TAO_TAI_KHOAN");
  const [account] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=?",
    [r.insertId],
  );
  return {
    account,
    credentials: {
      ...(await accountForApartment(apartment.ma_can_ho, db)),
      mat_khau_tam_thoi: secret,
    },
  };
}
export async function assignHouseholder(
  db,
  apartment,
  residentId,
  actor,
  confirmed = false,
) {
  const { account } = await ensureApartmentAccount(db, apartment, actor);
  if (account.ma_cu_dan_phu_trach === residentId) return null;
  if (account.ma_cu_dan_phu_trach !== null && confirmed !== true)
    fail(
      409,
      "HANDOVER_REQUIRED",
      "Căn đã có người phụ trách thanh toán. Chọn xác nhận bàn giao tài khoản cho chủ hộ mới.",
    );
  return rotate(db, account, apartment, residentId, actor, "BAN_GIAO_CHU_HO");
}
export async function releaseHouseholder(db, apartmentId, residentId, actor) {
  const [account] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_can_ho_thanh_toan=? FOR UPDATE",
    [apartmentId],
  );
  if (!account || account.ma_cu_dan_phu_trach !== residentId) return;
  await rows(
    db,
    "UPDATE nguoi_dung SET ma_cu_dan_phu_trach=NULL,dang_hoat_dong=0,phien_ban_token=phien_ban_token+1,phien_ban_ban_giao=phien_ban_ban_giao+1 WHERE ma_nguoi_dung=?",
    [account.ma_nguoi_dung],
  );
  await audit(db, apartmentId, residentId, null, actor, "NGUNG_PHU_TRACH");
}
export async function manageApartmentAccount(id, body, actor) {
  return transaction(async (db) => {
    // Match residency's resident -> apartment -> account lock order. Only the
    // new owner needs a resident FK lock; audit IDs are immutable snapshots.
    const residentId =
      body.thao_tac === "ban_giao"
        ? integer(body.ma_cu_dan, "ma_cu_dan")
        : null;
    if (residentId !== null)
      await rows(
        db,
        "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
        [residentId],
      );
    const apartment = await lockApartment(db, id);
    const { account } = await ensureApartmentAccount(db, apartment, actor);
    if (
      integer(body.phien_ban_ban_giao, "phien_ban_ban_giao") !==
      account.phien_ban_ban_giao
    )
      fail(
        409,
        "STALE_VERSION",
        "Thông tin tài khoản đã thay đổi. Hãy tải lại.",
      );
    if (body.thao_tac === "cap_lai_mat_khau")
      return rotate(
        db,
        account,
        apartment,
        account.ma_cu_dan_phu_trach,
        actor,
        "CAP_LAI_MAT_KHAU",
      );
    if (body.thao_tac !== "ban_giao")
      fail(422, "INVALID_ACTION", "Thao tác tài khoản không hợp lệ.");
    // All stay changes lock this apartment before mutation. Read after that lock,
    // without taking resident locks in the reverse order of the residency flow.
    const [owner] = await rows(
      db,
      "SELECT ma_cu_dan FROM lich_su_cu_tru WHERE ma_cu_dan=? AND ma_can_ho=? AND quan_he='CHU_HO' AND den_ngay IS NULL",
      [residentId, id],
    );
    if (!owner)
      fail(
        422,
        "NOT_HOUSEHOLDER",
        "Chỉ bàn giao cho cư dân đang là chủ hộ của căn này.",
      );
    if (account.ma_cu_dan_phu_trach === residentId)
      fail(
        409,
        "ALREADY_RESPONSIBLE",
        "Cư dân này đã phụ trách. Dùng Cấp lại mật khẩu nếu cần.",
      );
    return assignHouseholder(
      db,
      apartment,
      residentId,
      actor,
      body.xac_nhan_ban_giao,
    );
  });
}

export async function listApartmentAccounts(query) {
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  const conditions = ["u.ma_can_ho_thanh_toan IS NOT NULL"],
    values = [];
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    conditions.push(
      "(a.so_can_ho LIKE ? OR a.khoi LIKE ? OR u.ten_dang_nhap LIKE ? OR c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ?)",
    );
    values.push(q, q, q, q, q);
  }
  if (query.trang_thai) {
    if (!["DANG_HOAT_DONG", "DA_KHOA"].includes(query.trang_thai))
      fail(422, "INVALID_STATUS", "Trạng thái tài khoản không hợp lệ.");
    conditions.push("u.dang_hoat_dong=?");
    values.push(query.trang_thai === "DANG_HOAT_DONG" ? 1 : 0);
  }
  const from = `FROM nguoi_dung u JOIN can_ho a ON a.ma_can_ho=u.ma_can_ho_thanh_toan LEFT JOIN cu_dan c ON c.ma_cu_dan=u.ma_cu_dan_phu_trach WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(pool, `SELECT COUNT(*) AS total ${from}`, values);
  const data = await rows(
    pool,
    `SELECT ${columns},a.so_can_ho,a.khoi,a.tang ${from} ORDER BY a.khoi,a.tang,a.so_can_ho,u.ma_nguoi_dung LIMIT 20 OFFSET ${(page - 1) * 20}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function ownerPhoneChanged(db, residentId, actor) {
  const [account] = await rows(
    db,
    "SELECT ma_can_ho_thanh_toan FROM nguoi_dung WHERE ma_cu_dan_phu_trach=?",
    [residentId],
  );
  if (!account) return;
  await lockApartment(db, account.ma_can_ho_thanh_toan);
  const changed = await rows(
    db,
    "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1,phien_ban_ban_giao=phien_ban_ban_giao+1,so_lan_dang_nhap_sai=0,khoa_den_luc=NULL WHERE ma_cu_dan_phu_trach=?",
    [residentId],
  );
  if (!changed.affectedRows) return;
  await audit(
    db,
    account.ma_can_ho_thanh_toan,
    residentId,
    residentId,
    actor,
    "DOI_SO_DIEN_THOAI",
  );
}
```

## 4. `backend/src/modules/residency/residency.service.js`

Thay toàn bộ nội dung file.

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
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

export async function listApartments(query) {
  const { q, page, offset } = search(query);
  const conditions = ["(so_can_ho LIKE ? OR khoi LIKE ?)"];
  const values = [q, q];
  if (query.tang !== undefined && query.tang !== "") {
    const floor = integer(query.tang, "tang");
    if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
    conditions.push("tang=?");
    values.push(floor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM can_ho ${where}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT 20 OFFSET ${offset}`,
    values,
  );
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
export async function saveApartment(id, body, user) {
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
  });
}

const residentJoin = `FROM cu_dan c LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL LEFT JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho`;
export async function listResidents(query) {
  const { q, page, offset } = search(query);
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
  const data = await rows(
    pool,
    `SELECT c.*,l.ma_lich_su_cu_tru,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT 20 OFFSET ${offset}`,
    values,
  );
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
export async function saveResident(id, body, user) {
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
  });
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

## 5. `backend/src/modules/residency/residency.routes.js`

Thay toàn bộ nội dung file.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./residency.service.js";

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

## 6. `frontend/src/features/residency/ApartmentAccounts.jsx`

Tạo file mới.

```jsx
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Field, ErrorBox, Loading, useResource } from "../../shared/ui.jsx";
import { ApartmentAccount } from "./Residency.jsx";

export default function ApartmentAccounts() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/can_ho/tai_khoan?${params}`),
    [selected, setSelected] = useState(null),
    page = resource.result?.page || 1;
  function go(next) {
    const query = new URLSearchParams(params);
    query.set("page", String(next));
    setParams(query);
  }
  return (
    <>
      <h1>Tài khoản căn hộ</h1>
      <p>
        Mỗi căn có một tài khoản thanh toán. Đăng nhập bằng số điện thoại của
        chủ hộ phụ trách hiện tại hoặc mã CH, với mật khẩu tài khoản căn hộ.
      </p>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(new URLSearchParams(new FormData(e.currentTarget)));
        }}
      >
        <Field
          label="Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Trạng thái tài khoản căn hộ">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_HOAT_DONG">Đang hoạt động</option>
            <option value="DA_KHOA">Đã khóa</option>
          </select>
        </Field>
        <button>Tìm tài khoản căn hộ</button>
      </form>
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn hộ</th>
                <th>Mã tài khoản</th>
                <th>Chủ hộ phụ trách</th>
                <th>Số điện thoại đăng nhập</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((account) => (
                <tr key={account.ma_nguoi_dung}>
                  <td>
                    {account.so_can_ho}
                    <small>
                      Khối {account.khoi} · Tầng {account.tang}
                    </small>
                  </td>
                  <td>{account.ten_dang_nhap}</td>
                  <td>
                    {account.ma_cu_dan_phu_trach ? (
                      <Link
                        to={`/quan-tri/cu-dan/${account.ma_cu_dan_phu_trach}`}
                      >
                        {account.nguoi_phu_trach}
                      </Link>
                    ) : (
                      "Chưa gắn chủ hộ"
                    )}
                  </td>
                  <td>
                    {account.dien_thoai_phu_trach || "Chưa có số điện thoại"}
                  </td>
                  <td>
                    {account.dang_hoat_dong ? "Đang hoạt động" : "Đã khóa"}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelected(account.ma_can_ho_thanh_toan)}
                    >
                      Quản lý tài khoản
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && (
          <p>Chưa có tài khoản căn hộ phù hợp.</p>
        )}
        <div className="pagination">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {resource.result?.total || 0} tài khoản
          </span>
          <button
            disabled={
              resource.loading || page * 20 >= (resource.result?.total || 0)
            }
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
      {selected && (
        <>
          <div className="actions">
            <button onClick={() => setSelected(null)}>
              Đóng quản lý tài khoản
            </button>
          </div>
          <ApartmentAccount
            key={selected}
            id={selected}
            onChange={resource.reload}
          />
        </>
      )}
    </>
  );
}
```

## 7. `frontend/src/features/residency/Residency.jsx`

Thay toàn bộ nội dung file.

```jsx
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

## 8. `frontend/src/features/auth/Auth.jsx`

Thay toàn bộ nội dung file.

```jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  homeFor,
  roleNames,
} from "../../shared/ui.jsx";
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    getJson("/xac_thuc/toi")
      .then((r) => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const logout = async () => {
    await getJson("/xac_thuc/dang_xuat", { method: "POST" });
    setUser(null);
  };
  return (
    <Context.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </Context.Provider>
  );
}
export function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (roles && !roles.includes(user.vai_tro))
    return (
      <div className="card">
        <h1>Bạn không có quyền mở trang này</h1>
        <Link to={homeFor(user)}>Về không gian của tôi</Link>
      </div>
    );
  return children;
}
export function Login() {
  const { user, setUser } = useAuth(),
    navigate = useNavigate();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false);
  if (user) return <Navigate to={homeFor(user)} replace />;
  return (
    <section className="card narrow">
      <p className="eyebrow">KHÔNG GIAN CƯ DÂN & VẬN HÀNH</p>
      <h1>Đăng nhập</h1>
      <p className="muted">Sử dụng tài khoản do Ban quản lý cấp.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            const result = await getJson("/xac_thuc/dang_nhap", {
              method: "POST",
              body: Object.fromEntries(new FormData(e.currentTarget)),
            });
            setUser(result.data);
            navigate(homeFor(result.data));
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label="Số điện thoại hoặc tài khoản căn hộ"
          name="so_dien_thoai"
          type="text"
          required
          autoComplete="username"
        />
        <Field label="Loại tài khoản">
          <select name="loai_tai_khoan" defaultValue="TU_DONG">
            <option value="TU_DONG">Tự nhận diện</option>
            <option value="CAN_HO">Tài khoản căn hộ</option>
            <option value="CA_NHAN">Tài khoản cá nhân / Ban quản lý</option>
          </select>
        </Field>
        <p className="note">
          Tài khoản căn hộ dùng số điện thoại của chủ hộ phụ trách hiện tại hoặc
          mã CH. Nếu số điện thoại dùng chung với tài khoản cá nhân, chọn loại
          tài khoản phù hợp.
        </p>
        <Field
          label="Mật khẩu"
          name="mat_khau"
          type="password"
          required
          autoComplete="current-password"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
      <p className="muted">
        Chưa có tài khoản hoặc quên mật khẩu? Liên hệ Ban quản lý để được xác
        minh.
      </p>
      <Link to="/">Về cổng dịch vụ</Link>
    </section>
  );
}
export function Account() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  if (done)
    return (
      <div className="card">
        <h1>Đã đổi mật khẩu</h1>
        <p>Tất cả phiên cũ đã kết thúc.</p>
        <Link to="/dang-nhap" onClick={() => setUser(null)}>
          Đăng nhập lại
        </Link>
      </div>
    );
  return (
    <section className="card narrow">
      <h1>Tài khoản</h1>
      <p>
        {user.ho_va_ten} · {roleNames[user.vai_tro]}
      </p>
      <p>{user.ten_dang_nhap || user.so_dien_thoai}</p>
      {user.ma_can_ho_thanh_toan && (
        <p>
          Số điện thoại đăng nhập:{" "}
          {user.dien_thoai_dang_nhap || "Chưa gắn chủ hộ"}
        </p>
      )}
      <h2>Đổi mật khẩu</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setError(null);
          if (form.get("mat_khau_moi") !== form.get("xac_nhan")) {
            setError(new Error("Mật khẩu xác nhận không khớp."));
            return;
          }
          setPending(true);
          try {
            await getJson("/xac_thuc/doi_mat_khau", {
              method: "POST",
              body: Object.fromEntries(form),
            });
            setDone(true);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label="Mật khẩu hiện tại"
          name="mat_khau_cu"
          type="password"
          required
          autoComplete="current-password"
        />
        <Field
          label="Mật khẩu mới (ít nhất 10 ký tự)"
          name="mat_khau_moi"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <Field
          label="Nhập lại mật khẩu mới"
          name="xac_nhan"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          Đổi mật khẩu và kết thúc mọi phiên
        </button>
      </form>
    </section>
  );
}
```

## 9. `frontend/src/app/App.jsx`

Thay toàn bộ nội dung file.

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
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [["/ky-thuat/cong-viec", "Công việc"]]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
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
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
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
            {["/cu-dan/hoa-don", "/cu-dan/hoa-don/:id"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={resident}>
                    {path.endsWith(":id") ? <BillDetail /> : <Bills />}
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

## Chạy sau khi chép đủ file

Terminal tại thư mục gốc dự án:

```powershell
npm run dev:backend
```

Terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Sau khi chạy lại, tải lại trang bằng Ctrl+F5. Không cần chạy migration mới ở bản này. Tài khoản căn đã gắn chủ hộ từ bản trước tự nhận SĐT đang lưu trong hồ sơ, không cần tạo lại tài khoản hoặc nhập số vào SQL.

## Thử trên giao diện

1. BQL → **Tài khoản căn hộ**. Tìm căn 104 hoặc mã CH000004 (ví dụ), kiểm tra người phụ trách và SĐT hiển thị. Có thể tìm tên hoặc số điện thoại.
2. Mở cửa sổ/trình duyệt khác → Đăng nhập. Nhập SĐT vừa thấy, chọn **Tài khoản căn hộ**, nhập mật khẩu tài khoản căn. Mở hóa đơn của căn.
3. Nếu quên mật khẩu: BQL → danh sách tài khoản → **Quản lý tài khoản → Cấp lại mật khẩu và ngắt phiên cũ**. Lưu mật khẩu chỉ hiện một lần; số điện thoại không phải là mật khẩu.
4. Bàn giao cho chủ hộ mới qua tạo/nhập cư chủ hộ hoặc mục bàn giao. Tải lại danh sách để thấy người/SĐT mới. Đăng nhập bằng số mới và mật khẩu mới; số cũ không vào tài khoản căn được.
5. Khi sửa SĐT trong hồ sơ người phụ trách, đăng nhập lại bằng số mới và mật khẩu hiện tại. Người mới nhận tài khoản nên đổi mật khẩu tại Tài khoản.

Tài khoản cá nhân cũ vẫn có thể dùng SĐT của chính tài khoản cá nhân đó; việc này không cấp lại quyền dùng tài khoản căn đã bàn giao. Nếu có nhiều căn/tài khoản cùng số và mật khẩu, nhập đúng mã CH để chọn căn.

Đã kiểm tra riêng tư danh sách, phân trang 21 bản ghi, SĐT/+84, trùng tài khoản cá nhân, sửa số, đổi chủ hộ và ngừng cư trú; giao diện kiểm tra trên máy tính và điện thoại. Mật khẩu/hash không xuất hiện trong API danh sách.
