// Offline, read-only MySQL source -> empty PostgreSQL destination.
// MySQL is a development-only dependency for this one-time migration tool.
import mysql from "mysql2/promise";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  quoteIdentifier,
  identityColumns,
} from "../backend/src/lib/postgresql.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const mysqlIdentifier = (value) => "`" + value.replaceAll("`", "``") + "`";
export function transferOptions(args) {
  const options = {};
  for (const arg of args) {
    const match = /^--(source-env|source-db|target-db)=(.+)$/.exec(arg);
    if (!match || options[match[1]])
      throw new Error(
        "Dùng --source-env=.env.mysql [--source-db=chung_cu] [--target-db=chung_cu].",
      );
    options[match[1]] = match[2];
  }
  if (!options["source-env"])
    throw new Error(
      "Cần --source-env để đọc cấu hình MySQL riêng; không dùng cấu hình PostgreSQL làm nguồn.",
    );
  for (const key of ["source-db", "target-db"])
    if (options[key] && !/^[a-z][a-z0-9_]{0,62}$/.test(options[key]))
      throw new Error("Tên database không hợp lệ.");
  return options;
}

export function canonicalValue(value, type) {
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) return ["bytes", value.toString("hex")];
  if (["datetime", "timestamp"].includes(type)) {
    const match =
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(
        String(value),
      );
    if (!match || match[1].startsWith("0000"))
      throw new Error("UNSUPPORTED_DATE");
    return `${match[1]} ${match[2]}.${(match[3] || "").padEnd(6, "0")}`;
  }
  return String(value);
}
function rowHash(row, columns) {
  return hash(
    JSON.stringify(
      columns.map((column) => canonicalValue(row[column.name], column.type)),
    ),
  );
}
function tableHash(hashes) {
  return hash(hashes.sort().join("\n"));
}

async function verifySourceMigrations(source) {
  const [applied] = await source.query(
    "SELECT name,checksum FROM schema_migrations ORDER BY name",
  );
  const dir = path.join(root, "database/migrations");
  const names = (await readdir(dir))
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  if (![18, 19].includes(applied.length))
    throw new Error("SOURCE_SCHEMA: chỉ hỗ trợ schema MySQL 018 hoặc 019.");
  for (const [i, row] of applied.entries()) {
    if (
      row.name !== names[i] ||
      row.checksum !== hash(await readFile(path.join(dir, names[i])))
    )
      throw new Error(
        "SOURCE_CHECKSUM: migration nguồn không khớp bản gốc; không sửa checksum để vượt kiểm tra.",
      );
  }
  return applied.length;
}

async function assertEmptyDestination(client, tables) {
  for (const table of tables) {
    if (["loai_phi", "quy_tai_chinh"].includes(table)) continue;
    const result = await client.query(
      `SELECT 1 FROM ${quoteIdentifier(table)} LIMIT 1`,
    );
    if (result.rows.length)
      throw new Error(
        `TARGET_NOT_EMPTY: ${table}; không ghi đè dữ liệu có sẵn.`,
      );
  }
  // Only the exact migration seed rows may be replaced; custom funds/fee types
  // make the destination nonempty even when no invoices have been created.
  const fees = tables.includes("loai_phi")
    ? (
        await client.query(
          'SELECT loai_phi,ten_phi,don_vi_tinh FROM loai_phi ORDER BY loai_phi COLLATE "C"',
        )
      ).rows
    : [];
  const fund = tables.includes("quy_tai_chinh")
    ? (
        await client.query(
          "SELECT ma_quy,ten_quy,mo_ta,nhan_thu_hoa_don,dang_hoat_dong,phien_ban FROM quy_tai_chinh",
        )
      ).rows
    : [];
  const expectedFees = [
    ["GUI_O_TO", "Gửi ô tô", "xe"],
    ["GUI_XE_DAP", "Gửi xe đạp", "xe"],
    ["GUI_XE_MAY", "Gửi xe máy", "xe"],
    ["PHI_QUAN_LY", "Phí quản lý", "m²"],
    ["TIEN_DIEN", "Tiền điện", "kWh"],
    ["TIEN_NUOC", "Tiền nước", "m³"],
  ];
  if (
    (tables.includes("loai_phi") &&
      JSON.stringify(
        fees.map((r) => [r.loai_phi, r.ten_phi, r.don_vi_tinh]),
      ) !== JSON.stringify(expectedFees)) ||
    (tables.includes("quy_tai_chinh") &&
      (fund.length !== 1 ||
        Number(fund[0].ma_quy) !== 1 ||
        fund[0].ten_quy !== "Quỹ vận hành" ||
        Number(fund[0].nhan_thu_hoa_don) !== 1 ||
        Number(fund[0].dang_hoat_dong) !== 1 ||
        Number(fund[0].phien_ban) !== 0 ||
        fund[0].mo_ta !==
          "Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0."))
  )
    throw new Error(
      "TARGET_NOT_EMPTY: danh mục mặc định đã thay đổi; dùng database PostgreSQL mới.",
    );
}

export async function preflightDestination(targetPool) {
  const tables = (
    await targetPool.native.query(
      "SELECT tablename AS name FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename<>'schema_migrations'",
    )
  ).rows.map((r) => r.name);
  const allowed = new Set([
    ...Object.keys(identityColumns),
    "loai_phi",
    "khoi_toa_nha",
    "tang_toa_nha",
    "yeu_cau_gui",
    "gioi_han_gui",
    "thong_bao_da_doc",
  ]);
  if (tables.some((name) => !allowed.has(name)))
    throw Object.assign(new Error("Target contains an unknown schema."), {
      code: "TARGET_SCHEMA",
    });
  // Run before migrations as well as under the final transfer lock, so an
  // existing destination is never backfilled/migrated before being refused.
  try {
    await assertEmptyDestination(targetPool.native, tables);
  } catch (error) {
    if (error.message.startsWith("TARGET_NOT_EMPTY"))
      error.code = "TARGET_NOT_EMPTY";
    throw error;
  }
}

export async function transfer(
  sourceConfig,
  targetPool,
  { quiet = false } = {},
) {
  let source,
    target,
    transactionStarted = false,
    sourceStarted = false,
    locked = false;
  let stage = "connect",
    table;
  const report = {
    engine: "postgresql",
    sourceSchema: null,
    tables: [],
    verified: false,
  };
  try {
    source = await mysql.createConnection({
      ...sourceConfig,
      connectTimeout: 5000,
      timezone: "Z",
      dateStrings: true,
      jsonStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      decimalNumbers: false,
    });
    // No DDL/DML is ever sent to MySQL, including the source migration ledger.
    await source.query("SET SESSION TRANSACTION READ ONLY");
    await source.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await source.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    sourceStarted = true;
    stage = "source schema";
    report.sourceSchema = await verifySourceMigrations(source);
    const [sourceTables] = await source.query(
      "SELECT TABLE_NAME AS name,AUTO_INCREMENT AS next_id FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
      [sourceConfig.database],
    );
    const tables = sourceTables
      .map((row) => row.name)
      .filter((name) => name !== "schema_migrations");
    const [sourceColumns] = await source.query(
      "SELECT TABLE_NAME AS table_name,COLUMN_NAME AS name,DATA_TYPE AS type,EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION",
      [sourceConfig.database],
    );
    target = await targetPool.native.connect();
    await target.query("SELECT pg_advisory_lock(718251104)");
    locked = true;
    const targetTables = (
      await target.query(
        "SELECT tablename AS name FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename<>'schema_migrations' ORDER BY tablename",
      )
    ).rows.map((r) => r.name);
    if (JSON.stringify([...tables].sort()) !== JSON.stringify(targetTables))
      throw new Error("TABLE_MISMATCH: danh sách bảng nguồn/đích khác nhau.");
    const targetColumns = (
      await target.query(
        "SELECT table_name,column_name,is_generated FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position",
      )
    ).rows;
    stage = "destination lock";
    await target.query("BEGIN");
    transactionStarted = true;
    await target.query(
      `LOCK TABLE ${tables.map(quoteIdentifier).join(",")} IN ACCESS EXCLUSIVE MODE`,
    );
    await assertEmptyDestination(target, tables);
    await target.query("SET CONSTRAINTS ALL DEFERRED");
    await target.query("DELETE FROM loai_phi");
    await target.query("DELETE FROM quy_tai_chinh");
    for (table of tables) {
      stage = "copy";
      const columns = sourceColumns.filter((col) => col.table_name === table);
      const targetNames = targetColumns
        .filter((col) => col.table_name === table)
        .map((col) => col.column_name);
      const legacyExtra =
        report.sourceSchema === 18 && table === "phan_anh"
          ? ["ma_cu_dan_nguoi_gui", "gui_tu_tai_khoan_can_ho"]
          : [];
      if (
        columns.some((col) => !targetNames.includes(col.name)) ||
        targetNames.some(
          (name) =>
            !columns.some((col) => col.name === name) &&
            !legacyExtra.includes(name),
        )
      )
        throw new Error("COLUMN_MISMATCH");
      const insertColumns = columns.filter(
        (col) =>
          !targetColumns.some(
            (dest) =>
              dest.table_name === table &&
              dest.column_name === col.name &&
              dest.is_generated === "ALWAYS",
          ),
      );
      const sql = `INSERT INTO ${quoteIdentifier(table)} (${insertColumns.map((col) => quoteIdentifier(col.name)).join(",")}) VALUES (${insertColumns.map((_, i) => `$${i + 1}`).join(",")})`;
      const hashes = [];
      // Stream a row at a time to keep image BLOB memory bounded.
      const stream = source.connection
        .query(
          `SELECT ${columns.map((col) => mysqlIdentifier(col.name)).join(",")} FROM ${mysqlIdentifier(table)}`,
        )
        .stream({ highWaterMark: 1 });
      for await (const row of stream) {
        await target.query(
          sql,
          insertColumns.map((col) => row[col.name]),
        );
        hashes.push(rowHash(row, columns));
      }
      stage = "verify";
      const select = columns
        .map(
          (col) =>
            `${quoteIdentifier(col.name)}${col.type === "json" ? "::text" : ""} AS ${quoteIdentifier(col.name)}`,
        )
        .join(",");
      // Verification excludes binary content from reports/logs: only digests.
      await target.query(
        `DECLARE verify_rows NO SCROLL CURSOR FOR SELECT ${select} FROM ${quoteIdentifier(table)}`,
      );
      const verifiedHashes = [];
      for (;;) {
        const batch = (await target.query("FETCH FORWARD 1 FROM verify_rows"))
          .rows;
        if (!batch.length) break;
        verifiedHashes.push(rowHash(batch[0], columns));
      }
      await target.query("CLOSE verify_rows");
      const expected = tableHash(hashes),
        actual = tableHash(verifiedHashes);
      if (hashes.length !== verifiedHashes.length || expected !== actual)
        throw new Error("VERIFY_MISMATCH");
      report.tables.push({ table, rows: hashes.length, sha256: actual });
      if (!quiet) console.log(`Đã đối chiếu ${table}: ${hashes.length} dòng.`);
    }
    if (report.sourceSchema === 18) {
      stage = "legacy incident privacy";
      await target.query(
        "UPDATE phan_anh p SET gui_tu_tai_khoan_can_ho=1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=p.ma_nguoi_gui AND u.ma_can_ho_thanh_toan IS NOT NULL",
      );
    }
    stage = "foreign keys";
    await target.query("SET CONSTRAINTS ALL IMMEDIATE");
    stage = "identity sequences";
    for (const [name, key] of Object.entries(identityColumns)) {
      const max = (
        await target.query(
          `SELECT MAX(${quoteIdentifier(key)})::text AS maximum FROM ${quoteIdentifier(name)}`,
        )
      ).rows[0].maximum;
      const oldNext = sourceTables.find((row) => row.name === name)?.next_id;
      const next = [BigInt(max || "0") + 1n, BigInt(oldNext || "1")].reduce(
        (a, b) => (a > b ? a : b),
      );
      if (next > 9223372036854775807n) throw new Error("IDENTITY_OVERFLOW");
      // ALTER ... RESTART is transactional; setval() is not.
      await target.query(
        `ALTER TABLE ${quoteIdentifier(name)} ALTER COLUMN ${quoteIdentifier(key)} RESTART WITH ${next}`,
      );
    }
    stage = "commit";
    await target.query("COMMIT");
    transactionStarted = false;
    report.verified = true;
    return report;
  } catch (error) {
    if (transactionStarted) await target.query("ROLLBACK").catch(() => {});
    // PostgreSQL/MySQL errors may contain business rows, SQL and credentials.
    // Do not return or print those details, even on a failed verification.
    const reason =
      error.code ||
      /^[A-Z_]+/.exec(error.message || "")?.[0] ||
      "TRANSFER_ERROR";
    throw Object.assign(
      new Error(
        stage === "commit"
          ? `Chưa xác nhận được kết quả COMMIT (${reason}). MySQL giữ nguyên. Kiểm tra database đích trước khi chạy lại; không ghi đè dữ liệu.`
          : `Chuyển dữ liệu dừng tại ${stage}${table ? ` / ${table}` : ""} (${reason}). Dữ liệu MySQL giữ nguyên; dữ liệu đang sao chép vào PostgreSQL đã hoàn tác.`,
      ),
      { code: reason, stage },
    );
  } finally {
    if (sourceStarted) await source.query("ROLLBACK").catch(() => {});
    await source?.end().catch(() => {});
    if (locked)
      await target
        .query("SELECT pg_advisory_unlock(718251104)")
        .catch(() => {});
    target?.release();
  }
}

async function main() {
  const options = transferOptions(process.argv.slice(2));
  if (process.env.DB_ENGINE !== "postgresql")
    throw new Error(
      "Nạp cấu hình đích DB_ENGINE=postgresql bằng --env-file=.env.postgresql trước khi chuyển.",
    );
  const old = parseEnv(await readFile(options["source-env"], "utf8"));
  const sourceConfig = {
    host: old.DB_HOST || "127.0.0.1",
    port: Number(old.DB_PORT || 3306),
    user: old.DB_USER || "chung_cu",
    password: old.DB_PASSWORD,
    database: options["source-db"] || old.DB_NAME || "chung_cu",
  };
  if (old.DB_ENGINE && old.DB_ENGINE !== "mysql")
    throw new Error("Tệp nguồn phải là cấu hình MySQL cũ.");
  const { pool, createDatabasePool, databaseConfig } = await import(
    "../backend/src/lib/db.js"
  );
  const { ensureDatabase } = await import("./postgresql-admin.js");
  const { migrate } = await import("../backend/scripts/migrate.js");
  const config = databaseConfig(
    options["target-db"] ? { database: options["target-db"] } : {},
  );
  const destination = createDatabasePool(config);
  try {
    await ensureDatabase(config, config.database);
    await preflightDestination(destination);
    await migrate(destination);
    const report = await transfer(sourceConfig, destination);
    const directory = path.join(root, "backend/storage/migrations");
    const name = `mysql-postgresql-${randomUUID()}.json`;
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, name),
        JSON.stringify(report, null, 2) + "\n",
        { flag: "wx", mode: 0o600 },
      );
    } catch (error) {
      console.error(
        `Dữ liệu đã chuyển, đối chiếu và COMMIT thành công; chưa lưu được tệp báo cáo (${error.code || "FILE_ERROR"}). Không chạy lại chuyển dữ liệu vào đích này. Kiểm tra quyền ghi backend/storage/migrations.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `Hoàn tất: đối chiếu ${report.tables.length} bảng nghiệp vụ; schema_migrations dùng checksum PostgreSQL riêng. Báo cáo: backend/storage/migrations/${name}. Không sửa MySQL. Không chạy db:seed trên dữ liệu vừa chuyển.`,
    );
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
        : `Không chuyển được dữ liệu (${error.code || "CONFIGURATION"}). Kiểm tra cấu hình, schema và hướng dẫn; không xóa database nguồn/đích.`,
    );
    process.exitCode = 1;
  });
