@echo off
setlocal

set PYTHONUTF8=1
echo ============================================
echo   Notes Hub - Starting (Django + React)
echo ============================================

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found. Install it from https://www.python.org first.
    pause
    exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install it from https://nodejs.org first.
    pause
    exit /b 1
)
where tesseract >nul 2>nul
if errorlevel 1 (
    echo [WARNING] Tesseract OCR not found - the OCR feature will not work.
    echo Install from https://github.com/UB-Mannheim/tesseract/wiki and add it to PATH.
    echo The rest of the app will still work fine. Press any key to continue...
    pause >nul
)

if not exist backend\venv (
    echo [1/4] Creating Python virtual environment for backend...
    python -m venv backend\venv
)

echo [2/4] Installing backend dependencies...
call backend\venv\Scripts\pip.exe install -q -r backend\requirements.txt
if errorlevel 1 goto :error

if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo   Created backend\.env from the example file. Edit DATABASE_URL to match your PostgreSQL setup.
)

echo [3/4] Preparing database (migrate)...
call backend\venv\Scripts\python.exe backend\manage.py migrate

if not exist frontend\node_modules (
    echo [4/4] Installing frontend dependencies...
    call npm install --prefix frontend
    if errorlevel 1 goto :error
)

echo.
echo Starting backend (:8000) and frontend (:5173) in separate windows...
echo Open your browser at http://localhost:5173
echo Close both windows to stop the app.
echo.

start "Notes Hub - Backend (Django)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe manage.py runserver 8000"
start "Notes Hub - Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

goto :end

:error
echo.
echo Something went wrong during setup. Check the messages above and try again.
pause
exit /b 1

:end
pause
