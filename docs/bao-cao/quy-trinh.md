# Bốn Activity, bốn Sequence và trạng thái nghiệp vụ

Các sơ đồ mô tả đường đi chính của mã nguồn sau migration 018. Nhánh lỗi được rút gọn; chi tiết quyền/ngoại lệ xem [năm đặc tả](use-case.md). Activity dùng Mermaid flowchart; Sequence dùng đúng participant frontend, API, service, DB/lưu ảnh. Không có dịch vụ ngân hàng hay hàng đợi nền tự động trong triển khai hiện tại.

## Activity 1 — Tạo và in QR

```mermaid
flowchart TD
  A(["Bắt đầu: BQL đăng nhập"]) --> B["Nhập tên, loại và mô tả vị trí"]
  B --> C{"Liên kết thiết bị?"}
  C -- Có --> D["Chọn hồ sơ thiết bị"]
  C -- Không --> E["Gửi yêu cầu tạo vị trí"]
  D --> E
  E --> F{"Quyền và dữ liệu hợp lệ?"}
  F -- Không --> G["Hiện lỗi, sửa hoặc hủy"]
  G --> B
  F -- Có --> H["Transaction: token UUID, vị trí, lịch sử liên kết"]
  H --> I["Frontend tạo URL theo origin và ảnh QR"]
  I --> J["Tải PNG hoặc in bằng trình duyệt"]
  J --> K["Quét thử trên điện thoại tại vị trí"]
  K --> L{"Mở đúng form?"}
  L -- Không --> M["Kiểm tra URL, HTTPS, mạng và trạng thái QR"]
  M --> I
  L -- Có --> N(["Hoàn tất"])
```

## Activity 2 — Quét QR và gửi ảnh

```mermaid
flowchart TD
  A(["Mở link QR / quét bằng camera"]) --> B{"QR còn hoạt động?"}
  B -- Không --> C(["Báo mã không hợp lệ"])
  B -- Có --> D["Hiện vị trí, thiết bị và phiên bản form"]
  D --> E["Nhập nội dung, chọn/chụp ảnh tùy chọn"]
  E --> F{"Ảnh xử lý xong, form hợp lệ?"}
  F -- Không --> E
  F -- Có --> G["Gửi multipart với khóa yêu cầu"]
  G --> H{"Có biên nhận cùng nội dung?"}
  H -- Có --> O["Trả lại mã tra cứu cũ"]
  H -- Không --> I{"QR/phiên bản/rate limit hợp lệ?"}
  I -- Không --> J["Báo lỗi, giữ nháp; chọn lại ảnh nếu trang tải lại"]
  J --> D
  I -- Có --> K{"Có phản ánh tương tự chưa xác nhận?"}
  K -- Có --> L["Hỏi xác nhận gửi riêng"]
  L -- Xác nhận --> G
  L -- Dừng --> P(["Dừng, chưa lưu phản ánh"])
  K -- Không --> M["Lưu MOI, snapshot thiết bị, ảnh và lịch sử cùng transaction"]
  M --> O
  O --> N(["Hiện mã tra cứu và xóa nháp"])
```

Ảnh được xử lý/lưu file trước khi mở khóa DB; nếu transaction không commit hoặc replay thì dọn file mới. MySQL không có transaction chung với filesystem; không mô tả ảnh là BLOB trong bảng phản ánh. Chứng từ quỹ là phân hệ khác và được lưu binary trong DB.

## Activity 3 — Phân công, hoàn thành, nghiệm thu

```mermaid
flowchart TD
  A(["Phản ánh MOI"]) --> B{"BQL tiếp nhận thế nào?"}
  B -- Từ chối / gộp hợp lệ --> C(["TU_CHOI / TRUNG và lý do"])
  B -- Phân công --> D["DA_PHAN_CONG: gán kỹ thuật và ưu tiên"]
  D --> E["Kỹ thuật được giao bắt đầu: DANG_XU_LY"]
  E --> F["Ghi kết quả và ít nhất một ảnh mới"]
  F --> G{"Đủ bằng chứng và đúng phiên bản?"}
  G -- Không --> F
  G -- Có --> H["DA_XU_LY: chờ BQL nghiệm thu"]
  H --> I{"BQL nghiệm thu đạt?"}
  I -- Không --> J["Nhập lý do, tăng lượt xử lý, trả DANG_XU_LY"]
  J --> F
  I -- Có --> K(["DA_DONG, ghi ngày đóng"])
```

Mỗi mũi tên cập nhật gồm kiểm tra quyền/phạm vi, phiên bản và khóa hàng. Phân công lại khi đang làm không biến thành nghiệm thu và không giữ quyền kỹ thuật cũ.

## Activity 4 — Lập, duyệt và gửi hóa đơn

