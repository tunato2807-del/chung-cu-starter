h(1,'CHƯƠNG 3. CÀI ĐẶT THỬ NGHIỆM, KẾT QUẢ VÀ ĐÁNH GIÁ')
h(2,'3.1. MÔI TRƯỜNG PHÁT TRIỂN VÀ CÔNG CỤ CÀI ĐẶT')
h(3,'3.1.1. Môi trường và phiên bản được kiểm chứng')
p('Đề cương dự kiến phát triển trên Windows 11 với Visual Studio Code. Bộ bằng chứng được dùng trong báo cáo này được chạy lại trên môi trường Linux x86_64 ngày 17/11/2026; đây không phải số đo cấu hình máy cá nhân của sinh viên. Các phiên bản thư viện lấy từ package-lock.json, phiên bản Node lấy từ tiến trình thực thi và phiên bản MySQL lấy từ SELECT VERSION(). Không suy ra hiệu năng hệ thống từ các thông tin này khi chưa cố định cấu hình CPU/RAM và tải thử.')
lock=json.loads((R/'package-lock.json').read_text())['packages']
vr=lambda k:lock['node_modules/'+k]['version']
tb('Môi trường dùng cho lần kiểm chứng báo cáo',['Thành phần','Phiên bản / thông tin','Vai trò'],[
['Hệ điều hành','Linux x86_64','Môi trường kiểm chứng đám mây'],['Node.js / npm','24.22.1 / theo môi trường cài đặt','Chạy backend, build và test'],['MySQL','8.4.13; InnoDB','Database kiểm thử riêng chung_cu_test'],['React / Vite',vr('react')+' / '+vr('vite'),'Giao diện và bản dựng'],['Express / mysql2',vr('express')+' / '+vr('mysql2'),'API và truy vấn MySQL'],['html5-qrcode / qrcode',vr('html5-qrcode')+' / '+vr('qrcode'),'Quét và dựng ảnh QR'],['jose / multer / sharp',vr('jose')+' / '+vr('multer')+' / '+vr('sharp'),'JWT, multipart và chuẩn hóa ảnh'],['Playwright',vr('@playwright/test'),'Kiểm thử trình duyệt tự động']
], 'Nguồn: package-lock.json, Node.js đang chạy và truy vấn phiên bản MySQL ngày 17/11/2026.')
h(3,'3.1.2. Cài đặt và cấu hình chạy thử')
p('Dự án sử dụng npm workspaces cho frontend và backend. Từ thư mục gốc, npm ci --include=dev cài đúng khóa phụ thuộc; npm run init:local tạo cấu hình nếu chưa có; các bước MySQL thực hiện theo README. Với máy đã có dữ liệu, cần tạo database đích mới và làm đúng hướng dẫn chuyển dữ liệu, không chạy seed để thay nội dung cũ. Báo cáo không ghi mật khẩu, JWT secret hoặc tệp cấu hình thật.',
'Backend chạy bằng npm run dev:backend, mặc định cổng 3000; frontend chạy bằng npm run dev:frontend, thường dùng cổng 5173. Vite chuyển /api đến backend. /api/health là kiểm tra tiến trình sống và không kiểm tra database; /api/ready mới kiểm tra kết nối cùng baseline schema. Hai kết quả có mục đích khác nhau: “Web mở được” không đồng nghĩa schema đã sẵn sàng.',
'Khi dùng điện thoại thật, origin phải là địa chỉ điện thoại truy cập được. Để dùng camera trong trang cần HTTPS được thiết bị tin cậy và quyền camera [6]. localhost của điện thoại là chính điện thoại, không phải máy tính đang chạy server. QR đã in bằng một IP cũ không phải bằng chứng rằng đường mạng mới còn đúng; cần đối chiếu origin và token ở máy chủ hiện tại.')
code('Các lệnh chính trên một môi trường mới', '''npm ci --include=dev
npm run init:local
npm run db:up
npm run db:migrate
npm run setup:admin
npm run dev:backend
# Terminal thứ hai:
npm run dev:frontend''')
p('db:up chỉ áp dụng khi dùng Docker Compose theo README; máy đã có dịch vụ MySQL dùng cấu hình kết nối tương ứng. setup:admin cấp tài khoản quản trị ban đầu cho database mới và lưu thông tin bàn giao ở storage cục bộ. Không đưa tệp bàn giao chứa thông tin đăng nhập vào báo cáo hoặc GitHub.')

