@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo     Smart Retail India - Development Server
echo ===================================================
echo.

REM Check if root or subproject node_modules are missing
if not exist "node_modules" (
    echo [INFO] First time setup detected. Installing all dependencies and seeding database...
    call npm.cmd run setup
) else (
    if not exist "server\node_modules" (
        echo [INFO] Server dependencies missing. Installing...
        call npm.cmd install
    )
    if not exist "client\node_modules" (
        echo [INFO] Client dependencies missing. Installing...
        call npm.cmd install
    )
    if not exist "server\data\retail.db" (
        echo [INFO] Database file not found. Seeding initial database...
        call npm.cmd run seed
    )
)

echo.
echo [INFO] Starting Backend (Port 5000) and Frontend (Port 5173)...
echo [INFO] Open in your browser: http://localhost:5173
echo [INFO] Backend API:          http://localhost:5000
echo.
call npm.cmd run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Dev server stopped with code %ERRORLEVEL%.
    pause
)
