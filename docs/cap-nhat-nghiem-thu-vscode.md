# Cập nhật hồ sơ thiết kế và kiểm tra file trong VS Code

Bản này bổ sung hồ sơ theo đề cương và hai công cụ hỗ trợ máy cục bộ. **Không đổi luồng giao diện, không có migration hoặc dependency ứng dụng mới.** Giữ bản ứng dụng 018 đã cập nhật trước đó; không sửa SQL cũ.

## 1. Tạo file kiểm tra trước khi chạy

Mở đúng thư mục gốc `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents` (có `package.json`, `backend`, `frontend`, `scripts`). Tạo `scripts/check-local.js`, chép toàn bộ khối code bên dưới, lưu UTF-8. Bật **File name extensions** trong Windows Explorer để tránh tên `check-local.js.txt`.

Chạy trong PowerShell ở thư mục gốc:

```powershell
node scripts/check-local.js
```

Công cụ kiểm tra Node >=22.12, sự tồn tại của `.env`, các package khai báo resolve được, import tương đối trong `backend/src`, `backend/scripts`, `frontend/src`, `scripts` (bỏ file `.test.js`), và migration mà `app.js` yêu cầu. Nó không thực thi app hoặc đọc nội dung `.env`, không cài thư viện/migrate/seed. Đây là kiểm tra theo cách viết import hiện tại, không thay parser/build; import được ghép từ biến và toàn bộ đồ thị dependency bên thứ ba không nằm trong phạm vi.

Nếu báo thiếu `backend/src/modules/residency/building-structure.service.js`, chép đủ file đó từ [bản Khối & tầng](cap-nhat-khoi-tang-vscode.md), không xóa dòng import hoặc tạo service rỗng. Nếu có `.js.txt`, đổi đúng đuôi. Nếu thiếu dependency, chạy `npm ci` ở thư mục gốc. Nếu `.env` chưa có, tạo từ `.env.example` và điền cấu hình riêng; không gửi mật khẩu lên GitHub.

Sau khi hết lỗi file, khởi động backend ở terminal riêng:

```powershell
npm run dev:backend
```

Giữ terminal backend chạy, tại terminal thứ hai:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
```

Cả `/api/health` và `/api/ready` phải trả 200/status ok. Health chỉ xác nhận tiến trình; ready kiểm tra database/migration. Nếu backend dùng cổng khác, sửa origin loopback ở lệnh trên. Không dùng IP điện thoại hoặc đường dẫn `/api` cho tham số `--api`. Chứng chỉ HTTPS phải được Node tin cậy; không bỏ kiểm tra TLS để ép kết quả đạt.

Có lỗi thì exit code 1; sai cú pháp tham số thì 2. File hợp lệ không chứng minh camera hoặc nghiệp vụ trên điện thoại đã đạt.

## 2. File `scripts/check-local.js` — bắt buộc để dùng kiểm tra file

```javascript
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const slash = (name) => name.split(path.sep).join("/");
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};
async function isFile(file) {
  return stat(file).then(
    (entry) => entry.isFile(),
    () => false,
  );
}
async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const name = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) return [];
      if (
        entry.isDirectory() &&
        !["node_modules", "storage", ".git"].includes(entry.name)
      )
        return sourceFiles(name);
      return entry.isFile() &&
        /\.(?:[cm]?js|jsx)$/.test(entry.name) &&
        !entry.name.endsWith(".test.js")
        ? [name]
        : [];
    }),
  );
  return nested.flat();
}

