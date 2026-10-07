# Backend — Notes Hub API (Django + DRF + PostgreSQL)

**Phase 1 ของแผนพัฒนา** (ดู `../README.md` สำหรับแผนทั้งหมด) — ครอบคลุมขอบเขตข้อ 1-2 ของเอกสารอนุมัติหัวข้อ:
ระบบสมาชิก 2 ระดับ (นักศึกษา/ผู้ดูแลระบบ) และระบบจัดหมวดหมู่รายวิชา+คลังโน้ต

## สแต็กที่ใช้

- **Django 6 + Django REST Framework** — เว็บเฟรมเวิร์กหลัก + REST API
- **PostgreSQL** — ฐานข้อมูลหลัก (ผ่าน `DATABASE_URL`)
- **djangorestframework-simplejwt** — ออก JWT (access/refresh token) ตอน login จริง ไม่ใช่ mock
- **Google OAuth (google-auth)** — ตรวจ Google ID token ก่อนสร้าง/ล็อกอินบัญชีนักศึกษา
- **django-storages + boto3** — พร้อมต่อ **minIO** (S3-compatible) สำหรับเก็บไฟล์แนบ เปิดใช้ด้วย `USE_S3_STORAGE=True`
- **Tesseract OCR (ผ่าน pytesseract + pdf2image)** — แปลงรูปภาพ/PDF เป็นข้อความ ไทย+อังกฤษ (Phase 2)

## ติดตั้ง dependency ระดับระบบ (ต้องมีก่อน pip install)

OCR (Phase 2) ใช้โปรแกรมภายนอกที่ pip ติดตั้งให้ไม่ได้ ต้องลงเองก่อน:

```bash
# Ubuntu/Debian
sudo apt install tesseract-ocr tesseract-ocr-tha poppler-utils

# macOS (Homebrew)
brew install tesseract tesseract-lang poppler

# Windows
# ลง Tesseract-OCR (UB-Mannheim build มีภาษาไทยให้เลือกตอนติดตั้ง) จาก
# https://github.com/UB-Mannheim/tesseract/wiki
# และลง Poppler for Windows แล้วเพิ่ม path ทั้งสองตัวใน PATH ของระบบ
```

## เริ่มใช้งาน (dev)

ต้องมี PostgreSQL รันอยู่ก่อน (ในเครื่องหรือ Docker ก็ได้)

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # แก้ DATABASE_URL ให้ตรงกับ Postgres ของคุณ
# ตั้ง GOOGLE_CLIENT_ID ใน backend/.env และ VITE_GOOGLE_CLIENT_ID ใน frontend/.env.local

python manage.py migrate
python manage.py runserver 8000
```

ระบบไม่สร้างบัญชีหรือโน้ตตัวอย่างอัตโนมัติ สร้างผู้ดูแลระบบด้วย `python manage.py createsuperuser`; นักศึกษาสมัคร/เข้าสู่ระบบด้วยบัญชี Google ของสถาบัน

## โครงสร้างแอป

```
backend/
├─ config/          settings.py (Postgres/JWT/CORS/minIO), urls.py
├─ accounts/        User model (email login, role: student/admin), register/login/me
├─ subjects/        Subject, Topic
├─ notes/           Note, Revision (บันทึกทุกเวอร์ชัน ไม่ทับของเดิม)
└─ core/            permission ร่วม (IsAdminRole), OCR (mock), Dashboard (สถิติจริงจาก DB)
```

## Endpoint ทั้งหมด

| Method | Path | สิทธิ์ | หน้าที่ |
| --- | --- | --- | --- |
| POST | `/api/auth/register/` | ทุกคน | สมัครสมาชิก (ได้สิทธิ์นักศึกษาเท่านั้น) |
| POST | `/api/auth/login/` | ทุกคน | ล็อกอิน คืน JWT + ข้อมูลผู้ใช้ |
| POST | `/api/auth/google/` | ทุกคน | ตรวจ Google ID token และล็อกอิน/สร้างบัญชีนักศึกษา KMITL |
| GET | `/api/auth/me/` | ล็อกอินแล้ว | ข้อมูลตัวเอง |
| GET | `/api/subjects/` | ล็อกอินแล้ว | รายวิชาทั้งหมด |
| POST | `/api/subjects/` | **ผู้ดูแลระบบเท่านั้น** | เพิ่มรายวิชาใหม่ |
| DELETE | `/api/subjects/:id/` | **ผู้ดูแลระบบเท่านั้น** | ลบรายวิชา (ลบหัวข้อ/โน้ตในวิชาไปด้วย) |
| GET | `/api/subjects/:id/topics/` | ล็อกอินแล้ว | หัวข้อของวิชานั้น พร้อม `has_note` |
| POST | `/api/subjects/topics/` | **ผู้ดูแลระบบเท่านั้น** | เพิ่มหัวข้อบทเรียนใหม่ |
| DELETE | `/api/subjects/topics/:id/` | **ผู้ดูแลระบบเท่านั้น** | ลบหัวข้อบทเรียน |
| GET | `/api/notes/:id/` | ล็อกอินแล้ว | โน้ต + ประวัติทุกเวอร์ชัน |
| POST | `/api/notes/` | ล็อกอินแล้ว | สร้างโน้ตใหม่ (ใช้ตอนบันทึกผล OCR) |
| POST | `/api/notes/:id/revisions/` | ล็อกอินแล้ว | บันทึกเวอร์ชันใหม่ |
| POST | `/api/ocr/` | ล็อกอินแล้ว | แปลงภาพ/PDF เป็นข้อความ (ไทย+อังกฤษ ด้วย Tesseract — ของจริง) |
| GET | `/api/dashboard/` | **ผู้ดูแลระบบเท่านั้น** | สถิติภาพรวม (คำนวณจริงจาก DB) |
| `/admin/` | — | staff | Django admin — จัดการข้อมูลทุกตารางได้โดยตรง |

## ผู้ดูแลระบบสร้างยังไง

ฟอร์มสมัครสมาชิกสร้างได้แค่บัญชีนักศึกษา (ตามที่ระบุในเอกสารขอบเขต — สิทธิ์ผู้ดูแลระบบต้องถูกมอบ ไม่ใช่สมัครเอง)
สร้างผ่านคำสั่งนี้แทน:

```bash
python manage.py createsuperuser
```

หรือแก้ role ผู้ใช้ที่มีอยู่แล้วผ่าน `/admin/`

## ต่อ minIO (เก็บไฟล์แนบ/รูปสแกน)

ค่าเริ่มต้น (`USE_S3_STORAGE=False`) เก็บไฟล์ไว้ในโฟลเดอร์ `backend/media/` ธรรมดา
พอมี minIO พร้อมใช้งานจริง แก้ `.env`:

```
USE_S3_STORAGE=True
AWS_ACCESS_KEY_ID=<จาก minIO>
AWS_SECRET_ACCESS_KEY=<จาก minIO>
AWS_STORAGE_BUCKET_NAME=notes-hub
AWS_S3_ENDPOINT_URL=http://<minio-host>:9000
```
ไม่ต้องแก้โค้ด — `config/settings.py` สลับให้อัตโนมัติ

## จุดที่ยังเป็น mock (รอ Phase ถัดไป)

- **Text-to-Speech** — ยังไม่มี endpoint (Phase 3)
- **Wiki diff/version compare แบบเห็นภาพ** — มี Revision เก็บครบทุกเวอร์ชันแล้ว แต่ยังไม่มี diff viewer (Phase 4)
