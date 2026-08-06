@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    축사 모니터 - 새 농장 설치 (원클릭)
echo ============================================
echo.
echo  이 프로그램은 컨트롤러 정보를 읽기만 합니다(쓰기 없음).
echo  설치 후 관리자 승인을 받아야 화면이 열립니다.
echo.

echo [1/5] 필요한 부품 설치... (처음 한 번만, 1~2분)
call npm install
if errorlevel 1 (
  echo.
  echo  [실패] Node.js 가 설치돼 있어야 합니다 → https://nodejs.org 에서 LTS 설치 후 다시 실행
  pause & exit /b 1
)

echo.
echo [2/5] 기존 설정 백업
if exist mapping.json copy /y mapping.json mapping.backup.json >nul

echo.
echo [3/5] 이 농장 컨트롤러 자동 인식 (DB 읽기)
set "INST=localhost\FCENTRAL_EXPRESS"
set /p INST=  SQL 인스턴스 이름 [기본값 그대로면 Enter] (%INST%):
powershell -NoProfile -ExecutionPolicy Bypass -File "discover\discover.ps1" -Instance "%INST%"
if not exist "discover\discovery.json" (
  echo.
  echo  [실패] DB 를 못 읽었습니다. SQL 인스턴스 이름을 확인하세요.
  echo         C-Central 이 설치된 PC 에서 실행해야 합니다.
  pause & exit /b 1
)

echo.
echo [4/5] 설정 자동 생성
call node "discover\build-mapping.mjs"
if errorlevel 1 ( echo  [실패] 설정 생성 오류 & pause & exit /b 1 )

echo.
echo [5/5] 설치 등록 (이름 / 연락처 / 주소 입력)
call node setup.mjs

echo.
echo ============================================
echo    설치 완료! 서버를 시작합니다.
echo    화면은 "관리자 승인" 후 열립니다.
echo    (이 창은 켜 둔 채로 두세요)
echo ============================================
echo.
call npm start
pause