h(2,'3.2. CÀI ĐẶT VÀ HIỆN THỰC HÓA HỆ THỐNG')
h(3,'3.2.1. Hiện thực cơ sở dữ liệu và dữ liệu thử')
p('Baseline database/thesis-mysql/001_thesis_schema.sql là nguồn tạo schema mới. Runner theo dõi tên và checksum trong schema_migrations, giúp phát hiện khác biệt với bản đã áp dụng. Bản hiện tại dùng 31 bảng thật và 8 view lịch sử. Các trang dữ liệu không trực tiếp ghi vào view lịch sử; service gọi hàm appendHistory trong cùng giao dịch với nghiệp vụ.',
'Dữ liệu mô phỏng và dữ liệu kiểm thử được tách khỏi dữ liệu sử dụng. npm test và npm run test:e2e chọn chung_cu_test, cài fixture và chạy tuần tự. Mục đích của fixture là tạo các trường hợp có thể lặp lại: căn, cư dân, tài khoản, QR, hóa đơn và trạng thái liên quan. Ảnh minh họa trong báo cáo dùng dữ liệu thử; không phải hồ sơ cư dân của một chung cư đã triển khai.',
'Thiết kế vật lý bổ sung cho sơ đồ chương 2 bằng kiểu dữ liệu, chỉ mục, CHECK và các cột sinh. Ví dụ tang_toa_nha dùng khóa ghép; can_ho tham chiếu cặp khối/tầng; hóa đơn giữ ràng buộc duy nhất cho bản còn hiệu lực. Việc đếm bảng bao gồm cả bảng kỹ thuật; tám view lịch sử không cộng thêm vào 31 bảng vật lý. Phụ lục 2 liệt kê cấu trúc đủ để đối chiếu với mã SQL.')
h(3,'3.2.2. Backend RESTful API và cơ chế xác thực')
p('Express route xác định phương thức/đường dẫn, gắn middleware và gọi service; repository hoặc service thực hiện truy vấn có tham số. Cách phân tách phù hợp vai trò routing và middleware của Express [1]. JSON được giới hạn kích thước ở đầu ứng dụng; ảnh dùng multipart với giới hạn riêng. Lỗi trả mã, thông báo, lỗi trường khi có và request ID để đối chiếu.',
'JWT được ký HS256 bằng jose, có issuer, audience, thời hạn tám giờ và phiên bản tài khoản. Token nằm trong cookie HttpOnly, SameSite=Strict; thuộc tính Secure phụ thuộc cấu hình HTTPS. Mỗi lần xác thực, máy chủ đọc lại tài khoản để kiểm tra trạng thái và phiên bản. Cách làm này cho phép khóa tài khoản, đổi mật khẩu hoặc đăng xuất làm mất hiệu lực phiên trước, phù hợp yêu cầu kiểm tra quyền ở mọi yêu cầu [9].')
code('Đoạn phát JWT trong auth.service.js (trích mã nguồn)', '''const token = await new SignJWT({ version: user.phien_ban_token })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(String(user.ma_nguoi_dung))
  .setIssuer("chung-cu")
  .setAudience("chung-cu-web")
  .setIssuedAt()
  .setExpirationTime("8h")
  .sign(secret());''')
tb('Các API tiêu biểu của luồng cốt lõi',['Phương thức và đường dẫn (sau /api)','Quyền','Chức năng'],[
['POST /xac_thuc/dang_nhap','Công khai','Xác minh và tạo phiên'],['GET /xac_thuc/toi','Đã đăng nhập','Đọc danh tính hiện tại'],['GET, POST /vi_tri_qr','BQL','Danh sách / tạo vị trí'],['POST /vi_tri_qr/:id/sinh_lai_qr','BQL','Thu hồi token cũ, cấp token mới'],['PUT /vi_tri_qr/:id/thiet_bi','BQL','Đổi liên kết thiết bị'],['GET /cong_khai/vi_tri_qr/:token','Công khai','Tra vị trí với tập trường tối thiểu'],['POST /cong_khai/phan_anh','Công khai / Cư dân','Gửi multipart, chống gửi lặp'],['POST /cong_khai/phan_anh/tra_cuu','Công khai','Tra bằng mã riêng và SĐT'],['GET /phan_anh; GET /phan_anh/:id','Theo phạm vi tài khoản','Danh sách / chi tiết'],['PATCH /phan_anh/:id/phan_cong','BQL','Giao hoặc giao lại công việc'],['PATCH /phan_anh/:id/trang_thai','BQL / KTV theo quy tắc','Chuyển trạng thái và ghi lịch sử'],['POST /hoa_don/lap','BQL','Lập nháp một hóa đơn'],['POST /hoa_don/:id/duyet; /gui','BQL','Duyệt / gửi theo trạng thái'],['POST /hoa_don/:id/xac_nhan_thanh_toan','BQL','Ghi nhận thu sau đối soát'],['GET /cua_toi/hoa_don/:id','Cư dân có quyền','Chi tiết hóa đơn và payload QR'],['GET /cua_toi/thong_bao','Cư dân có quyền','Đọc hộp thông báo Web']
], 'Nguồn: backend/src/app.js và các tệp *.routes.js tại commit ứng dụng cceb904. Đây là bảng đại diện, không thay thế toàn bộ hợp đồng API.')
p('Các API theo lô có bước xem trước và xác nhận riêng. Token xem trước gắn với người thao tác, đầu vào và dữ liệu nguồn; server kiểm lại dưới khóa trước khi ghi. Nếu dữ liệu đổi, trả xung đột để xem lại thay vì dùng báo giá cũ. Khóa yêu cầu theo lô giúp nhận lại kết quả khi response bị mất, không tạo thêm hóa đơn hoặc sự kiện thu tiền.')
h(3,'3.2.3. Sinh QR, nhận ảnh và xử lý phản ánh')
p('Khi tạo vị trí, service kiểm loại và liên kết thiết bị rồi lưu token. Frontend tạo URL theo origin đang mở, dùng qrcode dựng ảnh để xem/tải/in [10]. API công khai không trả mã nội bộ tùy ý hoặc toàn bộ hồ sơ thiết bị. Khi người gửi xác nhận, server lấy lại thiết bị từ vị trí và ghi snapshot mã/tên/vị trí tại thời điểm gửi.',
'Multer nhận tối đa năm tệp; Sharp giải mã JPEG/PNG/WebP tĩnh, kiểm số điểm ảnh, xoay theo hướng ảnh và tạo JPEG đã loại metadata. Tên tệp lưu được sinh ngẫu nhiên, không dùng tên gốc. Ảnh không được mount công khai thành một thư mục tĩnh; endpoint đọc ảnh kiểm tra quyền trên phản ánh trước khi trả tệp. Ảnh đã chuẩn bị được xóa nếu giao dịch lưu thất bại.')
code('Giới hạn multipart và xử lý ảnh (trích rút gọn từ images.js)', '''const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 5 * 1024 * 1024,
    fields: 20, fieldSize: 10000, parts: 25 }
}).array("hinh_anh", 5);
// Mỗi tệp được Sharp giải mã với limitInputPixels: 25_000_000.
// Chỉ nhận jpeg/png/webp tĩnh, rồi xuất JPEG và đổi tên ngẫu nhiên.''')
h(3,'3.2.4. Frontend, cửa sổ thao tác và tích hợp camera')
p('frontend/src/app ghép router, điều hướng và bố cục; frontend/src/features chứa các màn theo nghiệp vụ; frontend/src/shared chứa component và API client dùng chung. React component quản lý trạng thái nhập, đang tải và lỗi, tương ứng cách tổ chức giao diện bằng component và state trong tài liệu React [4]. Backend giữ quyền quyết định cuối cùng; thay đổi state ở trình duyệt không đủ để đổi trạng thái nghiệp vụ.',
'Các màn thêm/sửa, chi tiết và lịch sử sử dụng cửa sổ thao tác chung. Cửa sổ đặt focus khi mở, giữ focus trong phạm vi, đóng bằng nút hoặc Esc khi điều kiện cho phép và trả focus về vị trí trước đó. Trạng thái đang gửi khóa nút để hạn chế thao tác lặp ở giao diện, trong khi idempotency và ràng buộc MySQL vẫn xử lý trường hợp mạng hoặc người dùng gửi lại.',
'Camera quét QR chỉ khởi động sau thao tác người dùng. Cấu hình hiện tại ưu tiên camera sau, 8 khung/giây và vùng nhận diện 220 px. Khi rời màn hình hoặc quá trình khởi động kết thúc sau khi component đã bị tháo, scanner được dừng. Các giá trị này là cấu hình mã nguồn, không phải tốc độ nhận diện thực tế được đo trên điện thoại [3], [6].')
code('Khởi động bộ quét trong PublicReports.jsx (trích rút gọn)', '''const { Html5Qrcode } = await import("html5-qrcode");
scanner.current = new Html5Qrcode("qr-reader");
await scanner.current.start(
  { facingMode: "environment" },
  { fps: 8, qrbox: 220 },
  (value) => { open(value); },
  () => {}
);
// open() kiểm tra URL trước khi điều hướng; có xử lý lỗi và cleanup.''')

