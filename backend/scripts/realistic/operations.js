import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import * as maintenance from "../../src/modules/maintenance/maintenance.service.js";
import * as qr from "../../src/modules/qr/qr.service.js";
import * as incidents from "../../src/modules/incidents/incidents.service.js";
import {
  shiftDay,
  eventTime,
  plan,
} from "../../../scripts/realistic-data-plan.js";

async function illustration(c, complete = false) {
  const color = complete ? "#d6e7dd" : "#ece4d2";
  // Schematics for upload testing. They are not photographs of real damage.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640"><rect width="960" height="640" fill="${color}"/><rect x="200" y="100" width="560" height="350" rx="20" fill="#fff" stroke="#40564d" stroke-width="5"/><rect x="260" y="160" width="180" height="220" fill="#344d44"/><circle cx="570" cy="210" r="26" fill="${complete ? "#4b8066" : "#be8241"}"/><path d="M490 290H680M490 330H680M490 370H620" stroke="#40564d" stroke-width="10"/><text x="200" y="510" font-family="sans-serif" font-size="28">${complete ? "KIEM TRA SAU XU LY" : "SO DO MINH HOA THIET BI"}</text><text x="200" y="555" font-family="sans-serif" font-size="21">Anh minh hoa - khong phai hien truong thuc te</text></svg>`;
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
  const name = complete ? "kiem-tra-sau-xu-ly.jpg" : "so-do-thiet-bi.jpg";
  await writeFile(path.join(c.out, "anh", name), buffer);
  return { originalname: name, mimetype: "image/jpeg", buffer };
}

function asset(index) {
  const block = String.fromCharCode(65 + Math.floor(index / 40)),
    n = index % 40;
  const type =
    n < 2
      ? "THANG_MAY"
      : n < 4
        ? "MAY_BOM"
        : n < 29
          ? "PCCC"
          : n < 37
            ? "CAMERA"
            : n < 39
              ? "DIEN"
              : "NUOC";
  const label = {
    THANG_MAY: "Thang máy",
    MAY_BOM: "Máy bơm tăng áp",
    PCCC: "Tủ PCCC",
    CAMERA: "Camera giám sát",
    DIEN: "Tủ điện tổng",
    NUOC: "Đồng hồ nước tổng",
  }[type];
  const floor = type === "PCCC" ? n - 3 : (n % 25) + 1;
  return {
    block,
    type,
    name: `${label} ${block}${String(n + 1).padStart(2, "0")}`,
    position: `Khối ${block} · tầng ${floor}`,
    code: `${type}-${block}-${String(n + 1).padStart(2, "0")}`,
  };
}

