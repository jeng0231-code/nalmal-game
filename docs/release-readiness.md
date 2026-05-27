# K-학당 출시 준비 현황

이 문서는 Google Play 수익화 출시까지 반복 작업의 기준점이다.

## 현재 확인

- 프로덕션 빌드: 2026-05-27 재검증 통과
- 앱 메타데이터: `index.html`, `public/manifest.json` 한글 깨짐 수정 완료
- 린트: 2026-05-27 재검증 통과. 에러 0개, 경고 0개
- E2E 브라우저 검증: 최신 재실행(2026-05-27) 통과 21개, 실패 0개, 경고 1개
- 초기 엔트리 번들: `dist/assets/index-CtOayi58.js` 약 185 kB, 라우트/미니게임/모달 분리 완료
- 잔여 대형 청크: `quizData` 약 45 kB, `sdk` 약 80.5 kB, `QuizPage` 약 43.8 kB. 이번 세션에서 SDK 정적 import 제거 및 AI 뱅크 백그라운드 로딩으로 초기 진입 경로 분리 적용
- Playwright 자동화: Windows 로컬에서 번들 Chromium이 없어도 `msedge` 채널 폴백으로 실행 가능
- Claude API 미연결 시: 콘솔 에러 대신 경고 1회 후 기본 문제로 폴백
- 제품 전략 분석: `docs/product-strategy-audit.md` 추가 완료
- 교육 적합성: 신분제 중심 표현 일부를 성장 단계 표현으로 수정 완료
- 퀴즈 메타데이터 리포트: `npm run report:quiz-metadata`로 적용 현황 확인 가능
- 퀴즈 메타데이터 회귀 검증: `npm run check:quiz-metadata`로 완전 적용 223문제 기준 유지 확인 가능
- 정책 초안: `docs/privacy-data-safety-draft.md`에 개인정보·데이터 안전·가족 대상 보수 기준 초안 추가
- 배포용 개인정보처리방침 초안: `public/privacy-policy.html` 추가
- Play Console 데이터 안전 입력 초안: `docs/google-play-data-safety.md` 추가
- AI 출시 기본값: `VITE_ENABLE_CLAUDE_FEATURES=false` 기준으로 퀴즈 AI 뱅크와 사진 AI 변환이 기본 비활성화되도록 연결 완료
- 출시 준비 자동 점검: 2026-05-27 재검증 기준 개인정보처리방침 문의 경로 미기재와 초안 문구 때문에 필수 누락 2건이 남는다. 실제 문의 이메일 또는 게시 URL과 최종 정책 문구를 확정하기 전까지는 초록 상태로 간주하지 않는다.

## 현재 블로커

- 2026-05-27 현재 우선순위 재정렬: 교육 메타데이터는 `223/223`으로 마감됐다. 이제 제품 우선순위의 다음 축은 지속성으로, `오늘의 추천 학습`과 `주간 도전`을 실제 재방문 이유가 되도록 연결하는 작업이 가장 시급하다.
- 교육 메타데이터 실제 상태: `npm run report:quiz-metadata` 기준 전체 223문제가 완전 적용 상태다. 문해력 110/110, 사자성어 30/30, 속담 30/30, 역사 30/30, 생활예절 23/23으로 교육 신뢰도 기준선은 현 버전에서 충족했다.
- 지속성 진행 상태: 홈 상단에 `7일 학습 코스` 연결 카드가 추가되어 `오늘의 추천 학습 → 약점 학당 3스테이지 → 오답 복습` 흐름을 한 번에 안내한다. 2026-05-27 후속 보강으로 주간 목표의 스테이지 진척도는 추정치가 아니라 실제 스테이지 완료 이력 기준으로 저장되도록 바뀌었다.
- 학습 동선 연결 상태: 2026-05-27 후속 보강으로 학당 허브도 홈/프로필과 같은 추천 로직과 주간 목표 CTA를 사용한다. 이제 홈, 프로필, 학당 허브 어디서 들어가도 같은 추천 학당과 다음 행동이 보인다.
- 정책 영향: 브라우저에서 Claude API를 직접 호출하는 경로(`src/services/claudeApi.ts`, `src/services/avatarAiService.ts`)는 기본 비활성화가 완료됐지만, 정식 출시 전에 "계속 비활성화 유지" 또는 "서버 경유 전환" 중 하나를 최종 결정해야 한다.
- 정책 문서: `public/privacy-policy.html`는 출시 준비용 초안이므로, 정식 출시 전 운영 문의 연락처와 실제 SDK 기준 최종 문구 확정이 필요하다. 이번 루프부터 `npm run check:release-readiness`는 초안 문구뿐 아니라 실제 문의 경로 부재도 필수 누락으로 잡아낸다. 운영값이 정해지면 `.env`에 `PRIVACY_CONTACT_EMAIL` 또는 `PRIVACY_CONTACT_URL`, `PRIVACY_POLICY_URL`, `PRIVACY_POLICY_MODE=release`를 넣고 `npm run prepare:privacy-policy`로 정책 페이지를 재생성한다.

