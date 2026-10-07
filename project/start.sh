#!/usr/bin/env bash
# เทียบเท่า start.bat สำหรับ macOS/Linux
set -e
cd "$(dirname "$0")"

command -v python3 >/dev/null || { echo "ไม่พบ python3 กรุณาลงจาก https://www.python.org ก่อน"; exit 1; }
command -v node >/dev/null || { echo "ไม่พบ Node.js กรุณาลงจาก https://nodejs.org ก่อน"; exit 1; }
command -v tesseract >/dev/null || echo "[คำเตือน] ไม่พบ tesseract — ฟีเจอร์ OCR จะใช้ไม่ได้ (ระบบส่วนอื่นยังปกติ) ลงด้วย: brew install tesseract tesseract-lang poppler"

[ -d backend/venv ] || { echo "[1/4] สร้าง Python virtual environment..."; python3 -m venv backend/venv; }

echo "[2/4] ติดตั้ง dependency ของ backend..."
backend/venv/bin/pip install -q -r backend/requirements.txt

[ -f backend/.env ] || { cp backend/.env.example backend/.env; echo "  สร้าง backend/.env แล้ว แก้ DATABASE_URL ให้ตรงกับ PostgreSQL ของคุณก่อนใช้งานจริง"; }

echo "[3/4] เตรียมฐานข้อมูล (migrate)..."
backend/venv/bin/python backend/manage.py migrate

[ -d frontend/node_modules ] || { echo "[4/4] ติดตั้ง dependency ของ frontend..."; npm install --prefix frontend; }

echo
echo "กำลังเปิด backend (:8000) และ frontend (:5173)..."
echo "เปิดเบราว์เซอร์ไปที่ http://localhost:5173 ได้เลย"
echo "กด Ctrl+C เพื่อหยุดทั้งสองระบบ"
echo

cleanup() { kill $(jobs -p) 2>/dev/null; }
trap cleanup EXIT

(cd backend && ../backend/venv/bin/python manage.py runserver 8000) &
(cd frontend && npm run dev) &
wait
