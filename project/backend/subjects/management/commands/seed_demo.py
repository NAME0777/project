"""
---- seed_demo — สร้างข้อมูลตัวอย่างสำหรับ dev/demo (รันซ้ำได้ปลอดภัย) ----
ใช้: python manage.py seed_demo
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from notes.models import Note, Revision
from subjects.models import Subject, Topic

User = get_user_model()


class Command(BaseCommand):
    help = "สร้างผู้ดูแลระบบ + รายวิชา + โน้ตตัวอย่าง สำหรับทดสอบระบบ"

    @transaction.atomic
    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email="admin@kmitl.ac.th",
            defaults={"full_name": "ผู้ดูแลระบบ", "role": User.Role.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("สร้างผู้ดูแลระบบ: admin@kmitl.ac.th / admin123"))

        student, created = User.objects.get_or_create(
            email="66200122@kmitl.ac.th",
            defaults={"full_name": "ธีรภัทร์ อามาตย์", "role": User.Role.STUDENT, "student_id": "66200122"},
        )
        if created:
            student.set_password("student123")
            student.save()
            self.stdout.write(self.style.SUCCESS("สร้างนักศึกษา: 66200122@kmitl.ac.th / student123"))

        subjects_data = [
            ("CS204", "โครงสร้างข้อมูลและขั้นตอนวิธี", "1/2569"),
            ("CS310", "ระบบฐานข้อมูล", "1/2569"),
            ("CS255", "วิศวกรรมซอฟต์แวร์", "1/2569"),
        ]
        subjects = {}
        for code, name, term in subjects_data:
            subj, _ = Subject.objects.get_or_create(code=code, defaults={"name": name, "term": term})
            subjects[code] = subj

        topics_data = [
            ("CS204", 1, "Array และ Linked List"),
            ("CS204", 2, "Stack และ Queue"),
            ("CS204", 3, "Tree และ Binary Search Tree"),
            ("CS310", 1, "รู้จักระบบฐานข้อมูล"),
            ("CS310", 2, "ER Diagram"),
            ("CS310", 3, "Normalization"),
            ("CS255", 1, "SDLC Models"),
        ]
        topic_objs = {}
        for code, order, title in topics_data:
            topic, _ = Topic.objects.get_or_create(subject=subjects[code], order=order, defaults={"title": title})
            topic_objs[(code, order)] = topic

        if not Note.objects.filter(title="Normalization").exists():
            content = (
                "Normalization คือกระบวนการจัดโครงสร้างตารางเพื่อลดความซ้ำซ้อนของข้อมูล\n\n"
                "1NF — ทุกคอลัมน์เก็บค่าเดียว (atomic value)\n"
                "2NF — ผ่าน 1NF และไม่มี partial dependency\n"
                "3NF — ผ่าน 2NF และไม่มี transitive dependency"
            )
            note = Note.objects.create(subject=subjects["CS310"], title="Normalization", content=content)
            Revision.objects.create(note=note, editor=student, summary="สร้างโน้ตครั้งแรก", content=content)
            topic_objs[("CS310", 3)].note = note
            topic_objs[("CS310", 3)].save()

        if not Note.objects.filter(title="Tree และ Binary Search Tree").exists():
            content = (
                "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge\n\n"
                "Binary Search Tree (BST) คือ Tree ที่แต่ละโหนดมีลูกได้ไม่เกิน 2 โหนด\n"
                "กติกา: ค่าทางซ้ายน้อยกว่าโหนดแม่ ค่าทางขวามากกว่าโหนดแม่"
            )
            note = Note.objects.create(subject=subjects["CS204"], title="Tree และ Binary Search Tree", content=content)
            Revision.objects.create(note=note, editor=student, summary="สร้างจากภาพที่สแกน", content=content)
            topic_objs[("CS204", 3)].note = note
            topic_objs[("CS204", 3)].save()

        self.stdout.write(self.style.SUCCESS("Seed ข้อมูลตัวอย่างเสร็จแล้ว"))
