from celery import shared_task
from .models import OCRSource

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None


@shared_task
def process_ocr(ocr_source_id: int):
    ocr = OCRSource.objects.get(id=ocr_source_id)
    ocr.status = OCRSource.Status.PROCESSING
    ocr.save(update_fields=["status"])

    try:
        image = Image.open(ocr.image_file.path)
        # รองรับภาษาไทย + อังกฤษ ต้องติดตั้ง tesseract-ocr-tha บนเครื่อง server
        text = pytesseract.image_to_string(image, lang="tha+eng")

        ocr.extracted_text = text.strip()
        ocr.status = OCRSource.Status.COMPLETED
        ocr.save(update_fields=["extracted_text", "status"])
    except Exception as e:
        ocr.status = OCRSource.Status.FAILED
        ocr.extracted_text = f"เกิดข้อผิดพลาด: {e}"
        ocr.save(update_fields=["extracted_text", "status"])

    return ocr.status
