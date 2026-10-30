# Quản lý chung cư · Phản ánh QR

> **Rà soát sâu toàn dự án (30/10/2026):** [4 phát hiện còn mở và bằng chứng tái hiện](docs/ra-soat-sau-2026-10-30.md). Ưu tiên tách quyền phản ánh của chủ cũ khi bàn giao tài khoản căn; quyền hóa đơn vẫn theo căn.

> **Bản sửa đăng nhập, QR và địa chỉ (30/10/2026):** [code đủ 9 file và cách cập nhật VS Code](docs/sua-dang-nhap-qr-va-dia-chi-vscode.md) · [báo cáo rà soát theo agent-skills](docs/ra-soat-du-an-2026-10-30.md). Dùng `npm run start:backend:acceptance` để chọn đúng bộ tài khoản `.md`; dùng `npm run diagnose` để đối chiếu cấu hình.

> **Căn chỉnh ô tổng quan và lỗi EBUSY:** [hướng dẫn + code đủ 2 file](docs/cap-nhat-can-chinh-tong-quan-vscode.md), có ảnh máy tính/điện thoại và cách cài dependency khi Windows khóa thư mục.

> **Xuất PDF và cài Vite:** [hướng dẫn + code đủ 6 file](docs/cap-nhat-xuat-pdf-va-vite-vscode.md). Nhập bằng Excel; xuất danh sách/báo cáo bằng Excel hoặc PDF. [Bản sửa Excel và menu](docs/cap-nhat-excel-va-menu-vscode.md) · [Excel đã điền để test](samples/nhap-du-lieu/README.md).

> **Giao diện mới nhất (editorial):** ảnh toàn chiều ngang, chữ mạnh, nút đen và menu quản trị sáng. Xem [ảnh các màn hình](docs/giao-dien-editorial/README.md) và [code đầy đủ 6 file để copy vào VS Code](docs/cap-nhat-giao-dien-editorial-vscode.md). Nhánh `codex/editorial-business-ui` dành cho bản đầy đủ nghiệp vụ.

**Bản giao diện trước (navy, lưu tham khảo):** [xem ảnh cổng cư dân, đăng nhập, tổng quan và bảng căn hộ](docs/giao-dien-van-hanh-moi/README.md), [code đầy đủ 5 file để copy trong VS Code](docs/cap-nhat-giao-dien-moi-ban-nghiep-vu-vscode.md). Bản này dùng xanh navy/xanh dương, sidebar tối màu, ảnh thật và danh mục dịch vụ mới; giữ router, API và các nghiệp vụ đang có.

React 19 + Vite 7, Express 5 và MySQL 8.4. Phiên bản này triển khai **đăng nhập, phân quyền, phản ánh qua QR, quản lý căn hộ/cư trú, phương tiện, phí/hóa đơn, thông báo/nhắc phí trên web, báo cáo công nợ/thu phí, bảo trì thiết bị, đặt lịch tiện ích, thu chi/quỹ và nhập Excel, xuất Excel/PDF** theo ba tài liệu thiết kế.

Giao diện được thống nhất cho BQL, cư dân và kỹ thuật viên: menu chia nhóm có biểu tượng, menu mở rộng trên điện thoại, bảng/biểu mẫu/thống kê cùng phong cách, cổng cư dân và đăng nhập mới. Xem [ảnh minh họa và code đầy đủ từng file để cập nhật VS Code](docs/cap-nhat-giao-dien-chuyen-nghiep-vscode.md).

Excel danh sách/báo cáo mở trực tiếp tại **Chi tiết**, có liên kết từ Tổng hợp; cổng cư dân và đăng nhập có **ảnh chụp tự chuyển**, nút dừng/chọn ảnh và hỗ trợ giảm chuyển động. Xem [code đầy đủ 7 file, ba ảnh cục bộ và Excel mẫu 19 căn](docs/cap-nhat-excel-chi-tiet-anh-that-vscode.md).

## Chạy môi trường phát triển

Cách chạy đầy đủ trên Windows/VS Code, dùng MySQL cài riêng cổng 3306, dữ liệu nghiệm thu và HTTPS trên điện thoại: **[Hướng dẫn chạy đồ án](docs/huong-dan-chay-do-an-windows.md)**. Máy đã cài xong bắt đầu từ mục 1–4; không cần tạo lại dữ liệu mỗi lần mở đồ án.

Nếu thiết lập lần đầu bằng **MySQL Docker của dự án**, cần Node.js 24, npm và Docker có Compose. Chạy tại thư mục gốc repository:

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

## Tổng quan vận hành

Đã nối **thiết bị → QR → phản ánh**: chọn hồ sơ thiết bị khi tạo/liên kết QR và xem lịch sử thay đổi; biểu mẫu quét nhận mã/tên thiết bị, phản ánh lưu thông tin thiết bị lúc gửi. Đổi/bỏ liên kết không sửa các phản ánh cũ. Hồ sơ thiết bị mở được QR hiện tại và phản ánh theo thiết bị lúc gửi. Giữ token QR cũ, không tự gán thiết bị cho phản ánh lịch sử. Cần migration **018_equipment_qr.sql**; [code đầy đủ 11 file tính năng và 2 file kiểm thử](docs/cap-nhat-thiet-bi-qr-vscode.md).

BQL có thêm **Khối & tầng** để khai báo khối/tầng chưa có căn, đặt tên/mô tả, đổi mã/số đồng thời cập nhật các căn và xóa mục chưa sử dụng. Form căn hộ chọn từ danh mục, phát hiện khối/tầng đã thay đổi. Chạy `npm run db:migrate` để áp dụng **017_building_structure.sql**, giữ nguyên 001–016. Không thêm thư viện. [Code đầy đủ 12 file chạy tính năng và 7 file kiểm thử](docs/cap-nhat-khoi-tang-vscode.md).

Đối chiếu đề cương `1250080221_To_Hoang_Tuan.docx`: [nghiệp vụ đã có, giới hạn và phần báo cáo/kiểm thử còn thiếu](docs/doi-chieu-de-cuong-1250080221.md). **Sơ đồ tòa nhà** cho BQL hiển thị khối → tầng → căn hộ, số căn/cư dân, lọc trống/có người ở và mở quản lý căn/cư dân. Từ migration 017, sơ đồ có cả khối/tầng được khai báo khi chưa có căn. [Hướng dẫn cũ của bản sơ đồ ban đầu](docs/cap-nhat-so-do-toa-nha-vscode.md) chỉ dành cho phiên bản trước 017; dùng hướng dẫn Khối & tầng để cập nhật bản mới.

BQL đăng nhập vào trang Tổng quan để xem công nợ, khoản đã thu từ đầu tháng đến hôm nay, phản ánh đang mở, phiếu/lịch bảo trì và đặt lịch tiện ích. Xem [code đầy đủ 8 file cập nhật trong VS Code](docs/cap-nhat-tong-quan-van-hanh-vscode.md). Không có migration hoặc thư viện mới.

Trang có thêm **Biểu đồ vận hành** với bộ chọn ngày/tuần/tháng/quý/năm và ngày trong kỳ: thu phí/công nợ theo hạn, tiếp nhận/đóng phản ánh, lập/nghiệm thu bảo trì, lượt đặt tiện ích theo trạng thái. Ngày chia 24 giờ, tuần từ thứ Hai đến Chủ nhật, tháng chia từng ngày, quý/năm chia từng tháng. Chạm cột hoặc mở bảng để xem số chính xác; cập nhật không mất bộ lọc. Xem [code đầy đủ 5 file thêm biểu đồ](docs/cap-nhat-bieu-do-tong-quan-vscode.md). Bộ lọc chỉ áp dụng biểu đồ, không thay cách tính các thẻ số liệu hiện tại.

Biểu đồ mặc định thu gọn, có **Hiện/Ẩn biểu đồ** và chọn từng nhóm. Tài chính mặc định đường, phản ánh cột, bảo trì miền, tiện ích vòng tròn; có bộ chọn kiểu riêng từng nhóm, tròn/vòng chỉ dùng cho tỷ trọng trạng thái tiện ích. Nhớ tùy chọn theo tài khoản trong trình duyệt; khi thu gọn hoặc bỏ chọn mọi nhóm không gọi API thống kê. Xem [code đầy đủ 2 file chọn kiểu và hiện/ẩn](docs/cap-nhat-kieu-va-an-hien-bieu-do-vscode.md).

Một API `/api/tong_quan` đọc tất cả nhóm trong cùng snapshot chỉ đọc; số tiền giữ dạng chuỗi nguyên đồng. Nút Cập nhật số liệu tải lại toàn bộ, có thời điểm Việt Nam. Mỗi nhóm tối đa 5 việc cần xem, số đếm tính toàn bộ dữ liệu; các thẻ/chi tiết có liên kết đến màn xử lý sẵn có. Phản ánh thêm bộ lọc Đang mở (chưa đóng), vẫn giữ phạm vi quyền BQL/KTV/cư dân như cũ.

Công nợ chỉ gồm hóa đơn DA_GUI chưa thu ở mọi kỳ; quá hạn là hạn trước hôm nay. Thu phí theo ngày xác nhận, không theo kỳ hóa đơn, không gồm phiếu thu quỹ thủ công. Thiết bị ngừng sử dụng, phiếu bảo trì hủy/hoàn thành, lịch tiện ích hủy/từ chối không nằm trong hàng đợi đang theo dõi. Số chờ duyệt tiện ích vẫn gồm lịch đã qua giờ, còn danh sách sắp tới chỉ giữ lịch đang diễn ra hoặc chưa bắt đầu. Trang tổng quan không tự phát thông báo, duyệt hoặc ghi nhận thanh toán.

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

Danh bạ căn hộ, cư dân và lịch sử chỉ dành cho BQL ở cả giao diện và API. Chuyển đi giữ tài khoản cá nhân; riêng người phụ trách thanh toán chuyển đi thì tài khoản căn hộ bị tạm khóa và kết thúc phiên cũ. BQL có thể nhập thêm mới theo mẫu Excel/PDF tại Nhập / xuất dữ liệu. Phiên bản này chưa có màn cư dân tự xem hồ sơ hoặc chỉnh sửa hồi tố các đợt đã kết thúc. Xem [API](docs/api.md).

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

