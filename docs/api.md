# API luồng phản ánh QR

## Liên kết QR với hồ sơ thiết bị (migration 018)

Các API quản lý QR chỉ BQL; POST/PATCH/PUT vẫn cần cookie và `X-App-Request: 1`.

| Method | Đường dẫn dưới `/api` | Nội dung |
|---|---|---|
| GET | `/vi_tri_qr?q=&ma_thiet_bi=&page=1` | Tìm tên vị trí/mã tài sản/tên thiết bị, lọc thiết bị đang liên kết; `{data,total,page}`, 20 dòng/trang thay giới hạn 500 dòng cũ |
| GET | `/vi_tri_qr/:id` | Chi tiết và 20 lần đổi liên kết gần nhất, người thực hiện và mã tài sản cũ/mới |
| POST | `/vi_tri_qr` | Như trước, thêm `ma_thiet_bi` nullable, chỉ dùng khi loai=THIET_BI. Không bắt buộc gán thiết bị cho các vị trí tạo theo API cũ |
| PUT | `/vi_tri_qr/:id/thiet_bi` | `ma_thiet_bi` (ID hoặc null), `phien_ban`, `xac_nhan_doi_lien_ket: true`; cập nhật liên kết và lịch sử cùng transaction. Chỉ THIET_BI, không nhận thiết bị NGUNG_SU_DUNG |
| PATCH | `/vi_tri_qr/:id` | Trạng thái như trước; client mới gửi thêm phien_ban để chặn phiên bản cũ |
| POST | `/vi_tri_qr/:id/sinh_lai_qr` | Giữ quy trình cũ, client mới gửi phien_ban. Thay mã mới thu hồi token cũ |
| GET | `/cong_khai/vi_tri_qr/:token` | Công khai; tên/mô tả vị trí, phien_ban_qr và thiet_bi={ma_tai_san,ten_thiet_bi} hoặc null; không serial/ghi chú/lịch bảo trì/ID thiết bị |
| GET | `/phan_anh?ma_thiet_bi=ID` | Lọc theo thiết bị được ghi nhận lúc gửi; vẫn AND quyền người gửi/người được giao, không mở quyền xem danh bạ thiết bị cho KTV/cư dân |

Form mới gửi `phien_ban_qr` lấy từ QR công khai. Server khóa QR và thiết bị để lưu `ma_thiet_bi`, `ma_tai_san_luc_gui`, `ten_thiet_bi_luc_gui`, `vi_tri_thiet_bi_luc_gui`; không nhận các giá trị thiết bị từ client. Thiếu phiên bản trên QR có liên kết, hoặc phiên bản đã đổi, trả 409 QR_CHANGED. API cũ không gửi phiên bản vẫn gửi được ở QR chưa liên kết. Retry của yêu cầu đã thành công trả receipt cũ trước kiểm tra phiên bản mới, không tạo phản ánh lần hai.

Đổi/bỏ liên kết giữ token và snapshot cũ; không backfill phản ánh lịch sử. Kiểm tra phản ánh tương tự và gộp trùng yêu cầu cùng thiết bị snapshot (kể cả null), ngoài điều kiện cùng vị trí. Tra cứu công khai bằng mã bí mật giữ các trường tối thiểu như trước. BQL có link từ chi tiết phản ánh sang hồ sơ thiết bị; KTV/cư dân chỉ thấy snapshot trong bản ghi họ được đọc.

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
| GET | `/api/can_ho?q=&khoi=&tang=&trang_thai=&ma_can_ho=&page=1` | BQL; q tìm số căn/khối, khoi lọc đúng khối, tang 0–200, trang_thai rỗng/DANG_O/TRONG theo cư trú đang mở, ma_can_ho lọc đúng ID; 20 căn/trang, trả số cư dân đang ở |
| GET | `/api/can_ho/so_do` | BQL; tổng và phân cấp khối/tầng từ tất cả căn, số căn/có người ở/trống/cư dân; không thông tin cá nhân hoặc tài khoản |
| GET | `/api/can_ho/:id` | Thông tin căn và cư dân đang ở |
| POST | `/api/can_ho` | `so_can_ho`, `khoi`, `tang`, `dien_tich_m2`, `tinh_phi_dich_vu` (boolean) |
| PATCH | `/api/can_ho/:id` | Các trường như tạo và `phien_ban` hiện tại |

Từ migration 017, `GET /can_ho/so_do` đọc danh mục khối/tầng độc lập, có cả khối chưa có tầng và tầng chưa có căn. Block thêm `ten_khoi`, `mo_ta`, `phien_ban`; tầng thêm `ten_tang`, `mo_ta`, `phien_ban`. Số căn/cư dân vẫn suy ra từ căn và đợt cư trú đang mở. `GET /can_ho` thêm `khoi_danh_muc` để form chọn đúng khối khi dữ liệu cũ khác chữ hoa/thường theo collation MySQL.

| Method | Đường dẫn dưới `/api/cau_truc_toa_nha` | Dữ liệu / quy tắc; chỉ BQL |
|---|---|---|
| GET | `/` | Tổng và danh mục khối/tầng, cùng định dạng `/can_ho/so_do` |
| POST | `/khoi` | `khoi` 1–10 ký tự, `ten_khoi` tối đa 100, `mo_ta` tối đa 255; khối có thể chưa có tầng |
| PATCH | `/khoi/:khoi` | Các trường như tạo + `phien_ban`; đổi mã cập nhật mọi tầng/căn bằng FK cascade, tăng phiên bản các căn/tầng bị đổi |
| DELETE | `/khoi/:khoi` | Body `phien_ban`; chỉ khối không có tầng |
| POST | `/khoi/:khoi/tang` | `tang` số nguyên 0–200, `ten_tang` tối đa 100, `mo_ta` tối đa 255; khối phải tồn tại |
| PATCH | `/khoi/:khoi/tang/:tang` | Các trường như tạo + `phien_ban`; đổi số tầng cập nhật căn và tăng phiên bản căn |
| DELETE | `/khoi/:khoi/tang/:tang` | Body `phien_ban`; chỉ tầng không có căn |

Mã/số đã dùng trả 409, không gộp khối/tầng. Sửa phiên bản cũ trả 409; mục đã đổi khóa có thể trả 404. Không đổi mã khối chỉ bằng hoa/thường/dấu nếu MySQL coi hai mã bằng nhau. POST/PATCH/DELETE vẫn cần cookie và `X-App-Request: 1`.

Form căn hộ mới gửi `chon_cau_truc: true`, `phien_ban_tang` và `khoi`/`tang` đang chọn: server kiểm tra mục còn tồn tại/đúng phiên bản trước khi lưu. Client cũ/nhập Excel không gửi cờ này vẫn được hỗ trợ: tự khai báo khối/tầng trong cùng transaction tạo/sửa căn; lô/ghi căn lỗi rollback cả các mục mới. Các mục tự phát sinh được giữ trong DB để ràng buộc khóa ngoại, nhưng khối tự phát sinh không còn căn và không có tầng khai báo riêng được ẩn khỏi danh mục. Các mục được BQL khai báo/sửa hoặc backfill từ dữ liệu cũ được giữ hiển thị khi trống.

