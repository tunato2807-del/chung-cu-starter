import { pool } from "../backend/src/lib/db.js";

export const TEST_DATABASE = "chung_cu_test";

function identifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value))
    throw new Error(`Invalid test SQL identifier: ${value}`);
  return `"${value}"`;
}

function literal(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function assertTestDatabase(db = pool) {
  if (process.env.DB_NAME !== TEST_DATABASE)
    throw new Error(`Fixtures require DB_NAME=${TEST_DATABASE}.`);
  const [records] = await db.query("SELECT current_database() AS name");
  if (records[0]?.name !== TEST_DATABASE)
    throw new Error(`Fixtures may only modify ${TEST_DATABASE}.`);
}

export async function executeTestSql(sql, db = pool) {
  await assertTestDatabase(db);
  if (db.native) return db.native.query(sql);
  return db.query(sql);
}

export async function installParentFixtures() {
  await executeTestSql(`
    CREATE OR REPLACE FUNCTION test_floor_parent_fn() RETURNS trigger
    LANGUAGE plpgsql AS $fixture$
    BEGIN
      INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (NEW.khoi,0)
        ON CONFLICT (khoi) DO NOTHING;
      RETURN NEW;
    END;
    $fixture$;
    DROP TRIGGER IF EXISTS test_floor_parent ON tang_toa_nha;
    CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha
      FOR EACH ROW EXECUTE FUNCTION test_floor_parent_fn();

    CREATE OR REPLACE FUNCTION test_apartment_parent_fn() RETURNS trigger
    LANGUAGE plpgsql AS $fixture$
    BEGIN
      INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong)
        VALUES (NEW.khoi,NEW.tang,0)
        ON CONFLICT (khoi,tang) DO NOTHING;
      RETURN NEW;
    END;
    $fixture$;
    DROP TRIGGER IF EXISTS test_apartment_parent ON can_ho;
    CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho
      FOR EACH ROW EXECUTE FUNCTION test_apartment_parent_fn();
  `);
}

export async function removeParentFixtures() {
  await executeTestSql(`
    DROP TRIGGER IF EXISTS test_apartment_parent ON can_ho;
    DROP TRIGGER IF EXISTS test_floor_parent ON tang_toa_nha;
    DROP FUNCTION IF EXISTS test_apartment_parent_fn();
    DROP FUNCTION IF EXISTS test_floor_parent_fn();
  `);
}

export async function createFailureTrigger(name, table, message, options = {}) {
  const trigger = identifier(name);
  const target = identifier(table);
  const fn = identifier(`${name}_fn`);
  await executeTestSql(`
    CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger
    LANGUAGE plpgsql AS $fixture$
    BEGIN
      IF ${options.condition || "TRUE"} THEN
        RAISE EXCEPTION '%', ${literal(message)} USING ERRCODE = 'P0001';
      END IF;
      RETURN NEW;
    END;
    $fixture$;
    CREATE TRIGGER ${trigger} BEFORE INSERT ON ${target}
      FOR EACH ROW EXECUTE FUNCTION ${fn}();
  `);
}

export async function dropFailureTrigger(name, table) {
  await executeTestSql(`
    DROP TRIGGER IF EXISTS ${identifier(name)} ON ${identifier(table)};
    DROP FUNCTION IF EXISTS ${identifier(`${name}_fn`)}();
  `);
}

export async function deleteVehicleFixtures(residentId, db = pool) {
  await assertTestDatabase(db);
  // Transfer registrations reference the previous registration. Preserve the
  // original cleanup's descendant-first order without MySQL DELETE ORDER BY.
  const [records] = await db.execute(
    "SELECT ma_phuong_tien FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
    [residentId],
  );
  for (const record of records)
    await db.execute("DELETE FROM phuong_tien WHERE ma_phuong_tien=?", [
      record.ma_phuong_tien,
    ]);
}
