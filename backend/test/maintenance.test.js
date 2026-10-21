import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import {
  today,
  addDays,
} from "../src/modules/maintenance/maintenance.validation.js";

test("equipment and maintenance: assignment privacy, periodic lifecycle, races and audit rollback", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    equipmentIds = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    d = today();
  let admin, tech1, tech2, resident, main, second, jobId;
  async function req(
    path,
    method = "GET",
    body,
    cookie = admin?.cookie,
    csrf = true,
  ) {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function login(phone) {
    const r = await req(
      "/xac_thuc/dang_nhap",
      "POST",
      { so_dien_thoai: phone, mat_khau: password },
      null,
    );
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.cookie;
  }
  async function account(role) {
    const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      r = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`BT ${suffix}`, phone, hash, role],
      );
    users.push(r.insertId);
    return { id: r.insertId, phone, cookie: await login(phone) };
  }
  const asset = (extra = {}) => ({
    ma_tai_san: `TM-${suffix}`,
    ten_thiet_bi: `Thang máy ${suffix}`,
    loai: "THANG_MAY",
    vi_tri: "Khối A · tầng 1",
    so_serial: "SN-001",
    ngay_lap_dat: "2020-01-01",
    ghi_chu: "Kiểm tra cửa và phanh.",
    trang_thai: "DANG_SU_DUNG",
    chu_ky_ngay: 30,
    ngay_bao_tri_tiep_theo: addDays(d, -1),
    nhac_truoc_ngay: 7,
    ...extra,
  });
  async function makeEquipment(extra = {}) {
    const r = await req("/thiet_bi", "POST", asset(extra));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    equipmentIds.push(r.body.data.ma_thiet_bi);
    return r.body.data.ma_thiet_bi;
  }
  const getEquipment = (id) => req(`/thiet_bi/${id}`);
  const getJob = (id, cookie = admin.cookie) =>
    req(`/bao_tri/${id}`, "GET", null, cookie);
  async function update(id, body) {
    const r = await getEquipment(id);
    return req(`/thiet_bi/${id}`, "PUT", {
      ...r.body.data,
      ...body,
      phien_ban: r.body.data.phien_ban,
    });
  }
  async function createJob(id, extra = {}) {
    const e = (await getEquipment(id)).body.data;
    return req(`/thiet_bi/${id}/phieu_bao_tri`, "POST", {
      loai: "DINH_KY",
      phien_ban_thiet_bi: e.phien_ban,
      khoa_yeu_cau: randomUUID(),
      ...extra,
    });
  }
  async function act(id, action, body = {}, cookie = admin.cookie) {
    const j = await getJob(id, cookie);
    assert.equal(j.status, 200, JSON.stringify(j.body));
    return req(
      `/bao_tri/${id}/${action}`,
      "POST",
      { phien_ban: j.body.data.phien_ban, ...body },
      cookie,
    );
  }
  const rootSQL = (sql) =>
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
      ],
      { input: sql, stdio: ["pipe", "pipe", "pipe"] },
    );
  try {
    admin = await account("QUAN_TRI_VIEN");
    tech1 = await account("KY_THUAT_VIEN");
    tech2 = await account("KY_THUAT_VIEN");
    resident = await account("CU_DAN");
    await t.test(
      "equipment APIs require BQL, jobs require staff and writes require CSRF header",
      async () => {
        assert.equal((await req("/thiet_bi", "GET", null, null)).status, 401);
        for (const u of [tech1, resident]) {
          assert.equal(
            (await req("/thiet_bi", "GET", null, u.cookie)).status,
            403,
          );
          assert.equal(
            (await req("/thiet_bi", "POST", asset(), u.cookie)).status,
            403,
          );
        }
        assert.equal(
          (await req("/bao_tri", "GET", null, resident.cookie)).status,
          403,
        );
        assert.equal(
          (await req("/bao_tri/ky_thuat_vien", "GET", null, tech1.cookie))
            .status,
          403,
        );
        assert.equal(
          (await req("/thiet_bi", "POST", asset(), admin.cookie, false)).status,
          403,
        );
      },
    );
    await t.test(
      "asset validation, database plan checks, optimistic editing and human-readable history",
      async () => {
        for (const extra of [
          { ma_tai_san: "mã có dấu" },
          { chu_ky_ngay: 0 },
          { chu_ky_ngay: null },
          { chu_ky_ngay: 3651 },
          { nhac_truoc_ngay: 91 },
          { ngay_lap_dat: addDays(d, 1) },
        ])
          assert.equal(
            (await req("/thiet_bi", "POST", asset(extra))).status,
            422,
          );
        main = await makeEquipment();
        second = await makeEquipment({
          ma_tai_san: `PCCC-${suffix}`,
          loai: "PCCC",
          ten_thiet_bi: `Bình chữa cháy ${suffix}`,
          chu_ky_ngay: null,
          ngay_bao_tri_tiep_theo: null,
        });
        assert.equal((await req("/thiet_bi", "POST", asset())).status, 409);
        const e = (await getEquipment(main)).body.data;
        assert.equal(e.tinh_trang_lich, "QUA_HAN");
        assert.equal(e.history.length, 1);
        assert.equal(
          (await update(main, { ma_tai_san: "OTHER-CODE" })).status,
          422,
        );
        assert.equal(
          (await update(main, { ghi_chu: "Lưu ý kỹ thuật đã cập nhật." }))
            .status,
          200,
        );
        assert.equal(
          (
            await req(`/thiet_bi/${main}`, "PUT", {
              ...asset(),
              phien_ban: e.phien_ban,
            })
          ).status,
          409,
        );
        assert.equal((await getEquipment(main)).body.data.history.length, 2);
        await assert.rejects(
          rows(
            pool,
            "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,ma_nguoi_tao,chu_ky_ngay,ngay_bao_tri_tiep_theo) VALUES (?,?,'PCCC','A',?,NULL,?)",
            [`BAD-${suffix}`, suffix, admin.id, d],
          ),
          (e) => e.code === "ER_CHECK_CONSTRAINT_VIOLATED",
        );
      },
    );
    await t.test(
      "periodic creation is idempotent under concurrent retries; one open periodic job per asset",
      async () => {
        assert.equal((await createJob(second)).status, 409);
        assert.equal(
          (await createJob(main, { phien_ban_thiet_bi: 999 })).status,
          409,
        );
        const key = randomUUID(),
          e = (await getEquipment(main)).body.data,
          body = {
            loai: "DINH_KY",
            phien_ban_thiet_bi: e.phien_ban,
            khoa_yeu_cau: key,
          };
        const results = await Promise.all(
          [1, 2, 3].map(() =>
            req(`/thiet_bi/${main}/phieu_bao_tri`, "POST", body),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 200, 201]);
        jobId = results[0].body.data.ma_phieu_bao_tri;
        assert.ok(results.every((r) => r.body.data.ma_phieu_bao_tri === jobId));
        assert.equal(
          (
            await rows(
              pool,
              "SELECT * FROM lich_su_bao_tri WHERE ma_phieu_bao_tri=?",
              [jobId],
            )
          ).length,
          1,
        );
        assert.equal((await createJob(main)).status, 409);
        assert.equal(
          (
            await req(`/thiet_bi/${main}/phieu_bao_tri`, "POST", {
              ...body,
              do_uu_tien: "CAO",
            })
          ).status,
          409,
        );
        assert.equal(
          (await getEquipment(main)).body.data.phieu_dinh_ky_dang_mo,
          jobId,
        );
      },
    );
    await t.test(
      "open periodic work blocks plan changes/retirement but preserves original name and location",
      async () => {
        assert.equal((await update(main, { chu_ky_ngay: 60 })).status, 409);
        assert.equal(
          (await update(main, { trang_thai: "NGUNG_SU_DUNG" })).status,
          409,
        );
        assert.equal(
          (
            await update(main, {
              ten_thiet_bi: `Tên mới ${suffix}`,
              vi_tri: "Khối B · tầng 2",
              trang_thai: "TAM_DUNG",
            })
          ).status,
          200,
        );
        const j = (await getJob(jobId)).body.data;
        assert.equal(j.ten_thiet_bi_luc_lap, `Thang máy ${suffix}`);
        assert.equal(j.ten_hien_tai, `Tên mới ${suffix}`);
        assert.equal(j.vi_tri_luc_lap, "Khối A · tầng 1");
      },
    );
    await t.test(
      "only active technicians can be assigned and unrelated technicians cannot see/claim a job",
      async () => {
        assert.equal((await getJob(jobId, tech1.cookie)).status, 404);
        assert.equal(
          (await act(jobId, "phan_cong", { ma_ky_thuat_vien: resident.id }))
            .status,
          422,
        );
        await rows(
          pool,
          "UPDATE nguoi_dung SET dang_hoat_dong=0,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [tech2.id],
        );
        assert.equal(
          (await act(jobId, "phan_cong", { ma_ky_thuat_vien: tech2.id }))
            .status,
          422,
        );
        const staff = await req(`/bao_tri/ky_thuat_vien?q=${suffix}`);
        assert.ok(!staff.body.data.some((u) => u.ma_nguoi_dung === tech2.id));
        assert.equal(
          (
            await req(
              `/bao_tri/${jobId}/phan_cong`,
              "POST",
              { phien_ban: 0, ma_ky_thuat_vien: tech1.id },
              tech1.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (await act(jobId, "phan_cong", { ma_ky_thuat_vien: tech1.id }))
            .status,
          200,
        );
        assert.equal((await getJob(jobId, tech1.cookie)).status, 200);
        assert.equal((await getJob(jobId, tech2.cookie)).status, 401);
        await rows(
          pool,
          "UPDATE nguoi_dung SET dang_hoat_dong=1 WHERE ma_nguoi_dung=?",
          [tech2.id],
        );
        tech2.cookie = await login(tech2.phone);
        assert.equal((await getJob(jobId, tech2.cookie)).status, 404);
      },
    );
    await t.test(
      "reassignment while in progress resets start state and immediately revokes previous technician",
      async () => {
        assert.equal(
          (await act(jobId, "bat_dau", {}, admin.cookie)).status,
          403,
        );
        assert.equal(
          (await act(jobId, "bat_dau", {}, tech1.cookie)).status,
          200,
        );
        const old = (await getJob(jobId)).body.data;
        assert.equal(
          (await act(jobId, "phan_cong", { ma_ky_thuat_vien: tech2.id }))
            .status,
          422,
        );
        assert.equal(
          (
            await act(jobId, "phan_cong", {
              ma_ky_thuat_vien: tech2.id,
              ghi_chu: "Đổi ca trực",
            })
          ).status,
          200,
        );
        assert.equal((await getJob(jobId, tech1.cookie)).status, 404);
        assert.equal(
          (
            await req(
              `/bao_tri/${jobId}/bao_cao`,
              "POST",
              {
                phien_ban: old.phien_ban,
                ngay_thuc_hien: d,
                ket_qua: "Kết quả từ người không còn được giao.",
              },
              tech1.cookie,
            )
          ).status,
          404,
        );
        assert.ok(
          !(
            await req(`/bao_tri?q=${suffix}`, "GET", null, tech1.cookie)
          ).body.data.some((j) => j.ma_phieu_bao_tri === jobId),
        );
        const j = (await getJob(jobId, tech2.cookie)).body.data;
        assert.equal(j.trang_thai, "DA_PHAN_CONG");
        assert.equal(j.ngay_bat_dau, null);
      },
    );
    await t.test(
      "results require an actual valid work date and acceptance; return clears current result but preserves history",
      async () => {
        assert.equal(
          (await act(jobId, "bat_dau", {}, tech2.cookie)).status,
          200,
        );
        for (const body of [
          { ngay_thuc_hien: d, ket_qua: "Ngắn" },
          { ngay_thuc_hien: d, ket_qua: "😀".repeat(5) },
          {
            ngay_thuc_hien: addDays(d, -1),
            ket_qua: "Đã kiểm tra và bảo trì đầy đủ.",
          },
          {
            ngay_thuc_hien: addDays(d, 1),
            ket_qua: "Đã kiểm tra và bảo trì đầy đủ.",
          },
        ])
          assert.equal(
            (await act(jobId, "bao_cao", body, tech2.cookie)).status,
            422,
          );
        const oldDue = (await getEquipment(main)).body.data
          .ngay_bao_tri_tiep_theo;
        assert.equal(
          (
            await act(
              jobId,
              "bao_cao",
              {
                ngay_thuc_hien: d,
                ket_qua: "Lượt đầu: đã kiểm tra nhưng cần làm lại phanh.",
              },
              tech2.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await getEquipment(main)).body.data.ngay_bao_tri_tiep_theo,
          oldDue,
        );
        assert.equal(
          (
            await act(jobId, "tra_lai", {
              ly_do: "Kiểm tra lại phanh trước nghiệm thu",
            })
          ).status,
          200,
        );
        const returned = (await getJob(jobId, tech2.cookie)).body.data;
        assert.equal(returned.trang_thai, "DANG_THUC_HIEN");
        assert.equal(returned.ket_qua, "");
        assert.equal(returned.ngay_thuc_hien, null);
        assert.equal(returned.luot_thuc_hien, 2);
        assert.ok(returned.history.some((h) => h.ghi_chu.includes("Lượt đầu")));
        assert.equal(
          (
            await act(jobId, "nghiem_thu", {
              nhan_xet: "Không được bỏ qua báo cáo mới",
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await act(
              jobId,
              "bao_cao",
              {
                ngay_thuc_hien: d,
                ket_qua: "Lượt hai: đã kiểm tra lại phanh và chạy thử đạt.",
              },
              tech2.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await req(
              `/bao_tri/${jobId}/nghiem_thu`,
              "POST",
              {
                phien_ban: (await getJob(jobId)).body.data.phien_ban,
                nhan_xet: "Tự nghiệm thu",
              },
              tech2.cookie,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "concurrent acceptance advances the next date once, from actual work day, and does not auto-create another job",
      async () => {
        const version = (await getJob(jobId)).body.data.phien_ban;
        const results = await Promise.all(
          [1, 2].map(() =>
            req(`/bao_tri/${jobId}/nghiem_thu`, "POST", {
              phien_ban: version,
              nhan_xet: "Đã kiểm tra đạt yêu cầu.",
            }),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
        const e = (await getEquipment(main)).body.data;
        assert.equal(e.ngay_bao_tri_tiep_theo, addDays(d, 30));
        assert.equal(e.phieu_dinh_ky_dang_mo, null);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT * FROM phieu_bao_tri WHERE ma_thiet_bi=?",
              [main],
            )
          ).length,
          1,
        );
        assert.equal(
          (
            await rows(
              pool,
              "SELECT * FROM lich_su_bao_tri WHERE ma_phieu_bao_tri=? AND su_kien='NGHIEM_THU'",
              [jobId],
            )
          ).length,
          1,
        );
        assert.equal(
          (
            await act(jobId, "huy", {
              ly_do: "Không được hủy phiếu đã nghiệm thu",
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "one-off completion does not change the periodic plan",
      async () => {
        const before = (await getEquipment(main)).body.data;
        const r = await createJob(main, {
          loai: "DOT_XUAT",
          tieu_de: "Kiểm tra đột xuất",
          noi_dung: "Kiểm tra tiếng ồn bất thường.",
          ngay_den_han: d,
          ma_ky_thuat_vien: tech2.id,
        });
        assert.equal(r.status, 201);
        const id = r.body.data.ma_phieu_bao_tri;
        assert.equal((await getJob(id)).body.data.qua_han, false);
        for (const [action, body] of [
          ["bat_dau", {}],
          [
            "bao_cao",
            {
              ngay_thuc_hien: d,
              ket_qua: "Đã kiểm tra, xử lý tiếng ồn và chạy thử.",
            },
          ],
        ])
          assert.equal((await act(id, action, body, tech2.cookie)).status, 200);
        assert.equal(
          (
            await act(id, "nghiem_thu", {
              nhan_xet: "Chạy thử hoạt động ổn định",
            })
          ).status,
          200,
        );
        const after = (await getEquipment(main)).body.data;
        assert.equal(
          after.ngay_bao_tri_tiep_theo,
          before.ngay_bao_tri_tiep_theo,
        );
        assert.equal(after.phien_ban, before.phien_ban);
      },
    );
    await t.test(
      "rescheduling a pending periodic job updates its plan; cancel keeps date, unlocks the slot, and permits safe retirement",
      async () => {
        assert.equal(
          (await update(second, { chu_ky_ngay: 60, ngay_bao_tri_tiep_theo: d }))
            .status,
          200,
        );
        const r = await createJob(second);
        assert.equal(r.status, 201);
        const id = r.body.data.ma_phieu_bao_tri;
        assert.equal(
          (
            await act(id, "doi_lich", {
              ngay_den_han: addDays(d, 2),
              ly_do: "Chờ nhà cung cấp",
            })
          ).status,
          200,
        );
        assert.equal(
          (await getEquipment(second)).body.data.ngay_bao_tri_tiep_theo,
          addDays(d, 2),
        );
        assert.equal((await act(id, "huy", { ly_do: "😀😀" })).status, 422);
        assert.equal(
          (await act(id, "huy", { ly_do: "Thay thế thiết bị khác" })).status,
          200,
        );
        assert.equal(
          (await getEquipment(second)).body.data.ngay_bao_tri_tiep_theo,
          addDays(d, 2),
        );
        assert.equal(
          (await update(second, { trang_thai: "NGUNG_SU_DUNG" })).status,
          200,
        );
        const e = (await getEquipment(second)).body.data;
        assert.equal(e.chu_ky_ngay, null);
        assert.equal(e.ngay_bao_tri_tiep_theo, null);
        assert.equal(e.tinh_trang_lich, "NGUNG_THEO_DOI");
        assert.equal(
          (
            await createJob(second, {
              loai: "DOT_XUAT",
              tieu_de: "Phiếu không được lập",
              noi_dung: "Thiết bị ngừng sử dụng.",
              ngay_den_han: d,
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "cancel racing technician start has one winner and no overwritten state",
      async () => {
        const r = await createJob(main, {
          loai: "DOT_XUAT",
          tieu_de: "Kiểm tra cạnh tranh",
          noi_dung: "Kiểm tra khóa phiên bản của phiếu.",
          ngay_den_han: d,
          ma_ky_thuat_vien: tech2.id,
        });
        const id = r.body.data.ma_phieu_bao_tri,
          v = (await getJob(id)).body.data.phien_ban;
        const outcomes = await Promise.all([
          req(`/bao_tri/${id}/bat_dau`, "POST", { phien_ban: v }, tech2.cookie),
          req(`/bao_tri/${id}/huy`, "POST", {
            phien_ban: v,
            ly_do: "Dừng công việc",
          }),
        ]);
        assert.deepEqual(outcomes.map((r) => r.status).sort(), [200, 409]);
        const j = (await getJob(id)).body.data;
        assert.ok(["DANG_THUC_HIEN", "HUY"].includes(j.trang_thai));
        assert.equal(j.phien_ban, 1);
      },
    );
    await t.test(
      "audit failure rolls back equipment creation, job creation and accepted schedule changes",
      async () => {
        const r = await createJob(main, { ma_ky_thuat_vien: tech2.id });
        assert.equal(r.status, 201);
        const id = r.body.data.ma_phieu_bao_tri;
        await act(id, "bat_dau", {}, tech2.cookie);
        await act(
          id,
          "bao_cao",
          {
            ngay_thuc_hien: d,
            ket_qua: "Kết quả dùng để kiểm tra rollback lịch định kỳ.",
          },
          tech2.cookie,
        );
        const before = (await getEquipment(main)).body.data;
        rootSQL(
          "CREATE TRIGGER test_maintenance_audit_failure BEFORE INSERT ON lich_su_bao_tri FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test maintenance audit failure';",
        );
        try {
          assert.equal(
            (
              await req(
                "/thiet_bi",
                "POST",
                asset({ ma_tai_san: `FAIL-${suffix}` }),
              )
            ).status,
            500,
          );
          assert.equal(
            (
              await rows(pool, "SELECT * FROM thiet_bi WHERE ma_tai_san=?", [
                `FAIL-${suffix}`,
              ])
            ).length,
            0,
          );
          const count = (
            await rows(
              pool,
              "SELECT COUNT(*) AS n FROM phieu_bao_tri WHERE ma_thiet_bi=?",
              [main],
            )
          )[0].n;
          assert.equal(
            (
              await createJob(main, {
                loai: "DOT_XUAT",
                tieu_de: "Rollback phiếu",
                noi_dung: "Không được lưu khi ghi lịch sử lỗi.",
                ngay_den_han: d,
              })
            ).status,
            500,
          );
          assert.equal(
            (
              await rows(
                pool,
                "SELECT COUNT(*) AS n FROM phieu_bao_tri WHERE ma_thiet_bi=?",
                [main],
              )
            )[0].n,
            count,
          );
          assert.equal(
            (await act(id, "nghiem_thu", { nhan_xet: "Kiểm tra rollback" }))
              .status,
            500,
          );
          assert.equal(
            (await getJob(id)).body.data.trang_thai,
            "CHO_NGHIEM_THU",
          );
          assert.equal(
            (await getEquipment(main)).body.data.phien_ban,
            before.phien_ban,
          );
          assert.equal(
            (await getEquipment(main)).body.data.ngay_bao_tri_tiep_theo,
            before.ngay_bao_tri_tiep_theo,
          );
        } finally {
          rootSQL("DROP TRIGGER IF EXISTS test_maintenance_audit_failure;");
        }
      },
    );
    await t.test(
      "reminder window includes today and its final notice day, and excludes retired equipment",
      async () => {
        for (const [i, days] of [-1, 0, 7, 8].entries())
          await makeEquipment({
            ma_tai_san: `DUE-${suffix}-${i}`,
            ngay_bao_tri_tiep_theo: addDays(d, days),
          });
        await makeEquipment({
          ma_tai_san: `DUE-${suffix}-U`,
          chu_ky_ngay: null,
          ngay_bao_tri_tiep_theo: null,
        });
        await makeEquipment({
          ma_tai_san: `DUE-${suffix}-R`,
          trang_thai: "NGUNG_SU_DUNG",
        });
        const all = await req(`/thiet_bi?q=DUE-${suffix}`);
        assert.equal(all.body.total, 6);
        assert.equal(all.body.summary.qua_han, 1);
        assert.equal(all.body.summary.sap_den_han, 2);
        for (const [filter, count] of [
          ["SAP_DEN_HAN", 2],
          ["QUA_HAN", 1],
          ["CHUA_CAU_HINH", 1],
        ])
          assert.equal(
            (await req(`/thiet_bi?q=DUE-${suffix}&lich=${filter}`)).body.total,
            count,
          );
      },
    );
    await t.test(
      "equipment and active technician directories paginate without losing records",
      async () => {
        for (let i = 0; i < 21; i++) {
          await makeEquipment({
            ma_tai_san: `PG-${suffix}-${i}`,
            chu_ky_ngay: null,
            ngay_bao_tri_tiep_theo: null,
          });
          const phone =
            "09" +
            String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
          const r = await rows(
            pool,
            "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'KY_THUAT_VIEN')",
            [`TEAM-${suffix}-${i}`, phone, hash],
          );
          users.push(r.insertId);
        }
        for (const path of [
          `/thiet_bi?q=PG-${suffix}`,
          `/bao_tri/ky_thuat_vien?q=TEAM-${suffix}`,
        ]) {
          const first = await req(path),
            last = await req(path + "&page=2");
          assert.equal(first.body.total, 21);
          assert.equal(first.body.data.length, 20);
          assert.equal(last.body.data.length, 1);
        }
      },
    );
    await t.test(
      "equipment due filters and job pagination preserve every matching record",
      async () => {
        const list = await req(`/thiet_bi?q=TM-${suffix}`);
        assert.equal(list.status, 200);
        assert.equal(list.body.total, 1);
        assert.equal(list.body.summary.qua_han, 0);
        for (let i = 0; i < 21; i++) {
          const r = await createJob(main, {
            loai: "DOT_XUAT",
            tieu_de: `PG-${suffix}-${i}`,
            noi_dung: "Kiểm tra phân trang danh sách bảo trì.",
            ngay_den_han: d,
            ma_ky_thuat_vien: tech2.id,
          });
          assert.equal(r.status, 201);
        }
        const one = await req(`/bao_tri?q=PG-${suffix}`),
          two = await req(`/bao_tri?q=PG-${suffix}&page=2`);
        assert.equal(one.body.total, 21);
        assert.equal(one.body.data.length, 20);
        assert.equal(two.body.data.length, 1);
        assert.equal(
          new Set(
            [...one.body.data, ...two.body.data].map((j) => j.ma_phieu_bao_tri),
          ).size,
          21,
        );
        for (const url of [
          "/thiet_bi?page=0",
          "/thiet_bi?lich=BAD",
          "/bao_tri?qua_han=BAD",
          "/bao_tri?trang_thai=BAD",
          "/bao_tri/ky_thuat_vien?page=0",
        ])
          assert.equal((await req(url)).status, 422, url);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of equipmentIds) {
      await rows(pool, "DELETE FROM phieu_bao_tri WHERE ma_thiet_bi=?", [id]);
      await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
    }
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
