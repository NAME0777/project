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
    subject_code = serializers.CharField(source="subject.code", read_only=True, default="")
    subject_name = serializers.CharField(source="subject.name", read_only=True, default="")

    class Meta:
        model = Note
        fields = [
            "id",
            "subject",
            "subject_code",
            "subject_name",
            "title",
            "content",
            "source_file",
            "created_at",
            "updated_at",
            "revisions",
        ]
        read_only_fields = ["created_at", "updated_at", "revisions", "subject_code", "subject_name"]

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
    topic = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Note
        fields = ["id", "subject", "title", "content", "source_file", "topic", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        from django.db.models import Max
        from subjects.models import Topic

        editor = self.context["request"].user
        topic_id = validated_data.pop("topic", None)
        note = Note.objects.create(**validated_data)
        summary = "สร้างโน้ตพร้อมแนบไฟล์เอกสาร" if note.source_file else "สร้างโน้ตใหม่"
        Revision.objects.create(note=note, editor=editor, summary=summary, content=note.content)

        if topic_id:
            Topic.objects.filter(id=topic_id).update(note=note)
        elif not note.source_file and note.subject:
            max_order = Topic.objects.filter(subject=note.subject).aggregate(Max("order"))["order__max"] or 0
            Topic.objects.create(
                subject=note.subject,
                order=max_order + 1,
                title=note.title,
                note=note,
            )

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
