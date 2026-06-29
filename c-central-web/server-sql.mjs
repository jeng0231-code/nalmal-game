// server-sql.mjs — C-Central FCentral DB(SQL Server)를 읽어 모바일 대시보드 제공.
// 축사 PC에서 실행. PowerShell(runsql.ps1)이 Windows 인증으로 DB를 읽고(읽기 전용),
// 이 서버가 그 결과를 모바일 화면으로 보여준다. 별도 SQL 계정/설정 불필요.

import express from 'express'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'
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

function lanIp() {
  const ifs = os.networkInterfaces()
  for (const name of Object.keys(ifs)) {
    for (const i of ifs[name] || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address
    }
  }
  return 'localhost'
}

// 빈 포트를 자동으로 찾아 listen (8080이 점유돼 있으면 다음 포트 시도)
function startListening(port, attemptsLeft) {
  const server = app.listen(port)
  server.on('listening', () => {
    const ip = lanIp()
    console.log('\n  ===========================================')
    console.log('   축사 모니터 서버가 켜졌습니다')
    console.log('  ===========================================')
    console.log(`   이 PC에서   : http://localhost:${port}`)
    console.log(`   휴대폰에서  : http://${ip}:${port}   (같은 WiFi)`)
    console.log(`   DB          : ${mapping.instance} / ${mapping.database}`)
    console.log('   끄기        : 이 창에서 Ctrl + C')
    console.log('  ===========================================\n')
    getStatus()
      .then((s) => console.log(`   [OK] DB 연결 성공 — ${s.houses.length}개 동, 활성 알람 ${s.alarms.active.length}건\n`))
      .catch((e) => console.log(`   [!] DB 조회 실패: ${e.message}\n       (SQL Server 실행 여부 / mapping.json instance 확인)\n`))
  })
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`   포트 ${port} 사용 중 → ${port + 1} 시도...`)
      startListening(port + 1, attemptsLeft - 1)
    } else {
      console.error(`   서버 시작 실패: ${e.message}`)
      process.exit(1)
    }
  })
}

startListening(PORT, 12)
