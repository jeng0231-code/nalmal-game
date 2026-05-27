import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getLevelByXP } from '../data/levels';
import type { QuizCategory, CategoryStats } from '../types/hakdang';
import { HAKDANGS } from '../types/hakdang';
import { getCurrentWeekKey } from '../utils/date';
import { getRecommendation, WEEKLY_STAGE_GOAL } from '../components/ui/todayRecommendationLogic';

// ─── 유틸 ─────────────────────────────────────────────────────
function getAccuracyRate(stat: { played: number; correct: number }): number {
  if (stat.played === 0) return 0;
  return Math.round((stat.correct / stat.played) * 100);
}

function getLeastPlayed(stats: CategoryStats): QuizCategory {
  let min = Infinity;
  let result: QuizCategory = 'literacy';
  (Object.keys(stats) as QuizCategory[]).forEach((cat) => {
    if (stats[cat].played < min) {
      min = stats[cat].played;
      result = cat;
    }
  });
  return result;
}

function getMostPlayed(stats: CategoryStats): QuizCategory | null {
  let max = 0;
  let result: QuizCategory | null = null;
  (Object.keys(stats) as QuizCategory[]).forEach((cat) => {
    if (stats[cat].played > max) {
      max = stats[cat].played;
      result = cat;
    }
  });
  return max > 0 ? result : null;
}

