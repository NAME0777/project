from rest_framework import serializers
from .models import OCRSource


class OCRSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCRSource
        fields = ["id", "note", "image_file", "extracted_text", "status", "created_at"]
        read_only_fields = ["extracted_text", "status", "created_at"]
