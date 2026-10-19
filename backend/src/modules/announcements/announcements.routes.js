import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./announcements.service.js";
export const announcementsRouter = Router(),
  selfAnnouncementsRouter = Router();
announcementsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfAnnouncementsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
selfAnnouncementsRouter.get("/chua_doc", async (req, res) =>
  res.json({ data: await service.unreadCount(req.user) }),
);
for (const [router, personal] of [
  [announcementsRouter, false],
  [selfAnnouncementsRouter, true],
]) {
  router.get("/", async (req, res) =>
    res.json(await service.list(req.query, req.user, personal)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.detail(
        integer(req.params.id, "id"),
        req.user,
        personal,
      ),
    }),
  );
}
announcementsRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
announcementsRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.change(
      integer(req.params.id, "id"),
      "sua",
      req.body,
      req.user,
    ),
  }),
);
for (const action of ["phat_hanh", "thu_hoi"])
  announcementsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.change(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
selfAnnouncementsRouter.post("/:id/da_doc", async (req, res) =>
  res.json({
    data: await service.markRead(integer(req.params.id, "id"), req.user),
  }),
);
