from pathlib import Path
import xml.etree.ElementTree as E
import html, json, re, math, copy, hashlib
from PIL import ImageFont

REPO=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parents[1]
for name in ['drawio','xml','png','svg','nguon']: (OUT/name).mkdir(parents=True,exist_ok=True)
OLD=REPO/'docs/bao-cao/quyen-bao-cao-2026'
MANIFEST=json.loads((REPO/'docs/tai-lieu-ban-giao-2026-11-17/bao-cao-drawio/danh-muc-hinh.json').read_text())
SQL=(REPO/'database/thesis-mysql/001_thesis_schema.sql').read_text()
SCHEMA={}
for table,body in re.findall(r'CREATE TABLE (?:IF NOT EXISTS )?`([^`]+)` \((.*?)\n\) ENGINE',SQL,re.S):
    cols={}
    for col,rest in re.findall(r'^  `([^`]+)` (.+)',body,re.M):
        typ=re.split(r' NOT NULL| DEFAULT | GENERATED | AUTO_INCREMENT| CHARACTER SET | COLLATE ',rest.rstrip(','),1)[0]
        cols[col]={'type':typ,'nullable':'NOT NULL' not in rest}
    primary=re.search(r'PRIMARY KEY \((.*?)\)',body)
    pks=re.findall(r'`([^`]+)`',primary.group(1)) if primary else []
    SCHEMA[table]={'columns':cols,'pk':pks}
FKS=[]
for child,cols,parent,refcols in re.findall(r'ALTER TABLE `([^`]+)` ADD CONSTRAINT `[^`]+` FOREIGN KEY \(([^)]+)\) REFERENCES `([^`]+)` \(([^)]+)\)',SQL):
    FKS.append({'child':child,'columns':re.findall(r'`([^`]+)`',cols),'parent':parent,'references':re.findall(r'`([^`]+)`',refcols)})

def N(x):return f'{float(x):.2f}'.rstrip('0').rstrip('.')
def safe(s):return html.escape(str(s),quote=True)
FONT_PATH='/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
def wrap(s,w,fs):
    font=ImageFont.truetype(FONT_PATH,int(fs));result=[]
    for raw in str(s).split('\n'):
        line=''
        for word in raw.split(' '):
            test=(line+' '+word).strip()
            if line and font.getlength(test)>w:result.append(line);line=word
            else:line=test
        result.append(line)
    return result

