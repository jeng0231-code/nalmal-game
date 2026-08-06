@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    Choretime - Publish to the web (external access)
echo ============================================
echo.
echo * The server must already be running (start.bat / localhost:8088).
echo.
if not exist cloudflared.exe (
  echo [setup] Downloading cloudflared (first time only)... please wait.
  powershell -NoProfile -Command "try{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe' -UseBasicParsing}catch{Write-Host 'download failed - check internet'; exit 1}"
)
if not exist cloudflared.exe (
  echo   [FAIL] cloudflared not ready. Check internet and run again.
  pause
  exit /b 1
)
echo.
echo [tunnel] Creating an external URL...
echo    A https://...trycloudflare.com address appears below in a moment.
echo    Open that URL on a phone or any PC to view from anywhere.
echo    (Keep this window open. stop: Ctrl + C)
echo.
cloudflared.exe tunnel --url http://127.0.0.1:8088
pause
