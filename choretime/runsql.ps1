# runsql.ps1 — FCentral SQL Server를 Windows 인증으로 읽어 JSON으로 출력한다.
# Node 서버(server-sql.mjs)가 이 스크립트를 호출해 데이터를 받는다.
# 읽기(SELECT) 전용. 별도 SQL 계정/혼합모드 불필요(Windows 인증 사용).
param(
  [Parameter(Mandatory = $true)][string]$SqlFile,
  [string]$Instance = "localhost\FCENTRAL_EXPRESS"
)
$ErrorActionPreference = "Stop"
try {
  $cs = "Server=$Instance;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=8"
  $q = Get-Content -Raw -Encoding UTF8 $SqlFile
  $cn = New-Object System.Data.SqlClient.SqlConnection $cs
  $cn.Open()
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = $q
  $da = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
  $ds = New-Object System.Data.DataSet
  [void]$da.Fill($ds)
  $cn.Close()

  $result = [ordered]@{}
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
    $result["t$i"] = $rows
  }
  $result | ConvertTo-Json -Depth 6 -Compress
}
catch {
  # 오류도 JSON으로 (Node가 인식)
  (@{ error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
