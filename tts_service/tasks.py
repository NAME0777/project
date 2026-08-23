from celery import shared_task
from django.core.files.base import ContentFile
import io

from .models import NoteAudio

try:
    from gtts import gTTS
except ImportError:
    gTTS = None


@shared_task
def generate_tts(audio_id: int):
    audio = NoteAudio.objects.get(id=audio_id)
    try:
        tts = gTTS(text=audio.note.content, lang="th")
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        buffer.seek(0)

        audio.audio_file.save(f"note_{audio.note.id}.mp3", ContentFile(buffer.read()))
        audio.status = NoteAudio.Status.COMPLETED
        audio.save(update_fields=["audio_file", "status"])
    except Exception:
        audio.status = NoteAudio.Status.FAILED
        audio.save(update_fields=["status"])

    return audio.status
