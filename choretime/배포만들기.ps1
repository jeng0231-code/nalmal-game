# 배포만들기.ps1 — 친구 농장에게 줄 "축사모니터_배포.zip" 을 만든다.
# Node.js 를 함께 넣어(node.exe + node_modules) 친구는 아무것도 설치할 필요가 없다.
#
# 사용법 (제공자 = 나 의 PC 에서, choretime 폴더 안에서 실행):
#   powershell -NoProfile -ExecutionPolicy Bypass -File 배포만들기.ps1
# 결과: 바탕화면에 축사모니터_배포.zip 이 생긴다. 이 zip 을 친구에게 전달.

$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$stage = Join-Path $env:TEMP 'choretime-dist'
$out = Join-Path ([Environment]::GetFolderPath('Desktop')) '축사모니터_배포.zip'

Write-Host '[1/5] Node.js 확인...'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { Write-Host '  [FAIL] 이 PC 에 Node.js 가 없습니다. https://nodejs.org 에서 LTS 설치 후 다시 실행.'; exit 1 }
Write-Host "  node.exe: $node"

Write-Host '[2/5] 배포용 폴더 준비...'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

# 복사에서 제외할 것: 내 개인 설정/등록/캐시 (친구는 자기 것으로 새로 만든다)
$exclude = @('node_modules', 'license.json', '.machine-id', 'mapping.json',
             'mapping.backup.json', 'discovery.json', 'cloudflared.exe',
             '.git', 'node.exe', '축사모니터_배포.zip')
Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName -Destination $stage -Recurse -Force
}
# discover 폴더 안의 개인 결과물 제거
Remove-Item (Join-Path $stage 'discover\discovery.json') -Force -ErrorAction SilentlyContinue

Write-Host '[3/5] node.exe 함께 넣기...'
Copy-Item $node -Destination (Join-Path $stage 'node.exe') -Force

Write-Host '[4/5] 부품 설치(node_modules) 함께 넣기... 1-2분'
Push-Location $stage
& npm install --omit=dev --no-audit --no-fund | Out-Host
Pop-Location

Write-Host '[5/5] 압축...'
if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $out -Force

$mb = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host ''
Write-Host "  [완료] $out  ($mb MB)"
Write-Host '  이 zip 을 친구에게 전달하세요. 친구는 압축을 풀고 설치시작.bat 만 더블클릭하면 됩니다.'
Write-Host '  (Node.js 설치 불필요 — 이미 안에 들어 있습니다.)'
