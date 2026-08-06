// cloud-viewer/server.mjs
// 제어 PC(로컬 서버)가 15초마다 보내는(push) 데이터를 받아, 그대로 대시보드로 보여주는 Railway 앱.
// 고정 주소(안 바뀜) 제공이 목적. 데이터는 마지막으로 받은 것을 메모리에 보관한다.
import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8080
const TOKEN = process.env.PUSH_TOKEN || 'ct-viewer-2026' // 제어 PC 의 viewerToken 과 같아야 함
const STALE_SECONDS = Number(process.env.STALE_SECONDS || 60) // 이 시간 넘게 안 오면 '오래됨' 표시

const app = express()
app.use(express.json({ limit: '4mb' }))

let store = { data: null, receivedAt: 0 }

// 제어 PC → 데이터 수신
app.post('/api/ct2-push', (req, res) => {
  const { token, data } = req.body || {}
  if (token !== TOKEN) return res.status(401).json({ error: 'bad token' })
  if (!data || !Array.isArray(data.houses)) return res.status(400).json({ error: 'no data' })
  store = { data, receivedAt: Date.now() }
  res.json({ ok: true })
})

// 대시보드 → 상태 조회 (마지막 수신 데이터 + 신선도 재계산)
app.get('/api/status', (req, res) => {
  res.set('Cache-Control', 'no-cache')
  if (!store.data) {
    return res.json({
      houses: [], alarms: { active: [] }, ageSeconds: null, stale: true, display: null, publicUrl: null,
      message: '아직 제어 PC 에서 데이터가 오지 않았습니다. 제어 PC 에서 시작.bat 이 켜져 있는지 확인하세요.',
    })
  }
  const ageSeconds = Math.round((Date.now() - store.receivedAt) / 1000)
  res.json({ ...store.data, ageSeconds, stale: ageSeconds > STALE_SECONDS, publicUrl: null })
})

app.get('/api/public-url', (req, res) => res.json({ url: null }))
app.get('/healthz', (req, res) => res.type('text').send('ok'))

// 대시보드 정적 파일(로컬과 동일한 화면)
app.use(express.static(join(here, 'public'), { setHeaders: (r) => r.setHeader('Cache-Control', 'no-cache') }))

app.listen(PORT, () => {
  console.log(`[viewer] listening on :${PORT}`)
  console.log(`[viewer] push token = ${TOKEN} (제어 PC viewerToken 과 일치해야 함)`)
})
