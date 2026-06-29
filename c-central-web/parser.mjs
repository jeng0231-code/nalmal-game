// C-Central CSV 파서
// Chore-Time(Choretronics) C-Central이 기록하는 CSV 파일을 읽어
// 모바일 대시보드가 쓰기 좋은 JSON 구조로 변환한다. (읽기 전용)

import iconv from 'iconv-lite'

const SENSOR_ERROR_THRESHOLD = -99 // 이 값 이하는 센서 미연결/오류 신호값(예: -100.0)

/** 버퍼를 설정된 인코딩으로 디코딩한다. (한글 헤더는 보통 cp949) */
export function decodeBuffer(buf, encoding = 'cp949') {
  try {
    if (encoding && encoding.toLowerCase() !== 'utf8' && encoding.toLowerCase() !== 'utf-8') {
      return iconv.decode(buf, encoding)
    }
  } catch {
    // 인코딩 실패 시 utf8로 폴백
  }
  return buf.toString('utf8')
}

/** "2026-06-29" + "오후 10:16:30" → Date (로컬 시간). 실패 시 null */
export function parseKoreanTimestamp(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  const dm = dateStr.trim().match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (!dm) return null
  const [, y, mo, d] = dm

  let raw = timeStr.trim()
  let ampm = null
  const am = raw.match(/(오전|오후|AM|PM)/i)
  if (am) {
    ampm = am[1]
    raw = raw.replace(am[1], '').trim()
  }
  const tm = raw.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
  if (!tm) return null
  let h = Number(tm[1])
  const mi = Number(tm[2])
  const s = tm[3] ? Number(tm[3]) : 0

  if (ampm === '오후' || /pm/i.test(ampm || '')) {
    if (h < 12) h += 12
  } else if (ampm === '오전' || /am/i.test(ampm || '')) {
    if (h === 12) h = 0
  }
  const date = new Date(Number(y), Number(mo) - 1, Number(d), h, mi, s)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 컬럼 라벨로 종류/단위를 추정한다. */
function classifyMetric(label) {
  const l = String(label)
  if (/15\s*분.*음수량/.test(l)) return { kind: 'water', unit: '', short: '15분음수량' }
  if (/음수량/.test(l)) return { kind: 'water', unit: '', short: '음수량' }
  if (/평균온도|온도/.test(l) && !/^s\d/i.test(l)) return { kind: 'temp', unit: '°C', short: '평균온도' }
  if (/습도/.test(l)) return { kind: 'humidity', unit: '%', short: '습도' }
  if (/정압/.test(l)) return { kind: 'pressure', unit: 'Pa', short: '정압' }
  if (/^s\d/i.test(l)) return { kind: 'sensor', unit: '°C', short: l }
  return { kind: 'other', unit: '', short: l }
}

function splitLines(text) {
  return text.split(/\r?\n/).map((x) => x.trim()).filter((x) => x.length > 0)
}

/**
 * 실시간 CSV 파싱.
 * 헤더: `59@46@;2954;평균온도;습도;정압;음수량[1];...`  (앞 2개는 메타, 이후가 컬럼명)
 * 데이터: `2026-06-29;오후 10:16:30;25.3;90;0;...`        (앞 2개는 날짜/시각)
 */
export function parseRealtime(text, { trendPoints = 120 } = {}) {
  const lines = splitLines(text)
  if (lines.length < 2) return null

  const header = lines[0].split(';')
  const columns = header.slice(2).map((label) => ({ label, ...classifyMetric(label) }))

  const parseRow = (line) => {
    const t = line.split(';')
    if (t.length < 3) return null
    const timestamp = parseKoreanTimestamp(t[0], t[1])
    const values = columns.map((col, i) => {
      const raw = t[i + 2]
      const num = raw === undefined || raw === '' ? null : Number(raw)
      const error = num !== null && Number.isFinite(num) && num <= SENSOR_ERROR_THRESHOLD
      return {
        label: col.label,
        short: col.short,
        kind: col.kind,
        unit: col.unit,
        value: error ? null : num,
        error,
      }
    })
    return { date: t[0], time: t[1], timestamp: timestamp ? timestamp.getTime() : null, values }
  }

  const dataLines = lines.slice(1)
  const latest = parseRow(dataLines[dataLines.length - 1])
  if (!latest) return null

  // 추세(그래프)용: 마지막 N개 포인트의 핵심 지표만
  const tail = dataLines.slice(Math.max(0, dataLines.length - trendPoints))
  const trend = tail
    .map(parseRow)
    .filter(Boolean)
    .map((row) => {
      const pick = (kind) => {
        const m = row.values.find((v) => v.kind === kind)
        return m ? m.value : null
      }
      return { t: row.timestamp, temp: pick('temp'), humidity: pick('humidity'), pressure: pick('pressure') }
    })

  return { columns, latest, trend }
}

/**
 * 일별 CSV 파싱.
 * 헤더: `59@46@;2;일령음수량[1]`  데이터: `2026-06-28;오후 11:55:00;2840`
 */
export function parseDaily(text) {
  const lines = splitLines(text)
  if (lines.length < 2) return null
  const header = lines[0].split(';')
  const label = header[header.length - 1] || '일별값'
  const rows = lines.slice(1).map((line) => {
    const t = line.split(';')
    const num = t[2] === undefined || t[2] === '' ? null : Number(t[2])
    return { date: t[0], value: Number.isFinite(num) ? num : null }
  })
  return { label, rows, latest: rows[rows.length - 1] || null }
}

/** "C2STDD1 2.1" → 동 번호 "2" */
export function houseFromDevice(device) {
  if (!device) return null
  const m = String(device).match(/\s(\d+)(?:\.(\d+))?/)
  return m ? m[1] : null
}

/**
 * 알람 로그 파싱 (쉼표 구분).
 * `2026-06-29 오후 1:47:27,C2STDD1 2.1,enmAsLoud,enmAsCancelled,False,MAX REL PWR sens. 4`
 * 상태: enmAsLoud=울림, enmAsCancelled=해제, enmAsStandBy=대기
 */
export function parseAlarms(text, { recentCount = 30 } = {}) {
  const lines = splitLines(text)
  const events = []
  for (const line of lines) {
    const c = line.split(',')
    if (c.length < 4) continue
    const [dt, device, fromState, toState, ack, ...msg] = c
    const sp = dt.indexOf(' ')
    const dateStr = sp > 0 ? dt.slice(0, sp) : dt
    const timeStr = sp > 0 ? dt.slice(sp + 1) : ''
    const ts = parseKoreanTimestamp(dateStr, timeStr)
    events.push({
      datetime: dt.trim(),
      timestamp: ts ? ts.getTime() : null,
      device: (device || '').trim(),
      house: houseFromDevice(device),
      fromState: (fromState || '').trim(),
      toState: (toState || '').trim(),
      acknowledged: /true/i.test(ack || ''),
      message: msg.join(',').trim(),
      isAlarmOn: /loud/i.test(toState || ''),
    })
  }

  // 활성 알람: (장치+메시지)별 마지막 상태가 '울림(loud)'이면 진행중
  const lastState = new Map()
  for (const e of events) {
    lastState.set(`${e.device}|${e.message}`, e)
  }
  const active = [...lastState.values()].filter((e) => /loud/i.test(e.toState))

  const recent = events.slice(-recentCount).reverse()
  return { active, recent, total: events.length }
}
