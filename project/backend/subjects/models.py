"""
---- subjects/models.py — ขอบเขตข้อ 2: จัดหมวดหมู่รายวิชา → ภาคการศึกษา → หัวข้อ/บทเรียน ----
"""
from django.db import models


class Subject(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    term = models.CharField(max_length=20, help_text='เช่น "1/2569"')

    class Meta:
        db_table = "subject"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Topic(models.Model):
    """หัวข้อ/บทเรียนในวิชา — ยังไม่มีโน้ตก็ได้ (note เป็น null จนกว่าจะมีคนเขียน)"""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="topics")
    order = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    note = models.OneToOneField(
        "notes.Note", on_delete=models.SET_NULL, null=True, blank=True, related_name="topic"
    )

    class Meta:
        db_table = "wiki"
        ordering = ["subject", "order"]
        unique_together = [("subject", "order")]

    def __str__(self):
        return f"{self.subject.code} · {self.order}. {self.title}"