## 이번 루프 변경 (2026-05-27 Codex 세션, 개인정보처리방침 재생성 자동화)

- `scripts/privacy-policy-utils.cjs`
  - 정책 초안 판정, 문의 경로 판정, `.env` 기반 정책 설정 로딩을 공용 유틸로 분리
- `scripts/generate-privacy-policy.cjs`
  - `PRIVACY_CONTACT_EMAIL`, `PRIVACY_CONTACT_URL`, `PRIVACY_POLICY_URL`, `PRIVACY_POLICY_MODE` 설정값으로 `public/privacy-policy.html`을 재생성하는 스크립트 추가
- `package.json`
  - `npm run prepare:privacy-policy` 명령 추가
- `.env.example`
  - 개인정보처리방침 최종화에 필요한 환경변수 예시 추가
- `scripts/release-readiness-check.cjs`, `scripts/daily-report.cjs`
  - 정책 문의 경로와 초안 상태를 같은 공용 기준으로 판정하도록 정리

## 이번 루프 변경 (2026-05-27 Codex 세션, 개인정보 문의 경로 검증 보강)

- `scripts/release-readiness-check.cjs`
  - 기존의 `문의`, `연락처` 같은 일반 단어 포함 여부 대신 `mailto:`, 실제 이메일 주소, 게시된 `http/https` 문의 URL만 문의 경로로 인정하도록 수정
  - 이제 개인정보처리방침에 실제 문의 수단이 없으면 초안 문구 제거와 별도로 필수 누락으로 실패하도록 보강
- `docs/release-readiness.md`
  - 자동 점검 기준을 "초안 문구 제거"와 "실제 문의 경로 기재" 2개 블로커로 분리해 현재 상태를 명확히 반영
- 검증
  - `npm.cmd run check:release-readiness`
  - `npm.cmd run lint`
- Android 패키징: `@capacitor/*` 패키지, `capacitor.config.ts`, `android/` 프로젝트가 모두 저장소에 반영됐고 `npm run check:release-readiness` 기준 경고 없이 통과한다. 이번 루프에서 `android/key.properties.example`, `npm run android:bundle:release`, `android/app/build.gradle` 릴리즈 서명 구성을 추가해 저장소 기준 AAB 생성 경로를 고정했다. 남은 일은 실제 업로드 키 생성, `android/key.properties` 작성, Play Console 제출이다.
- Android 로컬 환경: `npm run check:android-preflight` 기준 필수 누락은 없지만 Java, Android SDK, adb, 실제 `android/key.properties`는 작업자 로컬에서 채워야 한다. 이제 스크립트가 누락 항목별 다음 조치를 바로 출력하므로 AAB 업로드 전 마지막 환경 준비 체크에 사용한다.

## 이번 루프 변경 (2026-05-27 Codex 세션, 정책 초안과 AI 폴백 문구 정리)

- `src/components/character/AvatarCreator.tsx`
  - AI 변환 실패 문구를 기술 오류 강조 대신 `원본 사진으로 바로 시작` 대체 행동 중심으로 정리
  - AI 비활성화 안내 문구를 상수로 묶어 미리보기 화면 톤을 일관되게 유지
- `public/privacy-policy.html`
  - 최종 수정일을 2026-05-27로 갱신
  - 정식 출시 전 반드시 채워야 할 항목으로 운영 문의 연락처, 실제 SDK 목록, 게시 URL 반영 필요성을 명시
- `docs/privacy-data-safety-draft.md`
  - 현재 출시 기본값 요약 섹션을 추가해 `VITE_ENABLE_CLAUDE_FEATURES=false`와 무SDK 기본 상태를 문서 첫머리에서 바로 확인 가능하게 정리
  - 브라우저 직접 AI 호출 설명을 내부 테스트 기준으로 한정
- 검증
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run check:release-readiness`

## 이번 루프 변경 (2026-05-27 Codex 세션, Android 사전 점검 안내 강화)

- `scripts/android-preflight-check.cjs`
  - `android/gradlew.bat`와 `scripts/android-release-build.ps1` 존재 여부를 필수 점검에 포함
  - Android SDK를 환경변수뿐 아니라 `android/local.properties`의 `sdk.dir`에서도 읽도록 보강
  - `android/key.properties`가 있을 때 필수 키 누락과 실제 keystore 파일 경로까지 확인하도록 확장
  - 경고만 보여 주던 출력 뒤에 Java, SDK, adb, 서명 설정별 `다음 조치`를 바로 제시하도록 정리
- 검증
  - `npm.cmd run check:android-preflight`
  - `npm.cmd run check:release-readiness`
  - `npm.cmd run lint`
  - `npm.cmd run build`

## 이번 루프 변경 (2026-05-27 Codex 세션, 오늘의 보너스 하트 지급 정합성 수정)

- `src/store/gameStore.ts`
  - `free_heart` 오늘의 보너스가 표시만 되고 실제 하트를 채우지 않던 결함을 수정
  - 첫 로그인 시 하트 여유가 있으면 즉시 1개를 회복하고, 저장 상태에 실제 지급 수량을 함께 기록하도록 보강
- `src/pages/HomePage.tsx`
  - 오늘의 보너스 문구가 실제 결과와 일치하도록 수정
  - 하트를 실제로 받았을 때는 즉시 회복 안내를, 이미 가득 찼을 때는 여유 있게 도전하라는 안내를 보여 주도록 정리

## 이번 루프 변경 (2026-05-27 Codex 세션, AI 비활성화 사진 시작 UX 정리)

- `src/components/character/AvatarCreator.tsx`
  - AI 비활성화 상태에서 안내 문구를 `자동 꾸미기는 출시 준비 중` 중심으로 정리해 "작동 안 하는 AI 기능" 인상을 줄임
  - AI가 꺼져 있을 때 `사진 그대로 사용` 버튼을 `이 사진으로 시작` 기본 CTA로 승격
  - AI 변환 실패 문구에서 `API 키` 같은 내부 표현을 제거하고 바로 사용할 수 있는 대체 행동 중심으로 수정
- 검증
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run check:release-readiness`