Trong **Phí & hóa đơn → Lập hàng loạt**, BQL chọn tối đa 50 căn, kỳ và ngày chốt, xem trước từng khoản thu và lỗi trước khi xác nhận. Có chọn các căn trên trang, giữ lựa chọn khi tìm/chuyển trang và bỏ các căn lỗi để xem trước lại. Chỉ tạo bản nháp khi toàn bộ đợt hợp lệ và dữ liệu nguồn còn khớp; không tự duyệt/gửi/thu tiền. Retry sau lỗi mạng giữ UUID để nhận lại đúng kết quả cũ. Cần chạy migration **015_bill_batches.sql**; xem [code đầy đủ 8 file cho VS Code](docs/cap-nhat-hoa-don-hang-loat-vscode.md).

Trong **Duyệt/gửi hàng loạt**, chọn 1–50 hóa đơn theo kỳ/từ khóa, xem trước và xác nhận từng thao tác riêng: duyệt NHAP → DA_DUYET; gửi DA_DUYET → DA_GUI. Khi gửi, chọn ngân hàng và hạn trả/tài khoản nhận chung; hóa đơn hiển thị trên web cư dân kèm VietQR. Kiểm tra phiên bản/nguồn trước duyệt, giữ snapshot đã duyệt khi gửi; đợt có lỗi không xử lý một phần. Retry lấy lại đúng kết quả cũ, không duyệt/gửi lặp. Cần migration **016_bill_actions.sql**; xem [code đầy đủ 9 file cập nhật VS Code](docs/cap-nhat-duyet-gui-hang-loat-vscode.md).

Cập nhật giao diện sau bản điện bậc thang: [3 file sửa định dạng số, chọn ngân hàng và QR thanh toán](docs/cap-nhat-giao-dien-thanh-toan-vscode.md). Không cần migration mới.

Chạy `npm run db:migrate` để áp dụng đến `006_electricity_tiers.sql`, giữ nguyên migration cũ và dữ liệu đã có. Bản hóa đơn ban đầu: [code 11 file](docs/cap-nhat-hoa-don-vscode.md). Nếu đã có bản đó, cập nhật [5 file điện bậc thang](docs/cap-nhat-dien-bac-thang-vscode.md).

1. BQL → **Đơn giá phí** → tạo giá theo loại và ngày áp dụng. Điện có thể dùng biểu giá bậc thang và thuế theo ngày hiệu lực hoặc một đơn giá theo cấu hình thu điện. Chỉ chọn BQL thu điện khi căn không trả trực tiếp cho EVN; không tự đưa giá mẫu vào dữ liệu thật. Phiên bản mới bắt đầu sau phiên bản gần nhất, đóng khoảng giá cũ; không được đặt ngày mới làm thay đổi giá đã dùng trong hóa đơn còn hiệu lực.
2. **Chỉ số điện nước** → chọn căn, dịch vụ, kỳ, chỉ số đầu/cuối và ngày chốt. Kỳ đầu cần xác nhận; kỳ tiếp theo phải có kỳ liền trước và chỉ số đầu khớp chỉ số cuối đã ghi. Chỉ sửa kỳ mới nhất, chưa có hóa đơn duyệt/gửi/đã thu.
3. **Phí & hóa đơn** → **Lập hóa đơn** cho từng căn. Kỳ và ngày chốt thuộc cùng tháng, không trong tương lai. Phí quản lý theo cờ tính phí của căn; nước mặc định thu, điện mặc định không thu, xe mặc định thu. BQL chọn rõ các khoản áp dụng. Thiếu giá/chỉ số đúng ngày chốt được liệt kê trong nháp và chặn duyệt. Chỉ số thay đổi thì **Tính lại bản nháp**.
4. **Duyệt hóa đơn** khóa các dòng tiền; **Gửi hóa đơn** cần hạn trả, BIN ngân hàng, tài khoản và tên người nhận. Thông tin nhận tiền được lưu riêng trên hóa đơn. Cư dân thấy hóa đơn đã gửi thuộc căn và đợt cư trú hiện tại, có VietQR tạo ngay trong trình duyệt.
5. BQL đối soát rồi **Xác nhận đã thu** đúng tổng, lưu mã tham chiếu giao dịch. Gửi lặp không ghi thu hai lần. Chưa thu thì có thể hủy kèm lý do và lập bản thay thế; giữ bản cũ, không hủy hóa đơn đã thu.

Tiền tính bằng số thập phân chính xác, làm tròn từng dòng đến đồng rồi cộng tổng. Ví dụ 70 m² × 12.000 + 2 xe máy × 100.000 + 12 m³ × 15.000 = 1.220.000 đồng. Giá và số lượng trên hóa đơn là bản lưu tại lúc lập. Diện tích đọc từ cấu hình căn khi lập; BQL cần kiểm tra khi lập hồi tố, chưa có lịch sử diện tích ngoài các hóa đơn đã lưu. Chuyển cư trú thu hồi quyền xem hóa đơn căn cũ; không tự gắn hóa đơn theo số điện thoại. Quá hạn được tính lúc đọc, không lưu thành một trạng thái riêng.

Điện bậc thang chia lượng kWh theo từng ngưỡng cộng dồn, làm tròn tiền từng bậc đến đồng rồi tính thuế trên tổng tiền điện trước thuế, không tính thuế điện lên phí khác. Với mẫu người dùng cung cấp, 300 kWh = 739.500 đồng + 8% = 798.660 đồng. Mẫu không được seed tự động, chưa xác minh là biểu giá còn hiệu lực. Phiên bản giá chọn tại ngày chốt cho toàn kỳ; chưa phân bổ khi đổi giá giữa kỳ, nhiều hộ/định mức, hoặc chia theo ngày đọc công tơ.

