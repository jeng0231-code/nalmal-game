import { HAKDANGS } from '../../types/hakdang';
import type { CategoryStats, HakdangInfo } from '../../types/hakdang';

export interface Recommendation {
  hakdang: HakdangInfo;
  reason: string;
  goal: string;
  accuracy: number;
}

export const QUESTIONS_PER_STAGE = 10;
export const WEEKLY_STAGE_GOAL = 3;

export function getAccuracy(stat: { played: number; correct: number }): number {
  if (stat.played === 0) return 0;
  return Math.round((stat.correct / stat.played) * 100);
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function getEstimatedStageProgress(played: number) {
  const completedStages = Math.min(WEEKLY_STAGE_GOAL, Math.floor(played / QUESTIONS_PER_STAGE));
  const solvedTowardsNextStage = played % QUESTIONS_PER_STAGE;

  return {
    completedStages,
    solvedTowardsNextStage,
    remainingStages: Math.max(0, WEEKLY_STAGE_GOAL - completedStages),
  };
}

export function getRecommendation(stats: CategoryStats): Recommendation {
  const totalPlayed = HAKDANGS.reduce((sum, h) => sum + stats[h.id].played, 0);

  if (totalPlayed === 0) {
    const hakdang = HAKDANGS[dayOfYear() % HAKDANGS.length];
    return {
      hakdang,
      reason: '아직 학습 기록이 없어요. 오늘은 여기서 시작해볼까요?',
      goal: '첫 10문제에 도전해 오늘의 학습을 시작해요',
      accuracy: 0,
    };
  }

  const untouched = HAKDANGS.filter((h) => stats[h.id].played === 0);
  if (untouched.length > 0) {
    const hakdang = untouched[dayOfYear() % untouched.length];
    return {
      hakdang,
      reason: '아직 한 번도 풀지 않은 학당이에요. 골고루 배워봐요!',
      goal: `${hakdang.koreanName} 10문제에 도전해 새 학당을 열어요`,
      accuracy: 0,
    };
  }

  let weakest = HAKDANGS[0];
  let weakestAcc = getAccuracy(stats[weakest.id]);
  HAKDANGS.forEach((h) => {
    const acc = getAccuracy(stats[h.id]);
    if (acc < weakestAcc) {
      weakestAcc = acc;
      weakest = h;
    }
  });

  return {
    hakdang: weakest,
    reason: `${weakest.koreanName} 정답률이 ${weakestAcc}%로 조금 낮아요. 오늘 복습으로 끌어올려요!`,
    goal: weakestAcc >= 70 ? '정답률 80% 이상을 목표로 도전해요' : '정답률 70% 이상을 목표로 도전해요',
    accuracy: weakestAcc,
  };
}
