import { Router } from "express";
import path from "node:path";
import { pool, rows } from "../../lib/db.js";
import { fail, integer, rateLimit } from "../../lib/http.js";
import { upload, imageDir } from "../../lib/images.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./incidents.service.js";
import * as repo from "./incidents.repository.js";
export const publicIncidentsRouter = Router(),
  incidentsRouter = Router();
publicIncidentsRouter.post(
  "/tra_cuu",
  rateLimit(60, 15 * 60 * 1000),
  async (req, res) => res.json({ data: await service.lookup(req.body) }),
);
publicIncidentsRouter.post(
  "/",
  rateLimit(60, 3600000),
  optionalAuth,
  upload,
  async (req, res) => {
    const receipt = await service.submit(
      req.body,
      req.files || [],
      req.user,
      req.ip,
    );
    res.status(receipt.replay ? 200 : 201).json({ data: receipt });
  },
);
incidentsRouter.use(optionalAuth, requireAuth);
incidentsRouter.get("/", async (req, res) =>
  res.json(await repo.list(req.user, req.query)),
);
incidentsRouter.get("/:id", async (req, res) =>
  res.json({ data: await repo.detail(integer(req.params.id, "id"), req.user) }),
);
incidentsRouter.get("/:id/hinh_anh/:image", async (req, res) => {
  const id = integer(req.params.id, "id");
  await repo.detail(id, req.user);
  const [img] = await rows(
    pool,
    "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=? AND ma_hinh_anh_phan_anh=?",
    [id, integer(req.params.image, "image")],
  );
  if (!img) fail(404, "NOT_FOUND", "Không tìm thấy ảnh.");
  res.type("jpeg").sendFile(path.join(imageDir, img.duong_dan_tep));
});
incidentsRouter.patch(
  "/:id/phan_cong",
  roles("QUAN_TRI_VIEN"),
  async (req, res) => {
    await service.assign(integer(req.params.id, "id"), req.body, req.user);
    res.json({
      data: await repo.detail(integer(req.params.id, "id"), req.user),
    });
  },
);
incidentsRouter.patch(
  "/:id/trang_thai",
  roles("QUAN_TRI_VIEN", "KY_THUAT_VIEN"),
  upload,
  async (req, res) => {
    const id = integer(req.params.id, "id");
    await service.transition(id, req.body, req.files || [], req.user);
    res.json({ data: await repo.detail(id, req.user) });
  },
);
