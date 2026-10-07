"""
---- accounts/views.py — สมัครสมาชิก / ล็อกอิน (ออก JWT จริง) / ดูโปรไฟล์ตัวเอง ----
"""
import logging
import re

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.exceptions import GoogleAuthError, InvalidValue
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not isinstance(credential, str) or not credential:
            return Response({"detail": "ไม่พบข้อมูลยืนยันตัวตนจาก Google"}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "ยังไม่ได้ตั้งค่า Google Sign-In"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            claims = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60,
            )
        except InvalidValue as error:
            reason = str(error)
            if reason.startswith("Token has wrong audience"):
                logger.warning("Google ID token rejected: audience mismatch")
                return Response(
                    {"detail": "Google Client ID ฝั่งเว็บไม่ตรงกับ backend กรุณา refresh หน้าเว็บแล้วลองใหม่"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if reason.startswith("Token used too early"):
                logger.warning("Google ID token rejected: issued-at is ahead of server time")
                return Response(
                    {"detail": "เวลาของ token Google ไม่ตรงกับเครื่อง กรุณาตรวจเวลาเครื่องแล้วลองใหม่"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if reason.startswith("Token expired"):
                logger.warning("Google ID token rejected: token expired")
                return Response(
                    {"detail": "Google token หมดอายุ กรุณากดเข้าสู่ระบบด้วย Google อีกครั้ง"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if "requires the cryptography package" in reason:
                logger.error("Google ID token rejected: cryptography verifier unavailable")
            elif reason.startswith("Unsupported signature algorithm"):
                logger.warning("Google ID token rejected: unsupported signature algorithm")
            else:
                logger.warning("Google ID token verification failed (InvalidValue)")
            return Response({"detail": "ข้อมูลยืนยันตัวตนจาก Google ไม่ถูกต้อง"}, status=status.HTTP_401_UNAUTHORIZED)
        except (GoogleAuthError, ValueError) as error:
            logger.warning(
                "Google ID token verification failed (%s)",
                type(error).__name__,
            )
            return Response({"detail": "ข้อมูลยืนยันตัวตนจาก Google ไม่ถูกต้อง"}, status=status.HTTP_401_UNAUTHORIZED)

        email = claims.get("email", "").lower()
        domain = settings.ALLOWED_EMAIL_DOMAIN.lower()
        local_part, separator, email_domain = email.partition("@")
        if (
            not claims.get("email_verified")
            or not separator
            or email_domain != domain
            or claims.get("hd", "").lower() != domain
        ):
            return Response({"detail": f"ใช้ได้เฉพาะบัญชี Google ของสถาบัน (@{domain})"}, status=status.HTTP_403_FORBIDDEN)

        if not re.fullmatch(r"\d{8}", local_part):
            return Response({"detail": "อีเมลต้องขึ้นต้นด้วยรหัสนักศึกษา 8 หลัก"}, status=status.HTTP_400_BAD_REQUEST)

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": claims.get("name", "").strip() or local_part,
                "student_id": local_part,
                "role": User.Role.STUDENT,
            },
        )
        if not user.is_active:
            return Response({"detail": "บัญชีนี้ถูกระงับการใช้งาน"}, status=status.HTTP_403_FORBIDDEN)
        if user.role != User.Role.STUDENT:
            return Response({"detail": "บัญชีผู้ดูแลระบบให้เข้าสู่ระบบด้วยวิธีปกติ"}, status=status.HTTP_403_FORBIDDEN)
        if user.student_id != local_part:
            return Response({"detail": "รหัสนักศึกษาในบัญชีไม่ตรงกับอีเมล"}, status=status.HTTP_409_CONFLICT)

        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
