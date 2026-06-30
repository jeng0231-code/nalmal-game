# Auto-Discovery 엔진 (상용화 1순위)

새 농장에 설치하면 **그 농장의 C-Central DB를 스스로 읽어** 대시보드 설정(`mapping.json`)을
자동 생성한다. 사람이 손으로 코드·스케일·동·팬을 캐던 작업을 프로그램이 대신한다.

## 왜 가능한가
C-Central(CT2/CT3) 프로그램은 모든 농장이 동일하고, DB 안에 "자기 자신을 설명하는 표"가 있다:

| 알아낼 것 | 출처 테이블 | 방법 |
|----------|-----------|------|
| 동(House) 목록·이름 | `ControlUnit`, `Data`(code 35 문자열) | 직접 조회 |
| 측정 항목(온도·습도·정압·음수량·센서) + 라벨 | `SampleTaskSpec`(.text, datadescriptorfk) | CSV 정의가 곧 측정 항목 |
| **스케일/소수점(÷100·÷10)** | `DataDescriptor`→`DataFormat`→`DataConversion` | 하드코딩 제거, 자동 계산 |
| 상태 글자(A-ON/MIN VENT 등) | `OrderedText` / 상태값 매핑 | 자동 |
| 출력(팬/열풍기) 동별 개수·On/Off·릴레이·가동 | On=code0 / Off=code1 / 상태=code208(574) | **code(펌웨어 고정값)** 기준 |

## 핵심 원칙
- **descriptor fk(예: 603)는 DB마다 다름** → `code` / `dataDescriptorID`(RAM 주소) 같은 **펌웨어 고정값**으로 매핑해야 모든 농장에 통한다.
- 스케일은 **DataFormat을 읽어 자동 계산** (농장마다 손대지 않게).
- 비표준 배선(고장 릴레이 우회 등)은 자동으로 90% 잡고, 온보딩 때 농장주가 확인/수정.

## 산출물 (구현됨)
| 파일 | 역할 |
|------|------|
| `discover.sql` | 자기설명 표 전체를 읽는 지문 쿼리 (읽기 전용) |
| `discover.ps1` | 위 쿼리를 Windows 인증으로 실행 → `discovery.json` 저장 |
| `dictionary.mjs` | **펌웨어 표준 항목 사전** (code/RAM/스케일 — 모든 CT2/CT3 농장 공통) |
| `build-mapping.mjs` | `discovery.json` → `../mapping.json` 자동 생성 (+ `--calibrate` 보정 모드) |
| `자동설정.bat` | 농장주가 더블클릭 → 위 두 단계 자동 실행 |
| `build-mapping.test.mjs` | 합성 지문으로 생성 로직 검증 (`node discover/build-mapping.test.mjs`) |

## 사용법

**새 농장 (사전 보정 완료 후):**
```
discover\자동설정.bat   더블클릭   (discover.ps1 → build-mapping.mjs)
→ mapping.json 자동 생성, 미해결 항목은 화면에 표시
```
또는 수동으로:
```powershell
powershell -ExecutionPolicy Bypass -File discover\discover.ps1
node discover\build-mapping.mjs
```

**매칭 우선순위:** `ram`(RAM 주소, 고유) → `text`(SampleTaskSpec 측정 라벨) → `code`(+다중 index 구분).
`code` 는 포맷 분류라 충돌(평균온도·설정온도·On온도 모두 code 0)하므로 RAM/라벨로 먼저 잡는다.

## 보정(calibrate) — 사전을 완성하는 1회 작업
`dictionary.mjs` 의 일부 항목은 아직 `code/ram` 이 `null` 이다(우리 농장 RAM 주소 미확보분).
우리 농장에서 `discover.ps1` 을 한 번 돌린 뒤:
```powershell
node discover\build-mapping.mjs --calibrate
```
하면 `discovery.json` 의 descriptor별 code/RAM 을 **수작업으로 검증된 `../mapping.json`** 과 대조해
`dictionary.calibrated.json` 으로 저장한다. 이후 `build-mapping.mjs` 는 이 보정값을 자동으로 읽어
**다른 농장에서도** code/RAM 만으로 항목을 찾아낸다.

## 진행 단계
1. **[완료]** 자기설명 표 구조 파악 + 매칭 전략(ram>text>code) 확정
2. **[완료]** 지문 쿼리(`discover.sql`) + 발견 스크립트(`discover.ps1`)
3. **[완료]** `build-mapping.mjs` (생성 + `--calibrate` 보정) + 테스트
4. **[대기]** 사장님 농장에서 `discover.ps1` 1회 실행 → `--calibrate` 로 사전 완성 → 수작업 mapping과 일치 확인 → 다른 농장 파일럿