class Diagram:
    def __init__(self,index,width,height):
        self.index=index;self.width=width;self.height=height;self.serial=0;self.bounds={};self.svgitems=[];self.fields=[];self.relations=[]
        self.model=E.Element('mxGraphModel',dx=str(width),dy=str(height),grid='1',gridSize='10',guides='1',connect='1',arrows='1',page='0',pageScale='1',pageWidth='827',pageHeight='1169',background='#ffffff',shadow='0')
        self.root=E.SubElement(self.model,'root');E.SubElement(self.root,'mxCell',id='0');E.SubElement(self.root,'mxCell',id='1',parent='0')
        self.box(0,0,width,height,'',stroke='none',fill='none',extra='opacity=0;')
    def cell(self,**kw):
        self.serial+=1
        return E.SubElement(self.root,'mxCell',id=f'd{self.index:02d}-{self.serial}',**kw)
    def box(self,x,y,w,h,label='',shape='rect',fs=22,bold=False,italic=False,underline=False,fill='#ffffff',stroke='#222222',align='center',parent='1',extra=''):
        px,py=(self.bounds[parent][0],self.bounds[parent][1]) if parent!='1' else (0,0)
        style=f'html=1;whiteSpace=wrap;overflow=hidden;fontFamily=Arial;fontSize={fs};fontStyle={(1 if bold else 0)+(2 if italic else 0)+(4 if underline else 0)};fontColor=#111111;strokeColor={stroke};strokeWidth=1.3;fillColor={fill};align={align};verticalAlign=middle;spacing=5;'
        if shape=='ellipse':style+='shape=ellipse;'
        elif shape=='diamond':style+='shape=rhombus;'
        elif shape=='round':style+='rounded=1;arcSize=18;'
        elif shape=='cylinder':style+='shape=cylinder;size=12;boundedLbl=1;'
        else:style+='rounded=0;'
        if shape=='group':style+='group;strokeColor=none;fillColor=none;'
        textlines=wrap(label,w-16,fs) if label else []
        value='<br>'.join(safe(v) for v in textlines)
        c=self.cell(value=value,style=style+extra,parent=parent,vertex='1')
        E.SubElement(c,'mxGeometry',x=N(x),y=N(y),width=N(w),height=N(h),**{'as':'geometry'})
        self.bounds[c.get('id')]=(px+x,py+y,w,h)
        self.svgitems.append({'kind':'box','x':px+x,'y':py+y,'w':w,'h':h,'lines':textlines,'shape':shape,'fs':fs,'bold':bold,'italic':italic,'underline':underline,'fill':fill,'stroke':stroke,'align':align,'invisible':'opacity=0' in extra,'family':'Times New Roman, serif' if 'fontFamily=Times New Roman' in extra else 'Arial, sans-serif'})
        return c.get('id')
    def text(self,x,y,w,h,label,fs=20,**kw):return self.box(x,y,w,h,label,fs=fs,fill='none',stroke='none',**kw)
    def anchor(self,node,side):
        x,y,w,h=self.bounds[node]
        return {'L':(x,y+h/2),'R':(x+w,y+h/2),'T':(x+w/2,y),'B':(x+w/2,y+h)}[side]
    def line(self,points,source=None,target=None,arrow='none',dashed=False,parent='1',label=None,lp=None,fs=18):
        st=f'html=1;noEdgeStyle=1;edgeStyle=none;rounded=0;strokeColor=#222222;strokeWidth=1.3;endArrow={arrow};endFill={0 if arrow=="open" else 1};endSize=9;'
        if dashed:st+='dashed=1;dashPattern=6 4;'
        if source:
            x,y,w,h=self.bounds[source];st+=f'exitX={N((points[0][0]-x)/w)};exitY={N((points[0][1]-y)/h)};exitPerimeter=0;'
        if target:
            x,y,w,h=self.bounds[target];st+=f'entryX={N((points[-1][0]-x)/w)};entryY={N((points[-1][1]-y)/h)};entryPerimeter=0;'
        kw={'value':'','style':st,'edge':'1','parent':parent}
        if source:kw['source']=source
        if target:kw['target']=target
        c=self.cell(**kw);g=E.SubElement(c,'mxGeometry',relative='1',**{'as':'geometry'})
        px,py=(self.bounds[parent][0],self.bounds[parent][1]) if parent!='1' else (0,0)
        if not source:E.SubElement(g,'mxPoint',x=N(points[0][0]-px),y=N(points[0][1]-py),**{'as':'sourcePoint'})
        if not target:E.SubElement(g,'mxPoint',x=N(points[-1][0]-px),y=N(points[-1][1]-py),**{'as':'targetPoint'})
        if len(points)>2:
            arr=E.SubElement(g,'Array',**{'as':'points'})
            for x,y in points[1:-1]:E.SubElement(arr,'mxPoint',x=N(x-px),y=N(y-py))
        self.svgitems.append({'kind':'line','points':points,'arrow':arrow,'dashed':dashed})
        if label:
            xx,yy=lp or points[len(points)//2];lw=max(40,min(210,ImageFont.truetype(FONT_PATH,int(fs)).getlength(label)+18));self.box(xx-lw/2,yy-16,lw,32,label,fs=fs,fill='#ffffff',stroke='none')
        return c.get('id')
    def connect(self,a,b,sa='B',sb='T',via=None,**kw):
        return self.line([self.anchor(a,sa)]+(via or [])+[self.anchor(b,sb)],a,b,**kw)
    def actor(self,cx,y,title,scale=1):
        group=self.box(cx-75,y,150,180,'',shape='group')
        self.box(61,0,28,28,'',shape='ellipse',parent=group)
        for points in [[(75,28),(75,78)],[(45,48),(105,48)],[(75,78),(47,112)],[(75,78),(103,112)]]:
            # Actor parts are native vertices; thin rectangles form the limbs.
            self.line([(cx-75+x,y+yy) for x,yy in points],parent=group)
        self.text(0,116,150,64,title,fs=20,parent=group)
        port=self.box(74,47,2,2,'',stroke='none',fill='none',parent=group,extra='opacity=0;')
        return port
    def start(self,cx,cy):return self.box(cx-12,cy-12,24,24,'',shape='ellipse',fill='#222222')
    def end(self,cx,cy):
        outer=self.box(cx-16,cy-16,32,32,'',shape='ellipse');self.box(cx-10,cy-10,20,20,'',shape='ellipse',fill='#222222');return outer
    def finish(self,note=''):
        caption=MANIFEST[self.index-1]['caption']
        self.text(25,self.height-77,self.width-50,50,caption,fs=26,italic=True,extra='fontFamily=Times New Roman;')
        self.note=note
    def svg(self):
        a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.width}" height="{self.height}" viewBox="0 0 {self.width} {self.height}"><rect width="100%" height="100%" fill="white"/>']
        for o in self.svgitems:
            if o['kind']=='line':
                pts=o['points'];dash=' stroke-dasharray="7 5"' if o['dashed'] else ''
                a.append('<polyline points="'+' '.join(f'{N(x)},{N(y)}' for x,y in pts)+f'" fill="none" stroke="#222222" stroke-width="1.3"{dash}/>')
                if o['arrow']!='none':
                    x,y=pts[-1];px,py=next(p for p in reversed(pts[:-1]) if p!=pts[-1]);dx,dy=x-px,y-py;length=math.hypot(dx,dy);ux,uy=dx/length,dy/length
                    points=[(x-11*ux-5*uy,y-11*uy+5*ux),(x,y),(x-11*ux+5*uy,y-11*uy-5*ux)]
                    a.append('<polyline points="'+' '.join(f'{N(xx)},{N(yy)}' for xx,yy in points)+f'" fill="{"none" if o["arrow"]=="open" else "#222222"}" stroke="#222222" stroke-width="1.3"/>')
                continue
            if o['invisible']:continue
            x,y,w,h=o['x'],o['y'],o['w'],o['h'];fill=o['fill'];stroke=o['stroke'];shape=o['shape'];fs=o['fs']
            attrs=f'fill="{fill}" stroke="{stroke}" stroke-width="1.3"'
            if shape=='ellipse':a.append(f'<ellipse cx="{N(x+w/2)}" cy="{N(y+h/2)}" rx="{N(w/2)}" ry="{N(h/2)}" {attrs}/>')
            elif shape=='diamond':a.append(f'<path d="M{N(x+w/2)},{N(y)} L{N(x+w)},{N(y+h/2)} L{N(x+w/2)},{N(y+h)} L{N(x)},{N(y+h/2)} Z" {attrs}/>')
            elif shape=='cylinder':
                a.append(f'<path d="M{x},{y+14} C{x},{y-4} {x+w},{y-4} {x+w},{y+14} L{x+w},{y+h-14} C{x+w},{y+h+4} {x},{y+h+4} {x},{y+h-14} Z" {attrs}/><path d="M{x},{y+14} C{x},{y+32} {x+w},{y+32} {x+w},{y+14}" fill="none" stroke="{stroke}"/>')
            elif shape!='group':a.append(f'<rect x="{N(x)}" y="{N(y)}" width="{N(w)}" height="{N(h)}" rx="{12 if shape=="round" else 0}" {attrs}/>')
            lines=o['lines']
            if lines:
                anchor='start' if o['align']=='left' else 'middle';tx=x+8 if anchor=='start' else x+w/2
                first=y+h/2-(len(lines)-1)*fs*1.2/2+fs*.35
                style=f'font-family="{o["family"]}" font-size="{fs}" fill="#111111" text-anchor="{anchor}"'
                if o['bold']:style+=' font-weight="bold"'
                if o['italic']:style+=' font-style="italic"'
                for k,line in enumerate(lines):
                    baseline=first+k*fs*1.2
                    a.append(f'<text x="{N(tx)}" y="{N(baseline)}" {style}>{safe(line)}</text>')
                    if o['underline']:
                        tw=ImageFont.truetype(FONT_PATH,int(fs)).getlength(line)
                        lx=tx if anchor=='start' else tx-tw/2
                        a.append(f'<line x1="{N(lx)}" y1="{N(baseline+3)}" x2="{N(lx+tw)}" y2="{N(baseline+3)}" stroke="#111111" stroke-width="1"/>')
        a.append('</svg>');return ''.join(a)

DIAGRAMS=[]
def save(d):
    d.finish(d.note if hasattr(d,'note') else '')
    f=MANIFEST[d.index-1]['filename']
    E.indent(d.model,space='  ')
    (OUT/'xml'/f'{f}.xml.txt').write_text(E.tostring(d.model,encoding='unicode'))
    root=E.Element('mxfile',host='app.diagrams.net',version='24.7.17',type='device',compressed='false')
    page=E.SubElement(root,'diagram',id=f'hinh-2-{d.index}',name=MANIFEST[d.index-1]['caption']);page.append(copy.deepcopy(d.model));E.indent(root,space='  ')
    (OUT/'drawio'/f'{f}.drawio').write_bytes(E.tostring(root,encoding='utf-8',xml_declaration=True))
    (OUT/'svg'/f'{f}.svg').write_text(d.svg())
    DIAGRAMS.append(d)

def decompose():
    d=Diagram(1,1740,950)
    root=d.box(570,85,600,90,'QUẢN LÝ VẬN HÀNH CHUNG CƯ\nVÀ TIẾP NHẬN PHẢN ÁNH',bold=True)
    groups=[('1. Tài khoản / hồ sơ',['Đăng nhập / đổi mật khẩu','Căn hộ / cư dân / cư trú','Tài khoản căn / bàn giao']),
      ('2. Phản ánh QR',['Vị trí / thiết bị / tem QR','Gửi / tra cứu phản ánh','Phân công / xử lý / nghiệm thu']),
      ('3. Phí và hóa đơn',['Đơn giá / chỉ số điện nước','Lập / duyệt / gửi hóa đơn','Đối soát thu / VietQR']),
      ('4. Vận hành',['Thiết bị / bảo trì','Tiện ích / đặt lịch','Phương tiện cư dân']),
      ('5. Điều hành / tài chính',['Thông báo / nhắc phí','Quỹ / chứng từ / sổ quỹ','Thống kê / nhập xuất'])]
    d.line([(870,175),(870,230),(150,230),(1590,230)])
    for i,(title,children) in enumerate(groups):
        x=35+i*345;n=d.box(x,280,300,72,title,bold=True,fill='#eeeeee',fs=21)
        d.line([(x+150,230),(x+150,280)],target=n)
        for k,text in enumerate(children):
            c=d.box(x+30,415+k*125,270,80,text,shape='round',fill='#f2f2f2',fs=21)
            d.line([(x+15,352),(x+15,455+k*125),(x+30,455+k*125)],source=n,target=c)
    save(d)

