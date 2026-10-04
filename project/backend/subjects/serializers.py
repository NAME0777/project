from rest_framework import serializers
from .models import Subject, Topic
from notes.models import Note


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "code", "name", "term"]

    def validate_code(self, value):
        return value.strip().upper()


class TopicSerializer(serializers.ModelSerializer):
    note_id = serializers.SerializerMethodField()
    has_note = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = ["id", "subject", "order", "title", "note_id", "has_note"]

    def get_note_id(self, obj):
        # ค้นหา Note ที่ผูกกับ Topic/Subject นี้
        note = Note.objects.filter(pk=obj.id).first()
        return note.id if note else getattr(obj, "note_id", None)

    def get_has_note(self, obj):
        # ค้นหา Note และตรวจสอบว่ามี content ที่พิมพ์ไว้จริงๆ หรือไม่ (ไม่ใช่ค่าว่าง)
        note = Note.objects.filter(pk=obj.id).first()
        if note and note.content and len(note.content.strip()) > 0:
            return True
        return False