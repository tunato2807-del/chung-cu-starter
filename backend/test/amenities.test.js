import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";
import { login } from "../src/modules/auth/auth.service.js";
import { findUser } from "../src/modules/auth/auth.repository.js";
import * as service from "../src/modules/amenities/amenities.service.js";
import * as v from "../src/modules/amenities/amenities.validation.js";

test("amenity reservations: isolation, same-time races, custody and policy consistency", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10),
    users = [],
    apartments = [],
    profiles = [],
    facilities = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`,
    day = v.addDays(v.today(), 1);
  let admin,
    owner,
    member,
    other,
    unlinked,
    tech,
    fixed,
    fixedName,
    fixedId,
    main,
    initial,
    primary;
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
    return { status: r.status, body: await r.json() };
  }
  async function session(name, secret = password) {
    const r = await login({ so_dien_thoai: name, mat_khau: secret });
    return `session=${r.token}`;
  }
  async function account(role) {
    const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      r = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [`DL ${suffix}`, phone, hash, role],
      );
    users.push(r.insertId);
    return { id: r.insertId, phone, cookie: await session(phone) };
  }
  const facility = (extra = {}) => ({
    ten_tien_ich: `Phòng ${suffix}`,
    vi_tri: "Tầng 2",
    mo_ta: "Quy định riêng\n<script>alert(1)</script>",
    suc_chua: 20,
    gio_mo: "06:00",
    gio_dong: "22:00",
    toi_da_phut: 120,
    dat_truoc_ngay: 30,
    dang_mo: true,
    ...extra,
  });
  async function newFacility(extra = {}) {
    const r = await req("/tien_ich", "POST", facility(extra));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    facilities.push(r.body.data.ma_tien_ich);
    return r.body.data.ma_tien_ich;
  }
  async function booking(extra = {}, cookie = owner.cookie, id = main) {
    const f = (await req(`/tien_ich/${id}`)).body.data;
    return req(
      `/tien_ich/${id}/dat_lich`,
      "POST",
      {
        ngay: day,
        gio_bat_dau: "08:00",
        gio_ket_thuc: "09:00",
        so_nguoi: 2,
        ghi_chu: "Sinh hoạt riêng tư",
        khoa_yeu_cau: randomUUID(),
        phien_ban_tien_ich: f.phien_ban,
        ...extra,
      },
      cookie,
    );
  }
  async function detail(id, cookie = admin.cookie) {
    return req(
      `${cookie === admin.cookie ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich"}/${id}`,
      "GET",
      null,
      cookie,
    );
  }
  async function act(id, action, extra = {}, cookie = admin.cookie) {
    const r = await detail(id, cookie);
    return req(
      `${cookie === admin.cookie ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich"}/${id}/${action}`,
      "POST",
      {
        phien_ban: r.body.data?.phien_ban,
        ghi_chu: "Đã kiểm tra lịch đặt",
        ...extra,
      },
      cookie,
    );
  }
  async function update(extra = {}) {
    const f = (await req(`/tien_ich/${main}`)).body.data;
    return req(`/tien_ich/${main}`, "PUT", {
      ...f,
      gio_mo: f.gio_mo.slice(0, 5),
      gio_dong: f.gio_dong.slice(0, 5),
      dang_mo: !!f.dang_mo,
      ...extra,
    });
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
    owner = await account("CU_DAN");
    member = await account("CU_DAN");
    other = await account("CU_DAN");
    unlinked = await account("CU_DAN");
    tech = await account("KY_THUAT_VIEN");
    for (let i = 0; i < 2; i++) {
      const r = await req("/can_ho", "POST", {
        so_can_ho: `DL-${suffix}-${i}`,
        khoi: "DL",
        tang: 2,
        dien_tich_m2: "50",
        tinh_phi_dich_vu: true,
      });
      assert.equal(r.status, 201);
      apartments.push(r.body.data.ma_can_ho);
    }
    for (const [u, apt, role] of [
      [owner, apartments[0], "CHU_HO"],
      [member, apartments[0], "THANH_VIEN"],
      [other, apartments[1], "CHU_HO"],
    ]) {
      const r = await req("/cu_dan", "POST", {
        ho_va_ten: `Cư dân ${suffix}`,
        so_dien_thoai: u.phone,
        ma_nguoi_dung: u.id,
        ma_can_ho: apt,
        quan_he: role,
        ngay: v.today(),
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      profiles.push(r.body.data.ma_cu_dan);
      u.profile = r.body.data.ma_cu_dan;
      if (u === owner) {
        fixedName = r.body.data.tai_khoan_can_ho.ten_dang_nhap;
        fixed = await session(
          fixedName,
          r.body.data.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
      }
    }
    fixedId = (
      await rows(
        pool,
        "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
        [apartments[0]],
      )
    )[0].ma_nguoi_dung;
    main = await newFacility();
    await t.test(
      "roles, CSRF, linked residence and strict input validation",
      async () => {
        assert.equal((await req("/tien_ich", "GET", null, null)).status, 401);
        assert.equal(
          (await req("/tien_ich", "GET", null, tech.cookie)).status,
          403,
        );
        assert.equal(
          (await req("/tien_ich", "POST", facility(), owner.cookie)).status,
          403,
        );
        assert.equal(
          (await req("/tien_ich", "POST", facility(), admin.cookie, false))
            .status,
          403,
        );
        assert.equal(
          (await req("/dat_lich_tien_ich", "GET", null, owner.cookie)).status,
          403,
        );
        assert.equal(
          (
            await req(
              "/cua_toi/dat_lich/ngu_canh",
              "GET",
              null,
              unlinked.cookie,
            )
          ).body.data,
          null,
        );
        assert.equal((await booking({}, unlinked.cookie)).status, 403);
        for (const extra of [
          { gio_mo: "06:15" },
          { gio_dong: "05:00" },
          { suc_chua: 0 },
          { toi_da_phut: 45 },
          { dat_truoc_ngay: 91 },
          { dang_mo: "true" },
        ])
          assert.equal(
            (await req("/tien_ich", "POST", facility(extra))).status,
            422,
          );
        for (const extra of [
          { ngay: "2026-02-30" },
          { ngay: v.addDays(v.today(), 31) },
          { gio_bat_dau: "06:15" },
          { gio_bat_dau: "05:00" },
          { gio_ket_thuc: "08:00" },
          { gio_ket_thuc: "11:00" },
          { so_nguoi: 21 },
          { so_nguoi: 0 },
          { phien_ban_tien_ich: "1e0" },
          { khoa_yeu_cau: "invalid" },
        ])
          assert.equal(
            (await booking(extra)).status,
            422,
            JSON.stringify(extra),
          );
        assert.equal(
          (await booking({ ngay: v.addDays(v.today(), -1) })).status,
          422,
        );
        assert.equal((await booking({ phien_ban_tien_ich: 99 })).status, 409);
      },
    );
    await t.test(
      "idempotent concurrent retries create one reservation with server-derived apartment",
      async () => {
        initial = {
          ngay: day,
          gio_bat_dau: "08:00",
          gio_ket_thuc: "09:00",
          so_nguoi: 3,
          khoa_yeu_cau: randomUUID(),
          phien_ban_tien_ich: 0,
          ma_can_ho: apartments[1],
        };
        const rs = await Promise.all([1, 2, 3].map(() => booking(initial)));
        assert.deepEqual(rs.map((r) => r.status).sort(), [200, 200, 201]);
        primary = rs[0].body.data.ma_dat_lich;
        assert.ok(rs.every((r) => r.body.data.ma_dat_lich === primary));
        assert.equal(
          (await detail(primary)).body.data.ma_can_ho,
          apartments[0],
        );
        assert.equal((await booking({ ...initial, so_nguoi: 4 })).status, 409);
      },
    );
    await t.test(
      "overlap, containment and adjacency: pending requests reserve the entire amenity",
      async () => {
        for (const times of [
          ["08:00", "08:30"],
          ["07:30", "08:30"],
          ["08:30", "09:30"],
          ["07:30", "09:30"],
        ])
          assert.equal(
            (
              await booking(
                { gio_bat_dau: times[0], gio_ket_thuc: times[1] },
                other.cookie,
              )
            ).status,
            409,
          );
        const r = await booking(
          { gio_bat_dau: "09:00", gio_ket_thuc: "09:30" },
          other.cookie,
        );
        assert.equal(r.status, 201);
      },
    );
    await t.test(
      "simultaneous new requests from different apartments have exactly one winner",
      async () => {
        const rs = await Promise.all(
          [owner.cookie, other.cookie].map((cookie) =>
            booking({ gio_bat_dau: "11:00", gio_ket_thuc: "12:00" }, cookie),
          ),
        );
        assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409]);
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND bat_dau=?",
          [main, `${day} 11:00:00`],
        );
        assert.equal(count.n, 1);
      },
    );
    await t.test(
      "calendar exposes only aggregate occupancy, details stay private",
      async () => {
        const r = await req(
          `/tien_ich/${main}/lich?ngay=${day}`,
          "GET",
          null,
          other.cookie,
        );
        assert.equal(r.status, 200);
        assert.equal(
          r.body.data.slots.find((s) => s.gio_bat_dau === "08:00").da_dat,
          true,
        );
        for (const s of r.body.data.slots)
          assert.deepEqual(Object.keys(s).sort(), [
            "co_the_dat",
            "da_dat",
            "gio_bat_dau",
            "gio_ket_thuc",
          ]);
        assert.equal((await detail(primary, other.cookie)).status, 404);
        assert.equal((await detail(primary, member.cookie)).status, 404);
        assert.equal((await detail(primary, fixed)).status, 200);
        const b = (await detail(primary)).body.data;
        assert.equal(b.khoa_yeu_cau, undefined);
        assert.equal(b.van_tay, undefined);
        assert.equal(
          (
            await req(
              "/cua_toi/dat_lich?ma_tien_ich=" + main,
              "GET",
              null,
              member.cookie,
            )
          ).body.total,
          0,
        );
      },
    );
    await t.test(
      "versioned approval, resident cancellation and rejection release the slot",
      async () => {
        assert.equal(
          (
            await req(
              `/cua_toi/dat_lich/${primary}/duyet`,
              "POST",
              { phien_ban: 0 },
              owner.cookie,
            )
          ).status,
          404,
        );
        assert.equal((await act(primary, "duyet")).status, 200);
        assert.equal((await act(primary, "huy", { phien_ban: 0 })).status, 409);
        assert.equal((await act(primary, "huy", {}, owner.cookie)).status, 200);
        const r = await booking(
          { gio_bat_dau: "08:00", gio_ket_thuc: "09:00" },
          member.cookie,
        );
        assert.equal(r.status, 201);
        assert.equal(
          (await act(r.body.data.ma_dat_lich, "tu_choi", { ghi_chu: "" }))
            .status,
          422,
        );
        assert.equal(
          (await act(r.body.data.ma_dat_lich, "tu_choi")).status,
          200,
        );
        assert.equal((await act(r.body.data.ma_dat_lich, "duyet")).status, 409);
        assert.equal((await booking()).status, 201);
        assert.deepEqual(
          (await detail(primary)).body.data.history.map((h) => h.su_kien),
          ["DAT_LICH", "DUYET", "HUY"],
        );
        // A retry still resolves to the original canceled reservation, never resurrects it.
        const replay = await booking(initial);
        assert.equal(replay.status, 200);
        assert.equal(replay.body.data.ma_dat_lich, primary);
      },
    );
    await t.test(
      "policy changes protect existing bookings; pausing preserves holds and immutable labels",
      async () => {
        assert.equal((await update({ suc_chua: 1 })).status, 409);
        assert.equal((await update({ gio_mo: "10:00" })).status, 409);
        assert.equal(
          (
            await update({
              ten_tien_ich: `Phòng đổi tên ${suffix}`,
              dang_mo: false,
            })
          ).status,
          200,
        );
        assert.equal(
          (await booking({ gio_bat_dau: "13:00", gio_ket_thuc: "14:00" }))
            .status,
          409,
        );
        assert.equal(
          (await detail(primary)).body.data.ten_tien_ich,
          facility().ten_tien_ich,
        );
        const cal = (await req(`/tien_ich/${main}/lich?ngay=${day}`)).body.data;
        assert.ok(cal.slots.every((s) => !s.co_the_dat));
        assert.ok(cal.slots.some((s) => s.da_dat));
        assert.equal((await update({ dang_mo: true })).status, 200);
        assert.equal(
          (
            await req(`/tien_ich/${main}`, "PUT", {
              ...facility(),
              phien_ban: 0,
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "fixed account books on behalf of current owner and manages household reservations",
      async () => {
        const r = await booking(
          { gio_bat_dau: "14:00", gio_ket_thuc: "15:00" },
          fixed,
        );
        assert.equal(r.status, 201);
        const b = (await detail(r.body.data.ma_dat_lich)).body.data;
        assert.equal(b.ma_nguoi_dat, fixedId);
        assert.equal(b.ma_can_ho, apartments[0]);
        const m = await booking(
          { gio_bat_dau: "15:00", gio_ket_thuc: "16:00" },
          member.cookie,
        );
        assert.equal(m.status, 201);
        assert.equal(
          (await act(m.body.data.ma_dat_lich, "huy", {}, other.cookie)).status,
          404,
        );
        assert.equal(
          (await act(m.body.data.ma_dat_lich, "huy", {}, fixed)).status,
          200,
        );
        assert.equal(
          (await act(r.body.data.ma_dat_lich, "huy", {}, owner.cookie)).status,
          404,
        );
      },
    );
    await t.test(
      "concurrent approval and cancellation mutate one version once",
      async () => {
        const b = await booking({
            gio_bat_dau: "16:00",
            gio_ket_thuc: "17:00",
          }),
          id = b.body.data.ma_dat_lich;
        const rs = await Promise.all(
          ["duyet", "huy"].map((action) =>
            req(`/dat_lich_tien_ich/${id}/${action}`, "POST", {
              phien_ban: 0,
              ghi_chu: "Kiểm tra thao tác đồng thời",
            }),
          ),
        );
        assert.deepEqual(rs.map((r) => r.status).sort(), [200, 409]);
        assert.equal((await detail(id)).body.data.history.length, 2);
      },
    );
    await t.test(
      "past reservations are immutable and local calendar boundaries are exact",
      async () => {
        const r = await booking({
            gio_bat_dau: "17:00",
            gio_ket_thuc: "18:00",
          }),
          id = r.body.data.ma_dat_lich;
        await rows(
          pool,
          "UPDATE dat_lich_tien_ich SET bat_dau=?,ket_thuc=? WHERE ma_dat_lich=?",
          [
            `${v.addDays(v.today(), -1)} 17:00:00`,
            `${v.addDays(v.today(), -1)} 18:00:00`,
            id,
          ],
        );
        for (const action of ["duyet", "tu_choi", "huy"])
          assert.equal((await act(id, action)).status, 409);
        assert.equal(
          (await detail(id, owner.cookie)).body.data.co_the_huy,
          false,
        );
        const f = facility();
        const b = {
          bat_dau: `${v.today()} 23:30:00`,
          ket_thuc: `${v.today()} 23:45:00`,
          so_nguoi: 1,
        };
        assert.throws(() => v.checkBooking(f, b, `${v.today()} 23:59:00`));
        assert.equal(
          (await req(`/tien_ich/${main}/lich?ngay=${v.addDays(v.today(), 91)}`))
            .status,
          422,
        );
        const far = await booking({
          ngay: v.addDays(v.today(), 30),
          gio_bat_dau: "06:00",
          gio_ket_thuc: "06:30",
        });
        assert.equal(far.status, 201);
      },
    );
    await t.test(
      "failed audit rolls back both creation and a booking decision",
      async () => {
        const r = await booking({
            gio_bat_dau: "18:00",
            gio_ket_thuc: "19:00",
          }),
          id = r.body.data.ma_dat_lich,
          key = randomUUID();
        rootSQL(
          "CREATE TRIGGER test_amenity_audit_failure BEFORE INSERT ON lich_su_dat_lich FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit failure';",
        );
        try {
          assert.equal(
            (
              await booking({
                gio_bat_dau: "19:00",
                gio_ket_thuc: "20:00",
                khoa_yeu_cau: key,
              })
            ).status,
            500,
          );
          assert.equal(
            (
              await rows(
                pool,
                "SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE khoa_yeu_cau=?",
                [key],
              )
            ).length,
            0,
          );
          assert.equal((await act(id, "duyet")).status, 500);
          const b = (await detail(id)).body.data;
          assert.equal(b.trang_thai, "CHO_DUYET");
          assert.equal(b.phien_ban, 0);
          assert.equal(b.history.length, 1);
        } finally {
          rootSQL("DROP TRIGGER IF EXISTS test_amenity_audit_failure;");
        }
      },
    );
    await t.test(
      "personal move-out and return retain read-only history, new stay cannot cancel old booking",
      async () => {
        const r = await booking(
            { gio_bat_dau: "20:00", gio_ket_thuc: "21:00" },
            member.cookie,
          ),
          id = r.body.data.ma_dat_lich;
        let p = (await req(`/cu_dan/${member.profile}`)).body.data;
        const out = await req(`/cu_dan/${member.profile}/chuyen_di`, "POST", {
          ngay: v.today(),
          phien_ban: p.phien_ban,
        });
        assert.equal(out.status, 200, JSON.stringify(out.body));
        assert.equal((await detail(id, member.cookie)).status, 200);
        assert.equal(
          (await detail(id, member.cookie)).body.data.co_the_huy,
          false,
        );
        assert.equal((await act(id, "huy", {}, member.cookie)).status, 403);
        p = (await req(`/cu_dan/${member.profile}`)).body.data;
        const back = await req(`/cu_dan/${member.profile}/nhap_cu`, "POST", {
          ngay: v.today(),
          ma_can_ho: apartments[0],
          quan_he: "THANH_VIEN",
          phien_ban: p.phien_ban,
        });
        assert.equal(back.status, 200, JSON.stringify(back.body));
        assert.equal((await act(id, "huy", {}, member.cookie)).status, 404);
        assert.equal((await act(id, "huy", {}, fixed)).status, 200);
      },
    );
    await t.test(
      "householder replacement revokes old sessions and new custodian inherits apartment schedule",
      async () => {
        const r = await req("/cu_dan", "POST", {
          ho_va_ten: `Chủ mới ${suffix}`,
          so_dien_thoai: unlinked.phone,
          ma_nguoi_dung: unlinked.id,
          ma_can_ho: apartments[0],
          quan_he: "CHU_HO",
          ngay: v.today(),
          xac_nhan_ban_giao: true,
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        profiles.push(r.body.data.ma_cu_dan);
        assert.equal(
          (await req("/cua_toi/dat_lich", "GET", null, fixed)).status,
          401,
        );
        fixed = await session(
          fixedName,
          r.body.data.tai_khoan_can_ho.mat_khau_tam_thoi,
        );
        assert.equal((await detail(primary, fixed)).status, 200);
        const ctx = (
          await req("/cua_toi/dat_lich/ngu_canh", "GET", null, fixed)
        ).body.data;
        assert.equal(ctx.ma_cu_dan, r.body.data.ma_cu_dan);
        const b = await booking(
          { gio_bat_dau: "21:00", gio_ket_thuc: "22:00" },
          fixed,
        );
        assert.equal(b.status, 201);
        assert.equal(
          (await detail(b.body.data.ma_dat_lich)).body.data.ten_nguoi_dat,
          `Chủ mới ${suffix}`,
        );
      },
    );
    await t.test(
      "a session revoked after middleware cannot perform a transactional write",
      async () => {
        const stale = await findUser(other.id);
        await rows(
          pool,
          "UPDATE nguoi_dung SET phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
          [other.id],
        );
        const f = (await req(`/tien_ich/${main}`)).body.data,
          key = randomUUID();
        await assert.rejects(
          service.createBooking(
            main,
            {
              ngay: v.addDays(day, 1),
              gio_bat_dau: "08:00",
              gio_ket_thuc: "09:00",
              so_nguoi: 1,
              phien_ban_tien_ich: f.phien_ban,
              khoa_yeu_cau: key,
            },
            stale,
          ),
          (e) => e.status === 403 || e.status === 401,
        );
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE khoa_yeu_cau=?",
              [key],
            )
          ).length,
          0,
        );
      },
    );
    await t.test(
      "a policy edit racing a new booking cannot invalidate a committed reservation",
      async () => {
        const id = await newFacility();
        const results = await Promise.all([
          booking({ so_nguoi: 2, phien_ban_tien_ich: 0 }, owner.cookie, id),
          req(`/tien_ich/${id}`, "PUT", {
            ...facility({ suc_chua: 1 }),
            phien_ban: 0,
          }),
        ]);
        assert.ok(
          [
            [201, 409],
            [409, 200],
          ].some((pair) =>
            pair.every((status, i) => results[i].status === status),
          ),
          JSON.stringify(results),
        );
        const saved = (await req(`/tien_ich/${id}`)).body.data;
        const held = await rows(
          pool,
          "SELECT so_nguoi FROM dat_lich_tien_ich WHERE ma_tien_ich=?",
          [id],
        );
        assert.ok(held.every((b) => b.so_nguoi <= saved.suc_chua));
      },
    );
    await t.test(
      "stable filters and pagination cover more than twenty amenities and bookings",
      async () => {
        for (let i = 0; i < 21; i++)
          await newFacility({
            ten_tien_ich: `Lọc ${suffix} ${String(i).padStart(2, "0")}`,
          });
        const a = await req(`/tien_ich?q=${suffix}`),
          b = await req(`/tien_ich?q=${suffix}&page=2`);
        assert.equal(a.body.data.length, 20);
        assert.equal(b.body.data.length, 3);
        assert.equal(
          new Set([...a.body.data, ...b.body.data].map((f) => f.ma_tien_ich))
            .size,
          23,
        );
        for (let i = 2; i < 23; i++)
          assert.equal(
            (
              await booking(
                {
                  ngay: v.addDays(day, i),
                  gio_bat_dau: "06:00",
                  gio_ket_thuc: "06:30",
                },
                fixed,
              )
            ).status,
            201,
          );
        const x = await req(`/dat_lich_tien_ich?ma_tien_ich=${main}`),
          y = await req(`/dat_lich_tien_ich?ma_tien_ich=${main}&page=2`);
        assert.equal(x.body.data.length, 20);
        assert.ok(y.body.data.length > 0);
        assert.equal(
          new Set([...x.body.data, ...y.body.data].map((b) => b.ma_dat_lich))
            .size,
          x.body.data.length + y.body.data.length,
        );
        assert.equal((await req("/dat_lich_tien_ich?page=0")).status, 422);
        assert.equal(
          (await req("/dat_lich_tien_ich?trang_thai=BAD")).status,
          422,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const id of facilities) {
      await rows(pool, "DELETE FROM dat_lich_tien_ich WHERE ma_tien_ich=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM tien_ich WHERE ma_tien_ich=?", [id]);
    }
    for (const id of profiles) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of users)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
