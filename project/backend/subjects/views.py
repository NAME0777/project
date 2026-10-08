from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import Subject, Topic
from .serializers import SubjectSerializer, TopicSerializer


class CanCreateOrAdminOnly(permissions.BasePermission):
    """
    ผู้ใช้ทุกคนที่ล็อกอินแล้ว (รวมนักศึกษา): อ่าน (GET) และเพิ่มรายการใหม่ (POST) ได้
    ผู้ดูแลระบบ (Admin) เท่านั้น: แก้ไข (PUT/PATCH) หรือลบ (DELETE)
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS or request.method == "POST":
            return True
        return bool(request.user.is_admin_role)


class SubjectViewSet(viewsets.ModelViewSet):
    """
    นักศึกษา: ดูรายวิชาได้ (GET) และเพิ่มรายวิชาใหม่ได้ (POST)
    ผู้ดูแลระบบ: แก้ไข/ลบรายวิชาได้ (PUT, PATCH, DELETE)
    """

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [CanCreateOrAdminOnly]

    def perform_destroy(self, instance):
        notes = instance.notes.exclude(source_file="").exclude(source_file__isnull=True)
        for note in notes:
            note.source_file.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["get"])
    def topics(self, request, pk=None):
        subject = self.get_object()
        topics = subject.topics.select_related("note").all()
        return Response(TopicSerializer(topics, many=True).data)


class TopicViewSet(viewsets.ModelViewSet):
    """
    นักศึกษา: ดูหัวข้อ (GET) และเพิ่มหัวข้อบทเรียนใหม่ได้ (POST)
    ผู้ดูแลระบบ: แก้ไข/ลบหัวข้อบทเรียนได้ (PUT, PATCH, DELETE)
    """

    queryset = Topic.objects.select_related("note").all()
    serializer_class = TopicSerializer
    permission_classes = [CanCreateOrAdminOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        return qs.filter(subject_id=subject_id) if subject_id else qs

    @transaction.atomic
    def perform_destroy(self, instance):
        note = instance.note
        if note is not None:
            if note.source_file:
                note.source_file.delete(save=False)
            note.delete()
        instance.delete()