// ─── 밸런스 바 차트 ───────────────────────────────────────────
function BalanceMeter({ stats }: { stats: CategoryStats }) {
  const maxPlayed = Math.max(...HAKDANGS.map((h) => stats[h.id].played), 1);
  const leastPlayed = getLeastPlayed(stats);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚖️</span>
        <p className="text-amber-800 font-semibold text-sm">
          균형 잡힌 학습이 진정한 선비의 길!
        </p>
      </div>
      <div className="space-y-2">
        {HAKDANGS.map((h) => {
          const played = stats[h.id].played;
          const pct = Math.round((played / maxPlayed) * 100);
          const isLeast = h.id === leastPlayed;
          return (
            <div key={h.id} className="flex items-center gap-2">
              <span className="text-xs w-12 text-right text-amber-700 font-medium shrink-0">
                {h.name}
              </span>
              <div className="flex-1 bg-amber-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    isLeast ? 'bg-rose-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="text-xs w-8 text-amber-600 shrink-0">{played}회</span>
              {isLeast && played === 0 && (
                <span className="text-xs bg-rose-100 text-rose-600 border border-rose-300 rounded-full px-2 py-0.5 shrink-0">
                  시작 전
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 학당 카드 ────────────────────────────────────────────────
interface HakdangCardProps {
  id: QuizCategory;
  name: string;
  emoji: string;
  koreanName: string;
  description: string;
  color: string;
  accentColor: string;
  played: number;
  correct: number;
  isRecommended: boolean;
  isMostPlayed: boolean;
  onClick: () => void;
}

function HakdangCard({
  name, emoji, koreanName, description, color, accentColor,
  played, correct, isRecommended, isMostPlayed, onClick,
}: HakdangCardProps) {
  const accuracy = getAccuracyRate({ played, correct });

  return (
    <button
      onClick={onClick}
      className={`relative text-left w-full bg-gradient-to-br ${color} border-2 ${
        isRecommended ? 'border-rose-400 shadow-rose-200 shadow-lg' : 'border-amber-200 hover:border-amber-400'
      } rounded-2xl p-4 transition-all duration-200 active:scale-95 hover:scale-[1.02] hover:shadow-md`}
    >
      {/* 뱃지 */}
      {isRecommended && (
        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
          추천 ⭐
        </span>
      )}
      {isMostPlayed && !isRecommended && (
        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
          즐겨찾기 🔥
        </span>
      )}

      {/* 이모지 + 이름 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className={`font-bold text-sm ${accentColor}`}>{name}</p>
          <p className="text-xs text-gray-500">{koreanName}</p>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{description}</p>

      {/* 통계 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {played > 0 ? `${played}회 플레이` : '아직 미시작'}
        </span>
        {played > 0 && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              accuracy >= 70
                ? 'bg-green-100 text-green-700'
                : accuracy >= 50
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            정답률 {accuracy}%
          </span>
        )}
        {played === 0 && (
          <span className="text-xs bg-white/70 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
            도전해보세요!
          </span>
        )}
      </div>
    </button>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────
export default function HakdangHubPage() {
  const navigate = useNavigate();

  const { player, categoryStats, wrongAnswers, weeklyStageProgress } = useGameStore();

  const currentLevel = getLevelByXP(player.xp);
  const leastPlayed = useMemo(() => getLeastPlayed(categoryStats), [categoryStats]);
  const mostPlayed = useMemo(() => getMostPlayed(categoryStats), [categoryStats]);
  const recommendation = useMemo(() => getRecommendation(categoryStats), [categoryStats]);

  // 특정 카테고리 편중 감지 (가장 많이 한 게 전체의 60% 이상)
  const totalPlayed = useMemo(
    () => HAKDANGS.reduce((sum, h) => sum + categoryStats[h.id].played, 0),
    [categoryStats]
  );
  const isImbalanced = useMemo(() => {
    if (!mostPlayed || totalPlayed < 10) return false;
    return categoryStats[mostPlayed].played / totalPlayed >= 0.6;
  }, [categoryStats, mostPlayed, totalPlayed]);

  const currentWeekKey = getCurrentWeekKey();
  const focusedStages = weeklyStageProgress.weekKey === currentWeekKey
    ? weeklyStageProgress.byCategory[recommendation.hakdang.id]
    : 0;
  const weeklyGoalReached = focusedStages >= WEEKLY_STAGE_GOAL;
  const remainingStages = Math.max(0, WEEKLY_STAGE_GOAL - focusedStages);

  const handleCategoryClick = (category: QuizCategory) => {
    navigate(`/quiz?category=${category}`);
  };

  const handleRandomAll = () => {
    navigate('/quiz?category=random');
  };

  const handleRecommendedAction = () => {
    if (weeklyGoalReached && wrongAnswers.length > 0) {
      navigate('/quiz?mode=review');
      return;
    }

    if (weeklyGoalReached) {
      navigate('/quiz?category=random');
      return;
    }

    navigate(`/quiz?category=${recommendation.hakdang.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 bg-amber-800/95 backdrop-blur-sm text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-700 transition-colors"
          aria-label="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xl">🏫</span>
        <h1 className="text-lg font-bold tracking-tight flex-1">K-학당</h1>

        {/* 플레이어 간단 정보 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-amber-700/60 rounded-full px-2 py-0.5 text-xs">
            {currentLevel.emoji} Lv.{player.level}
          </span>
          <span className="bg-amber-700/60 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
            🪙 {player.coins.toLocaleString()}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5">
        {/* ── 타이틀 섹션 ── */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-amber-900 mb-1">학당을 선택하세요</h2>
          <p className="text-sm text-amber-700">어느 학당에서 공부할까요?</p>
        </div>

        {/* ── 플레이어 XP 바 ── */}
        <div className="bg-white/70 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <div className="text-2xl">{currentLevel.emoji}</div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-semibold text-amber-900">{currentLevel.title}</span>
              <span className="text-xs text-amber-600">
                {player.xp.toLocaleString()} / {currentLevel.maxXP.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((player.xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 밸런스 미터 ── */}
        <BalanceMeter stats={categoryStats} />

        {/* ── 편중 경고 ── */}
        {isImbalanced && mostPlayed && (
          <div className="bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">다른 학당도 도전해보세요!</p>
              <p className="text-xs text-orange-600 mt-0.5">
                균형 학습 보너스 +50 XP — {HAKDANGS.find(h => h.id === leastPlayed)?.name}에서 기다리고 있어요!
              </p>
            </div>
          </div>
        )}

        {/* ── 오늘의 추천 ── */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl px-4 py-4 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">오늘의 추천</p>
              <p className="font-bold text-rose-900 text-sm mt-2">
                {recommendation.hakdang.emoji} {recommendation.hakdang.name} — {recommendation.hakdang.koreanName}
              </p>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{recommendation.reason}</p>
            </div>
            <div className="shrink-0 rounded-full border border-rose-200 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              {Math.min(focusedStages, WEEKLY_STAGE_GOAL)}/{WEEKLY_STAGE_GOAL} 단계
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-white/80 px-3 py-3">
            <p className="text-[11px] font-black text-rose-700">지금 할 일</p>
            <p className="text-sm font-black text-amber-900 mt-1">
              {weeklyGoalReached
                ? wrongAnswers.length > 0
                  ? `오답 ${wrongAnswers.length}개 복습하며 이번 주 마무리`
                  : '이번 주 목표 완료, 다른 학당으로 넓혀 보기'
                : `${recommendation.hakdang.koreanName}에서 이번 주 ${WEEKLY_STAGE_GOAL}스테이지 채우기`}
            </p>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {weeklyGoalReached
                ? wrongAnswers.length > 0
                  ? '추천 학습은 충분히 진행했어요. 틀린 문제를 다시 풀며 배운 내용을 굳혀 보세요.'
                  : '추천 학습 목표를 채웠어요. 이제 다른 학당으로 넓혀 보며 학습 균형을 맞춰요.'
                : focusedStages > 0
                  ? `이번 주 실제 완료 ${focusedStages}스테이지. 앞으로 ${remainingStages}스테이지만 더 채우면 권장 목표예요.`
                  : recommendation.goal}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <button
              onClick={handleRecommendedAction}
              className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-bold rounded-xl px-3 py-3 transition-all"
            >
              {weeklyGoalReached
                ? wrongAnswers.length > 0
                  ? `오답 ${wrongAnswers.length}개 복습`
                  : '다른 학당 이어서 보기'
                : `${recommendation.hakdang.koreanName} 바로 시작`}
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-rose-200 bg-white/90 px-3 py-3 text-sm font-bold text-rose-800 transition-all hover:bg-white active:scale-95"
            >
              홈 학습 흐름으로 돌아가기
            </button>
          </div>
        </div>

        {/* ── 학당 카드 그리드 ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {HAKDANGS.map((h) => (
            <HakdangCard
              key={h.id}
              id={h.id}
              name={h.name}
              emoji={h.emoji}
              koreanName={h.koreanName}
              description={h.description}
              color={h.color}
              accentColor={h.accentColor}
              played={categoryStats[h.id].played}
              correct={categoryStats[h.id].correct}
              isRecommended={h.id === recommendation.hakdang.id}
              isMostPlayed={h.id === mostPlayed}
              onClick={() => handleCategoryClick(h.id)}
            />
          ))}
        </div>

        {/* ── 전체 랜덤 버튼 ── */}
        <button
          onClick={handleRandomAll}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-bold rounded-2xl py-4 text-base shadow-md transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-xl">🎲</span>
          전체 랜덤 퀴즈
          <span className="text-xs font-normal opacity-80">모든 학당 섞기</span>
        </button>

        <p className="text-center text-xs text-amber-500 mt-4 pb-6">
          🏮 학당별 10문제 · 미니게임 포함 · 스테이지 클리어 방식
        </p>
      </main>
    </div>
  );
}
