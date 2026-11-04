# Áp dụng Spec Kit cho lượt rà soát 04/11/2026

Tham khảo [GitHub Spec Kit](https://github.com/github/spec-kit/tree/38c40ae25a4f1c025e1a2dd6a450095d17acab47), SHA `38c40ae25a4f1c025e1a2dd6a450095d17acab47`. Đã đọc README, `docs/how-to/existing-projects.md`, `spec-driven.md`, template spec/plan/tasks và hướng dẫn analyze.

Đây là **bộ tài liệu áp dụng thủ công phương pháp Spec Kit vào dự án đã có**, không phải đầu ra giả định của một CLI đã chạy. Chưa cài Specify CLI/integration, chưa đăng ký slash commands, không chạy `specify init --force` hay thay AGENTS.md/stack/API. Các slash command trong tài liệu upstream là lệnh cho coding agent sau khi cài integration, không phải lệnh PowerShell sẵn có của dự án.

- [Nguyên tắc từ yêu cầu hiện có](memory/constitution.md).
- [Đặc tả nghiệm thu/nguồn yêu cầu](../specs/001-project-readiness/spec.md).
- [Kế hoạch theo code hiện tại](../specs/001-project-readiness/plan.md).
- [Công việc đã rà soát và công việc còn mở](../specs/001-project-readiness/tasks.md).
- [Ma trận yêu cầu → mã → test → task](../specs/001-project-readiness/traceability.md).
- [Báo cáo phân tích](../docs/ra-soat-spec-kit-2026-11-04.md).

Theo hướng dẫn brownfield của Spec Kit, mã nguồn hiện tại là ngữ cảnh; không cần viết lại hệ thống từ đầu. Bộ inventory này là deliverable người dùng yêu cầu khi đề nghị “xem lại dự án”, không tự biến tất cả hành vi đã có thành yêu cầu được phê duyệt. `spec.md` phân biệt Word, quyết định trực tiếp của người dùng và các tiêu chí còn phải xác nhận. Không suy ra tỷ lệ hoàn thành phần mềm từ việc có đủ file spec/plan/tasks.

Giữ nguyên các báo cáo cũ như lịch sử theo SHA/ngày. Khi sửa một phát hiện, cập nhật spec/plan/tasks/ma trận và thêm kiểm thử đúng trường hợp; không đổi yêu cầu để biến lỗi thành Pass. Lượt rà soát này chỉ thêm tài liệu/bằng chứng và liên kết README; chưa sửa nghiệp vụ hay đánh dấu các task khắc phục là xong.
