# 축사 모니터 (C-Central 모바일 웹) — 1단계: 보기 전용

Chore-Time **C-Central** 프로그램이 PC에 기록하는 CSV 데이터를 읽어, **휴대폰 브라우저에서 온도·습도·정압·음수량·센서·알람을 보는** 작은 웹 서버입니다.

> **안전합니다.** 이 프로그램은 C-Central이 만든 파일을 **읽기만** 합니다. 컨트롤러에 아무것도 쓰지 않으므로 축사 설정에 영향이 없습니다. (제어 기능은 안정화 후 2단계에서 추가 예정)

데이터 흐름:

```
컨트롤러 ──► C-Central(PC) ──► CSV 파일 ──► [이 서버] ──► 휴대폰 브라우저
                                          (읽기 전용)
```

---

## 1. 준비 (최초 1회)

1. **Node.js 설치** — https://nodejs.org 에서 LTS 버전 다운로드 후 설치 (그냥 "다음" 계속 누르면 됨)
2. 이 `c-central-web` 폴더를 **C-Central이 돌아가는 그 PC**에 복사
3. 폴더 안에서 명령 프롬프트(또는 PowerShell)를 열고:

   ```powershell
   npm install
   ```

---

## 2. 실행

**먼저 데모로 화면 확인** (실제 데이터 없이 샘플로 동작):

```powershell
npm run demo
```

브라우저에서 `http://localhost:8080` 접속 → 화면이 보이면 성공.

**실제 데이터로 실행:**

```powershell
npm start
```

> 실행 후 창에 "데이터 폴더가 없습니다" 경고가 뜨면 `config.json`의 경로를 확인하세요(아래 3번).

---

## 3. 설정 (`config.json`)

대부분 그대로 두면 됩니다. PC 환경이 다를 때만 수정하세요.

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `port` | 접속 포트 | `8080` |
| `dataDir` | 실시간 CSV가 쌓이는 폴더 | `C:\Data\Choretronics\C-Central\Sample` |
| `alarmFile` | 알람 로그 파일 | `C:\Data\Choretronics\C-Central\Alarm\AlarmLog.csv` |
| `encoding` | 파일 한글 인코딩 | `cp949` |
| `houseNames` | 동 번호 → 화면 이름 | `1동, 2동, 3동` |
| `staleSeconds` | 이 시간(초) 넘게 갱신 없으면 "끊김" 경고 | `600` (10분) |

> 경로의 역슬래시는 `\\`처럼 **두 번** 써야 합니다 (JSON 규칙).

---

## 4. 휴대폰에서 접속하기

### A. 축사와 같은 WiFi에 있을 때 (가장 간단)

1. 서버를 켠 PC의 IP를 확인 (예: `192.168.2.3`)
2. 휴대폰을 **같은 공유기 WiFi**에 연결
3. 휴대폰 브라우저에서 `http://192.168.2.3:8080` 접속
4. (선택) 브라우저 메뉴 → "홈 화면에 추가" 하면 앱처럼 사용 가능

> Windows 방화벽이 막으면, 최초 실행 시 뜨는 "액세스 허용" 창에서 허용을 눌러주세요.

### B. 밖에서(인터넷으로) 접속할 때 — Cloudflare Tunnel (무료, 추천)

집/축사 공유기 설정을 건드리지 않고 안전하게 외부 접속을 여는 방법입니다.

1. https://github.com/cloudflare/cloudflared/releases 에서 `cloudflared-windows-amd64.exe` 다운로드
2. 서버(`npm start`)를 켜둔 상태에서, 받은 파일을 명령 프롬프트로 실행:

   ```powershell
   cloudflared.exe tunnel --url http://localhost:8080
   ```

3. 화면에 나오는 `https://....trycloudflare.com` 주소를 휴대폰에서 열면 어디서든 접속됩니다.

> 고정 주소나 로그인 보호가 필요하면 Cloudflare 계정을 만들어 named tunnel + Access로 보호할 수 있습니다. 필요하면 그 설정도 도와드립니다.

---

## 5. PC 켤 때 자동 실행 (선택)

매번 명령어 치기 번거로우면, 아래 내용을 `start.bat`로 저장해 시작프로그램에 등록하세요:

```bat
cd /d "%~dp0"
node server.mjs
```

---

## 6. 문제 해결

| 증상 | 확인 |
|------|------|
| 한글이 깨져 보임 | `config.json`의 `encoding`을 `utf8`로 바꿔보기 |
| "표시할 동이 없습니다" | `dataDir` 경로가 맞는지, 그 폴더에 `G_data_...csv`가 있는지 확인 |
| 동이 "끊김"으로 표시 | C-Central이 켜져 있고 CSV가 갱신되는지, `staleSeconds`를 늘릴지 확인 |
| 휴대폰에서 접속 안 됨 | 같은 WiFi인지, 방화벽 허용했는지, IP·포트 확인 |
| 센서가 "오류"로 표시 | 값이 `-100`(미연결 신호)인 센서입니다. 실제 센서/배선 점검 필요 |

---

## 7. 2단계 예고 (제어)

1단계가 안정적으로 운영되면, 모바일에서 **설정 변경·ON/OFF 같은 제어**를 추가합니다.
제어는 컨트롤러에 직접 쓰는 작업이라 (1) 통신 규약 확인, (2) 비밀번호/권한, (3) 안전 한계값 같은 안전장치 설계가 먼저 필요합니다. 그때 별도로 진행합니다.

---

## 구성 파일

| 파일 | 역할 |
|------|------|
| `server.mjs` | 웹 서버 (CSV 읽어 API + 페이지 제공) |
| `parser.mjs` | CSV 파싱 로직 |
| `config.json` | 경로·포트·동 이름 설정 |
| `public/` | 모바일 대시보드 화면 |
| `sample/` | 데모용 샘플 데이터 |
| `parser.test.mjs` | 파서 검증 (`npm test`) |
