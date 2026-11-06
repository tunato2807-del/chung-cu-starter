"""Read-only layout checks and cached index page map from the rendered PDF."""
from pathlib import Path
from zipfile import ZipFile
import argparse
import hashlib
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
import fitz
from docx import Document

BASE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('pdf',type=Path)
args=parser.parse_args()
docx=BASE/'Bao-cao-DACN_To-Hoang-Tuan_1250080221.docx'
doc=Document(docx)
pdf=fitz.open(args.pdf)

def normalize(text):
    return re.sub(r'\s+','',unicodedata.normalize('NFKC',text).replace('\u00ad','')).casefold()

outlines=pdf.get_toc()
main=next(page for level,title,page in outlines if title=='MỞ ĐẦU')
pages={title:page-main+1 for level,title,page in outlines if level<=3 and not title.startswith('A.')}
text_pages=[normalize(p.get_text()) for p in pdf]
missing=[]
captions=[]
for para in doc.paragraphs:
    if para.style.name not in ['FigureCaption','TableCaption']:continue
    title=para.text;captions.append(title)
    found=[i+1 for i,text in enumerate(text_pages) if i+1>=main and normalize(title) in text]
    if found:pages[title]=found[0]-main+1
    else:missing.append(title)
overflow=[]
for i,page in enumerate(pdf):
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox']
                if x0 < -1 or y0 < -1 or x1>page.rect.width+1 or y1>page.rect.height+1:
                    overflow.append({'page':i+1,'text':span['text'][:90],'bbox':[x0,y0,x1,y1]})
page_numbers=[]
for i in range(main-1,len(pdf)):
    spans=[span for b in pdf[i].get_text('dict')['blocks'] for line in b.get('lines',[]) for span in line['spans']]
    expected=str(i-main+2)
    found=[s for s in spans if s['text'].strip()==expected and s['bbox'][1]>775]
    page_numbers.append({'physical_page':i+1,'expected':expected,'right_aligned':bool(found and max(s['bbox'][2] for s in found)>530)})
sections=[]
for s in doc.sections:
    sections.append({'page_cm':[round(s.page_width.cm,3),round(s.page_height.cm,3)],'margins_cm':[round(s.top_margin.cm,3),round(s.bottom_margin.cm,3),round(s.left_margin.cm,3),round(s.right_margin.cm,3)]})
with ZipFile(docx) as z:
    document=z.read('word/document.xml')
    xml=ET.fromstring(document)
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    instructions=[''.join(v.itertext()) for v in xml.findall('.//w:instrText',ns)]
    stack=0
    for field in xml.findall('.//w:fldChar',ns):
        kind=field.get('{'+ns['w']+'}fldCharType')
        if kind=='begin':stack+=1
        elif kind=='end':stack-=1
        assert stack>=0,'Mismatched field ending'
    assert stack==0,'Unclosed Word field'
appendix=next(page for lev,title,page in outlines if lev==1 and title=='PHỤ LỤC')
references=next(page for lev,title,page in outlines if lev==1 and title=='DANH MỤC TÀI LIỆU THAM KHẢO')
result={
 'pdf_pages':len(pdf),'front_matter_pages':main-1,'main_content_pages':appendix-main,
 'appendix_pages':references-appendix,'references_pages':len(pdf)-references+1,
 'first_numbered_physical_page':main,'word_sections':sections,
 'dynamic_toc_fields':sum('TOC ' in x for x in instructions),'dynamic_page_refs':sum('PAGEREF ' in x for x in instructions),
 'captions':len(captions),'missing_captions_in_pdf':missing,'text_outside_page':overflow,
 'page_number_issues':[p for p in page_numbers if not p['right_aligned']],
 'preview_font':'Liberation Serif fallback; DOCX uses Times New Roman; reflow in Word before printing.',
 'pdf_sha256':hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
}
(BASE/'kiem-chung/so-trang.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
(BASE/'kiem-chung/phan-trang.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['pdf_pages','front_matter_pages','main_content_pages','appendix_pages','dynamic_toc_fields','captions','missing_captions_in_pdf','text_outside_page','page_number_issues']},ensure_ascii=False,indent=2))
assert not missing
assert not overflow
assert not result['page_number_issues']
assert result['dynamic_toc_fields']==3
assert result['appendix_pages']<=result['main_content_pages']
