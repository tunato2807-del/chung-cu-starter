from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile
import json
import os
import subprocess
import xml.etree.ElementTree as ET

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE
from docx.shared import Inches, Mm, Pt, RGBColor
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
NAME = "Hinh-cong-cu-muc-1-3"
MAIN_TITLE = "1.3. CÔNG NGHỆ VÀ CÔNG CỤ SỬ DỤNG"
GROUPS = [
    ("1.3.1. React, giao diện thích ứng và Vite", [
        ("1.1", "react", "Logo React", "Thư viện xây dựng giao diện theo thành phần."),
        ("1.2", "vite", "Logo Vite", "Máy chủ phát triển và công cụ tạo bản dựng frontend."),
    ]),
    ("1.3.2. Node.js, Express và MySQL", [
        ("1.3", "nodejs", "Logo Node.js", "Môi trường chạy JavaScript phía máy chủ."),
        ("1.4", "express", "Logo Express", "Framework định tuyến và xử lý middleware của API."),
        ("1.5", "mysql", "Logo MySQL", "Hệ quản trị cơ sở dữ liệu quan hệ của hệ thống."),
    ]),
    ("1.3.3. html5-qrcode, qrcode và camera trình duyệt", [
        ("1.6", "html5-qrcode-quet", "Minh họa quét QR bằng html5-qrcode",
         "Camera trình duyệt nhận ảnh. Thư viện giải mã để ứng dụng kiểm tra liên kết."),
        ("1.7", "qrcode-mau", "Mã QR mẫu sinh bằng qrcode",
         "Mã chứa URL minh họa https://example.org/qr/demo."),
    ]),
    ("1.3.4. Công cụ phát triển và kiểm thử", [
        ("1.8", "git", "Logo Git", "Quản lý lịch sử phiên bản của mã nguồn và tài liệu."),
        ("1.9", "github", "Logo GitHub", "Lưu trữ kho mã và tài liệu của dự án."),
        ("1.10", "vscode", "Logo Visual Studio Code", "Soạn thảo, đọc mã và chạy lệnh phát triển."),
        ("1.11", "playwright", "Logo Playwright", "Tự động hóa kiểm thử trên trình duyệt."),
    ]),
    ("Tham khảo từ đề cương", [
        ("TK.1", "figma", "Logo Figma", "Công cụ thiết kế giao diện được nêu trong đề cương."),
        ("TK.2", "postman", "Logo Postman", "Công cụ thử API được nêu trong đề cương."),
    ]),
]
REFERENCES = {
    "html5-qrcode-quet": ("html5-qrcode", "https://github.com/mebjas/html5-qrcode"),
    "qrcode-mau": ("qrcode", "https://github.com/soldair/node-qrcode"),
}
REFERENCE_NOTE = "Tài liệu hiện có chưa xác nhận việc sử dụng Figma hoặc Postman trong sản phẩm."


