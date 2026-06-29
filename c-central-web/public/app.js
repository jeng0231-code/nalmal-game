// 축사 모니터 — 모바일 대시보드 (읽기 전용)
const REFRESH_MS = 30000

const el = (id) => document.getElementById(id)
const connDot = el('conn-dot')
const connText = el('conn-text')
const refreshBtn = el('refresh-btn')

function fmtAge(sec) {
  if (sec == null) return '시각 미상'
  if (sec < 60) return '방금'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  return `${Math.floor(sec / 86400)}일 전`
}

function fmtNum(v) {
  if (v == null) return '—'
  return Number.isInteger(v) ? v.toLocaleString('ko-KR') : v.toString()
}

function metricCard(m, primary) {
  const cls = primary ? 'metric primary' : 'metric'
  if (m.error) {
    return `<div class="${cls}">
      <div class="label">${m.label}</div>
      <div class="value err">⚠ 센서 오류</div>
    </div>`
  }
  if (m.value == null) {
    return `<div class="${cls}">
      <div class="label">${m.label}</div>
      <div class="value" style="color:var(--muted)">—</div>
    </div>`
  }
  const unit = m.unit ? `<span class="unit">${m.unit}</span>` : ''
  return `<div class="${cls}">
    <div class="label">${m.label}</div>
    <div class="value">${fmtNum(m.value)}${unit}</div>
  </div>`
}

function sensorChip(s) {
  if (s.error || s.value == null) {
    return `<span class="chip err"><span class="k">${s.label}</span> 오류</span>`
  }
  return `<span class="chip"><span class="k">${s.label}</span> ${s.value}${s.unit || ''}</span>`
}

function houseCard(h) {
  if (!h.ok) {
    return `<section class="house"><div class="house-head"><div class="house-name">${h.name}</div></div>
      <div class="house-error">⚠ ${h.error || '데이터 없음'}</div></section>`
  }
  // 주요 지표 순서: 평균온도(크게) → 설정온도 → 습도, 정압, 음수량 …
  const order = ['temp', 'settemp', 'humidity', 'pressure', 'water', 'other']
  const sorted = [...h.metrics].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
  const temp = sorted.find((m) => m.kind === 'temp')
  const rest = sorted.filter((m) => m !== temp)

  const metricsHtml =
    (temp ? metricCard(temp, true) : '') + rest.map((m) => metricCard(m, false)).join('')

  const sensorsHtml = h.sensors.length
    ? `<div class="sensors"><div class="cap">개별 온도 센서</div>
        <div class="chips">${h.sensors.map(sensorChip).join('')}</div></div>`
    : ''

  const daily = h.dailyWater && h.dailyWater.latest
    ? `<div class="daily">전일 ${h.dailyWater.label.replace(/\[.*\]/, '')}: <b>${fmtNum(h.dailyWater.latest.value)}</b></div>`
    : ''

  const stagesHtml = h.stages && h.stages.length ? stagesSection(h.stages) : ''
  const infoHtml = h.info && h.info.length ? infoSection(h.info) : ''
  const dayBadge = h.day != null ? `<span class="day-badge">일령 ${h.day}일</span>` : ''
  const fanBadge = h.fansRunning
    ? `<span class="fan-badge">🌀 실가동 ${h.fansRunning}대</span>`
    : ''
  const mvBadge = h.minVentFans
    ? `<span class="mv-badge">💨 최소환기 ${h.minVentFans}개</span>`
    : ''

  const freshCls = h.stale ? 'fresh stale-text' : 'fresh'
  const staleCard = h.stale ? 'house stale' : 'house'

  return `<section class="${staleCard}">
    <div class="house-head">
      <div class="house-name"><span class="hname">${h.stale ? '🔴' : '🟢'} ${h.name}</span> ${dayBadge} ${fanBadge} ${mvBadge}</div>
      <div class="${freshCls}">
        <span class="age">${fmtAge(h.ageSeconds)}${h.stale ? ' · 끊김?' : ''}</span>
        <span>${h.updatedAt || ''}</span>
      </div>
    </div>
    <div class="metrics">${metricsHtml}</div>
    ${sensorsHtml}
    ${infoHtml}
    ${stagesHtml}
    ${daily}
  </section>`
}

function infoSection(info) {
  const rows = info
    .map((r) => `<div class="info-row"><span class="info-label">${r.label}</span><span class="info-val">${r.value}${r.unit || ''}</span></div>`)
    .join('')
  return `<div class="info-box">${rows}</div>`
}

function stagesSection(stages) {
  const rows = stages
    .map((s) => {
      const on = s.on != null ? `${s.on}°` : '—'
      const off = s.off != null ? `${s.off}°` : '—'
      const runChip = s.running
        ? '<span class="st-chip st-on">가동</span>'
        : '<span class="st-chip st-off">정지</span>'
      const tag = s.modeTag
        ? `<span class="st-chip ${s.modeTag === '최소환기' ? 'st-minvent' : 'st-stir'}">${s.modeTag}</span>`
        : ''
      return `<div class="stage-row ${s.running ? 'is-on' : ''}"><span class="stage-name">${s.name} ${runChip}${tag}</span><span class="stage-vals"><b>On ${on}</b> / Off ${off}</span></div>`
    })
    .join('')
  return `<details class="stages"><summary>환기 단계 설정·상태 (${stages.length})</summary><div class="stage-list">${rows}</div></details>`
}

function renderAlarms(alarms) {
  const banner = el('alarm-banner')
  if (alarms && alarms.active && alarms.active.length) {
    const items = alarms.active
      .map((a) => {
        const label = a.house ? (/^\d+$/.test(String(a.house)) ? a.house + '동' : a.house) : a.device
        return `<li><b>${label}</b> — ${a.message} <span style="color:#fecaca">(${a.datetime})</span></li>`
      })
      .join('')
    banner.innerHTML = `<h2>🚨 진행 중인 알람 ${alarms.active.length}건</h2><ul>${items}</ul>`
    banner.classList.remove('hidden')
  } else {
    banner.classList.add('hidden')
  }
}

function setConn(ok, text) {
  connDot.className = 'dot ' + (ok ? 'ok' : 'bad')
  connText.textContent = text
}

let timer = null
async function load() {
  refreshBtn.classList.add('spin')
  try {
    const res = await fetch('/api/status', { cache: 'no-store' })
    if (!res.ok) throw new Error('서버 오류 ' + res.status)
    const data = await res.json()

    renderAlarms(data.alarms)
    el('houses').innerHTML = data.houses.map(houseCard).join('') || '<p>표시할 동이 없습니다. config.json 경로를 확인하세요.</p>'

    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setConn(true, `갱신 ${hh}:${mm}`)

    el('footer-note').innerHTML =
      (data.demo ? '<div class="demo-badge">데모 데이터</div><br>' : '') +
      'C-Central 데이터를 30초마다 자동 갱신합니다 · 읽기 전용'
  } catch (e) {
    setConn(false, '연결 끊김')
    el('footer-note').textContent = '서버에 연결할 수 없습니다: ' + (e.message || e)
  } finally {
    refreshBtn.classList.remove('spin')
  }
}

function schedule() {
  if (timer) clearInterval(timer)
  timer = setInterval(load, REFRESH_MS)
}

refreshBtn.addEventListener('click', () => { load(); schedule() })
// 화면이 다시 보일 때 즉시 갱신 (폰에서 앱 전환 후 복귀 시)
document.addEventListener('visibilitychange', () => { if (!document.hidden) { load(); schedule() } })

load()
schedule()
