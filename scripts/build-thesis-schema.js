// Reproducible, metadata-only baseline generator. Source schema stays read-only.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";
import { historyCatalog, historyTargets } from "../backend/src/lib/history.js";

const q = (name) => mysql.escapeId(name);
export function historyDDL() {
  const topics = Object.keys(historyCatalog);
  const lines = [
    "CREATE TABLE nhat_ky_nghiep_vu (",
    "  ma_nhat_ky BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,",
    "  loai_nhat_ky VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,",
    "  ma_goc INT UNSIGNED NULL,",
    "  ma_nguoi_thuc_hien INT UNSIGNED NULL,",
    "  su_kien VARCHAR(40) NOT NULL,",
    "  ghi_chu TEXT NULL,",
    "  chi_tiet JSON NOT NULL,",
    "  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),",
    ...Object.keys(historyTargets).map(
      (name) => `  ${name} INT UNSIGNED NULL,`,
    ),
    "  UNIQUE KEY uk_history_original (loai_nhat_ky,ma_goc),",
    "  CONSTRAINT fk_history_actor FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),",
    ...Object.entries(historyTargets).map(
      ([column, [table, key, action]]) =>
        `  CONSTRAINT fk_history_${column} FOREIGN KEY (${column}) REFERENCES ${table}(${key}) ON DELETE ${action},`,
    ),
  ];
  for (const [index, topic] of topics.entries()) {
    const c = historyCatalog[topic],
      present = [...c.targets, ...(c.links || [])];
    const checks = Object.keys(historyTargets)
      .filter((name) => !present.includes(name))
      .map((name) => `${name} IS NULL`);
    checks.push(
      ...c.targets
        .filter((name) => !c.optionalTargets?.includes(name))
        .map((name) => `${name} IS NOT NULL`),
    );
    if (!c.anonymous) checks.push("ma_nguoi_thuc_hien IS NOT NULL");
    if (c.noNote) checks.push("ghi_chu IS NULL");
    else if (!c.nullableNote) checks.push("ghi_chu IS NOT NULL");
    if (c.noteLimit)
      checks.push(`(ghi_chu IS NULL OR CHAR_LENGTH(ghi_chu)<=${c.noteLimit})`);
    checks.push(`CHAR_LENGTH(su_kien)<=${c.eventLimit || 30}`);
    if (c.events)
      checks.push(
        `su_kien IN (${c.events.map((v) => mysql.escape(v)).join(",")})`,
      );
    if (c.fixedEvent) checks.push(`su_kien=${mysql.escape(c.fixedEvent)}`);
    lines.push(
      `  CONSTRAINT ck_history_${index}_target CHECK (loai_nhat_ky<>${mysql.escape(topic)} OR (${checks.join(" AND ")})),`,
    );
    const properties = Object.fromEntries(
      Object.entries(c.payload || {}).map(([name, [type, limit, nullable]]) => {
        const field =
          type === "json" ? {} : { type: nullable ? [type, "null"] : type };
        if (type === "integer")
          Object.assign(field, { minimum: 0, maximum: 4294967295 });
        if (limit) field.maxLength = limit;
        return [name, field];
      }),
    );
    const schema = JSON.stringify({
      type: "object",
      properties,
      ...(Object.keys(properties).length
        ? { required: Object.keys(properties) }
        : {}),
      additionalProperties: false,
    });
    lines.push(
      `  CONSTRAINT ck_history_${index}_payload CHECK (loai_nhat_ky<>${mysql.escape(topic)} OR JSON_SCHEMA_VALID(${mysql.escape(schema)},chi_tiet)),`,
    );
    lines.push(
      `  KEY idx_history_${index} (loai_nhat_ky,${c.targets.join(",")},ma_nhat_ky),`,
    );
  }
  lines.push(
    `  CONSTRAINT ck_history_topic CHECK (loai_nhat_ky IN (${topics.map((name) => mysql.escape(name)).join(",")}))`,
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;",
  );
  return lines.join("\n");
}

