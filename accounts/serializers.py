from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "student_id", "first_name", "last_name", "password"]

    def validate_email(self, value):
        if not value.endswith("@kmitl.ac.th"):
            raise serializers.ValidationError("ต้องใช้อีเมลของสถาบันเท่านั้น (@kmitl.ac.th)")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data, username=validated_data["email"])
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "student_id", "first_name", "last_name", "role"]
