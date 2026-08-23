from django.db import models
from django.conf import settings
from subjects.models import SemesterTopic


class Note(models.Model):
    topic = models.ForeignKey(SemesterTopic, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class NoteRevision(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="revisions")
    content_snapshot = models.TextField()
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    edited_at = models.DateTimeField(auto_now_add=True)
    edit_summary = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-edited_at"]

    def __str__(self):
        return f"{self.note.title} - rev {self.id}"
