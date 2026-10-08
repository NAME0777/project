"""
============================================================
URLS — รวมทุก endpoint ของ API (Phase 1)
============================================================
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from core.views import DashboardView, OcrView, SpeechView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/subjects/", include("subjects.urls")),
    path("api/notes/", include("notes.urls")),
    path("api/ocr/", OcrView.as_view(), name="ocr"),
    path("api/speech/", SpeechView.as_view(), name="speech"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
