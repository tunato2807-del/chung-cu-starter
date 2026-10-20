# Kiến trúc phiên bản phản ánh QR

Frontend dùng React Router, điều hướng theo vai trò thật từ API, không còn nút giả lập vai trò. Màn công khai tách khỏi workspace BQL/KTV/cư dân. Các trạng thái tải, rỗng, lỗi, gửi chờ và xung đột được hiển thị tại màn đang thao tác. Bộ lọc và trang danh sách nằm trong URL, giữ khi trở lại từ chi tiết.

Backend tách middleware xác thực, service nghiệp vụ phản ánh và repository truy vấn có tham số. MySQL InnoDB lưu dữ liệu lâu dài, `transaction()` là ranh giới cập nhật trạng thái + lịch sử + metadata ảnh. `phien_ban` và khóa hàng ngăn ghi đè dữ liệu cũ; trả 409 để người dùng tải lại. Lỗi có mã, thông báo, lỗi trường (khi có) và request ID.

## Xác thực và quyền

- Băm mật khẩu bằng bcrypt cost 12, không nhận mật khẩu dài quá 72 byte.
- JWT HS256 có issuer, audience, hạn 8 giờ và phiên bản tài khoản; cookie HttpOnly, SameSite=Strict. Mỗi request kiểm tra lại trạng thái/vai trò/phiên bản trong DB. Đổi mật khẩu, khóa tài khoản, đăng xuất tăng phiên bản.
- Request thay đổi dữ liệu cần `X-App-Request: 1`, không bật CORS và từ chối `Sec-Fetch-Site: cross-site`. Cookie Secure được bật qua cấu hình khi có HTTPS.
- Khóa đăng nhập 15 phút sau 5 lần sai; giới hạn theo IP ở middleware. BQL cấp tài khoản KTV/cư dân, không có đăng ký công khai hoặc tự chọn vai trò.
- KTV chỉ đọc/sửa việc được giao hiện tại; cư dân chỉ đọc bản ghi do tài khoản gửi. Ảnh đọc qua endpoint kiểm tra quyền, không mount thư mục uploads công khai.

## Quy trình phản ánh

`MOI → DA_PHAN_CONG → DANG_XU_LY → DA_XU_LY → DA_DONG`.

BQL có thể phân công lại khi đã phân công/đang xử lý, giữ trạng thái và ghi cả người cũ/mới trong lịch sử. BQL trả `DA_XU_LY → DANG_XU_LY` cần lý do và tăng lượt xử lý. Hoàn thành cần ghi chú và ảnh mới gửi trong cùng request. BQL có thể từ chối hoặc gộp khi `MOI`; gộp phải cùng vị trí, bản gốc còn mở, không tự gộp hoặc tạo chuỗi/vòng gộp.

QR dùng UUID v4; tạo lại thu hồi mã cũ. Server luôn tra lại token khi gửi. Bí mật tra cứu là 32 byte ngẫu nhiên, không đưa vào URL API. Tra cứu qua POST chỉ trả vị trí, trạng thái, thời gian và phản hồi công khai; bản trùng lấy trạng thái hiện tại của bản gốc. Ghi chú nội bộ không trả trong lịch sử cư dân/công khai.

Khóa yêu cầu UUID và dấu vân tay nội dung/tài khoản/ảnh được lưu cùng giao dịch: gửi lại cùng yêu cầu trả mã cũ, nội dung khác trả 409. Giới hạn 5 lần gửi thành công trong 60 phút theo tổ hợp SĐT + IP được lưu trong MySQL; cảnh báo tương tự chỉ thông báo có sự cố đang mở, không lộ hồ sơ của người khác.

Ảnh tối đa 5 tệp × 5 MB/request, tối đa 25 triệu điểm ảnh/tệp. Sharp giải mã kiểm tra JPEG/PNG/WebP, giới hạn kích thước, xuất JPEG loại metadata và đổi tên ngẫu nhiên. Ảnh chuẩn bị trước giao dịch được xóa nếu giao dịch thất bại. Chưa có tác vụ định kỳ thu gom ảnh mồ côi do tiến trình/máy bị dừng đột ngột; cần bổ sung trước vận hành dài hạn. Giới hạn IP trong bộ nhớ phù hợp một tiến trình demo; triển khai nhiều instance cần kho giới hạn dùng chung và cấu hình trust proxy đúng hạ tầng.

Frontend nhận ảnh thư viện tối đa 25 MB/tệp, kiểm tra chữ ký JPEG/PNG/WebP và giải mã lần lượt bằng createImageBitmap với kích thước thu nhỏ. Canvas xuất JPEG cạnh dài tối đa 1600 px, chất lượng 0.85 và kiểm tra giới hạn 5 MB. Danh sách File đã xử lý dùng chung cho preview và multipart qua sự kiện formdata; không phụ thuộc FileList của input sau khi đóng thư viện hoặc DataTransfer. Submit bị chặn khi đang xử lý ảnh. Kiểm tra frontend hỗ trợ trải nghiệm, không thay kiểm tra Sharp ở backend.

## Căn hộ và cư trú

Migration 002 thêm can_ho, cu_dan và lich_su_cu_tru; không thay schema phản ánh hoặc migration 001 đã áp dụng. Runner đọc các migration SQL theo thứ tự tên, kiểm tra checksum và giữ khóa MySQL. Migration 003 thay ràng buộc ngày kết thúc thành lớn hơn hoặc bằng ngày bắt đầu; không sửa các migration cũ đã chạy. Các migration 001–003 phải được giữ khi áp dụng migration 004 cho phương tiện; readiness kiểm tra cùng các migration phương tiện và hóa đơn hiện hành.

Hồ sơ cu_dan giữ thông tin liên hệ, liên kết tài khoản tùy chọn/duy nhất và phien_ban. Căn hộ và quan hệ nằm trong đợt cư trú, không giữ thêm một nguồn mô tả căn hiện tại. Khoảng ngày nửa mở, không nhận ngày tương lai, không sửa hồi tố lịch sử đã đóng. Tình trạng đang ở/chuyển đi và số người trong căn được suy ra từ đợt chưa kết thúc. Cờ tính phí không phụ thuộc số người.

