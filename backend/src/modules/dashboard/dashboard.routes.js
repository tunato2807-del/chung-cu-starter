import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { overview } from "./dashboard.service.js";
import { statistics } from "./dashboard-statistics.service.js";
export const dashboardRouter = Router();
dashboardRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
dashboardRouter.get("/", async (req, res) =>
  res.json({ data: await overview() }),
);
dashboardRouter.get("/thong_ke", async (req, res) =>
  res.json({ data: await statistics(req.query) }),
);
