# Phân chia trách nhiệm

Frontend: app/ ghép ứng dụng; features/ theo nghiệp vụ; shared/ cho phần dùng chung; styles/ cho giao diện.
Backend: routes → controller → service → repository → MySQL. Middleware xử lý yêu cầu dùng chung. Không tạo repository cho health vì không đọc database.

Luồng đang chạy: SystemStatus.jsx → getJson('/health') → Vite proxy → health.routes.js → health.controller.js → health.service.js → JSON → cập nhật giao diện.

Phạm vi: một tòa nhà, ba vai trò đăng nhập và khách qua QR. Chưa triển khai bảo mật, lưu dữ liệu, QR, ảnh hoặc thanh toán. Bộ khung chỉ chạy local.

Thứ tự triển khai:
1. Chốt ERD; migration; tài khoản; xác thực; quyền theo vai trò và bản ghi.
2. Vị trí QR và tiếp nhận phản ánh công khai với giới hạn tần suất.
3. Phân công và xử lý phản ánh, ảnh riêng tư, lịch sử chuyển trạng thái.
4. Cư trú, phương tiện, chỉ số, hóa đơn và xác nhận chuyển khoản thủ công.
5. Thông báo, tổng quan, kiểm thử tích hợp và triển khai.

Không cho cư dân đọc hóa đơn căn hộ khác; kỹ thuật chỉ đọc việc được giao; tra cứu công khai chỉ trả dữ liệu tối thiểu. Trạng thái phản ánh và hóa đơn phải được kiểm tra server-side. QR bị thu hồi không được gửi mới.
