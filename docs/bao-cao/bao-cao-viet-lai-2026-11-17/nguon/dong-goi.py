"""Package the report and unchanged editable diagrams; verify artifact hashes."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,re
B=Path(__file__).resolve().parent.parent;R=B.parents[2]
archive=B/'Bao-cao-moi-va-so-do-chinh-sua.zip';diagrams=R/'docs/so-do-theo-mau-2026-11-17'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for name in ['Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx','Ban-xem-truoc_Bao-cao-viet-lai.pdf','Noi-dung-bao-cao.md','DOI-CHIEU-YEU-CAU.md']:z.write(B/name,name)
 z.writestr('README.md',(B/'README.md').read_text().replace('../../so-do-theo-mau-2026-11-17/','so-do/'))
 for p in (B/'hinh').glob('*.png'):z.write(p,'hinh-giao-dien/'+p.name)
 for p in (B/'kiem-chung').iterdir():
  if p.is_file() and p.name!='danh-muc-tep.json':z.write(p,'kiem-chung/'+p.name)
 for folder in ['drawio','svg','png','xml']:
  for p in (diagrams/folder).iterdir():
   if p.is_file():z.write(p,'so-do/'+folder+'/'+p.name)
 for name in ['Tat-ca-17-so-do-ERD-hop-nhat.drawio','ERD-18-bang-bo-cuc-ro.pdf','Xem-truoc-17-so-do-ERD-hop-nhat.pdf','README.md','DOI-CHIEU-KHOA-NGOAI.md','TU-DIEN-362-COT.md']:z.write(diagrams/name,'so-do/'+name)
 assert z.testzip() is None
files=[]
for p in sorted(B.rglob('*')):
 if p.is_file() and '__pycache__' not in p.parts and p.name!='danh-muc-tep.json':files.append(dict(file=str(p.relative_to(B)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(B/'kiem-chung/danh-muc-tep.json').write_text(json.dumps(files,ensure_ascii=False,indent=2))
for name in ['README.md','DOI-CHIEU-YEU-CAU.md']:
 for dest in re.findall(r'\]\(([^)]+)\)',(B/name).read_text()):
  assert dest.startswith(('http:','https:','#')) or (B/dest.split('#')[0]).exists(),dest
qa=json.loads((B/'kiem-chung/kiem-tra-trinh-bay.json').read_text());assert qa['cache_stable'] and not qa['blank_pages']
for name,key in [('Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx','docx_sha256'),('Ban-xem-truoc_Bao-cao-viet-lai.pdf','pdf_sha256')]:assert hashlib.sha256((B/name).read_bytes()).hexdigest()==qa[key]
print('Verified',len(files),'files;',round(archive.stat().st_size/1e6,2),'MB ZIP')
