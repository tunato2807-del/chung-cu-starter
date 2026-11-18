from pathlib import Path
import json,re,html
B=Path(__file__).resolve().parent.parent;R=B.parents[2]
blocks=[]
def h(n,t):blocks.append(dict(kind='heading',level=n,text=t))
def p(*ts):
 for t in ts:blocks.append(dict(kind='paragraph',text=t))
def tb(title,heads,rows,source='Nguồn: tác giả tổng hợp từ yêu cầu đề cương và mã nguồn dự án.'):
 blocks.append(dict(kind='table',title=title,headers=heads,rows=rows,source=source))
def f(n,title,desc):blocks.append(dict(kind='figure',number=n,title=title,description=desc))
def code(title,t):blocks.append(dict(kind='code',title=title,text=t))

h(1,'MỞ ĐẦU')
p('Quản lý vận hành chung cư đòi hỏi thông tin về căn hộ, cư dân, thiết bị và các khoản phí được cập nhật nhất quán. Khi phản ánh được tiếp nhận riêng qua điện thoại hoặc nhóm trò chuyện, thông tin về địa điểm, người phụ trách và kết quả xử lý có thể nằm ở nhiều nơi. Bài toán đặt ra trong đề tài là tổ chức một đầu mối tiếp nhận và theo dõi, đồng thời gắn phản ánh với vị trí cụ thể trong tòa nhà. Đây là bối cảnh nghiệp vụ được xác định trong đề cương, không phải kết quả khảo sát định lượng một chung cư đã triển khai.',
'Đề tài “Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân” chọn ứng dụng Web làm phương tiện truy cập chung. Ban quản lý (BQL) làm việc trên máy tính; cư dân có thể mở liên kết bằng trình duyệt điện thoại. Mã phản hồi nhanh (Quick Response – QR) tại khu vực hoặc thiết bị dẫn đến biểu mẫu phản ánh đã nhận diện vị trí. Cư dân gửi nội dung và ảnh mà không bắt buộc đăng nhập; các chức năng xem hóa đơn và hộp thông báo yêu cầu tài khoản phù hợp. Việc tách hai phạm vi này giúp tiếp nhận thuận tiện mà vẫn giới hạn dữ liệu riêng tư.',
'Mục tiêu tổng quát là xây dựng một luồng khép kín từ xác định vị trí, tiếp nhận phản ánh, phân công kỹ thuật viên (KTV), cập nhật kết quả đến nghiệm thu. Các mục tiêu hỗ trợ gồm quản lý khối, tầng, căn hộ và hồ sơ cư trú; quản lý thiết bị và QR; cấu hình phí, ghi chỉ số, lập hóa đơn; công bố thông báo. Hệ thống sử dụng React, Node.js/Express và MySQL. Quét QR trên Web được thực hiện bằng html5-qrcode, còn ảnh QR được dựng bằng thư viện qrcode [3], [10].',
'Đối tượng nghiên cứu gồm quy trình tiếp nhận sự cố, quan hệ cư trú, quyền truy cập dữ liệu và các kỹ thuật tương tác camera trong trình duyệt. Phạm vi ứng dụng là một chung cư có thể gồm nhiều khối, không phải hệ thống cung cấp dịch vụ cho nhiều chung cư độc lập. Đề tài không xây dựng ứng dụng di động native và không kết nối cổng thanh toán hoặc API ngân hàng để tự xác nhận tiền. VietQR chỉ hỗ trợ điền thông tin chuyển khoản; BQL xác nhận thu sau đối soát.',
'Phương pháp thực hiện kết hợp đọc tài liệu kỹ thuật, phân tích yêu cầu, mô hình hóa hệ thống, cài đặt theo mô-đun và kiểm thử theo tình huống. Biểu đồ ca sử dụng, hoạt động và tuần tự mô tả tương tác; mô hình thực thể và ràng buộc MySQL mô tả dữ liệu; kiểm thử tự động kiểm tra các điều kiện nghiệp vụ và giao diện. Việc mô phỏng kích thước màn hình trong Playwright được phân biệt với thử camera trên điện thoại thật [5].',
'Đề tài được thực hiện theo hình thức sinh viên tự nghiên cứu, không ghi nhận một doanh nghiệp đặt hàng hoặc một chung cư đã nghiệm thu sản phẩm. Khoảng thời gian trong đề cương là từ 24/08/2026 đến 04/12/2026. Bản báo cáo này đối chiếu mã nguồn ứng dụng tại commit cceb904 và bằng chứng kiểm thử ngày 17/11/2026; những nội dung chưa có dữ liệu thực nghiệm được nêu rõ trong chương đánh giá.',
'Báo cáo gồm ba chương. Chương 1 tổng hợp các cách giải quyết liên quan, cơ sở lý thuyết và công nghệ. Chương 2 trình bày yêu cầu, ca sử dụng, mô hình hoạt động, thiết kế dữ liệu, kiến trúc và thuật toán. Chương 3 mô tả môi trường, hiện thực, giao diện, kiểm thử và mức độ đáp ứng mục tiêu. Sau đó là kết luận, phụ lục hướng dẫn sử dụng, từ điển dữ liệu và danh mục tài liệu tham khảo.')

h(1,'CHƯƠNG 1. TỔNG QUAN TÀI LIỆU')
h(2,'1.1. CÁC CÔNG VIỆC VÀ DỰ ÁN LIÊN QUAN')
h(3,'1.1.1. Các cách tổ chức quản lý và tiếp nhận phản ánh')
p('Trong phạm vi bài toán, có thể tổ chức thông tin theo ba hướng: dùng bảng tính và nhóm trò chuyện; sử dụng phần mềm quản lý tòa nhà chuyên dụng; hoặc cấu hình một nền tảng quản trị có nhiều phân hệ. Cách thứ nhất dễ bắt đầu nhưng việc tìm lại một sự cố, xác định người đang xử lý và kiểm tra ảnh nghiệm thu phụ thuộc vào quy ước thao tác của người sử dụng. Nhận xét này mô tả rủi ro của quy trình, không đại diện cho tỷ lệ sai sót đo tại một đơn vị cụ thể.',
'Đề cương nêu CyHome và Building Care là những ví dụ cần tham khảo trong nhóm sản phẩm quản lý tòa nhà. Trong lần biên soạn này chưa thu thập được tài liệu tính năng chính thức hoặc tài khoản dùng thử của hai sản phẩm. Vì vậy, báo cáo không gán cho các sản phẩm đó một tính năng cụ thể, không kết luận rằng chúng bắt buộc cài ứng dụng, không có QR hoặc kém hiệu quả hơn đề tài. Các tiêu chí so sánh được xác định ở cấp phương án tổ chức; khảo sát sản phẩm thương mại chi tiết vẫn cần bổ sung bằng nguồn truy cập được.',
'ERPNext là một dự án mã nguồn mở có phạm vi quản trị doanh nghiệp rộng, với các nhóm chức năng như kế toán, quản lý tài sản và hỗ trợ khách hàng được giới thiệu trong kho chính thức [2]. Đây là một dự án liên quan về tổ chức dữ liệu và quy trình hỗ trợ, không phải một sản phẩm chung cư được đề tài cài đặt để đối chứng. Đề tài kế thừa cách nghĩ tách trách nhiệm theo mô-đun, nhưng tự xây dựng quan hệ căn hộ, đợt cư trú, vị trí QR và vòng đời phản ánh để phục vụ bài toán đã chọn.')
tb('So sánh các phương án giải quyết bài toán',['Tiêu chí','Bảng tính / nhóm trò chuyện','Nền tảng quản trị tổng quát','Giải pháp của đề tài'],[
['Tổ chức dữ liệu','Nhiều tệp và luồng trao đổi','Có nhiều phân hệ dùng chung','MySQL với khóa và quan hệ nghiệp vụ'],
['Định danh vị trí','Nhập hoặc mô tả thủ công','Cần cấu hình theo bài toán','Liên kết /r/{token} và tra vị trí tại máy chủ'],
['Tiến độ sự cố','Theo dõi bằng quy ước','Có thể tùy biến quy trình','Trạng thái, người được giao và nghiệm thu'],
['Phạm vi triển khai','Công cụ sẵn có','Quản trị doanh nghiệp rộng','Một chung cư; giao diện Web theo vai trò'],
['Giới hạn bằng chứng','Không có khảo sát định lượng','Tham khảo README ERPNext','Đối chiếu mã nguồn và kiểm thử được lưu']
], 'Nguồn: tác giả phân tích theo bài toán; phạm vi ERPNext tham khảo [2]. Không phải bảng đánh giá thực nghiệm các sản phẩm thương mại.')
h(3,'1.1.2. Sự khác biệt và giá trị của đề tài')
p('Sự khác biệt của đề tài nằm ở việc nối các bước của cùng một nghiệp vụ. QR mang một liên kết định danh vị trí; máy chủ kiểm tra token còn hoạt động rồi cấp dữ liệu tối thiểu cho biểu mẫu. Khi gửi thành công, phản ánh có vị trí, ảnh và mã tra cứu; BQL phân công KTV; KTV cập nhật kết quả; BQL nghiệm thu hoặc yêu cầu xử lý lại. Dữ liệu lịch sử được lưu cùng lần chuyển trạng thái, nhờ đó có cơ sở xác định ai làm gì và vào thời điểm nào.',
'Ứng dụng Web giảm một bước cài phần mềm trong luồng gửi phản ánh. Tuy nhiên, thuận tiện truy cập không đồng nghĩa camera luôn dùng được: trình duyệt cần ngữ cảnh bảo mật và sự cho phép của người dùng [6]. Vì vậy thiết kế có hai đường vào: quét trong trang Web hoặc dùng camera hệ điều hành để mở liên kết. Báo cáo xem đây là một lựa chọn phù hợp phạm vi, không khẳng định là phát minh mới hoặc ưu thế đã được đo trên toàn bộ thị trường.')

