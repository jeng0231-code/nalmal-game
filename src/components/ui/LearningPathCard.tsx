import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getCurrentWeekKey, getThisWeekDays } from '../../utils/date';
import {
  getRecommendation,
  QUESTIONS_PER_STAGE,
  WEEKLY_STAGE_GOAL,
} from './todayRecommendationLogic';

export default function LearningPathCard() {
  const navigate = useNavigate();
  const { categoryStats, studyDays, wrongAnswers, weeklyStageProgress } = useGameStore();

  const recommendation = useMemo(() => getRecommendation(categoryStats), [categoryStats]);
  const weekDays = useMemo(() => getThisWeekDays(), []);

  const studiedThisWeek = useMemo(() => {
    const studiedSet = new Set(studyDays);
    return weekDays.filter((day) => studiedSet.has(day)).length;
  }, [studyDays, weekDays]);

  const currentWeekKey = getCurrentWeekKey();
  const completedStages = weeklyStageProgress.weekKey === currentWeekKey
    ? weeklyStageProgress.byCategory[recommendation.hakdang.id]
    : 0;
  const stageProgress = {
    completedStages: Math.min(WEEKLY_STAGE_GOAL, completedStages),
    remainingStages: Math.max(0, WEEKLY_STAGE_GOAL - completedStages),
  };
  const weeklyStagePercent = Math.min(
    100,
    Math.round((completedStages / WEEKLY_STAGE_GOAL) * 100),
  );

  return (
    <div className="card-joseon p-4 bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 border-amber-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-amber-800 font-black text-sm">7일 학습 코스</p>
          <p className="text-joseon-brown text-xs mt-1">
            오늘 학습을 시작하고 이번 주 목표까지 이어가요.
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-white/80 border border-amber-200 text-[11px] font-bold text-amber-700 whitespace-nowrap">
          이번 주 {studiedThisWeek}/5일
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="bg-white/75 rounded-xl border border-amber-100 px-3 py-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 shrink-0 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center">
              1
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-rose-700">오늘의 추천 학습</p>
              <p className="text-sm font-black text-joseon-dark mt-1">
                {recommendation.hakdang.emoji} {recommendation.hakdang.name} · {recommendation.hakdang.koreanName}
              </p>
              <p className="text-xs text-joseon-brown leading-relaxed mt-1">{recommendation.reason}</p>
              <p className="text-xs text-rose-800 font-medium mt-1.5">오늘 목표 · {recommendation.goal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/75 rounded-xl border border-amber-100 px-3 py-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
              2
            </div>
            <div className="min-w-0 w-full">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-amber-700">이번 주 약점 학당 3스테이지</p>
                <span className="text-[11px] font-bold text-amber-700">
                  {stageProgress.completedStages}/{WEEKLY_STAGE_GOAL}
                </span>
              </div>
              <p className="text-xs text-joseon-brown leading-relaxed mt-1">
                {recommendation.hakdang.koreanName}에서 실제 스테이지를 완료할 때마다 기록해
                {WEEKLY_STAGE_GOAL}스테이지를 채워 보세요.
              </p>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden mt-2.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${weeklyStagePercent}%`,
                    background: 'linear-gradient(90deg, #F39C12, #E67E22)',
                  }}
                />
              </div>
              <p className="text-[11px] text-amber-800 mt-1.5">
                {stageProgress.remainingStages > 0
                  ? completedStages > 0
                    ? `이번 주 실제 완료 ${completedStages}스테이지. 앞으로 ${stageProgress.remainingStages}스테이지만 더 채우면 목표 달성이에요.`
                    : `이번 주 아직 완료한 스테이지가 없어요. 먼저 ${QUESTIONS_PER_STAGE}문제로 첫 스테이지를 채워 보세요.`
                  : '이번 주 권장 스테이지 목표를 채웠어요. 다른 학당으로 넓혀 보세요.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/75 rounded-xl border border-amber-100 px-3 py-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 shrink-0 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center">
              3
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-green-700">마무리 복습</p>
              <p className="text-xs text-joseon-brown leading-relaxed mt-1">
                {wrongAnswers.length > 0
                  ? `틀린 문제 ${wrongAnswers.length}개가 남아 있어요. 오늘 배운 내용을 복습하며 기억을 굳혀요.`
                  : '오늘 틀린 문제가 생기면 오답 복습함에서 다시 풀며 학습을 마무리할 수 있어요.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => navigate(`/quiz?category=${recommendation.hakdang.id}`)}
          className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-black rounded-xl py-3 transition-all"
        >
          오늘 학습 시작하기
        </button>
        <button
          onClick={() => navigate(wrongAnswers.length > 0 ? '/quiz?mode=review' : '/hakdang')}
          className="w-full bg-white/90 hover:bg-white text-amber-800 text-sm font-black rounded-xl py-3 border border-amber-200 transition-all active:scale-95"
        >
          {wrongAnswers.length > 0 ? `오답 ${wrongAnswers.length}개 복습` : '학당 허브 둘러보기'}
        </button>
      </div>
    </div>
  );
}
