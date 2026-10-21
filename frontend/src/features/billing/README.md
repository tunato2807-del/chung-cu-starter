# Phí và hóa đơn

Billing.jsx cung cấp Rates, Meters, Bills và BillDetail. BQL có /quan-tri/don-gia, /quan-tri/chi-so, /quan-tri/hoa-don và chi tiết /:id. Cư dân có /cu-dan/hoa-don và /:id, chỉ dữ liệu API cho phép.

Các form khóa khi gửi, hiển thị lỗi nguồn, chặn duyệt nháp thiếu dữ liệu. QR dựng cục bộ từ payload backend, chỉ hiện khi đã gửi/chưa thu. Không có nút tự xác nhận thanh toán ở phía cư dân. BQL nhập ngân hàng/hạn trả khi gửi và xác nhận đối soát khi thu.

Rates cho nhập 2–12 bậc cộng dồn, ngày áp dụng và VAT điện. Nút điền mẫu là hành động chủ động, không seed vào database; người dùng kiểm tra giá/thuế trước khi lưu. Chi tiết cho cư dân giữ dòng bậc điện và khoản thuế.

Số lượng/đơn giá hiển thị theo vi-VN từ chuỗi thập phân (không bỏ phần lẻ thực). banks.js cung cấp danh sách chọn/tìm ngân hàng cục bộ và tra tên từ BIN cho hóa đơn cũ. PaymentQR dùng payment-card căn giữa toàn chiều ngang; chỉ hiện khi API trả payload DA_GUI. Thẻ có trạng thái, tổng tiền, QR, thông tin nhận và nút tải QR, không tích hợp ngân hàng hay tự xác nhận đã thu.
