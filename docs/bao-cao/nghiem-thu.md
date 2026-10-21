# Ma trận kiểm thử, demo và thực nghiệm

Đối chiếu đề cương mục 3.3–3.4, ngày **21/10/2026**. Kết quả tự động bên dưới được chạy trong workspace Linux/MySQL 8/Node 24.19.0; E2E dùng Chromium ở 1440 px và 375 px. Không suy rộng thành đã thử Windows, Android, Edge/Cốc Cốc, camera thật hoặc chuyển khoản thật.

## Kết quả tự động của lần rà soát này

| Lệnh | Kết quả đã chạy | Giới hạn |
|---|---|---|
| `npm test` | 215 kiểm tra backend đạt, 0 lỗi | HTTP/MySQL trong `chung_cu_test` |
| `npm run test:e2e` | 47 kịch bản đạt, 0 lỗi | Chromium tự động; ảnh/camera có fixture, không đo cảm biến thật |
| `npm run build` | Build frontend đạt | Không tự xác nhận backend hoặc database |
| `node --test scripts/check-local.test.js scripts/export-schema.test.js` | 9 kiểm tra công cụ đạt | Bao gồm file thiếu/.js.txt, API chưa ready, FK ghép/nullable/unique và giới hạn truy vấn metadata |
| `node scripts/check-local.js` | Không có lỗi file/dependency trong checkout này | Chưa xác nhận máy người dùng có cùng bộ file |
| `node --env-file-if-exists=.env scripts/export-schema.js` | Đã xuất 38 bảng, 395 cột, 87 khóa ngoại sau 18 migration | Chỉ metadata schema, không xác nhận chất lượng dữ liệu cư dân/hóa đơn |

Backend/E2E chạy lần lượt vì cùng dùng `chung_cu_test`. Không dùng test database để nhập dữ liệu thật. Có thể tự tái chạy các lệnh trên; không cần ghi số liệu thời gian chạy máy này vào bảng thực nghiệm điện thoại.

## Ma trận nghiệp vụ và kiểm thử

Có [bộ dữ liệu nghiệm thu liên kết đủ 38 bảng](../../samples/nghiem-thu/README.md): database riêng, tài khoản từng vai trò/căn, 13 kỳ hóa đơn, QR/ảnh, mọi nhóm trạng thái và file Excel/PDF. Tạo trên máy demo theo [hướng dẫn VS Code](../cap-nhat-du-lieu-nghiem-thu-vscode.md), rồi dùng README sinh kèm bộ để chọn đúng ID/mã tra cứu/tài khoản. Bộ tạo có 58 kiểm tra API/tệp và 4 kiểm tra bảo vệ DB; không tự điền đạt vào cột máy thật.

“Đạt tự động” nghĩa ca kiểm thử liên quan đã chạy đạt trong các suite ở trên. Cột máy thật cố ý để chưa nghiệm thu; điền kết quả, thời điểm, người thử và ảnh minh chứng khi thực hiện.

