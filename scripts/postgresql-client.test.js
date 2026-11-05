import test from "node:test";
import assert from "node:assert/strict";
import {
  compileParameters,
  identityColumns,
} from "../backend/src/lib/postgresql.js";

test("PG parameters ignore quotes, identifiers, comments and dollar-quoted bodies", () => {
  const sql = `SELECT '?', "?", $$?;$$, $body$ ? $body$, ? -- ?\n, ? /* ? */`;
  assert.equal(
    compileParameters(sql),
    `SELECT '?', "?", $$?;$$, $body$ ? $body$, $1 -- ?\n, $2 /* ? */`,
  );
  assert.equal(
    compileParameters("SELECT 'it''s ?', ?"),
    "SELECT 'it''s ?', $1",
  );
});

test("identity result map uses explicit physical PK names, including audit tables", () => {
  assert.equal(identityColumns.nguoi_dung, "ma_nguoi_dung");
  assert.equal(identityColumns.lich_su_bao_tri, "ma_lich_su");
  assert.equal(identityColumns.dot_nhap_du_lieu, "ma_dot_nhap");
  assert.equal(identityColumns.yeu_cau_gui, undefined);
});
