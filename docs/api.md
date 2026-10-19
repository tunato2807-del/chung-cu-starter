# API luồng phản ánh QR

API trả `{ data }`, danh sách phản ánh thêm `meta: { page, page_size, total }` (20 dòng/trang). Lỗi trả `{ error: { code, message, field_errors?, request_id } }`. Request JSON có Content-Type application/json. Mọi request POST/PATCH phải có `X-App-Request: 1` và dùng cookie phiên cùng origin; không gửi role từ trình duyệt để quyết định quyền.

| Method | Đường dẫn dưới /api | Quyền / nội dung |
|---|---|---|
| POST | /xac_thuc/dang_nhap | Công khai; so_dien_thoai, mat_khau |
| GET | /xac_thuc/toi | Phiên hợp lệ |
| POST | /xac_thuc/dang_xuat | Kết thúc tất cả phiên, xóa cookie ngay cả khi phiên cũ đã vô hiệu |
| POST | /xac_thuc/doi_mat_khau | mat_khau_cu, mat_khau_moi; kết thúc các phiên |
| GET, POST | /nguoi_dung | BQL; tạo với ho_va_ten, so_dien_thoai, mat_khau, vai_tro (KY_THUAT_VIEN/CU_DAN), chuyen_mon tùy chọn |
| PATCH | /nguoi_dung/:id | BQL; dang_hoat_dong boolean; không tự khóa/BQL |
| GET, POST | /vi_tri_qr | BQL; tạo với ten_vi_tri, loai KHU_VUC/THIET_BI, mo_ta tùy chọn; luôn có token |
| PATCH | /vi_tri_qr/:id | BQL; dang_hoat_dong boolean |
| POST | /vi_tri_qr/:id/sinh_lai_qr | BQL; thay token, mã cũ không dùng được |
| GET | /cong_khai/vi_tri_qr/:token | Công khai; chỉ tên/mô tả vị trí đang hoạt động |
| POST | /cong_khai/phan_anh | Công khai hoặc phiên hiện có; multipart, xem dưới |
| POST | /cong_khai/phan_anh/tra_cuu | Công khai; ma_tra_cuu và so_dien_thoai trong body |
| GET | /phan_anh | Theo quyền bản ghi; lọc q, trang_thai, loai_su_co, page |
| GET | /phan_anh/:id | Theo quyền; chi tiết, ảnh metadata, lịch sử được phép |
| GET | /phan_anh/:id/hinh_anh/:image | Theo quyền; ảnh JPEG, không có URL thư mục công khai |
| PATCH | /phan_anh/:id/phan_cong | BQL; phien_ban, ma_ky_thuat_vien, do_uu_tien, ghi_chu tùy chọn |
| PATCH | /phan_anh/:id/trang_thai | BQL/KTV; phien_ban, trang_thai, ghi_chu, noi_dung_cong_khai tùy chọn, ma_phan_anh_goc khi TRUNG |
| GET | /health, /ready | Liveness và DB readiness riêng |

Gửi phản ánh: multipart gồm token_qr, khoa_yeu_cau (UUID v4), tieu_de (3–150), noi_dung (10–5000), ten_nguoi_gui, so_dien_thoai, loai_su_co (DIEN/NUOC/THANG_MAY/VE_SINH/AN_NINH/KHAC), can_ho_khai_bao tùy chọn và tối đa 5 tệp `hinh_anh`. Không nhận ID vị trí/người gửi hoặc ưu tiên từ client. Nếu nhận 409 SIMILAR_REPORT, người gửi có thể xác nhận bằng xac_nhan_gui=true, giữ nguyên khóa yêu cầu. Request lặp cùng nội dung trả 200 với mã cũ; mới trả 201. Mã tra cứu chỉ xuất hiện trong kết quả gửi, không trả trong danh sách/chi tiết.

