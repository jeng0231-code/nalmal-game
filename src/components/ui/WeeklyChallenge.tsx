/**
 * 주간 챌린지 카드
 * 이번 주 7일 중 학습한 날을 달력으로 시각화.
 * 매주 월요일 리셋, 5일 달성 시 실제 보상 지급 (XP +200, 엽전 +80).
 */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

function getThisWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getCurrentWeekKey(): string {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function WeeklyChallenge() {
  const { studyDays, loginStreak, weeklyRewardClaimed, claimedWeeklyReward } = useGameStore();
  const weekDays = getThisWeekDays();
  const today = new Date().toISOString().split('T')[0];
  const weekKey = getCurrentWeekKey();

  const studiedSet = new Set(studyDays);
  const studiedThisWeek = weekDays.filter(d => studiedSet.has(d) || d === today).length;
  const goal = 5;
  const pct = Math.min(100, Math.round((studiedThisWeek / goal) * 100));
  const goalReached = studiedThisWeek >= goal;
  const alreadyClaimed = weeklyRewardClaimed === weekKey;

  const todayIdx = weekDays.indexOf(today);
  const remaining = todayIdx >= 0 ? 7 - todayIdx - 1 : 0;

  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (alreadyClaimed || claimed) return;
    claimedWeeklyReward();
    setClaimed(true);
  };

  return (
    <div className="card-joseon p-4 fade-in-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗓️</span>
          <div>
            <p className="font-black text-joseon-dark text-sm">주간 챌린지</p>
            <p className="text-[10px] text-joseon-brown">
              {goalReached
                ? alreadyClaimed || claimed ? '✅ 이번 주 보상 수령 완료!' : '🏆 목표 달성! 보상을 받으세요'
                : `${studiedThisWeek}/${goal}일 · ${remaining}일 남음`}
            </p>
          </div>
        </div>
        {loginStreak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black text-white"
            style={{ background: loginStreak >= 7 ? 'linear-gradient(135deg, #F39C12, #E74C3C)' : 'linear-gradient(135deg, #E67E22, #F39C12)' }}
          >
            🔥 {loginStreak}일
          </div>
        )}
      </div>

      {/* 7일 달력 */}
      <div className="flex gap-1.5 mb-3">
        {weekDays.map((day, i) => {
          const isToday = day === today;
          const isPast = day < today;
          const isStudied = studiedSet.has(day) || isToday;
          const isFuture = day > today;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-[10px] font-bold ${isToday ? 'text-joseon-red' : 'text-joseon-brown/60'}`}>
                {DAY_LABELS[i]}
              </span>
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center text-sm font-black transition-all"
                style={{
                  background: isToday
                    ? 'linear-gradient(135deg, #C0392B, #E74C3C)'
                    : isStudied && isPast
                    ? 'linear-gradient(135deg, #27AE60, #2ECC71)'
                    : isPast && !isStudied
                    ? '#E0E0E0'
                    : 'rgba(139,69,19,0.08)',
                  border: isToday ? '2px solid #922B21' : isStudied && isPast ? '2px solid #1E8449' : '2px solid transparent',
                  boxShadow: isToday ? '0 2px 8px rgba(192,57,43,0.4)' : 'none',
                }}
              >
                {isToday ? '📍' : isStudied && isPast ? '✓' : isPast ? '·' : isFuture ? '' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 진행 바 */}
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

      {/* 보상 버튼 or 안내 */}
      {goalReached && !alreadyClaimed && !claimed ? (
        <button
          onClick={handleClaim}
          className="w-full py-2.5 rounded-xl font-black text-white text-sm transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F39C12, #E74C3C)', boxShadow: '0 4px 12px rgba(243,156,18,0.4)' }}
        >
          🎁 주간 보상 받기! +200 XP · 🪙 80
        </button>
      ) : claimed || alreadyClaimed ? (
        <div className="text-center py-2 text-sm font-bold text-green-600">
          ✅ +200 XP · 엽전 80개 지급 완료!
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-joseon-brown/70">
            목표: {goal}일 달성 시 +200 XP · 엽전 80개
          </p>
          <span className="text-[10px] font-bold text-joseon-brown/50">{pct}%</span>
        </div>
      )}
    </div>
  );
}
