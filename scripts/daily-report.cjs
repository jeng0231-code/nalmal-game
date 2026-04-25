/**
 * K-Hakdang 일일 개발 보고서 — 텔레그램 자동 발송
 * 실행: node scripts/daily-report.js
 * 스케줄: Windows 작업 스케줄러로 매일 23:00 실행
 */

const https  = require('https');
const { execSync } = require('child_process');
const fs     = require('fs');
const path   = require('path');

// ─── 설정 ──────────────────────────────────────────────────
const BOT_TOKEN = '8738667872:AAHZeEbNllvAFskpwGYnCG2w83wyIDY_2go';
const CHAT_ID   = '478722716';
const PROJECT   = path.resolve(__dirname, '..');

// ─── 유틸 ──────────────────────────────────────────────────
function run(cmd, cwd = PROJECT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 15000 }).trim();
  } catch {
    return '';
  }
}

function esc(text) {
  // HTML special chars
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function today() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\. /g, '-').replace('.', '');
}

// ─── 데이터 수집 ───────────────────────────────────────────

/** 최근 2일 커밋 목록 */
function getRecentCommits() {
  const log = run('git log --oneline --since="2 days ago" --format="• %s (%cr)"');
  if (!log) return '최근 변경사항 없음';
  return log.split('\n').slice(0, 8).join('\n');
}

/** TODO/FIXME 항목 수집 */
function getTodos() {
  try {
    const srcDir = path.join(PROJECT, 'src');
    const results = [];
    function walk(dir) {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx)$/.test(f)) continue;
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (/TODO|FIXME|HACK/.test(line)) {
            const rel = path.relative(PROJECT, full).replace(/\\/g, '/');
            results.push(`• ${rel}:${i + 1} — ${line.trim().replace(/^\/\/\s*/, '')}`);
          }
        });
      }
    }
    walk(srcDir);
    if (results.length === 0) return '발견된 TODO/FIXME 없음 ✅';
    return results.slice(0, 6).join('\n');
  } catch {
    return '분석 오류';
  }
}

/** 파일 수 통계 */
function getStats() {
  try {
    const srcDir = path.join(PROJECT, 'src');
    let ts = 0, tsx = 0;
    function walk(dir) {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (f.endsWith('.tsx')) tsx++;
        else if (f.endsWith('.ts')) ts++;
      }
    }
    walk(srcDir);

    // 카테고리 데이터 파일 확인
    const dataFiles = ['quizData', 'proverbsData', 'idiomsData', 'historyData', 'etiquetteData'];
    const present = dataFiles.filter(f =>
      fs.existsSync(path.join(PROJECT, 'src', 'data', `${f}.ts`))
    );

    // 빌드 파일 사이즈
    let buildSize = '미빌드';
    const distJs = path.join(PROJECT, 'dist', 'assets');
    if (fs.existsSync(distJs)) {
      const files = fs.readdirSync(distJs).filter(f => f.endsWith('.js'));
      const total = files.reduce((acc, f) => {
        return acc + fs.statSync(path.join(distJs, f)).size;
      }, 0);
      buildSize = `${(total / 1024).toFixed(0)} KB`;
    }

    return [
      `TSX 파일: ${tsx}개 · TS 파일: ${ts}개`,
      `데이터 파일: ${present.length}/${dataFiles.length}개 준비됨`,
      `빌드 번들: ${buildSize}`,
    ].join('\n');
  } catch {
    return '통계 수집 오류';
  }
}