KTV hoàn thành dùng **multipart PATCH trang_thai** với DA_XU_LY, ghi_chu bắt buộc và ít nhất một tệp hinh_anh mới. Ảnh, trạng thái và lịch sử commit cùng nhau, không có bước upload nghiệm thu riêng có thể bị bỏ dở. Các thao tác khác có thể gửi JSON. QR được vẽ/in tại frontend từ URL /r/:token cùng origin, không cần API sinh ảnh.

HTTP: 400 JSON lỗi, 401 thiếu/hết phiên, 403 sai vai trò/CSRF, 404 không thuộc quyền hoặc QR sai, 409 xung đột phiên bản/trạng thái/gửi lặp, 413 vượt giới hạn tải, 422 lỗi dữ liệu, 429 vượt tần suất, 503 database chưa sẵn sàng. Danh sách nhân sự/vị trí của bản demo giới hạn 200/500; phân trang hai danh mục này cần bổ sung khi quy mô tăng.

## Căn hộ và cư trú (chỉ BQL)

Mọi endpoint bên dưới yêu cầu phiên BQL; cư dân và KTV không được đọc danh bạ. Request ghi vẫn cần `X-App-Request: 1`. Danh sách trả `{data, total, page}`, 20 bản ghi/trang; chi tiết/ghi trả `{data}`. Lỗi theo cấu trúc chung; 409 khi số căn/tài khoản đã tồn tại hoặc phiên bản cũ.

| Method | URL | Nội dung |
|---|---|---|
| GET | `/api/can_ho?q=&tang=&page=1` | Tìm số căn/khối và lọc tầng; trả số cư dân đang ở |
| GET | `/api/can_ho/:id` | Thông tin căn và cư dân đang ở |
| POST | `/api/can_ho` | `so_can_ho`, `khoi`, `tang`, `dien_tich_m2`, `tinh_phi_dich_vu` (boolean) |
| PATCH | `/api/can_ho/:id` | Các trường như tạo và `phien_ban` hiện tại |
| GET | `/api/cu_dan?q=&trang_thai=&ma_can_ho=&page=1` | Tìm tên/SĐT; trạng thái rỗng, `DANG_O` hoặc `DA_CHUYEN_DI` |
| GET | `/api/cu_dan/tai_khoan?q=&page=1` | Tìm tài khoản cư dân đang hoạt động, chưa gắn hồ sơ; chỉ trả mã/tên/SĐT |
| GET | `/api/cu_dan/:id` | Hồ sơ và `history` đầy đủ, mới trước |
| POST | `/api/cu_dan` | `ho_va_ten`, `so_dien_thoai`, `ma_nguoi_dung` tùy chọn, `ma_can_ho`, `quan_he`, `ngay` |
| PATCH | `/api/cu_dan/:id` | Thông tin hồ sơ, liên kết tài khoản tùy chọn và `phien_ban`; không đổi căn bằng route này |
| POST | `/api/cu_dan/:id/chuyen_can` | `ma_can_ho`, `quan_he`, `ngay`, `phien_ban`; đóng đợt cũ/mở đợt mới cùng giao dịch |
| POST | `/api/cu_dan/:id/chuyen_di` | `ngay`, `phien_ban`; kết thúc đợt đang mở |
| POST | `/api/cu_dan/:id/nhap_cu` | `ma_can_ho`, `quan_he`, `ngay`, `phien_ban`; mở đợt sau khi đã chuyển đi |

`quan_he`: `CHU_HO`, `THANH_VIEN`, `NGUOI_THUE`. `ngay` là ngày lịch Việt Nam `YYYY-MM-DD`, không sau hôm nay. Ngày kết thúc không được trước ngày bắt đầu; cho phép chuyển nhiều lần trong ngày. Đợt cũ cùng ngày có `tu_ngay = den_ngay` và giữ lại để xem lịch sử; chỉ đợt chưa kết thúc là căn đang ở. Các đợt có thời gian cư trú không chồng nhau. Không nhận yêu cầu xóa cứng hồ sơ/căn/lịch sử. Chuyển đi giữ tài khoản cá nhân; tài khoản căn có người phụ trách chuyển đi sẽ bị tạm khóa. Cờ tính phí dịch vụ được lưu độc lập với tình trạng trống, chưa phát sinh hóa đơn.