| Method | URL cư dân | Nội dung |
|---|---|---|
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

## Báo cáo công nợ và thu phí

Chỉ QUAN_TRI_VIEN. CU_DAN/KY_THUAT_VIEN trả 403, khách trả 401. Tất cả endpoint chỉ GET, không ghi hóa đơn/nhắc phí. Không có migration mới; dùng dữ liệu hóa đơn hiện có. Tiền là chuỗi số nguyên đồng, không chuyển sang số thực để cộng tổng.

| Endpoint | Kết quả |
| --- | --- |
| GET /api/bao_cao/bo_loc | {data:[{khoi}]}: khối có căn để chọn lọc |
| GET /api/bao_cao/cong_no | {data,summary,total,page,filters,ngay_bao_cao,tai_luc} |
| GET /api/bao_cao/thu_phi | Cùng cấu trúc, tổng hợp/chi tiết theo ngày xác nhận thu |

Cả hai nhận `khoi` (khớp chính xác, tối đa 10 ký tự), `q` (tìm số căn, tối đa 100), `ma_can_ho` (ID dương) và `page` (1–100000, 20 dòng/trang). Lọc q/ma_can_ho/khối tác động cả tổng hợp và chi tiết. Trường thời gian tai_luc ở UTC; ngay_bao_cao là ngày lịch Việt Nam. Mỗi response dùng một read-only consistent snapshot, không khóa hóa đơn.

Công nợ nhận thêm `tu_ky`, `den_ky` dạng YYYY-MM, để trống = không giới hạn; từ kỳ không sau đến kỳ. `che_do=CAN_HO` mặc định (gom căn còn nợ), `HOA_DON` (chỉ hóa đơn DA_GUI), `THEO_KY` (gom kỳ, gồm sent/paid). `qua_han=0|1` chỉ dùng với CAN_HO/HOA_DON. Khi CAN_HO + quá hạn: chọn căn có ít nhất một hóa đơn quá hạn nhưng vẫn cộng toàn bộ nợ của căn trong bộ lọc. Khi HOA_DON + quá hạn: chỉ lấy hóa đơn quá hạn. Bộ lọc này không đổi summary.

summary công nợ: `tong_da_gui`, `da_thu`, `con_phai_thu`, `no_qua_han`, `so_hoa_don`, `so_hoa_don_da_thu`, `so_hoa_don_chua_thu`, `so_hoa_don_qua_han`, `so_can_con_no`, `ty_le_da_thu` (phần trăm làm tròn 2 số lẻ). Chỉ DA_GUI/DA_THANH_TOAN được tính; tổng đã gửi = đã thu + còn phải thu trong mô hình thu đủ một lần. Nợ quá hạn là một phần của còn phải thu: DA_GUI và hạn không NULL, nhỏ hơn ngày Việt Nam. NHAP/DA_DUYET/HUY loại khỏi toàn bộ công nợ; không suy tổng từ dòng phí hoặc cộng bản bị thay thế đã hủy. Kỳ là kỳ hóa đơn, không phải kỳ phát sinh dòng tiền. Đây là công nợ hiện tại của các kỳ, chưa có số dư hồi tố tại ngày quá khứ.

Data CAN_HO có căn/khối, số hóa đơn chưa thu, còn phải thu, nợ quá hạn, hạn sớm nhất và thông tin người phụ trách **hiện tại** (có thể NULL). HOA_DON có mã/số hóa đơn, căn/khối/kỳ, tổng/hạn và qua_han=0|1. THEO_KY có kỳ và các tổng/counters như summary, phân trang theo kỳ. Tổng hợp không bị giới hạn bởi 20 dòng chi tiết.

Thu phí nhận `tu_ngay`, `den_ngay` YYYY-MM-DD, mặc định đầu tháng/hôm nay; không sau hôm nay, từ ngày không sau đến ngày. `che_do=GIAO_DICH` mặc định (từng hóa đơn đã thu) hoặc `THEO_NGAY` (gom ngày Việt Nam). Không lọc theo kỳ hóa đơn ở endpoint này; `ky_thanh_toan` chỉ là thông tin trong mỗi khoản thu. Khoảng ngày bao gồm cả ngày cuối: UTC timestamp >= đầu ngày Việt Nam và < đầu ngày kế tiếp. Không cần dữ liệu timezone table của MySQL vì dùng offset +07:00.

summary thu phí: `tong_da_thu`, `so_khoan_thu`, `so_can_da_thu`. Chỉ DA_THANH_TOAN có ngay_thanh_toan trong khoảng mới được tính; dùng so_tien_da_thu, không suy tiền từ việc quét QR hoặc nội dung chuyển khoản. Data GIAO_DICH có hóa đơn/căn/kỳ, số tiền đã thu, tham chiếu, thời điểm và tên người xác nhận; không trả số tài khoản ngân hàng/hash/mật khẩu. THEO_NGAY có ngay_thu, da_thu và so_khoan_thu. Ngày xác nhận là ngày BQL ghi nhận trên hệ thống, có thể khác ngày chuyển khoản; hóa đơn đã thu thiếu thời điểm không thể vào báo cáo theo ngày.

Ví dụ: `/api/bao_cao/cong_no?tu_ky=2026-09&den_ky=2026-10&khoi=A&che_do=HOA_DON&qua_han=1` và `/api/bao_cao/thu_phi?tu_ngay=2026-10-01&den_ngay=2026-10-20&khoi=A`. Khoảng đảo ngược trả 422 INVALID_PERIOD_RANGE/INVALID_DATE_RANGE; chọn sai chế độ/quá hạn theo kỳ trả 422. Truy cập báo cáo không tự gửi nhắc hoặc ghi nhận đã thu.

## Thiết bị và bảo trì (migration 010–011)

Tất cả cần đăng nhập; ghi có `X-App-Request: 1`. Danh mục thiết bị/cấu hình chỉ QUAN_TRI_VIEN. Phiếu bảo trì cho BQL hoặc KY_THUAT_VIEN được giao; cư dân 403, khách 401. KTV không được xem phiếu của người khác, kể cả sau khi từng được giao (404). GET không tạo công việc hoặc đổi lịch.

