# Đối chiếu đầy đủ thuộc tính và quan hệ với schema

ERD hiện hành giữ 18 bảng và vẽ **đủ 218/218 cột** của các bảng đó. Nó cũng vẽ **đủ 46/46 FK khai báo từ 18 bảng này**; các bảng cha đều thuộc cùng hình. 13 bảng ngoài phạm vi hình và 35 FK của chúng vẫn có trong schema. Hình không khẳng định schema chỉ có 18 bảng hoặc không có liên kết tới các bảng đã lược.

Nguồn: [`001_thesis_schema.sql`](../../database/thesis-mysql/001_thesis_schema.sql). SHA-256: `57d700e4983eb494829a0f32de155bb8657d5abfe1f9511b2e8ac70562e17226`.

Khóa chính gạch chân liền; khóa ngoại gạch chân nét đứt, không ghi nhãn FK/R trong oval. Hình thoi để trống như mẫu; tên constraint dưới đây chỉ dùng đối chiếu nguồn. Không ghép nhiều vai trò thành một FK.

| Constraint trong SQL | Bảng con (cột) | Bảng cha (cột) | Trạng thái trong hình |
|---|---|---|---|
| `fk_apartment_floor` | `can_ho(khoi, tang)` | `tang_toa_nha(khoi, tang)` | Đã vẽ |
| `cau_hinh_phi_ibfk_1` | `cau_hinh_phi(loai_phi)` | `loai_phi(loai_phi)` | Đã vẽ |
| `cau_hinh_phi_ibfk_2` | `cau_hinh_phi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `chi_so_dich_vu_ibfk_1` | `chi_so_dich_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `chi_so_dich_vu_ibfk_2` | `chi_so_dich_vu(ma_nguoi_ghi)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `chi_tiet_hoa_don_ibfk_1` | `chi_tiet_hoa_don(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | Đã vẽ |
| `chi_tiet_hoa_don_ibfk_2` | `chi_tiet_hoa_don(ma_cau_hinh_phi)` | `cau_hinh_phi(ma_cau_hinh_phi)` | Đã vẽ |
| `chi_tiet_hoa_don_ibfk_3` | `chi_tiet_hoa_don(ma_chi_so_dich_vu)` | `chi_so_dich_vu(ma_chi_so_dich_vu)` | Đã vẽ |
| `chung_tu_thu_chi_ibfk_1` | `chung_tu_thu_chi(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | Nguồn thuộc bảng đã lược khỏi hình |
| `chung_tu_thu_chi_ibfk_2` | `chung_tu_thu_chi(ma_nguoi_tai)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `cu_dan_ibfk_1` | `cu_dan(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `dat_lich_tien_ich_ibfk_1` | `dat_lich_tien_ich(ma_tien_ich)` | `tien_ich(ma_tien_ich)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dat_lich_tien_ich_ibfk_2` | `dat_lich_tien_ich(ma_can_ho)` | `can_ho(ma_can_ho)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dat_lich_tien_ich_ibfk_3` | `dat_lich_tien_ich(ma_nguoi_dat)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dat_lich_tien_ich_ibfk_4` | `dat_lich_tien_ich(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dat_lich_tien_ich_ibfk_5` | `dat_lich_tien_ich(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dot_lap_hoa_don_ibfk_1` | `dot_lap_hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dot_nhap_du_lieu_ibfk_1` | `dot_nhap_du_lieu(ma_nguoi_nhap)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `dot_xu_ly_hoa_don_ibfk_1` | `dot_xu_ly_hoa_don(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `hinh_anh_phan_anh_ibfk_1` | `hinh_anh_phan_anh(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | Đã vẽ |
| `hinh_anh_phan_anh_ibfk_2` | `hinh_anh_phan_anh(ma_nguoi_tai_len)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `hoa_don_ibfk_1` | `hoa_don(ma_can_ho)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `hoa_don_ibfk_2` | `hoa_don(ma_hoa_don_thay_the_cho)` | `hoa_don(ma_hoa_don)` | Đã vẽ |
| `hoa_don_ibfk_3` | `hoa_don(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `hoa_don_ibfk_4` | `hoa_don(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `hoa_don_ibfk_5` | `hoa_don(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `hoa_don_ibfk_6` | `hoa_don(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `hoa_don_ibfk_7` | `hoa_don(ma_nguoi_xac_nhan)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `lich_su_cu_tru_ibfk_1` | `lich_su_cu_tru(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | Đã vẽ |
| `lich_su_cu_tru_ibfk_2` | `lich_su_cu_tru(ma_can_ho)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `lich_su_cu_tru_ibfk_3` | `lich_su_cu_tru(ma_nguoi_ghi_nhan)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `fk_account_apartment` | `nguoi_dung(ma_can_ho_thanh_toan)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `fk_account_owner` | `nguoi_dung(ma_cu_dan_phu_trach)` | `cu_dan(ma_cu_dan)` | Đã vẽ |
| `fk_incident_equipment` | `phan_anh(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | Đã vẽ |
| `fk_incident_sender_resident` | `phan_anh(ma_cu_dan_nguoi_gui)` | `cu_dan(ma_cu_dan)` | Đã vẽ |
| `phan_anh_ibfk_1` | `phan_anh(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | Đã vẽ |
| `phan_anh_ibfk_2` | `phan_anh(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `phan_anh_ibfk_3` | `phan_anh(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `phan_anh_ibfk_4` | `phan_anh(ma_phan_anh_goc)` | `phan_anh(ma_phan_anh)` | Đã vẽ |
| `phieu_bao_tri_ibfk_1` | `phieu_bao_tri(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_bao_tri_ibfk_2` | `phieu_bao_tri(ma_ky_thuat_vien)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_bao_tri_ibfk_3` | `phieu_bao_tri(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_bao_tri_ibfk_4` | `phieu_bao_tri(ma_nguoi_nghiem_thu)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_bao_tri_ibfk_5` | `phieu_bao_tri(ma_nguoi_huy)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_thu_chi_ibfk_1` | `phieu_thu_chi(ma_quy)` | `quy_tai_chinh(ma_quy)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_thu_chi_ibfk_2` | `phieu_thu_chi(ma_nguoi_lap)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_thu_chi_ibfk_3` | `phieu_thu_chi(ma_nguoi_duyet)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phieu_thu_chi_ibfk_4` | `phieu_thu_chi(ma_phieu_goc)` | `phieu_thu_chi(ma_phieu)` | Nguồn thuộc bảng đã lược khỏi hình |
| `phuong_tien_ibfk_1` | `phuong_tien(ma_cu_dan)` | `cu_dan(ma_cu_dan)` | Đã vẽ |
| `phuong_tien_ibfk_2` | `phuong_tien(ma_can_ho)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `phuong_tien_ibfk_3` | `phuong_tien(ma_lich_su_cu_tru)` | `lich_su_cu_tru(ma_lich_su_cu_tru)` | Đã vẽ |
| `phuong_tien_ibfk_4` | `phuong_tien(ma_dang_ky_truoc)` | `phuong_tien(ma_phuong_tien)` | Đã vẽ |
| `phuong_tien_ibfk_5` | `phuong_tien(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `phuong_tien_ibfk_6` | `phuong_tien(ma_nguoi_ket_thuc)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `fk_floor_block` | `tang_toa_nha(khoi)` | `khoi_toa_nha(khoi)` | Đã vẽ |
| `thiet_bi_ibfk_1` | `thiet_bi(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `thong_bao_ibfk_1` | `thong_bao(ma_can_ho)` | `can_ho(ma_can_ho)` | Đã vẽ |
| `thong_bao_ibfk_2` | `thong_bao(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | Đã vẽ |
| `thong_bao_ibfk_3` | `thong_bao(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `thong_bao_ibfk_4` | `thong_bao(ma_nguoi_gui)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `thong_bao_ibfk_5` | `thong_bao(ma_nguoi_thu_hoi)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `thong_bao_da_doc_ibfk_1` | `thong_bao_da_doc(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | Đã vẽ |
| `thong_bao_da_doc_ibfk_2` | `thong_bao_da_doc(ma_nguoi_dung)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `tien_ich_ibfk_1` | `tien_ich(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_qr_equipment` | `vi_tri_qr(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | Đã vẽ |
| `vi_tri_qr_ibfk_1` | `vi_tri_qr(ma_nguoi_tao)` | `nguoi_dung(ma_nguoi_dung)` | Đã vẽ |
| `yeu_cau_gui_ibfk_1` | `yeu_cau_gui(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_actor` | `nhat_ky_nghiep_vu(ma_nguoi_thuc_hien)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_phan_anh` | `nhat_ky_nghiep_vu(ma_phan_anh)` | `phan_anh(ma_phan_anh)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_hoa_don` | `nhat_ky_nghiep_vu(ma_hoa_don)` | `hoa_don(ma_hoa_don)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_can_ho` | `nhat_ky_nghiep_vu(ma_can_ho)` | `can_ho(ma_can_ho)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_thong_bao` | `nhat_ky_nghiep_vu(ma_thong_bao)` | `thong_bao(ma_thong_bao)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_thiet_bi` | `nhat_ky_nghiep_vu(ma_thiet_bi)` | `thiet_bi(ma_thiet_bi)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_phieu_bao_tri` | `nhat_ky_nghiep_vu(ma_phieu_bao_tri)` | `phieu_bao_tri(ma_phieu_bao_tri)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_dat_lich` | `nhat_ky_nghiep_vu(ma_dat_lich)` | `dat_lich_tien_ich(ma_dat_lich)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_phieu` | `nhat_ky_nghiep_vu(ma_phieu)` | `phieu_thu_chi(ma_phieu)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_vi_tri_qr` | `nhat_ky_nghiep_vu(ma_vi_tri_qr)` | `vi_tri_qr(ma_vi_tri_qr)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_ky_thuat_vien_cu` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_cu)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_ky_thuat_vien_moi` | `nhat_ky_nghiep_vu(ma_ky_thuat_vien_moi)` | `nguoi_dung(ma_nguoi_dung)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_thiet_bi_cu` | `nhat_ky_nghiep_vu(ma_thiet_bi_cu)` | `thiet_bi(ma_thiet_bi)` | Nguồn thuộc bảng đã lược khỏi hình |
| `fk_history_ma_thiet_bi_moi` | `nhat_ky_nghiep_vu(ma_thiet_bi_moi)` | `thiet_bi(ma_thiet_bi)` | Nguồn thuộc bảng đã lược khỏi hình |
