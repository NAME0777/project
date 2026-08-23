from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import OCRSource
from .serializers import OCRSourceSerializer
from .tasks import process_ocr


class OCRSourceViewSet(viewsets.ModelViewSet):
    queryset = OCRSource.objects.all()
    serializer_class = OCRSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        ocr = serializer.save()
        # ส่งงานไปประมวลผลเบื้องหลังผ่าน Celery ไม่ block request
        process_ocr.delay(ocr.id)

    @action(detail=True, methods=["get"], url_path="status")
    def check_status(self, request, pk=None):
        ocr = self.get_object()
        return Response(
            {
                "status": ocr.status,
                "extracted_text": ocr.extracted_text,
            }
        )