h(2,'1.2. CƠ SỞ LÝ THUYẾT VÀ NGHIỆP VỤ')
h(3,'1.2.1. Quy trình vận hành và quản lý yêu cầu')
p('Đơn vị cơ bản của quy trình tiếp nhận là một phản ánh có nội dung, địa điểm, người gửi và trạng thái. Việc “đã xử lý” do KTV báo cáo khác với “đã đóng” sau nghiệm thu của BQL. Tách hai thời điểm giúp giữ một bước kiểm tra kết quả và cho phép trả lại xử lý nếu ảnh hoặc nội dung chưa đáp ứng. Các nhánh từ chối và gộp được giới hạn ở phản ánh mới; hệ thống không tự gộp chỉ vì hai nội dung trông giống nhau.',
'Hồ sơ cư dân và quan hệ cư trú cũng cần tách biệt. Một người có thể chuyển căn hoặc kết thúc đợt ở; sửa trực tiếp mã căn trong hồ sơ hiện tại sẽ làm mất khoảng thời gian liên quan. Bảng lịch sử cư trú ghi người, căn, quan hệ, ngày bắt đầu và ngày kết thúc. Quyền xem hóa đơn của tài khoản cá nhân được xác định từ đợt hiện tại; tài khoản thanh toán cố định của căn phục vụ trách nhiệm thanh toán chung và được quản lý bằng quy trình bàn giao riêng.',
'Với phí dịch vụ, chứng từ hóa đơn cần giữ dữ liệu tại thời điểm lập và duyệt. Nếu đơn giá thay đổi về sau, hóa đơn đã gửi không được tự đổi tổng tiền. Vì vậy thiết kế lưu các dòng chi tiết cùng thông tin nguồn, đồng thời dùng trạng thái để kiểm soát lập nháp, duyệt, gửi, thu và hủy. Ngày xác nhận thu tại phần mềm là thời điểm BQL nhập quyết định sau đối soát, không tự suy ra từ thao tác quét QR.')
h(3,'1.2.2. Phân tích hướng đối tượng và các mô hình thiết kế')
p('Ngôn ngữ mô hình hóa thống nhất (Unified Modeling Language – UML) được dùng để mô tả góc nhìn chức năng, tương tác và trạng thái. Ca sử dụng xác định tác nhân cùng mục tiêu; sơ đồ hoạt động biểu diễn các bước và nhánh kiểm tra; sơ đồ tuần tự biểu diễn thông điệp theo thời gian; sơ đồ lớp phân tích tập trung vào khái niệm nghiệp vụ. Một hành động xuất hiện trên giao diện không tự chứng minh rằng người dùng có quyền thực hiện hành động đó; điều kiện phải được kiểm tra tại giao diện lập trình ứng dụng (Application Programming Interface – API).',
'Sơ đồ quan hệ thực thể (Entity Relationship Diagram – ERD) thể hiện thực thể, thuộc tính và các quan hệ. Trong báo cáo, hình chữ nhật là thực thể, oval là thuộc tính, hình thoi là quan hệ; khóa chính gạch dưới nét liền, khóa ngoại gạch dưới nét đứt. Một thuộc tính đồng thời mang hai vai trò có cả hai dấu. Sơ đồ là một phép chiếu của thiết kế dữ liệu, còn ràng buộc thực thi phải được đối chiếu từ SQL và từ điển dữ liệu.',
'Sơ đồ lớp trong đề tài là mô hình phân tích, không phải bản mô tả các lớp ánh xạ đối tượng–quan hệ (Object-Relational Mapping – ORM) đang tồn tại. Phần mềm thực tế sử dụng các mô-đun JavaScript và truy vấn mysql2. Giữ rõ hai mức mô hình giúp tránh trình bày các phương thức như thể đã được sinh tự động thành lớp hoặc bộ ánh xạ đối tượng trong chương trình.')
h(3,'1.2.3. Dữ liệu quan hệ, giao dịch và tính nhất quán')
p('Khóa chính phân biệt các bản ghi; khóa ngoại liên kết bản ghi con với bản ghi cha. Một quan hệ ghép có thể gồm nhiều cột, như cặp khối và tầng của căn hộ. UNIQUE ngăn trùng theo tổ hợp có ý nghĩa nghiệp vụ, còn CHECK giới hạn các giá trị hợp lệ. Trong MySQL cần chú ý giá trị NULL và điều kiện kiểm tra; một quy tắc nghiệp vụ phức tạp còn cần kiểm tra trong service. Bộ kiểm thử chính thức của MySQL có nhiều trường hợp cho cú pháp và hành vi ràng buộc khóa ngoại [8].',
'Giao dịch gom các thay đổi liên quan thành một lần thành công hoặc thất bại. Chẳng hạn, phân công phản ánh phải cập nhật người phụ trách, phiên bản và nhật ký trong cùng giao dịch. Nếu ghi lịch sử thất bại mà trạng thái vẫn được lưu, hệ thống sẽ thiếu căn cứ giải thích thay đổi. Khóa hàng xử lý các yêu cầu đồng thời tại máy chủ; phiên bản bản ghi giúp phát hiện người dùng đang gửi một biểu mẫu đã cũ.',
'Gửi lại yêu cầu sau lỗi mạng là tình huống bình thường của ứng dụng Web. Hệ thống dùng khóa yêu cầu và dấu vân tay nội dung để nhận ra một lần thao tác đã hoàn thành. Cùng khóa và cùng nội dung trả biên nhận trước; cùng khóa nhưng nội dung khác bị từ chối. Cơ chế này bổ sung cho ràng buộc dữ liệu, không thay thế bước xác thực và kiểm tra quyền.')
h(3,'1.2.4. Phân quyền và bảo vệ dữ liệu')
p('Quyền truy cập được xác định bằng cả vai trò lẫn quan hệ với bản ghi. BQL quản lý vận hành; KTV chỉ truy cập công việc hiện được giao; cư dân dùng tài khoản chỉ xem dữ liệu trong phạm vi cho phép. Người gửi công khai không được đọc hồ sơ phản ánh của người khác. Nguyên tắc quyền tối thiểu, mặc định từ chối và kiểm tra ở mọi yêu cầu được khuyến nghị trong tài liệu OWASP [9].',
'Ảnh phản ánh, số điện thoại, ghi chú nội bộ và thông tin tài khoản có mức nhạy cảm khác nhau. Vì vậy API công khai chỉ trả danh sách trường được phép; ảnh nghiệp vụ phải đi qua endpoint kiểm tra quyền. Mã QR vị trí là đường dẫn công khai, không phải mật khẩu cho toàn bộ lịch sử. Mã tra cứu riêng được phát cho một phản ánh và không đặt trong URL của API để giảm nguy cơ lưu vào nhật ký địa chỉ.',
'Ảnh tải lên cần được giải mã và kiểm tra ở máy chủ, không chỉ kiểm phần mở rộng hoặc MIME do trình duyệt khai báo. Quy trình hiện tại dùng Sharp để tạo ảnh JPEG đã loại metadata. Các giới hạn số lượng, kích thước và số điểm ảnh giúp thu hẹp đầu vào; chúng không đủ để kết luận rằng sản phẩm đã được kiểm định an toàn toàn diện.')

