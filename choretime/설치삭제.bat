@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - Uninstall / Remove
echo ============================================
echo.
echo  Stopping monitor and removing this install's registration...
taskkill /F /IM node.exe >nul 2>&1
schtasks /Delete /TN "ChoretimeMonitor" /F >nul 2>&1
del /q license.json >nul 2>&1
del /q .machine-id >nul 2>&1
del /q mapping.json >nul 2>&1
echo.
echo  Done. This install is removed.
echo   - You can now close this window and delete this folder.
echo   - Ask the admin to remove/suspend this farm on the board.
echo.
echo  Press any key to close.
pause >nul
