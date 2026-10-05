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
        return obj.note_id

    def get_has_note(self, obj):
        if obj.note:
            return bool((obj.note.content and len(obj.note.content.strip()) > 0) or obj.note.source_file)
        return False