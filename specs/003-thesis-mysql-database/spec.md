# CSDL MySQL theo đồ án chuyên ngành

Nguồn: `1250080221_To_Hoang_Tuan.docx` vừa tải lại, mục Mục đích cụ thể, Phạm vi chức năng chính, 2.4 và 3.2.1; yêu cầu trực tiếp mới nhất “làm lại CSDL theo đúng đồ án”, “vẫn phải giữ đủ nghiệp vụ”, và lựa chọn quay về MySQL. Yêu cầu này thay lựa chọn PostgreSQL ở feature002, giữ các nguyên tắc bảo toàn dữ liệu, quyền riêng tư và không đánh dấu đã kiểm thử máy thật.

- MySQL 8.0.21+ / 8.4; React/Vite/Express, API và mọi nghiệp vụ đã triển khai tiếp tục hoạt động.
- Trọng tâm: một chung cư, ba vai trò BQL/KTV/cư dân, QR vị trí/tài sản → phản ánh không bắt đăng nhập, ảnh → phân công → xử lý → ảnh nghiệm thu → theo dõi; cấu trúc tòa nhà, căn hộ/cư trú/xe, cấu hình phí/chỉ số/hóa đơn VietQR và thông báo.
- Giữ các phần mở rộng: bảo trì, tiện ích, quỹ/thu chi/chứng từ, nhắc phí/báo cáo, nhập Excel và xuất Excel/PDF, dashboard, bàn giao tài khoản căn/SĐT chủ hộ. Không bỏ lịch sử cư trú vì đây là quan hệ nghiệp vụ quyết định quyền và phí.
- Schema mới có 31 bảng thật:18 bảng nghiệp vụ trọng tâm,6 bảng nghiệp vụ mở rộng,1 nhật ký chung và 6 bảng kỹ thuật. Tám view lịch sử bảo toàn cách đọc của từng phân hệ; chúng không được tính như bảng vật lý.
- Nhật ký chung vẫn có FK tới đối tượng thật, actor và các liên kết KTV/thiết bị; CHECK phân hệ, độ dài và JSON Schema ràng buộc payload. Không dùng ID đa hình không có FK hoặc chuyển dữ liệu tiền/cư trú/hóa đơn vào JSON để giảm số bảng.
- Tạo baseline SQL mới cho database đích mới, không sửa19 migration MySQL cũ. Công cụ chép nguồn MySQL 018/019 chỉ đọc, kiểm checksum, bảo toàn dữ liệu và đối chiếu37 tập dữ liệu cũ qua bảng/view mới; rollback dữ liệu đích khi lỗi. Không xóa nguồn hoặc tự seed lại để thay dữ liệu.
- Có ERD/từ điển từ schema thật, ma trận Word–bảng–nghiệp vụ, dữ liệu mẫu, kiểm thử chức năng và hướng dẫn Windows/GitHub. Không khẳng định đã chuyển CSDL trên PC người dùng hoặc đã nghiệm thu camera thật.