h(2,'3.3. KẾT QUẢ GIAO DIỆN VÀ CÁC PHÂN HỆ ĐÃ XÂY DỰNG')
p('Các hình dưới đây được chụp từ giao diện mã nguồn hiện tại với dữ liệu mô phỏng hoặc database kiểm thử riêng. Chúng minh họa kết quả hiện thực màn hình, không phải bằng chứng đã đưa vào vận hành ở một chung cư thật. Ảnh fixture chỉ kiểm lớp trình bày; kết quả nghiệp vụ được xác nhận riêng bằng bộ kiểm thử MySQL và trình duyệt ở mục 3.4.')
h(3,'3.3.1. Kết quả phân hệ Ban quản lý')
blocks.append(dict(kind='ui',key='dang-nhap',title='Biểu mẫu đăng nhập của hệ thống',description='Biểu mẫu sử dụng định danh tài khoản và mật khẩu; không có đăng ký công khai hoặc nút chọn vai trò giả lập. Ảnh chỉ chụp vùng biểu mẫu, không chứa ảnh trang trí bên ngoài. Phiên và quyền thực tế được API kiểm tra sau đăng nhập.'))
blocks.append(dict(kind='ui',key='tong-quan',title='Màn hình tổng quan vận hành của Ban quản lý',description='Các nhóm số liệu tài chính, phản ánh và công việc tạo điểm vào cho các thao tác. Tổng quan đọc số liệu theo một snapshot, không tự thu tiền hay phát hành thông báo. Ảnh dùng dữ liệu kiểm thử, các con số không phải thống kê của một chung cư đang vận hành.'))
blocks.append(dict(kind='ui',key='cu-dan',title='Danh sách hồ sơ cư dân',description='Danh sách trình bày thông tin cần thiết để tra cứu và mở chi tiết. Quan hệ với căn hộ được quản lý qua các đợt cư trú, thay vì ghi đè lịch sử khi chuyển đi. Tên và số điện thoại trong ảnh là dữ liệu mô phỏng.'))
blocks.append(dict(kind='ui',key='them-can-desktop',title='Cửa sổ thêm căn hộ trên máy tính',description='Thao tác thêm mở thành một cửa sổ riêng với trường căn hộ, khối, tầng và diện tích. Danh sách phía sau giữ ngữ cảnh để người dùng quay lại sau khi đóng. Kiểm tra trường và API vẫn là bước quyết định chấp nhận dữ liệu.'))
blocks.append(dict(kind='ui',key='them-can-mobile',title='Cửa sổ thao tác căn hộ ở màn hình hẹp',description='Cùng biểu mẫu được xếp theo chiều dọc để dùng ở viewport hẹp. Đây là ảnh trình duyệt mô phỏng kích thước màn hình, không được gọi là ảnh chụp điện thoại vật lý. Bộ kiểm thử kiểm tra khả năng đóng, focus và giữ ngữ cảnh danh sách [5].'))
blocks.append(dict(kind='ui',key='qr',title='Xem trước và xuất mã QR vị trí',description='QR biểu diễn liên kết mở biểu mẫu theo vị trí đã được tạo. BQL có thể xem, tải hoặc in; ảnh minh họa dùng origin thử tạm thời và không phải mã đưa vào sử dụng. Mã in thật cần địa chỉ Web ổn định mà điện thoại truy cập được.'))
blocks.append(dict(kind='ui',key='xu-ly',title='Chi tiết phản ánh và thao tác xử lý',description='Màn chi tiết tập trung thông tin phản ánh, trạng thái và hành động theo vai trò. Luồng kiểm thử tạo phản ánh công khai, phân công KTV, nộp kết quả và nghiệm thu. Dữ liệu trong ảnh được tạo riêng cho kiểm thử, không phải hồ sơ khiếu nại thật.'))
h(3,'3.3.2. Kết quả phân hệ cư dân và giao diện di động')
blocks.append(dict(kind='ui',key='phan-anh',title='Biểu mẫu phản ánh theo QR trên màn hình di động',description='Vị trí đã được nhận diện từ token được hiển thị phía trên biểu mẫu. Người gửi nhập nội dung, thông tin liên hệ và ảnh; không cần cài ứng dụng riêng. Ảnh này minh họa form ở viewport 375 px, không chứng minh đã thử camera thật hoặc đã gửi dữ liệu qua backend.'))
blocks.append(dict(kind='ui',key='vietqr',title='Cửa sổ thanh toán và mã VietQR trong luồng kiểm thử',description='Màn hình hiển thị tổng số tiền và QR từ thông tin hóa đơn được phép xem. QR phục vụ nhập thông tin chuyển khoản; thao tác đọc hoặc quét không xác nhận tiền đã đến tài khoản. Thông tin nhận tiền trong hình thuộc dữ liệu thử và không được dùng để thanh toán thật.'))
p('Ngoài các màn hình minh họa, mã nguồn có thông báo/biên nhận đọc, báo cáo công nợ và thu phí, bảo trì thiết bị, đặt lịch tiện ích, quỹ và trao đổi dữ liệu Excel/PDF. Mỗi phần dùng các route và kiểm tra nghiệp vụ riêng. Các phần mở rộng này được kiểm thử trong bộ tích hợp, nhưng không biến phạm vi đề tài thành một giải pháp kế toán, hệ thống ngân hàng hoặc sản phẩm nhiều chung cư.')