def usecase(index,cases,actors):
    h=230+len(cases)*108+170;d=Diagram(index,1270,h)
    d.box(325,90,625,len(cases)*108+100,'',fs=22)
    d.text(335,100,605,55,'HỆ THỐNG QUẢN LÝ VẬN HÀNH CHUNG CƯ',fs=21,bold=True)
    nodes={}
    for k,(key,label) in enumerate(cases):nodes[key]=d.box(365,175+k*108,545,72,label,shape='ellipse',fill='#f4f4f4',fs=22)
    for label,cx,y,keys in actors:
        a=d.actor(cx,y,label);right=cx>950
        for key in keys:
            d.connect(a,nodes[key],sa='L' if right else 'R',sb='R' if right else 'L')
    save(d)

def lanes(index,names,widths,height):
    d=Diagram(index,sum(widths)+40,height);x=20;centers=[]
    d.text(30,12,d.width-60,48,MANIFEST[index-1]['caption'].split('. ',1)[1],fs=25,bold=True)
    for name,w in zip(names,widths):
        d.box(x,85,w,height-190,'',stroke='#333333',fill='none')
        d.text(x+4,95,w-8,48,name,fs=23,bold=True);centers.append(x+w/2);x+=w
    return d,centers
def action(d,cx,y,text,w=286):return d.box(cx-w/2,y-48,w,96,text,shape='round',fill='#f4f4f4',fs=22)
def decision(d,cx,y,text):return d.box(cx-140,y-54,280,108,text,shape='diamond',fill='#ffffff',fs=21)
def flow(d,a,b,sa='B',sb='T',via=None,label=None,lp=None):
    p=d.anchor(a,sa);q=d.anchor(b,sb)
    if via is None and p[0]!=q[0] and p[1]!=q[1]:
        if sa in ['B','T'] and sb in ['B','T']:
            yy=(p[1]+q[1])/2;via=[(p[0],yy),(q[0],yy)]
        elif sa in ['L','R'] and sb in ['L','R']:
            xx=(p[0]+q[0])/2;via=[(xx,p[1]),(xx,q[1])]
    return d.connect(a,b,sa,sb,via,arrow='block',label=label,lp=lp,fs=18)

def activities():
    d,(u,s)=lanes(5,['Ban quản lý','Hệ thống (React / API / MySQL)'],[450,800],1510)
    st=d.start(u,175);a=action(d,u,280,'Chọn Vị trí & QR;\nnhập vị trí / thiết bị');b=action(d,s,410,'Kiểm tra quyền và dữ liệu');q=decision(d,s,550,'Quyền và dữ liệu\nhợp lệ?');err=action(d,u,690,'Hiển thị lỗi;\ngiữ nội dung để sửa');c=action(d,s,690,'Transaction: lưu vị trí,\ntoken và lịch sử');e=action(d,s,830,'Trả vị trí; React ghép URL\nvà tạo ảnh QR');f=action(d,u,970,'Xem / tải PNG / in mã');qq=decision(d,u,1110,'Quét thử đúng vị trí?');g=action(d,u,1250,'Dán mã tại vị trí');r=action(d,s,1250,'Kiểm tra origin / HTTPS;\nsinh lại ảnh và in mã');end=d.end(u,1360)
    for aa,bb in [(st,a),(a,b),(b,q),(q,c),(c,e),(e,f),(f,qq),(qq,g),(g,end)]:flow(d,aa,bb,label='Có' if aa in [q,qq] else None,lp=(s+30,625) if aa==q else (u+40,1185) if aa==qq else None)
    flow(d,q,err,'L','R',label='Không',lp=(545,590));flow(d,err,a,'L','L',[(65,690),(65,280)])
    flow(d,qq,r,'R','L',label='Không',lp=(560,1170));flow(d,r,e,'R','R',[(1210,1250),(1210,830)])
    save(d)

    d,(u,s)=lanes(6,['Người gửi','Hệ thống (React / API / MySQL)'],[450,900],1830)
    st=d.start(u,175);a=action(d,u,280,'Mở URL / quét QR vị trí');b=action(d,s,410,'Đọc vị trí từ token QR');q=decision(d,s,550,'QR còn hoạt động?');er=action(d,u,680,'Báo mã QR không hợp lệ');en=d.end(u,785);c=action(d,u,900,'Nhập nội dung; chọn /\nchụp ảnh; bấm Gửi');v=action(d,s,1030,'Chuẩn bị ảnh; kiểm tra\nkhóa yêu cầu và nội dung');qq=decision(d,s,1170,'Hợp lệ và\nyêu cầu mới?');new=action(d,s,1310,'BEGIN; lưu MOI, snapshot,\nảnh và nhật ký');old=action(d,1220,1310,'Lỗi / replay: trả kết quả\nphù hợp; dọn ảnh mới',w=240);commit=action(d,s,1440,'COMMIT; trả biên nhận\nvà mã tra cứu');res=action(d,u,1570,'Hiện kết quả; giữ nháp khi lỗi,\nxóa nháp khi thành công');end=d.end(u,1690)
    for aa,bb in [(st,a),(a,b),(b,q)]:flow(d,aa,bb)
    flow(d,q,er,'L','R',label='Không',lp=(570,610));flow(d,er,en)
    flow(d,q,c,'B','R',[(s,760),(u+143,760)],label='Có',lp=(s+35,680));flow(d,c,v);flow(d,v,qq);flow(d,qq,new,label='Có',lp=(s-20,1240));flow(d,qq,old,'R','T',[(1220,1170)],label='Không / replay',lp=(1160,1130));flow(d,new,commit);flow(d,commit,res,'L','R',[(610,1440),(610,1570)]);flow(d,old,res,'B','R',[(1220,1660),(600,1660),(600,1570)]);flow(d,res,end);save(d)

    d,(b,k,s)=lanes(7,['Ban quản lý','Kỹ thuật viên','Hệ thống'],[410,410,410],1850)
    st=d.start(b,175);a=action(d,b,285,'Chọn phản ánh MOI;\nphân công KTV / ưu tiên');c=action(d,s,425,'Kiểm quyền / phiên bản;\nlưu DA_PHAN_CONG');e=action(d,k,565,'Mở việc được giao;\nbấm bắt đầu xử lý');f=action(d,s,705,'Lưu DANG_XU_LY\nvà nhật ký');g=action(d,k,845,'Nhập kết quả; nộp ảnh\nmới đúng lượt xử lý');h=action(d,s,985,'Kiểm tra KTV / lượt / ảnh;\nlưu DA_XU_LY');j=action(d,b,1125,'Kiểm tra kết quả\nvà bằng chứng');q=decision(d,b,1265,'Nghiệm thu đạt?');ok=action(d,s,1405,'Lưu DA_DONG, ngày đóng\nvà lịch sử');end=d.end(s,1520);no=action(d,s,1650,'Trả lại kèm lý do; tăng lượt;\nlưu DANG_XU_LY')
    for aa,bb in [(st,a),(a,c),(c,e),(e,f),(f,g),(g,h),(h,j),(j,q)]:flow(d,aa,bb)
    flow(d,q,ok,'R','T',[(s,1265)],label='Có',lp=(620,1220));flow(d,ok,end)
    flow(d,q,no,'B','L',[(b,1650)],label='Không',lp=(b+55,1430));flow(d,no,g,'B','L',[(s,1735),(445,1735),(445,845)]);save(d)

    d,(b,s)=lanes(8,['Ban quản lý','Hệ thống (API / MySQL)'],[450,800],2360)
    st=d.start(b,175);a=action(d,b,280,'Chọn căn / kỳ / ngày chốt;\nyêu cầu lập nháp');c=action(d,s,410,'Kiểm tra đơn giá, xe\nvà chỉ số dịch vụ');q=decision(d,s,550,'Nguồn dữ liệu hợp lệ?');err=action(d,b,690,'Hiển thị lỗi;\nsửa dữ liệu nguồn');e=action(d,s,690,'Lưu NHAP và snapshot\ncác khoản phí');f=action(d,b,830,'Kiểm tra và duyệt hóa đơn');g=action(d,s,970,'Khóa hóa đơn; đối chiếu\nnguồn với bản nháp');qq=decision(d,s,1110,'Nguồn còn khớp?');retry=action(d,b,1250,'Làm mới / tính lại nháp');ok=action(d,s,1250,'Lưu DA_DUYET;\ncố định khoản tiền');send=action(d,b,1390,'Chọn thông tin nhận / hạn;\ngửi hóa đơn');sent=action(d,s,1530,'Lưu DA_GUI;\ncung cấp VietQR');check=action(d,b,1670,'Đối soát khoản tiền\nthực nhận');paid=decision(d,b,1810,'Đã nhận đủ\nđúng tổng tiền?');wait=action(d,s,1950,'Giữ DA_GUI;\nchờ đối soát tiếp');done=action(d,s,2090,'Xác nhận DA_THANH_TOAN;\nghi lịch sử thu');end=d.end(s,2200)
    for aa,bb in [(st,a),(a,c),(c,q)]:flow(d,aa,bb)
    flow(d,q,err,'L','R',label='Không',lp=(540,610));flow(d,err,a,'L','L',[(65,690),(65,280)]);flow(d,q,e,label='Có',lp=(s+35,625));flow(d,e,f);flow(d,f,g);flow(d,g,qq)
    flow(d,qq,retry,'L','R',label='Không',lp=(540,1170));flow(d,retry,a,'L','L',[(80,1250),(80,280)]);flow(d,qq,ok,label='Có',lp=(s+35,1180));flow(d,ok,send);flow(d,send,sent);flow(d,sent,check);flow(d,check,paid)
    flow(d,paid,wait,'R','L',label='Chưa',lp=(530,1870));flow(d,wait,check,'R','R',[(1210,1950),(1210,1670)]);flow(d,paid,done,'B','L',[(b,2090)],label='Có',lp=(b+35,1960));flow(d,done,end);save(d)

