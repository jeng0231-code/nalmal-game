// sqlmap 검증 — 실제 DB에서 받은 값으로 매핑 로직 테스트 (node sqlmap.test.mjs)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildSql, buildStatus } from './sqlmap.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const mapping = JSON.parse(readFileSync(join(here, 'mapping.json'), 'utf8'))

// 실제 조회로 받은 값(요약): [cu, descfk, idx, lv]
const raw = [
  // 1동 = cu3
  [3, 603, 1, 2494], [3, 542, 1, 91], [3, 538, 1, 1], [3, 610, 1, 270000], [3, 311, 1, 30],
  [3, 535, 1, 2499], [3, 535, 2, 2469], [3, 535, 3, 2517], [3, 535, 4, -9999], [3, 535, 5, -9999], [3, 535, 6, -9999], [3, 535, 7, 0],
  // 2동 = cu2
  [2, 603, 1, 2604], [2, 542, 1, 78], [2, 538, 1, -6], [2, 610, 1, 512000], [2, 311, 1, 60],
  [2, 535, 1, 2599], [2, 535, 2, 2600], [2, 535, 3, 2571], [2, 535, 4, 2661], [2, 535, 5, -9999],
  // 3동 = cu1
  [1, 603, 1, 2686], [1, 542, 1, 5], [1, 538, 1, 124], [1, 610, 1, 749000], [1, 311, 1, 80],
  [1, 535, 1, 2594], [1, 535, 2, 2721], [1, 535, 3, -9999], [1, 535, 6, 2504],
]
const ds = {
  t0: raw.map(([cu, descfk, idx, lv]) => ({ cu, descfk, idx, lv, fv: 0 })),
  t1: [{ cu: 1, sv: 'House 3\\' }, { cu: 2, sv: 'House2\\' }, { cu: 3, sv: 'House 1\\' }],
  t2: [
    { cu: 1, alarmStatus: 2, alarmText: 'ALARMS DISABLED', currentStatus: 4, lastUpdated: '2026-06-29T22:16:00' },
    { cu: 2, alarmStatus: 1, alarmText: 'MAX REL PWR sens. 4', currentStatus: 4, lastUpdated: '2026-06-29T22:16:00' },
    { cu: 3, alarmStatus: 0, alarmText: 'POWER FAILURE', currentStatus: 4, lastUpdated: '2026-06-29T22:16:00' },
  ],
}

let failed = 0
const check = (n, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'}- ${n}`); if (!c) failed++ }

console.log('--- buildSql 미리보기 ---')
console.log(buildSql(mapping).split('\n').slice(0, 4).join('\n'), '...\n')

const now = new Date('2026-06-29T22:18:00').getTime()
const st = buildStatus(ds, mapping, now)

const h1 = st.houses.find((h) => h.id === '3') // 1동
const h2 = st.houses.find((h) => h.id === '2')
const h3 = st.houses.find((h) => h.id === '1')

check('동 순서 1동,2동,3동', st.houses.map((h) => h.name).join(',') === '1동,2동,3동')
check('1동 DB이름 House 1', h1.dbName === 'House 1')
check('1동 평균온도 24.9°C', h1.metrics.find((m) => m.kind === 'temp').value === 24.9)
check('1동 습도 91%', h1.metrics.find((m) => m.kind === 'humidity').value === 91)
check('1동 음수량 2700', h1.metrics.find((m) => m.kind === 'water' && m.label === '음수량').value === 2700)
check('1동 센서 3개(미연결/0 제외)', h1.sensors.length === 3)
check('1동 센서1 = 25.0', h1.sensors[0].value === 25.0)
check('2동 센서 4개', h2.sensors.length === 4)
check('3동 센서 3개(s1,s2,s6)', h3.sensors.length === 3)
check('1동 갱신 2분 전(120초)', h1.ageSeconds === 120)
check('활성 알람: 2동 sens.4 + 3동 POWER FAILURE = 2건', st.alarms.active.length === 2)
check('3동(ALARMS DISABLED)은 알람 아님', !st.alarms.active.some((a) => a.house === '3동'))
check('1동 POWER FAILURE는 활성 알람', st.alarms.active.some((a) => a.house === '1동' && /POWER/.test(a.message)))

if (failed) { console.error(`\n${failed}개 실패`); process.exit(1) } else { console.log('\n전체 통과 ✅') }
