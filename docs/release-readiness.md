# K-학당 출시 준비 현황

이 문서는 Google Play 수익화 출시까지 반복 작업의 기준점이다.

## 현재 확인

- 프로덕션 빌드: 2026-05-26 재검증 통과
- 앱 메타데이터: `index.html`, `public/manifest.json` 한글 깨짐 수정 완료
- 린트: 통과. 에러 0개, 경고 0개
- E2E 브라우저 검증: 최신 재실행(2026-05-26) 통과 21개, 실패 0개, 경고 1개
- 초기 엔트리 번들: `dist/assets/index-CtOayi58.js` 약 185 kB, 라우트/미니게임/모달 분리 완료
- 잔여 대형 청크: `quizData` 약 45 kB, `sdk` 약 80.5 kB, `QuizPage` 약 43.8 kB. 이번 세션에서 SDK 정적 import 제거 및 AI 뱅크 백그라운드 로딩으로 초기 진입 경로 분리 적용
- Playwright 자동화: Windows 로컬에서 번들 Chromium이 없어도 `msedge` 채널 폴백으로 실행 가능
- Claude API 미연결 시: 콘솔 에러 대신 경고 1회 후 기본 문제로 폴백
- 제품 전략 분석: `docs/product-strategy-audit.md` 추가 완료
- 교육 적합성: 신분제 중심 표현 일부를 성장 단계 표현으로 수정 완료
- 퀴즈 메타데이터 리포트: `npm run report:quiz-metadata`로 적용 현황 확인 가능
- 퀴즈 메타데이터 회귀 검증: `npm run check:quiz-metadata`로 완전 적용 27문제 기준 유지 확인 가능
- 정책 초안: `docs/privacy-data-safety-draft.md`에 개인정보·데이터 안전·가족 대상 보수 기준 초안 추가
- 배포용 개인정보처리방침 초안: `public/privacy-policy.html` 추가
- Play Console 데이터 안전 입력 초안: `docs/google-play-data-safety.md` 추가
- AI 출시 기본값: `VITE_ENABLE_CLAUDE_FEATURES=false` 기준으로 퀴즈 AI 뱅크와 사진 AI 변환이 기본 비활성화되도록 연결 완료

## 현재 블로커

- 정책 영향: 브라우저에서 Claude API를 직접 호출하는 경로(`src/services/claudeApi.ts`, `src/services/avatarAiService.ts`)는 기본 비활성화가 완료됐지만, 정식 출시 전에 "계속 비활성화 유지" 또는 "서버 경유 전환" 중 하나를 최종 결정해야 한다.
- 정책 문서: `public/privacy-policy.html`는 출시 준비용 초안이므로, 정식 출시 전 운영 문의 연락처와 실제 SDK 기준 최종 문구 확정이 필요하다.

## 이번 루프 변경 (2026-05-26 Codex 세션 — 정책 제출 문안 마감 시작)

- `public/privacy-policy.html`
  - 정적 배포 가능한 개인정보처리방침 초안 페이지 추가
  - 현재 기본 출시 설정이 AI 비활성화·광고/결제/분석 SDK 미연동 상태임을 명시
  - 로컬 저장 데이터, 사진/카메라 사용, 제3자 전송 가능성, 아동 보호 원칙, 삭제 방법 정리
- `docs/google-play-data-safety.md`
  - Google Play Console 데이터 안전 답변용 초안 문서 추가
  - 현재 기본 출시 설정에서 “외부 수집 없음, 외부 공유 없음” 기준으로 정리
  - AI/광고/결제/분석 SDK 추가 시 즉시 문안 재검토가 필요하다는 리스크 메모 추가
- 검증
  - `npm run lint`: 예정
  - `npm run build`: 예정

## 이번 루프 변경 (2026-05-26 Codex 세션 — AI 기본 비활성화 연결)

- `src/services/claudeFeatureFlag.ts`
  - `VITE_ENABLE_CLAUDE_FEATURES` 값을 해석하는 공용 플래그 유틸 추가
  - 기본값은 `false`로 간주해 출시 빌드에서 AI 기능이 자동 활성화되지 않도록 고정
- `src/services/claudeApi.ts`
  - AI 문제 생성 경로 전체가 운영 플래그가 켜진 경우에만 동작하도록 차단
- `src/services/avatarAiService.ts`
  - `@anthropic-ai/sdk` 정적 import 제거
  - 운영 플래그가 켜진 경우에만 SDK를 지연 로딩하고 사진 분석을 시도하도록 변경
- `src/pages/QuizPage.tsx`
  - AI 기능이 꺼져 있으면 AI 문제 뱅크 백그라운드 로딩을 건너뛰고 기본 문제 안내 문구만 표시
