import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./residency.service.js";

import { manageApartmentAccount } from "./apartment-accounts.service.js";

export const apartmentsRouter = Router(),
  residentsRouter = Router();
for (const router of [apartmentsRouter, residentsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));

apartmentsRouter.get("/", async (req, res) =>
  res.json(await service.listApartments(req.query)),
);
apartmentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.apartmentDetail(integer(req.params.id, "id")),
  }),
);
apartmentsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveApartment(null, req.body, req.user) }),
);
apartmentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveApartment(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);

residentsRouter.get("/tai_khoan", async (req, res) =>
  res.json(await service.availableAccounts(req.query)),
);
residentsRouter.get("/", async (req, res) =>
  res.json(await service.listResidents(req.query)),
);
residentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.residentDetail(integer(req.params.id, "id")),
  }),
);
residentsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveResident(null, req.body, req.user) }),
);
residentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveResident(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
for (const action of ["chuyen_can", "chuyen_di", "nhap_cu"])
  residentsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.changeStay(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );

apartmentsRouter.post("/:id/tai_khoan", async (req, res) =>
  res.json({
    data: await manageApartmentAccount(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
