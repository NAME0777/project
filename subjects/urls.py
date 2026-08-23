from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, SemesterTopicViewSet

router = DefaultRouter()
router.register("subjects", SubjectViewSet)
router.register("topics", SemesterTopicViewSet)

urlpatterns = router.urls
