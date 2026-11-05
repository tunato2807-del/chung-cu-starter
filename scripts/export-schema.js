import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const md = (value) =>
  String(value ?? "—")
    .replaceAll("|", "\\|")
    .replace(/[\r\n]+/g, " ")
    .replaceAll("`", "&#96;");
const quote = (value) =>
  String(value ?? "")
    .replaceAll('"', "'")
    .replace(/[\r\n]+/g, " ");
const identifier = (value) => {
  if (!/^[a-z][a-z0-9_]*$/.test(value))
    throw new Error("Schema chứa tên không hỗ trợ cho Mermaid.");
  return value;
};
function groups(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const name = key(row);
    if (!result.has(name)) result.set(name, []);
    result.get(name).push(row);
  }
  return result;
}
export function foreignKeys(schema) {
  return [
    ...groups(
      schema.foreignKeys,
      (row) => `${row.table_name}.${row.constraint_name}`,
    ).values(),
  ].map((parts) => {
    parts.sort((a, b) => a.ordinal_position - b.ordinal_position);
    const first = parts[0];
    const columns = parts.map((row) => row.column_name);
    const nullable = schema.columns.some(
      (col) =>
        col.table_name === first.table_name &&
        columns.includes(col.column_name) &&
        col.is_nullable === "YES",
    );
    const unique = [
      ...groups(
        schema.indexes.filter(
          (index) =>
            index.table_name === first.table_name &&
            Number(index.non_unique) === 0,
        ),
        (index) => index.index_name,
      ).values(),
    ].some(
      (index) =>
        index.length === columns.length &&
        index.every((col) => columns.includes(col.column_name)),
    );
    return {
      ...first,
      columns,
      references: parts.map((row) => row.referenced_column_name),
      nullable,
      unique,
    };
  });
}
export function erd(
  schema,
  selected = schema.tables.map((row) => row.table_name),
  compact = false,
) {
  const keys = foreignKeys(schema);
  const selectedSet = new Set(selected);
  // Include immediate referenced parents as compact stubs in module diagrams.
  const relations = keys.filter((key) => selectedSet.has(key.table_name));
  const visible = new Set([
    ...selected,
    ...relations.map((key) => key.referenced_table_name),
  ]);
  const lines = ["erDiagram"];
  for (const table of [...visible].sort()) {
    identifier(table);
    lines.push(`  ${table} {`);
    for (const col of schema.columns.filter(
      (row) => row.table_name === table,
    )) {
      const primary = schema.indexes.some(
        (index) =>
          index.table_name === table &&
          index.index_name === "PRIMARY" &&
          index.column_name === col.column_name,
      );
      const foreign = keys.some(
        (key) =>
          key.table_name === table && key.columns.includes(col.column_name),
      );
      if ((compact || !selectedSet.has(table)) && !primary && !foreign)
        continue;
      const tag = [primary ? "PK" : "", foreign ? "FK" : ""]
        .filter(Boolean)
        .join(",");
      const type = col.data_type.replace(/[^a-z0-9_]/gi, "_");
      lines.push(
        `    ${type} ${identifier(col.column_name)}${tag ? ` ${tag}` : ""} "${quote(col.column_type)}${col.is_nullable === "YES" ? "; NULL" : "; NOT NULL"}"`,
      );
    }
    lines.push("  }");
  }
  for (const key of relations) {
    lines.push(
      `  ${identifier(key.referenced_table_name)} ${key.nullable ? "o|" : "||"}--${key.unique ? "o|" : "o{"} ${identifier(key.table_name)} : "${quote(key.columns.join(" + "))}"`,
    );
  }
  return lines.join("\n") + "\n";
}