- `src/components/character/AvatarCreator.tsx`
  - AI 캐릭터 변환 버튼을 운영 플래그 뒤로 숨기고, 꺼진 상태에서는 “출시 준비 중” 안내와 사진 그대로 사용 흐름만 노출
- `.env.example`
  - `VITE_ENABLE_CLAUDE_FEATURES=false` 예시 추가
- `docs/privacy-data-safety-draft.md`
  - 권장안 A에 운영 플래그 기본값 명시
- 검증
  - `npm run lint`: 통과
  - `npx tsc -p tsconfig.app.json --noEmit --incremental false`: 통과
  - `npx tsc -p tsconfig.node.json --noEmit --incremental false`: 통과
  - `npm run build`: 통과
  - `npm run test:e2e`: 통과 21개, 실패 0개, 경고 1개

## 이번 루프 변경 (2026-05-26 Codex 세션 — SDK 청크 분리)

- `src/services/claudeApi.ts`
  - `@anthropic-ai/sdk` 정적 import를 type-only import + 함수 내부 dynamic import로 전환
  - API 키가 있고 Claude 사용 가능 상태일 때만 SDK 청크를 로드하도록 `getClaudeClient()` 지연 초기화 추가
  - Claude SDK 로딩 실패 시 기존 5분 임시 비활성화 경로로 폴백
- `src/pages/QuizPage.tsx`
  - 퀴즈 진입 시 기본 문제 데이터만 먼저 로드하고 `stage-intro`로 전환
  - AI 문제 뱅크 생성/조회는 백그라운드에서 실행한 뒤 준비되면 `allQuestions`에 중복 없이 병합
  - 랜덤 진입 경로에서 AI 뱅크 대기를 제거해 첫 스테이지 시작 전 대기 시간을 줄임
- 검증
  - `npm run test:e2e`: 실패. `scripts/test-run.log` 파일 생성 `EPERM`으로 오케스트레이터가 중단됨
  - `npm run lint`: 통과
  - `npx tsc -p tsconfig.app.json --noEmit --incremental false`: 통과
  - `npx tsc -p tsconfig.node.json --noEmit --incremental false`: 통과
  - `npm run build`: 실패. 일반 파일 쓰기 제한 때문에 `node_modules/.tmp/*.tsbuildinfo` 생성 `EPERM` 발생

## 이번 루프 변경 (2026-05-26 Codex 세션)

- `src/components/quiz/OXQuiz.tsx`
  - `learningGoal`이 있는 문제에 학습 목표 패널 추가
  - `hintText`가 있는 문제에 무료 학습 힌트 토글 추가
  - 기존 코인 힌트는 `해설 미리보기`로 이름을 분리해 무료 학습 힌트와 역할을 구분
- `scripts/quiz-metadata-report.cjs`
  - 5개 학당 전체 문제의 `learningGoal`, `hintText`, `tags` 적용 현황을 집계하는 리포트 스크립트 추가
  - `--strict --min-complete=27` 옵션으로 메타데이터 회귀를 막는 검증 모드 추가
- `package.json`
  - `report:quiz-metadata`, `check:quiz-metadata` 스크립트 추가

## 이번 루프 변경 (2026-05-26 Codex 세션 — 정책 초안 정리)

- `docs/privacy-data-safety-draft.md`
  - 현재 코드 기준 로컬 저장 데이터, 외부 전송 가능 데이터, Google Play 데이터 안전 검토 포인트 정리
  - 어린이/가족 대상 가능성을 기준으로 보수적 광고·결제·AI 기능 원칙 정리
  - 브라우저 직접 Claude API 호출 구조를 출시 전 정책 리스크로 명시
  - 초기 출시 권장안으로 “AI 기능 기본 비활성화”와 “서버 경유 전환 시 재검토”를 제안
- 검증
  - `npm run lint`: 통과

## 일일 자동 루프 (2026-05-26 10:13)

| 항목 | 결과 |
|------|------|
| 린트 | ✅ 에러 0개 |
| 빌드 | ✅ 통과 (131 modules, 185kB) |
| 콘텐츠 | ✅ 전 학당 기준 충족 (언어 117 / 속담 30 / 사자성어 30 / 역사 30 / 예절 20) |
| 앱 아이콘 | ❌ public/icon-512.png 없음 |
| 피처 그래픽 | ❌ public/feature-graphic.png 없음 |
| 스크린샷 | ❌ public/screenshots/ 없음 |
| Capacitor | ❌ android/ 없음 |
| 개인정보처리방침 | ✅ 존재 |

