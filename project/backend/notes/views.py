import json
from django.http import Http404
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Note, Revision
from .serializers import CreateNoteSerializer, NoteSerializer
from subjects.models import Topic


class NoteDetailView(generics.RetrieveUpdateAPIView):
    """รองรับทั้งดูรายละเอียด (GET) และแก้ไข/แนบไฟล์ใหม่ (PUT, PATCH) แบบ multipart/form-data"""
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        pk = self.kwargs.get("pk")

        # 1. ค้นหา Note จาก PK ตรงๆ
        note = Note.objects.prefetch_related("revisions", "revisions__editor").filter(pk=pk).first()
        if note:
            return note

        # 2. ค้นหาจาก Topic ID
        topic = Topic.objects.filter(pk=pk).first()
        if topic:
            # ดึง Note หรือสร้าง Note ใหม่
            note, _ = Note.objects.get_or_create(
                pk=pk,
                defaults={
                    "title": topic.title,
                    "content": "",
                    "subject": topic.subject,
                }
            )
            return note

        raise Http404("ไม่พบข้อมูลโน้ต")

    def perform_update(self, serializer):
        old_content = serializer.instance.content
        note = serializer.save()
        summary = self.request.data.get("summary")
        if not summary:
            if "source_file" in self.request.FILES:
                summary = "อัปเดตไฟล์แนบต้นฉบับ"
            elif old_content != note.content:
                summary = "แก้ไขเนื้อหาโน้ต"
            else:
                summary = "อัปเดตข้อมูลโน้ต"
        Revision.objects.create(
            note=note,
            editor=self.request.user,
            summary=summary,
            content=note.content,
        )


class NoteCreateView(generics.CreateAPIView):
    """รองรับการสร้างโน้ตใหม่ พร้อมอัปโหลดไฟล์แนบ source_file แบบ multipart/form-data"""
    serializer_class = CreateNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class RevisionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _unwrap_payload(self, data):
        current = data
        title = None
        content = None
        summary = None

        for _ in range(5):
            if isinstance(current, dict):
                if "title" in current and current["title"]:
                    title = current["title"]
                if "summary" in current and current["summary"]:
                    summary = current["summary"]
                if "content" in current:
                    current = current["content"]
                else:
                    break
            elif isinstance(current, str):
                cleaned = current.strip()
                if cleaned.startswith("{") or cleaned.startswith("{'"):
                    try:
                        valid_json = cleaned.replace("'", '"')
                        current = json.loads(valid_json)
                    except Exception:
                        content = current
                        break
                else:
                    content = current
                    break
            else:
                content = str(current)
                break

        if content is None and isinstance(current, str):
            content = current

        return title, content or "", summary

    def post(self, request, pk):
        extracted_title, extracted_content, extracted_summary = self._unwrap_payload(request.data)

        title = str(extracted_title or request.data.get("title") or "หัวข้อใหม่").strip()
        content = str(extracted_content)
        summary = str(extracted_summary or request.data.get("summary") or "แก้ไขโน้ต").strip()

        # 1. อัปเดต/หา Topic
        topic = Topic.objects.filter(pk=pk).first()
        if topic and title and title != "หัวข้อใหม่":
            topic.title = title
            topic.save()

        # 2. อัปเดต/สร้าง Note
        note = Note.objects.filter(pk=pk).first()
        created = False
        if not note:
            note = Note.objects.create(
                pk=pk,
                title=title if topic is None else topic.title,
                content=content,
                subject=topic.subject if topic else None
            )
            created = True
        else:
            note.title = title if (title and title != "หัวข้อใหม่") else note.title
            note.content = content
            if topic:
                note.subject = topic.subject
            note.save()

        # 3. จัดการไฟล์แนบ source_file (ถ้ามีส่งมาแบบ multipart/form-data)
        if "source_file" in request.FILES:
            note.source_file = request.FILES["source_file"]
            note.save(update_fields=["source_file"])

        # 4. สร้าง Revision บันทึกเนื้อหา
        Revision.objects.create(
            note=note,
            editor=request.user,
            summary=summary,
            content=content
        )

        return Response(
            NoteSerializer(note, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )