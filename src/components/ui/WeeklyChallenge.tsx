/**
 * 주간 챌린지 카드
 * 이번 주 7일 중 학습한 날을 달력으로 시각화.
 * 매주 월요일 리셋, 5일 달성 시 특별 보상 안내.
 * (기존 studyDays 배열에서 계산 — store 변경 없음)
 */
import { useGameStore } from '../../store/gameStore';

/** 이번 주 월요일 기준 날짜 배열 (YYYY-MM-DD × 7) 반환 */
function getThisWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=일, 1=월 ... 6=토
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7)); // 이번 주 월요일
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function WeeklyChallenge() {
  const { studyDays, loginStreak } = useGameStore();
  const weekDays = getThisWeekDays();
  const today = new Date().toISOString().split('T')[0];

  // 이번 주 학습한 날 수
  const studiedSet = new Set(studyDays);
  const studiedThisWeek = weekDays.filter(d => studiedSet.has(d) || d === today).length;
  const goal = 5; // 주간 목표: 5일
  const pct = Math.min(100, Math.round((studiedThisWeek / goal) * 100));

  // 이번 주 남은 일수
  const todayIdx = weekDays.indexOf(today);
  const remaining = todayIdx >= 0 ? 7 - todayIdx - 1 : 0;

  return (
    <div className="card-joseon p-4 fade-in-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div>
            <p className="font-black text-joseon-dark text-sm">주간 챌린지</p>
            <p className="text-[10px] text-joseon-brown">
              {studiedThisWeek >= goal
                ? '🏆 이번 주 목표 달성!'
                : `${studiedThisWeek}/${goal}일 · ${remaining}일 남음`}
            </p>
          </div>
        </div>
        {/* 스트릭 뱃지 */}
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
                    : isFuture
                    ? 'rgba(139,69,19,0.08)'
                    : 'rgba(139,69,19,0.08)',
                  border: isToday ? '2px solid #922B21' : isStudied && isPast ? '2px solid #1E8449' : '2px solid transparent',
                  boxShadow: isToday ? '0 2px 8px rgba(192,57,43,0.4)' : 'none',
                }}
              >
                {isToday ? '📍' : isStudied && isPast ? '✓' : isPast ? '·' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 진행 바 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: studiedThisWeek >= goal
              ? 'linear-gradient(90deg, #F39C12, #E74C3C)'
              : 'linear-gradient(90deg, #27AE60, #2ECC71)',
          }}
        />
      </div>

      {/* 보상 안내 */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-joseon-brown/70">
          {studiedThisWeek >= goal
            ? '🎁 보상: +200 XP · 엽전 80개 지급!'
            : `목표: ${goal}일 달성 시 +200 XP · 엽전 80개`}
        </p>
        <span className="text-[10px] font-bold" style={{ color: studiedThisWeek >= goal ? '#E74C3C' : '#27AE60' }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