h(2,'3.4. KIỂM THỬ HỆ THỐNG VÀ ĐÁNH GIÁ')
h(3,'3.4.1. Phương pháp, dữ liệu và kết quả chạy lại')
p('Kiểm chứng được chia thành bốn mức. Build kiểm tra tạo bản dựng frontend. Bộ backend kiểm tra nghiệp vụ trên MySQL riêng. Bộ UI dùng API giả lập để thử cửa sổ, ảnh, camera giả và trạng thái lỗi. Bộ end-to-end (E2E) chạy trình duyệt cùng backend để kiểm các luồng tích hợp. Các bộ dùng database được chạy tuần tự, không cùng ghi một bộ dữ liệu thử.',
'API giả lập (fixture) cho phép chủ động tạo phản hồi thành công, chờ hoặc hết phiên. Kết quả UI đạt không đủ khẳng định database đã lưu đúng. Ngược lại, test service đạt không bảo đảm mọi màn hình dùng được trên thiết bị. Playwright mô phỏng viewport và điều kiện trình duyệt, nhưng không thay thế cảm biến ảnh, ống kính và môi trường ánh sáng thực [5].')
log=(B/'kiem-chung/e2e-tests.txt').read_text()
m=re.search(r'(\d+) passed \(',log)
e2e_pass=int(m.group(1)) if m else None
failed=re.search(r'(\d+) failed',log)
assert e2e_pass is not None,'Cần đọc kết quả E2E trước khi lập báo cáo'
e2e_fail=int(failed.group(1)) if failed else 0
tb('Kết quả kiểm chứng tự động ngày 17/11/2026',['Nhóm','Lệnh / phạm vi','Kết quả thực tế','Giới hạn'],[
['Bản dựng','npm run build','Thành công; 171 mô-đun; có cảnh báo chunk > 500 kB','Không xác nhận nghiệp vụ hoặc tốc độ tải trên mạng thật'],
['Backend/MySQL','npm test','227/227 đạt; 0 bỏ qua','Dữ liệu thử, không phải nghiệm thu chung cư thực tế'],
['UI với fixture','npm run test:ui','48/48 đạt','Không dùng database; có camera/ảnh giả lập'],
['E2E','npm run test:e2e',str(e2e_pass)+'/'+str(e2e_pass+e2e_fail)+' đạt; '+str(e2e_fail)+' quá thời gian chờ tải Excel','Có một lần timeout; không phải thử QR vật lý đa máy'],
['Chạy lại xuất tệp','report-exports.spec.js','2/2 đạt ở 1440 và 375 px','Giữ cả log lần đầu để theo dõi độ ổn định']
], 'Nguồn: các log build.txt, backend-tests.txt, test-ui.txt và e2e-tests.txt được lưu kèm báo cáo. Không cộng số bài giữa các bộ vì có tình huống giao nhau.')
p('Lần chạy E2E đầy đủ có 95 bài đạt và một bài chưa đạt do chờ sự kiện tải Excel quá 10 giây khi chuyển sang báo cáo thu phí ở viewport 1440 px. Kết quả này được giữ nguyên trong log, không đổi thành đạt. Phạm vi lỗi nằm ở lần tải xuống; chưa đủ bằng chứng kết luận đó là lỗi sản phẩm hay vấn đề thời điểm kiểm thử. Khi chạy lại riêng report-exports.spec.js, cả hai cấu hình 1440 px và 375 px đều đạt (2/2). Kết quả chạy lại không xóa lần timeout đầu; cần tiếp tục theo dõi tính ổn định của thao tác tải xuống. Build hoàn thành trong môi trường kiểm chứng, đồng thời Vite cảnh báo một chunk sau minify lớn hơn 500 kB. Đây là điểm cần tối ưu tải, không bị che bằng việc chỉ ghi “build đạt”. Bộ backend kiểm tra ràng buộc, quyền, thử lại, giao dịch và một số cạnh tranh đồng thời. Kết quả không xác lập một SLA hoặc chứng nhận an toàn thông tin cho môi trường production.')
h(3,'3.4.2. Ma trận kiểm thử chức năng và ngoại lệ')
p('Các bảng sau chọn các tình huống đại diện để truy vết đủ nhóm yêu cầu chính. “Đạt” là kết quả tự động của bộ kiểm thử được chỉ ra, không phải xác nhận sử dụng của cư dân. Danh sách đầy đủ tên bài và kết quả nằm trong log; không dùng số lượng ca đại diện trong bảng để thay số lượng bài đã chạy.')
cases=[
['KT01','CN01: đăng nhập','Tài khoản đúng/sai','Đúng được vào; sai bị từ chối','Đúng kỳ vọng (backend)','Đạt'],
['KT02','CN01: thu hồi phiên','Khóa/đổi mật khẩu/đăng xuất','Token cũ mất quyền','Đúng kỳ vọng (backend)','Đạt'],
['KT03','CN02: cấu trúc','Khối/tầng chưa có căn','Sơ đồ vẫn giữ mục rỗng','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT04','CN03: cư trú','Chuyển căn/kết thúc đợt','Giữ lịch sử; thu hồi scope cũ','Đúng kỳ vọng (backend)','Đạt'],
['KT05','CN03: bàn giao','Đổi người phụ trách căn','Phiên cũ mất hiệu lực','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT06','CN04: phương tiện','Đăng ký/chuyển xe qua kỳ chốt','Không sửa nguồn đã chốt','Đúng kỳ vọng (backend)','Đạt'],
['KT07','CN05: QR','Tạo, đổi liên kết, thay token','Snapshot cũ giữ; mã cũ thu hồi','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT08','CN06: phản ánh','QR hợp lệ + nội dung + ảnh','Lưu một phản ánh và biên nhận','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT09','CN06: gửi lại','Cùng khóa, cùng nội dung','Trả kết quả cũ, không thêm bản','Đúng kỳ vọng (backend)','Đạt'],
['KT10','CN06: nội dung đổi','Cùng khóa, khác nội dung','Từ chối xung đột','Đúng kỳ vọng (backend)','Đạt'],
['KT11','CN06: giới hạn','Quá số lần gửi theo SĐT/IP','Từ chối; replay không tính thêm','Đúng kỳ vọng (backend)','Đạt'],
['KT12','CN07: phân công','BQL giao và giao lại KTV','Người cũ mất quyền ngay','Đúng kỳ vọng (backend/E2E)','Đạt']]
tb('Kiểm thử nhóm tài khoản, dữ liệu nền và tiếp nhận',['Mã','Chức năng','Đầu vào','Mong đợi','Thực tế','Trạng thái'],cases)
tb('Kiểm thử xử lý, tài chính, thông báo và giao diện',['Mã','Chức năng','Đầu vào','Mong đợi','Thực tế','Trạng thái'],[
['KT13','CN07: hoàn thành','Thiếu ảnh mới của lượt xử lý','Không nhận hoàn thành','Đúng kỳ vọng (backend)','Đạt'],
['KT14','CN07: nghiệm thu','Nộp kết quả, trả lại, nộp lại','Đúng lượt và đúng trạng thái','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT15','CN08: công khai','Mã riêng + SĐT đúng/sai','Đúng trả whitelist; sai không lộ','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT16','CN09: hóa đơn','Căn/kỳ đã có bản hiệu lực','Không tạo hóa đơn trùng','Đúng kỳ vọng (backend)','Đạt'],
['KT17','CN09: giá đổi','Nguồn thay sau lập nháp','Chặn duyệt dữ liệu cũ','Đúng kỳ vọng (backend)','Đạt'],
['KT18','CN09: lô lỗi','Một hóa đơn trong lô sai','Rollback toàn bộ lần xác nhận','Đúng kỳ vọng (backend)','Đạt'],
['KT19','CN10: quyền hóa đơn','Cư dân chuyển đi; ID trực tiếp','Không đọc hóa đơn ngoài scope','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT20','CN10–11: VietQR','Xem QR, xác nhận thu có quyền','Xem không đổi trạng thái thu','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT21','CN11: báo cáo','Nhiều dòng chi tiết/đồng chủ','Không nhân tổng; snapshot đúng','Đúng kỳ vọng (backend)','Đạt'],
['KT22','CN12: thông báo','Phát hành/thu hồi/đánh dấu đọc','Đúng người nhận và receipt','Đúng kỳ vọng (backend/E2E)','Đạt'],
['KT23','PC02: lỗi nhật ký','Cố ý gây lỗi audit','Trạng thái và lịch sử rollback','Đúng kỳ vọng (backend)','Đạt'],
['KT24','PC03–04: cửa sổ','Esc, focus, chờ ghi, hết phiên','Đóng đúng; không lộ bản ghi cũ','Đúng kỳ vọng (UI)','Đạt'],
['KT25','PC05: ảnh','Ảnh lớn, MIME thiếu, đang giải mã','Thu nhỏ đúng; chặn gửi sớm','Đúng kỳ vọng (UI/backend)','Đạt'],
['KT26','PC06: camera giả','Cho phép/từ chối; rời form','Giữ nội dung; dừng stream','Đúng kỳ vọng (UI)','Đạt']
])
p('Các phần mở rộng có kiểm thử riêng về đặt lịch trùng, thu/chi quỹ, bảo trì, nhập theo lô và xuất tệp. Phạm vi chứng minh là những điều kiện có trong bài kiểm thử. Báo cáo không suy ra rằng mọi tình huống thực tế đều đã được thử, cũng không coi số lượng test là tỷ lệ lỗi còn lại của sản phẩm.')
h(3,'3.4.3. Thử nghiệm quét QR đa thiết bị và trình duyệt')
p('Đề cương yêu cầu thử QR trên nhiều thiết bị Android và các trình duyệt Chrome, Edge, Cốc Cốc. Bộ tài liệu hiện có chưa chứa nhật ký thí nghiệm, video hoặc số đo camera vật lý để xác nhận các phép thử đó. Vì vậy chưa thể báo cáo thời gian nhận diện, tỷ lệ thành công hoặc kết luận tương thích cho từng máy. Các ô trong bảng sau ghi rõ “Chưa đo”, không điền số giả hoặc dùng số 0 thay cho dữ liệu chưa có.')
tb('Tình trạng thực nghiệm QR trên thiết bị vật lý',['Thiết bị / trình duyệt','Điều kiện cần ghi','Số lần / thời gian / tỷ lệ','Trạng thái'],[
['Android + Chrome','Model, Android, bản Chrome, camera, HTTPS, ánh sáng','Chưa đo','Chưa có bằng chứng'],
['Android + Edge','Model, Android, bản Edge, camera, HTTPS, ánh sáng','Chưa đo','Chưa có bằng chứng'],
['Android + Cốc Cốc','Model, Android, bản Cốc Cốc, camera, HTTPS, ánh sáng','Chưa đo','Chưa có bằng chứng'],
['Camera hệ điều hành → Web','Model, ứng dụng camera, trình duyệt mở liên kết','Chưa đo','Chưa có bằng chứng']
], 'Nguồn: đối chiếu yêu cầu đề cương với bộ bằng chứng bàn giao. Không phải bảng kết quả đo đã hoàn thành.')
p('Một quy trình đo có thể lặp lại là dùng cùng QR in, cùng khoảng cách và ánh sáng; mỗi cấu hình thực hiện ít nhất 20 lượt độc lập. Ghi thời gian từ khi đưa QR vào vùng nhìn đến khi nhận chuỗi, ghi riêng thời gian Web tải biểu mẫu. Tỷ lệ nhận diện bằng số lượt nhận đúng chia số lượt đã thử; thời gian tổng hợp dùng trung vị và nêu cả lượt thất bại. Đây là phương án thực nghiệm đề xuất, chưa phải số liệu thực hiện.',
'Cần thử thêm từ chối quyền, cấp lại quyền, chuyển camera, QR đã vô hiệu và liên kết không thuộc hệ thống. Trình duyệt tích hợp trong ứng dụng chat phải được coi là cấu hình riêng. Tài liệu thư viện công bố phạm vi hỗ trợ [3] và tài liệu camera mô tả điều kiện cấp quyền [6], nhưng hai nguồn đó không thay chứng cứ sản phẩm chạy trên máy cụ thể.')
h(3,'3.4.4. Đối chiếu mục tiêu, hạn chế và đánh giá chung')
tb('Mức độ đáp ứng mục tiêu đề cương',['Mục tiêu','Bằng chứng','Đánh giá'],[
['Web BQL và cư dân','Mã React/Express, ảnh và E2E','Đã hiện thực trong môi trường thử'],
['QR tự nhận vị trí, gửi ảnh không bắt buộc đăng nhập','API công khai, form, thử luồng tích hợp','Đã hiện thực; camera thật đa máy chưa xác nhận'],
['Phân công, KTV xử lý, BQL nghiệm thu','Trạng thái, nhật ký và test quyền/ảnh','Đã kiểm chứng tự động theo tình huống'],
['Căn hộ/cư dân/phương tiện','Schema, màn quản lý, test cư trú và bàn giao','Đã hiện thực'],
['Phí/chỉ số/hóa đơn/VietQR','Service tiền, snapshot, API và E2E','Đã hiện thực; không đối soát ngân hàng tự động'],
['Thông báo tòa nhà','Phát hành, hộp Web, receipt','Đã hiện thực; không email/SMS/push'],
['Mockup Figma và Postman','Chưa có tệp thiết kế/collection bàn giao','Chưa đủ bằng chứng sản phẩm công cụ'],
['Thử QR Android nhiều trình duyệt','Chưa có nhật ký camera vật lý','Chưa hoàn thành phần đánh giá thực địa']
])
p('Kết quả đáp ứng phần hiện thực các chức năng cốt lõi trong môi trường kiểm thử, với kiểm soát quyền, giao dịch và lịch sử được kiểm tra tự động. Giá trị thực tiễn kỳ vọng là tập trung phản ánh theo địa điểm và minh bạch trạng thái. Chưa có đo trước/sau tại một chung cư nên không kết luận hệ thống đã rút ngắn một tỷ lệ thời gian hoặc nâng mức hài lòng của cư dân.',
'Các hạn chế chính gồm một lần E2E tải Excel chưa đạt cần theo dõi, chưa thử camera vật lý đa cấu hình; chưa đo tải và thời gian phản hồi ở quy mô triển khai; chưa có nghiệm thu người dùng; chưa có tác vụ dọn ảnh mồ côi định kỳ; giới hạn IP trong bộ nhớ cần thiết kế lại khi chạy nhiều instance. Cũng cần thử sao lưu/khôi phục và giám sát vận hành trước khi dùng dài hạn. Các điểm này được đặt trong hướng phát triển, không thay thế bằng nhận xét “hệ thống hoàn thiện tuyệt đối”.')

