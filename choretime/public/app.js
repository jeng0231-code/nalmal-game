// 축사 모니터 — 모바일 대시보드 (읽기 전용)
const REFRESH_MS = 5000

const el = (id) => document.getElementById(id)
const connDot = el('conn-dot')
const connText = el('conn-text')
const refreshBtn = el('refresh-btn')

function fmtAge(sec) {
  if (sec == null) return '시각 미상'
  if (sec < 5) return '방금'
  if (sec < 60) return `${sec}초 전`
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
  const order = ['temp', 'settemp', 'out', 'humidity', 'pressure', 'water', 'other']
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

  // 배포용은 실시간 가동표시를 숨긴다(DB로는 부정확). 설정온도(환기 단계)는 유지.
  const showFan = DISPLAY.showFanStatus !== false
  const stagesHtml = h.stages && h.stages.length ? stagesSection(h.stages, showFan) : ''
  const infoHtml = h.info && h.info.length ? infoSection(h.info) : ''
  const runningHtml = showFan && h.stages && h.stages.length ? runningSummary(h.stages, h.stale, h.ageSeconds) : ''
  const dayBadge = h.day != null ? `<span class="day-badge">일령 ${h.day}일</span>` : ''
  const fanBadge = showFan && h.stirOn ? `<span class="fan-badge">🌀 순환팬 가동</span>` : ''
  const mvBadge = showFan && h.minVentFans
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
    ${runningHtml}
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

function runningSummary(stages, stale, ageSeconds) {
  const on = stages.filter((s) => s.running)
  // 데이터가 오래됐으면(끊김) 가동상태를 실시간처럼 단정하지 않는다.
  const staleNote = stale
    ? `<div class="run-stale">⚠ ${fmtAge(ageSeconds)} 값 — 지금 상태와 다를 수 있음</div>`
    : ''
  if (!on.length) {
    return `<div class="run-summary off">⚪ 현재 가동 팬 없음 (모두 정지)${staleNote}</div>`
  }
  const items = on
    .map((s) => {
      const cls = s.status === '순환' ? 'st-stir' : s.status === '최소환기' ? 'st-minvent' : 'st-on'
      return `<span class="run-item ${cls}">${s.name}<span class="run-mode">${s.status}</span></span>`
    })
    .join('')
  const title = stale ? `🔴 가동 (${on.length}) · ${fmtAge(ageSeconds)} 값` : `🟢 현재 가동 (${on.length})`
  return `<div class="run-summary${stale ? ' stale-run' : ''}"><div class="run-summary-title">${title}</div><div class="run-items">${items}</div>${staleNote}</div>`
}

function stageChipClass(s) {
  if (s.status === '순환') return 'st-stir'
  if (s.status === '최소환기') return 'st-minvent'
  if (s.running) return 'st-on'
  return 'st-off'
}

function stagesSection(stages, showFan = true) {
  const rows = stages
    .map((s) => {
      const on = s.on != null ? `${s.on}°` : '—'
      const off = s.off != null ? `${s.off}°` : '—'
      // 배포용(showFan=false)은 가동/정지 상태칩을 빼고 설정온도만 보여준다.
      const chip = showFan ? ` <span class="st-chip ${stageChipClass(s)}">${s.status}</span>` : ''
      const onCls = showFan && s.running ? 'is-on' : ''
      return `<div class="stage-row ${onCls}"><span class="stage-name">${s.name}${chip}</span><span class="stage-vals"><b>On ${on}</b> / Off ${off}</span></div>`
    })
    .join('')
  // 기본은 접힌 상태. 제목(요약)을 누르면 펼쳐지고 다시 누르면 접힌다.
  const openAttr = ''
  const title = showFan ? '환기 단계 설정·상태' : '환기 단계 설정온도'
  return `<details class="stages"${openAttr}><summary>${title} (${stages.length})</summary><div class="stage-list">${rows}</div></details>`
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

function renderLock(data) {
  const banner = el('alarm-banner'); if (banner) banner.classList.add('hidden')
  el('houses').innerHTML = `<div style="max-width:480px;margin:56px auto;text-align:center;background:#111827;border:1px solid #334155;border-radius:14px;padding:36px 24px;color:#e5e7eb">
    <div style="font-size:52px">🔒</div>
    <div style="font-size:18px;font-weight:800;margin:12px 0">${data.message || '승인 대기 중'}</div>
    <div style="font-size:13px;color:#94a3b8">아래 <b>기기 ID</b>를 관리자에게 알려주세요</div>
    <div style="margin-top:10px;font-family:monospace;font-size:15px;color:#93c5fd;background:#0b1220;padding:10px;border-radius:8px">${data.machineId || ''}</div>
  </div>`
}

let timer = null
let DISPLAY = {} // 서버가 보내는 표시 설정(mapping.display). 배포용은 showFanStatus:false.
let PUBLIC_URL = null // 서버가 만든 무료 외부주소(cloudflare). 있으면 QR·배너에 사용.
async function load() {
  refreshBtn.classList.add('spin')
  try {
    const res = await fetch('/api/status', { cache: 'no-store' })
    if (!res.ok) throw new Error('서버 오류 ' + res.status)
    const data = await res.json()
    // ?dist=1 이면 서버 설정과 무관하게 배포용 모습으로 미리보기 (사장님 실제 화면은 그대로)
    const forceDist = new URLSearchParams(location.search).has('dist')
    DISPLAY = forceDist ? { showFanStatus: false } : (data.display || {})
    PUBLIC_URL = data.publicUrl || null
    if (window.updatePublicBanner) window.updatePublicBanner()

    // 라이선스 승인 전/중지: 데이터 대신 잠금 화면
    if (data.locked) {
      renderLock(data)
      setConn(true, data.licenseState === 'suspended' ? '사용 중지' : '승인 대기')
      el('footer-note').textContent = '관리자 승인 후 이용할 수 있습니다.'
      return
    }

    renderAlarms(data.alarms)
    el('houses').innerHTML = data.houses.map(houseCard).join('') || '<p>표시할 동이 없습니다. config.json 경로를 확인하세요.</p>'

    const now = new Date()
    const p = (n) => String(n).padStart(2, '0')
    const clock = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`
    setConn(true, `갱신 ${clock}`)

    el('footer-note').innerHTML =
      (data.demo ? '<div class="demo-badge">데모 데이터</div><br>' : '') +
      `마지막 갱신 ${clock} · 15초마다 자동 갱신 · 읽기 전용`
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

// 📱 폰으로 보기 — 현재 접속 주소를 QR로 표시. 외부주소(웹공개.bat)로 열려 있으면 그 주소가 QR로 나와,
// 폰 카메라로 찍으면 폰에서 바로 접속된다.
;(function addQrButton() {
  const css = `
  .qr-fab{position:fixed;right:14px;bottom:14px;z-index:50;padding:10px 14px;border:0;border-radius:22px;
    background:#2563eb;color:#fff;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer}
  .qr-overlay{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center}
  .qr-overlay.hidden{display:none}
  .qr-box{background:#111827;border:1px solid #334155;border-radius:14px;padding:20px;max-width:340px;text-align:center;color:#e5e7eb}
  .qr-title{font-size:15px;font-weight:700;margin-bottom:12px}
  .qr-img{width:260px;height:260px;background:#fff;border-radius:8px}
  .qr-url{margin-top:10px;font-size:12px;color:#93c5fd;word-break:break-all}
  .qr-note{margin-top:10px;font-size:12px;color:#94a3b8;line-height:1.5}
  .qr-close{margin-top:14px;padding:8px 18px;border:0;border-radius:8px;background:#374151;color:#fff;font-size:14px;cursor:pointer}`
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style)
  const btn = document.createElement('button'); btn.className = 'qr-fab'; btn.textContent = '📱 폰으로 보기'
  const overlay = document.createElement('div'); overlay.className = 'qr-overlay hidden'
  overlay.innerHTML = `<div class="qr-box">
    <div class="qr-title">📱 폰 카메라로 QR을 찍으세요</div>
    <img class="qr-img" alt="QR">
    <div class="qr-url"></div>
    <div class="qr-note">이 PC가 <b>외부 주소(웹공개.bat)</b>로 열려 있어야 폰에서 접속됩니다.<br>주소창이 <b>localhost</b>면 폰에선 안 열립니다.</div>
    <button class="qr-close">닫기</button></div>`
  document.body.append(btn, overlay)
  btn.addEventListener('click', () => {
    // 서버가 만든 외부주소가 있으면 그걸(외부 어디서나 접속), 없으면 현재 주소를 QR로.
    const url = PUBLIC_URL || location.href
    overlay.querySelector('.qr-img').src = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(url)
    overlay.querySelector('.qr-url').textContent = url
    overlay.querySelector('.qr-note').innerHTML = PUBLIC_URL
      ? '이 주소는 <b>외부 어디서나</b> 접속됩니다 (같은 WiFi 아니어도 OK).'
      : '이 PC가 <b>외부주소</b>로 열려 있어야 폰에서 접속됩니다.'
    overlay.classList.remove('hidden')
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('qr-close')) overlay.classList.add('hidden')
  })

  // 상단 배너: 외부주소가 잡히면 표시(복사 가능)
  const banner = document.createElement('div'); banner.className = 'pub-banner hidden'
  document.body.appendChild(banner)
  const bstyle = document.createElement('style'); bstyle.textContent = `
    .pub-banner{position:sticky;top:0;z-index:40;background:#065f46;color:#d1fae5;padding:8px 12px;font-size:13px;text-align:center;cursor:pointer}
    .pub-banner.hidden{display:none} .pub-banner b{color:#fff}`
  document.head.appendChild(bstyle)
  window.updatePublicBanner = () => {
    if (PUBLIC_URL) { banner.innerHTML = `🌐 외부 접속 주소(복사): <b>${PUBLIC_URL}</b> · 📱버튼으로 QR`; banner.classList.remove('hidden') }
    else banner.classList.add('hidden')
  }
  banner.addEventListener('click', () => { if (PUBLIC_URL) navigator.clipboard?.writeText(PUBLIC_URL) })
})()