```mermaid
flowchart TD
  A(["BQL chọn căn/kỳ/ngày chốt"]) --> B["Đọc giá hiệu lực, diện tích, xe, chỉ số"]
  B --> C{"Nguồn hợp lệ và chưa có hóa đơn cùng kỳ?"}
  C -- Không --> D["Sửa dữ liệu nguồn hoặc thu hẹp lô"]
  D --> A
  C -- Có --> E["Lưu NHAP và snapshot các khoản"]
  E --> F["BQL kiểm tra và yêu cầu duyệt"]
  F --> G{"Snapshot còn khớp nguồn?"}
  G -- Không --> H["Tính lại bản NHAP"]
  H --> F
  G -- Có --> I["DA_DUYET, cố định khoản tiền"]
  I --> J["Chọn ngân hàng, nhập tài khoản/tên nhận/hạn trả"]
  J --> K{"Thông tin thanh toán hợp lệ?"}
  K -- Không --> J
  K -- Có --> L["DA_GUI, cư dân được phép xem và quét VietQR"]
  L --> M["BQL đối soát tiền thực tế bên ngoài"]
  M --> N{"Đã nhận đủ đúng tổng?"}
  N -- Chưa --> L
  N -- Có --> O(["DA_THANH_TOAN, ghi lịch sử và báo cáo thu"])
```

Lập/duyệt/gửi hàng loạt có xem trước, xác nhận và kiểm tra lại trong một transaction; một dòng lỗi rollback lô. Lược đồ trên rút gọn đường đi một hóa đơn. Hủy được trước đã thu; lập thay thế tạo bản mới, không sửa lịch sử cũ.

## Sequence 1 — Tạo và in QR

```mermaid
sequenceDiagram
  actor BQL as Ban quản lý
  participant FE as React - Vị trí QR
  participant API as Express + middleware
  participant S as qr.service
  participant DB as MySQL
  participant IMG as qrcode + trình duyệt
  BQL->>FE: Nhập vị trí, chọn thiết bị tùy chọn
  FE->>API: POST /api/vi_tri_qr + cookie + X-App-Request
  API->>API: Xác thực BQL, kiểm tra request
  API->>S: create(body, user)
  S->>DB: BEGIN, kiểm tra/khóa thiết bị nếu chọn
  alt Thiết bị/trường dữ liệu không hợp lệ
    S->>DB: ROLLBACK
    S-->>FE: Lỗi, không tạo vị trí
  else Hợp lệ
    S->>DB: INSERT vị trí + token, lịch sử liên kết
    S->>DB: COMMIT
    S-->>API: Vị trí vừa tạo
    API-->>FE: 201 data
    FE->>IMG: Tạo QR chứa origin + /r/token
    BQL->>IMG: Tải PNG / In
  end
```

## Sequence 2 — Quét và gửi phản ánh

```mermaid
sequenceDiagram
  actor N as Người gửi
  participant FE as React - Form QR
  participant API as Express + multer
  participant S as incidents.service
  participant FS as Sharp + kho ảnh
  participant DB as MySQL
  N->>FE: Mở /r/token
  FE->>API: GET /api/cong_khai/vi_tri_qr/token
  API->>DB: Đọc QR đang hoạt động và whitelist thiết bị
  API-->>FE: Vị trí, phiên bản, tên/mã tài sản công khai
  N->>FE: Điền form, chọn/chụp ảnh, gửi
  FE->>FE: Chờ xử lý ảnh, lưu nháp nội dung
  FE->>API: POST multipart + khóa yêu cầu + phien_ban_qr
  API->>S: submit(body, files, optional user, ip)
  S->>FS: Kiểm tra và chuẩn bị ảnh
  S->>DB: BEGIN, khóa yeu_cau_gui
  alt Cùng khóa đã thành công, cùng nội dung
    DB-->>S: Mã tra cứu đã có
    S->>DB: COMMIT
    S->>FS: Dọn ảnh mới của lần replay
    S-->>FE: Biên nhận cũ, không tạo trùng
  else Yêu cầu mới
    S->>DB: Khóa QR/thiết bị, kiểm tra phiên bản và giới hạn
    alt QR thay đổi / tương tự chưa xác nhận / lỗi
      S->>DB: ROLLBACK
      S->>FS: Dọn ảnh chưa giữ lại
      S-->>FE: Lỗi hoặc yêu cầu xác nhận, giữ nháp
    else Hợp lệ
      S->>DB: INSERT MOI + snapshot + metadata ảnh + lịch sử
      S->>DB: Lưu biên nhận, cập nhật giới hạn, COMMIT
      S-->>FE: Mã tra cứu bí mật
      FE-->>N: Hiện kết quả, xóa nháp
    end
  end
```

Khác nội dung dùng lại cùng khóa là 409, không phải replay. Sơ đồ bỏ bớt middleware rate-limit cho dễ đọc. Nội dung nháp ở sessionStorage không chứa dữ liệu file ảnh.

## Sequence 3 — Phân công và hoàn thành

