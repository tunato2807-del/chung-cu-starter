import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";

const optionalText = (value, field, max) => text(value ?? "", field, 0, max);
function floorNumber(value) {
  const floor = integer(value, "tang");
  if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
  return floor;
}
function version(row, body) {
  if (row.phien_ban !== integer(body.phien_ban, "phien_ban"))
    fail(
      409,
      "STALE_STRUCTURE",
      "Khối/tầng đã thay đổi. Hãy tải lại danh mục trước khi sửa.",
    );
}
async function block(db, code) {
  const [row] = await rows(
    db,
    "SELECT * FROM khoi_toa_nha WHERE khoi=? FOR UPDATE",
    [code],
  );
  if (!row)
    fail(404, "BLOCK_NOT_FOUND", "Không tìm thấy khối. Hãy tải lại danh mục.");
  return row;
}
async function floor(db, code, number) {
  const [row] = await rows(
    db,
    "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=? FOR UPDATE",
    [code, number],
  );
  if (!row)
    fail(404, "FLOOR_NOT_FOUND", "Không tìm thấy tầng. Hãy tải lại danh mục.");
  return row;
}

// Existing Excel/API clients may still send free-text block/floor values.
// Provision both parents inside the SAME transaction as the apartment write.
export async function apartmentFloor(db, code, number, body) {
  if (
    body.chon_cau_truc !== undefined &&
    typeof body.chon_cau_truc !== "boolean"
  )
    fail(422, "VALIDATION", "Lựa chọn cấu trúc không hợp lệ.");
  if (body.chon_cau_truc) {
    const [parent] = await rows(
      db,
      "SELECT khoi FROM khoi_toa_nha WHERE khoi=? FOR SHARE",
      [code],
    );
    const [selected] = await rows(
      db,
      "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=? FOR SHARE",
      [code, number],
    );
    if (
      !parent ||
      !selected ||
      selected.phien_ban !== integer(body.phien_ban_tang, "phien_ban_tang")
    )
      fail(
        409,
        "STALE_STRUCTURE",
        "Khối/tầng đã đổi hoặc không còn tồn tại. Hãy tải lại danh mục và chọn lại.",
      );
    return selected.khoi;
  }
  await rows(
    db,
    "INSERT INTO khoi_toa_nha (khoi,giu_khi_trong) VALUES (?,0) ON DUPLICATE KEY UPDATE khoi=khoi_toa_nha.khoi",
    [code],
  );
  await rows(
    db,
    "INSERT INTO tang_toa_nha (khoi,tang,giu_khi_trong) VALUES (?,?,0) ON DUPLICATE KEY UPDATE tang=tang_toa_nha.tang",
    [code, number],
  );
  const [selected] = await rows(
    db,
    "SELECT khoi FROM tang_toa_nha WHERE khoi=? AND tang=?",
    [code, number],
  );
  return selected.khoi;
}

