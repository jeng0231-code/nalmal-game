@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Choretime Monitor

rem --- use bundled node.exe if present, else system node ---
set "NODE=node"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"

rem --- install parts only if not already bundled ---
if not exist "node_modules\express\package.json" (
  echo [setup] Installing parts (first run only, 1-2 min)...
  call "%NODE%" -v >nul 2>&1 || (
    echo   [FAIL] Node.js not found. Bundled build should include node.exe.
    echo          Or install LTS from https://nodejs.org then run again.
    pause & exit /b 1
  )
  call npm install
)

echo.
echo ============================================
echo    Starting server...
echo    The external URL appears below in a moment.
echo    Keep this window open. (stop: Ctrl + C)
echo ============================================
echo.
call "%NODE%" server-sql.mjs
pause
