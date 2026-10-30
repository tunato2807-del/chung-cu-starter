import assert from "node:assert/strict";
import { canRead } from "../../../backend/src/modules/incidents/incidents.repository.js";
import { pool } from "../../../backend/src/lib/db.js";

try {
  const report = { ma_nguoi_gui: 900, ma_ky_thuat_vien: null };
  const previousOwner = {
    ma_nguoi_dung: 900,
    ma_can_ho_thanh_toan: 5,
    ma_cu_dan_phu_trach: 11,
    vai_tro: "CU_DAN",
  };
  const newOwner = {
    ...previousOwner,
    ma_cu_dan_phu_trach: 22,
    phien_ban_token: 7,
  };
  assert.equal(canRead(previousOwner, report), true);
  assert.equal(canRead(newOwner, report), true);
  console.log(
    JSON.stringify(
      {
        harness:
          "real canRead function with in-memory identities; no DB connection",
        sameApartmentUserIdAfterHandover: true,
        changedResponsibleResident: true,
        newOwnerCanReadPreviousReport: canRead(newOwner, report),
        requiredByUser: "only invoices are inherited; old reports stay private",
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
