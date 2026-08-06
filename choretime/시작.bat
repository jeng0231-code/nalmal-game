@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Choretime Monitor

set "NODE=node"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"

rem stop any old server holding port 8088 so new settings load
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

if not exist "node_modules\express\package.json" call npm install

echo.
echo ============================================
echo    Starting server... keep this window open.
echo    External URL appears below in a moment.
echo    (stop: Ctrl + C)
echo ============================================
echo.
"%NODE%" server-sql.mjs

echo.
echo (server stopped) - press a key to close.
pause >nul