// Static import/export declarations at the beginning of a line and literal
// dynamic imports; this is a preflight check, not a JavaScript parser/bundler.
export function localImports(source) {
  // Preserve line numbers when removing block and full-line comments.
  const clean = source
    .replace(/\/\*[\s\S]*?\*\//g, (s) => s.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/[^\n]*/gm, (s) => s.replace(/[^\n]/g, " "));
  const pattern =
    /(?:^\s*(?:import|export)\s+(?:[^;"']*?\sfrom\s*)?|\bimport\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/gm;
  return [...clean.matchAll(pattern)].map((match) => ({
    target: match[1].split(/[?#]/)[0],
    line: clean.slice(0, match.index).split("\n").length,
  }));
}

export async function checkLocal({
  root = projectRoot,
  nodeVersion = process.versions.node,
  checkDependencies = true,
} = {}) {
  root = path.resolve(root);
  const checks = [];
  const add = (level, code, message, file, line) =>
    checks.push({
      level,
      code,
      message,
      ...(file ? { file: slash(file) } : {}),
      ...(line ? { line } : {}),
    });
  const [major, minor] = nodeVersion.split(".").map(Number);
  add(
    major > 22 || (major === 22 && minor >= 12) ? "ok" : "error",
    "NODE",
    `Node ${nodeVersion}; yêu cầu >=22.12, khuyến nghị Node 24.`,
  );
  add(
    (await isFile(path.join(root, ".env"))) ? "ok" : "warning",
    "ENV",
    ".env: chỉ kiểm tra sự tồn tại, không đọc nội dung. Nếu thiếu, tạo từ .env.example và điền cấu hình riêng.",
  );
  for (const name of [
    "package.json",
    "backend/package.json",
    "frontend/package.json",
  ]) {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(path.join(root, name), "utf8"));
    } catch {
      add("error", "MANIFEST", "Thiếu hoặc sai JSON.", name);
      continue;
    }
    if (!checkDependencies) continue;
    const require = createRequire(path.join(root, name));
    const missing = Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    }).filter((dependency) => {
      try {
        require.resolve(dependency);
        return false;
      } catch {
        return true;
      }
    });
    add(
      missing.length ? "error" : "ok",
      "DEPENDENCIES",
      missing.length
        ? `Chưa resolve được: ${missing.join(", ")}. Chạy npm ci ở thư mục gốc.`
        : "Đã tìm thấy các dependency khai báo.",
      name,
    );
  }
  const directories = [
    "backend/src",
    "backend/scripts",
    "frontend/src",
    "scripts",
  ];
  for (const directory of directories) {
    const files = await sourceFiles(path.join(root, directory));
    if (!files.length)
      add(
        "error",
        "SOURCE",
        "Thiếu thư mục mã nguồn hoặc không có file JavaScript.",
        directory,
      );
    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const ref of localImports(source)) {
        const target = path.resolve(path.dirname(file), ref.target);
        const relative = path.relative(root, file);
        if (!inside(root, target)) {
          add(
            "error",
            "OUTSIDE_IMPORT",
            `Import ra ngoài thư mục dự án: ${ref.target}`,
            relative,
            ref.line,
          );
          continue;
        }
        // Vite supports extensionless imports; Node ESM backend does not.
        let candidates = [target];
        if (relative.startsWith(`frontend${path.sep}`) && !path.extname(target))
          candidates = [
            target,
            ...[".js", ".jsx", "/index.js", "/index.jsx"].map(
              (extension) => target + extension,
            ),
          ];
        let found = null;
        for (const candidate of candidates)
          if (await isFile(candidate)) {
            found = candidate;
            break;
          }
        if (!found) {
          const txt = await isFile(`${target}.txt`);
          add(
            "error",
            "MISSING_IMPORT",
            `Thiếu ${slash(path.relative(root, target))}.${txt ? " Có file .txt: đổi đúng đuôi file, bật File name extensions trong Explorer." : " Chép đủ file từ đúng bản cập nhật."}`,
            relative,
            ref.line,
          );
          continue;
        }
        // Also detect casing mistakes on case-insensitive Windows filesystems.
        let parent = root;
        for (const segment of path.relative(root, found).split(path.sep)) {
          const names = await readdir(parent);
          if (!names.includes(segment)) {
            add(
              "error",
              "IMPORT_CASE",
              `Sai chữ hoa/thường trong import ${ref.target}.`,
              relative,
              ref.line,
            );
            break;
          }
          parent = path.join(parent, segment);
        }
      }
    }
  }
  const appFile = path.join(root, "backend/src/app.js");
  if (await isFile(appFile)) {
    const app = await readFile(appFile, "utf8");
    for (const name of new Set(app.match(/\d{3}_[a-z0-9_]+\.sql/g) || [])) {
      if (!(await isFile(path.join(root, "database/migrations", name))))
        add(
          "error",
          "MIGRATION_FILE",
          "Thiếu file migration mà /api/ready yêu cầu; không sửa checksum migration cũ.",
          `database/migrations/${name}`,
        );
    }
  } else
    add("error", "APP", "Thiếu file khởi tạo backend.", "backend/src/app.js");
  return checks;
}