export async function operations(c) {
  c.scene = await illustration(c);
  c.completion = await illustration(c, true);
  for (let i = 0; i < plan.equipment; i++) {
    const a = asset(i);
    const result = await maintenance.createEquipment(
      {
        ma_tai_san: a.code,
        ten_thiet_bi: a.name,
        loai: a.type,
        vi_tri: a.position,
        so_serial: `SN-${a.block}-${String(i + 1001)}`,
        ngay_lap_dat: c.beginning,
        trang_thai: "DANG_SU_DUNG",
        chu_ky_ngay: 30 + (i % 3) * 30,
        ngay_bao_tri_tiep_theo: shiftDay(c.day, (i % 40) - 15),
        nhac_truoc_ngay: 7,
        ghi_chu: "Theo dõi tình trạng và lịch bảo trì thiết bị",
      },
      c.admin,
    );
    const equipment = await c.one(
      "thiet_bi",
      "ma_thiet_bi",
      result.ma_thiet_bi,
    );
    c.equipment.push(equipment);
    c.locations.push(
      await qr.create(
        {
          ten_vi_tri: a.name,
          loai: "THIET_BI",
          ma_thiet_bi: equipment.ma_thiet_bi,
          mo_ta: a.position,
        },
        c.admin,
      ),
    );
  }
  for (const block of ["A", "B", "C", "D"])
    for (const area of [
      "Sảnh tiếp đón",
      "Bãi xe",
      "Sân nội bộ",
      "Cổng ra vào",
      "Lối thoát hiểm",
    ])
      c.locations.push(
        await qr.create(
          {
            ten_vi_tri: `${area} khối ${block}`,
            loai: "KHU_VUC",
            ma_thiet_bi: null,
            mo_ta: `Khu vực chung khối ${block}`,
          },
          c.admin,
        ),
      );
  const targets = [
    "MOI",
    "DA_PHAN_CONG",
    "DANG_XU_LY",
    "DA_XU_LY",
    "DA_DONG",
    "TU_CHOI",
    "TRUNG",
    "DANG_XU_LY",
  ];
  const topics = [
    [
      "DIEN",
      "Đèn hành lang chập chờn",
      "Đèn tại khu vực đi lại sáng không ổn định, đề nghị kiểm tra nguồn và thay bóng nếu cần.",
    ],
    [
      "NUOC",
      "Có nước đọng gần khu kỹ thuật",
      "Phát hiện nước đọng và dấu hiệu rò ở đầu nối, đề nghị kiểm tra để tránh trơn trượt.",
    ],
    [
      "THANG_MAY",
      "Thang máy phát tiếng động khi đóng cửa",
      "Khi cửa đóng có tiếng cọ và rung nhẹ, đề nghị bộ phận kỹ thuật kiểm tra ray và cảm biến cửa.",
    ],
    [
      "VE_SINH",
      "Cần vệ sinh khu vực sinh hoạt chung",
      "Khu vực có bụi và rác nhỏ sau giờ cao điểm, nhờ bố trí nhân viên vệ sinh bổ sung.",
    ],
    [
      "AN_NINH",
      "Cửa ra vào chưa đóng kín",
      "Cửa kiểm soát ra vào không tự khép sau khi có người đi qua, đề nghị kiểm tra khóa và tay co.",
    ],
    [
      "KHAC",
      "Biển chỉ dẫn cần được thay mới",
      "Biển hướng dẫn tại khu vực đã mờ và khó đọc, đề nghị kiểm tra và cập nhật biển rõ hơn.",
    ],
  ];
  let original;
  for (let i = 0; i < plan.reports; i++) {
    const group = Math.floor(i / 8),
      location = c.locations[(group * 5) % c.locations.length];
    const topic = topics[group % topics.length],
      target = targets[i % 8],
      owner = c.owners[i % c.owners.length],
      payer = c.payers[i % c.payers.length];
    const receipt = await incidents.submit(
      {
        token_qr: location.token_qr,
        phien_ban_qr: location.phien_ban,
        khoa_yeu_cau: randomUUID(),
        tieu_de: `${topic[1]} · ${location.ten_vi_tri}`,
        noi_dung: topic[2],
        ten_nguoi_gui: owner.ho_va_ten,
        so_dien_thoai: owner.so_dien_thoai,
        can_ho_khai_bao: c.apartments[i % c.apartments.length].so_can_ho,
        loai_su_co: topic[0],
        xac_nhan_gui: true,
      },
      [c.scene],
      i % 2 ? null : payer,
      `198.18.0.${1 + (i % 200)}`,
    );
    const [report] = await c.rows(
      c.pool,
      "SELECT * FROM phan_anh WHERE ma_tra_cuu=?",
      [receipt.ma_tra_cuu],
    );
    const id = report.ma_phan_anh,
      tech = c.technicians[group % c.technicians.length];
    if (i % 8 === 0) original = id;
    const change = async (state, user, files = [], extra = {}) =>
      incidents.transition(
        id,
        await c.versioned("phan_anh", "ma_phan_anh", id, {
          trang_thai: state,
          ghi_chu: "Đã kiểm tra hiện trạng và cập nhật phương án xử lý",
          noi_dung_cong_khai: "Bộ phận vận hành đã cập nhật tiến độ xử lý.",
          ...extra,
        }),
        files,
        user,
      );
    if (
      ["DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY", "DA_DONG"].includes(target)
    ) {
      await incidents.assign(
        id,
        await c.versioned("phan_anh", "ma_phan_anh", id, {
          ma_ky_thuat_vien: tech.ma_nguoi_dung,
          do_uu_tien: ["TRUNG_BINH", "CAO", "KHAN_CAP"][group % 3],
          ghi_chu: "Kiểm tra và phản hồi kết quả tại hiện trường",
        }),
        c.admin,
      );
      if (target !== "DA_PHAN_CONG") await change("DANG_XU_LY", tech);
      if (["DA_XU_LY", "DA_DONG"].includes(target) || i % 8 === 7) {
        await change("DA_XU_LY", tech, [c.completion]);
        if (target === "DA_DONG") await change("DA_DONG", c.admin);
        if (i % 8 === 7)
          await change("DANG_XU_LY", c.admin, [], {
            ghi_chu: "Cần kiểm tra lại và bổ sung kết quả chạy thử",
          });
      }
    } else if (target === "TU_CHOI")
      await change("TU_CHOI", c.admin, [], {
        ghi_chu:
          "Nội dung thuộc phạm vi bảo dưỡng bên trong căn hộ; đã hướng dẫn cư dân liên hệ đơn vị phù hợp",
      });
    else if (target === "TRUNG")
      await change("TRUNG", c.admin, [], {
        ma_phan_anh_goc: original,
        ghi_chu:
          "Cùng vị trí và nội dung đã được tiếp nhận, theo dõi tại phản ánh gốc",
      });
    const date = shiftDay(
      c.day,
      -(group % 5 === 0 ? group % 4 : (group * 11) % 366),
    );
    await c.rows(
      c.pool,
      "UPDATE phan_anh SET ngay_tao=?,ngay_dong=IF(trang_thai='DA_DONG',?,NULL) WHERE ma_phan_anh=?",
      [eventTime(date), eventTime(date, 10), id],
    );
    await c.rows(
      c.pool,
      "UPDATE lich_su_phan_anh SET ngay_tao=? WHERE ma_phan_anh=?",
      [eventTime(date, 10), id],
    );
    await c.rows(
      c.pool,
      "UPDATE hinh_anh_phan_anh SET ngay_tai_len=? WHERE ma_phan_anh=?",
      [eventTime(date, 5), id],
    );
    if (i < 12)
      c.manifest.scenarios.push({
        feature: "Tra cứu phản ánh",
        id,
        phone: owner.so_dien_thoai,
        lookup: receipt.ma_tra_cuu,
      });
    if ((i + 1) % 40 === 0) console.log(`  Phản ánh: ${i + 1}/${plan.reports}`);
  }
  for (let i = 0; i < c.equipment.length; i++) {
    const equipment = c.equipment[i],
      tech = c.technicians[i % c.technicians.length],
      state = i % 7;
    const job = await maintenance.createJob(
      equipment.ma_thiet_bi,
      {
        loai: i % 3 ? "DOT_XUAT" : "DINH_KY",
        phien_ban_thiet_bi: equipment.phien_ban,
        khoa_yeu_cau: randomUUID(),
        ma_ky_thuat_vien: state === 0 ? null : tech.ma_nguoi_dung,
        tieu_de: `Kiểm tra ${equipment.ten_thiet_bi}`,
        noi_dung:
          "Kiểm tra đấu nối, vệ sinh, thử vận hành và ghi nhận thông số an toàn",
        ngay_den_han: shiftDay(c.day, (i % 30) - 12),
      },
      c.admin,
    );
    const id = job.ma_phieu_bao_tri;
    const act = async (operation, user, body = {}) =>
      maintenance.act(
        id,
        operation,
        await c.versioned("phieu_bao_tri", "ma_phieu_bao_tri", id, body),
        user,
      );
    if (state >= 2 && state <= 5) await act("bat_dau", tech);
    if (state >= 3 && state <= 5)
      await act("bao_cao", tech, {
        ngay_thuc_hien: c.day,
        ket_qua:
          "Đã vệ sinh thiết bị, siết lại các đầu nối và kiểm tra vận hành. Các thông số đạt yêu cầu kiểm tra.",
      });
    if (state === 4)
      await act("nghiem_thu", c.admin, {
        nhan_xet: "Đã đối chiếu kết quả và xác nhận thiết bị vận hành ổn định",
      });
    if (state === 5)
      await act("tra_lai", c.admin, {
        ly_do: "Bổ sung số đo và kiểm tra lại trong điều kiện có tải",
      });
    if (state === 6)
      await act("huy", c.admin, {
        ly_do: "Gộp công việc vào đợt bảo dưỡng tổng thể cùng khu vực",
      });
    const date = shiftDay(c.day, -(i % 330));
    await c.rows(
      c.pool,
      "UPDATE phieu_bao_tri SET ngay_lap=?,ngay_thuc_hien=IF(ngay_thuc_hien IS NULL,NULL,?),ngay_tao=?,ngay_bat_dau=IF(ngay_bat_dau IS NULL,NULL,?),ngay_bao_cao=IF(ngay_bao_cao IS NULL,NULL,?),ngay_nghiem_thu=IF(ngay_nghiem_thu IS NULL,NULL,?),ngay_huy=IF(ngay_huy IS NULL,NULL,?) WHERE ma_phieu_bao_tri=?",
      [
        date,
        date,
        eventTime(date),
        eventTime(date, 1),
        eventTime(date, 2),
        eventTime(date, 3),
        eventTime(date, 3),
        id,
      ],
    );
    await c.rows(
      c.pool,
      "UPDATE lich_su_bao_tri SET ngay_tao=? WHERE ma_phieu_bao_tri=?",
      [eventTime(date, 3), id],
    );
    await c.rows(
      c.pool,
      "UPDATE lich_su_bao_tri SET ghi_chu=REPLACE(ghi_chu,?,?) WHERE ma_phieu_bao_tri=?",
      [c.day, date, id],
    );
    if (state === 4 && i % 3 === 0) {
      const next = shiftDay(date, equipment.chu_ky_ngay);
      await c.rows(
        c.pool,
        "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=? WHERE ma_thiet_bi=?",
        [next, equipment.ma_thiet_bi],
      );
      await c.rows(
        c.pool,
        "UPDATE lich_su_bao_tri SET ghi_chu=REPLACE(ghi_chu,?,?) WHERE ma_phieu_bao_tri=?",
        [shiftDay(c.day, equipment.chu_ky_ngay), next, id],
      );
    }
  }
  // Link change retains the incident's original equipment snapshot.
  const location = await qr.detail(c.locations[0].ma_vi_tri_qr);
  await qr.link(
    location.ma_vi_tri_qr,
    {
      phien_ban: location.phien_ban,
      ma_thiet_bi: c.equipment[1].ma_thiet_bi,
      xac_nhan_doi_lien_ket: true,
    },
    c.admin,
  );
  const last = c.locations.at(-1);
  await qr.setActive(last.ma_vi_tri_qr, {
    phien_ban: last.phien_ban,
    dang_hoat_dong: false,
  });
  for (const item of c.locations) {
    const current = await qr.detail(item.ma_vi_tri_qr),
      file = `qr/vi-tri-${current.ma_vi_tri_qr}.png`,
      url = `${c.options.origin}/r/${current.token_qr}`;
    await QRCode.toFile(path.join(c.out, file), url, { width: 360, margin: 3 });
    c.manifest.qr.push({
      name: current.ten_vi_tri,
      url,
      file,
      active: Boolean(current.dang_hoat_dong),
    });
  }
  c.manifest.scenarios.push(
    "240 phản ánh đủ trạng thái, ảnh minh họa và ảnh nghiệm thu, trả lại kỹ thuật, gộp trùng; 160 thiết bị và phiếu bảo trì; 180 QR, trong đó một QR ngừng sử dụng và một vị trí đã đổi liên kết thiết bị.",
  );
}
