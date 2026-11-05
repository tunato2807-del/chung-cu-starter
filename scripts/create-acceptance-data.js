import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
export function acceptanceOptions(args) {
  const options = {
    database: "chung_cu_nghiem_thu",
    origin: "https://localhost:5173",
    docker: false,
  };
  for (const arg of args) {
    if (arg === "--docker") options.docker = true;
    else if (arg.startsWith("--database=")) options.database = arg.slice(11);
    else if (arg.startsWith("--origin=")) options.origin = arg.slice(9);
    else
      throw new Error(
        "Dùng --docker, --database=chung_cu_nghiem_thu hoặc --origin=https://IP:5173.",
      );
  }
  if (!/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(options.database))
    throw new Error(
      "Chỉ tạo dữ liệu trong DB chung_cu_nghiem_thu hoặc chung_cu_nghiem_thu_<mã chữ thường/số>. Không dùng DB thật/test.",
    );
  const origin = new URL(options.origin);
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error(
      "Origin cần http(s)://host:port, không kèm đường dẫn hay tài khoản.",
    );
  options.origin = origin.origin;
  return options;
}
function run(command, args, env, input) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
    input,
  });
  if (result.error)
    throw new Error(`Không chạy được ${command}: ${result.error.code}.`);
  if (result.status !== 0)
    throw new Error(
      `Lệnh dừng với mã ${result.status}. Không xóa database/volume để thử lại; xem hướng dẫn nghiệm thu.`,
    );
}
async function launch() {
  const options = acceptanceOptions(process.argv.slice(2));
  // Both native PostgreSQL and Compose use the same TCP connection. The old
  // --docker flag remains accepted for existing acceptance instructions.
  if (
    options.docker &&
    !["127.0.0.1", "localhost"].includes(process.env.DB_HOST || "127.0.0.1")
  )
    throw new Error("--docker chỉ dùng PostgreSQL Docker cục bộ của dự án.");
  const { databaseConfig, pool } = await import("../backend/src/lib/db.js");
  const { ensureDatabase } = await import("./postgresql-admin.js");
  try {
    await ensureDatabase(databaseConfig(), options.database);
  } finally {
    await pool.end();
  }
  const env = {
    ...process.env,
    DB_NAME: options.database,
    ACCEPTANCE_ORIGIN: options.origin,
  };
  console.log(
    `Database nghiệm thu: ${options.database}; giữ nguyên .env và dữ liệu chung_cu.`,
  );
  run(process.execPath, ["backend/scripts/migrate.js"], env);
  run(process.execPath, ["backend/scripts/seed-acceptance.js"], env);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  launch().catch((error) => {
    console.error(
      error.code
        ? `Không tạo được bộ mẫu PostgreSQL (${error.code}). Kiểm tra dịch vụ, quyền CREATEDB và cấu hình.`
        : error.message,
    );
    process.exitCode = 1;
  });
