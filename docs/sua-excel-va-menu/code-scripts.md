# Code scripts đầy đủ — sửa Excel và menu

[Quay lại hướng dẫn cập nhật](../cap-nhat-excel-va-menu-vscode.md). Chép nội dung vào đúng đường dẫn; đây là bản đầy đủ nghiệp vụ trên nhánh `codex/editorial-business-ui`.

## scripts/create-import-samples.js

```js
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { catalog } from "../backend/src/modules/data-exchange/catalog.js";
import { template } from "../backend/src/modules/data-exchange/import-files.js";
import { today } from "../backend/src/modules/billing/billing.validation.js";

const options = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const index = arg.indexOf("=");
    if (!arg.startsWith("--") || index < 0)
      throw new Error("Dùng --tag=TEN_MOI hoặc --out=duong-dan.");
    return [arg.slice(2, index), arg.slice(index + 1)];
  }),
);
for (const key of Object.keys(options))
  if (!["tag", "out"].includes(key))
    throw new Error(`Tùy chọn không có: ${key}`);
const day = today(),
  tag = options.tag || `T${day.slice(2).replaceAll("-", "")}`,
  directory = resolve(options.out || "samples/nhap-du-lieu"),
  start = `${day.slice(0, 7)}-01`,
  cutoff = new Date(
    new Date(`${day}T00:00:00Z`).getTime() -
      (day.endsWith("-01") ? 0 : 86400000),
  )
    .toISOString()
    .slice(0, 10),
  due = new Date(new Date(`${day}T00:00:00Z`).getTime() + 30 * 86400000)
    .toISOString()
    .slice(0, 10),
  records = [],
  manifest = {
    ngay_tao: day,
    tag,
    ngay_cu_tru: start,
    ngay_chot: cutoff,
    files: [],
  };
if (!/^[A-Z0-9]{2,10}$/.test(tag))
  throw new Error("Tag cần 2–10 chữ in hoa hoặc số, ví dụ TEST02.");
await mkdir(directory, { recursive: true });

function dataset(group) {
  const prefix = `${tag}${group}`,
    phonePrefix =
      "09" +
      String(
        createHash("sha256").update(tag).digest().readUInt32BE() % 1000000,
      ).padStart(6, "0") +
      (group === "X" ? "1" : "2");
  const apartment = (n) => `${prefix}0${n}`;
  return {
    can_ho: [
      {
        so_can_ho: apartment(1),
        khoi: `TEST${group}`,
        tang: "1",
        dien_tich_m2: "62.50",
        tinh_phi_dich_vu: "1",
      },
      {
        so_can_ho: apartment(2),
        khoi: `TEST${group}`,
        tang: "2",
        dien_tich_m2: "78",
        tinh_phi_dich_vu: "1",
      },
      {
        so_can_ho: apartment(3),
        khoi: `TEST${group}`,
        tang: "3",
        dien_tich_m2: "45.25",
        tinh_phi_dich_vu: "0",
      },
    ],
    cu_dan: [
      {
        ho_va_ten: `Nguyễn Minh An (TEST ${group})`,
        so_dien_thoai: `${phonePrefix}1`,
        so_can_ho: apartment(1),
        quan_he: "CHU_HO",
        ngay: start,
      },
      {
        ho_va_ten: `Trần Ngọc Mai (TEST ${group})`,
        so_dien_thoai: `${phonePrefix}2`,
        so_can_ho: apartment(1),
        quan_he: "THANH_VIEN",
        ngay: start,
      },
      {
        ho_va_ten: `Lê Quang Bình (TEST ${group})`,
        so_dien_thoai: `${phonePrefix}3`,
        so_can_ho: apartment(2),
        quan_he: "NGUOI_THUE",
        ngay: start,
      },
      {
        ho_va_ten: `Phạm Thu Hà (TEST ${group})`,
        so_dien_thoai: `${phonePrefix}4`,
        so_can_ho: apartment(3),
        quan_he: "CHU_HO",
        ngay: start,
      },
    ],
    phuong_tien: [
      {
        ma_cu_dan: "THAY_MA_CU_DAN_1",
        so_can_ho: apartment(1),
        loai_xe: "XE_MAY",
        bien_so: `99${prefix}01`,
        hang_xe: "Honda",
        mau_sac: "Trắng",
        ngay_dang_ky: start,
      },
      {
        ma_cu_dan: "THAY_MA_CU_DAN_2",
        so_can_ho: apartment(2),
        loai_xe: "O_TO",
        bien_so: `99${prefix}02`,
        hang_xe: "Toyota",
        mau_sac: "Bạc",
        ngay_dang_ky: start,
      },
      {
        ma_cu_dan: "THAY_MA_CU_DAN_1",
        so_can_ho: apartment(1),
        loai_xe: "XE_DAP",
        bien_so: "",
        hang_xe: "Thống Nhất",
        mau_sac: "Xanh",
        ngay_dang_ky: start,
      },
    ],
    chi_so: [1, 2, 3].flatMap((n) => [
      {
        so_can_ho: apartment(n),
        loai_dich_vu: "DIEN",
        ky_thanh_toan: cutoff.slice(0, 7),
        chi_so_cu: String(n * 1000),
        chi_so_moi: String(n * 1000 + [0, 65.5, 150, 235.125][n]),
        ngay_chot: cutoff,
        ky_dau: "1",
        ghi_chu: `Điện thử nghiệm ${group}, căn ${n}`,
      },
      {
        so_can_ho: apartment(n),
        loai_dich_vu: "NUOC",
        ky_thanh_toan: cutoff.slice(0, 7),
        chi_so_cu: String(n * 50),
        chi_so_moi: String(n * 50 + [0, 5.125, 8, 12.5][n]),
        ngay_chot: cutoff,
        ky_dau: "1",
        ghi_chu: `Nước thử nghiệm ${group}, căn ${n}`,
      },
    ]),
    thiet_bi: [
      {
        ma_tai_san: `${tag}-${group}-BOM`,
        ten_thiet_bi: `Máy bơm thử nghiệm ${group}`,
        loai: "MAY_BOM",
        vi_tri: `Tầng hầm khối TEST${group}`,
        so_serial: `SN-${tag}-${group}-01`,
        ngay_lap_dat: start,
        trang_thai: "DANG_SU_DUNG",
        chu_ky_ngay: "30",
        ngay_bao_tri_tiep_theo: due,
        nhac_truoc_ngay: "7",
        ghi_chu: "Dữ liệu giả lập để kiểm thử nhập tệp.",
      },
      {
        ma_tai_san: `${tag}-${group}-PCCC`,
        ten_thiet_bi: `Thiết bị PCCC thử nghiệm ${group}`,
        loai: "PCCC",
        vi_tri: `Sảnh khối TEST${group}`,
        so_serial: `SN-${tag}-${group}-02`,
        ngay_lap_dat: start,
        trang_thai: "TAM_DUNG",
        chu_ky_ngay: "90",
        ngay_bao_tri_tiep_theo: due,
        nhac_truoc_ngay: "14",
        ghi_chu: "Ví dụ thiết bị tạm dừng, vẫn có lịch theo dõi.",
      },
      {
        ma_tai_san: `${tag}-${group}-CAM`,
        ten_thiet_bi: `Camera thử nghiệm ${group}`,
        loai: "CAMERA",
        vi_tri: `Lối ra khối TEST${group}`,
        so_serial: `SN-${tag}-${group}-03`,
        ngay_lap_dat: start,
        trang_thai: "DANG_SU_DUNG",
        chu_ky_ngay: "",
        ngay_bao_tri_tiep_theo: "",
        nhac_truoc_ngay: "7",
        ghi_chu: "Ví dụ chưa cấu hình chu kỳ bảo trì.",
      },
    ],
  };
}
async function createFile(kind, format, items, file, negative = false) {
  let bytes;
  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await template(kind, "xlsx", {}));
    const sheet = wb.getWorksheet("Nhap");
    for (const item of items)
      sheet.addRow(
        catalog[kind].fields.map((field) => String(item[field.key] ?? "")),
      );
    sheet.autoFilter = {
      from: "A1",
      to: { row: sheet.rowCount, column: sheet.columnCount },
    };
    const guide = wb.getWorksheet("Huong dan");
    guide.addRow([]);
    guide.addRow([
      "Tệp đã điền dữ liệu giả lập. Nhập căn hộ trước cư dân; chỉ số sau căn hộ.",
    ]);
    if (kind === "phuong_tien")
      guide.addRow([
        "BẮT BUỘC: thay THAY_MA_CU_DAN_1 bằng mã Nguyễn Minh An và THAY_MA_CU_DAN_2 bằng mã Lê Quang Bình của nhóm tương ứng. Lấy mã từ tệp xuất cư dân.",
      ]);
    if (negative)
      guide.addRow([
        "TỆP CỐ Ý CÓ LỖI: chỉ dùng Xem trước để kiểm tra thông báo; một dòng hợp lệ và một dòng sai.",
      ]);
    bytes = Buffer.from(await wb.xlsx.writeBuffer());
  } else {
    throw new Error("Chỉ tạo tệp Excel .xlsx.");
  }
  await writeFile(join(directory, file), bytes);
  manifest.files.push({
    file,
    kind,
    format,
    rows: items.length,
    negative,
    needs_resident_ids: kind === "phuong_tien",
  });
  records.push({ file, kind, items });
}
const order = ["can_ho", "cu_dan", "phuong_tien", "chi_so", "thiet_bi"];
for (const [format, group] of [["xlsx", "X"]]) {
  const data = dataset(group);
  for (const [index, kind] of order.entries())
    await createFile(
      kind,
      format,
      data[kind],
      `${String(index + 1).padStart(2, "0")}_${kind}.${format}`,
    );
}
await createFile(
  "can_ho",
  "xlsx",
  [
    { ...dataset("X").can_ho[0], so_can_ho: `${tag}ERR01` },
    {
      ...dataset("X").can_ho[1],
      so_can_ho: `${tag}ERR02`,
      dien_tich_m2: "-10",
    },
  ],
  "90_loi_dien_tich_can_ho.xlsx",
  true,
);
await createFile(
  "thiet_bi",
  "xlsx",
  [
    { ...dataset("X").thiet_bi[0], ma_tai_san: `${tag}-ERR-BOM` },
    {
      ...dataset("X").thiet_bi[1],
      ma_tai_san: `${tag}-ERR-PCCC`,
      loai: "SAI_LOAI",
    },
  ],
  "91_loi_loai_thiet_bi.xlsx",
  true,
);
await writeFile(
  join(directory, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  join(directory, "du-lieu-mau.json"),
  JSON.stringify(records, null, 2) + "\n",
);
const docs = `# Bộ Excel đã điền sẵn để thử nhập

