# K-학당 Android 출시 경로 계획

작성일: 2026-05-26

## 결정

- 기본 출시 경로는 `Capacitor + Android App Bundle(AAB)`로 잡는다.
- 웹 배포는 내부 검증과 빠른 피드백용으로 유지하되, Google Play 등록 기준은 Android 패키징 기준으로 맞춘다.

## 이유

- Google Play 수익화, 데이터 안전, 앱 심사 대응은 웹 앱보다 Android 패키징 경로가 명확하다.
- 어린이 또는 가족 대상 가능성을 고려하면 광고, 결제, 정책 고지 위치를 앱 기준으로 점검하는 편이 안전하다.
- 현재 앱은 모바일 화면과 오프라인성, 로컬 학습 기록 흐름이 중요해 웹 래핑보다 앱 패키징 기준 검증이 먼저 필요하다.

## 이번 단계 목표

1. `android/` 프로젝트를 생성하고 저장소에 포함한다.
2. 앱 ID, 앱 이름, 아이콘 반영 경로를 확정한다.
3. `npm run build` 이후 `npx cap sync android`가 재현 가능해야 한다.
4. 로컬 디버그 빌드 또는 Gradle 태스크 실행 기록을 남긴다.
5. 진입 전 `npm run check:android-preflight`로 저장소 상태와 로컬 도구 상태를 분리 점검한다.

## Claude Code 작업 범위

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` 도입
- Capacitor 초기화와 `android/` 생성
- 웹 빌드 산출물과 Android 프로젝트 연결
- 앱 이름, 패키지 ID, 아이콘 적용 경로 정리
- 필요한 경우 Android 빌드/실행 절차를 문서화

## 완료 기준

- `android/` 디렉터리가 생긴다.
- 저장소 루트에 Capacitor 설정 파일이 존재한다.
- `docs/release-readiness.md`에 Android 패키징 상태가 경고가 아니라 진행 상태로 갱신된다.
- Codex가 `npm run build`, `npm run check:release-readiness`를 다시 실행했을 때 Android 경고 문구가 바뀌거나 해소된다.

## Codex 검증 기준

- `npm run check:android-preflight`
- `npm run lint`
- `npm run build`
- `npm run check:release-readiness`

## 2026-05-27 저장소 선반영 상태

- `capacitor.config.ts`가 저장소에 추가되어 appId/appName/webDir 기준값은 고정됐다.
- `package.json`에 `android:bootstrap`, `android:sync`, `android:open` 스크립트가 추가됐다.
- `scripts/capacitor-bootstrap.ps1`가 패키지 설치 → 웹 빌드 → `cap add android` → `cap sync android` 순서를 자동화한다.
- `android/app/build.gradle`가 `android/key.properties` 기반 릴리즈 서명 구성을 읽도록 보강됐다.
- `android/key.properties.example`와 `npm run android:bundle:release`가 추가되어 서명 정보만 채우면 `build → cap sync → bundleRelease`를 한 번에 재현할 수 있다.
- 따라서 다음 작업자는 네트워크 가능한 셸에서 `npm run android:bootstrap`부터 시작하면 된다.

## 보류 사항

- 실제 서명 키 생성, `android/key.properties` 작성, Play Console 업로드는 사용자 결정 또는 별도 보안 절차가 필요하다.
- 광고 SDK, 결제 SDK는 가족 대상 정책 판단 이후에만 추가한다.
- 현재 Codex 실행 환경에서는 `npm install @capacitor/...`가 완료되지 않아 패키징 연결을 직접 끝내지 못했다. 다음 작업자는 네트워크/패키지 설치가 가능한 셸에서 같은 단계부터 재개해야 한다.
