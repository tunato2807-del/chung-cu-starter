# Phương tiện gắn với cư trú

vehicles.routes.js áp dụng xác thực/vai trò BQL cho toàn bộ API. vehicles.validation.js chuẩn hóa biển số, kiểm tra loại xe và trường đăng ký. vehicles.service.js thực hiện danh sách phân trang, chi tiết, tạo và kết thúc đăng ký, đồng thời cung cấp finishStayVehicles/carryStayVehicles cho transaction cư trú.

Mỗi bản ghi giữ căn chịu phí và đợt cư trú; không ghi đè căn cũ khi chuyển. Biển duy nhất trong các đăng ký đang gửi; xe đạp không biển dùng mã đăng ký riêng. Kiểm tra khoảng ngày và khóa cùng thứ tự resident → stay/vehicle để tránh đăng ký trên đợt đã đóng. Mọi lỗi khi chuyển xe rollback cả xe và cư trú. Không có API xóa hoặc sửa bản đã kết thúc.
