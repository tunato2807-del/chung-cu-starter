import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./vehicles.service.js";

export const vehiclesRouter = Router();
vehiclesRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
vehiclesRouter.get("/", async (req, res) =>
  res.json(await service.list(req.query)),
);
vehiclesRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(integer(req.params.id, "id")) }),
);
vehiclesRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
vehiclesRouter.post("/:id/ket_thuc", async (req, res) =>
  res.json({
    data: await service.end(integer(req.params.id, "id"), req.body, req.user),
  }),
);
