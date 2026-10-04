# Notes Hub — ระบบรวบรวมโน้ตเรียนประจำวิชา (Academic Notes Collection Platform)

สาขาวิศวกรรมคอมพิวเตอร์ ภาควิศวกรรมศาสตร์ สจล. วิทยาเขตชุมพรเขตรอุดมศักดิ์ — โครงงานปีการศึกษา 2569

## สแต็กที่ใช้ (ตามเอกสารอนุมัติหัวข้อ)

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React.js + TypeScript + Tailwind CSS |
| Backend | Python + Django + Django REST Framework |
| Database | PostgreSQL |
| File Storage | minIO (S3-compatible) |

```
project/
├─ backend/              Django + DRF API (พอร์ต 8000) — ดู backend/README.md
├─ frontend/              React + Vite (พอร์ต 5173) — ดู frontend/README.md
├─ docker-compose.yml     รันทั้งระบบ (db + pgAdmin + backend + frontend) ด้วยคำสั่งเดียว
├─ docker/pgadmin-servers.json   ให้ pgAdmin เห็น DB อัตโนมัติ ไม่ต้องตั้งเอง
├─ start.bat              ดับเบิลคลิกรันแบบไม่ใช้ Docker (Windows)
└─ start.sh               รันแบบไม่ใช้ Docker (macOS/Linux)
```

## รันเดโม

มี 2 ทางเลือก — ใช้ทางไหนก็ได้ ไม่ต้องทำทั้งคู่

### ทางเลือก A: Docker (แนะนำ — ไม่ต้องลง Python/Node/PostgreSQL เองเลย)