Chưa có lập hàng loạt, thanh toán một phần/tiền thừa, đồng bộ ngân hàng, xuất PDF/Excel hoặc tác vụ nhắc nợ tự động. VietQR đã kiểm tra cấu trúc/CRC và hiển thị qua giao diện, chưa thử giao dịch ngân hàng thật. Quét mã không thay trạng thái thanh toán; BQL chịu trách nhiệm nhập đúng ngân hàng và đối soát thực tế.

## Thông báo và nhắc phí

Cập nhật bằng [code đầy đủ 9 file trong VS Code](docs/cap-nhat-thong-bao-nhac-phi-vscode.md), chạy `npm run db:migrate` để áp dụng **009_announcements.sql**, rồi khởi động lại backend/frontend. Không sửa migration 001–008.

- BQL → **Thông báo** → **Soạn thông báo**: nhập tiêu đề/nội dung, chọn toàn chung cư, khối hoặc một căn, đặt mức độ. Lưu bản nháp, kiểm tra rồi **Phát hành thông báo đã lưu**. Bản đã phát hành không sửa nội dung; có thể thu hồi kèm lý do. Lịch sử thao tác được lưu cùng giao dịch.
- Cư dân/tài khoản căn → **Thông báo**: số chưa đọc, tìm/lọc, mở chi tiết để đánh dấu đã đọc. Phạm vi theo căn/cư trú hiện tại. Cư dân mới nhìn thấy thông báo còn phát hành của căn mới; chuyển đi mất quyền căn cũ. Chủ hộ mới trên cùng tài khoản căn có trạng thái đọc riêng.
- BQL → **Phí & hóa đơn** → mở hóa đơn **Đã gửi** → **Nhắc thanh toán trên web**. Tối đa một lần mỗi hóa đơn/ngày Việt Nam, kể cả bấm lại/đồng thời hoặc đã thu hồi nhắc hôm đó. Nội dung lấy từ hóa đơn; không làm đổi tiền hay trạng thái hóa đơn.
- Nhắc phí chỉ đến tài khoản căn và tài khoản cá nhân của người phụ trách hiện tại nếu có quyền xem kỳ hóa đơn. Thành viên khác không thấy nhắc phí. Tài khoản căn xem được sổ hóa đơn cũ; tài khoản cá nhân vẫn giới hạn theo đợt cư trú. Hóa đơn đã thu còn xem thông báo nhưng không tính chưa đọc; hóa đơn hủy thì nhắc phí bị ẩn.

Phiên bản này là hộp thông báo **trên web**. BQL chủ động gửi nhắc; chưa có lịch tự động, SMS, email hoặc thông báo đẩy trên điện thoại. Số chưa đọc cập nhật khi đổi trang, quay lại tab và mỗi 60 giây khi mở web.

## Báo cáo công nợ và thu phí

BQL → **Công nợ & thu phí** tại `/quan-tri/bao-cao-tai-chinh`. Xem [code đầy đủ 7 file để chép vào VS Code](docs/cap-nhat-bao-cao-cong-no-vscode.md). Bản này không thêm migration/dependency; cần bản thông báo đã có schema đến 009.

- **Công nợ theo kỳ hóa đơn**: tổng đã gửi, đã thu của các kỳ đã chọn, còn phải thu, phần nợ quá hạn và tỷ lệ đã thu. Mặc định tất cả kỳ để giữ nợ cũ. Chỉ DA_GUI/DA_THANH_TOAN được tính; nháp, chưa gửi và hủy bị loại, kể cả hóa đơn đã lập thay thế. Số dư là hiện tại, không phải số dư hồi tố theo ngày.
- Lọc từ kỳ/đến kỳ, khối và số căn; xem công nợ theo căn, hóa đơn chưa thu hoặc tổng hợp theo kỳ. Chọn căn để xem hóa đơn riêng; mở hóa đơn để nhắc phí/xác nhận thu theo luồng đã có. Bộ lọc chỉ quá hạn đổi bảng chi tiết, không đổi tổng phía trên; mỗi căn có nợ quá hạn vẫn hiện toàn bộ nợ của căn trong các kỳ đã chọn.
- **Thu phí theo ngày xác nhận**: tiền BQL đã xác nhận thu trong khoảng ngày Việt Nam, mặc định đầu tháng đến hôm nay. Có bảng từng khoản/tham chiếu/người xác nhận và tổng hợp theo ngày. Thu cho kỳ cũ vẫn vào đúng ngày xác nhận. Đây không phải ngày chuyển khoản từ ngân hàng.

Hạn hôm nay chưa quá hạn; chỉ quá hạn khi hạn trả nhỏ hơn ngày hiện tại tại Việt Nam. Tiền trả API ở dạng chuỗi đồng nguyên, tổng hợp giữ chính xác cả khi vượt giới hạn số nguyên JavaScript. Tổng, số dòng và bảng chi tiết cùng một snapshot nhất quán khi có người thu tiền đồng thời. Chỉ BQL được truy cập cả API và giao diện. Người phụ trách căn hiển thị theo hiện tại, không tự thay nghĩa vụ tài chính của hóa đơn cũ.

## Thiết bị và bảo trì

Cập nhật [code đầy đủ 9 file cho VS Code](docs/cap-nhat-bao-tri-thiet-bi-vscode.md), chạy `npm run db:migrate` để áp dụng **010_maintenance.sql** và **011_maintenance_plan_checks.sql**, rồi khởi động lại backend/frontend. Giữ các migration 001–009 và dữ liệu đã có, không cần cài dependency mới.

