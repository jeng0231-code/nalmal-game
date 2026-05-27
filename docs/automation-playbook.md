# K-학당 자동화 플레이북

Codex가 매일 자동 실행하는 루프의 전체 지침서.
Claude Code는 이 문서를 보고 역할을 분담한다.

---

## 🔁 일일 자동 루프 (Codex 실행)

### Phase 1 — 품질 점검 (항상 실행)

```
1. npm run lint          → 에러 있으면 수정 후 재실행
2. npm run build         → 실패하면 원인 분석 후 수정
3. 빌드 통과 시 자동 커밋  → "chore: daily auto-fix [날짜]"
```

### Phase 2 — 콘텐츠 갭 분석

각 학당 데이터 파일의 문제 수를 세고 기준 미달이면 보충:

| 학당 | 파일 | 최소 문제 수 |
|------|------|------------|
| 언어 | src/data/quizData.ts | 30문제 |
| 속담 | src/data/proverbsData.ts | 20문제 |
| 사자성어 | src/data/idiomsData.ts | 20문제 |
| 역사 | src/data/historyData.ts | 20문제 |
| 예절 | src/data/etiquetteData.ts | 20문제 |

부족한 학당에 **5문제씩** 추가 (난이도 균형: 쉬움 2 + 보통 2 + 어려움 1).
새 문제에는 반드시 `learningGoal`, `hintText`, `tags` 포함.

### Phase 3 — 교육 적합성 검사

- 어린이/가족 앱 기준으로 자극적 표현 없는지 확인
- `difficulty` 분포가 1:1:1 비율에서 크게 벗어나지 않는지 확인
- `hintText` 미작성 비율이 50% 초과하면 상위 10문제에 힌트 추가

### Phase 4 — 문서 업데이트

1. `docs/release-readiness.md` — 오늘 날짜로 루프 결과 기록
2. `.claude/current-task.md` — 다음 Claude Code 작업 제안 갱신
3. `docs/product-backlog.md` — 완료 항목 체크, 새 항목 추가

---

## 📦 주간 자동 루프 (매주 월요일, Codex 실행)

### UI/UX 개선 분석

```
1. src/pages/, src/components/ 전체 스캔
2. 모바일 친화성 체크 (터치 타겟 44px, 폰트 최소 14px 등)
3. 개선 제안 → docs/product-backlog.md에 추가
```

### 번들 사이즈 추이

```
1. npm run build 실행
2. 청크 사이즈 분석
3. 185kB 초과 시 분리 방안 제안
```

### 백로그 우선순위 재정렬

`docs/product-backlog.md`를 읽고 다음 기준으로 우선순위 정렬:
- Google Play 출시 요건 충족 여부
- 수익화 직결 여부
- 교육 품질 영향도
- 구현 난이도 (낮을수록 먼저)

---

## 🚀 Google Play 출시 파이프라인

### 출시 체크리스트 (Codex가 자동 검증)

```
□ 빌드 통과
□ E2E 테스트 통과 21개 이상
□ 린트 에러 0개
□ 앱 아이콘 512x512 존재 (public/icon-512.png)
□ 피처 그래픽 1024x500 존재 (public/feature-graphic.png)
□ 스크린샷 최소 2장 존재 (public/screenshots/)
□ 개인정보처리방침 페이지 존재 (`public/privacy-policy.html`)
□ 짧은 설명 80자 이하
□ 자세한 설명 4000자 이하
□ Capacitor android/ 디렉토리 존재
□ `android/key.properties` 준비
□ 서명된 AAB 생성 가능
```

### 자동화 가능 단계

```bash
# Codex가 자동 실행 가능
npm run build
npx cap sync android
npm run android:bundle:release          # 서명된 AAB

# 사용자가 직접 해야 하는 단계
keytool -genkeypair ...       # 업로드 키 생성 (최초 1회)
android/key.properties 작성   # 저장소 예시 파일 기반
Google Play Console 업로드    # 브라우저에서 직접
```

---

## 💰 수익화 자동화 구조

### AdMob 보상 광고 연동 (구현 대상)

```
하트가 0개일 때:
  → "광고 보고 하트 +1" 버튼 표시
  → 광고 시청 완료 시 restoreHeart() 호출

힌트 구매 대안:
  → "코인 없을 때 광고 보고 힌트 사용" 옵션
```

### 인앱결제 SKU 목록 (구현 대상)

| SKU | 설명 | 가격 |
|-----|------|------|
| `ad_free` | 광고 제거 (영구) | ₩2,900 |
| `hearts_5` | 하트 5개 | ₩990 |
| `hearts_20` | 하트 20개 | ₩2,900 |
| `premium_pack` | 프리미엄 학습팩 (AI 문제 무제한) | ₩4,900 |

---

## 🤖 자동화 권한 정책

### Codex 자동 적용 가능 (빌드 통과 조건)
- 린트/타입 에러 수정
- 데이터 파일 문제 추가/수정
- 문서 업데이트 (release-readiness, current-task, backlog)
- 의존성 버전 업데이트 (patch 버전만)
- 번들 최적화 (기능 변경 없는 코드 분리)

### 사용자 승인 필요
- 새 기능 구현
- UI 레이아웃 변경
- 의존성 추가/삭제
- 빌드 설정 변경
- 모든 Google Play 업로드

### Claude Code만 담당
- 복잡한 기능 설계
- 새 페이지/컴포넌트 구조 설계
- 수익화 구조 구현
- Capacitor 패키징 설정

---

## 📊 성과 지표 (Codex가 주간 측정)

| 지표 | 목표 | 측정 방법 |
|------|------|---------|
| 총 문제 수 | 150개+ | 데이터 파일 count |
| hintText 커버리지 | 80%+ | 필드 존재 비율 |
| E2E 통과율 | 100% | test:e2e |
| 초기 번들 | 185kB 이하 | 빌드 출력 |
| 린트 에러 | 0개 | lint |
| 미니게임 수 | 7개+ | 라우트 수 |

---

## 🗓️ 자동 루프 운영 규칙

1. 매 루프마다 `docs/release-readiness.md` 업데이트 필수
2. 빌드 실패 시 다음 루프 전에 반드시 수정
3. 콘텐츠 추가는 어린이/가족 기준 적합성 확인 후
4. 큰 변경(새 기능, UI 전면 수정)은 `current-task.md`에 제안만 하고 Claude Code에 위임
5. 하루 최대 커밋 수: 3개 (품질↑, 콘텐츠↑, 문서↑)