## 이번 루프 변경 (2026-05-27 Codex 세션, 학당 허브 추천 흐름 정렬)

- `src/pages/HakdangHubPage.tsx`
  - 홈/프로필과 분리돼 있던 허브 전용 추천 규칙을 제거하고 `todayRecommendationLogic`의 공용 추천 로직을 사용하도록 정리
  - 추천 카드에 이번 주 스테이지 진행도, 목표 달성 전/후 CTA, 오답 복습 분기를 추가해 허브에서도 같은 학습 흐름이 이어지도록 수정
  - 추천 배지도 "미시작 학당만 추천"이 아니라 현재 공용 추천 학당을 기준으로 표시되도록 통일
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 "AI 기능 비활성화 상태의 출시용 UX 마감"으로 갱신
- 검증
  - `npm run lint`
  - `npm run build`
  - `npm run check:release-readiness`
  - `npm run test:e2e`

## 이번 루프 변경 (2026-05-27 Codex 세션, Android 릴리즈 서명 자동화)

- `android/app/build.gradle`
  - `android/key.properties`가 있으면 릴리즈 signingConfig를 읽어 `bundleRelease`가 서명된 AAB를 만들 수 있도록 연결
- `android/key.properties.example`
  - 업로드 키 경로, alias, 비밀번호 형식을 바로 채울 수 있는 템플릿 추가
- `scripts/android-release-build.ps1`
  - `npm run build` → `npx cap sync android` → `android/gradlew.bat bundleRelease`를 순차 실행하는 릴리즈 빌드 래퍼 추가
- `package.json`
  - `npm run android:bundle:release` 스크립트 추가
- `scripts/android-preflight-check.cjs`
  - 서명 템플릿 존재 여부와 실제 `android/key.properties` 준비 여부를 경고로 확인하도록 보강
- 검증
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run check:android-preflight`
  - `npm.cmd run check:release-readiness`
  - `npm.cmd run test:e2e`

## 이번 루프 변경 (2026-05-27 Codex 세션, 출시 자동 점검 기준 상향)

- `scripts/quiz-metadata-report.cjs`
  - `--require-all-complete` 옵션을 추가해 전체 문제 수 기준 완전 적용 여부를 직접 검증하도록 보강
- `scripts/release-readiness-check.cjs`
  - 교육 메타데이터 점검을 기존 `42문제 기준선`에서 `전체 문제 완전 적용 유지`로 상향
- `docs/release-readiness.md`
  - 현재 상태를 `223/223`, 생활예절 `23/23`, Android 경고 0건 기준으로 갱신
- 검증
  - `npm run report:quiz-metadata`: 통과, 전체 223/223
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / 경고 0건
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run test:e2e`: 통과 21개, 실패 0개, 경고 1개

## 이번 루프 변경 (2026-05-27 Codex 세션, 완료 퀴즈 통계 중복 집계 수정)

- `src/store/gameStore.ts`
  - `nextQuestion`가 문제 배열 종료 시 `quizzesCompleted`를 한 번 더 올리던 경로를 제거
  - 이제 완료 퀴즈 수는 실제 스테이지 완료 시점의 `recordStageCleared`만 집계해 프로필 통계와 업적 진행이 과대 누적되지 않음
- 검증
  - `npm run lint`
  - `npm run build`
  - `npm run check:release-readiness`
  - `npm run test:e2e`

## 이번 루프 변경 (2026-05-27 Codex 세션, 홈 학습 경로 연결)

- `src/components/ui/LearningPathCard.tsx`
  - 홈 첫 화면에 `7일 학습 코스` 카드를 추가해 오늘 학습 시작, 이번 주 약점 학당 3스테이지 목표, 오답 복습 재진입을 한 카드에서 연결
- `src/components/ui/todayRecommendationLogic.ts`
  - 추천 학습 로직에서 재사용할 정답률 계산, 스테이지 환산 기준(10문제 1스테이지), 주간 목표 상수를 공용 유틸로 노출
- `src/pages/HomePage.tsx`
  - 기존 단일 추천 카드 대신 연결형 학습 카드로 교체해 홈 최상단 CTA를 학습 흐름 중심으로 정리
