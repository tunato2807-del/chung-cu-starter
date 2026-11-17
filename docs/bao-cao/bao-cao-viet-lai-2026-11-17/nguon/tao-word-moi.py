from pathlib import Path
from copy import deepcopy
import json,re,hashlib,zipfile,html
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH,WD_TAB_ALIGNMENT,WD_TAB_LEADER
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT,WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.part import Part
from docx.opc.packuri import PackURI
from PIL import Image
B=Path(__file__).resolve().parent.parent;R=B.parents[2]
blocks=json.loads((B/'nguon/noi-dung.json').read_text())
PAGES=json.loads((B/'kiem-chung/so-trang.json').read_text()) if (B/'kiem-chung/so-trang.json').exists() else {}
D=Document();count=0;entries=[];figures=[];tables=[];chap='';nums={};refs_used={};bookmarks={}
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ASVG='http://schemas.microsoft.com/office/drawing/2016/SVG/main'

def prop(el,name,value):
 z=OxmlElement(name);z.set(qn('w:val'),str(value));el.append(z);return z

def font(run,size=13,bold=None,italic=None):
 run.font.name='Times New Roman';run.font.size=Pt(size);run.font.color.rgb=RGBColor(0,0,0)
 if bold is not None:run.bold=bold
 if italic is not None:run.italic=italic
 rf=run._r.get_or_add_rPr().get_or_add_rFonts()
 for k in ['ascii','hAnsi','eastAsia','cs']:rf.set(qn('w:'+k),'Times New Roman')
 return run

def field(p,instr,result=''):
 for k,t in [('begin',None),('code',instr),('separate',None),('text',str(result)),('end',None)]:
  r=OxmlElement('w:r')
  if k=='code':
   e=OxmlElement('w:instrText');e.set(qn('xml:space'),'preserve');e.text=' '+t+' '
  elif k=='text':e=OxmlElement('w:t');e.text=t
  else:e=OxmlElement('w:fldChar');e.set(qn('w:fldCharType'),k)
  r.append(e);p._p.append(r)

def bookmark(p,name):
 global count
 count+=1;s=OxmlElement('w:bookmarkStart');s.set(qn('w:id'),str(count));s.set(qn('w:name'),name);e=OxmlElement('w:bookmarkEnd');e.set(qn('w:id'),str(count));p._p.insert(1 if p._p.find(qn('w:pPr')) is not None else 0,s);p._p.append(e)
 bookmarks[name]=p.text

def write(p,text):
 # Numeric citations are native REF cross-references to bibliography bookmarks.
 for chunk in re.split(r'(\[\d+\])',text):
  m=re.fullmatch(r'\[(\d+)\]',chunk)
  if m:
   n=int(m.group(1));refs_used[n]=refs_used.get(n,0)+1;field(p,'REF TLTK_'+str(n)+' \\h',chunk)
  else:font(p.add_run(chunk))
 return p

def para(text='',style=None,align=None):
 p=D.add_paragraph(style=style)
 if align is not None:p.alignment=align
 write(p,text);return p

def heading(level,text):
 p=D.add_paragraph(style='Heading '+str(level));font(p.add_run(text),16,True)
 if level==1:p.paragraph_format.page_break_before=True
 mark='H'+str(len(entries)+1);bookmark(p,mark);entries.append(dict(title=text,mark=mark,level=level));return p

