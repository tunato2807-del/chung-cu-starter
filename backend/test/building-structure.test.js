import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("building catalog: empty parents, production provisioning, safe rename/delete and stale forms", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(3).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const codes = ["A", "B", "C", "D", "E", "L", "X"].map(
    (ending) => suffix + ending,
  );
  const [a, b, c, d, e, legacy, rollback] = codes;
  const accounts = [],
    apartments = [],
    residents = [];
  let invoice;
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
  async function request(path, cookie, method = "GET", body, csrf = true) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
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
  let admin, tech, resident, apt;
  try {
    for (const role of ["QUAN_TRI_VIEN", "KY_THUAT_VIEN", "CU_DAN"]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const row = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(row.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      if (role === "KY_THUAT_VIEN") tech = login.cookie;
      if (role === "CU_DAN") resident = login.cookie;
    }
    await t.test(
      "all catalog actions are management-only and writes require CSRF header",
      async () => {
        for (const [path, method, body] of [
          ["/cau_truc_toa_nha", "GET"],
          ["/cau_truc_toa_nha/khoi", "POST", { khoi: a }],
          [`/cau_truc_toa_nha/khoi/${a}`, "PATCH", { khoi: b, phien_ban: 0 }],
          [`/cau_truc_toa_nha/khoi/${a}`, "DELETE", { phien_ban: 0 }],
          [`/cau_truc_toa_nha/khoi/${a}/tang`, "POST", { tang: 0 }],
        ]) {
          assert.equal((await request(path, null, method, body)).status, 401);
          for (const cookie of [tech, resident])
            assert.equal(
              (await request(path, cookie, method, body)).status,
              403,
            );
        }
        assert.equal(
          (
            await request(
              "/cau_truc_toa_nha/khoi",
              admin,
              "POST",
              { khoi: a },
              false,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "configured blocks and floors exist with no apartments; duplicates and invalid numbers are rejected",
      async () => {
        assert.equal(
          (
            await request("/cau_truc_toa_nha/khoi", admin, "POST", {
              khoi: a,
              ten_khoi: "Khối Đông",
              mo_ta: "Có thể thêm căn sau",
            })
          ).status,
          201,
        );
        assert.equal(
          (await request("/cau_truc_toa_nha/khoi", admin, "POST", { khoi: b }))
            .status,
          201,
        );
        let map = (await request("/can_ho/so_do", admin)).body.data;
        assert.equal(map.khoi.find((item) => item.khoi === a).tang.length, 0);
        for (const number of [0, 9])
          assert.equal(
            (
              await request(`/cau_truc_toa_nha/khoi/${a}/tang`, admin, "POST", {
                tang: number,
                ten_tang: number === 0 ? "Tầng trệt" : "Tầng kỹ thuật",
              })
            ).status,
            201,
          );
        map = (await request("/can_ho/so_do", admin)).body.data;
        const block = map.khoi.find((item) => item.khoi === a);
        assert.equal(block.so_can_ho, 0);
        assert.equal(block.co_nguoi_o, 0);
        assert.deepEqual(
          block.tang.map((item) => item.tang),
          [9, 0],
        );
        assert.equal(block.tang[1].ten_tang, "Tầng trệt");
        for (const body of [
          { tang: -1 },
          { tang: 201 },
          { tang: "1.2" },
          { tang: 1, ten_tang: "x".repeat(101) },
        ])
          assert.equal(
            (
              await request(
                `/cau_truc_toa_nha/khoi/${a}/tang`,
                admin,
                "POST",
                body,
              )
            ).status,
            422,
          );
        assert.equal(
          (
            await request("/cau_truc_toa_nha/khoi", admin, "POST", {
              khoi: a.toUpperCase(),
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}/tang`, admin, "POST", {
              tang: 0,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${rollback}/tang`,
              admin,
              "POST",
              { tang: 0 },
            )
          ).status,
          404,
        );
        await assert.rejects(
          rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [a]),
          (error) => error.code === "ER_ROW_IS_REFERENCED_2",
        );
      },
    );
    await t.test(
      "existing mixed-case block text resolves to its catalog option",
      async () => {
        const room = await rows(
          pool,
          "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,9,60)",
          [`${suffix}-case`, a.toLowerCase()],
        );
        apartments.push(room.insertId);
        const selected = (
          await request(`/can_ho?ma_can_ho=${room.insertId}`, admin)
        ).body.data[0];
        assert.equal(selected.khoi_danh_muc, a);
        assert.equal(selected.khoi, a.toLowerCase());
      },
    );
    await t.test(
      "legacy API provisions parents atomically WITHOUT test fixture triggers",
      async () => {
        ddl(
          "DROP TRIGGER IF EXISTS test_apartment_parent; DROP TRIGGER IF EXISTS test_floor_parent;",
        );
        try {
          const created = await request("/can_ho", admin, "POST", {
            so_can_ho: `${suffix}-legacy`,
            khoi: legacy,
            tang: 7,
            dien_tich_m2: "60",
            tinh_phi_dich_vu: true,
          });
          assert.equal(created.status, 201);
          apartments.push(created.body.data.ma_can_ho);
          assert.equal(
            (
              await rows(
                pool,
                "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=7",
                [legacy],
              )
            ).length,
            1,
          );
          const failed = await request("/can_ho", admin, "POST", {
            so_can_ho: `${suffix}-legacy`,
            khoi: rollback,
            tang: 8,
            dien_tich_m2: "60",
            tinh_phi_dich_vu: true,
          });
          assert.equal(failed.status, 409);
          assert.equal(
            (
              await rows(pool, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [
                rollback,
              ])
            ).length,
            0,
          );
          await assert.rejects(
            rows(
              pool,
              "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2) VALUES (?,?,1,60)",
              [`${suffix}-bad`, rollback],
            ),
            (error) => error.code === "ER_NO_REFERENCED_ROW_2",
          );
        } finally {
          ddl(`CREATE TRIGGER test_floor_parent BEFORE INSERT ON tang_toa_nha FOR EACH ROW INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (NEW.khoi,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi;
CREATE TRIGGER test_apartment_parent BEFORE INSERT ON can_ho FOR EACH ROW INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (NEW.khoi,NEW.tang,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang;`);
        }
      },
    );
    await t.test(
      "selected floors must still exist at the selected version; no orphan on failure",
      async () => {
        const body = {
          so_can_ho: `${suffix}-strict`,
          khoi: a,
          tang: 0,
          dien_tich_m2: "60",
          tinh_phi_dich_vu: true,
          chon_cau_truc: true,
          phien_ban_tang: 0,
        };
        for (const override of [
          { tang: 8 },
          { phien_ban_tang: 9 },
          { khoi: rollback },
        ])
          assert.equal(
            (await request("/can_ho", admin, "POST", { ...body, ...override }))
              .status,
            409,
          );
        const created = await request("/can_ho", admin, "POST", body);
        assert.equal(created.status, 201);
        apt = created.body.data;
        apartments.push(apt.ma_can_ho);
        const person = await rows(
          pool,
          "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai) VALUES (?,?)",
          [suffix, "0901234567"],
        );
        residents.push(person.insertId);
        await rows(
          pool,
          "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,'THANH_VIEN','2020-01-01',?)",
          [person.insertId, apt.ma_can_ho, accounts[0]],
        );
        invoice = (
          await rows(
            pool,
            "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,tong_tien,loi_du_lieu,dau_van_tay,ma_nguoi_lap) VALUES (?,?,'2020-01','2020-01-01',1,0,0,0,100,'[]',?,?)",
            [`STRUCT-${suffix}`, apt.ma_can_ho, "a".repeat(64), accounts[0]],
          )
        ).insertId;
      },
    );
    await t.test(
      "used floors/blocks cannot be deleted through API or foreign keys",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}`, admin, "DELETE", {
              phien_ban: 0,
            })
          ).body.error.code,
          "STRUCTURE_IN_USE",
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${a}/tang/0`,
              admin,
              "DELETE",
              { phien_ban: 0 },
            )
          ).body.error.code,
          "STRUCTURE_IN_USE",
        );
        await assert.rejects(
          rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=? AND tang=0", [a]),
          (error) => error.code === "ER_ROW_IS_REFERENCED_2",
        );
      },
    );
    await t.test(
      "renumber and rename cascade while keeping account, stay, invoice IDs and history",
      async () => {
        const before = (
          await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
            residents[0],
          ])
        )[0];
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${a}/tang/0`,
              admin,
              "PATCH",
              { tang: 2, ten_tang: "Tầng hai", phien_ban: 0 },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${a}`, admin, "PATCH", {
              khoi: c,
              ten_khoi: "Khối mới",
              phien_ban: 0,
            })
          ).status,
          200,
        );
        const current = (
          await rows(pool, "SELECT * FROM can_ho WHERE ma_can_ho=?", [
            apt.ma_can_ho,
          ])
        )[0];
        assert.equal(current.khoi, c);
        assert.equal(current.tang, 2);
        assert.equal(current.phien_ban, 2);
        assert.equal(current.so_can_ho, apt.so_can_ho);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
              [invoice],
            )
          )[0].ma_can_ho,
          apt.ma_can_ho,
        );
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_can_ho_thanh_toan FROM nguoi_dung WHERE ma_can_ho_thanh_toan=?",
              [apt.ma_can_ho],
            )
          ).length,
          1,
        );
        assert.deepEqual(
          (
            await rows(pool, "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=?", [
              residents[0],
            ])
          )[0],
          before,
        );
        const stale = await request(
          `/can_ho/${apt.ma_can_ho}`,
          admin,
          "PATCH",
          { ...apt, khoi: a, tang: 0, tinh_phi_dich_vu: true },
        );
        assert.equal(stale.status, 409);
        assert.equal(
          (await rows(pool, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [a]))
            .length,
          0,
        );
        assert.equal(
          (
            await request("/can_ho", admin, "POST", {
              so_can_ho: `${suffix}-stale`,
              khoi: c,
              tang: 2,
              dien_tich_m2: 60,
              tinh_phi_dich_vu: true,
              chon_cau_truc: true,
              phien_ban_tang: 0,
            })
          ).status,
          409,
        );
      },
    );
    await t.test(
      "conflicts do not merge structures and concurrent edits have one winner",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${c}`, admin, "PATCH", {
              khoi: b,
              phien_ban: 1,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${c}/tang/2`,
              admin,
              "PATCH",
              { tang: 9, phien_ban: 2 },
            )
          ).status,
          409,
        );
        const race = await Promise.all(
          [d, e].map((code) =>
            request(`/cau_truc_toa_nha/khoi/${c}`, admin, "PATCH", {
              khoi: code,
              phien_ban: 1,
            }),
          ),
        );
        assert.deepEqual(race.map((item) => item.status).sort(), [200, 404]);
        const active = race[0].status === 200 ? d : e;
        assert.equal(
          (
            await rows(pool, "SELECT khoi FROM can_ho WHERE ma_can_ho=?", [
              apt.ma_can_ho,
            ])
          )[0].khoi,
          active,
        );
      },
    );
    await t.test(
      "empty floors and blocks may be deleted with current versions",
      async () => {
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${b}/tang`, admin, "POST", {
              tang: 1,
            })
          ).status,
          201,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${b}/tang/1`,
              admin,
              "DELETE",
              { phien_ban: 9 },
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/cau_truc_toa_nha/khoi/${b}/tang/1`,
              admin,
              "DELETE",
              { phien_ban: 0 },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(`/cau_truc_toa_nha/khoi/${b}`, admin, "DELETE", {
              phien_ban: 0,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/can_ho/so_do", admin)).body.data.khoi.some(
            (item) => item.khoi === b,
          ),
          false,
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (invoice)
      await rows(pool, "DELETE FROM hoa_don WHERE ma_hoa_don=?", [invoice]);
    for (const id of residents) {
      await rows(pool, "DELETE FROM lich_su_cu_tru WHERE ma_cu_dan=?", [id]);
      await rows(pool, "DELETE FROM cu_dan WHERE ma_cu_dan=?", [id]);
    }
    for (const id of apartments)
      await rows(pool, "DELETE FROM can_ho WHERE ma_can_ho=?", [id]);
    for (const code of codes) {
      await rows(pool, "DELETE FROM tang_toa_nha WHERE khoi=?", [code]);
      await rows(pool, "DELETE FROM khoi_toa_nha WHERE khoi=?", [code]);
    }
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