h(1,'KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN')
h(2,'1. KẾT QUẢ ĐẠT ĐƯỢC')
p('Đề tài đã xây dựng ứng dụng Web theo kiến trúc React – Express – MySQL cho một chung cư, nối dữ liệu căn hộ/cư trú, vị trí và thiết bị QR, tiếp nhận phản ánh, phân công xử lý, nghiệm thu, hóa đơn và thông báo. Các đường vào công khai được tách khỏi dữ liệu cần tài khoản; quyền KTV và cư dân được kiểm theo bản ghi tại máy chủ. Hóa đơn giữ snapshot và VietQR hỗ trợ thông tin chuyển khoản, phù hợp giới hạn không tích hợp cổng thanh toán.',
'Bằng chứng ngày 17/11/2026 gồm build thành công, 227 bài backend đạt, 48 bài UI fixture đạt và '+str(e2e_pass)+'/'+str(e2e_pass+e2e_fail)+' bài E2E đạt; một lần tải Excel bị timeout. Những kết quả này xác nhận các tình huống trong môi trường thử, không chứng minh sản phẩm đã được triển khai và nghiệm thu tại chung cư. So với mục tiêu đề cương, phần hiện thực chính đã có; thực nghiệm camera thật trên nhiều thiết bị và đánh giá sử dụng còn thiếu bằng chứng.')
h(2,'2. KIẾN THỨC, KỸ NĂNG VÀ KINH NGHIỆM')
p('Quá trình thực hiện củng cố cách chuyển bài toán nghiệp vụ thành yêu cầu, ca sử dụng, trạng thái và dữ liệu có ràng buộc. Thiết kế quan hệ cư trú cho thấy một trường “căn hộ hiện tại” không đủ để quyết định mọi quyền lịch sử; thiết kế hóa đơn cho thấy dữ liệu tài chính cần chốt nguồn thay vì đọc động từ đơn giá mới nhất. Việc mô hình hóa trước rồi đối chiếu lại mã nguồn giúp phát hiện khác biệt giữa sơ đồ phân tích và hiện thực.',
'Các kỹ năng thực hành trọng tâm gồm tổ chức component React, xây dựng API và middleware Express, truy vấn MySQL có giao dịch, chuẩn hóa ảnh, xử lý camera trình duyệt và viết kiểm thử có thể lặp lại. Kinh nghiệm kỹ thuật rút ra là luôn xem xét lỗi mạng, gửi lại và thao tác đồng thời; giữ lịch sử cùng giao dịch; phân biệt quyền hiển thị trên Web với quyền truy cập API. Tài liệu và ảnh minh họa cũng cần gắn với một phiên bản mã nguồn để tránh báo cáo mô tả sản phẩm đã thay đổi.')
h(2,'3. HẠN CHẾ VÀ ĐỀ XUẤT PHÁT TRIỂN')
p('Ưu tiên tiếp theo là hoàn tất ma trận QR vật lý theo đề cương, lưu phiên bản thiết bị/trình duyệt và số đo có thể kiểm tra. Sau đó cần thử tải với dữ liệu quy mô xác định, đo độ trễ và tài nguyên, tối ưu chunk frontend đang có cảnh báo, rồi kiểm tra sao lưu/khôi phục và dọn ảnh mồ côi. Việc đánh giá với người dùng thật cần tình huống sử dụng, tiêu chí rõ ràng và ghi nhận trung thực phản hồi.',
'Khi mở rộng vận hành, có thể bổ sung bộ giới hạn dùng chung giữa nhiều tiến trình, giám sát lỗi, chính sách lưu trữ và quy trình phục hồi. Email/SMS/push hoặc kết nối ngân hàng chỉ nên thực hiện như một phạm vi mới có yêu cầu, quyền truy cập và kiểm thử riêng. Mô hình nhiều chung cư cũng cần thiết kế phân vùng dữ liệu từ đầu; không chỉ thêm một lựa chọn giao diện vào schema hiện tại.',
'Đề tài tạo được nền tảng quản lý và theo dõi phản ánh gắn vị trí trên Web. Việc bàn giao mã nguồn, sơ đồ chỉnh sửa được, từ điển dữ liệu và bằng chứng kiểm thử giúp tiếp tục phát triển và rà soát. Kết quả cuối cùng cần được bổ sung thực nghiệm thiết bị và xác nhận thực tế trước khi xem là đủ điều kiện triển khai vận hành dài hạn.')

