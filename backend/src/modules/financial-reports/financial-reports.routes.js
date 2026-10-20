import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./financial-reports.service.js";
export const financialReportsRouter = Router();
financialReportsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
financialReportsRouter.get("/bo_loc", async (req, res) =>
  res.json({ data: await service.blocks() }),
);
financialReportsRouter.get("/cong_no", async (req, res) =>
  res.json(await service.debts(req.query)),
);
financialReportsRouter.get("/thu_phi", async (req, res) =>
  res.json(await service.collections(req.query)),
);
