@echo off
chcp 949 >nul
cd /d "%~dp0"
echo ============================================
echo   농장 자동 설정 (Auto-Discovery)
echo ============================================
echo.
echo 이 PC의 C-Central DB를 읽어 대시보드 설정을 자동으로 만듭니다.
echo (읽기 전용 - 컨트롤러나 DB에 아무것도 쓰지 않습니다)
echo.
echo [1/2] DB 지문 읽는 중...
powershell -ExecutionPolicy Bypass -File "%~dp0discover.ps1"
if errorlevel 1 (
  echo.
  echo 읽기 실패. C-Central 이 켜져 있는지, SQL 인스턴스 이름이 맞는지 확인하세요.
  pause
  exit /b 1
)
echo.
echo [2/2] mapping.json 자동 생성 중...
node "%~dp0build-mapping.mjs"
echo.
echo 완료되었습니다. 미해결 항목이 있으면 위 목록을 확인하세요.
pause