| ID / UC | Ca và dữ liệu/thao tác | Kết quả mong đợi | Nguồn kiểm thử đạt tự động | Máy thật |
|---|---|---|---|---|
| TC-01 / UC-01 | Đăng nhập hợp lệ từng vai trò | Vào đúng workspace, API trả đúng người dùng | `backend/test/workflow.test.js`, `e2e/workflow.spec.js` | Chưa nghiệm thu |
| TC-02 / UC-01 | Sai mật khẩu nhiều lần, tài khoản khóa | Không cấp phiên, khóa/rate limit đúng | `backend/test/workflow.test.js` | Chưa nghiệm thu |
| TC-03 / UC-01 | Cư dân/KTV gọi API BQL, đọc ID/ảnh ngoài phạm vi | Bị từ chối, không lộ dữ liệu | `backend/test/workflow.test.js`, `equipment-qr.test.js` | Chưa nghiệm thu |
| TC-04 / UC-01 | Đổi chủ hộ, thử SĐT cũ/mới và phiên cũ | Alias chuyển đúng người, phiên cũ mất hiệu lực | `backend/test/apartment-phone-login.test.js`, `e2e/apartment-accounts.spec.js` | Chưa nghiệm thu |
| TC-05 / UC-02 | Tạo QR khu vực/thiết bị, mở/in | Đúng URL, tên vị trí, thiết bị đã chọn | `e2e/workflow.spec.js`, `e2e/equipment-qr.spec.js` | Chưa thử mã in |
| TC-06 / UC-02 | Thu hồi/thay mã, mở token cũ | QR cũ không còn dùng để gửi mới | `backend/test/workflow.test.js` | Chưa nghiệm thu |
| TC-07 / UC-03 | Quét bằng camera native và camera trong web | Mở đúng form; camera web cần HTTPS/quyền | Các E2E kiểm tra form, không thay camera vật lý | Chưa đo thiết bị |
| TC-08 / UC-03 | Điền nội dung, chọn ảnh thư viện và chụp ảnh | Preview đúng; nội dung không mất; gửi có ảnh | `e2e/gallery-upload.spec.js`, `in-page-photo.spec.js` | Chưa thử đủ trình duyệt |
| TC-09 / UC-03 | Điện thoại tải lại trang sau thư viện | Khôi phục nội dung nháp còn hạn; chọn lại ảnh | `e2e/report-draft.spec.js` | Chưa nghiệm thu |
| TC-10 / UC-03 | Gửi lại cùng khóa/cùng nội dung, kể cả đồng thời | Một phản ánh, trả cùng mã tra cứu | `backend/test/workflow.test.js` | Chưa nghiệm thu |
| TC-11 / UC-03 | BQL đổi liên kết QR khi form đang mở | Tab cũ 409; snapshot cũ không bị gán lại | `backend/test/equipment-qr.test.js`, `e2e/equipment-qr.spec.js` | Chưa nghiệm thu |
| TC-12 / UC-04 | Phân công rồi đổi kỹ thuật | Người mới có quyền, người cũ mất quyền | `backend/test/workflow.test.js`, `e2e/workflow.spec.js` | Chưa nghiệm thu |
| TC-13 / UC-04 | Hoàn thành thiếu ghi chú/ảnh mới; BQL trả lại | Chặn hoàn thành thiếu; lượt sau phải có ảnh mới | `backend/test/workflow.test.js` | Chưa nghiệm thu |
| TC-14 / UC-04 | Nghiệm thu rồi tra cứu bằng mã/SĐT | Đúng tiến độ, không lộ ghi chú nội bộ/ảnh riêng | `backend/test/workflow.test.js`, `e2e/workflow.spec.js` | Chưa nghiệm thu |
| TC-15 / UC-05 | Điện qua nhiều bậc + thuế; xe theo loại | Các lượng/giá/thành tiền và tổng khớp | `backend/test/electricity.test.js`, `billing.test.js`, `e2e/billing.spec.js` | Chưa đối chiếu mẫu tay |
| TC-16 / UC-05 | Nguồn đổi sau lập nháp; duyệt/gửi lô bị lỗi | Không duyệt snapshot cũ; không lưu một phần lô | `backend/test/billing-batch.test.js`, `billing-batch-actions.test.js` | Chưa nghiệm thu |
| TC-17 / UC-05 | Cư dân mở hóa đơn căn khác; KTV gọi tài chính | Không lộ hóa đơn ngoài quyền | `backend/test/billing.test.js` | Chưa nghiệm thu |
| TC-18 / UC-05 | BQL xác nhận đủ tiền; gửi lặp/lệch tổng | Chỉ thu đúng tổng một lần; đã thu không còn QR | `backend/test/billing.test.js`, `e2e/billing.spec.js` | Chưa đối soát thực tế |
| TC-19 / Mở rộng | Khối/tầng trống, đổi mã/số, chuyển căn trong ngày | Giữ dữ liệu/ID và lịch sử, số người đúng | `backend/test/building-structure.test.js`, `residency.test.js`, `e2e/building-structure.spec.js` | Chưa nghiệm thu |
| TC-20 / Mở rộng | Nghiệm thu phiếu bảo trì định kỳ | Đúng ngày kế tiếp; trả lại chưa dời lịch | `backend/test/maintenance.test.js`, `e2e/maintenance.spec.js` | Chưa nghiệm thu |
| TC-21 / Mở rộng | Hai người đặt cùng giờ, duyệt/hủy | Không trùng, đúng quyền, hủy trả chỗ | `backend/test/amenities.test.js`, `e2e/amenities.spec.js` | Chưa nghiệm thu |
| TC-22 / Mở rộng | Nhắc phí, đọc thông báo, công nợ và thu/quỹ | Đúng người nhận, không nhân tiền do join hoặc thu trùng | `announcements.test.js`, `financial-reports.test.js`, `treasury.test.js` trong `backend/test` | Chưa đối soát thực tế |
| TC-23 / Mở rộng | Excel/PDF biểu mẫu, một dòng sai, xuất theo lọc | Preview rõ lỗi, không nhập một phần, không cắt báo cáo | `backend/test/data-exchange.test.js`, `report-exports.test.js`, `e2e/data-exchange.spec.js` | Chưa thử file thực tế |

## Bảng thực nghiệm QR trên thiết bị thật

Trước thử: backend ready; frontend HTTPS có chứng chỉ được điện thoại tin cậy; QR tạo theo origin điện thoại truy cập được. Xem [hướng dẫn HTTPS](../https-local.md). Không dùng `localhost` của máy tính làm link điện thoại. Ghi model máy, OS và phiên bản trình duyệt thực tế, không chỉ ghi tên Chrome.

