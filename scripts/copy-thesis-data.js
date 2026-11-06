// MySQL source019/018 -> separate empty MySQL thesis schema. Source is read-only.
import mysql from "mysql2/promise";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { historyCatalog, historyRecord } from "../backend/src/lib/history.js";
import { pool, databaseConfig } from "../backend/src/lib/db.js";
import { migrate } from "../backend/scripts/migrate.js";
import { ensureDatabase } from "./mysql-admin.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const q = mysql.escapeId;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export function copyOptions(args) {
  const result = {};
  for (const arg of args) {
    const m = /^--(source-env|source-db|target-db)=(.+)$/.exec(arg);
    if (!m || result[m[1]])
      throw new Error(
        "Dùng --source-env=.env.mysql [--source-db=chung_cu] [--target-db=chung_cu_do_an].",
      );
    result[m[1]] = m[2];
  }
  if (!result["source-env"])
    throw new Error("Cần tệp cấu hình nguồn MySQL riêng.");
  for (const field of ["source-db", "target-db"])
    if (result[field] && !/^[a-z][a-z0-9_]{0,62}$/.test(result[field]))
      throw new Error("Tên database không hợp lệ.");
  return result;
}
export function canonical(value, type) {
  if (value === null) return null;
  if (Buffer.isBuffer(value)) return ["bytes", value.toString("hex")];
  const text = String(value);
  if (["datetime", "timestamp"].includes(type)) {
    const m =
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(text);
    if (!m) throw new Error("INVALID_DATE");
    return `${m[1]} ${m[2]}.${(m[3] || "").padEnd(6, "0")}`;
  }
  // Both endpoints are MySQL; jsonStrings preserves exact 64-bit JSON numbers.
  return text;
}
const rowHash = (row, columns) =>
  hash(JSON.stringify(columns.map((c) => canonical(row[c.name], c.type))));