h(1,'PHỤ LỤC')
h(2,'PHỤ LỤC 1. HƯỚNG DẪN SỬ DỤNG VÀ TÁI KIỂM CHỨNG')
h(3,'PL1.1. Quy trình sử dụng theo vai trò')
tb('Quy trình thao tác Ban quản lý',['Bước','Thao tác','Điểm cần kiểm tra'],[
['1','Đăng nhập; khai báo khối/tầng/căn','Đúng cấu trúc, diện tích, căn không trùng'],['2','Thêm cư dân, mở đợt ở và quản lý tài khoản','Đúng ngày/quan hệ; bàn giao mật khẩu riêng'],['3','Khai báo thiết bị và vị trí QR','Đúng loại, thiết bị và địa chỉ Web'],['4','Mở Xem QR, tải hoặc in','Thử liên kết bằng điện thoại trước khi dán'],['5','Tiếp nhận phản ánh và phân công','Chọn KTV còn hoạt động; kiểm phiên bản'],['6','Nghiệm thu kết quả KTV','Kiểm ảnh và kết quả; trả lại cần lý do'],['7','Cấu hình phí, chốt chỉ số, lập/duyệt/gửi','Đúng kỳ/giá và thông tin nhận tiền'],['8','Đối soát rồi xác nhận thu','Đủ số tiền và mã tham chiếu; không chỉ dựa QR'],['9','Phát hành thông báo, xem báo cáo','Kiểm đối tượng nhận và kỳ lọc']
])
tb('Quy trình cư dân và kỹ thuật viên',['Vai trò','Trình tự','Lưu ý'],[
['Người gửi công khai','Quét QR → kiểm vị trí → nhập nội dung/ảnh → gửi → lưu mã','Giữ mã tra cứu riêng; không chia sẻ ảnh/định danh người khác'],['Cư dân có tài khoản','Đăng nhập → xem hóa đơn/thông báo/phản ánh được phép','Đọc VietQR không xác nhận thanh toán; thông báo có đánh dấu đọc riêng'],['KTV','Đăng nhập → mở việc được giao → bắt đầu → nộp kết quả/ảnh','Ảnh mới theo lượt; giao lại công việc làm thay đổi quyền']
])
h(3,'PL1.2. Chạy lại kiểm thử và đọc bằng chứng')
code('Các lệnh kiểm chứng dùng trong báo cáo', '''npm run build
npm run test:ui
# Hai bộ sau dùng database chung_cu_test; chạy lần lượt:
npm test
npm run test:e2e''')
p('Thư mục kiem-chung đi kèm lưu đầu ra của bốn lệnh cùng thông tin nguồn. Khi chạy lại, số bài có thể thay đổi theo phiên bản mã nguồn; cần ghi commit và ngày kiểm tra mới. Không dùng database chứa dữ liệu làm việc cho test. Để cập nhật mục lục, mở Word trên máy có Times New Roman, chọn toàn bộ rồi Update Field/Update entire table và kiểm tra lại phân trang trước khi in.',
'Tệp sơ đồ chỉnh sửa được nằm trong docs/so-do-theo-mau-2026-11-17. Hình 2.15 vẫn là một ERD duy nhất gồm 18 bảng trọng tâm; khi cần đọc tên thuộc tính hãy mở PDF vector/SVG hoặc draw.io riêng. Không coi các đoạn phóng to trong phần mềm xem ảnh là những ERD phân hệ độc lập. Từ điển dưới đây bổ sung đủ các bảng vật lý không vẽ trên hình.')

