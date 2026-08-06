// server.mjs — 축사모니터 라이선스 승인 서버 + 관리자 웹보드.
// 농장 PC의 모니터링 에이전트가 설치 시 등록(register)하고, 제품 소유자가
// /admin 에서 승인/중지한다. 에이전트는 status가 'approved'일 때만 동작한다.
// → 무료 소프트웨어의 무단 재배포를 억제하기 위한 최소 장치.
// 의존성은 express 하나뿐. 저장은 JSON 파일 1개(외부 DB 불필요).

import express from 'express'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8090
// Railway 등에서 볼륨을 붙일 수 있게 DATA_DIR로 저장 위치를 덮어쓸 수 있다.
const DATA_DIR = process.env.DATA_DIR || join(here, 'data')
const DB_FILE = join(DATA_DIR, 'licenses.json')

// 관리자 비밀번호는 환경변수로만 받는다. 미설정 시 개발용 기본값 + 경고
// (운영에서 그대로 두면 위험하므로 시작 로그에 눈에 띄게 남긴다).
const ADMIN_USER = 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[경고] ADMIN_PASSWORD 미설정 — 기본값 "changeme" 사용 중. 운영 배포 전 반드시 설정하세요.')
}

// ---- 저장소 (JSON 파일) --------------------------------------------------
// machineId → 라이선스 레코드. 시작 시 1회 읽고, 변경마다 파일에 기록한다.
let db = {}

function loadDb() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(DB_FILE)) { db = {}; saveDb(); return }
    const parsed = JSON.parse(readFileSync(DB_FILE, 'utf8'))
    // 손상/형식 이상 파일은 빈 상태로 시작(서버가 죽지 않게).
    db = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (e) {
    console.warn(`[경고] 라이선스 파일 읽기 실패 → 빈 상태로 시작: ${e.message}`)
    db = {}
  }
}

function saveDb() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8')
  } catch (e) {
    console.error(`[오류] 라이선스 파일 저장 실패: ${e.message}`)
  }
}

const now = () => new Date().toISOString()

// 입력 문자열 정규화: 문자열이 아니면 '', 앞뒤 공백 제거 후 max 길이로 자른다.
function clean(v, max) {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

// ---- 앱 ------------------------------------------------------------------
const app = express()
// Railway 등 프록시 뒤에서 req.ip가 실제 클라이언트 IP가 되도록.
app.set('trust proxy', true)
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '10kb' })) // 로그인 폼(application/x-www-form-urlencoded)

// ---- 에이전트용 공개 API -------------------------------------------------

// 등록: 신규면 pending 생성, 기존이면 정보만 갱신하고 상태는 유지한다.
app.post('/api/register', (req, res) => {
  const body = req.body || {}
  const machineId = clean(body.machineId, 128)
  if (!machineId) return res.status(400).json({ error: 'machineId가 필요합니다' })

  const name = clean(body.name, 200)
  const contact = clean(body.contact, 200)
  const address = clean(body.address, 200)

  const existing = db[machineId]
  if (existing) {
    // 재등록: 상태(pending/approved/suspended)는 절대 덮어쓰지 않는다.
    existing.name = name
    existing.contact = contact
    existing.address = address
    existing.lastSeen = now()
    existing.lastIp = req.ip
  } else {
    db[machineId] = {
      machineId, name, contact, address,
      status: 'pending',
      createdAt: now(),
      lastSeen: now(),
      lastIp: req.ip,
    }
  }
  saveDb()
  res.json({ status: db[machineId].status })
})

// 상태 조회: 에이전트가 주기적으로 호출. 미등록이면 'unknown'.
app.get('/api/status/:machineId', (req, res) => {
  const rec = db[req.params.machineId]
  if (!rec) return res.json({ status: 'unknown' })
  rec.lastSeen = now() // 살아있음 표시 갱신
  saveDb()
  res.json({ status: rec.status })
})

// ---- 관리자 인증 (화면 안 로그인 폼 + 쿠키) --------------------------------
// 브라우저 Basic 팝업은 환경마다 안 뜨는 경우가 있어, 페이지 안 비밀번호 입력창으로 처리한다.
// 로그인 성공 시 HttpOnly 쿠키를 심고(HTTPS 전용), 이후 요청은 쿠키로 인증한다.
function readCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}
function isAdmin(req) { return readCookies(req).adm === ADMIN_PASSWORD }
function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next()
  res.status(401).json({ error: '인증 필요 — /admin 에서 로그인하세요' })
}

