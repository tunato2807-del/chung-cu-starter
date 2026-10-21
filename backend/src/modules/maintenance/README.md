# Thiết bị và bảo trì

Hồ sơ thiết bị/lịch chỉ BQL. Phiếu định kỳ hoặc đột xuất theo luồng phân công → bắt đầu → báo cáo → nghiệm thu/trả lại; KTV chỉ được xem/ghi phiếu hiện được giao. BQL đổi lịch trước bắt đầu, đổi người khi đang làm hoặc hủy trước hoàn thành kèm lý do. Định kỳ cập nhật ngày kế tiếp từ ngày thực hiện đã nghiệm thu + chu kỳ; không tự lập phiếu sau. Tạm dừng vẫn theo dõi lịch, ngừng sử dụng phải không còn phiếu mở.

010–011 thêm schema/ràng buộc. UUID chống tạo phiếu trùng, phiên bản chống ghi đè, khóa theo thiết bị/phiếu, audit cùng transaction. Kết quả lượt trước giữ khi trả lại. Xem [code 9 file](../../../../docs/cap-nhat-bao-tri-thiet-bi-vscode.md), [API](../../../../docs/api.md) và [kiến trúc](../../../../docs/architecture.md).