Tạo ngày **${day}**, mã bộ **${tag}**. Dữ liệu giả lập, không có tài khoản hay mật khẩu thật. Đây là các tệp đã điền sẵn; mẫu tải trên web là mẫu trống.

| Thứ tự | Phần dữ liệu | Tệp | Số dòng |
|---|---|---|---|
| 1 | Căn hộ | [01_can_ho.xlsx](01_can_ho.xlsx) | 3 |
| 2 | Cư dân | [02_cu_dan.xlsx](02_cu_dan.xlsx) | 4 |
| 3 | Phương tiện | [03_phuong_tien.xlsx](03_phuong_tien.xlsx) | 3 |
| 4 | Chỉ số điện nước | [04_chi_so.xlsx](04_chi_so.xlsx) | 6 |
| 5 | Thiết bị | [05_thiet_bi.xlsx](05_thiet_bi.xlsx) | 3 |

Trên GitHub, mở tệp và chọn Download raw file. Đăng nhập BQL → Nhập / xuất Excel → chọn đúng phần dữ liệu → chọn tệp → Xem trước → xác nhận nếu mọi dòng hợp lệ.

Nhập căn hộ trước cư dân và chỉ số. Phương tiện cần cư dân đang ở căn đã chọn: thay THAY_MA_CU_DAN_1 bằng mã Nguyễn Minh An, THAY_MA_CU_DAN_2 bằng mã Lê Quang Bình trong nhóm TEST X. Lấy mã từ Cư dân & cư trú hoặc tệp xuất cư dân; không dùng tên tài khoản CH... Sửa sheet Nhap rồi lưu tệp.

Ngày bắt đầu cư trú/đăng ký xe: ${start}; ngày chốt chỉ số: ${cutoff}; kỳ: ${cutoff.slice(0, 7)}. Giữ mật khẩu căn hộ vừa được cấp để bàn giao riêng. Xem trước không lưu dữ liệu; cả lô chỉ được lưu khi tất cả dòng hợp lệ. Tệp đã nhập được kiểm tra trùng và không ghi đè hồ sơ cũ.

## Tệp có lỗi để kiểm tra

- [90_loi_dien_tich_can_ho.xlsx](90_loi_dien_tich_can_ho.xlsx): một căn có diện tích âm. Kỳ vọng 2 dòng / 1 dòng lỗi.
- [91_loi_loai_thiet_bi.xlsx](91_loi_loai_thiet_bi.xlsx): một loại thiết bị sai. Kỳ vọng 2 dòng / 1 dòng lỗi.

Không nhập PDF. Không dùng tệp xuất Chi tiết làm tệp nhập; dùng mẫu có sheet Nhap. Dòng ví dụ ở Vi du không được nhập tự động.

Tạo bộ mới để tránh trùng dữ liệu đã thử:

\`\`\`powershell
node scripts/create-import-samples.js --tag=TEST02 --out=samples/TEST02
\`\`\`
`;
await writeFile(join(directory, "README.md"), docs);
console.log(
  `Đã tạo ${manifest.files.length} tệp Excel tại ${directory}. Mã bộ: ${tag}.`,
);
```

## backend/scripts/seed-acceptance.js

```js
// Synthetic acceptance data only. Never point this script at chung_cu or chung_cu_test.
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import QRCode from "qrcode";
import ExcelJS from "exceljs";
import { acceptanceOptions } from "../../scripts/create-acceptance-data.js";
import { pool, rows } from "../src/lib/db.js";
import * as structure from "../src/modules/residency/building-structure.service.js";
import * as residency from "../src/modules/residency/residency.service.js";
import * as accounts from "../src/modules/residency/apartment-accounts.service.js";
import * as vehicles from "../src/modules/vehicles/vehicles.service.js";
import * as billing from "../src/modules/billing/billing.service.js";
import { batchBills } from "../src/modules/billing/billing-batch.service.js";
import { batchBillActions } from "../src/modules/billing/billing-batch-actions.service.js";
import { today } from "../src/modules/billing/billing.validation.js";
import * as maintenance from "../src/modules/maintenance/maintenance.service.js";
import * as amenities from "../src/modules/amenities/amenities.service.js";
import * as announcements from "../src/modules/announcements/announcements.service.js";
import * as treasury from "../src/modules/treasury/treasury.service.js";
import * as qr from "../src/modules/qr/qr.service.js";
import * as incidents from "../src/modules/incidents/incidents.service.js";
import { importFile } from "../src/modules/data-exchange/import.service.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";
import { template } from "../src/modules/data-exchange/import-files.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const day = today();
const shiftDay = (date, n) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);
const month = (offset) => {
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
};
const endMonth = (value) => {
  const date = new Date(`${value}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
};
const beginning = `${month(-13)}-01`;
const stamp = (date, hour = "02") => `${date} ${hour}:00:00`;
const options = acceptanceOptions([
  `--database=${process.env.DB_NAME || ""}`,
  `--origin=${process.env.ACCEPTANCE_ORIGIN || "https://localhost:5173"}`,
]);
const out = path.join(root, "backend/storage/acceptance", options.database);
const manifest = {
  database: options.database,
  ngay_tao: day,
  origin: options.origin,
  trang_thai: "DANG_TAO",
  accounts: [],
  qr: [],
  invoices: [],
  scenarios: [],
  checks: [],
  files: [],
};
const saveManifest = () =>
  writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { mode: 0o600 },
  );
const scenario = (feature, steps, expected) =>
  manifest.scenarios.push({ feature, steps, expected });
const one = async (table, key, id) =>
  (await rows(pool, `SELECT * FROM ${table} WHERE ${key}=?`, [id]))[0];
async function versioned(table, key, id, body) {
  return { phien_ban: (await one(table, key, id)).phien_ban, ...body };
}
let admin, tech, otherTech, residentUser;
const apartments = [],
  residents = [],
  equipment = [],
  locations = [];

async function freshDatabase() {
  const tables = await rows(
    pool,
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'",
  );
  if (tables.length !== 38)
    throw new Error(
      "Cần đúng schema 018 với 38 bảng. Kiểm tra migration trước khi tạo dữ liệu.",
    );
  for (const { name } of tables) {
    if (["schema_migrations", "loai_phi", "quy_tai_chinh"].includes(name))
      continue;
    if (!/^[a-z0-9_]+$/.test(name)) throw new Error("Tên bảng không hỗ trợ.");
    const [count] = await rows(pool, `SELECT COUNT(*) AS n FROM \`${name}\``);
    if (count.n)
      throw new Error(
        `Database đã có dữ liệu ở ${name}. Dừng để giữ nguyên. Dùng --database=chung_cu_nghiem_thu_<mã mới> cho bộ mới.`,
      );
  }
  const [[funds], [types]] = await Promise.all([
    rows(pool, "SELECT COUNT(*) AS n FROM quy_tai_chinh"),
    rows(pool, "SELECT COUNT(*) AS n FROM loai_phi"),
  ]);
  if (funds.n !== 1 || types.n !== 6)
    throw new Error(
      "Database không còn ở trạng thái migration mới, chưa tạo dữ liệu.",
    );
  await mkdir(path.dirname(out), { recursive: true });
  // Refuse to overwrite any previous seed credentials, including partial runs.
  await mkdir(out);
  await saveManifest();
}
async function createUser(name, phone, role, active = true) {
  const password = randomBytes(18).toString("base64url");
  manifest.accounts.push({
    name,
    login: phone,
    password,
    role,
    kind: "CA_NHAN",
    active,
  });
  await saveManifest();
  const r = await rows(
    pool,
    "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,chuyen_mon,mat_khau_ma_hoa,dang_hoat_dong) VALUES (?,?,?,?,?,?)",
    [
      name,
      phone,
      role,
      role === "KY_THUAT_VIEN" ? "Điện nước và thiết bị" : "",
      await bcrypt.hash(password, 12),
      active,
    ],
  );
  return one("nguoi_dung", "ma_nguoi_dung", r.insertId);
}
async function seedHousing() {
  admin = await createUser("NT · Ban quản lý", "0909000001", "QUAN_TRI_VIEN");
  tech = await createUser(
    "NT · Kỹ thuật điện nước",
    "0909000002",
    "KY_THUAT_VIEN",
  );
  otherTech = await createUser(
    "NT · Kỹ thuật thang máy",
    "0909000003",
    "KY_THUAT_VIEN",
  );
  residentUser = await createUser(
    "NT · Trần Ngọc Mai (cá nhân)",
    "0909000004",
    "CU_DAN",
  );
  await createUser(
    "NT · Nhân sự đã khóa",
    "0909000005",
    "KY_THUAT_VIEN",
    false,
  );
  for (const block of ["A", "B", "C"]) {
    await structure.saveBlock(null, {
      khoi: block,
      ten_khoi: `Khối ${block} nghiệm thu`,
      mo_ta:
        block === "C"
          ? "Khối trống để thử danh mục độc lập"
          : "Dữ liệu giả lập",
    });
    if (block === "C") continue;
    for (let floor = 1; floor <= (block === "A" ? 4 : 3); floor++) {
      await structure.saveFloor(block, null, {
        tang: floor,
        ten_tang: `Tầng ${floor}`,
        mo_ta: "Nghiệm thu",
      });
      if (floor === 4) continue;
      for (let n = 1; n <= 3; n++) {
        const apartment = await residency.saveApartment(
          null,
          {
            so_can_ho: `${block}${floor}0${n}`,
            khoi: block,
            tang: floor,
            dien_tich_m2: ["65.50", "80", "52.25"][n - 1],
            tinh_phi_dich_vu: !(block === "B" && floor === 3),
          },
          admin,
        );
        apartments.push(apartment);
      }
    }
  }
  const names = [
    "Nguyễn Minh An",
    "Lê Quang Bình",
    "Phạm Thu Hà",
    "Võ Thành Nam",
    "Đặng Ngọc Lan",
    "Bùi Gia Huy",
    "Đỗ Thanh Tâm",
    "Ngô Hải Yến",
    "Lý Quốc Bảo",
    "Trương Minh Tú",
  ];
  for (const [i, name] of names.entries()) {
    const apt = apartments[i < 6 ? i : i + 1];
    residents.push(
      await residency.saveResident(
        null,
        {
          ho_va_ten: `NT · ${name}`,
          so_dien_thoai: `090901${String(i + 1).padStart(4, "0")}`,
          ma_can_ho: apt.ma_can_ho,
          quan_he: "CHU_HO",
          ngay: beginning,
        },
        admin,
      ),
    );
  }
  residents.push(
    await residency.saveResident(
      null,
      {
        ho_va_ten: residentUser.ho_va_ten,
        so_dien_thoai: residentUser.so_dien_thoai,
        ma_nguoi_dung: residentUser.ma_nguoi_dung,
        ma_can_ho: apartments[0].ma_can_ho,
        quan_he: "THANH_VIEN",
        ngay: beginning,
      },
      admin,
    ),
  );
  const moving = await residency.saveResident(
    null,
    {
      ho_va_ten: "NT · Cư dân chuyển căn kèm xe",
      so_dien_thoai: "0909010091",
      ma_can_ho: apartments[12].ma_can_ho,
      quan_he: "NGUOI_THUE",
      ngay: beginning,
    },
    admin,
  );
  const stay = (await residency.residentDetail(moving.ma_cu_dan)).history[0];
  await vehicles.create(
    {
      ma_cu_dan: moving.ma_cu_dan,
      ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
      loai_xe: "XE_MAY",
      bien_so: "99NT00991",
      hang_xe: "Honda",
      mau_sac: "Xanh",
      ngay_dang_ky: beginning,
    },
    admin,
  );
  await residency.changeStay(
    moving.ma_cu_dan,
    "chuyen_can",
    {
      ngay: day,
      phien_ban: moving.phien_ban,
      ma_can_ho: apartments[13].ma_can_ho,
      quan_he: "NGUOI_THUE",
      chuyen_phuong_tien: true,
    },
    admin,
  );
  residents.push(moving);
  const leaving = await residency.saveResident(
    null,
    {
      ho_va_ten: "NT · Cư dân đã chuyển đi",
      so_dien_thoai: "0909010092",
      ma_can_ho: apartments[14].ma_can_ho,
      quan_he: "CHU_HO",
      ngay: beginning,
    },
    admin,
  );
  await residency.changeStay(
    leaving.ma_cu_dan,
    "chuyen_di",
    { ngay: shiftDay(day, -7), phien_ban: leaving.phien_ban },
    admin,
  );
  residents.push(leaving);
  for (let i = 0; i < 6; i++) {
    const stay = (await residency.residentDetail(residents[i].ma_cu_dan))
      .history[0];
    for (let n = 0; n <= i % 3; n++)
      await vehicles.create(
        {
          ma_cu_dan: residents[i].ma_cu_dan,
          ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
          loai_xe: ["XE_MAY", "O_TO", "XE_DAP"][n],
          bien_so: n === 2 ? "" : `99NT${i}00${n}1`,
          hang_xe: ["Honda", "Toyota", "Thống Nhất"][n],
          mau_sac: "Trắng",
          ngay_dang_ky: beginning,
        },
        admin,
      );
  }
  scenario(
    "Nhà ở, cư trú và xe",
    "Sơ đồ: khối C trống, tầng A4 trống. Căn A101 có chủ hộ và thành viên. Tìm cư dân chuyển căn/chuyển đi; xem lịch sử và xe.",
    "Đúng số căn/người; xe chuyển từ B201 sang B202, lịch sử cũ không mất.",
  );
}

