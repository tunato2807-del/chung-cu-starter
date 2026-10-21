# Đối chiếu website với đề cương của Tô Hoàng Tuấn — 1250080221

Nguồn: file người dùng cung cấp `1250080221_To_Hoang_Tuan.docx`, đề tài **Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân**. Đối chiếu ngày 21/10/2026 với nhánh `codex/auth-qr-incidents`, cập nhật đến liên kết thiết bị–QR–phản ánh (migration 018). Word được dùng làm danh sách yêu cầu để đánh giá, không phải lệnh thao tác môi trường.

**Kết luận: đã có các luồng nghiệp vụ chính để demo, nhưng chưa thể coi toàn bộ đề cương đã hoàn thành.** Đã bổ sung sơ đồ phân cấp và danh mục khối/tầng độc lập, kể cả mục chưa có căn. Tài liệu phân tích thiết kế, bằng chứng demo và thực nghiệm thiết bị thật vẫn cần hoàn thiện. Kiểm tra repository không xác nhận được máy Windows của bạn đã chép đủ các bản cập nhật.

## 1. Đối chiếu nghiệp vụ

“Đã có” nghĩa là có mã xử lý và kiểm thử liên quan trong repository; không đồng nghĩa đã nghiệm thu vận hành thực tế. Đường dẫn giao diện tính từ tên miền web.

