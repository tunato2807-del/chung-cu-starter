import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, text, choice, integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
export const qrRouter = Router(),
  publicQrRouter = Router();
publicQrRouter.get("/:token", async (req, res) => {
  const [location] = await rows(
    pool,
    "SELECT ten_vi_tri,mo_ta FROM vi_tri_qr WHERE token_qr=? AND dang_hoat_dong=1",
    [req.params.token],
  );
  if (!location)
    fail(
      404,
      "QR_INVALID",
      "Mã QR không hợp lệ hoặc đã ngừng sử dụng. Vui lòng liên hệ Ban quản lý.",
    );
  res.json({ data: location });
});
qrRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
qrRouter.get("/", async (req, res) =>
  res.json({
    data: await rows(
      pool,
      "SELECT * FROM vi_tri_qr ORDER BY ma_vi_tri_qr DESC LIMIT 500",
    ),
  }),
);
qrRouter.post("/", async (req, res) => {
  const name = text(req.body.ten_vi_tri, "ten_vi_tri", 2, 100);
  const type = choice(req.body.loai, "loai", ["KHU_VUC", "THIET_BI"]);
  const result = await rows(
    pool,
    "INSERT INTO vi_tri_qr (ten_vi_tri,loai,mo_ta,token_qr,ma_nguoi_tao) VALUES (?,?,?,?,?)",
    [
      name,
      type,
      text(req.body.mo_ta || "", "mo_ta", 0, 255),
      randomUUID(),
      req.user.ma_nguoi_dung,
    ],
  );
  res
    .status(201)
    .json({
      data: (
        await rows(pool, "SELECT * FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
          result.insertId,
        ])
      )[0],
    });
});
qrRouter.patch("/:id", async (req, res) => {
  if (typeof req.body.dang_hoat_dong !== "boolean")
    fail(422, "VALIDATION", "Trạng thái không hợp lệ.");
  const r = await rows(
    pool,
    "UPDATE vi_tri_qr SET dang_hoat_dong=? WHERE ma_vi_tri_qr=?",
    [req.body.dang_hoat_dong, integer(req.params.id, "id")],
  );
  if (!r.affectedRows) fail(404, "NOT_FOUND", "Không tìm thấy vị trí.");
  res.json({ data: { ok: true } });
});
qrRouter.post("/:id/sinh_lai_qr", async (req, res) => {
  const token = randomUUID();
  await transaction(async (db) => {
    const [loc] = await rows(
      db,
      "SELECT * FROM vi_tri_qr WHERE ma_vi_tri_qr=? FOR UPDATE",
      [integer(req.params.id, "id")],
    );
    if (!loc) fail(404, "NOT_FOUND", "Không tìm thấy vị trí.");
    if (!loc.dang_hoat_dong)
      fail(409, "QR_INACTIVE", "Hãy kích hoạt vị trí trước khi thay mã.");
    await rows(db, "UPDATE vi_tri_qr SET token_qr=? WHERE ma_vi_tri_qr=?", [
      token,
      loc.ma_vi_tri_qr,
    ]);
  });
  res.json({ data: { token_qr: token } });
});
