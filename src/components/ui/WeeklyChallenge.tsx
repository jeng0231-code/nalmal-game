/**
 * 주간 챌린지 카드
 * 이번 주 7일 중 실제로 학습한 날만 집계하고,
 * 다음에 이어서 할 학습 행동까지 함께 안내한다.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getCurrentWeekKey, getThisWeekDays, getTodayLocalDate } from '../../utils/date';
import { getRecommendation } from './todayRecommendationLogic';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const GOAL_DAYS = 5;

export default function WeeklyChallenge() {
  const navigate = useNavigate();
  const {
    studyDays,
    loginStreak,
    weeklyRewardClaimed,
    claimedWeeklyReward,
    categoryStats,
    wrongAnswers,
  } = useGameStore();

  const weekDays = getThisWeekDays();
  const today = getTodayLocalDate();
  const weekKey = getCurrentWeekKey();
  const recommendation = getRecommendation(categoryStats);

  const studiedSet = new Set(studyDays);
  const studiedThisWeek = weekDays.filter((day) => studiedSet.has(day)).length;
  const pct = Math.min(100, Math.round((studiedThisWeek / GOAL_DAYS) * 100));
  const goalReached = studiedThisWeek >= GOAL_DAYS;
  const alreadyClaimed = weeklyRewardClaimed === weekKey;
  const shouldReviewMistakes = goalReached && wrongAnswers.length > 0;

  const todayIdx = weekDays.indexOf(today);
  const remaining = todayIdx >= 0 ? 7 - todayIdx - 1 : 0;

  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (alreadyClaimed || claimed) return;
    claimedWeeklyReward();
    setClaimed(true);
  };

  const handleContinue = () => {
    if (shouldReviewMistakes) {
      navigate('/quiz?mode=review');
      return;
    }

    if (goalReached) {
      navigate('/hakdang');
      return;
    }

    navigate(`/quiz?category=${recommendation.hakdang.id}`);
  };

  return (
    <div className="card-joseon p-4 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗓️</span>
          <div>
            <p className="font-black text-joseon-dark text-sm">주간 챌린지</p>
            <p className="text-[10px] text-joseon-brown">
              {goalReached
                ? alreadyClaimed || claimed
                  ? '이번 주 보상 수령 완료!'
                  : '주간 목표 달성! 보상을 받아 보세요'
                : `${studiedThisWeek}/${GOAL_DAYS}일 학습 완료 · ${remaining}일 남음`}
            </p>
          </div>
        </div>
        {loginStreak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black text-white"
            style={{
              background:
                loginStreak >= 7
                  ? 'linear-gradient(135deg, #F39C12, #E74C3C)'
                  : 'linear-gradient(135deg, #E67E22, #F39C12)',
            }}
          >
            🔥 {loginStreak}일
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mb-3">
        {weekDays.map((day, i) => {
          const isToday = day === today;
          const isPast = day < today;
          const isStudied = studiedSet.has(day);
          const isFuture = day > today;

          let marker = '';
          if (isToday) marker = isStudied ? '완' : '진';
          else if (isStudied) marker = '완';
          else if (isPast) marker = '쉬';
          else if (isFuture) marker = '';

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span
                className={`text-[10px] font-bold ${
                  isToday ? 'text-joseon-red' : 'text-joseon-brown/60'
                }`}
              >
                {DAY_LABELS[i]}
              </span>
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center text-sm font-black transition-all"
                style={{
                  background: isToday
                    ? 'linear-gradient(135deg, #C0392B, #E74C3C)'
                    : isStudied
                      ? 'linear-gradient(135deg, #27AE60, #2ECC71)'
                      : isPast && !isStudied
                        ? '#E0E0E0'
                        : 'rgba(139,69,19,0.08)',
                  border: isToday
                    ? '2px solid #922B21'
                    : isStudied
                      ? '2px solid #1E8449'
                      : '2px solid transparent',
                  boxShadow: isToday ? '0 2px 8px rgba(192,57,43,0.4)' : 'none',
                  color: isStudied || isToday ? '#fff' : '#7a5c46',
                }}
              >
                {marker}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: goalReached
              ? 'linear-gradient(90deg, #F39C12, #E74C3C)'
              : 'linear-gradient(90deg, #27AE60, #2ECC71)',
          }}
        />
      </div>

      {goalReached && !alreadyClaimed && !claimed ? (
        <button
          onClick={handleClaim}
          className="w-full py-2.5 rounded-xl font-black text-white text-sm transition-all active:scale-95 hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #F39C12, #E74C3C)',
            boxShadow: '0 4px 12px rgba(243,156,18,0.4)',
          }}
        >
          🎁 주간 보상 받기! +200 XP · 동전 80
        </button>
      ) : claimed || alreadyClaimed ? (
        <div className="text-center py-2 text-sm font-bold text-green-600">
          ✅ +200 XP · 동전 80개 지급 완료!
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-joseon-brown/70">
              목표: {GOAL_DAYS}일 달성 시 +200 XP · 동전 80개
            </p>
            <p className="text-[10px] text-amber-700 font-bold mt-1">
              {goalReached
                ? shouldReviewMistakes
                  ? `다음 마무리: 오답 ${wrongAnswers.length}개 복습`
                  : '다음 확장: 다른 학당으로 넓혀 보기'
                : `이번 주 집중 학당: ${recommendation.hakdang.emoji} ${recommendation.hakdang.koreanName}`}
            </p>
          </div>
          <span className="text-[10px] font-bold text-joseon-brown/50 shrink-0">{pct}%</span>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="w-full mt-3 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
      >
        {shouldReviewMistakes
          ? `오답 ${wrongAnswers.length}개 복습하며 이번 주 마무리`
          : goalReached
            ? '다른 학당으로 넓혀 보기'
            : `${recommendation.hakdang.koreanName} 이어서 풀기`}
      </button>
    </div>
  );
}
