import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import vfs from "pdfmake/build/vfs_fonts.js";
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
    const doc = await PDFDocument.load(
      await template(kind, "pdf", { so_dong: items.length }),
    );
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(
      Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
    );
    items.forEach((item, index) =>
      catalog[kind].fields.forEach((field) =>
        doc
          .getForm()
          .getTextField(`r${index + 1}.${field.key}`)
          .setText(String(item[field.key] ?? "")),
      ),
    );
    doc.getForm().updateFieldAppearances(font);
    doc.setTitle(`${catalog[kind].title} — dữ liệu thử nghiệm ${tag}`);
    bytes = Buffer.from(await doc.save());
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
for (const [format, group] of [
  ["xlsx", "X"],
  ["pdf", "P"],
]) {
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
  "pdf",
  [
    { ...dataset("P").thiet_bi[0], ma_tai_san: `${tag}-ERR-BOM` },
    {
      ...dataset("P").thiet_bi[1],
      ma_tai_san: `${tag}-ERR-PCCC`,
      loai: "SAI_LOAI",
    },
  ],
  "91_loi_loai_thiet_bi.pdf",
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
const docs = `# Bộ tệp Excel / PDF đã điền sẵn để thử nhập

Tạo ngày **${day}**, mã bộ **${tag}**. Toàn bộ họ tên, điện thoại, biển số, căn hộ và thiết bị là dữ liệu giả lập để kiểm thử. Không có tài khoản/mật khẩu có sẵn trong tệp. Mỗi tệp tối đa 6 dòng, dưới giới hạn của hệ thống.

## Chọn bộ Excel hoặc PDF

Bộ **Excel** dùng căn \`${tag}X01\`, \`${tag}X02\`, \`${tag}X03\` và khối TESTX. Bộ **PDF** dùng căn \`${tag}P01\`, \`${tag}P02\`, \`${tag}P03\` và khối TESTP. Hai bộ dùng mã/điện thoại khác nhau, nên có thể thử cả hai. PDF đã điền sẵn và còn ô chỉnh sửa; không dùng Print to PDF hoặc làm phẳng trước khi nhập.

| Phần dữ liệu chọn trên web | Excel | PDF | Số dòng mỗi tệp |
|---|---|---|---|
| Căn hộ | [01_can_ho.xlsx](01_can_ho.xlsx) | [01_can_ho.pdf](01_can_ho.pdf) | 3 |
| Cư dân | [02_cu_dan.xlsx](02_cu_dan.xlsx) | [02_cu_dan.pdf](02_cu_dan.pdf) | 4 |
| Phương tiện | [03_phuong_tien.xlsx](03_phuong_tien.xlsx) | [03_phuong_tien.pdf](03_phuong_tien.pdf) | 3, cần thay mã cư dân |
| Chỉ số điện nước | [04_chi_so.xlsx](04_chi_so.xlsx) | [04_chi_so.pdf](04_chi_so.pdf) | 6 |
| Thiết bị | [05_thiet_bi.xlsx](05_thiet_bi.xlsx) | [05_thiet_bi.pdf](05_thiet_bi.pdf) | 3 |

Trên GitHub, mở file rồi bấm **Download raw file** để tải. Khi đã tải tệp về máy, không cần chép code hay cập nhật ứng dụng để sử dụng bộ mẫu này; ứng dụng cần có bản nhập/xuất \`7b48d59\` hoặc mới hơn.

## Thứ tự thử

Đăng nhập BQL → **Nhập / xuất Excel, PDF**. Mỗi lần chọn đúng phần dữ liệu → chọn tệp → **Xem trước tệp** → kiểm tra không có lỗi → **Xác nhận nhập**.

1. Nhập **01_can_ho** trước: tạo 3 căn và tài khoản căn. Giữ mật khẩu tạm thời vừa hiện để thử đăng nhập; mật khẩu chỉ hiện một lần.
2. Nhập **02_cu_dan** sau: An là chủ hộ căn 01, Mai là thành viên căn 01, Bình thuê căn 02, Hà là chủ hộ căn 03. Tài khoản căn 01/03 được bàn giao cho chủ hộ, nên dùng mật khẩu mới ở kết quả nhập cư dân.
3. **03_phuong_tien cần sửa mã trước khi nhập.** Mã cư dân do database trên máy bạn sinh ra, bộ mẫu không thể biết sẵn. Mở danh sách Cư dân, tìm TEST X hoặc TEST P. Bản sửa mới hiển thị **Mã cư dân** ngay trên danh sách/hồ sơ và có nút **Sao chép**. Nếu chưa cập nhật bản sửa, xuất Excel để lấy cột Mã cư dân:
   - Thay mọi \`THAY_MA_CU_DAN_1\` bằng mã **Nguyễn Minh An** của đúng nhóm X/P.
   - Thay \`THAY_MA_CU_DAN_2\` bằng mã **Lê Quang Bình** của đúng nhóm X/P.
   - Giữ nguyên số căn. Với Excel, sửa sheet **Nhap**. Với PDF, mở bằng Chrome/Acrobat, sửa ô mã cư dân và **Save**. Nếu chưa thay mã thì bản xem trước sẽ báo lỗi; đây là bước cần làm, không phải lỗi đọc tệp.
4. Nhập **04_chi_so** sau căn hộ: 3 căn, mỗi căn một dòng điện và một dòng nước, kỳ **${cutoff.slice(0, 7)}**, ngày chốt **${cutoff}**, xác nhận kỳ đầu = 1. Không nhập lại để ghi đè kỳ đã có.
5. Nhập **05_thiet_bi** độc lập, không cần căn hộ/cư dân. Có ví dụ máy bơm theo chu kỳ 30 ngày, PCCC tạm dừng và camera chưa cấu hình lịch.

Ngày cư trú và đăng ký xe là **${start}**. Nếu máy của bạn đang đặt ngày trước ngày này, sửa ngày hợp lệ trước khi thử. Nếu số căn/điện thoại/mã tài sản đã tồn tại do đã thử bộ này, chọn bộ còn lại hoặc tạo bộ mới bên dưới. Không xóa database để thử lại.

## Tệp cố ý có lỗi

- [90_loi_dien_tich_can_ho.xlsx](90_loi_dien_tich_can_ho.xlsx): chọn Căn hộ. Có 1 dòng đúng, 1 dòng diện tích âm. Kỳ vọng **2 dòng · 1 dòng lỗi**, nút xác nhận bị khóa, chưa căn nào được lưu.
- [91_loi_loai_thiet_bi.pdf](91_loi_loai_thiet_bi.pdf): chọn Thiết bị. Có 1 dòng đúng, 1 dòng loại \`SAI_LOAI\`. Kỳ vọng **2 dòng · 1 dòng lỗi**, chưa thiết bị nào được lưu.

Để thử chống trùng: sau khi đã nhập thành công tệp hợp lệ, chọn lại tệp và xem trước. Các dòng trùng phải báo lỗi và không tạo hồ sơ mới. Gửi lại yêu cầu đang lưu với cùng xác nhận/tệp được nhận diện là đã nhập.

## Tạo bộ mới trên máy bạn

Script chỉ tạo tệp, **không kết nối hoặc ghi database**. Tại thư mục gốc dự án có các thư viện của bản nhập/xuất:

\`\`\`powershell
node scripts/create-import-samples.js --tag=TEST02 --out=samples/thu-lan-2
\`\`\`

Chọn tag 2–10 chữ in hoa/số khác bộ trước. Script tạo mã căn/tài sản/biển số mới và tính điện thoại mẫu theo tag. Nếu hệ thống báo điện thoại trùng, sửa sang số giả lập khác chưa dùng; sau đó lấy lại mã cư dân thực tế để sửa tệp xe. Ngày được tính lại theo lịch Việt Nam lúc chạy.

\`du-lieu-mau.json\` ghi các dòng ví dụ để đối chiếu và \`manifest.json\` mô tả số dòng/tệp; hai file JSON không dùng để nhập vào web.
`;
await writeFile(join(directory, "README.md"), docs);
console.log(
  `Đã tạo ${manifest.files.length} tệp Excel/PDF tại ${directory}. Mã bộ: ${tag}.`,
);
