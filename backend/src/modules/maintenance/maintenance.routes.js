import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./maintenance.service.js";
export const equipmentRouter = Router(),
  maintenanceRouter = Router();
equipmentRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
maintenanceRouter.use(
  optionalAuth,
  requireAuth,
  roles("QUAN_TRI_VIEN", "KY_THUAT_VIEN"),
);
equipmentRouter.get("/", async (req, res) =>
  res.json(await service.equipmentList(req.query)),
);
equipmentRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.createEquipment(req.body, req.user) }),
);
equipmentRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.equipmentDetail(integer(req.params.id, "id")),
  }),
);
equipmentRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.updateEquipment(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
equipmentRouter.post("/:id/phieu_bao_tri", async (req, res) => {
  const data = await service.createJob(
    integer(req.params.id, "id"),
    req.body,
    req.user,
  );
  res.status(data.replay ? 200 : 201).json({ data });
});
maintenanceRouter.get(
  "/ky_thuat_vien",
  roles("QUAN_TRI_VIEN"),
  async (req, res) => res.json(await service.technicians(req.query)),
);
maintenanceRouter.get("/", async (req, res) =>
  res.json(await service.jobs(req.query, req.user)),
);
maintenanceRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.jobDetail(integer(req.params.id, "id"), req.user),
  }),
);
for (const action of [
  "phan_cong",
  "doi_lich",
  "bat_dau",
  "bao_cao",
  "tra_lai",
  "nghiem_thu",
  "huy",
])
  maintenanceRouter.post(
    `/:id/${action}`,
    roles(
      ...(["bat_dau", "bao_cao"].includes(action)
        ? ["KY_THUAT_VIEN"]
        : ["QUAN_TRI_VIEN"]),
    ),
    async (req, res) =>
      res.json({
        data: await service.act(
          integer(req.params.id, "id"),
          action,
          req.body,
          req.user,
        ),
      }),
  );
