from rest_framework import serializers
from .models import Note, NoteRevision


class NoteRevisionSerializer(serializers.ModelSerializer):
    editor_name = serializers.CharField(source="edited_by.get_full_name", read_only=True)

    class Meta:
        model = NoteRevision
        fields = ["id", "content_snapshot", "editor_name", "edited_at", "edit_summary"]


class NoteSerializer(serializers.ModelSerializer):
    revisions = NoteRevisionSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ["id", "topic", "title", "content", "created_by", "created_at", "updated_at", "revisions"]
        read_only_fields = ["created_by"]


class NoteUpdateSerializer(serializers.Serializer):
    """ใช้เฉพาะตอนแก้ไขแบบ wiki เพื่อบันทึก revision ใหม่"""
    content = serializers.CharField()
    edit_summary = serializers.CharField(required=False, allow_blank=True)
