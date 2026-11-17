from pathlib import Path
from zipfile import ZipFile
import json,re,hashlib,unicodedata,sys
import xml.etree.ElementTree as ET
import fitz
from docx import Document
from docx.oxml.ns import qn
B=Path(__file__).resolve().parent.parent
word=B/'Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx'
pdf=fitz.open(sys.argv[1]);doc=Document(word)
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s).replace('\u200b','').replace('\u00ad','')).casefold()
outline=pdf.get_toc();start=next(p for l,t,p in outline if t=='MỞ ĐẦU');appendix=next(p for l,t,p in outline if t=='PHỤ LỤC');references=next(p for l,t,p in outline if t=='DANH MỤC TÀI LIỆU THAM KHẢO')
texts=[norm(p.get_text()) for p in pdf];headpages={norm(t):p-start+1 for l,t,p in outline}
info=json.loads((B/'nguon/muc-luc-va-chu-thich.json').read_text());mapping={};missing=[]
for item in info['headings']+info['figures']+info['tables']:
 name=item['mark'];title=item['title'];page=headpages.get(norm(title)) if name.startswith('H') else None
 if page is None:
  hits=[i-start+2 for i in range(start-1,len(pdf)) if norm(title) in texts[i]]
  if hits:page=hits[0]
 if page is None:missing.append(item)
 else:mapping[name]=page
assert not missing,missing
old=json.loads((B/'kiem-chung/so-trang.json').read_text()) if (B/'kiem-chung/so-trang.json').exists() else {}
(B/'kiem-chung/so-trang.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2))
overflow=[];blank=[];numbers=[];bodyoutside=[]
for i,page in enumerate(pdf):
 spans=[s for b in page.get_text('dict')['blocks'] for l in b.get('lines',[]) for s in l['spans']]
 for s in spans:
  x0,y0,x1,y1=s['bbox']
  if x0<-.5 or y0<-.5 or x1>page.rect.width+.5 or y1>page.rect.height+.5:overflow.append(dict(page=i+1,text=s['text'][:80],bbox=s['bbox']))
 body=''.join(s['text'] for s in spans if s['bbox'][1]>=56 and s['bbox'][3]<=785)
 if len(body.strip())<40 and not page.get_images():blank.append(i+1)
 if i>=start-1:
  expected=str(i-start+2)
  if not any(s['text'].strip()==expected and s['bbox'][1]>775 and s['bbox'][2]>530 for s in spans):numbers.append(dict(page=i+1,expected=expected))
  # Text inside tables can use cell padding, but should stay in printable region.
  for s in spans:
   if s['bbox'][1]>50 and s['bbox'][1]<778 and (s['bbox'][0]<80 or s['bbox'][2]>543):bodyoutside.append(dict(page=i+1,text=s['text'][:80],bbox=s['bbox']))
with ZipFile(word) as z:
 root=ET.fromstring(z.read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 instructions=[''.join(x.itertext()) for x in root.findall('.//w:instrText',ns)]
 stack=0
 for x in root.findall('.//w:fldChar',ns):
  t=x.get(qn('w:fldCharType'));stack+=(1 if t=='begin' else -1 if t=='end' else 0);assert stack>=0
 assert stack==0
 starts=[x.get(qn('w:name')) for x in root.findall('.//w:bookmarkStart',ns)];assert len(starts)==len(set(starts))
 bookmarks=set(starts)
 unresolved=[]
 for s in instructions:
  m=re.search(r'(?:PAGEREF|REF)\s+(\S+)',s)
  if m and m.group(1) not in bookmarks:unresolved.append(s)
 embedded_svg=len([x for x in z.namelist() if x.endswith('.svg')])
result=dict(pdf_pages=len(pdf),front_pages=start-1,main_pages=appendix-start,appendix_pages=references-appendix,references_pages=len(pdf)-references+1,headings=len(info['headings']),figures=len(info['figures']),tables=len(info['tables']),references=11,toc_fields=sum('TOC ' in x for x in instructions),pageref_fields=sum('PAGEREF ' in x for x in instructions),citation_ref_fields=sum('REF TLTK_' in x for x in instructions),embedded_svg=embedded_svg,sections=[dict(page_cm=[s.page_width.cm,s.page_height.cm],margins_cm=[s.top_margin.cm,s.bottom_margin.cm,s.left_margin.cm,s.right_margin.cm]) for s in doc.sections],missing_captions=missing,text_outside_page=overflow,blank_pages=blank,page_number_issues=numbers,body_text_outside_margins=bodyoutside,unresolved_bookmarks=unresolved,cache_stable=(old==mapping),preview_font='PDF uses installed Liberation Serif where Times New Roman is unavailable. DOCX explicitly specifies Times New Roman. Update fields and review pagination in Microsoft Word before printing.',docx_sha256=hashlib.sha256(word.read_bytes()).hexdigest(),pdf_sha256=hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest())
(B/'kiem-chung/kiem-tra-trinh-bay.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['sections','preview_font','docx_sha256','pdf_sha256']},ensure_ascii=False,indent=2))
assert result['toc_fields']==3
assert not overflow and not blank and not numbers and not unresolved and not bodyoutside
assert result['appendix_pages']<result['main_pages']
