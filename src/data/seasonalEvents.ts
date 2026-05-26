/**
 * 월별 시즌 이벤트 데이터
 * 한국 절기·기념일 기반으로 매달 테마와 특별 퀴즈 힌트·장식을 제공한다.
 */

export interface SeasonalEvent {
  month: number;          // 1~12
  name: string;           // 이벤트 이름
  emoji: string;          // 대표 이모지
  theme: string;          // 배경 그라데이션 (CSS)
  accentColor: string;    // 강조 색 (hex)
  borderColor: string;    // 카드 테두리 색
  description: string;    // 한 줄 설명
  tip: string;            // 교육 팁 (퀴즈 전 표시)
  bonusCategory?: string; // 이달 보너스 카테고리 (해당 카테고리 문제 XP +20%)
  badge: string;          // 이달 출석 배지 텍스트
  festivalDays?: number[]; // 특별일 (일, 1-based) — 홈화면에 🎉 표시
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    month: 1,
    name: '설날',
    emoji: '🎍',
    theme: 'linear-gradient(135deg, #1a1a4e 0%, #2d2b55 50%, #7c3d5b 100%)',
    accentColor: '#F39C12',
    borderColor: '#B7770D',
    description: '새해 첫 날, 복을 빌고 어른들께 세배를 드리는 날이에요',
    tip: '설날에는 "복 많이 받으세요!"라고 인사해요. 세배를 하며 덕담을 나눠요 🙏',
    bonusCategory: 'etiquette',
    badge: '🎍 설날 학생',
    festivalDays: [1, 28, 29, 30],
  },
  {
    month: 2,
    name: '입춘',
    emoji: '🌱',
    theme: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
    accentColor: '#2E7D32',
    borderColor: '#388E3C',
    description: '봄이 시작되는 절기, 새 생명이 움트는 계절이에요',
    tip: '입춘(立春)은 "봄이 선다"는 뜻이에요. 24절기 중 첫 번째 절기예요 🌿',
    bonusCategory: 'history',
    badge: '🌱 봄 새싹',
    festivalDays: [4],
  },
  {
    month: 3,
    name: '삼일절',
    emoji: '🇰🇷',
    theme: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 40%, #ffd0d0 100%)',
    accentColor: '#C62828',
    borderColor: '#D32F2F',
    description: '1919년 3월 1일, 독립운동이 전국으로 퍼진 날이에요',
    tip: '태극기를 집에 게양해요! "대한독립만세"를 외친 선열들을 기억해요 🏴',
    bonusCategory: 'history',
    badge: '🇰🇷 독립 선비',
    festivalDays: [1],
  },
  {
    month: 4,
    name: '식목일',
    emoji: '🌳',
    theme: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 50%, #c5e1a5 100%)',
    accentColor: '#33691E',
    borderColor: '#558B2F',
    description: '나무를 심어 초록빛 지구를 만드는 날이에요',
    tip: '나무 한 그루는 1년에 CO₂를 약 22kg 흡수해요. 함께 심어봐요 🌲',
    bonusCategory: 'literacy',
    badge: '🌳 초록 선비',
    festivalDays: [5],
  },
  {
    month: 5,
    name: '어린이날',
    emoji: '🎠',
    theme: 'linear-gradient(135deg, #fff9c4 0%, #fff176 40%, #ffee58 100%)',
    accentColor: '#F57F17',
    borderColor: '#F9A825',
    description: '모든 어린이가 주인공인 특별한 날이에요!',
    tip: '어린이날은 방정환 선생님이 어린이의 소중함을 알리기 위해 만들었어요 🎪',
    bonusCategory: 'proverbs',
    badge: '🎠 어린이 학자',
    festivalDays: [5],
  },
  {
    month: 6,
    name: '단오',
    emoji: '🎋',
    theme: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 40%, #66bb6a 100%)',
    accentColor: '#1B5E20',
    borderColor: '#2E7D32',
    description: '음력 5월 5일 단오! 그네뛰기와 씨름을 즐기는 전통 명절이에요',
    tip: '단오(端午)는 "바른 오(午)"라는 뜻. 창포물에 머리 감고 쑥으로 복을 빌어요 🌿',
    bonusCategory: 'etiquette',
    badge: '🎋 단오 선비',
  },
  {
    month: 7,
    name: '삼복더위',
    emoji: '☀️',
    theme: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)',
    accentColor: '#E65100',
    borderColor: '#EF6C00',
    description: '초복·중복·말복! 더위를 이기는 지혜를 배워요',
    tip: '삼복엔 삼계탕, 냉면으로 더위를 이겨요. "이열치열(以熱治熱)" 뜻을 알아보세요! 🍜',
    bonusCategory: 'idioms',
    badge: '☀️ 삼복 학생',
  },
  {
    month: 8,
    name: '광복절',
    emoji: '🕊️',
    theme: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
    accentColor: '#1565C0',
    borderColor: '#1976D2',
    description: '1945년 8월 15일, 일제강점기로부터 독립한 날이에요',
    tip: '광복(光復)은 "빛을 되찾다"는 뜻이에요. 태극기를 게양하며 선열을 기려요 🇰🇷',
    bonusCategory: 'history',
    badge: '🕊️ 광복 선비',
    festivalDays: [15],
  },
  {
    month: 9,
    name: '추석',
    emoji: '🌕',
    theme: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 50%, #ffe082 100%)',
    accentColor: '#F57F17',
    borderColor: '#F9A825',
    description: '가장 크고 둥근 보름달이 뜨는 한가위! 온 가족이 모여요',
    tip: '추석엔 송편을 빚어요. "더도 말고 덜도 말고 한가위만 같아라"는 속담이 있어요 🎑',
    bonusCategory: 'proverbs',
    badge: '🌕 한가위 학자',
  },
  {
    month: 10,
    name: '한글날',
    emoji: '📜',
    theme: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%)',
    accentColor: '#283593',
    borderColor: '#303F9F',
    description: '1446년 세종대왕이 훈민정음을 반포한 날이에요',
    tip: '한글은 세계에서 가장 과학적인 문자 중 하나로 평가받아요. 자음 14개, 모음 10개! 📚',
    bonusCategory: 'literacy',
    badge: '📜 훈민정음 학자',
    festivalDays: [9],
  },
  {
    month: 11,
    name: '김장철',
    emoji: '🥬',
    theme: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #ce93d8 100%)',
    accentColor: '#6A1B9A',
    borderColor: '#7B1FA2',
    description: '온 가족이 모여 김치를 담그는 대한민국 전통 문화예요',
    tip: '김장은 UNESCO 인류무형문화유산이에요. 이웃과 나누는 정(情)이 담겨 있어요 🫙',
    bonusCategory: 'etiquette',
    badge: '🥬 김장 학생',
  },
  {
    month: 12,
    name: '동지',
    emoji: '❄️',
    theme: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #81d4fa 100%)',
    accentColor: '#01579B',
    borderColor: '#0277BD',
    description: '일 년 중 밤이 가장 긴 날! 팥죽을 먹으며 나쁜 기운을 쫓아요',
    tip: '동지(冬至)는 24절기 중 하나. 팥의 붉은색이 귀신을 쫓는다고 믿었어요 🫙',
    bonusCategory: 'history',
    badge: '❄️ 동지 학자',
  },
];

/** 현재 달의 시즌 이벤트를 반환한다 */
export function getCurrentSeasonalEvent(): SeasonalEvent {
  const month = new Date().getMonth() + 1; // 1~12
  return SEASONAL_EVENTS.find(e => e.month === month) ?? SEASONAL_EVENTS[0];
}

/** 오늘이 특별일인지 확인 */
export function isTodayFestivalDay(event: SeasonalEvent): boolean {
  if (!event.festivalDays) return false;
  const day = new Date().getDate();
  return event.festivalDays.includes(day);
}
