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
