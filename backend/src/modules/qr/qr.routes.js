import { Router } from "express";
import { pool, rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./qr.service.js";
export const qrRouter = Router(),
  publicQrRouter = Router();
publicQrRouter.get("/:token", async (req, res) => {
  const [location] = await rows(
    pool,
    `SELECT v.ten_vi_tri,v.mo_ta,v.phien_ban,e.ma_tai_san,e.ten_thiet_bi FROM vi_tri_qr v LEFT JOIN thiet_bi e ON e.ma_thiet_bi=v.ma_thiet_bi WHERE v.token_qr=? AND v.dang_hoat_dong=1`,
    [req.params.token],
  );
  if (!location)
    fail(
      404,
      "QR_INVALID",
      "Mã QR không hợp lệ hoặc đã ngừng sử dụng. Vui lòng liên hệ Ban quản lý.",
    );
  res.json({
    data: {
      ten_vi_tri: location.ten_vi_tri,
      mo_ta: location.mo_ta,
      phien_ban_qr: location.phien_ban,
      thiet_bi: location.ma_tai_san
        ? {
            ma_tai_san: location.ma_tai_san,
            ten_thiet_bi: location.ten_thiet_bi,
          }
        : null,
    },
  });
});
qrRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
qrRouter.get("/", async (req, res) => res.json(await service.list(req.query)));
qrRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(req.params.id) }),
);
qrRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
qrRouter.put("/:id/thiet_bi", async (req, res) =>
  res.json({ data: await service.link(req.params.id, req.body, req.user) }),
);
qrRouter.patch("/:id", async (req, res) =>
  res.json({ data: await service.setActive(req.params.id, req.body) }),
);
qrRouter.post("/:id/sinh_lai_qr", async (req, res) =>
  res.json({ data: await service.rotate(req.params.id, req.body) }),
);
