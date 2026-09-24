#!/usr/bin/env bash
# เทียบเท่า start.bat สำหรับ macOS/Linux
set -e
cd "$(dirname "$0")"

[ -d node_modules ] || { echo "[1/3] ติดตั้งเครื่องมือหลัก..."; npm install; }
[ -d backend/node_modules ] || { echo "[2/3] ติดตั้ง dependency ของ backend..."; npm install --prefix backend; }
[ -d frontend/node_modules ] || { echo "[3/3] ติดตั้ง dependency ของ frontend..."; npm install --prefix frontend; }

echo
echo "กำลังเปิด backend (:4000) และ frontend (:5173)..."
echo "เปิดเบราว์เซอร์ไปที่ http://localhost:5173 ได้เลย"
echo "กด Ctrl+C เพื่อหยุดทั้งสองระบบ"
echo
npm run dev