def erd_entity(d,table,x,y,attrs,physical=False):
    assert table in SCHEMA
    e=d.box(x,y,250,54,table.upper(),fs=19,bold=False)
    y0=y+100;step=84 if physical else 68;hh=66 if physical else 48
    for i,col in enumerate(attrs):
        assert col in SCHEMA[table]['columns'],(table,col)
        info=SCHEMA[table]['columns'][col];ispk=col in SCHEMA[table]['pk'];isfk=any(f['child']==table and col in f['columns'] for f in FKS)
        typ=info['type'];typ='ENUM' if typ.startswith('enum(') else typ
        label=col+(' (FK)' if isfk and not ispk else '')
        if physical:label+='\n'+typ
        a=d.box(x+30,y0+i*step,220,hh,label,shape='ellipse',fs=17 if physical else 18,underline=ispk)
        d.connect(e,a,'L','L',[(x,y0+i*step+hh/2)])
        d.fields.append({'table':table,'field':col,'type':info['type'],'primary':ispk,'foreign':isfk})
    return e

def relation(d,parent,child,nodes,label,field,pos=None,viaA=None,viaB=None,sides=('R','L')):
    fk=next((f for f in FKS if f['parent']==parent and f['child']==child and f['columns']==field),None)
    assert fk,(parent,child,field)
    aa,bb=nodes[parent],nodes[child]
    start=d.anchor(aa,sides[0]);end=d.anchor(bb,sides[1]);cx,cy=pos or ((start[0]+end[0])/2,(start[1]+end[1])/2)
    diamond=d.box(cx-56,cy-36,112,72,label,shape='diamond',fs=17)
    # The relationship endpoints follow their relative geometry, not arrows.
    def nearest_side(point):
        dx,dy=point[0]-cx,point[1]-cy
        return ('L' if dx<0 else 'R') if abs(dx)>abs(dy) else ('T' if dy<0 else 'B')
    side1=nearest_side(viaA[-1] if viaA else start)
    side2=nearest_side(viaB[0] if viaB else end)
    d.connect(aa,diamond,sides[0],side1,viaA)
    d.connect(diamond,bb,side2,sides[1],viaB)
    source_count='0..1' if any(SCHEMA[child]['columns'][c]['nullable'] for c in field) else '1'
    # Cardinalities sit on their own relationship arms, avoiding collisions
    # when multiple foreign keys share the same entity border.
    def card(pt,side,value):
        x,y=pt;dx={'L':-62,'R':10,'T':15,'B':15}[side];dy=-32 if side in ['L','R'] else -30 if side=='T' else 4
        d.text(x+dx,y+dy,52,28,value,fs=16)
    ax,ay=d.anchor(diamond,side1);bx,by=d.anchor(diamond,side2)
    card((ax-12 if side1=='L' else ax,ay),side1,source_count)
    card((bx-12 if side2=='L' else bx,by),side2,'0..*')
    d.relations.append({'parent':parent,'child':child,'foreign_key':field,'references':fk['references'],'parent_cardinality':source_count,'child_cardinality':'0..*','label':label})