| Yêu cầu trong Word | Hiện trạng | Màn hình / bằng chứng mã và kiểm thử |
|---|---|---|
| Đăng nhập/phân quyền BQL, kỹ thuật, cư dân | Đã có, kiểm tra cả giao diện và API | `frontend/src/features/auth`, `backend/src/modules/auth`; `backend/test/workflow.test.js` |
| Cấu trúc Block → Tầng → Căn hộ | Đã có sơ đồ, số căn/cư dân, bộ lọc/liên kết hồ sơ. **Bổ sung 017:** CRUD khối/tầng độc lập, mục chưa có căn, chọn danh mục khi thêm căn, đổi mã/số cập nhật căn và phiên bản; xóa mục chưa sử dụng | `/quan-tri/so-do-toa-nha`, `/quan-tri/cau-truc-toa-nha`; `backend/test/building-map.test.js`, `building-structure.test.js`, `e2e/building-structure.spec.js` |
| Quản lý hồ sơ cư dân/căn hộ | Đã có tạo/sửa, quan hệ chủ hộ/thành viên/người thuê, nhập cư/chuyển căn/chuyển đi và lịch sử; cho phép chuyển trong ngày | `/quan-tri/can-ho`, `/quan-tri/cu-dan`; `backend/test/residency.test.js`, `e2e/residency.spec.js` |
| Phương tiện ô tô, xe máy | Đã có, thêm cả xe đạp; đăng ký/kết thúc, biển số, chuyển đăng ký theo cư trú | `/quan-tri/phuong-tien`; `backend/test/vehicles.test.js`, `e2e/vehicles.spec.js` |
| Tài sản và vị trí công cộng | Đã có thiết bị/bảo trì/vị trí. **Bổ sung 018:** chọn/liên kết QR với hồ sơ thiết bị, lịch sử đổi/bỏ liên kết; phản ánh chụp lại thiết bị lúc gửi, hồ sơ thiết bị mở QR hiện tại và phản ánh lịch sử đúng thiết bị | `/quan-tri/thiet-bi`, `/quan-tri/vi-tri-qr`; `backend/test/maintenance.test.js`, `equipment-qr.test.js`, `e2e/equipment-qr.spec.js` |
| Sinh/in QR định danh | Đã có mã riêng theo vị trí, tải PNG/in qua trình duyệt, kích hoạt/vô hiệu hóa/thay mã. Có thể đặt tên vị trí theo thiết bị. Cần thử mã in và tên miền trên điện thoại | `frontend/src/features/qr/Locations.jsx`, `backend/src/modules/qr/qr.routes.js`; `e2e/workflow.spec.js` |
| Quét QR, tự nhận vị trí | Đã có `html5-qrcode`, link `/r/:token`, form lấy vị trí từ server và kiểm tra mã hoạt động | `/quet-qr`, `/r/:token`; `frontend/src/features/incidents/PublicReports.jsx`, `docs/https-local.md` |
| Gửi phản ánh/ảnh không cần đăng nhập hoặc app | Đã có gửi công khai, ảnh thư viện/chụp tại trang, nén/kiểm tra ảnh, bản nháp và chống gửi lặp. Chưa có đủ kết quả thử mọi trình duyệt điện thoại | `backend/src/modules/incidents`, `backend/src/lib/images.js`; `e2e/gallery-upload.spec.js`, `in-page-photo.spec.js`, `report-draft.spec.js` |
| BQL tiếp nhận/phân công | Đã có phân công/phân công lại, từ chối/gộp trùng, nghiệm thu/trả về xử lý | `/quan-tri/phan-anh`; `backend/test/workflow.test.js`, `e2e/workflow.spec.js` |
| Kỹ thuật tiếp nhận → xử lý → hoàn thành, ảnh nghiệm thu | Đã có công việc được giao, trạng thái, ghi chú và ảnh hoàn thành; BQL nghiệm thu riêng. Tên trạng thái nội bộ khác cách mô tả tổng quát trong Word | `/ky-thuat/cong-viec`; `backend/src/modules/incidents/incidents.service.js`, `docs/architecture.md` |
| Cư dân theo dõi tiến độ | Đã có danh sách theo tài khoản và tra cứu công khai bằng mã bí mật + SĐT, không lộ ghi chú nội bộ | `/cu-dan/phan-anh`, `/tra-cuu`; `backend/test/workflow.test.js` |
| Cấu hình phí, số điện/nước, hóa đơn tháng | Đã có giá theo hiệu lực, điện bậc thang/thuế, nước/quản lý/xe, nháp → duyệt → gửi, đơn lẻ/hàng loạt | `/quan-tri/don-gia`, `/quan-tri/chi-so`, `/quan-tri/hoa-don`; `backend/test/billing.test.js`, `electricity.test.js`, `billing-batch.test.js`, `billing-batch-actions.test.js` |
| Tra cứu hóa đơn và VietQR | Đã có hóa đơn cư dân/tài khoản căn theo chủ hộ phụ trách, chọn ngân hàng, QR số tiền/nội dung. BQL ghi nhận thu thủ công sau đối soát | `/cu-dan/hoa-don`; `backend/test/billing.test.js`, `apartment-phone-login.test.js`, `e2e/billing.spec.js` |
| BQL đăng thông báo, cư dân đọc | Đã có nháp/phát hành, phạm vi nhận, đã/chưa đọc và nhắc phí trên web; không có SMS/email tự động | `/quan-tri/thong-bao`, `/cu-dan/thong-bao`; `backend/test/announcements.test.js`, `e2e/announcements.spec.js` |
| Web responsive máy tính/điện thoại | Có CSS responsive và test Chromium 1440/375 px. **Không thay thế thực nghiệm Android/Edge/Chrome/Cốc Cốc** | `playwright.config.js`, các file `e2e/*.spec.js` |

Đã có thêm ngoài lõi đề cương: tài khoản từng căn, nhắc phí, công nợ/thu phí, bảo trì định kỳ, tiện ích/đặt lịch, thu chi/quỹ, nhập/xuất Excel/PDF biểu mẫu, dashboard/biểu đồ. Không cần tiếp tục mở rộng mọi mảng để chứng minh đề tài QR đã hoàn thành.

## 2. Giới hạn cần ghi đúng

