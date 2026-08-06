// server-sql.mjs — C-Central FCentral DB(SQL Server)를 읽어 모바일 대시보드 제공.
// 축사 PC에서 실행. PowerShell(runsql.ps1)이 Windows 인증으로 DB를 읽고(읽기 전용),
// 이 서버가 그 결과를 모바일 화면으로 보여준다. 별도 SQL 계정/설정 불필요.

import express from 'express'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'
import { tmpdir } from 'node:os'
import { buildSql, buildStatus, buildStageDebug } from './sqlmap.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const mapping = JSON.parse(readFileSync(join(here, 'mapping.json'), 'utf8'))
const PORT = process.env.PORT || mapping.port || 8080
const REFRESH_MS = Number(process.env.REFRESH_MS || 5000) // 백그라운드 DB 갱신 주기
const QUERY_TIMEOUT_MS = 25000
// 이 시간(초)보다 오래 갱신이 안 되면 "끊김"으로 표시 → 오래된 가동상태를 실시간처럼 보이지 않게 한다.
const STALE_SECONDS = Number(process.env.STALE_SECONDS || Math.max(20, Math.round(REFRESH_MS / 1000) * 3))

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

// 백그라운드로 주기 갱신 → 브라우저/푸시는 캐시를 즉시 읽는다(요청마다 DB 조회하지 않음).
// DB 부하는 REFRESH_MS 당 1회로 묶이고, 화면 지연은 최대 REFRESH_MS 로 제한된다.
let cache = { at: 0, data: null, error: null }
let refreshing = null
function refreshNow() {
  if (refreshing) return refreshing // 직전 조회가 안 끝났으면 중복 조회 방지
  refreshing = runQuery()
    .then((ds) => { cache = { at: Date.now(), data: buildStatus(ds, mapping, Date.now()), ds, error: null } })
    .catch((e) => { cache = { ...cache, error: String(e.message || e) } }) // 실패해도 직전 값 유지
    .finally(() => { refreshing = null })
  return refreshing
}
async function getStatus() {
  if (!cache.data) await refreshNow() // 최초 1회만 대기, 이후엔 백그라운드 캐시
  return cache.data
}
// 캐시가 마지막으로 성공한 시점 기준으로 실제 경과시간/끊김 여부를 매길인다.
// (buildStatus 는 조회시각을 baked 하지만, 조회 실패로 캐시가 멈추면 그 값이 실시간처럼 보이므로 여기서 보정)
function withFreshness(data) {
  if (!data) return data
  const age = cache.at ? Math.max(0, Math.round((Date.now() - cache.at) / 1000)) : null
  const stale = age == null || age > STALE_SECONDS
  const houses = (data.houses || []).map((h) => ({ ...h, ageSeconds: age, stale }))
  return { ...data, ageSeconds: age, stale, houses, display: mapping.display || null, publicUrl }
}
function startRefreshLoop() {
  refreshNow().then(() => {
    if (cache.data) console.log(`   [OK] DB 연결 성공 — ${cache.data.houses.length}개 동, 활성 알람 ${cache.data.alarms.active.length}건 (갱신 ${REFRESH_MS / 1000}초마다)\n`)
    else console.log(`   [!] DB 조회 실패: ${cache.error}\n       (SQL Server 실행 여부 / mapping.json instance 확인)\n`)
  })
  setInterval(refreshNow, REFRESH_MS)
}

// ---- Railway 푸시 (선택) : /api/status 와 동일한 데이터를 클라우드로 주기 전송 ----
// 기본값은 그대로 동작. 환경변수(PUSH_URL/PUSH_TOKEN/PUSH_INTERVAL_MS/PUSH_ENABLED)로 덮어쓸 수 있다.
const PUSH = {
  enabled: (process.env.PUSH_ENABLED ?? mapping.push?.enabled ?? 'true') !== 'false' && process.env.PUSH_ENABLED !== '0',
  url: process.env.PUSH_URL || mapping.push?.url || 'https://web-production-8ecc.up.railway.app/api/ct2-push',
  token: process.env.PUSH_TOKEN || mapping.push?.token || 'broiler_push_2026',
  intervalMs: Number(process.env.PUSH_INTERVAL_MS || mapping.push?.intervalMs || 15000),
}

let pushState = { ok: null, lastAt: 0, fails: 0 }
async function pushOnce() {
  try {
    if (typeof fetch !== 'function') throw new Error('이 Node 버전엔 fetch 가 없습니다(Node 18+ 필요)')
    const data = withFreshness(await getStatus()) // ← /api/status 와 동일한 데이터(경과시간 포함)
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

// ---- 무료 외부 주소(Cloudflare 임시 터널) : 서버가 직접 띄워 공개 URL을 잡고 화면에 배너+QR로 보여준다 ----
// 같은 WiFi 가 아니어도 외부에서 접속 가능. cloudflared 가 폴더에 있고 tunnel 이 켜져 있을 때만 동작.
let publicUrl = null
function startTunnel(port) {
  const enabled = process.env.TUNNEL === '1' || mapping.tunnel?.enabled
  if (!enabled) return
  const exe = join(here, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared')
  if (!existsSync(exe)) { console.log('   [외부주소] cloudflared 없음 → 생략 (웹공개.bat 로 받을 수 있음)'); return }
  const run = () => {
    const cf = spawn(exe, ['tunnel', '--url', `http://127.0.0.1:${port}`], { windowsHide: true })
    const grab = (d) => {
      const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
      if (m && publicUrl !== m[0]) { publicUrl = m[0]; console.log(`\n   🌐 외부 접속 주소: ${publicUrl}\n`) }
    }
    cf.stdout.on('data', grab); cf.stderr.on('data', grab)
    cf.on('error', (e) => console.log(`   [외부주소] 실행 오류: ${e.message}`))
    cf.on('close', () => { publicUrl = null; setTimeout(run, 10000) }) // 끊기면 10초 후 재연결(새 주소)
  }
  run()
}

const app = express()
app.use(express.static(join(here, 'public')))

app.get('/api/public-url', (req, res) => res.json({ url: publicUrl }))

app.get('/api/status', async (req, res) => {
  const data = await getStatus()
  if (data) return res.json(withFreshness(data))
  res.status(503).json({ error: cache.error || 'DB 조회 준비 중' })
})

app.get('/api/health', (req, res) => res.json({ ok: true, mode: 'sql', instance: mapping.instance }))

// 진단: 출력별 원시값(On/Off·상태28·실가동574)과 가동 판정 근거. 오판정 원인 확인용.
app.get('/api/debug', async (req, res) => {
  await getStatus()
  if (!cache.ds) return res.status(503).json({ error: cache.error || 'DB 조회 준비 중' })
  const age = cache.at ? Math.round((Date.now() - cache.at) / 1000) : null
  res.json({ ageSeconds: age, at: new Date(cache.at).toISOString(), ...buildStageDebug(cache.ds, mapping) })
})

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
    startRefreshLoop()
    startPush()
    startTunnel(port)
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