| API | Quyền / dữ liệu |
| --- | --- |
| GET /api/thiet_bi?q=&loai=&trang_thai=&lich=&page=1 | BQL, {data,summary,total,page,ngay_hien_tai}; 20 dòng/trang |
| POST /api/thiet_bi | BQL, tạo hồ sơ/lịch, 201 {data:{ma_thiet_bi}} |
| GET /api/thiet_bi/:id | BQL, chi tiết + history thông tin thiết bị + phieu_dinh_ky_dang_mo |
| PUT /api/thiet_bi/:id | BQL, body hồ sơ đầy đủ + phien_ban |
| POST /api/thiet_bi/:id/phieu_bao_tri | BQL, tạo định kỳ/đột xuất, 201 hoặc replay 200 |
| GET /api/bao_tri/ky_thuat_vien?q=&page=1 | BQL, KTV hoạt động, 20 dòng/trang; không password/hash |
| GET /api/bao_tri?q=&ma_thiet_bi=&trang_thai=&loai=&qua_han=&page=1 | BQL toàn bộ; KTV chỉ được giao; {data,total,page,ngay_hien_tai} |
| GET /api/bao_tri/:id | Chi tiết + history, tên/vị trí lúc lập và hiện tại, kết quả hiện tại |
| POST /api/bao_tri/:id/phan_cong | BQL, {phien_ban,ma_ky_thuat_vien,ghi_chu?}; đổi người cần lý do 3–500 |
| POST /api/bao_tri/:id/doi_lich | BQL, {phien_ban,ngay_den_han,ly_do}; trước bắt đầu, lý do 3–500 |
| POST /api/bao_tri/:id/bat_dau | KTV được giao, {phien_ban} |
| POST /api/bao_tri/:id/bao_cao | KTV được giao, {phien_ban,ngay_thuc_hien,ket_qua}; kết quả 10–4000 ký tự |
| POST /api/bao_tri/:id/tra_lai | BQL, {phien_ban,ly_do}; chỉ CHO_NGHIEM_THU, lý do 3–1000 |
| POST /api/bao_tri/:id/nghiem_thu | BQL, {phien_ban,nhan_xet}; nhận xét 3–1000 |
| POST /api/bao_tri/:id/huy | BQL, {phien_ban,ly_do}; lý do 3–500, phiếu chưa kết thúc |

Hồ sơ thiết bị: `ma_tai_san` tạo mới (2–30, chữ không dấu/số/gạch ngang/gạch dưới, chuẩn hóa hoa, giữ cố định), `ten_thiet_bi` 2–150, `loai` THANG_MAY/MAY_BOM/PCCC/DIEN/NUOC/CAMERA/KHAC, `vi_tri` 2–160, `so_serial` tối đa 100, `ngay_lap_dat` tùy chọn không sau hôm nay, `ghi_chu` tối đa 1000. `trang_thai` DANG_SU_DUNG/TAM_DUNG/NGUNG_SU_DUNG. Lịch: chu_ky_ngay 1–3650 và ngay_bao_tri_tiep_theo đi cùng nhau hoặc cùng NULL/rỗng, nhac_truoc_ngay 0–90 (mặc định 7). Ngừng sử dụng xóa lịch, không xóa dữ liệu; cấm khi còn phiếu mở. Chỉ sửa thông tin khác khi đang có phiếu định kỳ, không đổi chu kỳ/ngày/nhắc trước. Đổi lịch phiếu định kỳ trước bắt đầu sẽ đổi cả ngày kế tiếp trong hồ sơ.

List thiết bị lọc `lich=QUA_HAN|SAP_DEN_HAN|CHUA_CAU_HINH`; không tính ngừng sử dụng trong cảnh báo. `tinh_trang_lich` còn có CHUA_DEN_HAN/NGUNG_THEO_DOI. Summary là số liệu trong bộ lọc. Ngày hôm nay chưa quá hạn; ngày cuối cửa sổ nhắc vẫn Sắp/đến hạn. Mốc ngày theo Asia/Ho_Chi_Minh, dữ liệu ngày YYYY-MM-DD.

Tạo phiếu: `loai=DINH_KY|DOT_XUAT`, `khoa_yeu_cau` UUID, `ma_ky_thuat_vien` tùy chọn, `do_uu_tien=THUONG|CAO|KHAN_CAP`. DINH_KY cần phien_ban_thiet_bi, server lấy tên/vị trí/ngày đến hạn/chu kỳ từ thiết bị; chỉ một định kỳ mở. DOT_XUAT cần tieu_de 3–180, noi_dung 3–2000, ngay_den_han. Tạo trả ma_phieu_bao_tri/replay; cùng UUID và nội dung chuẩn hóa/actor trả lại ID cũ, khác nội dung/actor trả 409 REQUEST_KEY_REUSED. Kiểm tra replay trước trạng thái/version hiện tại để retry sau phản hồi thất lạc vẫn về đúng phiếu. UUID khác nhưng đã có định kỳ mở trả 409 OPEN_PERIODIC_JOB.

Trạng thái: MOI → DA_PHAN_CONG → DANG_THUC_HIEN → CHO_NGHIEM_THU → HOAN_THANH. BQL trả lại từ chờ nghiệm thu về đang thực hiện, tăng lượt và xóa kết quả/ngày hiện tại; báo cáo cũ giữ trong lịch sử. Đổi người ở MOI/DA_PHAN_CONG/DANG_THUC_HIEN đưa về DA_PHAN_CONG, đặt lại thời điểm bắt đầu. KTV cũ mất quyền đọc/ghi; mục đang giao không có cơ chế tự nhận việc. HUY chỉ trước hoàn thành và không dời lịch. Mọi thay đổi dùng phien_ban, cũ trả 409 STALE_VERSION, sai trạng thái 409 INVALID_STATE.

Ngày thực hiện phải từ ngay_lap tới hôm nay. Nghiệm thu định kỳ cập nhật ngày kế tiếp bằng ngày thực hiện + chu kỳ snapshot của phiếu, trong cùng transaction với kết thúc phiếu/audit. Không tự lập phiếu mới, không đổi trạng thái vận hành thiết bị. Đột xuất không đổi lịch định kỳ. Lịch sử đọc là văn bản; payload audit JSON giữ nội bộ DB, không trả nguyên body/request key/hash hoặc dữ liệu mật khẩu.

## Tiện ích và đặt lịch

Migration 012. Chỉ BQL/CU_DAN; KTV và khách không được truy cập. Giờ sử dụng là giờ Việt Nam, theo bước 30 phút, cùng ngày. Timestamp lịch sử là UTC. Danh sách trả `{data,total,page}` 20 dòng/trang; chi tiết/thao tác trả `{data}`.

