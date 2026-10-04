from django.contrib import admin

from .models import Subject, Topic


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 1


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "term"]
    search_fields = ["code", "name"]
    inlines = [TopicInline]