## Phương tiện (chỉ BQL)

Mọi endpoint yêu cầu phiên BQL. Request ghi cần `X-App-Request: 1`. Danh sách trả `{data,total,page}`, 20 bản ghi/trang. Tạo trả 201 `{data:{ma_phuong_tien}}`; chi tiết trả `{data}`.

| Method | URL | Nội dung |
|---|---|---|
| GET | `/api/phuong_tien?q=&loai_xe=&trang_thai=&ma_cu_dan=&ma_can_ho=&page=1` | Tìm mã/biển, tên/SĐT cư dân hoặc căn; lọc loại, `DANG_GUI` / `DA_KET_THUC` |
| GET | `/api/phuong_tien/:id` | Chủ xe, căn chịu phí, đợt, người tạo/kết thúc và đăng ký trước khi chuyển căn |
| POST | `/api/phuong_tien` | `ma_cu_dan`, `ma_lich_su_cu_tru`, `loai_xe`, `bien_so`, `hang_xe`, `mau_sac`, `ngay_dang_ky` |
| POST | `/api/phuong_tien/:id/ket_thuc` | `ngay_ket_thuc`, `ly_do_ket_thuc` (3–255 ký tự), `phien_ban` |

Loại xe: `O_TO`, `XE_MAY`, `XE_DAP`. Biển được viết hoa, bỏ chấm/gạch nối/khoảng trắng; cần 5–15 chữ cái/số với ít nhất một chữ số. Xe đạp cho null/rỗng. Hãng và màu tùy chọn, tối đa 50 ký tự. Ngày đăng ký/kết thúc là `YYYY-MM-DD`, không trong tương lai; ngày đăng ký từ ngày bắt đầu đợt đang mở, ngày kết thúc từ ngày đăng ký. Server tự lấy căn từ đợt và từ chối căn khác nếu client gửi. Đợt client đã cũ trả 409 `STALE_RESIDENCY`; biển đang dùng hoặc khoảng ngày chồng nhau trả 409 `PLATE_IN_USE`.

`GET /api/cu_dan` bổ sung bộ lọc `ma_cu_dan` và trường `ma_lich_su_cu_tru` cho đợt đang ở. `POST /api/cu_dan/:id/chuyen_can` nhận thêm `chuyen_phuong_tien` boolean tùy chọn, mặc định false. Dù chọn chuyển tiếp hay không, xe đang gửi thuộc đợt cũ đều kết thúc cùng ngày chuyển. Nếu true, tạo bản mới trong căn mới, liên kết bản cũ bằng `ma_dang_ky_truoc`. Chuyển đi chỉ kết thúc, không tạo mới. Ngày chuyển không được trước ngày đăng ký/kết thúc xe trong đợt; trả 422 `VEHICLE_DATE_CONFLICT`. Mọi thay đổi cùng transaction và vẫn chấp nhận chuyển nhiều lần trong ngày.

Không có API sửa/xóa đăng ký. Gọi kết thúc lặp với cùng ngày trả thành công, không đổi lịch sử; ngày khác trên bản đã kết thúc trả 409. Chưa triển khai API tính phí gửi xe hoặc hóa đơn.

## Phí, chỉ số và hóa đơn

Các route cấu hình/ghi dưới đây chỉ dành cho BQL, cần phiên và `X-App-Request: 1` khi ghi. Danh sách `{data,total,page}` phân trang 20 bản ghi; chi tiết `{data}`. Tiền và số thập phân trả dạng chuỗi.

