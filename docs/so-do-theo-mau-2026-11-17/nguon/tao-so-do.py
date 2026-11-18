from pathlib import Path
import xml.etree.ElementTree as E
import html, json, re, math, copy, hashlib
from PIL import ImageFont

import argparse
parser=argparse.ArgumentParser(description='Tái sinh 17 sơ đồ; một ERD logic 18 bảng trọng tâm, khóa ngoại gạch chân nét đứt.')
parser.add_argument('--repo',type=Path,default=Path(__file__).resolve().parents[3])
parser.add_argument('--out',type=Path,default=Path(__file__).resolve().parent.parent)
args=parser.parse_args()
REPO=args.repo.resolve()
OUT=args.out.resolve()
for name in ['drawio','xml','png','svg','nguon']: (OUT/name).mkdir(parents=True,exist_ok=True)
OLD=REPO/'docs/bao-cao/quyen-bao-cao-2026'
MANIFEST=json.loads((REPO/'docs/tai-lieu-ban-giao-2026-11-17/bao-cao-drawio/danh-muc-hinh.json').read_text())
MANIFEST[14].update(figure='2.15',caption='Hình 2.15. ERD 18 bảng nghiệp vụ — bố cục dây nối sắp xếp lại',filename='02-15-erd-hop-nhat')
MANIFEST[19].update(figure='2.16',caption='Hình 2.16. Kiến trúc ba tầng của hệ thống',filename='02-16-kien-truc')
MANIFEST[20].update(figure='2.17',caption='Hình 2.17. Luồng dữ liệu phản ánh từ QR đến nghiệm thu',filename='02-17-luong-du-lieu')
SQL=(REPO/'database/thesis-mysql/001_thesis_schema.sql').read_text()
def parse_full_schema(sql):
    """Read every physical table and both inline / ALTER TABLE FK constraints."""
    tables = {}
    for m in re.finditer(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?([a-z_][a-z0-9_]*)`?\s*\((.*?)\n\) ENGINE', sql, re.I | re.S):
        name, body = m.groups()
        columns, primary, unique = {}, [], []
        for line in body.splitlines():
            c = re.match(r'\s*(?:`([^`]+)`|([a-z_][a-z0-9_]*))\s+(.+)', line, re.I)
            if not c:
                continue
            col, rest = c[1] or c[2], c[3].rstrip(',')
            if col.upper() in {'PRIMARY', 'UNIQUE', 'KEY', 'CONSTRAINT', 'CHECK', 'FOREIGN', 'INDEX'}:
                continue
            typ = re.split(r'\s+(?:NOT NULL|NULL|DEFAULT|GENERATED|AUTO_INCREMENT|CHARACTER SET|COLLATE|PRIMARY KEY)\b', rest, 1, flags=re.I)[0]
            columns[col] = {'type': typ, 'nullable': not bool(re.search(r'\bNOT NULL\b|PRIMARY KEY', rest, re.I))}
            if re.search(r'\bPRIMARY KEY\b', rest, re.I):
                primary.append(col)
            if re.search(r'\bUNIQUE\b', rest, re.I):
                unique.append([col])
        pm = re.search(r'^\s*PRIMARY KEY\s*\(([^)]+)\)', body, re.M | re.I)
        if pm:
            primary = [x.strip(' `') for x in pm[1].split(',')]
        for um in re.finditer(r'^\s*UNIQUE KEY\s+`?\w+`?\s*\(([^)]+)\)', body, re.M | re.I):
            if '(' not in um[1]:
                unique.append([x.strip(' `') for x in um[1].split(',')])
        assert primary, (name, 'missing primary key')
        assert set(primary) <= columns.keys()
        tables[name] = {'columns': columns, 'pk': primary, 'unique': unique}
    fks = []
    for statement in sql.split(';'):
        child = re.search(r'(?:ALTER TABLE|CREATE TABLE)\s+(?:IF NOT EXISTS\s+)?`?([a-z_][a-z0-9_]*)`?', statement, re.I)
        if not child:
            continue
        for m in re.finditer(r'CONSTRAINT\s+`?([a-z_][a-z0-9_]*)`?\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+`?([a-z_][a-z0-9_]*)`?\s*\(([^)]+)\)', statement, re.I):
            name, cols, parent, refs = m.groups()
            cols, refs = ([x.strip(' `') for x in values.split(',')] for values in (cols, refs))
            assert set(cols) <= tables[child[1]]['columns'].keys()
            assert refs == tables[parent]['pk'], (name, 'reference must match declared PK')
            fks.append({'id': f'R{len(fks)+1:02d}', 'name': name, 'child': child[1], 'columns': cols, 'parent': parent, 'references': refs})
    assert len({f['name'] for f in fks}) == len(fks)
    for fk in fks:
        child = tables[fk['child']]
        fk['parent_cardinality'] = '0..1' if any(child['columns'][c]['nullable'] for c in fk['columns']) else '1'
        fk['child_cardinality'] = '0..1' if any(set(u) <= set(fk['columns']) for u in [child['pk']] + child['unique']) else '0..N'
    assert len(tables) == 31 and sum(len(t['columns']) for t in tables.values()) == 362
    assert len(fks) == 81, 'Do not omit the 14 inline audit-history foreign keys'
    return tables, fks


SCHEMA,FKS=parse_full_schema(SQL)

def N(x):return f'{float(x):.2f}'.rstrip('0').rstrip('.')
def safe(s):return html.escape(str(s),quote=True)
FONT_PATH='/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
ACTOR_HEIGHT = 180
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

def svg_relationship_with_jumps(points,previous):
    """Standalone SVG equivalent of draw.io's native jumpStyle=arc."""
    chunks=[f'M {N(points[0][0])} {N(points[0][1])}'];masks=[];jumps=0;r=4.3
    for a,b in zip(points,points[1:]):
        horizontal=abs(a[1]-b[1])<.05;cross=[]
        for old in previous:
            for c,d in zip(old,old[1:]):
                other_horizontal=abs(c[1]-d[1])<.05
                if horizontal==other_horizontal:continue
                x,y=(c[0],a[1]) if horizontal else (a[0],c[1])
                if min(a[0],b[0])+r+2<x<max(a[0],b[0])-r-2 and min(c[1],d[1])+r+2<y<max(c[1],d[1])-r-2 if horizontal else min(c[0],d[0])+r+2<x<max(c[0],d[0])-r-2 and min(a[1],b[1])+r+2<y<max(a[1],b[1])-r-2:
                    cross.append((x,y))
        cross=sorted(set(cross),key=lambda p:p[0] if horizontal else p[1],reverse=(b[0]<a[0] if horizontal else b[1]<a[1]))
        last=None
        for x,y in cross:
            if last is not None and math.dist(last,(x,y))<r*2+2:continue
            masks.append(f'<circle cx="{N(x)}" cy="{N(y)}" r="{N(r+1.1)}" fill="white" stroke="none"/>')
            if horizontal:
                sign=1 if b[0]>a[0] else -1
                chunks.extend([f'L {N(x-sign*r)} {N(y)}',f'Q {N(x)} {N(y-r*2)} {N(x+sign*r)} {N(y)}'])
            else:
                sign=1 if b[1]>a[1] else -1
                chunks.extend([f'L {N(x)} {N(y-sign*r)}',f'Q {N(x+r*2)} {N(y)} {N(x)} {N(y+sign*r)}'])
            last=(x,y);jumps+=1
        chunks.append(f'L {N(b[0])} {N(b[1])}')
    return ''.join(masks)+f'<path d="{" ".join(chunks)}" fill="none" stroke="#222222" stroke-width="1.3" data-line-jumps="{jumps}"/>',jumps


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
        elif shape=='cylinder':style+='shape=cylinder;size=0.15;boundedLbl=1;'
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
        P=(lambda value:f'{value:.6f}') if self.index==15 else N
        if source:
            x,y,w,h=self.bounds[source];st+=f'exitX={P((points[0][0]-x)/w)};exitY={P((points[0][1]-y)/h)};exitPerimeter=0;'
        if target:
            x,y,w,h=self.bounds[target];st+=f'entryX={P((points[-1][0]-x)/w)};entryY={P((points[-1][1]-y)/h)};entryPerimeter=0;'
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
        group=self.box(cx-75,y,150,ACTOR_HEIGHT,'',shape='group')
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
        previous_relationships=[]
        for o in self.svgitems:
            if o.get('hidden'):continue
            if o['kind']=='line':
                if o.get('relationship'):
                    fragment,_=svg_relationship_with_jumps(o['points'],previous_relationships);a.append(fragment);previous_relationships.append(o['points']);continue
                pts=o['points'];dash=' stroke-dasharray="7 5"' if o['dashed'] else ''
                if o.get('underline_dash'):dash=' stroke-dasharray="3 3"'
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
                style=f'font-family="{o["family"]}" font-size="{fs}" fill="{o.get('fontcolor','#111111')}" text-anchor="{anchor}"'
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
    page=E.SubElement(root,'diagram',id='hinh-'+MANIFEST[d.index-1]['figure'].replace('.','-'),name=MANIFEST[d.index-1]['caption']);page.append(copy.deepcopy(d.model));E.indent(root,space='  ')
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

def orthogonal_entity_attachment(point,header,body):
    """Connect a routed obstacle port to the actual entity header."""
    x,y,w,h=body
    px,py=point
    if abs(py-y)<.2 and x-.2<=px<=x+w+.2:
        return [(px,y),point]
    if abs(px-(x+w))<.2:
        return [(x+w,y+27),(x+w,py),point]
    if abs(px-x)<.2:
        return [(x,y+27),(x-16,y+27),(x-16,py),point]
    return [(x+w,y+27),(x+w+16,y+27),(x+w+16,y+h+16),(px,y+h+16),point]


def simplify_orthogonal(points):
    result=[]
    for x,y in points:
        p=(round(x,2),round(y,2))
        if result and math.dist(p,result[-1])<.03:continue
        if len(result)>1 and ((abs(result[-2][0]-result[-1][0])<.03 and abs(p[0]-result[-1][0])<.03) or (abs(result[-2][1]-result[-1][1])<.03 and abs(p[1]-result[-1][1])<.03)):
            result[-1]=p
        else:result.append(p)
    return result


def er_marker(d,entity,endpoint,towards,cardinality,tag,fk_name,role):
    """Editable one/many bars and optional circles, matching the supplied ERD."""
    ex,ey=endpoint;dx,dy=towards[0]-ex,towards[1]-ey;length=math.hypot(dx,dy)
    if length<.1:return
    ux,uy=dx/length,dy/length;nx,ny=-uy,ux
    def at(t,n=0):return(ex+t*ux+n*nx,ey+t*uy+n*ny)
    if cardinality=='0..N':
        for spread in [-5,0,5]:
            line=d.line([at(12),at(0,spread)],parent=entity)
            tag(line,erdKind='cardinality-marker',fkName=fk_name,armRole=role)
    else:
        line=d.line([at(6,-5),at(6,5)],parent=entity)
        tag(line,erdKind='cardinality-marker',fkName=fk_name,armRole=role)
    if cardinality.startswith('0..'):
        cx,cy=at(21 if cardinality=='0..N' else 17)
        x,y,_,_=d.bounds[entity]
        circle=d.box(cx-x-3,cy-y-3,6,6,'',shape='ellipse',parent=entity)
        tag(circle,erdKind='cardinality-marker',fkName=fk_name,armRole=role)


def segment_hits_box(a,b,r):
    x,y,w,h=r
    eps=.2;x+=eps;y+=eps;w-=eps*2;h-=eps*2
    dx,dy=b[0]-a[0],b[1]-a[1];lo,hi=0,1
    for pi,qi in [(-dx,a[0]-x),(dx,x+w-a[0]),(-dy,a[1]-y),(dy,y+h-a[1])]:
        if pi==0:
            if qi<0:return False
        elif pi<0:lo=max(lo,qi/pi)
        else:hi=min(hi,qi/pi)
        if lo>hi:return False
    return True


def make_straight_layout(selection,sizes,foreign_keys):
    """Separate the attribute columns from wide relation corridors."""
    width,height=4800,6144
    rows=selection['layout_rows'];objects=[];lookup={}
    for row_index,row in enumerate(rows):
        for col,name in enumerate(row):
            x=288+col*768;w,h=sizes[name]
            hy=[1386,2088,3816][row_index]
            above=row_index==0
            y=hy-(len(selection['included_tables'][name]['columns'])*60+28) if above else hy
            obj={'_gvid':len(objects),'name':name,'pos':f'{x+w/2},{y+h/2}','screen_box':[x,y,w,h],
                 'header_box':[x,hy,w,54],'attributes_side':'above' if above else 'below','width':w/72,'height':h/72}
            objects.append(obj);lookup[name]=obj
    occupied=[(o['screen_box'][0]-24,o['screen_box'][1]-24,o['screen_box'][0]+o['screen_box'][2]+24,o['screen_box'][1]+o['screen_box'][3]+24) for o in objects]
    def free(x,y):
        a=(x-112,y-80,x+112,y+80)
        return not any(a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1] for b in occupied)
    candidates=[(x,y) for x in range(192,width-160,72) for y in range(192,height-160,72) if free(x,y)]
    # Group repeated roles near the same destination, while reserving separate diamonds.
    ordered=sorted(foreign_keys,key=lambda f:(f['parent']!=f['child'],f['child'],f['parent'],f['name']))
    for f in ordered:
        pa=lookup[f['parent']]['header_box'];ch=lookup[f['child']]['header_box']
        a=(pa[0]+pa[2]/2,pa[1]+27);b=(ch[0]+ch[2]/2,ch[1]+27)
        if f['parent']==f['child']:ideal=(ch[0]+ch[2]+192,ch[1]+27)
        elif abs(a[1]-b[1])<100:ideal=((a[0]+b[0])/2,b[1]+72)
        else:ideal=(b[0],ch[1]+180 if lookup[f['child']]['attributes_side']=='above' else ch[1]-180)
        pool=[p for p in candidates if free(*p)];assert pool
        def score(p):
            return abs(p[0]-a[0])+abs(p[1]-a[1])+abs(p[0]-b[0])+abs(p[1]-b[1])+.8*(abs(p[0]-ideal[0])+abs(p[1]-ideal[1]))
        x,y=min(pool,key=score)
        o={'_gvid':len(objects),'name':f['id'],'pos':f'{x},{y}','screen_box':[x-72,y-39.6,144,79.2],'width':2,'height':1.1}
        objects.append(o);lookup[f['id']]=o;occupied.append((x-112,y-80,x+112,y+80))
    return {'screen_coordinates':True,'bb':f'0,0,{width},{height}','objects':objects,'edges':[],
            'routing':'distinct header sides and reserved orthogonal tracks, 12 px grid'}


def plan_relation_arms(layout,foreign_keys):
    objects={o['name']:o for o in layout['objects']};plans=[];groups={}
    for f in foreign_keys:
        r=objects[f['id']]['screen_box'];cx,cy=r[0]+72,r[1]+39.6
        ports={'T':((cx,cy-39.6),(cx,cy-72)),'B':((cx,cy+39.6),(cx,cy+72)),
               'L':((cx-72,cy),(cx-108,cy)),'R':((cx+72,cy),(cx+108,cy))}
        used=None
        for role,name in [('parent',f['parent']),('child',f['child'])]:
            o=objects[name];x,y,w,h=o['header_box'];head=(x+w/2,y+h/2)
            dia_side=min((s for s in ports if s!=used),key=lambda s:math.dist(head,ports[s][0]));used=dia_side
            allowed=['B','L','R'] if o['attributes_side']=='above' else ['T','L','R']
            middle={'T':(x+w/2,y),'B':(x+w/2,y+h),'L':(x,y+h/2),'R':(x+w,y+h/2)}
            count=lambda s:len(groups.get((name,s),[]))
            def side_cost(s):
                cap=25 if s in ['T','B'] else 3
                if count(s)>=cap:return float('inf')
                p=middle[s];q=ports[dia_side][0]
                penalty=0
                if s=='L' and q[0]>x+w:penalty=220
                if s=='R' and q[0]<x:penalty=220
                if s=='T' and q[1]>y+h:penalty=220
                if s=='B' and q[1]<y:penalty=220
                return abs(p[0]-q[0])+abs(p[1]-q[1])+count(s)*20+penalty
            side=min(allowed,key=side_cost);assert side_cost(side)<float('inf')
            plan={'fk':f,'role':role,'table':name,'side':side,'diamond_side':dia_side,
                  'end':ports[dia_side][0],'end_stub':ports[dia_side][1]}
            plans.append(plan);groups.setdefault((name,side),[]).append(plan)
    for (name,side),arms in groups.items():
        x,y,w,h=objects[name]['header_box']
        arms.sort(key=lambda p:(p['end'][0] if side in ['T','B'] else p['end'][1],p['fk']['name'],p['role']))
        if side in ['T','B']:
            available=[xx for xx in range(math.ceil((x+12)/12)*12,math.floor((x+w-12)/12)*12+1,12)]
        else:
            available=[yy for yy in range(math.ceil((y+10)/12)*12,math.floor((y+h-10)/12)*12+1,12)]
        assert len(arms)<=len(available),(name,side,len(arms),len(available))
        for k,p in enumerate(arms):
            pos=available[round((k+1)*(len(available)+1)/(len(arms)+1))-1]
            if side=='T':p['start']=(pos,y);p['start_stub']=(pos,math.floor((y-30)/12)*12)
            elif side=='B':p['start']=(pos,y+h);p['start_stub']=(pos,math.ceil((y+h+30)/12)*12)
            elif side=='L':p['start']=(x,pos);p['start_stub']=(math.floor((x-30)/12)*12,pos)
            else:p['start']=(x+w,pos);p['start_stub']=(math.ceil((x+w+30)/12)*12,pos)
    return plans


def route_reserved_tracks(layout,plans):
    """Every relation gets its own track; perpendicular crossings are penalized."""
    import heapq
    pitch=12;_,_,width,height=map(float,layout['bb'].split(','));nx=math.ceil(width/pitch)+1;ny=math.ceil(height/pitch)+1;n=nx*ny
    blocked=bytearray(n);hr=bytearray(n);vr=bytearray(n);hv=bytearray(n);vv=bytearray(n)
    def block(rect,pad):
        x,y,w,h=rect;x1=max(0,math.ceil((x-pad)/pitch));x2=min(nx-1,math.floor((x+w+pad)/pitch));y1=max(0,math.ceil((y-pad)/pitch));y2=min(ny-1,math.floor((y+h+pad)/pitch))
        for row in range(y1,y2+1):blocked[row*nx+x1:row*nx+x2+1]=b'\x01'*(x2-x1+1)
    for o in layout['objects']:block(o['screen_box'],18)
    for p in plans:
        for a,b in [(p['start'],p['start_stub']),(p['end'],p['end_stub'])]:
            block((min(a[0],b[0]),min(a[1],b[1]),abs(a[0]-b[0]),abs(a[1]-b[1])),4)
    def key(p):return round(p[1]/pitch)*nx+round(p[0]/pitch)
    # Route local relationships first, keeping long role links out of their way.
    ordered=sorted(plans,key=lambda p:(abs(p['start_stub'][0]-p['end_stub'][0])+abs(p['start_stub'][1]-p['end_stub'][1]),p['fk']['name'],p['role']))
    metrics={'grid':pitch,'arms':len(plans),'shared_track_segments':0,'search_expansions':0}
    for route_index,p in enumerate(ordered):
        start,goal=key(p['start_stub']),key(p['end_stub']);gx,gy=goal%nx,goal//nx
        orient=1 if p['side'] in ['L','R'] else 2
        initial=start*3+orient;heap=[(0,0,initial)];cost={initial:0};parent={};found=None
        while heap:
            _,g,state=heapq.heappop(heap)
            if g!=cost.get(state):continue
            i,heading=divmod(state,3);ix,iy=i%nx,i//nx;metrics['search_expansions']+=1
            if i==goal:found=state;break
            for j,d in [(i-1,1),(i+1,1),(i-nx,2),(i+nx,2)]:
                if j<0 or j>=n or (d==1 and j//nx!=iy):continue
                if blocked[j] and j!=goal:continue
                seg=min(i,j);reserved=hr if d==1 else vr
                if reserved[seg]:continue
                crossing=(vv[j] if d==1 else hv[j])
                if d==1:
                    near=(hr[seg-nx] if iy>0 else 0)+(hr[seg+nx] if iy<ny-1 else 0)
                else:near=(vr[seg-1] if ix>0 else 0)+(vr[seg+1] if ix<nx-1 else 0)
                ng=g+pitch+(24 if heading!=d else 0)+350*crossing+10*near
                ns=j*3+d
                if ng<cost.get(ns,10**12):
                    cost[ns]=ng;parent[ns]=state
                    heuristic=pitch*(abs(j%nx-gx)+abs(j//nx-gy))
                    heapq.heappush(heap,(ng+heuristic,ng,ns))
        if found is None:raise RuntimeError('No separate route for '+p['fk']['name']+' '+p['role'])
        path=[];state=found
        while True:
            path.append(state//3)
            if state==initial:break
            state=parent[state]
        path.reverse()
        for a,b in zip(path,path[1:]):
            if a//nx==b//nx:
                assert not hr[min(a,b)];hr[min(a,b)]=1;hv[a]=hv[b]=1
            else:
                assert not vr[min(a,b)];vr[min(a,b)]=1;vv[a]=vv[b]=1
        p['points']=simplify_orthogonal([p['start']]+[(i%nx*pitch,i//nx*pitch) for i in path]+[p['end']])
    layout['routing_metrics']=metrics
    return plans


def erd_hop_nhat():
    """One logical ERD of the 18 thesis entities, with no hidden tables."""
    import subprocess
    selection=json.loads(Path(__file__).with_name('lua-chon-thuoc-tinh.json').read_text())
    included=selection['included_tables']
    selected_fks=[f for f in FKS if f['name'] in selection['shown_foreign_keys']]
    assert len(included)==18 and len(selected_fks)==46
    assert all(f['parent'] in included and f['child'] in included for f in selected_fks)
    labels={
        'khoi':'thuộc khối','tang':'thuộc tầng','loai_phi':'loại phí',
        'ma_can_ho':'thuộc căn','ma_cau_hinh_phi':'áp giá',
        'ma_chi_so_dich_vu':'chỉ số','ma_hoa_don':'hóa đơn',
        'ma_nguoi_dung':'tài khoản','ma_cu_dan':'cư dân',
        'ma_cu_dan_nguoi_gui':'người gửi','ma_phan_anh':'có ảnh',
        'ma_thiet_bi':'thiết bị','ma_vi_tri_qr':'vị trí QR',
        'ma_ky_thuat_vien':'giao xử lý','ma_lich_su_cu_tru':'đợt cư trú',
        'ma_thong_bao':'đã đọc'}
    dot=['graph erd {',
         'graph [rankdir=TB, ranksep=0.75, nodesep=0.75, splines=ortho, outputorder=edgesfirst];',
         'node [shape=box,fixedsize=true,label="",margin=0];']
    sizes={}
    for name,entity in included.items():
        assert set(entity['columns'])<=SCHEMA[name]['columns'].keys()
        assert set(SCHEMA[name]['pk'])<=set(entity['columns'])
        w,h=320,(82 if name in selection['layout_rows'][0] else 72)+len(entity['columns'])*60
        sizes[name]=(w,h)
        dot.append(f'"{name}" [width={w/72},height={h/72}];')
    for f in selected_fks:
        dot.extend([f'{f["id"]} [shape=diamond,width=2.0,height=1.1];',
                    f'"{f["parent"]}" -- {f["id"]} [id="{f["id"]}-parent",tailport=n];',
                    f'{f["id"]} -- "{f["child"]}" [id="{f["id"]}-child",headport=n];'])
    dot.append('}')
    dot='\n'.join(dot)
    (OUT/'nguon/bo-cuc-erd.dot').write_text(dot)
    layout=make_straight_layout(selection,sizes,selected_fks)
    (OUT/'nguon/bo-cuc-erd.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2))
    _,_,gw,gh=map(float,layout['bb'].split(','))
    margin,top=0,0
    d=Diagram(15,math.ceil(gw)+2*margin,math.ceil(gh)+top+120)
    def transform(x,y):return float(x),float(y)
    cells={}
    def tag(node,**attrs):
        c=cells.get(node)
        if c is None:
            c=next(c for c in d.root.findall('mxCell') if c.get('id')==node);cells[node]=c
        for key,value in attrs.items():c.set(key,str(value))
    entities={};relationships={}
    fk_columns={}
    for f in FKS:
        for col in f['columns']:fk_columns.setdefault((f['child'],col),[]).append(f['name'])
    for obj in layout['objects']:
        name=obj['name']
        if name not in included:continue
        cx,cy=transform(*obj['pos'].split(','));w,h=sizes[name];x,y=cx-w/2,cy-h/2
        group=d.box(x,y,w,h,'',shape='group');tag(group,erdKind='table-group',tableName=name)
        header_y=obj['header_box'][1]-y
        above=obj.get('attributes_side')=='above'
        entity=d.box(0,header_y,320,54,name.upper(),fs=17,parent=group)
        tag(entity,erdKind='entity',tableName=name);entities[name]=entity
        cols=included[name]['columns']
        for k,col in enumerate(cols):
            ox,oy=0,(header_y-72-k*60 if above else 82+k*60)
            info=SCHEMA[name]['columns'][col]
            primary=col in SCHEMA[name]['pk'];foreign=fk_columns.get((name,col),[])
            fs=min(17,max(12,math.floor(248/ImageFont.truetype(FONT_PATH,17).getlength(col)*17)))
            attr=d.box(ox,oy,270,44,col,shape='ellipse',fs=fs,underline=primary,parent=group)
            tag(attr,erdKind='attribute',tableName=name,columnName=col,isPrimary=int(primary),isForeign=int(bool(foreign)),foreignKeyNames=','.join(foreign))
            underline=None
            if foreign:
                tw=ImageFont.truetype(FONT_PATH,fs).getlength(col)
                left=x+135-tw/2;baseline=y+oy+22+fs*.35;uy=baseline+(6 if primary else 3)
                underline=d.line([(left,uy),(left+tw,uy)],dashed=True,parent=attr)
                c=next(c for c in d.root.findall('mxCell') if c.get('id')==underline)
                c.set('style',c.get('style').replace('dashPattern=6 4','dashPattern=3 3').replace('strokeWidth=1.3','strokeWidth=1'))
                tag(underline,erdKind='foreign-key-underline',tableName=name,columnName=col,attributeCell=attr)
                d.svgitems[-1]['underline_dash']=True
            bus=d.line([(x,y+header_y+(0 if above else 54)),(x,y+oy+22)],source=entity,target=attr,parent=group)
            tag(bus,erdKind='attribute-bus',tableName=name,columnName=col)
            d.fields.append({'table':name,'field':col,'type':info['type'],'primary':primary,'foreign_keys':foreign,'cell_id':attr,'foreign_underline_cell':underline})
    for obj in layout['objects']:
        if obj['name'] in included:continue
        f=next(f for f in selected_fks if f['id']==obj['name'])
        cx,cy=transform(*obj['pos'].split(','))
        diamond=d.box(cx-72,cy-39.6,144,79.2,'',shape='diamond',fs=14)
        tag(diamond,erdKind='relationship',fkName=f['name'],childTable=f['child'],parentTable=f['parent'])
        relationships[f['id']]=diamond
    def along(points,amount,from_end=False):
        pts=list(reversed(points)) if from_end else points
        for a,b in zip(pts,pts[1:]):
            length=math.dist(a,b)
            if length>amount:return(a[0]+(b[0]-a[0])*amount/length,a[1]+(b[1]-a[1])*amount/length)
            amount-=length
        return pts[-1]
    plans=route_reserved_tracks(layout,plan_relation_arms(layout,selected_fks))
    (OUT/'nguon/bo-cuc-erd.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2))
    arms={}
    for p in plans:
        f=p['fk'];role=p['role'];name=p['table'];entity=entities[name];diamond=relationships[f['id']]
        points=p['points']
        if role=='parent':src,dst=entity,diamond
        else:src,dst=diamond,entity;points=list(reversed(points))
        line=d.line(points,source=src,target=dst)
        d.svgitems[-1]['relationship']=True
        c=next(c for c in d.root.findall('mxCell') if c.get('id')==line)
        c.set('style',c.get('style')+'jumpStyle=arc;jumpSize=8;')
        tag(line,erdKind='foreign-key-arm',fkName=f['name'],armRole=role)
        arms.setdefault(f['id'],{})[role]=line
        card=f['parent_cardinality'] if role=='parent' else f['child_cardinality']
        if role=='parent':er_marker(d,entity,points[0],points[1],card,tag,f['name'],role)
        else:er_marker(d,entity,points[-1],points[-2],card,tag,f['name'],role)
    d.relations=[dict(f,relationship_cell_id=relationships[f['id']],arm_cells=arms[f['id']]) for f in selected_fks]
    d.note='Bố cục mới, chia đầu nối sang các cạnh và dùng rãnh dây riêng: ERD 18 bảng trọng tâm: liệt kê đủ 218 thuộc tính và 46 khóa ngoại giữa các bảng được giữ; mỗi bảng một cột oval dọc, chữ thường, đường nối vuông góc, quan hệ hình thoi trống, bội số một/nhiều bằng vạch/chân quạ. Khóa chính gạch liền, khóa ngoại gạch đứt; không có mã FK/R. Schema vẫn 31 bảng, 362 cột, 81 FK.'
    save(d)


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
        actor_y = 65
        participant_y, participant_height = 106, 100
        header_bottom = max(actor_y + ACTOR_HEIGHT, participant_y + participant_height)
        message_label_offset = 94
        top = header_bottom + 24 + message_label_offset
        count=len(participants);gap=305;width=180+(count-1)*gap+180;row=132;height=top+len(msgs)*row+245;d=Diagram(index,width,height)
        xs=[180+i*gap for i in range(count)];end=height-330
        for i,(x,title) in enumerate(zip(xs,participants)):
            if i==0:
                d.actor(x,actor_y,title)
                lifeline_start = actor_y + ACTOR_HEIGHT
            else:
                d.box(x-112,participant_y,224,participant_height,title,fill='#e9e9f0',shape='cylinder' if title=='MySQL' else 'rect',fs=20)
                lifeline_start = participant_y + participant_height
            d.line([(x,lifeline_start+10),(x,end)],dashed=True)
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
                d.text(min(xa,xb)+14,y-message_label_offset,abs(xb-xa)-28,88,f'{k+1}. '+label,fs=19,align='left')
        d.note=note;save(d)

def main():
    decompose()
    usecase(2,[('auth','Đăng nhập / quản lý phiên'),('records','Quản lý hồ sơ và cư trú'),('qr','Tạo / quản lý QR vị trí'),('send','Gửi / tra cứu phản ánh'),('assign','Tiếp nhận / phân công / nghiệm thu'),('work','Xử lý việc được giao'),('bill','Lập / duyệt / xác nhận thu hóa đơn'),('read','Xem hóa đơn và thông báo'),('manage','Điều hành bảo trì, tiện ích và quỹ'),('maintain','Thực hiện bảo trì được giao'),('book','Đặt lịch tiện ích')],[('Ban quản lý',125,380,['auth','records','qr','assign','bill','manage']),('Kỹ thuật viên',125,1110,['auth','work','maintain']),('Cư dân',1120,850,['auth','send','read','book']),('Người gửi\ncông khai',1120,350,['send'])])
    usecase(3,[('a','Khối / tầng / căn hộ'),('b','Cư dân / cư trú / phương tiện'),('c','Tài khoản căn / bàn giao chủ hộ'),('d','Vị trí / thiết bị / in QR'),('e','Tiếp nhận / phân công phản ánh'),('f','Nghiệm thu / trả lại kết quả'),('g','Đơn giá / chỉ số / hóa đơn'),('h','Thu phí / công nợ / quỹ'),('i','Thông báo / tiện ích / báo cáo')],[('Ban quản lý',125,540,list('abcdefghi'))])
    usecase(4,[('send','Gửi phản ánh tại vị trí'),('lookup','Tra cứu bằng mã riêng'),('my','Xem phản ánh của mình'),('bill','Xem hóa đơn / VietQR'),('notice','Đọc thông báo / đặt tiện ích'),('work','Xử lý việc được giao'),('maintain','Thực hiện bảo trì được giao')],[('Cư dân',125,240,['send','lookup','my','bill','notice']),('Người gửi\ncông khai',125,650,['send','lookup']),('Kỹ thuật viên',1120,650,['work','maintain'])])
    activities();sequences();statechart();classes();erd_hop_nhat();architecture();dataflow()
    assert sorted(d.index for d in DIAGRAMS)==list(range(1,16))+[20,21]
    master=E.Element('mxfile',host='app.diagrams.net',version='24.7.17',type='device',compressed='false')
    summary=[]
    for d in sorted(DIAGRAMS,key=lambda d:d.index):
        entry=copy.deepcopy(MANIFEST[d.index-1]);page=E.SubElement(master,'diagram',id='hinh-'+entry['figure'].replace('.','-'),name=entry['caption']);page.append(copy.deepcopy(d.model))
        cells=d.model.findall('.//mxCell');entry.update(width=d.width,height=d.height,vertices=sum(c.get('vertex')=='1' for c in cells),edges=sum(c.get('edge')=='1' for c in cells),note=d.note,fields=d.fields,relations=d.relations)
        summary.append(entry)
    E.indent(master,space='  ')
    (OUT/'Tat-ca-17-so-do-ERD-hop-nhat.drawio').write_bytes(E.tostring(master,encoding='utf-8',xml_declaration=True))
    (OUT/'nguon/mo-hinh-va-doi-chieu.json').write_text(json.dumps({'source_commit':'cceb904','schema_sha256':hashlib.sha256(SQL.encode()).hexdigest(),'tables':SCHEMA,'foreign_keys':FKS,'erd_pages':1,'presentation':{'kind':'logical subset','shown_tables':18,'schema_tables':31,'selected_columns':218,'total_columns':362,'shown_relationships':46,'schema_foreign_keys':81,'attribute_style':'ellipse, single vertical column per table','all_attributes_of_included_tables':True,'orthogonal_relationships':True,'routing_policy':'separate 12-pixel orthogonal tracks; side ports; perpendicular crossings use jumps','bold_attributes':False,'relationship_diamonds':'blank','cardinality_notation':'one bar, many crowfoot, optional circle','primary_key_notation':'solid underline','foreign_key_notation':'dashed underline','hidden_layers':False,'selection':json.loads(Path(__file__).with_name('lua-chon-thuoc-tinh.json').read_text())},'reference_style':'6 example images supplied by user; housing domain retained','diagrams':summary},ensure_ascii=False,indent=2))
    (OUT/'danh-muc.json').write_text(json.dumps([{k:v for k,v in e.items() if k not in ['fields','relations']} for e in summary],ensure_ascii=False,indent=2))
    print('Generated 17 diagrams: one logical ERD with 18 tables, 218 complete attributes, 46 relationships; native dashed FK underlines.')

if __name__=='__main__':main()