def erds():
    # Columns intentionally leave corridors for orthogonal relationship paths.
    d=Diagram(15,1320,1450);nodes={}
    defs=[('khoi_toa_nha',80,130,['khoi']),('tang_toa_nha',510,130,['khoi','tang']),('can_ho',940,130,['ma_can_ho','khoi','tang','so_can_ho','dien_tich_m2']),('cu_dan',80,780,['ma_cu_dan','ho_va_ten','so_dien_thoai']),('lich_su_cu_tru',510,780,['ma_lich_su_cu_tru','ma_cu_dan','ma_can_ho','tu_ngay','den_ngay','quan_he']),('phuong_tien',940,780,['ma_phuong_tien','ma_lich_su_cu_tru','ma_can_ho','loai_xe','bien_so'])]
    for t,x,y,a in defs:nodes[t]=erd_entity(d,t,x,y,a)
    relation(d,'khoi_toa_nha','tang_toa_nha',nodes,'có',['khoi'])
    relation(d,'tang_toa_nha','can_ho',nodes,'bố trí',['khoi','tang'])
    relation(d,'cu_dan','lich_su_cu_tru',nodes,'có đợt ở',['ma_cu_dan'])
    relation(d,'lich_su_cu_tru','phuong_tien',nodes,'gắn đợt',['ma_lich_su_cu_tru'])
    relation(d,'can_ho','lich_su_cu_tru',nodes,'tiếp nhận',['ma_can_ho'],pos=(1120,650),viaA=[(1250,157),(1250,650)],viaB=[(1120,705),(635,705)],sides=('R','T'))
    relation(d,'can_ho','phuong_tien',nodes,'chịu phí',['ma_can_ho'],pos=(865,580),viaA=[(925,157),(925,500),(865,500)],viaB=[(865,807)],sides=('L','L'))
    save(d)

    d=Diagram(16,1480,1590);nodes={}
    defs=[('thiet_bi',80,130,['ma_thiet_bi','ma_tai_san','ten_thiet_bi','trang_thai']),('vi_tri_qr',590,130,['ma_vi_tri_qr','ma_thiet_bi','token_qr','dang_hoat_dong']),('nguoi_dung',80,790,['ma_nguoi_dung','ho_va_ten','vai_tro']),('phan_anh',590,790,['ma_phan_anh','ma_vi_tri_qr','ma_nguoi_gui','ma_ky_thuat_vien','ma_thiet_bi','trang_thai','luot_xu_ly','ten_thiet_bi_luc_gui']),('hinh_anh_phan_anh',1100,790,['ma_hinh_anh_phan_anh','ma_phan_anh','loai','luot_xu_ly','duong_dan_tep'])]
    for t,x,y,a in defs:nodes[t]=erd_entity(d,t,x,y,a)
    relation(d,'thiet_bi','vi_tri_qr',nodes,'liên kết',['ma_thiet_bi'])
    relation(d,'vi_tri_qr','phan_anh',nodes,'tiếp nhận',['ma_vi_tri_qr'],pos=(930,490),viaA=[(930,157)],viaB=[(930,690),(715,690)],sides=('R','T'))
    relation(d,'thiet_bi','phan_anh',nodes,'lúc gửi',['ma_thiet_bi'],pos=(450,555),viaA=[(365,157),(365,480),(450,480)],viaB=[(450,715),(690,715)],sides=('R','T'))
    relation(d,'nguoi_dung','phan_anh',nodes,'người gửi',['ma_nguoi_gui'],pos=(460,710),viaA=[(365,817),(365,710)],viaB=[(555,710),(555,817)],sides=('R','L'))
    relation(d,'nguoi_dung','phan_anh',nodes,'được giao',['ma_ky_thuat_vien'],pos=(460,960),viaA=[(365,817),(365,960)],viaB=[(555,960),(555,817)],sides=('R','L'))
    relation(d,'phan_anh','hinh_anh_phan_anh',nodes,'có ảnh',['ma_phan_anh'])
    save(d)

    d=Diagram(17,1420,2020);nodes={}
    defs=[('can_ho',100,130,['ma_can_ho','so_can_ho','dien_tich_m2']),('loai_phi',540,130,['loai_phi','ten_phi']),('cau_hinh_phi',980,130,['ma_cau_hinh_phi','loai_phi','don_gia','tu_ngay']),('chi_so_dich_vu',100,750,['ma_chi_so_dich_vu','ma_can_ho','ky_thanh_toan','chi_so_cu','chi_so_moi']),('hoa_don',540,750,['ma_hoa_don','ma_can_ho','ky_thanh_toan','tong_tien','trang_thai']),('chi_tiet_hoa_don',980,750,['ma_chi_tiet_hoa_don','ma_hoa_don','ma_cau_hinh_phi','ma_chi_so_dich_vu','so_luong','don_gia','thanh_tien']),('thong_bao',540,1390,['ma_thong_bao','ma_hoa_don','tieu_de','trang_thai']),('thong_bao_da_doc',980,1390,['ma_thong_bao','ma_nguoi_dung','nguoi_tiep_nhan','ngay_doc'])]
    for t,x,y,a in defs:nodes[t]=erd_entity(d,t,x,y,a)
    relation(d,'loai_phi','cau_hinh_phi',nodes,'có giá',['loai_phi'])
    relation(d,'can_ho','chi_so_dich_vu',nodes,'ghi chỉ số',['ma_can_ho'],pos=(60,535),viaA=[(60,157)],viaB=[(60,777)],sides=('L','L'))
    relation(d,'can_ho','hoa_don',nodes,'nhận',['ma_can_ho'],pos=(420,555),viaA=[(420,157)],viaB=[(420,690),(665,690)],sides=('R','T'))
    relation(d,'hoa_don','chi_tiet_hoa_don',nodes,'gồm',['ma_hoa_don'])
    relation(d,'cau_hinh_phi','chi_tiet_hoa_don',nodes,'áp giá',['ma_cau_hinh_phi'],pos=(1320,540),viaA=[(1320,157)],viaB=[(1320,777)],sides=('R','R'))
    relation(d,'chi_so_dich_vu','chi_tiet_hoa_don',nodes,'nguồn tính',['ma_chi_so_dich_vu'],pos=(915,1320),viaA=[(410,777),(410,1320)],viaB=[(1245,1320),(1245,777)],sides=('R','R'))
    relation(d,'hoa_don','thong_bao',nodes,'nhắc phí',['ma_hoa_don'],pos=(475,1240),viaA=[(475,777)],viaB=[(475,1417)],sides=('L','L'))
    relation(d,'thong_bao','thong_bao_da_doc',nodes,'đã đọc',['ma_thong_bao'])
    save(d)

    d=Diagram(18,1340,1040);nodes={}
    defs=[('vi_tri_qr',80,130,['ma_vi_tri_qr','token_qr','ma_thiet_bi','phien_ban']),('phan_anh',525,130,['ma_phan_anh','ma_vi_tri_qr','ma_ky_thuat_vien','trang_thai','luot_xu_ly']),('hinh_anh_phan_anh',970,130,['ma_hinh_anh_phan_anh','ma_phan_anh','duong_dan_tep','luot_xu_ly'])]
    for t,x,y,a in defs:nodes[t]=erd_entity(d,t,x,y,a,True)
    relation(d,'vi_tri_qr','phan_anh',nodes,'tiếp nhận',['ma_vi_tri_qr'])
    relation(d,'phan_anh','hinh_anh_phan_anh',nodes,'có ảnh',['ma_phan_anh']);save(d)

    d=Diagram(19,1340,1660);nodes={}
    defs=[('can_ho',80,130,['ma_can_ho','so_can_ho','dien_tich_m2']),('hoa_don',525,130,['ma_hoa_don','ma_can_ho','ky_thanh_toan','tong_tien','trang_thai']),('cau_hinh_phi',970,130,['ma_cau_hinh_phi','loai_phi','don_gia','tu_ngay']),('chi_tiet_hoa_don',525,940,['ma_chi_tiet_hoa_don','ma_hoa_don','ma_cau_hinh_phi','so_luong','don_gia','thanh_tien'])]
    for t,x,y,a in defs:nodes[t]=erd_entity(d,t,x,y,a,True)
    relation(d,'can_ho','hoa_don',nodes,'nhận',['ma_can_ho'])
    relation(d,'hoa_don','chi_tiet_hoa_don',nodes,'gồm',['ma_hoa_don'],pos=(455,760),viaA=[(500,157),(500,650),(455,650)],viaB=[(455,967)],sides=('L','L'))
    relation(d,'cau_hinh_phi','chi_tiet_hoa_don',nodes,'áp giá',['ma_cau_hinh_phi'],pos=(865,760),viaA=[(865,157)],viaB=[(865,967)],sides=('L','R'));save(d)

