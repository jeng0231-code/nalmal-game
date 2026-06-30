@echo off
chcp 949 >nul
cd /d "%~dp0"
title 축사 모니터 서버
if not exist node_modules (
  echo 최초 1회 부품 설치 중...
  call npm install
)
node server-sql.mjs
echo.
echo 서버가 종료되었습니다. (오류 내용을 확인하세요)
pause