h(2,'1.3. CÔNG NGHỆ VÀ CÔNG CỤ SỬ DỤNG')
h(3,'1.3.1. React, giao diện thích ứng và Vite')
p('React tổ chức giao diện thành các component có logic và cách hiển thị riêng, đồng thời cung cấp cơ chế phản hồi sự kiện và chia sẻ trạng thái [4]. Đề tài dùng cách tổ chức theo nghiệp vụ: phản ánh, QR, cư trú, hóa đơn và thông báo. Các thành phần dùng chung xử lý phiên đăng nhập, lỗi API và cửa sổ thao tác. Mỗi cửa sổ cho phép người dùng hoàn thành một nhiệm vụ rồi quay về danh sách với bộ lọc hiện có.',
'Vite phục vụ môi trường phát triển và tạo bản dựng để triển khai; đây là hai mục đích khác nhau [11]. Trong bản hiện tại React 19 đi cùng Vite 7 và React Router. Giao diện dùng stylesheet CSS của dự án, không dùng TailwindCSS hoặc Bootstrap như những phương án được nêu trong đề cương. Việc đổi lựa chọn này không làm thay đổi mục tiêu giao diện thích ứng nhưng phải được phản ánh đúng trong báo cáo.')
h(3,'1.3.2. Node.js, Express và MySQL')
p('Node.js là môi trường thực thi JavaScript ngoài trình duyệt và cung cấp các thao tác vào/ra bất đồng bộ [7]. Express là framework Web tối giản có routing và middleware [1]. Đề tài dùng Express 5 để phân tách tuyến API, bước xác thực, kiểm tra vai trò và xử lý nghiệp vụ. Không quy đổi đặc tính bất đồng bộ thành một cam kết “API nhanh hơn” khi chưa có phép đo tải.',
'MySQL lưu dữ liệu quan hệ bằng InnoDB. mysql2 thực hiện truy vấn có tham số, còn service quyết định thứ tự khóa, giao dịch và kiểm tra quy tắc. Baseline hiện tại có 31 bảng vật lý, 362 cột, 81 ràng buộc khóa ngoại và 8 view lịch sử. Những con số này mô tả schema đang dùng; không đồng nhất chúng với 18 bảng trọng tâm trên ERD rút gọn phạm vi bảng.')
h(3,'1.3.3. html5-qrcode, qrcode và camera trình duyệt')
p('html5-qrcode cung cấp API quét từ camera và một số nguồn ảnh, cho phép ứng dụng tự xây dựng giao diện điều khiển [3]. Trong chương trình, Html5Qrcode được tải khi người dùng yêu cầu mở camera, ưu tiên camera sau và dừng luồng khi rời màn hình. qrcode đảm nhiệm chiều ngược lại: dựng ảnh từ một chuỗi URL hoặc payload thanh toán [10]. Hai thư viện có vai trò riêng, không phải một thuật toán mã hóa bảo mật nội dung.',
'getUserMedia yêu cầu người dùng cấp quyền và phụ thuộc ngữ cảnh bảo mật; lỗi có thể do từ chối quyền, không có thiết bị hoặc ngữ cảnh không an toàn [6]. Vì vậy một địa chỉ HTTP qua IP mạng nội bộ có thể mở được Web nhưng không đủ điều kiện dùng camera trong trang. Báo cáo cần ghi riêng điều kiện HTTPS, quyền camera và thiết bị; ảnh chụp giao diện không chứng minh các điều kiện này đã được thử trên máy thật.')
h(3,'1.3.4. Công cụ phát triển và kiểm thử')
p('Git và GitHub lưu phiên bản mã nguồn, tài liệu và lịch sử thay đổi. Visual Studio Code hỗ trợ đọc, sửa và chạy các lệnh dự án. Đề cương dự kiến Figma cho thiết kế giao diện và Postman cho thử API; trong bộ bằng chứng hiện có chưa có tệp Figma hoặc collection Postman để xác nhận các sản phẩm thiết kế đó. Báo cáo sử dụng giao diện thực tế được chụp từ mã nguồn, không gọi chúng là mockup Figma.',
'Playwright tự động hóa thao tác trình duyệt và có khả năng mô phỏng viewport, thiết bị, quyền hoặc một số đặc tính môi trường [5]. Trong chương 3, kiểm thử giao diện với API giả lập được ghi rõ là kiểm thử giao diện; kiểm thử nghiệp vụ dùng cơ sở dữ liệu thử riêng. Thử nhận diện QR vật lý trên Chrome, Edge hoặc Cốc Cốc Android vẫn cần thí nghiệm trực tiếp, không suy ra từ tên cấu hình thiết bị trong công cụ.')
p('Từ các cơ sở trên, chương tiếp theo chuyển bài toán thành yêu cầu có thể kiểm tra, sau đó mô tả thiết kế theo các góc nhìn chức năng, tương tác, dữ liệu và triển khai. Các lựa chọn kỹ thuật được đánh giá theo khả năng giải quyết bài toán và tính nhất quán với sản phẩm thực tế, thay vì chỉ liệt kê tên công nghệ.')

