# Kiến trúc, phân rã chức năng, Class Diagram và ERD logic

Đây là mô hình phân tích theo mã nguồn hiện hành. [ERD vật lý](erd-phan-he.md) và [từ điển](tu-dien-du-lieu.md) mới là nguồn tên cột/khóa/ràng buộc đầy đủ. Không suy ra ứng dụng dùng ORM hoặc có các lớp runtime chỉ vì biểu diễn đối tượng nghiệp vụ bằng Class Diagram.

## Phân rã chức năng

```mermaid
flowchart TD
  HT["Quản lý vận hành chung cư"]
  HT --> A["Hồ sơ và quyền"] & B["Tiếp nhận sự cố QR"] & C["Tài chính"] & D["Vận hành"] & E["Điều hành"]
  A --> A1["Đăng nhập, phiên, phân quyền"] & A2["Khối / tầng / căn"] & A3["Cư dân / cư trú / xe"] & A4["Tài khoản căn, bàn giao chủ hộ"]
  B --> B1["Vị trí / thiết bị / QR"] & B2["Quét, form, ảnh và tra cứu"] & B3["Phân công, xử lý, nghiệm thu"]
  C --> C1["Đơn giá hiệu lực / chỉ số"] & C2["Hóa đơn / VietQR / xác nhận thu"] & C3["Công nợ / thu phí / quỹ"]
  D --> D1["Thiết bị và lịch bảo trì"] & D2["Phiếu bảo trì và nghiệm thu"] & D3["Tiện ích và duyệt đặt lịch"]
  E --> E1["Thông báo / nhắc phí trên web"] & E2["Dashboard, biểu đồ theo thời gian"] & E3["Nhập/xuất Excel và PDF biểu mẫu"]
```

## Kiến trúc ba tầng

```mermaid
flowchart TB
  subgraph CLIENT["Tầng trình bày - trình duyệt"]
    P["React 19 + React Router + CSS responsive"]
    C["html5-qrcode / getUserMedia / qrcode"]
    P --- C
  end
  subgraph APP["Tầng ứng dụng - Node.js / Express 5"]
    R["Router + request context + auth / role / rate limit"]
    S["Service nghiệp vụ + validation + transaction"]
    I["multer / Sharp; nhập Excel / PDF; xuất báo cáo"]
    R --> S
    R --> I
  end
  subgraph DATA["Tầng dữ liệu"]
    DB[("MySQL 8 / InnoDB")]
    FS[("Kho file ảnh phản ánh")]
  end
  P <-->|"HTTPS JSON / multipart + cookie HttpOnly"| R
  S <-->|"mysql2, tham số truy vấn, khóa hàng"| DB
  I --> FS
  I --> DB
```

Frontend/API phục vụ cùng origin; Vite proxy `/api` khi phát triển. Backend không mở thư mục ảnh công khai; endpoint ảnh kiểm tra quyền bản ghi. Chứng từ quỹ dùng binary trong DB, còn ảnh phản ánh là file + metadata. Sao lưu phải tính cả MySQL và kho ảnh; chưa có bằng chứng nghiệm thu phục hồi.

JWT dùng `jose` HS256, bcrypt cost 12. Request thay đổi cần `X-App-Request: 1`, từ chối `Sec-Fetch-Site: cross-site`, cookie SameSite=Strict; cookie Secure bật khi HTTPS. API không tin role hoặc ID thiết bị gửi từ frontend để cấp quyền/chụp snapshot. `phien_ban` + khóa hàng tránh cập nhật từ form cũ; lỗi nghiệp vụ có code/message/request ID. Không có WebSocket/message broker, tác vụ SMS/email nền hay kết nối ngân hàng tự động.

## Luồng dữ liệu tổng quát

```mermaid
flowchart LR
  B["BQL cấu hình vị trí/thiết bị"] --> Q["QR chứa URL token"]
  Q --> N["Khách/cư dân quét"]
  N --> F["Form vị trí + nội dung + ảnh"]
  F --> A["API kiểm tra QR, giới hạn, chống trùng"]
  A --> D[("Phản ánh, snapshot, ảnh, lịch sử")]
  D --> P["BQL phân công"]
  P --> K["Kỹ thuật xử lý + ảnh nghiệm thu"]
  K --> T["BQL nghiệm thu / trả lại"]
  T --> D
  D --> X["Người gửi xem tiến độ được phép"]
```

