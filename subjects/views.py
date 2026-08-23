from rest_framework import viewsets, permissions
from .models import Subject, SemesterTopic
from .serializers import SubjectSerializer, SemesterTopicSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class SemesterTopicViewSet(viewsets.ModelViewSet):
    queryset = SemesterTopic.objects.all()
    serializer_class = SemesterTopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs
