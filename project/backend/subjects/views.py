from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Subject, Topic
from .serializers import SubjectSerializer, TopicSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """ใครล็อกอินแล้วก็อ่านได้ แต่เขียน/แก้/ลบได้เฉพาะผู้ดูแลระบบ (role=admin)"""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)


class SubjectViewSet(viewsets.ModelViewSet):
    """
    นักศึกษา: ดูรายวิชาได้ (GET)
    ผู้ดูแลระบบ: เพิ่ม/แก้ไข/ลบรายวิชาได้ด้วย (ขอบเขตข้อ 1 — ควบคุมเนื้อหาทั้งระบบ)
    """

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["get"])
    def topics(self, request, pk=None):
        subject = self.get_object()
        topics = subject.topics.select_related("note").all()
        return Response(TopicSerializer(topics, many=True).data)


class TopicViewSet(viewsets.ModelViewSet):
    """หัวข้อบทเรียนของแต่ละวิชา — เขียนได้เฉพาะผู้ดูแลระบบเช่นกัน"""

    queryset = Topic.objects.select_related("note").all()
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        return qs.filter(subject_id=subject_id) if subject_id else qs
