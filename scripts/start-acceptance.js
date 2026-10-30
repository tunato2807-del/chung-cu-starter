import path from "node:path";
import { fileURLToPath } from "node:url";

export function acceptanceDatabase(args) {
  const database = args[0] || "chung_cu_nghiem_thu";
  if (
    args.length > 1 ||
    !/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database)
  )
    throw new Error(
      "Dùng npm run start:backend:acceptance [-- chung_cu_nghiem_thu_<mã bộ mẫu>].",
    );
  return database;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.env.DB_NAME = acceptanceDatabase(process.argv.slice(2));
  await import("../backend/src/server.js");
}
