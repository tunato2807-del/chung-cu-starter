# MySQL — bước thiết kế tiếp theo

Chưa có migration hoặc kết nối MySQL trong bộ khung. Không chứa dữ liệu thật.

Nhóm bảng dự kiến:
- Tài khoản: nguoi_dung.
- Cư trú: can_ho, cu_dan, lich_su_cu_tru, phuong_tien.
- QR/phản ánh: vi_tri_qr, phan_anh, hinh_anh_phan_anh, lich_su_phan_anh.
- Thu phí: cau_hinh_phi, chi_so_dich_vu, hoa_don, chi_tiet_hoa_don.
- Truyền thông: thong_bao.

lich_su_cu_tru và chi_so_dich_vu là hai bảng bổ sung đề xuất. Cần chốt ERD, khóa ngoại, unique, quy tắc phí điện và hủy hóa đơn trước khi viết migration.

Sau khi chốt: migrations/ chứa SQL theo thứ tự; seeds/ chỉ chứa dữ liệu giả dùng phát triển. Thông tin kết nối nằm trong biến môi trường backend; không đưa mật khẩu vào Git.
