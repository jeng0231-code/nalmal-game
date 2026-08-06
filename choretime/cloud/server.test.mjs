// server.test.mjs — 프레임워크 없이 실제 서버를 임의 포트로 띄워 흐름 검증.
// register → status(pending) → approve → status(approved) → suspend → status(suspended)
// (node server.test.mjs)

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 실제 data/ 를 건드리지 않도록 import 전에 임시 저장 경로를 지정.
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'lic-test-'))
process.env.ADMIN_PASSWORD = 'test-pass'

const { app } = await import('./server.mjs')

let failed = 0
function check(name, cond) {
  if (cond) console.log(`  ok  - ${name}`)
  else { console.error(`  FAIL- ${name}`); failed++ }
}

// 포트 0 → OS가 빈 포트를 자동 배정.
const server = app.listen(0)
await new Promise((r) => server.once('listening', r))
const base = `http://127.0.0.1:${server.address().port}`

// 관리자 엔드포인트용 Basic 자격증명 헤더.
const adminAuth = 'Basic ' + Buffer.from('admin:test-pass').toString('base64')

async function post(path, body, headers = {}) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  return { code: res.status, json: await res.json().catch(() => null) }
}
async function get(path, headers = {}) {
  const res = await fetch(base + path, { headers })
  return { code: res.status, json: await res.json().catch(() => null) }
}

const MID = 'MACHINE-TEST-0001'

// 1) 등록 → pending
let r = await post('/api/register', { machineId: MID, name: '테스트농장', contact: '010', address: '서울' })
check('register 신규 → pending', r.code === 200 && r.json.status === 'pending')

// 2) 재등록은 상태를 유지(pending 그대로)
r = await post('/api/register', { machineId: MID, name: '이름변경', contact: '010', address: '부산' })
check('재등록 상태 유지 → pending', r.json.status === 'pending')

// 3) 상태 조회 → pending
r = await get('/api/status/' + MID)
check('status → pending', r.json.status === 'pending')

// 4) 미등록 조회 → unknown
r = await get('/api/status/NOPE')
check('미등록 status → unknown', r.json.status === 'unknown')

// 5) machineId 없는 등록 → 400
r = await post('/api/register', { name: 'x' })
check('machineId 없음 → 400', r.code === 400)

// 6) 인증 없는 admin 접근 → 401
r = await post('/admin/api/approve', { machineId: MID })
check('admin 인증 없음 → 401', r.code === 401)

// 7) 승인
r = await post('/admin/api/approve', { machineId: MID }, { Authorization: adminAuth })
check('approve → approved', r.code === 200 && r.json.ok === true && r.json.status === 'approved')

// 8) 상태 조회 → approved
r = await get('/api/status/' + MID)
check('status → approved', r.json.status === 'approved')

// 9) 중지
r = await post('/admin/api/suspend', { machineId: MID }, { Authorization: adminAuth })
check('suspend → suspended', r.code === 200 && r.json.ok === true && r.json.status === 'suspended')

// 10) 상태 조회 → suspended
r = await get('/api/status/' + MID)
check('status → suspended', r.json.status === 'suspended')

// 11) 목록 조회(관리자)
r = await get('/admin/api/list', { Authorization: adminAuth })
check('list에 등록 기기 포함', Array.isArray(r.json.licenses) && r.json.licenses.some((l) => l.machineId === MID))

server.close()

if (failed) {
  console.error(`\n${failed}개 실패`)
  process.exit(1)
} else {
  console.log('\n전체 통과 ✅')
}
