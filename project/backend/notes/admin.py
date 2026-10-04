from django.contrib import admin

from .models import Note, Revision


class RevisionInline(admin.TabularInline):
    model = Revision
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ["title", "subject", "updated_at"]
    list_filter = ["subject"]
    search_fields = ["title", "content"]
    inlines = [RevisionInline]