app.post('/admin/login', (req, res) => {
  const pw = (req.body && req.body.password) || ''
  if (pw === ADMIN_PASSWORD) {
    res.set('Set-Cookie', `adm=${encodeURIComponent(pw)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 3600}`)
    return res.redirect('/admin')
  }
  res.status(401).type('html').send(LOGIN_HTML('비밀번호가 틀렸습니다.'))
})
app.post('/admin/logout', (req, res) => {
  res.set('Set-Cookie', 'adm=; Path=/; HttpOnly; Max-Age=0')
  res.redirect('/admin')
})

app.post('/admin/api/approve', requireAdmin, (req, res) => {
  const rec = db[(req.body || {}).machineId]
  if (!rec) return res.status(404).json({ error: '기기를 찾을 수 없음' })
  rec.status = 'approved'
  saveDb()
  res.json({ ok: true, status: rec.status })
})

app.post('/admin/api/suspend', requireAdmin, (req, res) => {
  const rec = db[(req.body || {}).machineId]
  if (!rec) return res.status(404).json({ error: '기기를 찾을 수 없음' })
  rec.status = 'suspended'
  saveDb()
  res.json({ ok: true, status: rec.status })
})

app.get('/admin/api/list', requireAdmin, (req, res) => {
  res.json({ licenses: Object.values(db) })
})

app.get('/admin', (req, res) => {
  // 로그인 전이면 비밀번호 입력 폼, 로그인 후면 관리 보드.
  if (!isAdmin(req)) return res.type('html').send(LOGIN_HTML(''))
  res.type('html').send(ADMIN_HTML)
})

