# discover.ps1 — 농장 C-Central DB의 자기설명 표를 읽어 discovery.json 으로 저장한다.
# 읽기(SELECT) 전용 · Windows 인증(SQL 계정/비밀번호 불필요) · 컨트롤러/DB에 쓰지 않음.
# 사용:  powershell -ExecutionPolicy Bypass -File discover.ps1
#        powershell -ExecutionPolicy Bypass -File discover.ps1 -Instance "localhost\FCENTRAL_EXPRESS" -Database FCentral
param(
  [string]$Instance = "",
  [string]$Database = "FCentral",
  [int]$NameCode = 35,
  [string]$SqlFile = "",
  [string]$OutFile = ""
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $SqlFile) { $SqlFile = Join-Path $here "discover.sql" }
if (-not $OutFile) { $OutFile = Join-Path $here "discovery.json" }

# 결과 테이블(t0..t8)에 붙일 이름 — discover.sql 의 SELECT 순서와 일치해야 한다.
$names = @("controlUnits","houseNames","descriptors","sampleSpecs","templates","conversions","units","orderedText","formats")

# --- SQL 인스턴스 자동 탐지 (농장마다 인스턴스 이름이 달라도 접속) ---
# 우선순위: 지정한 -Instance → 실행 중인 MSSQL$ 서비스 → 흔한 기본 이름들.
function Test-SqlConn([string]$inst, [string]$db) {
  try {
    $t = New-Object System.Data.SqlClient.SqlConnection "Server=$inst;Database=$db;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=5"
    $t.Open(); $t.Close(); return $true
  } catch { return $false }
}
$cands = New-Object System.Collections.Generic.List[string]
if ($Instance) { $cands.Add($Instance) }
foreach ($svc in (Get-Service -Name "MSSQL`$*" -ErrorAction SilentlyContinue)) {
  $cands.Add("localhost\" + ($svc.Name -replace '^MSSQL\$',''))
}
foreach ($d in @("localhost\FCENTRAL_EXPRESS","localhost\SQLEXPRESS","localhost",".\FCENTRAL_EXPRESS",".\SQLEXPRESS",".")) { $cands.Add($d) }
$picked = $null
foreach ($c in ($cands | Select-Object -Unique)) {
  if (Test-SqlConn $c $Database) { $picked = $c; break }
}
if (-not $picked) {
  Write-Host "[FAIL] Could not connect to any SQL instance for database '$Database'." -ForegroundColor Red
  Write-Host "       Run on the C-Central PC. Tried: $($cands -join ', ')"
  exit 1
}
$Instance = $picked
Write-Host "[OK] SQL instance: $Instance"

try {
  $cs = "Server=$Instance;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=10"
  $q = Get-Content -Raw -Encoding UTF8 $SqlFile
  $q = $q.Replace("__DB__", $Database).Replace("__NAMECODE__", "$NameCode")

  $cn = New-Object System.Data.SqlClient.SqlConnection $cs
  $cn.Open()
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = $q
  $cmd.CommandTimeout = 60
  $da = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
  $ds = New-Object System.Data.DataSet
  [void]$da.Fill($ds)
  $cn.Close()

  $result = [ordered]@{
    _meta = [ordered]@{ instance = $Instance; database = $Database; nameCode = $NameCode; tableCount = $ds.Tables.Count }
  }
  for ($i = 0; $i -lt $ds.Tables.Count; $i++) {
    $tbl = $ds.Tables[$i]
    $rows = @(
      foreach ($r in $tbl.Rows) {
        $o = [ordered]@{}
        foreach ($c in $tbl.Columns) {
          $v = $r[$c.ColumnName]
          if ($v -is [System.DBNull]) { $v = $null }
          $o[$c.ColumnName] = $v
        }
        [pscustomobject]$o
      }
    )
    $key = if ($i -lt $names.Count) { $names[$i] } else { "t$i" }
    $result[$key] = $rows
  }

  $json = $result | ConvertTo-Json -Depth 8
  Set-Content -Path $OutFile -Value $json -Encoding UTF8

  Write-Host ""
  Write-Host "[OK] discovery.json saved: $OutFile" -ForegroundColor Green
  foreach ($k in $names) {
    if ($result.Contains($k)) { Write-Host ("  {0,-13} {1} rows" -f $k, @($result[$k]).Count) }
  }
  Write-Host ""
  Write-Host "Next: node discover/build-mapping.mjs   (discovery.json -> ../mapping.json)"
}
catch {
  (@{ error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
