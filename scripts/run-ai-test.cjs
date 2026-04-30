/**
 * K-Hakdang AI 테스트 오케스트레이터
 * 1. Vite dev 서버 시작
 * 2. Playwright 게임 테스트 실행
 * 3. Dev 서버 종료
 *
 * Windows 작업 스케줄러: 매일 오전 10:00 실행
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const PROJECT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(__dirname, 'test-run.log');

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // 로그 초기화
  fs.writeFileSync(LOG_FILE, `=== K-Hakdang AI 테스트 ${new Date().toLocaleString('ko-KR')} ===\n`, 'utf8');
  log('🚀 AI 테스트 시작');

  // ── 0. Playwright 브라우저 확인 및 설치 ───────────────────
  log('🔍 Playwright 브라우저 확인 중...');
  try {
    const shellPath = path.join(
      process.env.LOCALAPPDATA || '',
      'ms-playwright', 'chromium_headless_shell-1217',
      'chrome-headless-shell-win64', 'chrome-headless-shell.exe'
    );
    if (!fs.existsSync(shellPath)) {
      log('⬇️  chromium headless shell 없음 → 자동 설치 중...');
      execSync('npx playwright install chromium', { cwd: PROJECT, stdio: 'pipe' });
      log('✅ Playwright 브라우저 설치 완료');
    } else {
      log('✅ Playwright 브라우저 확인 완료');
    }
  } catch (e) {
    log(`⚠️  Playwright 설치 실패: ${e.message} — 계속 진행`);
  }

  // ── 1. Dev 서버 시작 ──────────────────────────────────────
  log('🖥️  Vite dev 서버 시작 중...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: PROJECT,
    shell: true,
    stdio: 'pipe',
    detached: false,
  });

  let devReady = false;

  // Vite는 stdout/stderr 둘 다 사용하므로 양쪽 모두 감지
  const onViteOutput = (data) => {
    const text = data.toString();
    if (!devReady && (text.includes('localhost:5173') || text.includes('Local:') || text.includes('ready in'))) {
      devReady = true;
      log('✅ Dev 서버 준비 완료 (port 5173)');
    }
  };
  devServer.stdout.on('data', onViteOutput);
  devServer.stderr.on('data', onViteOutput); // Vite 출력이 stderr로 나오는 경우 대비

  // 포트 직접 확인으로 2차 감지 (최대 30초)
  const http = require('http');
  const checkPort = () => new Promise(resolve => {
    const req = http.get('http://localhost:5173', (res) => { resolve(true); res.destroy(); })
      .on('error', () => resolve(false));
    req.setTimeout(500, () => { req.destroy(); resolve(false); });
  });

  for (let i = 0; i < 30; i++) {
    if (devReady) break;
    await wait(1000);
    // 5초마다 포트 직접 체크
    if (i > 0 && i % 5 === 0) {
      const open = await checkPort();
      if (open) {
        devReady = true;
        log('✅ Dev 서버 준비 완료 (포트 응답 확인, port 5173)');
      }
    }
  }

  if (!devReady) {
    // 마지막으로 포트 체크 한번 더
    const open = await checkPort();
    if (open) {
      devReady = true;
      log('✅ Dev 서버 준비 완료 (포트 최종 확인)');
    } else {
      log('⚠️  Dev 서버 응답 없음 — 5초 추가 대기 후 진행');
      await wait(5000);
    }
  }

  // ── 2. Playwright 테스트 실행 ──────────────────────────────
  log('🤖 Playwright 테스트 실행 중...');
  let testExitCode = 0;

  try {
    execSync(`node "${path.join(__dirname, 'game-test.spec.cjs')}"`, {
      cwd: PROJECT,
      stdio: 'inherit',
      timeout: 5 * 60 * 1000, // 최대 5분
    });
    log('✅ Playwright 테스트 완료');
  } catch (e) {
    testExitCode = e.status || 1;
    log(`⚠️  테스트 일부 실패 (exit code: ${testExitCode})`);
  }

  // ── 3. Dev 서버 종료 ──────────────────────────────────────
  log('🛑 Dev 서버 종료 중...');
  try {
    // Windows: 자식 프로세스 트리 강제 종료
    execSync(`taskkill /PID ${devServer.pid} /T /F`, { stdio: 'ignore' });
  } catch {
    devServer.kill('SIGTERM');
  }
  await wait(1000);

  // ── 4. 결과 확인 ──────────────────────────────────────────
  const resultsFile = path.join(__dirname, 'test-results.json');
  if (fs.existsSync(resultsFile)) {
    const r = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    log(`📊 결과: ${r.summary}`);
  } else {
    log('⚠️  test-results.json 파일 없음');
  }

  log('🏁 AI 테스트 오케스트레이터 완료\n');
  process.exit(testExitCode);
}

main().catch(err => {
  console.error('오케스트레이터 오류:', err);
  process.exit(1);
});