h(2,'PHỤ LỤC 2. TỪ ĐIỂN DỮ LIỆU ĐẦY ĐỦ')
p('Các bảng sau được sinh từ từ điển metadata của schema hiện tại và đối chiếu mô hình đã xuất: 31 bảng, 362 cột, 81 ràng buộc khóa ngoại. PK là khóa chính; FK là khóa ngoại; “Có/Không” chỉ khả năng nhận NULL. Các cột trong khóa ghép được đánh dấu thành viên; dòng quan hệ sau bảng giữ đúng tổ hợp. Ký hiệu trong bảng từ điển phục vụ tra cứu kỹ thuật; hình ERD vẫn dùng quy ước gạch chân theo mẫu.')
model=json.loads((R/'docs/so-do-theo-mau-2026-11-17/nguon/mo-hinh-va-doi-chieu.json').read_text())
raw=(R/'docs/bao-cao/tu-dien-du-lieu.md').read_text()
for i,(name,tab) in enumerate(model['tables'].items(),1):
 h(3,'PL2.'+str(i)+'. '+name)
 fk=[x for x in model['foreign_keys'] if x['child']==name]
 rows=[]
 for col,d in tab['columns'].items():
  keys=[]
  if col in tab['pk']:keys.append('PK'+(' ghép' if len(tab['pk'])>1 else ''))
  for rel in fk:
   if col in rel['columns']:
    k=rel['columns'].index(col);keys.append('FK → '+rel['parent']+'.'+rel['references'][k]+(' (ghép)' if len(rel['columns'])>1 else ''))
  rows.append([col,d['type'],'Có' if d['nullable'] else 'Không','; '.join(keys) or '—'])
 tb('Cấu trúc bảng '+name,['Thuộc tính','Kiểu MySQL','NULL','Khóa / tham chiếu'],rows,'Nguồn: metadata MySQL và baseline 001_thesis_schema.sql của dự án; không chứa dữ liệu nghiệp vụ.')
 if tab.get('unique'):p('Tổ hợp UNIQUE: '+'; '.join('('+', '.join(u)+')' for u in tab['unique'])+'.')
 if fk:p('Quan hệ khóa ngoại: '+'; '.join('('+', '.join(x['columns'])+') → '+x['parent']+'('+', '.join(x['references'])+')' for x in fk)+'.')