Mỗi thay đổi cư trú khóa hồ sơ cư dân FOR UPDATE và kiểm tra phien_ban. Chuyển căn đóng đợt cũ + mở đợt mới + tăng phiên bản trong cùng transaction; ngày chuyển không được trước ngày bắt đầu đợt cũ. Cho phép chuyển nhiều lần trong cùng ngày; các khoảng rỗng `[D,D)` là bản ghi lịch sử chuyển trong ngày, không đại diện thêm ngày cư trú và không chồng khoảng thời gian của căn mới. ID lịch sử xác định thứ tự các lần chuyển cùng ngày; hệ thống chưa phân chia theo giờ. Nhập cư lại phải từ ngày kết thúc đợt gần nhất. Cột sinh cu_dan_dang_o với UNIQUE ngăn nhiều đợt chưa kết thúc ở cấp database. Lịch sử và hồ sơ không có API xóa cứng.

API căn hộ/cư dân áp dụng xác thực và vai trò BQL cho cả đọc và ghi; ID không tạo quyền truy cập. Tài khoản mới gắn phải là CU_DAN đang hoạt động và chưa gắn hồ sơ khác. Khi sửa tên/liên hệ có thể giữ nguyên tài khoản cũ đã khóa; không tự mở khóa hoặc chuyển vai trò. BQL tìm tài khoản chưa gắn theo tên/SĐT qua endpoint phân trang, không tải toàn bộ tài khoản. Màn hình tìm căn và tìm hồ sơ dùng phân trang 20 bản ghi.

## Phương tiện theo đợt cư trú

Migration 004 thêm phuong_tien; migration hóa đơn bổ sung khóa kỳ; readiness yêu cầu đủ migration 001–008. Một bản ghi là một lần đăng ký với mã riêng, chủ xe, căn chịu phí và khóa ngoại đợt cư trú. Giữ hãng/màu, ngày đăng ký/kết thúc, người tạo/kết thúc, lý do và phien_ban. Căn và đợt của bản cũ không được ghi đè; không có API xóa hoặc sửa lịch sử.

Biển số chuẩn hóa ASCII viết hoa, bỏ khoảng trắng/chấm/gạch nối. Ô tô/xe máy bắt buộc biển, xe đạp cho NULL. Cột sinh bien_so_dang_hoat_dong với UNIQUE chặn hai đăng ký đang gửi cùng biển, cho phép nhiều xe đạp không biển. Đăng ký mới cũng kiểm tra khoảng ngày với lịch sử cùng biển để tránh chồng thời gian gửi khi nhập lùi ngày.

Đăng ký và kết thúc xe khóa hồ sơ cư dân trước khi khóa đợt/xe. Tạo xe đối chiếu mã đợt phía client với đợt đang mở trên server; tự lấy căn chịu phí. Nếu cư dân đã chuyển căn, trả 409. Cùng thứ tự khóa với chuyển cư trú giúp việc tạo xe chạy đua chuyển đi không để xe đang gửi trên một đợt đã đóng.

Chuyển căn/chuyển đi khóa các đăng ký thuộc đợt cũ, chặn ngày chuyển trước mốc xe đã ghi, rồi kết thúc xe trong cùng transaction với cư trú. Nếu chuyen_phuong_tien=true khi chuyển căn, tạo đăng ký mới cho từng xe đang gửi và gắn ma_dang_ky_truoc về bản cũ. Cờ này tùy chọn, mặc định false cho API; giao diện BQL hiển thị checkbox mặc định chọn. Bản đã kết thúc trước đó không được chuyển tiếp. Lỗi tạo xe mới rollback cả đợt cư trú và các đăng ký xe.

Khoảng ngày là [ngay_dang_ky, ngay_ket_thuc), NULL là chưa kết thúc. Chuyển nhiều lần trong ngày tạo các khoảng rỗng có thứ tự theo ID; giữ lịch sử nhưng không tạo thêm ngày chịu phí. Kết thúc cùng ngày được gọi lặp mà không ghi nhận kết thúc lần hai. Chưa có tính phí hoặc sửa dữ liệu đã dùng trong hóa đơn; cần bổ sung khóa kỳ khi triển khai hóa đơn.

## Phí và hóa đơn

Migration 005 thêm loai_phi, cau_hinh_phi, chi_so_dich_vu, hoa_don, chi_tiet_hoa_don và lich_su_hoa_don. Không sửa migration cũ. Các loại phí có dữ liệu danh mục, không seed đơn giá hoặc tài khoản ngân hàng. Giá mới nối tiếp khoảng hiệu lực cùng loại, khóa hàng danh mục để chống chồng khi ghi đồng thời; không được hồi tố qua ngày chốt của hóa đơn còn hiệu lực dùng giá cũ.

Migration 006 thêm cach_tinh/thue_gtgt/bac_dien vào cau_hinh_phi, giữ phiên bản cũ DON_GIA/0% và không sửa các dòng hóa đơn. billing.electricity.js kiểm tra 2–12 bậc với ngưỡng nguyên cộng dồn tăng dần, cuối không giới hạn, giá không âm; chia kWh (3 số lẻ) theo ngưỡng rồi làm tròn mỗi bậc half-up đến đồng. Thuế điện (0–100%, 2 số lẻ) chỉ tính trên tổng tiền điện đã làm tròn, thêm một dòng khoản thu riêng. Dòng thuế lưu phần trăm/cơ sở thuế trong nguồn và diễn giải công khai. Widen don_gia chi_tiet_hoa_don lên DECIMAL(16,2) để chứa khoản thuế; don_gia cau_hinh_phi vẫn DECIMAL(12,2). Bậc/thuế và giá của các bậc đã dùng nằm trong snapshot và dấu vân tay như phí khác. Nhánh đơn giá cũ/0% giữ nguyên cấu trúc snapshot để nháp cũ vẫn duyệt được. Một biểu giá tại ngày chốt áp dụng toàn kỳ; chưa phân bổ kỳ đổi giá hoặc nhiều hộ.

Số tiền dùng BigInt theo thang thập phân (đơn giá 2, số lượng/chỉ số 3 số lẻ), không cộng tiền bằng số thực. Từng dòng làm tròn half-up đến đồng, cộng tổng nguyên, kiểm tra giới hạn DECIMAL. Chi tiết lưu giá/đơn vị/số lượng và mã dữ liệu nguồn. Phí xe đọc khoảng nửa mở tại ngày chốt, bỏ qua bản kết thúc cùng ngày; không chia theo giờ/ngày. Các lựa chọn thu nước/điện/xe được BQL xác định rõ; cờ tính phí quản lý độc lập với tình trạng trống.

Chỉ số lưu từng căn/dịch vụ/kỳ với phiên bản. Kỳ đầu xác nhận rõ; các kỳ sau phải nối tiếp tháng và chỉ số. Không nhập lùi/sửa kỳ đã có kỳ sau. Kỳ có hóa đơn duyệt/gửi/đã thu bị khóa, kể cả thay đổi từ API. Nháp có thể thiếu dữ liệu, có danh sách lỗi; tính lại sẽ thay chi tiết nháp. Trước duyệt, tính nguồn hiện tại và so dấu vân tay chuẩn hóa (gồm nguồn và giá trị), kiểm tra lại chi tiết đã lưu/tổng. Nháp cũ trả 409, không âm thầm duyệt số cũ.