export async function checkApi(base, fetcher = fetch) {
  const url = new URL(base);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "--api cần origin loopback, ví dụ http://127.0.0.1:3000 (không kèm đường dẫn/tài khoản).",
    );
  const checks = [];
  for (const endpoint of ["health", "ready"]) {
    try {
      const response = await fetcher(new URL(`/api/${endpoint}`, url), {
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.json();
      const ready = response.ok && body?.data?.status === "ok";
      checks.push({
        level: ready ? "ok" : "error",
        code: "API",
        message: `/api/${endpoint}: HTTP ${response.status}, ${ready ? "sẵn sàng" : "chưa sẵn sàng; xem terminal backend và chạy đúng migration"}.`,
      });
    } catch {
      checks.push({
        level: "error",
        code: "API",
        message: `/api/${endpoint}: không đọc được phản hồi trong 5 giây; kiểm tra backend/cổng/HTTPS.`,
      });
    }
  }
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === "--api"))
    throw new Error(
      "Cách dùng: node scripts/check-local.js [--api http://127.0.0.1:3000]",
    );
  const checks = await checkLocal();
  if (args.length) checks.push(...(await checkApi(args[1])));
  for (const check of checks)
    console.log(
      `[${check.level.toUpperCase()}] ${check.code}${check.file ? ` ${check.file}${check.line ? `:${check.line}` : ""}` : ""}: ${check.message}`,
    );
  const errors = checks.filter((check) => check.level === "error").length;
  console.log(
    `\n${errors} lỗi. Đây là kiểm tra file/dependency${args.length ? "/API" : ""}; chưa xác nhận nghiệp vụ, camera hay database trên máy khác.`,
  );
  if (!args.length)
    console.log(
      "Khi backend đang chạy: node scripts/check-local.js --api http://127.0.0.1:3000",
    );
  process.exitCode = errors ? 1 : 0;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 2;
  });
```

## 3. File `scripts/export-schema.js` — tùy chọn để tái sinh ERD/từ điển

```javascript
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
    "Sinh từ metadata MySQL bằng `scripts/export-schema.js`. Không đọc dữ liệu nghiệp vụ, thông tin đăng nhập hoặc nội dung ảnh. Phản ánh schema tại lúc xuất; không tự phát hiện mọi thay đổi DDL thủ công ngoài migration.",
    "",
    `Nguồn: ${migrations.length} migration, cuối cùng **${migrations.at(-1)?.name}**. Tổng **${schema.tables.length} bảng**, **${schema.columns.length} cột**, **${keys.length} ràng buộc khóa ngoại**.`,
    "",
    "`NULL` là không có giá trị; `—` ở mặc định nghĩa metadata không có mặc định khác NULL. Kiểu, chỉ mục, biểu thức cột sinh và CHECK bên dưới lấy từ MySQL. Quan hệ nullable không bắt buộc có bản ghi cha; UNIQUE của cột sinh có thể chỉ áp dụng cho bản ghi đang hoạt động, cần đọc biểu thức sinh và service.",
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
      `Engine: ${md(table.engine)}; đối chiếu: ${md(table.table_collation)}.`,
      "",
      "| Cột | Kiểu MySQL | NULL | Mặc định | Bổ sung / biểu thức sinh |",
      "|---|---|---|---|---|",
    );
    for (const col of schema.columns.filter((row) => row.table_name === name))
      lines.push(
        `| ${md(col.column_name)} | ${md(col.column_type)} | ${col.is_nullable === "YES" ? "Có" : "Không"} | ${md(col.column_default)} | ${md([col.extra, col.generation_expression].filter(Boolean).join("; "))} |`,
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
    tables: await query(
      "SELECT TABLE_NAME AS table_name, ENGINE AS engine, TABLE_COLLATION AS table_collation FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    ),
    columns: await query(
      "SELECT TABLE_NAME AS table_name,COLUMN_NAME AS column_name,DATA_TYPE AS data_type,COLUMN_TYPE AS column_type,IS_NULLABLE AS is_nullable,COLUMN_DEFAULT AS column_default,EXTRA AS extra,GENERATION_EXPRESSION AS generation_expression FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION",
    ),
    foreignKeys: await query(
      "SELECT k.TABLE_NAME AS table_name,k.CONSTRAINT_NAME AS constraint_name,k.COLUMN_NAME AS column_name,k.ORDINAL_POSITION AS ordinal_position,k.REFERENCED_TABLE_NAME AS referenced_table_name,k.REFERENCED_COLUMN_NAME AS referenced_column_name,r.UPDATE_RULE AS update_rule,r.DELETE_RULE AS delete_rule FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION",
    ),
    indexes: await query(
      "SELECT TABLE_NAME AS table_name,INDEX_NAME AS index_name,NON_UNIQUE AS non_unique,COLUMN_NAME AS column_name,SEQ_IN_INDEX AS seq_in_index,SUB_PART AS sub_part FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX",
    ),
    checks: await query(
      "SELECT t.TABLE_NAME AS table_name,c.CONSTRAINT_NAME AS constraint_name,c.CHECK_CLAUSE AS check_clause FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME WHERE c.CONSTRAINT_SCHEMA=DATABASE() ORDER BY t.TABLE_NAME,c.CONSTRAINT_NAME",
    ),
  };
}

