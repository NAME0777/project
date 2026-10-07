from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from subjects.models import Subject, Topic
from notes.models import Note, Revision


class NoteOwnershipAndPermissionsTests(APITestCase):
    def setUp(self):
        # สร้างผู้ใช้ 3 คน: Student A, Student B, Admin
        self.student_a = User.objects.create_user(
            email="student_a@kmitl.ac.th",
            password="password123",
            full_name="Student A",
            role=User.Role.STUDENT,
            student_id="66010001",
        )
        self.student_b = User.objects.create_user(
            email="student_b@kmitl.ac.th",
            password="password123",
            full_name="Student B",
            role=User.Role.STUDENT,
            student_id="66010002",
        )
        self.admin_user = User.objects.create_user(
            email="admin@kmitl.ac.th",
            password="adminpassword",
            full_name="Admin Instructor",
            role=User.Role.ADMIN,
        )

        # สร้างวิชาตัวอย่าง
        self.subject = Subject.objects.create(
            code="01076001",
            name="Computer Programming",
            term="1/2569",
        )

        # สร้าง Topic ตัวอย่าง
        self.topic = Topic.objects.create(
            subject=self.subject,
            order=1,
            title="Introduction to Python",
        )

    def test_01_student_a_creates_note_sets_author(self):
        """1. Student A สร้าง Note -> Note.author ต้องเป็น Student A"""
        self.client.force_authenticate(user=self.student_a)
        response = self.client.post(
            reverse("note-create"),
            {
                "subject": self.subject.id,
                "title": "Python Basics by A",
                "content": "Variables, Loops, and Functions",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        note_id = response.data["id"]

        note = Note.objects.get(pk=note_id)
        self.assertEqual(note.author, self.student_a)
        self.assertEqual(response.data["author_id"], self.student_a.id)
        self.assertEqual(response.data["author_name"], "Student A")

    def test_02_student_a_can_edit_own_note(self):
        """2. Student A แก้ไข Note ของตัวเองได้ตาม rule"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="Original Title",
            content="Original Content",
        )
        self.client.force_authenticate(user=self.student_a)
        response = self.client.patch(
            reverse("note-detail", kwargs={"pk": note.pk}),
            {"title": "Updated Title", "content": "Updated Content by A"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        note.refresh_from_db()
        self.assertEqual(note.title, "Updated Title")
        self.assertEqual(note.content, "Updated Content by A")
        # author ต้องไม่เปลี่ยน
        self.assertEqual(note.author, self.student_a)

    def test_03_student_b_cannot_delete_student_a_note(self):
        """3. Student B ไม่สามารถลบ Note ของ Student A (ได้ 403 Forbidden)"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="A Note",
            content="Sensitive content",
        )
        self.client.force_authenticate(user=self.student_b)
        response = self.client.delete(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Note ยังคงอยู่ในระบบ
        self.assertTrue(Note.objects.filter(pk=note.pk).exists())

    def test_04_student_b_cannot_bypass_permission_via_direct_delete(self):
        """4. Student B ไม่สามารถ bypass permission ผ่าน DELETE API โดยตรง"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="Protected Note",
            content="Must not be deleted",
        )
        # Unauthenticated request -> 401
        self.client.logout()
        response_unauth = self.client.delete(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(response_unauth.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Note.objects.filter(pk=note.pk).exists())

        # Authenticate as Student B -> 403
        self.client.force_authenticate(user=self.student_b)
        response_student_b = self.client.delete(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(response_student_b.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Note.objects.filter(pk=note.pk).exists())

    def test_05_admin_can_delete_student_note(self):
        """5. Admin สามารถลบ Note ของ Student ได้ (ได้ 204 No Content)"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="Note to be deleted by Admin",
            content="Content",
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=note.pk).exists())

    def test_06_deleted_note_cannot_be_retrieved(self):
        """6. Note ที่ถูกลบไม่สามารถเรียกกลับมาได้ตาม endpoint เดิม (ได้ 404 Not Found)"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="A Note to Delete",
            content="Bye",
        )
        self.client.force_authenticate(user=self.student_a)
        del_resp = self.client.delete(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

        # เรียก GET ซ้ำ ต้องได้ 404
        get_resp = self.client.get(reverse("note-detail", kwargs={"pk": note.pk}))
        self.assertEqual(get_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_07_revisions_work_and_author_remains_unchanged(self):
        """7. Revision ของ Note เดิมยังทำงานปกติ และ author ไม่เปลี่ยนหลังแก้ไข"""
        note = Note.objects.create(
            subject=self.subject,
            author=self.student_a,
            title="Wiki Note",
            content="V1 Content",
        )
        Revision.objects.create(
            note=note,
            editor=self.student_a,
            summary="Initial version",
            content="V1 Content",
        )

        # แก้ไขผ่าน RevisionCreateView
        self.client.force_authenticate(user=self.student_a)
        rev_resp = self.client.post(
            reverse("note-revision-create", kwargs={"pk": note.pk}),
            {"title": "Wiki Note Updated", "content": "V2 Content", "summary": "Edited V2"},
            format="json",
        )
        self.assertEqual(rev_resp.status_code, status.HTTP_200_OK)

        note.refresh_from_db()
        self.assertEqual(note.content, "V2 Content")
        # author ยังคงเป็น Student A
        self.assertEqual(note.author, self.student_a)
        # ตรวจสอบว่ามี 2 revisions
        self.assertEqual(note.revisions.count(), 2)

    def test_08_existing_notes_before_migration_load_safely(self):
        """8. Existing Notes ที่มีอยู่ก่อน migration (author=None) ยังเปิดได้ปกติ"""
        legacy_note = Note.objects.create(
            subject=self.subject,
            author=None,  # ไม่มี author จำลองข้อมูลเดิม
            title="Legacy Note",
            content="Old notes content",
        )
        # นักศึกษาทุกคนสามารถเปิดอ่านได้
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get(reverse("note-detail", kwargs={"pk": legacy_note.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["author"])
        self.assertIsNone(response.data["author_id"])
        self.assertEqual(response.data["author_name"], "")

        # นักศึกษาไม่สามารถลบ Note ที่ไม่มีผู้เขียนได้
        del_student = self.client.delete(reverse("note-detail", kwargs={"pk": legacy_note.pk}))
        self.assertEqual(del_student.status_code, status.HTTP_403_FORBIDDEN)

        # Admin สามารถลบ Legacy Note ได้
        self.client.force_authenticate(user=self.admin_user)
        del_admin = self.client.delete(reverse("note-detail", kwargs={"pk": legacy_note.pk}))
        self.assertEqual(del_admin.status_code, status.HTTP_204_NO_CONTENT)
