"""Build the editable thesis draft. Requires python-docx and Pillow.

No credentials/database are read. DOCX fields remain editable in Microsoft Word.
Optional --pages reads a PDF layout pass to populate cached TOC page numbers.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re
import unicodedata
from copy import deepcopy
from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image

BASE = Path(__file__).resolve().parent
REPO = BASE.parents[2]
META = json.loads((BASE/'thong-tin.json').read_text())
OUTPUT = BASE/'Bao-cao-DACN_To-Hoang-Tuan_1250080221.docx'
parser=argparse.ArgumentParser()
parser.add_argument('--pages',type=Path)
args=parser.parse_args()
PAGE_MAP=json.loads(args.pages.read_text()) if args.pages else {}
schema_text=(REPO/'docs/bao-cao/tu-dien-du-lieu.md').read_text()
tables=[]
for match in re.finditer(r'^## ([a-z_]+)\n(.*?)(?=^## |\Z)',schema_text,re.S|re.M):
    name,block=match.groups()
    rows=[]
    for line in block.splitlines():
        if not line.startswith('| ') or line.startswith('| Cột') or line.startswith('|---'):
            continue
        cols=[html.unescape(x.strip()) for x in line.strip().strip('|').split('|')]
        if len(cols)==5:
            rows.append(cols)
    if not rows:continue
    primary=set()
    unique=set()
    fkeys=set()
    for entry in re.finditer(r'^- (.*?) \((UNIQUE|INDEX)\): ([^\n]+)\.',block,re.M):
        index,kind,fields=entry.groups()
        names=[v.strip() for v in fields.split(',')]
        if index=='PRIMARY':primary.update(names)
        elif kind=='UNIQUE':unique.update(names)
    relations=[]
    for entry in re.finditer(r'^- FK [^:]+: \(([^)]+)\) → ([^\n]+)',block,re.M):
        fields,target=entry.groups()
        fkeys.update(v.strip() for v in fields.split(','))
        relations.append(fields+' → '+target)
    tables.append({'name':name,'rows':rows,'primary':primary,'unique':unique,'foreign':fkeys,'relations':relations})
assert len(tables)==31, len(tables)
assert sum(len(t['rows']) for t in tables)==362
assert sum(len(t['relations']) for t in tables)==81

descriptions={
 'can_ho':'Căn hộ, cấu trúc tầng và diện tích phục vụ tính phí.',
 'cau_hinh_phi':'Phiên bản đơn giá và cấu hình điện/thuế theo thời gian hiệu lực.',
 'chi_so_dich_vu':'Chỉ số điện/nước theo căn và kỳ.',
 'chi_tiet_hoa_don':'Các khoản thu đã chốt cùng số lượng, đơn giá và nguồn tính.',
 'chung_tu_thu_chi':'Tệp chứng từ thu/chi, định dạng và kiểm tra tính toàn vẹn.',
 'cu_dan':'Hồ sơ cư dân; tài khoản cá nhân liên kết nếu có.',
 'dat_lich_tien_ich':'Yêu cầu sử dụng tiện ích và các quyết định xử lý.',
 'dot_lap_hoa_don':'Biên nhận kỹ thuật cho một yêu cầu lập hóa đơn theo lô.',
 'dot_nhap_du_lieu':'Thông tin lần nhập tệp và người nhập.',
 'dot_xu_ly_hoa_don':'Biên nhận cho thao tác xử lý lô hóa đơn.',
 'gioi_han_gui':'Bộ đếm/phạm vi giới hạn gửi phản ánh.',
 'hinh_anh_phan_anh':'Metadata tệp ảnh; loại ảnh và lượt xử lý.',
 'hoa_don':'Hóa đơn theo căn/kỳ, tổng tiền, trạng thái và thông tin thanh toán.',
 'khoi_toa_nha':'Danh mục khối của một chung cư.',
 'lich_su_cu_tru':'Các đợt ở của cư dân, quan hệ với căn và khoảng thời gian.',
 'loai_phi':'Danh mục loại phí ứng dụng hỗ trợ.',
 'nguoi_dung':'Thông tin tài khoản, vai trò, trạng thái và phiên bản phiên.',
 'nhat_ky_nghiep_vu':'Nhật ký dùng chung có FK và payload riêng theo loại sự kiện.',
 'phan_anh':'Nội dung, vị trí, snapshot thiết bị, phân công và trạng thái phản ánh.',
 'phieu_bao_tri':'Phiếu thực hiện/kiểm tra bảo trì thiết bị.',
 'phieu_thu_chi':'Phiếu quỹ, quyết định ghi sổ và quan hệ đảo phiếu.',
 'phuong_tien':'Đăng ký phương tiện theo cư dân, đợt ở và căn chịu phí.',
 'quy_tai_chinh':'Danh mục quỹ và dữ liệu phục vụ tính sổ quỹ.',
 'schema_migrations':'Tên/checksum schema đã áp dụng; do runner quản lý.',
 'tang_toa_nha':'Danh mục tầng thuộc khối với khóa ghép.',
 'thiet_bi':'Hồ sơ tài sản/thiết bị và thông tin bảo trì.',
 'thong_bao':'Thông báo, phạm vi phát hành và liên kết nhắc hóa đơn nếu có.',
 'thong_bao_da_doc':'Biên nhận đọc theo tài khoản và ngữ cảnh người phụ trách.',
 'tien_ich':'Danh mục tiện ích và quy tắc phục vụ đặt lịch.',
 'vi_tri_qr':'Vị trí công khai, token, phiên bản và thiết bị hiện được liên kết.',
 'yeu_cau_gui':'Khóa yêu cầu, dấu vân tay và biên nhận chống gửi lặp.',
}
views={
 'lich_su_phan_anh':'Các sự kiện phân công, xử lý, phản hồi và nghiệm thu.',
 'lich_su_hoa_don':'Lập, duyệt, gửi, hủy và xác nhận thu hóa đơn.',
 'lich_su_ban_giao_can_ho':'Bàn giao trách nhiệm căn hộ và cấp lại mật khẩu.',
 'lich_su_thong_bao':'Tạo, sửa, phát hành và thu hồi thông báo.',
 'lich_su_bao_tri':'Lập, thực hiện và nghiệm thu phiếu bảo trì.',
 'lich_su_dat_lich':'Yêu cầu, duyệt, từ chối hoặc hủy đặt tiện ích.',
 'lich_su_thu_chi':'Ghi sổ và đảo phiếu quỹ.',
 'lich_su_lien_ket_qr':'Đổi hoặc tháo liên kết QR–thiết bị.',
}


def clean_type(value):
    # Line breaks preserve all ENUM members while keeping the table legible.
    if value.startswith('enum('):
        return 'enum(\n'+value[5:-1].replace(',',',\n')+'\n)'
    return value


dictionary=[]
for index,t in enumerate(tables,1):
    dictionary += [f"### A.{index}. {t['name']}",descriptions[t['name']],f"Bảng A.{index}. Cấu trúc bảng {t['name']}",'| Trường | Kiểu MySQL | Khóa | NULL |','| --- | --- | --- | --- |']
    for name,type_,nullable,default,extra in t['rows']:
        keys=[]
        if name in t['primary']:keys.append('PK')
        if name in t['foreign']:keys.append('FK')
        if name in t['unique']:keys.append('UQ')
        if 'GENERATED ALWAYS' in extra or 'STORED GENERATED' in extra or 'VIRTUAL GENERATED' in extra:
            keys.append('Sinh')
        dictionary.append('| '+' | '.join([name,type_,', '.join(keys) or '—',nullable])+' |')
    dictionary.append('Nguồn: từ điển metadata MySQL hiện hành; mặc định, biểu thức cột sinh và CHECK chi tiết xem baseline SQL đi kèm dự án.')
    if t['relations']:
        dictionary.append('Quan hệ FK: '+'; '.join(t['relations']))
dictionary += ['### A.32. Tám view lịch sử','Các view sau đọc từ nhat_ky_nghiep_vu; không tạo thêm tám bản sao của dữ liệu lịch sử.','Bảng A.32. View lịch sử và ý nghĩa','| View | Nội dung |','| --- | --- |']
dictionary += ['| '+name+' | '+desc+' |' for name,desc in views.items()]
dictionary += ['Nguồn: schema MySQL và lib/history.js.']

cases=json.loads((BASE/'kich-ban.json').read_text())
case_content=['Tiền điều kiện chung: dùng bộ dữ liệu nghiệm thu riêng; BQL/KTV/cư dân có tài khoản phù hợp. Ghi ngày, người thử và file minh chứng khi hoàn tất; không sử dụng tài khoản ngân hàng thử để chuyển tiền.','Bảng B.1. Kịch bản nghiệm thu và ô ghi nhận kết quả','| Mã/chức năng | Dữ liệu và thao tác | Kết quả mong đợi | Thực tế / trạng thái |','| --- | --- | --- | --- |']
case_content += ['| '+' | '.join([key+' — '+title,action,expected,'Chưa ghi nhận trên máy nghiệm thu.'])+' |' for key,title,action,expected in cases]
case_content += ['Nguồn: biên soạn theo các quy tắc service và test liên quan; chưa tự đánh dấu Pass cho nghiệm thu thủ công.']

source=(BASE/'noi-dung.md').read_text()
source=source.replace('{{TU_DIEN_DU_LIEU}}','\n\n'.join(dictionary))
source=source.replace('{{KICH_BAN_NGHIEM_THU}}','\n'.join(case_content))
current='''Bảng 3.6. Kiểm tra được chạy khi biên soạn bản thảo

| Kiểm tra | Kết quả | Bằng chứng và phạm vi |
| --- | --- | --- |
| Helper/CLI không dùng database thật | 62 đạt, 0 lỗi; 4 bỏ qua | node --test scripts/*.test.js; tắt hai cờ kiểm tra DB tích hợp; không tính bỏ qua là đạt |
| Kiểm tra file/dependency | 0 lỗi | node scripts/check-local.js; chỉ kiểm tra sự tồn tại .env, không đọc nội dung |
| Đóng gói frontend | Thành công | npm run build; còn cảnh báo dependency/chunk lớn, không kết luận đã đo hiệu năng |
| Chụp giao diện hiện tại | 4 hình, không có pageerror | Chromium, fixture API; không sử dụng tài khoản hay database thật |

Nguồn: thư mục kiem-chung kèm bản thảo, ngày 06/11/2026.'''
source=source.replace('{{KET_QUA_HIEN_TAI}}',current)
assert not re.search(r'\{\{[A-Z_]+\}\}',source)
(BASE/'noi-dung-day-du.md').write_text(source)

doc=Document()
settings=doc.settings.element
update=OxmlElement('w:updateFields');update.set(qn('w:val'),'true');settings.append(update)
doc.core_properties.title=META['de_tai']
doc.core_properties.author=META['sinh_vien']
doc.core_properties.subject='Bản thảo đồ án chuyên ngành; có phần cần xác nhận/nghiệm thu'
doc.core_properties.keywords='QR, phản ánh cư dân, quản lý vận hành, MySQL, bản thảo'
styles=doc.styles
for sty in ['Normal','Body Text','Caption','Header','Footer']:
    if sty in styles:
        styles[sty].font.name='Times New Roman';styles[sty].font.size=Pt(13)
        styles[sty].font.color.rgb=RGBColor(0,0,0)
normal=styles['Normal'].paragraph_format
normal.line_spacing=1.5;normal.space_after=Pt(6);normal.first_line_indent=Cm(.8)
normal.widow_control=True
for level in range(1,5):
    s=styles[f'Heading {level}'];s.font.name='Times New Roman';s.font.size=Pt(16 if level<4 else 13);s.font.bold=True;s.font.color.rgb=RGBColor(0,0,0)
    p=s.paragraph_format;p.first_line_indent=Cm(0);p.space_before=Pt(12);p.space_after=Pt(8);p.line_spacing=1.5;p.keep_with_next=True
    if level==1:p.page_break_before=True
for custom in ['FrontTitle','FigureCaption','TableCaption','SourceNote','IndexEntry','CodeLine']:
    if custom not in styles:styles.add_style(custom,1)
    s=styles[custom];s.base_style=styles['Normal'];s.font.name='Times New Roman';s.font.size=Pt(13);s.font.color.rgb=RGBColor(0,0,0)
    s.paragraph_format.first_line_indent=Cm(0)
styles['FrontTitle'].font.size=Pt(14);styles['FrontTitle'].font.bold=True
styles['FrontTitle'].paragraph_format.space_after=Pt(18)
styles['FigureCaption'].font.italic=True
styles['FigureCaption'].paragraph_format.keep_with_next=True
styles['TableCaption'].font.italic=True
styles['TableCaption'].paragraph_format.keep_with_next=True
styles['SourceNote'].font.italic=True
styles['SourceNote'].paragraph_format.space_after=Pt(10)
styles['IndexEntry'].paragraph_format.space_after=Pt(3)
styles['IndexEntry'].paragraph_format.tab_stops.add_tab_stop(Cm(16),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
styles['Footer'].paragraph_format.tab_stops.clear_all()
styles['CodeLine'].paragraph_format.line_spacing=1.5
styles['CodeLine'].paragraph_format.space_after=Pt(0)
for s in styles:
    if s.type==1:
        rpr=s.element.get_or_add_rPr()
        fonts=rpr.find(qn('w:rFonts'))
        if fonts is None:fonts=OxmlElement('w:rFonts');rpr.append(fonts)
        for attr in ['ascii','hAnsi','eastAsia','cs']:fonts.set(qn('w:'+attr),'Times New Roman')
        lang=OxmlElement('w:lang');lang.set(qn('w:val'),'vi-VN');rpr.append(lang)


def setup_section(section):
    section.page_width=Cm(21);section.page_height=Cm(29.7)
    section.top_margin=Cm(2);section.bottom_margin=Cm(2);section.left_margin=Cm(3);section.right_margin=Cm(2)
    section.header_distance=Cm(.7);section.footer_distance=Cm(1)


def run_font(run,size=None,bold=None,italic=None):
    run.font.name='Times New Roman';run.font.color.rgb=RGBColor(0,0,0)
    if size:run.font.size=Pt(size)
    if bold is not None:run.bold=bold
    if italic is not None:run.italic=italic
    fonts=run._element.get_or_add_rPr().find(qn('w:rFonts'))
    if fonts is None:fonts=OxmlElement('w:rFonts');run._element.get_or_add_rPr().append(fonts)
    for attr in ['ascii','hAnsi','eastAsia','cs']:fonts.set(qn('w:'+attr),'Times New Roman')
    return run


def text_runs(p,text):
    # Minimal inline Markdown. Backticks designate code text, not a different font.
    for part in re.split(r'(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*)',text):
        if part.startswith('**') and part.endswith('**'):run_font(p.add_run(part[2:-2]),bold=True)
        elif part.startswith('*') and part.endswith('*'):run_font(p.add_run(part[1:-1]),italic=True)
        else:run_font(p.add_run(part.strip('`') if part.startswith('`') else part))


def para(text='',style=None,align=None):
    p=doc.add_paragraph(style=style)
    p.alignment=align or WD_ALIGN_PARAGRAPH.JUSTIFY
    text_runs(p,text)
    return p


def title(text):
    p=para(text,'FrontTitle',WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.keep_with_next=True
    return p


def front_page():doc.add_page_break()


def field(p,instruction,cached=''):
    r=p.add_run();begin=OxmlElement('w:fldChar');begin.set(qn('w:fldCharType'),'begin');r._r.append(begin)
    inst=OxmlElement('w:instrText');inst.set(qn('xml:space'),'preserve');inst.text=' '+instruction+' ';p.add_run()._r.append(inst)
    sep=OxmlElement('w:fldChar');sep.set(qn('w:fldCharType'),'separate');p.add_run()._r.append(sep)
    run_font(p.add_run(str(cached)))
    end=OxmlElement('w:fldChar');end.set(qn('w:fldCharType'),'end');p.add_run()._r.append(end)


bookmark_counter=0
bookmarks={}


def bookmark(p,text):
    global bookmark_counter
    bookmark_counter+=1
    name='B'+str(bookmark_counter)
    start=OxmlElement('w:bookmarkStart');start.set(qn('w:id'),str(bookmark_counter));start.set(qn('w:name'),name)
    end=OxmlElement('w:bookmarkEnd');end.set(qn('w:id'),str(bookmark_counter))
    p._p.insert(0,start);p._p.append(end);bookmarks[text]=name


index_slots=[]


def add_index(title_,instruction,entries):
    title(title_)
    for i,(text,level) in enumerate(entries):
        p=para('', 'IndexEntry',WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.left_indent=Cm((level-1)*.45)
        if i==0:
            begin=OxmlElement('w:fldChar');begin.set(qn('w:fldCharType'),'begin');p.add_run()._r.append(begin)
            ins=OxmlElement('w:instrText');ins.set(qn('xml:space'),'preserve');ins.text=' '+instruction+' ';p.add_run()._r.append(ins)
            sep=OxmlElement('w:fldChar');sep.set(qn('w:fldCharType'),'separate');p.add_run()._r.append(sep)
        text_runs(p,text+'\t')
        index_slots.append((p,text,level))
    if entries:
        end=OxmlElement('w:fldChar');end.set(qn('w:fldCharType'),'end');index_slots[-1][0].add_run()._r.append(end)


def make_table(headers,rows,widths=None):
    table=doc.add_table(rows=1,cols=len(headers));table.alignment=WD_TABLE_ALIGNMENT.CENTER;table.autofit=False
    widths=widths or ([3.6,12.4] if len(headers)==2 else [16/len(headers)]*len(headers))
    for col,width in zip(table.columns,widths):col.width=Cm(width)
    for cell,width in zip(table.rows[0].cells,widths):cell.width=Cm(width)
    header=table.rows[0]
    repeat=OxmlElement('w:tblHeader');header._tr.get_or_add_trPr().append(repeat)
    for cell,text in zip(header.cells,headers):
        p=cell.paragraphs[0];text_runs(p,text)
        for r in p.runs:r.bold=True
        shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'EFEFEF');cell._tc.get_or_add_tcPr().append(shade)
    for values in rows:
        row=table.add_row()
        for cell,width,value in zip(row.cells,widths,values):
            cell.width=Cm(width)
            p=cell.paragraphs[0]
            value=html.unescape(value)
            if value.startswith('enum('):value=clean_type(value)
            text_runs(p,value)
    for row in table.rows:
        cant=OxmlElement('w:cantSplit');row._tr.get_or_add_trPr().append(cant)
        for cell in row.cells:
            cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            margins=OxmlElement('w:tcMar')
            for side in ['top','bottom','left','right']:
                item=OxmlElement('w:'+side);item.set(qn('w:w'),'75');item.set(qn('w:type'),'dxa');margins.append(item)
            cell._tc.get_or_add_tcPr().append(margins)
            for p in cell.paragraphs:
                p.alignment=WD_ALIGN_PARAGRAPH.LEFT;p.paragraph_format.first_line_indent=Cm(0)
                p.paragraph_format.space_before=Pt(0);p.paragraph_format.space_after=Pt(2);p.paragraph_format.line_spacing=1.5
                for r in p.runs:run_font(r,13)
    borders=OxmlElement('w:tblBorders')
    for side in ['top','left','bottom','right','insideH','insideV']:
        item=OxmlElement('w:'+side);item.set(qn('w:val'),'single');item.set(qn('w:sz'),'4');item.set(qn('w:color'),'777777');borders.append(item)
    table._tbl.tblPr.append(borders)
    para('').paragraph_format.space_after=Pt(0)
    return table


setup_section(doc.sections[0])
for copy in range(2):
    p=para('TRƯỜNG ĐẠI HỌC TÀI NGUYÊN\nVÀ MÔI TRƯỜNG TP. HỒ CHÍ MINH',align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,16,True)
    p=para('KHOA CÔNG NGHỆ THÔNG TIN',align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,14,True)
    p=para('ĐỒ ÁN CHUYÊN NGÀNH CÔNG NGHỆ PHẦN MỀM\nNGÀNH CÔNG NGHỆ THÔNG TIN',align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.space_before=Pt(38);p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,16,True)
    p=para(META['de_tai'],align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.space_before=Pt(35);p.paragraph_format.space_after=Pt(30);p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,20,True)
    p=para(f"Giảng viên hướng dẫn: {META['gvhd']}\nSinh viên thực hiện: {META['sinh_vien']}\nMã số sinh viên: {META['mssv']}\nLớp: {META['lop']}\nKhóa: {META['khoa_hoc']}",align=WD_ALIGN_PARAGRAPH.LEFT)
    p.paragraph_format.left_indent=Cm(2);p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,14)
    p=para(f"TP. Hồ Chí Minh, tháng {META['thang_nop']} năm {META['nam_nop']}",align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.space_before=Pt(35);p.paragraph_format.first_line_indent=Cm(0)
    p=para(META['trang_thai'],align=WD_ALIGN_PARAGRAPH.CENTER)
    p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:run_font(r,13,italic=True)
    front_page()

title('LỜI CẢM ƠN')
para('Em xin cảm ơn Trường Đại học Tài nguyên và Môi trường TP. Hồ Chí Minh và Khoa Công nghệ Thông tin đã tạo điều kiện học tập, cung cấp nền tảng kiến thức để em thực hiện đồ án chuyên ngành.')
para('Em xin cảm ơn ThS. Đặng Đức Trung đã hướng dẫn, góp ý về nội dung và cách trình bày đề tài. Những ý kiến của Thầy giúp em tập trung vào quy trình quản lý vận hành và tiếp nhận phản ánh, đồng thời xem xét mối liên hệ giữa yêu cầu, thiết kế, hiện thực và kiểm thử.')
para('Em cũng trân trọng các tác giả tài liệu và thư viện mã nguồn mở được tham khảo. Các nội dung sử dụng lại và công cụ hỗ trợ cần được ghi nhận theo quy định của Khoa. Bản báo cáo còn những giới hạn được trình bày ở phần đánh giá; em mong nhận được góp ý để tiếp tục hoàn thiện.')
para('Sinh viên thực hiện\n\n\n'+META['sinh_vien'],align=WD_ALIGN_PARAGRAPH.RIGHT)
front_page()
title('LỜI CAM ĐOAN')
para('Tôi chịu trách nhiệm về tính trung thực của nội dung, nguồn dữ liệu và kết quả được trình bày trong báo cáo. Những tài liệu, thư viện, hình ảnh và công cụ hỗ trợ được sử dụng phải được ghi nhận theo quy định. Phần đóng góp cá nhân và phần kế thừa cần được phân biệt rõ.')
para('Dữ liệu mô phỏng dùng để kiểm tra không được trình bày như dữ liệu khảo sát thực tế. Các kết quả chưa thực hiện hoặc chưa có bằng chứng không được ghi là đã đạt. Tôi chịu trách nhiệm rà soát bản báo cáo và các minh chứng trước khi nộp.')
para('Bản thảo lời cam đoan: sinh viên cần sửa theo đóng góp thực tế, kê khai công cụ hỗ trợ nếu có và chỉ ký sau khi đã kiểm tra nội dung.', 'SourceNote')
para('Sinh viên thực hiện\n(Ký và ghi rõ họ tên)\n\n\n'+META['sinh_vien'],align=WD_ALIGN_PARAGRAPH.RIGHT)
front_page()
for who in ['GIẢNG VIÊN HƯỚNG DẪN','GIẢNG VIÊN PHẢN BIỆN']:
    title('NHẬN XÉT CỦA '+who)
    for i in range(11):para('................................................................................................................')
    para('Kết luận: ....................................................................................................')
    para('TP. Hồ Chí Minh, ngày ..... tháng ..... năm .....\n'+who+'\n(Ký và ghi rõ học hàm, học vị, họ tên)\n\n\n'+(META['gvhd'] if who.endswith('HƯỚNG DẪN') else ''),align=WD_ALIGN_PARAGRAPH.RIGHT)
    front_page()
title('LỊCH LÀM VIỆC')
para('Lịch dự kiến theo đề cương, chưa thay cho xác nhận công việc đã thực hiện. Sinh viên đối chiếu thời gian thực tế; nhận xét và chữ ký do GVHD ghi.','SourceNote')
schedule=[('1–2','Đăng ký đề tài; viết đề cương'),('3–4','Xác định yêu cầu; Use Case, Activity và Sequence'),('5–6','Thiết kế CSDL, kiến trúc và giao diện'),('7–8','Hiện thực hồ sơ, QR, phản ánh và hóa đơn'),('9–10','Giao diện BQL/cư dân; camera và ảnh'),('11–12','Kiểm thử, sửa lỗi và thực nghiệm QR'),('13','Tổng hợp minh chứng; viết báo cáo'),('14–15','Báo cáo hội đồng; sửa và nộp hồ sơ')]
make_table(['Tuần','Nội dung dự kiến','Nhận xét GVHD','Ký tên'],[[w,t,'',''] for w,t in schedule],[1.7,8.3,3.5,2.5])
para('Địa điểm theo đề cương: Trường Đại học Tài nguyên và Môi trường TP. Hồ Chí Minh. Ngày thực tế và thay đổi kế hoạch cần được cập nhật trước khi nộp.','SourceNote')
front_page()
title('TÓM TẮT ĐỒ ÁN')
para('Đề tài xây dựng ứng dụng web quản lý vận hành một chung cư, tập trung vào tiếp nhận phản ánh cư dân bằng mã QR tại vị trí. Người gửi mở liên kết, nhập nội dung và ảnh; Ban quản lý tiếp nhận, phân công; kỹ thuật viên xử lý và nộp bằng chứng; Ban quản lý nghiệm thu và người gửi theo dõi kết quả. Các chức năng hồ sơ, cư trú, phương tiện, hóa đơn và thông báo hỗ trợ dữ liệu cho quy trình vận hành.')
para('Hệ thống được phân tích bằng UML/ERD, hiện thực với React, Node.js, Express và MySQL; dùng qrcode để sinh ảnh và html5-qrcode để quét trên trình duyệt. Schema hiện tại có 31 bảng và tám view lịch sử. Những giải pháp chính gồm kiểm soát quyền theo bản ghi, snapshot thiết bị/hóa đơn, chống gửi lặp, ảnh nghiệm thu theo lượt và thu hồi phiên khi bàn giao tài khoản căn.')
para('Mã nguồn và hồ sơ kiểm chứng cho thấy các luồng chính đã được hiện thực, có kiểm tra tự động về dữ liệu, API và giao diện. Báo cáo nêu riêng các kết quả lịch sử, kiểm tra khi soạn bản thảo và phần camera/thiết bị thật còn cần nghiệm thu. Dữ liệu quy mô lớn là dữ liệu mô phỏng; VietQR hỗ trợ chuyển khoản và BQL đối soát, chưa tự xác nhận từ ngân hàng. Hướng tiếp theo là hoàn thiện minh chứng, triển khai ổn định, đo tải và kiểm tra phục hồi dữ liệu.')
front_page()
headings=[(m.group(2),len(m.group(1))) for m in re.finditer(r'^(#{1,3}) (.+)$',source,re.M) if not m.group(2).startswith('A.')]
figures=[(m.group(1),1) for m in re.finditer(r'^!\[([^]]+)\]',source,re.M)]
table_titles=[(m.group(0),1) for m in re.finditer(r'^Bảng (?:\d+|[AB])\.\d+\..+$',source,re.M)]
add_index('MỤC LỤC','TOC \\o "1-3" \\h \\z \\u',headings)
front_page()
add_index('DANH MỤC SƠ ĐỒ, HÌNH','TOC \\h \\z \\t "FigureCaption,1"',figures)
front_page()
add_index('DANH MỤC BẢNG','TOC \\h \\z \\t "TableCaption,1"',table_titles)
front_page()
title('KÝ HIỆU CÁC CỤM TỪ VIẾT TẮT')
make_table(['Ký hiệu','Giải nghĩa'],[
 ['API','Application Programming Interface — giao diện lập trình ứng dụng'],['BQL','Ban quản lý'],['CSDL','Cơ sở dữ liệu'],['CSS','Cascading Style Sheets — ngôn ngữ định kiểu giao diện'],['ERP','Enterprise Resource Planning — hoạch định nguồn lực doanh nghiệp'],['ERD','Entity Relationship Diagram — sơ đồ quan hệ thực thể'],['FK / PK','Foreign Key / Primary Key — khóa ngoại / khóa chính'],['GVHD','Giảng viên hướng dẫn'],['HTTP / HTTPS','Giao thức truyền siêu văn bản / phiên bản qua kết nối bảo mật'],['JSON','JavaScript Object Notation — định dạng trao đổi dữ liệu'],['JWT','JSON Web Token — định dạng thông tin xác nhận'],['KTV','Kỹ thuật viên'],['QR','Quick Response — mã phản hồi nhanh'],['SĐT','Số điện thoại'],['SQL','Structured Query Language — ngôn ngữ truy vấn có cấu trúc'],['UI / UX','User Interface / User Experience — giao diện / trải nghiệm người dùng'],['UML','Unified Modeling Language — ngôn ngữ mô hình hóa thống nhất'],['UQ','Unique — ràng buộc duy nhất'],['URL','Uniform Resource Locator — địa chỉ tài nguyên thống nhất'],['VAT / GTGT','Value Added Tax / giá trị gia tăng']
],[2.8,13.2])

main=doc.add_section(WD_SECTION_START.NEW_PAGE)
setup_section(main)
main.header.is_linked_to_previous=False;main.footer.is_linked_to_previous=False
num=OxmlElement('w:pgNumType');num.set(qn('w:start'),'1');main._sectPr.append(num)
header_table=main.header.add_table(rows=1,cols=2,width=Cm(16));header_table.autofit=False
for cell,width,text in zip(header_table.rows[0].cells,[9.2,6.8],[META['de_tai'].capitalize(),'GVHD: '+META['gvhd']]):
    cell.width=Cm(width);p=cell.paragraphs[0];p.alignment=WD_ALIGN_PARAGRAPH.LEFT if width==9.2 else WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=1;p.paragraph_format.space_after=Pt(0)
    run_font(p.add_run(text),13)
main.header.paragraphs[0].paragraph_format.space_after=Pt(0)
main.header.paragraphs[0].paragraph_format.line_spacing=Pt(1)
footer=main.footer.paragraphs[0];footer.paragraph_format.first_line_indent=Cm(0);footer.paragraph_format.line_spacing=1
footer.alignment=WD_ALIGN_PARAGRAPH.LEFT
footer.paragraph_format.tab_stops.clear_all()
footer.paragraph_format.tab_stops.add_tab_stop(Cm(16),WD_TAB_ALIGNMENT.RIGHT)
run_font(footer.add_run(META['sinh_vien']+'\t'),13);field(footer,'PAGE','1')

lines=source.splitlines();i=0;first_heading=True
while i<len(lines):
    line=lines[i].strip()
    if not line:i+=1;continue
    heading=re.match(r'^(#{1,4}) (.+)',line)
    if heading:
        level=len(heading.group(1));text=heading.group(2)
        # Dictionary subsections do not inflate the main table of contents.
        style='Heading 4' if text.startswith('A.') else f'Heading {level}'
        p=para(text,style,WD_ALIGN_PARAGRAPH.LEFT)
        if first_heading:p.paragraph_format.page_break_before=False;first_heading=False
        bookmark(p,text);i+=1;continue
    image=re.match(r'^!\[([^]]+)\]\(([^)]+)\)$',line)
    if image:
        caption,name=image.groups();file=BASE/name
        w,h=Image.open(file).size
        max_width=8.4 if name.endswith('phan-anh.png') and name.startswith('hinh/giao-dien') else 16
        scale=min(max_width/w,18.2/h)
        p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.keep_with_next=True
        p.add_run().add_picture(str(file),width=Cm(w*scale),height=Cm(h*scale))
        p=para(caption,'FigureCaption',WD_ALIGN_PARAGRAPH.CENTER);bookmark(p,caption)
        i+=1;continue
    if re.match(r'^Bảng (?:\d+|[AB])\.\d+\.',line):
        p=para(line,'TableCaption',WD_ALIGN_PARAGRAPH.CENTER);bookmark(p,line);i+=1;continue
    if line.startswith('|'):
        block=[]
        while i<len(lines) and (not lines[i].strip() or lines[i].strip().startswith('|')):
            if lines[i].strip().startswith('|'):block.append(lines[i].strip())
            i+=1
        parsed=[[c.strip() for c in row.strip('|').split('|')] for row in block]
        parsed=[row for row in parsed if not all(re.fullmatch(r':?-+:?',c.replace(' ','')) for c in row)]
        widths=None
        if parsed[0]==['Trường','Kiểu MySQL','Khóa','NULL']:widths=[5.3,6.2,2.5,2]
        elif parsed[0][0]=='Mã/chức năng':widths=[2.6,4.8,5.2,3.4]
        elif parsed[0][0]=='Mã' and len(parsed[0])==3:widths=[1.6,4.7,9.7]
        make_table(parsed[0],parsed[1:],widths)
        continue
    if line.startswith('```'):
        i+=1
        while i<len(lines) and not lines[i].startswith('```'):
            p=doc.add_paragraph(style='CodeLine')
            p.alignment=WD_ALIGN_PARAGRAPH.LEFT
            run_font(p.add_run(lines[i]),13)
            i+=1
        i+=1;continue
    if line.startswith('Nguồn:'):
        para(line,'SourceNote');i+=1;continue
    if re.match(r'^\[\d+\]',line):
        p=para(line,align=WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.left_indent=Cm(.8);p.paragraph_format.first_line_indent=Cm(-.8)
        i+=1;continue
    parts=[line];i+=1
    while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||!\[|```|Bảng )',lines[i]):
        parts.append(lines[i].strip());i+=1
    para(' '.join(parts))

# Populate page-reference fields inside the dynamic indexes, preserving TOC fields.
for p,text,level in index_slots:
    end=p._p.find('.//'+qn('w:fldChar')+'[@'+qn('w:fldCharType')+'="end"]')
    end_run=end.getparent() if end is not None else None
    if end_run is not None:p._p.remove(end_run)
    field(p,'PAGEREF '+bookmarks.get(text,'_missing')+' \\h',PAGE_MAP.get(text,'…'))
    if end_run is not None:p._p.append(end_run)
    if level==1 and text in dict(headings):
        for r in p.runs:r.bold=True

doc.save(OUTPUT)
manifest={
 'source_commit':META['ma_nguon'],'date':META['ngay_doi_chieu'],
 'tables':len(tables),'columns':sum(len(t['rows']) for t in tables),'foreign_keys':sum(len(t['relations']) for t in tables),'views':len(views),
 'figures':len(figures),'tables_in_report':len(table_titles),'test_cases':len(cases),
 'toc_entries':len(headings),'page_map_entries':len(PAGE_MAP),
 'docx_sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
 'pending':['Submission month/year intentionally left blank as requested','Student reviews acknowledgements/declaration and contributions before signing','GVHD/reviewer comments and signatures','Actual work log','Hardware/OS and browser versions','Figma evidence if required','Device QR timings and functional acceptance evidence'],
 'render_note':'DOCX requests Times New Roman. Linux preview uses Liberation Serif where Times New Roman is unavailable; final pagination must be updated in Microsoft Word on the submission machine.'
}
(BASE/'kiem-chung/tai-lieu.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Saved',OUTPUT.name,manifest['figures'],'figures;',len(tables),'tables;',len(cases),'acceptance cases; font Times New Roman 13.')
