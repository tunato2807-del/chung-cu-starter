# Căn hộ, cư dân và lịch sử cư trú

BuildingMap.jsx/CSS cung cấp `/quan-tri/so-do-toa-nha`: khối → tầng → thẻ căn, tổng số căn/cư dân, trạng thái có người ở/trống, lọc/phân trang và liên kết sang quản lý căn/cư dân. Tổng hợp toàn bộ khối/tầng, danh sách thẻ 20 căn/trang; bộ lọc trong URL, abort và bỏ kết quả cũ khi đổi tầng. Căn có người ở lấy từ đợt cư trú đang mở, không liên quan cờ tính phí. Khối/tầng được suy ra từ căn đã tạo, chưa có danh mục tầng trống hoặc bản vẽ kiến trúc. Không migration/dependency mới.

Residency.jsx cung cấp Apartments, Residents, ResidentDetail. Các route BQL: /quan-tri/can-ho, /quan-tri/cu-dan và /quan-tri/cu-dan/:id.

Tìm kiếm/phân trang lưu trong URL. Chọn tài khoản chỉ liệt kê tài khoản CU_DAN chưa gắn hồ sơ, có tìm theo tên/SĐT; có thể giữ nguyên liên kết cũ trong lúc danh sách tải hoặc tài khoản bị khóa. Chọn căn tìm trên API, không giới hạn vào trang căn hộ đầu tiên. Biểu mẫu khóa khi gửi, giữ nội dung khi lỗi và dùng phien_ban cho cập nhật.

Căn hộ hiển thị mật khẩu một lần sau tạo, có xem tài khoản/người phụ trách/lịch sử và cấp lại/bàn giao. CHU_HO tự nhận tài khoản căn; nếu đã có người phụ trách khác cần chọn xác nhận bàn giao. Credentials chỉ trong React state, không localStorage/sessionStorage; resource reload không làm mất thông tin vừa cấp.

ApartmentAccounts.jsx cung cấp /quan-tri/tai-khoan-can-ho, tìm/lọc/phân trang và dùng lại ApartmentAccount để cấp mật khẩu/bàn giao; reload danh sách không làm mất khung mật khẩu. Hiển thị cả mã CH và SĐT đăng nhập hiện tại.
