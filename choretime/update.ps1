# update.ps1 - update to the latest version without git. (called by the update .bat)
# Keeps farm-specific files: license.json / .machine-id / discovery.json,
# and (for friend installs that have license.json) the local mapping.json.
# NOTE: ASCII-only on purpose. Windows PowerShell 5.1 misreads Korean in .ps1 -> parse errors.
$ErrorActionPreference = 'Stop'
$dest = $PSScriptRoot
$branch = 'claude/c-central-mobile-web-r2n1jf'
$zipUrl = "https://github.com/jeng0231-code/nalmal-game/archive/refs/heads/$branch.zip"
$tmp = Join-Path $env:TEMP 'ct-update'
$zip = Join-Path $env:TEMP 'ct-update.zip'

Write-Host ("Target folder: " + $dest)
if (-not (Test-Path (Join-Path $dest 'server-sql.mjs'))) {
  throw "This is not the choretime folder (server-sql.mjs not found). Run from the choretime folder."
}

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
# Remove farm-specific files from the download so the local ones stay untouched.
foreach ($f in @('license.json', '.machine-id')) {
  $p = Join-Path $src $f
  if (Test-Path $p) { Remove-Item $p -Force }
}
Remove-Item (Join-Path $src 'discover\discovery.json') -Force -ErrorAction SilentlyContinue
# mapping.json: friend install (has license.json) keeps local; owner takes the latest.
if (Test-Path (Join-Path $dest 'license.json')) {
  Remove-Item (Join-Path $src 'mapping.json') -Force -ErrorAction SilentlyContinue
  Write-Host '   (your farm mapping.json is kept)'
}
# Merge copy. node_modules / node.exe / cloudflared.exe are not in the zip, so they stay.
$rc = Start-Process robocopy -ArgumentList @("`"$src`"", "`"$dest`"", '/E', '/XD', 'node_modules', '/NFL', '/NDL', '/NJH', '/NJS', '/NP') -Wait -PassThru -NoNewWindow
if ($rc.ExitCode -ge 8) { throw "copy failed (robocopy $($rc.ExitCode))" }

Write-Host '[4/4] Cleaning up...'
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Write-Host ''
Write-Host '[OK] Updated to the latest version.'
