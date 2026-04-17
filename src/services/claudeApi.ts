import Anthropic from '@anthropic-ai/sdk';
import type { QuizQuestion } from '../types';

const RAW_KEY = import.meta.env.VITE_CLAUDE_API_KEY ?? '';

const isValidKey = (key: string) =>
  key.startsWith('sk-ant-') && /^[\x00-\x7F]+$/.test(key);

const API_KEY = isValidKey(RAW_KEY) ? RAW_KEY : '';

let client: Anthropic | null = null;
if (API_KEY) {
  client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
}

// ─── 카테고리별 단어 풀 ────────────────────────────────────
const WORD_CATEGORIES = [
  {
    name: '시간·날짜 표현',
    examples: '차주, 금주, 전주, 금월, 익월, 전월, 금년, 내년, 전년, 재작년, 자정, 정오, 오전, 오후, 새벽, 심야',
  },
  {
    name: '학교·교육 생활',
    examples: '소풍, 수련회, 현장학습, 방과후, 등교, 하교, 조퇴, 지각, 결석, 출석, 학예회, 개학, 종업식, 방학, 학부형',
  },
  {
    name: '공식 문서·공지 언어',
    examples: '공지, 안내, 접수, 신청, 문의, 별첨, 참고, 붙임, 시행, 준용, 경유, 회신, 발신, 수신, 참조',
  },
  {
    name: '날씨·자연 현상',
    examples: '폭염, 열대야, 황사, 미세먼지, 태풍, 소나기, 이슬비, 안개, 서리, 우박, 천둥, 번개, 가뭄, 홍수',
  },
  {
    name: '건강·의료',
    examples: '투약, 처방, 진료, 입원, 퇴원, 완치, 접종, 복용, 금식, 회복, 증상, 진단, 치료, 재활',
  },
  {
    name: '경제·생활',
    examples: '납부, 환불, 할인, 무료, 유료, 정가, 할부, 잔액, 영수증, 세금, 보험, 예금, 적금, 손해',
  },
  {
    name: '교통·이동',
    examples: '환승, 운행, 정류장, 종점, 경유, 직행, 완행, 도착, 출발, 연착, 결항, 우회, 진입, 교행',
  },
  {
    name: '사자성어·관용구',
    examples: '사면초가, 오리무중, 이구동성, 대기만성, 우공이산, 마이동풍, 호연지기, 낭중지추, 수수방관',
  },
  {
    name: '행사·의식',
    examples: '개막식, 폐막식, 시상식, 졸업식, 입학식, 수료식, 취임식, 기념식, 발표회, 전시회, 박람회',
  },
  {
    name: '감정·태도 표현',
    examples: '적극적, 소극적, 능동적, 수동적, 자발적, 의도적, 일방적, 상호적, 주도적, 자숙, 겸손',
  },
];

const SYSTEM_PROMPT = `당신은 초등학생을 위한 한국어 문해력 퀴즈 전문가입니다.
일상생활이나 학교에서 자주 쓰이지만 초등학생이 뜻을 모르는 한자어·사자성어를 골라 퀴즈로 만드세요.
반드시 아래 JSON 배열 형식만 출력하세요 (설명 텍스트, 마크다운 없이 순수 JSON만):`;

// ─── AI 문제 생성 ──────────────────────────────────────────
export async function generateQuizQuestions(
  count: number = 10,
  difficulty: 1 | 2 | 3 = 2,
  categoryIndex?: number
): Promise<QuizQuestion[]> {
  if (!client) {
    console.info('Claude API 키 없음. 기본 문제를 사용합니다.');
    return [];
  }

  const diffLabel = difficulty === 1 ? '쉬운(초등 저학년)' : difficulty === 2 ? '보통(초등 중학년)' : '어려운(초등 고학년)';
  const xp   = difficulty === 1 ? 30 : difficulty === 2 ? 50 : 80;
  const coin = difficulty === 1 ? 5  : difficulty === 2 ? 8  : 12;

  // 카테고리 순환 선택
  const catIdx = categoryIndex !== undefined
    ? categoryIndex % WORD_CATEGORIES.length
    : Math.floor(Math.random() * WORD_CATEGORIES.length);
  const category = WORD_CATEGORIES[catIdx];

  const prompt = `다음 카테고리의 한국어 문해력 퀴즈 ${count}개를 만들어 주세요.

카테고리: ${category.name}
예시 단어: ${category.examples}
난이도: ${diffLabel}

OX 문제(answer: true/false)와 4지선다(answer: 0~3 정답 인덱스)를 섞어서 만드세요.
이미 잘 알려진 쉬운 단어는 피하고, 학생들이 실제로 헷갈리는 단어를 선택하세요.

JSON 배열만 출력 (다른 텍스트 없이):
[
  {
    "id": "ai_001",
    "type": "OX",
    "question": "문제 텍스트 (문장 안에서 단어 사용)",
    "context": "핵심 단어가 포함된 실제 생활 문장",
    "word": "핵심 단어",
    "answer": true,
    "explanation": "정답 해설 (한자 뜻 포함, 2~3문장)",
    "difficulty": ${difficulty},
    "xpReward": ${xp},
    "coinReward": ${coin}
  },
  {
    "id": "ai_002",
    "type": "MULTIPLE",
    "question": "문제 텍스트",
    "context": "핵심 단어가 포함된 실제 생활 문장",
    "word": "핵심 단어",
    "answer": 0,
    "choices": ["정답", "오답1", "오답2", "오답3"],
    "explanation": "정답 해설 (한자 뜻 포함, 2~3문장)",
    "difficulty": ${difficulty},
    "xpReward": ${xp},
    "coinReward": ${coin}
  }
]`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text?.trim() ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as QuizQuestion[];
    const ts = Date.now();
    return parsed.map((q, i) => ({ ...q, id: `ai_${ts}_${i}` }));
  } catch (e) {
    console.error('Claude API 오류:', e);
    return [];
  }
}

