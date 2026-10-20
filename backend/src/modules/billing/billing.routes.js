import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./billing.service.js";
import { remindBill } from "../announcements/announcements.service.js";
import { batchBills } from "./billing-batch.service.js";
export const ratesRouter = Router(),
  metersRouter = Router(),
  billsRouter = Router(),
  selfBillsRouter = Router();
for (const router of [ratesRouter, metersRouter, billsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfBillsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
ratesRouter.get("/", async (req, res) =>
  res.json(await service.rates(req.query)),
);
ratesRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.createRate(req.body, req.user) }),
);
metersRouter.get("/", async (req, res) =>
  res.json(await service.meters(req.query)),
);
metersRouter.put("/", async (req, res) =>
  res.json({ data: await service.saveMeter(req.body, req.user) }),
);
billsRouter.post("/lap", async (req, res) =>
  res.status(201).json({ data: await service.generate(req.body, req.user) }),
);
billsRouter.post("/hang_loat/xem_truoc", async (req, res) =>
  res.json({ data: await batchBills(req.body, req.user) }),
);
billsRouter.post("/hang_loat/xac_nhan", async (req, res) =>
  res.status(201).json({ data: await batchBills(req.body, req.user, true) }),
);
for (const router of [billsRouter, selfBillsRouter]) {
  router.get("/", async (req, res) =>
    res.json(await service.list(req.query, req.user)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.detail(integer(req.params.id, "id"), req.user),
    }),
  );
}
for (const action of [
  "tinh_lai",
  "duyet",
  "gui",
  "huy",
  "lap_thay_the",
  "xac_nhan_thanh_toan",
])
  billsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.action(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );

billsRouter.post("/:id/nhac_phi", async (req, res) =>
  res.json({
    data: await remindBill(integer(req.params.id, "id"), req.body, req.user),
  }),
);