| Method | URL | Trường chính |
|---|---|---|
| GET, POST | `/api/cau_hinh_phi` | GET lọc loai_phi/page; POST loai_phi,don_gia,tu_ngay (có thể tương lai) |
| GET, PUT | `/api/chi_so_dich_vu` | GET ma_can_ho/ky_thanh_toan/page; PUT ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ghi_chu; ky_dau=true cho kỳ đầu, phien_ban khi sửa |
| GET | `/api/hoa_don` | q,ky_thanh_toan,trang_thai,ma_can_ho,page |
| GET | `/api/hoa_don/:id` | Chi tiết, dòng tiền, lỗi nguồn, lịch sử và qr_payload khi DA_GUI |
| POST | `/api/hoa_don/lap` | ma_can_ho,ky_thanh_toan,ngay_chot_phi,tinh_nuoc/tinh_dien/tinh_xe (boolean bắt buộc), lập từng căn |
| POST | `/api/hoa_don/:id/tinh_lai` | phien_ban; tùy chọn đổi ngày chốt/các cờ trên bản NHAP |
| POST | `/api/hoa_don/:id/duyet` | phien_ban; không nhận giá hoặc tổng do client tính |
| POST | `/api/hoa_don/:id/gui` | phien_ban,han_thanh_toan,ma_ngan_hang (BIN 6 số),so_tai_khoan (6–30 số),ten_nguoi_nhan |
| POST | `/api/hoa_don/:id/huy` | phien_ban,ly_do; chỉ NHAP/DA_DUYET/DA_GUI |
| POST | `/api/hoa_don/:id/lap_thay_the` | phien_ban của bản HUY gần nhất; tùy chọn ngày chốt/cờ thu mới |
| POST | `/api/hoa_don/:id/xac_nhan_thanh_toan` | phien_ban,so_tien (nguyên đồng đúng tổng),ma_tham_chieu (duy nhất) |
| GET | `/api/cua_toi/hoa_don` | Cư dân: danh sách đã gửi/đã thu đúng căn và đợt đang ở |
| GET | `/api/cua_toi/hoa_don/:id` | Cư dân: chi tiết rút gọn, không log/nguồn nội bộ; sai phạm vi trả 404 |

Loại phí: PHI_QUAN_LY, GUI_O_TO, GUI_XE_MAY, GUI_XE_DAP, TIEN_NUOC, TIEN_DIEN. Loại chỉ số: DIEN/NUOC. Kỳ YYYY-MM, chỉ số 3 số lẻ, giá 2 số lẻ. Ngày chốt phí và chỉ số phải cùng kỳ, cùng ngày; không sau hôm nay. Hạn trả từ ngày hiện tại và không trước ngày chốt. Cờ phí quản lý lấy từ căn; BQL chọn rõ nước/điện/xe. Không ngầm bỏ phí thiếu chỉ số hoặc giá, nháp giữ danh sách lỗi và không được duyệt.

409 STALE_BILL_SOURCE khi nguồn thay đổi; METER_LOCKED khi sửa kỳ đã duyệt/gửi/thu; BILLED_VEHICLE_PERIOD khi thêm/kết thúc/chuyển xe làm đổi ngày đã chốt (cả căn đi/đến). Gửi lại xác nhận thu đã thành công với cùng số tiền/tham chiếu không ghi thu lần hai. Đổi căn hoặc chuyển đi thu hồi quyền xem hóa đơn căn cũ ngay. Ngân hàng và tài khoản chỉ lưu để dựng QR; không có API ngân hàng, webhook hoặc thanh toán một phần.


## Cấu hình điện bậc thang (migration 006)

`POST /api/cau_hinh_phi` vẫn dành cho BQL, thêm ví dụ:

```json
{
  "loai_phi": "TIEN_DIEN",
  "cach_tinh": "BAC_THANG",
  "thue_gtgt": "8",
  "tu_ngay": "2026-09-01",
  "bac_dien": [
    { "den_kwh": 50, "don_gia": "1984" },
    { "den_kwh": 100, "don_gia": "2050" },
    { "den_kwh": 200, "don_gia": "2380" },
    { "den_kwh": 300, "don_gia": "2998" },
    { "den_kwh": 400, "don_gia": "3350" },
    { "den_kwh": null, "don_gia": "3460" }
  ]
}
```

