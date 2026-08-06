// C-Central 모바일 모니터링 서버 (1단계: 읽기 전용)
// 축사 PC에서 실행 → C-Central CSV를 읽어 JSON API + 모바일 웹페이지 제공.
// 컨트롤러에 아무것도 쓰지 않으므로 안전하다.

import express from 'express'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { decodeBuffer, parseRealtime, parseDaily, parseAlarms } from './parser.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const DEMO = process.argv.includes('--demo')

// ---- 설정 로드 ----
const config = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'))
if (DEMO) {
  config.dataDir = join(here, 'sample')
  config.alarmFile = join(here, 'sample', 'AlarmLog.csv')
  config.encoding = 'utf8' // 번들 샘플은 utf8
  config.staleSeconds = 10 ** 9 // 데모에서는 신선도 경고 끔
}
const PORT = process.env.PORT || config.port || 8080

const realtimeRe = new RegExp(config.realtimePattern)
const dailyRe = new RegExp(config.dailyPattern)

function readDecoded(path) {
  return decodeBuffer(readFileSync(path), config.encoding)
}

// dataDir 안에서 동별 실시간/일별 파일을 찾는다.
function discoverFiles() {
  const houses = new Map() // id -> { realtime, daily }
  if (!existsSync(config.dataDir)) return houses
  for (const name of readdirSync(config.dataDir)) {
    let m = name.match(realtimeRe)
    if (m) {
      const id = m[1]
      if (!houses.has(id)) houses.set(id, {})
      houses.get(id).realtime = join(config.dataDir, name)
      continue
    }
    m = name.match(dailyRe)
    if (m) {
      const id = m[1]
      if (!houses.has(id)) houses.set(id, {})
      houses.get(id).daily = join(config.dataDir, name)
    }
  }
  return houses
}

function buildStatus() {
  const now = Date.now()
  const filesByHouse = discoverFiles()
  const houseIds = [...filesByHouse.keys()].sort((a, b) => Number(a) - Number(b))

  const houses = []
  for (const id of houseIds) {
    const f = filesByHouse.get(id)
    const house = {
      id,
      name: (config.houseNames && config.houseNames[id]) || `${id}동`,
      ok: false,
      error: null,
      updatedAt: null,
      ageSeconds: null,
      stale: false,
      metrics: [],
      sensors: [],
      dailyWater: null,
      trend: [],
    }
    try {
      if (f.realtime) {
        const rt = parseRealtime(readDecoded(f.realtime), { trendPoints: config.trendPoints })
        if (rt) {
          house.ok = true
          house.updatedAt = rt.latest.date + ' ' + rt.latest.time
          if (rt.latest.timestamp) {
            house.ageSeconds = Math.max(0, Math.round((now - rt.latest.timestamp) / 1000))
            house.stale = house.ageSeconds > config.staleSeconds
          }
          house.metrics = rt.latest.values.filter((v) => v.kind !== 'sensor')
          house.sensors = rt.latest.values.filter((v) => v.kind === 'sensor')
          house.trend = rt.trend
        }
      } else {
        house.error = '실시간 파일 없음'
      }
      if (f.daily) {
        const d = parseDaily(readDecoded(f.daily))
        if (d) house.dailyWater = { label: d.label, latest: d.latest, rows: d.rows.slice(-7) }
      }
    } catch (e) {
      house.error = String(e.message || e)
    }
    houses.push(house)
  }

  // 알람
  let alarms = { active: [], recent: [], total: 0 }
  try {
    if (config.alarmFile && existsSync(config.alarmFile)) {
      alarms = parseAlarms(readDecoded(config.alarmFile))
    }
  } catch (e) {
    alarms.error = String(e.message || e)
  }

  return { generatedAt: now, demo: DEMO, houses, alarms }
}

// ---- 서버 ----
const app = express()
app.use(express.static(join(here, 'public')))

app.get('/api/status', (req, res) => {
  try {
    res.json(buildStatus())
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, demo: DEMO, dataDir: config.dataDir, dataDirExists: existsSync(config.dataDir) })
})

app.listen(PORT, () => {
  console.log('\n  C-Central 모바일 모니터링 서버')
  console.log('  ───────────────────────────────')
  console.log(`  주소     : http://localhost:${PORT}`)
  console.log(`  같은 WiFi: http://<이 PC의 IP>:${PORT}  (예: http://192.168.2.3:${PORT})`)
  console.log(`  모드     : ${DEMO ? '데모(샘플 데이터)' : '실제 데이터'}`)
  console.log(`  데이터   : ${config.dataDir}`)
  if (!DEMO && !existsSync(config.dataDir)) {
    console.log('\n  ⚠️  데이터 폴더가 없습니다. config.json의 dataDir 경로를 확인하세요.')
    console.log('     (테스트만 하려면  npm run demo  로 실행)')
  }
  console.log('\n  종료하려면 Ctrl + C\n')
})
