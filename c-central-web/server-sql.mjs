// server-sql.mjs — C-Central FCentral DB(SQL Server)를 읽어 모바일 대시보드 제공.
// 축사 PC에서 실행. PowerShell(runsql.ps1)이 Windows 인증으로 DB를 읽고(읽기 전용),
// 이 서버가 그 결과를 모바일 화면으로 보여준다. 별도 SQL 계정/설정 불필요.

import express from 'express'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildSql, buildStatus } from './sqlmap.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const mapping = JSON.parse(readFileSync(join(here, 'mapping.json'), 'utf8'))
const PORT = process.env.PORT || mapping.port || 8080
const CACHE_MS = 15000

const sqlPath = join(tmpdir(), 'cc_query.sql')
writeFileSync(sqlPath, buildSql(mapping), 'utf8')

function runQuery() {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', join(here, 'runsql.ps1'),
      '-SqlFile', sqlPath,
      '-Instance', mapping.instance,
    ], { windowsHide: true })

    let out = '', err = ''
    ps.stdout.on('data', (d) => (out += d))
    ps.stderr.on('data', (d) => (err += d))
    ps.on('error', reject)
    ps.on('close', () => {
      try {
        const json = JSON.parse(out.trim())
        if (json && json.error) return reject(new Error(json.error))
        resolve(json)
      } catch {
        reject(new Error('DB 조회 결과 해석 실패: ' + (err || out).slice(0, 300)))
      }
    })
  })
}

let cache = { at: 0, data: null }
async function getStatus() {
  if (cache.data && Date.now() - cache.at < CACHE_MS) return cache.data
  const ds = await runQuery()
  const status = buildStatus(ds, mapping, Date.now())
  cache = { at: Date.now(), data: status }
  return status
}

const app = express()
app.use(express.static(join(here, 'public')))

app.get('/api/status', async (req, res) => {
  try {
    res.json(await getStatus())
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true, mode: 'sql', instance: mapping.instance }))

app.listen(PORT, () => {
  console.log('\n  C-Central 모바일 대시보드 (SQL 직접 읽기)')
  console.log('  ─────────────────────────────────────────')
  console.log(`  주소     : http://localhost:${PORT}`)
  console.log(`  같은 WiFi: http://192.168.2.3:${PORT}`)
  console.log(`  DB       : ${mapping.instance} / ${mapping.database}`)
  console.log('\n  종료: Ctrl + C\n')
  // 시작 시 1회 점검
  getStatus()
    .then((s) => console.log(`  ✓ DB 연결 OK — ${s.houses.length}개 동, 활성 알람 ${s.alarms.active.length}건`))
    .catch((e) => console.log(`  ⚠ DB 조회 실패: ${e.message}\n    (mapping.json의 instance 확인, 또는 SQL Server 실행 여부 확인)`))
})