def section(sec,numbered=False,border=False):
 sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.top_margin=Cm(2);sec.bottom_margin=Cm(2);sec.left_margin=Cm(3);sec.right_margin=Cm(2)
 sec.header_distance=Cm(.6);sec.footer_distance=Cm(.8)
 for old in list(sec._sectPr.findall(qn('w:pgBorders'))):sec._sectPr.remove(old)
 sec.header.is_linked_to_previous=False;sec.footer.is_linked_to_previous=False
 if border:
  bd=OxmlElement('w:pgBorders');bd.set(qn('w:offsetFrom'),'page')
  for name in ['top','left','bottom','right']:
   x=OxmlElement('w:'+name)
   for k,v in [('val','single'),('sz','8'),('space','22'),('color','000000')]:x.set(qn('w:'+k),v)
   bd.append(x)
  sec._sectPr.append(bd)
 if numbered:
  pn=OxmlElement('w:pgNumType');pn.set(qn('w:start'),'1');pn.set(qn('w:fmt'),'decimal');sec._sectPr.append(pn)
  t=sec.header.add_table(rows=1,cols=2,width=Cm(16));t.autofit=False;t.columns[0].width=Cm(10.1);t.columns[1].width=Cm(5.9)
  for cell,txt,align in [(t.cell(0,0),'Xây dựng hệ thống quản lý vận hành chung cư\nvà tiếp nhận phản ánh cư dân',WD_ALIGN_PARAGRAPH.LEFT),(t.cell(0,1),'GVHD: ThS. Đặng Đức Trung',WD_ALIGN_PARAGRAPH.RIGHT)]:
   p=cell.paragraphs[0];p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1;p.alignment=align;font(p.add_run(txt),10)
  first=sec.header.paragraphs[0];first.paragraph_format.space_after=Pt(0);first.paragraph_format.line_spacing=1;font(first.add_run(''),1)
  p=sec.footer.paragraphs[0];p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.tab_stops.add_tab_stop(Cm(16),WD_TAB_ALIGNMENT.RIGHT);font(p.add_run('Tô Hoàng Tuấn\t'),13);field(p,'PAGE','1')

# All report text styles; cover overrides follow explicit cover template.
for sty in D.styles:
 if sty.type==1 or sty.type==2:
  sty.font.name='Times New Roman';sty.font.size=Pt(13);sty.font.color.rgb=RGBColor(0,0,0)
D.styles['Footer'].paragraph_format.tab_stops.clear_all()
D.styles['Header'].paragraph_format.tab_stops.clear_all()
normal=D.styles['Normal'];normal.paragraph_format.line_spacing=1.5;normal.paragraph_format.space_after=Pt(6);normal.paragraph_format.first_line_indent=Cm(1);normal.paragraph_format.widow_control=True
for lvl in [1,2,3]:
 sty=D.styles['Heading '+str(lvl)];sty.font.name='Times New Roman';sty.font.size=Pt(16);sty.font.bold=True;sty.paragraph_format.line_spacing=1.5;sty.paragraph_format.space_before=Pt(12);sty.paragraph_format.space_after=Pt(6);sty.paragraph_format.first_line_indent=Cm(0);sty.paragraph_format.keep_with_next=True;sty.paragraph_format.keep_together=True
for name in ['FrontTitle','FigureCaption','TableCaption','SourceNote','IndexEntry','CodeBlock','RefEntry']:
 if name not in D.styles:D.styles.add_style(name,1)
 sty=D.styles[name];sty.base_style=normal;sty.paragraph_format.first_line_indent=Cm(0)
