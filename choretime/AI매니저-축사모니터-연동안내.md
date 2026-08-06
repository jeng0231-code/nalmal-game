# AI 사육 보조 매니저에 "축사 모니터" 메뉴 붙이기 — 연동 안내 (턴키)

이 문서는 **"AI 사육 보조 시스템" 프로젝트(별도 저장소)** 의 Claude 에게 그대로 넘기면 됩니다.
축사 모니터(CT2)의 실시간 데이터를 그 보드 안의 한 페이지(`/ct2/`)로 보여주기 위함입니다.

## 이미 되어 있는 것 (건드릴 필요 없음)
- 농장 제어 PC 가 **15초마다** 이 보드로 데이터를 보내고 있습니다.
  - `POST /api/ct2-push`  본문: `{ "token": "broiler_push_2026", "data": { ... } }`
- 즉 데이터는 이미 도착 중. **표시할 페이지만 붙이면 됩니다.**

## 할 일 3가지

### 1) 들어온 데이터를 최신으로 보관
기존 `/api/ct2-push` 핸들러에서 `data` 를 최신값으로 저장하세요(메모리면 충분, DB 도 OK):
```js
let ct2 = { data: null, at: 0 }
// POST /api/ct2-push 안에서 토큰 확인 후:
ct2 = { data: req.body.data, at: Date.now() }
```

### 2) 조회 엔드포인트 + 대시보드 서빙 (그대로 복붙)
```js
import express from 'express'
// (위 ct2 보관 변수 사용)

// 조회 API — 대시보드가 부르는 주소. 신선도만 다시 계산해 반환.
app.get('/ct2/api/status', (req, res) => {
  res.set('Cache-Control', 'no-cache')
  if (!ct2.data) {
    return res.json({ houses: [], alarms: { active: [] }, ageSeconds: null, stale: true,
      message: '제어 PC 에서 데이터 수신 대기 중입니다.' })
  }
  const ageSeconds = Math.round((Date.now() - ct2.at) / 1000)
  res.json({ ...ct2.data, ageSeconds, stale: ageSeconds > 60 })
})

// 대시보드 정적 파일(아래 ct2-embed 3개 파일)을 /ct2/ 로 서빙
app.use('/ct2', express.static('ct2-embed'))
// /ct2 → /ct2/ (상대경로 fetch 가 /ct2/api/status 로 가도록 트레일링 슬래시 보정)
app.get('/ct2', (req, res) => res.redirect('/ct2/'))
```

**대시보드 파일**(그대로 받아 `ct2-embed/` 폴더에 넣기 — 수정 불필요, fetch 가 이미 상대경로):
- https://raw.githubusercontent.com/jeng0231-code/nalmal-game/refs/heads/claude/c-central-mobile-web-r2n1jf/choretime/ct2-embed/index.html
- https://raw.githubusercontent.com/jeng0231-code/nalmal-game/refs/heads/claude/c-central-mobile-web-r2n1jf/choretime/ct2-embed/app.js
- https://raw.githubusercontent.com/jeng0231-code/nalmal-game/refs/heads/claude/c-central-mobile-web-r2n1jf/choretime/ct2-embed/styles.css

### 3) 보드 메뉴에 "축사 모니터" 항목 추가 → 링크 `/ct2/` (끝에 슬래시)

## data 형태 (화면이 그대로 씀 — 참고용)
```json
{
  "houses": [
    { "id": "3", "name": "1동", "day": 31,
      "metrics": [ { "kind": "temp", "label": "평균온도", "value": 28.5, "unit": "°C" } ],
      "sensors": [ { "value": 25.0, "unit": "°C" } ],
      "info":    [ { "label": "최소환기 가동", "value": 15, "unit": "초" } ],
      "stages":  [ { "name": "터널팬 1", "on": 32.5, "off": 32.0, "running": false, "type": "tunnel", "status": "정지" } ],
      "fansRunning": 0, "minVentFans": 1, "stirOn": false, "updatedAt": "방금"
    }
  ],
  "alarms": { "active": [ { "house": "1동", "message": "..." } ] },
  "ageSeconds": 3, "stale": false, "display": null
}
```

## 확인
- 보드 배포 후 `https://(보드주소)/ct2/` 접속 → 1동/2동/3동 대시보드가 보이면 성공.
- 안 보이면: (a) `/api/ct2-push` 에서 `data` 를 저장하는지, (b) `/ct2/api/status` 가 그 data 를 주는지, (c) `/ct2` 링크에 **끝 슬래시**가 있는지 확인.

## 주의
- 경로는 `/ct2/...` 로 분리했으니 보드 기존 API 와 안 겹칩니다.
- 읽기 전용 표시용입니다. 제어·경보는 컨트롤러가 담당합니다.