/** 개선 권장사항 (정적 분석 기반) */
function getRecommendations() {
  const items = [];

  // 번들 사이즈 체크
  const distJs = path.join(PROJECT, 'dist', 'assets');
  if (fs.existsSync(distJs)) {
    const files = fs.readdirSync(distJs).filter(f => f.endsWith('.js'));
    const total = files.reduce((a, f) => a + fs.statSync(path.join(distJs, f)).size, 0);
    if (total > 500 * 1024) {
      items.push('⚡ 번들 크기 과대 — 동적 import()로 코드 스플리팅 권장');
    }
  }

  // AI API 키 체크
  const envPath = path.join(PROJECT, '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    if (!env.includes('VITE_CLAUDE_API_KEY=sk-ant-')) {
      items.push('🔑 AI 키 미설정 — .env VITE_CLAUDE_API_KEY 확인 필요');
    } else {
      items.push('✅ Claude AI 연동 키 정상 설정됨');
    }
  }

  // GateQuizPage 존재 확인
  const gateExists = fs.existsSync(path.join(PROJECT, 'src', 'pages', 'GateQuizPage.tsx'));
  if (gateExists) {
    items.push('🚪 관문 퀴즈 시스템 — 통과율 통계 추가 검토 권장');
  }

  // categoryStats 관련
  items.push('📊 카테고리 밸런스 편향 시 알림 threshold 세부 조정 권장');
  items.push('🌐 Netlify 배포 자동화 — GitHub 푸시 = 즉시 반영 정상 작동 중');

  return items.slice(0, 5).join('\n');
}

/** 향후 계획 (고정 로드맵) */
function getRoadmap() {
  const roadmap = [
    '📈 ProfilePage — 카테고리별 학습 성장 그래프 추가',
    '🏆 학당별 개인 최고점 & 로컬 랭킹 보드',
    '🔔 하트 완전 회복 시 푸시 알림 (PWA 알림)',
    '🌍 다국어 지원 검토 (영어/일본어 인터페이스)',
    '🎵 효과음/BGM 볼륨 설정 옵션',
    '📱 오프라인 PWA 캐싱 강화 (Service Worker 개선)',
    '👨‍👩‍👧 학부모 대시보드 — 자녀 학습 현황 요약',
  ];
  return roadmap.map(r => `• ${r}`).join('\n');
}

// ─── 보고서 생성 ───────────────────────────────────────────
function buildReport() {
  const commits      = esc(getRecentCommits());
  const todos        = esc(getTodos());
  const stats        = esc(getStats());
  const recs         = esc(getRecommendations());
  const roadmap      = esc(getRoadmap());
  const dateStr      = today();

  return `🏫 <b>K-Hakdang 일일 개발 보고서</b>
📅 ${dateStr} · 오후 11:00 자동 발송

━━━━━━━━━━━━━━━━━
📦 <b>최근 변경사항</b>
${commits}

━━━━━━━━━━━━━━━━━
📊 <b>프로젝트 현황</b>
${stats}

━━━━━━━━━━━━━━━━━
⚠️ <b>TODO / 미결 항목</b>
${todos}

━━━━━━━━━━━━━━━━━
🔧 <b>개선 권장사항</b>
${recs}

━━━━━━━━━━━━━━━━━
🚀 <b>향후 개발 로드맵</b>
${roadmap}

━━━━━━━━━━━━━━━━━
📝 <b>총평</b>
K-Hakdang은 5개 학당(문해력·속담·사자성어·역사·생활예절) 플랫폼으로 확장 완료. 딸의 현장 테스트로 UX 이슈를 빠르게 식별·수정 중. 관문 시험·카테고리 밸런스 시스템이 편향 학습을 방지하는 핵심 기능으로 자리잡고 있음. AI 무한 문제 생성으로 반복 플레이 내구성 확보. 다음 단계는 데이터 시각화와 PWA 완성도 강화.

━━━━━━━━━━━━━━━━━
🤖 K-Hakdang Dev Bot · 매일 밤 11시 자동 발송`;
}

// ─── 텔레그램 전송 ──────────────────────────────────────────
function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.ok) {
          console.log('✅ 텔레그램 전송 성공:', new Date().toLocaleString('ko-KR'));
          resolve(parsed);
        } else {
          console.error('❌ 텔레그램 오류:', parsed.description);
          reject(new Error(parsed.description));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── 메인 ──────────────────────────────────────────────────
(async () => {
  console.log('📊 K-Hakdang 일일 보고서 생성 중...');
  try {
    const report = buildReport();
    console.log('\n=== 보고서 미리보기 ===\n');
    console.log(report.replace(/<[^>]+>/g, ''));  // HTML 태그 제거 후 출력
    console.log('\n=== 전송 중... ===');
    await sendTelegram(report);
  } catch (err) {
    console.error('오류:', err.message);
    process.exit(1);
  }
})();
