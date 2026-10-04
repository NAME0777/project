from __future__ import annotations

import io
import logging
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

logger = logging.getLogger(__name__)

OCR_LANG = "tha+eng"
MAX_PDF_PAGES = 20  # จำกัดหน้าเอกสาร


class OcrError(Exception):
    """ข้อผิดพลาดที่อยากให้ frontend เห็นข้อความตรง ๆ"""


def extract_text(file_bytes: bytes, content_type: str) -> str:
    """คืนข้อความที่อ่านได้จากไฟล์ ทั้งภาพและ PDF"""
    if content_type == "application/pdf":
        return _extract_from_pdf(file_bytes)
    if content_type.startswith("image/"):
        return _extract_from_image(file_bytes)
    raise OcrError("รองรับเฉพาะไฟล์รูปภาพ (JPG/PNG) และ PDF เท่านั้น")


def _extract_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        raise OcrError("เปิดไฟล์รูปภาพไม่ได้ ไฟล์อาจเสียหรือไม่ใช่รูปภาพจริง") from exc
    return pytesseract.image_to_string(image, lang=OCR_LANG).strip()


def _extract_from_pdf(file_bytes: bytes) -> str:
    # 1. ลองดึงข้อความดิจิทัลโดยตรงจาก PDF ก่อน
    if pypdf is not None:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_content = []
            for page in reader.pages[:MAX_PDF_PAGES]:
                txt = page.extract_text()
                if txt:
                    text_content.append(txt.strip())
            
            full_text = "\n\n".join(t for t in text_content if t)
            if full_text.strip():
                return full_text
        except Exception as e:
            logger.warning(f"pypdf extract failed, fallback to image OCR: {e}")

    # 2. ถ้าไม่มี Text (เป็นภาพสแกน) ให้แปลงหน้า PDF เป็นรูปภาพด้วย PyMuPDF แล้วสแกน OCR
    if fitz is None:
        raise OcrError("เซิร์ฟเวอร์ยังไม่ได้ติดตั้ง PyMuPDF (pip install PyMuPDF)")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if len(doc) > MAX_PDF_PAGES:
            raise OcrError(f"PDF ยาวเกินไป (จำกัดไม่เกิน {MAX_PDF_PAGES} หน้าต่อครั้ง)")

        texts = []
        for page_num in range(min(len(doc), MAX_PDF_PAGES)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=300)  # แปลงเป็นภาพคมชัดระดับ 300 DPI
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            
            text = pytesseract.image_to_string(img, lang=OCR_LANG).strip()
            if text:
                texts.append(text)

        doc.close()
        return "\n\n".join(texts)

    except OcrError:
        raise
    except Exception as exc:
        logger.error(f"PDF OCR Error: {exc}", exc_info=True)
        raise OcrError("เปิดไฟล์ PDF ไม่ได้ ไฟล์อาจเสียหรือถูกล็อกด้วยรหัสผ่าน") from exc