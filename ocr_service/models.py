from django.db import models
from notes.models import Note


class OCRSource(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "รอดำเนินการ"
        PROCESSING = "processing", "กำลังประมวลผล"
        COMPLETED = "completed", "เสร็จสิ้น"
        FAILED = "failed", "ล้มเหลว"

    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="ocr_sources", null=True, blank=True)
    image_file = models.FileField(upload_to="ocr_uploads/")
    extracted_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OCR #{self.id} - {self.status}"
