import { randomBytes, randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool, transaction, rows } from "../src/lib/db.js";
// Explicit local demo seed. No fixed passwords, and never reset existing accounts.
const accounts = [
  ["Ban quản lý", "0900000001", "QUAN_TRI_VIEN"],
  ["Kỹ thuật điện nước", "0900000002", "KY_THUAT_VIEN"],
  ["Cư dân demo", "0900000003", "CU_DAN"],
];
const credentials = [];
try {
  await transaction(async (db) => {
    for (const [name, phone, role] of accounts) {
      if (
        (
          await rows(db, "SELECT 1 FROM nguoi_dung WHERE so_dien_thoai=?", [
            phone,
          ])
        ).length
      )
        continue;
      const password = randomBytes(15).toString("base64url");
      await rows(
        db,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,mat_khau_ma_hoa) VALUES (?,?,?,?)",
        [name, phone, role, await bcrypt.hash(password, 12)],
      );
      credentials.push(`${name}: ${phone} / ${password}`);
    }
    const [admin] = await rows(
      db,
      "SELECT ma_nguoi_dung FROM nguoi_dung WHERE so_dien_thoai=?",
      [accounts[0][1]],
    );
    if (!(await rows(db, "SELECT 1 FROM vi_tri_qr LIMIT 1")).length)
      for (const name of ["Sảnh tầng 1", "Thang máy A", "Khu vực để xe"])
        await rows(
          db,
          "INSERT INTO vi_tri_qr (ten_vi_tri,token_qr,ma_nguoi_tao) VALUES (?,?,?)",
          [name, randomUUID(), admin.ma_nguoi_dung],
        );
  });
  if (credentials.length) {
    await appendFile(
      new URL("../.demo-credentials", import.meta.url),
      credentials.join("\n") + "\n",
      { mode: 0o600 },
    );
    console.log(
      "Demo accounts created. Read backend/.demo-credentials locally; do not share or commit it.",
    );
  } else console.log("Demo accounts already exist; no passwords changed.");
} finally {
  await pool.end();
}
