// build-mapping.mjs — discovery.json (농장 DB 지문) → ../mapping.json 자동 생성.
//
// 모드:
//   node build-mapping.mjs                 discovery.json → mapping.json 생성
//   node build-mapping.mjs --calibrate     우리 농장 mapping.json + discovery.json 을 대조해
//                                           사전의 빈 code/ram(펌웨어 고정값)을 채운 보정 파일 생성
//                                           (dictionary.calibrated.json). 한 번 만들어 두면 다른 농장에도 사용.
//
// 우선순위 매칭:  ram(고유) > text(측정 라벨) > code(+다중 index 휴리스틱).
// 읽기 전용 도구. DB에 접근하지 않고 discover.ps1 가 만든 JSON만 사용한다.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { STANDARD_ITEMS, SENSOR_ITEM, STAGE_SPEC, NAME_CODE, ALARM_INACTIVE_TEXTS, DEFAULTS } from './dictionary.mjs'

const here = dirname(fileURLToPath(import.meta.url))

// JSON 읽기: PowerShell이 UTF-8로 저장하면 맨 앞에 BOM(﻿)이 붙는데
// JSON.parse가 이를 못 넘기므로 제거하고 파싱한다.
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
}

// ---- 유연한 컬럼 접근 (DB 컬럼 이름 변형 대응) ----
function colGetter(rows, candidates) {
  const sample = rows.find((r) => r && typeof r === 'object')
  if (!sample) return () => undefined
  const keys = Object.keys(sample)
  const lc = new Map(keys.map((k) => [k.toLowerCase(), k]))
  for (const c of candidates) {
    const hit = lc.get(c.toLowerCase())
    if (hit) return (row) => row[hit]
  }
  return () => undefined
}

function loadDiscovery(file) {
  const path = file || join(here, 'discovery.json')
  if (!existsSync(path)) {
    console.error(`discovery.json 이 없습니다: ${path}\n먼저 농장 PC에서 discover.ps1 을 실행하세요.`)
    process.exit(1)
  }
  return readJson(path)
}

// 보정값(있으면) 을 사전에 덮어쓴다.
function withCalibration(items, stage) {
  const calPath = join(here, 'dictionary.calibrated.json')
  if (!existsSync(calPath)) return { items, stage, calibrated: false }
  const cal = readJson(calPath)
  const byKey = cal.items || {}
  const items2 = items.map((it) => ({ ...it, ...(byKey[it.key] || {}) }))
  const stage2 = { ...stage }
  if (cal.stage) for (const role of ['on', 'off', 'status', 'run']) {
    if (cal.stage[role]) stage2[role] = { ...stage2[role], ...cal.stage[role] }
  }
  const sensor = byKey[SENSOR_ITEM.key] ? { ...SENSOR_ITEM, ...byKey[SENSOR_ITEM.key] } : SENSOR_ITEM
  return { items: items2, stage: stage2, sensor, calibrated: true }
}

// ---- 농장 DB에서 항목 1개의 descriptorfk 찾기 ----
function makeResolver(disc) {
  const descriptors = disc.descriptors || []
  const specs = disc.sampleSpecs || []
  const dPk = colGetter(descriptors, ['datadescriptorpk', 'descriptorpk', 'pk'])
  const dCode = colGetter(descriptors, ['code'])
  const dRam = colGetter(descriptors, ['dataDescriptorID', 'dataDescriptorId', 'ramAddress', 'ram'])
  const sText = colGetter(specs, ['text', 'name', 'label'])
  const sDesc = colGetter(specs, ['datadescriptorfk', 'descriptorfk'])

  const byCode = new Map()
  for (const d of descriptors) {
    const c = Number(dCode(d))
    if (!byCode.has(c)) byCode.set(c, [])
    byCode.get(c).push(d)
  }
  const ramToFk = new Map()
  for (const d of descriptors) {
    const r = dRam(d)
    if (r != null) ramToFk.set(Number(r), Number(dPk(d)))
  }

  function byText(re) {
    for (const s of specs) {
      const t = sText(s)
      if (t != null && re.test(String(t))) {
        const fk = sDesc(s)
        if (fk != null) return { fk: Number(fk), via: 'text', label: String(t) }
      }
    }
    return null
  }

  // ram > text > code 순. code 가 충돌(다중)하면 multi 표시.
  function resolve(item) {
    if (item.ram != null && ramToFk.has(Number(item.ram))) {
      return { fk: ramToFk.get(Number(item.ram)), via: 'ram' }
    }
    if (item.text) {
      const t = byText(item.text)
      if (t) return t
    }
    if (item.code != null && byCode.has(Number(item.code))) {
      const cands = byCode.get(Number(item.code))
      if (cands.length === 1) return { fk: Number(dPk(cands[0])), via: 'code' }
      return { fk: null, via: 'code', multi: cands.map((d) => Number(dPk(d))) }
    }
    return null
  }

  return { resolve, dPk, dCode, dRam, descriptors }
}