export function historyViews() {
  return Object.entries(historyCatalog)
    .map(([topic, c]) => {
      const fields = [
        `CAST(COALESCE(ma_goc,ma_nhat_ky) AS UNSIGNED) AS ${q(c.id)}`,
        ...c.targets.map(q),
        ...(c.links || []).map(q),
        `ma_nguoi_thuc_hien AS ${q(c.actor)}`,
      ];
      if (!c.fixedEvent) fields.push(`su_kien AS ${q(c.event || "su_kien")}`);
      if (!c.noNote) fields.push("ghi_chu");
      for (const [name, [type, length]] of Object.entries(c.payload || {})) {
        const value = `JSON_EXTRACT(chi_tiet,'$.${name}')`;
        const plain = `CASE WHEN JSON_TYPE(${value})='NULL' THEN NULL ELSE JSON_UNQUOTE(${value}) END`;
        fields.push(
          `${type === "json" ? value : type === "integer" ? `CAST(${plain} AS UNSIGNED)` : `CAST(${plain} AS CHAR(${length}) CHARACTER SET utf8mb4)`} AS ${q(name)}`,
        );
      }
      fields.push(`ngay_tao AS ${q(c.time || "ngay_tao")}`);
      return `CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW ${q(topic)} AS\n  SELECT ${fields.join(",\n    ")}\n  FROM nhat_ky_nghiep_vu WHERE loai_nhat_ky=${mysql.escape(topic)} WITH CASCADED CHECK OPTION;`;
    })
    .join("\n\n");
}

async function main() {
  const database = process.argv[2];
  if (!database || !/^[a-z][a-z0-9_]{0,62}$/.test(database))
    throw new Error(
      "Pass an explicit original MySQL schema name; only metadata is read.",
    );
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
  });
  try {
    const [tables] = await db.query(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema=? AND table_type='BASE TABLE' ORDER BY table_name",
      [database],
    );
    if (tables.length !== 38)
      throw new Error("Source must be the original 38-table MySQL schema019.");
    const statements = [],
      foreignKeys = [];
    for (const { name } of tables) {
      if (historyCatalog[name]) continue;
      const [rows] = await db.query(`SHOW CREATE TABLE ${q(name)}`);
      let sql = rows[0]["Create Table"].replace(/ AUTO_INCREMENT=\d+\b/g, "");
      sql = sql
        .split("\n")
        .filter((line) => {
          if (!/^\s+CONSTRAINT .* FOREIGN KEY /.test(line)) return true;
          foreignKeys.push(
            `ALTER TABLE ${q(name)} ADD ${line.trim().replace(/,$/, "")};`,
          );
          return false;
        })
        .join("\n")
        .replace(/,\n\)/g, "\n)");
      if (name === "schema_migrations")
        sql = sql.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ");
      statements.push(sql + ";");
    }
    statements.push(...foreignKeys, historyDDL(), historyViews());
    statements.push(
      "INSERT INTO loai_phi VALUES ('PHI_QUAN_LY','Phí quản lý','m²'),('GUI_O_TO','Gửi ô tô','xe'),('GUI_XE_MAY','Gửi xe máy','xe'),('GUI_XE_DAP','Gửi xe đạp','xe'),('TIEN_NUOC','Tiền nước','m³'),('TIEN_DIEN','Tiền điện','kWh');",
    );
    statements.push(
      "INSERT INTO quy_tai_chinh (ten_quy,mo_ta,nhan_thu_hoa_don) VALUES ('Quỹ vận hành','Nhận các khoản hóa đơn đã xác nhận thu trên hệ thống, số dư ban đầu trong phần mềm là 0.',1);",
    );
    const out = new URL("../database/thesis-mysql/", import.meta.url);
    await mkdir(out, { recursive: true });
    await writeFile(
      new URL("001_thesis_schema.sql", out),
      "-- MySQL 8.4; 31 physical tables, 8 history views. Fresh database only.\n-- Original business fields/FKs are retained; eight event histories share one validated store.\nSET NAMES utf8mb4;\n\n" +
        statements.join("\n\n") +
        "\n",
    );
    console.log(
      "Generated MySQL thesis baseline: 31 tables + 8 history views; no business rows or source credentials read.",
    );
  } finally {
    await db.end();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.code || error.message);
    process.exitCode = 1;
  });
