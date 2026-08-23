from django.db import models
from notes.models import Note


class NoteAudio(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "รอดำเนินการ"
        COMPLETED = "completed", "เสร็จสิ้น"
        FAILED = "failed", "ล้มเหลว"

    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="audio_files")
    audio_file = models.FileField(upload_to="tts_audio/", null=True, blank=True)
    voice_type = models.CharField(max_length=50, default="th-standard")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audio for {self.note.title}"
