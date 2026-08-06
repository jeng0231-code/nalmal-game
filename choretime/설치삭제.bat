@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - Uninstall / Remove
echo ============================================
echo.
echo  This stops the monitor and removes this install's
echo  registration (license.json, machine id).
echo.
set /p OK=Continue? (Y/N):
if /I not "%OK%"=="Y" ( echo Canceled. & pause & exit /b 0 )

echo.
echo [1/3] Stopping server...
taskkill /F /IM node.exe >nul 2>&1

echo [2/3] Removing autostart (if set)...
if exist "자동시작해제.bat" ( call "자동시작해제.bat" >nul 2>&1 )
schtasks /Delete /TN "ChoretimeMonitor" /F >nul 2>&1

echo [3/3] Removing registration files...
del /q license.json >nul 2>&1
del /q .machine-id >nul 2>&1
del /q mapping.json >nul 2>&1

echo.
echo Done. This install is removed.
echo  - To fully delete: close this window and delete this folder.
echo  - Ask the admin to remove/suspend this farm on the board.
echo.
pause
