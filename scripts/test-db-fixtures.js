import { pool } from "../backend/src/lib/db.js";
import { historyCatalog } from "../backend/src/lib/history.js";
export const TEST_DATABASE = "chung_cu_test";
const identifier = (value) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(value))
    throw new Error("Invalid fixture identifier");
  return "`" + value + "`";
};
const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
export async function assertTestDatabase(db = pool) {
  if (process.env.DB_NAME !== TEST_DATABASE)
    throw new Error("Test DB required");
  const [[row]] = await db.query("SELECT DATABASE() AS name");
  if (row.name !== TEST_DATABASE) throw new Error("Unexpected test DB");
}
export async function executeTestSql(sql, db = pool) {
  await assertTestDatabase(db);
  return db.query(sql);
}
export async function installParentFixtures() {
  await executeTestSql("DROP TRIGGER IF EXISTS test_apartment_parent");
  await executeTestSql("DROP TRIGGER IF EXISTS test_floor_parent");
  await executeTestSql(
    "CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha FOR EACH ROW INSERT IGNORE INTO khoi_toa_nha(khoi,giu_khi_trong) VALUES(NEW.khoi,0)",
  );
  await executeTestSql(
    "CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho FOR EACH ROW BEGIN INSERT IGNORE INTO khoi_toa_nha(khoi,giu_khi_trong) VALUES(NEW.khoi,0); INSERT IGNORE INTO tang_toa_nha(khoi,tang,giu_khi_trong) VALUES(NEW.khoi,NEW.tang,0); END",
  );
}
export async function removeParentFixtures() {
  await executeTestSql("DROP TRIGGER IF EXISTS test_apartment_parent");
  await executeTestSql("DROP TRIGGER IF EXISTS test_floor_parent");
}
export async function createFailureTrigger(name, table, message, options = {}) {
  const audit = historyCatalog[table];
  const condition = [
    audit ? `NEW.loai_nhat_ky=${literal(table)}` : "TRUE",
    options.condition || "TRUE",
  ].join(" AND ");
  await executeTestSql(
    `CREATE TRIGGER ${identifier(name)} BEFORE INSERT ON ${identifier(audit ? "nhat_ky_nghiep_vu" : table)} FOR EACH ROW BEGIN IF ${condition} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT=${literal(message)}; END IF; END`,
  );
}
export async function dropFailureTrigger(name) {
  await executeTestSql(`DROP TRIGGER IF EXISTS ${identifier(name)}`);
}

export async function deleteVehicleFixtures(residentId, db = pool) {
  await assertTestDatabase(db);
  await db.execute(
    "DELETE FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
    [residentId],
  );
}
