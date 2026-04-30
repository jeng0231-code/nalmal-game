import Anthropic from '@anthropic-ai/sdk';
import type { QuizQuestion } from '../types';
import type { QuizCategory } from '../types/hakdang';

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

// ─── JSON 잘림 복구 유틸 ──────────────────────────────────
/**
 * Claude 응답이 max_tokens 한도로 중간에 잘린 경우 복구 시도.
 * 마지막으로 완결된 JSON 객체(})까지만 잘라서 배열을 닫는다.
 */
function repairTruncatedJson(text: string): string | null {
  // 배열 시작 위치 확보
  const start = text.indexOf('[');
  if (start === -1) return null;

  let json = text.slice(start);

  // 이미 완전한 배열이면 그대로 반환
  const trimmed = json.trimEnd();
  if (trimmed.endsWith(']')) return trimmed;

  // 마지막 완결 객체(})까지 자른 뒤 ] 추가
  const lastBrace = json.lastIndexOf('}');
  if (lastBrace === -1) return null;

  return json.slice(0, lastBrace + 1) + ']';
}

/** 텍스트에서 JSON 배열 파싱 (잘린 경우 복구 시도) */
function parseJsonArray<T>(text: string): T[] | null {
  // 1차: 완전한 배열 정규식
  const match = text.match(/\[[\s\S]*?\](?=\s*$)/) ?? text.match(/\[[\s\S]*\]/);
  if (match) {
    try { return JSON.parse(match[0]) as T[]; } catch { /* fall through */ }
  }
  // 2차: 잘린 JSON 복구
  const repaired = repairTruncatedJson(text);
  if (repaired) {
    try { return JSON.parse(repaired) as T[]; } catch { /* fall through */ }
  }
  return null;
}

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

  const callApi = async (questionCount: number) => {
    const message = await client!.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 5000,           // 3000 → 5000 (잘림 방지)
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.replace(`${count}개`, `${questionCount}개`) }],
    });
    return (message.content[0] as { type: string; text: string }).text?.trim() ?? '';
  };

  try {
    let text = await callApi(count);
    let parsed = parseJsonArray<QuizQuestion>(text);

    // 파싱 실패 시 문제 수를 줄여서 1회 재시도
    if (!parsed || parsed.length === 0) {
      console.warn('Claude 응답 파싱 실패 — 5문제로 재시도');
      text = await callApi(Math.min(5, count));
      parsed = parseJsonArray<QuizQuestion>(text);
    }

    if (!parsed || parsed.length === 0) return [];

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

// ─── 카테고리별 AI 문제 생성 ────────────────────────────────
const CATEGORY_PROMPTS: Record<QuizCategory, { system: string; userTemplate: (diff: string, xp: number, coin: number) => string }> = {
  literacy: {
    system: `당신은 초등학생을 위한 한국어 문해력 퀴즈 전문가입니다. 일상생활이나 학교에서 자주 쓰이지만 초등학생이 뜻을 모르는 한자어·사자성어를 골라 퀴즈로 만드세요. 반드시 아래 JSON 배열 형식만 출력하세요 (설명 텍스트, 마크다운 없이 순수 JSON만):`,
    userTemplate: (diff, xp, coin) => `한국어 문해력 퀴즈 10개를 만들어 주세요.
난이도: ${diff}
OX 문제와 4지선다를 5:5 비율로 섞어서 만드세요.
JSON 배열만 출력:
[{"id":"ai_001","type":"OX","question":"문제","context":"예문","word":"핵심단어","answer":true,"explanation":"해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"literacy"},
{"id":"ai_002","type":"MULTIPLE","question":"문제","context":"예문","word":"핵심단어","answer":0,"choices":["정답","오답1","오답2","오답3"],"explanation":"해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"literacy"}]`,
  },
  proverbs: {
    system: `당신은 초등학생을 위한 한국 속담 퀴즈 전문가입니다. 실생활에서 쓰이는 속담의 뜻과 쓰임을 묻는 퀴즈를 만드세요. 반드시 JSON 배열 형식만 출력하세요.`,
    userTemplate: (diff, xp, coin) => `한국 속담 퀴즈 10개를 만들어 주세요.
난이도: ${diff}
OX 문제와 4지선다를 5:5 비율로 섞어서 만드세요.
속담 예시: 가는 말이 고와야 오는 말이 곱다, 세 살 버릇 여든까지 간다, 빈 수레가 요란하다, 원숭이도 나무에서 떨어진다, 소 잃고 외양간 고친다
JSON 배열만 출력:
[{"id":"ai_p001","type":"OX","question":"속담 문제","context":"상황 예문","word":"속담","answer":true,"explanation":"속담 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"proverbs"},
{"id":"ai_p002","type":"MULTIPLE","question":"속담 문제","context":"상황 예문","word":"속담","answer":0,"choices":["정답","오답1","오답2","오답3"],"explanation":"속담 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"proverbs"}]`,
  },
  idioms: {
    system: `당신은 초등학생을 위한 사자성어 퀴즈 전문가입니다. 사자성어의 뜻, 유래, 쓰임을 묻는 퀴즈를 만드세요. 반드시 JSON 배열 형식만 출력하세요.`,
    userTemplate: (diff, xp, coin) => `사자성어 퀴즈 10개를 만들어 주세요.
난이도: ${diff}
OX 문제와 4지선다를 5:5 비율로 섞어서 만드세요.
사자성어 예시: 일석이조, 대기만성, 사면초가, 오리무중, 이구동성, 청출어람, 우공이산, 형설지공, 주경야독, 낭중지추
JSON 배열만 출력:
[{"id":"ai_i001","type":"OX","question":"사자성어 문제","context":"상황 예문","word":"사자성어","answer":true,"explanation":"사자성어 해설(한자 뜻 포함)","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"idioms"},
{"id":"ai_i002","type":"MULTIPLE","question":"사자성어 문제","context":"상황 예문","word":"사자성어","answer":0,"choices":["정답","오답1","오답2","오답3"],"explanation":"사자성어 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"idioms"}]`,
  },
  history: {
    system: `당신은 초등학생을 위한 한국 역사 퀴즈 전문가입니다. 한국의 역사적 사건, 인물, 문화를 묻는 퀴즈를 만드세요. 반드시 JSON 배열 형식만 출력하세요.`,
    userTemplate: (diff, xp, coin) => `한국 역사 퀴즈 10개를 만들어 주세요.
난이도: ${diff}
OX 문제와 4지선다를 5:5 비율로 섞어서 만드세요.
범위: 단군조선~현대사, 위인(세종대왕, 이순신, 유관순 등), 문화유산(한글, 거북선, 훈민정음 등)
JSON 배열만 출력:
[{"id":"ai_h001","type":"OX","question":"역사 문제","context":"역사적 맥락","word":"핵심 단어/인물","answer":true,"explanation":"역사 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"history"},
{"id":"ai_h002","type":"MULTIPLE","question":"역사 문제","context":"역사적 맥락","word":"핵심 단어/인물","answer":0,"choices":["정답","오답1","오답2","오답3"],"explanation":"역사 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"history"}]`,
  },
  etiquette: {
    system: `당신은 초등학생을 위한 한국 생활예절 퀴즈 전문가입니다. 가정, 학교, 공공장소에서의 바른 예절을 묻는 퀴즈를 만드세요. 반드시 JSON 배열 형식만 출력하세요.`,
    userTemplate: (diff, xp, coin) => `한국 생활예절 퀴즈 10개를 만들어 주세요.
난이도: ${diff}
OX 문제와 4지선다를 5:5 비율로 섞어서 만드세요.
범위: 인사 예절, 식사 예절, 어른에 대한 예절, 공공장소 예절, 전통 예절(절하기, 세배 등)
JSON 배열만 출력:
[{"id":"ai_e001","type":"OX","question":"예절 문제","context":"상황 묘사","word":"핵심 예절","answer":true,"explanation":"예절 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"etiquette"},
{"id":"ai_e002","type":"MULTIPLE","question":"예절 문제","context":"상황 묘사","word":"핵심 예절","answer":0,"choices":["정답","오답1","오답2","오답3"],"explanation":"예절 해설","difficulty":2,"xpReward":${xp},"coinReward":${coin},"category":"etiquette"}]`,
  },
};

/**
 * 특정 카테고리 AI 문제 생성
 */
export async function generateCategoryQuestions(
  category: QuizCategory,
  difficulty: 1 | 2 | 3 = 2,
  count: number = 10
): Promise<QuizQuestion[]> {
  if (!client) return [];

  const diffLabel = difficulty === 1 ? '쉬운(초등 저학년)' : difficulty === 2 ? '보통(초등 중학년)' : '어려운(초등 고학년)';
  const xp   = difficulty === 1 ? 30 : difficulty === 2 ? 50 : 80;
  const coin = difficulty === 1 ? 5  : difficulty === 2 ? 8  : 12;

  const prompts = CATEGORY_PROMPTS[category];

  const callApi = async (questionCount: number) => {
    const userContent = prompts.userTemplate(diffLabel, xp, coin)
      .replace(/퀴즈 10개/g, `퀴즈 ${questionCount}개`);
    const message = await client!.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 5000,           // 3000 → 5000 (잘림 방지)
      system: prompts.system,
      messages: [{ role: 'user', content: userContent }],
    });
    return (message.content[0] as { type: string; text: string }).text?.trim() ?? '';
  };

  try {
    let text = await callApi(count);
    let parsed = parseJsonArray<QuizQuestion>(text);

    // 파싱 실패 시 문제 수를 줄여서 1회 재시도
    if (!parsed || parsed.length === 0) {
      console.warn(`Claude 응답 파싱 실패 (${category}) — 5문제로 재시도`);
      text = await callApi(Math.min(5, count));
      parsed = parseJsonArray<QuizQuestion>(text);
    }

    if (!parsed || parsed.length === 0) return [];

    const ts = Date.now();
    return parsed.map((q, i) => ({
      ...q,
      id: `ai_${category}_${ts}_${i}`,
      category,
    })).slice(0, count);
  } catch (e) {
    console.error(`Claude API 오류 (${category}):`, e);
    return [];
  }
}