// ─── 누적 AI 문제 뱅크 ────────────────────────────────────
const BANK_KEY = 'ai_question_bank';
const BANK_META_KEY = 'ai_question_bank_meta';
const MAX_BANK_SIZE = 300;

interface BankMeta {
  lastGenDate: string;    // YYYY-MM-DD - 마지막 생성 날짜
  totalGenerated: number; // 누적 생성 문제 수
  categoryIndex: number;  // 다음에 쓸 카테고리 인덱스
}

function loadBank(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    return raw ? (JSON.parse(raw) as QuizQuestion[]) : [];
  } catch { return []; }
}

function loadMeta(): BankMeta {
  try {
    const raw = localStorage.getItem(BANK_META_KEY);
    return raw ? JSON.parse(raw) : { lastGenDate: '', totalGenerated: 0, categoryIndex: 0 };
  } catch { return { lastGenDate: '', totalGenerated: 0, categoryIndex: 0 }; }
}

function saveBank(questions: QuizQuestion[]): void {
  // 최대 MAX_BANK_SIZE 유지 (오래된 것부터 삭제)
  const trimmed = questions.slice(-MAX_BANK_SIZE);
  localStorage.setItem(BANK_KEY, JSON.stringify(trimmed));
}

function saveMeta(meta: BankMeta): void {
  localStorage.setItem(BANK_META_KEY, JSON.stringify(meta));
}

/** 이미 있는 단어와 중복되지 않는 문제만 필터링 */
function deduplicateByWord(existing: QuizQuestion[], incoming: QuizQuestion[]): QuizQuestion[] {
  const existingWords = new Set(existing.map(q => q.word.toLowerCase()));
  return incoming.filter(q => !existingWords.has(q.word.toLowerCase()));
}

/**
 * AI 문제 뱅크를 가져오거나 새로 생성합니다.
 * - 뱅크가 비어있거나 오늘 생성 이력이 없으면 새 문제를 생성해 추가
 * - 이미 오늘 생성했으면 기존 뱅크를 그대로 반환
 */
export async function getOrBuildAIBank(): Promise<QuizQuestion[]> {
  const bank = loadBank();
  const meta = loadMeta();
  const today = new Date().toISOString().split('T')[0];

  // 뱅크가 충분하고 오늘 이미 생성했으면 기존 반환
  if (meta.lastGenDate === today && bank.length >= 30) {
    return bank;
  }

  if (!client) return bank;

  // 카테고리 인덱스 순환
  const catIdx = meta.categoryIndex;

  try {
    // 3가지 난이도 각 10문제씩 병렬 생성
    const [easy, mid, hard] = await Promise.all([
      generateQuizQuestions(10, 1, catIdx),
      generateQuizQuestions(10, 2, catIdx + 1),
      generateQuizQuestions(10, 3, catIdx + 2),
    ]);

    const newQuestions = [...easy, ...mid, ...hard];
    const unique = deduplicateByWord(bank, newQuestions);

    const updatedBank = [...bank, ...unique];
    saveBank(updatedBank);
    saveMeta({
      lastGenDate: today,
      totalGenerated: meta.totalGenerated + unique.length,
      categoryIndex: (catIdx + 3) % WORD_CATEGORIES.length,
    });

    console.info(`AI 문제 뱅크 업데이트: +${unique.length}개 추가 (총 ${updatedBank.length}개)`);
    return updatedBank;
  } catch (e) {
    console.error('AI 뱅크 생성 실패:', e);
    return bank;
  }
}

/** 뱅크에서 난이도별 문제를 가져옴 */
export function getAIQuestionsByDifficulty(difficulty: 1 | 2 | 3): QuizQuestion[] {
  const bank = loadBank();
  return bank.filter(q => q.difficulty === difficulty);
}

/** 뱅크 현황 정보 */
export function getBankStatus(): { total: number; byDifficulty: [number, number, number]; lastGenDate: string } {
  const bank = loadBank();
  const meta = loadMeta();
  return {
    total: bank.length,
    byDifficulty: [
      bank.filter(q => q.difficulty === 1).length,
      bank.filter(q => q.difficulty === 2).length,
      bank.filter(q => q.difficulty === 3).length,
    ],
    lastGenDate: meta.lastGenDate,
  };
}

// ─── 하위 호환 함수 (QuizPage에서 사용) ────────────────────
export function getCachedAIQuestions(): QuizQuestion[] {
  return loadBank();
}

export function cacheAIQuestions(questions: QuizQuestion[]): void {
  const existing = loadBank();
  const unique = deduplicateByWord(existing, questions);
  saveBank([...existing, ...unique]);
}
