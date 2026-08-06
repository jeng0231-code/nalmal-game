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
  [3, 546, 1, 2145],
  // 1동 설정·일령·단계
  [3, 1, 1, 2350], [3, 21, 1, 3550], [3, 266, 1, 33],
  [3, 17, 18, 3250], [3, 17, 19, 2800], [3, 17, 20, 2650], [3, 17, 21, 2530], [3, 17, 22, 2540], [3, 17, 23, 2550], [3, 17, 24, 2950], [3, 17, 25, 3400], [3, 17, 128, 2100], [3, 17, 129, 2260], [3, 17, 130, 2250],
  [3, 18, 18, 3200], [3, 18, 19, 2750], [3, 18, 20, 2600], [3, 18, 21, 2480], [3, 18, 22, 2490], [3, 18, 23, 2500], [3, 18, 24, 2900], [3, 18, 25, 3350], [3, 18, 128, 2250], [3, 18, 129, 2340], [3, 18, 130, 2300],
  // 현재 가동 상태(descfk 28): 터널팬4(idx21)만 가동
  [3, 28, 18, 0], [3, 28, 19, 0], [3, 28, 20, 0], [3, 28, 21, 3], [3, 28, 22, 0], [3, 28, 23, 0], [3, 28, 24, 0], [3, 28, 25, 0],
  // 순환팬(stir, idx68, On40.2) STIR ON + 정체불명 출력(idx168) — 제외되어야 함
  [3, 17, 68, 4020], [3, 18, 68, 2340], [3, 28, 68, 5],
  [3, 17, 168, 4330], [3, 18, 168, 2210],
  // 실가동: 릴레이(descfk35) 터널팬4(idx21)=1 켜짐, 터널팬1(idx18)=0 정지.
  // 순환팬(idx68)은 릴레이 없이 descfk28==5만으로 가동 판정돼야 함.
  // (574는 참고용: 21=4 A-ON이지만 판정은 relay35로 함)
  [3, 35, 21, 1], [3, 574, 21, 4], [3, 574, 18, 2],
  // 설비 설정: 최소환기 가동20/정지180, 정압 상한30(i8)/하한25(i4), 인렛16, 윈드7
  [3, 2, 1, 20], [3, 3, 1, 180], [3, 344, 1, 16], [3, 343, 1, 7], [3, 337, 1, 300], [3, 338, 1, 250],
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
check('1동 외부온도 21.5', h1.metrics.find((m) => m.kind === 'out').value === 21.5)
check('1동 센서 3개(미연결/0 제외)', h1.sensors.length === 3)
check('1동 센서1 = 25.0', h1.sensors[0].value === 25.0)
check('2동 센서 4개', h2.sensors.length === 4)
check('3동 센서 3개(s1,s2,s6)', h3.sensors.length === 3)
check('1동 갱신=서버시각(방금, age 0)', h1.ageSeconds === 0)
check('활성 알람: 2동 sens.4 + 3동 POWER FAILURE = 2건', st.alarms.active.length === 2)
check('3동(ALARMS DISABLED)은 알람 아님', !st.alarms.active.some((a) => a.house === '3동'))
check('1동 POWER FAILURE는 활성 알람', st.alarms.active.some((a) => a.house === '1동' && /POWER/.test(a.message)))

// 설정·일령·단계
check('1동 설정온도 23.5°C', h1.metrics.find((m) => m.kind === 'settemp')?.value === 23.5)
check('1동 일령 33', h1.day === 33)
check('1동 환기단계 12개 (터널8+순환1+열풍기3)', h1.stages.length === 12)
check('순환팬 1 분류됨 (On 40.2)', h1.stages.some((s) => s.name === '순환팬 1' && s.type === 'stir' && s.on === 40.2))
check('터널팬 8개', h1.stages.filter((s) => s.type === 'tunnel').length === 8)
check('열풍기 3개', h1.stages.filter((s) => s.type === 'heater').length === 3)
check('정체불명 출력(idx168) 제외됨', !h1.stages.some((s) => s.on === 43.3))
const fan1 = h1.stages.find((s) => s.name === '터널팬 1')
check('터널팬1 On 32.5 / Off 32.0', fan1.on === 32.5 && fan1.off === 32.0)
const fan8 = h1.stages.find((s) => s.name === '터널팬 8')
check('터널팬8 On 34.0 / Off 33.5', fan8.on === 34.0 && fan8.off === 33.5)
const hz1 = h1.stages.find((s) => s.name === '열풍기 1')
check('열풍기1 On 21.0 / Off 22.5', hz1.on === 21.0 && hz1.off === 22.5)