D.styles['FrontTitle'].font.size=Pt(16);D.styles['FrontTitle'].font.bold=True;D.styles['FrontTitle'].paragraph_format.space_after=Pt(18);D.styles['FrontTitle'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
D.styles['FigureCaption'].font.italic=True;D.styles['FigureCaption'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER;D.styles['FigureCaption'].paragraph_format.keep_together=True
D.styles['TableCaption'].font.bold=True;D.styles['TableCaption'].paragraph_format.keep_with_next=True
D.styles['SourceNote'].paragraph_format.space_after=Pt(9);D.styles['SourceNote'].font.italic=True
D.styles['IndexEntry'].paragraph_format.space_after=Pt(0);D.styles['IndexEntry'].paragraph_format.tab_stops.add_tab_stop(Cm(15.8),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
D.styles['CodeBlock'].paragraph_format.line_spacing=1.5;D.styles['CodeBlock'].paragraph_format.space_after=Pt(0);D.styles['CodeBlock'].paragraph_format.left_indent=Cm(.5)
D.styles['RefEntry'].paragraph_format.left_indent=Cm(1);D.styles['RefEntry'].paragraph_format.first_line_indent=Cm(-1)
# No automatic Word mutation of cached fields on open; fields remain updateable.
sett=D.settings.element
up=sett.find(qn('w:updateFields'))
if up is None:up=OxmlElement('w:updateFields');sett.append(up)
up.set(qn('w:val'),'false')
D.core_properties.title='Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân'
D.core_properties.author='Tô Hoàng Tuấn';D.core_properties.subject='Đồ án chuyên ngành Công nghệ phần mềm';D.core_properties.language='vi-VN';D.core_properties.keywords='chung cư, React, Node.js, MySQL, QR, đồ án chuyên ngành'
lang=D.styles['Normal'].element.get_or_add_rPr();prop(lang,'w:lang','vi-VN')

logo=B/'hinh/logo-truong.png'
assert logo.exists(), 'Thiếu hinh/logo-truong.png đã trích từ hướng dẫn đầu vào.'
section(D.sections[0],border=True)
for cover in range(2):
 if cover:D.add_page_break()
 def cp(t,size=14,bold=True,after=9):
  p=D.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=1.15;p.paragraph_format.space_after=Pt(after);font(p.add_run(t),size,bold);return p
 cp('TRƯỜNG ĐẠI HỌC\nTÀI NGUYÊN VÀ MÔI TRƯỜNG TP.HCM',16)
 cp('KHOA CÔNG NGHỆ THÔNG TIN',14,after=13)
 p=cp('',after=16);p.add_run().add_picture(str(logo),width=Cm(2.8))
 cp('ĐỒ ÁN CHUYÊN NGÀNH CÔNG NGHỆ PHẦN MỀM\nNGÀNH CÔNG NGHỆ THÔNG TIN',16,after=25)
 cp('XÂY DỰNG HỆ THỐNG\nQUẢN LÝ VẬN HÀNH CHUNG CƯ\nVÀ TIẾP NHẬN PHẢN ÁNH CƯ DÂN',19,after=29)
 for text in ['Giảng viên hướng dẫn: ThS. Đặng Đức Trung','Sinh viên thực hiện: Tô Hoàng Tuấn','Mã số sinh viên: 1250080221','Lớp: 12_ĐH_CNPM3','Khóa: 2023–2027']:
  p=cp(text,14,after=6);p.alignment=WD_ALIGN_PARAGRAPH.LEFT;p.paragraph_format.left_indent=Cm(2)
 p=cp('TP. Hồ Chí Minh, tháng …… năm ……',13,after=0);p.paragraph_format.space_before=Pt(36)
front=D.add_section(WD_SECTION_START.NEW_PAGE);section(front)

def frontpage(title,first=False):
 if not first:D.add_page_break()
 return para(title,'FrontTitle')
def sign(label='Sinh viên thực hiện',name='Tô Hoàng Tuấn'):
 p=para(label,align=WD_ALIGN_PARAGRAPH.RIGHT);p.paragraph_format.space_before=Pt(12)
 p=para('(Ký và ghi rõ họ tên)',align=WD_ALIGN_PARAGRAPH.RIGHT)
 p=para(name,align=WD_ALIGN_PARAGRAPH.RIGHT);p.paragraph_format.space_before=Pt(36)
frontpage('LỜI CẢM ƠN',True)
para('Em xin cảm ơn Trường Đại học Tài nguyên và Môi trường TP. Hồ Chí Minh đã tạo điều kiện học tập và nghiên cứu trong ngành Công nghệ thông tin. Em cảm ơn quý thầy cô Khoa Công nghệ thông tin đã truyền đạt kiến thức về phân tích hệ thống, cơ sở dữ liệu, lập trình và kiểm thử, làm nền tảng để em thực hiện đồ án chuyên ngành Công nghệ phần mềm.')
para('Em xin cảm ơn ThS. Đặng Đức Trung đã hướng dẫn em xác định bài toán, xây dựng đề cương và hoàn thiện cách trình bày kết quả. Qua đề tài, em có cơ hội liên hệ kiến thức đã học với bài toán quản lý vận hành chung cư và tiếp nhận phản ánh cư dân trên nền tảng Web.')
para('Báo cáo và sản phẩm còn những hạn chế, đặc biệt ở phần thực nghiệm thiết bị và đánh giá sử dụng thực tế. Em mong nhận được ý kiến của thầy cô để tiếp tục hoàn thiện. Em xin trân trọng cảm ơn.')
sign()
frontpage('LỜI CAM ĐOAN')
para('Tôi cam đoan chịu trách nhiệm về tính trung thực của những nội dung, kết quả và bằng chứng được sử dụng trong báo cáo đồ án “Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân”. Các phần tham khảo, phần kế thừa và thư viện sử dụng được ghi nguồn; phạm vi đóng góp của bản thân phải phản ánh đúng quá trình thực hiện.')
para('Tôi không xem dữ liệu mô phỏng là dữ liệu cư dân thực tế; không xem kiểm thử trình duyệt giả lập là thực nghiệm camera trên thiết bị vật lý; không trình bày những phép đo chưa thực hiện như kết quả đã có. Tôi có trách nhiệm kiểm tra lại nội dung, mã nguồn và các số liệu trước khi ký và nộp báo cáo.')
para('Nếu có nội dung vi phạm quy định học thuật hoặc không trung thực, tôi xin chịu trách nhiệm theo quy định của nhà trường.')
sign()
for who in ['GIẢNG VIÊN HƯỚNG DẪN','GIẢNG VIÊN PHẢN BIỆN']:
 frontpage('NHẬN XÉT CỦA '+who)
 for label in ['Kết cấu và phương pháp trình bày:','Cơ sở lý luận:','Tính thực tiễn và khả năng ứng dụng:','Kết quả thực hiện:']:
  p=para(label);p.paragraph_format.first_line_indent=Cm(0)
  p=para('......................................................................................................');p.paragraph_format.first_line_indent=Cm(0)
 para('Kết luận (đồng ý hoặc không đồng ý cho sinh viên nộp báo cáo):')
 para('......................................................................................................')
 para('TP. Hồ Chí Minh, ngày …… tháng …… năm ……',align=WD_ALIGN_PARAGRAPH.RIGHT)
 sign(who,'ThS. Đặng Đức Trung' if who.endswith('HƯỚNG DẪN') else '')
frontpage('LỊCH LÀM VIỆC')
para('Lịch dự kiến theo đề cương, giai đoạn 24/08/2026–04/12/2026. Bảng này không thay thế nhật ký đã được giảng viên xác nhận; phần nhận xét và chữ ký để giảng viên ghi khi duyệt.', 'SourceNote')
work=[('1','Đăng ký GVHD và đề tài'),('2','Viết đề cương'),('3','Nộp đề cương, xác định yêu cầu, Use Case'),('4','Đặc tả Use Case, sơ đồ hoạt động/tuần tự'),('5','CSDL, sơ đồ lớp và kiến trúc'),('6','Thiết kế giao diện, cài môi trường'),('7','CSDL và quản lý căn hộ/cư dân'),('8','QR, tiếp nhận phản ánh và hóa đơn'),('9','Giao diện Ban quản lý'),('10','Giao diện cư dân và quét QR'),('11','Kiểm thử chức năng và sửa lỗi'),('12','Thử nghiệm quét QR trình duyệt'),('13','Tổng hợp hình và viết báo cáo'),('14','Báo cáo trước hội đồng'),('15','Nộp tệp báo cáo')]

def table_grid(headers,rows,widths=None):
 t=D.add_table(rows=1,cols=len(headers));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False;t.style='Table Grid'
 if widths is None:widths=[16/len(headers)]*len(headers)
 for i,w in enumerate(widths):t.columns[i].width=Cm(w)
 for i,txt in enumerate(headers):
  c=t.rows[0].cells[i];c.width=Cm(widths[i]);p=c.paragraphs[0];p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.space_after=Pt(3);p.paragraph_format.line_spacing=1.5;font(p.add_run(txt),13,True)
  shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'F2F2F2');c._tc.get_or_add_tcPr().append(shade)
 prop(t.rows[0]._tr.get_or_add_trPr(),'w:tblHeader','true')
 for row in rows:
  cells=t.add_row().cells
  for i,txt in enumerate(row):
   cells[i].width=Cm(widths[i]);cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   p=cells[i].paragraphs[0];p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.space_after=Pt(3);p.paragraph_format.line_spacing=1.5
   # Soft wrap technical identifiers without changing visible spelling.
   txt=str(txt)
   if '_' in txt:txt=txt.replace('_','_\u200b')
   write(p,txt)
  prop(t.rows[-1]._tr.get_or_add_trPr(),'w:cantSplit','true')
 for c in t.rows[0].cells:
  for p in c.paragraphs:p.paragraph_format.keep_with_next=True
 # Keep the last row with the source note, not the entire table.
 for c in t.rows[-1].cells:
  for p in c.paragraphs:p.paragraph_format.keep_with_next=True
 return t

table_grid(['Tuần','Nội dung dự kiến','Địa điểm','Nhận xét GVHD','Chữ ký'],[[w,t,'Trường ĐH TN&MT TP.HCM','',''] for w,t in work],[1.1,6.4,3,3.3,2.2])
frontpage('TÓM TẮT ĐỒ ÁN')
para('Đề tài “Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân” giải quyết bài toán tập trung dữ liệu vận hành và theo dõi sự cố theo địa điểm. Sản phẩm là ứng dụng Web cho một chung cư, cho phép cư dân mở biểu mẫu từ mã QR tại vị trí/thiết bị mà không bắt buộc cài ứng dụng riêng hoặc đăng nhập khi gửi phản ánh.')
para('Hệ thống được phân tích bằng ca sử dụng, hoạt động, tuần tự và mô hình dữ liệu; triển khai bằng React, Node.js/Express và MySQL. Thư viện html5-qrcode hỗ trợ quét camera, qrcode dựng ảnh QR. Các chức năng chính gồm quản lý căn hộ/cư trú, thiết bị/vị trí QR, gửi ảnh phản ánh, phân công kỹ thuật, nghiệm thu, phí/hóa đơn, VietQR và thông báo. Cơ sở dữ liệu có 31 bảng; ERD tổng quan giữ 18 bảng trọng tâm trên một bản vẽ.')
para('Kết quả kiểm chứng ngày 17/11/2026 gồm build thành công, 227 bài backend, 48 bài UI fixture và '+str(next(x['rows'][3][2].split(' ')[0] for x in blocks if x['kind']=='table' and x['title'].startswith('Kết quả kiểm chứng')))+' bài E2E đạt; một lần tải Excel quá thời gian chờ, chạy lại riêng đạt 2/2. Các kết quả dùng dữ liệu thử, chưa xác nhận triển khai thực tế. Camera vật lý đa thiết bị chưa có số đo; thanh toán không tự đối soát ngân hàng. Hướng phát triển tập trung thực nghiệm QR, đo tải, hoàn thiện vận hành và đánh giá với người dùng.')

# Precompute title numbering for indexes.
chapter='';tn={};ui=0
for x in blocks:
 if x['kind']=='heading' and x['level']==1:
  chapter='1' if x['text'].startswith('CHƯƠNG 1') else '2' if x['text'].startswith('CHƯƠNG 2') else '3' if x['text'].startswith('CHƯƠNG 3') else 'PL' if x['text']=='PHỤ LỤC' else chapter
 if x['kind']=='table':
  tn[chapter]=tn.get(chapter,0)+1;x['caption']='Bảng '+chapter+'.'+str(tn[chapter])+'. '+x['title'];x['mark']='T'+str(sum(tn.values()));tables.append(x)
 if x['kind']=='figure':
  x['caption']='Hình 2.'+str(x['number'])+'. '+x['title'];x['mark']='F2_'+str(x['number']);figures.append(x)
 if x['kind']=='ui':
  ui+=1;x['caption']='Hình 3.'+str(ui)+'. '+x['title'];x['mark']='F3_'+str(ui);figures.append(x)
headlist=[dict(title=x['text'],level=x['level'],mark='H'+str(i+1)) for i,x in enumerate(y for y in blocks if y['kind']=='heading')]

def index(title,items,instr):
 frontpage(title)
 p=D.add_paragraph();p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1
 r=OxmlElement('w:r');e=OxmlElement('w:fldChar');e.set(qn('w:fldCharType'),'begin');r.append(e);p._p.append(r)
 r=OxmlElement('w:r');e=OxmlElement('w:instrText');e.set(qn('xml:space'),'preserve');e.text=' '+instr+' ';r.append(e);p._p.append(r)
 r=OxmlElement('w:r');e=OxmlElement('w:fldChar');e.set(qn('w:fldCharType'),'separate');r.append(e);p._p.append(r)
 for item in items:
  text=item.get('caption',item.get('title'));level=item.get('level',1);p=D.add_paragraph(style='IndexEntry');p.paragraph_format.left_indent=Cm(.45*(level-1));write(p,text);p.add_run('\t');field(p,'PAGEREF '+item['mark']+' \\h',PAGES.get(item['mark'],'1'))
 e=OxmlElement('w:fldChar');e.set(qn('w:fldCharType'),'end');r=OxmlElement('w:r');r.append(e);p._p.append(r)
index('MỤC LỤC',headlist,'TOC \\o "1-3" \\h \\z \\u')
index('DANH MỤC SƠ ĐỒ, HÌNH',figures,'TOC \\c "Hinh" \\h \\z')
index('DANH MỤC BẢNG',tables,'TOC \\c "Bang" \\h \\z')
frontpage('KÝ HIỆU CÁC CỤM TỪ VIẾT TẮT')
table_grid(['Ký hiệu','Diễn giải'],[
['API','Application Programming Interface – giao diện lập trình ứng dụng'],['BQL','Ban quản lý'],['CSDL','Cơ sở dữ liệu'],['E2E','End-to-end – kiểm thử toàn luồng'],['ERD','Entity Relationship Diagram – sơ đồ quan hệ thực thể'],['FK','Foreign Key – khóa ngoại'],['HTTP/HTTPS','Giao thức truyền siêu văn bản / giao thức được bảo vệ bằng TLS'],['JSON','JavaScript Object Notation – định dạng trao đổi dữ liệu'],['JWT','JSON Web Token – dạng token phiên được ký'],['GVHD','Giảng viên hướng dẫn'],['KTV','Kỹ thuật viên'],['ORM','Object-Relational Mapping – ánh xạ đối tượng–quan hệ'],['PK','Primary Key – khóa chính'],['QR','Quick Response – mã phản hồi nhanh'],['REST','Representational State Transfer – kiểu kiến trúc dịch vụ Web'],['SQL','Structured Query Language – ngôn ngữ truy vấn có cấu trúc'],['UI/UX','User Interface/User Experience – giao diện/trải nghiệm người dùng'],['UML','Unified Modeling Language – ngôn ngữ mô hình hóa thống nhất']
],[2.5,13.5])
main=D.add_section(WD_SECTION_START.NEW_PAGE);section(main,True)
# Prevent empty first numbered page caused by section+page break at MỞ ĐẦU.
imgmap=json.loads((B/'nguon/anh-minh-hoa.json').read_text())
diags=R/'docs/so-do-theo-mau-2026-11-17'


def add_picture(p,path,maxw=16,maxh=17,svg=None,crop=0):
 with Image.open(path) as im:w,h=im.size
 h=h*(1-crop)
 scale=min(maxw/w,maxh/h)
 r=p.add_run();shape=r.add_picture(str(path),width=Cm(w*scale),height=Cm(h*scale))
 if crop:
  fill=shape._inline.xpath('.//pic:blipFill')[0];rect=OxmlElement('a:srcRect');rect.set('b',str(round(crop*100000)));fill.insert(1,rect)
 # SVG source is embedded alongside PNG fallback for editable/scalable Office rendering.
 if svg and svg.exists():
  part=Part(PackURI('/word/media/vector'+str(len(D.inline_shapes))+'.svg'),'image/svg+xml',svg.read_bytes())
  rid=D.part.relate_to(part,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
  blip=shape._inline.xpath('.//a:blip')[0];exts=OxmlElement('a:extLst');ex=OxmlElement('a:ext');ex.set('uri','{96DAC541-7B7A-43D3-8B79-37D633B846F1}');sv=__import__('lxml.etree',fromlist=['Element']).Element('{'+ASVG+'}svgBlip',nsmap={'asvg':ASVG});sv.set(qn('r:embed'),rid);ex.append(sv);exts.append(ex);blip.append(exts)
 shape._inline.docPr.set('descr',path.stem)
 return shape

def caption(x,typ):
 p=D.add_paragraph(style='FigureCaption' if typ=='Hinh' else 'TableCaption');text=x['caption'];m=re.match(r'(.+?\.)(\d+)(\. .*)',text)
 # Arabic number is a SEQ field; chapter/prefix retained exactly in generated title.
 pre=re.match(r'((?:Hình|Bảng) (?:\d+|PL)\.)(\d+)(\. .*)',text)
 if pre:
  font(p.add_run(pre[1]),13,False,typ=='Hinh');field(p,'SEQ '+typ+' \\* ARABIC \\r '+pre[2],pre[2]);font(p.add_run(pre[3]),13,False,typ=='Hinh')
 else:write(p,text)
 bookmark(p,x['mark']);return p

for i,x in enumerate(blocks):
 if x['kind']=='figure':
  j=i-1
  while j>=0 and blocks[j]['kind']=='heading':j-=1
  if j<i-1:blocks[j+1]['figure_page_start']=True;x['heading_attached']=True

for x in blocks:
 k=x['kind']
 if k=='heading':
  q=heading(x['level'],x['text'])
  if x.get('figure_page_start'):q.paragraph_format.page_break_before=True
  if x['text']=='MỞ ĐẦU':q.paragraph_format.page_break_before=False
 elif k=='paragraph':para(x['text']).alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
 elif k=='code':
  q=para(x['title'],'TableCaption')
  for line in x['text'].splitlines():
   p=para(line,'CodeBlock');p.paragraph_format.keep_with_next=True
  p.paragraph_format.keep_with_next=False
  para('Nguồn: mã nguồn dự án hoặc giả mã do tác giả trình bày, như ghi ở tiêu đề.','SourceNote')
 elif k=='table':
  caption(x,'Bang')
  if len(x['headers'])==6:widths=[1.1,2.7,3,3.3,4.1,1.8]
  elif x['headers']==['Thuộc tính','Kiểu MySQL','NULL','Khóa / tham chiếu']:widths=[4.6,3.7,1.4,6.3]
  elif len(x['headers'])==2:widths=[4,12]
  elif len(x['headers'])==3:widths=[4.4,5.3,6.3]
  else:widths=[4,4,4,4]
  table_grid(x['headers'],x['rows'],widths);para(x['source'],'SourceNote')
 elif k in ['figure','ui']:
  # Keep large diagrams on their own page, with caption attached to image.
  if k=='figure':
   paragraph=para('');paragraph.paragraph_format.page_break_before=not x.get('heading_attached',False);paragraph.paragraph_format.keep_with_next=True;paragraph.alignment=WD_ALIGN_PARAGRAPH.CENTER
   candidates=list((diags/'png').glob(f"02-{x['number']:02d}-*.png"));assert len(candidates)==1
   path=candidates[0];svg=diags/'svg'/(path.stem+'.svg');
   svg_h=float(__import__('xml.etree.ElementTree',fromlist=['fromstring']).fromstring(svg.read_text()).get('height'));add_picture(paragraph,path,maxh=15.2 if x.get('heading_attached') else 16.6,crop=90/svg_h)
  else:
   paragraph=para('');paragraph.paragraph_format.keep_with_next=True;paragraph.alignment=WD_ALIGN_PARAGRAPH.CENTER
   path=B/imgmap[x['key']]['file'];add_picture(paragraph,path,maxh=13.8)
  caption(x,'Hinh');para('Nguồn: '+('tác giả xây dựng từ đặc tả và mã nguồn cceb904; bản vẽ draw.io chỉnh sửa được bàn giao riêng.' if k=='figure' else imgmap[x['key']]['source']),'SourceNote')
  para(x['description']).alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
 elif k=='reference':
  p=D.add_paragraph(style='RefEntry');font(p.add_run('['+str(x['id'])+'] '));bookmark(p,'TLTK_'+str(x['id']));font(p.add_run(x['author']+'. '),13,True);font(p.add_run(x['title']+'. '),13,False,True);font(p.add_run('[Trực tuyến]. '+x['url']+'. Truy cập: '+x['access']+'.'))
  # Bookmark only the bracketed reference number, so REF returns [n], not full entry.
  st=p._p.find(qn('w:bookmarkStart'));en=p._p.find(qn('w:bookmarkEnd'));p._p.remove(en);first_run=p._p.find(qn('w:r'));p._p.insert(list(p._p).index(first_run)+1,en)

out=B/'Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx';D.save(out)
(B/'nguon/muc-luc-va-chu-thich.json').write_text(json.dumps(dict(headings=entries,figures=[dict(title=x['caption'],mark=x['mark']) for x in figures],tables=[dict(title=x['caption'],mark=x['mark']) for x in tables],bookmarks=bookmarks,citations=refs_used),ensure_ascii=False,indent=2))
# Editable textual companion for review; no dependency on Word to inspect content.
lines=[]
for x in blocks:
 if x['kind']=='heading':lines+=['\n'+'#'*x['level']+' '+x['text'],'']
 elif x['kind']=='paragraph':lines+=[x['text'],'']
 elif x['kind']=='table':
  lines+=[x['caption'],'','| '+' | '.join(x['headers'])+' |','| '+' | '.join('---' for _ in x['headers'])+' |']+['| '+' | '.join(str(t).replace('|','/') for t in row)+' |' for row in x['rows']]+['',x['source'],'']
 elif x['kind'] in ['figure','ui']:lines+=[x['caption'],'',x['description'],'']
 elif x['kind']=='code':lines+=[x['title'],'','```',x['text'],'```','']
 elif x['kind']=='reference':lines+=[f"[{x['id']}] **{x['author']}**. *{x['title']}*. {x['url']}. Truy cập {x['access']}.",'']
(B/'Noi-dung-bao-cao.md').write_text('\n'.join(lines))
print(json.dumps(dict(docx=str(out),headings=len(entries),figures=len(figures),tables=len(tables),citations=refs_used,paragraphs=len(D.paragraphs),images=len(D.inline_shapes)),ensure_ascii=False))
