import multer from "multer";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { fail } from "../../lib/http.js";
const parse = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
    fields: 2,
    fieldSize: 100,
    parts: 7,
  },
}).array("chung_tu", 5);
export function upload(req, res, next) {
  parse(req, res, (error) => {
    if (error)
      return next(
        Object.assign(
          new Error(
            "Tối đa 5 chứng từ, mỗi tệp không quá 5 MB; chỉ dùng trường chung_tu và phien_ban.",
          ),
          { status: 413, code: "PROOF_UPLOAD_LIMIT" },
        ),
      );
    next();
  });
}
export async function prepare(files = []) {
  if (!files.length) fail(422, "PROOF_REQUIRED", "Chọn ít nhất một chứng từ.");
  const result = [];
  for (const file of files) {
    let buffer,
      type,
      name =
        file.originalname
          .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
          .slice(0, 110) || "Chứng từ";
    if (file.buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
      // PDF is served as a download with sandbox/nosniff, never embedded or executed.
      if (!/%%EOF\s*$/.test(file.buffer.subarray(-1024).toString("latin1")))
        fail(422, "PROOF_INVALID", "Tệp PDF chưa đầy đủ hoặc không hợp lệ.");
      buffer = file.buffer;
      type = "application/pdf";
    } else {
      try {
        const img = sharp(file.buffer, {
            limitInputPixels: 25_000_000,
            animated: false,
          }),
          info = await img.metadata();
        if (
          !["jpeg", "png", "webp"].includes(info.format) ||
          (info.pages || 1) > 1
        )
          throw new Error("format");
        buffer = await img
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        type = "image/jpeg";
        name = name.replace(/\.[^.]*$/, "") + ".jpg";
      } catch {
        fail(
          422,
          "PROOF_INVALID",
          "Chỉ nhận PDF hoặc ảnh JPEG, PNG, WebP tĩnh hợp lệ, tối đa 25 triệu điểm ảnh.",
        );
      }
    }
    if (buffer.length > 5 * 1024 * 1024)
      fail(422, "PROOF_TOO_LARGE", "Chứng từ sau xử lý vượt 5 MB.");
    result.push({
      name,
      type,
      buffer,
      hash: createHash("sha256").update(buffer).digest("hex"),
    });
  }
  return [...new Map(result.map((x) => [x.hash, x])).values()];
}
