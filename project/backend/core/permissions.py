"""---- core/permissions.py — permission ที่ใช้ร่วมกันหลายแอป ----"""
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """เฉพาะผู้ใช้ role=admin เท่านั้น (คนละเรื่องกับ Django is_staff)"""

    message = "ต้องเป็นผู้ดูแลระบบเท่านั้น"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)
