# Quản lý chung cư · Phản ánh QR

React 19 + Vite 7, Express 5 và MySQL 8.4. Phiên bản này triển khai **đăng nhập, phân quyền, phản ánh qua QR, quản lý căn hộ/cư trú, phương tiện và phí/hóa đơn** theo ba tài liệu thiết kế; chưa triển khai thông báo.

## Chạy môi trường phát triển

Cần Node.js 24, npm và Docker có Compose. Chạy tại thư mục gốc repository:

```bash
npm ci
npm run init:local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:backend
```

Terminal thứ hai, cũng tại thư mục gốc:

```bash
npm run dev:frontend
```

`init:local` tạo `.env` với mật khẩu MySQL và khóa ký phiên ngẫu nhiên, không ghi đè file đã tồn tại. MySQL chạy ở cổng 3307, API ở 3000, Vite ở 5173. Nếu đổi cổng API, đặt `API_TARGET` khi chạy Vite. Trên máy cloud có thư mục home chỉ đọc, dùng `npm ci --cache /workspace/.npm-cache`.

`db:seed` chỉ dành cho phát triển: tạo BQL, KTV, cư dân và ba vị trí QR. SĐT tương ứng là `0900000001`, `0900000002`, `0900000003`. **Mật khẩu ngẫu nhiên nằm trong file local `backend/.demo-credentials`**; mở file bằng trình soạn thảo. File này và `.env` được Git bỏ qua. Chạy seed lại không thay mật khẩu hoặc xóa dữ liệu hiện có. Không dùng các tài khoản demo cho triển khai thật.

Docker lưu MySQL trong volume `mysql_data`; ảnh nằm tại `backend/storage/images`. `docker compose stop` dừng database và giữ dữ liệu. Cần sao lưu cả database và thư mục ảnh; không xóa volume để sửa lỗi kết nối.

## Thử luồng chức năng

1. Đăng nhập BQL → **Vị trí & QR** → chọn vị trí hoặc tạo mới → xem, tải hoặc in QR.
2. Mở liên kết QR bằng trình duyệt khác hoặc cửa sổ riêng tư. Nhập sự cố, thông tin liên hệ và tối đa 5 ảnh. Lưu mã tra cứu riêng khi gửi thành công.
3. BQL → **Phản ánh** → mở chi tiết → chọn KTV và mức ưu tiên.
4. Đăng nhập KTV → **Công việc** → bắt đầu → ghi kết quả và nộp ảnh nghiệm thu mới.
5. BQL nghiệm thu đạt để đóng, hoặc trả lại xử lý kèm lý do. Lượt xử lý tiếp theo phải nộp ảnh mới.
6. Khách tra cứu bằng mã riêng và SĐT. Chỉ trả tiến độ và phản hồi công khai; không trả ảnh, nội dung riêng hoặc thông tin liên hệ.

BQL cấp/khóa tài khoản cá nhân tại **Nhân sự & tài khoản**. Tài khoản thanh toán cố định theo căn được quản lý tại **Tài khoản căn hộ** hoặc **Căn hộ → Xem**. Cư dân chỉ xem phản ánh đã gửi bằng chính tài khoản; phản ánh khách không tự gắn vào tài khoản theo SĐT. KTV mất quyền ngay ở request tiếp theo khi bị phân công lại. Đổi mật khẩu hoặc đăng xuất kết thúc tất cả phiên của tài khoản.

## Căn hộ và cư dân

Sau khi cập nhật mã nguồn, chạy `npm run db:migrate` trước khi khởi động backend. Migration `002_residency.sql` thêm ba bảng mới; `003_same_day_residency.sql` cho phép chuyển căn trong ngày. Các migration giữ dữ liệu QR, tài khoản, phản ánh và cư trú hiện có. Không sửa hoặc chạy lại SQL tạo schema cũ bằng tay.

