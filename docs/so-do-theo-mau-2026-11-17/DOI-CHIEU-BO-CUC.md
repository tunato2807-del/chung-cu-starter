# Đối chiếu bố cục ERD 18 bảng

Cả ba bản biểu diễn 18 bảng, 218 thuộc tính và 46 khóa ngoại.

| Chỉ số | Bản ngang/dọc | Bản gọn | Bản rút dây và oval |
|---|---:|---:|---:|
| Kích thước vùng vẽ, gồm chú thích | 6009 × 5132 | 4752 × 4368 | 3830 × 3695 |
| Kích thước oval | 270 × 44 | 248 × 40 | 196 × 32 |
| Tổng chiều dài dây, theo đơn vị bản vẽ | — | 53.760 | 43.810 |
| Đường nối dài nhất, theo đơn vị bản vẽ | — | 3.091 | 2.550 |
| Dây nối vào cạnh đông nhất của NGUOI_DUNG | 15 | 6 | 6 |
| Giao điểm giữa các dây | 48 | 31 | 31 |
| Góc gấp ở ngoài hình thoi | 41 | 28 | 28 |
| Hình thoi | 46 | 41 | 41 |
| Hình thoi nằm ở một phần ba giữa đường nối | — | 37 | 37 |
| Cặp đoạn dây chồng nhau | 0 | 0 | 0 |
| Dây xuyên bảng hoặc cột thuộc tính | 0 | 0 | 0 |
| Dấu cầu vượt | 0 | 0 | 0 |

Nhãn ×n cho biết một hình thoi biểu diễn n khóa ngoại có cùng cặp bảng và cùng bội số.

| Bảng con nối với NGUOI_DUNG | Nhãn | Cột khóa ngoại đi chung dây |
|---|---|---|
| HOA_DON | ×4 | `ma_nguoi_duyet`, `ma_nguoi_gui`, `ma_nguoi_huy`, `ma_nguoi_xac_nhan` |
| PHAN_ANH | ×2 | `ma_nguoi_gui`, `ma_ky_thuat_vien` |
| THONG_BAO | ×2 | `ma_nguoi_gui`, `ma_nguoi_thu_hoi` |

Xem [từng khóa ngoại](DOI-CHIEU-KHOA-NGOAI.md), [tọa độ](nguon/bo-cuc-day-thang.json) và [số liệu kiểm tra](nguon/kiem-tra-duong-noi.json).
