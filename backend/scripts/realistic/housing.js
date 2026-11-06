import * as structure from "../../src/modules/residency/building-structure.service.js";
import * as residency from "../../src/modules/residency/residency.service.js";
import * as vehicles from "../../src/modules/vehicles/vehicles.service.js";
import {
  personName,
  phoneNumber,
  plan,
  shiftDay,
} from "../../../scripts/realistic-data-plan.js";

export async function housing(c) {
  c.admin = await c.createUser(
    "Nguyễn Hoàng Phúc",
    phoneNumber(900),
    "QUAN_TRI_VIEN",
  );
  c.manager = await c.createUser(
    "Trần Thị Thanh Hương",
    phoneNumber(901),
    "QUAN_TRI_VIEN",
  );
  for (let i = 0; i < 8; i++)
    c.technicians.push(
      await c.createUser(
        personName(500 + i),
        phoneNumber(910 + i),
        "KY_THUAT_VIEN",
      ),
    );
  c.locked = await c.createUser(
    "Lê Thành Vinh",
    phoneNumber(920),
    "KY_THUAT_VIEN",
    false,
  );
  for (let blockIndex = 0; blockIndex < plan.blocks; blockIndex++) {
    const block = String.fromCharCode(65 + blockIndex);
    await structure.saveBlock(null, {
      khoi: block,
      ten_khoi: `Khối ${block}`,
      mo_ta: "Khối căn hộ và khu sinh hoạt chung",
    });
    for (let floor = 1; floor <= plan.floorsPerBlock; floor++) {
      await structure.saveFloor(block, null, {
        tang: floor,
        ten_tang: `Tầng ${floor}`,
        mo_ta: "Tầng căn hộ",
      });
      const vehicleRecords = [];
      for (let number = 1; number <= plan.homesPerFloor; number++) {
        const index = c.apartments.length;
        const apartment = await residency.saveApartment(
          null,
          {
            so_can_ho: `${block}${String(floor).padStart(2, "0")}${String(number).padStart(2, "0")}`,
            khoi: block,
            tang: floor,
            dien_tich_m2: ["58.50", "72.00", "85.50", "96.25"][index % 4],
            tinh_phi_dich_vu: true,
          },
          c.admin,
        );
        c.apartments.push(apartment);
        await c.capture(apartment.tai_khoan_can_ho, {
          apartment: apartment.so_can_ho,
        });
        const owner = await residency.saveResident(
          null,
          {
            ho_va_ten: personName(index * 2),
            so_dien_thoai: phoneNumber(index * 2),
            ma_can_ho: apartment.ma_can_ho,
            quan_he: "CHU_HO",
            ngay: c.beginning,
          },
          c.admin,
        );
        c.owners.push(owner);
        await c.capture(owner.tai_khoan_can_ho, {
          name: owner.ho_va_ten,
          phone: owner.so_dien_thoai,
          apartment: apartment.so_can_ho,
        });
        c.members.push(
          await residency.saveResident(
            null,
            {
              ho_va_ten: personName(index * 2 + 1),
              so_dien_thoai: phoneNumber(index * 2 + 1),
              ma_can_ho: apartment.ma_can_ho,
              quan_he: index % 5 ? "THANH_VIEN" : "NGUOI_THUE",
              ngay: c.beginning,
            },
            c.admin,
          ),
        );
        vehicleRecords.push({
          ma_cu_dan: owner.ma_cu_dan,
          so_can_ho: apartment.so_can_ho,
          loai_xe: "XE_MAY",
          bien_so: `59X1${10000 + index}`,
          hang_xe: ["Honda", "Yamaha", "Piaggio"][index % 3],
          mau_sac: ["Đen", "Trắng", "Xanh", "Đỏ"][index % 4],
          ngay_dang_ky: c.beginning,
        });
        if (index % 2 === 0) {
          const stay = (await residency.residentDetail(owner.ma_cu_dan))
            .history[0];
          await vehicles.create(
            {
              ma_cu_dan: owner.ma_cu_dan,
              ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
              loai_xe: "O_TO",
              bien_so: `51K${20000 + index}`,
              hang_xe: ["Toyota", "Kia", "Mazda", "Hyundai"][index % 4],
              mau_sac: "Trắng",
              ngay_dang_ky: c.beginning,
            },
            c.admin,
          );
        }
      }
      // One parking registration workbook per floor: 100 genuine import operations.
      await c.importRows(
        "phuong_tien",
        vehicleRecords,
        `dang-ky-xe-${block}-${String(floor).padStart(2, "0")}.xlsx`,
      );
      if (floor % 5 === 0)
        console.log(
          `  Khối ${block}: đã tạo ${floor}/${plan.floorsPerBlock} tầng`,
        );
    }
  }
  // Members move without taking over another household's payment account.
  for (let i = 0; i < 12; i++) {
    const member = c.members[i];
    const stay = (await residency.residentDetail(member.ma_cu_dan)).history[0];
    await vehicles.create(
      {
        ma_cu_dan: member.ma_cu_dan,
        ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
        loai_xe: "XE_DAP",
        bien_so: "",
        hang_xe: "Thống Nhất",
        mau_sac: "Xanh",
        ngay_dang_ky: c.beginning,
      },
      c.admin,
    );
    await residency.changeStay(
      member.ma_cu_dan,
      "chuyen_can",
      {
        ngay: i === 0 ? c.day : shiftDay(c.day, -20 - i),
        phien_ban: member.phien_ban,
        ma_can_ho: c.apartments[i + 20].ma_can_ho,
        quan_he: "THANH_VIEN",
        chuyen_phuong_tien: true,
      },
      c.admin,
    );
  }
  c.payers = await c.rows(
    c.pool,
    "SELECT u.*,u.ma_cu_dan_phu_trach AS ma_cu_dan FROM nguoi_dung u WHERE ma_can_ho_thanh_toan IS NOT NULL ORDER BY ma_can_ho_thanh_toan",
  );
  c.manifest.scenarios.push(
    "Căn hộ theo khối/tầng; chủ hộ, thành viên, người thuê; tài khoản theo căn và đăng nhập bằng SĐT chủ hộ; xe chuyển căn giữ lịch sử; 100 tệp đăng ký xe đã nhập.",
  );
}