Đây là mẫu theo số liệu người dùng cung cấp, chưa xác minh hiệu lực. `den_kwh` là ngưỡng cộng dồn nguyên (không phải chiều rộng mỗi bậc), tăng dần, bậc cuối bắt buộc null; 2–12 bậc. Khi BAC_THANG, server lưu don_gia gốc = 0; giá thực ở mỗi bậc. Khi DON_GIA, cần don_gia, bac_dien null/không gửi, có thể gửi thue_gtgt cho điện. Bỏ các trường mới giữ tương thích DON_GIA/0%. Phí khác không nhận bậc/thuế điện.

`GET /api/cau_hinh_phi` trả thêm cach_tinh, thue_gtgt, bac_dien. Quy tắc phiên bản nối tiếp và RATE_IN_USE vẫn áp dụng cho cả biểu giá; không có API sửa/xóa bậc đã lưu. Cần ngày mới sau phiên bản gần nhất và không hồi tố qua hóa đơn còn hiệu lực dùng phiên bản trước.

Lập hóa đơn vẫn dùng `tinh_dien: true`, cùng chỉ số DIEN. Chi tiết điện gồm các dòng bậc thực dùng và một dòng thuế (nếu >0%). Lượng 0 kWh có dòng bậc đầu = 0. Thuế là một khoản thu (số lượng 1, đơn giá bằng khoản thuế), không phải một giá điện/kWh. Đơn vị kWh chỉ dành cho dòng điện. Các dòng công khai có diễn giải thuế/cơ sở thuế, không lộ mã nội bộ. QR/tổng thanh toán đã gồm thuế. Không thêm thuế điện lên nước, xe hoặc quản lý. Không sửa hóa đơn đã duyệt/gửi/thu khi thêm phiên bản mới.

Áp dụng một biểu giá theo ngày chốt cho toàn kỳ của một căn/định mức. Chưa tách kỳ đổi giá, định mức nhiều hộ hay chia theo ngày; cần đối chiếu hồ sơ thu điện trước khi duyệt trong những trường hợp này. Căn thanh toán trực tiếp cho EVN cần bỏ `tinh_dien`.


## Tài khoản cố định theo căn (migration 007–008)

Đăng nhập `/api/xac_thuc/dang_nhap` nhận `ten_dang_nhap` (CH000001, không phân biệt hoa thường) hoặc trường `so_dien_thoai` cũ (chấp nhận cả CH... và SĐT). Tài khoản căn có vai_tro CU_DAN, ten_dang_nhap và ma_can_ho_thanh_toan; SĐT để null. Login SĐT cho tài khoản cá nhân giữ nguyên. Danh sách Nhân sự và chọn tài khoản cá nhân cư dân không trộn tài khoản căn. Không dùng PATCH nguoi_dung để mở lại tài khoản căn với mật khẩu cũ.

Tất cả thao tác quản lý dưới đây chỉ BQL, yêu cầu X-App-Request: 1 khi ghi:

| Endpoint | Thay đổi |
|---|---|
| POST /api/can_ho | Tạo căn và tài khoản trong cùng transaction. Trả data.tai_khoan_can_ho, có mat_khau_tam_thoi một lần |
| GET /api/can_ho/:id | Thêm tai_khoan_can_ho và lich_su_ban_giao (50 sự kiện gần nhất); không mật khẩu/hash |
| POST /api/cu_dan | CHU_HO tự gắn tài khoản căn, trả data.tai_khoan_can_ho với mật khẩu mới. Nếu có người phụ trách khác, cần xac_nhan_ban_giao: true |
| POST /api/cu_dan/:id/nhap_cu hoặc chuyen_can | Tương tự khi quan_he CHU_HO; chuyển người phụ trách đi khóa tài khoản căn cũ trong cùng transaction |
| GET /api/cu_dan/:id | Thêm tai_khoan_can_ho đang phụ trách (metadata), riêng với ma_nguoi_dung cá nhân |
| POST /api/can_ho/:id/tai_khoan | Cấp lại hoặc bàn giao, trả data là metadata và mat_khau_tam_thoi một lần |

