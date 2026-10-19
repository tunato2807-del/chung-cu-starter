# Căn hộ, cư dân và lịch sử cư trú

Residency.jsx cung cấp Apartments, Residents, ResidentDetail. Các route BQL: /quan-tri/can-ho, /quan-tri/cu-dan và /quan-tri/cu-dan/:id.

Tìm kiếm/phân trang lưu trong URL. Chọn tài khoản chỉ liệt kê tài khoản CU_DAN chưa gắn hồ sơ, có tìm theo tên/SĐT; có thể giữ nguyên liên kết cũ trong lúc danh sách tải hoặc tài khoản bị khóa. Chọn căn tìm trên API, không giới hạn vào trang căn hộ đầu tiên. Biểu mẫu khóa khi gửi, giữ nội dung khi lỗi và dùng phien_ban cho cập nhật.

Căn hộ hiển thị mật khẩu một lần sau tạo, có xem tài khoản/người phụ trách/lịch sử và cấp lại/bàn giao. CHU_HO tự nhận tài khoản căn; nếu đã có người phụ trách khác cần chọn xác nhận bàn giao. Credentials chỉ trong React state, không localStorage/sessionStorage; resource reload không làm mất thông tin vừa cấp.
