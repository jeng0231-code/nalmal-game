@echo off
cd /d "%~dp0"
echo ============================================
echo   축사 모니터 - 설치 및 실행
echo ============================================
echo.
echo [1/2] 필요한 부품 설치 중... (처음 한 번만, 1~2분 걸립니다)
call npm install
if errorlevel 1 (
  echo.
  echo 설치 실패. Node.js가 설치되어 있는지 확인하세요: https://nodejs.org
  pause
  exit /b 1
)
echo.
echo [2/2] 서버 시작! 잠시 후 아래에 접속 주소가 표시됩니다.
echo 이 창은 켜 둔 채로 두세요.  (끄기: Ctrl + C)
echo.
call npm start
pause
