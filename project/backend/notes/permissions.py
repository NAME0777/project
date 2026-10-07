from rest_framework import permissions


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    สิทธิ์การจัดการ Note:
    - ดู/อ่าน (SAFE_METHODS: GET, HEAD, OPTIONS): อนุญาตผู้ใช้ทุกคนที่ยืนยันตัวตนแล้ว (IsAuthenticated)
    - แก้ไข (PUT, PATCH): อนุญาตเฉพาะ Admin หรือเจ้าของ Note (Author)
    - ลบ (DELETE): อนุญาตเฉพาะ Admin หรือเจ้าของ Note (Author)
    - นักศึกษาไม่สามารถแก้ไขหรือลบ Note ของคนอื่นได้
    """

    message = "คุณไม่มีสิทธิ์ในการจัดการโน้ตนี้"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # 1. การอ่านข้อมูล อนุญาตผู้ใช้ทุกคน
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. ผู้ดูแลระบบ (Admin) สามารถจัดการ (แก้ไข/ลบ) โน้ตได้ทั้งหมด
        if getattr(request.user, "is_admin_role", False) or getattr(request.user, "role", "") == "admin":
            return True

        # 3. นักศึกษา (Student) ต้องเป็นเจ้าของ Note เท่านั้น
        author = getattr(obj, "author", None)
        return bool(author is not None and author == request.user)
