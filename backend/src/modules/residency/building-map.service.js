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
