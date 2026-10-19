import { rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
export async function lockApartment(db, id) {
  const [a] = await rows(
    db,
    "SELECT * FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
    [id],
  );
  if (!a) fail(404, "NOT_FOUND", "Không tìm thấy căn hộ.");
  return a;
}
export async function assertVehiclePeriodOpen(db, apartmentId, from) {
  await lockApartment(db, apartmentId);
  const locked = await rows(
    db,
    "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND tinh_xe=1 AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') AND ngay_chot_phi>=? LIMIT 1 FOR UPDATE",
    [apartmentId, from],
  );
  if (locked.length)
    fail(
      409,
      "BILLED_VEHICLE_PERIOD",
      "Phí xe tại ngày này đã được chốt trong hóa đơn. Hãy chọn ngày sau ngày chốt hoặc xử lý hóa đơn trước.",
    );
}
