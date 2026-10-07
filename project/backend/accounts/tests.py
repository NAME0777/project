from unittest.mock import patch

from google.auth.exceptions import InvalidValue
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import User


@override_settings(GOOGLE_CLIENT_ID="test-client-id", ALLOWED_EMAIL_DOMAIN="kmitl.ac.th")
class GoogleLoginTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	@patch("accounts.views.id_token.verify_oauth2_token")
	def test_creates_student_from_verified_institution_account(self, verify_token):
		verify_token.return_value = {
			"email": "66200122@kmitl.ac.th",
			"email_verified": True,
			"hd": "kmitl.ac.th",
			"name": "Student Name",
		}

		response = self.client.post("/api/auth/google/", {"credential": "valid-token"}, format="json")

		self.assertEqual(response.status_code, 200)
		user = User.objects.get(email="66200122@kmitl.ac.th")
		self.assertEqual(user.student_id, "66200122")
		self.assertEqual(user.role, User.Role.STUDENT)
		self.assertEqual(response.data["user"]["full_name"], "Student Name")
		self.assertIn("access", response.data)
		self.assertEqual(verify_token.call_args.kwargs["clock_skew_in_seconds"], 60)

	@patch("accounts.views.id_token.verify_oauth2_token")
	def test_rejects_unverified_or_non_institution_email(self, verify_token):
		invalid_claims = [
			{"email": "66200122@kmitl.ac.th", "email_verified": False, "hd": "kmitl.ac.th"},
			{"email": "66200122@gmail.com", "email_verified": True, "hd": "gmail.com"},
			{"email": "student@kmitl.ac.th", "email_verified": True, "hd": "kmitl.ac.th"},
		]

		for claims in invalid_claims:
			with self.subTest(claims=claims):
				verify_token.return_value = claims
				response = self.client.post("/api/auth/google/", {"credential": "valid-token"}, format="json")
				self.assertIn(response.status_code, (400, 403))

		self.assertFalse(User.objects.exists())

	@patch("accounts.views.id_token.verify_oauth2_token")
	def test_does_not_allow_admin_google_login(self, verify_token):
		User.objects.create_user(
			email="66200122@kmitl.ac.th",
			password="admin-password",
			full_name="Administrator",
			student_id="66200122",
			role=User.Role.ADMIN,
		)
		verify_token.return_value = {
			"email": "66200122@kmitl.ac.th",
			"email_verified": True,
			"hd": "kmitl.ac.th",
			"name": "Administrator",
		}

		response = self.client.post("/api/auth/google/", {"credential": "valid-token"}, format="json")

		self.assertEqual(response.status_code, 403)
		self.assertEqual(User.objects.get(email="66200122@kmitl.ac.th").role, User.Role.ADMIN)

	@patch("accounts.views.id_token.verify_oauth2_token")
	def test_reports_audience_mismatch_without_echoing_token(self, verify_token):
		verify_token.side_effect = InvalidValue("Token has wrong audience token-secret, expected configured-client")

		response = self.client.post("/api/auth/google/", {"credential": "token-secret"}, format="json")

		self.assertEqual(response.status_code, 401)
		self.assertIn("Client ID", response.data["detail"])
		self.assertNotIn("token-secret", response.data["detail"])