def render_images(sources, env, temp):
    (ROOT / "png").mkdir(exist_ok=True)
    for _, figures in GROUPS:
        for _, key, _, _ in figures:
            svg = ROOT / "svg" / f"{key}.svg"
            output = ROOT / "png" / f"{key}.png"
            if key in sources:
                assert sha256(svg.read_bytes()).hexdigest() == sources[key]["sha256"], svg
                rendered = temp / f"{key}.png"
                width = 1600
            else:
                rendered = output
                if key == "qrcode-mau":
                    view_box = ET.parse(svg).getroot().attrib["viewBox"]
                    width = int(view_box.split()[2]) * 36
                else:
                    width = 1800
            subprocess.run([
                "inkscape", str(svg), f"--export-filename={rendered}", f"--export-width={width}",
            ], check=True, env=env)
            if key in sources:
                with Image.open(rendered) as raster:
                    logo = raster.convert("RGBA")
                logo = logo.crop(logo.getchannel("A").getbbox())
                logo.thumbnail((1260, 720), Image.Resampling.LANCZOS)
                canvas = Image.new("RGBA", (1500, 900))
                canvas.paste(logo, ((1500 - logo.width) // 2, (900 - logo.height) // 2))
                canvas.save(output, dpi=(300, 300), optimize=True)


def add_link(paragraph, text, url):
    link = OxmlElement("w:hyperlink")
    link.set(qn("r:id"), paragraph.part.relate_to(
        url, RELATIONSHIP_TYPE.HYPERLINK, is_external=True,
    ))
    run = OxmlElement("w:r")
    props = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "144E72")
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    props.extend([color, underline])
    label = OxmlElement("w:t")
    label.text = text
    run.extend([props, label])
    link.append(run)
    paragraph._p.append(link)


def format_document(document):
    section = document.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.left_margin = section.right_margin = Mm(23)
    section.top_margin = Mm(21)
    section.bottom_margin = Mm(19)
    section.footer_distance = Mm(9)

    normal = document.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.12

    for name, size, color in (
        ("Title", 22, "162B3B"), ("Heading 1", 15, "162B3B"), ("Heading 2", 14, "162B3B"),
    ):
        style = document.styles[name]
        style.font.name = "Times New Roman"
        fonts = style.element.rPr.rFonts
        for attr in ("asciiTheme", "hAnsiTheme", "eastAsiaTheme", "cstheme"):
            fonts.attrib.pop(qn(f"w:{attr}"), None)
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(19 if name != "Title" else 0)
        style.paragraph_format.space_after = Pt(9)
        style.paragraph_format.keep_with_next = True

    for name, size, bold, color in (
        ("Tên hình", 11.5, True, "162B3B"),
        ("Chú thích hình", 11, False, "243746"),
        ("Nguồn hình", 10.5, False, "415463"),
    ):
        style = document.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        style.base_style = normal
        style.font.size = Pt(size)
        style.font.bold = bold
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.keep_together = True
        style.paragraph_format.keep_with_next = name != "Nguồn hình"

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer.style = document.styles["Nguồn hình"]
    footer.add_run("Mục 1.3  •  ")
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    footer._p.append(field)


def add_figures(document, figures, sources, widths):
    table = document.add_table(rows=1, cols=len(figures))
    table.autofit = False
    row = table.rows[0]
    row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
    for col, cell in zip(table.columns, row.cells, strict=True):
        col.width = cell.width = Mm(164 / len(figures))
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    for cell, width, (number, key, title, note) in zip(row.cells, widths, figures, strict=True):
        image = cell.paragraphs[0]
        image.alignment = WD_ALIGN_PARAGRAPH.CENTER
        image.paragraph_format.space_after = Pt(4)
        image.paragraph_format.keep_with_next = True
        picture = image.add_run().add_picture(str(ROOT / "png" / f"{key}.png"), width=Inches(width))
        picture._inline.docPr.set("descr", title)
        cell.add_paragraph(f"Hình {number}. {title}", style="Tên hình")
        cell.add_paragraph(note, style="Chú thích hình")
        source = cell.add_paragraph(style="Nguồn hình")
        if key in sources:
            source.add_run("Nguồn hình — ")
            add_link(source, "Devicon", sources[key]["url"])
        else:
            source.add_run("Nguồn hình — Minh họa cho báo cáo, dựa trên ")
            add_link(source, *REFERENCES[key])
            source.add_run(".")


def make_document(sources):
    document = Document()
    document.core_properties.title = MAIN_TITLE
    document.core_properties.subject = "Tập hình chèn vào báo cáo dự án chung-cu-starter"
    format_document(document)

    document.add_paragraph(MAIN_TITLE, style="Title")
    document.add_paragraph("Tập hình chèn vào báo cáo chuyên ngành về quản lý chung cư.")
    for (heading, figures), widths in zip(GROUPS[:2], [(2.68, 2.68), (1.95, 1.95, 1.95)], strict=True):
        document.add_heading(heading, level=1)
        add_figures(document, figures, sources, widths)

    document.add_page_break()
    heading, figures = GROUPS[2]
    document.add_heading(heading, level=1)
    document.add_paragraph("Hai hình minh họa chức năng được dựng cho báo cáo, "
                           "dùng cùng một URL mẫu.")
    add_figures(document, figures[:1], sources, (5.88,))
    add_figures(document, figures[1:], sources, (2.36,))

    document.add_page_break()
    heading, figures = GROUPS[3]
    document.add_heading(heading, level=1)
    add_figures(document, figures[:2], sources, (2.32, 2.32))
    add_figures(document, figures[2:], sources, (2.32, 2.32))
    heading, figures = GROUPS[4]
    document.add_heading(heading, level=2)
    reference = document.add_paragraph(REFERENCE_NOTE)
    reference.paragraph_format.keep_with_next = True
    add_figures(document, figures, sources, (2.05, 2.05))

    document.save(ROOT / f"{NAME}.docx")


def make_readme(sources):
    lead = f"""# Bộ hình mục 1.3. Công nghệ và công cụ sử dụng

[Word tập hình]({NAME}.docx) · [PDF xem trước]({NAME}.pdf) · [ZIP trọn bộ]({NAME}.zip)

PNG dùng để chèn vào Word. SVG của logo giữ nguyên từ Devicon. Hai SVG QR minh họa chức năng
quét và sinh mã. Số hình gợi ý theo Chương 1, có thể cập nhật theo thứ tự khi đưa vào báo cáo.

[Danh mục URL và SHA-256 của từng logo](nguon/nguon-logo.json) · [Giấy phép MIT của Devicon](nguon/DEVICON-LICENSE.txt)

"""
    blocks = [lead]
    for heading, figures in GROUPS:
        blocks.append(f"## {heading}\n")
        if figures[0][1] == "figma":
            blocks.append(f"{REFERENCE_NOTE}\n")
        if figures[0][1] == "html5-qrcode-quet":
            blocks.append("Hai hình minh họa chức năng, dùng URL mẫu thuộc miền example.org.\n")
        blocks.append("| Xem hình | Chú thích và tệp |\n| --- | --- |")
        for number, key, title, note in figures:
            png = f"png/{key}.png"
            svg = f"svg/{key}.svg"
            source, url = ("Devicon", sources[key]["url"]) if key in sources else REFERENCES[key]
            if key in REFERENCES:
                source = f"Tài liệu thư viện {source}"
            blocks.append(
                f'| <img src="{png}" alt="{title}" width="210"> | '
                f"**Hình {number}. {title}**<br>{note}<br>"
                f"[PNG]({png}) · [SVG]({svg}) · [{source}]({url}) |"
            )
        blocks.append("")
    blocks.append("""## Tái tạo tập hình

Tại gốc checkout, chạy `node docs/bao-cao/hinh-cong-cu-muc-1-3-2026-11-18/nguon/tao-qr.mjs`
với dependency `qrcode` của dự án. Sau đó chạy
`python docs/bao-cao/hinh-cong-cu-muc-1-3-2026-11-18/nguon/tao-bo-hinh.py`
với Inkscape, LibreOffice, Python 3.10+, Pillow và python-docx. Dùng phông DejaVu Sans
cho sơ đồ quét QR và Times New Roman hoặc phông tương thích cho tập Word.
""")
    (ROOT / "README.md").write_text("\n".join(blocks), encoding="utf-8")


def main():
    metadata = json.loads((ROOT / "nguon/nguon-logo.json").read_text(encoding="utf-8"))
    sources = {Path(logo["file"]).stem: logo for logo in metadata["logos"]}
    with TemporaryDirectory(prefix="hinh-cong-cu-") as work:
        temp = Path(work)
        env = {**os.environ, "XDG_CACHE_HOME": str(temp / "cache"),
               "XDG_CONFIG_HOME": str(temp / "config")}
        render_images(sources, env, temp)
        make_document(sources)
        subprocess.run([
            "soffice", f"-env:UserInstallation={(temp / 'lo-profile').as_uri()}",
            "--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", work,
            str(ROOT / f"{NAME}.docx"),
        ], check=True, env=env)
        (ROOT / f"{NAME}.pdf").write_bytes((temp / f"{NAME}.pdf").read_bytes())
    make_readme(sources)
    files = [ROOT / name for name in ("README.md", f"{NAME}.docx", f"{NAME}.pdf")]
    for sub, pattern in (("svg", "*.svg"), ("png", "*.png"), ("nguon", "*")):
        files.extend(path for path in sorted((ROOT / sub).glob(pattern)) if path.is_file())
    with ZipFile(ROOT / f"{NAME}.zip", "w", ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT.parent))


if __name__ == "__main__":
    main()