- 검증
  - `npm.cmd run lint`: 통과
  - `npm.cmd run build`: 통과
  - `npm.cmd run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건
  - `npm.cmd run test:e2e`: 통과 21개, 실패 0개, 경고 1개

## 이번 루프 변경 (2026-05-27 Codex 세션, 주간 스테이지 진척 실측 전환)

- `src/store/gameStore.ts`
  - 주간 스테이지 완료 수를 주차별·학당별로 저장하는 `weeklyStageProgress` 상태를 추가
  - `recordStageCleared`가 실제 스테이지 완료 시 현재 주차와 학당 기준으로 진척을 누적하도록 수정
- `src/pages/QuizPage.tsx`
  - 스테이지 완료 기록 시 현재 학당 정보를 함께 전달하도록 연결
- `src/components/ui/LearningPathCard.tsx`
  - `이번 주 약점 학당 3스테이지` 진행률을 추정 풀이 수 대신 실제 완료 스테이지 수로 표시
  - 안내 문구도 남은 스테이지 수 중심으로 정리
- 검증
  - `npm run lint`
  - `npm run build`
  - `npm run check:release-readiness`

## 이번 루프 변경 (2026-05-27 Codex 세션, 프로필 재진입 동선 보강)

- `src/pages/ProfilePage.tsx`
  - 프로필 상단에 `이번 주 이어서 할 학습` 요약 카드를 추가해 홈의 추천 학습 흐름이 프로필에서도 끊기지 않도록 연결
  - 주간 목표 진행 전/후와 오답 보유 여부에 따라 CTA를 `추천 학당 이어서 풀기`, `오답 복습하기`, `새 학당 이어서 둘러보기`로 분기
- `src/components/ui/WeeklyChallenge.tsx`
  - 주간 목표 달성 후 버튼이 같은 학당 반복 대신 `오답 복습` 또는 `다른 학당으로 넓혀 보기`로 바뀌도록 조정
  - 목표 달성 후 안내 문구도 다음 행동 중심으로 정리
- 검증
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run check:release-readiness`

## 이번 루프 변경 (2026-05-27 Codex 세션, 날짜 경계 안정화)

- `src/utils/date.ts`
  - 로컬 날짜 문자열, 상대 날짜, 주간 시작일, 주간 키 계산을 공용 유틸로 분리
- `src/store/gameStore.ts`
  - 출석, 일일 미션, 주간 보상 계산에서 UTC 문자열 대신 로컬 날짜 유틸을 사용하도록 정리
- `src/components/ui/WeeklyChallenge.tsx`
  - 오늘 날짜를 자동 학습 완료처럼 집계하던 표시를 제거하고, 실제 학습한 날만 체크되도록 수정
- `src/pages/ProfilePage.tsx`
  - 학습 달력의 오늘 표시를 로컬 날짜 기준으로 맞춤
- `src/services/claudeApi.ts`
  - AI 문제 뱅크의 "오늘 생성" 판정도 동일한 로컬 날짜 기준으로 통일
