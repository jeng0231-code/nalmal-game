// 퀴즈 타입
export type QuizType = 'OX' | 'MULTIPLE';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  context?: string;
  word: string;
  answer: boolean | number;
  choices?: string[];
  explanation: string;
  difficulty: 1 | 2 | 3;
  xpReward: number;
  coinReward: number;
  category?: string;
}

// 미니게임 타입
export type MiniGameType = 'TUHO' | 'JEGI' | 'YUT';

// 조선 신분 레벨
export interface JoseonLevel {
  level: number;
  title: string;
  emoji: string;
  hat: string;
  outfit: string;
  description: string;
  minXP: number;
  maxXP: number;
  unlockMessage: string;
}

// 일일 미션
export type MissionType = 'solve_n' | 'correct_streak' | 'earn_coins' | 'play_minigame' | 'complete_stage';

export interface DailyMission {
  id: string;
  type: MissionType;
  title: string;
  emoji: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  reward: { coins: number; xp: number };
}

// 일일 통계
export interface DailyStats {
  date: string;       // YYYY-MM-DD
  solved: number;
  coinsEarned: number;
  minigamesPlayed: number;
  stagesCleared: number;
}

// 플레이어 상태
export interface PlayerState {
  name: string;
  avatarPhoto: string | null;
  level: number;
  xp: number;
  coins: number;
  hearts: number;
  maxHearts: number;
  streak: number;       // 현재 연속 정답
  maxStreak: number;    // 역대 최고 연속 정답
  totalCorrect: number;
  totalWrong: number;
  quizzesCompleted: number;
  minigamesPlayed: number;
}

// 게임 진행 상태
export interface GameState {
  player: PlayerState;
  currentQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  sessionCorrect: number;
  sessionWrong: number;
  isLoading: boolean;
  showReward: boolean;
  showPunishment: boolean;
  showLevelUp: boolean;
  newLevel: JoseonLevel | null;
  lastXpGained: number;
  lastCoinsGained: number;
}
