from unittest.mock import AsyncMock, patch

from edge_tts.exceptions import NoAudioReceived
from rest_framework.test import APITestCase

from accounts.models import User
from core.speech import synthesize_audio


class SpeechViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="speech-test@kmitl.ac.th",
            password="password123",
            full_name="Speech Test",
            student_id="66019999",
        )

    def test_requires_authentication(self):
        response = self.client.post("/api/speech/", {"text": "Hello", "language": "en-US"}, format="json")
        self.assertEqual(response.status_code, 401)

    @patch("core.views.synthesize_audio", return_value=b"fake-mp3")
    def test_returns_audio_for_supported_language(self, synthesize_audio):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/speech/", {"text": "Hello", "language": "en-US"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "audio/mpeg")
        self.assertEqual(response.content, b"fake-mp3")
        synthesize_audio.assert_called_once_with("Hello", "en-US")

    def test_rejects_unsupported_language(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/speech/", {"text": "Bonjour", "language": "fr-FR"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_retries_when_online_service_returns_no_audio(self):
        with patch("core.speech._generate_audio", new_callable=AsyncMock) as generate_audio:
            with patch("core.speech.asyncio.sleep", new_callable=AsyncMock):
                generate_audio.side_effect = [NoAudioReceived("No audio"), b"fake-mp3"]
                self.assertEqual(synthesize_audio("Hello", "en-US"), b"fake-mp3")

        self.assertEqual(generate_audio.await_count, 2)