- 검증
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run test:e2e`: 통과 21개, 실패 0개, 경고 1개

## 이번 루프 변경 (2026-05-27 Claude Code 일일 루프)

### Google Play 체크리스트 자동 검증

| 항목 | 상태 | 비고 |
|------|------|------|
| 린트 에러 0개 | ✅ | 에러 0, 경고 0 |
| 빌드 통과 | ✅ | 1.02s |
| 초기 번들 185kB 이하 | ✅ | 180.7kB (gzip 58.6kB) |
| 앱 아이콘 512×512 | ✅ | `public/icon-512.png` |
| 피처 그래픽 1024×500 | ✅ | `public/feature-graphic.png` |
| 스크린샷 2장 이상 | ✅ | 4장 (`public/screenshots/`) |
| 개인정보처리방침 | ✅ | `public/privacy-policy.html` |
| Capacitor android/ | ✅ | `android/` 프로젝트 존재, 자동 점검 통과 |
| 서명된 AAB | ❌ | 서명 키 구성 후 생성 필요 |

## 이번 루프 변경 (2026-05-27 Codex 세션 — Android 패키징 선행 준비 보강)

- `capacitor.config.ts`
  - `appId: kr.khakdang.app`, `appName: K학당`, `webDir: dist`, `androidScheme: https` 기준값을 저장소에 고정
- `package.json`
  - `android:bootstrap`, `android:sync`, `android:open` 스크립트 추가
- `scripts/capacitor-bootstrap.ps1`
  - 패키지 설치 가능 환경에서 `npm install` → `npm run build` → `npx cap add android` → `npx cap sync android`를 한 번에 실행하도록 자동화
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 실제 Android 생성 단계에 맞게 갱신
- 검증
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건 유지
| E2E 21개 통과 | ✅ | 직전 통과 유지 (2026-05-26) |

### 콘텐츠 갭 분석

| 데이터 | 문제 수 | 기준 | 상태 |
|--------|---------|------|------|
| quizData (문해력) | 110 | 30+ | ✅ |
| proverbsData (속담) | 30 | 20+ | ✅ |
| idiomsData (사자성어) | 30 | 20+ | ✅ |
| historyData (역사) | 30 | 20+ | ✅ |
| etiquetteData (예절) | 23 (+3) | 20+ | ✅ |

### 변경 사항

- `src/data/etiquetteData.ts`: etq_021~023 추가 (20→23문제, 인사·앉음새·통행 예절)
- `docs/release-readiness.md`: 일일 루프 결과 기록 및 체크리스트 갱신

### 다음 최우선 과제

Android 패키징(`Capacitor`)이 남은 유일한 하드 블로커. 린트·빌드·아이콘·스크린샷·개인정보처리방침은 모두 완료 상태.

---

## 이번 루프 변경 (2026-05-27 Codex 세션, 문해력 메타데이터 110/110 마감)

- `src/data/quizData.ts`
  - 문해력 문항 `q097`~`q110`에 `learningGoal`, `hintText`, `tags`를 추가해 문해력당 완전 적용을 `110/110`으로 마감
  - 기존 문제 문장, 정답, 해설, 보상 수치는 변경하지 않음
- `docs/release-readiness.md`
  - 현재 블로커 섹션을 최신 검증값과 다음 제품 공백 기준으로 갱신
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 지속성 우선 과제인 `7일 학습 코스 + 주간 도전 연결` 구현 지시로 전환
- 검증
  - `npm run report:quiz-metadata`: 통과, 전체 220/220 · 문해력 110/110
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건

## 이번 루프 변경 (2026-05-26 Codex 세션 — 사자성어당 메타데이터 목표선 달성)

- `src/data/idiomsData.ts`
  - 사자성어 문항 18개에 `learningGoal`, `hintText`, `tags`를 추가해 사자성어당 완전 적용 수치를 24/30까지 끌어올림
  - 기존 문제 문장, 정답, 해설, 보상 수치는 변경하지 않음
- `package.json`
  - `report:quiz-metadata:idioms-worklist`, `check:quiz-metadata:idioms-target` 스크립트를 추가해 이번 목표를 자동 검증 기준으로 고정
  - 다음 작업 전환을 위해 `report:quiz-metadata:quiz-worklist`, `check:quiz-metadata:quiz-target` 스크립트도 추가
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 문해력당 메타데이터 30문항 이상 보강으로 갱신
- 검증
  - `npm run check:quiz-metadata:idioms-target`: 통과, 전체 140/220 · 사자성어 24/30
  - `npm run lint`: 통과
  - `npm run build`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — 문해력 메타데이터 30문항 보강)

- `src/data/quizData.ts`
  - 문해력당 q003~q036에 `learningGoal`, `hintText`, `tags`를 추가
  - 기존 정답, 해설, 보상 수치, 문제 문장은 변경하지 않음
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 사자성어당 메타데이터 보강으로 전환
  - 완료 기준을 사자성어 24/30 이상으로 갱신
- 검증
  - `npm run check:quiz-metadata`: 통과, 전체 122/220 · 문해력 36/110 · 사자성어 6/30
  - `npm run check:release-readiness`: 직전 통과 유지, 필수 누락 0건 / Android 경고 1건
  - `npm run lint`: 통과
  - `npm run build`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — 스토어 자산 규격 검증 보강)

- `scripts/release-readiness-check.cjs`
  - 앱 아이콘과 피처 그래픽을 파일 존재 여부만 보지 않고 PNG 헤더에서 실제 규격을 읽어 검증하도록 보강
  - 규격이 맞지 않으면 현재 크기와 요구 크기를 함께 출력해 바로 수정할 수 있게 개선
- 검증
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건
  - `npm run lint`: 통과
  - `npm run build`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — Android 사전 점검 추가)

- `scripts/android-preflight-check.cjs`
  - Android 패키징 진입 전 저장소 상태와 로컬 도구 상태를 분리해 점검하는 스크립트 추가
  - Capacitor 패키지 선언, 설정 파일, `android/` 디렉터리를 필수 항목으로 검사
  - `java`, `adb`, `ANDROID_HOME`/`ANDROID_SDK_ROOT`, 앱 아이콘 파일을 경고 항목으로 함께 보고
- `package.json`
  - `npm run check:android-preflight` 스크립트 추가
- `docs/android-release-plan.md`
  - Android 작업 시작 전 사전 점검 실행과 이번 환경의 설치 블로커를 명시
- 검증
  - `npm run check:android-preflight`: 의도대로 실패, Capacitor 패키지 선언/설정 파일/`android/` 디렉터리 누락 3건과 로컬 Java·SDK·adb 경고 3건을 분리 보고
  - `npm run lint`: 통과
  - `npm run build`: 통과, 초기 엔트리 `dist/assets/index-BZpxGLbF.js` 185.05 kB 유지
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건 유지

## 이번 루프 변경 (2026-05-26 Codex 세션 — 퀴즈 메타데이터 검증 기준 고정)

- `scripts/quiz-metadata-report.cjs`
  - 데이터 파일 설정에 카테고리 키를 추가해 학당별 완료 기준을 기계적으로 검사할 수 있게 정리
  - `--require-category-complete=<category>:<count>` 옵션을 추가해 특정 학당의 완전 적용 목표를 실패 조건으로 강제
  - 현재 리포트에 가장 적용률이 낮은 학당을 함께 출력해 다음 콘텐츠 보강 대상을 바로 보이게 개선
- `package.json`
  - `check:quiz-metadata:history-proverbs` 스크립트를 추가해 역사 30/30, 속담 30/30, 총 92개 완전 적용을 한 번에 검증하도록 고정
- `.claude/current-task.md`
  - Claude Code 작업 범위를 "역사 + 속담 완전 적용"으로 좁히고, 완료 기준에 새 검증 명령을 명시
- 검증
  - `npm run report:quiz-metadata`: 통과, 현재 42개 완전 적용 / 최우선 보강 대상은 문해력으로 표시
  - `npm run check:quiz-metadata:history-proverbs`: 의도대로 실패, 역사 6/30 · 속담 4/30 · 총 42개 상태를 정확히 보고
  - `npm run lint`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — 메타데이터 작업 목록 자동 생성)

- `scripts/quiz-metadata-report.cjs`
  - `--only-category=<key>` 옵션으로 특정 학당만 추려 볼 수 있게 확장
  - `--worklist=<path>` 옵션으로 미적용/부분 적용 문항의 문제·해설·누락 필드를 마크다운 작업 목록으로 생성
- `package.json`
  - `npm run report:quiz-metadata:history-proverbs-worklist` 스크립트를 추가해 역사/속담 작업 목록을 `.claude/quiz-metadata-worklist.md`로 바로 생성
- `.claude/current-task.md`
  - Claude Code가 위 작업 목록 파일을 기준으로 남은 역사·속담 문항을 순차 보강하도록 지시 보강
- 검증
  - `npm run report:quiz-metadata:history-proverbs-worklist`: 통과, 작업 목록 생성 확인
  - `npm run check:quiz-metadata:history-proverbs`: 의도대로 실패, 아직 역사·속담 메타데이터 본작업이 남아 있음을 재확인
  - `npm run lint`: 통과
  - `npm run build`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — 일일 보고서 출시 운영형으로 개편)

- `scripts/daily-report.cjs`
  - 기존 범용 개발 요약을 출시 운영 중심 보고서로 재작성
  - 스토어 자산, 개인정보처리방침, 데이터 안전, Android 패키징, AI 기본 비활성화 예시를 자동 점검 항목으로 추가
  - 최근 E2E 결과, 퀴즈 메타데이터 점검, 현재 Claude Code 작업 요약, 남은 출시 리스크를 한 번에 보고하도록 정리
- 검증
  - `npm run report:daily`: 보고서 미리보기 생성 성공, 외부 전송 단계는 네트워크 제한 `EACCES`로 실패
  - `npm run lint`: 통과
  - `npm run build`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션 — 출시 준비 자동 점검 추가)

- `scripts/release-readiness-check.cjs`
  - 출시 준비 핵심 항목을 필수/경고로 구분해 한 번에 점검하는 자동 검증 스크립트 추가
  - 교육 메타데이터 기준선 42문제, 스토어 문안, 데이터 안전, 개인정보처리방침, 문의 문구, 스크린샷 수, 앱 아이콘, 피처 그래픽, AI 기본 비활성화 예시를 점검
  - Android 패키징은 아직 경로 확정 전 단계로 경고 항목으로만 보고
- `package.json`
  - `npm run check:release-readiness` 명령 추가
- 검증
  - `npm run check:release-readiness`: 의도대로 실패, 현재 누락 항목은 앱 아이콘과 피처 그래픽
  - `npm run lint`: 예정
  - `npm run build`: 예정

## 이번 루프 변경 (2026-05-26 Codex 세션 — 스토어 자산 기준선 정리)

- `public/screenshots/`
  - 최신 E2E 산출물에서 스토어 시안으로 재사용 가능한 모바일 스크린샷 4장을 복사해 배치
  - 홈, 학당 허브, 퀴즈 문항, 프로필 흐름이 바로 보이도록 파일명 정리
- `docs/google-play-store-listing.md`
  - Play Console용 앱 이름, 짧은 설명 후보, 자세한 설명 초안 작성
  - 현재 기본 출시안인 AI 비활성화·광고/결제 미연동 기준을 문안에 반영
- `docs/google-play-assets-brief.md`
  - 앱 아이콘, 피처 그래픽, 스크린샷, 캡션 방향을 한 문서에 정리
  - 다음 Claude Code 작업이 바로 이어질 수 있게 시각 방향과 완료 범위 명시
- 검증
  - `cmd /c npm.cmd run report:daily`: 보고서 미리보기 생성 성공, 외부 전송 단계는 네트워크 제한 `EACCES`로 실패
  - `cmd /c npm.cmd run lint`: 통과
  - `cmd /c npm.cmd run build`: 통과

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
  - `--strict --min-complete=42` 옵션으로 메타데이터 회귀를 막는 검증 모드로 상향
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

## 일일 자동 루프 (2026-05-26 18:20)

## 이번 루프 변경 (2026-05-26 Codex 세션 — 주간 챌린지 학습일 집계 보정)

- `src/store/gameStore.ts`
  - 로그인 시 자동으로 `studyDays`에 오늘 날짜를 넣던 동작을 제거
  - 실제 학습 행동이 일어난 경우에만 학습일이 기록되도록 문제 풀이 정답/오답, 미니게임 완료, 스테이지 완료 경로에서 `studyDays`를 갱신
- `src/components/ui/WeeklyChallenge.tsx`
  - 오늘 날짜라는 이유만으로 주간 학습일 수에 자동 포함하던 계산을 제거
  - 주간 챌린지가 실제 학습일 기준으로만 5일 목표를 계산하도록 보정
- 판단
  - 기존 구현은 앱만 열어도 주간 보상 진행도가 오르는 상태라 교육 신뢰도와 지속성 지표를 왜곡할 수 있었음
  - 이번 수정으로 주간 보상은 실제 학습 행동과 직접 연결됨
- 검증
  - `cmd /c npm.cmd run lint`: 통과
  - `cmd /c npm.cmd run build`: 통과
  - `cmd /c npm.cmd run test:e2e`: 통과 21개, 실패 0개, 경고 1개

| 항목 | 결과 |
|------|------|
| 린트 | ✅ 에러 0개 |
| 빌드 | ✅ 통과 (131 modules, 185kB) |
| 콘텐츠 | ⚠️ 메타데이터 보강 진행 중 (완전 적용 122 / 220, 사자성어 6 / 30) |
| 앱 아이콘 | ✅ public/icon-512.png 512x512 확인 |
| 피처 그래픽 | ✅ public/feature-graphic.png 1024x500 확인 |
| 스크린샷 | ✅ public/screenshots/ 4장 배치 |
| Capacitor | ❌ android/ 없음 |
| 개인정보처리방침 | ✅ 존재 |

→ 다음 Claude Code 작업: 사자성어당 메타데이터 18문항 이상 보강

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
- 이번 Codex 세션에서 `src/data/etiquetteData.ts` 나머지 15문항까지 메타데이터를 보강해 생활예절 20문항 전체를 완전 적용으로 끌어올림 (총 42문제)
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
## 이번 루프 변경 (2026-05-26 Codex 세션, Android 출시 경로 계획 고정)

- `docs/android-release-plan.md`
  - 기본 출시 경로를 `Capacitor + Android App Bundle`로 정리
  - 이번 단계 목표, 완료 기준, Codex 검증 기준, 보류 범위를 문서화
- `scripts/release-readiness-check.cjs`
  - Android 경고 문구가 단순 미확정 대신 "계획 문서 존재, 프로젝트 생성 대기"를 보여 주도록 보강
- `.claude/current-task.md`
  - Claude Code 다음 작업을 Android 패키징 연결로 전환
- 검증
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / 경고 1건
  - `npm run check:quiz-metadata`: 통과, 기준선 42문제 유지
  - `npm run lint`: 통과

## 이번 루프 변경 (2026-05-26 Codex 세션, 검증 기준선 재확인)

- 재검증 결과
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run test:e2e`: 통과 21개, 실패 0개, 경고 1개
  - `npm run check:quiz-metadata:history-proverbs`: 실패, 전체 42/220 · 역사 6/30 · 속담 4/30
