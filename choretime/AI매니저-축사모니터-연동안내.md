# AI 사육 보조 매니저에 "축사 모니터" 메뉴 붙이기 — 연동 안내

이 문서는 **"AI 사육 보조 시스템" 프로젝트(별도 저장소)** 의 Claude 에게 넘겨주는 안내입니다.
축사 모니터(CT2)의 실시간 데이터를 그 보드 안의 한 페이지로 보여주기 위함입니다.

## 이미 되어 있는 것
- 제어 PC(농장)의 로컬 서버가 **15초마다** 이 보드로 데이터를 POST 하고 있습니다.
  - 엔드포인트: `POST /api/ct2-push`
  - 본문: `{ "token": "broiler_push_2026", "data": { ... } }`
  - 즉, 보드는 이미 최신 데이터를 받고 있음. **새 페이지만 추가하면 됨.**

## 해야 할 일 (그 보드 코드에서)
1. `POST /api/ct2-push` 로 들어온 `data` 를 **가장 최근 것으로 저장**(메모리/DB 아무거나).
   (이미 저장 중이면 그대로 사용)
2. **조회 엔드포인트** 추가: `GET /ct2/api/status` → 저장해 둔 `data` 를 그대로 JSON 반환.
   - 반환 시 `ageSeconds`(마지막 수신 후 경과초)와 `stale`(60초 초과면 true)만 다시 계산해 넣기.
3. **대시보드 화면** 추가: 아래 3개 정적 파일을 `/ct2/` 경로로 서빙.
   - 화면은 완성되어 있음. `app.js` 가 `/api/status` 를 fetch 하므로,
     **`/ct2/` 하위로 서빙하면 app.js 의 `fetch('/api/status')` 를 `fetch('api/status')`(상대경로)로 1줄만 바꾸면 됨.**
   - 파일(공개 raw, 그대로 받아서 사용):
     - index.html: https://raw.githubusercontent.com/jeng0231-code/nalmal-game/HEAD/choretime/public/index.html
     - app.js:     https://raw.githubusercontent.com/jeng0231-code/nalmal-game/HEAD/choretime/public/app.js
     - styles.css: https://raw.githubusercontent.com/jeng0231-code/nalmal-game/HEAD/choretime/public/styles.css
4. 보드 메뉴에 **"축사 모니터"** 항목을 만들어 `/ct2/` 로 링크.

## data 형태 (참고)
`data` 는 대략 아래 구조입니다(그대로 화면에 씀):
```json
{
  "houses": [
    { "id": "3", "name": "1동", "day": 31,
      "metrics": [ { "kind": "temp", "label": "평균온도", "value": 28.5, "unit": "°C" }, ... ],
      "sensors": [ { "value": 25.0, "unit": "°C" }, ... ],
      "info":    [ { "label": "최소환기 가동", "value": 15, "unit": "초" }, ... ],
      "stages":  [ { "name": "터널팬 1", "on": 32.5, "off": 32.0, "running": false, "type": "tunnel", "status": "정지" }, ... ],
      "fansRunning": 0, "minVentFans": 1, "stirOn": false, "updatedAt": "방금"
    }
  ],
  "alarms": { "active": [ { "house": "1동", "message": "..." } ] },
  "ageSeconds": 3, "stale": false, "display": null
}
```

## 완성된 참고 구현
같은 일을 하는 독립 서버가 이미 있습니다(그대로 참고/이식 가능):
- https://raw.githubusercontent.com/jeng0231-code/nalmal-game/HEAD/choretime/cloud-viewer/server.mjs

## 주의
- `/api/status` 경로가 보드의 기존 API 와 겹치지 않게 `/ct2/api/status` 처럼 분리하세요.
- 이 데이터는 읽기 전용 표시용입니다. 제어는 컨트롤러가 담당합니다.
