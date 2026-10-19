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

Chưa triển khai lập hóa đơn hàng loạt và các nghiệp vụ thanh toán mở rộng. Những bảng nghiệp vụ tiếp theo phải được bổ sung bằng migration mới, giữ lịch sử và áp dụng quyền theo đợt cư trú theo bản rà soát. Không dùng SQL cũ trong tài liệu thiết kế làm migration cho database đang chạy.


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
