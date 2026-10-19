# Phí và hóa đơn

Billing.jsx cung cấp Rates, Meters, Bills và BillDetail. BQL có /quan-tri/don-gia, /quan-tri/chi-so, /quan-tri/hoa-don và chi tiết /:id. Cư dân có /cu-dan/hoa-don và /:id, chỉ dữ liệu API cho phép.

Các form khóa khi gửi, hiển thị lỗi nguồn, chặn duyệt nháp thiếu dữ liệu. QR dựng cục bộ từ payload backend, chỉ hiện khi đã gửi/chưa thu. Không có nút tự xác nhận thanh toán ở phía cư dân. BQL nhập ngân hàng/hạn trả khi gửi và xác nhận đối soát khi thu.