→ 다음 Claude Code 작업: Capacitor Android 설정 + Google Play 출시 자산 생성

## 이번 루프 변경 (2026-05-26 Claude Code 세션 — 코드리뷰 버그픽스)

`/code-review`로 발견된 버그 6개 수정:

1. **`AvatarCreator.tsx` — `capturePhoto` 블랙 캡처 버그 수정**
   - `video.videoWidth === 0`일 때 조기 리턴 + 에러 메시지 표시
   - `<video onCanPlay>` → `videoReady` 상태 관리
   - 📸 찍기 버튼 `disabled={!videoReady}` + "⏳ 준비 중..." 표시

2. **`AvatarCreator.tsx` — `startCamera` 더블클릭 MediaStream 누수 수정**
   - `isStartingCameraRef` guard 추가 — 동시 실행 방지

3. **`AvatarCreator.tsx` — `onCharacterCreated` 미전달 시 무반응 수정**
   - `onCharacterCreated` 없으면 `onAvatarCreated(capturedPhoto)` 폴백

4. **`claudeApi.ts` — `disableClaudeTemporarily` 5분 자동 복구 추가**
   - `apiFallbackAt` 타임스탬프 저장
   - `canUseClaude()`에서 5분 경과 시 자동 재활성화
   - 경고 메시지: "5분 후 자동 재시도합니다"

5. **`claudeApi.ts` — `getOrBuildAIBank` lastGenDate 허위 기록 수정**
   - `unique.length === 0`이면 `saveMeta` 호출 안 함

6. **`QuizPage.tsx` — `startStage` 최종 선택 문제 중복 ID 제거**
   - `selected` 배열 마지막에 `Set` 기반 dedup 추가
   - `key={question.id}` 기반 state 초기화 보장

- 린트: **에러 0개**, 빌드: **통과** (130 modules)

## 이번 루프 변경 (2026-05-25 Claude Code 세션 — 메타데이터 확장)

- `src/types/index.ts` — `QuizQuestion`에 교육 메타데이터 3개 선택 필드 추가:
  - `learningGoal?: string` — 이 문제를 통해 배우는 핵심 개념
  - `hintText?: string` — 정답 직접 노출 없는 학습 힌트
  - `tags?: string[]` — 세부 분류 태그
- 5개 학당 데이터 파일에 각 4~6문제씩 메타데이터 예시 적용 (총 27문제)
- `src/components/quiz/MultipleChoiceQuiz.tsx` — `hintText` 있는 문제에 💡 힌트 보기(무료) 토글 UI 추가
- 린트: **에러 0개**, 빌드: **통과** (130 modules)

## 이번 루프 변경 (2026-05-25 Claude Code 세션)

- `src/components/character/AvatarCreator.tsx` 전면 재작성:
  - 카메라 핵심 버그 수정 — `<video>` 조건부 렌더링으로 `videoRef.current === null` 문제 → `hidden` CSS로 항상 DOM 유지
  - `navigator.mediaDevices` 미존재(HTTP 비-localhost) 환경 사전 체크 추가
  - `video.play()` 명시 호출 추가 (dynamic srcObject 설정 후 자동재생 미작동 브라우저 대응)
  - 점진적 카메라 제약 조건 4단계 폴백 적용 (NotReadableError 등 상세 안내 포함)
  - `🤖 AI 이모지로 변환하기` 기능 추가: 사진 → Claude Vision API → SVG 조선 캐릭터 자동 생성
- `src/services/claudeApi.ts`:
  - `analyzePhotoToCharacter()` 함수 추가 (claude-opus-4-5 Vision API)
  - 응답 파싱 방어 로직: `as const` 타입 배열 + `pick()` 폴백으로 AI 오응답 대비
  - 중복 import 정리, 타입 imports 상단 통합
- `src/pages/HomePage.tsx`: `handleCharacterCreated` 추가, `setCharacterConfig` 연동
- 린트: **에러 0개** (이전 21개 → 0개)
- 빌드: **통과** (126 modules)
- E2E: 통과 20개, 실패 0개, 경고 1개 (2026-05-25 23:09 확인)

## 이전 루프 변경

