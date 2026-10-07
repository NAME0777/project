import io
import logging
import os
import shutil
import pytesseract
from PIL import Image

# ตรวจสอบ path ของ Tesseract ให้ทำงานได้ทั้งใน Docker (Linux) และเครื่อง Local (Windows)
if not shutil.which("tesseract"):
    default_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default_win_path):
        pytesseract.pytesseract.tesseract_cmd = default_win_path

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import pdf2image
except ImportError:
    pdf2image = None

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

    # 2. ถ้าไม่มีข้อความดิจิทัล (เป็นภาพสแกน) ให้แปลงหน้า PDF เป็นรูปภาพแล้วทำ OCR
    # ลองใช้ PyMuPDF (fitz) ก่อน ถ้าไม่มีให้สลับไปใช้ pdf2image
    if fitz is not None:
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
            logger.error(f"PyMuPDF OCR Error: {exc}", exc_info=True)
            raise OcrError("เปิดไฟล์ PDF ด้วย PyMuPDF ไม่สำเร็จ ไฟล์อาจเสียหรือติดรหัสผ่าน") from exc

    elif pdf2image is not None:
        try:
            images = pdf2image.convert_from_bytes(file_bytes, first_page=1, last_page=MAX_PDF_PAGES)
            texts = []
            for img in images:
                text = pytesseract.image_to_string(img, lang=OCR_LANG).strip()
                if text:
                    texts.append(text)
            return "\n\n".join(texts)
        except Exception as exc:
            logger.error(f"pdf2image OCR Error: {exc}", exc_info=True)
            raise OcrError("แปลงหน้า PDF ด้วย pdf2image ไม่สำเร็จ") from exc

    else:
        raise OcrError("เซิร์ฟเวอร์ยังไม่ได้ติดตั้งไลบรารีอ่าน PDF (PyMuPDF หรือ pdf2image)")