def classes():
    d=Diagram(14,1290,2340);nodes={}
    specs=[
      ('NguoiDung','nguoi_dung',90,120,['ma_nguoi_dung','ho_va_ten','vai_tro','phien_ban_token'],['+ dangNhap()','+ doiMatKhau()']),
      ('CuDan','cu_dan',760,120,['ma_cu_dan','ho_va_ten','so_dien_thoai','ma_nguoi_dung'],['+ taoHoSo()','+ capNhatHoSo()']),
      ('CanHo','can_ho',90,550,['ma_can_ho','so_can_ho','dien_tich_m2'],['+ taoCanHo()','+ capNhatCanHo()']),
      ('DotCuTru','lich_su_cu_tru',760,550,['ma_lich_su_cu_tru','tu_ngay','den_ngay','quan_he'],['+ nhapCu()','+ chuyenCan()','+ chuyenDi()']),
      ('ThietBi','thiet_bi',90,980,['ma_thiet_bi','ma_tai_san','ten_thiet_bi','trang_thai'],['+ taoThietBi()','+ capNhatThietBi()']),
      ('ViTriQR','vi_tri_qr',760,980,['ma_vi_tri_qr','token_qr','dang_hoat_dong','phien_ban'],['+ create()','+ link()','+ rotate()']),
      ('HoaDon','hoa_don',90,1410,['ma_hoa_don','ky_thanh_toan','tong_tien','trang_thai'],['+ generate()','+ action()','+ detail()']),
      ('ChiTietHoaDon','chi_tiet_hoa_don',760,1410,['ma_chi_tiet_hoa_don','so_luong','don_gia','thanh_tien'],['+ luuSnapshot()','+ tinhThanhTien()']),
      ('PhanAnh','phan_anh',90,1840,['ma_phan_anh','trang_thai','luot_xu_ly','ma_thiet_bi'],['+ guiPhanAnh()','+ capNhatTrangThai()']),
      ('«module» IncidentsService',None,760,1840,[],['+ submit(body, files, user, ip)','+ assign(id, body, actor)','+ transition(id, body, files, actor)','+ lookup(body)'])]
    for title,table,x,y,attrs,ops in specs:
        body=[]
        for col in attrs:
            assert col in SCHEMA[table]['columns'];typ=SCHEMA[table]['columns'][col]['type'];typ='enum' if typ.startswith('enum(') else typ.replace(' unsigned','')
            body.append('+ '+col+': '+typ)
        if table is None:body=['Hàm/module JavaScript']
        ah=max(74,38*len(body)+16);oh=38*len(ops)+16;h=54+ah+oh
        g=d.box(x,y,365,h,'',shape='group')
        d.box(0,0,365,54,title,bold=True,fs=20,parent=g)
        d.box(0,54,365,ah,'\n'.join(body),fs=17,align='left',parent=g)
        d.box(0,54+ah,365,oh,'\n'.join(ops),fs=17,align='left',parent=g)
        nodes[title]=(g,h)
    def assoc(a,b,label,ma,mb,sa='R',sb='L',via=None,dashed=False,arrow='none'):
        aa=nodes[a][0];bb=nodes[b][0]
        ax,ay=d.anchor(aa,sa);bx,by=d.anchor(bb,sb)
        if sa in ['L','R']:ay=d.bounds[aa][1]+140
        if sb in ['L','R']:by=d.bounds[bb][1]+140
        lp=((ax+bx)/2,(ay+by)/2-24)
        if (a,b)==('CanHo','HoaDon'):
            via=[(40,ay),(40,by)];lp=(160,910)
        elif (a,b)==('ViTriQR','PhanAnh'):
            ay=d.bounds[aa][1]+75;via=[(610,ay),(610,by)];lp=(610,1350)
        elif a=='«module» IncidentsService':
            ay=d.bounds[aa][1]+180;by=d.bounds[bb][1]+240;via=[(650,ay),(650,by)];lp=(610,by-28)
        elif sa=='B' and sb=='T':lp=(ax+90,(ay+by)/2)
        d.line([(ax,ay)]+(via or [])+[(bx,by)],source=aa,target=bb,arrow=arrow,dashed=dashed)
        lw=max(90,ImageFont.truetype(FONT_PATH,18).getlength(label)+20)
        d.box(lp[0]-lw/2,lp[1]-17,lw,34,label,fs=18,fill='#ffffff',stroke='none')
        if ma:d.text(ax-22 if sa in ['T','B'] else ax+(5 if sa=='R' else -48),ay+(3 if sa=='B' else -30),45,28,ma,fs=18)
        if mb:d.text(bx-22 if sb in ['T','B'] else bx+(5 if sb=='R' else -48),by+(3 if sb=='B' else -30),45,28,mb,fs=18)
    assoc('NguoiDung','CuDan','liên kết','0..1','0..1')
    assoc('CuDan','DotCuTru','có đợt ở','1','0..*','B','T')
    assoc('CanHo','DotCuTru','tiếp nhận','1','0..*')
    assoc('CanHo','HoaDon','có hóa đơn','1','0..*','L','L',[(40,720),(40,1580)])
    assoc('ThietBi','ViTriQR','liên kết hiện tại','0..1','0..*')
    assoc('HoaDon','ChiTietHoaDon','gồm','1','0..*')
    assoc('ViTriQR','PhanAnh','tiếp nhận','1','0..*','L','R',[(610,1160),(610,2000)])
    assoc('«module» IncidentsService','PhanAnh','xử lý','','','L','R',dashed=True,arrow='open')
    save(d)