Cấp lại: `{thao_tac: "cap_lai_mat_khau", phien_ban_ban_giao: 2}`. Bàn giao: `{thao_tac: "ban_giao", ma_cu_dan: 10, phien_ban_ban_giao: 2, xac_nhan_ban_giao: true}`. Người nhận phải là CHU_HO đang ở đúng căn. HANDOVER_REQUIRED 409 khi chưa xác nhận thay người phụ trách; STALE_VERSION 409 khi trạng thái đã đổi. Một lần reset/bàn giao tăng phiên bản bàn giao/token, đổi mật khẩu, xóa khóa đăng nhập sai và kích hoạt tài khoản; chuyển người phụ trách đi tăng phiên bản, tách cư dân, khóa tài khoản. Mọi log cùng transaction, lỗi ghi log rollback cả hồ sơ/cư trú/xe và mật khẩu.

Tài khoản căn chỉ xem hóa đơn DA_GUI/DA_THANH_TOAN đúng ma_can_ho_thanh_toan; kiểm tra phiên bản token ngay trong truy vấn hóa đơn. Cho xem cả kỳ trước ngày nhập cư của người phụ trách mới; không tự thay thông tin tài chính hoặc xác nhận thanh toán. Tài khoản cá nhân vẫn theo phạm vi cư trú cũ. Người phụ trách cũ mất quyền dùng mật khẩu/phiên của tài khoản căn khi bàn giao, tài khoản cá nhân của họ không bị xóa.

Chi tiết hóa đơn thêm `nguoi_phu_trach_thanh_toan` để hiển thị người phụ trách **hiện tại** từ tài khoản căn; không ghi đè snapshot tiền hoặc nghĩa vụ tài chính của kỳ cũ.


## Danh sách riêng và đăng nhập SĐT chủ hộ

`GET /api/can_ho/tai_khoan?q=&trang_thai=&page=1` chỉ BQL, trả `{data,total,page}`, 20 dòng/trang. q tìm số căn/khối/mã CH/tên chủ hộ/SĐT hiện tại; trạng thái DANG_HOAT_DONG hoặc DA_KHOA. Dữ liệu gồm căn, tên đăng nhập CH, người phụ trách, dien_thoai_phu_trach, trạng thái và phiên bản bàn giao, không password/hash. Đăng ký route này trước /:id.

`POST /api/xac_thuc/dang_nhap` nhận SĐT chủ hộ phụ trách hiện tại hoặc CH trong trường `so_dien_thoai`/`ten_dang_nhap`. SĐT +84 được chuẩn hóa như tài khoản cá nhân. Không copy SĐT vào nguoi_dung.so_dien_thoai của tài khoản căn; ánh xạ từ cu_dan qua ma_cu_dan_phu_trach nên thay người phụ trách sẽ loại SĐT cũ ngay. Mật khẩu vẫn là mật khẩu tài khoản căn được cấp/bàn giao, không mặc định bằng mật khẩu cá nhân.

Trường tùy chọn `loai_tai_khoan`: TU_DONG (mặc định), CAN_HO, CA_NHAN. Khi nhập CH thì dùng tài khoản căn cụ thể. Với SĐT, TU_DONG chỉ đăng nhập nếu có đúng một tài khoản hoạt động khớp mật khẩu; nếu nhiều tài khoản cùng khớp trả 409 LOGIN_ACCOUNT_CHOICE, không tự chọn tài khoản và không trả danh sách danh tính cho người chưa đăng nhập. Người dùng chọn CAN_HO/CA_NHAN hoặc mã CH. SĐT khớp hơn 10 ứng viên thì dùng CH/chọn loại, không chạy kiểm tra mật khẩu không giới hạn. Một lần đăng nhập thành công không tăng số lần sai cho các tài khoản khác cùng SĐT.

Auth response thêm dien_thoai_dang_nhap của chủ hộ phụ trách. Sửa SĐT hồ sơ của người phụ trách tăng phiên bản token/bàn giao, xóa khóa đăng nhập sai, ghi DOI_SO_DIEN_THOAI trong cùng transaction. Không đổi mật khẩu chỉ vì sửa SĐT của cùng người. Bàn giao sang người khác vẫn đổi mật khẩu và ngắt phiên như trước; chuyển đi tách người phụ trách, khóa tài khoản và loại SĐT khỏi đăng nhập căn. Tài khoản cá nhân riêng vẫn giữ SĐT/quyền của chính nó.

