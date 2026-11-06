import { randomUUID } from "node:crypto";
import sharp from "sharp";
import * as amenities from "../../src/modules/amenities/amenities.service.js";
import * as announcements from "../../src/modules/announcements/announcements.service.js";
import * as treasury from "../../src/modules/treasury/treasury.service.js";
import {
  bookingSlot,
  shiftDay,
  eventTime,
  plan,
} from "../../../scripts/realistic-data-plan.js";

export async function community(c) {
  const facilities = [];
  const names = [
    "Phòng sinh hoạt cộng đồng khối A",
    "Phòng sinh hoạt cộng đồng khối B",
    "Sân cầu lông số 1",
    "Sân cầu lông số 2",
    "Khu BBQ ngoài trời",
    "Phòng tập yoga",
    "Hồ bơi",
    "Phòng sinh hoạt thiếu nhi",
  ];
  for (let i = 0; i < names.length; i++)
    facilities.push(
      await amenities.saveFacility(
        null,
        {
          ten_tien_ich: names[i],
          vi_tri:
            i < 2 ? `Khối ${i ? "B" : "A"} · tầng 1` : "Khu tiện ích chung",
          mo_ta:
            "Đăng ký lịch sử dụng trên cổng cư dân và tuân thủ nội quy tại khu vực",
          suc_chua: [40, 40, 10, 10, 24, 20, 40, 30][i],
          gio_mo: "06:00",
          gio_dong: "22:00",
          toi_da_phut: 120,
          dat_truoc_ngay: 30,
          dang_mo: true,
        },
        c.admin,
      ),
    );
  for (let i = 0; i < plan.bookings; i++) {
    const slot = bookingSlot(i, c.day),
      facility = await amenities.facilityDetail(
        facilities[slot.facility].ma_tien_ich,
      ),
      user = c.payers[i % c.payers.length];
    const booking = await amenities.createBooking(
      facility.ma_tien_ich,
      {
        ngay: slot.date,
        gio_bat_dau: slot.start,
        gio_ket_thuc: slot.end,
        so_nguoi: 2 + (i % 5),
        ghi_chu: "Đăng ký sử dụng tiện ích theo khung giờ",
        phien_ban_tien_ich: facility.phien_ban,
        khoa_yeu_cau: randomUUID(),
      },
      user,
    );
    const id = booking.ma_dat_lich;
    const decision = (i + Math.floor(i / 8)) % 4;
    if (decision)
      await amenities.act(
        id,
        [null, "duyet", "tu_choi", "huy"][decision],
        await c.versioned("dat_lich_tien_ich", "ma_dat_lich", id, {
          ghi_chu:
            decision === 2
              ? "Cần điều chỉnh số người và thời gian sử dụng"
              : "Đã đối chiếu lịch sử dụng tiện ích",
        }),
        decision === 3 ? user : c.admin,
      );
    // Existing services validate creation/transitions; only fixture calendar timestamps are backdated.
    if (i < 120) {
      const historical = shiftDay(c.day, -15 + Math.floor(i / 8));
      const stamp = (time) =>
        new Date(`${historical}T${time}:00+07:00`)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
      await c.rows(
        c.pool,
        "UPDATE dat_lich_tien_ich SET bat_dau=?,ket_thuc=?,ngay_tao=? WHERE ma_dat_lich=?",
        [
          stamp(slot.start),
          stamp(slot.end),
          eventTime(shiftDay(historical, -3)),
          id,
        ],
      );
      await c.rows(
        c.pool,
        "UPDATE lich_su_dat_lich SET ngay_tao=? WHERE ma_dat_lich=?",
        [eventTime(shiftDay(historical, -2)), id],
      );
    }
  }
  const titles = [
    "Lịch vệ sinh khu vực chung",
    "Kiểm tra hệ thống báo cháy",
    "Bảo dưỡng thang máy",
    "Lịch kiểm tra đồng hồ nước",
    "Quy định sử dụng phòng sinh hoạt",
    "Hướng dẫn phân loại rác",
    "Kiểm tra chiếu sáng hành lang",
    "Lịch vệ sinh bể nước",
    "Đối soát đăng ký phương tiện",
    "Hướng dẫn thoát nạn và PCCC",
    "Thời gian bảo dưỡng hồ bơi",
    "Đăng ký hoạt động cộng đồng",
    "Kiểm tra khóa cửa khu vực chung",
    "Lịch chăm sóc cây xanh",
  ];
  for (let i = 0; i < plan.notices; i++) {
    const date = shiftDay(c.day, -(i * 2)),
      home = c.apartments[i % c.apartments.length],
      scope = ["TOAN_BO", "TOAN_BO", "KHOI", "CAN_HO"][i % 4];
    const notice = await announcements.create(
      {
        tieu_de: `${titles[i % titles.length]} · ${date.split("-").reverse().join("/")}`,
        noi_dung: `Ban quản lý thông báo lịch công tác ngày ${date}.\n${titles[i % titles.length]} tại khu vực được thông báo. Bộ phận phụ trách sẽ kiểm tra, thực hiện và cập nhật kết quả trên hệ thống.\nKính đề nghị cư dân phối hợp, giữ lối đi thông thoáng và liên hệ quầy quản lý khi cần hỗ trợ.`,
        pham_vi: scope,
        khoi: home.khoi,
        ma_can_ho: home.ma_can_ho,
        muc_do: i % 5 === 0 ? "QUAN_TRONG" : "THUONG",
      },
      c.admin,
    );
    const id = notice.ma_thong_bao;
    if (i % 14 !== 0) {
      await announcements.change(
        id,
        "phat_hanh",
        await c.versioned("thong_bao", "ma_thong_bao", id),
        c.admin,
      );
      const readers =
        scope === "CAN_HO"
          ? c.payers.filter((u) => u.ma_can_ho_thanh_toan === home.ma_can_ho)
          : scope === "KHOI"
            ? c.payers
                .filter(
                  (u) =>
                    c.apartments.find(
                      (a) => a.ma_can_ho === u.ma_can_ho_thanh_toan,
                    ).khoi === home.khoi,
                )
                .slice(0, 8)
            : c.payers.slice(0, 10);
      for (const reader of readers) await announcements.markRead(id, reader);
      if (i % 17 === 0)
        await announcements.change(
          id,
          "thu_hoi",
          await c.versioned("thong_bao", "ma_thong_bao", id, {
            ly_do: "Điều chỉnh lịch thực hiện theo kế hoạch mới",
          }),
          c.admin,
        );
    }
    await c.rows(
      c.pool,
      "UPDATE thong_bao SET ngay_tao=?,ngay_gui=IF(ngay_gui IS NULL,NULL,?),ngay_thu_hoi=IF(ngay_thu_hoi IS NULL,NULL,?) WHERE ma_thong_bao=?",
      [eventTime(date), eventTime(date, 1), eventTime(date, 3), id],
    );
    await c.rows(
      c.pool,
      "UPDATE thong_bao_da_doc SET ngay_doc=? WHERE ma_thong_bao=?",
      [eventTime(date, 2), id],
    );
    await c.rows(
      c.pool,
      "UPDATE lich_su_thong_bao SET ngay_tao=? WHERE ma_thong_bao=?",
      [eventTime(date, 3), id],
    );
  }
  const funds = [];
  for (const name of [
    "Quỹ bảo trì",
    "Quỹ cải tạo và mua sắm",
    "Quỹ hoạt động cộng đồng",
  ]) {
    const fund = await treasury.saveFund(
      null,
      {
        ten_quy: name,
        mo_ta: "Theo dõi thu chi theo mục đích và chứng từ được phê duyệt",
        dang_hoat_dong: true,
      },
      c.admin,
    );
    funds.push(fund);
    const voucher = await treasury.create(
      {
        ma_quy: fund.ma_quy,
        loai: "THU",
        nhom: "BO_SUNG_QUY",
        ngay_hach_toan: c.beginning,
        so_tien: "200000000",
        doi_tac: "Ban quản lý",
        dien_giai: "Ghi nhận bổ sung nguồn quỹ đầu kỳ theo kế hoạch",
        khoa_yeu_cau: randomUUID(),
      },
      c.admin,
    );
    await treasury.act(
      voucher.ma_phieu,
      "duyet",
      await c.versioned("phieu_thu_chi", "ma_phieu", voucher.ma_phieu, {
        ghi_chu: "Đã kiểm tra nguồn bổ sung quỹ",
      }),
      c.admin,
    );
  }
  for (let i = 0; i < plan.vouchers; i++) {
    const date = shiftDay(c.day, -(i * 2)),
      amount = String([350000, 650000, 1250000, 890000, 480000][i % 5]);
    const voucher = await treasury.create(
      {
        ma_quy: funds[i % funds.length].ma_quy,
        loai: "CHI",
        nhom: ["BAO_TRI", "MUA_SAM", "VAN_HANH"][i % 3],
        ngay_hach_toan: date,
        so_tien: amount,
        doi_tac: [
          "Đơn vị bảo dưỡng thiết bị",
          "Bộ phận cung ứng vật tư",
          "Tổ dịch vụ tòa nhà",
        ][i % 3],
        dien_giai: [
          "Vệ sinh và kiểm tra thiết bị định kỳ",
          "Bổ sung vật tư điện và chiếu sáng khu vực chung",
          "Chi phí phục vụ hoạt động sinh hoạt cộng đồng",
        ][i % 3],
        khoa_yeu_cau: randomUUID(),
      },
      c.admin,
    );
    const id = voucher.ma_phieu;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="#fff"/><rect x="40" y="40" width="920" height="620" fill="none" stroke="#333"/><text x="90" y="120" font-family="sans-serif" font-size="36">PHIEU CHI - DOI CHIEU CHUNG TU</text><text x="90" y="210" font-family="sans-serif" font-size="28">So phieu: PC${String(id).padStart(6, "0")}</text><text x="90" y="290" font-family="sans-serif" font-size="28">Ngay: ${date}</text><text x="90" y="370" font-family="sans-serif" font-size="32">So tien: ${amount} VND</text><text x="90" y="480" font-family="sans-serif" font-size="25">Vat tu va dich vu van hanh toa nha</text><text x="90" y="590" font-family="sans-serif" font-size="22">Tai lieu kiem thu - khong co gia tri thanh toan</text></svg>`;
    const proof = {
      originalname: `chung-tu-${id}.jpg`,
      mimetype: "image/jpeg",
      buffer: await sharp(Buffer.from(svg)).jpeg().toBuffer(),
    };
    await treasury.attach(
      id,
      await c.versioned("phieu_thu_chi", "ma_phieu", id),
      [proof],
      c.admin,
    );
    if (i % 8 !== 0)
      await treasury.act(
        id,
        i % 8 === 1 ? "huy" : "duyet",
        await c.versioned("phieu_thu_chi", "ma_phieu", id, {
          ly_do: "Điều chỉnh chứng từ theo kết quả đối soát",
          ghi_chu: "Đã kiểm tra nội dung và số tiền trên chứng từ",
        }),
        c.admin,
      );
    if (i === 10)
      await treasury.act(
        id,
        "dao",
        await c.versioned("phieu_thu_chi", "ma_phieu", id, {
          ly_do: "Hoàn lại khoản chi do điều chỉnh biên bản đối soát",
        }),
        c.admin,
      );
    await c.rows(
      c.pool,
      "UPDATE phieu_thu_chi SET ngay_tao=?,ngay_duyet=IF(ngay_duyet IS NULL,NULL,?) WHERE ma_phieu=?",
      [eventTime(date), eventTime(date, 2), id],
    );
    await c.rows(
      c.pool,
      "UPDATE lich_su_thu_chi SET ngay_tao=? WHERE ma_phieu=?",
      [eventTime(date, 2), id],
    );
  }
  c.manifest.scenarios.push(
    "8 tiện ích, 160 lịch đủ trạng thái, có lịch đã qua và sắp tới; 140 thông báo chung/khối/căn và biên nhận đọc; 4 quỹ, hơn 160 phiếu thu chi, chứng từ minh họa và một phiếu đảo. Thu hóa đơn được tổng hợp từ hóa đơn, không ghi thêm phiếu thu trùng.",
  );
}
