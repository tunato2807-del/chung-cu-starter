import { pool, rows } from "../../lib/db.js";

const count = (condition) => `CAST(COALESCE(SUM(${condition}),0) AS UNSIGNED)`;
const money = (expression) => `CAST(COALESCE(SUM(${expression}),0) AS CHAR)`;
const incidentOpen = "('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY')";
const jobOpen = "('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU')";

// One read-only snapshot for every counter and work queue. GET never generates work,
// sends reminders, changes bookings or writes a financial record.
export async function overview() {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const [clock] = await rows(
      db,
      `SELECT UTC_TIMESTAMP(6) AS tai_luc,
      DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR),'%Y-%m-%d') AS ngay_hien_tai,
      DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR),'%Y-%m-%d %H:%i:%s') AS gio_hien_tai`,
    );
    const day = clock.ngay_hien_tai,
      monthStart = `${day.slice(0, 7)}-01`,
      tomorrow = new Date(new Date(`${day}T00:00:00Z`).getTime() + 86400000)
        .toISOString()
        .slice(0, 10),
      utc = (d) =>
        new Date(`${d}T00:00:00+07:00`)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
    const [finance] = await rows(
      db,
      `SELECT
      ${money("CASE WHEN trang_thai='DA_GUI' THEN tong_tien ELSE 0 END")} AS con_phai_thu,
      ${money("CASE WHEN trang_thai='DA_GUI' AND han_thanh_toan<? THEN tong_tien ELSE 0 END")} AS no_qua_han,
      ${count("trang_thai='DA_GUI'")} AS hoa_don_chua_thu,
      ${count("trang_thai='DA_GUI' AND han_thanh_toan<?")} AS hoa_don_qua_han,
      COUNT(DISTINCT CASE WHEN trang_thai='DA_GUI' THEN ma_can_ho END) AS can_con_no,
      ${money("CASE WHEN trang_thai='DA_THANH_TOAN' AND ngay_thanh_toan>=? AND ngay_thanh_toan<? THEN so_tien_da_thu ELSE 0 END")} AS thu_trong_thang
      FROM hoa_don WHERE trang_thai IN ('DA_GUI','DA_THANH_TOAN')`,
      [day, day, utc(monthStart), utc(tomorrow)],
    );
    finance.hoa_don = await rows(
      db,
      `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.tong_tien,h.han_thanh_toan,a.so_can_ho,
      (h.han_thanh_toan<?) AS qua_han FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho
      WHERE h.trang_thai='DA_GUI'
      ORDER BY (h.han_thanh_toan<?) DESC,h.han_thanh_toan IS NULL,h.han_thanh_toan,h.ma_hoa_don LIMIT 5`,
      [day, day],
    );
    const [incidents] = await rows(
      db,
      `SELECT
      ${count("trang_thai='MOI'")} AS moi,
      ${count("trang_thai='DA_PHAN_CONG'")} AS da_phan_cong,
      ${count("trang_thai='DANG_XU_LY'")} AS dang_xu_ly,
      ${count("trang_thai='DA_XU_LY'")} AS cho_nghiem_thu,
      COUNT(*) AS dang_mo FROM phan_anh WHERE trang_thai IN ${incidentOpen}`,
    );
    incidents.danh_sach = await rows(
      db,
      `SELECT p.ma_phan_anh,p.tieu_de,p.trang_thai,p.do_uu_tien,p.ngay_tao,v.ten_vi_tri,u.ho_va_ten AS ky_thuat_vien
      FROM phan_anh p JOIN vi_tri_qr v ON v.ma_vi_tri_qr=p.ma_vi_tri_qr LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_ky_thuat_vien
      WHERE p.trang_thai IN ${incidentOpen}
      ORDER BY FIELD(p.do_uu_tien,'KHAN_CAP','CAO','TRUNG_BINH','THAP'),p.ngay_tao,p.ma_phan_anh LIMIT 5`,
    );
    const [maintenance] = await rows(
      db,
      `SELECT
      ${count("ngay_den_han<?")} AS phieu_qua_han,
      ${count("trang_thai='CHO_NGHIEM_THU'")} AS cho_nghiem_thu,
      COUNT(*) AS phieu_dang_mo FROM phieu_bao_tri WHERE trang_thai IN ${jobOpen}`,
      [day],
    );
    const [equipment] = await rows(
      db,
      `SELECT
      ${count("ngay_bao_tri_tiep_theo<?")} AS thiet_bi_qua_han,
      ${count("ngay_bao_tri_tiep_theo>=? AND ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL nhac_truoc_ngay DAY)")} AS thiet_bi_sap_den_han
      FROM thiet_bi WHERE trang_thai<>'NGUNG_SU_DUNG'`,
      [day, day, day],
    );
    Object.assign(maintenance, equipment);
    maintenance.danh_sach = await rows(
      db,
      `SELECT j.ma_phieu_bao_tri,j.tieu_de,j.ten_thiet_bi_luc_lap,j.trang_thai,j.ngay_den_han,j.do_uu_tien,u.ho_va_ten AS ky_thuat_vien
      FROM phieu_bao_tri j LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=j.ma_ky_thuat_vien WHERE j.trang_thai IN ${jobOpen}
      ORDER BY (j.ngay_den_han<?) DESC,j.ngay_den_han,(j.trang_thai='CHO_NGHIEM_THU') DESC,j.ma_phieu_bao_tri LIMIT 5`,
      [day],
    );
    const [amenities] = await rows(
      db,
      `SELECT
      ${count("trang_thai='CHO_DUYET'")} AS cho_duyet,
      ${count("trang_thai='DA_DUYET' AND bat_dau>=? AND bat_dau<?")} AS da_duyet_hom_nay
      FROM dat_lich_tien_ich`,
      [`${day} 00:00:00`, `${tomorrow} 00:00:00`],
    );
    amenities.danh_sach = await rows(
      db,
      `SELECT b.ma_dat_lich,b.ten_tien_ich,b.ten_nguoi_dat,b.bat_dau,b.ket_thuc,b.so_nguoi,b.trang_thai,a.so_can_ho
      FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho
      WHERE (b.trang_thai='CHO_DUYET' AND b.bat_dau>?) OR (b.trang_thai='DA_DUYET' AND b.ket_thuc>?)
      ORDER BY b.bat_dau,b.ma_dat_lich LIMIT 5`,
      [clock.gio_hien_tai, clock.gio_hien_tai],
    );
    await db.commit();
    return {
      ...clock,
      tu_ngay_thu: monthStart,
      den_ngay_thu: day,
      tai_chinh: finance,
      phan_anh: incidents,
      bao_tri: maintenance,
      tien_ich: amenities,
    };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
