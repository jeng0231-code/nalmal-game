# discover.ps1 — 농장 C-Central DB의 자기설명 표를 읽어 discovery.json 으로 저장한다.
# 읽기(SELECT) 전용 · Windows 인증(SQL 계정/비밀번호 불필요) · 컨트롤러/DB에 쓰지 않음.
# 사용:  powershell -ExecutionPolicy Bypass -File discover.ps1
#        powershell -ExecutionPolicy Bypass -File discover.ps1 -Instance "localhost\FCENTRAL_EXPRESS" -Database FCentral
param(
  [string]$Instance = "localhost\FCENTRAL_EXPRESS",
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
  Write-Host "[OK] discovery.json 저장됨: $OutFile" -ForegroundColor Green
  foreach ($k in $names) {
    if ($result.Contains($k)) { Write-Host ("  {0,-13} {1} 행" -f $k, @($result[$k]).Count) }
  }
  Write-Host ""
  Write-Host "다음 단계:  node build-mapping.mjs   (discovery.json -> ../mapping.json 자동 생성)"
}
catch {
  (@{ error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
