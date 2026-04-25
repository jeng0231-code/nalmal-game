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

  // ── 1. Dev 서버 시작 ──────────────────────────────────────
  log('🖥️  Vite dev 서버 시작 중...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: PROJECT,
    shell: true,
    stdio: 'pipe',
    detached: false,
  });

  let devReady = false;
  devServer.stdout.on('data', data => {
    const text = data.toString();
    if (text.includes('localhost:5173') || text.includes('Local:')) {
      devReady = true;
      log('✅ Dev 서버 준비 완료 (port 5173)');
    }
  });
  devServer.stderr.on('data', () => {}); // 무시

  // 서버 준비 대기 (최대 30초)
  for (let i = 0; i < 30; i++) {
    if (devReady) break;
    await wait(1000);
  }

  if (!devReady) {
    log('⚠️  Dev 서버 응답 없음 — 5초 추가 대기 후 진행');
    await wait(5000);
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