Hai vòng độc lập: sự cố QR không tự tạo phiếu bảo trì; thanh toán VietQR không tự chuyển DA_THANH_TOAN. BQL thực hiện các quyết định tương ứng qua màn nghiệp vụ.

## Class Diagram phân tích

Tên lớp là khái niệm, thuộc tính chọn từ schema. Service dưới đây là mô hình hóa các **hàm export** hiện có, không khẳng định có `class` hoặc entity ORM trong mã.

```mermaid
classDiagram
  class NguoiDung {
    ma_nguoi_dung
    vai_tro
    dang_hoat_dong
    phien_ban_token
  }
  class CanHo {
    ma_can_ho
    so_can_ho
    khoi
    tang
    dien_tich_m2
  }
  class CuDan {
    ma_cu_dan
    ho_va_ten
    so_dien_thoai
    phien_ban
  }
  class DotCuTru {
    tu_ngay
    den_ngay
    quan_he
  }
  class ThietBi {
    ma_thiet_bi
    ma_tai_san
    ten_thiet_bi
    trang_thai
  }
  class ViTriQR {
    ma_vi_tri_qr
    token_qr
    phien_ban
    dang_hoat_dong
  }
  class PhanAnh {
    ma_phan_anh
    trang_thai
    phien_ban
    luot_xu_ly
    ten_thiet_bi_luc_gui
  }
  class HoaDon {
    ma_hoa_don
    ky_thanh_toan
    trang_thai
    tong_tien
  }
  class ChiTietHoaDon {
    dien_giai
    so_luong
    don_gia
    thanh_tien
  }
  class QRService {
    <<module>>
    create(body, user)
    link(id, body, user)
    rotate(id, body)
  }
  class IncidentService {
    <<module>>
    submit(body, files, user, ip)
    lookup(body)
    assign(id, body, user)
    transition(id, body, files, actor)
  }
  class BillingService {
    <<module>>
    generate(body, user)
    action(id, action, body, user)
    detail(id, user)
  }
  CuDan "1" --> "0..*" DotCuTru : có lịch sử
  CanHo "1" --> "0..*" DotCuTru : nơi cư trú
  NguoiDung "0..1" -- "0..1" CuDan : tài khoản cá nhân
  CanHo "0..1" <-- "0..1" NguoiDung : tài khoản thanh toán căn
  ThietBi "0..1" <-- "0..*" ViTriQR : liên kết hiện tại
  ViTriQR "1" <-- "0..*" PhanAnh : phát sinh tại
  ThietBi "0..1" <-- "0..*" PhanAnh : thiết bị lúc gửi
  CanHo "1" <-- "0..*" HoaDon : khoản phải trả
  HoaDon "1" --> "0..*" ChiTietHoaDon : snapshot các khoản
  QRService ..> ViTriQR
  QRService ..> ThietBi
  IncidentService ..> PhanAnh
  BillingService ..> HoaDon
```

Một căn có tối đa một tài khoản thanh toán theo ràng buộc DB; luồng tạo căn bảo đảm có tài khoản, nhưng đây không phải tổng quát rằng mọi người dùng đều là cư dân. Trách nhiệm chủ hộ nằm ở người phụ trách căn hiện tại và lịch sử bàn giao, không tự ghi đè người chịu trách nhiệm ở snapshot cũ.

## ERD logic — nhà ở và vận hành

Mô hình rút gọn quan hệ nghiệp vụ, không liệt kê mọi cột kỹ thuật/lịch sử audit. Mỗi đợt cư trú thuộc đúng một căn và một cư dân. Cùng ngày được phép kết thúc/mở đợt mới; UNIQUE cột sinh và service giới hạn tối đa một đợt đang mở mỗi cư dân.

```mermaid
erDiagram
  KHOI ||--o{ TANG : gom
  TANG ||--o{ CAN_HO : gom
  CAN_HO ||--o{ DOT_CU_TRU : noi_o
  CU_DAN ||--o{ DOT_CU_TRU : lich_su
  DOT_CU_TRU ||--o{ DANG_KY_XE : gan_theo_dot
  CU_DAN o|--o| TAI_KHOAN_CA_NHAN : lien_ket
  CAN_HO ||--o| TAI_KHOAN_THANH_TOAN : theo_can
  CU_DAN o|--o| TAI_KHOAN_THANH_TOAN : phu_trach_hien_tai
  VI_TRI_QR ||--o{ PHAN_ANH : tiep_nhan
  THIET_BI o|--o{ VI_TRI_QR : lien_ket_hien_tai
  THIET_BI o|--o{ PHAN_ANH : snapshot_khi_gui
  PHAN_ANH ||--o{ ANH_PHAN_ANH : hien_truong_nghiem_thu
  PHAN_ANH ||--o{ LICH_SU_PHAN_ANH : tien_do
  THIET_BI ||--o{ PHIEU_BAO_TRI : bao_tri
  TIEN_ICH ||--o{ DAT_LICH : khung_su_dung
  CAN_HO ||--o{ DAT_LICH : can_dat
```

