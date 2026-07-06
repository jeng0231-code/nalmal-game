@echo off
chcp 949 >nul
cd /d "%~dp0"
echo ============================================
echo   축사 모니터 업데이트
echo ============================================
echo.
git fetch origin
git checkout claude/c-central-mobile-web-r2n1jf
git pull origin claude/c-central-mobile-web-r2n1jf
echo.
if errorlevel 1 (
  echo [!] 업데이트 중 문제가 있었습니다. 위 메시지를 확인하세요.
) else (
  echo [OK] 최신으로 업데이트되었습니다.
  echo 이 창을 닫고 시작.bat 을 다시 실행하세요.
)
pause
