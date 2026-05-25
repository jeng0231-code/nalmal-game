/**
 * K-학당 텔레그램 알림 전송 스크립트
 * 사용법: node scripts/notify-telegram.cjs "메시지"
 *        node scripts/notify-telegram.cjs --report  (자동화 루프 결과 전송)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// .env 파일에서 토큰 로드
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const vars = {};
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) vars[match[1].trim()] = match[2].trim();
    }
    return vars;
  } catch {
    return {};
  }
}

const env = loadEnv();
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = env.TELEGRAM_CHAT_ID   || process.env.TELEGRAM_CHAT_ID;

async function sendMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 설정되지 않았습니다.');
    process.exit(1);
  }

  const body = JSON.stringify({
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('✅ 텔레그램 전송 완료');
            resolve(result);
          } else {
            console.error('❌ 텔레그램 오류:', result.description);
            reject(new Error(result.description));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 자동화 루프 리포트 생성
function buildReport({ date, lintOk, buildOk, addedQuestions, checklistItems, nextTask }) {
  const status = lintOk && buildOk ? '✅' : '⚠️';
  const today = date || new Date().toLocaleDateString('ko-KR');

  let msg = `🎮 <b>K-학당 일일 리포트</b> — ${today}\n\n`;

  msg += `<b>📋 품질 점검</b>\n`;
  msg += `  린트: ${lintOk ? '✅ 통과' : '❌ 실패'}\n`;
  msg += `  빌드: ${buildOk ? '✅ 통과' : '❌ 실패'}\n\n`;

  if (addedQuestions && Object.keys(addedQuestions).length > 0) {
    msg += `<b>📚 콘텐츠 추가</b>\n`;
    for (const [hakdang, count] of Object.entries(addedQuestions)) {
      if (count > 0) msg += `  ${hakdang}: +${count}문제\n`;
    }
    msg += '\n';
  }

  if (checklistItems && checklistItems.length > 0) {
    const done  = checklistItems.filter(i => i.ok).length;
    const total = checklistItems.length;
    msg += `<b>🚀 출시 체크리스트</b>: ${done}/${total}\n`;
    for (const item of checklistItems) {
      msg += `  ${item.ok ? '✅' : '❌'} ${item.name}\n`;
    }
    msg += '\n';
  }

  if (nextTask) {
    msg += `<b>📌 다음 작업</b>\n${nextTask}\n\n`;
  }

  msg += `${status} <i>자동화 루프 완료</i>`;
  return msg;
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--report') {
    // JSON 파일에서 리포트 데이터 읽기 (루프에서 생성)
    const reportPath = path.join(__dirname, '..', 'scripts', 'loop-report.json');
    let reportData = {};
    try {
      reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch {
      reportData = { date: new Date().toLocaleDateString('ko-KR'), lintOk: false, buildOk: false };
    }
    await sendMessage(buildReport(reportData));
  } else if (args.length > 0) {
    // 직접 메시지 전송
    await sendMessage(args.join(' '));
  } else {
    // 테스트 메시지
    await sendMessage('🎮 K-학당 알림 테스트\n\n텔레그램 알림이 정상적으로 연결되었습니다!');
  }
}

main().catch((err) => {
  console.error('오류:', err.message);
  process.exit(1);
});