1. BQL → **Thiết bị & bảo trì** → **Thêm thiết bị**: mã tài sản cố định, tên, loại, vị trí, serial/ngày lắp, trạng thái và ghi chú. Mã chuẩn hóa chữ hoa, duy nhất; không xóa thiết bị qua giao diện.
2. Nhập chu kỳ 1–3650 ngày cùng ngày kế tiếp, nhắc trước 0–90 ngày; bỏ trống cả chu kỳ/ngày nếu chưa cấu hình. Lọc quá hạn/sắp đến hạn/chưa có lịch. Quá hạn nếu ngày kế tiếp trước hôm nay, ngày hôm nay và hết cửa sổ nhắc trước đều thuộc Sắp/đến hạn. Tạm dừng vẫn theo dõi bảo trì; ngừng sử dụng tắt lịch.
3. Mở thiết bị → **Lập phiếu định kỳ** hoặc **Lập phiếu đột xuất**, có thể chọn KTV ngay hoặc để chưa phân công. Một thiết bị chỉ có một phiếu định kỳ chưa kết thúc; gửi lại cùng yêu cầu không tạo trùng. Phiếu giữ tên/vị trí lúc lập ngay cả khi hồ sơ được sửa sau đó.
4. KTV → **Bảo trì thiết bị** → mở phiếu được giao → bắt đầu → ghi ngày và kết quả để gửi BQL. KTV chỉ xem phiếu đang gắn cho mình; đổi người thu hồi quyền người cũ, kể cả truy cập ID trực tiếp. BQL có thể đổi lịch khi chưa bắt đầu, đổi người khi đang làm hoặc hủy phiếu kèm lý do.
5. BQL nghiệm thu đạt hoặc trả lại kèm lý do. Trả lại giữ báo cáo cũ trong lịch sử, xóa kết quả hiện tại để KTV phải gửi lượt mới. KTV không tự nghiệm thu; BQL không ghi thay báo cáo của KTV.

Sau nghiệm thu định kỳ, ngày kế tiếp = **ngày thực hiện được nghiệm thu + chu kỳ đã lưu trong phiếu**. Phiếu đột xuất không đổi lịch định kỳ; trả lại/hủy không dời lịch. Hệ thống cập nhật ngày, BQL chủ động lập phiếu kỳ sau. Không đổi cấu hình chu kỳ/ngày/nhắc trước khi còn phiếu định kỳ mở. Muốn ngừng sử dụng thiết bị phải xử lý hết phiếu mở; ngừng sử dụng tự bỏ lịch, không xóa lịch sử.

Phân công, trạng thái, kết quả và lịch kế tiếp được lưu cùng lịch sử trong một giao dịch; lỗi ghi lịch sử rollback cả thay đổi. Các thao tác kiểm tra phiên bản để tránh hai người ghi đè. Ngày thực hiện từ ngày lập phiếu đến hôm nay theo Việt Nam. Cảnh báo lịch hiển thị trên web; kết quả nghiệm thu không tự đổi trạng thái vận hành thiết bị.

## Ảnh hiện trường và QR

Form QR lưu nháp nội dung trong sessionStorage của tab hiện tại, tách theo vị trí QR và tài khoản, hết hạn sau 2 giờ và xóa khi gửi thành công. Nếu điện thoại tải lại trang khi mở thư viện ảnh, nội dung được khôi phục; ảnh cần chọn lại vì quyền chọn tệp không được giữ qua lần tải trang. Có nút chọn thư viện/chụp ảnh riêng, thông báo số ảnh đã chọn và cảnh báo khi trình duyệt chặn lưu nháp. Ảnh chỉ gửi lên máy chủ khi bấm Gửi phản ánh.

Nút Chụp ảnh mở camera ngay trong trang qua HTTPS. Chờ hình camera hiện lên rồi bấm Chụp ảnh này: ảnh JPEG được gắn vào form, có ảnh xem trước và camera được tắt. Có thể chụp thêm tới tổng 5 ảnh; ảnh chỉ được upload khi gửi phản ánh. Camera cũng tắt khi đóng, rời trang hoặc chuyển tab. Cần trình duyệt hỗ trợ getUserMedia, ví dụ Chrome hiện hành trên Android.

Ảnh thư viện JPEG/PNG/WebP tối đa 25 MB được xử lý lần lượt, thu nhỏ và đổi thành JPEG tối đa 1600 px cạnh dài, dưới 5 MB trước khi xem trước/gửi. Kiểm tra định dạng theo nội dung tệp, kể cả khi thư viện không cung cấp MIME. HEIC/HEIF chưa được hỗ trợ. Chờ ảnh xem trước hiện lên rồi gửi; form chặn gửi trong lúc xử lý ảnh. Cả ảnh chụp và ảnh thư viện được lưu trong cùng danh sách và gắn vào FormData qua sự kiện `formdata`, không cần gán lại `input.files` bằng DataTransfer. Việc hủy chọn ảnh giữ danh sách cũ; chọn thư viện thành công thay danh sách cũ.

