# Vị trí và QR

Locations.jsx quản lý vị trí, kích hoạt/vô hiệu, xác nhận thay mã, xem trước/tải/in QR. URL dùng origin đang mở website; muốn dùng điện thoại cần tên miền HTTPS truy cập được.

Từ 018, danh sách tìm theo vị trí/mã/tên thiết bị, lọc thiết bị hiện liên kết và phân trang 20 vị trí. QrEquipment.jsx có picker thiết bị phân trang/giữ lựa chọn, editor đổi/bỏ liên kết với xác nhận, lịch sử 20 thay đổi gần nhất và widget QR/phản ánh trong hồ sơ thiết bị. Link không đổi token nhưng tăng phiên bản. Chọn thiết bị chỉ cho THIET_BI; ngừng sử dụng không được gán mới. Public form gửi phiên bản QR, giữ snapshot tại server; không tự gán phản ánh lịch sử. Xem [code 11 file](../../../../docs/cap-nhat-thiet-bi-qr-vscode.md).
