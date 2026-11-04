import assert from "node:assert/strict";
import { pool } from "../../../backend/src/lib/db.js";
import { transition } from "../../../backend/src/modules/incidents/incidents.service.js";

// Review evidence for d226254, not an acceptance test for a repaired version.
// All SQL runs on this in-memory connection. No database connection is opened.
let entered, release;
const waiting = new Promise((resolve) => {
  entered = resolve;
});
const gate = new Promise((resolve) => {
  release = resolve;
});
let actorActive = true,
  committed = false,
  stateChanged = false;
const calls = [];
const db = {
  async beginTransaction() {},
  async rollback() {},
  release() {},
  async commit() {
    committed = true;
  },
  async execute(sql) {
    calls.push(sql);
    if (sql === "SELECT * FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE") {
      entered();
      await gate;
      return [
        [
          {
            ma_phan_anh: 17,
            phien_ban: 0,
            ma_ky_thuat_vien: 91,
            trang_thai: "DA_PHAN_CONG",
            luot_xu_ly: 1,
          },
        ],
      ];
    }
    if (sql.includes("FROM nguoi_dung"))
      return [actorActive ? [{ ma_nguoi_dung: 91 }] : []];
    if (sql.startsWith("UPDATE phan_anh")) {
      stateChanged = true;
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith("INSERT INTO lich_su_phan_anh"))
      return [{ insertId: 1 }];
    throw new Error("Unexpected SQL in isolated proof");
  },
};
const previous = pool.getConnection;
pool.getConnection = async () => db;
try {
  const pending = transition(
    17,
    { phien_ban: 0, trang_thai: "DANG_XU_LY" },
    [],
    { ma_nguoi_dung: 91, phien_ban_token: 0, vai_tro: "KY_THUAT_VIEN" },
  );
  await waiting;
  actorActive = false;
  release();
  await pending;
  const actorChecks = calls.filter((sql) =>
    sql.includes("FROM nguoi_dung"),
  ).length;
  assert.equal(actorChecks, 0);
  assert.equal(committed, true);
  assert.equal(stateChanged, true);
  console.log(
    JSON.stringify({
      evidenceFor: "d226254",
      inMemoryOnly: true,
      actorRevokedWhileWaiting: !actorActive,
      actorChecks,
      committed,
      stateChanged,
    }),
  );
} finally {
  pool.getConnection = previous;
  await pool.end();
}