Mã QR chứa URL theo tên miền đang mở trang quản trị. Khi thử camera điện thoại, dùng một tên miền HTTPS truy cập được từ điện thoại; địa chỉ loopback của máy phát triển không dùng được trên điện thoại. Camera trong web có hướng dẫn khi bị từ chối quyền và hỗ trợ dán URL cùng hệ thống; không tự mở URL ngoài hệ thống.

Để dùng nút **Mở camera** trên điện thoại cùng Wi-Fi, xem [hướng dẫn HTTPS cho Windows/Android](docs/https-local.md). Sau khi tạo và tin cậy chứng chỉ, chạy `npm run dev:frontend:https`. HTTP qua IP mạng nội bộ chỉ dùng được để mở form; trình duyệt chặn camera trong trang.

## Đặt lịch tiện ích cư dân

Xem [code đầy đủ 8 file để cập nhật trong VS Code](docs/cap-nhat-dat-lich-tien-ich-vscode.md). Cần bản bảo trì trước đó, rồi chạy `npm run db:migrate` để áp dụng 012, khởi động lại backend/frontend.

- BQL → **Tiện ích & đặt lịch** → **Thêm tiện ích**: tên, vị trí, quy định, sức chứa, giờ mở/đóng, thời lượng tối đa, hạn đặt trước. **Quản lý lượt đặt** để lọc và duyệt/từ chối/hủy có lịch sử.
- Cư dân hoặc tài khoản căn → **Đặt lịch tiện ích** → chọn tiện ích/ngày, chọn ô giờ trống, nhập số người/ghi chú → **Gửi yêu cầu đặt lịch**. Chỉ sử dụng sau khi BQL duyệt. **Lịch đặt của tôi** theo dõi/hủy trước giờ bắt đầu.
- Mỗi lượt dùng riêng tiện ích; lịch chờ duyệt cũng giữ chỗ, hai nhóm không chia sẻ cùng khung giờ dù chưa hết sức chứa. Từ chối/hủy trả giờ trống, hai lượt sát nhau được phép. Server chặn trùng khi gửi đồng thời.
- Tài khoản cá nhân cần liên kết cư dân đang ở. Tài khoản căn cần chủ hộ phụ trách hiện tại và có thể quản lý các lượt của căn. Cư dân khác chỉ biết khung bận, không thấy ghi chú/người/căn của lượt đó.
- Đặt theo giờ Việt Nam, bước 30 phút, cùng ngày, giờ tương lai trong hạn 1–90 ngày tùy cấu hình. Tạm ngừng chỉ chặn lịch mới, không hủy lịch cũ. Lượt đã tới giờ không còn duyệt/từ chối/hủy; Chờ duyệt không tự thành Đã duyệt. Chuyển đi không tự hủy lượt đã đặt; BQL hoặc tài khoản căn hợp lệ xử lý trước giờ bắt đầu. Phần này chưa thu phí tiện ích.

## Thu chi và quỹ

Xem [code đầy đủ 9 file để cập nhật trong VS Code](docs/cap-nhat-thu-chi-quy-vscode.md). Sau bản đặt lịch tiện ích, chạy `npm run db:migrate` để áp dụng 013 rồi khởi động lại backend/frontend.

- BQL → **Thu chi & quỹ**: quỹ vận hành tự nhận số tiền hóa đơn đã xác nhận thu, kể cả hóa đơn cũ. Không cần lập thêm phiếu thu cho cùng khoản tiền. Có thể tạo quỹ khác, số dư bắt đầu 0, bổ sung số tiền ban đầu bằng phiếu Thu/Bổ sung quỹ.
- Mở quỹ → **Lập phiếu thu / chi** → nhập loại, nhóm, ngày hạch toán, số tiền nguyên đồng, người nộp/nhận và diễn giải → lưu nháp. Chọn và tải chứng từ ảnh/PDF lên, rồi **Xác nhận duyệt và ghi sổ**. Phiếu chi bắt buộc chứng từ và số dư hiện tại đủ; ghi đồng thời không được chi vượt quỹ.
- Nháp sửa/hủy được; phiếu đã ghi sổ và chứng từ giữ nguyên. Sai phiếu dùng **Lập phiếu đảo** có lý do, tạo khoản đối ứng hôm nay, gốc vẫn giữ lịch sử. Không đảo tiếp phiếu đảo. Đảo thu cần quỹ đủ tiền.
- Sổ quỹ có đầu kỳ, thu/chi trong kỳ, cuối kỳ; xem từng giao dịch hoặc tổng hợp theo tháng, tìm nguồn/đối tác/mã phiếu. Lọc chi tiết không làm đổi tổng toàn quỹ theo khoảng ngày. Số dư theo dữ liệu phần mềm, cần đối soát tiền mặt/ngân hàng; ngày hạch toán lùi có thể làm báo cáo hồi tố âm. Chưa có khóa sổ kỳ, chuyển giữa quỹ hoặc giao dịch ngân hàng tự động.
- Chỉ BQL xem/ghi và tải chứng từ. Tệp ảnh/PDF tối đa 5 MB, tối đa 5/phiếu; binary nằm trong database, không có thư mục công khai. Sao lưu cả database lẫn thư mục ảnh phản ánh hiện có.

## Xuất báo cáo Excel / PDF

Xem [code đầy đủ 11 file để cập nhật trong VS Code](docs/cap-nhat-xuat-bao-cao-vscode.md). Không có migration mới; thêm thư viện backend rồi khởi động lại.

```bash
npm install -w backend --save-exact exceljs@4.4.0 pdfmake@0.2.23
```

