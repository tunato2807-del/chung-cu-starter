"""Render and populate cached TOC pages until the PDF layout stabilizes."""
from pathlib import Path
import json
import shutil
import subprocess
import sys
import tempfile

base=Path(__file__).resolve().parent
mapping=base/'kiem-chung/so-trang.json'
docx=base/'Bao-cao-DACN_To-Hoang-Tuan_1250080221.docx'
with tempfile.TemporaryDirectory(prefix='bao-cao-dacn-render-') as temporary:
    pdf=Path(temporary)/(docx.stem+'.pdf')
    for iteration in range(4):
        before=json.loads(mapping.read_text()) if mapping.exists() else {}
        command=[sys.executable,str(base/'tao-word.py')]
        if before:command+=['--pages',str(mapping)]
        subprocess.run(command,check=True)
        subprocess.run(['soffice','--headless','--convert-to','pdf','--outdir',temporary,str(docx)],check=True,timeout=90)
        subprocess.run([sys.executable,str(base/'kiem-tra-trinh-bay.py'),str(pdf)],check=True)
        after=json.loads(mapping.read_text())
        if before==after:
            destination=base/'Ban-xem-truoc_Bao-cao-DACN.pdf'
            shutil.copyfile(pdf,destination)
            print('Stable page references after',iteration+1,'pass(es); saved',destination.name)
            break
    else:
        raise RuntimeError('Layout did not stabilize; review before distributing PDF.')
