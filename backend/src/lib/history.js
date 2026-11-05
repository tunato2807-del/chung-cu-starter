// Each history keeps its domain identity, target foreign keys and old API view.
// Only storage of the repeated actor/event/time/snapshot fields is shared.
export const historyCatalog = {
  lich_su_phan_anh: {
    id: "ma_lich_su_phan_anh",
    actor: "ma_nguoi_thay_doi",
    event: "loai_su_kien",
    targets: ["ma_phan_anh"],
    links: ["ma_ky_thuat_vien_cu", "ma_ky_thuat_vien_moi"],
    payload: {
      trang_thai_cu: ["string", 20, true],
      trang_thai_moi: ["string", 20],
      noi_dung_cong_khai: ["string", 500],
    },
    defaults: {
      trang_thai_cu: null,
      ghi_chu: "",
      noi_dung_cong_khai: "",
      ma_ky_thuat_vien_cu: null,
      ma_ky_thuat_vien_moi: null,
    },
    noteLimit: 500,
    eventLimit: 40,
    anonymous: true,
  },
  lich_su_hoa_don: {
    id: "ma_lich_su_hoa_don",
    actor: "ma_nguoi_ghi",
    targets: ["ma_hoa_don"],
    defaults: { ghi_chu: "" },
    noteLimit: 255,
  },
  lich_su_ban_giao_can_ho: {
    id: "ma_ban_giao",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_can_ho"],
    time: "ngay_thuc_hien",
    payload: {
      ma_cu_dan_cu: ["integer", null, true],
      ma_cu_dan_moi: ["integer", null, true],
    },
    defaults: { ma_cu_dan_cu: null, ma_cu_dan_moi: null },
    noNote: true,
  },
  lich_su_thong_bao: {
    id: "ma_lich_su",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_thong_bao"],
    defaults: { ghi_chu: null },
    noteLimit: 255,
    nullableNote: true,
  },
  lich_su_bao_tri: {
    id: "ma_lich_su",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_thiet_bi", "ma_phieu_bao_tri"],
    optionalTargets: ["ma_phieu_bao_tri"],
    payload: { du_lieu: ["json"] },
    defaults: { ma_phieu_bao_tri: null },
  },
  lich_su_dat_lich: {
    id: "ma_lich_su",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_dat_lich"],
    noteLimit: 1000,
    events: ["DAT_LICH", "DUYET", "TU_CHOI", "HUY"],
  },
  lich_su_thu_chi: {
    id: "ma_lich_su",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_phieu"],
  },
  lich_su_lien_ket_qr: {
    id: "ma_lich_su",
    actor: "ma_nguoi_thuc_hien",
    targets: ["ma_vi_tri_qr"],
    links: ["ma_thiet_bi_cu", "ma_thiet_bi_moi"],
    defaults: { ma_thiet_bi_cu: null, ma_thiet_bi_moi: null },
    fixedEvent: "LIEN_KET_QR",
    noNote: true,
  },
};
export const historyTargets = {
  ma_phan_anh: ["phan_anh", "ma_phan_anh", "RESTRICT"],
  ma_hoa_don: ["hoa_don", "ma_hoa_don", "RESTRICT"],
  ma_can_ho: ["can_ho", "ma_can_ho", "CASCADE"],
  ma_thong_bao: ["thong_bao", "ma_thong_bao", "CASCADE"],
  ma_thiet_bi: ["thiet_bi", "ma_thiet_bi", "CASCADE"],
  ma_phieu_bao_tri: ["phieu_bao_tri", "ma_phieu_bao_tri", "CASCADE"],
  ma_dat_lich: ["dat_lich_tien_ich", "ma_dat_lich", "CASCADE"],
  ma_phieu: ["phieu_thu_chi", "ma_phieu", "CASCADE"],
  ma_vi_tri_qr: ["vi_tri_qr", "ma_vi_tri_qr", "CASCADE"],
  ma_ky_thuat_vien_cu: ["nguoi_dung", "ma_nguoi_dung", "RESTRICT"],
  ma_ky_thuat_vien_moi: ["nguoi_dung", "ma_nguoi_dung", "RESTRICT"],
  ma_thiet_bi_cu: ["thiet_bi", "ma_thiet_bi", "RESTRICT"],
  ma_thiet_bi_moi: ["thiet_bi", "ma_thiet_bi", "RESTRICT"],
};

export function historyRecord(topic, record, legacy = false) {
  const config = historyCatalog[topic];
  if (!config) throw new Error("Unknown history topic");
  const r = { ...config.defaults, ...record };
  const payload = [];
  for (const [name, [type]] of Object.entries(config.payload || {})) {
    let value = r[name];
    if (value === undefined) throw new Error(`Missing history field ${name}`);
    // Validate a serialized JSON snapshot but keep its exact numeric tokens.
    // Parsing and re-stringifying could round integers above 2^53 during copy.
    const serialized =
      type === "json" && typeof value === "string"
        ? value
        : JSON.stringify(value);
    if (type === "json" && typeof value === "string") JSON.parse(value);
    payload.push(`${JSON.stringify(name)}:${serialized}`);
  }
  const result = {
    loai_nhat_ky: topic,
    ma_goc: legacy ? r[config.id] : null,
    ma_nguoi_thuc_hien: r[config.actor] ?? null,
    su_kien: config.fixedEvent || r[config.event || "su_kien"],
    ghi_chu: config.noNote ? null : r.ghi_chu,
    chi_tiet: `{${payload.join(",")}}`,
  };
  for (const name of [...config.targets, ...(config.links || [])])
    result[name] = r[name] ?? null;
  if (r[config.time || "ngay_tao"])
    result.ngay_tao = r[config.time || "ngay_tao"];
  if (legacy) {
    // Original per-topic IDs remain exposed by the views. The encoded primary
    // key is globally unique and advances AUTO_INCREMENT beyond every old ID.
    result.ma_nhat_ky = (
      BigInt(r[config.id]) * 8n +
      BigInt(Object.keys(historyCatalog).indexOf(topic) + 1)
    ).toString();
  }
  return result;
}

export async function appendHistory(db, topic, columns, values) {
  const record = historyRecord(
    topic,
    Object.fromEntries(columns.map((name, i) => [name, values[i]])),
  );
  const names = Object.keys(record);
  const [result] = await db.execute(
    `INSERT INTO nhat_ky_nghiep_vu (${names.join(",")}) VALUES (${names.map(() => "?").join(",")})`,
    Object.values(record),
  );
  return result;
}
