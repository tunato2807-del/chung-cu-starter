import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { pool, rows } from "../src/lib/db.js";
import {
  appendHistory,
  historyCatalog,
  historyRecord,
} from "../src/lib/history.js";

test("Thesis MySQL: 31 physical tables, complete history views, typed payloads and original IDs", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  let user, location, report;
  t.after(async () => {
    if (report) {
      await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
        report,
      ]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [report]);
    }
    if (location)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
        location,
      ]);
    if (user)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [user]);
    await pool.end();
  });
  await t.test(
    "physical count is real; history projections are views",
    async () => {
      const tables = await rows(
        pool,
        "SELECT table_name AS name,table_type AS kind FROM information_schema.tables WHERE table_schema=DATABASE()",
      );
      assert.equal(tables.filter((r) => r.kind === "BASE TABLE").length, 31);
      assert.equal(tables.filter((r) => r.kind === "VIEW").length, 8);
      for (const topic of Object.keys(historyCatalog))
        assert.equal(tables.find((r) => r.name === topic)?.kind, "VIEW");
    },
  );
  const suffix = randomBytes(5).toString("hex");
  user = (
    await rows(
      pool,
      "INSERT INTO nguoi_dung(ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro)VALUES(?,?,?,'QUAN_TRI_VIEN')",
      [suffix, `T${suffix}`, "!test-disabled"],
    )
  ).insertId;
  location = (
    await rows(
      pool,
      "INSERT INTO vi_tri_qr(ten_vi_tri,token_qr,ma_nguoi_tao)VALUES(?,?,?)",
      [suffix, randomUUID(), user],
    )
  ).insertId;
  report = (
    await rows(
      pool,
      "INSERT INTO phan_anh(ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ten_nguoi_gui,so_dien_thoai_nguoi_gui,tieu_de,noi_dung,loai_su_co)VALUES(?,?,?,?,?,?,?,'DIEN')",
      [
        randomBytes(32).toString("hex"),
        randomUUID(),
        location,
        suffix,
        "0909999988",
        "Đèn hỏng",
        "Báo lỗi tại sảnh",
      ],
    )
  ).insertId;
  const body = {
    ma_phan_anh: report,
    loai_su_kien: "TIEP_NHAN",
    trang_thai_cu: null,
    trang_thai_moi: "MOI",
    ma_nguoi_thay_doi: null,
    ghi_chu: "null",
    noi_dung_cong_khai: "Giữ nguyên tiếng Việt",
  };
  await t.test(
    "anonymous QR history preserves SQL null, literal null text and public notes",
    async () => {
      await appendHistory(
        pool,
        "lich_su_phan_anh",
        Object.keys(body),
        Object.values(body),
      );
      const [event] = await rows(
        pool,
        "SELECT * FROM lich_su_phan_anh WHERE ma_phan_anh=?",
        [report],
      );
      assert.equal(event.trang_thai_cu, null);
      assert.equal(event.ghi_chu, "null");
      assert.equal(event.noi_dung_cong_khai, body.noi_dung_cong_khai);
      assert.equal(event.ma_nguoi_thay_doi, null);
    },
  );
  await t.test(
    "different original history tables may share an ID without collision or losing their identity",
    async () => {
      for (const [topic, r] of [
        ["lich_su_phan_anh", { ...body, ma_lich_su_phan_anh: 4000000000 }],
        [
          "lich_su_lien_ket_qr",
          {
            ma_lich_su: 4000000000,
            ma_vi_tri_qr: location,
            ma_nguoi_thuc_hien: user,
            ma_thiet_bi_cu: null,
            ma_thiet_bi_moi: null,
          },
        ],
      ]) {
        const record = historyRecord(topic, r, true),
          cols = Object.keys(record);
        await rows(
          pool,
          `INSERT INTO nhat_ky_nghiep_vu(${cols.join(",")})VALUES(${cols.map(() => "?").join(",")})`,
          Object.values(record),
        );
        const id = historyCatalog[topic].id;
        assert.equal(
          (
            await rows(pool, `SELECT ${id} FROM ${topic} WHERE ${id}=?`, [
              4000000000,
            ])
          )[0][id],
          4000000000,
        );
      }
    },
  );
  await t.test(
    "foreign keys, target category and JSON shape are enforced by MySQL",
    async () => {
      const r = historyRecord("lich_su_phan_anh", body);
      const insert = async (record) => {
        const names = Object.keys(record);
        return rows(
          pool,
          `INSERT INTO nhat_ky_nghiep_vu(${names.join(",")})VALUES(${names.map(() => "?").join(",")})`,
          Object.values(record),
        );
      };
      await assert.rejects(
        insert({
          ...r,
          chi_tiet:
            '{"trang_thai_cu":null,"trang_thai_moi":"MOI","noi_dung_cong_khai":"","unexpected":true}',
        }),
        (e) => e.code === "ER_CHECK_CONSTRAINT_VIOLATED",
      );
      await assert.rejects(
        insert({ ...r, ma_phan_anh: 4294967295 }),
        (e) => e.code === "ER_NO_REFERENCED_ROW_2",
      );
      await assert.rejects(insert({ ...r, ma_can_ho: 1 }), (e) =>
        ["ER_CHECK_CONSTRAINT_VIOLATED", "ER_NO_REFERENCED_ROW_2"].includes(
          e.code,
        ),
      );
    },
  );
});
