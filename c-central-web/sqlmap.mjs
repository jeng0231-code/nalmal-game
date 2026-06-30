// sqlmap.mjs — FCentral DB 조회 SQL 생성 + 결과(JSON)를 대시보드 상태로 변환.
// 순수 로직만 두어 테스트 가능하게 한다 (DB/PowerShell 호출은 server-sql.mjs).

/** mapping을 보고 measurements/sensors/names/alarms를 가져오는 SQL 배치를 만든다.
 *  결과 테이블 순서: t0=값, t1=동이름, t2=알람 */
export function buildSql(mapping) {
  const cus = mapping.houses.map((h) => h.controlunit)
  const cuList = cus.join(',')
  const descfks = [
    ...mapping.measurements.map((m) => m.descriptorfk),
    mapping.sensors.descriptorfk,
    ...(mapping.settings || []).map((s) => s.descriptorfk).filter(Boolean),
    ...(mapping.infoRows || []).map((r) => r.descriptorfk).filter(Boolean),
    mapping.dayField?.descriptorfk,
    mapping.stages?.onDescriptorfk,
    mapping.stages?.offDescriptorfk,
    mapping.stages?.statusDescriptorfk,
    mapping.stages?.runDescriptorfk,
  ].filter((x) => x != null)
  const descList = [...new Set(descfks)].join(',')

  return `
SET NOCOUNT ON;
SELECT dp.controlunitfk AS cu, dp.datadescriptorfk AS descfk, d.index1 AS idx, d.longValue AS lv, d.floatValue AS fv
FROM ${mapping.database}.dbo.Data d
JOIN ${mapping.database}.dbo.DataPlaceholder dp ON dp.dataplaceholderpk = d.dataplaceholderfk
WHERE d.index2 = 1 AND dp.controlunitfk IN (${cuList}) AND dp.datadescriptorfk IN (${descList});

SELECT dp.controlunitfk AS cu, d.stringValue AS sv
FROM ${mapping.database}.dbo.Data d
JOIN ${mapping.database}.dbo.DataPlaceholder dp ON dp.dataplaceholderpk = d.dataplaceholderfk
JOIN ${mapping.database}.dbo.DataDescriptor dd ON dd.datadescriptorpk = dp.datadescriptorfk
WHERE dd.code = ${mapping.nameCode} AND d.index1 = 1 AND d.index2 = 1 AND dp.controlunitfk IN (${cuList});

SELECT controlunitpk AS cu, alarmStatus, alarmText, currentStatus, lastUpdated
FROM ${mapping.database}.dbo.ControlUnit WHERE controlunitpk IN (${cuList});
`.trim()
}

function cleanText(s) {
  // C-Central 문자열은 끝에 '\' 를 붙인다 (예: "House 1\")
  return (s == null ? '' : String(s)).replace(/\\+$/, '').trim()
}

function round(v, decimals = 0) {
  const f = Math.pow(10, decimals)
  return Math.round(v * f) / f
}

