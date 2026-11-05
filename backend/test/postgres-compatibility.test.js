import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../src/lib/db.js";
import {
  createFailureTrigger,
  dropFailureTrigger,
} from "../../scripts/test-db-fixtures.js";

test("PostgreSQL preserves money/date/flag types and binds only SQL parameter markers", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  t.after(() => pool.end());

  await t.test(
    "numeric money stays exact, IDs/counts and flags remain numbers, UTC dates remain strings",
    async () => {
      const [record] = await rows(
        pool,
        `
      SELECT 42::bigint AS id, COUNT(*) AS count,
             9007199254740991.25::numeric(18,2) AS money,
             DATE '2024-02-29' AS day,
             TIMESTAMP '2024-02-29 23:59:59.123456' AS instant,
             1::smallint AS enabled,
             '{"label":"Tiền điện","question":"?"}'::jsonb ->> 'question' AS question
      FROM (VALUES (1), (2)) AS fixture(value)
    `,
      );
      assert.equal(record.id, 42);
      assert.equal(record.count, 2);
      assert.equal(record.money, "9007199254740991.25");
      assert.equal(record.day, "2024-02-29");
      assert.equal(record.instant, "2024-02-29 23:59:59.123456");
      assert.equal(record.enabled, 1);
      assert.equal(record.question, "?");
    },
  );

  await t.test(
    "question marks in literals, quoted identifiers, comments and dollar quotes are not parameters",
    async () => {
      const [record] = await rows(
        pool,
        `
      SELECT ?::text AS bound, '?' AS literal, $$?$$ AS dollar,
             17 AS "quoted?name" /* ? is not a bind */
      -- Neither is this question mark: ?
    `,
        ["Mã ? và tiếng Việt"],
      );
      assert.deepEqual(record, {
        bound: "Mã ? và tiếng Việt",
        literal: "?",
        dollar: "?",
        "quoted?name": 17,
      });
    },
  );

  await t.test(
    "a PostgreSQL fixture trigger failure rolls back its parent insert in the same transaction",
    async () => {
      const suffix = randomBytes(4).toString("hex");
      const block = `PG${suffix}`;
      const trigger = `test_pg_rollback_${suffix}`;
      await createFailureTrigger(
        trigger,
        "tang_toa_nha",
        "fixture transaction rollback",
        {
          condition: `NEW.khoi = '${block}'`,
        },
      );
      try {
        await assert.rejects(
          transaction(async (db) => {
            await rows(db, "INSERT INTO khoi_toa_nha (khoi) VALUES (?)", [
              block,
            ]);
            await rows(
              db,
              "INSERT INTO tang_toa_nha (khoi,tang) VALUES (?,7)",
              [block],
            );
          }),
          { code: "P0001" },
        );
        assert.deepEqual(
          await rows(pool, "SELECT khoi FROM khoi_toa_nha WHERE khoi=?", [
            block,
          ]),
          [],
        );
        assert.deepEqual(
          await rows(pool, "SELECT tang FROM tang_toa_nha WHERE khoi=?", [
            block,
          ]),
          [],
        );
      } finally {
        await dropFailureTrigger(trigger, "tang_toa_nha");
      }
    },
  );
});