- 판단
  - 스토어 자산, 개인정보처리방침, 데이터 안전 문안, 출시 준비 자동 점검은 현재 기준선 충족
  - Android 패키징은 여전히 경고 항목이지만 즉시 출시 가치를 가장 크게 올리는 작업은 교육 메타데이터 보강
  - 따라서 Claude Code 다음 작업은 Android가 아니라 역사당·격언당 메타데이터 완전 적용으로 유지
- 문서/지시 정리
  - `.claude/current-task.md`를 최신 검증 수치 기준으로 다시 작성
  - 과거 루프의 "다음 Claude Code 작업: 아이콘/피처 그래픽" 기록은 이 최신 섹션보다 우선하지 않음

## 이번 루프 변경 (2026-05-26 Codex 세션, 역사당·격언당 메타데이터 완료)

- `src/data/historyData.ts`
  - 미적용 24문항에 `learningGoal`, `hintText`, `tags`를 추가해 역사당 30문항 전체를 완전 적용으로 끌어올림
- `src/data/proverbsData.ts`
  - 미적용 26문항에 `learningGoal`, `hintText`, `tags`를 추가해 격언당 30문항 전체를 완전 적용으로 끌어올림
- `.claude/quiz-metadata-worklist.md`
  - 다음 작업 전환을 위해 문해력당 기준 작업 목록으로 다시 생성