h(1,'CHƯƠNG 2. PHƯƠNG PHÁP THỰC HIỆN')
h(2,'2.1. XÁC ĐỊNH YÊU CẦU VÀ PHÂN RÃ CHỨC NĂNG')
h(3,'2.1.1. Tác nhân, phạm vi và yêu cầu chức năng')
p('Các yêu cầu được rút ra từ đề cương và đối chiếu với các mô-đun đang có. Ba vai trò tài khoản là QUAN_TRI_VIEN, KY_THUAT_VIEN và CU_DAN. Người gửi công khai là một tác nhân ngoài phạm vi đăng nhập; hệ thống không tạo một vai trò KHACH trong bảng người dùng chỉ để tiếp nhận phản ánh. Thông tin vị trí được xác định từ QR, không lấy tên vị trí tùy ý do trình duyệt gửi lên.')
tb('Danh sách yêu cầu chức năng chính',['Mã','Yêu cầu','Tác nhân','Điều kiện nghiệm thu'],[
['CN01','Đăng nhập, đăng xuất, đổi mật khẩu, khóa tài khoản','BQL/KTV/Cư dân','Phiên bị thu hồi không tiếp tục đọc hoặc ghi'],
['CN02','Quản lý khối, tầng, căn hộ, sơ đồ tòa nhà','BQL','Khối/tầng rỗng vẫn xuất hiện; căn tham chiếu hợp lệ'],
['CN03','Hồ sơ, đợt cư trú và tài khoản căn','BQL','Giữ lịch sử chuyển đi; bàn giao thu hồi phiên cũ'],
['CN04','Đăng ký và kết thúc phương tiện','BQL','Gắn đúng cư dân/đợt/căn; không sửa dữ liệu đã chốt phí'],
['CN05','Quản lý thiết bị, vị trí và QR','BQL','Tạo/xem/tải/in QR; vô hiệu hoặc đổi token có kiểm tra'],
['CN06','Gửi phản ánh kèm ảnh theo QR','Công khai/Cư dân','Vị trí còn hiệu lực; tối đa 5 ảnh hợp lệ; có biên nhận'],
['CN07','Tiếp nhận, phân công, xử lý, nghiệm thu','BQL/KTV','Đúng vai trò, người được giao, trạng thái và phiên bản'],
['CN08','Tra cứu tiến độ phản ánh','Người gửi/Cư dân','Công khai dùng mã riêng và SĐT; không lộ dữ liệu nội bộ'],
['CN09','Cấu hình phí, ghi chỉ số, lập/duyệt/gửi hóa đơn','BQL','Tiền tính chính xác; tránh bản còn hiệu lực trùng căn/kỳ'],
['CN10','Tra cứu hóa đơn và hiển thị VietQR','Cư dân','Đúng phạm vi căn/đợt; chỉ hóa đơn được phép'],
['CN11','Xác nhận thu và báo cáo công nợ/thu phí','BQL','Đủ số tiền, mã tham chiếu; báo cáo không nhân bản tổng'],
['CN12','Phát hành và đọc thông báo trên Web','BQL/Cư dân','Đúng đối tượng; đánh dấu đọc có thao tác riêng']
])
p('Bảo trì, tiện ích, quỹ và trao đổi Excel/PDF là các mô-đun đã có trong mã nguồn, hỗ trợ phạm vi vận hành. Chúng được trình bày là phần mở rộng của sản phẩm; kết quả chính vẫn tập trung vào chuỗi cư trú – QR – phản ánh – hóa đơn – thông báo. Không đưa khả năng nhiều chung cư, ứng dụng native hoặc tự đối soát ngân hàng vào danh sách đã hoàn thành.')
h(3,'2.1.2. Yêu cầu phi chức năng và tiêu chí đánh giá')
tb('Yêu cầu phi chức năng và cách kiểm tra',['Mã','Yêu cầu','Cách kiểm tra / giới hạn'],[
['PC01','Phân quyền theo vai trò và từng bản ghi','Gọi API ngoài phạm vi; kiểm tra KTV cũ, cư dân đã chuyển đi'],
['PC02','Bảo toàn dữ liệu và lịch sử','Gây lỗi ghi nhật ký; xác nhận rollback cả dữ liệu nghiệp vụ'],
['PC03','Chống thao tác lặp và xung đột','Gửi cùng khóa yêu cầu; gửi phiên bản cũ; kiểm tra mã 409'],
['PC04','Giao diện máy tính và điện thoại','Viewport 1440/375 px; kiểm tra tràn ngang, focus và cửa sổ'],
['PC05','Tải ảnh có giới hạn','Thử tệp sai định dạng, quá số lượng/dung lượng và đang giải mã'],
['PC06','Camera có điều kiện hoạt động rõ','HTTPS tin cậy + cấp quyền; kiểm tra riêng trên thiết bị thật'],
['PC07','Bảo trì mã nguồn và vận hành','Mô-đun theo nghiệp vụ, cấu hình riêng, migration có checksum'],
['PC08','Hiệu năng có thể đo lại','Chưa đặt số SLA khi chưa có phép đo tải và máy chuẩn hóa']
])
p('Các tiêu chí bảo mật bám nguyên tắc kiểm tra quyền trên mọi yêu cầu, không chỉ ẩn nút trên giao diện [9]. Đối với hiệu năng, phân trang và giới hạn lô là biện pháp thiết kế; chúng không thay thế kết quả đo độ trễ. Bản báo cáo không đặt số lượng người dùng đồng thời hoặc tỷ lệ sẵn sàng mà chưa có thí nghiệm tương ứng.')
f(1,'Phân rã chức năng của hệ thống','Nhánh chức năng được tổ chức theo quản lý dữ liệu nền, tiếp nhận QR, điều phối xử lý, phí/hóa đơn và truyền thông. Các phần mở rộng bảo trì, tiện ích và quỹ không thay đổi đường đi cốt lõi của phản ánh. Mỗi nhánh được ánh xạ đến màn hình và API cùng nghiệp vụ, tránh việc một biểu mẫu chứa toàn bộ chức năng của phân hệ.')

h(2,'2.2. PHÂN TÍCH HỆ THỐNG VỚI SƠ ĐỒ USE CASE')
h(3,'2.2.1. Use Case tổng thể và phân rã theo tác nhân')
f(2,'Use Case tổng thể','Tác nhân BQL quản lý vận hành; KTV xử lý phần việc được giao; cư dân sử dụng chức năng tài khoản; người gửi công khai mở biểu mẫu theo QR. Các quan hệ trong hình mô tả mục tiêu sử dụng; điều kiện về quyền và trạng thái được chi tiết trong đặc tả. Mở QR công khai không cấp quyền quản trị thiết bị hay xem ảnh của phản ánh khác.')
f(3,'Use Case phân rã Ban quản lý','BQL duy trì dữ liệu căn hộ/cư dân, vị trí và thiết bị, phát hành QR, điều phối phản ánh, lập hóa đơn và thông báo. Các bước duyệt, gửi và xác nhận thu là các quyết định độc lập. Chức năng xem báo cáo chỉ đọc, không phát sinh xác nhận thanh toán khi người dùng mở trang.')
f(4,'Use Case cư dân, người gửi công khai và kỹ thuật viên','Người gửi không đăng nhập có thể phản ánh và tra cứu bằng thông tin riêng được cấp. Cư dân có tài khoản được xem hóa đơn, thông báo và phản ánh trong phạm vi quyền. KTV nhận việc, bắt đầu, nộp kết quả và ảnh; BQL mới quyết định nghiệm thu. Mô hình không gộp mọi tác nhân vào một người dùng có cùng quyền.')
h(3,'2.2.2. Đặc tả năm Use Case cốt lõi')
ucs=[
('UC01 – Đăng nhập và phân quyền',[
['Tác nhân / mục tiêu','BQL, KTV, cư dân; tạo phiên truy cập đúng vai trò.'],['Tiền điều kiện','Tài khoản đã được cấp, còn hoạt động; trình duyệt cho phép cookie.'],['Đầu vào','Định danh đăng nhập, mật khẩu và lựa chọn tài khoản nếu có nhiều ứng viên.'],['Luồng chính','1. Nhập dữ liệu. 2. Kiểm tra giới hạn đăng nhập. 3. Xác minh mật khẩu và trạng thái. 4. Phát cookie phiên. 5. Gọi API danh tính và mở workspace phù hợp.'],['Ngoại lệ','Sai thông tin: báo lỗi chung; sai nhiều lần: khóa tạm; phiên cũ/đã thu hồi: 401. Không cho tự chọn vai trò bằng dữ liệu gửi từ client.'],['Hậu điều kiện','Các API sau kiểm tra lại trạng thái, vai trò và phiên bản tài khoản; đăng xuất tăng phiên bản.']]),
('UC02 – Sinh và xuất mã QR vị trí',[
['Tác nhân / mục tiêu','BQL; tạo liên kết mở nhanh biểu mẫu tại vị trí hoặc thiết bị.'],['Tiền điều kiện','Đã đăng nhập BQL; origin dùng cho điện thoại phải truy cập được.'],['Đầu vào','Tên, loại, mô tả vị trí; thiết bị hợp lệ nếu liên kết.'],['Luồng chính','1. Mở cửa sổ tạo. 2. Kiểm tra dữ liệu. 3. Lưu vị trí và token. 4. Dựng URL /r/{token}. 5. Xem/tải/in ảnh QR.'],['Ngoại lệ','Thiết bị ngừng sử dụng hoặc loại không phù hợp: từ chối; dữ liệu cũ: 409; muốn thay mã phải xác nhận sinh lại.'],['Hậu điều kiện','QR mới nhận diện một vị trí; sinh lại thu hồi token cũ; đổi liên kết không sửa phản ánh đã gửi.']]),
('UC03 – Quét QR và gửi phản ánh',[
['Tác nhân / mục tiêu','Cư dân hoặc người gửi công khai; gửi nội dung và ảnh đúng địa điểm.'],['Tiền điều kiện','Token hợp lệ, vị trí đang tiếp nhận; nếu quét trong Web cần HTTPS/quyền camera.'],['Đầu vào','Nội dung, họ tên/SĐT theo biểu mẫu, tối đa 5 ảnh, phiên bản QR, khóa yêu cầu.'],['Luồng chính','1. Quét hoặc mở liên kết. 2. Máy chủ trả vị trí. 3. Nhập nội dung/chọn ảnh. 4. Chuẩn hóa và kiểm tra. 5. Lưu phản ánh, ảnh, lịch sử và biên nhận cùng giao dịch. 6. Hiển thị mã tra cứu.'],['Ngoại lệ','Token hết hiệu lực; QR đã đổi phiên bản; ảnh sai; đạt giới hạn gửi; lỗi mạng. Gửi lại cùng yêu cầu trả biên nhận cũ khi đã thành công.'],['Hậu điều kiện','Có một phản ánh mới và snapshot thiết bị tại lúc gửi; không tự công khai toàn bộ dữ liệu.']]),
('UC04 – Phân công và xử lý phản ánh',[
['Tác nhân / mục tiêu','BQL và KTV được giao; hoàn tất xử lý có nghiệm thu.'],['Tiền điều kiện','Phản ánh ở trạng thái cho phép; phiên bản hiện tại; KTV còn hoạt động.'],['Đầu vào','KTV, ưu tiên; trạng thái đích; ghi chú; ảnh mới khi hoàn thành; phiên bản.'],['Luồng chính','1. BQL phân công. 2. KTV bắt đầu. 3. KTV nộp kết quả và ảnh. 4. BQL kiểm tra. 5. Nghiệm thu đạt để đóng hoặc trả lại kèm lý do.'],['Ngoại lệ','KTV khác truy cập: từ chối; người được giao đã đổi: mất quyền; thiếu ảnh/lý do: 422; phiên bản cũ: 409.'],['Hậu điều kiện','Trạng thái, phân công, ảnh và lịch sử nhất quán; lượt xử lý mới cần ảnh mới.']]),
('UC05 – Lập và phát hành hóa đơn dịch vụ',[
['Tác nhân / mục tiêu','BQL; tạo hóa đơn đúng căn/kỳ và cho cư dân tra cứu.'],['Tiền điều kiện','Căn hợp lệ; phí và chỉ số phù hợp kỳ; chưa có hóa đơn còn hiệu lực trùng.'],['Đầu vào','Căn, kỳ, ngày chốt; đơn giá/chỉ số/xe; khi gửi có hạn và thông tin nhận tiền.'],['Luồng chính','1. Chuẩn bị dữ liệu. 2. Lập nháp và các dòng snapshot. 3. Duyệt sau kiểm tra nguồn. 4. Gửi và lưu thông tin chuyển khoản. 5. Cư dân xem hóa đơn/VietQR.'],['Ngoại lệ','Thiếu giá/chỉ số: chưa đủ điều kiện duyệt; nguồn đổi: cần tính lại; bản cũ: 409; lô có lỗi: rollback toàn lô.'],['Hậu điều kiện','Hóa đơn DA_GUI có thể được xem theo quyền; quét QR không tự đổi DA_THANH_TOAN.']])]
for title,rows in ucs:tb(title,['Thành phần','Đặc tả'],rows)
p('Năm ca sử dụng trên làm rõ ranh giới giữa thao tác trên giao diện và điều kiện chấp nhận tại máy chủ. Kiểm thử phải kiểm cả nhánh thành công lẫn nhánh dữ liệu cũ, ngoài phạm vi hoặc gửi lại. Mã lỗi là kết quả kỹ thuật; thông báo cho người dùng cần chỉ rõ cách tiếp tục, ví dụ tải lại dữ liệu trước khi phân công lần nữa.')

h(2,'2.3. MÔ HÌNH HÓA HOẠT ĐỘNG VÀ TƯƠNG TÁC')
h(3,'2.3.1. Sơ đồ hoạt động của bốn quy trình chính')
f(5,'Hoạt động tạo và xuất mã QR vị trí','BQL nhập vị trí, chọn liên kết thiết bị khi cần và xác nhận tạo. Máy chủ kiểm tra quyền, loại vị trí và thiết bị trước khi lưu. Ảnh QR được sinh từ URL của vị trí đã tồn tại; xem, tải và in không phải ba lần tạo dữ liệu. Khi thay origin triển khai, cần in lại URL phù hợp hoặc giữ tên miền ổn định.')
f(6,'Hoạt động quét QR và gửi phản ánh','Người dùng có thể dùng camera hệ điều hành hoặc máy quét trong trang. Token được tra lại khi mở và khi gửi; biểu mẫu hiển thị vị trí do máy chủ trả về. Ảnh được chuẩn bị ở trình duyệt rồi kiểm lại tại backend. Lỗi nhập giữ nội dung để sửa; yêu cầu thành công trả mã tra cứu cần lưu riêng.')
f(7,'Hoạt động phân công, xử lý và nghiệm thu','Quy trình chia trách nhiệm giữa BQL và KTV. KTV không tự nghiệm thu công việc của mình. Nhánh trả lại tăng lượt xử lý và yêu cầu minh chứng mới ở lần nộp tiếp theo. Việc phân công lại được ghi lịch sử; quyền của KTV cũ được kiểm tra lại khi truy cập tiếp.')
f(8,'Hoạt động lập, duyệt và gửi hóa đơn','Các bước lập nháp, duyệt, gửi và xác nhận thu có điều kiện riêng. Nháp dùng nguồn phí/chỉ số/xe; duyệt kiểm tra nguồn còn phù hợp; gửi giữ snapshot đã duyệt và thêm thông tin nhận tiền. BQL chỉ xác nhận thu sau đối soát. Khi xử lý theo lô, một hóa đơn không hợp lệ làm thất bại cả lần xác nhận thay vì bỏ qua âm thầm.')
h(3,'2.3.2. Sơ đồ tuần tự của các luồng nghiệp vụ')
f(9,'Tuần tự tạo mã QR vị trí','Giao diện gửi thông tin vị trí đến API BQL; middleware xác thực trước service. Service lưu dữ liệu và thông tin liên kết trong giao dịch rồi trả vị trí/token. Frontend dựng ảnh QR từ URL bằng thư viện qrcode [10]. Không có một dịch vụ ảnh QR bên ngoài nhận dữ liệu vị trí trong luồng này.')
f(10,'Tuần tự quét QR và gửi phản ánh','Trình duyệt lấy thông tin công khai bằng token, sau đó gửi multipart chứa nội dung, ảnh và khóa yêu cầu. Backend kiểm tra phiên bản QR, chuẩn hóa ảnh và lưu snapshot thiết bị. Biên nhận thành công được trả sau khi giao dịch commit; lần gửi lại hợp lệ trả biên nhận trước. Thứ tự này tránh thông báo thành công khi dữ liệu chưa được lưu bền vững.')
f(11,'Tuần tự điều phối và chuyển trạng thái phản ánh','API kiểm tra danh tính và vai trò trước khi service khóa bản ghi, so phiên bản và xác minh người đang được giao. Thay đổi trạng thái cùng sự kiện lịch sử được ghi trong một giao dịch. Nếu có xung đột, API trả lỗi và giao diện yêu cầu tải lại, giữ phân biệt giữa một quyết định bị từ chối và lỗi kết nối.')
f(12,'Tuần tự tra cứu hóa đơn và hiển thị VietQR','Cư dân yêu cầu chi tiết hóa đơn; máy chủ kiểm tra quyền căn/đợt cư trú hoặc tài khoản thanh toán căn. Chỉ dữ liệu cho phép và payload của hóa đơn DA_GUI được trả về. Frontend dựng ảnh QR cục bộ. Luồng không gọi API ngân hàng, không nhận webhook và không phát sinh trạng thái thanh toán chỉ vì ảnh đã được hiển thị.')
h(3,'2.3.3. Mô hình trạng thái phản ánh')
f(13,'Vòng đời và điều kiện chuyển trạng thái phản ánh','Luồng chính là MOI → DA_PHAN_CONG → DANG_XU_LY → DA_XU_LY → DA_DONG. DA_XU_LY có thể bị trả lại DANG_XU_LY với lý do. TU_CHOI và TRUNG_LAP là nhánh xử lý phản ánh mới. Trạng thái thể hiện tiến độ, còn phân công hiện tại là dữ liệu riêng; đổi KTV không nhất thiết khởi động lại toàn bộ vòng đời.')
tb('Quy tắc chuyển trạng thái phản ánh',['Chuyển trạng thái','Người thực hiện','Điều kiện chính'],[
['MOI → DA_PHAN_CONG','BQL','KTV hợp lệ, phiên bản hiện tại'],['DA_PHAN_CONG → DANG_XU_LY','KTV hiện được giao','Đúng phạm vi công việc'],['DANG_XU_LY → DA_XU_LY','KTV hiện được giao','Có kết quả và ảnh mới của lượt xử lý'],['DA_XU_LY → DA_DONG','BQL','Nghiệm thu đạt'],['DA_XU_LY → DANG_XU_LY','BQL','Có lý do trả lại, tăng lượt xử lý'],['MOI → TU_CHOI / TRUNG_LAP','BQL','Có lý do; gộp đúng vị trí/thiết bị, không tạo vòng']
])