BQL → **Công nợ & thu phí** hoặc mở một quỹ trong **Thu chi & quỹ** → áp dụng bộ lọc/cách xem → **Xuất Excel** / **Xuất PDF**. Tệp lấy toàn bộ kết quả khớp lọc, gồm các trang chưa mở; có tổng hợp, bộ lọc và thời điểm dữ liệu tại Việt Nam. Nếu phát sinh giao dịch sau khi tải màn hình, file là snapshot mới tại lúc xuất.

Excel có hai sheet Tổng hợp/Chi tiết; mã/điện thoại giữ số 0 đầu, giá trị tiền lớn hơn 15 chữ số lưu văn bản để không bị Excel làm tròn. PDF A4 ngang có font tiếng Việt nhúng, tiêu đề bảng lặp và số trang; tải file trực tiếp, không cần cửa sổ in. Chỉ BQL xuất được. Excel tối đa 10.000 dòng, PDF 1.000 dòng; vượt giới hạn sẽ báo để thu hẹp lọc/chọn tổng hợp, không xuất thiếu dữ liệu.

## Nhập / xuất dữ liệu theo phân hệ

Bản sửa mới: [code đầy đủ 7 file — mã cư dân và thông báo nhập PDF](docs/cap-nhat-ma-cu-dan-va-nhap-pdf-vscode.md). Mã số cư dân hiện ngay trong danh sách/hồ sơ, có Sao chép dùng được qua HTTP LAN và lọc theo mã. Tên đăng nhập căn CH... là mã khác. Nhập nhầm PDF/Excel sang phần dữ liệu khác sẽ chỉ rõ phần đúng cần chọn; PDF biểu mẫu vẫn được hỗ trợ.

Có [bộ Excel/PDF đã điền sẵn để test](samples/nhap-du-lieu/README.md): 10 tệp cho 5 phần nhập, hai bộ dùng mã khác nhau, kèm 2 tệp cố ý có lỗi. Không cần sửa code để dùng; tệp xe cần điền mã cư dân thật sau bước nhập cư dân.

Xem [code đầy đủ từng file để cập nhật trong VS Code](docs/cap-nhat-nhap-xuat-du-lieu-vscode.md). Bản này cần migration **014_data_imports.sql**, không sửa 001–013 đã chạy.

```bash
npm install -w backend --save-exact pdf-lib@1.17.1 @pdf-lib/fontkit@1.1.1 yauzl@3.4.0
npm run db:migrate
```

BQL → **Nhập / xuất Excel, PDF**, hoặc bấm **Nhập Excel / PDF** ngay tại danh sách. Nhập thêm mới căn hộ, cư dân/đợt cư trú đầu, phương tiện, chỉ số điện nước và thiết bị. Tải mẫu, điền, chọn tệp → Xem trước → sửa hết lỗi → Xác nhận. Xem trước không lưu hồ sơ; xác nhận kiểm tra lại và lưu toàn bộ lô trong một transaction. Có một dòng lỗi thì không lưu dòng nào. Gửi lại cùng tệp không tạo trùng; lịch sử ghi nhận số dòng và người nhập, không lưu mật khẩu.

Excel nhận `.xlsx` tối đa 100 dòng/5 MB, tên cột đúng mẫu. PDF nhận **biểu mẫu có ô điền** tải từ hệ thống, tối đa 10 trang/5 MB, mỗi trang một hồ sơ. Mở bằng Chrome/Acrobat, điền và **Save**, không Print to PDF. PDF scan, PDF bảng báo cáo và bản đã làm phẳng không có trường nhập được; dùng mẫu Excel khi dữ liệu nhiều. Không có OCR tự đoán dữ liệu.

Xuất Excel/PDF toàn bộ danh sách theo bộ lọc ở **Căn hộ, Cư dân, Phương tiện, Chỉ số điện nước, Thiết bị, Phiếu bảo trì, Hóa đơn, Lượt đặt tiện ích**, không giới hạn trang đang xem. Báo cáo công nợ/thu phí và sổ quỹ giữ nút xuất hiện có. Giới hạn xuất: Excel 10.000 dòng, PDF 1.000 dòng; vượt thì báo lỗi, không cắt bớt.

Nhập căn hộ vẫn tạo tài khoản riêng; mật khẩu mới chỉ trả một lần sau khi lưu, nếu mất kết quả cần cấp lại. Nhập chủ hộ không tự thay người phụ trách đang có. Nhập chỉ số không ghi đè kỳ đã có hoặc vượt khóa hóa đơn; xe phải thuộc cư dân đang ở đúng căn. Duyệt hóa đơn, xác nhận đã thu, ghi sổ quỹ, bàn giao chủ hộ và duyệt đặt lịch vẫn thực hiện qua màn nghiệp vụ.

## Dữ liệu mẫu nghiệm thu toàn hệ thống

[Bộ tạo dữ liệu mẫu](samples/nghiem-thu/README.md) có tài khoản từng vai trò/căn, nhà ở/cư dân/xe, 13 kỳ hóa đơn, QR/phản ánh kèm ảnh, bảo trì, tiện ích, thông báo, công nợ và quỹ. Tạo riêng trong `chung_cu_nghiem_thu`, giữ dữ liệu phát triển. Có [code từng file để chép vào VS Code](docs/cap-nhat-du-lieu-nghiem-thu-vscode.md), không cần tải ZIP, migration hoặc thư viện mới.