export function dictionary(schema, migrations) {
  const keys = foreignKeys(schema);
  const lines = [
    "# Từ điển dữ liệu vật lý",
    "",
    "Sinh từ metadata PostgreSQL bằng `scripts/export-schema.js`. Không đọc dữ liệu nghiệp vụ, thông tin đăng nhập hoặc nội dung ảnh. Phản ánh schema tại lúc xuất; không tự phát hiện mọi thay đổi DDL thủ công ngoài migration.",
    "",
    `Nguồn: ${migrations.length} migration, cuối cùng **${migrations.at(-1)?.name}**. Tổng **${schema.tables.length} bảng**, **${schema.columns.length} cột**, **${keys.length} ràng buộc khóa ngoại**.`,
    "",
    "`NULL` là không có giá trị; `—` ở mặc định nghĩa metadata không có mặc định khác NULL. Kiểu, chỉ mục, biểu thức cột sinh và CHECK bên dưới lấy từ PostgreSQL. Quan hệ nullable không bắt buộc có bản ghi cha; UNIQUE của cột sinh có thể chỉ áp dụng cho bản ghi đang hoạt động, cần đọc biểu thức sinh và service.",
    "",
    "## Danh mục bảng",
    "",
    ...schema.tables.map(
      (table) => `- [${table.table_name}](#${table.table_name})`,
    ),
    "",
  ];
  for (const table of schema.tables) {
    const name = table.table_name;
    lines.push(
      `## ${name}`,
      "",
      `Engine: ${md(table.engine)}; đối chiếu mặc định database: ${md(table.table_collation)} (xem collation từng cột bên dưới).`,
      "",
      "| Cột | Kiểu PostgreSQL | NULL | Mặc định | Bổ sung / biểu thức sinh |",
      "|---|---|---|---|---|",
    );
    for (const col of schema.columns.filter((row) => row.table_name === name))
      lines.push(
        `| ${md(col.column_name)} | ${md(col.column_type)} | ${col.is_nullable === "YES" ? "Có" : "Không"} | ${md(col.column_default)} | ${md([col.extra, col.generation_expression, col.collation_name && `collation: ${col.collation_name}`].filter(Boolean).join("; "))} |`,
      );
    lines.push("", "**Chỉ mục**", "");
    for (const [index, parts] of groups(
      schema.indexes.filter((row) => row.table_name === name),
      (row) => row.index_name,
    )) {
      parts.sort((a, b) => a.seq_in_index - b.seq_in_index);
      lines.push(
        `- ${md(index)} (${Number(parts[0].non_unique) === 0 ? "UNIQUE" : "INDEX"}): ${parts.map((row) => md(row.column_name) + (row.sub_part ? `(${row.sub_part})` : "")).join(", ")}.`,
      );
    }
    for (const key of keys.filter((row) => row.table_name === name))
      lines.push(
        `- FK ${md(key.constraint_name)}: (${key.columns.map(md).join(", ")}) → ${md(key.referenced_table_name)} (${key.references.map(md).join(", ")}); UPDATE ${md(key.update_rule)}, DELETE ${md(key.delete_rule)}.`,
      );
    for (const check of schema.checks.filter((row) => row.table_name === name))
      lines.push(
        `- CHECK ${md(check.constraint_name)}: ${md(check.check_clause)}.`,
      );
    lines.push("");
  }
  lines.push("## Checksum nguồn", "", "| Migration | SHA-256 |", "|---|---|");
  for (const migration of migrations)
    lines.push(`| ${md(migration.name)} | ${migration.checksum} |`);
  return lines.join("\n") + "\n";
}

export function verifyMigrations(files, applied) {
  if (
    !files.length ||
    files.length !== applied.length ||
    files.some(
      (file) =>
        !applied.some(
          (row) => row.name === file.name && row.checksum === file.checksum,
        ),
    )
  )
    throw new Error(
      "Schema chưa khớp đầy đủ migration/checksum. Dừng xuất; chạy runner migration, không sửa SQL cũ.",
    );
}

export async function readMetadata(db) {
  const query = async (sql) => (await db.query(sql))[0];
  return {
    tables: await query(`SELECT c.relname AS table_name,'PostgreSQL' AS engine,
      (SELECT datcollate FROM pg_catalog.pg_database WHERE datname=current_database()) AS table_collation
      FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`),
    columns:
      await query(`SELECT c.relname AS table_name,a.attname AS column_name,
      t.typname AS data_type,pg_catalog.format_type(a.atttypid,a.atttypmod) AS column_type,coll.collname AS collation_name,
      CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
      CASE WHEN a.attgenerated='' THEN pg_catalog.pg_get_expr(d.adbin,d.adrelid) ELSE NULL END AS column_default,
      CASE WHEN a.attidentity<>'' THEN 'identity' WHEN a.attgenerated<>'' THEN 'STORED GENERATED' ELSE '' END AS extra,
      CASE WHEN a.attgenerated<>'' THEN pg_catalog.pg_get_expr(d.adbin,d.adrelid) ELSE '' END AS generation_expression
      FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace JOIN pg_catalog.pg_type t ON t.oid=a.atttypid
      LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
      LEFT JOIN pg_catalog.pg_collation coll ON coll.oid=a.attcollation
      WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum`),
    foreignKeys:
      await query(`SELECT c.relname AS table_name,k.conname AS constraint_name,a.attname AS column_name,
      x.i AS ordinal_position,r.relname AS referenced_table_name,b.attname AS referenced_column_name,
      CASE k.confupdtype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' WHEN 'r' THEN 'RESTRICT' ELSE 'NO ACTION' END AS update_rule,
      CASE k.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' WHEN 'r' THEN 'RESTRICT' ELSE 'NO ACTION' END AS delete_rule
      FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace JOIN pg_catalog.pg_class r ON r.oid=k.confrelid
      CROSS JOIN LATERAL generate_subscripts(k.conkey,1) x(i)
      JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.conkey[x.i]
      JOIN pg_catalog.pg_attribute b ON b.attrelid=r.oid AND b.attnum=k.confkey[x.i]
      WHERE n.nspname='public' AND k.contype='f' ORDER BY c.relname,k.conname,x.i`),
    indexes:
      await query(`SELECT c.relname AS table_name,CASE WHEN i.indisprimary THEN 'PRIMARY' ELSE ic.relname END AS index_name,
      CASE WHEN i.indisunique THEN 0 ELSE 1 END AS non_unique,a.attname AS column_name,x.ordinality::integer AS seq_in_index,NULL AS sub_part
      FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace JOIN pg_catalog.pg_class ic ON ic.oid=i.indexrelid
      CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY x(attnum,ordinality)
      JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum=x.attnum
      WHERE n.nspname='public' ORDER BY c.relname,index_name,x.ordinality`),
    checks:
      await query(`SELECT c.relname AS table_name,k.conname AS constraint_name,pg_catalog.pg_get_expr(k.conbin,k.conrelid) AS check_clause
      FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND k.contype='c' ORDER BY c.relname,k.conname`),
  };
}