`TAI_KHOAN_CA_NHAN` và `TAI_KHOAN_THANH_TOAN` là hai khái niệm của cùng bảng `nguoi_dung`, không phải hai bảng mới. QR gắn thiết bị là tùy chọn; phản ánh giữ liên kết và tên/mã/vị trí thiết bị lúc gửi, khác với thiết bị hiện tại của QR sau bàn giao. Xem ERD vật lý cho cả khóa ngoại tới actor, bản gốc gộp và lịch sử đổi liên kết.

## ERD logic — hóa đơn và thông báo

```mermaid
erDiagram
  CAN_HO ||--o{ HOA_DON : theo_ky
  HOA_DON ||--o{ CHI_TIET_HOA_DON : snapshot
  CAU_HINH_PHI o|--o{ CHI_TIET_HOA_DON : gia_nguon
  CAN_HO ||--o{ CHI_SO_DICH_VU : theo_ky
  HOA_DON ||--o{ LICH_SU_HOA_DON : thao_tac
  QUY_TAI_CHINH ||--o{ PHIEU_THU_CHI : ghi_so
  PHIEU_THU_CHI ||--o{ CHUNG_TU : dinh_kem
  THONG_BAO ||--o{ DA_DOC : bien_nhan
  NGUOI_DUNG ||--o{ DA_DOC : nguoi_doc
```

Thu hóa đơn đi vào báo cáo/quỹ vận hành từ nguồn hóa đơn đã xác nhận; không vẽ một bảng “giao dịch ngân hàng” hay tự tạo phiếu thu trùng khoản. Khoản tiền hóa đơn nguyên đồng, xử lý tổng bằng BigInt ở các luồng tài chính để giữ chính xác; `DECIMAL` từ MySQL trả về chuỗi. Số lượng và đơn giá có độ chính xác riêng, không định dạng mọi loại thành số nguyên. Biểu giá điện là cấu hình có hiệu lực, không phải khẳng định mức EVN hiện tại sẽ mãi cố định.

## Quy tắc phải giữ khi đưa vào báo cáo

| Miền dữ liệu | Ràng buộc/thực thi |
|---|---|
| Khối/tầng/căn | Khóa ghép `(khoi,tang)`; đổi mã/số cascade và tăng phiên bản căn; không xóa mục đang dùng |
| Cư trú/xe | Khoảng `[bắt đầu,kết thúc)`; ngày kết thúc bằng bắt đầu được phép; chuyển căn và xe cùng transaction |
| QR/phản ánh | QR version, snapshot server, replay chống gửi trùng, giới hạn gửi, quyền ảnh và lịch sử |
| Xử lý | KTV được giao mới sửa; ảnh mới từng lượt; BQL nghiệm thu, không tự hoàn thành hộ |
| Hóa đơn | Snapshot; duyệt rồi gửi; chưa thu mới hủy/thay thế; đã nhận đủ mới BQL xác nhận thu |
| Bảo trì | Phiếu định kỳ mở duy nhất mỗi thiết bị; nghiệm thu mới dời lịch theo ngày thực hiện + chu kỳ snapshot |
| Đặt lịch | Lượt chờ cũng giữ chỗ; khóa server ngăn trùng; không chia sẻ sức chứa giữa nhóm |
| Quỹ | Ghi sổ không sửa; đảo có lý do; không chi quá số dư hiện tại; chưa khóa sổ kỳ |
| Nhập file | Xem trước chưa lưu; xác nhận kiểm tra lại; lỗi một dòng rollback lô; PDF phải có trường điền, không OCR |

Kiến trúc này là phiên bản demo/đồ án. Hiệu năng tải lớn, sao lưu phục hồi và thiết bị thật phải có kết quả đo riêng trong [nghiệm thu](nghiem-thu.md).