1. BQL → **Căn hộ** → nhập số căn, khối, tầng, diện tích và lựa chọn tính phí dịch vụ. Có tìm theo số căn/khối, lọc tầng, phân trang, sửa và xem cư dân đang ở.
2. BQL → **Cư dân & cư trú** → **Thêm cư dân** → nhập hồ sơ, chọn căn, quan hệ và ngày bắt đầu. Từ trang căn hộ có liên kết lọc cư dân của riêng căn đó.
3. Nếu cần đăng nhập, cấp tài khoản vai trò Cư dân trong **Nhân sự & tài khoản**, rồi tìm và gắn tài khoản vào hồ sơ. Một tài khoản gắn tối đa một hồ sơ; không tự gắn bằng số điện thoại. Hồ sơ không bắt buộc có tài khoản.
4. Mở hồ sơ → **Chuyển căn** để kết thúc đợt cũ và bắt đầu đợt mới trong cùng giao dịch; **Ghi nhận chuyển đi** để kết thúc; **Ghi nhận quay lại** để mở đợt mới. Lịch sử cũ được giữ, không xóa hồ sơ/căn hộ qua giao diện.

Ngày cư trú là ngày lịch tại Việt Nam, không nhận ngày tương lai. Khoảng cư trú là `[từ ngày, đến ngày)`; ngày kết thúc có thể bằng ngày bắt đầu để ghi nhận chuyển căn hoặc chuyển đi ngay trong ngày. Có thể chuyển nhiều lần trong ngày; các đợt cũ vẫn được giữ và đánh dấu “Chuyển trong ngày”, thứ tự theo mã lịch sử. Ngày chuyển thuộc đợt mới, đợt cũ cùng ngày không đại diện thêm một ngày cư trú. Hệ thống chưa phân chia theo giờ. Mỗi cư dân có tối đa một đợt đang mở; hồ sơ cũ không được ghi đè khi hai người sửa đồng thời. Trạng thái căn hộ trống/có người ở được suy ra từ các đợt đang mở. Cờ tính phí dịch vụ độc lập với trạng thái trống và được dùng khi lập hóa đơn.

Danh bạ căn hộ, cư dân và lịch sử chỉ dành cho BQL ở cả giao diện và API. Chuyển đi giữ tài khoản cá nhân; riêng người phụ trách thanh toán chuyển đi thì tài khoản căn hộ bị tạm khóa và kết thúc phiên cũ. Phiên bản này chưa có màn cư dân tự xem hồ sơ, nhập dữ liệu hàng loạt hoặc chỉnh sửa hồi tố các đợt đã kết thúc. Xem [API](docs/api.md).

## Tài khoản thanh toán căn hộ

Bản mới có mục **Tài khoản căn hộ** riêng và đăng nhập bằng SĐT chủ hộ phụ trách: [code 9 file cập nhật](docs/cap-nhat-danh-sach-tai-khoan-can-ho-vscode.md). Không có migration mới nếu đã áp dụng đến 008.

Xem [code đầy đủ 13 file cập nhật trong VS Code](docs/cap-nhat-tai-khoan-can-ho-vscode.md). Chạy `npm run db:migrate` để áp dụng 007 và 008; không sửa 001–006 hoặc xóa dữ liệu.

- Tạo căn hộ tự sinh tài khoản CU_DAN riêng trong cùng transaction: tên đăng nhập cố định theo ID, ví dụ CH000001, mật khẩu ngẫu nhiên chỉ hiện một lần cho BQL. Đổi số căn không đổi tên đăng nhập.
- Thêm/nhập cư/chuyển vào với quan hệ CHU_HO tự gắn tài khoản của căn cho cư dân phụ trách. Tài khoản cá nhân hiện có được giữ riêng; không chiếm số điện thoại hoặc đổi liên kết cá nhân. Thành viên/người thuê không tự nhận trách nhiệm.
- Nếu đã có người phụ trách khác, cần xác nhận bàn giao. Mỗi căn chỉ có một tài khoản/một người phụ trách hiện tại dù có nhiều hồ sơ đồng chủ hộ. Bàn giao/cấp lại mật khẩu đổi mật khẩu, kết thúc mọi phiên cũ, có lịch sử BQL thực hiện. Người phụ trách chuyển đi thì tài khoản căn cũ bị khóa; không mang tài khoản căn cũ sang căn mới.
- Tài khoản căn xem tất cả hóa đơn DA_GUI/DA_THANH_TOAN thuộc căn, kể cả trước ngày người phụ trách mới nhập cư, để đối soát sổ thu. Không tự ghi lại người chịu nghĩa vụ pháp lý của hóa đơn cũ hoặc đánh dấu đã thu. Quyền hóa đơn của tài khoản cá nhân vẫn theo đợt cư trú như trước.
- Với căn đã có trước migration: tạo tài khoản khóa, gắn tự động nếu có đúng một chủ hộ đang ở. BQL vào Căn hộ → Xem để cấp mật khẩu hoặc chọn chủ hộ phụ trách khi có nhiều người. Mật khẩu không lưu dạng rõ và không xem lại bằng GET. Chủ hộ đổi mật khẩu trong Tài khoản sau khi nhận. Đăng nhập bằng SĐT trong hồ sơ người phụ trách hiện tại hoặc mã CH với mật khẩu tài khoản căn. Bàn giao dùng SĐT người mới; sửa SĐT chủ hộ cập nhật ngay tên đăng nhập bằng số, kết thúc phiên cũ và giữ mật khẩu hiện có. Nếu SĐT trùng tài khoản cá nhân, chọn Loại tài khoản = Tài khoản căn hộ; không tự gộp hai tài khoản.

