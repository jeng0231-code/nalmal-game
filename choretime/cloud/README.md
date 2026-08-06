# 축사모니터 라이선스 서버

농장 PC의 모니터링 에이전트를 **승인제**로 운영하기 위한 최소 서버입니다.
에이전트는 설치 시 서버에 등록(register)하고, 제품 소유자가 웹 관리자
화면(`/admin`)에서 **승인/중지**합니다. 에이전트는 상태가 `approved`일 때만
동작하므로, 무료 소프트웨어의 무단 재배포를 억제할 수 있습니다.

- 의존성: **express 하나뿐**
- 저장소: **JSON 파일 1개** (`data/licenses.json`) — 외부 DB 불필요
- Node **18+** (내장 `fetch` 사용 가능한 버전)

---

## 로컬 실행

```bash
cd choretime/cloud
npm install                 # express 설치
ADMIN_PASSWORD=원하는비밀번호 npm start
```

- 서버: `http://localhost:8090`
- 관리자: `http://localhost:8090/admin`
  - Basic 인증 창에서 아이디 `admin`, 비밀번호는 `ADMIN_PASSWORD` 값.

### 테스트

```bash
node server.test.mjs        # register→pending→approve→approved→suspend→suspended 흐름 검증
```

---

## Railway 배포

1. Railway에서 **New Project → Deploy from GitHub repo** 로 이 저장소를 연결합니다.
2. 서비스 **Settings → Root Directory** 를 `choretime/cloud` 로 지정합니다.
   (저장소 루트가 아니라 이 폴더가 앱의 루트여야 합니다.)
3. **Variables** 에 다음을 추가합니다.
   - `ADMIN_PASSWORD` = 관리자 비밀번호 (필수. 없으면 `changeme` 기본값 + 경고 로그)
   - (선택) `DATA_DIR` = 영구 볼륨 경로. 예: 볼륨을 `/data` 에 마운트하면 `DATA_DIR=/data`.
4. Railway는 `npm install` 후 `npm start`(= `node server.mjs`)를 실행합니다.
   포트는 Railway가 주입하는 `PORT` 환경변수를 자동으로 사용합니다.

> **데이터 영구 보존**: Railway 컨테이너는 재배포 시 파일 시스템이 초기화될 수
> 있습니다. 라이선스 목록을 유지하려면 **Volume**을 하나 붙이고 `DATA_DIR`를 그
> 마운트 경로로 설정하세요. 그렇지 않으면 승인 상태가 재배포마다 사라집니다.

---

## 동작 방식

```
농장 PC(에이전트)                     라이선스 서버                관리자
   |  POST /api/register  ───────────▶  기기 등록(pending)
   |                                         │
   |                                         │  GET /admin (Basic 인증)
   |                                         │◀──────────────────  목록 확인
   |                                         │  승인/중지 클릭
   |  GET /api/status/:id  ──────────▶  현재 상태 응답
   |◀── {status:'approved'} 이면 동작
```

- 에이전트는 주기적으로 `GET /api/status/:machineId` 를 호출해 상태를 확인합니다.
- `approved` 가 아니면(예: `pending`, `suspended`, `unknown`) 에이전트는 기능을
  멈추도록 구현하면 됩니다.

---

## API 요약

에이전트/관리자가 의존하는 계약입니다. (이름·형태 변경 금지)

| 메서드 | 경로 | 인증 | 요청 | 응답 |
|--------|------|------|------|------|
| POST | `/api/register` | 없음 | `{machineId,name,contact,address}` | `{status}` |
| GET | `/api/status/:machineId` | 없음 | — | `{status}` (미등록 시 `unknown`) |
| GET | `/admin` | Basic | — | 관리자 HTML |
| GET | `/admin/api/list` | Basic | — | `{licenses:[...]}` |
| POST | `/admin/api/approve` | Basic | `{machineId}` | `{ok:true,status}` |
| POST | `/admin/api/suspend` | Basic | `{machineId}` | `{ok:true,status}` |
| GET | `/` | 없음 | — | 공개 안내 HTML |

- `status` ∈ `pending` \| `approved` \| `suspended`, 미등록 조회는 `unknown`.
- 재등록(같은 `machineId`)은 이름/연락처/주소만 갱신하고 **기존 상태는 유지**합니다.
- 저장 레코드: `{ machineId, name, contact, address, status, createdAt, lastSeen, lastIp }`
