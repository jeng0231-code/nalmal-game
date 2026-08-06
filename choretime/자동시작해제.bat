@echo off
chcp 949 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path ([Environment]::GetFolderPath('Startup')) '축사모니터.lnk'; if(Test-Path $p){Remove-Item $p; Write-Host ('해제됨: ' + $p)}else{Write-Host '등록된 자동시작이 없습니다.'}"
pause
