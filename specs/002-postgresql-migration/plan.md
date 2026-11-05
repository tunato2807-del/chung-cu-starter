# Kế hoạch thực hiện

1. Nền tảng pg: bind tham số an toàn, giữ interface nội bộ rows/transaction để tránh đổi API; ID/count an toàn JS, NUMERIC/date/timestamp không mất chính xác.
2. 19 migration PostgreSQL riêng: identity/constraint/index/generated column/FK, advisory migration lock, DDL transactional/checksum. Giữ archive MySQL nguyên trạng.
3. Chuyển native SQL module theo lát: auth+QR/cư trú → phí → thống kê/quỹ/thông báo/bảo trì/tiện ích/nhập file. Read-only report snapshot REPEATABLE READ PostgreSQL.
4. Chuyển fixture/runner sang PG, kiểm thử PostgreSQL thật từng nhóm. Native PG SQLSTATE trả lỗi API tương đương, kể cả savepoint nhập Excel.
5. Công cụ chuyển dữ liệu MySQL chỉ đọc, kiểm chứng và rollback đích; cấu hình và chẩn đoán PG; metadata exporter+seed mẫu.
6. Chạy full suites/build/UI và thử migration dữ liệu giữa hai DB biệt lập; cập nhật hướng dẫn, metadata/ERD, ghi giới hạn và push GitHub.

Cờ 0/1 dùng SMALLINT có CHECK để giữ API đang chạy; tiền NUMERIC giữ string; ngày DATETIME cũ giữ timestamp without time zone UTC, lịch tiện ích vẫn wall-clock Việt Nam. Không dùng regex để dịch SQL lúc runtime: SQL module là PostgreSQL, gateway chỉ bind placeholder ? sang $n.