## Phương tiện

Chạy `npm run db:migrate` để áp dụng migration `004_vehicles.sql`, rồi khởi động lại backend. BQL có mục **Phương tiện**, hoặc mở hồ sơ cư dân → **Phương tiện của cư dân**. Xem [code đầy đủ từng file để cập nhật trong VS Code](docs/cap-nhat-phuong-tien-vscode.md).

1. **Đăng ký xe** → tìm/chọn cư dân đang ở → chọn ô tô, xe máy hoặc xe đạp, nhập biển số, hãng, màu và ngày đăng ký. Căn chịu phí lấy từ đợt cư trú trên server. Ô tô/xe máy bắt buộc có biển; xe đạp có thể để trống và vẫn có mã đăng ký riêng.
2. Tìm theo biển số, mã đăng ký, tên/SĐT cư dân hoặc căn; lọc loại xe, đang gửi/đã kết thúc và phân trang. Biển số được viết hoa và bỏ dấu chấm/gạch nối/khoảng trắng, ví dụ `59A-123.45` lưu thành `59A12345`.
3. **Kết thúc** cần ngày và lý do, có thể kết thúc ngay trong ngày đăng ký. Bản cũ giữ nguyên căn chịu phí và lịch sử; không xóa hoặc sửa lại bản đã kết thúc. Muốn đổi thông tin đăng ký, kết thúc bản cũ và tạo bản mới.
4. Khi chuyển căn, biểu mẫu có lựa chọn **Chuyển đăng ký xe đang gửi sang căn mới** (mặc định chọn). Hệ thống đóng bản cũ và tạo bản mới liên kết bản trước trong cùng giao dịch. Bỏ chọn thì chỉ kết thúc các đăng ký cũ. Chuyển đi kết thúc toàn bộ xe đang gửi; quay lại không tự mở lại đăng ký cũ.

Ngày đăng ký nằm trong đợt cư trú hiện tại và không sau hôm nay. Không được ghi lùi ngày chuyển căn/chuyển đi trước ngày đăng ký hoặc kết thúc xe đã có trong đợt. API từ chối danh sách cư dân cũ sau khi người đó chuyển căn; cần tải lại/chọn lại cư dân. Mỗi biển số có tối đa một đăng ký đang gửi; đăng ký lại được sau khi kết thúc, nhưng các khoảng ngày có thời gian gửi không được chồng nhau. Các đăng ký bắt đầu/kết thúc cùng ngày giữ dấu vết và không đại diện thêm ngày gửi xe.

Danh bạ và mọi thao tác xe chỉ dành cho BQL. Module hóa đơn đọc số xe theo ngày chốt; không tự tính chia theo giờ/ngày. Khi khoản xe đã có hóa đơn duyệt/gửi/đã thu, không thêm, kết thúc hoặc chuyển xe hồi tố làm đổi kỳ đã chốt; cần xử lý hóa đơn chưa thanh toán hoặc chọn ngày sau ngày chốt.

## Phí và hóa đơn

Cập nhật giao diện sau bản điện bậc thang: [3 file sửa định dạng số, chọn ngân hàng và QR thanh toán](docs/cap-nhat-giao-dien-thanh-toan-vscode.md). Không cần migration mới.

Chạy `npm run db:migrate` để áp dụng đến `006_electricity_tiers.sql`, giữ nguyên migration cũ và dữ liệu đã có. Bản hóa đơn ban đầu: [code 11 file](docs/cap-nhat-hoa-don-vscode.md). Nếu đã có bản đó, cập nhật [5 file điện bậc thang](docs/cap-nhat-dien-bac-thang-vscode.md).