/** PowerShell이 준 데이터셋(t0,t1,t2)을 대시보드 상태 JSON으로 변환 */
export function buildStatus(ds, mapping, nowMs) {
  const now = nowMs ?? 0
  const rows = ds.t0 || []
  const names = ds.t1 || []
  const alarmRows = ds.t2 || []

  // (cu, descfk, idx) → 값
  const valByCu = new Map() // cu -> Map(descfk -> Map(idx -> {lv,fv}))
  for (const r of rows) {
    const cu = Number(r.cu)
    if (!valByCu.has(cu)) valByCu.set(cu, new Map())
    const byDesc = valByCu.get(cu)
    if (!byDesc.has(r.descfk)) byDesc.set(r.descfk, new Map())
    byDesc.get(r.descfk).set(Number(r.idx), { lv: r.lv, fv: r.fv })
  }

  const nameByCu = new Map()
  for (const n of names) nameByCu.set(Number(n.cu), cleanText(n.sv))

  const inactive = (mapping.alarmInactiveTexts || []).map((t) => t.toUpperCase())
  const alarmByCu = new Map()
  for (const a of alarmRows) alarmByCu.set(Number(a.cu), a)

  const activeAlarms = []
  const houses = []

  for (const h of mapping.houses) {
    const cu = h.controlunit
    const byDesc = valByCu.get(cu) || new Map()
    const pick = (descfk, idx = 1) => {
      const m = byDesc.get(descfk)
      return m ? m.get(idx) : undefined
    }

    const house = {
      id: String(cu),
      name: h.name || nameByCu.get(cu) || `제어${cu}`,
      dbName: nameByCu.get(cu) || null,
      ok: byDesc.size > 0,
      updatedAt: null,
      ageSeconds: null,
      stale: false,
      metrics: [],
      sensors: [],
      dailyWater: null,
      trend: [],
    }

    // 측정값
    for (const m of mapping.measurements) {
      const v = pick(m.descriptorfk, 1)
      let value = null
      let error = false
      if (v && v.lv != null) {
        const raw = Number(v.lv) * m.scale
        if (raw <= -9000) error = true
        else value = round(raw, m.decimals ?? 0)
      }
      house.metrics.push({ label: m.label, short: m.label, kind: m.kind, unit: m.unit, value, error })
    }

    // 센서 (여러 index)
    const s = mapping.sensors
    const sm = byDesc.get(s.descriptorfk)
    if (sm) {
      const indices = [...sm.keys()].sort((a, b) => a - b)
      for (const idx of indices) {
        const lv = sm.get(idx).lv
        if (lv == null) continue
        const raw = Number(lv)
        // 0 = 미사용 슬롯, -9999 = 미연결 슬롯 → 화면(C-Central)과 동일하게 표시하지 않음
        if (raw === 0 || raw <= s.errorBelow) continue
        house.sensors.push({ label: `s${idx}`, kind: 'sensor', unit: s.unit, value: round(raw * s.scale, s.decimals ?? 1), error: false })
      }
    }

    // 설정값
    for (const st of mapping.settings || []) {
      const v = pick(st.descriptorfk, st.index ?? 1)
      let value = null
      if (v && v.lv != null) value = round(Number(v.lv) * (st.scale ?? 1), st.decimals ?? 0)
      house.metrics.push({ label: st.label, short: st.label, kind: st.kind || 'other', unit: st.unit || '', value, error: false })
    }

    // 설비 설정 (최소환기·정압설정 등)
    house.info = []
    for (const r of mapping.infoRows || []) {
      const v = pick(r.descriptorfk, r.index ?? 1)
      if (!v || v.lv == null) continue
      house.info.push({ label: r.label, value: round(Number(v.lv) * (r.scale ?? 1), r.decimals ?? 0), unit: r.unit || '' })
    }

    // 일령
    if (mapping.dayField) {
      const v = pick(mapping.dayField.descriptorfk, mapping.dayField.index ?? 1)
      house.day = v && v.lv != null ? round(Number(v.lv) * (mapping.dayField.scale ?? 1), 0) : null
    }

    // 환기 단계 설정온도 표 (출력별 On/Off)
    house.stages = []
    house.fansRunning = 0
    house.minVentFans = 0
    house.stirOn = false
    if (mapping.stages) {
      const st = mapping.stages
      const onMap = byDesc.get(st.onDescriptorfk)
      const offMap = byDesc.get(st.offDescriptorfk)
      const stMap = byDesc.get(st.statusDescriptorfk)
      const runMap = byDesc.get(st.runDescriptorfk)
      const runOn = st.runOnValues || [4]
      const sc = st.scale ?? 0.01
      const dc = st.decimals ?? 1
      const vMin = st.validMin ?? 1
      const vMax = st.validMax ?? 6000
      // On 설정온도가 유효한 출력만 동별로 자동 인식 (동마다 팬/열풍기 수가 다름)
      const collected = []
      if (onMap) {
        for (const [idx, v] of onMap) {
          const onv = v && v.lv != null ? Number(v.lv) : null
          if (onv == null || onv < vMin || onv > vMax) continue // 미설정/미설치 출력 제외
          const grp = (st.groups || []).find((g) => idx >= g.indexFrom && idx <= g.indexTo)
          if (!grp) continue // 범위 밖(정체불명 출력)은 제외
          const num = idx - grp.base
          const off = offMap && offMap.get(idx)
          const stv = stMap && stMap.get(idx)
          // descfk28 = C-Central "Timer" 모드(최소환기/순환), descfk574 = 실제 가동(릴레이 ON)
          const code = stv && stv.lv != null ? Number(stv.lv) : 0
          const rv = runMap && runMap.get(idx)
          const running = !!(rv && rv.lv != null && runOn.includes(Number(rv.lv)))
          const isMinVent = code === (st.minVentCode ?? 3)
          const isStir = grp.type === 'stir'
          // 상태: 실제 가동 중이면 역할에 따라(순환/최소환기/가동), 아니면 정지
          const status = !running ? '정지' : isStir ? '순환' : isMinVent ? '최소환기' : '가동'
          if (running && grp.countAsFan) house.fansRunning++
          if (isMinVent && grp.countAsFan) house.minVentFans++
          if (isStir && running) house.stirOn = true
          const order = grp.type === 'tunnel' ? 0 : grp.type === 'stir' ? 1 : 2
          collected.push({
            sort: order * 1000 + num,
            name: `${grp.name} ${num}`,
            type: grp.type,
            on: round(onv * sc, dc),
            off: off && off.lv != null ? round(Number(off.lv) * sc, dc) : null,
            running,
            status,
            modeTag: isMinVent ? '최소환기' : isStir ? '순환' : null,
          })
        }
      }
      collected.sort((a, b) => a.sort - b.sort)
      house.stages = collected.map(({ sort, ...rest }) => rest)
    }

    // 갱신시각 = 서버가 DB를 읽은 시각 (ControlUnit.lastUpdated는 갱신이 안 되는 필드라 사용하지 않음)
    house.updatedAt = formatKoreanTime(now)
    house.ageSeconds = 0
    house.stale = false

    // 알람
    const a = alarmByCu.get(cu)
    if (a) {
      const txt = cleanText(a.alarmText)
      if (txt && !inactive.includes(txt.toUpperCase())) {
        activeAlarms.push({ house: house.name, device: house.name, message: txt, datetime: house.updatedAt })
      }
    }

    houses.push(house)
  }

  return {
    generatedAt: now,
    demo: false,
    houses,
    alarms: { active: activeAlarms, recent: activeAlarms, total: activeAlarms.length },
  }
}

function formatKoreanTime(dt) {
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return String(dt)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
