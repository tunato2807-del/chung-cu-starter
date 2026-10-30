import assert from "node:assert/strict";
import { action } from "../../../backend/src/modules/billing/billing.service.js";
import { pool } from "../../../backend/src/lib/db.js";

const calls = [];
let revoke, locked;
const revoked = new Promise((resolve) => {
  revoke = resolve;
});
const waiting = new Promise((resolve) => {
  locked = resolve;
});
let actorActive = true,
  committed = false;

// This connection is entirely in memory. No call opens a database connection.
const db = {
  async beginTransaction() {
    calls.push("BEGIN");
  },
  async commit() {
    committed = true;
    calls.push("COMMIT");
  },
  async rollback() {
    calls.push("ROLLBACK");
  },
  release() {},
  async execute(sql, args) {
    calls.push(sql);
    if (sql === "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?")
      return [[{ ma_can_ho: 11 }]];
    if (sql === "SELECT * FROM can_ho WHERE ma_can_ho=? FOR UPDATE") {
      locked();
      await revoked;
      return [[{ ma_can_ho: 11 }]];
    }
    if (sql === "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE")
      return [
        [
          {
            ma_hoa_don: 19,
            ma_can_ho: 11,
            trang_thai: "DA_GUI",
            phien_ban: 0,
            tong_tien: "100000",
          },
        ],
      ];
    if (sql.includes("FROM nguoi_dung"))
      return [[...(actorActive ? [{ ma_nguoi_dung: 91 }] : [])]];
    if (
      sql.startsWith("UPDATE hoa_don") ||
      sql.startsWith("INSERT INTO lich_su_hoa_don")
    )
      return [{ affectedRows: 1 }];
    throw new Error("Unexpected SQL");
  },
};

const previous = pool.getConnection;
pool.getConnection = async () => db;
try {
  const pending = action(
    19,
    "xac_nhan_thanh_toan",
    { phien_ban: 0, so_tien: "100000", ma_tham_chieu: "review-only-reference" },
    { ma_nguoi_dung: 91, phien_ban_token: 0, vai_tro: "QUAN_TRI_VIEN" },
  );
  await waiting;
  actorActive = false;
  revoke();
  const result = await pending;
  assert.equal(committed, true);
  assert.equal(
    calls.some((sql) => sql.includes("FROM nguoi_dung")),
    false,
  );
  console.log(
    JSON.stringify(
      {
        harness: "stub connection, no live DB writes",
        actorRevokedWhileApartmentLockWaited: !actorActive,
        result,
        committed,
        actorChecks: calls.filter((sql) => sql.includes("FROM nguoi_dung"))
          .length,
        sql: calls,
      },
      null,
      2,
    ),
  );
} finally {
  pool.getConnection = previous;
  await pool.end();
}