export async function saveBlock(previous, body) {
  const code = text(body.khoi, "khoi", 1, 10),
    name = optionalText(body.ten_khoi, "ten_khoi", 100),
    note = optionalText(body.mo_ta, "mo_ta", 255);
  return transaction(async (db) => {
    if (previous !== null) {
      const current = await block(db, previous);
      version(current, body);
      if (code !== current.khoi) {
        const [equal] = await rows(
          db,
          "SELECT khoi FROM khoi_toa_nha WHERE khoi=?",
          [code],
        );
        if (equal?.khoi === current.khoi)
          fail(
            422,
            "SAME_BLOCK_CODE",
            "Không đổi mã khối chỉ bằng chữ hoa/thường hoặc dấu. Hãy dùng mã khác.",
          );
      }
      await rows(
        db,
        "UPDATE khoi_toa_nha SET khoi=?,ten_khoi=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=?",
        [code, name, note, current.khoi],
      );
      if (code !== current.khoi) {
        // FK cascades keys; versions also change so open apartment/floor forms
        // cannot silently move apartments back to the old structure.
        await rows(
          db,
          "UPDATE tang_toa_nha SET phien_ban=phien_ban+1 WHERE khoi=?",
          [code],
        );
        await rows(db, "UPDATE can_ho SET phien_ban=phien_ban+1 WHERE khoi=?", [
          code,
        ]);
      }
    } else {
      const [existing] = await rows(
        db,
        "SELECT * FROM khoi_toa_nha WHERE khoi=? FOR UPDATE",
        [code],
      );
      if (existing && !existing.giu_khi_trong) {
        const [used] = await rows(
          db,
          "SELECT (EXISTS (SELECT 1 FROM can_ho WHERE khoi=?) OR EXISTS (SELECT 1 FROM tang_toa_nha WHERE khoi=? AND giu_khi_trong=1)) AS n",
          [existing.khoi, existing.khoi],
        );
        if (used.n)
          fail(409, "ALREADY_EXISTS", "Khối đã tồn tại. Hãy chọn Sửa khối.");
        await rows(
          db,
          "UPDATE khoi_toa_nha SET ten_khoi=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=?",
          [name, note, existing.khoi],
        );
      } else
        await rows(
          db,
          "INSERT INTO khoi_toa_nha (khoi,ten_khoi,mo_ta) VALUES (?,?,?)",
          [code, name, note],
        );
    }
    return (
      await rows(db, "SELECT * FROM khoi_toa_nha WHERE khoi=?", [code])
    )[0];
  });
}
export async function saveFloor(code, previous, body) {
  const number = floorNumber(body.tang),
    name = optionalText(body.ten_tang, "ten_tang", 100),
    note = optionalText(body.mo_ta, "mo_ta", 255);
  return transaction(async (db) => {
    const parent = await block(db, text(code, "khoi", 1, 10));
    if (previous !== null) {
      const current = await floor(db, parent.khoi, floorNumber(previous));
      version(current, body);
      await rows(
        db,
        "UPDATE tang_toa_nha SET tang=?,ten_tang=?,mo_ta=?,giu_khi_trong=1,phien_ban=phien_ban+1 WHERE khoi=? AND tang=?",
        [number, name, note, parent.khoi, current.tang],
      );
      if (number !== current.tang)
        await rows(
          db,
          "UPDATE can_ho SET phien_ban=phien_ban+1 WHERE khoi=? AND tang=?",
          [parent.khoi, number],
        );
    } else {
      await rows(
        db,
        "INSERT INTO tang_toa_nha (khoi,tang,ten_tang,mo_ta) VALUES (?,?,?,?)",
        [parent.khoi, number, name, note],
      );
    }
    return (
      await rows(db, "SELECT * FROM tang_toa_nha WHERE khoi=? AND tang=?", [
        parent.khoi,
        number,
      ])
    )[0];
  });
}
export async function deleteStructure(code, number, body) {
  return transaction(async (db) => {
    const parent = await block(db, text(code, "khoi", 1, 10));
    if (number === null) {
      version(parent, body);
      const [count] = await rows(
        db,
        "SELECT COUNT(*) AS n FROM tang_toa_nha WHERE khoi=?",
        [parent.khoi],
      );
      if (count.n)
        fail(
          409,
          "STRUCTURE_IN_USE",
          "Khối còn tầng. Chỉ xóa được khối không có tầng; hãy xử lý từng tầng trước.",
        );
      await rows(db, "DELETE FROM khoi_toa_nha WHERE khoi=?", [parent.khoi]);
    } else {
      const selected = await floor(db, parent.khoi, floorNumber(number));
      version(selected, body);
      const [count] = await rows(
        db,
        "SELECT COUNT(*) AS n FROM can_ho WHERE khoi=? AND tang=?",
        [parent.khoi, selected.tang],
      );
      if (count.n)
        fail(
          409,
          "STRUCTURE_IN_USE",
          "Tầng đang có căn hộ. Hãy chuyển cấu trúc của các căn trước khi xóa tầng.",
        );
      await rows(db, "DELETE FROM tang_toa_nha WHERE khoi=? AND tang=?", [
        parent.khoi,
        selected.tang,
      ]);
    }
    return { da_xoa: true };
  });
}
