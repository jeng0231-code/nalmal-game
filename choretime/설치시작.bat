@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - New Farm Setup (one click)
echo    (reads controller info only; no writes)
echo ============================================
echo.

echo [1/5] Installing parts (npm install)... first time takes 1-2 min
call npm install
if errorlevel 1 (
  echo.
  echo   [FAIL] Node.js is required. Install LTS from https://nodejs.org then run again.
  pause & exit /b 1
)

echo.
echo [2/5] Backing up existing config...
if exist mapping.json copy /y mapping.json mapping.backup.json >nul

echo.
echo [3/5] Auto-detecting this farm's controller (reading DB)...
powershell -NoProfile -ExecutionPolicy Bypass -File "discover\discover.ps1"
if not exist "discover\discovery.json" (
  echo.
  echo   [FAIL] Could not read the DB. Run this on the C-Central PC.
  echo          If your SQL instance name differs, edit discover\discover.ps1 default.
  pause & exit /b 1
)

echo.
echo [4/5] Generating config (mapping.json)...
call node "discover\build-mapping.mjs"

echo.
echo [5/5] Register this install (name / contact / address)
call node setup.mjs

echo.
echo ============================================
echo    Done. Starting server...
echo    The screen opens after the admin approves you.
echo    Keep this window open. (stop: Ctrl + C)
echo ============================================
echo.
call npm start
pause
