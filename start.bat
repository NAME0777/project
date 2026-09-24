@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Notes Hub - เริ่มระบบ (backend + frontend)
echo ============================================

if not exist node_modules (
    echo [1/3] ติดตั้งเครื่องมือหลัก...
    call npm install
    if errorlevel 1 goto :error
)

if not exist backend\node_modules (
    echo [2/3] ติดตั้ง dependency ของ backend...
    call npm install --prefix backend
    if errorlevel 1 goto :error
)

if not exist frontend\node_modules (
    echo [3/3] ติดตั้ง dependency ของ frontend...
    call npm install --prefix frontend
    if errorlevel 1 goto :error
)

echo.
echo กำลังเปิด backend (:4000) และ frontend (:5173)...
echo เปิดเบราว์เซอร์ไปที่ http://localhost:5173 ได้เลย
echo กด Ctrl+C เพื่อหยุดทั้งสองระบบ
echo.

call npm run dev
goto :end

:error
echo.
echo เกิดข้อผิดพลาดระหว่างติดตั้ง ดูข้อความด้านบนแล้วลองใหม่
pause
exit /b 1

:end
pause
