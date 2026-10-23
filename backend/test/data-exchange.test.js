import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import parsePdf from "pdf-parse/lib/pdf-parse.js";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { today } from "../src/modules/billing/billing.validation.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";

test("data exchange: bounded real files, preview rollback, atomic imports, domain guards and filtered exports", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    block = `I${suffix}`,
    day = today(),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apts = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api/trao_doi_du_lieu`;
  let admin, resident, tech, ownerId;
  const phone = () =>
    "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
  async function account(role) {
    const p = phone(),
      result = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`Nhập ${suffix}`, p, hash, role],
      );
    users.push(result.insertId);
    return {
      id: result.insertId,
      cookie:
        "session=" +
        (await login({ so_dien_thoai: p, mat_khau: password })).token,
    };
  }
  async function req(
    path,
    { cookie = admin?.cookie, method = "GET", body } = {},
  ) {
    const r = await fetch(base + path, {
      method,
      body,
      headers: { ...(cookie ? { Cookie: cookie } : {}), "X-App-Request": "1" },
    });
    const buffer = Buffer.from(await r.arrayBuffer());
    return {
      status: r.status,
      headers: r.headers,
      buffer,
      json: r.headers.get("content-type")?.includes("json")
        ? JSON.parse(buffer)
        : null,
    };
  }
  async function xlsx(kind, items, mutate) {
    const wb = new ExcelJS.Workbook(),
      sheet = wb.addWorksheet("Nhap");
    sheet.addRow(catalog[kind].fields.map((f) => f.key));
    for (const item of items)
      sheet.addRow(catalog[kind].fields.map((f) => item[f.key] ?? ""));
    mutate?.(sheet);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
  function form(bytes, name = "data.xlsx", extras = {}) {
    const body = new FormData();
    body.append("tep", new Blob([bytes]), name);
    for (const [k, v] of Object.entries(extras)) body.append(k, v);
    return body;
  }
  const preview = (kind, bytes, name = "data.xlsx") =>
    req(`/${kind}/xem_truoc`, { method: "POST", body: form(bytes, name) });
  const commit = (kind, bytes, token, name = "data.xlsx", key = randomUUID()) =>
    req(`/${kind}/nhap`, {
      method: "POST",
      body: form(bytes, name, { xac_nhan: token, khoa_yeu_cau: key }),
    });
  async function importGood(kind, bytes, name = "data.xlsx") {
    const p = await preview(kind, bytes, name);
    assert.equal(p.status, 200, p.buffer.toString());
    assert.equal(p.json.data.errors, 0, JSON.stringify(p.json));
    const r = await commit(kind, bytes, p.json.data.xac_nhan, name);
    assert.equal(r.status, 200, r.buffer.toString());
    return r.json.data;
  }
  const apt = (code) => ({
    so_can_ho: code,
    khoi: block,
    tang: "1",
    dien_tich_m2: "75.50",
    tinh_phi_dich_vu: "1",
  });
  const asset = (code) => ({
    ma_tai_san: code,
    ten_thiet_bi: `Máy bơm Nguyễn ${suffix}`,
    loai: "MAY_BOM",
    vi_tri: "Tầng hầm",
    trang_thai: "DANG_SU_DUNG",
    nhac_truoc_ngay: "7",
  });
  try {
    admin = await account("QUAN_TRI_VIEN");
    resident = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    await t.test("all endpoints restrict personal data to BQL", async () => {
      for (const path of ["/", "/lich_su", "/can_ho/mau", "/can_ho/xuat"]) {
        assert.equal((await req(path, { cookie: null })).status, 401);
        assert.equal(
          (await req(path, { cookie: resident.cookie })).status,
          403,
        );
        assert.equal((await req(path, { cookie: tech.cookie })).status, 403);
      }
      for (const action of ["xem_truoc", "nhap"])
        assert.equal(
          (
            await req(`/can_ho/${action}`, {
              method: "POST",
              cookie: resident.cookie,
            })
          ).status,
          403,
        );
      assert.equal((await req("/hoa_don/mau")).status, 422);
      assert.equal(
        (await req("/can_ho/mau?so_dong=11&dinh_dang=pdf")).status,
        422,
      );
    });
    await t.test(
      "templates have blank Nhap and a separate example sheet; PDF requests are rejected",
      async () => {
        for (const kind of Object.keys(catalog).filter(
          (k) => catalog[k].importable,
        )) {
          const r = await req(`/${kind}/mau`);
          assert.equal(r.status, 200);
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(r.buffer);
          assert.equal(wb.getWorksheet("Nhap").rowCount, 1);
          assert.equal(wb.getWorksheet("Nhap").getColumn(1).numFmt, "@");
          assert.equal(wb.getWorksheet("Vi du").rowCount, 2);
          assert.equal((await req(`/${kind}/mau?dinh_dang=pdf`)).status, 422);
        }
      },
    );
    await t.test(
      "preview performs no durable writes and returns each invalid row",
      async () => {
        const file = await xlsx("can_ho", [
          apt(`${suffix}-01`),
          { ...apt(`${suffix}-02`), dien_tich_m2: "-1" },
        ]);
        const r = await preview("can_ho", file);
        assert.equal(r.status, 200);
        assert.equal(r.json.data.errors, 1);
        assert.equal(r.json.data.rows[1].line, 3);
        assert.equal(r.json.data.xac_nhan, null);
        assert.equal(
          (
            await rows(pool, "SELECT ma_can_ho FROM can_ho WHERE khoi=?", [
              block,
            ])
          ).length,
          0,
        );
        assert.doesNotMatch(
          r.buffer.toString(),
          /mat_khau_tam_thoi|mat_khau_ma_hoa/,
        );
        assert.equal((await commit("can_ho", file, "not-signed")).status, 409);
        assert.equal(
          (await commit("can_ho", file, "x." + "é".repeat(43))).status,
          409,
        );
      },
    );
    await t.test(
      "valid batch creates apartments and accounts once; file-bound preview and replay",
      async () => {
        const file = await xlsx("can_ho", [
          apt(`${suffix}-01`),
          apt(`${suffix}-02`),
        ]);
        const p = await preview("can_ho", file);
        assert.equal(p.json.data.errors, 0);
        const changed = await xlsx("can_ho", [apt(`${suffix}-03`)]);
        assert.equal(
          (await commit("can_ho", changed, p.json.data.xac_nhan)).status,
          409,
        );
        const key = randomUUID(),
          result = await commit(
            "can_ho",
            file,
            p.json.data.xac_nhan,
            "data.xlsx",
            key,
          );
        assert.equal(result.status, 200, result.buffer.toString());
        assert.equal(result.json.data.so_dong, 2);
        assert.equal(result.json.data.tai_khoan_moi.length, 2);
        apts.push(...result.json.data.ket_qua.map((r) => r.ma_can_ho));
        for (const r of await Promise.all([
          commit("can_ho", file, p.json.data.xac_nhan, "data.xlsx", key),
          commit("can_ho", file, p.json.data.xac_nhan),
        ])) {
          if (r.status === 429) {
            assert.equal(r.json.error.code, "FILE_BUSY");
            continue;
          }
          assert.equal(r.status, 200, r.buffer.toString());
          assert.equal(r.json.data.da_nhap_truoc, true);
          assert.equal(r.json.data.tai_khoan_moi.length, 0);
        }
        const retry = await commit("can_ho", file, p.json.data.xac_nhan);
        assert.equal(retry.status, 200);
        assert.equal(retry.json.data.da_nhap_truoc, true);
        const history = await req("/lich_su");
        assert.equal(history.json.data.length, 1);
        const [stored] = await rows(
          pool,
          "SELECT ket_qua FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=?",
          [admin.id],
        );
        assert.doesNotMatch(JSON.stringify(stored), /mat_khau/);
      },
    );
    await t.test(
      "resident, current householder, vehicles and meter continuity reuse domain validation",
      async () => {
        const p = phone(),
          file = await xlsx("cu_dan", [
            {
              ho_va_ten: `Nguyễn Thị Ánh ${suffix}`,
              so_dien_thoai: p,
              so_can_ho: `${suffix}-01`,
              quan_he: "CHU_HO",
              ngay: day,
            },
          ]);
        const result = await importGood("cu_dan", file);
        ownerId = result.ket_qua[0].ma_cu_dan;
        const [owner] = await rows(
          pool,
          "SELECT ma_cu_dan_phu_trach FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
          [apts[0]],
        );
        assert.equal(owner.ma_cu_dan_phu_trach, ownerId);
        const second = await preview(
          "cu_dan",
          await xlsx("cu_dan", [
            {
              ho_va_ten: "Chủ mới",
              so_dien_thoai: phone(),
              so_can_ho: `${suffix}-01`,
              quan_he: "CHU_HO",
              ngay: day,
            },
          ]),
        );
        assert.equal(second.json.data.errors, 1);
        assert.match(second.json.data.rows[0].error, /bàn giao/);
        const bike = {
          ma_cu_dan: String(ownerId),
          so_can_ho: `${suffix}-01`,
          loai_xe: "XE_MAY",
          bien_so: `59${suffix.toUpperCase()}1`,
          ngay_dang_ky: day,
        };
        const placeholder = await preview(
          "phuong_tien",
          await xlsx("phuong_tien", [
            { ...bike, ma_cu_dan: "THAY_MA_CU_DAN_1" },
          ]),
        );
        assert.equal(placeholder.json.data.errors, 1);
        assert.match(placeholder.json.data.rows[0].error, /Mở Cư dân/);
        assert.match(placeholder.json.data.rows[0].error, /THAY_MA_CU_DAN_1/);
        await importGood("phuong_tien", await xlsx("phuong_tien", [bike]));
        const duplicate = await preview(
          "phuong_tien",
          await xlsx("phuong_tien", [bike]),
        );
        assert.equal(duplicate.json.data.errors, 1);
        const wrong = await preview(
          "phuong_tien",
          await xlsx("phuong_tien", [{ ...bike, so_can_ho: `${suffix}-02` }]),
        );
        assert.equal(wrong.json.data.errors, 1);
        const meter = {
          so_can_ho: `${suffix}-01`,
          loai_dich_vu: "NUOC",
          ky_thanh_toan: day.slice(0, 7),
          chi_so_cu: "100",
          chi_so_moi: "105.125",
          ngay_chot: day,
          ky_dau: "1",
        };
        const noFirst = await preview(
          "chi_so",
          await xlsx("chi_so", [{ ...meter, ky_dau: "0" }]),
        );
        assert.equal(noFirst.json.data.errors, 1);
        await importGood("chi_so", await xlsx("chi_so", [meter]));
        const overwrite = await preview(
          "chi_so",
          await xlsx("chi_so", [{ ...meter, chi_so_moi: "999" }]),
        );
        assert.equal(overwrite.json.data.errors, 1);
        assert.match(overwrite.json.data.rows[0].error, /đã có/);
      },
    );
    await t.test(
      "stale preview fails the whole commit, including earlier valid rows and history",
      async () => {
        const codes = [`I-${suffix}-A`, `I-${suffix}-B`],
          file = await xlsx("thiet_bi", codes.map(asset)),
          p = await preview("thiet_bi", file);
        assert.equal(p.json.data.errors, 0);
        await rows(
          pool,
          "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,ma_nguoi_tao) VALUES (?,?,'MAY_BOM','Hầm',?)",
          [codes[1], `Đã có ${suffix}`, admin.id],
        );
        const result = await commit("thiet_bi", file, p.json.data.xac_nhan);
        assert.equal(result.status, 409);
        assert.equal(result.json.error.code, "IMPORT_CHANGED");
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_thiet_bi FROM thiet_bi WHERE ma_tai_san=?",
              [codes[0]],
            )
          ).length,
          0,
        );
        const p2 = await preview("thiet_bi", file);
        assert.equal(p2.json.data.errors, 1);
      },
    );
    await t.test(
      "resident Excel imports four Unicode profiles in the correct module",
      async () => {
        const data = [];
        for (let n = 1; n <= 3; n++)
          await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
            [`${suffix}-P${n}`, block],
          );
        for (let n = 1; n <= 4; n++)
          data.push({
            ho_va_ten: `Nguyễn Thị Ánh ${n}`,
            so_dien_thoai: phone(),
            so_can_ho: `${suffix}-P${n <= 2 ? 1 : n - 1}`,
            quan_he: "THANH_VIEN",
            ngay: day,
          });
        const file = await xlsx("cu_dan", data);
        const wrong = await preview("can_ho", file);
        assert.equal(wrong.status, 422);
        assert.equal(wrong.json.error.code, "IMPORT_KIND_MISMATCH");
        const result = await importGood("cu_dan", file);
        assert.equal(result.so_dong, 4);
        for (const r of result.ket_qua) {
          const [person] = await rows(
            pool,
            "SELECT ho_va_ten FROM cu_dan WHERE ma_cu_dan=?",
            [r.ma_cu_dan],
          );
          assert.match(person.ho_va_ten, /Nguyễn Thị Ánh/);
        }
      },
    );
    await t.test(
      "malformed, oversized, formula cells and excessive rows cannot be applied",
      async () => {
        assert.equal((await preview("can_ho", Buffer.from("bad"))).status, 422);
        assert.equal(
          (await preview("can_ho", await xlsx("can_ho", []))).status,
          422,
        );
        assert.equal(
          (await preview("can_ho", Buffer.alloc(5 * 1024 * 1024 + 1))).status,
          413,
        );
        const file = await xlsx("can_ho", [apt("formula")], (s) => {
          s.getCell("A2").value = {
            formula: 'HYPERLINK("https://example.com")',
            result: "A999",
          };
        });
        const p = await preview("can_ho", file);
        assert.equal(p.json.data.errors, 1);
        assert.match(p.json.data.rows[0].error, /công thức/);
        const many = await xlsx(
          "can_ho",
          Array.from({ length: 101 }, (_, i) => apt(`many-${i}`)),
        );
        assert.equal((await preview("can_ho", many)).status, 422);
        assert.equal(
          (await preview("can_ho", Buffer.from("%PDF-1.7"), "file.pdf")).status,
          422,
        );
      },
    );
    await t.test(
      "eight module exports produce real Excel, preserve leading zeroes and ignore page",
      async () => {
        for (let i = 0; i < 23; i++) {
          const r = await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,50)",
            [`${suffix}-E${i}`, block],
          );
          apts.push(r.insertId);
        }
        const filters = {
          can_ho: `q=${block}`,
          cu_dan: `ma_cu_dan=${ownerId}`,
          phuong_tien: `ma_cu_dan=${ownerId}`,
          chi_so: `ma_can_ho=${apts[0]}`,
          thiet_bi: `q=${suffix}`,
          hoa_don: `ma_can_ho=${apts[0]}`,
          bao_tri: `q=${suffix}`,
          dat_lich: `q=${suffix}`,
        };
        for (const kind of Object.keys(catalog)) {
          const r = await req(`/${kind}/xuat?${filters[kind]}&page=2`);
          assert.equal(r.status, 200, r.buffer.toString());
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(r.buffer);
          const sheet = wb.getWorksheet("Chi tiết");
          assert.ok(sheet);
          assert.equal(wb.worksheets[0].name, "Chi tiết");
          assert.equal(wb.views[0].activeTab, 0);
          assert.equal(sheet.views[0].activeCell, "A2");
          assert.equal(
            wb.getWorksheet("Tổng hợp").getCell("A5").value.hyperlink,
            "#'Chi tiết'!A1",
          );
          assert.doesNotMatch(
            sheet.getRow(1).values.join(" "),
            /mật khẩu|token/i,
          );
          if (kind === "can_ho") {
            assert.equal(sheet.rowCount, 29);
            assert.equal(sheet.getCell("E2").type, ExcelJS.ValueType.Number);
          }
          if (kind === "cu_dan") {
            assert.match(sheet.getCell("C2").value, /^0\d{9}$/);
            assert.equal(sheet.getCell("C2").type, ExcelJS.ValueType.String);
          }
          const pdf = await req(`/${kind}/xuat?${filters[kind]}&dinh_dang=pdf`);
          assert.equal(pdf.status, 200, pdf.buffer.toString());
          assert.match(pdf.headers.get("content-type"), /application\/pdf/);
          assert.equal(pdf.buffer.subarray(0, 5).toString(), "%PDF-");
          assert.ok((await parsePdf(pdf.buffer)).text.includes("Danh sách"));
        }
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    if (admin) {
      await rows(pool, "DELETE FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=?", [
        admin.id,
      ]);
      await rows(pool, "DELETE FROM thiet_bi WHERE ma_nguoi_tao=?", [admin.id]);
      const importedApts = await rows(
        pool,
        "SELECT ma_can_ho FROM can_ho WHERE khoi=?",
        [block],
      );
      for (const { ma_can_ho: id } of importedApts) {
        await rows(pool, "DELETE FROM phuong_tien WHERE ma_can_ho=?", [id]);
        await rows(pool, "DELETE FROM chi_so_dich_vu WHERE ma_can_ho=?", [id]);
        await rows(
          pool,
          "DELETE FROM lich_su_ban_giao_can_ho WHERE ma_can_ho=?",
          [id],
        );
        await rows(
          pool,
          "DELETE FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
          [id],
        );
        const people = await rows(
          pool,
          "SELECT ma_cu_dan FROM lich_su_cu_tru WHERE ma_can_ho=?",
          [id],
        );
        await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_can_ho=?", [id]);
        for (const person of people)
          await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [
            person.ma_cu_dan,
          ]);
        await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
      }
    }
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
