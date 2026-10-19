import { spawnSync } from "node:child_process";
const run = (cmd, args, env = process.env) => {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status || 1);
};
// Test data lives in a separate database; never clear the development database.
run("docker", [
  "compose",
  "exec",
  "-T",
  "db",
  "sh",
  "-c",
  "MYSQL_PWD=\"$MYSQL_ROOT_PASSWORD\" mysql -u root -e \"CREATE DATABASE IF NOT EXISTS chung_cu_test CHARACTER SET utf8mb4; GRANT ALL ON chung_cu_test.* TO 'chung_cu'@'%';\"",
]);
const env = { ...process.env, DB_NAME: "chung_cu_test" };
run("npm", ["run", "db:migrate", "-w", "backend"], env);
if (process.argv.includes("e2e"))
  run(
    "node",
    [
      "--env-file-if-exists=.env",
      "node_modules/@playwright/test/cli.js",
      "test",
    ],
    env,
  );
else run("npm", ["test", "-w", "backend"], env);
