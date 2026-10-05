from rest_framework import serializers

from .models import Note, Revision


class RevisionSerializer(serializers.ModelSerializer):
    editor_name = serializers.CharField(source="editor.full_name", read_only=True, default="")

    class Meta:
        model = Revision
        fields = ["id", "editor_name", "summary", "content", "created_at"]


class NoteSerializer(serializers.ModelSerializer):
    revisions = RevisionSerializer(many=True, read_only=True)
    source_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Note
        fields = ["id", "subject", "title", "content", "source_file", "created_at", "updated_at", "revisions"]
        read_only_fields = ["created_at", "updated_at", "revisions"]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        url = ret.get("source_file")
        if url:
            request = self.context.get("request")
            if request and not (url.startswith("http://") or url.startswith("https://")):
                ret["source_file"] = request.build_absolute_uri(url)
            if ret.get("source_file") and "://minio:9000" in ret["source_file"]:
                ret["source_file"] = ret["source_file"].replace("://minio:9000", "://localhost:9000")
        return ret


class CreateNoteSerializer(serializers.ModelSerializer):
    """สร้างโน้ตใหม่ + revision แรกในทีเดียว (ใช้ตอนบันทึกผลจาก OCR หรือสร้างโน้ตพร้อมแนบไฟล์)"""
    source_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Note
        fields = ["id", "subject", "title", "content", "source_file", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        editor = self.context["request"].user
        note = Note.objects.create(**validated_data)
        summary = "สร้างโน้ตพร้อมแนบไฟล์เอกสาร" if note.source_file else "สร้างจากภาพที่สแกน"
        Revision.objects.create(note=note, editor=editor, summary=summary, content=note.content)
        return note

    def to_representation(self, instance):
        return NoteSerializer(instance, context=self.context).data


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
