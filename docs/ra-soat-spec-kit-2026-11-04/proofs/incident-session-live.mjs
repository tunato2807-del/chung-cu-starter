import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { pool, rows } from "../../../backend/src/lib/db.js";
import { transition } from "../../../backend/src/modules/incidents/incidents.service.js";
// Writes only its own random fixtures and removes them. Use an isolated test DB.
assert.equal(process.env.REVIEW_ISOLATED_DB, "1");
assert.equal(process.env.DB_NAME, "chung_cu_test");
const suffix = randomBytes(4).toString("hex"),
  ids = [];
let location,
  report,
  blocker,
  writer,
  original,
  writerReleased = false;
try {
  for (const role of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN"])
    ids.push(
      (
        await rows(
          pool,
          "INSERT INTO nguoi_dung(ho_va_ten,mat_khau_ma_hoa,vai_tro) VALUES (?,'!test-only',?)",
          ["Review-" + suffix, role],
        )
      ).insertId,
    );
  location = (
    await rows(
      pool,
      "INSERT INTO vi_tri_qr(ten_vi_tri,loai,token_qr,ma_nguoi_tao) VALUES (?,'KHU_VUC',?,?)",
      ["Review-" + suffix, randomUUID(), ids[0]],
    )
  ).insertId;
  report = (
    await rows(
      pool,
      "INSERT INTO phan_anh(ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co,ma_ky_thuat_vien,trang_thai) VALUES (?,?,?,'Review','0900000000','Review report','Only isolated fake data','DIEN',?,'DA_PHAN_CONG')",
      [randomBytes(32).toString("hex"), randomUUID(), location, ids[1]],
    )
  ).insertId;
  blocker = await pool.getConnection();
  writer = await pool.getConnection();
  await blocker.beginTransaction();
  await rows(
    blocker,
    "SELECT ma_phan_anh FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE",
    [report],
  );
  let enter;
  const waiting = new Promise((r) => {
    enter = r;
  });
  original = pool.getConnection;
  pool.getConnection = async () => ({
    beginTransaction: () => writer.beginTransaction(),
    commit: () => writer.commit(),
    rollback: () => writer.rollback(),
    release: () => {
      writerReleased = true;
      writer.release();
    },
    execute(sql, args) {
      const result = writer.execute(sql, args);
      if (sql === "SELECT * FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE")
        enter();
      return result;
    },
  });
  const pending = transition(
    report,
    { phien_ban: 0, trang_thai: "DANG_XU_LY" },
    [],
    { ma_nguoi_dung: ids[1], vai_tro: "KY_THUAT_VIEN", phien_ban_token: 0 },
  );
  await waiting;
  await rows(
    pool,
    "UPDATE nguoi_dung SET dang_hoat_dong=0,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
    [ids[1]],
  );
  await blocker.commit();
  await pending;
  pool.getConnection = original;
  original = null;
  const [p] = await rows(
    pool,
    "SELECT trang_thai FROM phan_anh WHERE ma_phan_anh=?",
    [report],
  );
  const [u] = await rows(
    pool,
    "SELECT dang_hoat_dong FROM nguoi_dung WHERE ma_nguoi_dung=?",
    [ids[1]],
  );
  const [audit] = await rows(
    pool,
    "SELECT COUNT(*) AS n FROM lich_su_phan_anh WHERE ma_phan_anh=?",
    [report],
  );
  assert.equal(u.dang_hoat_dong, 0);
  assert.equal(p.trang_thai, "DANG_XU_LY");
  assert.equal(audit.n, 1);
  console.log(
    JSON.stringify({
      isolatedDatabase: true,
      realLockWait: true,
      actorActive: u.dang_hoat_dong,
      stateAfterRevocation: p.trang_thai,
      auditRows: audit.n,
    }),
  );
} finally {
  if (original) pool.getConnection = original;
  if (writer && !writerReleased) {
    await writer.rollback();
    writer.release();
  }
  if (blocker) {
    await blocker.rollback();
    blocker.release();
  }
  if (report) {
    await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
      report,
    ]);
    await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [report]);
  }
  if (location)
    await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [location]);
  for (const id of ids)
    await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
  await pool.end();
}
