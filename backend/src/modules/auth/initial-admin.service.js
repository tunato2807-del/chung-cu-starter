import { randomBytes } from "node:crypto";
import { mkdir, open, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { text, phone } from "../../lib/http.js";

const storage = fileURLToPath(
  new URL("../../../storage/setup/", import.meta.url),
);

function stop(code) {
  throw Object.assign(new Error(code), { code });
}

export function adminIdentity(input) {
  const name = text(input.name, "ho_va_ten", 2, 100);
  if (/[\x00-\x1f\x7f]/u.test(name)) stop("VALIDATION");
  return { name, phone: phone(input.phone) };
}

async function writeCredential(filename, record) {
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  // Exclusive creation: never overwrite a previous administrator's credentials.
  const handle = await open(filename, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(record, null, 2) + "\n", "utf8");
    await handle.sync();
  } catch (error) {
    await handle.close();
    await unlink(filename).catch(() => {});
    throw error;
  }
  await handle.close();
}

export async function initializeAdmin(databasePool, input, options = {}) {
  const identity = adminIdentity(input);
  const db = await databasePool.getConnection();
  let locked = false,
    active = true,
    inTransaction = false,
    commitAttempted = false,
    credentialFile;
  try {
    const [[schema]] = await db.query("SELECT DATABASE() AS name");
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(schema.name || "")) stop("VALIDATION");
    if (/(?:^|_)(?:test|nghiem_thu)(?:_|$)/i.test(schema.name))
      stop("TEST_DATABASE");
    const [[lock]] = await db.query(
      "SELECT GET_LOCK(CONCAT('thesis:admin:',LEFT(SHA2(DATABASE(),256),40)),5) AS acquired",
    );
    if (Number(lock.acquired) !== 1) stop("SETUP_LOCKED");
    locked = true;
    try {
      const [applied] = await db.execute(
        "SELECT name FROM schema_migrations WHERE name=?",
        ["001_thesis_schema.sql"],
      );
      if (applied.length !== 1) stop("MIGRATION_REQUIRED");
    } catch {
      stop("MIGRATION_REQUIRED");
    }
    await db.beginTransaction();
    inTransaction = true;
    const [users] = await db.query(
      "SELECT ma_nguoi_dung FROM nguoi_dung LIMIT 1 FOR UPDATE",
    );
    if (users.length) stop("EXISTING_ACCOUNTS");
    const password = randomBytes(24).toString("base64url");
    const [result] = await db.execute(
      "INSERT INTO nguoi_dung(ho_va_ten,so_dien_thoai,vai_tro,mat_khau_ma_hoa) VALUES (?,?,'QUAN_TRI_VIEN',?)",
      [identity.name, identity.phone, await bcrypt.hash(password, 12)],
    );
    const filename = path.join(
      options.directory || storage,
      `${schema.name}.initial-admin.json`,
    );
    await writeCredential(filename, {
      database: schema.name,
      ho_va_ten: identity.name,
      so_dien_thoai: identity.phone,
      mat_khau: password,
      tao_luc: new Date().toISOString(),
    });
    credentialFile = filename;
    // File is durable before commit so an interrupted process cannot lose the only password.
    commitAttempted = true;
    await db.commit();
    inTransaction = false;
    return { database: schema.name, userId: result.insertId, credentialFile };
  } catch (error) {
    if (inTransaction) {
      try {
        await db.rollback();
      } catch {
        db.destroy();
        active = false;
      }
    }
    if (commitAttempted) stop("COMMIT_UNCERTAIN");
    if (credentialFile) await unlink(credentialFile).catch(() => {});
    throw error;
  } finally {
    if (locked && active) {
      try {
        await db.query(
          "SELECT RELEASE_LOCK(CONCAT('thesis:admin:',LEFT(SHA2(DATABASE(),256),40)))",
        );
      } catch {
        db.destroy();
        active = false;
      }
    }
    if (active) db.release();
  }
}
