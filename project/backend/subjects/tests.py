from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

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


class SubjectDeletionTests(APITestCase):
	def test_deleting_subject_removes_linked_note_attachment(self):
		admin = User.objects.create_user(
			email="subject-delete-admin@kmitl.ac.th",
			password="test-password",
			full_name="Admin Test",
			role=User.Role.ADMIN,
		)
		self.client.force_authenticate(user=admin)
		subject = Subject.objects.create(code="DEL101", name="Delete Subject", term="1/2569")
		note = Note.objects.create(
			subject=subject,
			title="Attached Wiki",
			content="Wiki content",
			source_file="notes/subject-delete/attachment.pdf",
		)
		Topic.objects.create(subject=subject, order=1, title=note.title, note=note)
		file_name = note.source_file.name

		with patch.object(note.source_file.storage, "delete") as delete_file:
			response = self.client.delete(reverse("subject-detail", kwargs={"pk": subject.pk}))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		delete_file.assert_called_once_with(file_name)
		self.assertFalse(Subject.objects.filter(pk=subject.pk).exists())
		self.assertFalse(Note.objects.filter(pk=note.pk).exists())