async function main() {
  if (process.argv.length > 2)
    throw new Error(
      "Cách dùng: node --env-file-if-exists=.env scripts/export-schema.js",
    );
  const directory = path.join(root, "database/migrations");
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
      await db.query("SET SESSION TRANSACTION READ ONLY");
      await db.beginTransaction();
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
      "Không xuất được schema. Kiểm tra kết nối MySQL và migration/checksum; chưa sửa database. Không chạy migration đồng thời khi xuất tài liệu.",
    );
    process.exitCode = 1;
  });
```

## 4. File `scripts/check-local.test.js` — kiểm thử công cụ, tùy chọn

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkLocal, checkApi, localImports } from "./check-local.js";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "chung-cu-check-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of [
    "backend/src",
    "backend/scripts",
    "frontend/src",
    "scripts",
    "database/migrations",
  ])
    await mkdir(path.join(root, directory), { recursive: true });
  for (const file of [
    "package.json",
    "backend/package.json",
    "frontend/package.json",
  ])
    await writeFile(path.join(root, file), '{"type":"module"}');
  for (const file of [
    "backend/src/app.js",
    "backend/scripts/migrate.js",
    "frontend/src/App.jsx",
    "scripts/init.js",
  ])
    await writeFile(path.join(root, file), "export const ready = true;\n");
  await writeFile(
    path.join(root, ".env"),
    "PRIVATE_VALUE_DO_NOT_PRINT=sentinel-secret\n",
  );
  return root;
}
test("báo đúng file service bị thiếu và đuôi .js.txt, giữ kín env", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/src/app.js"),
    'import * as service from "./building-structure.service.js";\n',
  );
  await writeFile(
    path.join(root, "backend/src/building-structure.service.js.txt"),
    "export default {};\n",
  );
  const checks = await checkLocal({ root, checkDependencies: false });
  const missing = checks.find((check) => check.code === "MISSING_IMPORT");
  assert.equal(missing.file, "backend/src/app.js");
  assert.equal(missing.line, 1);
  assert.match(missing.message, /building-structure\.service\.js.*\.txt/);
  assert.doesNotMatch(JSON.stringify(checks), /sentinel-secret/);
  await writeFile(
    path.join(root, "backend/src/building-structure.service.js"),
    "export default {};\n",
  );
  assert.equal(
    (await checkLocal({ root, checkDependencies: false })).filter(
      (check) => check.level === "error",
    ).length,
    0,
  );
});
test("phát hiện migration thiếu, import ngoài dự án và Node cũ", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/src/app.js"),
    'const migration = "018_equipment_qr.sql";\nimport "../../../outside.js";\n',
  );
  const codes = (
    await checkLocal({ root, nodeVersion: "22.11.0", checkDependencies: false })
  )
    .filter((check) => check.level === "error")
    .map((check) => check.code);
  assert.ok(codes.includes("NODE"));
  assert.ok(codes.includes("OUTSIDE_IMPORT"));
  assert.ok(codes.includes("MIGRATION_FILE"));
});
test("dependency chưa cài được báo với hướng dẫn npm ci", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "backend/package.json"),
    '{"dependencies":{"missing-chung-cu-fixture":"1.0.0"}}',
  );
  assert.match(
    (await checkLocal({ root })).find(
      (check) => check.code === "DEPENDENCIES" && check.level === "error",
    ).message,
    /npm ci/,
  );
});
test("đọc import multiline, re-export, CSS, dynamic; bỏ comment", () => {
  const imports = localImports(
    '// import "./absent.js";\n/* import "./absent2.js"; */\nimport {\n value\n} from "./value.js";\nexport * from "./shared.js";\nimport "./style.css";\nconst module = import("./lazy.js");\n',
  );
  assert.deepEqual(
    imports.map((entry) => entry.target),
    ["./value.js", "./shared.js", "./style.css", "./lazy.js"],
  );
});
test("health ok không che ready 503; không đọc nội dung lỗi server", async () => {
  const checks = await checkApi("http://127.0.0.1:3000", async (url) =>
    url.pathname.endsWith("health")
      ? Response.json({ data: { status: "ok" } })
      : Response.json(
          { error: { message: "private-sentinel" } },
          { status: 503 },
        ),
  );
  assert.deepEqual(
    checks.map((check) => check.level),
    ["ok", "error"],
  );
  assert.doesNotMatch(JSON.stringify(checks), /private-sentinel/);
  await assert.rejects(checkApi("http://example.com"), /loopback/);
  await assert.rejects(checkApi("http://127.0.0.1:3000/private"), /loopback/);
  assert.ok(
    (
      await checkApi("http://127.0.0.1:3000", async () => {
        throw new Error("offline");
      })
    ).every((check) => check.level === "error"),
  );
});
```

