import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearch } from "../frontend/src/shared/search.js";
import {
  filterServices,
  portalServices,
  serviceDestination,
} from "../frontend/src/features/incidents/portal-services.js";
import { isFunctionActive } from "../frontend/src/app/navigation.js";

test("tìm tiếng Việt có/không dấu, đ và khoảng trắng", () => {
  assert.equal(matchesSearch("HOADON", "Hóa đơn của tôi"), true);
  assert.equal(matchesSearch("dien nuoc", "Chỉ số điện nước"), true);
  assert.equal(matchesSearch("  đặt-lịch ", "Đặt lịch tiện ích"), true);
  assert.equal(matchesSearch("thu chi", "Hóa đơn"), false);
});

test("bộ lọc danh mục và từ khóa cùng áp dụng; trạng thái rỗng có thể khôi phục", () => {
  const catalog = portalServices(null);
  assert.deepEqual(
    filterServices(catalog, "hoadon", "finance").map((s) => s.id),
    ["bills"],
  );
  assert.equal(filterServices(catalog, "hoadon", "account").length, 0);
  assert.equal(filterServices(catalog, "khong co dich vu nay").length, 0);
  assert.equal(filterServices(catalog, "").length, catalog.length);
});

test("ý định đăng nhập chỉ mở dịch vụ có sẵn và đúng vai trò", () => {
  assert.equal(
    serviceDestination({ vai_tro: "CU_DAN" }, "bills"),
    "/cu-dan/hoa-don",
  );
  assert.equal(
    serviceDestination({ vai_tro: "QUAN_TRI_VIEN" }, "bills"),
    "/quan-tri/hoa-don",
  );
  assert.equal(
    serviceDestination({ vai_tro: "KY_THUAT_VIEN" }, "bills"),
    undefined,
  );
  for (const value of [
    "https://example.com",
    "//example.com",
    "/quan-tri/nhan-su",
    {},
    null,
  ])
    assert.equal(serviceDestination({ vai_tro: "CU_DAN" }, value), undefined);
});

test("danh mục kỹ thuật không có lối tắt tới tài chính hoặc quản trị", () => {
  const paths = portalServices({ vai_tro: "KY_THUAT_VIEN" }).map((s) => s.path);
  assert.ok(paths.includes("/ky-thuat/cong-viec"));
  assert.ok(paths.includes("/ky-thuat/bao-tri"));
  assert.ok(
    !paths.some((p) => p.startsWith("/quan-tri") || p.includes("hoa-don")),
  );
});

test("menu đánh dấu đúng trang chi tiết và các danh sách con", () => {
  assert.equal(
    isFunctionActive("/quan-tri/bao-tri/42", "/quan-tri/thiet-bi"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/dat-lich/42", "/quan-tri/tien-ich"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/phieu-thu-chi/42", "/quan-tri/quy"),
    true,
  );
  assert.equal(
    isFunctionActive("/cu-dan/dat-lich/42", "/cu-dan/tien-ich"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/can-ho/42", "/quan-tri/can-ho"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/can-ho-khac", "/quan-tri/can-ho"),
    false,
  );
  assert.equal(isFunctionActive("/quan-tri/hoa-don", "/quan-tri"), false);
});