const tableHash = (hashes) => hash(hashes.sort().join("\n"));
export async function assertEmptyDestination(db) {
  const [tables] = await db.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'",
  );
  for (const { name } of tables) {
    if (["schema_migrations", "loai_phi", "quy_tai_chinh"].includes(name))
      continue;
    const [[row]] = await db.query(`SELECT COUNT(*) AS n FROM ${q(name)}`);
    if (String(row.n) !== "0")
      throw Object.assign(new Error("Target already contains data."), {
        code: "TARGET_NOT_EMPTY",
      });
  }
  if (tables.some((t) => t.name === "loai_phi")) {
    const [fees] = await db.query(
      "SELECT loai_phi,ten_phi,don_vi_tinh FROM loai_phi ORDER BY loai_phi",
    );
    const expected = [
      ["GUI_O_TO", "Gửi ô tô", "xe"],
      ["GUI_XE_DAP", "Gửi xe đạp", "xe"],
      ["GUI_XE_MAY", "Gửi xe máy", "xe"],
      ["PHI_QUAN_LY", "Phí quản lý", "m²"],
      ["TIEN_DIEN", "Tiền điện", "kWh"],
      ["TIEN_NUOC", "Tiền nước", "m³"],
    ];
    if (
      JSON.stringify(
        fees.map((r) => [r.loai_phi, r.ten_phi, r.don_vi_tinh]),
      ) !== JSON.stringify(expected)
    )
      throw Object.assign(new Error("Target fee catalog changed."), {
        code: "TARGET_NOT_EMPTY",
      });
  }
  if (tables.some((t) => t.name === "quy_tai_chinh")) {
    const [funds] = await db.query(
      "SELECT ma_quy,ten_quy,mo_ta,dang_hoat_dong,nhan_thu_hoa_don,phien_ban FROM quy_tai_chinh",
    );
    if (
      funds.length !== 1 ||
      funds[0].ma_quy !== 1 ||
      funds[0].ten_quy !== "Quỹ vận hành" ||
      funds[0].mo_ta !==
        "Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0." ||
      funds[0].dang_hoat_dong !== 1 ||
      funds[0].nhan_thu_hoa_don !== 1 ||
      funds[0].phien_ban !== 0
    )
      throw Object.assign(new Error("Target fund catalog changed."), {
        code: "TARGET_NOT_EMPTY",
      });
  }
}
async function verifySource(source) {
  const [applied] = await source.query(
    "SELECT name,checksum FROM schema_migrations ORDER BY name",
  );
  if (![18, 19].includes(applied.length)) throw new Error("SOURCE_SCHEMA");
  const dir = new URL("../database/migrations/", import.meta.url);
  const names = (await readdir(dir))
    .filter((n) => /^\d{3}_[a-z0-9_]+\.sql$/.test(n))
    .sort();
  for (const [i, r] of applied.entries())
    if (
      r.name !== names[i] ||
      r.checksum !== hash(await readFile(new URL(names[i], dir)))
    )
      throw new Error("SOURCE_CHECKSUM");
  return applied.length;
}
export async function verifyForeignKeys(db) {
  const [parts] = await db.query(
    "SELECT table_name AS tab,constraint_name AS con,column_name AS col,referenced_table_name AS parent,referenced_column_name AS pcol,ordinal_position AS pos FROM information_schema.key_column_usage WHERE constraint_schema=DATABASE() AND referenced_table_name IS NOT NULL ORDER BY table_name,constraint_name,ordinal_position",
  );
  const groups = new Map();
  for (const r of parts) {
    const key = r.tab + "." + r.con;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  for (const items of groups.values()) {
    const first = items[0],
      join = items.map((r) => `c.${q(r.col)}=p.${q(r.pcol)}`).join(" AND "),
      present = items.map((r) => `c.${q(r.col)} IS NOT NULL`).join(" AND ");
    const [[result]] = await db.query(
      `SELECT COUNT(*) AS n FROM ${q(first.tab)} c LEFT JOIN ${q(first.parent)} p ON ${join} WHERE ${present} AND p.${q(first.pcol)} IS NULL`,
    );
    if (String(result.n) !== "0") throw new Error("FOREIGN_KEY_MISMATCH");
  }
  return groups.size;
}
export async function copyData(
  sourceConfig,
  destination,
  { quiet = false } = {},
) {
  let source,
    target,
    stage = "connect",
    table,
    started = false,
    sourceStarted = false,
    locked = false;
  const report = {
    sourceEngine: "mysql",
    targetModel: "thesis-mysql-31",
    tables: [],
    verified: false,
  };
  try {
    source = await mysql.createConnection({
      ...sourceConfig,
      timezone: "Z",
      charset: "utf8mb4",
      dateStrings: true,
      jsonStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      connectTimeout: 5000,
    });
    target = await destination.getConnection();
    const [[from]] = await source.query(
      "SELECT @@server_uuid AS server,DATABASE() AS db",
    );
    const [[to]] = await target.query(
      "SELECT @@server_uuid AS server,DATABASE() AS db",
    );
    if (from.server === to.server && from.db === to.db)
      throw new Error("SAME_DATABASE");
    await source.query("SET SESSION TRANSACTION READ ONLY");
    await source.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await source.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    sourceStarted = true;
    stage = "source schema";
    report.sourceSchema = await verifySource(source);
    const [tables] = await source.query(
      "SELECT table_name AS name,engine AS engine,AUTO_INCREMENT AS next_id FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' AND table_name<>'schema_migrations' ORDER BY table_name",
    );
    if (tables.length !== 37 || tables.some((t) => t.engine !== "InnoDB"))
      throw new Error("SOURCE_TABLES");
    const [sourceColumns] = await source.query(
      "SELECT table_name AS tab,column_name AS name,data_type AS type,extra AS extra FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY table_name,ordinal_position",
    );
    const [[lock]] = await target.query(
      "SELECT GET_LOCK(CONCAT('thesis:copy:',LEFT(SHA2(DATABASE(),256),40)),10) AS acquired",
    );
    if (Number(lock.acquired) !== 1) throw new Error("COPY_LOCKED");
    locked = true;
    stage = "empty destination";
    await assertEmptyDestination(target);
    // MySQL ALTER TABLE commits implicitly. Prepare counters on the empty
    // destination before starting the copy transaction, never midway through it.
    let historyNext = 1n;
    for (const item of tables)
      if (!historyCatalog[item.name] && item.next_id !== null) {
        const next = BigInt(item.next_id);
        if (next < 1n || next > 18446744073709551615n)
          throw new Error("IDENTITY_RANGE");
        await target.query(
          `ALTER TABLE ${q(item.name)} AUTO_INCREMENT=${next}`,
        );
      } else if (historyCatalog[item.name] && item.next_id !== null) {
        const next =
          BigInt(item.next_id) * 8n +
          BigInt(Object.keys(historyCatalog).indexOf(item.name) + 1);
        if (next > historyNext) historyNext = next;
      }
    await target.query(
      `ALTER TABLE nhat_ky_nghiep_vu AUTO_INCREMENT=${historyNext}`,
    );
    await target.query("SET SESSION FOREIGN_KEY_CHECKS=0");
    await target.beginTransaction();
    started = true;
    await assertEmptyDestination(target);
    await target.query("DELETE FROM loai_phi");
    await target.query("DELETE FROM quy_tai_chinh");
    // Source writes must be stopped for cutover. Recheck emptiness inside the
    // target transaction and run full FK anti-joins before reenabling FK checks.
    const expected = [];
    for (const { name } of tables) {
      table = name;
      stage = "copy";
      const columns = sourceColumns.filter((c) => c.tab === name),
        insertColumns = columns.filter(
          (c) => !/(?:VIRTUAL|STORED) GENERATED/.test(c.extra),
        );
      const hashes = [];
      const stream = source.connection
        .query(
          `SELECT ${columns.map((c) => q(c.name)).join(",")} FROM ${q(name)}`,
        )
        .stream({ highWaterMark: 1 });
      for await (const row of stream) {
        const record = historyCatalog[name]
          ? historyRecord(name, row, true)
          : Object.fromEntries(insertColumns.map((c) => [c.name, row[c.name]]));
        const names = Object.keys(record),
          targetTable = historyCatalog[name] ? "nhat_ky_nghiep_vu" : name;
        await target.execute(
          `INSERT INTO ${q(targetTable)}(${names.map(q).join(",")})VALUES(${names.map(() => "?").join(",")})`,
          Object.values(record),
        );
        hashes.push(rowHash(row, columns));
      }
      expected.push({ table: name, columns, hashes });
    }
    for (const item of expected) {
      table = item.table;
      stage = "verify";
      const actual = [];
      // A stream keeps BLOB verification bounded to one row too.
      const stream = target.connection
        .query(
          `SELECT ${item.columns.map((c) => q(c.name)).join(",")} FROM ${q(table)}`,
        )
        .stream({ highWaterMark: 1 });
      for await (const row of stream) actual.push(rowHash(row, item.columns));
      const digest = tableHash(item.hashes);
      if (actual.length !== item.hashes.length || tableHash(actual) !== digest)
        throw new Error("VERIFY_MISMATCH");
      report.tables.push({ table, rows: actual.length, sha256: digest });
      if (!quiet) console.log(`Đối chiếu ${table}: ${actual.length} dòng.`);
    }
    if (report.sourceSchema === 18)
      await target.query(
        "UPDATE phan_anh p JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_gui SET p.gui_tu_tai_khoan_can_ho=1 WHERE u.ma_can_ho_thanh_toan IS NOT NULL",
      );
    stage = "foreign keys";
    report.foreignKeys = await verifyForeignKeys(target);
    await target.query("SET SESSION FOREIGN_KEY_CHECKS=1");
    stage = "commit";
    await target.commit();
    started = false;
    report.verified = true;
    return report;
  } catch (error) {
    if (started) await target.rollback().catch(() => {});
    const code =
      error.code || /^[A-Z_]+/.exec(error.message || "")?.[0] || "COPY_ERROR";
    throw Object.assign(
      new Error(
        stage === "commit"
          ? `Chưa xác nhận được COMMIT (${code}); giữ MySQL nguồn và kiểm tra đích trước khi chạy lại.`
          : `Chuyển dừng tại ${stage}${table ? " / " + table : ""} (${code}); nguồn giữ nguyên, dữ liệu đang chép vào đích được rollback.`,
      ),
      { code, stage },
    );
  } finally {
    if (sourceStarted) await source.query("ROLLBACK").catch(() => {});
    await source?.end().catch(() => {});
    if (target) {
      await target.query("SET SESSION FOREIGN_KEY_CHECKS=1").catch(() => {});
      if (locked)
        await target
          .query(
            "SELECT RELEASE_LOCK(CONCAT('thesis:copy:',LEFT(SHA2(DATABASE(),256),40)))",
          )
          .catch(() => {});
      target.release();
    }
  }
}
async function main() {
  const options = copyOptions(process.argv.slice(2));
  if (process.env.DB_ENGINE !== "mysql")
    throw new Error("Load target DB_ENGINE=mysql from .env.thesis.");
  const old = parseEnv(await readFile(options["source-env"], "utf8"));
  if (old.DB_ENGINE && old.DB_ENGINE !== "mysql")
    throw new Error(
      "Source must be MySQL; keep PostgreSQL separately if it contains newer data.",
    );
  const source = {
    host: old.DB_HOST || "127.0.0.1",
    port: Number(old.DB_PORT || 3306),
    user: old.DB_USER || "root",
    password: old.DB_PASSWORD,
    database: options["source-db"] || old.DB_NAME || "chung_cu",
  };
  const config = databaseConfig(
    options["target-db"] ? { database: options["target-db"] } : {},
  );
  const destination = mysql.createPool({
    ...config,
    jsonStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });
  try {
    await ensureDatabase(config, config.database);
    await assertEmptyDestination(destination);
    await migrate(destination);
    const report = await copyData(source, destination);
    try {
      const directory = new URL(
        "../backend/storage/migrations/",
        import.meta.url,
      );
      await mkdir(directory, { recursive: true });
      const name = `thesis-mysql-${randomUUID()}.json`;
      await writeFile(
        new URL(name, directory),
        JSON.stringify(report, null, 2) + "\n",
        { flag: "wx", mode: 0o600 },
      );
      console.log(
        `Hoàn tất: 37 tập dữ liệu cũ đã đối chiếu; lưu trong 31 bảng và đọc lịch sử qua 8 view. Báo cáo backend/storage/migrations/${name}. Không đổi tài khoản, mật khẩu, QR hoặc dữ liệu nguồn.`,
      );
    } catch (error) {
      console.error(
        `Đã COMMIT dữ liệu thành công; chưa lưu được báo cáo (${error.code || "FILE_ERROR"}). Không chép lại vào đích này.`,
      );
      process.exitCode = 1;
    }
  } finally {
    await destination.end();
    await pool.end();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(
      error.stage
        ? error.message
        : `Không chuyển được dữ liệu (${error.code || "CONFIGURATION"}). Xem docs/csdl-do-an-mysql.md và giữ database nguồn.`,
    );
    process.exitCode = 1;
  });
