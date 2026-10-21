import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("MySQL: building hierarchy, occupancy, filters and live changes", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex");
  const hash = await bcrypt.hash(password, 10);
  const accounts = [],
    apartments = [],
    residents = [];
  const a = suffix + "A",
    b = suffix + "B";
  async function request(path, cookie, method = "GET", body) {
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
  let admin, tech, resident;
  try {
    for (const role of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN", "CU_DAN"]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const user = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(user.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      if (role === "KY_THUAT_VIEN") tech = login.cookie;
      if (role === "CU_DAN") resident = login.cookie;
    }
    for (let i = 0; i < 24; i++) {
      const row = await rows(
        pool,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,?,?,?)",
        [
          `${suffix}-${i}`,
          i === 23 ? b : a,
          i === 22 ? 10 : 0,
          "65.50",
          i !== 0,
        ],
      );
      apartments.push(row.insertId);
    }
    for (let i = 0; i < 3; i++) {
      const row = await rows(
        pool,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
        [`Private ${suffix}-${i}`, "0901234567"],
      );
      residents.push(row.insertId);
      await rows(
        pool,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,den_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?,?)",
        [
          row.insertId,
          apartments[i === 2 ? 1 : 0],
          i === 2 ? "2020-02-01" : null,
          accounts[0],
        ],
      );
    }
    await t.test(
      "hierarchy and apartment directory reject other roles and guests",
      async () => {
        for (const path of [
          "/can_ho/so_do",
          `/can_ho?khoi=${a}&trang_thai=TRONG`,
        ]) {
          assert.equal((await request(path)).status, 401);
          for (const cookie of [tech, resident])
            assert.equal((await request(path, cookie)).status, 403);
        }
      },
    );
    await t.test(
      "counts apartments once, excludes ended stays and includes every floor",
      async () => {
        const response = await request("/can_ho/so_do", admin);
        assert.equal(response.status, 200);
        const data = response.body.data;
        const block = data.khoi.find((item) => item.khoi === a);
        assert.equal(block.so_can_ho, 23);
        assert.equal(block.co_nguoi_o, 1);
        assert.equal(block.trong, 22);
        assert.equal(block.so_cu_dan, 2);
        assert.deepEqual(
          block.tang.map((item) => item.tang),
          [10, 0],
        );
        assert.equal(block.tang[1].so_can_ho, 22);
        assert.equal(data.khoi.find((item) => item.khoi === b).trong, 1);
        for (const key of ["so_can_ho", "co_nguoi_o", "trong", "so_cu_dan"])
          assert.equal(
            data.tong[key],
            data.khoi.reduce((sum, item) => sum + item[key], 0),
          );
        assert.equal(
          data.tong.so_tang,
          data.khoi.reduce((sum, item) => sum + item.tang.length, 0),
        );
        const json = JSON.stringify(data);
        for (const secret of [
          "Private",
          "so_dien_thoai",
          "token",
          "mat_khau",
          "ho_va_ten",
        ])
          assert.ok(!json.includes(secret));
      },
    );
    await t.test(
      "floor/status filters are exact, paginated and validated",
      async () => {
        const prefix = `/can_ho?khoi=${a}&tang=0`;
        const first = (await request(prefix, admin)).body;
        const second = (await request(prefix + "&page=2", admin)).body;
        assert.equal(first.total, 22);
        assert.equal(first.data.length, 20);
        assert.equal(second.data.length, 2);
        assert.equal(
          new Set([...first.data, ...second.data].map((item) => item.ma_can_ho))
            .size,
          22,
        );
        const occupied = (await request(prefix + "&trang_thai=DANG_O", admin))
          .body;
        assert.equal(occupied.total, 1);
        assert.equal(occupied.data[0].so_cu_dan, 2);
        assert.equal(occupied.data[0].tinh_phi_dich_vu, 0);
        assert.equal(
          (await request(prefix + "&trang_thai=TRONG", admin)).body.total,
          21,
        );
        assert.equal(
          (await request(`/can_ho?khoi=${a}&tang=10`, admin)).body.total,
          1,
        );
        assert.equal(
          (await request(`/can_ho?khoi=${suffix}`, admin)).body.total,
          0,
        );
        const single = (
          await request(`/can_ho?ma_can_ho=${apartments[0]}`, admin)
        ).body;
        assert.equal(single.total, 1);
        assert.equal(single.data[0].ma_can_ho, apartments[0]);
        for (const query of [
          "tang=201",
          "trang_thai=KHAC",
          "ma_can_ho=x",
          "khoi=12345678901",
          "khoi=A&khoi=B",
        ])
          assert.equal((await request(`/can_ho?${query}`, admin)).status, 422);
      },
    );
    await t.test(
      "transfers change occupancy without rewriting history",
      async () => {
        for (const id of residents.slice(0, 2)) {
          const moved = await request(
            `/cu_dan/${id}/chuyen_can`,
            admin,
            "POST",
            {
              ma_can_ho: apartments[23],
              quan_he: "THANH_VIEN",
              ngay: "2021-01-01",
              phien_ban: 0,
            },
          );
          assert.equal(moved.status, 200);
        }
        const map = (await request("/can_ho/so_do", admin)).body.data;
        const oldBlock = map.khoi.find((item) => item.khoi === a);
        const newBlock = map.khoi.find((item) => item.khoi === b);
        assert.equal(oldBlock.co_nguoi_o, 0);
        assert.equal(oldBlock.so_cu_dan, 0);
        assert.equal(newBlock.co_nguoi_o, 1);
        assert.equal(newBlock.so_cu_dan, 2);
        assert.equal(
          (
            await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_can_ho=?", [
              apartments[0],
            ])
          ).length,
          2,
        );
      },
    );
    await t.test(
      "editing a room updates the derived structure without a second source",
      async () => {
        const changed = await request(
          `/can_ho/${apartments[22]}`,
          admin,
          "PATCH",
          {
            so_can_ho: `${suffix}-22`,
            khoi: b,
            tang: 3,
            dien_tich_m2: "70",
            tinh_phi_dich_vu: true,
            phien_ban: 0,
          },
        );
        assert.equal(changed.status, 200);
        const map = (await request("/can_ho/so_do", admin)).body.data;
        assert.deepEqual(
          map.khoi
            .find((item) => item.khoi === a)
            .tang.map((item) => item.tang),
          [0],
        );
        assert.deepEqual(
          map.khoi
            .find((item) => item.khoi === b)
            .tang.map((item) => item.tang),
          [3, 0],
        );
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
