# Claude Code 현재 작업 지시

> **2026-05-27 일일 루프 업데이트**: 린트·빌드·콘텐츠 갭 모두 통과. etiquetteData 23문제로 확충 완료.
> **남은 하드 블로커**: Capacitor android/ 패키징 (아래 참조)

---

## 🚨 최우선: Capacitor Android 패키징

Google Play 출시의 마지막 하드 블로커. 린트·빌드·아이콘·스크린샷·개인정보처리방침은 모두 완료 상태이므로 이것만 완료하면 AAB 서명 → Play Console 제출 가능.

### 작업 단계

```bash
# 1. Capacitor 설치
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. 초기화 (appId는 도메인 역순)
npx cap init "K학당" "kr.khakdang.app"

# 3. 웹 빌드
npm run build

# 4. Android 플랫폼 추가
npx cap add android

# 5. 웹 자산 동기화
npx cap sync android
```

### capacitor.config.ts 기준값
```typescript
{
  appId: 'kr.khakdang.app',
  appName: 'K학당',
  webDir: 'dist',
  server: { androidScheme: 'https' }
}
```

### 완료 기준
- `android/` 폴더가 저장소에 존재
- `npx cap sync android` 에러 없이 통과
- `package.json`에 `android:sync`·`android:open` 스크립트 추가

---

## 다음 목표 (Android 완료 후)

K-학당의 교육 메타데이터는 이번 Codex 검증으로 `220/220` 마감됐다. 다음 출시 우선순위는 지속성이다. 이번 작업에서는 이미 있는 추천 학습, 주간 도전, 학습 기록을 끊기지 않는 재방문 흐름으로 연결한다.

1. 홈 또는 학당 허브 기준으로 `7일 학습 코스` 진입 지점을 1곳 이상 만든다.
2. 이번 주 약점 학당을 기준으로 `주간 도전 3스테이지` 목표와 현재 진행도를 사용자에게 분명하게 보여 준다.
3. 오늘의 추천 학습, 주간 도전, 복습 재진입 중 최소 2개가 서로 이어지는 흐름을 만든다.
4. 어린이 대상 기준에서 과한 경쟁 문구, 과금 유도, 공격적 표현 없이 학습 중심 톤을 유지한다.

## Codex 재검증 기준

2026-05-27 기준 Codex 재검증 결과:

- `npm run report:quiz-metadata`: 통과
- 현재 완전 적용 220/220
- 문해력 110/110
- 속담 30/30
- 역사 30/30
- 생활예절 20/20
- 사자성어 30/30
- `npm run lint`: 통과
- `npm run build`: 통과
- `npm run test:e2e`: 직전 통과 21개, 실패 0개, 경고 1개 유지
- `npm run check:release-readiness`: 통과, 필수 누락 0건 / Android 경고 1건

이제 최우선 제품 공백은 교육 메타데이터가 아니라 지속성이다. `docs/product-strategy-audit.md`의 7일 학습 코스, 주간 도전, 복습함 방향과 현재 구현 상태를 연결하는 쪽으로 집중한다.

## 참고 자료

- `docs/product-strategy-audit.md`
- `docs/product-backlog.md`
- `docs/release-readiness.md`
- `src/components/ui/TodayRecommendation.tsx`
- `src/components/ui/todayRecommendationLogic.ts`
- `src/components/ui/WeeklyChallenge.tsx`
- `src/store/gameStore.ts`
- `src/pages/HomePage.tsx`
- `src/pages/ProfilePage.tsx`

## 작업 범위

### 1. 지속성 흐름 구현

- 사용자가 앱을 열었을 때 바로 이해할 수 있는 `오늘 학습 -> 주간 목표 -> 다음 추천` 흐름을 만든다.
- 7일 학습 코스는 새 데이터 구조를 크게 늘리기보다 기존 학당/학습 기록/추천 로직을 재사용하는 방향을 우선 검토한다.
- 주간 도전은 "이번 주 약점 학당 3스테이지 완료"처럼 측정 가능한 문구와 진행 수치를 보여 준다.
- 복습 재진입이 이미 구현돼 있다면 진입 버튼/문구를 드러내고, 없다면 과한 범위 확장 없이 최소 진입점만 만든다.

### 2. UI 원칙

- 모바일 첫 화면에서 핵심 행동이 늘어나지 않게 유지한다.
- 보상보다 학습 목적이 먼저 읽히도록 문구를 정리한다.
- 작은 화면에서도 카드 높이, 버튼 길이, 설명 줄 수가 무너지지 않게 맞춘다.

### 3. 검증과 보고

- 가능하면 관련 화면 흐름을 직접 확인할 수 있는 테스트나 수동 검증 근거를 남긴다.
- 작업 후 아래 내용을 한국어로 정리한다.
  - 수정한 파일 목록
  - 실행한 명령
  - 사용자가 보게 되는 새 지속성 흐름
  - 남은 공백 또는 Codex가 이어서 검증할 포인트

## 완료 기준

- 홈 또는 학당 허브에서 7일 학습 코스/주간 도전 중 무엇을 해야 하는지 바로 이해된다.
- 오늘의 추천 학습과 주간 목표가 분리된 위젯이 아니라 이어진 학습 흐름으로 보인다.
- 기존 빌드와 린트에 새 오류를 만들지 않는다.