1. BQL → **Đơn giá phí** → tạo giá theo loại và ngày áp dụng. Điện có thể dùng biểu giá bậc thang và thuế theo ngày hiệu lực hoặc một đơn giá theo cấu hình thu điện. Chỉ chọn BQL thu điện khi căn không trả trực tiếp cho EVN; không tự đưa giá mẫu vào dữ liệu thật. Phiên bản mới bắt đầu sau phiên bản gần nhất, đóng khoảng giá cũ; không được đặt ngày mới làm thay đổi giá đã dùng trong hóa đơn còn hiệu lực.
2. **Chỉ số điện nước** → chọn căn, dịch vụ, kỳ, chỉ số đầu/cuối và ngày chốt. Kỳ đầu cần xác nhận; kỳ tiếp theo phải có kỳ liền trước và chỉ số đầu khớp chỉ số cuối đã ghi. Chỉ sửa kỳ mới nhất, chưa có hóa đơn duyệt/gửi/đã thu.
3. **Phí & hóa đơn** → **Lập hóa đơn** cho từng căn. Kỳ và ngày chốt thuộc cùng tháng, không trong tương lai. Phí quản lý theo cờ tính phí của căn; nước mặc định thu, điện mặc định không thu, xe mặc định thu. BQL chọn rõ các khoản áp dụng. Thiếu giá/chỉ số đúng ngày chốt được liệt kê trong nháp và chặn duyệt. Chỉ số thay đổi thì **Tính lại bản nháp**.
4. **Duyệt hóa đơn** khóa các dòng tiền; **Gửi hóa đơn** cần hạn trả, BIN ngân hàng, tài khoản và tên người nhận. Thông tin nhận tiền được lưu riêng trên hóa đơn. Cư dân thấy hóa đơn đã gửi thuộc căn và đợt cư trú hiện tại, có VietQR tạo ngay trong trình duyệt.
5. BQL đối soát rồi **Xác nhận đã thu** đúng tổng, lưu mã tham chiếu giao dịch. Gửi lặp không ghi thu hai lần. Chưa thu thì có thể hủy kèm lý do và lập bản thay thế; giữ bản cũ, không hủy hóa đơn đã thu.

Tiền tính bằng số thập phân chính xác, làm tròn từng dòng đến đồng rồi cộng tổng. Ví dụ 70 m² × 12.000 + 2 xe máy × 100.000 + 12 m³ × 15.000 = 1.220.000 đồng. Giá và số lượng trên hóa đơn là bản lưu tại lúc lập. Diện tích đọc từ cấu hình căn khi lập; BQL cần kiểm tra khi lập hồi tố, chưa có lịch sử diện tích ngoài các hóa đơn đã lưu. Chuyển cư trú thu hồi quyền xem hóa đơn căn cũ; không tự gắn hóa đơn theo số điện thoại. Quá hạn được tính lúc đọc, không lưu thành một trạng thái riêng.

Điện bậc thang chia lượng kWh theo từng ngưỡng cộng dồn, làm tròn tiền từng bậc đến đồng rồi tính thuế trên tổng tiền điện trước thuế, không tính thuế điện lên phí khác. Với mẫu người dùng cung cấp, 300 kWh = 739.500 đồng + 8% = 798.660 đồng. Mẫu không được seed tự động, chưa xác minh là biểu giá còn hiệu lực. Phiên bản giá chọn tại ngày chốt cho toàn kỳ; chưa phân bổ khi đổi giá giữa kỳ, nhiều hộ/định mức, hoặc chia theo ngày đọc công tơ.

Chưa có lập hàng loạt, thanh toán một phần/tiền thừa, đồng bộ ngân hàng, xuất PDF/Excel hoặc tác vụ nhắc nợ. VietQR đã kiểm tra cấu trúc/CRC và hiển thị qua giao diện, chưa thử giao dịch ngân hàng thật. Quét mã không thay trạng thái thanh toán; BQL chịu trách nhiệm nhập đúng ngân hàng và đối soát thực tế.

## Ảnh hiện trường và QR

