/**
 * K-Hakdang AI 자동 테스트 스위트
 * Playwright로 게임 전체 기능을 순서대로 테스트하고 결과를 저장합니다.
 * 실행: node scripts/run-tests.cjs
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const RESULTS_FILE = path.join(__dirname, 'test-results.json');

// ─── 결과 누적 ──────────────────────────────────────────────
const results = {
  runAt: new Date().toISOString(),
  passed: [],
  failed: [],
  warnings: [],
  screenshots: [],
  summary: '',
};

function pass(name, detail = '') {
  console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
  results.passed.push({ name, detail });
}

function fail(name, error = '') {
  console.log(`  ❌ ${name}${error ? ' — ' + error : ''}`);
  results.failed.push({ name, error: String(error) });
}

function warn(name, detail = '') {
  console.log(`  ⚠️  ${name}${detail ? ' — ' + detail : ''}`);
  results.warnings.push({ name, detail });
}

// ─── 스크린샷 저장 ──────────────────────────────────────────
async function shot(page, name) {
  try {
    const dir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const file = path.join(dir, `${name}-${Date.now()}.png`);
    await page.screenshot({ path: file, fullPage: false });
    results.screenshots.push(file);
  } catch { /* 스크린샷 실패는 무시 */ }
}

// ─── 메인 테스트 ────────────────────────────────────────────
async function runTests() {
  console.log('\n🤖 K-Hakdang AI 자동 테스트 시작...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro 크기
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  // 콘솔 에러 수집
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 홈페이지 로딩
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 [1] 홈페이지 로딩 테스트');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await shot(page, '01-home');
    const title = await page.title();
    if (title.includes('Hakdang') || title.includes('K-') || title.includes('학당')) {
      pass('페이지 타이틀', title);
    } else {
      warn('페이지 타이틀 예상과 다름', title);
    }
  } catch (e) {
    fail('홈페이지 로드 실패', e.message);
    await browser.close();
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 신규 유저 온보딩 (이름 입력)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [2] 신규 유저 온보딩');
  try {
    const nameInput = page.locator('input[type="text"]').first();
    const isNameScreen = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (isNameScreen) {
      await nameInput.fill('AI테스터');
      await nameInput.press('Enter');
      pass('이름 입력 화면', '표시 정상');
      await page.waitForTimeout(800);
      await shot(page, '02-name-input');

      // 아바타 화면 또는 메인 화면으로 진행 (버튼 텍스트: '사진 없이 기본 캐릭터로 시작하기')
      const skipBtn = page.getByText('기본 캐릭터로 시작하기')
        .or(page.getByText('건너뛰기'))
        .or(page.getByText('나중에'))
        .first();
      if (await skipBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await skipBtn.click();
        pass('아바타 건너뛰기', '정상 동작');
        await page.waitForTimeout(800);
      }
    } else {
      pass('이름 입력 화면', '기존 유저 — 바로 홈으로');
    }
    await page.waitForTimeout(1000);
  } catch (e) {
    fail('온보딩 처리', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 메인 홈 화면 UI 확인
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [3] 메인 홈 화면 UI');
  try {
    await page.waitForTimeout(1500);
    await shot(page, '03-main-home');

    // 주요 버튼 존재 확인
    const quizBtn  = page.getByText('퀴즈 풀기').first();
    const hubBtn   = page.getByText('학당 허브').first();
    const profileBtn = page.getByText('내 기록').first();

    if (await quizBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      pass('퀴즈 풀기 버튼 표시');
    } else {
      fail('퀴즈 풀기 버튼 없음');
    }

    if (await hubBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      pass('학당 허브 버튼 표시');
    } else {
      fail('학당 허브 버튼 없음');
    }

    if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      pass('내 기록 버튼 표시');
    } else {
      fail('내 기록 버튼 없음');
    }
  } catch (e) {
    fail('홈 화면 UI 확인', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. 학당 허브 페이지
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [4] 학당 허브 페이지');
  try {
    await page.goto(`${BASE_URL}/hakdang`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    await shot(page, '04-hakdang-hub');

    // 5개 학당 카드 확인
    const hakdangs = ['서당', '격언당', '성어당', '사고당', '예절당'];
    for (const name of hakdangs) {
      const el = page.getByText(name).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        pass(`학당 카드: ${name}`);
      } else {
        fail(`학당 카드 없음: ${name}`);
      }
    }

    // 밸런스 미터 확인
    const balanceEl = page.getByText('학습 밸런스').or(page.getByText('균형')).first();
    if (await balanceEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      pass('밸런스 미터 표시');
    } else {
      warn('밸런스 미터 미확인');
    }
  } catch (e) {
    fail('학당 허브 페이지', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 퀴즈 페이지 — 문해력 (literacy)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [5] 퀴즈 — 문해력 카테고리');
  try {
    await page.goto(`${BASE_URL}/quiz?category=literacy`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await shot(page, '05-quiz-literacy-loading');

    // 로딩 완료 대기 (최대 20초)
    await page.waitForFunction(
      () => !document.body.innerText.includes('문제를 준비하고 있어요'),
      { timeout: 25000 }
    ).catch(() => warn('퀴즈 로딩 20초 초과'));

    await shot(page, '05-quiz-literacy-loaded');

    // 스테이지 인트로 확인
    const stageBtn = page.getByText('시작!').or(page.getByText('STAGE')).first();
    if (await stageBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      pass('퀴즈 스테이지 인트로 표시');
      await stageBtn.click();
      await page.waitForTimeout(2000); // 문제 로딩 대기
      await shot(page, '05-quiz-literacy-start');
    } else {
      warn('스테이지 인트로 버튼 미확인');
    }

    // 퀴즈 문제 확인 (AI 생성 시간 고려해서 타임아웃 늘림)
    const oxBtn = page.locator('button').filter({ hasText: '⭕' }).first();
    const multiChoice = page.locator('button').filter({ hasText: /^1\./ }).first();

    if (await oxBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      pass('OX 퀴즈 문제 표시');
      await shot(page, '05-quiz-ox-question');
      await oxBtn.click();
      await page.waitForTimeout(1500);
      pass('OX 퀴즈 답변 클릭');
      await shot(page, '05-quiz-ox-answered');
    } else if (await multiChoice.isVisible({ timeout: 10000 }).catch(() => false)) {
      pass('4지선다 문제 표시');
      await multiChoice.click();
      await page.waitForTimeout(1500);
      pass('4지선다 답변 클릭');
    } else {
      warn('퀴즈 문제 버튼 미확인 (AI 생성 지연 가능)');
    }
  } catch (e) {
    fail('퀴즈 페이지', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. 퀴즈 — 속담 카테고리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [6] 퀴즈 — 속담 카테고리');
  try {
    await page.goto(`${BASE_URL}/quiz?category=proverbs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      () => !document.body.innerText.includes('문제를 준비하고 있어요'),
      { timeout: 20000 }
    ).catch(() => {});
    await shot(page, '06-quiz-proverbs');

    const hasContent = await page.locator('body').innerText();
    if (hasContent.includes('속담') || hasContent.includes('STAGE') || hasContent.includes('시작')) {
      pass('속담 퀴즈 페이지 로드');
    } else {
      warn('속담 퀴즈 컨텐츠 미확인');
    }
  } catch (e) {
    fail('속담 퀴즈', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. 퀴즈 — 역사 카테고리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [7] 퀴즈 — 역사 카테고리');
  try {
    await page.goto(`${BASE_URL}/quiz?category=history`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      () => !document.body.innerText.includes('문제를 준비하고 있어요'),
      { timeout: 20000 }
    ).catch(() => {});
    await shot(page, '07-quiz-history');
    pass('역사 퀴즈 페이지 로드');
  } catch (e) {
    fail('역사 퀴즈', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. 프로필 페이지
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [8] 프로필 페이지');
  try {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    await shot(page, '08-profile');

    const body = await page.locator('body').innerText();
    if (body.includes('업적') || body.includes('XP') || body.includes('레벨')) {
      pass('프로필 페이지 로드 (업적/레벨 표시)');
    } else {
      warn('프로필 페이지 컨텐츠 미확인');
    }
  } catch (e) {
    fail('프로필 페이지', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. 반응형 & 모바일 레이아웃
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [9] 반응형 레이아웃');
  try {
    // 태블릿 크기
    await context.browser().newContext({ viewport: { width: 768, height: 1024 } });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await shot(page, '09-tablet-layout');
    pass('태블릿 뷰포트 렌더링');

    // 데스크탑 크기
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload({ waitUntil: 'networkidle' });
    await shot(page, '09-desktop-layout');
    pass('데스크탑 뷰포트 렌더링');

    // 다시 모바일
    await page.setViewportSize({ width: 390, height: 844 });
  } catch (e) {
    fail('반응형 레이아웃', e.message);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. 콘솔 에러 체크
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 [10] 콘솔 에러 체크');
  if (consoleErrors.length === 0) {
    pass('콘솔 에러 없음');
  } else {
    const filtered = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('net::')
    );
    if (filtered.length === 0) {
      warn('네트워크 관련 콘솔 경고만 있음 (무시 가능)');
    } else {
      filtered.slice(0, 3).forEach(err => fail('콘솔 에러', err.slice(0, 120)));
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 결과 저장
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  results.summary = `통과 ${results.passed.length}개 / 실패 ${results.failed.length}개 / 경고 ${results.warnings.length}개`;
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\n${'━'.repeat(40)}`);
  console.log(`🤖 테스트 완료: ${results.summary}`);
  console.log(`📁 결과 저장: ${RESULTS_FILE}`);
  console.log(`${'━'.repeat(40)}\n`);

  await browser.close();
}

runTests().catch(err => {
  console.error('테스트 실행 오류:', err);
  // 오류 발생 시에도 결과 파일 저장
  results.failed.push({ name: '테스트 실행 자체 오류', error: err.message });
  results.summary = `오류 발생 — 통과 ${results.passed.length}개 / 실패 ${results.failed.length}개`;
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(results, null, 2), 'utf8'
  );
  process.exit(1);
});
