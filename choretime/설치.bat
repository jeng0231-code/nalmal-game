@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Choretime - Register install (name / contact / address)
echo   After registering, run 시작.bat. Screen opens after admin approval.
echo.
call node setup.mjs
echo.
pause
