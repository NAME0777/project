from rest_framework import serializers
from .models import Subject, SemesterTopic


class SemesterTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SemesterTopic
        fields = ["id", "semester", "topic_title", "order_index"]


class SubjectSerializer(serializers.ModelSerializer):
    topics = SemesterTopicSerializer(many=True, read_only=True)
    topic_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ["id", "code", "name", "topics", "topic_count"]

    def get_topic_count(self, obj):
        return obj.topics.count()