views=[('lich_su_phan_anh','Phân công, xử lý và nghiệm thu phản ánh'),('lich_su_hoa_don','Lập, duyệt, gửi, hủy và thu hóa đơn'),('lich_su_ban_giao_can_ho','Bàn giao tài khoản/trách nhiệm căn'),('lich_su_thong_bao','Tạo, phát hành và thu hồi thông báo'),('lich_su_bao_tri','Xử lý phiếu bảo trì'),('lich_su_dat_lich','Yêu cầu và quyết định đặt tiện ích'),('lich_su_thu_chi','Các sự kiện phiếu thu/chi'),('lich_su_lien_ket_qr','Thay đổi liên kết vị trí QR và thiết bị')]
h(3,'PL2.32. Các view lịch sử và nguồn schema')
tb('Tám view lịch sử nghiệp vụ',['View','Nội dung'],views)
p('Các view là giao diện đọc dữ liệu lịch sử từ bảng nhật ký chung, không phải tám bảng vật lý bổ sung. Baseline SQL là nguồn quyết định cho CHECK, biểu thức cột sinh và hành vi cập nhật/xóa của FK. Từ điển bảng trong báo cáo lược cột mặc định và toàn văn CHECK để thuận tiện đọc; từ điển kỹ thuật docs/bao-cao/tu-dien-du-lieu.md và SQL vẫn giữ chi tiết cần cho triển khai.')

h(1,'DANH MỤC TÀI LIỆU THAM KHẢO')
refs=[
('Express.js','Express — README','https://github.com/expressjs/express/blob/master/Readme.md'),
('Frappe Technologies','ERPNext — README','https://github.com/frappe/erpnext/blob/develop/README.md'),
('Mehul Patel','html5-qrcode — README','https://github.com/mebjas/html5-qrcode/blob/master/README.md'),
('Meta Open Source','React: Quick Start','https://github.com/reactjs/react.dev/blob/main/src/content/learn/index.md'),
('Microsoft','Playwright: Emulation','https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md'),
('Mozilla','MDN Web Docs: MediaDevices.getUserMedia()','https://github.com/mdn/content/blob/main/files/en-us/web/api/mediadevices/getusermedia/index.md'),
('Node.js','Introduction to Node.js','https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),
('Oracle','MySQL Server 8.4: foreign_key.test (mã kiểm thử khóa ngoại chính thức)','https://github.com/mysql/mysql-server/blob/8.4/mysql-test/t/foreign_key.test'),
('OWASP Foundation','Authorization Cheat Sheet','https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Authorization_Cheat_Sheet.md'),
('soldair và cộng tác viên','node-qrcode — README','https://github.com/soldair/node-qrcode/blob/master/README.md'),
('Vite Team','Vite 7: Getting Started','https://github.com/vitejs/vite/blob/v7.0.0/docs/guide/index.md')]
for i,(author,title,url) in enumerate(refs,1):blocks.append(dict(kind='reference',id=i,author=author,title=title,url=url,access='17/11/2026'))