h(2,'2.4. THIẾT KẾ CẤU TRÚC TĨNH VÀ CƠ SỞ DỮ LIỆU')
h(3,'2.4.1. Sơ đồ lớp phân tích và ánh xạ mô-đun')
f(14,'Sơ đồ lớp phân tích các khái niệm trọng tâm','Sơ đồ biểu diễn các khái niệm người dùng, căn hộ, cư dân, vị trí QR, thiết bị, phản ánh và hóa đơn cùng các trách nhiệm nghiệp vụ. Trong hiện thực, các trách nhiệm được phân bổ cho service/repository và các component React, không sử dụng ORM. Tên phương thức ở mức phân tích mô tả hành vi, không thay thế bảng API ở chương 3.')
p('Một mô hình phân tích có thể dùng thuật ngữ đối tượng để diễn giải nghiệp vụ dù chương trình dùng hàm và mô-đun. Chẳng hạn, trách nhiệm “phân công phản ánh” được hiện thực trong incidents.service.js; việc đọc danh sách có phạm vi quyền nằm trong incidents.repository.js. Cách ánh xạ này giúp kiểm tra từ mục tiêu nghiệp vụ đến tệp thực thi mà không tạo ra lớp giả chỉ để khớp sơ đồ.')
h(3,'2.4.2. ERD thống nhất và phạm vi mô hình dữ liệu')
f(15,'ERD thống nhất 18 bảng trọng tâm, 218 thuộc tính và 46 quan hệ','Hình 2.15 biểu diễn 18 bảng nghiệp vụ trọng tâm trên một trang. Các cột oval liệt kê đủ 218 thuộc tính và các hình thoi biểu diễn đủ 46 khóa ngoại giữa các bảng. Bản draw.io, SVG và PDF vector cho phép phóng to để đọc thuộc tính. Phụ lục 2 mô tả đúng 18 bảng trong hình. Từ điển kỹ thuật đi kèm ghi cấu trúc toàn bộ 31 bảng và 81 khóa ngoại của CSDL triển khai.')
p('Mô hình giữ các nhóm quan hệ xuyên suốt: khối – tầng – căn; cư dân – lịch sử cư trú – căn; thiết bị – vị trí QR – phản ánh; căn – hóa đơn – dòng hóa đơn; người dùng – thông báo – biên nhận đọc. Người dùng là điểm tham chiếu của nhiều hành động tạo, giao và xác nhận, vì vậy các nhóm có liên hệ khóa ngoại và không thể gọi là những cơ sở dữ liệu độc lập.',
'Ở mức logic, lịch sử nghiệp vụ được nhìn theo từng loại sự kiện. Ở mức vật lý, tám loại lịch sử dùng chung bảng nhat_ky_nghiep_vu, còn các tên lịch sử là view. Mỗi sự kiện giữ đối tượng liên quan, người thao tác, thời điểm và payload có kiểm tra. Thiết kế giảm số bảng lịch sử nhưng vẫn cần ràng buộc về đúng loại đối tượng và schema JSON; không chỉ gom mọi nội dung vào một chuỗi tùy ý.')
tb('Nhóm bảng và vai trò trong thiết kế dữ liệu',['Nhóm','Các bảng tiêu biểu','Vai trò / chú ý'],[
['Cấu trúc và cư trú','khoi_toa_nha, tang_toa_nha, can_ho, cu_dan, lich_su_cu_tru, phuong_tien','Căn thuộc khối/tầng; quan hệ cư trú có khoảng thời gian'],
['Danh tính và QR','nguoi_dung, thiet_bi, vi_tri_qr','Tách tài khoản cá nhân/căn; QR liên kết thiết bị tùy chọn'],
['Phản ánh','phan_anh, hinh_anh_phan_anh','Snapshot thiết bị, phiên bản, ảnh theo lượt xử lý'],
['Phí và hóa đơn','loai_phi, cau_hinh_phi, chi_so_dich_vu, hoa_don, chi_tiet_hoa_don','Lưu giá và tiền tại thời điểm chốt, chống hóa đơn trùng'],
['Thông báo','thong_bao, thong_bao_da_doc','Phạm vi phát hành và biên nhận đọc riêng'],
['Mở rộng nghiệp vụ','phieu_bao_tri, tien_ich, dat_lich_tien_ich, quy_tai_chinh, phieu_thu_chi, chung_tu_thu_chi','Có trong schema đầy đủ, không thêm vào hình ERD 18 bảng'],
['Kỹ thuật và nhật ký','nhat_ky_nghiep_vu, yeu_cau_gui, gioi_han_gui, dot_nhap_du_lieu, dot_lap_hoa_don, dot_xu_ly_hoa_don, schema_migrations','Nhật ký, chống lặp, giới hạn và theo dõi migration']
])
h(3,'2.4.3. Thiết kế chi tiết bảng và ràng buộc')
p('Phụ lục 2 mô tả đủ 18 bảng và 218 thuộc tính của Hình 2.15, gồm kiểu MySQL, khả năng NULL, vai trò khóa và đích tham chiếu. Mỗi khóa ngoại ghép được trình bày theo đúng tổ hợp cột. Từ điển kỹ thuật mô tả toàn bộ schema gồm 31 bảng và 362 cột. Mã SQL gốc quy định đầy đủ chỉ mục UNIQUE, ràng buộc CHECK và biểu thức của các cột sinh.',
'Ba quyết định cần chú ý là khóa ghép tầng theo khối, cột sinh để giới hạn một bản còn hiệu lực, và các cột phiên bản để kiểm tra cập nhật cũ. Khóa ngoại bảo vệ sự tồn tại của cha/con, nhưng không tự diễn giải được quyền của KTV hoặc điều kiện ảnh nghiệm thu. Các quy tắc này được service kiểm tra dưới khóa và được thử bằng các tình huống đồng thời. Tài liệu kiểm thử khóa ngoại của MySQL cho thấy hành vi ràng buộc cần được kiểm chứng tại hệ quản trị thay vì chỉ nhìn đường nối trên hình [8].')
tb('Các ràng buộc dữ liệu trọng tâm',['Đối tượng','Ràng buộc / quy tắc','Ý nghĩa'],[
['Căn hộ','(khoi, tang) → tang_toa_nha','Không có căn thuộc một tầng chưa khai báo'],
['Cư trú','Cư dân, căn và khoảng tu_ngay/den_ngay','Giữ lịch sử và xác định quyền theo đợt'],
['QR','Token duy nhất; phien_ban; thiết bị tùy chọn','Thu hồi mã, phát hiện form cũ và liên kết hợp lệ'],
['Phản ánh','Các FK vị trí/người; snapshot; phiên bản','Truy vết nơi gửi và chống ghi đè'],
['Ảnh','FK phản ánh; loại ảnh và lượt xử lý','Kiểm soát minh chứng của mỗi lần nộp'],
['Hóa đơn','UNIQUE căn/kỳ còn hiệu lực; chi tiết snapshot','Không trùng bản hiệu lực và không tính lại ngầm'],
['Nhật ký','FK theo đối tượng; CHECK và JSON schema','Ghi đúng sự kiện trong cùng giao dịch'],
['Lô thao tác','Khóa yêu cầu duy nhất theo người thao tác','Thử lại an toàn sau lỗi mạng']
])

