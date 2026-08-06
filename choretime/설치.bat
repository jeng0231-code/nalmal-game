@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Choretime - Register install (name / contact / address)
echo   After registering, run 시작.bat. Screen opens after admin approval.
echo.
set "NODE=node"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"
call "%NODE%" setup.mjs
echo.
pause