| Method | Đường dẫn dưới /api | Quyền / dữ liệu |
|---|---|---|
| GET | /tien_ich | BQL/CU_DAN; q, dang_mo=0/1, page; gồm cả tiện ích tạm ngừng |
| POST | /tien_ich | BQL; ten_tien_ich, vi_tri, mo_ta, suc_chua, gio_mo, gio_dong, toi_da_phut, dat_truoc_ngay, dang_mo boolean |
| GET, PUT | /tien_ich/:id | GET BQL/CU_DAN; PUT BQL, cùng trường tạo + phien_ban |
| GET | /tien_ich/:id/lich?ngay=YYYY-MM-DD | BQL/CU_DAN; từ hôm nay đến 90 ngày tới; chỉ khung 30 phút và cờ da_dat/co_the_dat |
| POST | /tien_ich/:id/dat_lich | CU_DAN; ngay, gio_bat_dau, gio_ket_thuc, so_nguoi, ghi_chu, phien_ban_tien_ich, khoa_yeu_cau UUID |
| GET | /cua_toi/dat_lich/ngu_canh | CU_DAN; căn/cư dân/đợt cư trú hiện tại đủ quyền đặt, hoặc null |
| GET | /dat_lich_tien_ich | BQL; q, ngay, trang_thai, ma_tien_ich, page |
| GET | /cua_toi/dat_lich | CU_DAN; cùng bộ lọc, chỉ lịch thuộc quyền |
| GET | /dat_lich_tien_ich/:id, /cua_toi/dat_lich/:id | Chi tiết theo quyền, lịch sử và co_the_huy; không trả UUID/fingerprint |
| POST | /dat_lich_tien_ich/:id/duyet | BQL; phien_ban, ghi_chu tùy chọn; CHO_DUYET → DA_DUYET |
| POST | /dat_lich_tien_ich/:id/tu_choi | BQL; phien_ban, ghi_chu 5–1000 ký tự; CHO_DUYET → TU_CHOI |
| POST | /dat_lich_tien_ich/:id/huy, /cua_toi/dat_lich/:id/huy | BQL/cư dân thuộc quyền; phien_ban, ghi_chu 5–1000; lịch đang giữ chỗ → DA_HUY |

Giờ HH:mm, phút 00/30; mở/đóng trong ngày 00:00–23:30, sức chứa 1–1000 người, mỗi lượt 30–360 phút và không vượt thời lượng cấu hình/giờ mở cửa; đặt trước 1–90 ngày tùy tiện ích. Giờ bắt đầu phải sau hiện tại; ngày cuối hạn đặt trước được tính cả ngày. Cờ `co_the_dat` chỉ cho biết khung còn trong thời gian nhận lịch; cần kiểm tra cả `da_dat=false`. API tạo kiểm tra lại mọi điều kiện; lịch trống là thông tin tham khảo tại thời điểm đọc.

Server tự lấy căn, người đặt và đợt cư trú; không nhận căn/creator từ client. Tài khoản cá nhân phải có đợt cư trú đang mở; tài khoản căn phải có người phụ trách đang là chủ hộ tại chính căn. Cá nhân xem lịch tự đặt (kể cả lịch cũ sau chuyển đi); hủy cần còn đúng đợt cư trú đó. Tài khoản căn xem lịch của căn và hủy thay hộ khi còn người phụ trách hợp lệ. Đổi chủ hộ vẫn dùng cơ chế ngắt phiên cũ hiện có; chủ mới tiếp tục quản lý lịch căn. Cư dân khác chỉ xem khung bận, không được xem ghi chú/tên/căn/mã lượt đặt.

CHO_DUYET và DA_DUYET đều giữ riêng toàn bộ tiện ích, không chia sẻ sức chứa với lượt khác. Hai khoảng giao nhau khi `cũ.bat_dau < mới.ket_thuc AND cũ.ket_thuc > mới.bat_dau`; hai lượt sát giờ được phép. UUID cùng input/actor/tiện ích/phiên bản cấu hình trả ID cũ (200), tạo mới 201, khác input cùng key 409. Retry không phục hồi lịch đã hủy/từ chối. Khóa tiện ích chung cho đặt/duyệt/hủy/sửa cấu hình, nên nhiều lượt gửi đồng thời không đặt trùng.

Chỉ duyệt/từ chối/hủy **trước giờ bắt đầu**; yêu cầu chờ duyệt đến giờ vẫn ghi Chờ duyệt nhưng không được sử dụng và giao diện hiển thị đã tới giờ. Không tự duyệt, hoàn thành hoặc đổi trạng thái bằng cron. Tạm ngừng chặn đặt mới, giữ lịch có sẵn và vẫn cho BQL quyết định các lịch đó. Sửa sức chứa/giờ/thời lượng không được ảnh hưởng các lượt đang giữ chỗ chưa kết thúc; giảm hạn đặt trước chỉ áp dụng lượt mới. Chuyển đi không tự hủy lịch, BQL hoặc tài khoản căn còn hợp lệ xử lý lịch sắp tới. Không có xóa, sửa khung giờ lượt đã gửi, gửi thông báo ngoài hệ thống hoặc tính phí tiện ích trong bản này.

## Thu chi và quỹ

Migration 013. Toàn bộ API chỉ dành cho BQL, gồm cả tải chứng từ; cư dân, tài khoản căn, KTV và khách không được đọc/ghi. JSON trả `{data}`, danh sách/sổ quỹ `{data,total,page}` 20 dòng/trang. Ghi JSON/multipart đều cần `X-App-Request: 1`.

| Method | Đường dẫn dưới /api | Dữ liệu / hành vi |
|---|---|---|
| GET, POST | /quy | GET q,page. POST ten_quy (2–120), mo_ta (0–1000), dang_hoat_dong boolean; quỹ mới không nhận tự động hóa đơn, số dư từ 0 |
| GET, PUT | /quy/:id | GET metadata + so_du hiện tại. PUT các trường tạo + phien_ban; không đổi nguồn thu hóa đơn, không tạm ngừng quỹ nhận hóa đơn |
| GET | /quy/:id/so_quy | tu_ngay,den_ngay YYYY-MM-DD, không tương lai, mặc định đầu tháng–hôm nay; che_do GIAO_DICH/THEO_THANG; page |
| GET, POST | /phieu_thu_chi | GET ma_quy,loai,trang_thai,q,page. POST ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,khoa_yeu_cau UUID |
| GET, PUT | /phieu_thu_chi/:id | GET chi tiết, metadata chứng từ, lịch sử, liên kết phiếu đảo/gốc. PUT các trường tạo (không UUID) + phien_ban, chỉ NHAP; không đổi quỹ/loại |
| POST | /phieu_thu_chi/:id/duyet | phien_ban,ghi_chu tùy chọn; NHAP → DA_GHI_SO; chi cần chứng từ và số dư hiện tại đủ |
| POST | /phieu_thu_chi/:id/huy | phien_ban,ly_do (5–1000); chỉ NHAP → HUY |
| POST | /phieu_thu_chi/:id/dao | phien_ban,ly_do (5–1000); tạo ngay phiếu ngược chiều đã ghi sổ, cùng tiền/quỹ, ngày hôm nay; một lần/phiếu gốc |
| POST | /phieu_thu_chi/:id/chung_tu | multipart phien_ban + 1–5 tệp chung_tu; chỉ NHAP, tổng mỗi phiếu tối đa 5, mỗi tệp 5 MB |
| DELETE | /phieu_thu_chi/:id/chung_tu/:proof | JSON phien_ban, chỉ NHAP; xóa tệp + audit cùng transaction |
| GET | /phieu_thu_chi/:id/chung_tu/:proof | BQL; trả binary đúng cặp phiếu/tệp, Content-Disposition attachment, CSP sandbox và nosniff |

