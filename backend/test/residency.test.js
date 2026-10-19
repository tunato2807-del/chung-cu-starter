import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("MySQL: apartments, accounts, residency dates, concurrent transfer and rollback", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(5).toString("hex"),
    password = randomBytes(16).toString("hex");
  const accounts = [],
    apartments = [],
    residents = [];
  const hash = await bcrypt.hash(password, 10);
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
  async function request(path, method = "GET", body, cookie) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "X-App-Request": "1",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
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
    accounts.push(result.insertId);
    const login = await request("/xac_thuc/dang_nhap", "POST", {
      so_dien_thoai: phone,
      mat_khau: password,
    });
    assert.equal(login.status, 200);
    return { id: result.insertId, cookie: login.cookie };
  }
  let admin, profile;
  try {
    admin = await account("QUAN_TRI_VIEN");
    const tech = await account("KY_THUAT_VIEN"),
      resident = await account("CU_DAN");
    const apartmentBody = {
      so_can_ho: `${suffix}-1`,
      khoi: "TEST",
      tang: 3,
      dien_tich_m2: "65.50",
      tinh_phi_dich_vu: true,
    };
    await t.test(
      "private directory rejects guests, residents and technicians",
      async () => {
        for (const path of ["/can_ho", "/cu_dan", "/cu_dan/1", "/can_ho/1"]) {
          assert.equal((await request(path)).status, 401);
          assert.equal(
            (await request(path, "GET", null, resident.cookie)).status,
            403,
          );
          assert.equal(
            (await request(path, "GET", null, tech.cookie)).status,
            403,
          );
        }
        assert.equal(
          (await request("/can_ho", "POST", apartmentBody, tech.cookie)).status,
          403,
        );
      },
    );
    await t.test(
      "apartment validation, unique number and stale edit",
      async () => {
        for (const override of [
          { dien_tich_m2: 0 },
          { dien_tich_m2: "1.234" },
          { tang: -1 },
          { tinh_phi_dich_vu: "false" },
        ])
          assert.equal(
            (
              await request(
                "/can_ho",
                "POST",
                { ...apartmentBody, ...override },
                admin.cookie,
              )
            ).status,
            422,
          );
        for (let i = 1; i <= 3; i++) {
          const result = await request(
            "/can_ho",
            "POST",
            { ...apartmentBody, so_can_ho: `${suffix}-${i}` },
            admin.cookie,
          );
          assert.equal(result.status, 201);
          apartments.push(result.body.data.ma_can_ho);
        }
        assert.equal(
          (await request("/can_ho", "POST", apartmentBody, admin.cookie))
            .status,
          409,
        );
        const update = {
          ...apartmentBody,
          dien_tich_m2: "70.25",
          phien_ban: 0,
        };
        assert.equal(
          (
            await request(
              `/can_ho/${apartments[0]}`,
              "PATCH",
              update,
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/can_ho/${apartments[0]}`,
              "PATCH",
              update,
              admin.cookie,
            )
          ).status,
          409,
        );
        const list = await request(
          `/can_ho?q=${suffix}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(list.body.total, 3);
        assert.equal(list.body.data[0].so_cu_dan, 0);
        assert.equal(
          (
            await request(
              `/can_ho?q=${suffix}&tang=3`,
              "GET",
              null,
              admin.cookie,
            )
          ).body.total,
          3,
        );
        assert.equal(
          (
            await request(
              `/can_ho?q=${suffix}&tang=0`,
              "GET",
              null,
              admin.cookie,
            )
          ).body.total,
          0,
        );
        assert.equal(
          (await request("/can_ho?page=-1", "GET", null, admin.cookie)).status,
          422,
        );
      },
    );
    const profileBody = {
      ho_va_ten: "Cư dân " + suffix,
      so_dien_thoai: "0901234567",
      ma_nguoi_dung: resident.id,
      ma_can_ho: apartments[0],
      quan_he: "NGUOI_THUE",
      ngay: "2020-01-01",
    };
    await t.test(
      "profile linking, invalid dates, unique account and occupancy",
      async () => {
        const available = await request(
          `/cu_dan/tai_khoan?q=${suffix}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.deepEqual(
          available.body.data.map((u) => u.ma_nguoi_dung),
          [resident.id],
        );
        for (const override of [
          { ngay: "2025-02-29" },
          { ngay: "2099-01-01" },
          { ma_nguoi_dung: tech.id },
          { ma_can_ho: 4294967295 },
        ])
          assert.ok(
            [404, 422].includes(
              (
                await request(
                  "/cu_dan",
                  "POST",
                  { ...profileBody, ...override },
                  admin.cookie,
                )
              ).status,
            ),
          );
        const created = await request(
          "/cu_dan",
          "POST",
          profileBody,
          admin.cookie,
        );
        assert.equal(created.status, 201);
        profile = created.body.data;
        residents.push(profile.ma_cu_dan);
        assert.equal(
          (
            await request(
              `/cu_dan/tai_khoan?q=${suffix}`,
              "GET",
              null,
              admin.cookie,
            )
          ).body.total,
          0,
        );
        assert.equal(
          (await request("/cu_dan", "POST", profileBody, admin.cookie)).status,
          409,
        );
        const [count] = await rows(
          pool,
          "SELECT COUNT(*) AS n FROM cu_dan WHERE ma_nguoi_dung=?",
          [resident.id],
        );
        assert.equal(count.n, 1);
        const room = await request(
          `/can_ho/${apartments[0]}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(room.body.data.residents.length, 1);
      },
    );
    await t.test(
      "apartment pagination preserves all matching records",
      async () => {
        for (let i = 4; i <= 24; i++) {
          const result = await rows(
            pool,
            "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,?,?)",
            [`${suffix}-${i}`, "TEST", 0, "50.00"],
          );
          apartments.push(result.insertId);
        }
        const first = await request(
          `/can_ho?q=${suffix}&page=1`,
          "GET",
          null,
          admin.cookie,
        );
        const second = await request(
          `/can_ho?q=${suffix}&page=2`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(first.body.total, 24);
        assert.equal(first.body.data.length, 20);
        assert.equal(second.body.data.length, 4);
        assert.equal(
          new Set(
            [...first.body.data, ...second.body.data].map((a) => a.ma_can_ho),
          ).size,
          24,
        );
      },
    );
    await t.test(
      "two transfers race: exactly one succeeds, one active stay remains",
      async () => {
        const id = profile.ma_cu_dan;
        const body = {
          phien_ban: 0,
          ngay: "2021-01-01",
          quan_he: "THANH_VIEN",
        };
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_can`,
              "POST",
              { ...body, ma_can_ho: apartments[0] },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_di`,
              "POST",
              { ...body, ngay: "2019-12-31" },
              admin.cookie,
            )
          ).status,
          422,
        );
        const results = await Promise.all(
          apartments
            .slice(1, 3)
            .map((target) =>
              request(
                `/cu_dan/${id}/chuyen_can`,
                "POST",
                { ...body, ma_can_ho: target },
                admin.cookie,
              ),
            ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
        const detail = await request(
          `/cu_dan/${id}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(detail.body.data.phien_ban, 1);
        assert.equal(detail.body.data.history.length, 2);
        assert.equal(
          detail.body.data.history.filter((s) => !s.den_ngay).length,
          1,
        );
        assert.equal(detail.body.data.history[1].den_ngay, "2021-01-01");
        const oldRoom = await request(
          `/can_ho/${apartments[0]}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(oldRoom.body.data.residents.length, 0);
      },
    );
    await t.test(
      "SQL failure after closing old stay rolls back the complete transfer",
      async () => {
        const id = profile.ma_cu_dan;
        const [before] = await rows(
          pool,
          "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL",
          [id],
        );
        ddl(
          `CREATE TRIGGER test_residency_fail BEFORE INSERT ON lich_su_cu_tru FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test rollback';`,
        );
        try {
          const result = await request(
            `/cu_dan/${id}/chuyen_can`,
            "POST",
            {
              ma_can_ho: apartments[0],
              quan_he: "THANH_VIEN",
              ngay: "2022-01-01",
              phien_ban: 1,
            },
            admin.cookie,
          );
          assert.equal(result.status, 500);
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_residency_fail;");
        }
        const [after] = await rows(
          pool,
          "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL",
          [id],
        );
        assert.deepEqual(after, before);
        const [row] = await rows(
          pool,
          "SELECT phien_ban FROM cu_dan WHERE ma_cu_dan=?",
          [id],
        );
        assert.equal(row.phien_ban, 1);
      },
    );
    await t.test(
      "move out, return and locked linked account preserve history",
      async () => {
        const id = profile.ma_cu_dan;
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_di`,
              "POST",
              { ngay: "2022-01-01", phien_ban: 1 },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/nhap_cu`,
              "POST",
              {
                ma_can_ho: apartments[0],
                quan_he: "CHU_HO",
                ngay: "2021-01-01",
                phien_ban: 2,
              },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/nhap_cu`,
              "POST",
              {
                ma_can_ho: apartments[0],
                quan_he: "CHU_HO",
                ngay: "2022-01-01",
                phien_ban: 2,
              },
              admin.cookie,
            )
          ).status,
          200,
        );
        await rows(
          pool,
          "UPDATE nguoi_dung SET dang_hoat_dong=0 WHERE ma_nguoi_dung=?",
          [resident.id],
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}`,
              "PATCH",
              { ...profileBody, ho_va_ten: "Tên đã sửa", phien_ban: 3 },
              admin.cookie,
            )
          ).status,
          200,
        );
        const detail = await request(
          `/cu_dan/${id}`,
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(detail.body.data.history.length, 3);
        assert.equal(detail.body.data.ma_nguoi_dung, resident.id);
        assert.equal(
          (
            await request(
              `/cu_dan?ma_can_ho=${apartments[0]}&trang_thai=DANG_O`,
              "GET",
              null,
              admin.cookie,
            )
          ).body.total,
          1,
        );
      },
    );
    await t.test(
      "same-day arrival, repeated transfers, departure and return preserve every stay",
      async () => {
        const day = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        const previous = new Date(`${day}T00:00:00Z`);
        previous.setUTCDate(previous.getUTCDate() - 1);
        const previousDay = previous.toISOString().slice(0, 10);
        const tomorrow = new Date(`${day}T00:00:00Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const created = await request(
          "/cu_dan",
          "POST",
          {
            ho_va_ten: "Cùng ngày " + suffix,
            so_dien_thoai: "0901234567",
            ma_can_ho: apartments[0],
            quan_he: "THANH_VIEN",
            ngay: day,
          },
          admin.cookie,
        );
        assert.equal(created.status, 201);
        const id = created.body.data.ma_cu_dan;
        residents.push(id);
        let revision = 0;
        for (const room of [apartments[1], apartments[2], apartments[0]]) {
          const result = await request(
            `/cu_dan/${id}/chuyen_can`,
            "POST",
            {
              ma_can_ho: room,
              quan_he: "THANH_VIEN",
              ngay: day,
              phien_ban: revision,
            },
            admin.cookie,
          );
          assert.equal(result.status, 200);
          revision++;
        }
        let detail = (await request(`/cu_dan/${id}`, "GET", null, admin.cookie))
          .body.data;
        assert.equal(detail.history.length, 4);
        assert.equal(detail.history[0].ma_can_ho, apartments[0]);
        assert.equal(detail.history.filter((s) => !s.den_ngay).length, 1);
        for (const stay of detail.history.slice(1)) {
          assert.equal(stay.tu_ngay, day);
          assert.equal(stay.den_ngay, day);
        }
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_can`,
              "POST",
              {
                ma_can_ho: apartments[1],
                quan_he: "THANH_VIEN",
                ngay: previousDay,
                phien_ban: revision,
              },
              admin.cookie,
            )
          ).status,
          422,
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_can`,
              "POST",
              {
                ma_can_ho: apartments[1],
                quan_he: "THANH_VIEN",
                ngay: tomorrow.toISOString().slice(0, 10),
                phien_ban: revision,
              },
              admin.cookie,
            )
          ).status,
          422,
        );
        await assert.rejects(
          rows(
            pool,
            "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
            [previousDay, detail.history[1].ma_lich_su_cu_tru],
          ),
          (error) => error.code === "ER_CHECK_CONSTRAINT_VIOLATED",
        );
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/chuyen_di`,
              "POST",
              { ngay: day, phien_ban: revision },
              admin.cookie,
            )
          ).status,
          200,
        );
        revision++;
        assert.equal(
          (
            await request(
              `/cu_dan/${id}/nhap_cu`,
              "POST",
              {
                ma_can_ho: apartments[2],
                quan_he: "NGUOI_THUE",
                ngay: day,
                phien_ban: revision,
              },
              admin.cookie,
            )
          ).status,
          200,
        );
        revision++;
        const race = await Promise.all(
          apartments
            .slice(0, 2)
            .map((room) =>
              request(
                `/cu_dan/${id}/chuyen_can`,
                "POST",
                {
                  ma_can_ho: room,
                  quan_he: "NGUOI_THUE",
                  ngay: day,
                  phien_ban: revision,
                },
                admin.cookie,
              ),
            ),
        );
        assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
        detail = (await request(`/cu_dan/${id}`, "GET", null, admin.cookie))
          .body.data;
        assert.equal(detail.history.length, 6);
        assert.equal(detail.history.filter((s) => !s.den_ngay).length, 1);
        assert.equal(detail.phien_ban, revision + 1);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    for (const id of residents) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