// 가동 상태 — 터널팬만 카운트(순환팬은 가동중이어도 제외)
check('1동 가동 터널팬 1대(순환팬 제외)', h1.fansRunning === 1)
check('터널팬4 가동중', h1.stages.find((s) => s.name === '터널팬 4').running === true)
check('순환팬1 가동중이지만 팬수에 미포함', h1.stages.find((s) => s.name === '순환팬 1').running === true)
check('터널팬1 정지', h1.stages.find((s) => s.name === '터널팬 1').running === false)

// 실가동(릴레이) + 최소환기 태그/갯수
check('터널팬4 실가동(릴레이 ON)', h1.stages.find((s) => s.name === '터널팬 4').running === true)
check('터널팬4 최소환기 태그', h1.stages.find((s) => s.name === '터널팬 4').modeTag === '최소환기')
check('순환팬1 순환 태그·가동', h1.stages.find((s) => s.name === '순환팬 1').modeTag === '순환' && h1.stages.find((s) => s.name === '순환팬 1').running === true)
check('터널팬1 정지(릴레이 OFF)', h1.stages.find((s) => s.name === '터널팬 1').running === false)
check('1동 최소환기 팬 1개', h1.minVentFans === 1)

// 설비 설정
const info = Object.fromEntries(h1.info.map((r) => [r.label, r.value]))
check('최소환기 가동 20초', info['최소환기 가동'] === 20)
check('최소환기 정지 180초', info['최소환기 정지'] === 180)
check('인렛 16 / 윈드 7', info['인렛 예측'] === 16 && info['윈드 딜레이'] === 7)
check('정압 상한 30 / 하한 25 (÷10)', info['정압 상한'] === 30 && info['정압 하한'] === 25)

// 회귀: 가동 판정 runLogic. 574·relay 두 신호가 날마다 제각각이라 결합 방식을 mapping 에서 고를 수 있게 함.
// 기본 or = 하나라도 켜지면 가동(실제 도는데 0 뜨는 위험 방지). controlunit 1 = 3동.
{
  const rawX = [
    [1, 17, 20, 3000], [1, 18, 20, 2950], [1, 28, 20, 0], [1, 35, 20, 1], [1, 574, 20, 4], // 팬3: 574=4·relay1
    [1, 17, 21, 3000], [1, 18, 21, 2950], [1, 28, 21, 0], [1, 35, 21, 0], [1, 574, 21, 4], // 팬4: 574=4·relay0 (1동 7번 유형)
    [1, 17, 22, 3000], [1, 18, 22, 2950], [1, 28, 22, 0], [1, 35, 22, 1], [1, 574, 22, 2], // 팬5: 574=2·relay1 (2동 유형)
    [1, 17, 23, 3000], [1, 18, 23, 2950], [1, 28, 23, 0], [1, 35, 23, 0], [1, 574, 23, 2], // 팬6: 둘 다 꺼짐 → 정지
  ]
  const t0 = rawX.map(([cu, descfk, idx, lv]) => ({ cu, descfk, idx, lv, fv: 0 }))
  const run = (h, n) => h.stages.find((s) => s.name === n)?.running
  // 기본 or
  const hOr = buildStatus({ t0, t1: [], t2: [] }, mapping, now).houses.find((h) => h.id === '1')
  check('or 기본: 574=4 OR relay=1 이면 가동 (팬3·4·5 = 3대)', hOr.fansRunning === 3)
  check('or: 둘 다 꺼지면 정지 (팬6)', run(hOr, '터널팬 6') === false)
  // and 모드 (mapping 에서 runLogic 만 바꿈)
  const mapAnd = { ...mapping, stages: { ...mapping.stages, runLogic: 'and' } }
  const hAnd = buildStatus({ t0, t1: [], t2: [] }, mapAnd, now).houses.find((h) => h.id === '1')
  check('and 모드: 둘 다 켜져야 가동 (팬3만 = 1대)', hAnd.fansRunning === 1)
  check('and 모드: 574=4·relay0 은 정지 (팬4)', run(hAnd, '터널팬 4') === false)
}

if (failed) { console.error(`\n${failed}개 실패`); process.exit(1) } else { console.log('\n전체 통과 ✅') }