- Một chung cư, không multi-tenant hoặc app native; VietQR không kết nối API ngân hàng/cổng thanh toán và không tự nhận tiền. Đây là giới hạn chủ động trong Word, không phải tính năng bắt buộc còn thiếu.
- In QR qua trình duyệt; chưa có bộ thiết kế tem hoặc xuất PDF tem hàng loạt từ backend.
- Sơ đồ mới là **phân cấp dữ liệu**, không phải mặt bằng kiến trúc có tọa độ. Word chưa yêu cầu rõ mặt bằng tương tác.
- Từ 017, khối/tầng được khai báo riêng xuất hiện khi chưa có căn. Mục tự phát sinh từ API cũ/Excel được lưu làm cha khóa ngoại; khối tự phát sinh không còn căn và không có tầng khai báo riêng được ẩn. Chưa có bản vẽ mặt bằng kiến trúc có tọa độ.
- Từ 018, vị trí loại `THIET_BI` liên kết được với hồ sơ tài sản. BQL phải chọn đúng thiết bị; không tự suy đoán cho QR cũ hoặc gán ngược phản ánh lịch sử. Đổi/bỏ liên kết không thay thiết bị trong các phản ánh đã gửi; không tự biến phản ánh thành phiếu bảo trì hoặc tự nghiệm thu.

## 3. Hồ sơ đồ án chưa đủ bằng chứng

| Mục trong Word | Hiện có trong repository | Cần bổ sung cho báo cáo |
|---|---|---|
| Use Case tổng thể/phân rã, 5 đặc tả cốt lõi | Có mã/mô tả quy trình, chưa thấy bộ đặc tả đầy đủ | Sơ đồ theo 3 vai trò; actor/tiền điều kiện/luồng chính/ngoại lệ: đăng nhập, QR, gửi phản ánh, xử lý, hóa đơn |
| Activity/Sequence Diagram | Có trạng thái dạng văn bản trong `docs/architecture.md`, chưa có đủ bộ sơ đồ | Vẽ đúng luồng tạo/in QR, quét/gửi ảnh, phân công/hoàn thành/nghiệm thu, lập/duyệt/gửi/xem hóa đơn |
| Class Diagram, ERD, từ điển dữ liệu | Có SQL migration/khóa/ràng buộc và `database/README.md` | Lấy schema sau migration 018 làm nguồn, có cả khối/tầng và quan hệ thiết bị–QR–snapshot phản ánh; tránh vẽ theo bản thiết kế cũ |
| Kiến trúc/bảng REST API | Có `docs/architecture.md`, `docs/api.md` | Đưa phần phù hợp vào chương 2–3; mô tả JWT/cookie, quyền API, transaction, lưu ảnh |
| Figma mockup | Chưa tìm thấy file/link Figma trong repository | Bổ sung bản thiết kế của bạn; ảnh chụp website không tự trở thành mockup Figma |
| Môi trường/Postman | Có README/script cài đặt/test API; chưa thấy bộ Postman và cấu hình máy demo | Ghi đúng Windows/Node/MySQL thực tế; thêm request/kết quả Postman, không coi test Linux là đã thử Windows |
| Hình demo BQL/cư dân | Có code và E2E, chưa thấy bộ ảnh minh chứng chọn cho báo cáo | Chụp trọn luồng bằng dữ liệu demo, chú thích từng bước |
| Test Case/Pass-Fail và thực nghiệm đa thiết bị | Có test tự động, chưa có bảng đo điện thoại mục 3.4.2 | Tổng hợp kết quả tự động, chạy checklist máy thật, ghi lỗi và thời gian nhận diện |
| Kết luận/hạn chế | README/architecture có một số hạn chế | Viết tổng kết theo bằng chứng, tách phần đã có khỏi phần chưa đo/kiểm thử |

Các mục trong Word là **đề cương công việc**, không phải bằng chứng đã thực hiện. Không gom toàn bộ thiết kế/báo cáo vào nhóm “chưa code”.

## 4. Công nghệ cần cập nhật trong báo cáo

| Word | Mã đang dùng | Cách viết phù hợp |
|---|---|---|
| React + TailwindCSS/Bootstrap | React 19 + Vite 7 + CSS riêng | Ghi CSS responsive riêng hoặc thống nhất với GVHD; không ghi đã dùng Tailwind/Bootstrap |
| `jsonwebtoken` | JWT HS256 qua `jose`, cookie HttpOnly | Vẫn có JWT, chỉ khác thư viện |
| Node 18+/20+ | `package.json` yêu cầu >=22.12; README dùng Node 24 | Dùng Node 24 và sửa phần môi trường; không hướng dẫn Node 18 với Vite hiện tại |
| html5-qrcode, multer, QR image | Có `html5-qrcode`, `multer`, `qrcode`, Sharp | Mô tả quét/sinh QR frontend, multipart/kiểm tra ảnh backend |

