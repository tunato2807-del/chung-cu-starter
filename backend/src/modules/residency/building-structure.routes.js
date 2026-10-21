import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { buildingMap } from "./building-map.service.js";
import {
  saveBlock,
  saveFloor,
  deleteStructure,
} from "./building-structure.service.js";

export const structureRouter = Router();
structureRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
structureRouter.get("/", async (req, res) => res.json(await buildingMap()));
structureRouter.post("/khoi", async (req, res) =>
  res.status(201).json({ data: await saveBlock(null, req.body) }),
);
structureRouter.patch("/khoi/:khoi", async (req, res) =>
  res.json({ data: await saveBlock(req.params.khoi, req.body) }),
);
structureRouter.delete("/khoi/:khoi", async (req, res) =>
  res.json({ data: await deleteStructure(req.params.khoi, null, req.body) }),
);
structureRouter.post("/khoi/:khoi/tang", async (req, res) =>
  res
    .status(201)
    .json({ data: await saveFloor(req.params.khoi, null, req.body) }),
);
structureRouter.patch("/khoi/:khoi/tang/:tang", async (req, res) =>
  res.json({
    data: await saveFloor(req.params.khoi, req.params.tang, req.body),
  }),
);
structureRouter.delete("/khoi/:khoi/tang/:tang", async (req, res) =>
  res.json({
    data: await deleteStructure(req.params.khoi, req.params.tang, req.body),
  }),
);
