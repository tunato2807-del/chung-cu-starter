// This file only binds parameters and preserves the existing internal result
// interface. Domain SQL is PostgreSQL; no MySQL dialect is translated at runtime.
export function compileParameters(sql) {
  let output = "",
    index = 0,
    i = 0,
    state = "normal",
    dollar = "",
    depth = 0,
    escape = false;
  while (i < sql.length) {
    const c = sql[i],
      next = sql[i + 1];
    if (state === "single" || state === "double") {
      output += c;
      i++;
      const quote = state === "single" ? "'" : '"';
      if (state === "single" && escape && c === "\\" && i < sql.length) {
        output += sql[i++];
        continue;
      }
      if (c === quote) {
        if (next === quote) output += sql[i++];
        else state = "normal";
      }
      continue;
    }
    if (state === "line") {
      output += c;
      i++;
      if (c === "\n") state = "normal";
      continue;
    }
    if (state === "block") {
      if (c === "/" && next === "*") {
        output += "/*";
        i += 2;
        depth++;
      } else if (c === "*" && next === "/") {
        output += "*/";
        i += 2;
        if (--depth === 0) state = "normal";
      } else {
        output += c;
        i++;
      }
      continue;
    }
    if (state === "dollar") {
      if (sql.startsWith(dollar, i)) {
        output += dollar;
        i += dollar.length;
        state = "normal";
      } else {
        output += c;
        i++;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      escape = c === "'" && /(?:^|[^\w])E$/i.test(sql.slice(0, i));
      state = c === "'" ? "single" : "double";
      output += c;
      i++;
    } else if (c === "-" && next === "-") {
      state = "line";
      output += "--";
      i += 2;
    } else if (c === "/" && next === "*") {
      state = "block";
      depth = 1;
      output += "/*";
      i += 2;
    } else if (
      c === "$" &&
      sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)
    ) {
      dollar = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)[0];
      output += dollar;
      i += dollar.length;
      state = "dollar";
    } else {
      output += c === "?" ? `$${++index}` : c;
      i++;
    }
  }
  return output;
}

export function quoteIdentifier(value) {
  if (typeof value !== "string" || value.includes("\0"))
    throw new Error("Invalid SQL identifier");
  return '"' + value.replaceAll('"', '""') + '"';
}

export const identityColumns = {
  nguoi_dung: "ma_nguoi_dung",
  vi_tri_qr: "ma_vi_tri_qr",
  phan_anh: "ma_phan_anh",
  lich_su_phan_anh: "ma_lich_su_phan_anh",
  hinh_anh_phan_anh: "ma_hinh_anh_phan_anh",
  can_ho: "ma_can_ho",
  cu_dan: "ma_cu_dan",
  lich_su_cu_tru: "ma_lich_su_cu_tru",
  phuong_tien: "ma_phuong_tien",
  cau_hinh_phi: "ma_cau_hinh_phi",
  chi_so_dich_vu: "ma_chi_so_dich_vu",
  hoa_don: "ma_hoa_don",
  chi_tiet_hoa_don: "ma_chi_tiet_hoa_don",
  lich_su_hoa_don: "ma_lich_su_hoa_don",
  lich_su_ban_giao_can_ho: "ma_ban_giao",
  thong_bao: "ma_thong_bao",
  lich_su_thong_bao: "ma_lich_su",
  thiet_bi: "ma_thiet_bi",
  phieu_bao_tri: "ma_phieu_bao_tri",
  lich_su_bao_tri: "ma_lich_su",
  tien_ich: "ma_tien_ich",
  dat_lich_tien_ich: "ma_dat_lich",
  lich_su_dat_lich: "ma_lich_su",
  quy_tai_chinh: "ma_quy",
  phieu_thu_chi: "ma_phieu",
  chung_tu_thu_chi: "ma_chung_tu",
  lich_su_thu_chi: "ma_lich_su",
  dot_nhap_du_lieu: "ma_dot_nhap",
  dot_lap_hoa_don: "ma_dot_lap",
  dot_xu_ly_hoa_don: "ma_dot_xu_ly",
  lich_su_lien_ket_qr: "ma_lich_su",
};