## 5. Kiểm thử thủ công để nghiệm thu

Dùng dữ liệu demo và HTTPS được điện thoại tin cậy. Tên miền/IP phải khớp chứng chỉ và QR. Camera native quét mã và camera trong trang là hai ca riêng.

| ID | Thao tác | Kết quả mong đợi | Trạng thái trên máy người dùng |
|---|---|---|---|
| NV-01 | Tạo căn ở khối/tầng mới → mở sơ đồ | Đúng khối/tầng/căn, 0 cư dân, Trống | Chưa ghi nghiệm thu |
| NV-02 | Thêm 2 cư dân cùng căn → cập nhật | 1 căn có người ở, 2 cư dân | Chưa ghi nghiệm thu |
| NV-03 | Chuyển cả 2 người sang căn khác trong ngày | Căn cũ trống, căn mới 2 người, giữ lịch sử | Chưa ghi nghiệm thu |
| NV-04 | Tạo/in QR → camera điện thoại quét | Đúng form/vị trí, không bắt đăng nhập | Chưa ghi thực nghiệm đầy đủ |
| NV-05 | Trang quét → cấp camera → quét QR | Mở camera/đọc mã; ghi thời gian và tỉ lệ thành công | Chưa ghi thực nghiệm đầy đủ |
| NV-06 | Điền phản ánh → chọn/chụp ảnh → gửi | Preview/giữ nội dung, đúng ảnh, mã tra cứu | Cần thử lại trên từng trình duyệt |
| NV-07 | Phân công → KTV xử lý/ảnh → nghiệm thu → tra cứu | Đúng trạng thái/ảnh/quyền, không lộ ghi chú nội bộ | Cần chụp minh chứng |
| NV-08 | Chỉ số → lập/duyệt/gửi → cư dân xem VietQR | Các khoản khớp nguồn, đúng thông tin nhận tiền; chưa tự đánh dấu đã thu | Cần đối chiếu thủ công một hóa đơn mẫu |
| NV-09 | Phát hành thông báo → cư dân đọc | Đúng người nhận, cập nhật chưa đọc/đã đọc | Cần chụp minh chứng |
| NV-10 | Bàn giao chủ hộ → thử SĐT/phiên cũ/mới | Chủ mới đăng nhập đúng, phiên cũ hết hiệu lực | Cần chụp minh chứng |

Mẫu bảng thực nghiệm QR — **không điền số đo giả**:

| Máy/Android | Trình duyệt + phiên bản | HTTPS tin cậy | Native → form (thành công/tổng) | Camera web (thành công/tổng) | Thời gian nhận diện | Chọn/chụp/gửi ảnh | Lỗi/ghi chú |
|---|---|---|---|---|---|---|---|
| Điền máy thật | Chrome | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa đo | |
| Điền máy thật | Edge | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa đo | |
| Điền máy thật | Cốc Cốc | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa đo | |

Nếu thử Safari iOS/Zalo Browser, thêm dòng riêng. Ghi rõ lỗi quyền/không hỗ trợ, URL và phiên bản; chụp ảnh/quay ngắn làm bằng chứng, không công bố mật khẩu/token tra cứu.

## 6. Thứ tự hoàn thiện tiếp

Chốt demo QR → phản ánh → xử lý → tra cứu và một luồng hóa đơn, bổ sung UML/ERD/đặc tả và bảng thực nghiệm. Khối/tầng độc lập đã được bổ sung; cần thêm ca kiểm thử tạo mục trống, đổi mã/số khi đã có căn và từ chối xóa mục đang dùng. Không cần tự mở rộng API ngân hàng/app native.

