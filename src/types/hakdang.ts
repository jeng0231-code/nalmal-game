// 5개 학당 카테고리 타입
export type QuizCategory = 'literacy' | 'proverbs' | 'idioms' | 'history' | 'etiquette';

export interface HakdangInfo {
  id: QuizCategory;
  name: string;        // 서당, 격언당, 성어당, 사고당, 예절당
  emoji: string;
  koreanName: string;  // 문해력, 속담, 사자성어, 역사, 생활예절
  description: string;
  color: string;       // Tailwind bg class
  accentColor: string; // Tailwind text class
}

export const HAKDANGS: HakdangInfo[] = [
  { id: 'literacy',  name: '서당',   emoji: '📚', koreanName: '문해력',    description: '한국어 낱말 뜻과 쓰임을 배워요',     color: 'from-amber-100 to-amber-200',   accentColor: 'text-amber-700' },
  { id: 'proverbs',  name: '격언당', emoji: '💬', koreanName: '속담',      description: '선조들의 지혜가 담긴 속담을 배워요', color: 'from-green-100 to-green-200',   accentColor: 'text-green-700' },
  { id: 'idioms',    name: '성어당', emoji: '🖌️', koreanName: '사자성어',  description: '네 글자에 담긴 깊은 뜻을 배워요',   color: 'from-purple-100 to-purple-200', accentColor: 'text-purple-700' },
  { id: 'history',   name: '사고당', emoji: '🏛️', koreanName: '역사',      description: '우리 민족의 역사와 위인을 배워요',   color: 'from-blue-100 to-blue-200',     accentColor: 'text-blue-700' },
  { id: 'etiquette', name: '예절당', emoji: '🙏', koreanName: '생활예절',  description: '바른 예절과 전통 풍습을 배워요',     color: 'from-rose-100 to-rose-200',     accentColor: 'text-rose-700' },
];

// 카테고리 밸런스 통계 타입
export interface CategoryStat {
  played: number;
  correct: number;
  lastPlayed: string; // YYYY-MM-DD
}
export type CategoryStats = Record<QuizCategory, CategoryStat>;

export const DEFAULT_CATEGORY_STATS: CategoryStats = {
  literacy:  { played: 0, correct: 0, lastPlayed: '' },
  proverbs:  { played: 0, correct: 0, lastPlayed: '' },
  idioms:    { played: 0, correct: 0, lastPlayed: '' },
  history:   { played: 0, correct: 0, lastPlayed: '' },
  etiquette: { played: 0, correct: 0, lastPlayed: '' },
};
