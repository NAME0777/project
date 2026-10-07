"""
---- notes/models.py — ขอบเขตข้อ 2 (คลังโน้ต) + ข้อ 5 (Wiki/ประวัติแก้ไข — พื้นฐานไว้ก่อน) ----
Revision เก็บทุกเวอร์ชันที่เคยบันทึก (ของเดิมไม่ถูกทับ) — ใช้ต่อยอด Diff Viewer ใน Phase ถัดไป
"""
from django.conf import settings
from django.db import models


def note_attachment_path(instance, filename):
    subject_id = getattr(instance, "subject_id", None) or "general"
    return f"notes/{subject_id}/{filename}"


class Note(models.Model):
    subject = models.ForeignKey("subjects.Subject", on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    # ไฟล์ต้นฉบับ (PDF/รูปภาพที่ใช้ทำ OCR) — เก็บบน minIO เมื่อ USE_S3_STORAGE=True
    source_file = models.FileField(upload_to=note_attachment_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class Revision(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="revisions")
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    summary = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.note.title} @ {self.created_at:%Y-%m-%d %H:%M}"
