import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./amenities.service.js";
export const amenitiesRouter = Router(),
  bookingsRouter = Router(),
  selfBookingsRouter = Router();
amenitiesRouter.use(
  optionalAuth,
  requireAuth,
  roles("QUAN_TRI_VIEN", "CU_DAN"),
);
bookingsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfBookingsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
amenitiesRouter.get("/", async (req, res) =>
  res.json(await service.facilities(req.query)),
);
amenitiesRouter.post("/", roles("QUAN_TRI_VIEN"), async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveFacility(null, req.body, req.user) }),
);
amenitiesRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.facilityDetail(integer(req.params.id, "id")),
  }),
);
amenitiesRouter.put("/:id", roles("QUAN_TRI_VIEN"), async (req, res) =>
  res.json({
    data: await service.saveFacility(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
amenitiesRouter.get("/:id/lich", async (req, res) =>
  res.json({
    data: await service.calendar(integer(req.params.id, "id"), req.query),
  }),
);
amenitiesRouter.post("/:id/dat_lich", roles("CU_DAN"), async (req, res) => {
  const data = await service.createBooking(
    integer(req.params.id, "id"),
    req.body,
    req.user,
  );
  res.status(data.replay ? 200 : 201).json({ data });
});
selfBookingsRouter.get("/ngu_canh", async (req, res) =>
  res.json({ data: await service.context(req.user) }),
);
for (const router of [bookingsRouter, selfBookingsRouter]) {
  router.get("/", async (req, res) =>
    res.json(await service.bookings(req.query, req.user)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.bookingDetail(integer(req.params.id, "id"), req.user),
    }),
  );
  for (const action of router === bookingsRouter
    ? ["duyet", "tu_choi", "huy"]
    : ["huy"])
    router.post(`/:id/${action}`, async (req, res) =>
      res.json({
        data: await service.act(
          integer(req.params.id, "id"),
          action,
          req.body,
          req.user,
        ),
      }),
    );
}
