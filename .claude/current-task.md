# Claude Code 현재 작업 지시

## 목표

K-학당을 Google Play 출시 가능한 앱으로 만들기 위해, Capacitor Android 패키징 설정을 완료한다.

## 배경

일일 자동 루프(2026-05-26) 결과:

- 린트 ✅, 빌드 ✅ (185kB 이하 유지)
- 콘텐츠 ✅ (모든 학당 최소 기준 충족)
- 출시 체크리스트 부족 항목:
  - ❌ 앱 아이콘 512x512 (`public/icon-512.png`)
  - ❌ 피처 그래픽 1024x500 (`public/feature-graphic.png`)
  - ❌ 스크린샷 최소 2장 (`public/screenshots/`)
  - ❌ Capacitor `android/` 디렉토리

Google Play 출시를 위한 가장 중요한 다음 단계는 **Capacitor Android 패키징**이다.

## 이번 작업에서 Claude Code가 할 일

### 1. Capacitor 설치 및 초기화

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "K-학당" "com.khakdang.app" --web-dir dist
npx cap add android
```

### 2. capacitor.config.ts 설정

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khakdang.app',
  appName: 'K-학당',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B4513',
    },
  },
};

export default config;
```

### 3. Android 빌드 확인

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### 4. 앱 아이콘 생성 안내

- `public/icon-512.png` (512×512 PNG) 위치에 앱 아이콘 생성 필요
- `public/feature-graphic.png` (1024×500 PNG) 피처 그래픽 생성 필요
- `public/screenshots/` 디렉토리에 스크린샷 2장 이상 추가 필요

### 5. package.json 스크립트 추가

```json
{
  "scripts": {
    "android:sync": "npm run build && npx cap sync android",
    "android:run": "npx cap run android",
    "android:bundle": "npm run build && npx cap sync android && cd android && ./gradlew bundleRelease"
  }
}
```

## 완료 기준

- `npm run build` 통과
- `npx cap sync android` 통과 (android/ 디렉토리 존재)
- `./gradlew assembleDebug` 성공
- `public/icon-512.png` 파일 존재 (플레이스홀더도 가능)
- `package.json`에 android 빌드 스크립트 추가됨

## 주의 사항

- Capacitor 버전은 최신 v6 사용
- `android/` 디렉토리는 `.gitignore`에 추가하지 말 것 (출시용 설정 포함)
- 기존 PWA 기능은 유지 (Capacitor는 PWA 위에 레이어로 추가)
- 서명 키 생성(keytool)은 사용자 직접 수행 필요 — 이 작업에서 제외
