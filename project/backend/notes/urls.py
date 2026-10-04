from django.urls import path

from .views import NoteCreateView, NoteDetailView, RevisionCreateView

urlpatterns = [
    path("", NoteCreateView.as_view(), name="note-create"),
    path("<int:pk>/", NoteDetailView.as_view(), name="note-detail"),
    path("<int:pk>/revisions/", RevisionCreateView.as_view(), name="note-revision-create"),
]
