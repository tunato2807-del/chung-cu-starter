import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const secret = () => randomBytes(32).toString("hex");
try {
  await writeFile(
    new URL("../.env", import.meta.url),
    `DB_HOST=127.0.0.1\nDB_PORT=3307\nDB_USER=chung_cu\nDB_NAME=chung_cu\nDB_PASSWORD=${secret()}\nMYSQL_ROOT_PASSWORD=${secret()}\nJWT_SECRET=${secret()}\nCOOKIE_SECURE=false\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created local .env. Existing files are never overwritten.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Keeping existing .env.");
}