const payment = {
  ma_ngan_hang: "970422",
  so_tai_khoan: "000000000000",
  ten_nguoi_nhan: "TAI KHOAN GIA LAP KHONG CHUYEN TIEN",
};
async function batchAction(ids, operation) {
  const items = [];
  for (const id of ids) {
    const bill = await one("hoa_don", "ma_hoa_don", id);
    items.push({ ma_hoa_don: id, phien_ban: bill.phien_ban });
  }
  const body = {
    thao_tac: operation,
    hoa_don: items,
    ...payment,
    han_thanh_toan: shiftDay(day, 10),
  };
  const preview = await batchBillActions(body, admin);
  if (!preview.xac_nhan)
    throw new Error(
      `Không xem trước được lô ${operation}: ${JSON.stringify(preview.rows)}`,
    );
  return batchBillActions(
    { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
    admin,
    true,
  );
}
async function seedBilling() {
  for (const [loai_phi, don_gia] of [
    ["PHI_QUAN_LY", "12000"],
    ["GUI_XE_MAY", "100000"],
    ["GUI_O_TO", "1200000"],
    ["GUI_XE_DAP", "30000"],
    ["TIEN_NUOC", "15000"],
    ["TIEN_DIEN", "0"],
  ])
    await billing.createRate(
      {
        loai_phi,
        don_gia,
        tu_ngay: beginning,
        ...(loai_phi === "TIEN_DIEN"
          ? {
              cach_tinh: "BAC_THANG",
              thue_gtgt: "8",
              bac_dien: [50, 100, 200, 300, 400, null].map((den_kwh, i) => ({
                den_kwh,
                don_gia: [1984, 2050, 2380, 2998, 3350, 3460][i].toString(),
              })),
            }
          : {}),
      },
      admin,
    );
  const counters = Array.from({ length: 6 }, () => ({ DIEN: 1000, NUOC: 100 }));
  for (let offset = -12; offset <= 0; offset++) {
    const period = month(offset),
      cutoff = offset ? endMonth(period) : day;
    for (let i = 0; i < 6; i++)
      for (const type of ["DIEN", "NUOC"]) {
        const used =
          type === "DIEN"
            ? [35, 75, 150, 250, 350, 450][i] + ((offset + 12) % 3)
            : 5 + i;
        await billing.saveMeter(
          {
            ma_can_ho: apartments[i].ma_can_ho,
            loai_dich_vu: type,
            ky_thanh_toan: period,
            ngay_chot: cutoff,
            chi_so_cu: counters[i][type].toString(),
            chi_so_moi: (counters[i][type] + used).toString(),
            ky_dau: offset === -12,
            ghi_chu: "Chỉ số nghiệm thu giả lập",
          },
          admin,
        );
        counters[i][type] += used;
      }
    const body = {
      ma_can_ho: apartments.slice(0, 6).map((apt) => apt.ma_can_ho),
      ky_thanh_toan: period,
      ngay_chot_phi: cutoff,
      tinh_dien: true,
      tinh_nuoc: true,
      tinh_xe: true,
    };
    const preview = await batchBills(body, admin);
    if (!preview.xac_nhan)
      throw new Error(
        `Lỗi dữ liệu lô hóa đơn: ${JSON.stringify(preview.rows)}`,
      );
    const batch = await batchBills(
      { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
      admin,
      true,
    );
    const ids = batch.hoa_don.map((bill) => bill.ma_hoa_don);
    await batchAction(offset ? ids : ids.slice(1), "DUYET");
    await batchAction(offset ? ids : ids.slice(2), "GUI");
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if ((offset && i < 4) || (!offset && i === 4)) {
        const b = await one("hoa_don", "ma_hoa_don", id);
        await billing.action(
          id,
          "xac_nhan_thanh_toan",
          {
            phien_ban: b.phien_ban,
            so_tien: b.tong_tien,
            ma_tham_chieu: `NT-${period}-${i}`,
          },
          admin,
        );
      }
      if (!offset && i === 5) {
        await billing.action(
          id,
          "huy",
          await versioned("hoa_don", "ma_hoa_don", id, {
            ly_do: "Hủy mẫu để thử hóa đơn thay thế",
          }),
          admin,
        );
        await billing.action(
          id,
          "lap_thay_the",
          await versioned("hoa_don", "ma_hoa_don", id, {}),
          admin,
        );
      }
      // Historical timestamps are synthetic fixtures; amounts/statuses were made by real services.
      const recorded = offset
        ? shiftDay(
            cutoff,
            -Math.min(5, new Date(`${cutoff}T00:00:00Z`).getUTCDate() - 1),
          )
        : day;
      await rows(
        pool,
        "UPDATE hoa_don SET ngay_tao=?,ngay_duyet=IF(ngay_duyet IS NULL,NULL,?),ngay_gui=IF(ngay_gui IS NULL,NULL,?),ngay_thanh_toan=IF(ngay_thanh_toan IS NULL,NULL,?),han_thanh_toan=IF(trang_thai IN ('DA_GUI','DA_THANH_TOAN'),?,han_thanh_toan) WHERE ma_hoa_don=?",
        [
          stamp(recorded),
          stamp(recorded, "03"),
          stamp(recorded, "04"),
          stamp(recorded, "05"),
          offset ? cutoff : shiftDay(day, 10),
          id,
        ],
      );
      await rows(
        pool,
        "UPDATE lich_su_hoa_don SET ngay_tao=? WHERE ma_hoa_don=?",
        [stamp(recorded, "05"), id],
      );
      manifest.invoices.push({
        id,
        apartment: apartments[i].so_can_ho,
        period,
        ...(
          await rows(
            pool,
            "SELECT trang_thai,tong_tien,han_thanh_toan FROM hoa_don WHERE ma_hoa_don=?",
            [id],
          )
        )[0],
      });
    }
    console.log(`  Hóa đơn kỳ ${period}`);
  }
  const unpaid = (
    await rows(
      pool,
      "SELECT * FROM hoa_don WHERE trang_thai='DA_GUI' ORDER BY ky_thanh_toan LIMIT 1",
    )
  )[0];
  await announcements.remindBill(
    unpaid.ma_hoa_don,
    { phien_ban: unpaid.phien_ban },
    admin,
  );
  scenario(
    "Giá, chỉ số, hóa đơn, nhắc phí",
    "Xem A101–A203, 13 kỳ. Kỳ hiện tại có nháp/đã duyệt/đã gửi/đã thu/hủy và bản thay thế. Mở A101 xem hóa đơn cũ và nhắc phí.",
    "Điện qua đủ 6 bậc, xe theo từng loại; hóa đơn cũ có công nợ quá hạn. VietQR dùng STK giả lập, tuyệt đối không chuyển tiền.",
  );
}

let scene, completion;
async function seedAssetsAndReports() {
  await mkdir(path.join(out, "anh"));
  const makeImage = async (label, color, file) => {
    const svg = `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="640" fill="${color}"/><rect x="90" y="140" width="780" height="370" fill="#fff"/><text x="140" y="260" font-size="38">DU LIEU NGHIEM THU GIA LAP</text><text x="140" y="340" font-size="32">${label}</text><text x="140" y="420" font-size="24">${day} - khong phai anh hien truong that</text></svg>`;
    const buffer = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    await writeFile(path.join(out, "anh", file), buffer);
    return { originalname: file, mimetype: "image/jpeg", buffer };
  };
  scene = await makeImage(
    "MO PHONG SU CO - thiet bi can kiem tra",
    "#edc9b8",
    "hien-truong.jpg",
  );
  completion = await makeImage(
    "MO PHONG HOAN THANH - da kiem tra",
    "#b8ded4",
    "nghiem-thu.jpg",
  );
  for (let i = 0; i < 8; i++) {
    const e = await maintenance.createEquipment(
      {
        ma_tai_san: `NT-TB-${String(i + 1).padStart(2, "0")}`,
        ten_thiet_bi: [
          "Thang máy A",
          "Máy bơm A",
          "Tủ PCCC A",
          "Tủ điện B",
          "Camera sảnh",
          "Đồng hồ nước",
          "Quạt thông gió tạm dừng",
          "Máy bơm đã ngừng",
        ][i],
        loai: [
          "THANG_MAY",
          "MAY_BOM",
          "PCCC",
          "DIEN",
          "CAMERA",
          "NUOC",
          "KHAC",
          "MAY_BOM",
        ][i],
        vi_tri: i < 4 ? "Khối A · tầng 1" : "Khối B · tầng 1",
        so_serial: `NT-SN-${i}`,
        ngay_lap_dat: beginning,
        trang_thai:
          i === 7 ? "NGUNG_SU_DUNG" : i === 6 ? "TAM_DUNG" : "DANG_SU_DUNG",
        chu_ky_ngay: i === 5 ? null : 30,
        ngay_bao_tri_tiep_theo:
          i === 5 ? null : shiftDay(day, [-10, -2, 0, 3, 30, 0, 5, 0][i]),
        nhac_truoc_ngay: 7,
        ghi_chu: "Dữ liệu tài sản giả lập để nghiệm thu",
      },
      admin,
    );
    equipment.push(await one("thiet_bi", "ma_thiet_bi", e.ma_thiet_bi));
  }
  for (let i = 0; i < 5; i++)
    locations.push(
      await qr.create(
        {
          ten_vi_tri: `NT · ${["Thang máy A", "Máy bơm A", "Sảnh A", "Bãi xe B", "Mã đã vô hiệu"][i]}`,
          loai: i < 2 ? "THIET_BI" : "KHU_VUC",
          ma_thiet_bi: i < 2 ? equipment[i].ma_thiet_bi : null,
          mo_ta: "Vị trí nghiệm thu giả lập",
        },
        admin,
      ),
    );
  const reportIds = [];
  const states = [
    "MOI",
    "DA_PHAN_CONG",
    "DANG_XU_LY",
    "DA_XU_LY",
    "DA_DONG",
    "TU_CHOI",
    "TRUNG",
    "DANG_XU_LY",
  ];
  for (let i = 0; i < 32; i++) {
    const location = locations[i % 4],
      target = states[i % states.length];
    const receipt = await incidents.submit(
      {
        token_qr: location.token_qr,
        phien_ban_qr: location.phien_ban,
        khoa_yeu_cau: randomUUID(),
        tieu_de: `NT-${String(i + 1).padStart(2, "0")} · ${target} · cần kiểm tra thiết bị/khu vực`,
        noi_dung:
          "Dữ liệu giả lập: phát hiện tiếng ồn/rò nước tại vị trí. Đề nghị Ban quản lý kiểm tra và phản hồi.",
        ten_nguoi_gui: i % 2 ? residents[0].ho_va_ten : residentUser.ho_va_ten,
        so_dien_thoai: `090902${String(i + 1).padStart(4, "0")}`,
        loai_su_co: incidents.categories[i % incidents.categories.length],
        xac_nhan_gui: true,
      },
      [scene],
      i % 2 ? null : residentUser,
      "127.0.0.1",
    );
    const report = (
      await rows(pool, "SELECT * FROM phan_anh WHERE ma_tra_cuu=?", [
        receipt.ma_tra_cuu,
      ])
    )[0];
    const id = report.ma_phan_anh;
    reportIds.push(id);
    const change = async (state, actor, files = [], extra = {}) =>
      incidents.transition(
        id,
        await versioned("phan_anh", "ma_phan_anh", id, {
          trang_thai: state,
          ghi_chu: "Ghi chú nghiệm thu giả lập",
          noi_dung_cong_khai: "Đã cập nhật tiến độ xử lý.",
          ...extra,
        }),
        files,
        actor,
      );
    if (
      ["DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY", "DA_DONG"].includes(target)
    ) {
      await incidents.assign(
        id,
        await versioned("phan_anh", "ma_phan_anh", id, {
          ma_ky_thuat_vien: tech.ma_nguoi_dung,
          do_uu_tien: i % 3 ? "TRUNG_BINH" : "KHAN_CAP",
          ghi_chu: "Phân công nghiệm thu",
        }),
        admin,
      );
      if (target !== "DA_PHAN_CONG") await change("DANG_XU_LY", tech);
      if (["DA_XU_LY", "DA_DONG"].includes(target) || i % 8 === 7) {
        await change("DA_XU_LY", tech, [completion]);
        if (target === "DA_DONG") await change("DA_DONG", admin);
        if (i % 8 === 7)
          await change("DANG_XU_LY", admin, [], {
            ghi_chu: "Trả lại, cần ảnh góc khác và kiểm tra bổ sung",
          });
      }
    } else if (target === "TU_CHOI") await change("TU_CHOI", admin);
    else if (target === "TRUNG")
      await change("TRUNG", admin, [], { ma_phan_anh_goc: reportIds[2] });
    const date = shiftDay(
      day,
      -[0, 1, 3, 7, 14, 25, 60, 120, 240, 365][i % 10],
    );
    await rows(
      pool,
      "UPDATE phan_anh SET ngay_tao=?,ngay_dong=IF(trang_thai='DA_DONG',?,NULL) WHERE ma_phan_anh=?",
      [stamp(date), stamp(date, "05"), id],
    );
    await rows(
      pool,
      "UPDATE lich_su_phan_anh SET ngay_tao=TIMESTAMPADD(SECOND,ma_lich_su_phan_anh,?) WHERE ma_phan_anh=?",
      [stamp(date), id],
    );
    manifest.scenarios.push({
      feature: `Phản ánh NT-${String(i + 1).padStart(2, "0")}`,
      id,
      status: target,
      phone: report.so_dien_thoai_nguoi_gui,
      lookup: receipt.ma_tra_cuu,
      url: "/tra-cuu",
    });
  }
  const linked = await qr.detail(locations[0].ma_vi_tri_qr);
  await incidents.assign(
    reportIds[1],
    await versioned("phan_anh", "ma_phan_anh", reportIds[1], {
      ma_ky_thuat_vien: otherTech.ma_nguoi_dung,
      do_uu_tien: "CAO",
      ghi_chu: "Phân công lại để nghiệm thu quyền giữa hai kỹ thuật viên",
    }),
    admin,
  );
  await qr.link(
    linked.ma_vi_tri_qr,
    {
      phien_ban: linked.phien_ban,
      ma_thiet_bi: equipment[2].ma_thiet_bi,
      xac_nhan_doi_lien_ket: true,
    },
    admin,
  );
  await qr.setActive(locations[4].ma_vi_tri_qr, {
    phien_ban: locations[4].phien_ban,
    dang_hoat_dong: false,
  });
  for (const original of locations) {
    const location = await qr.detail(original.ma_vi_tri_qr);
    const url = `${options.origin}/r/${location.token_qr}`,
      file = `qr-${location.ma_vi_tri_qr}.png`;
    await QRCode.toFile(path.join(out, file), url, { width: 420, margin: 3 });
    manifest.qr.push({
      name: location.ten_vi_tri,
      url,
      file,
      active: Boolean(location.dang_hoat_dong),
    });
  }
  for (let i = 0; i < 7; i++) {
    const e = equipment[i],
      j = await maintenance.createJob(
        e.ma_thiet_bi,
        {
          loai: i === 5 ? "DOT_XUAT" : "DINH_KY",
          phien_ban_thiet_bi: e.phien_ban,
          khoa_yeu_cau: randomUUID(),
          ma_ky_thuat_vien: i ? tech.ma_nguoi_dung : null,
          tieu_de: "Kiểm tra đột xuất nghiệm thu",
          noi_dung: "Kiểm tra thiết bị theo tình huống giả lập",
          ngay_den_han: shiftDay(day, 2),
        },
        admin,
      );
    const id = j.ma_phieu_bao_tri;
    const act = (action, user, extra = {}) =>
      versioned("phieu_bao_tri", "ma_phieu_bao_tri", id, extra).then((body) =>
        maintenance.act(id, action, body, user),
      );
    if (i >= 2 && i <= 5) await act("bat_dau", tech);
    if (i >= 3 && i <= 5)
      await act("bao_cao", tech, {
        ngay_thuc_hien: day,
        ket_qua: "Đã vệ sinh, kiểm tra vận hành và chạy thử an toàn (giả lập).",
      });
    if (i === 4)
      await act("nghiem_thu", admin, {
        nhan_xet: "Đạt yêu cầu theo kịch bản nghiệm thu",
      });
    if (i === 5)
      await act("tra_lai", admin, {
        ly_do: "Bổ sung phép đo và thử lại thiết bị",
      });
    if (i === 6)
      await act("huy", admin, {
        ly_do: "Hủy phiếu thử theo kế hoạch nghiệm thu",
      });
  }
  scenario(
    "QR, ảnh, phản ánh và thiết bị",
    "Mở các QR PNG, đăng nhập cư dân xem phản ánh cá nhân; tra cứu bằng mã + SĐT trong manifest. QR thang máy đã đổi sang PCCC sau khi tạo phản ánh.",
    "Phản ánh cũ giữ thiết bị lúc gửi; có đầy đủ trạng thái và lượt bị trả lại. Ảnh có chữ giả lập. QR cuối bị vô hiệu.",
  );
  scenario(
    "Bảo trì",
    "Thiết bị NT-TB-01..08; lọc quá hạn/sắp hạn/chưa lịch/ngừng; mở phiếu theo trạng thái.",
    "Có MOI, DA_PHAN_CONG, DANG_THUC_HIEN, CHO_NGHIEM_THU, HOAN_THANH, HUY và một lượt bị trả lại.",
  );
}

async function seedBookingsAnnouncementsFunds() {
  for (let i = 0; i < 3; i++) {
    const f = await amenities.saveFacility(
      null,
      {
        ten_tien_ich: [
          "NT · Phòng sinh hoạt",
          "NT · Sân thể thao",
          "NT · Hồ bơi tạm ngừng",
        ][i],
        vi_tri: "Khu tiện ích chung cư",
        mo_ta: "Tiện ích giả lập, không thu phí",
        suc_chua: [40, 10, 20][i],
        gio_mo: "06:00",
        gio_dong: "22:00",
        toi_da_phut: 120,
        dat_truoc_ngay: 30,
        dang_mo: i !== 2,
      },
      admin,
    );
    if (i === 2) continue;
    for (let n = 0; n < 4; n++) {
      const facility = await amenities.facilityDetail(f.ma_tien_ich);
      const b = await amenities.createBooking(
        f.ma_tien_ich,
        {
          ngay: shiftDay(day, n + 1),
          gio_bat_dau: "09:00",
          gio_ket_thuc: "10:00",
          so_nguoi: 5,
          ghi_chu: "Lịch nghiệm thu giả lập",
          phien_ban_tien_ich: facility.phien_ban,
          khoa_yeu_cau: randomUUID(),
        },
        residentUser,
      );
      if (n)
        await amenities.act(
          b.ma_dat_lich,
          [null, "duyet", "tu_choi", "huy"][n],
          await versioned("dat_lich_tien_ich", "ma_dat_lich", b.ma_dat_lich, {
            ghi_chu: "Quyết định theo kịch bản nghiệm thu",
          }),
          n === 3 ? residentUser : admin,
        );
    }
  }
  for (let i = 0; i < 5; i++) {
    const n = await announcements.create(
      {
        tieu_de: `NT · ${["Lịch vệ sinh chung cư", "Kiểm tra điện khối A", "Thông báo căn A101", "Bản nháp chưa phát hành", "Thông báo đã thu hồi"][i]}`,
        noi_dung:
          "Dữ liệu nghiệm thu giả lập. Vui lòng theo dõi hướng dẫn của Ban quản lý trên cổng cư dân.",
        pham_vi: ["TOAN_BO", "KHOI", "CAN_HO", "TOAN_BO", "TOAN_BO"][i],
        khoi: "A",
        ma_can_ho: apartments[0].ma_can_ho,
        muc_do: i % 2 ? "QUAN_TRONG" : "THUONG",
      },
      admin,
    );
    if (i !== 3)
      await announcements.change(
        n.ma_thong_bao,
        "phat_hanh",
        await versioned("thong_bao", "ma_thong_bao", n.ma_thong_bao, {}),
        admin,
      );
    if (i === 0) await announcements.markRead(n.ma_thong_bao, residentUser);
    if (i === 4)
      await announcements.change(
        n.ma_thong_bao,
        "thu_hoi",
        await versioned("thong_bao", "ma_thong_bao", n.ma_thong_bao, {
          ly_do: "Thu hồi thông báo giả lập",
        }),
        admin,
      );
  }
  const fund = await treasury.saveFund(
    null,
    {
      ten_quy: "NT · Quỹ bảo trì mẫu",
      mo_ta: "Quỹ giả lập, không đại diện tiền thật",
      dang_hoat_dong: true,
    },
    admin,
  );
  const amounts = ["20000000", "1500000", "700000", "300000", "500000"];
  for (let i = 0; i < amounts.length; i++) {
    const p = await treasury.create(
      {
        ma_quy: fund.ma_quy,
        loai: i === 0 ? "THU" : "CHI",
        nhom: i === 0 ? "BO_SUNG_QUY" : "BAO_TRI",
        ngay_hach_toan: shiftDay(day, -(5 - i)),
        so_tien: amounts[i],
        doi_tac: "Đơn vị giả lập nghiệm thu",
        dien_giai: "Thu chi mẫu để thử ghi sổ, chứng từ và đảo phiếu",
        khoa_yeu_cau: randomUUID(),
      },
      admin,
    );
    if (i)
      await treasury.attach(
        p.ma_phieu,
        await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {}),
        [completion],
        admin,
      );
    if (i === 3) continue;
    await treasury.act(
      p.ma_phieu,
      i === 4 ? "huy" : "duyet",
      await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {
        ly_do: "Hủy phiếu nháp mẫu",
        ghi_chu: "Ghi sổ giả lập",
      }),
      admin,
    );
    if (i === 2)
      await treasury.act(
        p.ma_phieu,
        "dao",
        await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {
          ly_do: "Đảo khoản chi giả lập để kiểm tra số dư",
        }),
        admin,
      );
  }
  await treasury.saveFund(
    null,
    {
      ten_quy: "NT · Quỹ đã tạm khóa",
      mo_ta: "Dùng kiểm tra chặn lập phiếu",
      dang_hoat_dong: false,
    },
    admin,
  );
  scenario(
    "Tiện ích",
    "Phòng sinh hoạt/sân thể thao có lịch từ ngày mai đến 4 ngày tới; hồ bơi tạm ngừng.",
    "Có chờ/duyệt/từ chối/hủy; khung đang giữ chỗ bị chặn trùng. Cư dân không xem chi tiết người khác.",
  );
  scenario(
    "Thông báo",
    "Đăng nhập tài khoản cá nhân xem toàn bộ/khối/căn, đã đọc/chưa đọc; BQL xem bản nháp/thu hồi và nhắc phí.",
    "Phạm vi và biên nhận đọc đúng, nháp/thu hồi không lộ ra cư dân.",
  );
  scenario(
    "Quỹ và thu chi",
    "Mở quỹ vận hành và NT · Quỹ bảo trì mẫu; xem sổ quỹ, chứng từ, phiếu đảo/nháp/hủy.",
    "Quỹ mẫu còn 18.500.000 đồng; khoản chi 700.000 được đảo. Thu hóa đơn chỉ nằm ở quỹ vận hành, không nhân đôi.",
  );
}

