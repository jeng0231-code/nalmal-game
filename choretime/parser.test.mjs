// 간단한 파서 검증 (node parser.test.mjs)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseRealtime, parseDaily, parseAlarms, parseKoreanTimestamp, houseFromDevice } from './parser.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const read = (f) => readFileSync(join(here, 'sample', f), 'utf8')

let failed = 0
function check(name, cond) {
  if (cond) {
    console.log(`  ok  - ${name}`)
  } else {
    console.error(`  FAIL- ${name}`)
    failed++
  }
}

// 시각 파싱
check('오후 10:16:30 → 22시', parseKoreanTimestamp('2026-06-29', '오후 10:16:30').getHours() === 22)
check('오전 12:00:00 → 0시', parseKoreanTimestamp('2026-06-29', '오전 12:00:00').getHours() === 0)
check('오후 12:00:00 → 12시', parseKoreanTimestamp('2026-06-29', '오후 12:00:00').getHours() === 12)

// 장치 → 동
check('C2STDD1 2.1 → 동 2', houseFromDevice('C2STDD1 2.1') === '2')

// 실시간 (1동)
const r1 = parseRealtime(read('G_data_WebLinkBox_C2STDD1_1_1.csv'))
const temp1 = r1.latest.values.find((v) => v.kind === 'temp')
check('1동 평균온도 = 25.3', temp1.value === 25.3)
check('1동 습도 컬럼 존재', r1.latest.values.some((v) => v.kind === 'humidity' && v.value === 90))
check('1동 추세 9포인트', r1.trend.length === 9)

// 실시간 (3동) 센서 오류 -100 처리
const r3 = parseRealtime(read('G_data_WebLinkBox_C2STDD1_3_1.csv'))
const badSensor = r3.latest.values.find((v) => v.error)
check('3동 센서 오류(-100) 감지', !!badSensor && badSensor.value === null)

// 일별
const d1 = parseDaily(read('G_data12_WebLinkBox_C2STDD1_1_1.csv'))
check('1동 일별 최신 = 2840', d1.latest.value === 2840)
check('일별 라벨 포함', /음수량/.test(d1.label))

// 알람
const a = parseAlarms(read('AlarmLog.csv'))
check('알람 이벤트 10건', a.total === 10)
check('최신 이벤트가 맨 앞', a.recent[0].datetime.includes('2:07:38'))
// sens. 2는 마지막 상태가 enmAsLoud로 끝나므로 활성 1건
check('활성 알람 1건(sens. 2 울림 중)', a.active.length === 1 && /sens\. 2/.test(a.active[0].message))

if (failed) {
  console.error(`\n${failed}개 실패`)
  process.exit(1)
} else {
  console.log('\n전체 통과 ✅')
}