Form QR lưu nháp nội dung trong sessionStorage của tab hiện tại, tách theo vị trí QR và tài khoản, hết hạn sau 2 giờ và xóa khi gửi thành công. Nếu điện thoại tải lại trang khi mở thư viện ảnh, nội dung được khôi phục; ảnh cần chọn lại vì quyền chọn tệp không được giữ qua lần tải trang. Có nút chọn thư viện/chụp ảnh riêng, thông báo số ảnh đã chọn và cảnh báo khi trình duyệt chặn lưu nháp. Ảnh chỉ gửi lên máy chủ khi bấm Gửi phản ánh.

Nút Chụp ảnh mở camera ngay trong trang qua HTTPS. Chờ hình camera hiện lên rồi bấm Chụp ảnh này: ảnh JPEG được gắn vào form, có ảnh xem trước và camera được tắt. Có thể chụp thêm tới tổng 5 ảnh; ảnh chỉ được upload khi gửi phản ánh. Camera cũng tắt khi đóng, rời trang hoặc chuyển tab. Cần trình duyệt hỗ trợ getUserMedia, ví dụ Chrome hiện hành trên Android.

Ảnh thư viện JPEG/PNG/WebP tối đa 25 MB được xử lý lần lượt, thu nhỏ và đổi thành JPEG tối đa 1600 px cạnh dài, dưới 5 MB trước khi xem trước/gửi. Kiểm tra định dạng theo nội dung tệp, kể cả khi thư viện không cung cấp MIME. HEIC/HEIF chưa được hỗ trợ. Chờ ảnh xem trước hiện lên rồi gửi; form chặn gửi trong lúc xử lý ảnh. Cả ảnh chụp và ảnh thư viện được lưu trong cùng danh sách và gắn vào FormData qua sự kiện `formdata`, không cần gán lại `input.files` bằng DataTransfer. Việc hủy chọn ảnh giữ danh sách cũ; chọn thư viện thành công thay danh sách cũ.

Mã QR chứa URL theo tên miền đang mở trang quản trị. Khi thử camera điện thoại, dùng một tên miền HTTPS truy cập được từ điện thoại; địa chỉ loopback của máy phát triển không dùng được trên điện thoại. Camera trong web có hướng dẫn khi bị từ chối quyền và hỗ trợ dán URL cùng hệ thống; không tự mở URL ngoài hệ thống.

Để dùng nút **Mở camera** trên điện thoại cùng Wi-Fi, xem [hướng dẫn HTTPS cho Windows/Android](docs/https-local.md). Sau khi tạo và tin cậy chứng chỉ, chạy `npm run dev:frontend:https`. HTTP qua IP mạng nội bộ chỉ dùng được để mở form; trình duyệt chặn camera trong trang.

## Kiểm tra

```bash
npm run build
npm test
npm run test:e2e
```

- `npm test`: tạo/migrate database riêng `chung_cu_test`, chạy kiểm thử HTTP với MySQL thật. Gồm xác thực, khóa phiên, quyền bản ghi/ảnh, QR thu hồi, gửi lặp đồng thời, chuyển trạng thái, nghiệm thu mới, gộp trùng, giới hạn gửi và rollback khi lịch sử lỗi.
- `npm run test:e2e`: chạy API/Vite riêng ở 3101/5174, mở Chromium và đi hết luồng qua giao diện ở 1440 px và 375 px. Browser Linux được đóng gói trong dependency `@sparticuz/chromium`, không cần tải thêm từ CDN. Kiểm thử không thay dữ liệu database phát triển. Hai lệnh test nên chạy lần lượt.
- `/api/health` kiểm tra tiến trình; `/api/ready` kiểm tra database và migration. Không coi một cổng mở là đã sẵn sàng.

Chưa đo tải lớn, thử camera trên thiết bị thật hoặc kiểm thử sao lưu/phục hồi. Trước triển khai thật: phục vụ frontend và `/api` cùng origin qua HTTPS, đặt `COOKIE_SECURE=true`, dùng khóa/mật khẩu riêng, cấu hình backup và giới hạn request tại reverse proxy. Backend hiện bind loopback; Vite là máy chủ phát triển.

Xem [kiến trúc và quy tắc](docs/architecture.md), [API](docs/api.md), [database](database/README.md). Những quy tắc hóa đơn/cư trú đang là đề xuất trong tài liệu được để lại cho giai đoạn tiếp theo, chưa được coi là nghiệp vụ đã chốt.