- 홈 화면의 최우선 CTA로 `오늘의 추천 학습` 카드를 연결했다.
- `src/components/ui/TodayRecommendation.tsx`는 표시 전용 컴포넌트로 유지하고, 추천 로직은 `src/components/ui/todayRecommendationLogic.ts`로 분리해 린트 규칙을 만족하도록 정리했다.
- 추천 기준은 학습 기록 없음 → 날짜 기반 균형 순환, 미학습 학당 존재 → 미학습 우선, 전체 학당 학습 후 → 최저 정답률 복습 우선 순서로 동작한다.
- `cmd /c npm.cmd run lint`, `cmd /c npm.cmd run build`를 다시 통과했다.
- `docs/product-strategy-audit.md`를 추가해 콘텐츠 기획, UI 개선, 교육 적합성, 게임 다양성, 지속성, 수익성, 정책 안정성을 통합 분석했다.
- `docs/product-backlog.md`에 제품 전략 우선순위를 추가했다.
- `src/data/levels.ts`에서 레벨 1 `노비`를 `입문생`으로 바꾸고, 신분 상승형 문구를 성장형 학습 문구로 수정했다.
- `LevelUpModal`, `HomePage`, `ProfilePage`의 일부 `신분` 표현을 `성장 단계/성장 여정`으로 수정했다.
- `.claude/current-task.md`를 다음 실행 과제인 “오늘의 추천 학습” 흐름 추가로 갱신했다.
- Claude Code에 “오늘의 추천 학습” 기능 구현을 위임했고, `HomePage`에 추천 학습 카드를 추가했다.
- `TodayRecommendation` 컴포넌트와 추천 로직을 추가해 학습 기록이 없으면 날짜 순환 추천, 미학습 학당이 있으면 균형 추천, 모두 학습했으면 약점 학당을 추천하도록 했다.
- Codex 검증에서 추천 컴포넌트 파일 대소문자/내보내기 문제를 확인하고 정리한 뒤 `npm.cmd run lint`, `npm.cmd run build`를 통과했다.
- `scripts/game-test.spec.cjs`에 홈 화면 교육 적합성 회귀 테스트를 추가해 `노비`가 다시 보이면 실패하고, `입문생` 표시를 확인하도록 했다.
- `scripts/run-ai-test.cjs`에서 Playwright 번들 브라우저가 없을 때 자동 설치에 매달리지 않고 `msedge` 채널로 폴백하도록 수정했다.
- `scripts/game-test.spec.cjs`에서 브라우저 실행 경로를 번들 Chromium 우선, 실패 시 `msedge` 채널 폴백으로 바꿨다.
- `src/services/claudeApi.ts`에서 네트워크 또는 API 연결 실패 시 콘솔 에러를 반복하지 않고 세션 단위로 기본 문제 폴백 상태를 유지하도록 정리했다.
- `src/pages/QuizPage.tsx`에서 카테고리 지정 진입 시 전체 문제 묶음 대신 해당 카테고리 기본 문제만 먼저 로드하도록 바꿨다.
- `src/pages/QuizPage.tsx`에서 퀴즈 로딩 요청 ID를 추적해 빠른 재진입이나 화면 전환 때 이전 요청이 뒤늦게 상태를 덮어쓰지 않도록 막았다.
- `cmd /c npm.cmd run test:e2e`, `cmd /c npm.cmd run lint`, `cmd /c npm.cmd run build`를 모두 다시 통과했다.
- E2E 최종 결과는 통과 20개, 실패 0개, 경고 1개이며 경고는 네트워크 기반 Claude 호출 미연결 안내만 남았다.

## 다음 우선순위

1. 브라우저 직접 AI 호출 기능의 출시 기본값을 정리한다.
   - 사진 기반 AI 캐릭터 변환과 AI 문제 생성을 운영 플래그로 기본 비활성화
   - 홈/캐릭터/퀴즈 흐름에서 비활성화 안내 문구와 폴백 UX 정리
   - Claude API가 없는 배포 환경에서 경고 없이 자연스럽게 동작하도록 마감
2. Google Play 출시 자산을 준비한다.
   - 512x512 앱 아이콘
   - 피처 그래픽 1024x500
   - 휴대폰 스크린샷 최소 2장
   - 짧은 설명, 자세한 설명, 개인정보처리방침
3. 수익화 설계를 확정한다.
   - 광고: 보상형 광고를 하트 회복 또는 힌트 보상에 연결
   - 인앱결제: 광고 제거, 하트 패키지, 프리미엄 학습팩 후보 검토
4. 모바일 패키징 방향을 확정한다.
   - Capacitor 기반 Android 패키징
   - 또는 PWA 우선 배포 후 Android 래핑

## 자동 루프 운영 규칙

- 매 루프마다 빌드 또는 린트 중 최소 하나를 실행한다.
- 실패가 있으면 가장 작은 원인 묶음 하나를 고친다.
- 변경 후 다시 검증한다.
- 출시 준비 문서는 새로 발견한 리스크나 완료 항목에 맞춰 갱신한다.
