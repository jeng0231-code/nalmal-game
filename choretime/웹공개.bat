@echo off
cd /d "%~dp0"
echo ============================================
echo   ��� ����� - ���ͳ� ���� (�ܺο��� ����)
echo ============================================
echo.
echo * ���� "����.bat" ���� ������ ���� �־�� �մϴ� (localhost:8088).
echo.
if not exist cloudflared.exe (
  echo [�غ�] ���� 1ȸ cloudflared �����޴� ��... ��ø� ��ٸ�����.
  powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'}catch{Write-Host 'download failed - check internet'; exit 1}"
)
if not exist cloudflared.exe (
  echo cloudflared �غ� ����. ���ͳ� Ȯ�� �� �ٽ� �����ϼ���.
  pause
  exit /b 1
)
echo.
echo [����] ���ͳ� �ּҸ� ����� ��...
echo        ��� �� �Ʒ��� https://...trycloudflare.com �ּҰ� ���ɴϴ�.
echo        �� �ּҸ� �޴���/�ܺο��� ���� ��𼭵� �� �� �ֽ��ϴ�.
echo        (�� â�� ���� â[����.bat]�� �� �� �� �μ���. ����: Ctrl + C)
echo.
cloudflared.exe tunnel --url http://127.0.0.1:8088
pause
