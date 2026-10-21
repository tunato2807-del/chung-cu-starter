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
