import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./treasury.service.js";
import { upload } from "./treasury.proofs.js";
import { download } from "../report-exports/report-exports.service.js";
export const fundsRouter = Router(),
  vouchersRouter = Router();
for (const router of [fundsRouter, vouchersRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
fundsRouter.get("/", async (req, res) =>
  res.json(await service.funds(req.query)),
);
fundsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveFund(null, req.body, req.user) }),
);
fundsRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.fundDetail(integer(req.params.id, "id")) }),
);
fundsRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.saveFund(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
fundsRouter.get("/:id/so_quy", async (req, res) =>
  res.json(await service.ledger(integer(req.params.id, "id"), req.query)),
);
vouchersRouter.get("/", async (req, res) =>
  res.json(await service.list(req.query)),
);
vouchersRouter.post("/", async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(data.replay ? 200 : 201).json({ data });
});
vouchersRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(integer(req.params.id, "id")) }),
);
vouchersRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.edit(integer(req.params.id, "id"), req.body, req.user),
  }),
);
for (const action of ["duyet", "huy", "dao"])
  vouchersRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.act(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
vouchersRouter.post("/:id/chung_tu", upload, async (req, res) =>
  res.json({
    data: await service.attach(
      integer(req.params.id, "id"),
      req.body,
      req.files,
      req.user,
    ),
  }),
);
vouchersRouter.delete("/:id/chung_tu/:proof", async (req, res) =>
  res.json({
    data: await service.removeProof(
      integer(req.params.id, "id"),
      integer(req.params.proof, "proof"),
      req.body,
      req.user,
    ),
  }),
);
vouchersRouter.get("/:id/chung_tu/:proof", async (req, res) => {
  const f = await service.proof(
    integer(req.params.id, "id"),
    integer(req.params.proof, "proof"),
  );
  res.set("Content-Type", f.loai_tep);
  res.set(
    "Content-Disposition",
    `attachment; filename="chung-tu-${integer(req.params.proof, "proof")}.${f.loai_tep === "application/pdf" ? "pdf" : "jpg"}"`,
  );
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  res.send(f.noi_dung);
});

fundsRouter.get("/:id/so_quy/xuat", async (req, res) =>
  download(req, res, "so_quy", integer(req.params.id, "id")),
);
