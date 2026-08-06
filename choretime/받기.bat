@echo off
chcp 949 >nul
cd /d "%~dp0"
echo ============================================
echo   축사 모니터 최신 파일 받기 (git 불필요)
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $base='https://raw.githubusercontent.com/jeng0231-code/nalmal-game/claude/c-central-mobile-web-r2n1jf/choretime/'; $root=(Get-Location).Path; $files=@('sqlmap.mjs','server-sql.mjs','public/app.js','public/index.html','public/style.css','package.json'); foreach($f in $files){ $out=Join-Path $root ($f -replace '/','\'); $dir=Split-Path $out; if(!(Test-Path $dir)){New-Item -ItemType Directory -Force -Path $dir ^| Out-Null}; try{ Invoke-WebRequest ($base+$f) -OutFile $out -UseBasicParsing; Write-Host ('  받음: '+$f) -ForegroundColor Green }catch{ Write-Host ('  건너뜀: '+$f) -ForegroundColor DarkGray } }"
echo.
echo 완료. 이 창을 닫고 시작.bat 을 다시 실행하세요.
echo (설정 파일 mapping.json 은 농장별 값이라 덮지 않습니다)
pause