// ---- 동(House) 목록: DB 이름의 숫자를 동 번호로 (House 1 → 1동) ----
function buildHouses(disc) {
  const cuRows = disc.controlUnits || []
  const cuPk = colGetter(cuRows, ['controlunitpk', 'cu', 'pk'])
  const nameRows = disc.houseNames || []
  const nCu = colGetter(nameRows, ['cu', 'controlunitfk'])
  const nSv = colGetter(nameRows, ['sv', 'stringValue'])

  const nameByCu = new Map()
  for (const r of nameRows) {
    const cu = Number(nCu(r))
    const sv = nSv(r)
    if (sv != null) nameByCu.set(cu, String(sv).replace(/\\+$/, '').trim())
  }

  const houses = cuRows.map((r) => {
    const cu = Number(cuPk(r))
    const dbName = nameByCu.get(cu) || null
    const m = dbName && dbName.match(/(\d+)/)
    const num = m ? Number(m[1]) : null
    return { controlunit: cu, dbName, num }
  })
  // 동 번호(House N)가 있으면 그 순서로, 없으면 cu 순으로
  houses.sort((a, b) => (a.num ?? a.controlunit) - (b.num ?? b.controlunit))
  return houses.map((h, i) => ({ controlunit: h.controlunit, name: `${h.num ?? i + 1}동` }))
}

// ---- mapping.json 생성 ----
function generate(disc, opts = {}) {
  const { items, stage, sensor, calibrated } = withCalibration(STANDARD_ITEMS, STAGE_SPEC)
  const sensorItem = sensor || SENSOR_ITEM
  const { resolve } = makeResolver(disc)
  const warnings = []

  const measurements = []
  const settings = []
  const infoRows = []
  let dayField = null

  for (const it of items) {
    const r = resolve(it)
    if (!r || r.fk == null) {
      warnings.push(`미해결: ${it.key} (${it.label})${r && r.multi ? ` code 충돌 fk=${r.multi.join('/')}` : ''}`)
      continue
    }
    const base = { key: it.key, label: it.label, descriptorfk: r.fk, scale: it.scale, unit: it.unit, decimals: it.decimals }
    if (it.role === 'measurement') measurements.push({ ...base, kind: it.kind })
    else if (it.role === 'setting') settings.push({ ...base, index: 1, kind: it.kind })
    else if (it.role === 'info') infoRows.push({ label: it.label, descriptorfk: r.fk, index: 1, scale: it.scale, unit: it.unit, decimals: it.decimals })
    else if (it.role === 'day') dayField = { label: it.label, descriptorfk: r.fk, index: 1, scale: it.scale }
  }

  // 센서
  const rs = resolve(sensorItem)
  const sensors = rs && rs.fk != null
    ? { label: sensorItem.label, descriptorfk: rs.fk, scale: sensorItem.scale, unit: sensorItem.unit, decimals: sensorItem.decimals, errorBelow: sensorItem.errorBelow }
    : (warnings.push('미해결: sensors (온도센서)'), null)

  // 출력 단계
  const rOn = resolve(stage.on), rOff = resolve(stage.off), rSt = resolve(stage.status), rRun = resolve(stage.run)
  for (const [name, r] of [['stageOn', rOn], ['stageOff', rOff], ['stageStatus', rSt], ['stageRun', rRun]]) {
    if (!r || r.fk == null) warnings.push(`미해결: ${name}${r && r.multi ? ` code 충돌 fk=${r.multi.join('/')}` : ''}`)
  }
  const stages = {
    label: '환기 단계 설정온도',
    onDescriptorfk: rOn?.fk ?? null,
    offDescriptorfk: rOff?.fk ?? null,
    statusDescriptorfk: rSt?.fk ?? null,
    runDescriptorfk: rRun?.fk ?? null,
    runOnValues: stage.runOnValues,
    scale: stage.scale,
    decimals: stage.decimals,
    validMin: stage.validMin,
    validMax: stage.validMax,
    statusText: stage.statusText,
    minVentCode: stage.minVentCode,
    groups: stage.groups,
  }

  const mapping = {
    _설명: 'discover/build-mapping.mjs 로 자동 생성됨 (수정 시 build-mapping 재실행하면 덮어씀).',
    _생성: { calibrated, warnings: warnings.length },
    port: opts.port ?? DEFAULTS.port,
    instance: disc._meta?.instance || opts.instance || DEFAULTS.instance,
    database: disc._meta?.database || opts.database || DEFAULTS.database,
    houses: buildHouses(disc),
    nameCode: disc._meta?.nameCode ?? NAME_CODE,
    measurements,
    sensors,
    alarmInactiveTexts: ALARM_INACTIVE_TEXTS,
    settings,
    dayField,
    infoRows,
    stages,
    // 배포용 기본값: 개별 팬 실시간 가동표시는 DB로 부정확하므로 숨긴다(설정온도는 유지).
    display: { showFanStatus: false },
  }
  return { mapping, warnings }
}