Hướng dẫn mới nhất trong VS Code: [Thiết bị → QR → phản ánh — code đầy đủ 11 file tính năng](cap-nhat-thiet-bi-qr-vscode.md). Nếu chưa có bản Khối & tầng, cập nhật [bản 017](cap-nhat-khoi-tang-vscode.md) trước.

## 7. Kết quả kiểm tra bản sơ đồ ban đầu (trước 017)

Ngày 21/10/2026, trong môi trường Linux của repository:

| Lệnh | Kết quả |
|---|---|
| `npm test` | 196 kiểm tra backend đạt, 0 lỗi; có quyền truy cập, đếm căn/cư dân, phân trang, lịch sử và thay đổi khối/tầng |
| `npm run test:e2e` | 43 kịch bản đạt, 0 lỗi; có sơ đồ ở 1440/375 px, lọc, tải lại, sửa căn, điều hướng cư dân, lỗi/rỗng và chuyển tầng khi request cũ còn chờ |
| `npm run build` | Build frontend thành công |
| Prettier và `git diff --check` | Các file nguồn/kiểm thử mới sửa đúng định dạng, không lỗi khoảng trắng |

Hai bộ backend/E2E chạy nối tiếp trong `chung_cu_test`, tách database phát triển. Bản này không thay migration hoặc thêm thư viện. Kiểm tra tự động không thay thế các phép đo thực tế trong mục 5 hoặc xác nhận bản web đang chạy trên máy của bạn.

## 8. Kết quả bản Khối & tầng độc lập (017)

- `npm test`: **206 kiểm tra đạt**, gồm mục trống, quyền/CSRF, ràng buộc khóa ngoại, trường hợp chữ hoa/thường cũ, đường lưu thật không có trigger fixture, rollback tạo cha khi lưu căn lỗi, chọn tầng đã cũ, giữ ID tài khoản/cư trú/hóa đơn khi đổi mã/số và hai người sửa đồng thời.
- `npm run test:e2e`: **45 kịch bản đạt**, có tạo khối/tầng chưa có căn → chọn danh mục khi thêm căn → đổi số tầng/mã khối → từ chối form cũ → xác nhận xóa mục chưa dùng, ở 1440/375 px. Các luồng nhập/xuất, tài khoản, phản ánh, hóa đơn, bảo trì, tiện ích và quỹ vẫn đạt.
- `npm run build`, Prettier và `git diff --check`: đạt.
- Đã áp dụng 017 và chạy lại migration thành công; production không có trigger fixture. Giữ checksum 001–016, không thay dữ liệu tài chính/cư trú cũ. Các số liệu ở mục 7 là lịch sử của bản trước 017.

Kết quả trên vẫn là môi trường Linux/Chromium, chưa thay việc thử QR trên máy Windows/điện thoại thật theo đề cương.

## 9. Kết quả bản thiết bị → QR → phản ánh (018)

- `npm test`: **215 kiểm tra đạt**. Kiểm tra quyền/CSRF, thiết bị không hợp lệ/ngừng sử dụng, whitelist QR công khai, giả mạo thiết bị từ client, phiên bản biểu mẫu cũ, snapshot không đổi sau liên kết/đổi tên, idempotency, gộp khác thiết bị bị chặn, phạm vi KTV/cư dân, rollback nếu ghi lịch sử lỗi, hai người đổi liên kết và phân trang.
- `npm run test:e2e`: **47 kịch bản đạt**, có chọn thiết bị ở trang tìm kiếm thứ hai → in/xem QR → gửi ảnh → đổi liên kết → chặn tab cũ/khôi phục bản nháp → đọc đúng hồ sơ và lọc phản ánh → bỏ liên kết, ở 1440/375 px. Các luồng trước vẫn đạt.
- Build, Prettier, `git diff --check` đạt; chạy migration 018 và chạy lại runner thành công. QR cũ giữ token, phản ánh trước liên kết không tự được gán thiết bị.

Mục còn phải hoàn thiện cho đề cương vẫn là bộ UML/ERD/đặc tả cập nhật, mockup Figma, ảnh demo và thực nghiệm QR trên thiết bị thật. Liên kết thiết bị không tự lập hay nghiệm thu phiếu bảo trì.