h(2,'2.5. KIẾN TRÚC HỆ THỐNG VÀ LỰA CHỌN CÔNG NGHỆ')
h(3,'2.5.1. Kiến trúc ba tầng và dữ liệu vào – ra')
f(16,'Kiến trúc ba tầng React – Express – MySQL','Tầng trình bày React gửi HTTP đến Express qua API cùng nguồn; Express kiểm tra danh tính, quyền và nghiệp vụ trước khi truy vấn MySQL. Ảnh chuẩn hóa nằm trong storage được truy cập qua endpoint có kiểm tra quyền. QR được dựng cục bộ từ dữ liệu trả về. Khi phát triển, Vite proxy /api đến backend; khi triển khai cần cấu hình reverse proxy/HTTPS phù hợp.')
f(17,'Luồng dữ liệu phản ánh từ QR đến nghiệm thu','Dữ liệu đầu vào gồm token vị trí, nội dung, ảnh, khóa yêu cầu và phiên bản. Hệ thống tạo phản ánh và lịch sử, đưa công việc đến BQL/KTV và trả tiến độ theo quyền người đọc. Phản hồi công khai chỉ gồm tập trường cho phép; log nội bộ và tệp ảnh không theo cùng đường xuất công khai. Hình thể hiện cả dữ liệu nghiệp vụ lẫn điểm kiểm tra tại ranh giới máy chủ.')
h(3,'2.5.2. Lý do lựa chọn và các phương án thay thế')
tb('Lựa chọn thiết kế và công nghệ',['Lựa chọn','Lý do trong phạm vi đề tài','Đánh đổi'],[
['Web thích ứng','Một địa chỉ cho BQL và cư dân; mở liên kết QR trực tiếp','Phụ thuộc mạng, trình duyệt, HTTPS và quyền camera'],
['React + Router','Tổ chức theo component/nghiệp vụ, giữ ngữ cảnh danh sách','Cần xử lý dữ liệu cũ, request hủy và trạng thái lỗi'],
['Node.js + Express','Cùng JavaScript; route/middleware rõ','Không tự bảo đảm nhanh hoặc an toàn nếu thiếu đo/kiểm tra'],
['MySQL + mysql2','Quan hệ, giao dịch, khóa và ràng buộc phù hợp','Cần kiểm soát thứ tự khóa và migration'],
['CSS riêng','Tận dụng thiết kế và component sẵn có','Cần tự duy trì responsive, focus và tính nhất quán'],
['QR cục bộ','Không gửi dữ liệu hóa đơn sang dịch vụ tạo ảnh ngoài','Cần kiểm thử payload và khả năng đọc trên ứng dụng thực tế']
])
p('React, Express, Node.js và Vite được chọn theo vai trò cụ thể trong chuỗi triển khai, phù hợp các khả năng được mô tả trong tài liệu chính thức [1], [4], [7], [11]. Phương án ứng dụng native có thể kiểm soát một số khả năng thiết bị tốt hơn nhưng làm phát sinh thêm nền tảng và bước cài đặt. Phương án nhiều dịch vụ nhỏ làm tăng yêu cầu vận hành trong khi quy mô đề tài chưa cần; kiến trúc mô-đun trong một backend thuận lợi hơn cho giao dịch xuyên nghiệp vụ.',
'Sự khác biệt với đề cương được công khai: stylesheet riêng thay cho lựa chọn Tailwind/Bootstrap; thư viện jose thay cho jsonwebtoken; Node.js 24 làm phiên bản chạy chuẩn theo .nvmrc. Các thay đổi không làm mất những mục tiêu chính, nhưng cần được kiểm chứng bằng kết quả phần mềm thay vì tiếp tục liệt kê thư viện chưa cài đặt.')

