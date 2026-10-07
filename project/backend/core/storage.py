import logging
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from storages.backends.s3 import S3Storage

logger = logging.getLogger(__name__)


class SafeS3Storage(S3Storage):
    """
    S3 / MinIO Storage พร้อม Fallback ไปยัง Local FileSystemStorage อัตโนมัติ
    - หาก MinIO ยังไม่พร้อม, เซิร์ฟเวอร์ล่ม หรือเชื่อมต่อไม่ได้ ระบบจะบันทึกลงใน MEDIA_ROOT แทนทันที
    - ป้องกันไม่ให้เกิด Error 500 ต่อผู้ใช้งาน
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.local_storage = FileSystemStorage(
            location=settings.MEDIA_ROOT,
            base_url=settings.MEDIA_URL,
        )

    def _save(self, name, content):
        try:
            return super()._save(name, content)
        except Exception as exc:
            logger.warning(
                "S3/MinIO upload failed (%s). Falling back to local FileSystemStorage.",
                exc,
            )
            return self.local_storage._save(name, content)

    def _open(self, name, mode="rb"):
        if self.local_storage.exists(name):
            return self.local_storage._open(name, mode)
        try:
            return super()._open(name, mode)
        except Exception as exc:
            logger.warning("S3/MinIO open failed (%s). Trying local storage.", exc)
            return self.local_storage._open(name, mode)

    def exists(self, name):
        if self.local_storage.exists(name):
            return True
        try:
            return super().exists(name)
        except Exception:
            return False

    def url(self, name):
        if self.local_storage.exists(name):
            return self.local_storage.url(name)
        try:
            url_str = super().url(name)
            # ถ้าเป็น URL ที่ชี้ไปยัง minio:9000 ภายในเครือข่าย Docker
            # ให้แปลงเป็น localhost:9000 เพื่อให้เบราว์เซอร์ของไคลเอนต์ภายนอกเข้าถึงได้
            if "://minio:9000" in url_str:
                url_str = url_str.replace("://minio:9000", "://localhost:9000")
            return url_str
        except Exception as exc:
            logger.warning("S3 url generation failed (%s). Falling back to local url.", exc)
            return self.local_storage.url(name)

    def size(self, name):
        if self.local_storage.exists(name):
            return self.local_storage.size(name)
        try:
            return super().size(name)
        except Exception:
            return 0

    def delete(self, name):
        try:
            super().delete(name)
        except Exception:
            pass
        if self.local_storage.exists(name):
            try:
                self.local_storage.delete(name)
            except Exception:
                pass
