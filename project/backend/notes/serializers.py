from rest_framework import serializers

from .models import Note, Revision


class RevisionSerializer(serializers.ModelSerializer):
    editor_name = serializers.CharField(source="editor.full_name", read_only=True, default="")

    class Meta:
        model = Revision
        fields = ["id", "editor_name", "summary", "content", "created_at"]


class NoteSerializer(serializers.ModelSerializer):
    revisions = RevisionSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ["id", "subject", "title", "content", "source_file", "created_at", "updated_at", "revisions"]
        read_only_fields = ["created_at", "updated_at", "revisions"]


class CreateNoteSerializer(serializers.ModelSerializer):
    """สร้างโน้ตใหม่ + revision แรกในทีเดียว (ใช้ตอนบันทึกผลจาก OCR)"""

    class Meta:
        model = Note
        fields = ["id", "subject", "title", "content", "source_file"]

    def create(self, validated_data):
        editor = self.context["request"].user
        note = Note.objects.create(**validated_data)
        Revision.objects.create(note=note, editor=editor, summary="สร้างจากภาพที่สแกน", content=note.content)
        return note


class SaveRevisionSerializer(serializers.Serializer):
    content = serializers.CharField()
    summary = serializers.CharField(required=False, allow_blank=True, default="")

    def save(self, note: Note, editor):
        self.is_valid(raise_exception=True)
        note.content = self.validated_data["content"]
        note.save(update_fields=["content", "updated_at"])
        Revision.objects.create(
            note=note,
            editor=editor,
            summary=self.validated_data["summary"] or "แก้ไขเนื้อหา",
            content=self.validated_data["content"],
        )
        return note