Loại THU có nhóm BO_SUNG_QUY/THU_KHAC; CHI có VAN_HANH/BAO_TRI/MUA_SAM/CHI_KHAC. DIEU_CHINH dành riêng phiếu đảo, THU_HOA_DON là nguồn hóa đơn, không tạo thủ công. so_tien là số nguyên đồng dương, tối đa 14 chữ số; ngày hạch toán không tương lai, đối tác 2–150, diễn giải 5–1000. Tính/sum bằng DECIMAL/BigInt, trả tiền dưới dạng chuỗi. Đơn vị cố định VND.

NHAP/HUY không vào sổ. DA_GHI_SO không sửa tiền/ngày/nội dung/chứng từ và không hủy; đảo tạo dòng đối ứng, giữ nguyên số tiền/trạng thái/nội dung gốc. Phiếu đảo không đảo tiếp; gốc có tối đa một phiếu đảo. Cùng actor và lý do gửi lại thao tác đảo trả ID cũ; khác lý do/actor khi đã đảo báo 409. Đảo thu là chi nên cần đủ số dư; đảo chi cộng lại tiền. Phiếu đảo dùng chứng từ tại liên kết gốc, không yêu cầu upload bản sao.

Quỹ vận hành mặc định đọc các hoa_don DA_THANH_TOAN có ngay_thanh_toan, so_tien_da_thu; không sao chép thành phiếu. Bao gồm hóa đơn đã xác nhận từ trước khi cập nhật, không đưa nháp/chưa thu/hủy vào sổ. Ngày nguồn hóa đơn là thời điểm xác nhận quy đổi UTC → Việt Nam, không phải kỳ hóa đơn. Xác nhận thu lặp chỉ có một dòng hóa đơn. Nguồn mặc định này cố định, chỉ tên/mô tả được sửa. Quỹ khác chỉ nhận phiếu thủ công; không chuyển quỹ tự động hoặc ghi lại cùng khoản hóa đơn thành thu khác.

Sổ tính dau_ky = thu − chi trước từ ngày; tong_thu/tong_chi trong khoảng ngày bao gồm cả hai đầu, cuoi_ky = dau_ky + thu − chi. Tham số nguon PHIEU/HOA_DON, loai THU/CHI và q (mã chứng từ/đối tác/diễn giải) chỉ lọc danh sách GIAO_DICH, không đổi tổng số dư. THEO_THANG tổng hợp toàn quỹ trong khoảng ngày, bỏ các bộ lọc chi tiết, trả tháng có giao dịch cùng tổng thu/chi. Báo cáo dùng một snapshot chỉ đọc cho tổng/count/trang. Số dư có thể thay đổi hồi tố khi BQL ghi phiếu lùi ngày; không có khóa sổ kỳ trong bản này. Kiểm tra không vượt quỹ dùng **số dư hiện tại khi duyệt**, không phải số dư quá khứ tại ngày hạch toán; báo cáo quá khứ có thể âm.

Khóa theo quỹ → phiếu → actor; mọi lập/sửa/đính kèm/duyệt/đảo cùng quỹ được tuần tự hóa. UUID + fingerprint bảo vệ tạo nháp lặp; cùng request 200 với ID cũ, mới 201, khác input cùng UUID 409. Không có bản ghi tiền tự động nào được tạo khi xem sổ hoặc migrate. Chứng từ PDF kiểm tra đầu/đuôi tệp và chỉ phục vụ tải xuống; ảnh được decode JPEG/PNG/WebP tĩnh ≤25 triệu pixel, xoay/thu nhỏ/bỏ metadata/encode JPEG. SHA256 nội dung chuẩn hóa chống upload trùng; retry toàn bộ tệp đã có trả thành công trước kiểm tra phiên bản, không tăng version. Tệp trùng một phần + tệp mới vẫn cần version hiện tại. Binary lưu trong database, không có URL storage công khai. Mọi thay đổi phiếu/chứng từ/audit cùng transaction.

## Xuất báo cáo Excel / PDF

Không có migration mới. Endpoint GET chỉ dành cho BQL, áp dụng cùng quyền và bộ lọc của báo cáo JSON; không ghi/sửa trạng thái tài chính. Trả file đính kèm, không phải JSON khi thành công; lỗi vẫn trả `{error:{code,message,...}}`.

| GET dưới /api | Nội dung / bộ lọc |
|---|---|
| /bao_cao/cong_no/xuat?dinh_dang=xlsx hoặc pdf | Cùng q,khoi,ma_can_ho,tu_ky,den_ky,che_do CAN_HO/HOA_DON/THEO_KY,qua_han như /cong_no |
| /bao_cao/thu_phi/xuat?dinh_dang=xlsx hoặc pdf | Cùng q,khoi,ma_can_ho,tu_ngay,den_ngay,che_do GIAO_DICH/THEO_NGAY như /thu_phi |
| /quy/:id/so_quy/xuat?dinh_dang=xlsx hoặc pdf | Cùng tu_ngay,den_ngay,che_do GIAO_DICH/THEO_THANG,nguon,loai,q như /so_quy |

Dinh_dang mặc định xlsx, nhận xlsx hoặc pdf cho báo cáo xuất. Mẫu nhập /mau chỉ nhận xlsx. Xuất toàn bộ các dòng khớp bộ lọc, bỏ page; JSON thường vẫn 20/trang. Không lặp gọi từng trang ở nhiều transaction. Cùng mã truy vấn/validation/snapshot được dùng cho cả JSON và xuất, bao gồm tổng/count/chi tiết. Header `X-Export-Rows` là số dòng chi tiết thực tế, `Content-Disposition: attachment` có tên ASCII và ngày, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Không tạo URL lưu trữ công khai.

Giới hạn Excel **10.000 dòng**, PDF **1.000 dòng** sau khi áp dụng chế độ xem/lọc. Nếu vượt, trả 422 EXPORT_TOO_LARGE trước SELECT chi tiết; không cắt bớt hoặc trả một tệp thiếu dòng. Thu hẹp khoảng thời gian/khối/căn/quỹ hoặc chọn chế độ tổng hợp. Tối đa một lượt tạo tệp mỗi tài khoản và hai lượt toàn tiến trình; bận trả 429 EXPORT_BUSY với Retry-After: 3. Lỗi vẫn giải phóng lượt để thử lại.

