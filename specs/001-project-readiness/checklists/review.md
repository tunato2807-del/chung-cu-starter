# Checklist chất lượng rà soát và nghiệm thu

**Ngày:** 04/11/2026. Checklist kiểm tra cách ghi yêu cầu/bằng chứng, không thay thế test phần mềm.

## Đã kiểm tra trong lượt này

- [x] Pin phiên bản Spec Kit và baseline dự án; phân biệt áp dụng thủ công với chạy CLI/integration.
- [x] Đọc Word gốc, ghi hash/nguồn và giữ chỉ thị trong tài liệu như dữ liệu tham khảo.
- [x] Tách phạm vi Word khỏi các phần mở rộng người dùng đã chọn và các mục chủ động ngoài phạm vi.
- [x] Ghi quy tắc bàn giao từ quyết định trực tiếp của người dùng; không dùng tài khoản căn làm danh tính người gửi.
- [x] 22 FR có nguồn và đường dẫn code/test/task; không dùng độ phủ kế hoạch làm tỷ lệ hoàn thành.
- [x] Mỗi phát hiện có mức rủi ro, loại bằng chứng và giới hạn; Windows chưa chạy không được ghi như đã tái hiện Windows.
- [x] Nháp có ca đổi người thực, không chỉ test đổi ID tài khoản.
- [x] Lỗi phiên thao tác phản ánh có cả mock và MySQL thật trên DB riêng.
- [x] Proxy có hai địa chỉ client thực khác nhau, không chỉ thay header giả lập.
- [x] Kiểm tra config thiếu không đọc `.env` thật hoặc cố đăng nhập DB thật.
- [x] Đếm metadata019 thực tế và so với hồ sơ018, giữ số bảng38.
- [x] Test backend/helper/UI liên quan và build chạy lại; ghi warning và giới hạn API stub.
- [x] Rà soát advisory lockfile, phân biệt số package gắn cờ với số advisory; không force downgrade ExcelJS.
- [x] Runtime app, package/lock và migration001–019 không sửa trong lượt review.

## Còn mở, không tự đánh dấu đạt

- [ ] Khắc phục SK-01/02/03 và thêm regression chứng minh mong đợi sau sửa.
- [ ] Hoàn thiện preflight và kiểm chứng runner trên Windows thật.
- [ ] Đồng bộ tài liệu nghiệp vụ/UML/metadata và ghi rõ phiên bản tài liệu cũ.
- [ ] Thực nghiệm QR/camera/ảnh trên các thiết bị/trình duyệt thật trong đề cương.
- [ ] Bổ sung Figma/Postman/ảnh demo được chọn nếu đưa vào báo cáo.
- [ ] Chốt và đo các ngưỡng phi chức năng chưa có nguồn, ghi đúng môi trường/dữ liệu.
