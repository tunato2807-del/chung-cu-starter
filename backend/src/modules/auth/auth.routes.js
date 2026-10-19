import { Router } from "express";
import { pool, rows } from "../../lib/db.js";
import { integer, rateLimit } from "../../lib/http.js";
import * as service from "./auth.service.js";
import { listUsers } from "./auth.repository.js";
import { optionalAuth, requireAuth, roles } from "./auth.middleware.js";
export const authRouter = Router(),
  usersRouter = Router();
const cookie = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge: 8 * 3600 * 1000,
};
authRouter.post(
  "/dang_nhap",
  rateLimit(30, 15 * 60 * 1000),
  async (req, res) => {
    const { user, token } = await service.login(req.body);
    res.cookie("session", token, cookie).json({ data: user });
  },
);
// Clear the cookie even if a previous session has already been invalidated.
authRouter.post("/dang_xuat", async (req, res) => {
  const token = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("session="))
    ?.slice(8);
  const u = token ? await service.authenticate(token) : null;
  if (u)
    await rows(
      pool,
      "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
      [u.ma_nguoi_dung],
    );
  res
    .clearCookie("session", { ...cookie, maxAge: undefined })
    .json({ data: { ok: true } });
});
authRouter.use(optionalAuth, requireAuth);
authRouter.get("/toi", (req, res) => res.json({ data: req.user }));
authRouter.post(
  "/doi_mat_khau",
  rateLimit(10, 15 * 60 * 1000),
  async (req, res) => {
    await service.changePassword(req.user, req.body);
    res
      .clearCookie("session", { ...cookie, maxAge: undefined })
      .json({ data: { ok: true } });
  },
);
usersRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
usersRouter.get("/", async (req, res) => res.json({ data: await listUsers() }));
usersRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.createUser(req.body) }),
);
usersRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.setUserActive(
      req.user,
      integer(req.params.id, "id"),
      req.body.dang_hoat_dong,
    ),
  }),
);