// ---- 공개 안내 페이지 ----------------------------------------------------
// 데이터 노출 없이 안내만. (관리자는 /admin 으로 유도)
app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>축사모니터 라이선스 서버</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;background:#0f1115;color:#e6e6e6;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}main{padding:24px}h1{font-size:20px;margin:0 0 8px}p{color:#9aa4b2;margin:4px 0}code{background:#1b1f27;padding:2px 6px;border-radius:4px}</style>
</head><body><main><h1>축사모니터 라이선스 서버</h1><p>관리자는 <code>/admin</code></p></main></body></html>`)
})

// ---- 로그인 폼 (화면 안 비밀번호 입력) -----------------------------------
const LOGIN_HTML = (err) => `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>관리자 로그인 · 축사모니터</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;background:#0f1115;color:#e6e6e6;display:flex;min-height:100vh;align-items:center;justify-content:center}
form{background:#161a22;border:1px solid #232833;border-radius:12px;padding:28px;width:290px;text-align:center}
h1{font-size:18px;margin:0 0 16px}
input{width:100%;padding:11px;border-radius:8px;border:1px solid #333;background:#0b0e13;color:#fff;font-size:15px}
button{margin-top:12px;width:100%;padding:11px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
.err{color:#f87171;font-size:13px;margin-top:10px;min-height:16px}</style></head>
<body><form method="POST" action="/admin/login"><h1>🔒 관리자 로그인</h1>
<input type="password" name="password" placeholder="관리자 비밀번호" autofocus autocomplete="current-password">
<button type="submit">로그인</button><div class="err">${err}</div></form></body></html>`

// ---- 관리자 HTML (완전 자체 포함, 외부 CDN/자산 없음) --------------------
const ADMIN_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>라이선스 관리 · 축사모니터</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;background:#0f1115;color:#e6e6e6}
  header{padding:16px 20px;border-bottom:1px solid #232833;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
  h1{font-size:18px;margin:0}
  .counts{display:flex;gap:10px;flex-wrap:wrap;font-size:13px}
  .counts span{background:#1b1f27;border:1px solid #232833;border-radius:6px;padding:4px 10px}
  .counts b{color:#fff}
  button{cursor:pointer;font:inherit;border-radius:6px;border:1px solid #2c3340;background:#1b1f27;color:#e6e6e6;padding:8px 12px;min-height:36px}
  button:hover{background:#242a35}
  .wrap{padding:16px 20px;overflow-x:auto}
  table{border-collapse:collapse;width:100%;min-width:760px;font-size:13px}
  th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #1f242e;white-space:nowrap}
  th{color:#9aa4b2;font-weight:600}
  td.addr{white-space:normal;max-width:220px}
  .badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:600}
  .b-approved{background:#12351f;color:#5fd68a;border:1px solid #1e5a34}
  .b-pending{background:#3a3212;color:#e9c25f;border:1px solid #5c4f1e}
  .b-suspended{background:#3a1517;color:#f08585;border:1px solid #5c2427}
  .act button{padding:6px 10px;min-height:32px;margin-right:6px}
  .approve{border-color:#1e5a34;color:#5fd68a}
  .suspend{border-color:#5c2427;color:#f08585}
  .empty{color:#9aa4b2;padding:24px 8px}
  .mono{font-family:ui-monospace,Menlo,Consolas,monospace;color:#9aa4b2}
</style></head><body>
<header>
  <h1>라이선스 관리</h1>
  <div class="counts" id="counts"></div>
  <button id="refresh">새로고침</button>
</header>
<div class="wrap"><table>
  <thead><tr>
    <th>상태</th><th>이름</th><th>연락처</th><th>주소</th><th>기기ID</th><th>등록일</th><th>마지막접속</th><th></th>
  </tr></thead>
  <tbody id="rows"></tbody>
</table></div>
<script>
  const KO = { approved:'승인', pending:'대기', suspended:'중지' }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
  const fmt = (iso) => { if(!iso) return '-'; const d=new Date(iso); return isNaN(d)?'-':d.toLocaleString('ko-KR',{hour12:false}) }

  async function load() {
    const r = await fetch('/admin/api/list')  // 같은 오리진 → Basic 인증 자동 포함
    if (!r.ok) { document.getElementById('rows').innerHTML = '<tr><td colspan="8" class="empty">불러오기 실패</td></tr>'; return }
    const { licenses } = await r.json()
    // 등록일 최신순 정렬
    licenses.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    const c = { total: licenses.length, approved: 0, pending: 0, suspended: 0 }
    for (const l of licenses) c[l.status] = (c[l.status] || 0) + 1
    document.getElementById('counts').innerHTML =
      '<span>전체 <b>'+c.total+'</b></span>' +
      '<span>승인 <b>'+c.approved+'</b></span>' +
      '<span>대기 <b>'+c.pending+'</b></span>' +
      '<span>중지 <b>'+c.suspended+'</b></span>'
    const rows = document.getElementById('rows')
    if (!licenses.length) { rows.innerHTML = '<tr><td colspan="8" class="empty">아직 등록된 기기가 없습니다.</td></tr>'; return }
    rows.innerHTML = licenses.map((l) =>
      '<tr>' +
      '<td><span class="badge b-'+esc(l.status)+'">'+(KO[l.status]||esc(l.status))+'</span></td>' +
      '<td>'+esc(l.name||'-')+'</td>' +
      '<td>'+esc(l.contact||'-')+'</td>' +
      '<td class="addr">'+esc(l.address||'-')+'</td>' +
      '<td class="mono">'+esc(String(l.machineId).slice(0,8))+'</td>' +
      '<td>'+fmt(l.createdAt)+'</td>' +
      '<td>'+fmt(l.lastSeen)+'</td>' +
      '<td class="act">' +
        '<button class="approve" onclick="act(\\'approve\\',\\''+esc(l.machineId)+'\\')">승인</button>' +
        '<button class="suspend" onclick="act(\\'suspend\\',\\''+esc(l.machineId)+'\\')">중지</button>' +
      '</td></tr>'
    ).join('')
  }

  async function act(kind, machineId) {
    await fetch('/admin/api/'+kind, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId }),
    })
    load()  // 변경 후 목록 새로고침
  }
  window.act = act
  document.getElementById('refresh').onclick = load
  load()
</script></body></html>`

// ---- 시작 ----------------------------------------------------------------
loadDb()
// 테스트가 포트 0(임의 포트)으로 직접 listen 할 수 있도록 app을 export 한다.
export { app }

// 이 파일이 직접 실행될 때만 서버를 띄운다(테스트가 import 할 때는 안 띄움).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(PORT, () => {
    console.log(`\n  축사모니터 라이선스 서버 실행 중`)
    console.log(`   주소   : http://localhost:${PORT}`)
    console.log(`   관리자 : http://localhost:${PORT}/admin`)
    console.log(`   저장   : ${DB_FILE}\n`)
  })
}
