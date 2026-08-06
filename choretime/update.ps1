# update.ps1 — git 없이 최신 버전으로 업데이트한다. (업데이트.bat 이 호출)
# 농장 고유 파일(license.json / .machine-id / discovery.json / 친구 설치의 mapping.json)은 보존한다.
$ErrorActionPreference = 'Stop'
$dest = $PSScriptRoot
$branch = 'claude/c-central-mobile-web-r2n1jf'
$zipUrl = "https://github.com/jeng0231-code/nalmal-game/archive/refs/heads/$branch.zip"
$tmp = Join-Path $env:TEMP 'ct-update'
$zip = Join-Path $env:TEMP 'ct-update.zip'

Write-Host '[1/4] Downloading latest (no git needed)...'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest $zipUrl -OutFile $zip -UseBasicParsing

Write-Host '[2/4] Extracting...'
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$top = Get-ChildItem $tmp -Directory | Select-Object -First 1
$src = Join-Path $top.FullName 'choretime'
if (-not (Test-Path $src)) { throw 'choretime folder not found in download' }

Write-Host '[3/4] Applying update (keeping your farm settings)...'
# 농장 고유 파일은 다운로드본에서 제거 → 로컬 파일이 그대로 유지됨
foreach ($f in @('license.json', '.machine-id')) {
  $p = Join-Path $src $f
  if (Test-Path $p) { Remove-Item $p -Force }
}
Remove-Item (Join-Path $src 'discover\discovery.json') -Force -ErrorAction SilentlyContinue
# mapping.json: 친구 설치(license.json 존재)는 로컬 유지, 소유자(미존재)는 최신으로 교체
if (Test-Path (Join-Path $dest 'license.json')) {
  Remove-Item (Join-Path $src 'mapping.json') -Force -ErrorAction SilentlyContinue
  Write-Host '   (your farm mapping.json is kept)'
}
# 복사·병합 (node_modules / node.exe / cloudflared.exe 는 zip 에 없어 그대로 보존됨)
$rc = Start-Process robocopy -ArgumentList @("`"$src`"", "`"$dest`"", '/E', '/XD', 'node_modules', '/NFL', '/NDL', '/NJH', '/NJS', '/NP') -Wait -PassThru -NoNewWindow
if ($rc.ExitCode -ge 8) { throw "copy failed (robocopy $($rc.ExitCode))" }

Write-Host '[4/4] Cleaning up...'
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Write-Host ''
Write-Host '[OK] Updated to the latest version.'
