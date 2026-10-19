# Căn hộ, cư dân và lịch sử cư trú

residency.routes.js áp dụng xác thực/vai trò BQL cho mọi endpoint. residency.validation.js kiểm tra ngày lịch Việt Nam, diện tích, tầng, liên hệ và quan hệ cư trú. residency.service.js dùng truy vấn có tham số, khóa hồ sơ và transaction để thêm/sửa/chuyển căn/chuyển đi/nhập cư lại. Danh sách căn, cư dân và tài khoản chưa gắn có tìm kiếm và phân trang.

Căn hộ hiện tại lấy từ lich_su_cu_tru, không sao chép vào cu_dan. phien_ban chặn ghi đè; UNIQUE cột sinh chặn nhiều đợt chưa kết thúc. Chuyển căn giữ lịch sử trong một giao dịch. Không có API xóa cứng hoặc chỉnh sửa hồi tố lịch sử.

apartment-accounts.service.js cấp tài khoản cố định theo căn, gắn CHU_HO phụ trách, đổi mật khẩu/ngắt phiên khi bàn giao, tạm khóa khi chuyển đi; mọi thay đổi và audit cùng transaction. Tài khoản cá nhân giữ riêng, không gán tài khoản căn vào cu_dan.ma_nguoi_dung. Migration 007–008.
