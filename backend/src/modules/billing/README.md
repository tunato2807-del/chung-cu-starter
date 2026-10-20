# Phí, chỉ số và hóa đơn

billing.validation.js kiểm tra ngày/kỳ, số thập phân và tính tiền bằng BigInt. billing.service.js quản lý giá nối tiếp theo hiệu lực, chỉ số liên tục, nháp/bản thay thế, tính lại và duyệt theo dấu vân tay nguồn, gửi/thu/hủy và quyền cư dân. billing.guards.js khóa căn và chặn sửa xe hồi tố qua kỳ đã chốt; được module cư trú/xe dùng chung. billing.qr.js tạo payload VietQR và CRC tại chỗ. billing.routes.js tách route BQL và cư dân.

Không tin tổng/đơn giá từ client; không sửa giá/chi tiết hóa đơn đã duyệt. Mỗi trạng thái và log cùng transaction, phien_ban chống ghi đè, cột sinh chống nhiều bản hiệu lực, mã tham chiếu chống ghi thu lại. Cư dân không xem nháp/hủy hoặc dữ liệu ngoài đợt hiện tại. Không tự gọi ngân hàng hoặc ghi thu sau khi quét QR.

billing.electricity.js kiểm tra và tính điện bậc thang/thuế bằng BigInt; mỗi dòng lưu ngưỡng/giá/chỉ số, thuế chỉ trên tiền điện. Tương thích snapshot điện đơn giá cũ. Một biểu giá tại ngày chốt, chưa tách kỳ đổi giá/định mức nhiều hộ.

Tài khoản căn cố định xem DA_GUI/DA_THANH_TOAN đúng căn qua mọi đợt; SQL kiểm tra lại active/token version. Tài khoản cá nhân vẫn theo đợt đang mở. Bàn giao không tự đánh dấu hóa đơn đã thu.

Thời điểm xác nhận thu ghi UTC_TIMESTAMP() để báo cáo thu phí chuyển đúng sang ngày Việt Nam; không đổi tiền hoặc thời điểm lịch sử. Module financial-reports đọc snapshot các hóa đơn hiện có, không ghi thêm trạng thái khi xem.
