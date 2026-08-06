@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Choretime Monitor

set "NODE=node"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"

if not exist "node_modules\express\package.json" (
  echo [setup] Installing parts (first run only)...
  call npm install
)

call "%NODE%" server-sql.mjs
echo.
echo Server stopped. (check the message above)
pause
