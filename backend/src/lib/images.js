import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fail } from "./http.js";
export const imageDir = fileURLToPath(
  new URL("../../storage/images/", import.meta.url),
);
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
    fields: 20,
    fieldSize: 10000,
    parts: 25,
  },
}).array("hinh_anh", 5);
export async function saveImages(files = []) {
  await mkdir(imageDir, { recursive: true, mode: 0o700 });
  const names = [];
  try {
    for (const f of files) {
      let buffer;
      try {
        const img = sharp(f.buffer, {
          limitInputPixels: 25_000_000,
          animated: false,
        });
        const info = await img.metadata();
        if (
          !["jpeg", "png", "webp"].includes(info.format) ||
          (info.pages || 1) > 1
        )
          fail(422, "IMAGE_TYPE", "Chỉ nhận ảnh JPEG, PNG, WebP tĩnh.");
        // Decode and re-encode; strip metadata and never trust the supplied name or MIME type.
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
      } catch {
        fail(
          422,
          "IMAGE_INVALID",
          "Ảnh không hợp lệ, quá nhiều điểm ảnh hoặc định dạng không được hỗ trợ.",
        );
      }
      const name = `${randomUUID()}.jpg`;
      await writeFile(path.join(imageDir, name), buffer, {
        flag: "wx",
        mode: 0o600,
      });
      names.push(name);
    }
    return names;
  } catch (error) {
    await cleanupImages(names);
    throw error;
  }
}
export async function cleanupImages(names) {
  await Promise.all(
    names.map((n) => unlink(path.join(imageDir, n)).catch(() => {})),
  );
}