// ─── 카테고리별 AI 뱅크 ────────────────────────────────────
const CATEGORY_BANK_KEY = (cat: QuizCategory) => `ai_bank_${cat}`;
const CATEGORY_BANK_META_KEY = (cat: QuizCategory) => `ai_bank_meta_${cat}`;

function loadCategoryBank(category: QuizCategory): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(CATEGORY_BANK_KEY(category));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizQuestion[];
    // 저장된 데이터에 category가 없거나 다른 경우 강제 태깅 (오염 데이터 방지)
    return parsed
      .filter(q => !q.category || q.category === category)
      .map(q => ({ ...q, category }));
  } catch { return []; }
}

function saveCategoryBank(category: QuizCategory, questions: QuizQuestion[]): void {
  const trimmed = questions.slice(-200);
  localStorage.setItem(CATEGORY_BANK_KEY(category), JSON.stringify(trimmed));
}

function loadCategoryMeta(category: QuizCategory): { lastGenDate: string } {
  try {
    const raw = localStorage.getItem(CATEGORY_BANK_META_KEY(category));
    return raw ? JSON.parse(raw) : { lastGenDate: '' };
  } catch { return { lastGenDate: '' }; }
}

function saveCategoryMeta(category: QuizCategory, meta: { lastGenDate: string }): void {
  localStorage.setItem(CATEGORY_BANK_META_KEY(category), JSON.stringify(meta));
}

