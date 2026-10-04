"""
---- accounts/models.py — ผู้ใช้ระบบ 2 ระดับ: นักศึกษา CE และผู้ดูแลระบบ ----
ตรงตามขอบเขตข้อ 1: "ระบบจัดการผู้ใช้งานและการยืนยันตัวตน รองรับผู้ใช้งาน 2 ระดับ"
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models


class UserManager(BaseUserManager):
    """ผู้ใช้ล็อกอินด้วยอีเมล ไม่ใช้ username แบบ Django ปกติ"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("ต้องระบุอีเมล")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """ผู้ใช้ระบบ — ลบ username เดิมของ Django ออก ใช้อีเมลแทน"""

    username = None

    class Role(models.TextChoices):
        STUDENT = "student", "นักศึกษา"
        ADMIN = "admin", "ผู้ดูแลระบบ"

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    student_id = models.CharField(
        max_length=8,
        blank=True,
        null=True,
        validators=[RegexValidator(r"^\d{8}$", "รหัสนักศึกษาต้องเป็นตัวเลข 8 หลัก")],
        help_text="จำเป็นสำหรับนักศึกษา ไม่บังคับสำหรับผู้ดูแลระบบ",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN
