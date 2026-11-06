export const freshDatabasePattern = /^chung_cu_nghiem_thu_moi[a-z0-9]{1,17}$/;
export function freshConfigIssues(env) {
  const issues = [];
  if (env.FRESH_INSTALL !== "1") issues.push("FRESH_INSTALL");
  if (!freshDatabasePattern.test(env.DB_NAME || "")) issues.push("DB_NAME");
  if (typeof env.JWT_SECRET !== "string" || env.JWT_SECRET.trim().length < 32)
    issues.push("JWT_SECRET");
  if (env.DB_ENGINE !== "mysql") issues.push("DB_ENGINE");
  return issues;
}

export function environmentOverrides(file, effective) {
  return [
    "FRESH_INSTALL",
    "DB_NAME",
    "JWT_SECRET",
    "DB_ENGINE",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "PORT",
    "COOKIE_SECURE",
  ].filter(
    (key) =>
      Object.hasOwn(file, key) &&
      Object.hasOwn(effective, key) &&
      file[key] !== effective[key],
  );
}