Lặp 10 lần cho mỗi loại quét: (1) camera native mở URL và (2) camera trong web đọc QR. Với mỗi lần, ghi thời gian từ khi QR nằm rõ trong khung đến khi hiện đúng vị trí form; lần không thành công ghi lỗi/timeout, không bỏ khỏi tổng. Thử quyền camera được cấp, bị từ chối rồi cấp lại, chuyển tab, thư viện ảnh, chụp ảnh và gửi. Nếu lấy trung bình chỉ các lần thành công thì phải ghi rõ và đồng thời báo tỉ lệ thành công.

| Thiết bị / OS | Trình duyệt + phiên bản | HTTPS tin cậy | Native thành công / 10 | Web camera thành công / 10 | Thời gian từng lần / đơn vị giây | Chọn/chụp/gửi ảnh | Lỗi và ảnh minh chứng |
|---|---|---|---|---|---|---|---|
| Chưa ghi | Chrome Android | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa nghiệm thu | |
| Chưa ghi | Edge Android | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa nghiệm thu | |
| Chưa ghi | Cốc Cốc Android | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa nghiệm thu | |
| Chưa ghi | Safari iOS, nếu có máy | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa nghiệm thu | |
| Chưa ghi | Zalo Browser, nếu cần | Chưa đo | Chưa đo | Chưa đo | Chưa đo | Chưa nghiệm thu | |

Giữ file log thực nghiệm riêng: thời điểm, lượt, thành công/thất bại, số giây, ánh sáng/khoảng cách, kích thước QR và thông báo lỗi. Không lấy viewport Chromium 375 px thay cho Android. Không điền số giả hoặc ghi “Pass” cho ca chưa thử.

## Kịch bản demo và hình cho chương 3.3

Chỉ dùng dữ liệu demo, che thông tin cá nhân/mã tra cứu/token QR và không chụp mật khẩu thật.

| Hình đề xuất | Màn hình và nội dung cần chứng minh | Tình trạng |
|---|---|---|
| H01 | Đăng nhập → tổng quan theo vai trò BQL | Chưa chọn ảnh nghiệm thu |
| H02 | Khối/tầng/căn và hồ sơ/chủ hộ/tài khoản căn | Chưa chọn ảnh nghiệm thu |
| H03 | Thiết bị → liên kết QR → in mã đúng URL | Chưa chọn ảnh nghiệm thu |
| H04 | Điện thoại mở form đúng vị trí, chọn/chụp ảnh có preview | Cần ảnh thiết bị thật |
| H05 | Gửi thành công, có mã tra cứu được che một phần | Cần ảnh luồng demo |
| H06 | BQL phân công, KTV bắt đầu và gửi bằng chứng | Cần ảnh luồng demo |
| H07 | BQL trả lại/tiếp nhận kết quả mới/nghiệm thu, tra cứu công khai | Cần ảnh luồng demo |
| H08 | Chỉ số, hóa đơn chi tiết bậc điện/xe, duyệt/gửi | Cần đối chiếu tổng mẫu tay |
| H09 | Cư dân xem VietQR, BQL xác nhận thu và công nợ giảm | Không dùng ảnh QR để chứng minh ngân hàng đã trả tiền |
| H10 | Thông báo đã/chưa đọc, dashboard theo khoảng ngày | Cần ảnh luồng demo |

Mỗi hình cần số thứ tự, vai trò, dữ liệu đầu vào và kết quả. Trình bày lỗi đã gặp (HTTP LAN chặn camera, thư viện ảnh làm tải lại trang, thiếu file khi chép tay) cùng cách xử lý có bằng chứng; không đưa chúng thành kết quả đã thử trên mọi máy.

## Những mục chưa được công nhận hoàn tất

- Bản Figma/mockup gốc, ảnh demo được chọn và chèn vào Word.
- Kết quả Postman nếu báo cáo ghi sử dụng Postman; test HTTP tự động không chứng minh đã dùng giao diện Postman.
- Ma trận thiết bị/phiên bản/thời gian QR, quyền camera và ảnh trên máy thật.
- Thử tải lớn, đối soát quy trình tiền thật, sao lưu/phục hồi và cấu hình triển khai thực tế.
- Duyệt báo cáo/chuẩn ký pháp hình với GVHD. Bộ Mermaid này cung cấp mô hình và nguồn đối chiếu, không thay quyết định học thuật của GVHD.

Phần mềm hiện đủ các luồng chính để chuẩn bị demo trong phạm vi đề tài; chưa có căn cứ kết luận toàn bộ hồ sơ đồ án hoặc vận hành thực tế “100% hoàn thành”.