## 5. File `scripts/export-schema.test.js` — kiểm thử công cụ, tùy chọn

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  dictionary,
  erd,
  foreignKeys,
  verifyMigrations,
  readMetadata,
} from "./export-schema.js";

function fixture() {
  return {
    tables: ["parent", "child"].map((table_name) => ({
      table_name,
      engine: "InnoDB",
      table_collation: "utf8mb4_0900_ai_ci",
    })),
    columns: [
      {
        table_name: "parent",
        column_name: "id",
        data_type: "int",
        column_type: "int unsigned",
        is_nullable: "NO",
      },
      {
        table_name: "parent",
        column_name: "block",
        data_type: "varchar",
        column_type: "varchar(10)",
        is_nullable: "NO",
      },
      {
        table_name: "child",
        column_name: "parent_id",
        data_type: "int",
        column_type: "int unsigned",
        is_nullable: "YES",
      },
      {
        table_name: "child",
        column_name: "block",
        data_type: "varchar",
        column_type: "varchar(10)",
        is_nullable: "NO",
      },
      {
        table_name: "child",
        column_name: "amount",
        data_type: "decimal",
        column_type: "decimal(12,2)",
        is_nullable: "NO",
        extra: "STORED GENERATED",
        generation_expression: "if(`parent_id` > 0, 1, NULL)",
      },
    ],
    foreignKeys: ["parent_id", "block"].map((column_name, i) => ({
      table_name: "child",
      column_name,
      constraint_name: "fk_parent",
      ordinal_position: i + 1,
      referenced_table_name: "parent",
      referenced_column_name: i ? "block" : "id",
      update_rule: "CASCADE",
      delete_rule: "RESTRICT",
    })),
    indexes: ["parent_id", "block"].map((column_name, i) => ({
      table_name: "child",
      column_name,
      index_name: "uk_parent",
      non_unique: 0,
      seq_in_index: i + 1,
    })),
    checks: [
      {
        table_name: "child",
        constraint_name: "ck_amount",
        check_clause: "amount >= 0 | amount is null",
      },
    ],
  };
}
test("FK ghép chỉ có một quan hệ, nullable và UNIQUE quyết định lực lượng", () => {
  const schema = fixture();
  const keys = foreignKeys(schema);
  assert.equal(keys.length, 1);
  assert.deepEqual(keys[0].columns, ["parent_id", "block"]);
  assert.equal(keys[0].nullable, true);
  assert.equal(keys[0].unique, true);
  const diagram = erd(schema);
  assert.match(diagram, /parent o\|--o\| child/);
  assert.equal((diagram.match(/ : /g) || []).length, 1);
  assert.match(diagram, /decimal amount "decimal\(12,2\)/);
  schema.indexes = [];
  schema.columns[2].is_nullable = "NO";
  assert.match(erd(schema), /parent \|\|--o\{ child/);
});
test("từ điển giữ kiểu, cột sinh, check, FK và checksum", () => {
  const document = dictionary(fixture(), [
    { name: "018_test.sql", checksum: "abc" },
  ]);
  assert.match(document, /decimal\(12,2\)/);
  assert.match(document, /STORED GENERATED; if\(&#96;parent_id/);
  assert.match(document, /UPDATE CASCADE, DELETE RESTRICT/);
  assert.ok(document.includes("0 \\| amount"));
  assert.match(document, /018_test.sql.*abc/);
});
test("không xuất khi thiếu migration, checksum đổi hoặc DB chạy trước checkout", () => {
  const files = [{ name: "018_test.sql", checksum: "abc" }];
  assert.doesNotThrow(() => verifyMigrations(files, files));
  assert.throws(() => verifyMigrations(files, []));
  assert.throws(() =>
    verifyMigrations(files, [{ ...files[0], checksum: "changed" }]),
  );
  assert.throws(() =>
    verifyMigrations(files, [...files, { name: "019.sql", checksum: "x" }]),
  );
});
test("metadata exporter chỉ đọc information_schema, không đọc hàng nghiệp vụ", async () => {
  const queries = [];
  const schema = await readMetadata({
    query: async (sql) => {
      queries.push(sql);
      return [[]];
    },
  });
  assert.equal(schema.tables.length, 0);
  assert.equal(queries.length, 5);
  assert.ok(
    queries.every(
      (sql) => /^SELECT /i.test(sql) && /FROM information_schema\./.test(sql),
    ),
  );
  assert.ok(queries.every((sql) => !/password|mat_khau|SELECT \*/i.test(sql)));
});
```

## 6. Tài liệu đã làm tiếp

Mở [bộ hồ sơ báo cáo](bao-cao/README.md), gồm:

- [Use Case tổng thể/phân rã và 5 đặc tả](bao-cao/use-case.md).
- [4 Activity, 4 Sequence và trạng thái](bao-cao/quy-trinh.md).
- [Kiến trúc, phân rã chức năng, Class Diagram và ERD logic](bao-cao/kien-truc-va-mo-hinh.md).
- [ERD vật lý theo phân hệ](bao-cao/erd-phan-he.md), [ERD toàn bộ](bao-cao/erd-vat-ly.mmd), [từ điển 38 bảng](bao-cao/tu-dien-du-lieu.md).
- [Ma trận kiểm thử, kế hoạch demo và thực nghiệm điện thoại](bao-cao/nghiem-thu.md).

Xem được trực tiếp trên GitHub, không phải tải ZIP. Tài liệu không tự sửa file Word gốc. Chọn hình/bảng đưa vào chương 2–3, bổ sung Figma/ảnh demo và điền kết quả máy thật sau khi thử. Mermaid flowchart mô phỏng Use Case, cần thống nhất ký pháp với GVHD.

Nếu muốn tái sinh ba tài liệu schema từ database **đã có đủ migration 018**, sau khi tạo file ở mục 3:

```powershell
node --env-file-if-exists=.env scripts/export-schema.js
```

Lệnh kiểm tra tên/checksum migration, chỉ đọc `schema_migrations` và metadata `information_schema`; không đọc dữ liệu cư dân, không thay database. Nó ghi `docs/bao-cao/tu-dien-du-lieu.md`, `erd-vat-ly.mmd`, `erd-phan-he.md`. Không chạy đồng thời với migration. Nếu checksum thiếu/lệch thì dừng; dùng runner chuẩn, không sửa migration cũ. Không cần chạy lệnh này để sử dụng website.

## 7. Kiểm tra sau cập nhật

Nếu chép cả hai file kiểm thử tùy chọn:

```powershell
node --test scripts/check-local.test.js scripts/export-schema.test.js
```

Kết quả lần rà soát Linux ngày 21/10/2026: 9 kiểm tra công cụ đạt; 215 backend đạt; 47 E2E đạt; build frontend đạt. Hai bộ nghiệp vụ phải chạy lần lượt:

```powershell
npm test
npm run test:e2e
npm run build
```

Các bài nghiệp vụ dùng `chung_cu_test` riêng, cần Docker/MySQL theo README; không dùng DB dữ liệu thật làm test. Kết quả workspace không xác nhận bản file tại máy Windows hoặc camera điện thoại của bạn. Không cần chạy migration mới trong bản bổ sung tài liệu này.