```mermaid
sequenceDiagram
  actor B as BQL
  actor K as Kỹ thuật viên
  participant FE as React
  participant API as Express + quyền
  participant S as incidents.service
  participant DB as MySQL
  B->>FE: Chọn kỹ thuật + phiên bản
  FE->>API: PATCH /api/phan_anh/id/phan_cong
  API->>S: assign(id, body, user)
  S->>DB: Khóa phản ánh, kiểm tra version, cập nhật + lịch sử
  DB-->>FE: COMMIT và chi tiết mới
  K->>FE: Mở việc đang được giao và bắt đầu
  FE->>API: PATCH trang_thai = DANG_XU_LY
  API->>S: transition - kiểm tra actor được giao
  S->>DB: Transaction trạng thái + lịch sử + tăng phiên bản
  K->>FE: Ghi kết quả, thêm ảnh mới, hoàn thành
  FE->>API: PATCH multipart trang_thai = DA_XU_LY
  API->>S: transition - kiểm tra ghi chú/ảnh mới
  S->>DB: Transaction trạng thái + ảnh theo lượt + lịch sử
  B->>FE: Kiểm tra kết quả
  alt Đạt
    FE->>API: PATCH trang_thai = DA_DONG
    API->>S: transition - quyền BQL
    S->>DB: Ghi ngày đóng, lịch sử, COMMIT
  else Cần làm lại
    FE->>API: PATCH DANG_XU_LY + lý do
    API->>S: transition - quyền BQL
    S->>DB: Tăng lượt, trả xử lý và lưu lịch sử
    FE-->>K: Yêu cầu kết quả và ảnh mới cho lượt sau
  end
```

Các dòng DB trả về FE là kết quả qua service/API, không phải trình duyệt kết nối MySQL trực tiếp. Khi version sai, rollback và 409; khi đã đổi người, kỹ thuật cũ không được đọc/sửa.

## Sequence 4 — Tra cứu hóa đơn và VietQR

```mermaid
sequenceDiagram
  actor CD as Cư dân / tài khoản căn
  actor BQL as Ban quản lý
  participant FE as React - Hóa đơn
  participant API as Express + xác thực
  participant S as billing.service
  participant DB as MySQL
  participant QR as Sinh VietQR tại ứng dụng
  CD->>FE: Đăng nhập, mở hóa đơn
  FE->>API: GET /api/cua_toi/hoa_don/id + cookie
  API->>S: detail(id, user)
  S->>DB: Đọc DA_GUI/DA_THANH_TOAN và kiểm tra quyền căn/cư trú
  alt Không được phép
    S-->>FE: Lỗi, không lộ hóa đơn căn khác
  else Có quyền
    S->>QR: Nếu DA_GUI: tạo payload từ BIN, STK, tiền, nội dung
    S-->>FE: Chi tiết hóa đơn và thông tin QR
    FE->>FE: Hiển thị QR nếu chưa thanh toán, đã thu thì không hiện QR
    FE-->>CD: Xem/quét bằng ứng dụng ngân hàng riêng
  end
  Note over CD,BQL: Chuyển khoản/đối soát bên ngoài, hệ thống không gọi ngân hàng
  BQL->>FE: Xác nhận đã nhận đủ + mã tham chiếu
  FE->>API: POST /api/hoa_don/id/xac_nhan_thanh_toan
  API->>S: action - kiểm tra quyền và phiên bản
  S->>DB: Khóa hóa đơn, kiểm tra đúng tổng, ghi đã thu + lịch sử
  DB-->>S: COMMIT
  S-->>FE: DA_THANH_TOAN
```

## State Diagram — Phản ánh

```mermaid
stateDiagram-v2
  [*] --> MOI: Gửi thành công
  MOI --> DA_PHAN_CONG: BQL phân công
  MOI --> TU_CHOI: BQL có lý do
  MOI --> TRUNG: BQL chọn bản gốc hợp lệ
  DA_PHAN_CONG --> DA_PHAN_CONG: BQL phân công lại
  DA_PHAN_CONG --> DANG_XU_LY: KTV bắt đầu
  DANG_XU_LY --> DANG_XU_LY: BQL đổi người được giao
  DANG_XU_LY --> DA_XU_LY: KTV ghi chú và ảnh mới
  DA_XU_LY --> DANG_XU_LY: BQL trả lại, tăng lượt
  DA_XU_LY --> DA_DONG: BQL nghiệm thu
  DA_DONG --> [*]
  TU_CHOI --> [*]
  TRUNG --> [*]
```

## State Diagram — Hóa đơn

```mermaid
stateDiagram-v2
  [*] --> NHAP: Lập hóa đơn
  NHAP --> NHAP: Tính lại
  NHAP --> DA_DUYET: BQL duyệt
  DA_DUYET --> DA_GUI: BQL gửi thông tin thanh toán
  DA_GUI --> DA_THANH_TOAN: BQL đối soát đúng tổng
  NHAP --> HUY: Có lý do
  DA_DUYET --> HUY: Có lý do
  DA_GUI --> HUY: Chưa thu, có lý do
  HUY --> [*]
  DA_THANH_TOAN --> [*]
```

Hóa đơn thay thế là NHAP có ID mới và tham chiếu bản hủy; không có chuyển trạng thái HUY → NHAP trên cùng bản ghi.
