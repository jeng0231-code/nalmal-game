@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - Update (no git needed)
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1"
if errorlevel 1 (
  echo.
  echo   [FAIL] Update failed. Check the messages above.
  echo          (Check internet connection, then try again.)
) else (
  echo.
  echo   [OK] Done. Close this window and run 시작.bat again.
)
pause