Excel .xlsx có hai sheet Tổng hợp và Chi tiết: thời điểm dữ liệu Việt Nam, bộ lọc đã áp dụng, tổng hợp và ghi chú ý nghĩa; dữ liệu đầy đủ, bộ lọc cột và cố định tiêu đề. Số tiền nguyên đồng tới 15 chữ số ghi ô số; giá trị lớn hơn 15 chữ số ghi chuỗi thập phân nguyên gốc để tránh Excel làm tròn, kèm ghi chú. Mã căn, điện thoại, mã tham chiếu và nội dung người dùng luôn là chuỗi, không tạo formula/hyperlink từ nội dung nhập. Không dùng SUM formula để tạo tổng có nguy cơ sai độ chính xác; tổng lấy trực tiếp từ snapshot DB/BigInt.

Excel giữ quy tắc hiện có: lọc quá hạn chỉ thay chi tiết công nợ; lọc nguồn/loại/từ khóa sổ quỹ chỉ thay chi tiết, không đổi tổng toàn quỹ. Chế độ tháng bỏ bộ lọc chi tiết như trên web; các dòng gốc/đảo vẫn giữ để theo dõi điều chỉnh. Tệp là snapshot tại lúc xuất, có thể mới hơn lần tải màn hình trước đó nếu đã phát sinh giao dịch.


## Nhập / xuất dữ liệu theo phân hệ (migration 014)

Chỉ BQL. Base `/api/trao_doi_du_lieu`. `kind`: `can_ho`, `cu_dan`, `phuong_tien`, `chi_so`, `thiet_bi`, `hoa_don`, `bao_tri`, `dat_lich`. Ba phần cuối chỉ xuất.

| Method | Path | Nội dung |
|---|---|---|
| GET | / | Danh mục, đường dẫn màn danh sách và cột/hướng dẫn nhập |
| GET | /lich_su | 20 lô thành công gần nhất của chính người đang đăng nhập |
| GET | /:kind/mau?dinh_dang=xlsx | Excel sheet Nhap trống + Huong dan + Vi du; dữ liệu ví dụ không được nhập tự động |
| POST | /:kind/xem_truoc | multipart tep: đúng 1 tệp .xlsx, tối đa 5 MB. Trả rows [{line,values,error}],total,errors,xac_nhan |
| POST | /:kind/nhap | multipart tep,xac_nhan từ bản xem trước không lỗi,khoa_yeu_cau UUID. Trả so_dong,ket_qua gồm ID,tai_khoan_moi nếu có |
| GET | /:kind/xuat?dinh_dang=xlsx hoặc pdf | Xuất toàn bộ dòng theo bộ lọc, bỏ page. File attachment, không tạo URL công khai |

Bộ lọc xuất dùng cùng validation/truy vấn danh sách: can_ho(q,tang), cu_dan(q,ma_can_ho,ma_cu_dan,trang_thai), phuong_tien(q,loai_xe,trang_thai,ma_can_ho,ma_cu_dan), chi_so(ma_can_ho,ky_thanh_toan), thiet_bi(q,loai,trang_thai,lich), hoa_don(q,ma_can_ho,ky_thanh_toan,trang_thai), bao_tri(q,ma_thiet_bi,loai,trang_thai,qua_han), dat_lich(q,ma_tien_ich,ngay,trang_thai). Excel tối đa 10.000 dòng, PDF 1.000 dòng. Cả COUNT và số dòng đọc thực tế được chặn vượt, không trả file bị cắt.

Nhập chỉ thêm mới, không nhận ID để cập nhật, tài khoản cá nhân hay trạng thái duyệt. Cột đúng danh mục; Excel Nhap hàng đầu là key, giữ điện thoại/mã dạng text, ngày ISO. Không nhận công thức/ô liên kết, macro hoặc tệp nén phình quá giới hạn. Chỉ đọc sheet Nhap. PDF không được hỗ trợ; mẫu trống trả IMPORT_EMPTY và hơn 100 dòng trả IMPORT_TOO_MANY_ROWS. Parser chạy worker tối đa 15 giây với giới hạn heap; zip kiểm tra kích thước giải nén trước khi đọc.

Xem trước chạy các domain service trên cùng transaction rồi rollback. SAVEPOINT mỗi dòng để trả đầy đủ lỗi nghiệp vụ; deadlock/lỗi hệ thống hủy transaction. Token HMAC ràng buộc user + phiên token + kind + SHA256 tệp, hết hạn 15 phút hoặc khi server khởi động lại. Xác nhận đọc lại đúng tệp và kiểm tra lại domain guard dưới khóa; lỗi trả 409 IMPORT_CHANGED, rollback cả lô và lịch sử. Phiên hết hạn giữa quá trình cũng không commit.

Ledger dot_nhap_du_lieu có UNIQUE(actor,UUID) và UNIQUE(actor,kind,SHA256), lưu kết quả ID/số dòng cùng transaction. Gửi lại trả da_nhap_truoc=true, không trả lại mật khẩu; nếu UUID dùng cho tệp khác trả 409 IMPORT_KEY_CONFLICT. Mật khẩu căn/chủ hộ mới chỉ trong response thành công lần đầu và không được lưu rõ trong ledger, log hay tệp xuất. Nếu response mất cần cấp lại ở màn tài khoản căn. Lịch sử chỉ hiện lô đã commit.

422 cho tệp/cột sai, quá nhiều dòng, tệp không có sheet Nhap hoặc PDF; 413 IMPORT_UPLOAD_LIMIT khi vượt multipart/5 MB; 409 PREVIEW_REQUIRED/PREVIEW_EXPIRED khi sai/hết token; 429 FILE_BUSY khi đang xử lý tệp. Mỗi tài khoản một lượt, toàn tiến trình hai lượt (dùng chung slot xuất báo cáo tài chính), luôn giải phóng khi xử lý xong. API ghi giữ CSRF X-App-Request:1 và kiểm tra quyền/phiên như phần còn lại.


### Chọn sai phần dữ liệu và mã cư dân trong tệp xe

Parser nhận diện đúng danh mục từ tập header Excel có trong catalog. Nếu tệp thuộc phần khác phần được chọn: 422 `IMPORT_KIND_MISMATCH`, message ghi rõ tên phần đang chọn, tên phần tệp thuộc về và yêu cầu chọn lại. Không tự đổi phần hoặc lưu sang phần khác. Lỗi tệp không có sheet Nhap hoặc PDF/đã làm phẳng vẫn có thông báo riêng; không trộn với lỗi chọn sai phần. Các lỗi do hệ thống xác định có message công khai, lỗi thư viện vẫn được che nội dung nội bộ.

Import phương tiện chặn mã không phải số hoặc placeholder THAY_MA_CU_DAN_1/2 bằng thông báo hướng dẫn lấy mã tại Cư dân. Mã cư dân là ma_cu_dan của hồ sơ, không phải tên đăng nhập CH... của căn hộ. Các API danh sách/chi tiết đã trả mã này; giao diện mới hiển thị mã, nút sao chép và dùng bộ lọc ma_cu_dan hiện có. Không thay schema, quyền hoặc logic bàn giao tài khoản.


## Lập bản nháp hóa đơn hàng loạt (chỉ BQL)

POST `/api/hoa_don/hang_loat/xem_truoc` nhận `{ma_can_ho:[id...],ky_thanh_toan,ngay_chot_phi,tinh_nuoc,tinh_dien,tinh_xe}`. Từ 1–50 ID dương duy nhất, thứ tự chuẩn hóa tăng dần; kỳ YYYY-MM, ngày chốt thật thuộc kỳ và không sau hôm nay Việt Nam; ba option bắt buộc boolean. Phí quản lý theo từng căn. 401/403 như hóa đơn BQL, bắt buộc X-App-Request, no-store.

Trả `{data:{rows,so_can,so_can_loi,tong_tien,xac_nhan}}`; rows gồm ID/số căn/khối, tong_tien tạm tính, loi[], chi_tiet[] theo snapshot phí đơn lẻ. tong_tien tổng chỉ các căn hợp lệ, string nguyên đồng. Nếu có căn thiếu chỉ số/giá, đã có hóa đơn còn hiệu lực hoặc cần lập thay thế thì xac_nhan=null. Không ghi bản nháp/ledger/audit; không tự bỏ qua căn lỗi. Căn bị lỗi vẫn có thể có khoản tạm tính để kiểm tra, không được đưa vào tổng hợp lệ.

POST `/api/hoa_don/hang_loat/xac_nhan` nhận cùng input và `{xac_nhan,khoa_yeu_cau}` UUID. Token HMAC hạn 15 phút, gắn người lập/token phiên, input và báo giá. Tính lại dưới khóa nguồn trước khi ghi. Toàn bộ hợp lệ/khớp mới tạo tất cả NHAP trong một giao dịch, gồm snapshot và audit cũ. Trả 201 `{data:{ma_dot_lap,so_hoa_don,tong_tien,hoa_don:[{ma_can_ho,so_can_ho,ma_hoa_don,tong_tien}],da_lap_truoc}}`. Không tự duyệt/gửi/thu tiền.

Lỗi `BATCH_SIZE`/`BATCH_APARTMENTS`/validation 422; `PREVIEW_REQUIRED`/`PREVIEW_EXPIRED` 409 cần xem trước; `BATCH_CHANGED` 409 chưa ghi căn nào; `BATCH_KEY_CONFLICT` 409 khi UUID cũ đi với input khác. Deadlock/lock timeout trả 409 CONCURRENT_UPDATE theo handler chung. Khi lỗi mạng, giữ nguyên input/token/UUID và retry: ledger UNIQUE(actor,UUID) trả lại ID cũ mà không tạo thêm, kể cả token đã hết hạn hoặc máy chủ restart. Đợt đã ghi chỉ trả kết quả cũ sau kiểm tra phiên/actor, không tính lại số tiền theo trạng thái hiện tại. Đổi UUID vẫn bị khóa hóa đơn còn hiệu lực theo căn/kỳ; hóa đơn hủy phải lập thay thế qua màn riêng. Các API đơn lẻ giữ nguyên hợp đồng, vẫn cho tạo nháp thiếu dữ liệu để sửa từng căn.

## Duyệt/gửi hàng loạt (chỉ BQL)

GET `/api/hoa_don` bổ sung `phien_ban` cho từng dòng, vẫn giữ phạm vi quyền và phân trang cũ. POST `/api/hoa_don/xu_ly_hang_loat/xem_truoc` nhận `{thao_tac:'DUYET'|'GUI',hoa_don:[{ma_hoa_don,phien_ban}]}`; chọn 1–50 cặp ID/version, ID dương không lặp, version nguyên không âm. GUI thêm `han_thanh_toan,ma_ngan_hang,so_tai_khoan,ten_nguoi_nhan` chung. Chỉ BQL, X-App-Request bắt buộc, no-store.

Trả 200 `{data:{thao_tac,rows,so_hoa_don,so_loi,tong_tien,xac_nhan}}`; rows gồm ID/số hóa đơn/căn/kỳ/tiền/trạng thái/phiên bản hiện tại và loi[]. Không trả hash nội bộ. Tổng chỉ cộng dòng hợp lệ, tiền string nguyên đồng. Có lỗi thì token null; không ghi phiên bản/trạng thái/audit. DUYET dùng cùng kiểm tra nguồn/snapshot/tiền dương với duyệt đơn lẻ. GUI giữ snapshot đã duyệt, kiểm tra phiên bản, trạng thái và thông tin nhận tiền/hạn như gửi đơn lẻ.

POST `/api/hoa_don/xu_ly_hang_loat/xac_nhan` thêm `{xac_nhan,khoa_yeu_cau}`. Token hạn 15 phút gắn người dùng/version, input chuẩn hóa và bản xem trước. Toàn bộ dòng hợp lệ và khớp mới chuyển trạng thái trong một giao dịch: DUYET NHAP→DA_DUYET, GUI DA_DUYET→DA_GUI. Trả 200 `{data:{ma_dot_xu_ly,thao_tac,so_hoa_don,tong_tien,hoa_don:[{ma_hoa_don,so_hoa_don,so_can_ho,tong_tien,trang_thai_luc_xu_ly}],da_xu_ly_truoc}}`.

Lỗi validation 422; `BATCH_CHANGED` 409 chưa xử lý dòng nào và yêu cầu lấy phiên bản mới/xem lại; `PREVIEW_REQUIRED`/`PREVIEW_EXPIRED` 409 cần xem lại; `BATCH_KEY_CONFLICT` 409 khi cùng UUID khác input/thao tác. Khóa lỗi trả CONCURRENT_UPDATE theo handler chung. Ledger016 UNIQUE(actor,UUID) chống lặp, giữ ID/tổng/trạng thái lúc xử lý và commit cùng mọi audit; replay cùng input trả lại receipt cũ dù token hết hạn/restart hoặc hạn gửi đã qua, không đổi trạng thái hiện tại. Đợt có lỗi không tự bỏ qua dòng; client có thể bỏ dòng lỗi rồi xem lại với UUID mới.

Gửi làm hóa đơn hiển thị trong cổng cư dân theo quyền căn/cư trú hiện có và VietQR đọc từ snapshot; chưa xác nhận thu tiền hoặc tự nhắc phí. Chỉ duyệt vẫn chưa hiển thị cho cư dân. API đơn lẻ giữ nguyên payload/response; check action dùng chung với batch, connection ngoài chỉ là chi tiết nội bộ.

## Tổng quan vận hành (chỉ BQL)