Trạng thái NHAP → DA_DUYET → DA_GUI → DA_THANH_TOAN; trước thanh toán có thể HUY. Mỗi căn/kỳ có tối đa một bản còn hiệu lực qua cột sinh UNIQUE; lan_lap đánh số bản thay thế, phien_ban dùng chống ghi đè. Bản thay thế chỉ lập từ bản hủy gần nhất, có số mới và liên kết bản cũ. Cập nhật trạng thái, người thực hiện, thời gian và lịch sử trong cùng transaction. Xác nhận thu cần đúng toàn bộ số tiền và mã tham chiếu duy nhất; retry cùng giao dịch không tạo lịch sử thu lần hai. Quá hạn là thuộc tính tính bằng ngày Việt Nam khi đọc.

Khóa theo căn trước khi ghi chỉ số/hóa đơn/xe. Luồng cư trú khóa cư dân rồi các căn liên quan theo thứ tự ID, sau đó khóa xe; không tính hóa đơn bằng cách khóa ngược hồ sơ cư dân. Chặn thêm/kết thúc/chuyển xe hồi tố qua ngày hóa đơn đã chốt khoản xe, cả căn đi và căn đến. Lỗi trả 409 yêu cầu xử lý hóa đơn trước; cùng ngày vẫn được chuyển khi không thay đổi dữ liệu đã chốt. Hóa đơn lưu bản chụp tài chính, không cập nhật tổng khi dữ liệu nguồn về sau thay đổi.

Cư dân chỉ xem DA_GUI/DA_THANH_TOAN nếu tài khoản gắn hồ sơ có đợt đang mở cùng căn và bắt đầu không sau ngày chốt. Chuyển căn/chuyển đi thu hồi quyền ngay, kể cả truy cập ID trực tiếp. Chi tiết công dân không trả log nội bộ hoặc mã nguồn xe/chỉ số. BQL xem toàn bộ; KTV/khách bị chặn API.

VietQR tạo payload NAPAS QRIBFTTA và CRC16 trong backend, dựng ảnh QR cục bộ bằng dependency qrcode đã có. Không gửi ngân hàng/tài khoản/tiền sang dịch vụ tạo ảnh ngoài. Hóa đơn lưu riêng BIN, tài khoản, tên người nhận khi gửi; chỉ DA_GUI có payload QR. Không có webhook hoặc tự xác nhận quét là đã thu. Cần kiểm tra ngân hàng thật trước khi dùng thanh toán thực tế.

## Phạm vi tiếp theo

Lập bản nháp hóa đơn hàng loạt đã triển khai ở migration 015; các nghiệp vụ thanh toán mở rộng chưa triển khai. Những bảng nghiệp vụ tiếp theo phải được bổ sung bằng migration mới, giữ lịch sử và áp dụng quyền theo đợt cư trú theo bản rà soát. Không dùng SQL cũ trong tài liệu thiết kế làm migration cho database đang chạy.


## Tài khoản căn và người phụ trách

Tách tài khoản cá nhân (`cu_dan.ma_nguoi_dung`) với tài khoản thanh toán cố định (`nguoi_dung.ma_can_ho_thanh_toan`, duy nhất/căn). Người phụ trách là `ma_cu_dan_phu_trach`, chỉ một cư dân hiện tại cho mỗi tài khoản, không đổi vai trò cư trú hoặc xóa hồ sơ người cũ. Username CH + ID căn, mật khẩu random 18 byte/base64url, bcrypt12. Chỉ trả plaintext một lần trong response ghi cho BQL; GET/auth/log không trả hash/mật khẩu. Backfill căn cũ tạo tài khoản khóa, không có mật khẩu dùng được; BQL cấp mật khẩu trước khi bàn giao.

apartment-accounts.service.js tạo/cấp lại/gắn/tách với audit trong transaction. Luồng ghi cư trú khóa cư dân rồi các căn theo ID rồi tài khoản/xe; endpoint bàn giao khóa cư dân đích trước căn/tài khoản. Reset không đổi khóa ngoại người phụ trách khi giá trị không đổi. Log giữ ID cư dân như snapshot, không lấy FK lock cư dân cũ gây đảo thứ tự. phien_ban_ban_giao chống hai lần cấp mật khẩu từ trạng thái cũ. Bàn giao/khóa tăng phien_ban_token; quyền hóa đơn của tài khoản căn kiểm tra lại active/version ở SQL, không lấy phạm vi từ client.

Tài khoản căn xem sổ hóa đơn đã gửi/đã thu của căn qua các đợt cư trú. Đây là quyền xem để quản lý thanh toán chung của căn, không tự chuyển nghĩa vụ pháp lý hóa đơn cũ. Tài khoản cá nhân vẫn theo quy tắc đợt đang mở; không đổi mapping cũ. BQL vẫn xác nhận thu sau đối soát, không có xác nhận từ việc đăng nhập/chuyển chủ hộ/quét QR.


## Ánh xạ đăng nhập SĐT và danh sách tài khoản căn

SĐT đăng nhập căn là alias đọc trực tiếp từ hồ sơ ma_cu_dan_phu_trach. Không đổi schema 007–008, không copy số vào cột SĐT duy nhất của tài khoản cá nhân. Danh sách /can_ho/tai_khoan là BQL-only, JOIN căn/người phụ trách, phân trang 20 và không chọn cột password/hash.

Login lấy ID ứng viên bên ngoài transaction rồi khóa tài khoản theo thứ tự ID. Sau khóa mới đọc hồ sơ để xác nhận alias còn đúng, tránh dùng kết quả tìm kiếm trước một bàn giao đã commit. Đổi SĐT khóa cư dân → căn → tài khoản và tăng phiên bản token; phiên vừa phát trước thay đổi cũng hết hiệu lực. Mật khẩu hợp lệ duy nhất mới được chọn; nhiều tài khoản cùng khớp cần chọn loại/mã CH, không ưu tiên âm thầm tài khoản cá nhân hoặc căn. Kiểm tra tối đa 10 ứng viên và giữ rate limit. Danh tính không được trả trong phản hồi lỗi đăng nhập.

## Thông báo và nhắc phí trên web

Module announcements quản lý bản nháp → phát hành → thu hồi, lạc quan bằng phien_ban, khóa row và ghi audit cùng transaction. Nội dung văn bản thuần, không render HTML. BQL độc quyền ghi/xem nội bộ; KTV và khách không được vào hộp cư dân. GET không tạo receipt; frontend chi tiết gọi POST da_doc riêng và có thử lại khi lỗi.

Hộp cư dân JOIN tài khoản active/tokenversion, căn cố định hoặc đợt cư trú đang mở, người phụ trách hiện tại và receipt trong cùng truy vấn. Thông báo chung được xét động theo căn/khối hiện tại, kể cả thông báo trước ngày nhập cư. Nhắc phí cần tài khoản căn hoặc tài khoản cá nhân của đúng người phụ trách; cá nhân còn cần tu_ngay <= ngày chốt như quyền hóa đơn. Không lấy căn từ tham số client. Receipt tài khoản căn tách theo ID người phụ trách để bàn giao không kế thừa trạng thái đã đọc của người cũ; cá nhân luôn tự giữ receipt riêng.

Nhắc phí là thao tác BQL trên hóa đơn DA_GUI, kiểm tra phiên bản; khóa căn → hóa đơn → thông báo, UNIQUE hóa đơn/ngày Việt Nam, retry trả ID cũ mà không thêm audit. Thu hồi không xóa giới hạn cùng ngày. Không tăng phiên bản tài chính hoặc tính lại tiền. Hóa đơn thanh toán còn có thông báo đã xử lý, không tính chưa đọc; hủy thì mất quyền xem nhắc. Đánh dấu đọc khóa riêng tài khoản để cố định scope người nhận, không khóa cư dân/căn ngược chiều. Migration không phát hành thông báo và ứng dụng không chạy cron hay kết nối email/SMS/push.

## Báo cáo tài chính hiện tại

financial-reports tách truy vấn công nợ theo kỳ hóa đơn khỏi khoản thu theo thời điểm BQL xác nhận. Nguồn công nợ chỉ hoa_don DA_GUI/DA_THANH_TOAN; không JOIN dòng chi tiết, lịch sử hoặc các đợt đồng chủ hộ để cộng tiền. Khi gom căn, tổng hợp theo ma_can_ho trước rồi mới JOIN tài khoản duy nhất/người phụ trách hiện tại. Bản hủy bị loại dù có hóa đơn thay thế. Không tạo bản sao tài chính hoặc thay trạng thái khi xem báo cáo.

Mỗi response dùng transaction REPEATABLE READ WITH CONSISTENT SNAPSHOT, READ ONLY; đọc tổng, count và trang trên cùng snapshot để thu tiền đồng thời không gây tổng/bảng lệch. Không FOR UPDATE, không chặn luồng xác nhận thu. SUM DECIMAL được trả CAST AS CHAR; frontend dùng BigInt để định dạng, tỷ lệ là số phần trăm làm tròn 2 số lẻ bằng BigInt trước khi trả. Bộ lọc quá hạn tác động danh sách; summary vẫn theo toàn bộ kỳ/khối/căn đã lọc.

Ngày quá hạn chốt một lần bằng ngày Asia/Ho_Chi_Minh ở đầu request, dùng hạn < ngày đó, bỏ NULL. Hóa đơn đến hạn hôm nay chưa quá hạn. Thu phí dùng ngay_thanh_toan UTC và khoảng nửa mở tương ứng 00:00 ngày đầu tới 00:00 ngày sau ngày cuối tại +07:00; group ngày bằng CONVERT_TZ offset, không phụ thuộc MySQL timezone tables. Luồng xác nhận thu ghi UTC_TIMESTAMP() rõ ràng để không phụ thuộc timezone session. Không sửa thời điểm lịch sử khi thêm báo cáo.

Report chỉ BQL ở route và giao diện, không xuất thông tin ngân hàng/hash. Màn báo cáo chỉ đọc; hành động thu/nhắc mở chi tiết hóa đơn theo API đang có. Không triển khai sổ chi, hoàn tiền, hạch toán hoặc số dư công nợ hồi tố trong module này. Ngày thu là lúc xác nhận tại phần mềm, không tự đồng bộ ngày chuyển tiền từ ngân hàng.

## Thiết bị và bảo trì

010 thêm thiet_bi, phieu_bao_tri và lich_su_bao_tri. 011 thêm CHECK rõ IS NOT NULL cho cặp chu kỳ/ngày và snapshot định kỳ, vì CHECK của MySQL không từ chối biểu thức UNKNOWN. Không sửa các migration đã áp dụng. Mã tài sản duy nhất và giữ cố định, lịch tách khỏi trạng thái vận hành: tạm dừng vẫn theo dõi, ngừng sử dụng bỏ lịch sau khi không còn phiếu mở.

Một phiếu giữ tên/vị trí lúc lập, ngày đến hạn, chu kỳ định kỳ snapshot. UNIQUE cột sinh dinh_ky_dang_mo chỉ tồn tại với định kỳ chưa hoàn thành/hủy, chống hai phiếu định kỳ mở. UUID request duy nhất kèm fingerprint input chuẩn hóa và actor; retry trả ID cũ trước kiểm tra phiên bản/trạng thái mới. Khác input cùng key bị chặn, mã tài sản cũng chống tạo hồ sơ trùng. Không có API xóa thiết bị/phiếu.

Ghi khóa theo thiết bị → phiếu → đọc chia sẻ tài khoản actor/KTV. Asset của phiếu bất biến nên có thể lấy hint ID trước, sau khóa đọc lại trạng thái/version/assignee. Mọi sửa thông tin/lịch/nghiệm thu cùng khóa thiết bị; chặn đổi cấu hình khi định kỳ đang mở. KTV được chọn phải còn hoạt động, kiểm tra với FOR SHARE; actor active/role/token được xác nhận lại bên trong giao dịch. Đổi người ngay lập tức loại quyền đọc/ghi của KTV cũ. Query danh sách/chi tiết KTV kiểm tra scope assignment và token trong SQL, không dựa ID người client gửi.

Luồng BQL phân công/đổi lịch/hủy/nghiệm thu, KTV bắt đầu/báo cáo. Trả lại xóa kết quả hiện tại, tăng lượt; báo cáo lượt trước vẫn trong audit văn bản và snapshot JSON. Nghiệm thu định kỳ tính ngày kế tiếp từ ngày thực hiện được duyệt + chu kỳ của phiếu, chỉ một lần nhờ version/khóa trạng thái. Đột xuất/hủy/trả lại không đổi lịch. Ghi lịch sử lỗi rollback cả phiếu và ngày kế tiếp. Tên/serial/vị trí hiện tại có thể sửa nhưng không ghi đè snapshot phiếu cũ.

