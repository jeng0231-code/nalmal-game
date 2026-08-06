@echo off
chcp 949 >nul
cd /d "%~dp0"
echo ============================================
echo   윈도우 시작 시 자동 실행 등록
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=New-Object -ComObject WScript.Shell; $p=Join-Path ([Environment]::GetFolderPath('Startup')) '축사모니터.lnk'; $s=$w.CreateShortcut($p); $s.TargetPath='%~dp0서버시작.bat'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save(); Write-Host ('등록됨: ' + $p)"
echo.
echo 이제 PC를 켜고 로그인하면 서버가 자동으로(최소화 상태로) 실행됩니다.
echo 해제하려면 자동시작해제.bat 를 실행하세요.
pause
