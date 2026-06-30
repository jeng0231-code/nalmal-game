// build-mapping 검증 — 합성 지문(fixture.discovery.json)으로 자동 생성 로직 테스트.
// node discover/build-mapping.test.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { generate, calibrate, buildHouses, makeResolver } from './build-mapping.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const disc = JSON.parse(readFileSync(join(here, 'fixture.discovery.json'), 'utf8'))
const known = JSON.parse(readFileSync(join(here, '..', 'mapping.json'), 'utf8'))

let failed = 0
const check = (n, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'}- ${n}`); if (!c) failed++ }

// --- 동 순서/이름 (House N → N동, cu3=1동) ---
const houses = buildHouses(disc)
check('동 순서 1동,2동,3동', houses.map((h) => h.name).join(',') === '1동,2동,3동')
check('1동 = controlunit 3', houses[0].controlunit === 3 && houses[0].name === '1동')
check('3동 = controlunit 1', houses[2].controlunit === 1 && houses[2].name === '3동')

// --- 단일 해결 (ram > text > code) ---
const { resolve } = makeResolver(disc)
check('ram 매칭: 평균온도 → fk603', resolve({ ram: 12582912 }).fk === 603)
check('text 매칭: 외부온도 → fk546', resolve({ text: /외부.?온도/ }).fk === 546)
check('code 단일 매칭: code1 → fk18(Off)', resolve({ code: 1 }).fk === 18)
check('code 충돌 감지: code0 → multi', resolve({ code: 0 }).multi?.length >= 2)

// --- 생성(보정 전): 측정/센서/터널Off/실가동은 풀려야, 나머지는 경고 ---
const { mapping, warnings } = generate(disc)
const byKey = Object.fromEntries(mapping.measurements.map((m) => [m.key, m]))
check('측정 6종 모두 해결', mapping.measurements.length === 6)
check('평균온도 fk/scale/kind 일치', byKey.avgTemp.descriptorfk === 603 && byKey.avgTemp.scale === 0.01 && byKey.avgTemp.kind === 'temp')
check('정압 fk538 scale0.1', byKey.pressure.descriptorfk === 538 && byKey.pressure.scale === 0.1)
check('습도 fk542 scale1', byKey.humidity.descriptorfk === 542 && byKey.humidity.scale === 1)
check('음수량 fk610 / 15분음수량 fk311 구분', byKey.water.descriptorfk === 610 && byKey.water15.descriptorfk === 311)
check('센서 fk535', mapping.sensors?.descriptorfk === 535)
check('터널Off(code1) 해결 fk18', mapping.stages.onDescriptorfk == null && mapping.stages.offDescriptorfk === 18)
check('실가동(code208) 해결 fk574', mapping.stages.runDescriptorfk === 574)
check('보정 전 미해결 경고 존재', warnings.some((w) => w.includes('stageOn')) && warnings.some((w) => w.includes('dayAge')))
check('생성 mapping 접속정보 보존', mapping.instance === 'localhost\\FCENTRAL_EXPRESS' && mapping.database === 'FCentral')

// --- 보정: 우리 농장 mapping + 지문 → code/ram 채움 ---
const cal = calibrate(disc, join(here, '..', 'mapping.json'))
check('보정: 평균온도 code0/ram12582912', cal.items.avgTemp.code === 0 && cal.items.avgTemp.ram === 12582912)
check('보정: 정압 code172', cal.items.pressure.code === 172)
check('보정: 일령 code/ram 채워짐', cal.items.dayAge.code === 90 && cal.items.dayAge.ram === 3000000)
check('보정: 센서 code/ram', cal.items.sensors.ram === 12600000)
check('보정: 인렛/윈드 채워짐', cal.items.inlet.code === 320 && cal.items.windDelay.code === 321)
check('보정: 실가동 code208', cal.stage.run.code === 208)
check('보정: Off code1, On code0, 상태 code207', cal.stage.off.code === 1 && cal.stage.on.code === 0 && cal.stage.status.code === 207)

// --- 보정 적용 후 재해결: 모든 항목이 우리 농장 fk와 일치(왕복 검증) ---
const items2 = [
  ...['avgTemp', 'humidity', 'pressure', 'outTemp', 'water', 'water15'].map((k) => ({ k, fk: byKey[k]?.descriptorfk })),
]
// dayAge: code90 단일 → 보정값으로 resolve
check('보정 후 일령 resolve fk266', resolve({ ...cal.items.dayAge }).fk === 266)
check('보정 후 상태 resolve fk28', resolve({ ...cal.stage.status }).fk === 28)
check('보정 후 터널전환 resolve fk21 (ram)', resolve({ ...cal.items.tunnelOn }).fk === 21)
check('보정 후 최소환기가동 resolve fk2', resolve({ ...cal.items.minVentOn }).fk === 2)

// 알려진 mapping 과 측정 fk 전수 일치
const knownM = Object.fromEntries(known.measurements.map((m) => [m.key, m.descriptorfk]))
check('측정 fk 전수 일치(생성 vs 수작업)', Object.keys(knownM).every((k) => byKey[k].descriptorfk === knownM[k]))

if (failed) { console.error(`\n${failed}개 실패`); process.exit(1) } else { console.log('\n전체 통과 ✅') }
