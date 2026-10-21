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
// Older integration fixtures insert apartments directly. Provision their
// parents only in the isolated test DB; production has no such triggers and
// must provision/validate the hierarchy in saveApartment's transaction.
const fixtureResult = spawnSync(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "db",
    "sh",
    "-c",
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
  ],
  {
    stdio: ["pipe", "inherit", "inherit"],
    input: `DROP TRIGGER IF EXISTS test_floor_parent;
CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha FOR EACH ROW
INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (NEW.khoi,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
DROP TRIGGER IF EXISTS test_apartment_parent;
CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho FOR EACH ROW
INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (NEW.khoi,NEW.tang,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;`,
  },
);
if (fixtureResult.status !== 0) process.exit(fixtureResult.status || 1);
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
