import test from "node:test";
import assert from "node:assert/strict";
import { lockSender } from "../src/modules/incidents/incident-sender.js";
import { canRead } from "../src/modules/incidents/incidents.repository.js";
import { action, generate } from "../src/modules/billing/billing.service.js";
import { electricityLines } from "../src/modules/billing/billing.electricity.js";
import { pool } from "../src/lib/db.js";

const citizen = (person, account = 7) => ({
  ma_nguoi_dung: account,
  vai_tro: "CU_DAN",
  ma_can_ho_thanh_toan: 3,
  ma_cu_dan: person,
});
const report = {
  ma_nguoi_gui: 7,
  ma_cu_dan_nguoi_gui: 12,
  gui_tu_tai_khoan_can_ho: 1,
  ma_ky_thuat_vien: 8,
};
test("handover isolates personal reports, while the same person keeps access after reset or moving", () => {
  assert.equal(canRead(citizen(13), report), false);
  assert.equal(canRead(citizen(12), report), true);
  assert.equal(canRead(citizen(12, 9), report), true);
  assert.equal(canRead({ ...citizen(12), phien_ban_token: 20 }, report), true);
  assert.equal(
    canRead({ ...citizen(12, 10), ma_can_ho_thanh_toan: null }, report),
    true,
  );
  assert.equal(
    canRead({ ...citizen(14, 10), ma_can_ho_thanh_toan: null }, report),
    false,
  );
  const legacy = { ...report, ma_cu_dan_nguoi_gui: null };
  assert.equal(canRead(citizen(13), legacy), false);
  assert.equal(canRead(citizen(12), legacy), false);
  assert.equal(canRead({ vai_tro: "QUAN_TRI_VIEN" }, legacy), true);
  assert.equal(
    canRead({ vai_tro: "KY_THUAT_VIEN", ma_nguoi_dung: 8 }, legacy),
    true,
  );
  assert.equal(
    canRead({ vai_tro: "KY_THUAT_VIEN", ma_nguoi_dung: 9 }, legacy),
    false,
  );
  const personal = { ...legacy, gui_tu_tai_khoan_can_ho: 0 };
  assert.equal(
    canRead({ ...citizen(null), ma_can_ho_thanh_toan: null }, personal),
    true,
  );
  assert.equal(canRead(citizen(null), personal), false);
});

test("VAT fits DECIMAL(12,2), including rounding at the boundary", () => {
  const rate = {
    cach_tinh: "DON_GIA",
    bac_dien: null,
    don_gia: "2000000000",
    thue_gtgt: "8",
    ma_cau_hinh_phi: 1,
  };
  assert.throws(() => electricityLines(rate, 100000n, {}, 1), {
    status: 422,
    code: "AMOUNT_TOO_LARGE",
  });
  const edge = electricityLines(
    { ...rate, don_gia: "9999999999", thue_gtgt: "100" },
    1000n,
    {},
    1,
  );
  assert.equal(edge.at(-1).don_gia, "9999999999.00");
  assert.throws(
    () =>
      electricityLines(
        { ...rate, don_gia: "9999999999.5", thue_gtgt: "10" },
        10000n,
        {},
        1,
      ),
    { status: 422 },
  );
});

