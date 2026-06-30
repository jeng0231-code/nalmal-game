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

## 산출물
- `discover.ps1` : DB를 읽어 발견 결과(JSON) 출력 (Windows 인증, 읽기 전용)
- `build-mapping.mjs` : 발견 JSON → `mapping.json` 자동 생성
- 설치 시 1회 실행 → 이후 대시보드가 그 mapping으로 동작

## 진행 단계
1. **[진행중]** 자기설명 표(DataFormat/DataConversion/UnitData/OrderedText) 구조 파악 → 자동 스케일/라벨 로직 확정
2. 발견 쿼리 작성(동·측정·출력·스케일·상태)
3. `build-mapping.mjs` 로 mapping 자동 생성
4. 사장님 농장에서 검증(수작업 mapping과 일치하는지) → 다른 농장 파일럿