GET `/api/tong_quan` trả `{data:{tai_luc,ngay_hien_tai,gio_hien_tai,tu_ngay_thu,den_ngay_thu,tai_chinh,phan_anh,bao_tri,tien_ich}}`. UTC timestamp tai_luc, ngày/giờ nghiệp vụ Việt Nam UTC+07. 401 cho khách/phiên hết, 403 cho KTV/cư dân; no-store/nosniff theo middleware chung. Không nhận bộ lọc từng khối vì đây là tổng quan toàn hệ thống.

- tai_chinh: con_phai_thu, no_qua_han, thu_trong_thang là chuỗi nguyên đồng; hoa_don_chua_thu, hoa_don_qua_han, can_con_no là số đếm; hoa_don tối đa 5 dòng ID/số hóa đơn/căn/kỳ/tiền/hạn/quá hạn. Nợ chỉ DA_GUI, không NHAP/DA_DUYET/HUY/DA_THANH_TOAN; hạn hôm nay/null không quá hạn. Thu tháng tính DA_THANH_TOAN theo timestamp xác nhận từ 00:00 ngày đầu tháng đến trước 00:00 ngày mai, đổi ranh giới Việt Nam sang UTC trước truy vấn.
- phan_anh: moi,da_phan_cong,dang_xu_ly,cho_nghiem_thu,dang_mo và danh_sach tối đa 5 bản chưa đóng, ưu tiên KHAN_CAP/CAO/TRUNG_BINH/THAP rồi ngày tạo cũ trước. Không trả thông tin liên hệ/mã tra cứu. GET /phan_anh?trang_thai=DANG_MO là bộ lọc đọc gồm MOI/DA_PHAN_CONG/DANG_XU_LY/DA_XU_LY, vẫn AND phạm vi người dùng; không phải trạng thái ghi mới.
- bao_tri: phieu_qua_han,cho_nghiem_thu,phieu_dang_mo cho các phiếu chưa kết thúc; thiet_bi_qua_han,thiet_bi_sap_den_han theo ngày kế tiếp/nhắc trước của thiết bị chưa ngừng sử dụng, giống bộ lọc màn thiết bị. danh_sach tối đa 5 phiếu mở, quá hạn trước, ngày đến hạn tăng dần. Phiếu hôm nay không quá hạn.
- tien_ich: cho_duyet gồm mọi CHO_DUYET kể cả đã qua giờ; da_duyet_hom_nay theo ngày bắt đầu tại Việt Nam. danh_sach tối đa 5 gồm CHO_DUYET có giờ bắt đầu tương lai hoặc DA_DUYET chưa hết giờ, loại bỏ hủy/từ chối/lịch đã kết thúc.

Mọi truy vấn trong response cùng transaction REPEATABLE READ, CONSISTENT SNAPSHOT READ ONLY. Tất cả ngày/giờ dùng mốc clock SQL đầu transaction, tránh lệch khi qua nửa đêm. Count là toàn bộ kết quả, giới hạn 5 chỉ cho từng hàng đợi. GET không ghi audit, tạo công việc, gửi nhắc phí hoặc thay trạng thái. Frontend không hiển thị số 0 thay cho lỗi mạng, không dùng dữ liệu cũ sau khi bấm refresh nếu request mới lỗi.

### Biểu đồ vận hành

GET `/api/tong_quan/thong_ke?khoang=THANG&ngay=2026-10-20`, chỉ BQL, 401/403/no-store như Tổng quan. `khoang`: NGAY/TUAN/THANG/QUY/NAM, mặc định THANG; `ngay`: ngày bất kỳ trong kỳ, mặc định hôm nay Việt Nam, kiểm tra ngày thật 1900–2199; cho phép xem kỳ tương lai để theo dõi hạn trả/lịch tiện ích. Giá trị sai/lặp tham số trả 422.

Response `{data:{tai_luc,khoang,ngay,tu_ngay,den_ngay,den_truoc_ngay,don_vi,nhan_khoang,diem,tong}}`. Khoảng truy vấn nửa mở `[tu_ngay,den_truoc_ngay)`; den_ngay là ngày cuối để hiển thị. Tuần thứ Hai–Chủ nhật; quý theo lịch Jan–Mar/Apr–Jun/Jul–Sep/Oct–Dec. NGAY trả 24 mốc GIO; TUAN 7 mốc NGAY; THANG 28–31 mốc NGAY; QUY 3 mốc THANG; NAM 12 mốc THANG. Mốc không có dữ liệu được điền 0.

Mỗi điểm `{moc,nhan,da_thu,con_no,tiep_nhan,da_dong,lap_moi,nghiem_thu,cho_duyet,da_duyet,da_huy,tu_choi}`. tong cộng các chuỗi; da_thu/con_no là chuỗi nguyên đồng cả tổng và từng điểm, các trường còn lại là số đếm. Định nghĩa:

- da_thu: DA_THANH_TOAN theo ngay_thanh_toan UTC đổi sang Việt Nam, tiền so_tien_da_thu.
- con_no: DA_GUI hiện tại theo han_thanh_toan DATE, loại hạn null. Đây là công nợ hiện tại phân bổ theo hạn trả, không tái dựng số dư công nợ lịch sử.
- tiep_nhan: tất cả phản ánh theo ngay_tao UTC (gồm cả hồ sơ hiện đã từ chối/trùng). da_dong: DA_DONG theo ngay_dong UTC. Là hai luồng sự kiện độc lập, không phải tỷ lệ đóng của cùng cohort.
- lap_moi: phiếu chưa hủy theo ngay_lap DATE; nghiem_thu: HOAN_THANH theo ngay_nghiem_thu UTC. Phiếu lập ở kỳ cũ có thể nghiệm thu kỳ đang xem.
- cho_duyet/da_duyet/da_huy/tu_choi: lượt đặt theo bat_dau giờ Việt Nam, dùng trạng thái hiện tại, không đổi UTC lần nữa. Bao gồm lịch tương lai trong kỳ được chọn; trạng thái có thể thay đổi sau khi duyệt/hủy.

Riêng NGAY: con_no và lap_moi chỉ có tổng ngày trong tong; các điểm giờ của hai chuỗi để 0 và frontend không vẽ hai chuỗi đó theo giờ. Không gán giả 00h cho trường chỉ có DATE. Các mốc tiền/sự kiện UTC truy vấn bằng ranh giới UTC tương ứng rồi GROUP BY giờ/ngày/tháng Việt Nam; ngày nghiệp vụ và giờ đặt lịch giữ nguyên.

Các biểu đồ dùng một snapshot REPEATABLE READ READ ONLY riêng với tai_luc; các thẻ/hàng đợi dùng API Tổng quan riêng. Mỗi phần hiển thị thời điểm đọc riêng. Không ghi dữ liệu hoặc audit. Frontend gắn response vào URL/kỳ/revision để bỏ request cũ, abort khi đổi bộ lọc, không render dữ liệu kỳ trước dưới nhãn kỳ mới. Không đổi phân quyền hoặc endpoint báo cáo hiện có.