// ---- 보정: 우리 농장 mapping.json + discovery.json → 빈 code/ram 채우기 ----
function calibrate(disc, knownMappingPath) {
  const known = readJson(knownMappingPath)
  const { descriptors, dPk, dCode, dRam } = makeResolver(disc)
  const fkInfo = new Map()
  for (const d of descriptors) fkInfo.set(Number(dPk(d)), { code: numOrNull(dCode(d)), ram: numOrNull(dRam(d)) })

  const items = {}
  const note = (key, fk) => {
    if (fk == null) return
    const info = fkInfo.get(Number(fk))
    if (info) items[key] = { code: info.code, ram: info.ram }
    else items[key] = { _missing: `fk ${fk} 가 discovery 에 없음` }
  }

  for (const m of known.measurements || []) note(keyForLabel(m), m.descriptorfk)
  for (const s of known.settings || []) note(keyForLabel(s), s.descriptorfk)
  for (const r of known.infoRows || []) note(keyForLabel(r), r.descriptorfk)
  if (known.dayField) note('dayAge', known.dayField.descriptorfk)
  if (known.sensors) note('sensors', known.sensors.descriptorfk)

  const stage = {}
  if (known.stages) {
    const s = known.stages
    const grab = (fk) => (fk == null ? null : fkInfo.get(Number(fk)) || null)
    stage.on = grab(s.onDescriptorfk)
    stage.off = grab(s.offDescriptorfk)
    stage.status = grab(s.statusDescriptorfk)
    stage.run = grab(s.runDescriptorfk)
  }
  return { items, stage, _source: knownMappingPath }
}

const LABEL_TO_KEY = {
  평균온도: 'avgTemp', 습도: 'humidity', 정압: 'pressure', 외부온도: 'outTemp', 음수량: 'water', '15분음수량': 'water15',
  설정온도: 'setTemp', 터널전환온도: 'tunnelOn', 일령: 'dayAge', 온도센서: 'sensors',
  '최소환기 가동': 'minVentOn', '최소환기 정지': 'minVentOff', '정압 상한': 'spHigh', '정압 하한': 'spLow', '인렛 예측': 'inlet', '윈드 딜레이': 'windDelay',
}
function keyForLabel(item) { return item.key || LABEL_TO_KEY[item.label] || item.label }
function numOrNull(v) { return v == null ? null : Number(v) }

// ---- CLI ----
function main() {
const args = process.argv.slice(2)
const discFile = args.find((a) => a.endsWith('.json') && !a.startsWith('--'))
const disc = loadDiscovery(discFile)

if (args.includes('--calibrate')) {
  const knownPath = join(here, '..', 'mapping.json')
  const cal = calibrate(disc, knownPath)
  const out = join(here, 'dictionary.calibrated.json')
  writeFileSync(out, JSON.stringify(cal, null, 2))
  console.log(`보정 완료 → ${out}`)
  const filled = Object.entries(cal.items).filter(([, v]) => v.code != null || v.ram != null).length
  console.log(`  항목 ${Object.keys(cal.items).length}개 중 ${filled}개에 code/ram 기록`)
  console.log('  이제 `node build-mapping.mjs` 로 다른 농장에서도 자동 생성됩니다.')
} else {
  const { mapping, warnings } = generate(disc)
  const out = join(here, '..', 'mapping.json')
  writeFileSync(out, JSON.stringify(mapping, null, 2))
  console.log(`mapping.json 생성 → ${out}`)
  console.log(`  동 ${mapping.houses.length} · 측정 ${mapping.measurements.length} · 설정 ${mapping.settings.length} · 설비 ${mapping.infoRows.length}`)
  if (warnings.length) {
    console.log(`\n⚠ 미해결 ${warnings.length}건 (온보딩에서 확인 필요):`)
    for (const w of warnings) console.log('  - ' + w)
  } else {
    console.log('  미해결 0건 ✅')
  }
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()

export { generate, calibrate, buildHouses, makeResolver }
