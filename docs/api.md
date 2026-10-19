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

`quan_he`: `CHU_HO`, `THANH_VIEN`, `NGUOI_THUE`. `ngay` là ngày lịch Việt Nam `YYYY-MM-DD`, không sau hôm nay. Ngày kết thúc không được trước ngày bắt đầu; cho phép chuyển nhiều lần trong ngày. Đợt cũ cùng ngày có `tu_ngay = den_ngay` và giữ lại để xem lịch sử; chỉ đợt chưa kết thúc là căn đang ở. Các đợt có thời gian cư trú không chồng nhau. Không nhận yêu cầu xóa cứng hồ sơ/căn/lịch sử. Chuyển đi không khóa tài khoản. Cờ tính phí dịch vụ được lưu độc lập với tình trạng trống, chưa phát sinh hóa đơn.

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
