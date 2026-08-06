@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - New Farm Setup (one click)
echo    (reads controller info only; no writes)
echo ============================================
echo.

rem --- use bundled node.exe if present, else system node ---
set "NODE=node"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"

echo [1/6] Preparing parts...
if exist "node_modules\express\package.json" (
  echo   Already bundled. Skipping download.
) else (
  echo   Installing parts (npm install)... first time takes 1-2 min
  call "%NODE%" -v >nul 2>&1 || (
    echo   [FAIL] Node.js is required. Install LTS from https://nodejs.org then run again.
    pause & exit /b 1
  )
  call npm install
  if errorlevel 1 (
    echo.
    echo   [FAIL] Node.js is required. Install LTS from https://nodejs.org then run again.
    pause & exit /b 1
  )
)

echo.
echo [2/6] Backing up existing config...
if exist mapping.json copy /y mapping.json mapping.backup.json >nul

echo.
echo [3/6] Auto-detecting this farm's controller (reading DB)...
powershell -NoProfile -ExecutionPolicy Bypass -File "discover\discover.ps1"
if not exist "discover\discovery.json" (
  echo.
  echo   [FAIL] Could not read the DB. Run this on the C-Central PC.
  pause & exit /b 1
)

echo.
echo [4/6] Generating config (mapping.json)...
call "%NODE%" "discover\build-mapping.mjs"

echo.
echo [5/6] Downloading external-access tool (cloudflared)... first time only
if not exist cloudflared.exe (
  powershell -NoProfile -Command "try{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe' -UseBasicParsing}catch{Write-Host '   (download failed; server will retry on start)'}"
)

echo.
echo [6/6] Register this install (name / contact / address)
call "%NODE%" setup.mjs

echo.
echo ============================================
echo    Done. Starting server...
echo    The external URL appears below in a moment.
echo    The screen opens after the admin approves you.
echo    Keep this window open. (stop: Ctrl + C)
echo ============================================
echo.
call "%NODE%" server-sql.mjs
pause
