from django.urls import path
from .views import NoteAudioViewSet

urlpatterns = [
    path("tts/generate/<int:note_id>/", NoteAudioViewSet.as_view({"post": "generate"}), name="tts-generate"),
    path("tts/<int:pk>/status/", NoteAudioViewSet.as_view({"get": "check_status"}), name="tts-status"),
]