## Thông báo và nhắc phí (migration 009)

Mọi request ghi có `X-App-Request: 1` và cookie. BQL là QUAN_TRI_VIEN, hộp riêng chỉ CU_DAN; KTV/khách bị chặn. List phân trang 20, `{data,total,page}`; chi tiết/hành động `{data}`. Truy cập ID ngoài phạm vi trả 404.

| API | Quyền và hành vi |
| --- | --- |
| GET /api/thong_bao?q=&loai=&trang_thai=&page=1 | BQL xem mọi bản, loại THONG_BAO/NHAC_PHI, trạng thái NHAP/DA_GUI/THU_HOI |
| POST /api/thong_bao | BQL tạo bản nháp; trả ma_thong_bao |
| GET /api/thong_bao/:id | BQL chi tiết + history |
| PUT /api/thong_bao/:id | BQL sửa bản nháp, body có phien_ban |
| POST /api/thong_bao/:id/phat_hanh | BQL, body {phien_ban}; chỉ bản nháp chung |
| POST /api/thong_bao/:id/thu_hoi | BQL, body {phien_ban,ly_do}; lý do 3–255 ký tự |
| GET /api/cua_toi/thong_bao?q=&loai=&chua_doc=1&page=1 | Cư dân: chỉ thông báo đang phát hành đúng phạm vi; có ngay_doc/chua_doc |
| GET /api/cua_toi/thong_bao/chua_doc | Cư dân: {data:{so_chua_doc}} |
| GET /api/cua_toi/thong_bao/:id | Cư dân: chi tiết, không tự đánh dấu đọc, không trả history nội bộ |
| POST /api/cua_toi/thong_bao/:id/da_doc | Cư dân: đánh dấu đọc idempotent; body {} |
| POST /api/hoa_don/:id/nhac_phi | BQL, body {phien_ban}; chỉ DA_GUI, trả ma_thong_bao/da_ton_tai |

Body bản nháp: `{tieu_de,noi_dung,pham_vi,muc_do,khoi?,ma_can_ho?}`. Tiêu đề 3–160 ký tự, nội dung văn bản thuần 3–6000. pham_vi TOAN_BO/KHOI/CAN_HO; KHOI cần khối 1–10 ký tự có căn tồn tại, CAN_HO cần ID căn tồn tại; bỏ các trường không dùng về NULL. muc_do THUONG/QUAN_TRONG. Nội dung đã phát hành không sửa; thu hồi kèm lý do, giữ lịch sử. Phiên bản cũ trả 409 STALE_VERSION.

Phạm vi đọc xét lại trong SQL theo căn cố định hoặc cư trú đang mở, không dựa số điện thoại hay căn client. Nhắc phí chỉ tài khoản căn hoặc cá nhân của người phụ trách hiện tại; cá nhân cần ngày bắt đầu cư trú không sau ngày chốt hóa đơn. Cư dân không có căn đang ở nhận hộp rỗng. Chủ hộ mới có receipt riêng trên cùng tài khoản căn; người cũ không xem nhắc phí qua tài khoản cá nhân sau bàn giao.

Nhắc phí lấy nội dung, tiền, kỳ và hạn từ server; khóa căn/hóa đơn và UNIQUE(ma_hoa_don,ngay_nhac) với ngày Asia/Ho_Chi_Minh. Gọi lại cùng ngày trả ID cũ/da_ton_tai=true, kể cả đã thu hồi thông báo; không nhân đôi hoặc đổi hóa đơn. Hóa đơn đã thu trả INVALID_STATE khi nhắc mới, nhắc cũ vẫn xem được nhưng chua_doc=0; hóa đơn hủy ẩn nhắc cũ khỏi cư dân. Đây là nhắc trên web bằng thao tác BQL, không có SMS/email/cron.
