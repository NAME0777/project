"""

---- core/views.py — OCR, Dashboard และ Note Management ----

"""

import logging

from django.contrib.auth import get_user_model
from django.http import HttpResponse

from django.db.models import Count

from rest_framework import viewsets, permissions, status

from rest_framework.parsers import FormParser, MultiPartParser

from rest_framework.response import Response

from rest_framework.views import APIView



from notes.models import Note, Revision

from subjects.models import Subject, Topic

from .ocr import OcrError, extract_text

from .permissions import IsAdminRole
from .speech import synthesize_audio



User = get_user_model()
logger = logging.getLogger(__name__)



MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB





class OcrView(APIView):

    """Phase 2: OCR จริงด้วย Tesseract (ไทย+อังกฤษ) — รองรับรูปภาพและ PDF"""



    permission_classes = [permissions.IsAuthenticated]

    parser_classes = [MultiPartParser, FormParser]



    def post(self, request):

        upload = request.FILES.get("file")

        if upload is None:

            return Response({"error": "ไม่พบไฟล์ที่อัปโหลด"}, status=400)

        if upload.size > MAX_UPLOAD_SIZE:

            return Response({"error": "ไฟล์ใหญ่เกิน 15 MB"}, status=400)



        content_type = upload.content_type or ""

        try:

            text = extract_text(upload.read(), content_type)

        except OcrError as exc:

            return Response({"error": str(exc)}, status=422)



        if not text:

            return Response(

                {"error": "อ่านข้อความจากไฟล์นี้ไม่ได้เลย ลองถ่ายภาพให้ชัดขึ้นหรือไม่เอียงจนเกินไป"},

                status=422,

            )

        return Response({"text": text})


class SpeechView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text")
        language = request.data.get("language")
        if not isinstance(text, str) or not text.strip():
            return Response({"error": "กรุณาระบุข้อความที่ต้องการอ่าน"}, status=400)
        if len(text) > 20000:
            return Response({"error": "ข้อความยาวเกินไป (จำกัด 20,000 ตัวอักษร)"}, status=400)
        if language not in ("en-US", "th-TH"):
            return Response({"error": "รองรับเฉพาะภาษาอังกฤษและภาษาไทย"}, status=400)

        try:
            audio = synthesize_audio(text, language)
        except Exception:
            logger.exception("Online text-to-speech request failed")
            return Response({"error": "สร้างเสียงอ่านไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง"}, status=502)

        response = HttpResponse(audio, content_type="audio/mpeg")
        response["Cache-Control"] = "no-store"
        return response





class DashboardView(APIView):

    """สถิติภาพรวม — เฉพาะผู้ดูแลระบบ (role=admin)"""



    permission_classes = [permissions.IsAuthenticated, IsAdminRole]



    def get(self, request):

        top_subject = (

            Note.objects.values("subject__code")

            .annotate(total=Count("id"))

            .order_by("-total")

            .first()

        )

        stats = [

            {"label": "โน้ตทั้งหมด", "value": str(Note.objects.count())},

            {"label": "ผู้ใช้งาน", "value": str(User.objects.count())},

            {"label": "รายวิชาทั้งหมด", "value": str(Subject.objects.count())},

            {"label": "วิชาที่มีโน้ตมากที่สุด", "value": (top_subject or {}).get("subject__code", "-")},

        ]

        recent = Revision.objects.select_related("note", "note__subject", "editor").order_by("-created_at")[:10]

        recent_edits = [

            {

                "who": r.editor.full_name if r.editor else "ไม่ทราบผู้แก้ไข",

                "what": f'แก้ไข "{r.note.title}"',

                "subject": r.note.subject.code if r.note and r.note.subject else "-",

                "date": f"{r.created_at.day} {r.created_at.strftime('%b %y')}",

            }

            for r in recent

        ]

        return Response({"stats": stats, "recentEdits": recent_edits})





class NoteDetailView(APIView):

    """API สำหรับดึงข้อมูล, สร้างใหม่ และแก้ไขโน้ต"""



    permission_classes = [permissions.IsAuthenticated]



    def get(self, request, pk):

        """ดึงข้อมูลโน้ต หากไม่พบจะคืนค่า 404 ให้ Frontend ไปแสดงฟอร์มสร้างใหม่"""

        try:

            note = Note.objects.select_related("subject", "author").get(pk=pk)

        except Note.DoesNotExist:

            return Response({"error": "ไม่พบโน้ตนี้"}, status=status.HTTP_404_NOT_FOUND)



        return Response({

            "id": note.id,

            "title": note.title,

            "content": note.content or "",

            "subject_code": note.subject.code if note.subject else "",

            "subject_name": note.subject.name if note.subject else "",

            "author": note.author.full_name if (hasattr(note.author, 'full_name') and note.author.full_name) else str(note.author or "ไม่ทราบผู้เขียน"),

            "updated_at": note.updated_at.strftime("%d %b %Y %H:%M") if hasattr(note, 'updated_at') and note.updated_at else ""

        })



    def post(self, request, pk):

        """สร้างโน้ตใหม่ (กรณีที่ยังไม่มีโน้ตสำหรับ ID นี้)"""

        title = request.data.get("title", "โน้ตใหม่").strip()

        content = request.data.get("content", "")



        # ดึง Topic มาเพื่อผูก Subject (ถ้ามี)

        topic = Topic.objects.filter(pk=pk).first() if 'Topic' in globals() else None

        subject = topic.subject if topic and hasattr(topic, 'subject') else None



        note = Note.objects.create(

            id=pk,  # กำหนด ID ให้ตรงกับที่ Frontend ส่งมา

            title=title,

            content=content,

            subject=subject,

            author=request.user if request.user.is_authenticated else None

        )



        return Response({

            "message": "สร้างโน้ตสำเร็จ",

            "id": note.id,

            "title": note.title,

            "content": note.content

        }, status=status.HTTP_201_CREATED)



    def patch(self, request, pk):

        """บันทึกแก้ไขชื่อหัวข้อ และเนื้อหาโน้ต"""

        try:

            note = Note.objects.get(pk=pk)

        except Note.DoesNotExist:

            return Response({"error": "ไม่พบโน้ตนี้"}, status=status.HTTP_404_NOT_FOUND)



        title = request.data.get("title")

        content = request.data.get("content")

        summary = request.data.get("summary", "แก้ไขโน้ต")



        if title is not None:

            note.title = title.strip()

        if content is not None:

            note.content = content



        note.save()



        Revision.objects.create(

            note=note,

            editor=request.user,

            title=note.title,

            content=note.content,

            summary=summary

        )



        return Response({

            "message": "บันทึกโน้ตสำเร็จ",

            "id": note.id,

            "title": note.title,

            "content": note.content,

        })
class TopicViewSet(viewsets.ModelViewSet):

    """จัดการ Topic และสร้าง Note เปล่าให้อัตโนมัติเมื่อสร้าง Topic ใหม่"""

    def perform_create(self, serializer):

        topic = serializer.save()

        # สร้าง Note เปล่าผูกกับ Topic ทันที
        Note.objects.create(

            id=topic.id,  # ใช้ ID เดียวกับ Topic เพื่อความสอดคล้อง

            subject=topic.subject if hasattr(topic, 'subject') else None,

            title=getattr(topic, 'name', 'หัวข้อใหม่'),

            content="",

            author=self.request.user if self.request.user.is_authenticated else None

        )