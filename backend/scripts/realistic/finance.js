import { randomUUID } from "node:crypto";
import * as billing from "../../src/modules/billing/billing.service.js";
import { batchBills } from "../../src/modules/billing/billing-batch.service.js";
import { batchBillActions } from "../../src/modules/billing/billing-batch-actions.service.js";
import * as announcements from "../../src/modules/announcements/announcements.service.js";
import {
  monthAt,
  monthEnd,
  shiftDay,
  eventTime,
  plan,
} from "../../../scripts/realistic-data-plan.js";

// Deliberately non-operational payment details, not somebody else's bank account.
const payment = {
  ma_ngan_hang: "970422",
  so_tai_khoan: "000000000000",
  ten_nguoi_nhan: "TAI KHOAN MO PHONG",
};
async function action(c, ids, operation) {
  if (!ids.length) return;
  const items = [];
  for (const id of ids)
    items.push({
      ma_hoa_don: id,
      phien_ban: (await c.one("hoa_don", "ma_hoa_don", id)).phien_ban,
    });
  const body = {
    thao_tac: operation,
    hoa_don: items,
    ...payment,
    han_thanh_toan: shiftDay(c.day, 10),
  };
  const preview = await batchBillActions(body, c.admin);
  if (!preview.xac_nhan) throw new Error(`Lô ${operation} chưa hợp lệ.`);
  await batchBillActions(
    { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
    c.admin,
    true,
  );
}

export async function finance(c) {
  for (const [type, price] of [
    ["PHI_QUAN_LY", "12000"],
    ["GUI_XE_MAY", "120000"],
    ["GUI_O_TO", "1200000"],
    ["GUI_XE_DAP", "30000"],
    ["TIEN_NUOC", "15000"],
    ["TIEN_DIEN", "0"],
  ]) {
    await billing.createRate(
      {
        loai_phi: type,
        don_gia: price,
        tu_ngay: c.beginning,
        ...(type === "TIEN_DIEN"
          ? {
              cach_tinh: "BAC_THANG",
              thue_gtgt: "8",
              bac_dien: [50, 100, 200, 300, 400, null].map((limit, i) => ({
                den_kwh: limit,
                don_gia: String([1984, 2050, 2380, 2998, 3350, 3460][i]),
              })),
            }
          : {}),
      },
      c.admin,
    );
  }
  const meters = c.apartments.map((_, i) => ({
    DIEN: 1200 + i * 4,
    NUOC: 80 + i,
  }));
  for (let offset = -(plan.months - 1); offset <= 0; offset++) {
    const period = monthAt(c.day, offset),
      cutoff = offset === 0 ? c.day : monthEnd(period);
    for (let i = 0; i < c.apartments.length; i++) {
      for (const type of ["DIEN", "NUOC"]) {
        const used =
          type === "DIEN"
            ? 42 + (i % 12) * 36 + ((offset + 12) % 9)
            : 6 + ((i + offset + 12) % 12);
        const previous = meters[i][type];
        await billing.saveMeter(
          {
            ma_can_ho: c.apartments[i].ma_can_ho,
            loai_dich_vu: type,
            ky_thanh_toan: period,
            ngay_chot: cutoff,
            chi_so_cu: String(previous),
            chi_so_moi: String(previous + used),
            ky_dau: offset === -(plan.months - 1),
            ghi_chu: "Ghi nhận chỉ số công tơ cuối kỳ",
          },
          c.admin,
        );
        meters[i][type] += used;
      }
    }
    // Twenty apartments per billing run: 130 real batch operations over 13 periods.
    for (let start = 0; start < c.apartments.length; start += 20) {
      const homes = c.apartments.slice(start, start + 20);
      const body = {
        ma_can_ho: homes.map((a) => a.ma_can_ho),
        ky_thanh_toan: period,
        ngay_chot_phi: cutoff,
        tinh_dien: true,
        tinh_nuoc: true,
        tinh_xe: true,
      };
      const preview = await batchBills(body, c.admin);
      if (!preview.xac_nhan)
        throw new Error(`Lập hóa đơn kỳ ${period} chưa hợp lệ.`);
      const batch = await batchBills(
        { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
        c.admin,
        true,
      );
      const ids = batch.hoa_don.map((b) => b.ma_hoa_don);
      const approved = ids.filter(
        (_, i) => offset !== 0 || (start + i) % 10 !== 0,
      );
      const sent = ids.filter((_, i) => offset !== 0 || (start + i) % 10 > 1);
      await action(c, approved, "DUYET");
      await action(c, sent, "GUI");
      for (let i = 0; i < ids.length; i++) {
        const index = start + i,
          id = ids[i];
        const paid =
          offset < -3
            ? index % 20 !== 0
            : offset < 0
              ? index % 10 < 8
              : index % 10 >= 2 && index % 10 <= 5;
        if (paid) {
          const bill = await c.one("hoa_don", "ma_hoa_don", id);
          await billing.action(
            id,
            "xac_nhan_thanh_toan",
            {
              phien_ban: bill.phien_ban,
              so_tien: bill.tong_tien,
              ma_tham_chieu: `UNC-${period}-${homes[i].so_can_ho}`,
            },
            c.admin,
          );
        } else if (offset === 0 && index % 10 === 6) {
          await billing.action(
            id,
            "huy",
            await c.versioned("hoa_don", "ma_hoa_don", id, {
              ly_do: "Điều chỉnh kỳ chốt chỉ số theo biên bản đối soát",
            }),
            c.admin,
          );
          if (index % 50 === 6)
            await billing.action(
              id,
              "lap_thay_the",
              await c.versioned("hoa_don", "ma_hoa_don", id),
              c.admin,
            );
        }
        const due = shiftDay(cutoff, 10);
        const paidDay = offset
          ? [shiftDay(cutoff, i % 4), c.day].sort()[0]
          : c.day;
        await c.rows(
          c.pool,
          "UPDATE hoa_don SET ngay_tao=?,ngay_duyet=IF(ngay_duyet IS NULL,NULL,?),ngay_gui=IF(ngay_gui IS NULL,NULL,?),ngay_thanh_toan=IF(ngay_thanh_toan IS NULL,NULL,?),han_thanh_toan=IF(trang_thai IN ('DA_GUI','DA_THANH_TOAN'),?,han_thanh_toan) WHERE ma_hoa_don=?",
          [
            eventTime(cutoff),
            eventTime(cutoff, 2),
            eventTime(cutoff, 3),
            eventTime(paidDay, 5),
            due,
            id,
          ],
        );
        await c.rows(
          c.pool,
          "UPDATE lich_su_hoa_don SET ngay_tao=? WHERE ma_hoa_don=?",
          [eventTime(cutoff, 5), id],
        );
      }
    }
    console.log(
      `  Kỳ ${period}: ${c.apartments.length} căn, điện/nước và thu phí`,
    );
    await c.save();
  }
  const unpaid = await c.rows(
    c.pool,
    "SELECT ma_hoa_don,phien_ban FROM hoa_don WHERE trang_thai='DA_GUI' ORDER BY ky_thanh_toan DESC LIMIT 20",
  );
  for (const bill of unpaid)
    await announcements.remindBill(
      bill.ma_hoa_don,
      { phien_ban: bill.phien_ban },
      c.admin,
    );
  c.manifest.scenarios.push(
    "13 kỳ điện/nước liên tục, điện 6 bậc và VAT 8% là giả định kiểm thử; hóa đơn có đủ nháp/duyệt/gửi/thu/hủy/thay thế; còn công nợ quá hạn và nhắc phí. STK toàn số 0 chỉ phục vụ thử QR, không dùng thanh toán.",
  );
}
