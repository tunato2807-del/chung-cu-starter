import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function configurePostgresql(source, output) {
  if (path.resolve(source) === path.resolve(output))
    throw new Error(
      "Tệp nguồn và đích phải khác nhau; giữ nguyên cấu hình MySQL.",
    );
  const old = parseEnv(await readFile(source, "utf8"));
  const keep = ["JWT_SECRET", "COOKIE_SECURE", "PORT", "TRUST_PROXY"];
  const next = {
    DB_ENGINE: "postgresql",
    DB_HOST: "127.0.0.1",
    DB_PORT: "5432",
    DB_USER: "chung_cu",
    DB_NAME: old.DB_NAME || "chung_cu",
    DB_PASSWORD: randomBytes(24).toString("base64url"),
    ...Object.fromEntries(
      keep
        .filter((key) => old[key] !== undefined)
        .map((key) => [key, old[key]]),
    ),
  };
  // Escape values using dotenv's single-quoted multiline grammar. A quote in
  // an old value is rejected, rather than producing executable/config text.
  const encoded = Object.entries(next)
    .map(([key, value]) => {
      if (/[\r\n']/.test(value))
        throw new Error(
          `Giá trị ${key} cần được sao chép thủ công vào cấu hình riêng.`,
        );
      return `${key}='${value}'`;
    })
    .join("\n");
  await writeFile(
    output,
    "# PostgreSQL: cấu hình riêng; không ghi đè tệp MySQL.\n" + encoded + "\n",
    { flag: "wx", mode: 0o600 },
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const source =
    args.find((a) => a.startsWith("--source-env="))?.slice(13) || ".env";
  const output =
    args.find((a) => a.startsWith("--output="))?.slice(9) || ".env.postgresql";
  try {
    if (
      args.some(
        (a) => !a.startsWith("--source-env=") && !a.startsWith("--output="),
      )
    )
      throw new Error("Dùng --source-env=.env --output=.env.postgresql.");
    await configurePostgresql(source, output);
    console.log(
      "Đã tạo cấu hình PostgreSQL riêng (không in mật khẩu). Nếu dùng PostgreSQL cài riêng, mở tệp đích để điền DB_USER/DB_PASSWORD. Nếu dùng Compose, dùng chính tệp này với --env-file. Xem docs/chuyen-postgresql-vscode.md.",
    );
  } catch (error) {
    console.error(
      error.code
        ? `Không tạo được cấu hình (${error.code}); không ghi đè tệp đã có.`
        : error.message,
    );
    process.exitCode = 1;
  }
}