def statechart():
    d=Diagram(13,1130,1350)
    st=d.start(560,105);new=d.box(410,175,300,88,'MOI\nMới tiếp nhận',shape='round');assigned=d.box(70,420,300,88,'DA_PHAN_CONG',shape='round');rejected=d.box(415,420,300,88,'TU_CHOI',shape='round');dup=d.box(760,420,300,88,'TRUNG\nTham chiếu bản gốc',shape='round');doing=d.box(70,650,300,88,'DANG_XU_LY',shape='round');ready=d.box(70,880,300,88,'DA_XU_LY\nChờ nghiệm thu',shape='round');closed=d.box(70,1110,300,88,'DA_DONG',shape='round');end=d.end(220,1250)
    flow(d,st,new);flow(d,new,assigned,'L','T',[(220,219)],label='BQL phân công',lp=(235,330));flow(d,new,rejected,label='BQL + lý do',lp=(660,335));flow(d,new,dup,'R','T',[(910,219)],label='BQL gộp đủ điều kiện',lp=(885,330));flow(d,assigned,doing,label='KTV bắt đầu',lp=(320,575));flow(d,doing,ready,label='Kết quả + ảnh mới đúng lượt',lp=(380,805));flow(d,ready,closed,label='BQL nghiệm thu đạt',lp=(360,1035));flow(d,ready,doing,'R','R',[(580,924),(580,694)],label='Trả lại + tăng lượt',lp=(710,805));flow(d,closed,end);save(d)

def architecture():
    d=Diagram(20,1190,1150)
    d.box(55,80,1080,220,'',fill='none');d.text(60,85,1070,48,'TẦNG TRÌNH BÀY — TRÌNH DUYỆT',bold=True)
    fe=d.box(280,155,630,100,'React / Router / Dialog\nCamera, chọn ảnh và sinh QR',shape='round',fill='#f4f4f4')
    d.box(55,380,1080,260,'',fill='none');d.text(60,385,1070,48,'TẦNG ỨNG DỤNG — NODE.JS / EXPRESS',bold=True)
    route=d.box(110,475,420,105,'Router / middleware\nPhiên, quyền, giới hạn gửi',shape='round');service=d.box(660,475,420,105,'Service nghiệp vụ\nValidation, snapshot, transaction',shape='round')
    d.box(55,760,1080,235,'',fill='none');d.text(60,765,1070,48,'TẦNG DỮ LIỆU',bold=True)
    db=d.box(145,845,380,110,'MySQL / InnoDB\n31 bảng và 8 view lịch sử',shape='cylinder');store=d.box(690,845,350,110,'Kho tệp ảnh\nMetadata trong MySQL',shape='cylinder')
    flow(d,fe,route,'B','T',[(595,335),(320,335)],label='HTTPS /api — JSON / multipart',lp=(620,335));flow(d,route,service,'R','L',label='gọi service',lp=(595,497));flow(d,service,db,'B','T',[(870,695),(335,695)],label='mysql2 / SQL có tham số',lp=(600,695));flow(d,service,store,'B','T',label='kiểm tra / lưu ảnh',lp=(1000,705));save(d)

def dataflow():
    d=Diagram(21,1270,1310)
    b=d.box(65,100,330,100,'BQL cấu hình\nvị trí / thiết bị',shape='round');qr=d.box(465,100,330,100,'QR chứa URL\n/r/token',shape='round');user=d.box(865,100,330,100,'Người gửi\nnội dung + ảnh',shape='round')
    api=d.box(465,380,330,115,'API: QR / quyền / ảnh\ngiới hạn / chống gửi lặp',shape='round');db=d.box(465,680,330,115,'Phản ánh + snapshot\nảnh + nhật ký',shape='cylinder');assign=d.box(65,940,330,110,'BQL tiếp nhận\nvà phân công',shape='round');kt=d.box(465,940,330,110,'KTV xử lý\nvà gửi ảnh mới',shape='round');review=d.box(865,940,330,110,'BQL nghiệm thu\nhoặc trả lại',shape='round');lookup=d.box(865,680,330,115,'Người gửi theo dõi\ntrạng thái được phép',shape='round')
    for aa,bb,sa,sb in [(b,qr,'R','L'),(qr,user,'R','L'),(user,api,'B','R'),(api,db,'B','T'),(db,assign,'L','T'),(assign,kt,'R','L'),(kt,review,'R','L'),(review,db,'T','R'),(db,lookup,'R','L')]:flow(d,aa,bb,sa,sb)
    save(d)