```powershell
node --env-file-if-exists=.env scripts/create-acceptance-data.js --docker --origin=https://192.168.1.208:5173
```

Thay IP theo địa chỉ frontend hiện tại. Sau khi báo hoàn tất, mở `backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md`, `QR.html` và `README.md`. Có 17 file nhập và 24 báo cáo Excel/PDF, 58 kiểm tra API/tệp. Giữ file mật khẩu/mã tra cứu ngoài Git. Tài khoản ngân hàng là giả lập, không chuyển tiền thật.

Dừng backend cũ rồi đặt `$env:DB_NAME = "chung_cu_nghiem_thu"` trong terminal backend và chạy `npm run start -w backend`; dùng cửa sổ ẩn danh đăng nhập bộ mẫu. Chạy lại bộ tạo trên DB đã có dữ liệu sẽ dừng giữ nguyên; không có lệnh reset/xóa. Hướng dẫn đầy đủ có cách tạo bộ mới và quay về DB cũ.

## Hồ sơ thiết kế và kiểm tra file khi chép tay

[Bộ tài liệu báo cáo](docs/bao-cao/README.md) có Use Case/đặc tả, Activity/Sequence, Class Diagram, ERD logic/vật lý, từ điển 38 bảng và ma trận nghiệm thu theo đề cương. [Hướng dẫn VS Code](docs/cap-nhat-nghiem-thu-vscode.md) có đầy đủ code từng file mới, không cần tải ZIP. Chưa có migration hoặc dependency ứng dụng mới trong bản này.

Để vẽ gọn và chèn Word: [ERD tổng quan 12 bảng và 6 sơ đồ phân hệ](docs/bao-cao/erd-gon/README.md), kèm PNG/SVG, PDF A4 ngang và file draw.io chỉnh sửa được. Database giữ nguyên 38 bảng; các bảng lịch sử/kỹ thuật có bảng đối chiếu và phần phụ lục riêng.

```powershell
# Bắt lỗi thiếu service, sai đuôi .js.txt, thiếu dependency/file migration:
node scripts/check-local.js
# Khi backend đang chạy:
node scripts/check-local.js --api http://127.0.0.1:3000
# Tái sinh ERD/từ điển từ metadata DB sau khi đã migrate đầy đủ:
node --env-file-if-exists=.env scripts/export-schema.js
```

Preflight không đọc nội dung `.env` và không thay kiểm thử nghiệp vụ. Export schema chỉ đọc metadata và ghi ba tệp tài liệu, không đọc dữ liệu cư dân hoặc sửa database. Xem giới hạn và phần thử thiết bị thật còn thiếu trong [ma trận nghiệm thu](docs/bao-cao/nghiem-thu.md).

## Giao diện tìm kiếm và danh mục dịch vụ

[Bản giao diện mới và code đầy đủ 9 file để chép vào VS Code](docs/cap-nhat-giao-dien-tim-kiem-danh-muc-vscode.md) có tìm/lọc dịch vụ cư dân, tìm nhanh chức năng theo vai trò, đăng nhập tiếp tục dịch vụ đã chọn và bố cục chung gọn hơn cho các phân hệ. Xem [ảnh chụp bản chạy](docs/giao-dien-danh-muc/README.md). Không thêm dependency hoặc migration. Tài liệu ghi rõ giới hạn truy cập bốn website tham khảo trong phiên thiết kế.

## Kiểm tra

```bash
npm run build
npm test
npm run test:e2e
```

- `npm test`: tạo/migrate database riêng `chung_cu_test`, chạy kiểm thử HTTP với MySQL thật. Gồm xác thực, khóa phiên, quyền bản ghi/ảnh, QR thu hồi, gửi lặp đồng thời, chuyển trạng thái, nghiệm thu mới, gộp trùng, giới hạn gửi, hóa đơn/cư trú/tài khoản căn, phạm vi thông báo, receipt sau bàn giao, nhắc phí đồng thời, bảo trì thiết bị, đặt lịch tiện ích đồng thời, thu chi/quỹ, chứng từ, file Excel/PDF và rollback khi lịch sử lỗi.
- `npm run test:e2e`: chạy API/Vite riêng ở 3101/5174, mở Chromium và đi hết luồng qua giao diện ở 1440 px và 375 px. Browser Linux được đóng gói trong dependency `@sparticuz/chromium`, không cần tải thêm từ CDN. Kiểm thử không thay dữ liệu database phát triển. Hai lệnh test nên chạy lần lượt.
- `/api/health` kiểm tra tiến trình; `/api/ready` kiểm tra database và migration. Không coi một cổng mở là đã sẵn sàng.

Chưa đo tải lớn, thử camera trên thiết bị thật hoặc kiểm thử sao lưu/phục hồi. Trước triển khai thật: phục vụ frontend và `/api` cùng origin qua HTTPS, đặt `COOKIE_SECURE=true`, dùng khóa/mật khẩu riêng, cấu hình backup và giới hạn request tại reverse proxy. Backend hiện bind loopback; Vite là máy chủ phát triển.

Xem [kiến trúc và quy tắc](docs/architecture.md), [API](docs/api.md), [database](database/README.md). Những quy tắc hóa đơn/cư trú đang là đề xuất trong tài liệu được để lại cho giai đoạn tiếp theo, chưa được coi là nghiệp vụ đã chốt.
