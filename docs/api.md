# API luồng phản ánh QR

API trả `{ data }`, danh sách phản ánh thêm `meta: { page, page_size, total }` (20 dòng/trang). Lỗi trả `{ error: { code, message, field_errors?, request_id } }`. Request JSON có Content-Type application/json. Mọi request POST/PATCH phải có `X-App-Request: 1` và dùng cookie phiên cùng origin; không gửi role từ trình duyệt để quyết định quyền.

| Method | Đường dẫn dưới /api | Quyền / nội dung |
|---|---|---|
| POST | /xac_thuc/dang_nhap | Công khai; so_dien_thoai, mat_khau |
| GET | /xac_thuc/toi | Phiên hợp lệ |
| POST | /xac_thuc/dang_xuat | Kết thúc tất cả phiên, xóa cookie ngay cả khi phiên cũ đã vô hiệu |
| POST | /xac_thuc/doi_mat_khau | mat_khau_cu, mat_khau_moi; kết thúc các phiên |
| GET, POST | /nguoi_dung | BQL; tạo với ho_va_ten, so_dien_thoai, mat_khau, vai_tro (KY_THUAT_VIEN/CU_DAN), chuyen_mon tùy chọn |
| PATCH | /nguoi_dung/:id | BQL; dang_hoat_dong boolean; không tự khóa/BQL |
| GET, POST | /vi_tri_qr | BQL; tạo với ten_vi_tri, loai KHU_VUC/THIET_BI, mo_ta tùy chọn; luôn có token |
| PATCH | /vi_tri_qr/:id | BQL; dang_hoat_dong boolean |
| POST | /vi_tri_qr/:id/sinh_lai_qr | BQL; thay token, mã cũ không dùng được |
| GET | /cong_khai/vi_tri_qr/:token | Công khai; chỉ tên/mô tả vị trí đang hoạt động |
| POST | /cong_khai/phan_anh | Công khai hoặc phiên hiện có; multipart, xem dưới |
| POST | /cong_khai/phan_anh/tra_cuu | Công khai; ma_tra_cuu và so_dien_thoai trong body |
| GET | /phan_anh | Theo quyền bản ghi; lọc q, trang_thai, loai_su_co, page |
| GET | /phan_anh/:id | Theo quyền; chi tiết, ảnh metadata, lịch sử được phép |
| GET | /phan_anh/:id/hinh_anh/:image | Theo quyền; ảnh JPEG, không có URL thư mục công khai |
| PATCH | /phan_anh/:id/phan_cong | BQL; phien_ban, ma_ky_thuat_vien, do_uu_tien, ghi_chu tùy chọn |
| PATCH | /phan_anh/:id/trang_thai | BQL/KTV; phien_ban, trang_thai, ghi_chu, noi_dung_cong_khai tùy chọn, ma_phan_anh_goc khi TRUNG |
| GET | /health, /ready | Liveness và DB readiness riêng |

Gửi phản ánh: multipart gồm token_qr, khoa_yeu_cau (UUID v4), tieu_de (3–150), noi_dung (10–5000), ten_nguoi_gui, so_dien_thoai, loai_su_co (DIEN/NUOC/THANG_MAY/VE_SINH/AN_NINH/KHAC), can_ho_khai_bao tùy chọn và tối đa 5 tệp `hinh_anh`. Không nhận ID vị trí/người gửi hoặc ưu tiên từ client. Nếu nhận 409 SIMILAR_REPORT, người gửi có thể xác nhận bằng xac_nhan_gui=true, giữ nguyên khóa yêu cầu. Request lặp cùng nội dung trả 200 với mã cũ; mới trả 201. Mã tra cứu chỉ xuất hiện trong kết quả gửi, không trả trong danh sách/chi tiết.

KTV hoàn thành dùng **multipart PATCH trang_thai** với DA_XU_LY, ghi_chu bắt buộc và ít nhất một tệp hinh_anh mới. Ảnh, trạng thái và lịch sử commit cùng nhau, không có bước upload nghiệm thu riêng có thể bị bỏ dở. Các thao tác khác có thể gửi JSON. QR được vẽ/in tại frontend từ URL /r/:token cùng origin, không cần API sinh ảnh.

HTTP: 400 JSON lỗi, 401 thiếu/hết phiên, 403 sai vai trò/CSRF, 404 không thuộc quyền hoặc QR sai, 409 xung đột phiên bản/trạng thái/gửi lặp, 413 vượt giới hạn tải, 422 lỗi dữ liệu, 429 vượt tần suất, 503 database chưa sẵn sàng. Danh sách nhân sự/vị trí của bản demo giới hạn 200/500; phân trang hai danh mục này cần bổ sung khi quy mô tăng.
