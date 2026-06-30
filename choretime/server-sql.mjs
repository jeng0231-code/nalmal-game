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
const CACHE_MS = 7000
const QUERY_TIMEOUT_MS = 25000

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

    let out = '', err = '', done = false
    const finish = (fn, arg) => { if (done) return; done = true; clearTimeout(timer); fn(arg) }
    const timer = setTimeout(() => {
      try { ps.kill() } catch { /* ignore */ }
      finish(reject, new Error('DB 조회 시간 초과(25초)'))
    }, QUERY_TIMEOUT_MS)

    ps.stdout.on('data', (d) => (out += d))
    ps.stderr.on('data', (d) => (err += d))
    ps.on('error', (e) => finish(reject, e))
    ps.on('close', () => {
      try {
        const json = JSON.parse(out.trim())
        if (json && json.error) return finish(reject, new Error(json.error))
        finish(resolve, json)
      } catch {
        finish(reject, new Error('DB 조회 결과 해석 실패: ' + (err || out).slice(0, 300)))
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

// ---- Railway 푸시 (선택) : /api/status 와 동일한 데이터를 클라우드로 주기 전송 ----
// 기본값은 그대로 동작. 환경변수(PUSH_URL/PUSH_TOKEN/PUSH_INTERVAL_MS/PUSH_ENABLED)로 덮어쓸 수 있다.
const PUSH = {
  enabled: (process.env.PUSH_ENABLED ?? mapping.push?.enabled ?? 'true') !== 'false' && process.env.PUSH_ENABLED !== '0',
  url: process.env.PUSH_URL || mapping.push?.url || 'https://web-production-8ecc.up.railway.app/api/ct2-push',
  token: process.env.PUSH_TOKEN || mapping.push?.token || 'broiler_push_2026',
  intervalMs: Number(process.env.PUSH_INTERVAL_MS || mapping.push?.intervalMs || 30000),
}

let pushState = { ok: null, lastAt: 0, fails: 0 }
async function pushOnce() {
  try {
    if (typeof fetch !== 'function') throw new Error('이 Node 버전엔 fetch 가 없습니다(Node 18+ 필요)')
    const data = await getStatus() // ← /api/status 와 동일한 데이터
    const res = await fetch(PUSH.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: PUSH.token, data }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (pushState.ok !== true) console.log(`   [push] Railway 전송 성공 → ${PUSH.url}`)
    pushState = { ok: true, lastAt: Date.now(), fails: 0 }
  } catch (e) {
    pushState.fails++
    // 처음 실패하거나 10회마다 한 번만 로그 (창이 도배되지 않게)
    if (pushState.ok !== false || pushState.fails % 10 === 1) {
      console.log(`   [push] 전송 실패(${pushState.fails}회): ${e.message}`)
    }
    pushState.ok = false
  }
}

function startPush() {
  if (!PUSH.enabled || !PUSH.url) { console.log('   [push] 비활성화됨'); return }
  console.log(`   [push] Railway 푸시 켜짐 — ${Math.round(PUSH.intervalMs / 1000)}초마다 → ${PUSH.url}`)
  pushOnce() // 즉시 1회
  setInterval(pushOnce, PUSH.intervalMs) // 이후 주기 반복
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

app.get('/api/push-status', (req, res) => res.json({
  enabled: PUSH.enabled, url: PUSH.url, intervalMs: PUSH.intervalMs,
  lastOk: pushState.ok, lastAt: pushState.lastAt, fails: pushState.fails,
}))

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
    startPush()
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
