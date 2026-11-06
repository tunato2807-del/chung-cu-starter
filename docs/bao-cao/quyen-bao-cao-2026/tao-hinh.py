"""Generate original diagrams from the implemented workflows; never reads a DB."""
from pathlib import Path
import html
import json
import subprocess
import textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'hinh'
OUT.mkdir(exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'


def dot(name, body, direction='TB', engine='dot'):
    source = ('digraph G { graph [rankdir=' + direction + ', bgcolor="white", '
              'pad="0.18", nodesep="0.35", ranksep="0.45", dpi=180, '
              'fontname="Liberation Serif", fontsize=15, splines=polyline]; '
              'node [fontname="Liberation Serif", fontsize=15, shape=box, '
              'style="rounded", margin="0.13,0.09", color="#222222"]; '
              'edge [fontname="Liberation Serif", fontsize=12, color="#333333", arrowsize=0.65];\n'
              + body + '\n}')
    path = OUT / (name + '.dot')
    path.write_text(source, encoding='utf-8')
    command = [engine]
    if engine == 'neato':
        command.append('-n2')
    for fmt in ['png', 'svg']:
        subprocess.run(command + ['-T'+fmt, str(path), '-o', str(OUT/(name+'.'+fmt))], check=True, capture_output=True)


def label(value):
    return json.dumps(value, ensure_ascii=False)


def activity(name, steps, branches=()):
    nodes = ['start [shape=circle, label="", style=filled, fillcolor=black, width=.15];',
             'end [shape=doublecircle, label="", width=.2];']
    for i, (text, decision) in enumerate(steps):
        nodes.append(f'n{i} [label={label(text)}, shape={"diamond" if decision else "box"}];')
    nodes.append('start -> n0;')
    for i in range(len(steps)-1):
        suffix = ' [label="Hợp lệ / Có"]' if steps[i][1] else ''
        nodes.append(f'n{i} -> n{i+1}{suffix};')
    nodes.append(f'n{len(steps)-1} -> end;')
    for index, target, text in branches:
        nodes.append(f'n{index} -> {target if isinstance(target,str) else "n"+str(target)} [label={label(text)}, style=dashed, constraint=false];')
    dot(name, '\n'.join(nodes))


def usecase(name, left, cases, right, links):
    nodes = ['edge [dir=none];']
    for key, name_ in left + right:
        nodes.append(f'{key} [shape=plaintext, label={label("«actor»\n"+name_)}];')
    nodes.append('subgraph cluster_system {label="Hệ thống quản lý vận hành chung cư"; color="#555555"; style=solid;')
    for key, text in cases:
        nodes.append(f'{key} [shape=ellipse, style=solid, label={label(text)}];')
    nodes.append('{rank=same;'+ ';'.join(x[0] for x in cases)+';} }')
    if left:
        nodes.append('{rank=min;'+ ';'.join(x[0] for x in left)+';}')
    if right:
        nodes.append('{rank=max;'+ ';'.join(x[0] for x in right)+';}')
    for a, b in links:
        nodes.append(f'{a} -> {b};')
    dot(name, '\n'.join(nodes), 'LR')


def entity(name, attrs):
    header = f'<TR><TD BGCOLOR="#eeeeee"><B>{html.escape(name)}</B></TD></TR>'
    rows = ''.join(f'<TR><TD ALIGN="LEFT">{html.escape(x)}</TD></TR>' for x in attrs)
    return f'[shape=plain, label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="5">{header}{rows}</TABLE>>];'


def erd(name, tables, links):
    nodes = [f'{key} {entity(title,attrs)}' for key,title,attrs in tables]
    for a,b,rel in links:
        nodes.append(f'{a} -> {b} [dir=both, arrowtail=none, arrowhead=none, label={label(rel)}];')
    dot(name, '\n'.join(nodes), 'TB')


def sequence(name, participants, messages, note):
    width, top, gap = 1800, 185, 150
    height = top + len(messages)*gap + 155
    image = Image.new('RGB',(width,height),'white')
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(FONT,42)
    small = ImageFont.truetype(FONT,40)
    xs = [180 + i*(width-360)/(len(participants)-1) for i in range(len(participants))]
    for x,title in zip(xs,participants):
        draw.rounded_rectangle((x-150,25,x+150,125), radius=7, outline='black', width=2)
        draw.multiline_text((x,75), '\n'.join(textwrap.wrap(title,14)),font=font,anchor='mm',align='center',fill='black',spacing=5)
        for y in range(135,height-100,20):
            draw.line((x,y,x,y+10),fill='#888888',width=2)
    for index,(a,b,text,returned) in enumerate(messages):
        y=top+index*gap
        xa,xb=xs[a],xs[b]
        if returned:
            length=abs(xb-xa)
            for d in range(0,int(length),22):
                x=xa+(1 if xb>xa else -1)*d
                end=xa+(1 if xb>xa else -1)*min(d+13,length)
                draw.line((x,y,end,y),fill='black',width=2)
        else:draw.line((xa,y,xb,y),fill='black',width=3)
        direction=1 if xb>xa else -1
        draw.polygon([(xb,y),(xb-direction*18,y-8),(xb-direction*18,y+8)],fill='black')
        limit=max(14,min(58,int(abs(xb-xa)/22)))
        message='\n'.join(textwrap.wrap(f'{index+1}. {text}',limit))
        bounds=draw.multiline_textbbox((0,0),message,font=small,spacing=2)
        draw.multiline_text(((xa+xb)/2-(bounds[2]-bounds[0])/2,y-(bounds[3]-bounds[1])-24),message,font=small,align='center',fill='black',spacing=2,stroke_width=3,stroke_fill='white')
    draw.multiline_text((45,height-65),'\n'.join(textwrap.wrap(note,106)),font=small,fill='black',spacing=5,anchor='lm')
    image.save(OUT/(name+'.png'),dpi=(240,240))
    (OUT/(name+'.json')).write_text(json.dumps({'participants':participants,'messages':messages,'note':note},ensure_ascii=False,indent=2))


dot('phan-ra-chuc-nang','''
ht [label="Quản lý vận hành chung cư\nvà tiếp nhận phản ánh"];
a [label="Hồ sơ và quyền\nKhối / tầng / căn\nCư trú / xe / tài khoản"];
b [label="Trọng tâm phản ánh\nVị trí / thiết bị / QR\nGửi / phân công / nghiệm thu"];
c [label="Tài chính dịch vụ\nPhí / chỉ số / hóa đơn\nVietQR / công nợ"];
d [label="Vận hành bổ trợ\nBảo trì / tiện ích\nQuỹ / chứng từ"];
e [label="Điều hành\nThông báo / nhắc phí\nThống kê / nhập xuất"];
ht -> a; ht -> b; ht -> c; b -> d; b -> e;
''')

usecase('use-case-tong-the', [('b','Ban quản lý'),('k','Kỹ thuật viên')], [
('u1','Đăng nhập và phân quyền'),('u2','Tạo / quản lý QR'),('u3','Gửi / tra cứu phản ánh'),
('u4','Điều phối / xử lý / nghiệm thu'),('u5','Quản lý hồ sơ và cư trú'),('u6','Hóa đơn / thông báo'),
('u7','Bảo trì / tiện ích / báo cáo')], [('c','Cư dân'),('g','Người gửi công khai')],
[('b','u1'),('b','u2'),('b','u4'),('b','u5'),('b','u6'),('b','u7'),('k','u1'),('k','u4'),('k','u7'),
 ('u1','c'),('u3','c'),('u6','c'),('u7','c'),('u3','g')])
usecase('use-case-bql',[('b','Ban quản lý')],[
 ('u1','Khối / tầng / căn hộ'),('u2','Cư dân / cư trú / phương tiện'),('u3','Tài khoản căn / bàn giao'),
 ('u4','Vị trí / thiết bị / in QR'),('u5','Tiếp nhận / phân công phản ánh'),('u6','Nghiệm thu / trả lại'),
 ('u7','Phí / chỉ số / hóa đơn'),('u8','Thu phí / công nợ / quỹ'),('u9','Thông báo / tiện ích / báo cáo')],[],[('b','u'+str(i)) for i in range(1,10)])
usecase('use-case-cu-dan',[('c','Cư dân'),('g','Người gửi công khai')],[
 ('u1','Gửi phản ánh tại vị trí'),('u2','Tra cứu với mã riêng'),('u3','Xem phản ánh của mình'),
 ('u4','Xem hóa đơn và VietQR'),('u5','Thông báo / đặt tiện ích'),('u6','Xử lý việc được giao'),('u7','Thực hiện bảo trì')],
 [('k','Kỹ thuật viên')],[('c','u1'),('c','u2'),('c','u3'),('c','u4'),('c','u5'),('g','u1'),('g','u2'),('u6','k'),('u7','k')])

activity('activity-qr',[
 ('BQL đăng nhập; nhập vị trí',False),('Chọn thiết bị nếu cần',False),('Quyền và dữ liệu hợp lệ?',True),
 ('Giao dịch: tạo token và vị trí;\nghi lịch sử liên kết',False),('React tạo URL và ảnh QR',False),
 ('Xem / tải PNG / in mã',False),('Quét thử đúng vị trí?',True),('Dán mã tại vị trí',False)],[(2,0,'Không: sửa dữ liệu'),(6,4,'Không: kiểm tra origin / HTTPS')])
activity('activity-gui',[
 ('Mở liên kết hoặc quét QR',False),('QR còn hoạt động?',True),('Nhập nội dung; chọn / chụp ảnh',False),
 ('Gửi kèm khóa yêu cầu',False),('Yêu cầu mới và dữ liệu hợp lệ?',True),
 ('Lưu MOI, snapshot, metadata ảnh\nvà biên nhận trong giao dịch',False),('Trả mã tra cứu; xóa nháp',False)],
 [(1,'end','Không: báo mã hết hiệu lực'),(4,2,'Lỗi / tương tự: giữ nháp, xác nhận'),(4,6,'Replay hợp lệ: trả biên nhận cũ')])
activity('activity-xu-ly',[
 ('Phản ánh MOI',False),('BQL phân công KTV và ưu tiên',False),('DA_PHAN_CONG',False),
 ('KTV bắt đầu: DANG_XU_LY',False),('Nộp kết quả và ảnh mới đúng lượt',False),('DA_XU_LY: chờ nghiệm thu',False),
 ('BQL nghiệm thu đạt?',True),('DA_DONG; lưu ngày đóng và lịch sử',False)],
 [(0,'end','BQL từ chối / gộp đủ điều kiện'),(6,3,'Không: lý do + tăng lượt')])
activity('activity-hoa-don',[
 ('Chọn căn, kỳ và ngày chốt',False),('Giá / xe / chỉ số hợp lệ?',True),('Lập NHAP và snapshot các khoản',False),
 ('Nguồn còn khớp khi duyệt?',True),('DA_DUYET; cố định khoản tiền',False),('Ngân hàng, tài khoản, hạn trả; DA_GUI',False),
 ('Cư dân xem VietQR; BQL đối soát',False),('Nhận đủ đúng tổng tiền?',True),('DA_THANH_TOAN; ghi lịch sử / thu',False)],
 [(1,0,'Không: sửa nguồn'),(3,2,'Không: tính lại nháp'),(7,6,'Chưa nhận đủ')])

sequence('sequence-qr',['BQL','React','API / service','MySQL'],[
 (0,1,'Nhập vị trí',False),(1,2,'POST /vi_tri_qr',False),(2,3,'BEGIN; kiểm tra thiết bị',False),
 (2,3,'Lưu vị trí, token, lịch sử; COMMIT',False),(3,2,'Bản ghi mới',True),(2,1,'201: dữ liệu vị trí',True),
 (1,0,'Tạo ảnh QR; xem / tải / in',True)],'Lỗi kiểm tra hoặc ghi nhật ký: rollback, không tạo vị trí dở dang.')
sequence('sequence-gui',['Người gửi','React','API / service','MySQL + kho ảnh'],[
 (0,1,'Mở /r/token',False),(1,2,'GET vị trí công khai',False),(2,1,'Vị trí và phiên bản',True),
 (0,1,'Nội dung và ảnh',False),(1,2,'POST multipart + khóa yêu cầu',False),(2,3,'Chuẩn bị ảnh; BEGIN; kiểm tra',False),
 (2,3,'Lưu MOI, snapshot, ảnh, nhật ký; COMMIT',False),(2,1,'Biên nhận và mã tra cứu',True),(1,0,'Hiển thị kết quả',True)],
 'Replay cùng nội dung: trả biên nhận cũ. Lỗi/replay: dọn ảnh mới không được giữ lại.')
sequence('sequence-xu-ly',['BQL / KTV','React','API / service','MySQL'],[
 (0,1,'BQL chọn KTV',False),(1,2,'PATCH phân công + phiên bản',False),(2,3,'Khóa hàng; kiểm tra; ghi lịch sử',False),
 (2,1,'DA_PHAN_CONG',True),(0,1,'KTV bắt đầu / nộp ảnh',False),(1,2,'PATCH trạng thái',False),
 (2,3,'Kiểm tra KTV, lượt, ảnh; cập nhật',False),(2,1,'DA_XU_LY',True),(0,1,'BQL nghiệm thu / trả lại',False),
 (1,2,'PATCH quyết định',False),(2,3,'Giao dịch trạng thái + lịch sử',False)],
 'Trả lại tăng lượt; hoàn thành tiếp theo yêu cầu ảnh mới. KTV không được tự đóng phản ánh.')
sequence('sequence-vietqr',['Cư dân','React','API / quyền','MySQL'],[
 (0,1,'Mở hóa đơn',False),(1,2,'GET /cua_toi/hoa_don/id',False),(2,3,'Đọc tài khoản và phạm vi hóa đơn',False),
 (3,2,'Hóa đơn đã gửi / đã thu được phép',True),(2,1,'Chi tiết và dữ liệu VietQR',True),(1,0,'Hiển thị QR và thông tin nhận',True)],
 'Không gọi ngân hàng trong luồng này. Quét mã không tự ghi đã thu; BQL đối soát riêng.')

dot('trang-thai-phan-anh','''
m [label="MOI\nMới tiếp nhận"]; p [label="DA_PHAN_CONG"]; x [label="DANG_XU_LY"]; n [label="DA_XU_LY\nChờ nghiệm thu"]; d [label="DA_DONG"];
t [label="TU_CHOI"]; g [label="TRUNG\nTham chiếu bản gốc"];
m -> p [label="BQL phân công"]; p -> x [label="KTV bắt đầu"]; x -> n [label="Kết quả + ảnh mới"];
n -> d [label="BQL đạt"]; n -> x [label="Trả lại + tăng lượt"];
m -> t [label="BQL + lý do"]; m -> g [label="BQL + điều kiện gộp"];
''')

classes=[
 ('u','NguoiDung',['ma_nguoi_dung, vai_tro','phien_ban_token']),('c','CuDan',['ma_cu_dan, ho_va_ten','so_dien_thoai']),
 ('h','CanHo',['ma_can_ho, so_can_ho','dien_tich_m2']),('r','DotCuTru',['tu_ngay, den_ngay','quan_he']),
 ('q','ViTriQR',['token_qr, phien_ban','dang_hoat_dong']),('p','PhanAnh',['trang_thai, luot_xu_ly','snapshot thiết bị']),
 ('b','HoaDon',['ky_thanh_toan, tong_tien','trang_thai']),('l','ChiTietHoaDon',['so_luong, don_gia','thanh_tien']),
 ('e','ThietBi',['ma_tai_san, ten_thiet_bi','trang_thai']),('s','«module» XuLyPhanAnh',['submit(), assign()','transition(), lookup()'])]
nodes=[]
for i,(key,title,attrs) in enumerate(classes):
    spec=entity(title,attrs).removesuffix(';')
    spec=spec[:-1]+f', pos="{(i%2)*270},{-(i//2)*145}!", pin=true];'
    nodes.append(key+' '+spec)
for a,b,rel in [('u','c','0..1 — 0..1'),('c','r','1 — 0..*'),('h','r','1 — 0..*'),('q','p','1 — 0..*'),('e','q','0..1 — 0..*'),('h','b','1 — 0..*'),('b','l','1 — 0..*')]:
    nodes.append(f'{a} -> {b} [dir=none, label={label(rel)}];')
nodes.append('s -> p [style=dashed, label="xử lý"];')
dot('lop-phan-tich','\n'.join(nodes),engine='neato')

erd('erd-cu-tru',[
 ('k','khoi_toa_nha',['PK khoi']),('t','tang_toa_nha',['PK (khoi, tang)','FK khoi']),
 ('h','can_ho',['PK ma_can_ho','FK (khoi, tang)','so_can_ho, dien_tich_m2']),
 ('c','cu_dan',['PK ma_cu_dan','ho_va_ten, so_dien_thoai']),
 ('r','lich_su_cu_tru',['PK ma_lich_su_cu_tru','FK ma_cu_dan, ma_can_ho','tu_ngay, den_ngay, quan_he']),
 ('v','phuong_tien',['PK ma_phuong_tien','FK cư dân / đợt ở / căn','loai_xe, bien_so'])],
 [('k','t','1 : N'),('t','h','1 : N'),('h','r','1 : N'),('c','r','1 : N'),('r','v','1 : N; gắn đợt'),('h','v','1 : N; căn chịu phí')])
erd('erd-phan-anh',[
 ('u','nguoi_dung',['PK ma_nguoi_dung','vai_tro']),('e','thiet_bi',['PK ma_thiet_bi','ma_tai_san, ten_thiet_bi']),
 ('q','vi_tri_qr',['PK ma_vi_tri_qr','FK ma_thiet_bi (NULL)','token_qr, phien_ban']),
 ('p','phan_anh',['PK ma_phan_anh','FK ma_vi_tri_qr','FK người gửi / KTV / thiết bị','trang_thai, snapshot']),
 ('i','hinh_anh_phan_anh',['PK ma_hinh_anh_phan_anh','FK ma_phan_anh','loai, luot_xu_ly, duong_dan_tep'])],
 [('e','q','0..1 : N; hiện tại'),('q','p','1 : N; vị trí'),('e','p','0..1 : N; lúc gửi'),('u','p','0..1 : N; người gửi / KTV'),('p','i','1 : N')])
erd('erd-hoa-don',[
 ('h','can_ho',['PK ma_can_ho']),('f','loai_phi',['PK loai_phi']),('c','cau_hinh_phi',['PK ma_cau_hinh_phi','FK loai_phi','tu_ngay, don_gia, bac_dien']),
 ('m','chi_so_dich_vu',['PK ma_chi_so_dich_vu','FK ma_can_ho','ky_thanh_toan, chỉ số']),
 ('b','hoa_don',['PK ma_hoa_don','FK ma_can_ho','ky_thanh_toan, tong_tien']),
 ('l','chi_tiet_hoa_don',['PK ma_chi_tiet_hoa_don','FK hóa đơn / giá / chỉ số','so_luong, don_gia, thanh_tien']),
 ('n','thong_bao',['PK ma_thong_bao','FK ma_hoa_don (NULL)']),('r','thong_bao_da_doc',['FK thông báo / người nhận','ngữ cảnh người phụ trách'])],
 [('f','c','1 : N'),('h','m','1 : N'),('h','b','1 : N'),('b','l','1 : N'),('c','l','1 : N'),('m','l','0..1 : N'),('b','n','0..1 : N'),('n','r','1 : N')])

dot('kien-truc','''
subgraph cluster_fe { label="Tầng trình bày — trình duyệt"; fe [label="React + Router + CSS\nCamera / chọn ảnh / QR"]; }
subgraph cluster_api {label="Tầng ứng dụng — Node.js / Express";
router [label="Router + middleware\nPhiên / quyền / giới hạn"];
service [label="Service nghiệp vụ\nValidation / giao dịch / snapshot"];
router -> service; }
subgraph cluster_data {label="Tầng dữ liệu"; db [shape=cylinder,label="MySQL / InnoDB\n31 bảng + 8 view"]; fs [shape=cylinder,label="Kho tệp ảnh\nMetadata trong MySQL"]; }
fe -> router [label="HTTPS /api\nJSON hoặc multipart",dir=both];
service -> db [label="mysql2 / truy vấn tham số",dir=both];
service -> fs [label="Kiểm tra và lưu ảnh",dir=both];
''')
dot('luong-du-lieu','''
b [label="BQL cấu hình vị trí / thiết bị"]; q [label="QR chứa URL token"]; n [label="Người gửi mở form\nNội dung + ảnh + khóa yêu cầu"];
a [label="API: quyền / QR / ảnh\nGiới hạn / chống gửi lặp"]; d [shape=cylinder,label="Phản ánh + snapshot\nẢnh + nhật ký"];
p [label="BQL phân công"]; k [label="KTV xử lý + ảnh mới"]; x [label="BQL nghiệm thu / trả lại"]; t [label="Người gửi xem tiến độ\nThông tin công khai được phép"];
b -> q -> n -> a -> d; d -> p -> k -> x; x -> d; d -> t;
''')
# Physical subsets use exact column types from the checked-in SQL baseline.
import re
sql=(ROOT.parents[2]/'database/thesis-mysql/001_thesis_schema.sql').read_text()
physical={}
for name,block in re.findall(r'CREATE TABLE `([^`]+)` \((.*?)\n\) ENGINE',sql,re.S):
    fields={}
    for col,type_ in re.findall(r'^  `([^`]+)` (.*?)(?: NOT NULL| DEFAULT| GENERATED|,\n)',block+'\n',re.M):
        fields[col]=type_.strip()
    physical[name]=fields

def physical_erd(name,chosen,links):
    tables=[]
    for table,fields in chosen:
        attrs=[]
        for field in fields:
            value=physical[table][field]
            if value.startswith('enum('):value='enum (…)'
            attrs.append(field+' : '+value)
        tables.append((table,table,attrs))
    erd(name,tables,links)

physical_erd('erd-vat-ly-phan-anh',[
 ('vi_tri_qr',['ma_vi_tri_qr','token_qr','ma_thiet_bi','phien_ban']),
 ('phan_anh',['ma_phan_anh','ma_vi_tri_qr','ma_ky_thuat_vien','trang_thai','luot_xu_ly']),
 ('hinh_anh_phan_anh',['ma_hinh_anh_phan_anh','ma_phan_anh','duong_dan_tep','luot_xu_ly'])],
 [('vi_tri_qr','phan_anh','PK → FK; 1 : 0..*'),('phan_anh','hinh_anh_phan_anh','PK → FK; 1 : 0..*')])
physical_erd('erd-vat-ly-hoa-don',[
 ('can_ho',['ma_can_ho','so_can_ho','dien_tich_m2']),
 ('hoa_don',['ma_hoa_don','ma_can_ho','ky_thanh_toan','tong_tien','trang_thai']),
 ('cau_hinh_phi',['ma_cau_hinh_phi','loai_phi','don_gia','tu_ngay']),
 ('chi_tiet_hoa_don',['ma_chi_tiet_hoa_don','ma_hoa_don','ma_cau_hinh_phi','so_luong','don_gia','thanh_tien'])],
 [('can_ho','hoa_don','PK → FK; 1 : 0..*'),('hoa_don','chi_tiet_hoa_don','PK → FK; 1 : 0..*'),('cau_hinh_phi','chi_tiet_hoa_don','PK → FK; 1 : 0..*')])
print('Generated 21 original diagrams; source DOT/JSON is included.')
