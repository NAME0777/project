from rest_framework.routers import DefaultRouter

from .views import SubjectViewSet, TopicViewSet

router = DefaultRouter()
router.register("topics", TopicViewSet, basename="topic")
router.register("", SubjectViewSet, basename="subject")

urlpatterns = router.urls
