# Ràng buộc 31 bảng MySQL — giải thích theo nghiệp vụ

Rà soát ngày **07/11/2026** theo baseline `database/thesis-mysql/001_thesis_schema.sql`, từ điển metadata và các service hiện tại trên nhánh `codex/thesis-mysql-database` (nền `7cb3461`). Đây là kiểm tra schema/mã nguồn trong repository, **chưa phải kết quả đọc database trên laptop**. Không thay đổi schema hoặc dữ liệu.

## 1. Tổng số và cách hiểu

| Loại | Số lượng | Ý nghĩa |
| --- | ---: | --- |
| Bảng vật lý | 31 | Không cộng tám view lịch sử |
| PRIMARY KEY | 31 | Nhận diện bản ghi; một PK có thể gồm nhiều cột |
| UNIQUE ngoài PK | 35 | Chống trùng một cột hoặc một tổ hợp; không cộng lại PK vào số này |
| FOREIGN KEY | 81 | Bảo đảm bản ghi cha tồn tại; FK ghép được tính một lần |
| CHECK | 66 | Kiểm tra điều kiện trên dữ liệu trong dòng |
| Cột NOT NULL | 276/362 | Không được NULL; đây là thuộc tính cột, không cộng vào 213 constraint PK/UK/FK/CHECK |
| View lịch sử | 8 | Đọc từ nhật ký chung; không có thêm tám bộ PK/FK độc lập |

Các số PK/UNIQUE/FK/CHECK đã đối chiếu giữa DDL và từ điển metadata. NOT NULL và tổng cột lấy từ metadata. INDEX tìm kiếm thông thường, DEFAULT, ENUM, UNSIGNED và biểu thức cột sinh được giải thích riêng; không gộp vào các số constraint ở trên.

## 2. Danh sách từng bảng

Tên bảng dẫn đến mục tương ứng trong [từ điển đầy đủ](../bao-cao/tu-dien-du-lieu.md), nơi có tên constraint, biểu thức CHECK, các cột FK và hành vi UPDATE/DELETE. Cột UK dưới đây là số UNIQUE ngoài khóa chính.

