# ERD nghiệp vụ trọng tâm của đề tài

Đây là 18 bảng nghiệp vụ chính, chia thành 3 hình để chèn báo cáo. Schema vật lý vẫn có 31 bảng và 8 view; xem [phân nhóm đầy đủ](README.md) và [từ điển vật lý](../bao-cao/tu-dien-du-lieu.md). Các quan hệ trong hình được chọn để giải thích nghiệp vụ; ERD vật lý có đầy đủ FK/thuộc tính/ràng buộc.

## 1. QR → phản ánh → kỹ thuật → nghiệm thu

```mermaid
erDiagram
  nguoi_dung ||--o{ vi_tri_qr : "BQL tạo"
  thiet_bi o|--o{ vi_tri_qr : "liên kết hiện tại"
  vi_tri_qr ||--o{ phan_anh : "vị trí phản ánh"
  nguoi_dung o|--o{ phan_anh : "người gửi hoặc KTV được giao"
  thiet_bi o|--o{ phan_anh : "thiết bị lúc gửi"
  phan_anh ||--o{ hinh_anh_phan_anh : "hiện trường hoặc nghiệm thu theo lượt"
```

Trọng tâm của đề tài là định vị sự cố bằng QR, gửi nhanh không bắt đăng nhập, điều phối và theo dõi xử lý. Vai trò người gửi và KTV là hai FK khác nhau tới tài khoản; nhãn gộp trong hình cho dễ đọc, xem từ điển để phân biệt. Snapshot tên/mã/vị trí thiết bị giữ bối cảnh cũ khi đổi QR hoặc đổi hồ sơ thiết bị. Trạng thái/sự kiện/actor được ghi cùng transaction vào nhật ký và đọc qua view lịch sử phản ánh.

## 2. Cấu trúc tòa nhà, cư trú và phương tiện

```mermaid
erDiagram
  khoi_toa_nha ||--o{ tang_toa_nha : "có tầng"
  tang_toa_nha ||--o{ can_ho : "có căn"
  can_ho ||--o{ lich_su_cu_tru : "đợt cư trú"
  cu_dan ||--o{ lich_su_cu_tru : "ở theo thời gian"
  nguoi_dung o|--o| cu_dan : "tài khoản cá nhân tùy chọn"
  lich_su_cu_tru ||--o{ phuong_tien : "đăng ký gắn đợt ở"
  can_ho ||--o{ phuong_tien : "căn chịu phí"
```

Căn hiện tại và số người ở suy ra từ đợt chưa kết thúc; không ghi đè căn cũ trong hồ sơ. Tài khoản thanh toán căn và người phụ trách hiện tại liên kết qua `nguoi_dung`, còn tài khoản cá nhân là liên kết khác; không gộp danh tính chủ trước/chủ mới. Khóa ghép khối/tầng, UNIQUE đợt đang mở và UNIQUE biển đang gửi giữ tính toàn vẹn.

## 3. Phí, hóa đơn VietQR và thông báo

```mermaid
erDiagram
  loai_phi ||--o{ cau_hinh_phi : "giá theo hiệu lực"
  can_ho ||--o{ chi_so_dich_vu : "điện nước theo kỳ"
  can_ho ||--o{ hoa_don : "hóa đơn tháng"
  hoa_don ||--o{ chi_tiet_hoa_don : "các khoản thu"
  cau_hinh_phi ||--o{ chi_tiet_hoa_don : "phiên bản đơn giá"
  chi_so_dich_vu o|--o{ chi_tiet_hoa_don : "nguồn chỉ số nếu có"
  hoa_don o|--o{ thong_bao : "nhắc phí nếu có"
  thong_bao ||--o{ thong_bao_da_doc : "biên nhận đọc"
  nguoi_dung ||--o{ thong_bao_da_doc : "người nhận"
```

Đơn giá, lượng, tiền và nguồn của hóa đơn được chốt thành snapshot. VietQR là thông tin chuyển khoản; BQL xác nhận đối soát, không tự ghi đã thu khi cư dân quét mã. Biên nhận đọc theo cả tài khoản và chủ hộ tiếp nhận tại thời điểm đọc; bàn giao giữ quyền riêng tư và trạng thái đọc đúng người.
