"""
---- accounts/serializers.py — แปลงข้อมูลผู้ใช้ + ตรวจฟอร์มสมัคร/ล็อกอิน ----
"""
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "student_id"]
        read_only_fields = fields


def _validate_institution_email(email: str) -> None:
    domain = settings.ALLOWED_EMAIL_DOMAIN
    if not email.endswith(f"@{domain}"):
        raise serializers.ValidationError(f"ใช้ได้เฉพาะอีเมลของสถาบัน ลงท้ายด้วย @{domain}")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    student_id = serializers.RegexField(r"^\d{8}$", error_messages={"invalid": "รหัสนักศึกษาเป็นตัวเลข 8 หลัก"})

    class Meta:
        model = User
        fields = ["email", "full_name", "student_id", "password"]

    def validate_email(self, value):
        _validate_institution_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("อีเมลนี้ถูกใช้สมัครไปแล้ว")
        return value

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("กรอกชื่อ-นามสกุลก่อน")
        return value

    def create(self, validated_data):
        # สมัครผ่านฟอร์มนี้ได้เฉพาะสิทธิ์นักศึกษาเท่านั้น — ผู้ดูแลระบบสร้างผ่าน createsuperuser/admin
        return User.objects.create_user(role=User.Role.STUDENT, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        _validate_institution_email(attrs["email"])
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        if not user.is_active:
            raise serializers.ValidationError("บัญชีนี้ถูกระงับการใช้งาน")
        attrs["user"] = user
        return attrs
