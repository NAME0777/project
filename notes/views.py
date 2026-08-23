from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Note, NoteRevision
from .serializers import NoteSerializer, NoteUpdateSerializer


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        topic_id = self.request.query_params.get("topic")
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs

    def perform_create(self, serializer):
        note = serializer.save(created_by=self.request.user)
        # บันทึก revision แรกทันทีที่สร้างโน้ต
        NoteRevision.objects.create(
            note=note,
            content_snapshot=note.content,
            edited_by=self.request.user,
            edit_summary="สร้างโน้ตเริ่มต้น",
        )

    @action(detail=True, methods=["post"], url_path="edit")
    def wiki_edit(self, request, pk=None):
        """
        Endpoint เฉพาะสำหรับแก้ไขแบบ wiki:
        - อัปเดต content ปัจจุบันของ Note
        - สร้าง NoteRevision ใหม่เก็บ history ไว้ (ไม่ทับของเดิม)
        """
        note = self.get_object()
        serializer = NoteUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_content = serializer.validated_data["content"]
        summary = serializer.validated_data.get("edit_summary", "แก้ไขเนื้อหา")

        note.content = new_content
        note.save(update_fields=["content", "updated_at"])

        revision = NoteRevision.objects.create(
            note=note,
            content_snapshot=new_content,
            edited_by=request.user,
            edit_summary=summary,
        )

        return Response(
            {
                "message": "บันทึกเวอร์ชันใหม่สำเร็จ",
                "note": NoteSerializer(note).data,
                "revision_id": revision.id,
            },
            status=201,
        )

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        """ดึงประวัติการแก้ไขทั้งหมดของโน้ตนี้"""
        note = self.get_object()
        revisions = note.revisions.all()
        from .serializers import NoteRevisionSerializer
        return Response(NoteRevisionSerializer(revisions, many=True).data)

    @action(detail=True, methods=["post"], url_path="revert/(?P<revision_id>[^/.]+)")
    def revert(self, request, pk=None, revision_id=None):
        """ย้อนกลับไปใช้เนื้อหาจาก revision เก่า (สร้าง revision ใหม่จากของเก่า)"""
        note = self.get_object()
        try:
            target_revision = note.revisions.get(id=revision_id)
        except NoteRevision.DoesNotExist:
            return Response({"detail": "ไม่พบ revision นี้"}, status=404)

        note.content = target_revision.content_snapshot
        note.save(update_fields=["content", "updated_at"])

        new_revision = NoteRevision.objects.create(
            note=note,
            content_snapshot=target_revision.content_snapshot,
            edited_by=request.user,
            edit_summary=f"ย้อนกลับไปยังเวอร์ชันของ {target_revision.edited_by} ({target_revision.edited_at:%d/%m/%Y})",
        )

        return Response(
            {
                "message": "ย้อนกลับเวอร์ชันสำเร็จ",
                "note": NoteSerializer(note).data,
                "revision_id": new_revision.id,
            },
            status=201,
        )
