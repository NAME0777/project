from django.db import models


class Subject(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.code} - {self.name}"


class SemesterTopic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="topics")
    semester = models.CharField(max_length=20)  # e.g. "1/2569"
    topic_title = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order_index"]

    def __str__(self):
        return f"{self.subject.code} - {self.topic_title}"