Giao diện BQL /quan-tri/thiet-bi và /quan-tri/bao-tri; KTV /ky-thuat/bao-tri. Resource gắn với path/revision để không render dữ liệu trang/query cũ trong lúc chuyển màn hình. Cảnh báo quá hạn và cửa sổ nhắc theo ngày Việt Nam. BQL chủ động lập phiếu kỳ sau; không có cron tạo phiếu hoặc gửi thông báo ngoài web. Bảo trì không thay sổ hóa đơn/thu phí hoặc tự đổi trạng thái thiết bị sau nghiệm thu.

## Tiện ích và đặt lịch cư dân

Module amenities dùng migration 012: tien_ich, dat_lich_tien_ich, lich_su_dat_lich. Phần này đặt riêng từng tiện ích, sức chứa là giới hạn người trong một lượt, không cộng gộp các nhóm độc lập. CHO_DUYET/DA_DUYET cùng giữ chỗ; TU_CHOI/DA_HUY giải phóng. Không tự thu tiền hoặc thêm dòng phí hóa đơn.

Khóa ghi theo cư dân → đợt cư trú → căn → tiện ích → lượt đặt → tài khoản chia sẻ, tương thích luồng cư trú/bàn giao. BQL đổi cấu hình/duyệt/hủy chỉ khóa tiện ích → lượt → tài khoản. Mọi phép kiểm tra giao nhau và cấu hình chạy sau khóa cha tiện ích; dùng locking read để thấy các lượt đã commit khi vừa chờ khóa xong, không đọc snapshot cũ của transaction. Không dựa riêng vào bước kiểm tra trống trên frontend. Actor active/role/token, liên kết cá nhân hoặc người phụ trách căn được xác nhận lại trước ghi. Lịch sử và trạng thái cùng transaction; ghi audit lỗi rollback toàn bộ.

Khóa UUID duy nhất kèm SHA256 của input chuẩn hóa/actor/tiện ích/phiên bản cấu hình. Retry được xét trước version/policy mới, chỉ sau khi xác nhận cư trú và phiên; cùng request trả đúng ID kể cả lịch đã hủy, không hồi sinh. Metadata tên/vị trí tiện ích, người đặt và đợt cư trú giữ lúc tạo. Các lần đổi tên không viết lại lịch cũ. Không thêm khóa ngoài từ cấu hình tiện ích tới căn/cư dân gây đảo thứ tự.

Giờ đặt lưu DATETIME theo wall-clock Việt Nam, không gắn Z hoặc convert như timestamp UTC. Audit ngay_tao vẫn UTC theo cấu hình DB hiện tại. Giờ mở/đóng cùng ngày, bước 30 phút; khung [bắt đầu,kết thúc), cho phép sát giờ. Duyệt/hủy/từ chối bị chặn khi đã tới giờ bắt đầu. Chờ duyệt vẫn giữ trạng thái trong lịch sử khi quá giờ, không được coi như đã duyệt để sử dụng. Không có bộ lập lịch tự đổi trạng thái.

API lịch trống chỉ trả các ô giờ và cờ, không lộ người/căn/nội dung/mã của lịch khác. Cá nhân chỉ đọc các lượt chính tài khoản tạo; hủy phải còn cùng đợt cư trú. Tài khoản căn xem mọi lượt của căn khi còn chủ hộ phụ trách hợp lệ, và được hủy thay hộ; bàn giao ngắt phiên cũ theo module tài khoản căn hiện có. Cư dân chuyển đi vẫn đọc lịch cá nhân, không còn quyền hủy tại đợt cũ. Lịch không tự hủy theo chuyển đi, BQL/tài khoản căn quyết định trước giờ bắt đầu.

Giao diện /quan-tri/tien-ich, /quan-tri/dat-lich và đường dẫn tương ứng /cu-dan. Các request gắn path/revision, bỏ response bị hủy để không chồng lịch ngày cũ lên ngày mới. Form giữ input và UUID khi lỗi mạng/trùng lịch, đổi input tạo UUID mới. Mô tả/ghi chú được render dưới dạng văn bản thuần. Toàn bộ danh sách tiện ích/lượt đặt được phân trang 20, không cắt danh mục chọn cố định.

## Thu chi và quỹ

Module treasury và migration 013 bổ sung quy_tai_chinh, phieu_thu_chi, chung_tu_thu_chi, lich_su_thu_chi. Quỹ nhận hóa đơn mặc định là duy nhất qua generated UNIQUE, luôn hoạt động và không đổi nguồn bằng API. Quỹ tạo mới bắt đầu 0; số tiền khởi tạo được ghi bằng phiếu thu bổ sung quỹ. Migration chỉ tạo danh mục quỹ mặc định, không tạo bản ghi tài chính hoặc sửa hóa đơn đang có.

Sổ là UNION ALL phiếu DA_GHI_SO của quỹ với hóa đơn DA_THANH_TOAN của quỹ nhận hóa đơn. Tiền hóa đơn lấy trực tiếp từ bản đã xác nhận, không ghi shadow voucher, nên không cần backfill, đồng bộ kép hoặc sửa billing.service.js. Hóa đơn đã thu không được hủy/sửa qua API hóa đơn hiện tại. Ngày thu quy đổi từ timestamp UTC sang ngày Việt Nam; phiếu thủ công dùng ngày hạch toán DATE do BQL khai không tương lai. Text trong UNION được CONVERT utf8mb4 COLLATE utf8mb4_unicode_ci rõ ràng để tương thích schema cũ có collation khác, không đổi bảng cũ.

Thao tác tài chính khóa quỹ → phiếu → actor FOR SHARE. Hint quỹ của phiếu đọc ngoài transaction, quỹ/loại của phiếu không đổi; trong transaction không có consistent read trước khi khóa quỹ. Vì vậy đọc tổng số dư sau khóa luôn bắt đầu từ snapshot sau writer trước vừa commit, không dùng snapshot cũ tạo trong lúc chờ khóa. Duyệt hai phiếu chi cùng lúc chỉ thành công khi tổng không vượt số dư hiện tại. Luồng thu hóa đơn không cần khóa quỹ: chỉ thêm tiền, nên thu đồng thời có thể dẫn tới từ chối chi bảo thủ để người dùng tải lại, không tạo chi vượt quỹ. Không đưa khóa quỹ vào giao dịch căn/hóa đơn để tránh đảo thứ tự khóa các module cũ.

NHAP chưa ghi sổ, DA_GHI_SO bất biến, HUY chỉ dùng nháp. Phê duyệt là xác nhận tiền đã được BQL kiểm tra để ghi sổ, không thực hiện chuyển tiền thật. BQL có thể duyệt phiếu tự lập trong vai trò hiện tại. Đảo giữ gốc đã ghi sổ và tạo phiếu ngược chiều ngày hôm nay, UNIQUE ma_phieu_goc chặn hai lần, không đảo tiếp phiếu đảo. Gốc tăng version để báo lại người mở trang cũ. Chi hoặc đảo thu đều kiểm tra đủ quỹ hiện tại; cho phép ngày hạch toán lùi về trước nên số dư hồi tố có thể âm, giao diện nhắc kiểm tra dữ liệu. Không có khóa sổ kỳ, chuyển quỹ, ngân sách dự toán, hoàn hóa đơn đã thu hoặc kế toán kép trong bản này.

Create có UUID duy nhất và SHA256 input chuẩn hóa/actor; retry giữ ID nháp cũ kể cả đã sửa/ghi sổ/hủy, không khôi phục trạng thái. Duyệt/hủy dùng version; đảo có idempotency theo gốc + actor + lý do. Audit lưu snapshot nhập/sửa JSON trong TEXT, frontend chuyển thành diễn giải đọc được; không render HTML. Ghi lịch sử lỗi rollback cả phiếu, version, chứng từ và phiếu đảo.

Upload qua multer memory sau auth/roles/CSRF, tối đa 5 × 5 MB, whitelist JPEG/PNG/WebP/PDF theo nội dung. Ảnh sharp giới hạn pixel và re-encode; PDF không embed trong UI, tải attachment kèm CSP sandbox/nosniff. Tên tải xuống do server tạo, tên gốc hiển thị được bỏ ký tự điều khiển/đường dẫn. Binary trong MEDIUMBLOB để cùng transaction và bản sao lưu DB, không dùng thư mục ảnh phản ánh. Chuẩn hóa/SHA256 trước khóa, sau khóa kiểm tra lại NHAP/version/số lượng. Tệp đã có không thêm, upload/xóa chứng từ đều tăng version khi thực sự thay đổi. Chi cần ít nhất một tệp trước ghi sổ, sau ghi sổ giữ cả chứng từ.

Báo cáo dùng REPEATABLE READ WITH CONSISTENT SNAPSHOT, READ ONLY cho metadata/tổng/count/trang, không khóa phiếu/hóa đơn, đã kiểm tra writer ghi sổ xen giữa vẫn không lệch response. SUM DECIMAL CAST CHAR, xử lý tiền với BigInt, không Number. Summary toàn quỹ theo khoảng ngày; lọc nguồn/loại/từ khóa chỉ đổi chi tiết, chế độ tháng tổng hợp cả quỹ. API và route giao diện /quan-tri/quy, /quan-tri/phieu-thu-chi đều chỉ BQL; chứng từ luôn truy theo cặp ID phiếu/tệp. Cư dân/KTV không được xem sổ hoặc binary chứng từ.

## Xuất báo cáo tài chính

Module report-exports cung cấp reportPage và bộ dựng mô hình cho công nợ, thu phí, sổ quỹ. Các service đọc hiện có nhận tham số nội bộ exportFormat; route JSON không truyền tham số này, không lấy giới hạn từ query client. Normal page=20, export cưỡng chế page=1/offset=0, limit XLSX=10000/PDF=1000 và kiểm tra COUNT trước đọc chi tiết. SQL điều kiện/group/order/validation giống JSON, không paginate bằng nhiều request nên tổng/count/tất cả dòng trong một snapshot READ ONLY. Chỉ đọc, không tạo ảnh/chứng từ/phiếu mới; không migration.

Route xuất đặt sau auth/roles QUAN_TRI_VIEN của router tài chính/quỹ. Mỗi account một lượt tạo file, toàn tiến trình tối đa hai; finally giải phóng cả khi validation/render lỗi. Giới hạn dòng và đồng thời là giới hạn cho tiến trình hiện tại, không phải điều phối nhiều instance. Không lưu tệp vào public hoặc trả nội dung nhạy cảm qua URL ngoài. HTTP trả buffer XLSX/PDF với attachment/no-store/nosniff và X-Export-Rows; endpoint lỗi trả JSON theo middleware chung.

ExcelJS 4.4.0 tạo workbook hai sheet, các mã/điện thoại/nội dung là String, không interpret dấu =,+,-,@ thành formula. Tiền không vượt 15 chữ số được chuyển Number vì an toàn trong cả Excel/JS; tiền lớn dùng chuỗi thập phân nguyên gốc. Tổng SQL CAST CHAR và BigInt giữ nguyên, không dùng công thức SUM Excel cho tổng. PDFmake 0.2.23 và bộ Roboto TTF trong vfs_fonts nhúng tiếng Việt, header/footer, bảng nhiều trang tự lặp tiêu đề, không cắt văn bản để khớp hàng. Cả renderer được dynamic import khi xuất; không tải font hệ điều hành hoặc CDN lúc chạy. pdf-parse chỉ là devDependency để test trích nội dung PDF, không xử lý PDF người dùng tải lên, không cần Poppler trong bộ test mới.

Frontend dùng ReportExport chung: nút tải theo URL bộ lọc đã áp dụng, fetch có cookie cùng origin, kiểm tra Content-Type, chuyển Blob thành download và thu hồi URL sau thời gian ngắn. Đổi đường dẫn/bộ lọc hoặc rời màn hình sẽ abort request frontend, bỏ response cũ, không tải nhầm tệp của màn trước. Lỗi ở ngay khu xuất, giữ nguyên màn và bộ lọc. Máy chủ có thể đã bắt đầu tạo tệp trước khi client abort; chỉ giải phóng lượt khi tác vụ máy chủ kết thúc. Không window.open hoặc in HTML thay PDF. Nội dung xuất lấy từ mô hình cột cho phép, không đưa các trường ngân hàng/mật khẩu/hash/binary chứng từ vào tệp.


## Nhập / xuất danh sách theo phân hệ

Data exchange có danh mục 8 phần và whitelist cột xuất. Các list service nhận exportFormat nội bộ để dùng cùng bộ lọc/SQL với trang danh sách, đọc một tập đầy đủ với giới hạn Excel 10.000/PDF 1.000 thay vì ghép từng trang; kiểm tra COUNT trước và kiểm tra thêm một dòng sau SELECT để phát hiện vượt do cập nhật đồng thời. Renderer chung giữ số tiền, mã, Unicode và bỏ ghi đơn vị đồng trên các danh sách không phải tiền. API trao đổi dữ liệu và trang frontend chỉ BQL, nút tại danh sách dùng URL bộ lọc đã áp dụng.

Năm phần nhập thêm mới: căn hộ, cư dân và đợt đầu, phương tiện, chỉ số kỳ mới, thiết bị. Catalog định nghĩa đúng trường cho phép, không nhận role/login/password/tài khoản cá nhân hoặc quyết định duyệt. Chuẩn bị tham chiếu số căn/mã cư dân, rồi gọi lại service của màn thủ công với connection ngoài. transaction(work,connection) tái dùng transaction batch; các luồng cũ không truyền connection giữ nguyên begin/commit/rollback riêng. Giữ nguyên validation, khóa kỳ, lịch sử bảo trì, tạo/bàn giao tài khoản. Không tự xác nhận bàn giao chủ hộ đang có; số điện thoại đã có cư dân bị báo để xử lý qua màn cư trú.

Preview dùng transaction thật để kiểm tra ràng buộc và quan hệ giữa các dòng, mỗi dòng có savepoint. Trả dữ liệu nhập và lỗi, không trả credential hoặc ID thử; cuối cùng rollback cả transaction. Auto-increment có thể có khoảng trống do kiểm tra rollback, không dùng ID để suy ra số lượng hồ sơ. Không phát thông báo/đẩy file/gọi dịch vụ ngoài trong các domain write nhập. Commit yêu cầu token HMAC ngắn hạn gắn user/version/kind/filehash, chạy lại validation dưới khóa và lưu toàn lô hoặc rollback cả lô. BQL bị khóa/đổi phiên được kiểm tra lại trước commit.

014 thêm ledger chống trùng yêu cầu/file và lịch sử nhập, cùng transaction với domain data. Chỉ lưu ID/số dòng, không lưu file gốc hoặc mật khẩu rõ. Kết quả lần đầu có credential do domain service sinh để BQL bàn giao riêng, gửi lại không trả plaintext. Retry mất response phải dùng lại token/UUID/tệp; nếu đã rời màn, xem lịch sử và cấp lại mật khẩu cần thiết.

ExcelJS đọc XLSX trong worker riêng. Yauzl 3.4.0 kiểm tra trước: tối đa 1.000 entry, tổng 20 MB sau giải nén, mỗi entry 8 MB; không macro. Nhận scalar/date, báo lỗi công thức/linked/rich cell, header đúng mẫu, 1–100 dòng dữ liệu. PDF-lib đọc AcroForm từ mẫu được tạo bằng chính PDF-lib/fontkit/Roboto có sẵn trong pdfmake. PDF biểu mẫu tối đa 10 trang, 120 field; field đúng namespace/phân hệ; không OCR/trích text đoán cột, không thực thi JavaScript PDF hay tải URL. Worker có heap 128 MB và thời hạn 15 giây, đầu vào tối đa 5 MB, không ghi file vào thư mục công khai. pdf-parse vẫn chỉ dùng trong test đọc PDF xuất.

Slot đọc/ghi tệp dùng chung giới hạn renderer một/account, hai/process, giữ slot đến khi tác vụ máy chủ hoàn tất. Các API xuất báo cáo tài chính giữ snapshot riêng như trước; danh sách module lấy dữ liệu mới tại SELECT và tổng số dòng xuất từ chính tập trả về. Trang import không ghi draft/credential vào localStorage. Đổi phần dữ liệu tạo panel mới, bỏ bản xem trước/tệp/token cũ; đổi tệp bắt buộc xem trước lại.


## Tổng quan vận hành

Dashboard BQL thay trang tổng quan chỉ phản ánh. Module backend dashboard có một API /api/tong_quan, kiểm tra BQL và đọc một connection trong snapshot chỉ đọc; UTC_TIMESTAMP và ngày/giờ Việt Nam lấy chung đầu transaction. Các aggregate tài chính CAST CHAR giữ tiền chính xác, frontend BigInt/locale vi-VN; count/queues không ghép dữ liệu từ nhiều request khác thời điểm. Thu theo ngày xác nhận, công nợ theo trạng thái đã gửi còn nợ, không tự cộng phiếu quỹ thủ công vào thu hóa đơn.

Hàng đợi bốn nhóm tối đa 5 mục, có whitelist cột và thứ tự ưu tiên rõ. Không trả mật khẩu, token, dữ liệu tra cứu QR, ngân hàng hoặc liên hệ khách. Truy vấn đọc không khóa đối tượng nghiệp vụ hoặc tạo side effect. Test xen một INSERT phản ánh sau truy vấn tài chính để chứng minh các nhóm còn lại giữ cùng snapshot và chỉ đổi ở lần tải tiếp theo.

Frontend Dashboard riêng và CSS có prefix overview, thay import Dashboard cũ từ Reports; Reports giữ danh sách/chi tiết và thêm virtual filter DANG_MO chỉ cho đọc, repository vẫn AND scope người gửi/phụ trách. Hook tổng quan gắn kết quả với revision, abort request cũ, bỏ dữ liệu khi tải mới/lỗi, có retry thủ công. BQL xem các thẻ và điều hướng sang màn xử lý có quyền hiện có; không thêm luồng duyệt/thu tiền trong dashboard. Không migration hoặc dependency mới.

Biểu đồ dùng module dashboard-statistics và API /tong_quan/thong_ke chỉ BQL, truy vấn aggregate có khoảng giới hạn trong một snapshot chỉ đọc. Range builder chia lịch bằng UTC date container, quy đổi ranh giới sang UTC khi đọc timestamp; DATETIME đặt lịch vẫn là giờ Việt Nam. DATE hạn trả/ngày lập không được biến thành sự kiện giờ: ở chế độ ngày chỉ trả tổng riêng hai trường này. Không tính số dư lịch sử bằng trạng thái hiện tại; biểu đồ công nợ ghi rõ theo hạn trả hiện tại.

DashboardCharts tách riêng, CSS trend/trends, vẽ SVG theo tỷ lệ BigInt (chỉ đổi tỷ lệ 0–1 sang Number), số gốc và bảng giữ chính xác nguyên đồng. Các cột có focus, phím mũi tên/Home/End, chạm/rê chuột; bảng có caption và tổng. Cuộn ngang nằm trong biểu đồ/bảng trên điện thoại. Bộ lọc biểu đồ tồn tại độc lập khi Tổng quan refresh; mỗi request có key gồm khoảng/ngày/revision. Không thư viện biểu đồ hoặc migration mới.

Biểu đồ có collapse mặc định và chọn nhóm, chỉ fetch khi expanded và còn nhóm được chọn; thu gọn/hide-all abort request và bỏ state, mở lại đọc mới. Preferences localStorage key `chung-cu:dashboard-charts:v1:<userId>` chỉ chứa expanded, danh sách nhóm và kiểu vẽ đã kiểm tra allowlist, không lưu dữ liệu nghiệp vụ; auth đổi user remount panel. Storage bị chặn vẫn dùng state trong phiên. Kiểu mặc định: finance đường, incidents cột, maintenance miền không cộng dồn, bookings donut. Các chuỗi dòng chảy không dùng pie vì không loại trừ nhau; chỉ bookings có pie/donut theo tổng các trạng thái trong kỳ. Bảng vẫn theo thời gian. Tỷ lệ vẽ BigInt; pie 0 có vòng trống, 1 nhóm vẽ đủ vòng, không gán tỷ lệ giả cho trạng thái 0. Nhãn tổng và bảng giữ số gốc.

## Lập bản nháp hóa đơn hàng loạt

015 thêm ledger dot_lap_hoa_don với UNIQUE(actor,UUID) và kết quả JSON không bí mật. BQL chọn tường minh 1–50 ID, chuẩn hóa sắp tăng dần. Xem trước khóa các căn theo thứ tự trước khi khóa nguồn phí, chỉ gọi prepareDraft dùng chung với lập đơn lẻ, không INSERT hóa đơn/chi tiết/audit hoặc tiêu thụ số hóa đơn. Giao dịch xem trước luôn rollback và nhả khóa. Lỗi thiếu chỉ số/giá, hóa đơn còn hiệu lực hoặc cần lập thay thế được trả theo căn; batch yêu cầu mọi căn không lỗi, khác luồng nháp đơn lẻ vẫn cho xem/sửa nháp chưa đủ dữ liệu.

Token xem trước HMAC RAM, hạn 15 phút, gắn actor/token-version, hash input chuẩn hóa và hash toàn bộ bảng báo giá. Xác nhận khóa ledger để serialize retry, khóa căn tăng dần, tính lại và so hash trước khi ghi; dữ liệu đổi hoặc có lỗi rollback toàn bộ, không tự bỏ qua căn. Mỗi nháp dùng generate với connection ngoài để giữ cùng cách tính, snapshot và audit của luồng cũ. Recheck actor active/role/token ở trong giao dịch. Audit lỗi ở căn sau rollback cả các căn trước và ledger. Tiền vẫn BigInt/string nguyên đồng.

Ledger chỉ commit cùng mọi hóa đơn mới, giữ ID căn/hóa đơn và tổng đã tạo. Cùng actor/UUID/input trả lại kết quả dù token cũ hết hạn hoặc server restart; khác input cùng UUID bị từ chối. Đổi UUID không vượt UNIQUE(căn,kỳ,hiệu lực); đợt giao nhau nhận 409 thay vì ghi trùng. Không tự lập thay thế cho căn đã có hóa đơn hủy; vẫn dùng thao tác từ chi tiết hóa đơn hủy gần nhất. Không tự duyệt, gửi, nhắc hoặc ghi nhận thu.

BatchBills nằm trong màn hóa đơn BQL, chọn qua tìm kiếm/phân trang, giữ ID đã chọn độc lập với danh sách đang xem. Thay đầu vào bỏ bản xem trước/token; lỗi 409 yêu cầu xem trước lại, lỗi mạng khi xác nhận giữ UUID/token để retry an toàn. Không lưu hóa đơn hoặc token vào localStorage. Dùng newRequestKey có fallback LAN HTTP. Các thao tác đóng biểu mẫu bị khóa khi đang xử lý; API vẫn đảm bảo không trùng nếu người dùng rời trang hay mất kết nối.

## Duyệt và gửi hóa đơn hàng loạt

016 thêm dot_xu_ly_hoa_don, tách ledger lập nháp. Batch thao tác chứa DUYET/GUI, 1–50 cặp ID/version không lặp và thông tin nhận tiền chuẩn hóa nếu GUI. Chỉ BQL, CSRF và kiểm tra actor/token trong transaction. Dùng lại HMAC/hash/actor helpers từ module batch lập và prepareBillAction/paymentDetails từ billing.service để tránh lệch điều kiện đơn lẻ. List hóa đơn bổ sung phien_ban vào whitelist trả về; dữ liệu xuất vẫn theo cột đã cấu hình.

Xem trước đọc hint căn từ ID, khóa tất cả căn tăng dần rồi hóa đơn theo căn/ID trước kiểm tra nguồn phí; không ghi trạng thái/audit. DUYET kiểm tra version, NHAP, dữ liệu/tiền dương, source hash và saved-line digest như cũ. GUI kiểm tra version/DA_DUYET, hạn từ hôm nay và không trước ngày chốt, định dạng ngân hàng/tài khoản; giữ snapshot tiền đã duyệt. Giá/diện tích nguồn đổi sau duyệt không tự tính lại ở bước gửi. Token gắn actor/version/input/hình chụp các dòng và hạn 15 phút. Xác nhận tính lại, hash/phiên bản/trạng thái đổi thì không xử lý căn nào. action() nhận connection ngoài, mọi chuyển trạng thái/version/audit dùng cùng transaction.

Ledger UNIQUE(actor,UUID) serialize retry; input khác cùng UUID trả 409. Replay thành công trả receipt cũ trước kiểm tra token/hạn tương đối, không đổi trạng thái hiện tại dù hóa đơn đã thu/hủy sau đó. JSON kết quả ghi rõ trang_thai_luc_xu_ly và chỉ ID/số căn/hóa đơn/tổng. Normalize hạn gửi vẫn kiểm tra ngày thật, còn hạn >= hôm nay được kiểm tra khi xử lý mới; vì vậy replay không bị chặn khi hạn cũ đã qua. Lỗi audit ở hóa đơn thứ hai rollback cả hóa đơn đầu và ledger. Hai thao tác có input/token/UUID riêng, không gộp tự duyệt rồi gửi.

BatchBillActions nằm trong màn hóa đơn, lọc theo trạng thái phù hợp; chọn nhiều trang giữ version lúc chọn. Nút Tải lại và chọn lại bỏ ID/version cũ. Thay thao tác/thông tin nhận tiền bỏ xem trước; đổi tìm kiếm/kỳ vẫn giữ lựa chọn và liệt kê số hóa đơn đã chọn. Tất cả phải hợp lệ hoặc người dùng bỏ hóa đơn lỗi rồi xem lại; lỗi mạng giữ UUID/token để retry. Gửi cập nhật trạng thái hiển thị trên web và VietQR như API đơn lẻ, không ghi nhận thanh toán hoặc tự phát nhắc phí.