ต้องมีแค่ [Docker Desktop](https://www.docker.com/products/docker-desktop/) ในเครื่อง

```bash
docker compose up --build
```

รอให้ทุก service ขึ้น (ครั้งแรกจะช้าหน่อยเพราะต้องโหลด image + ลง dependency) แล้วเปิด:

| ที่อยู่ | คืออะไร |
| --- | --- |
| http://localhost:5173 | เว็บแอป (frontend) |
| http://localhost:8000/api | Django REST API |
| **http://localhost:5050** | **pgAdmin4** — ดู/แก้ข้อมูลในฐานข้อมูลผ่านเบราว์เซอร์ ไม่ต้องลง pgAdmin เองในเครื่อง |

ล็อกอิน pgAdmin ด้วย `admin@notes-hub.local` / `admin123` เซิร์ฟเวอร์ "Notes Hub (Docker)" ถูกตั้งไว้ให้อัตโนมัติแล้ว กดเข้าไปแล้วใส่รหัสฐานข้อมูล `postgres` (รหัสที่ตั้งไว้ใน `docker-compose.yml`) ครั้งแรกครั้งเดียว

หยุดทั้งระบบ: `docker compose down` (เติม `-v` ถ้าอยากลบข้อมูลในฐานข้อมูลด้วย)

แก้โค้ดได้ตามปกติแล้วเห็นผลทันทีโดยไม่ต้อง build ใหม่ (โฟลเดอร์ `backend/` และ `frontend/` ถูก mount เข้า container แบบ live)

### ทางเลือก B: ลงเองในเครื่อง (ไม่ใช้ Docker)

ต้องมี Python 3.11+, Node.js, และ PostgreSQL รันอยู่ในเครื่อง

**Windows:** ดับเบิลคลิก `start.bat`
**macOS/Linux:** `./start.sh`

ทั้งสองแบบจะสร้าง virtualenv, ติดตั้ง dependency, migrate ฐานข้อมูล, seed ข้อมูลตัวอย่าง แล้วเปิดทั้ง backend+frontend ให้อัตโนมัติ เปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

(ดู pgAdmin ของการติดตั้งแบบนี้ได้ตามปกติผ่าน pgAdmin4 ที่ลงเองในเครื่อง ต่อด้วย host `localhost`, port `5432`, รหัสผ่านที่ตั้งไว้ใน `backend\.env`)

## แผนการพัฒนาแบบ Phase (ตรงตามขอบเขตในเอกสารอนุมัติ)

พัฒนาทีละ Phase แล้ว **tag ใน git ทุกครั้งที่ Phase หนึ่งเสร็จและทดสอบผ่าน** — ถ้า Phase ถัดไปพังหรือมีช่องโหว่ ให้ `git checkout <tag ของ phase ก่อนหน้า>` แล้วแตก branch ใหม่จากจุดนั้นแทนที่จะแก้ของพังต่อ

| Tag | ขอบเขต (ตามเอกสาร) | สถานะ |
| --- | --- | --- |
| `phase-0-prototype` | โปรโตไทป์ mock ด้วย Node.js/Express (ของเดิมก่อนปรับสแต็ก) | เก็บไว้อ้างอิงเท่านั้น |
| `phase-1-foundation` | เทอม1 ข้อ 1-2: DB & System Design, ระบบสมาชิก 2 ระดับ, จัดหมวดหมู่รายวิชา+คลังโน้ต | **เสร็จ** |
| `phase-2-ocr` | เทอม1 ข้อ 5: ระบบแปลงภาพเป็นข้อความ (OCR) ของจริง | **เสร็จ — จุดนี้** |
| `phase-3-tts` | เทอม1 ข้อ 6: ระบบแปลงข้อความเป็นเสียง (Text-to-Speech) | ยังไม่เริ่ม |
| `phase-4-wiki` | เทอม1 ข้อ 7: แก้ไขโน้ตร่วมกันแบบวิกิ + Diff Viewer | ยังไม่เริ่ม |
| `phase-5-testing-t1` | เทอม1 ข้อ 8: ทดสอบระบบเบื้องต้น (Unit Testing) | ยังไม่เริ่ม |
| `phase-6-qa-board` | เทอม2 ข้อ 1: ระบบถาม-ตอบประจำรายวิชา | ยังไม่เริ่ม |
| `phase-7-profanity` | เทอม2 ข้อ 2: กรองคำหยาบอัตโนมัติ | ยังไม่เริ่ม |
| `phase-8-dashboard` | เทอม2 ข้อ 3: ขยาย Dashboard ผู้ดูแลระบบให้ครบ | ยังไม่เริ่ม (มีพื้นฐานสถิติแล้วใน Phase 1) |
| `phase-9-responsive` | เทอม2 ข้อ 5: ปรับ Responsive เต็มรูปแบบ | ยังไม่เริ่ม |
| `phase-10-integration` | เทอม2 ข้อ 6: ทดสอบครบวงจร + แก้ข้อบกพร่อง | ยังไม่เริ่ม |
| `phase-11-deploy` | เทอม2 ข้อ 7: Deploy ขึ้นเซิร์ฟเวอร์จริง | ยังไม่เริ่ม |

### วิธีย้อนกลับไป Phase ก่อนหน้า

```bash
git checkout phase-1-foundation      # ดูโค้ด ณ จุดนั้นเฉย ๆ
git checkout -b fix/retry-phase-2 phase-1-foundation   # แตก branch ใหม่พัฒนาต่อจากจุดนั้น
```

### สิ่งที่ Phase 1 ทำสำเร็จแล้ว

- ออกแบบฐานข้อมูล PostgreSQL จริง (User, Subject, Topic, Note, Revision) — migrate ผ่านและทดสอบแล้ว
- ระบบสมาชิก 2 สิทธิ์ (นักศึกษา/ผู้ดูแลระบบ) ล็อกอินด้วยอีเมลสถาบัน+รหัสผ่านจริง ออก JWT จริง (ไม่ใช่ mock role selector แบบก่อนหน้า)
- คลังโน้ต: รายวิชา → หัวข้อ → โน้ต พร้อมระบบเก็บทุกเวอร์ชันที่เคยแก้ (ของเดิมไม่ถูกทับ)
- Dashboard ผู้ดูแลระบบคำนวณสถิติจริงจาก DB (ไม่ใช่ตัวเลขปลอมแบบเดิม)
- โครงสร้างพร้อมต่อ minIO ทันทีที่มีเซิร์ฟเวอร์ minIO จริง (สลับด้วย env var เดียว ไม่ต้องแก้โค้ด)
- **OCR จริง (Phase 2):** แปลงรูปภาพและ PDF เป็นข้อความด้วย Tesseract รองรับภาษาไทย+อังกฤษพร้อมกัน
  ทดสอบแล้วว่าอ่านได้แม่นยำทั้งสองภาษา ไฟล์ต้นฉบับที่อัปโหลดถูกเก็บแนบไว้กับโน้ตที่สร้างด้วย

### สิ่งที่ยัง mock อยู่ (รอ Phase ถัดไป)

- ยังไม่มี Text-to-Speech, Wiki diff viewer, Q&A board, ตัวกรองคำหยาบ, Google OAuth

รายละเอียดเชิงลึกของแต่ละฝั่งอยู่ใน `backend/README.md` และ `frontend/README.md`