| Bảng | Khóa chính | UK | FK | CHECK | Ràng buộc cần hiểu |
| --- | --- | ---: | ---: | ---: | --- |
| [can_ho](../bao-cao/tu-dien-du-lieu.md#can_ho) | `(ma_can_ho)` | 1 | 1 | 1 | Diện tích > 0; số căn duy nhất trên toàn chung cư; khối/tầng phải có trong danh mục. |
| [cau_hinh_phi](../bao-cao/tu-dien-du-lieu.md#cau_hinh_phi) | `(ma_cau_hinh_phi)` | 1 | 2 | 4 | Không trùng loại phí/ngày bắt đầu; giá không âm; ngày kết thúc sau ngày bắt đầu; thuế 0–100%; cấu hình bậc thang chỉ cho điện. |
| [chi_so_dich_vu](../bao-cao/tu-dien-du-lieu.md#chi_so_dich_vu) | `(ma_chi_so_dich_vu)` | 1 | 2 | 1 | Mỗi căn/dịch vụ/kỳ có tối đa một bản chỉ số; chỉ số cũ ≥ 0 và mới ≥ cũ. |
| [chi_tiet_hoa_don](../bao-cao/tu-dien-du-lieu.md#chi_tiet_hoa_don) | `(ma_chi_tiet_hoa_don)` | 0 | 3 | 1 | Phải tham chiếu hóa đơn/cấu hình phí hợp lệ; số lượng, giá và thành tiền không âm. Tổng/sản phẩm tiền do service đối chiếu. |
| [chung_tu_thu_chi](../bao-cao/tu-dien-du-lieu.md#chung_tu_thu_chi) | `(ma_chung_tu)` | 1 | 2 | 2 | Cùng phiếu không lặp hash tệp; kích thước từ 1 byte đến 5 MiB và bằng số byte binary lưu trong bảng. |
| [cu_dan](../bao-cao/tu-dien-du-lieu.md#cu_dan) | `(ma_cu_dan)` | 1 | 1 | 0 | Mã cư dân duy nhất; tài khoản cá nhân liên kết không được dùng cho hai hồ sơ. SĐT cư dân không có UNIQUE. |
| [dat_lich_tien_ich](../bao-cao/tu-dien-du-lieu.md#dat_lich_tien_ich) | `(ma_dat_lich)` | 1 | 5 | 4 | Khóa gửi không lặp; 1–1.000 người; bắt đầu/kết thúc cùng ngày, đúng bước 30 phút; thời lượng 30–360 phút. Chống trùng lịch ở service. |
| [dot_lap_hoa_don](../bao-cao/tu-dien-du-lieu.md#dot_lap_hoa_don) | `(ma_dot_lap)` | 1 | 1 | 1 | Cùng người lập/khóa yêu cầu không tạo hai đợt; kết quả nếu có phải là JSON object. |
| [dot_nhap_du_lieu](../bao-cao/tu-dien-du-lieu.md#dot_nhap_du_lieu) | `(ma_dot_nhap)` | 2 | 1 | 1 | Chống lặp khóa gửi và cùng tệp theo người nhập/phân hệ/hash; số dòng 1–100. |
| [dot_xu_ly_hoa_don](../bao-cao/tu-dien-du-lieu.md#dot_xu_ly_hoa_don) | `(ma_dot_xu_ly)` | 1 | 1 | 1 | Cùng người thực hiện/khóa yêu cầu không lặp; thao tác thuộc DUYET/GUI; kết quả nếu có là JSON object. |
| [gioi_han_gui](../bao-cao/tu-dien-du-lieu.md#gioi_han_gui) | `(khoa)` | 0 | 0 | 0 | Mỗi khóa giới hạn có một bản ghi; các mốc lưu JSON. Cửa sổ thời gian/mức giới hạn được xử lý trong code. |
| [hinh_anh_phan_anh](../bao-cao/tu-dien-du-lieu.md#hinh_anh_phan_anh) | `(ma_hinh_anh_phan_anh)` | 1 | 2 | 0 | Đường dẫn tệp duy nhất; tham chiếu phản ánh/người tải. Vai trò ảnh thuộc PHAN_ANH/NGHIEM_THU; nội dung tệp và lượt hợp lệ do code kiểm tra. |
| [hoa_don](../bao-cao/tu-dien-du-lieu.md#hoa_don) | `(ma_hoa_don)` | 5 | 7 | 2 | Số hóa đơn/mã thu duy nhất; không trùng căn/kỳ/lần lập và tối đa một hóa đơn chưa HUY mỗi căn/kỳ; tiền không âm; đã thanh toán phải thu đúng tổng và có mã tham chiếu không NULL. |
| [khoi_toa_nha](../bao-cao/tu-dien-du-lieu.md#khoi_toa_nha) | `(khoi)` | 0 | 0 | 0 | Mã khối là khóa chính; không thể có hai dòng cùng mã khối theo collation. |
| [lich_su_cu_tru](../bao-cao/tu-dien-du-lieu.md#lich_su_cu_tru) | `(ma_lich_su_cu_tru)` | 1 | 3 | 1 | Mỗi cư dân tối đa một đợt chưa kết thúc; ngày kết thúc không trước ngày bắt đầu, cho phép bằng ngày. Không tự chống mọi khoảng lịch sử chồng lấn. |
| [loai_phi](../bao-cao/tu-dien-du-lieu.md#loai_phi) | `(loai_phi)` | 0 | 0 | 0 | Mã loại phí là khóa chính; cấu hình giá và chi tiết liên kết theo mã này. |
| [nguoi_dung](../bao-cao/tu-dien-du-lieu.md#nguoi_dung) | `(ma_nguoi_dung)` | 4 | 2 | 1 | SĐT, tên đăng nhập, căn thanh toán, cư dân phụ trách có UNIQUE riêng; tài khoản căn phải là CU_DAN và lưu SĐT riêng bằng NULL. |
| [nhat_ky_nghiep_vu](../bao-cao/tu-dien-du-lieu.md#nhat_ky_nghiep_vu) | `(ma_nhat_ky)` | 1 | 14 | 17 | Chống trùng mã lịch sử gốc theo loại; 14 FK; 17 CHECK chọn đúng đối tượng/loại sự kiện và cấu trúc JSON cho từng nhóm. |
| [phan_anh](../bao-cao/tu-dien-du-lieu.md#phan_anh) | `(ma_phan_anh)` | 2 | 6 | 2 | Mã tra cứu/khóa gửi duy nhất; vị trí và các đối tượng liên quan có FK; bộ snapshot thiết bị phải đồng thời đủ hoặc cùng NULL; trạng thái TRUNG phải có phản ánh gốc. |
| [phieu_bao_tri](../bao-cao/tu-dien-du-lieu.md#phieu_bao_tri) | `(ma_phieu_bao_tri)` | 2 | 5 | 7 | Khóa yêu cầu duy nhất; mỗi thiết bị tối đa một phiếu định kỳ đang mở; kiểm tra chu kỳ, KTV, kết quả, người nghiệm thu/hủy theo trạng thái. |
| [phieu_thu_chi](../bao-cao/tu-dien-du-lieu.md#phieu_thu_chi) | `(ma_phieu)` | 2 | 4 | 3 | Số tiền > 0; mỗi phiếu gốc tối đa một phiếu đảo; kiểm tra tổ hợp khóa gửi/phiếu gốc và người/ngày duyệt khi ghi sổ. |
| [phuong_tien](../bao-cao/tu-dien-du-lieu.md#phuong_tien) | `(ma_phuong_tien)` | 3 | 6 | 3 | Mã đăng ký/biển số đang hoạt động không trùng; xe máy/ô tô phải có biển số không NULL; kết thúc phải có người/lý do; ngày kết thúc ≥ ngày đăng ký. |
| [quy_tai_chinh](../bao-cao/tu-dien-du-lieu.md#quy_tai_chinh) | `(ma_quy)` | 1 | 0 | 1 | Tối đa một quỹ nhận thu hóa đơn; quỹ đó phải hoạt động. Số dư đủ để chi do service tính/khóa, không phải CHECK trong bảng. |
| [schema_migrations](../bao-cao/tu-dien-du-lieu.md#schema_migrations) | `(name)` | 0 | 0 | 0 | Tên migration là khóa chính; checksum được runner so sánh trước khi áp dụng. |
| [tang_toa_nha](../bao-cao/tu-dien-du-lieu.md#tang_toa_nha) | `(khoi, tang)` | 0 | 1 | 1 | Khóa chính ghép (khối, tầng); tầng ≤ 200 và không âm theo kiểu UNSIGNED; khối phải tồn tại. |
| [thiet_bi](../bao-cao/tu-dien-du-lieu.md#thiet_bi) | `(ma_thiet_bi)` | 1 | 1 | 4 | Mã tài sản duy nhất; chu kỳ/ngày bảo trì phải đi cùng; chu kỳ 1–3.650 ngày, nhắc trước ≤ 90; ngừng sử dụng không giữ chu kỳ. |
| [thong_bao](../bao-cao/tu-dien-du-lieu.md#thong_bao) | `(ma_thong_bao)` | 1 | 5 | 2 | Phạm vi toàn bộ/khối/căn có tổ hợp trường phù hợp; nhắc phí gắn hóa đơn/ngày/căn; tối đa một nhắc mỗi hóa đơn/ngày. |
| [thong_bao_da_doc](../bao-cao/tu-dien-du-lieu.md#thong_bao_da_doc) | `(ma_thong_bao, ma_nguoi_dung, nguoi_tiep_nhan)` | 0 | 2 | 0 | PK ghép thông báo/tài khoản/ngữ cảnh người tiếp nhận; chống trùng biên nhận trong cùng ngữ cảnh. |
| [tien_ich](../bao-cao/tu-dien-du-lieu.md#tien_ich) | `(ma_tien_ich)` | 0 | 1 | 5 | Sức chứa 1–1.000; giờ mở trước giờ đóng trong ngày, bước 30 phút; thời lượng tối đa 30–360 phút, bội 30; đặt trước 1–90 ngày. |
| [vi_tri_qr](../bao-cao/tu-dien-du-lieu.md#vi_tri_qr) | `(ma_vi_tri_qr)` | 1 | 2 | 1 | Token duy nhất; thiết bị/người tạo có FK; có thiết bị liên kết thì loại phải là THIET_BI. Mã còn hoạt động được service kiểm tra khi gửi. |
| [yeu_cau_gui](../bao-cao/tu-dien-du-lieu.md#yeu_cau_gui) | `(khoa)` | 0 | 1 | 0 | Một biên nhận cho mỗi khóa gửi; phản ánh nếu có phải tồn tại. So khớp nội dung phát lại do service thực hiện. |

## 3. Tất cả 35 UNIQUE ngoài khóa chính

`UNIQUE(a,b)` giới hạn **cặp (a,b)**, không có nghĩa a hoặc b phải duy nhất riêng lẻ. Với MySQL, UNIQUE cho phép nhiều NULL; tổ hợp có thành phần NULL cũng không bị chặn như tổ hợp toàn giá trị. Vì vậy phải đọc cả khả năng NULL và cột sinh.

| Bảng | Tên UNIQUE | Cột/tổ hợp duy nhất |
| --- | --- | --- |
| `can_ho` | `so_can_ho` | `(so_can_ho)` |
| `cau_hinh_phi` | `loai_phi` | `(loai_phi, tu_ngay)` |
| `chi_so_dich_vu` | `ma_can_ho` | `(ma_can_ho, loai_dich_vu, ky_thanh_toan)` |
| `chung_tu_thu_chi` | `ma_phieu` | `(ma_phieu, bam_sha256)` |
| `cu_dan` | `ma_nguoi_dung` | `(ma_nguoi_dung)` |
| `dat_lich_tien_ich` | `khoa_yeu_cau` | `(khoa_yeu_cau)` |
| `dot_lap_hoa_don` | `uq_bill_batch_request` | `(ma_nguoi_lap, khoa_yeu_cau)` |
| `dot_nhap_du_lieu` | `uq_import_file` | `(ma_nguoi_nhap, phan_he, sha256)` |
| `dot_nhap_du_lieu` | `uq_import_request` | `(ma_nguoi_nhap, khoa_yeu_cau)` |
| `dot_xu_ly_hoa_don` | `uq_bill_action_request` | `(ma_nguoi_thuc_hien, khoa_yeu_cau)` |
| `hinh_anh_phan_anh` | `duong_dan_tep` | `(duong_dan_tep)` |
| `hoa_don` | `ma_can_ho` | `(ma_can_ho, ky_thanh_toan, lan_lap)` |
| `hoa_don` | `ma_can_ho_2` | `(ma_can_ho, ky_thanh_toan, hieu_luc)` |
| `hoa_don` | `ma_hoa_don_thay_the_cho` | `(ma_hoa_don_thay_the_cho)` |
| `hoa_don` | `ma_tham_chieu` | `(ma_tham_chieu)` |
| `hoa_don` | `so_hoa_don` | `(so_hoa_don)` |
| `lich_su_cu_tru` | `cu_dan_dang_o` | `(cu_dan_dang_o)` |
| `nguoi_dung` | `ma_can_ho_thanh_toan` | `(ma_can_ho_thanh_toan)` |
| `nguoi_dung` | `ma_cu_dan_phu_trach` | `(ma_cu_dan_phu_trach)` |
| `nguoi_dung` | `so_dien_thoai` | `(so_dien_thoai)` |
| `nguoi_dung` | `ten_dang_nhap` | `(ten_dang_nhap)` |
| `nhat_ky_nghiep_vu` | `uk_history_original` | `(loai_nhat_ky, ma_goc)` |
| `phan_anh` | `khoa_yeu_cau` | `(khoa_yeu_cau)` |
| `phan_anh` | `ma_tra_cuu` | `(ma_tra_cuu)` |
| `phieu_bao_tri` | `khoa_yeu_cau` | `(khoa_yeu_cau)` |
| `phieu_bao_tri` | `uq_open_periodic` | `(dinh_ky_dang_mo)` |
| `phieu_thu_chi` | `khoa_yeu_cau` | `(khoa_yeu_cau)` |
| `phieu_thu_chi` | `ma_phieu_goc` | `(ma_phieu_goc)` |
| `phuong_tien` | `bien_so_dang_hoat_dong` | `(bien_so_dang_hoat_dong)` |
| `phuong_tien` | `ma_dang_ky` | `(ma_dang_ky)` |
| `phuong_tien` | `ma_dang_ky_truoc` | `(ma_dang_ky_truoc)` |
| `quy_tai_chinh` | `quy_hoa_don` | `(quy_hoa_don)` |
| `thiet_bi` | `ma_tai_san` | `(ma_tai_san)` |
| `thong_bao` | `uq_bill_reminder_day` | `(ma_hoa_don, ngay_nhac)` |
| `vi_tri_qr` | `token_qr` | `(token_qr)` |

## 4. Năm ràng buộc có điều kiện qua cột sinh

| Bảng/cột sinh | Khi nào có giá trị | UNIQUE bảo đảm |
| --- | --- | --- |
| lich_su_cu_tru.cu_dan_dang_o | den_ngay IS NULL → mã cư dân, ngược lại NULL | Tối đa một đợt chưa kết thúc cho một cư dân |
| hoa_don.hieu_luc | HUY → NULL; trạng thái khác → 1 | Tổ hợp căn/kỳ/hiệu lực có tối đa một hóa đơn không hủy |
| phuong_tien.bien_so_dang_hoat_dong | ngay_ket_thuc IS NULL → biển số, ngược lại NULL | Biển số không NULL không có hai đăng ký đang mở; không tự kiểm tra mọi khoảng lịch sử |
| phieu_bao_tri.dinh_ky_dang_mo | Định kỳ chưa HOAN_THANH/HUY → mã thiết bị, ngược lại NULL | Mỗi thiết bị tối đa một phiếu định kỳ đang mở |
| quy_tai_chinh.quy_hoa_don | Có cờ nhận thu hóa đơn → 1, ngược lại NULL | Tối đa một quỹ nhận hóa đơn |

Những ràng buộc trên bảo đảm **tối đa một**, không tự bảo đảm luôn tồn tại một bản ghi. Ví dụ, UNIQUE trên tài khoản căn không tự tạo tài khoản khi ai đó chèn căn hộ bằng SQL; quy trình tạo căn qua service mới tạo tài khoản tương ứng.

## 5. Khóa ngoại và xóa/cập nhật dữ liệu

Có **63 FK DELETE NO ACTION**, **6 DELETE RESTRICT**, **11 DELETE CASCADE** và **1 DELETE SET NULL**. Hai FK có UPDATE CASCADE theo chuỗi khối → tầng → căn; 79 FK còn lại UPDATE NO ACTION. Với InnoDB, NO ACTION có tác dụng chặn ngay tương tự RESTRICT, không phải kiểm tra trì hoãn đến commit.

| Hành vi | Ví dụ trong dự án | Ý nghĩa |
| --- | --- | --- |
| UPDATE CASCADE | tang_toa_nha.khoi → khoi_toa_nha.khoi; can_ho.(khoi,tang) → tang_toa_nha.(khoi,tang) | Sửa khóa danh mục cập nhật khóa liên quan, vẫn chịu các ràng buộc khác |
| DELETE NO ACTION/RESTRICT | Phản ánh tham chiếu vị trí; nhật ký tham chiếu phản ánh/hóa đơn | Không xóa bản ghi cha khi còn quan hệ chặn |
| DELETE CASCADE | Chứng từ theo phiếu; biên nhận đọc theo thông báo; tài khoản căn theo căn | Xóa các bản ghi con thuộc quan hệ đó nếu thao tác không bị FK khác chặn |
| DELETE SET NULL | nguoi_dung.ma_cu_dan_phu_trach → cu_dan | Xóa cư dân có thể làm người phụ trách thành NULL, nếu các FK khác cho phép xóa |

Không nên diễn đạt rằng lịch sử “không bao giờ bị xóa bởi CSDL”: một số quan hệ nhật ký có CASCADE. API và chính sách vận hành giới hạn thao tác; SQL xóa trực tiếp vẫn chịu đúng hành vi DDL. Cũng không được hiểu rằng một FK CASCADE sẽ luôn làm cả lệnh xóa thành công khi các FK khác còn chặn.

## 6. Các quy tắc còn được kiểm tra trong API

| Quy tắc | CSDL hiện bảo đảm | Code kiểm tra bổ sung |
| --- | --- | --- |
| Tránh cư trú chồng lấn | Một đợt đang mở/cư dân; ngày kết thúc ≥ bắt đầu | Ngày hợp lệ/không tương lai, không chồng đợt cũ, đúng căn khi chuyển; residency.service.js và residency.validation.js |
| Người phụ trách căn là chủ hộ hiện tại | FK người/căn và UNIQUE từng liên kết | Đối chiếu đợt cư trú, quan hệ CHU_HO và xác nhận bàn giao; apartment-accounts.service.js |
| KTV được giao đúng vai trò/còn hoạt động | FK tới một người dùng tồn tại | Kiểm tra vai trò, trạng thái và quyền trên phản ánh/phiếu; FK không xác minh vai trò |
| Hoàn thành và nghiệm thu phản ánh | ENUM trạng thái; FK; CHECK snapshot và gộp | Các bước chuyển, ảnh mới đúng lượt, BQL nghiệm thu và KTV không tự đóng; incidents.service.js |
| Gửi QR và phát lại | Token/khóa yêu cầu duy nhất; FK | Mã đang hoạt động, phiên bản, giới hạn gửi và dấu vân tay nội dung; qr/incidents service |
| Tổng hóa đơn và tiền điện | Tiền không âm; đã thanh toán thu bằng tổng | Tổng chi tiết, phép nhân/làm tròn, giá hiệu lực, bậc điện, số xe, fingerprint nguồn và snapshot; billing service/validation |
| Định dạng SĐT và kỳ hóa đơn | VARCHAR/CHAR và kiểu ngày, không có CHECK mẫu SĐT/kỳ ở mọi bảng | lib/http.js kiểm tra SĐT; billing.validation.js kiểm tra YYYY-MM và tháng 01–12; các validation kiểm tra ngày hợp lệ |
| Tránh chồng khoảng giá | UNIQUE loại phí/ngày bắt đầu; mỗi khoảng có thứ tự ngày | Các khoảng có cùng loại phí không được chồng nhau; billing.service.js |
| Tránh trùng lịch tiện ích | Khung giờ hợp lệ của từng dòng và FK | Khóa hàng tiện ích; kiểm tra giao nhau giữa các lịch còn giữ chỗ, giờ mở, sức chứa; amenities.service.js |
| Chi không vượt số dư | Tiền phiếu > 0; tổ hợp ghi sổ hợp lệ | Tính số dư sau khóa quỹ, kiểm tra chi/đảo thu và chứng từ; treasury service |
| Ảnh hợp lệ và đủ bằng chứng | Metadata, loại ảnh, FK và đường dẫn duy nhất | Giải mã/re-encode, kích thước/pixel, số lượng, quyền đọc và ảnh đúng lượt; lib/images.js và incidents service |

Vì vậy, không thể chỉ nhìn thấy một CHECK hoặc FK rồi kết luận CSDL đã tự kiểm soát trọn nghiệp vụ. Các kiểm tra liên bản ghi được thực hiện trong giao dịch và với khóa phù hợp; việc sửa trực tiếp SQL có thể bỏ qua lớp kiểm tra ứng dụng.

## 7. Các điểm đáng lưu ý trong thiết kế hiện tại

1. **Số căn duy nhất toàn chung cư.** `can_ho.so_can_ho` có UNIQUE riêng, nên hai khối cùng số `101` sẽ bị chặn. Quy ước mã có khối như A0101/B0101 phù hợp ràng buộc này. `tang_toa_nha` dùng PK ghép nên số tầng được lặp ở các khối khác nhau.
2. **Một cư dân phụ trách tối đa một tài khoản căn.** UNIQUE trên `nguoi_dung.ma_cu_dan_phu_trach` không cho cùng người phụ trách hai căn. Nếu sau này cần một người đại diện nhiều căn, phải xác định lại quan hệ và cách chọn căn khi đăng nhập bằng SĐT; đây chưa phải khả năng của schema hiện tại.
3. **SĐT cư dân và SĐT đăng nhập khác ràng buộc.** `cu_dan.so_dien_thoai` không UNIQUE; `nguoi_dung.so_dien_thoai` có UNIQUE và được NULL. Định dạng SĐT/minh bạch lựa chọn tài khoản do API xử lý. SĐT chủ hộ để đăng nhập tài khoản căn được tra qua cư dân hiện phụ trách, không chép vào cột SĐT của tài khoản căn.
4. **Quan hệ CHU_HO và người phụ trách thanh toán không phải cùng một constraint.** Không có UNIQUE điều kiện theo căn trên `lich_su_cu_tru.quan_he`. Cột `nguoi_dung.ma_cu_dan_phu_trach` chỉ ra người chịu trách nhiệm tài khoản căn hiện tại; không nên trình bày rằng DB đã bắt mỗi căn có đúng một dòng cư trú CHU_HO.
5. **NOT NULL không phải không rỗng; TINYINT(1) không phải chỉ 0/1.** Chuỗi rỗng vẫn có thể khác NULL; các cờ không có CHECK IN (0,1) riêng không được tự coi là boolean nghiêm ngặt ở DB. API có kiểm tra văn bản và boolean. CHECK tài khoản hiện tại cũng chưa bắt riêng nhánh tài khoản cá nhân phải có SĐT không NULL.
6. **FK chỉ xác nhận đối tượng tồn tại.** Các FK độc lập của phương tiện/lượt đặt không tự chứng minh cư dân, đợt ở và căn thuộc cùng một ngữ cảnh; service đối chiếu điều đó.
7. **CHECK cho phép TRUE hoặc UNKNOWN.** NULL có thể làm biểu thức thành UNKNOWN. Hai cặp CHECK bảo trì có tên `*_strict` bên cạnh CHECK cũ để chặn thiếu chu kỳ/ngày; không nên xóa CHECK strict chỉ vì nhìn giống nhau. Cặp cũ yếu hơn có thể được đánh giá gọn hóa trong một migration tương lai, không sửa baseline đã có checksum.
8. **66 CHECK không có nghĩa xác minh mọi nội dung JSON.** Nhật ký có 17 CHECK: tám nhóm đối tượng, tám schema payload và một danh mục loại. Schema của nhóm bảo trì yêu cầu thuộc tính du_lieu nhưng không ràng mọi cấu trúc lồng bên trong; validation nghiệp vụ vẫn có vai trò.
9. **Phụ thuộc trạng thái thực thi.** MySQL cần phiên bản hỗ trợ CHECK, constraint phải ENFORCED và kết nối phải bật FK/thiết lập SQL mode phù hợp. ENUM/UNSIGNED và giới hạn kiểu có thể bị chuyển đổi/cảnh báo trong chế độ không strict. Tệp SQL xem metadata hiển thị các thông tin này để đối chiếu.
10. **Thông báo theo khối chưa có FK tới danh mục khối.** `thong_bao.khoi` có CHECK về tổ hợp phạm vi nhưng không có FOREIGN KEY tới `khoi_toa_nha.khoi`. `announcements.service.js` kiểm tra khối có căn khi tạo/sửa; `building-structure.service.js:saveBlock` đổi mã khối và cập nhật tầng/căn, chưa đồng bộ trường khối của thông báo. Trong khi truy vấn nhận thông báo so sánh `n.khoi=a.khoi`, việc đổi mã A sang B có nguy cơ làm thông báo theo A không còn đến cư dân thuộc B. Đây là phát hiện qua đọc mã, cần nghiệm thu tình huống đổi mã khối sau khi phát hành thông báo; chưa tái hiện trên database trong lượt rà soát này.

Các điểm trên là giới hạn/phạm vi của ràng buộc đã khai báo, không phải khẳng định đang có dữ liệu sai trên máy người dùng. Lượt rà soát này không đổi migration, không xóa constraint và không thêm quy tắc nghiệp vụ mới.

## 8. Xem ràng buộc thật trên máy bạn

Mở MySQL Workbench và chọn database đang dùng, rồi mở [xem-rang-buoc.sql](xem-rang-buoc.sql). Tệp gồm chín truy vấn SELECT chỉ đọc metadata, không đọc hồ sơ/hóa đơn hay mật khẩu.

Trong MySQL Command Line Client có thể chạy:

```sql
SELECT DATABASE();
-- Nếu chưa chọn DB, dùng USE với tên database thật của bạn.
SHOW CREATE TABLE lich_su_cu_tru;
SHOW CREATE TABLE hoa_don;
SHOW CREATE TABLE phan_anh;
```

Để chạy cả tệp trong MySQL CLI, sửa đường dẫn đúng nơi checkout:

```sql
SOURCE D:/DO_AN/chung-cu-starter-fresh/docs/csdl-do-an/xem-rang-buoc.sql;
```

Lệnh SOURCE trên chạy bên trong MySQL CLI, không phải PowerShell. Kết quả trên laptop mới xác nhận schema thực tế đang cài; nếu số lượng khác bảng trong tài liệu, cần đối chiếu phiên bản database/migration hoặc thay đổi DDL thủ công.

## 9. Đoạn diễn giải có thể dùng trong báo cáo

> Cơ sở dữ liệu sử dụng các ràng buộc khóa chính, khóa ngoại, duy nhất, miền giá trị và điều kiện kiểm tra để bảo đảm tính toàn vẹn. Schema hiện hành gồm 31 bảng vật lý với 31 khóa chính, 35 UNIQUE ngoài khóa chính, 81 khóa ngoại và 66 CHECK. Các cột sinh kết hợp UNIQUE giới hạn số bản ghi đang hoạt động, như đợt cư trú, hóa đơn còn hiệu lực, đăng ký xe và phiếu bảo trì định kỳ. Các quy tắc liên bản ghi như chống trùng lịch, kiểm tra số dư, phân quyền xử lý và đối chiếu tổng hóa đơn được thực hiện bổ sung tại tầng dịch vụ trong giao dịch. Tám view lịch sử là các phép chiếu từ nhật ký dùng chung, không được tính thành bảng vật lý có bộ ràng buộc độc lập.

Nguồn: baseline MySQL, [từ điển dữ liệu](../bao-cao/tu-dien-du-lieu.md), `residency.service.js`, `apartment-accounts.service.js`, `billing.service.js`, `incidents.service.js`, `amenities.service.js` và `treasury.service.js`.
