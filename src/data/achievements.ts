import type { PlayerState } from '../types';

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (p: PlayerState, loginStreak: number) => boolean;
  reward: { coins: number; xp: number };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_correct',
    emoji: '👣', title: '첫 걸음',
    desc: '첫 번째 정답!',
    check: (p) => p.totalCorrect >= 1,
    reward: { coins: 10, xp: 30 },
  },
  {
    id: 'correct_10',
    emoji: '📚', title: '공부벌레',
    desc: '10문제 정답',
    check: (p) => p.totalCorrect >= 10,
    reward: { coins: 20, xp: 80 },
  },
  {
    id: 'correct_50',
    emoji: '🎓', title: '선비의 길',
    desc: '50문제 정답',
    check: (p) => p.totalCorrect >= 50,
    reward: { coins: 50, xp: 200 },
  },
  {
    id: 'correct_100',
    emoji: '📜', title: '학문의 달인',
    desc: '100문제 정답',
    check: (p) => p.totalCorrect >= 100,
    reward: { coins: 100, xp: 500 },
  },
  {
    id: 'correct_200',
    emoji: '🏛️', title: '성균관 입학',
    desc: '200문제 정답',
    check: (p) => p.totalCorrect >= 200,
    reward: { coins: 200, xp: 1000 },
  },
  {
    id: 'streak_5',
    emoji: '🔥', title: '연속정답왕',
    desc: '5연속 정답 달성',
    check: (p) => p.maxStreak >= 5,
    reward: { coins: 30, xp: 100 },
  },
  {
    id: 'streak_10',
    emoji: '⚡', title: '번개 선비',
    desc: '10연속 정답 달성',
    check: (p) => p.maxStreak >= 10,
    reward: { coins: 60, xp: 250 },
  },
  {
    id: 'streak_20',
    emoji: '🌟', title: '무결점 선비',
    desc: '20연속 정답 달성',
    check: (p) => p.maxStreak >= 20,
    reward: { coins: 150, xp: 600 },
  },
  {
    id: 'coins_100',
    emoji: '🪙', title: '엽전 수집가',
    desc: '엽전 100개 보유',
    check: (p) => p.coins >= 100,
    reward: { coins: 0, xp: 50 },
  },
  {
    id: 'coins_500',
    emoji: '💰', title: '부자 선비',
    desc: '엽전 500개 보유',
    check: (p) => p.coins >= 500,
    reward: { coins: 0, xp: 200 },
  },
  {
    id: 'minigame_3',
    emoji: '🎮', title: '놀이의 달인',
    desc: '미니게임 3번 플레이',
    check: (p) => p.minigamesPlayed >= 3,
    reward: { coins: 30, xp: 100 },
  },
  {
    id: 'minigame_10',
    emoji: '🎯', title: '전통놀이 고수',
    desc: '미니게임 10번 플레이',
    check: (p) => p.minigamesPlayed >= 10,
    reward: { coins: 80, xp: 300 },
  },
  {
    id: 'level_4',
    emoji: '🏫', title: '서당생',
    desc: '레벨 4 달성',
    check: (p) => p.level >= 4,
    reward: { coins: 40, xp: 0 },
  },
  {
    id: 'level_7',
    emoji: '⚔️', title: '조선의 선비',
    desc: '레벨 7 달성',
    check: (p) => p.level >= 7,
    reward: { coins: 100, xp: 0 },
  },
  {
    id: 'level_10',
    emoji: '👑', title: '조선의 왕',
    desc: '최고 레벨 달성!',
    check: (p) => p.level >= 10,
    reward: { coins: 500, xp: 0 },
  },
  {
    id: 'login_3',
    emoji: '📅', title: '개근상',
    desc: '3일 연속 출석',
    check: (_p, loginStreak) => loginStreak >= 3,
    reward: { coins: 30, xp: 100 },
  },
  {
    id: 'login_7',
    emoji: '🌈', title: '모범생',
    desc: '7일 연속 출석',
    check: (_p, loginStreak) => loginStreak >= 7,
    reward: { coins: 80, xp: 300 },
  },
  {
    id: 'login_30',
    emoji: '🏆', title: '정근상',
    desc: '30일 연속 출석',
    check: (_p, loginStreak) => loginStreak >= 30,
    reward: { coins: 300, xp: 1000 },
  },
  {
    id: 'accuracy_80',
    emoji: '🎯', title: '정확도 마스터',
    desc: '정답률 80% (50문제+)',
    check: (p) => {
      const total = p.totalCorrect + p.totalWrong;
      return total >= 50 && p.totalCorrect / total >= 0.8;
    },
    reward: { coins: 50, xp: 200 },
  },
  {
    id: 'correct_500',
    emoji: '🏅', title: '과거 합격',
    desc: '500문제 정답',
    check: (p) => p.totalCorrect >= 500,
    reward: { coins: 300, xp: 1500 },
  },
  {
    id: 'correct_1000',
    emoji: '🎖️', title: '조선의 학자',
    desc: '1000문제 정답',
    check: (p) => p.totalCorrect >= 1000,
    reward: { coins: 800, xp: 5000 },
  },
  {
    id: 'quiz_10',
    emoji: '🔁', title: '정진하는 선비',
    desc: '퀴즈 10회 완료',
    check: (p) => p.quizzesCompleted >= 10,
    reward: { coins: 150, xp: 600 },
  },
  {
    id: 'minigame_30',
    emoji: '🎪', title: '전통놀이 명인',
    desc: '미니게임 30번 플레이',
    check: (p) => p.minigamesPlayed >= 30,
    reward: { coins: 200, xp: 800 },
  },
  {
    id: 'streak_30',
    emoji: '🌪️', title: '폭풍 선비',
    desc: '30연속 정답 달성',
    check: (p) => p.maxStreak >= 30,
    reward: { coins: 300, xp: 1200 },
  },
  {
    id: 'login_14',
    emoji: '📆', title: '2주 개근',
    desc: '14일 연속 출석',
    check: (_p, loginStreak) => loginStreak >= 14,
    reward: { coins: 150, xp: 600 },
  },
  {
    id: 'coins_2000',
    emoji: '💎', title: '거부 선비',
    desc: '엽전 2000개 보유',
    check: (p) => p.coins >= 2000,
    reward: { coins: 0, xp: 1000 },
  },
];
