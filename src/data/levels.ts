import type { JoseonLevel } from '../types';

export const JOSEON_LEVELS: JoseonLevel[] = [
  { level: 1, title: '노비', emoji: '😔', hat: '', outfit: '허름한 베옷',
    description: '신분의 시작. 열심히 배워서 신분을 높여보자!',
    minXP: 0, maxXP: 250,
    unlockMessage: '🌱 여정을 시작했습니다. 공부하여 신분을 높이세요!' },
  { level: 2, title: '백성', emoji: '🧑‍🌾', hat: '🪖', outfit: '평범한 백의',
    description: '평범한 백성. 더 배워서 더 높은 곳으로!',
    minXP: 250, maxXP: 1200,
    unlockMessage: '🌿 백성이 되었습니다! 이제 글을 배울 수 있어요.' },
  { level: 3, title: '상민', emoji: '🏪', hat: '👒', outfit: '상인의 옷',
    description: '장사를 하는 평민. 지식이 곧 돈이다!',
    minXP: 1200, maxXP: 3000,
    unlockMessage: '🪙 상민이 되었습니다! 엽전을 더 많이 모으세요.' },
  { level: 4, title: '서당생', emoji: '📚', hat: '🎓', outfit: '서당 학생복',
    description: '서당에서 공부하는 학생. 글을 배우는 중!',
    minXP: 3000, maxXP: 6000,
    unlockMessage: '📖 서당생이 되었습니다! 훈장님께 배움을 청하세요.' },
  { level: 5, title: '중인', emoji: '⚕️', hat: '🪖', outfit: '중인 관복',
    description: '기술직 관리. 지식을 실용적으로 쓰는 사람!',
    minXP: 6000, maxXP: 11000,
    unlockMessage: '🔧 중인이 되었습니다! 실용 지식을 쌓고 있어요.' },
  { level: 6, title: '훈장', emoji: '👨‍🏫', hat: '🎩', outfit: '훈장 도포',
    description: '마을 서당의 선생님. 이제 남을 가르칠 수 있다!',
    minXP: 11000, maxXP: 19000,
    unlockMessage: '🏫 훈장이 되었습니다! 아이들에게 지식을 나눠주세요.' },
  { level: 7, title: '선비', emoji: '🎓', hat: '🪭', outfit: '선비 갓과 도포',
    description: '학식 있는 양반. 조선의 지식인!',
    minXP: 19000, maxXP: 33000,
    unlockMessage: '📜 선비가 되었습니다! 학문의 경지에 올랐어요.' },
  { level: 8, title: '관리', emoji: '👨‍💼', hat: '🧢', outfit: '관복과 사모',
    description: '나라를 다스리는 관리. 과거에 급제했다!',
    minXP: 33000, maxXP: 52000,
    unlockMessage: '🏛️ 관리가 되었습니다! 임금님을 모실 수 있어요.' },
  { level: 9, title: '대신', emoji: '👴', hat: '🎩', outfit: '대신 정복',
    description: '최고위 대신. 임금님 곁에서 나라를 이끈다!',
    minXP: 52000, maxXP: 78000,
    unlockMessage: '⚜️ 대신이 되었습니다! 조선을 이끄는 어른이 됐어요.' },
  { level: 10, title: '왕', emoji: '👑', hat: '👑', outfit: '임금의 곤룡포',
    description: '조선의 임금! 최고의 자리에 올랐다!',
    minXP: 78000, maxXP: Infinity,
    unlockMessage: '👑 왕이 되었습니다! 조선의 모든 백성이 우러러봐요!' },
];

export const getLevelByXP = (xp: number): JoseonLevel => {
  for (let i = JOSEON_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= JOSEON_LEVELS[i].minXP) {
      return JOSEON_LEVELS[i];
    }
  }
  return JOSEON_LEVELS[0];
};

export const getXPProgress = (xp: number): number => {
  const level = getLevelByXP(xp);
  if (level.maxXP === Infinity) return 100;
  const progress = ((xp - level.minXP) / (level.maxXP - level.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
};

// 레벨 10 이후 프레스티지 칭호 시스템
export const PRESTIGE_TITLES = [
  { minXP: 78000,  title: '왕',       badge: '👑', label: '조선의 왕' },
  { minXP: 120000, title: '성군',     badge: '🌟', label: '성군의 경지' },
  { minXP: 180000, title: '조선의 빛', badge: '☀️', label: '전설의 경지' },
  { minXP: 280000, title: '역사의 왕', badge: '⚜️', label: '불멸의 경지' },
];

export const getPrestigeTitle = (xp: number) => {
  for (let i = PRESTIGE_TITLES.length - 1; i >= 0; i--) {
    if (xp >= PRESTIGE_TITLES[i].minXP) return PRESTIGE_TITLES[i];
  }
  return PRESTIGE_TITLES[0];
};

export const getPrestigeProgress = (xp: number): number => {
  const current = getPrestigeTitle(xp);
  const idx = PRESTIGE_TITLES.findIndex(p => p.minXP === current.minXP);
  if (idx === PRESTIGE_TITLES.length - 1) return 100;
  const next = PRESTIGE_TITLES[idx + 1];
  return Math.min(100, ((xp - current.minXP) / (next.minXP - current.minXP)) * 100);
};
