from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from notes.models import Note
from .models import NoteAudio
from .tasks import generate_tts


class NoteAudioViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="generate/(?P<note_id>[^/.]+)")
    def generate(self, request, note_id=None):
        note = Note.objects.get(id=note_id)

        # Cache: ถ้ามีไฟล์เสียงที่สำเร็จแล้ว ใช้ของเดิม ไม่ generate ซ้ำ
        existing = NoteAudio.objects.filter(note=note, status=NoteAudio.Status.COMPLETED).first()
        if existing:
            return Response({"audio_url": existing.audio_file.url, "cached": True})

        audio = NoteAudio.objects.create(note=note)
        generate_tts.delay(audio.id)

        return Response({"message": "กำลังสร้างไฟล์เสียง โปรดตรวจสอบสถานะอีกครั้ง", "audio_id": audio.id})

    @action(detail=True, methods=["get"], url_path="status")
    def check_status(self, request, pk=None):
        audio = NoteAudio.objects.get(id=pk)
        return Response(
            {
                "status": audio.status,
                "audio_url": audio.audio_file.url if audio.audio_file else None,
            }
        )