async function createImport(kind, format, record, file) {
  let buffer;
  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await template(kind, "xlsx", {}));
    const sheet = wb.getWorksheet(1);
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);
    sheet.addRow(
      catalog[kind].fields.map((field) => String(record[field.key] ?? "")),
    );
    buffer = Buffer.from(await wb.xlsx.writeBuffer());
  } else {
    throw new Error("Chỉ tạo tệp Excel .xlsx.");
  }
  await writeFile(path.join(out, "nhap", file), buffer);
  manifest.files.push({ file: `nhap/${file}`, kind, format });
  return { originalname: file, buffer };
}
async function seedImportsAndAccounts() {
  await mkdir(path.join(out, "nhap"));
  const owner = residents[0];
  const records = {
    can_ho: {
      so_can_ho: "NT-IMP-01",
      khoi: "IMP",
      tang: "1",
      dien_tich_m2: "70",
      tinh_phi_dich_vu: "1",
    },
    cu_dan: {
      ho_va_ten: "NT · Cư dân nhập Excel",
      so_dien_thoai: "0909030001",
      so_can_ho: "NT-IMP-01",
      quan_he: "CHU_HO",
      ngay: day,
    },
    phuong_tien: {
      ma_cu_dan: String(owner.ma_cu_dan),
      so_can_ho: apartments[0].so_can_ho,
      loai_xe: "XE_DAP",
      bien_so: "",
      hang_xe: "Thống Nhất",
      mau_sac: "Đỏ",
      ngay_dang_ky: day,
    },
    chi_so: {
      so_can_ho: "NT-IMP-01",
      loai_dich_vu: "NUOC",
      ky_thanh_toan: month(0),
      chi_so_cu: "0",
      chi_so_moi: "8",
      ngay_chot: day,
      ky_dau: "1",
      ghi_chu: "Chỉ số nhập từ file mẫu",
    },
    thiet_bi: {
      ma_tai_san: "NT-IMP-TB",
      ten_thiet_bi: "NT · Thiết bị nhập file",
      loai: "CAMERA",
      vi_tri: "Sảnh khối IMP",
      trang_thai: "DANG_SU_DUNG",
      nhac_truoc_ngay: "7",
    },
  };
  let number = 0;
  for (const [kind, record] of Object.entries(records)) {
    const file = await createImport(
      kind,
      "xlsx",
      record,
      `da-nhap-${++number}-${kind}.xlsx`,
    );
    const preview = await importFile(kind, file, {}, admin);
    if (preview.errors)
      throw new Error(`File mẫu lỗi: ${JSON.stringify(preview.rows)}`);
    await importFile(
      kind,
      file,
      { xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
      admin,
      true,
    );
  }
  // Các tệp Excel chưa nhập, dành cho thao tác nghiệm thu thủ công.
  for (const format of ["xlsx"])
    for (const [kind, record] of Object.entries(records)) {
      const tag = "X",
        next = { ...record };
      if (["can_ho", "cu_dan", "chi_so"].includes(kind))
        next.so_can_ho = `NT-THU-${tag}`;
      if (kind === "cu_dan") next.so_dien_thoai = "0909030002";
      if (kind === "thiet_bi") next.ma_tai_san = `NT-THU-${tag}-TB`;
      await createImport(kind, format, next, `thu-${kind}.${format}`);
    }
  await createImport(
    "can_ho",
    "xlsx",
    { ...records.can_ho, so_can_ho: "NT-LOI", dien_tich_m2: "-10" },
    "loi-dien-tich.xlsx",
  );
  const aptAccounts = await rows(
    pool,
    "SELECT ma_nguoi_dung,ma_can_ho_thanh_toan FROM nguoi_dung WHERE ma_can_ho_thanh_toan IS NOT NULL ORDER BY ma_can_ho_thanh_toan",
  );
  for (const account of aptAccounts) {
    const current = await accounts.accountForApartment(
      account.ma_can_ho_thanh_toan,
    );
    const credentials = current.dang_hoat_dong
      ? await accounts.manageApartmentAccount(
          account.ma_can_ho_thanh_toan,
          {
            thao_tac: "cap_lai_mat_khau",
            phien_ban_ban_giao: current.phien_ban_ban_giao,
          },
          admin,
        )
      : { ...current, mat_khau_tam_thoi: "(tài khoản đã khóa)" };
    const apt = await one("can_ho", "ma_can_ho", account.ma_can_ho_thanh_toan);
    manifest.accounts.push({
      name: `Tài khoản căn ${apt.so_can_ho}`,
      login: credentials.ten_dang_nhap,
      phone: credentials.dien_thoai_phu_trach,
      password: credentials.mat_khau_tam_thoi,
      role: "CU_DAN",
      kind: "CAN_HO",
      active: Boolean(credentials.dang_hoat_dong),
      apartment: apt.so_can_ho,
    });
    await saveManifest();
  }
  scenario(
    "Nhập/xuất",
    "5 file Excel da-nhap-* đã tạo lịch sử nhập. File thu-* để thử thêm: căn → cư dân → xe → chỉ số → thiết bị. File loi-dien-tich dùng thử preview lỗi.",
    "Preview chưa lưu; lỗi không nhập. Mã cư dân xe đã điền thật; xe đăng ký ngày hôm nay để không sửa kỳ khóa. Chỉ nhận Excel .xlsx.",
  );
  scenario(
    "Tài khoản căn và bàn giao",
    "Mở A101, thử tên CH... hoặc SĐT chủ hộ ghi trong tài khoản. Thêm chủ hộ mới có xác nhận bàn giao rồi thử phiên/SĐT cũ.",
    "Phiên cũ bị ngắt; mật khẩu/SĐT mới theo người phụ trách. Khi bàn giao, thông tin trong file tài khoản cũ không còn áp dụng.",
  );
}

async function verifyAndExport() {
  const { app } = await import("../src/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = "";
  const req = async (url, body, auth = cookie) => {
    const response = await fetch(base + url, {
      method: body ? "POST" : "GET",
      headers: {
        "X-App-Request": "1",
        ...(auth ? { Cookie: auth } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    return response;
  };
  const check = async (name, promise, status = 200) => {
    const response = await promise;
    if (response.status !== status)
      throw new Error(
        `Nghiệm thu ${name}: HTTP ${response.status}, cần ${status}.`,
      );
    manifest.checks.push({ name, status: "DAT", http: status });
    return response;
  };
  try {
    await check("Database ready", req("/ready"));
    const account = manifest.accounts.find(
      (account) => account.role === "QUAN_TRI_VIEN",
    );
    const login = await check(
      "Đăng nhập BQL",
      req(
        "/xac_thuc/dang_nhap",
        { so_dien_thoai: account.login, mat_khau: account.password },
        "",
      ),
    );
    cookie = login.headers.get("set-cookie").split(";")[0];
    for (const url of [
      "/tong_quan",
      "/can_ho/so_do",
      "/bao_cao/cong_no",
      "/bao_cao/thu_phi",
      "/thiet_bi",
      "/bao_tri",
      "/phuong_tien",
      "/thong_bao",
      "/dat_lich_tien_ich",
      "/quy",
      "/trao_doi_du_lieu/lich_su",
    ])
      await check(url, req(url));
    for (const range of ["NGAY", "TUAN", "THANG", "QUY", "NAM"])
      await check(
        `Biểu đồ ${range}`,
        req(`/tong_quan/thong_ke?khoang=${range}&ngay=${day}`),
      );
    await mkdir(path.join(out, "xuat"));
    for (const kind of [
      "can_ho",
      "cu_dan",
      "phuong_tien",
      "chi_so",
      "thiet_bi",
      "bao_tri",
      "hoa_don",
      "dat_lich",
    ])
      for (const format of ["xlsx"]) {
        const url = `/trao_doi_du_lieu/${kind}/xuat?dinh_dang=${format}`;
        const response = await check(`Xuất ${kind} ${format}`, req(url));
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.subarray(0, 2).toString() !== "PK")
          throw new Error(`Tệp xuất ${kind}.${format} sai định dạng.`);
        await writeFile(path.join(out, "xuat", `${kind}.${format}`), buffer);
      }
    for (const kind of ["cong_no", "thu_phi"])
      for (const format of ["xlsx"]) {
        const response = await check(
          `Báo cáo ${kind} ${format}`,
          req(`/bao_cao/${kind}/xuat?dinh_dang=${format}`),
        );
        await writeFile(
          path.join(out, "xuat", `${kind}.${format}`),
          Buffer.from(await response.arrayBuffer()),
        );
      }
    const funds = await rows(
      pool,
      "SELECT ma_quy FROM quy_tai_chinh WHERE dang_hoat_dong=1 ORDER BY ma_quy",
    );
    for (const fund of funds)
      for (const format of ["xlsx"]) {
        const response = await check(
          `Sổ quỹ ${fund.ma_quy} ${format}`,
          req(`/quy/${fund.ma_quy}/so_quy/xuat?dinh_dang=${format}`),
        );
        await writeFile(
          path.join(out, "xuat", `so-quy-${fund.ma_quy}.${format}`),
          Buffer.from(await response.arrayBuffer()),
        );
      }
    const loginResident = await check(
      "Đăng nhập cư dân",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: residentUser.so_dien_thoai,
          mat_khau: manifest.accounts.find(
            (a) => a.login === residentUser.so_dien_thoai,
          ).password,
        },
        "",
      ),
    );
    const residentCookie = loginResident.headers
      .get("set-cookie")
      .split(";")[0];
    await check(
      "Cư dân bị chặn API BQL",
      req("/nguoi_dung", null, residentCookie),
      403,
    );
    for (const url of [
      "/cua_toi/hoa_don",
      "/cua_toi/thong_bao",
      "/cua_toi/dat_lich",
      "/phan_anh",
    ])
      await check(`Cư dân ${url}`, req(url, null, residentCookie));
    const payer = manifest.accounts.find((a) => a.apartment === "A101");
    const loginPayer = await check(
      "Đăng nhập tài khoản căn A101",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: payer.login,
          mat_khau: payer.password,
          loai_tai_khoan: "CAN_HO",
        },
        "",
      ),
    );
    await check(
      "Hóa đơn tài khoản căn",
      req(
        "/cua_toi/hoa_don",
        null,
        loginPayer.headers.get("set-cookie").split(";")[0],
      ),
    );
    await check(
      "Đăng nhập bằng SĐT chủ hộ A101",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: payer.phone,
          mat_khau: payer.password,
          loai_tai_khoan: "CAN_HO",
        },
        "",
      ),
    );
    const technicianAccount = manifest.accounts.find(
      (a) => a.login === tech.so_dien_thoai,
    );
    const techLogin = await check(
      "Đăng nhập kỹ thuật",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: technicianAccount.login,
          mat_khau: technicianAccount.password,
        },
        "",
      ),
    );
    const techCookie = techLogin.headers.get("set-cookie").split(";")[0];
    await check(
      "Kỹ thuật xem việc được giao",
      req("/phan_anh", null, techCookie),
    );
    await check(
      "Kỹ thuật xem bảo trì được giao",
      req("/bao_tri", null, techCookie),
    );
    await check(
      "Kỹ thuật bị chặn dữ liệu căn hộ",
      req("/can_ho", null, techCookie),
      403,
    );
    const locked = manifest.accounts.find((a) => a.login === "0909000005");
    await check(
      "Tài khoản đã khóa không đăng nhập",
      req(
        "/xac_thuc/dang_nhap",
        { so_dien_thoai: locked.login, mat_khau: locked.password },
        "",
      ),
      401,
    );
    const history = manifest.scenarios.find((s) => s.lookup);
    await check(
      "Tra cứu công khai",
      req(
        "/cong_khai/phan_anh/tra_cuu",
        { ma_tra_cuu: history.lookup, so_dien_thoai: history.phone },
        "",
      ),
    );
    const tables = await rows(
      pool,
      "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );
    manifest.tables = [];
    for (const { name } of tables) {
      const [count] = await rows(pool, `SELECT COUNT(*) AS n FROM \`${name}\``);
      manifest.tables.push({ table: name, rows: count.n });
      if (!count.n) throw new Error(`Bảng ${name} chưa có dữ liệu mẫu.`);
    }
    const [sum] = await rows(
      pool,
      "SELECT COUNT(*) AS errors FROM hoa_don h WHERE h.tong_tien<>(SELECT COALESCE(SUM(d.thanh_tien),0) FROM chi_tiet_hoa_don d WHERE d.ma_hoa_don=h.ma_hoa_don)",
    );
    if (sum.errors) throw new Error("Tổng hóa đơn không khớp chi tiết.");
    const [sampleFund] = await rows(
      pool,
      "SELECT ma_quy FROM quy_tai_chinh WHERE ten_quy='NT · Quỹ bảo trì mẫu'",
    );
    if ((await treasury.fundDetail(sampleFund.ma_quy)).so_du !== "18500000")
      throw new Error("Số dư quỹ mẫu không khớp 18.500.000 đồng.");
    manifest.checks.push({
      name: "38 bảng có dữ liệu; tổng hóa đơn khớp chi tiết",
      status: "DAT",
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function finish() {
  manifest.trang_thai = "HOAN_TAT";
  await saveManifest();
  const credentials = [
    `# Tài khoản nghiệm thu — ${options.database}`,
    "",
    `Tạo ngày ${day}. Mật khẩu chỉ dùng bộ giả lập này. Không commit/chia sẻ công khai file này.`,
    "",
    "| Tên | Loại | Định danh | Mật khẩu | Hoạt động |",
    "|---|---|---|---|---|",
    ...manifest.accounts.map(
      (a) =>
        `| ${a.name} | ${a.kind} | ${a.login}${a.phone ? ` / ${a.phone}` : ""} | ${a.password} | ${a.active ? "Có" : "Đã khóa"} |`,
    ),
  ];
  await writeFile(
    path.join(out, "TAI-KHOAN.md"),
    credentials.join("\n") + "\n",
    { mode: 0o600 },
  );
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>QR nghiệm thu</title><style>body{font:16px system-ui;margin:32px;background:#f4f8f7}main{display:flex;flex-wrap:wrap;gap:24px}article{background:white;padding:24px;text-align:center;border:1px solid #cadbd6;border-radius:16px}img{width:240px}p{max-width:300px;overflow-wrap:anywhere}@media print{article{break-inside:avoid}}</style><h1>QR dữ liệu nghiệm thu giả lập</h1><p>Web phải đang chạy trên database ${options.database}. STK thanh toán là giả lập, không chuyển tiền.</p><main>${manifest.qr.map((q) => `<article><h2>${q.name}</h2><img src="${q.file}" alt="QR"><p>${q.active ? "Đang hoạt động" : "Đã vô hiệu hóa để thử lỗi"}</p><a href="${q.url}">${q.url}</a></article>`).join("")}</main></html>`;
  await writeFile(path.join(out, "QR.html"), html);
  const guide = [
    `# Bộ dữ liệu nghiệm thu — ${options.database}`,
    "",
    `Ngày tạo: ${day}. Toàn bộ dữ liệu và mốc lịch sử là giả lập. Có 13 kỳ hóa đơn từ ${month(-12)} đến ${month(0)}.`,
    "",
    "Tài khoản xem TAI-KHOAN.md; mã tra cứu/SĐT xem manifest.json. QR xem QR.html; ảnh thử trong anh/. Không chuyển tiền vào STK mẫu.",
    "",
    "## Các bảng",
    "",
    "| Bảng | Số dòng |",
    "|---|---:|",
    ...manifest.tables.map((t) => `| ${t.table} | ${t.rows} |`),
    "",
    "## Kịch bản",
    "",
    ...manifest.scenarios
      .filter((s) => s.steps)
      .flatMap((s) => [
        `### ${s.feature}`,
        "",
        s.steps,
        "",
        `Mong đợi: ${s.expected}`,
        "",
      ]),
    "## Kiểm tra API/tệp tự động",
    "",
    ...manifest.checks.map((c) => `- ${c.status}: ${c.name}`),
    "",
    "Ảnh hiện trường/camera thật, quét điện thoại, chuyển khoản và thao tác UI thủ công vẫn cần người dùng nghiệm thu. Các file xuat/ là báo cáo sinh từ dữ liệu mẫu; file nhap/thu-* là bộ chưa nhập để thử thêm.",
    "",
  ];
  await writeFile(path.join(out, "README.md"), guide.join("\n"));
  console.log(
    `Hoàn tất. Mở ${path.relative(root, out)}/README.md, TAI-KHOAN.md và QR.html trên máy bạn.`,
  );
  console.log(
    `${manifest.checks.length} kiểm tra đạt; dữ liệu 38 bảng, không sửa DB chung_cu. Không in mật khẩu ra terminal.`,
  );
}

try {
  await freshDatabase();
  for (const [name, work] of [
    ["Nhà ở và tài khoản", seedHousing],
    ["Phí/hóa đơn 13 kỳ", seedBilling],
    ["QR/phản ánh/bảo trì", seedAssetsAndReports],
    ["Tiện ích/thông báo/quỹ", seedBookingsAnnouncementsFunds],
    ["Nhập file và tài khoản căn", seedImportsAndAccounts],
    ["Kiểm tra và xuất báo cáo", verifyAndExport],
  ]) {
    console.log(name);
    await work();
    await saveManifest();
  }
  await finish();
} catch (error) {
  if (manifest.accounts.length) {
    manifest.trang_thai = "CHUA_HOAN_TAT";
    manifest.error = error.status
      ? `${error.code}: ${error.message}`
      : error.code || error.message;
    await saveManifest().catch(() => {});
  }
  console.error(
    error.status
      ? `${error.code}: ${error.message}`
      : error.code || error.message,
  );
  console.error(
    "Bộ tạo dừng; không xóa dữ liệu hay thay mật khẩu đã có. Nếu bộ dở dang, giữ manifest và tạo DB nghiệm thu với mã mới.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
```