test("every single-invoice action and generation revalidate the actor after waiting for apartment locks", async () => {
  const previous = pool.getConnection;
  try {
    for (const operation of [
      "xac_nhan_thanh_toan",
      "huy",
      "tinh_lai",
      "duyet",
      "gui",
      "lap_thay_the",
      "generate",
      "payment-replay",
    ]) {
      let release, waiting;
      const gate = new Promise((r) => {
        release = r;
      });
      const reached = new Promise((r) => {
        waiting = r;
      });
      let active = true,
        committed = false,
        rolledBack = false;
      const calls = [];
      const db = {
        async beginTransaction() {},
        async commit() {
          committed = true;
        },
        async rollback() {
          rolledBack = true;
        },
        release() {},
        async execute(sql) {
          calls.push(sql);
          if (sql === "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?")
            return [[{ ma_can_ho: 11 }]];
          if (sql === "SELECT * FROM can_ho WHERE ma_can_ho=? FOR UPDATE") {
            waiting();
            await gate;
            return [[{ ma_can_ho: 11 }]];
          }
          if (sql === "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE")
            return [
              [
                {
                  ma_hoa_don: 19,
                  ma_can_ho: 11,
                  trang_thai:
                    operation === "payment-replay" ? "DA_THANH_TOAN" : "DA_GUI",
                  phien_ban: 0,
                  tong_tien: "100000",
                  so_tien_da_thu: "100000",
                  ma_tham_chieu: "TEST-REF",
                },
              ],
            ];
          if (sql.includes("FROM nguoi_dung"))
            return [active ? [{ ma_nguoi_dung: 91 }] : []];
          return [{ affectedRows: 1 }];
        },
      };
      pool.getConnection = async () => db;
      const user = {
        ma_nguoi_dung: 91,
        phien_ban_token: 0,
        vai_tro: "QUAN_TRI_VIEN",
      };
      const pending =
        operation === "generate"
          ? generate({ ma_can_ho: 11 }, user)
          : action(
              19,
              operation === "payment-replay"
                ? "xac_nhan_thanh_toan"
                : operation,
              {
                phien_ban: 0,
                so_tien: "100000",
                ma_tham_chieu: "TEST-REF",
                ly_do: "test reason",
              },
              user,
            );
      const denied = assert.rejects(
        pending,
        { status: 401, code: "SESSION_EXPIRED" },
        operation,
      );
      await reached;
      active = false;
      release();
      await denied;
      assert.equal(committed, false, operation);
      assert.equal(rolledBack, true, operation);
      assert.equal(
        calls.some((sql) => /^(UPDATE|INSERT|DELETE)/.test(sql)),
        false,
        operation,
      );
      assert.ok(
        calls
          .find((sql) => sql.includes("FROM nguoi_dung"))
          ?.includes("FOR SHARE"),
        operation,
      );
    }
  } finally {
    pool.getConnection = previous;
  }
});

test("sender snapshot revalidates the person and session after image processing", async () => {
  const user = { ...citizen(12), phien_ban_token: 3 };
  let current = {
    ma_nguoi_dung: 7,
    ma_can_ho_thanh_toan: 3,
    ma_cu_dan_phu_trach: 12,
    vai_tro: "CU_DAN",
    phien_ban_token: 3,
    dang_hoat_dong: 1,
  };
  const calls = [];
  const db = {
    async execute(sql) {
      calls.push(sql);
      return [
        sql.includes("FROM cu_dan")
          ? [{ ma_cu_dan: 12, ma_nguoi_dung: null }]
          : [current],
      ];
    },
  };
  assert.deepEqual(await lockSender(db, user), {
    resident: 12,
    apartmentAccount: true,
  });
  assert.ok(calls[0].includes("FROM cu_dan") && calls[0].endsWith("FOR SHARE"));
  assert.ok(
    calls[1].includes("FROM nguoi_dung") && calls[1].endsWith("FOR SHARE"),
  );
  current = { ...current, phien_ban_token: 4, ma_cu_dan_phu_trach: 13 };
  await assert.rejects(lockSender(db, user), {
    status: 401,
    code: "SESSION_EXPIRED",
  });
  current = { ...current, phien_ban_token: 3 };
  await assert.rejects(lockSender(db, user), { status: 401 });
  current = { ...current, ma_cu_dan_phu_trach: null };
  await assert.rejects(lockSender(db, { ...user, ma_cu_dan: null }), {
    status: 422,
    code: "HOUSEHOLDER_REQUIRED",
  });
  assert.deepEqual(await lockSender(db, null), {
    resident: null,
    apartmentAccount: false,
  });
});
