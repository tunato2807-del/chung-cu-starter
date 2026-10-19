# Đăng nhập và phân quyền

auth.routes.js cung cấp đăng nhập, đăng xuất, đổi mật khẩu và quản lý tài khoản. auth.service.js kiểm tra mật khẩu, phát/xác minh JWT và tăng phiên bản khi thu hồi phiên. auth.middleware.js đọc cookie, kiểm tra phiên hiện tại và vai trò. auth.repository.js chỉ đọc các cột công khai của tài khoản.

Xem docs/api.md và docs/architecture.md tại gốc repository để biết quy tắc và endpoint.
