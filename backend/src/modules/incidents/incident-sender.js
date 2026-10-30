import { rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";

// Images may take time to process. Revalidate and hold the sender identity until
// commit, so a handover/password change during that work cannot misattribute it.
export async function lockSender(db, user) {
  if (!user) return { resident: null, apartmentAccount: false };
  const expired = () =>
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Vui lòng đăng nhập lại trước khi gửi phản ánh.",
    );
  // Match residency's resident -> account lock order, including the resident FK
  // taken by the subsequent INSERT. Never lock a new resident after the account.
  let person;
  if (user.vai_tro === "CU_DAN" && user.ma_cu_dan != null) {
    [person] = await rows(
      db,
      "SELECT ma_cu_dan,ma_nguoi_dung FROM cu_dan WHERE ma_cu_dan=? FOR SHARE",
      [user.ma_cu_dan],
    );
    if (!person) expired();
  }
  const [current] = await rows(
    db,
    "SELECT ma_nguoi_dung,vai_tro,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach,dang_hoat_dong,phien_ban_token FROM nguoi_dung WHERE ma_nguoi_dung=? FOR SHARE",
    [user.ma_nguoi_dung],
  );
  if (
    !current?.dang_hoat_dong ||
    current.phien_ban_token !== user.phien_ban_token ||
    current.vai_tro !== user.vai_tro
  )
    expired();
  const apartmentAccount = current.ma_can_ho_thanh_toan !== null;
  if (apartmentAccount) {
    if (current.ma_cu_dan_phu_trach === null)
      fail(
        422,
        "HOUSEHOLDER_REQUIRED",
        "Tài khoản căn hộ chưa gắn chủ hộ phụ trách. Vui lòng liên hệ Ban quản lý trước khi gửi phản ánh bằng tài khoản này.",
      );
    if (current.ma_cu_dan_phu_trach !== person?.ma_cu_dan) expired();
  } else if (person && person.ma_nguoi_dung !== current.ma_nguoi_dung)
    expired();
  return { resident: person?.ma_cu_dan ?? null, apartmentAccount };
}
