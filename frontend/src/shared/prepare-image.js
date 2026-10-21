export async function prepareImage(file) {
  if (!file.size || file.size > 25 * 1024 * 1024) {
    throw new Error(
      "Ảnh gốc cần nhỏ hơn 25 MB. Hãy chọn ảnh khác hoặc giảm kích thước ảnh.",
    );
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const text = String.fromCharCode(...bytes);
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && text.slice(1, 4) === "PNG";
  const webp = text.startsWith("RIFF") && text.slice(8, 12) === "WEBP";
  if (!jpeg && !png && !webp) {
    throw new Error(
      "Ảnh cần là JPEG, PNG hoặc WebP. Ảnh HEIC/HEIF chưa được hỗ trợ.",
    );
  }
  let bitmap;
  try {
    // Decode to a smaller bitmap before showing previews on memory-limited phones.
    bitmap = await createImageBitmap(file, {
      resizeWidth: 1280,
      resizeQuality: "high",
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error();
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error();
    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "") || "hien-truong"}.jpg`,
      { type: "image/jpeg", lastModified: file.lastModified },
    );
  } catch {
    throw new Error(
      "Không đọc được ảnh này. Hãy thử ảnh JPEG hoặc ảnh chụp màn hình khác.",
    );
  } finally {
    bitmap?.close();
  }
}