- `.claude/current-task.md`
  - Claude Code 다음 작업을 문해력당 메타데이터 30문항 이상 보강으로 갱신
- 검증
  - `npm run check:quiz-metadata:history-proverbs`: 통과, 전체 92/220 · 역사 30/30 · 속담 30/30
  - `npm run lint`: 통과
  - `npm run build`: 통과
- 판단
  - 교육 신뢰도 기준에서 역사당·격언당의 구조적 공백은 해소됨
- 현재 최우선 보강 대상은 문해력당 66/110이며, 다음 자동화/Claude Code 작업도 이 영역에 집중하는 것이 출시 가치가 가장 큼

## 이번 루프 변경 (2026-05-26 Codex 세션, 문해력 작업 목록 재동기화)

- `.claude/quiz-metadata-worklist.md`
  - `npm run report:quiz-metadata:quiz-worklist`를 다시 실행해 문해력 작업 시작 지점을 `q067` 이후로 재생성
  - Claude Code가 오래된 작업 목록 대신 현재 기준 66/110 완료 상태를 바로 참조할 수 있게 정리
- `docs/release-readiness.md`
  - 현재 블로커 섹션의 교육 메타데이터 수치를 최신 검증값 170/220 · 문해력 66/110으로 갱신
- 검증
  - `npm run report:quiz-metadata`: 통과, 전체 170/220 · 문해력 66/110
  - `npm run report:quiz-metadata:quiz-worklist`: 통과, `.claude/quiz-metadata-worklist.md` 재생성
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건