/**
 * 카테고리별 AI 뱅크 가져오기 (없거나 오래되면 새로 생성)
 */
export async function getOrBuildCategoryBank(category: QuizCategory): Promise<QuizQuestion[]> {
  const bank = loadCategoryBank(category);
  const meta = loadCategoryMeta(category);
  const today = new Date().toISOString().split('T')[0];

  if (meta.lastGenDate === today && bank.length >= 20) {
    return bank;
  }

  if (!client) return bank;

  try {
    const [easy, mid, hard] = await Promise.all([
      generateCategoryQuestions(category, 1, 10),
      generateCategoryQuestions(category, 2, 10),
      generateCategoryQuestions(category, 3, 10),
    ]);
    const newQ = [...easy, ...mid, ...hard];
    const existingWords = new Set(bank.map(q => q.word?.toLowerCase()));
    const unique = newQ.filter(q => !existingWords.has(q.word?.toLowerCase()));
    const updated = [...bank, ...unique];
    saveCategoryBank(category, updated);
    saveCategoryMeta(category, { lastGenDate: today });
    console.info(`${category} AI 뱅크: +${unique.length}개 추가 (총 ${updated.length}개)`);
    return updated;
  } catch (e) {
    console.error(`${category} AI 뱅크 생성 실패:`, e);
    return bank;
  }
}

/** 카테고리별 AI 뱅크에서 문제 가져오기 */
export function getCategoryAIQuestions(category: QuizCategory): QuizQuestion[] {
  return loadCategoryBank(category);
}
