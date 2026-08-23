from rest_framework.routers import DefaultRouter
from .views import OCRSourceViewSet

router = DefaultRouter()
router.register("ocr", OCRSourceViewSet)

urlpatterns = router.urls