def sequences():
    datasets=[
     (9,['BQL','React\n(Client)','qr.routes.js\nAPI / quyền','qr.service.js\nNghiệp vụ','MySQL'],[
       (0,1,'Nhập vị trí / thiết bị; bấm Lưu',0),(1,2,'POST /api/vi_tri_qr',0),(2,3,'create(body, user)',0),(3,4,'BEGIN; kiểm tra thiết bị',0),(3,4,'INSERT vị trí / token; ghi lịch sử; COMMIT',0),(4,3,'Bản ghi vị trí',1),(3,2,'Dữ liệu vị trí mới',1),(2,1,'HTTP 201 + dữ liệu',1),(1,1,'Ghép origin + token; QRCode.toDataURL()',0),(1,0,'Hiện QR / tải PNG / in',1)],'Tạo QR ở React; lỗi giao dịch không để lại vị trí ghi dở dang.'),
     (10,['Người gửi','React\n(Client)','incidents.routes.js\nAPI / upload','incidents.service.js\nNghiệp vụ','Repository /\nMySQL','Kho tệp ảnh'],[
       (0,1,'Mở /r/token; nhập nội dung và ảnh',0),(1,2,'POST /api/cong_khai/phan_anh (multipart)',0),(2,3,'submit(body, files, user, ip)',0),(3,5,'saveImages(files)',0),(5,3,'Tên ảnh đã chuẩn bị',1),(3,4,'BEGIN; khóa yêu cầu; kiểm QR / nội dung',0),(3,4,'Lưu MOI + snapshot + metadata ảnh + nhật ký',0),(3,4,'Lưu biên nhận; COMMIT',0),(4,3,'Kết quả giao dịch',1),(3,2,'Mã tra cứu + cờ replay',1),(2,1,'201 mới / 200 phát lại',1),(1,0,'Hiện biên nhận và mã tra cứu',1)],'Replay hoặc lỗi: ảnh mới không được giữ phải được dọn; lỗi trả về phải giữ nháp phù hợp.'),
     (11,['BQL / KTV','React\n(Client)','incidents.routes.js\nAPI / quyền','incidents.service.js\nNghiệp vụ','Repository','MySQL'],[
       (0,1,'BQL chọn KTV; bấm Phân công',0),(1,2,'PATCH /phan_anh/:id/phan_cong',0),(2,3,'assign(id, body, actor)',0),(3,4,'lockedReport(...); kiểm quyền / phiên bản',0),(4,5,'SELECT ... FOR UPDATE',0),(5,4,'Phản ánh hiện tại',1),(4,3,'Bản ghi được phép sửa',1),(3,5,'Lưu DA_PHAN_CONG + lịch sử; COMMIT',0),(3,2,'Hoàn tất; router đọc chi tiết',1),(2,1,'Dữ liệu bản ghi mới',1),(0,1,'KTV bắt đầu / nộp ảnh kết quả',0),(1,2,'PATCH /phan_anh/:id/trang_thai',0),(2,3,'transition(id, body, files, actor)',0),(3,5,'Kiểm KTV / lượt / ảnh; cập nhật + nhật ký',0),(0,1,'BQL nghiệm thu hoặc trả lại',0),(1,2,'PATCH trạng thái + phiên bản',0),(2,3,'transition(..., actor BQL)',0),(3,5,'Đóng hoặc tăng lượt; ghi lịch sử; COMMIT',0),(2,1,'Chi tiết cập nhật',1)],'Các nhóm cập nhật là những transaction riêng. KTV không tự nghiệm thu; trả lại yêu cầu ảnh mới ở lượt sau.'),
     (12,['Cư dân /\ntài khoản căn','React\n(Client)','billing.routes.js\nAPI / quyền','billing.service.js\nNghiệp vụ','MySQL'],[
       (0,1,'Mở chi tiết hóa đơn',0),(1,2,'GET /api/cua_toi/hoa_don/:id',0),(2,3,'detail(id, user)',0),(3,4,'Đọc hóa đơn và ngữ cảnh quyền xem',0),(4,3,'Hóa đơn thuộc phạm vi được phép',1),(3,2,'Chi tiết và dữ liệu VietQR',1),(2,1,'HTTP 200 + hóa đơn',1),(1,1,'Dựng QR và thông tin nhận tiền',0),(1,0,'Hiện hóa đơn / VietQR',1)],'Luồng xem VietQR không gọi ngân hàng và không tự ghi đã thanh toán; BQL đối soát ở thao tác riêng.')]
    for index,participants,msgs,note in datasets:
        count=len(participants);gap=305;width=180+(count-1)*gap+180;top=250;row=132;height=top+len(msgs)*row+245;d=Diagram(index,width,height)
        xs=[180+i*gap for i in range(count)];end=height-330
        for i,(x,title) in enumerate(zip(xs,participants)):
            if i==0:d.actor(x,65,title)
            else:d.box(x-112,78,224,100,title,fill='#e9e9f0',shape='cylinder' if title=='MySQL' else 'rect',fs=20)
            d.line([(x,190),(x,end)],dashed=True)
            # Repeat participant labels at the foot as in the supplied sample.
            if i==0:d.actor(x,end+12,title)
            else:d.box(x-112,end+20,224,85,title,fill='#e9e9f0',shape='cylinder' if title=='MySQL' else 'rect',fs=19)
        # A receiver is active between a depicted call and its matching reply.
        # Calls whose replies are intentionally elided get a short activation.
        pending={};spans=[]
        for k,(a,b,label,returned) in enumerate(msgs):
            if a==b:continue
            if not returned and b>0:pending.setdefault((a,b),[]).append(k)
            elif returned and (b,a) in pending and pending[(b,a)]:
                start=pending[(b,a)].pop();spans.append((a,start,k))
        for (a,b),starts in pending.items():
            for k in starts:spans.append((b,k,k+.45))
        for participant,begin,finish in spans:
            d.box(xs[participant]-7,top+begin*row-5,14,max(44,(finish-begin)*row+10),'',fill='#ffffff')
        for k,(a,b,label,returned) in enumerate(msgs):
            y=top+k*row;xa,xb=xs[a],xs[b]
            if a==b:
                d.line([(xa+7,y),(xa+80,y),(xa+80,y+38),(xa+7,y+38)],arrow='open' if returned else 'block',dashed=bool(returned))
                d.text(xa+22,y-76,245,72,f'{k+1}. '+label,fs=19,align='left')
            else:
                start=xa+(7 if b>a and a>0 else -7 if b<a and a>0 else 0);finish=xb+(-7 if b>a else 7)
                d.line([(start,y),(finish,y)],arrow='open' if returned else 'block',dashed=bool(returned))
                d.text(min(xa,xb)+14,y-94,abs(xb-xa)-28,88,f'{k+1}. '+label,fs=19,align='left')
        d.note=note;save(d)

def main():
    decompose()
    usecase(2,[('auth','Đăng nhập / quản lý phiên'),('records','Quản lý hồ sơ và cư trú'),('qr','Tạo / quản lý QR vị trí'),('send','Gửi / tra cứu phản ánh'),('assign','Tiếp nhận / phân công / nghiệm thu'),('work','Xử lý việc được giao'),('bill','Lập / duyệt / xác nhận thu hóa đơn'),('read','Xem hóa đơn và thông báo'),('manage','Điều hành bảo trì, tiện ích và quỹ'),('maintain','Thực hiện bảo trì được giao'),('book','Đặt lịch tiện ích')],[('Ban quản lý',125,380,['auth','records','qr','assign','bill','manage']),('Kỹ thuật viên',125,1110,['auth','work','maintain']),('Cư dân',1120,850,['auth','send','read','book']),('Người gửi\ncông khai',1120,350,['send'])])
    usecase(3,[('a','Khối / tầng / căn hộ'),('b','Cư dân / cư trú / phương tiện'),('c','Tài khoản căn / bàn giao chủ hộ'),('d','Vị trí / thiết bị / in QR'),('e','Tiếp nhận / phân công phản ánh'),('f','Nghiệm thu / trả lại kết quả'),('g','Đơn giá / chỉ số / hóa đơn'),('h','Thu phí / công nợ / quỹ'),('i','Thông báo / tiện ích / báo cáo')],[('Ban quản lý',125,540,list('abcdefghi'))])
    usecase(4,[('send','Gửi phản ánh tại vị trí'),('lookup','Tra cứu bằng mã riêng'),('my','Xem phản ánh của mình'),('bill','Xem hóa đơn / VietQR'),('notice','Đọc thông báo / đặt tiện ích'),('work','Xử lý việc được giao'),('maintain','Thực hiện bảo trì được giao')],[('Cư dân',125,240,['send','lookup','my','bill','notice']),('Người gửi\ncông khai',125,650,['send','lookup']),('Kỹ thuật viên',1120,650,['work','maintain'])])
    activities();sequences();statechart();classes();erds();architecture();dataflow()
    assert sorted(d.index for d in DIAGRAMS)==list(range(1,22))
    master=E.Element('mxfile',host='app.diagrams.net',version='24.7.17',type='device',compressed='false')
    summary=[]
    for d in sorted(DIAGRAMS,key=lambda d:d.index):
        entry=copy.deepcopy(MANIFEST[d.index-1]);page=E.SubElement(master,'diagram',id=f'hinh-2-{d.index}',name=entry['caption']);page.append(copy.deepcopy(d.model))
        cells=d.model.findall('.//mxCell');entry.update(width=d.width,height=d.height,vertices=sum(c.get('vertex')=='1' for c in cells),edges=sum(c.get('edge')=='1' for c in cells),note=d.note,fields=d.fields,relations=d.relations)
        summary.append(entry)
    E.indent(master,space='  ')
    (OUT/'Tat-ca-21-so-do-theo-mau.drawio').write_bytes(E.tostring(master,encoding='utf-8',xml_declaration=True))
    (OUT/'nguon/mo-hinh-va-doi-chieu.json').write_text(json.dumps({'source_commit':'cceb904','schema_sha256':hashlib.sha256(SQL.encode()).hexdigest(),'reference_style':'6 example images supplied by user; housing domain retained','diagrams':summary},ensure_ascii=False,indent=2))
    (OUT/'danh-muc.json').write_text(json.dumps([{k:v for k,v in e.items() if k not in ['fields','relations']} for e in summary],ensure_ascii=False,indent=2))
    print('Generated 21 native draw.io diagrams, 21 raw XML and 21 standalone SVG files.')

if __name__=='__main__':main()
