from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from notes.models import Note, Revision

from .models import Subject, Topic


class TopicDeletionTests(APITestCase):
	def setUp(self):
		self.admin = User.objects.create_user(
			email="admin-test@kmitl.ac.th",
			password="test-password",
			full_name="Admin Test",
			role=User.Role.ADMIN,
		)
		self.client.force_authenticate(user=self.admin)
		self.subject = Subject.objects.create(code="TEST101", name="Test Subject", term="1/2569")
		self.note = Note.objects.create(subject=self.subject, title="Test Wiki", content="Wiki content")
		self.topic = Topic.objects.create(subject=self.subject, order=1, title="Test Wiki", note=self.note)
		self.revision = Revision.objects.create(
			note=self.note,
			editor=self.admin,
			summary="Initial",
			content=self.note.content,
		)

	def test_deleting_topic_removes_linked_note_and_revisions(self):
		response = self.client.delete(reverse("topic-detail", kwargs={"pk": self.topic.pk}))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Topic.objects.filter(pk=self.topic.pk).exists())
		self.assertFalse(Note.objects.filter(pk=self.note.pk).exists())
		self.assertFalse(Revision.objects.filter(pk=self.revision.pk).exists())
