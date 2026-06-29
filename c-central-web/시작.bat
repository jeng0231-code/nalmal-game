@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   축사 모니터 - 설치 및 실행
echo ============================================
echo.
echo [1/2] 필요한 부품 설치 중... (처음 한 번만, 1~2분)
call npm install
if errorlevel 1 (
  echo.
  echo 설치 실패. Node.js가 깔려 있는지 확인하세요: https://nodejs.org
  pause
  exit /b 1
)
echo.
echo [2/2] 서버 시작! 이 창을 켜 둔 채로 두세요.
echo   - 이 PC에서 보기 : http://localhost:8080
echo   - 휴대폰에서 보기 : http://192.168.2.3:8080  (같은 WiFi)
echo   - 끄기 : 이 창에서 Ctrl + C
echo.
call npm start
pause
