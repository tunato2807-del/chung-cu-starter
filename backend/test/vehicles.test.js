import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("MySQL: vehicle registration, plates, residency transfers and rollback", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(5).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const users = [],
    residents = [],
    apartments = [];
  const plate = () => `T${randomBytes(5).toString("hex").toUpperCase()}9`;
  async function request(path, method = "GET", body, cookie) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "X-App-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function account(role) {
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const result = await rows(
      pool,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
      [suffix, phone, hash, role],
    );
    users.push(result.insertId);
    const login = await request("/xac_thuc/dang_nhap", "POST", {
      so_dien_thoai: phone,
      mat_khau: password,
    });
    assert.equal(login.status, 200);
    return login.cookie;
  }
  const ddl = (sql) =>
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
      { input: sql },
    );
  let admin;
  async function resident(start = "2020-01-01") {
    const result = await request(
      "/cu_dan",
      "POST",
      {
        ho_va_ten: "Xe " + suffix + " " + residents.length,
        so_dien_thoai: "0901234567",
        ma_can_ho: apartments[0],
        quan_he: "THANH_VIEN",
        ngay: start,
      },
      admin,
    );
    assert.equal(result.status, 201);
    residents.push(result.body.data.ma_cu_dan);
    const detail = await request(
      `/cu_dan/${result.body.data.ma_cu_dan}`,
      "GET",
      null,
      admin,
    );
    return {
      id: result.body.data.ma_cu_dan,
      stay: detail.body.data.history[0].ma_lich_su_cu_tru,
    };
  }
  const registration = (owner, overrides = {}) => ({
    ma_cu_dan: owner.id,
    ma_lich_su_cu_tru: owner.stay,
    loai_xe: "XE_MAY",
    bien_so: plate(),
    hang_xe: "Honda",
    mau_sac: "Đen",
    ngay_dang_ky: "2021-01-01",
    ...overrides,
  });
  async function create(body) {
    const result = await request("/phuong_tien", "POST", body, admin);
    assert.equal(result.status, 201, JSON.stringify(result.body));
    return result.body.data.ma_phuong_tien;
  }
  async function get(id) {
    return (await request(`/phuong_tien/${id}`, "GET", null, admin)).body.data;
  }
  try {
    admin = await account("QUAN_TRI_VIEN");
    const residentCookie = await account("CU_DAN"),
      tech = await account("KY_THUAT_VIEN");
    for (let i = 0; i < 2; i++) {
      const result = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,?)",
        [`${suffix}-${i}`, "XE", 1, 65],
      );
      apartments.push(result.insertId);
    }
    const owner = await resident(),
      other = await resident();
    await t.test("directory and mutations are management-only", async () => {
      for (const path of ["/phuong_tien", "/phuong_tien/1"]) {
        assert.equal((await request(path)).status, 401);
        for (const cookie of [residentCookie, tech])
          assert.equal((await request(path, "GET", null, cookie)).status, 403);
      }
      assert.equal(
        (await request("/phuong_tien", "POST", registration(owner), tech))
          .status,
        403,
      );
      assert.equal(
        (await request("/phuong_tien/1/ket_thuc", "POST", {}, residentCookie))
          .status,
        403,
      );
    });
    await t.test(
      "validate dates, owner stay, type and plate; allow unplated bicycles",
      async () => {
        for (const override of [
          { loai_xe: "MAY_BAY" },
          { bien_so: "" },
          { bien_so: "59A@12345" },
          { ngay_dang_ky: "2019-12-31" },
          { ngay_dang_ky: "2099-01-01" },
          { ngay_dang_ky: "2025-02-29" },
          { ma_can_ho: apartments[1] },
        ])
          assert.equal(
            (
              await request(
                "/phuong_tien",
                "POST",
                registration(owner, override),
                admin,
              )
            ).status,
            422,
          );
        assert.equal(
          (
            await request(
              "/phuong_tien",
              "POST",
              registration(owner, { ma_lich_su_cu_tru: other.stay }),
              admin,
            )
          ).status,
          409,
        );
        const ids = [];
        for (let i = 0; i < 2; i++)
          ids.push(
            await create(
              registration(owner, { loai_xe: "XE_DAP", bien_so: "" }),
            ),
          );
        assert.notEqual(
          (await get(ids[0])).ma_dang_ky,
          (await get(ids[1])).ma_dang_ky,
        );
        assert.equal((await get(ids[0])).bien_so, null);
      },
    );
    await t.test(
      "normalize plates, prevent duplicates and reject overlapping historical registrations",
      async () => {
        const value = plate(),
          formatted =
            value.slice(0, 3).toLowerCase() + "-" + value.slice(3) + ".";
        const id = await create(registration(owner, { bien_so: formatted }));
        assert.equal((await get(id)).bien_so, value);
        assert.equal(
          (
            await request(
              "/phuong_tien",
              "POST",
              registration(other, { bien_so: value }),
              admin,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/phuong_tien/${id}/ket_thuc`,
              "POST",
              {
                ngay_ket_thuc: "2020-01-01",
                ly_do_ket_thuc: "Sai ngày",
                phien_ban: 0,
              },
              admin,
            )
          ).status,
          422,
        );
        const end = {
          ngay_ket_thuc: "2022-01-01",
          ly_do_ket_thuc: "Ngừng gửi xe",
          phien_ban: 0,
        };
        assert.equal(
          (await request(`/phuong_tien/${id}/ket_thuc`, "POST", end, admin))
            .status,
          200,
        );
        assert.equal(
          (await request(`/phuong_tien/${id}/ket_thuc`, "POST", end, admin))
            .status,
          200,
        );
        assert.equal((await get(id)).phien_ban, 1);
        assert.equal(
          (
            await request(
              `/phuong_tien/${id}/ket_thuc`,
              "POST",
              { ...end, ngay_ket_thuc: "2023-01-01" },
              admin,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "/phuong_tien",
              "POST",
              registration(other, {
                bien_so: value,
                ngay_dang_ky: "2021-06-01",
              }),
              admin,
            )
          ).status,
          409,
        );
        const replacement = await create(
          registration(other, { bien_so: value, ngay_dang_ky: "2022-01-01" }),
        );
        assert.equal((await get(replacement)).bien_so, value);
        const found = await request(
          `/phuong_tien?q=${encodeURIComponent(formatted)}`,
          "GET",
          null,
          admin,
        );
        assert.equal(found.body.total, 2);
      },
    );
    await t.test(
      "concurrent plate registrations create exactly one active registration",
      async () => {
        const value = plate();
        const results = await Promise.all(
          [owner, other].map((person) =>
            request(
              "/phuong_tien",
              "POST",
              registration(person, { bien_so: value }),
              admin,
            ),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM phuong_tien WHERE bien_so=? AND ngay_ket_thuc IS NULL",
          [value],
        );
        assert.equal(count.n, 1);
      },
    );
    await t.test(
      "transfer closes old apartment registrations and optionally carries new registrations in the same day",
      async () => {
        const person = await resident("2023-01-01");
        const car = await create(
          registration(person, { loai_xe: "O_TO", ngay_dang_ky: "2023-01-01" }),
        );
        const bike = await create(
          registration(person, {
            loai_xe: "XE_DAP",
            bien_so: "",
            ngay_dang_ky: "2023-01-01",
          }),
        );
        const move = {
          ma_can_ho: apartments[1],
          quan_he: "THANH_VIEN",
          ngay: "2023-01-01",
          phien_ban: 0,
          chuyen_phuong_tien: true,
        };
        assert.equal(
          (
            await request(
              `/cu_dan/${person.id}/chuyen_can`,
              "POST",
              move,
              admin,
            )
          ).status,
          200,
        );
        for (const id of [car, bike]) {
          const old = await get(id);
          assert.equal(old.ma_can_ho, apartments[0]);
          assert.equal(old.ngay_ket_thuc, "2023-01-01");
        }
        const active = await request(
          `/phuong_tien?ma_cu_dan=${person.id}&trang_thai=DANG_GUI`,
          "GET",
          null,
          admin,
        );
        assert.equal(active.body.total, 2);
        for (const item of active.body.data) {
          assert.equal(item.ma_can_ho, apartments[1]);
          assert.ok([car, bike].includes(item.ma_dang_ky_truoc));
          assert.notEqual(item.ma_lich_su_cu_tru, person.stay);
        }
        assert.equal(
          (
            await request(
              "/phuong_tien",
              "POST",
              registration(person, { ngay_dang_ky: "2023-01-01" }),
              admin,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${person.id}/chuyen_can`,
              "POST",
              {
                ...move,
                ma_can_ho: apartments[0],
                phien_ban: 1,
                chuyen_phuong_tien: false,
              },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/phuong_tien?ma_cu_dan=${person.id}&trang_thai=DANG_GUI`,
              "GET",
              null,
              admin,
            )
          ).body.total,
          0,
        );
        assert.equal(
          (
            await request(
              `/phuong_tien?ma_cu_dan=${person.id}`,
              "GET",
              null,
              admin,
            )
          ).body.total,
          4,
        );
      },
    );
    await t.test(
      "backdating residency cannot cut across vehicle history; departure closes all active vehicles",
      async () => {
        const person = await resident("2020-01-01");
        const id = await create(
          registration(person, { ngay_dang_ky: "2023-01-01" }),
        );
        const move = {
          ma_can_ho: apartments[1],
          quan_he: "THANH_VIEN",
          ngay: "2022-01-01",
          phien_ban: 0,
          chuyen_phuong_tien: true,
        };
        assert.equal(
          (
            await request(
              `/cu_dan/${person.id}/chuyen_can`,
              "POST",
              move,
              admin,
            )
          ).body.error.code,
          "VEHICLE_DATE_CONFLICT",
        );
        assert.equal((await get(id)).ngay_ket_thuc, null);
        assert.equal(
          (
            await request(
              `/phuong_tien/${id}/ket_thuc`,
              "POST",
              {
                ngay_ket_thuc: "2024-01-01",
                ly_do_ket_thuc: "Kết thúc xe",
                phien_ban: 0,
              },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${person.id}/chuyen_can`,
              "POST",
              { ...move, ngay: "2023-01-01" },
              admin,
            )
          ).status,
          422,
        );
        const second = await create(
          registration(person, { ngay_dang_ky: "2024-01-01" }),
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${person.id}/chuyen_di`,
              "POST",
              { ngay: "2024-01-01", phien_ban: 0 },
              admin,
            )
          ).status,
          200,
        );
        assert.equal((await get(second)).ngay_ket_thuc, "2024-01-01");
        assert.equal(
          (await request("/phuong_tien", "POST", registration(person), admin))
            .status,
          422,
        );
      },
    );
    await t.test(
      "failure creating a carried registration rolls back residency and all vehicle changes",
      async () => {
        const person = await resident("2020-01-01");
        const id = await create(registration(person));
        const before = await get(id);
        ddl(
          "CREATE TRIGGER test_vehicle_carry_fail BEFORE INSERT ON phuong_tien FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test vehicle rollback';",
        );
        try {
          assert.equal(
            (
              await request(
                `/cu_dan/${person.id}/chuyen_can`,
                "POST",
                {
                  ma_can_ho: apartments[1],
                  quan_he: "THANH_VIEN",
                  ngay: "2022-01-01",
                  phien_ban: 0,
                  chuyen_phuong_tien: true,
                },
                admin,
              )
            ).status,
            500,
          );
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_vehicle_carry_fail;");
        }
        assert.deepEqual(await get(id), before);
        const detail = await request(
          `/cu_dan/${person.id}`,
          "GET",
          null,
          admin,
        );
        assert.equal(detail.body.data.phien_ban, 0);
        assert.equal(detail.body.data.history.length, 1);
        assert.equal(detail.body.data.history[0].den_ngay, null);
      },
    );
    await t.test(
      "registration racing a departure leaves no active vehicle on a closed stay",
      async () => {
        const person = await resident();
        const [created, moved] = await Promise.all([
          request(
            "/phuong_tien",
            "POST",
            registration(person, { ngay_dang_ky: "2022-01-01" }),
            admin,
          ),
          request(
            `/cu_dan/${person.id}/chuyen_di`,
            "POST",
            { ngay: "2022-01-01", phien_ban: 0 },
            admin,
          ),
        ]);
        assert.equal(moved.status, 200);
        assert.ok([201, 422].includes(created.status));
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM phuong_tien WHERE ma_cu_dan=? AND ngay_ket_thuc IS NULL",
          [person.id],
        );
        assert.equal(count.n, 0);
      },
    );
    await t.test("bicycle registrations have stable pagination", async () => {
      const person = await resident();
      for (let i = 0; i < 21; i++)
        await create(registration(person, { loai_xe: "XE_DAP", bien_so: "" }));
      const first = await request(
          `/phuong_tien?ma_cu_dan=${person.id}&loai_xe=XE_DAP&page=1`,
          "GET",
          null,
          admin,
        ),
        second = await request(
          `/phuong_tien?ma_cu_dan=${person.id}&loai_xe=XE_DAP&page=2`,
          "GET",
          null,
          admin,
        );
      assert.equal(first.body.total, 21);
      assert.equal(first.body.data.length, 20);
      assert.equal(second.body.data.length, 1);
      assert.equal(
        new Set(
          [...first.body.data, ...second.body.data].map(
            (v) => v.ma_phuong_tien,
          ),
        ).size,
        21,
      );
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    for (const id of residents) {
      await rows(
        pool,
        "DELETE FROM phuong_tien WHERE ma_cu_dan=? ORDER BY ma_phuong_tien DESC",
        [id],
      );
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
