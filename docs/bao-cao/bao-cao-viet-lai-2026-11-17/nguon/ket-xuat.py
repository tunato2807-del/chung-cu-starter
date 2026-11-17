"""Generate DOCX, render PDF and stabilize cached Word page references."""
from pathlib import Path
import subprocess,sys,tempfile,shutil,json
S=Path(__file__).resolve().parent;B=S.parent
with tempfile.TemporaryDirectory(prefix='bao-cao-viet-lai-') as temp:
 out=Path(temp);doc=B/'Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx';pdf=out/(doc.stem+'.pdf')
 for iteration in range(4):
  subprocess.run([sys.executable,str(S/'tao-word-moi.py')],check=True)
  subprocess.run(['soffice','-env:UserInstallation='+ (out/'profile').as_uri(),'--headless','--convert-to','pdf','--outdir',str(out),str(doc)],check=True,timeout=120)
  subprocess.run([sys.executable,str(S/'kiem-tra-va-phan-trang.py'),str(pdf)],check=True)
  check=json.loads((B/'kiem-chung/kiem-tra-trinh-bay.json').read_text())
  if check['cache_stable']:
   shutil.copyfile(pdf,B/'Ban-xem-truoc_Bao-cao-viet-lai.pdf');print('Stable layout,',check['pdf_pages'],'pages.');break
 else:raise RuntimeError('Chưa ổn định phân trang; cần xem lại trước khi bàn giao.')
