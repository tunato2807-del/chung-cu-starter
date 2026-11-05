# Kiểm chứng CSDL đồ án MySQL

Ngày 05/11/2026. Nguồn nghiệp vụ: Word vừa tải lại và yêu cầu trực tiếp giữ đủ nghiệp vụ, quay về MySQL. Nhánh mới `codex/thesis-mysql-database`; bản trước MySQL 38 bảng là `4f658f6`, bản PostgreSQL được giữ ở nhánh cũ. Đây là thay đổi schema và đồng bộ code, không chỉ đổi cách vẽ ERD.

## Kết quả đã thực hiện

| Hạng mục                                    | Môi trường/kết quả                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Schema mới                                  | **31 bảng thật, 362 cột, 81 FK, 8 view**; metadata lấy từ MySQL thật                              |
| Khởi tạo và chạy lại migration              | Thành công trên MySQL 8.4 và **MySQL 8.0.46**, giữ checksum baseline                              |
| Backend/API                                 | **227 test đạt** trên từng phiên bản MySQL 8.4 và 8.0.46                                          |
| Giao diện                                   | **73 test đạt** với MySQL 8.4, Chromium; gồm 1440/375px và kiểm tra layout 320/768/1024px         |
| Công cụ/helper, bật bài chuyển dữ liệu thật | **48 test đạt** trên MySQL 8.0.46                                                                 |
| Bộ mẫu tạo mới                              | **46 kiểm tra nghiệm thu đạt**, dữ liệu trong schema 31 bảng                                      |
| Dữ liệu cũ38 bảng → schema mới              | Đối chiếu **37 tập dữ liệu / 1.756 dòng** qua bảng/view, trước commit; kiểm lại 81 FK             |
| MySQL 8.4 nguồn → MySQL 8.0.46 đích         | Chuyển và đối chiếu đầy đủ bộ mẫu cũ thành công                                                   |
| Kiểm tra ứng dụng trên dữ liệu đã chuyển    | **17 kiểm tra HTTP đạt**, gồm tài khoản/mật khẩu BQL cũ, QR cũ và các danh sách/tổng quan/báo cáo |
| Build frontend                              | Đạt; còn cảnh báo chunk lớn/chỉ thị dependency như bản trước                                      |
| HTTPS/trust/proxy API                       | Đạt bằng chứng chỉ thử nghiệm                                                                     |

Node 24.19.0, Docker MySQL 8.4/8.0.46 và Chromium trong dependency. Các server/database được tạo riêng cho kiểm thử, dùng cấu hình giả lập; không đọc `.env` thật hoặc thay database người dùng. Test Linux/Docker không tự chứng minh máy Windows/Android đã nghiệm thu.

## Bằng chứng giữ đủ nghiệp vụ

Bộ API/browser đi qua xác thực, phân quyền, thu hồi phiên, SĐT chủ hộ/bàn giao, QR vị trí–thiết bị, gửi ảnh/camera/thư viện, mã tra cứu riêng, phân công/xử lý/nghiệm thu, bảo vệ ảnh, chuyển căn cùng ngày, xe theo đợt ở, giá/điện bậc thang/VAT, chỉ số, snapshot hóa đơn, duyệt/gửi theo lô, VietQR, thu phí/công nợ, thông báo/nhắc phí, bảo trì, đặt tiện ích, quỹ/chứng từ/đảo phiếu, dashboard và nhập Excel/xuất Excel-PDF.

Các ca gây lỗi audit được chuyển sang bảng nhật ký chung **kèm điều kiện loại nhật ký**, nên vẫn kiểm tra đúng rollback nghiệp vụ. Ca lỗi ở bản ghi thứ hai của lô vẫn phải hoàn tác toàn bộ lô; không bỏ các assertion đó. Bảng lịch sử cư trú và các snapshot tiền/thiết bị/ảnh không bị gộp hoặc xóa.

Kiểm tra bổ sung của schema mới:

- Đếm thật qua information_schema:31 bảng BASE TABLE và 8 VIEW, không tính view thành bảng.
- Kiểm tra lịch sử QR không đăng nhập, SQL NULL, chuỗi literal “null”, ghi chú tiếng Việt và phản hồi công khai.
- Hai bảng lịch sử cũ có cùng ID được giữ ID gốc riêng theo loại, không va chạm khóa chung.
- MySQL từ chối FK sai, nhóm đối tượng sai và payload JSON thiếu/sai/thừa trường.
- Snapshot JSON chứa số nguyên `9007199254740993` vẫn giữ đúng, không bị làm tròn khi chuyển.
- Giữ cả khoảng trống AUTO_INCREMENT, mật khẩu mã hóa, thời điểm quá khứ và QR token.
- Chuyển nguồn 018 bổ sung cờ quyền riêng tư mà không suy ra danh tính chủ trước; nguồn 019 giữ các trường đã có.
- Lỗi chèn nhật ký giữa chừng và trigger âm thầm đổi dữ liệu đích đều làm đợt chép rollback; danh mục mặc định được phục hồi.
- Từ chối đích có dữ liệu, cấu hình nguồn/đích sai và ghi đè tệp cấu hình đã có.

Trong phát triển, đối chiếu dữ liệu đã phát hiện cột `DEFAULT_GENERATED` bị nhận nhầm thành cột sinh. Bộ chép đã sửa để chỉ bỏ `STORED/VIRTUAL GENERATED`; timestamp cũ được sao chép và được kiểm tra trực tiếp. Các kiểm tra FK cũng được đổi về đúng mã lỗi MySQL khi quay lại hệ quản trị này; không giảm mức kiểm tra FK để cho test qua.

## Tái chạy

Sau khi đã cấu hình đúng MySQL thử nghiệm:

```powershell
npm.cmd test
npm.cmd run test:e2e
node --test scripts/*.test.js
npm.cmd run build
npm.cmd run test:https
```

Backend/browser dùng riêng `chung_cu_test`, chạy lần lượt. Windows cần `npx playwright install chromium`; `test:https` cần OpenSSL. Bài `thesis-copy.integration.test.js` được bỏ qua mặc định; để bật, dùng server MySQL thử nghiệm có quyền tạo/xóa database, đặt `THESIS_DB_TEST=1`, `DB_ENGINE=mysql`, `DB_NAME=chung_cu_test` cùng biến kết nối của server thử nghiệm rồi chạy `node --test scripts/*.test.js`. Bài đó chỉ tạo/xóa các database ngẫu nhiên `chung_cu_copy_test_*` của lượt chạy, không dùng dữ liệu nguồn thật.

## Giới hạn

Chưa chuyển dữ liệu trên máy Windows của người dùng, chưa nghiệm thu camera Android thật, đo tải lớn hoặc kiểm thử backup/phục hồi thực tế. Chưa xử lý các phát hiện ngoài phạm vi của báo cáo Spec Kit cũ. DDL MySQL không rollback toàn bộ; công cụ giữ nguồn, yêu cầu đích mới, báo rõ trạng thái chưa xác nhận nếu mất kết nối lúc commit. Sau khi DB mới nhận ghi, cần đối soát trước khi quay về snapshot cũ. Xem [hướng dẫn](../csdl-do-an-mysql.md).
