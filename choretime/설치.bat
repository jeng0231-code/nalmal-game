@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   축사 모니터 - 설치 등록
echo   이름/연락처/주소를 입력하면 관리자 승인 후 사용할 수 있습니다.
echo.
node setup.mjs
echo.
pause
