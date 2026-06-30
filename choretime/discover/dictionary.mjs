// dictionary.mjs — CT2/CT3 펌웨어 "표준 항목 사전".
//
// 핵심 원리: 농장마다 descriptorfk(=datadescriptorpk)는 다르지만,
// 펌웨어가 같으면 code 와 dataDescriptorID(RAM 주소)는 동일하다.
// 그래서 사전은 펌웨어 고정값(code/ram)으로 항목을 정의하고,
// build-mapping 이 각 농장 DB에서 그에 해당하는 descriptorfk 를 찾아 넣는다.
//
// code 는 포맷 분류라서 충돌할 수 있다(예: 평균온도·설정온도·On설정온도 모두 code 0).
// 따라서 우선순위는  ram(고유) > text(측정라벨) > code(+템플릿)  순으로 매칭한다.
//
// ram 이 null 인 항목은 아직 미확정 → discover 후 `node build-mapping.mjs --calibrate` 로
// 우리 농장 mapping.json 과 대조해 자동 채운다(아래 STAGE_SPEC 도 동일).

// 측정/설정/설비/일령 등 단일·이름 항목
export const STANDARD_ITEMS = [
  // --- 측정값 (대부분 SampleTaskSpec 라벨로도 잡힘) ---
  { key: 'avgTemp',  role: 'measurement', label: '평균온도',   kind: 'temp',     unit: '°C', scale: 0.01, decimals: 1, code: 0,    ram: 12582912, text: /평균.?온도|avg.*temp/i },
  { key: 'humidity', role: 'measurement', label: '습도',       kind: 'humidity', unit: '%',  scale: 1,    decimals: 0, code: 176,  ram: 11579392, text: /습도|humidity|rh\b/i },
  { key: 'pressure', role: 'measurement', label: '정압',       kind: 'pressure', unit: 'Pa', scale: 0.1,  decimals: 0, code: 172,  ram: 11578368, text: /정압|static.*press|pressure/i },
  { key: 'outTemp',  role: 'measurement', label: '외부온도',   kind: 'out',      unit: '°C', scale: 0.01, decimals: 1, code: null, ram: null,     text: /외부.?온도|out(side|door)?.*temp/i },
  { key: 'water',    role: 'measurement', label: '음수량',     kind: 'water',    unit: '',   scale: 0.01, decimals: 0, code: null, ram: null,     text: /^음수|총.?음수|water(?!.*15)|drink/i },
  { key: 'water15',  role: 'measurement', label: '15분음수량', kind: 'water',    unit: '',   scale: 1,    decimals: 0, code: null, ram: null,     text: /15.?분.?음수|water.*15/i },

  // --- 설정값 ---
  { key: 'setTemp',  role: 'setting', label: '설정온도',     kind: 'settemp', unit: '°C', scale: 0.01, decimals: 1, code: 0,    ram: 2097152, text: /설정.?온도|set.?temp|target.*temp/i },
  { key: 'tunnelOn', role: 'setting', label: '터널전환온도', kind: 'other',   unit: '°C', scale: 0.01, decimals: 1, code: 0,    ram: null,    text: /터널.?전환|tunnel.*temp/i },

  // --- 일령 ---
  { key: 'dayAge',   role: 'day', label: '일령', kind: 'day', unit: '', scale: 1, decimals: 0, code: null, ram: null, text: /일령|bird.*age|day.*age|flock.*age/i },

  // --- 설비 설정 (Current Settings · Static Pressure 화면) ---
  { key: 'minVentOn',  role: 'info', label: '최소환기 가동', unit: '초', scale: 1,   decimals: 0, code: null, ram: null, text: /min.*vent.*on|최소.?환기.?가동/i },
  { key: 'minVentOff', role: 'info', label: '최소환기 정지', unit: '초', scale: 1,   decimals: 0, code: null, ram: null, text: /min.*vent.*off|최소.?환기.?정지/i },
  { key: 'spHigh',     role: 'info', label: '정압 상한',    unit: 'Pa', scale: 0.1, decimals: 0, code: null, ram: null, text: /sp.*high|정압.?상한/i },
  { key: 'spLow',      role: 'info', label: '정압 하한',    unit: 'Pa', scale: 0.1, decimals: 0, code: null, ram: null, text: /sp.*low|정압.?하한/i },
  { key: 'inlet',      role: 'info', label: '인렛 예측',    unit: '초', scale: 1,   decimals: 0, code: null, ram: null, text: /inlet|인렛/i },
  { key: 'windDelay',  role: 'info', label: '윈드 딜레이',  unit: '초', scale: 1,   decimals: 0, code: null, ram: null, text: /wind.*delay|윈드/i },
]

// 온도센서(여러 index) — 단일 descriptor, index1 별로 센서 1개
export const SENSOR_ITEM = {
  key: 'sensors', label: '온도센서', kind: 'sensor', unit: '°C', scale: 0.01, decimals: 1,
  errorBelow: -9000, code: null, ram: null, text: /센서|sensor|temp.*probe/i,
}

// 출력(팬·열풍기) 단계 — On/Off/상태/실가동 4개 descriptor + index 그룹.
// index1 = 출력번호. 그룹 경계/base 는 펌웨어 구조라 농장 공통(필요 시 온보딩에서 확인).
export const STAGE_SPEC = {
  on:     { key: 'stageOn',     role: 'stageOn',     code: 0,    ram: null }, // On 설정온도 (다중 index → 측정 temp와 RAM으로 구분)
  off:    { key: 'stageOff',    role: 'stageOff',    code: 1,    ram: null }, // Off 설정온도
  status: { key: 'stageStatus', role: 'stageStatus', code: null, ram: null }, // Timer 상태(0정지/3최소환기/5순환)
  run:    { key: 'stageRun',    role: 'stageRun',    code: 208,  ram: null }, // 실가동 상태(1 M-OFF/2 A-OFF/4 A-ON)
  runOnValues: [3, 4],
  scale: 0.01, decimals: 1, validMin: 1, validMax: 6000, minVentCode: 3,
  statusText: { 0: '정지', 3: '최소환기', 5: '순환' },
  // 출력 종류별 index 범위 (출력번호 = index - base)
  groups: [
    { name: '터널팬', indexFrom: 18,  indexTo: 49,  base: 17,  type: 'tunnel', countAsFan: true },
    { name: '순환팬', indexFrom: 50,  indexTo: 99,  base: 67,  type: 'stir',   countAsFan: false },
    { name: '열풍기', indexFrom: 128, indexTo: 150, base: 127, type: 'heater', countAsFan: false },
  ],
}

// 동 이름 문자열 항목 (Data.code = nameCode 의 stringValue)
export const NAME_CODE = 35

// 알람 텍스트 중 "진행중 아님"으로 볼 문구
export const ALARM_INACTIVE_TEXTS = ['', 'ALARMS DISABLED', 'NO ALARM', 'NO ALARMS', 'ALARM DISABLED']

// 기본 접속 정보 (농장마다 다르면 build-mapping 인자로 덮어씀)
export const DEFAULTS = { port: 8088, instance: 'localhost\\FCENTRAL_EXPRESS', database: 'FCentral' }