## 이번 루프 변경 (2026-05-26 Codex 세션, 현재 작업트리 재검증)

- 판단
  - 현재 작업트리에 홈, 미니게임, 퀴즈, 프로필, 데이터 파일 변경이 넓게 쌓여 있어 새 기능 추가보다 검증 재확인이 우선이었다.
  - 출시 가치 기준은 여전히 교육 신뢰도 보강이 가장 높고, 문해력 메타데이터 66/110이 다음 실작업 대상이다.
- 문서/지시 정리
  - `.claude/current-task.md`의 Codex 재검증 시각을 2026-05-26 22:55 기준으로 갱신
  - `.claude/quiz-metadata-worklist.md`를 다시 생성해 시작 지점이 `q067` 이후인지 재확인
- 재검증 결과
  - `npm run report:quiz-metadata`: 통과, 전체 170/220 · 문해력 66/110
  - `npm run report:quiz-metadata:quiz-worklist`: 통과, `.claude/quiz-metadata-worklist.md` 재생성
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run test:e2e`: 통과 21개, 실패 0개, 경고 1개

## 이번 루프 변경 (2026-05-27 Codex 세션, 문해력 메타데이터 30문항 추가 보강)

- `src/data/quizData.ts`
  - 문해력 문항 `q067`~`q096`에 `learningGoal`, `hintText`, `tags`를 추가
  - 기존 문제 문장, 정답, 해설, 보상 수치는 변경하지 않음
- `package.json`
  - 다음 마감 배치를 위해 `check:quiz-metadata:idioms-complete` 스크립트를 추가
- `.claude/quiz-metadata-worklist.md`
  - `npm run report:quiz-metadata:idioms-worklist` 재실행으로 사자성어 잔여 작업 목록 기준으로 전환
- `.claude/quiz-metadata-batch-idm025-idm030.md`
  - 다음 Claude Code 작업이 바로 이어질 수 있도록 사자성어 6문항 배치 지시를 추가
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 사자성어 `idm_025`~`idm_030` 메타데이터 마감으로 갱신
- 검증
  - `npm run report:quiz-metadata`: 통과, 전체 200/220 · 문해력 96/110 · 사자성어 24/30
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건

## 이번 루프 변경 (2026-05-27 Codex 세션, 사자성어 메타데이터 30/30 완료)

- `src/data/idiomsData.ts`
  - 사자성어 문항 `idm_025`~`idm_030`에 `learningGoal`, `hintText`, `tags`를 추가해 사자성어당 완전 적용을 `30/30`으로 마감
  - 기존 문제 문장, 정답, 해설, 보상 수치는 변경하지 않음
- `.claude/quiz-metadata-worklist.md`
  - `npm run report:quiz-metadata:quiz-worklist` 재실행으로 문해력 잔여 14문항 기준 작업 목록으로 전환
- `.claude/current-task.md`
  - 다음 Claude Code 작업을 문해력 `q097`~`q110` 메타데이터 마감으로 갱신
- 검증
  - `npm run check:quiz-metadata:idioms-complete`: 통과, 전체 206/220 · 사자성어 30/30
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건
## 이번 루프 변경 (2026-05-27 Codex 세션, 정책 초안 거짓 통과 차단)

- `scripts/release-readiness-check.cjs`
  - 개인정보처리방침 파일에 `개인정보처리방침 초안`, `운영 문의 연락처가 아직 확정되지 않았습니다` 같은 초안/미확정 문구가 남아 있으면 필수 누락으로 실패하도록 보강
  - 단순히 `문의`라는 단어가 있는지만 보던 기존 검사 대신, 초안 문구 제거 여부를 별도 필수 항목으로 확인
- `docs/release-readiness.md`
  - 자동 점검이 더 이상 정책 초안을 초록 상태로 통과시키지 않는다는 현재 기준을 반영
- 검증
  - `npm.cmd run check:release-readiness` → 필수 누락 1건(개인정보처리방침 초안 문구 제거)
  - `npm.cmd run lint`
  - `npm.cmd run build`
