@echo off
cd /d "%~dp0"
echo ============================================
echo   축사 모니터 - 인터넷 공개 (외부에서 보기)
echo ============================================
echo.
echo * 먼저 "시작.bat" 으로 서버가 켜져 있어야 합니다 (localhost:8088).
echo.
if not exist cloudflared.exe (
  echo [준비] 최초 1회 cloudflared 내려받는 중... 잠시만 기다리세요.
  powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'}catch{Write-Host 'download failed - check internet'; exit 1}"
)
if not exist cloudflared.exe (
  echo cloudflared 준비 실패. 인터넷 확인 후 다시 실행하세요.
  pause
  exit /b 1
)
echo.
echo [공개] 인터넷 주소를 만드는 중...
echo        잠시 뒤 아래에 https://...trycloudflare.com 주소가 나옵니다.
echo        그 주소를 휴대폰/외부에서 열면 어디서든 볼 수 있습니다.
echo        (이 창과 서버 창[시작.bat]을 둘 다 켜 두세요. 끄기: Ctrl + C)
echo.
cloudflared.exe tunnel --url http://localhost:8088
pause