h(2,'2.6. THÁCH THỨC KỸ THUẬT VÀ THUẬT TOÁN XỬ LÝ')
h(3,'2.6.1. Quét camera và kiểm tra URL QR')
p('Điều kiện đầu tiên của máy quét trong Web là ngữ cảnh bảo mật. Sau khi người dùng bấm mở camera, chương trình kiểm window.isSecureContext, tải html5-qrcode, chọn facingMode là environment và bắt đầu nhận diện. Khi giải mã được một chuỗi, chương trình không điều hướng ngay đến mọi địa chỉ mà gọi bộ kiểm tra URL. Điều kiện quyền và lỗi thiết bị được xử lý phù hợp với tài liệu getUserMedia [6].',
'Bộ kiểm tra chỉ chấp nhận http/https, đường dẫn /r/{UUID}, không có username/password, query hoặc fragment. URL cùng nguồn được chấp nhận; một số hostname/IP mạng nội bộ cũ được chuẩn hóa về đường dẫn ở nguồn đang mở. Trình duyệt không truy cập origin cũ trong bước này. Máy chủ hiện tại tiếp tục kiểm tra token và trạng thái; chuẩn hóa URL không tự làm một QR đã thu hồi trở nên hợp lệ.',
'Thuật toán tạo QR có đầu vào là URL định danh và đầu ra là ảnh để in. Token UUID v4 được sinh ngẫu nhiên, không phải mã căn hộ chứa dữ liệu cá nhân. Tạo lại QR đổi token; đổi liên kết thiết bị giữ token nhưng tăng phiên bản. qrcode là thư viện mã hóa ký hiệu QR, còn html5-qrcode giải mã ký hiệu về chuỗi [3], [10]. Nội dung URL không được gọi là mã hóa mật mã.')
code('Giả mã kiểm tra và mở liên kết QR', '''Nhận chuỗi đã giải mã và origin đang mở.
Phân tích URL, từ chối chuỗi rỗng hoặc vượt giới hạn.
Kiểm tra giao thức, định dạng /r/{UUID} và nguồn cho phép.
Từ chối query, fragment và thông tin đăng nhập trong URL.
Điều hướng đến pathname trên origin hiện tại.
Gọi API tra token; chỉ mở form khi vị trí còn hoạt động.''')
h(3,'2.6.2. Xử lý ảnh và thử lại khi lỗi mạng')
p('Ở trình duyệt, ảnh thư viện được kiểm tra định dạng rồi giải mã tuần tự để tránh giữ nhiều ảnh lớn đồng thời. Canvas tạo JPEG với cạnh dài tối đa 1600 px và chất lượng 0,85. Bộ tệp đã xử lý được dùng cho cả xem trước và FormData; thao tác gửi bị chặn khi còn giải mã. Tại máy chủ, giới hạn nghiệp vụ là tối đa 5 ảnh, 5 MB mỗi ảnh và 25 triệu điểm ảnh mỗi tệp.',
'Giao dịch tạo phản ánh lưu cả khóa yêu cầu, dấu vân tay và biên nhận. Khi mạng đứt sau commit, người dùng gửi lại cùng khóa để nhận đúng kết quả đã có. Khi giao dịch thất bại, ảnh đã chuẩn bị được dọn theo nhánh lỗi. Một giới hạn còn lại là chưa có tác vụ định kỳ dọn ảnh mồ côi nếu tiến trình bị dừng bất thường; đây là công việc vận hành cần bổ sung.')
h(3,'2.6.3. Trạng thái, đồng thời và lịch sử')
p('Mỗi lần phân công hoặc chuyển trạng thái đọc bản ghi trong giao dịch, so phien_ban, kiểm người thao tác và điều kiện trạng thái đích. Nếu hợp lệ, service cập nhật dữ liệu, tăng phiên bản và ghi nhật ký. Nếu bản ghi đã đổi, API trả 409 để người dùng đọc lại. Khóa ngăn hai giao dịch cùng sửa một thời điểm; phiên bản còn giúp phát hiện một biểu mẫu được mở từ trước.',
'Thứ tự khóa cần nhất quán giữa các nghiệp vụ có chung đối tượng. Các luồng tài chính khóa căn trước hóa đơn và các dữ liệu liên quan; các luồng QR kiểm tra vị trí trước thiết bị theo thiết kế service. Không dùng việc “khóa mọi bảng” để né xung đột, vì cách đó làm tăng cạnh tranh và không giải quyết được quyền truy cập. Kiểm thử cố ý tạo lỗi audit để xác nhận trạng thái và lịch sử cùng rollback.')
h(3,'2.6.4. Tính tiền, chốt nguồn và VietQR')
p('Các số tiền trong MySQL dùng DECIMAL và được trao đổi dưới dạng chuỗi; JavaScript xử lý phép tính bằng BigInt đã nhân hệ số thập phân. Với đơn giá thông thường, thành tiền là số lượng nhân đơn giá rồi làm tròn theo quy tắc của service. Với điện bậc thang, sản lượng được phân bổ theo các ngưỡng tăng dần, bậc cuối không giới hạn; thuế là một dòng được tính theo cấu hình. Không dùng giá minh họa trong báo cáo để khẳng định đó là biểu giá pháp lý đang áp dụng.',
'Ví dụ tính toán để giải thích thuật toán: chỉ số cũ 120, chỉ số mới 135 tạo sản lượng 15. Nếu đơn giá giả định 10.000 đồng/đơn vị và không có thuế, dòng tiền bằng 150.000 đồng. Ví dụ này không lấy từ hóa đơn thật và không thay thế kiểm thử các bậc điện. Khi duyệt, hệ thống kiểm dấu vân tay nguồn; nếu giá/chỉ số/dữ liệu xe đã đổi, yêu cầu tính lại thay vì duyệt tổng tiền cũ.',
'VietQR được dựng từ dữ liệu nhận tiền đã lưu khi gửi hóa đơn. Hàm backend ghép các trường độ dài–giá trị, thêm số tiền, số hóa đơn và CRC16; frontend dựng ảnh cục bộ bằng qrcode [10]. CRC kiểm tra toàn vẹn chuỗi không chứng minh giao dịch đã xảy ra. Chỉ API xác nhận thanh toán có quyền BQL, đủ tiền và mã tham chiếu mới cập nhật trạng thái đã thu.')

h(2,'2.7. THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG')
h(3,'2.7.1. Giao diện Ban quản lý')
p('Workspace BQL chia nhóm dữ liệu nền, phản ánh, tài chính và các nghiệp vụ vận hành. Danh sách có tìm kiếm, bộ lọc và phân trang; thao tác thêm/sửa, chi tiết, lịch sử và xác nhận mở trong cửa sổ riêng. Cửa sổ có nhãn, nút đóng và quản lý focus; khi đang ghi dữ liệu, đóng hoặc gửi lặp bị chặn theo trạng thái chờ. Sau thao tác thành công danh sách được tải lại theo ngữ cảnh hiện tại.',
'Tổng quan cung cấp số liệu công nợ, thu phí, phản ánh và công việc đang mở. Các thẻ chỉ điều hướng đến nghiệp vụ; mở tổng quan không tự xác nhận thu hay phát hành thông báo. Bộ biểu đồ có thể thu gọn và có bảng số gốc, giúp tránh phụ thuộc hoàn toàn vào hình vẽ. Đây là thiết kế từ giao diện thực thi của sản phẩm; chưa có tệp mockup Figma độc lập để làm bằng chứng.')
h(3,'2.7.2. Giao diện cư dân và kỹ thuật viên')
p('Luồng công khai ưu tiên xác nhận địa điểm, nội dung, thông tin liên hệ và ảnh. Vị trí được hiển thị rõ, không yêu cầu người gửi chọn lại căn hoặc tòa nhà trong một danh mục dài. Sau thành công, mã tra cứu phải được lưu. Màn tra cứu dùng mã riêng và SĐT; khi đăng nhập, các chức năng hóa đơn và thông báo được đặt trong workspace cư dân.',
'Giao diện KTV tập trung công việc được giao, kết quả và ảnh nghiệm thu. Nút chuyển trạng thái chỉ xuất hiện khi phù hợp, nhưng service vẫn kiểm tra lại. Trên màn hình hẹp, nội dung và nút được xếp theo cột; bảng dài cuộn trong vùng bảng. Trình tự focus, nút Esc và dữ liệu sau khi đóng cửa sổ được kiểm tra bằng tự động hóa, tách biệt với đánh giá khả dụng của người dùng thực tế [5].')
p('Thiết kế chương 2 tạo cơ sở hiện thực và kiểm chứng: mỗi mục tiêu có chức năng, mỗi chức năng có điều kiện chấp nhận và mô hình dữ liệu liên quan. Chương tiếp theo trình bày những thành phần đã được xây dựng, ảnh giao diện được tạo từ mã nguồn và bằng chứng kiểm thử tương ứng.')

# Chương 3 và phụ lục được ghép từ tệp thứ hai để dễ chỉnh sửa.
exec((B/'nguon/viet-chuong-3.py').read_text())
blocks=[x for x in blocks if not (x['kind']=='paragraph' and x['text'].startswith(('Từ các cơ sở trên, chương tiếp theo','Một mô hình phân tích có thể dùng thuật ngữ đối tượng','Thiết kế chương 2 tạo cơ sở hiện thực')))]
(B/'nguon/noi-dung.json').write_text(json.dumps(blocks,ensure_ascii=False,indent=2)+'\n')
print('Written blocks',len(blocks),'words',sum(len(str(x).split()) for x in blocks))