async function main() {
  if (process.argv.length > 2)
    throw new Error(
      "Cách dùng: node --env-file-if-exists=.env scripts/export-schema.js",
    );
  const directory = path.join(root, "database/postgresql");
  const names = (await readdir(directory))
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      checksum: createHash("sha256")
        .update(await readFile(path.join(directory, name)))
        .digest("hex"),
    })),
  );
  const { pool } = await import("../backend/src/lib/db.js");
  try {
    const db = await pool.getConnection();
    try {
      // Session is read-only; no migration/seed/business writes are performed.
      await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const [applied] = await db.query(
        "SELECT name,checksum FROM schema_migrations ORDER BY name",
      );
      verifyMigrations(files, applied);
      const schema = await readMetadata(db);
      await db.commit();
      const target = path.join(root, "docs/bao-cao");
      await mkdir(target, { recursive: true });
      const modules = {
        "nha-o": [
          "khoi_toa_nha",
          "tang_toa_nha",
          "can_ho",
          "cu_dan",
          "lich_su_cu_tru",
          "nguoi_dung",
          "lich_su_ban_giao_can_ho",
          "phuong_tien",
        ],
        "qr-phan-anh": [
          "vi_tri_qr",
          "lich_su_lien_ket_qr",
          "phan_anh",
          "lich_su_phan_anh",
          "hinh_anh_phan_anh",
        ],
        "tai-chinh": schema.tables
          .map((t) => t.table_name)
          .filter((name) =>
            /hoa_don|loai_phi|cau_hinh_phi|chi_so_dich_vu|quy|thu_chi|so_quy|nhac_phi/.test(
              name,
            ),
          ),
        "van-hanh": schema.tables
          .map((t) => t.table_name)
          .filter((name) =>
            /thiet_bi|bao_tri|tien_ich|dat_lich|thong_bao|nguoi_nhan/.test(
              name,
            ),
          ),
      };
      const present = new Set(schema.tables.map((table) => table.table_name));
      const diagrams = [
        "# ERD vật lý theo phân hệ",
        "",
        "Tự sinh từ cùng metadata với [từ điển dữ liệu](tu-dien-du-lieu.md). Cột trong hình rút gọn còn PK/FK; tên cột, kiểu đầy đủ, CHECK và UNIQUE xem từ điển. Bảng cha ngoài nhóm được thêm làm điểm nối. FK ghép được vẽ một quan hệ. UNIQUE ghép/sinh cần đọc thêm biểu thức trong từ điển.",
        "",
        "Ký hiệu: `||` đúng một; `o|` không hoặc một; `o{` không hoặc nhiều. Cột FK nullable cho phép không có cha. Đây là quan hệ vật lý; quy tắc một đợt cư trú đang mở hay một chủ hộ hiện tại còn phụ thuộc UNIQUE sinh và transaction service.",
        "",
        "[ERD toàn bộ bảng (.mmd)](erd-vat-ly.mmd) có tất cả cột, phù hợp mở bằng công cụ Mermaid; không nên ép toàn bộ vào một trang A4.",
        "",
      ];
      for (const [name, tables] of Object.entries(modules)) {
        diagrams.push(
          `## ${name}`,
          "",
          "```mermaid",
          erd(
            schema,
            tables.filter((table) => present.has(table)),
            true,
          ).trimEnd(),
          "```",
          "",
        );
      }
      await writeFile(
        path.join(target, "tu-dien-du-lieu.md"),
        dictionary(schema, files),
      );
      await writeFile(path.join(target, "erd-vat-ly.mmd"), erd(schema));
      await writeFile(
        path.join(target, "erd-phan-he.md"),
        diagrams.join("\n").trimEnd() + "\n",
      );
      console.log(
        `Đã xuất metadata ${schema.tables.length} bảng / ${schema.columns.length} cột vào docs/bao-cao; không đọc hàng dữ liệu nghiệp vụ.`,
      );
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  } finally {
    await pool.end();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch(() => {
    console.error(
      "Không xuất được schema. Kiểm tra kết nối PostgreSQL và migration/checksum; chưa sửa database. Không chạy migration đồng thời khi xuất tài liệu.",
    );
    process.exitCode = 1;
  });
