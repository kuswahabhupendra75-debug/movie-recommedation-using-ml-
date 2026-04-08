@echo off
title CineHybrid - Starting...
color 0A

echo.
echo ============================================
echo   CineHybrid AI Movie Recommender v3.0
echo ============================================
echo.

REM Change to project root
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Run: python -m venv .venv
    echo Then: .venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)

REM Install/update dependencies silently
echo [1/3] Checking dependencies...
.venv\Scripts\pip.exe install psycopg2-binary uvicorn fastapi --quiet --no-warn-script-location

REM Start Backend in new window
echo [2/3] Starting Backend on http://localhost:8000 ...
start "CineHybrid Backend" cmd /k ".venv\Scripts\uvicorn.exe backend.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo [3/3] Starting Frontend on http://localhost:5173 ...
start "CineHybrid Frontend" cmd /k "cd frontend && npm run dev"

REM Wait and open browser
timeout /t 4 /nobreak >nul
echo.
echo ============================================
echo   Both servers are running!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
start http://localhost:5173

echo Press any key to stop all servers...
pause >nul

REM Kill both servers
taskkill /FI "WINDOWTITLE eq CineHybrid Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CineHybrid Frontend" /F >nul 2>&1
echo Servers stopped. Goodbye!
