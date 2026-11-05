# Cơ sở dữ liệu theo đồ án chuyên ngành

Nguồn đối chiếu: Word `1250080221_To_Hoang_Tuan.docx`, đặc biệt Phạm vi chức năng chính, mục 2.4 Thiết kế CSDL và 3.2.1 Hiện thực CSDL. Người dùng đã xác nhận **quay về MySQL và giữ đầy đủ nghiệp vụ**, trong đó trọng tâm là đề tài “Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân”.

Đề cương không ấn định số bảng. Thiết kế mới có **31 bảng vật lý**, cùng **8 view đọc lịch sử**. Tám bảng nhật ký cũ dùng chung một nơi lưu, giữ actor, sự kiện, thời điểm, FK tới đối tượng, mã lịch sử gốc và payload có JSON Schema. Dữ liệu cư trú, hóa đơn, chỉ số, phương tiện và ảnh vẫn được lưu trong các bảng nghiệp vụ có kiểu/ràng buộc riêng.

| Nhóm                                               | Số bảng thật | Danh sách                                                                                                                                                                                                                                                                 |
| -------------------------------------------------- | -----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nghiệp vụ trọng tâm của đề cương                   |           18 | `nguoi_dung`, `khoi_toa_nha`, `tang_toa_nha`, `can_ho`, `cu_dan`, `lich_su_cu_tru`, `phuong_tien`, `thiet_bi`, `vi_tri_qr`, `phan_anh`, `hinh_anh_phan_anh`, `loai_phi`, `cau_hinh_phi`, `chi_so_dich_vu`, `hoa_don`, `chi_tiet_hoa_don`, `thong_bao`, `thong_bao_da_doc` |
| Mở rộng đã được người dùng yêu cầu và vẫn được giữ |            6 | `phieu_bao_tri`, `tien_ich`, `dat_lich_tien_ich`, `quy_tai_chinh`, `phieu_thu_chi`, `chung_tu_thu_chi`                                                                                                                                                                    |
| Nhật ký dùng chung                                 |            1 | `nhat_ky_nghiep_vu`                                                                                                                                                                                                                                                       |
| Hỗ trợ kỹ thuật                                    |            6 | `yeu_cau_gui`, `gioi_han_gui`, `dot_nhap_du_lieu`, `dot_lap_hoa_don`, `dot_xu_ly_hoa_don`, `schema_migrations`                                                                                                                                                            |
| **Tổng**                                           |       **31** | Không gồm8 view                                                                                                                                                                                                                                                           |

## Trọng tâm theo Word

| Yêu cầu trong đề cương                                            | Bảng/quan hệ thực hiện                                                        | Nghiệp vụ vẫn có                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Đăng nhập và phân quyền BQL/KTV/cư dân                            | `nguoi_dung`, liên kết tài khoản–cư dân/căn                                   | Khóa phiên, đổi mật khẩu, tài khoản căn, alias SĐT chủ hộ hiện tại, bàn giao và thu hồi phiên cũ                                    |
| Sơ đồ Block → Tầng → Căn hộ                                       | `khoi_toa_nha` → `tang_toa_nha` → `can_ho`                                    | Khối/tầng trống, chỉnh mã/số có cascade, phiên bản và ràng buộc mục đang dùng                                                       |
| Hồ sơ cư dân và phương tiện                                       | `cu_dan` → `lich_su_cu_tru` → `can_ho`, `phuong_tien`                         | Chuyển cùng ngày, chuyển đi/quay lại, quan hệ chủ hộ/thành viên/người thuê, lịch sử và căn chịu phí của xe                          |
| Quản lý tài sản/vị trí, sinh và in QR                             | `thiet_bi` ↔ `vi_tri_qr`                                                     | QR vị trí và QR thiết bị, xoay token/thu hồi, đổi liên kết có lịch sử                                                               |
| Quét QR → nhận diện vị trí → gửi ảnh/nội dung không đăng nhập     | `vi_tri_qr` → `phan_anh` → `hinh_anh_phan_anh`                                | Snapshot thiết bị lúc gửi, camera/thư viện, chống gửi lặp, giới hạn gửi, mã tra cứu riêng                                           |
| BQL tiếp nhận/phân công, KTV xử lý và tải ảnh nghiệm thu          | `phan_anh`, `nguoi_dung`, `hinh_anh_phan_anh`, nhật ký                        | Chuyển trạng thái, đổi KTV thu hồi quyền cũ, nghiệm thu/trả lại theo lượt, chống ghi đè                                             |
| Cấu hình phí, điện/nước, hóa đơn VietQR                           | `loai_phi` → `cau_hinh_phi`; `chi_so_dich_vu`; `hoa_don` → `chi_tiet_hoa_don` | Giá theo hiệu lực, điện bậc thang/VAT, số xe theo loại, snapshot bất biến, lập/duyệt/gửi theo lô, nhắc phí, đối soát thu và công nợ |
| Cư dân theo dõi phản ánh, hóa đơn và thông báo                    | Phạm vi tài khoản/cư trú, `thong_bao`, `thong_bao_da_doc`                     | Quyền riêng tư sau bàn giao, trạng thái đọc theo người phụ trách, hóa đơn theo căn và kỳ                                            |
| Một chung cư, Web Responsive, VietQR ở mức thông tin chuyển khoản | Toàn mô hình                                                                  | Không thêm tenant, ứng dụng native hay webhook tự xác nhận ngân hàng                                                                |
| Phần mở rộng trong hội thoại                                      | 6 bảng mở rộng cùng nhật ký/kỹ thuật                                          | Bảo trì định kỳ/đột xuất, đặt tiện ích, quỹ/chứng từ/đảo phiếu, báo cáo/biểu đồ, nhập Excel/xuất Excel-PDF                          |

