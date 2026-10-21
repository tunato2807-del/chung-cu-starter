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
