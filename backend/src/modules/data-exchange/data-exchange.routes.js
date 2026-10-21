import { Router } from "express";
import multer from "multer";
import { pool, rows } from "../../lib/db.js";
import { choice, fail, rateLimit } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { format, reserve } from "../report-exports/report-files.js";
import { catalog, publicCatalog } from "./catalog.js";
import { template } from "./import-files.js";
import { importFile } from "./import.service.js";
import { exportData } from "./export.service.js";

export const dataExchangeRouter = Router();
dataExchangeRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
dataExchangeRouter.get("/", (req, res) => res.json({ data: publicCatalog() }));
dataExchangeRouter.get("/lich_su", async (req, res) =>
  res.json({
    data: await rows(
      pool,
      "SELECT ma_dot_nhap,phan_he,so_dong,ngay_tao FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=? ORDER BY ma_dot_nhap DESC LIMIT 20",
      [req.user.ma_nguoi_dung],
    ),
  }),
);
dataExchangeRouter.param("kind", (req, res, next, kind) => {
  choice(kind, "phan_he", Object.keys(catalog));
  next();
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 2,
    fieldSize: 4096,
    parts: 3,
  },
}).single("tep");
async function withLimit(req, work) {
  let release;
  try {
    release = reserve(req.user.ma_nguoi_dung);
  } catch (error) {
    if (error.code === "EXPORT_BUSY")
      fail(429, "FILE_BUSY", "Đang xử lý tệp. Chờ hoàn tất rồi thử lại.");
    throw error;
  }
  try {
    return await work();
  } finally {
    release();
  }
}
dataExchangeRouter.get("/:kind/mau", async (req, res) =>
  withLimit(req, async () => {
    if (!catalog[req.params.kind].importable)
      fail(422, "IMPORT_UNSUPPORTED", "Phần này chỉ hỗ trợ xuất danh sách.");
    const f = format(req.query),
      buffer = await template(req.params.kind, f, req.query);
    res.set(
      "Content-Type",
      f === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf",
    );
    res.set(
      "Content-Disposition",
      `attachment; filename="mau-${req.params.kind}.${f}"`,
    );
    res.set("X-Export-Rows", "0");
    res.set("Content-Security-Policy", "sandbox; default-src 'none'");
    res.send(buffer);
  }),
);
dataExchangeRouter.get("/:kind/xuat", async (req, res) =>
  withLimit(req, () =>
    exportData(req.params.kind, req.query, req.user, format(req.query), res),
  ),
);
for (const [action, commit] of [
  ["xem_truoc", false],
  ["nhap", true],
])
  dataExchangeRouter.post(
    `/:kind/${action}`,
    rateLimit(30, 15 * 60 * 1000),
    async (req, res) =>
      withLimit(req, async () => {
        if (!catalog[req.params.kind].importable)
          fail(
            422,
            "IMPORT_UNSUPPORTED",
            "Phần này chỉ hỗ trợ xuất danh sách.",
          );
        await new Promise((resolve, reject) =>
          upload(req, res, (error) => {
            if (error)
              reject(
                Object.assign(
                  new Error(
                    "Chọn đúng một tệp Excel/PDF tối đa 5 MB và các trường xác nhận của biểu mẫu.",
                  ),
                  { status: 413, code: "IMPORT_UPLOAD_LIMIT" },
                ),
              );
            else resolve();
          }),
        );
        const result = await importFile(
          req.params.kind,
          req.file,
          req.body,
          req.user,
          commit,
        );
        res.json({ data: result });
      }),
  );