## Nhật ký và tám view

| View                      | Đối tượng có FK trong nhật ký chung | Dữ liệu riêng vẫn giữ                                         |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `lich_su_phan_anh`        | Phản ánh, actor, KTV cũ/mới         | Trạng thái trước/sau, ghi chú nội bộ, phản hồi công khai      |
| `lich_su_hoa_don`         | Hóa đơn, actor                      | Lập/tính lại/duyệt/gửi/thu/hủy và ghi chú                     |
| `lich_su_ban_giao_can_ho` | Căn, actor                          | ID chủ cũ/mới giữ như snapshot, sự kiện bàn giao/cấp mật khẩu |
| `lich_su_thong_bao`       | Thông báo, actor                    | Tạo/sửa/phát hành/thu hồi và lý do                            |
| `lich_su_bao_tri`         | Thiết bị, phiếu bảo trì, actor      | Sự kiện, ghi chú và snapshot JSON nguyên vẹn                  |
| `lich_su_dat_lich`        | Lượt đặt, actor                     | Đặt/duyệt/từ chối/hủy và ghi chú                              |
| `lich_su_thu_chi`         | Phiếu, actor                        | Sự kiện ghi sổ/đảo cùng ghi chú snapshot                      |
| `lich_su_lien_ket_qr`     | QR, thiết bị cũ/mới, actor          | Lịch sử liên kết/tháo liên kết                                |

Các view lọc đúng loại nhật ký và giữ tên cột/API cũ, không nhân bản bản ghi. Ràng buộc FK cùng hành vi RESTRICT/CASCADE được giữ theo đối tượng. Payload chỉ chứa những trường lịch sử riêng; JSON Schema chặn thiếu/sai kiểu/thừa trường, CHECK ràng buộc nhóm đối tượng, actor/sự kiện/ghi chú. `lich_su_cu_tru` là bảng nghiệp vụ thật, không bị gộp vào nhật ký.

Khi chép dữ liệu cũ, `ma_goc` và loại nhật ký phân biệt các lịch sử có cùng ID ở hai bảng cũ; PK chung dùng mã riêng. Giao diện vẫn đọc mã lịch sử cũ qua view. Mọi ghi nhật ký mới đi qua `appendHistory()` trong cùng transaction với nghiệp vụ; lỗi nhật ký vẫn rollback nghiệp vụ.

## Tệp để dùng trong báo cáo và chạy đồ án

- [SQL baseline](../../database/thesis-mysql/001_thesis_schema.sql): schema MySQL mới; dùng runner trên database đích mới theo hướng dẫn.
- [ERD nghiệp vụ trọng tâm](erd-trong-tam.md):18 bảng chia theo luồng chính; bảng mở rộng và hỗ trợ không bị xóa.
- [ERD vật lý theo phân hệ](../bao-cao/erd-phan-he.md), [ERD đủ 31 bảng](../bao-cao/erd-vat-ly.mmd), [từ điển vật lý](../bao-cao/tu-dien-du-lieu.md): lấy từ schema thật, không tính cột view thành cột bảng.
- [Cách cập nhật/chuyển dữ liệu/chạy trên Windows](../csdl-do-an-mysql.md).
- [Kết quả kiểm chứng](kiem-chung.md).

Các ERD38 bảng và code PostgreSQL ở bản trước được lưu trong lịch sử Git; không đại diện schema mới. Đề cương Word vẫn phải cập nhật các hình, bảng và phiên bản môi trường theo những gì thực sự đã chạy, không chỉ chép số bảng.
