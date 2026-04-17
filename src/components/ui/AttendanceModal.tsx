import { useGameStore } from '../../store/gameStore';

const CYCLE_REWARDS = [
  { emoji: '🌱', coins: 10,  xp: 50  },
  { emoji: '📖', coins: 15,  xp: 80  },
  { emoji: '🎯', coins: 20,  xp: 120 },
  { emoji: '⭐', coins: 30,  xp: 180 },
  { emoji: '🔥', coins: 40,  xp: 250 },
  { emoji: '💎', coins: 50,  xp: 350 },
  { emoji: '👑', coins: 80,  xp: 500, special: '❤️ 하트 전부 충전!' },
];

export default function AttendanceModal() {
  const { pendingAttendanceReward, claimAttendance } = useGameStore();

  if (!pendingAttendanceReward) return null;

  const { coins, xp, streak, fullHearts } = pendingAttendanceReward;
  const cycleDay = ((streak - 1) % 7) + 1; // 1~7

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-joseon p-6 max-w-sm w-full text-center animate-bounce-in">
        {/* 헤더 */}
        <div className="text-5xl mb-2">📅</div>
        <h2 className="text-2xl font-black text-joseon-dark mb-1">오늘도 오셨군요!</h2>
        <p className="text-joseon-brown text-sm mb-4">
          {streak}일 연속 출석 중이에요!{' '}
          {streak >= 7 && <span className="text-joseon-gold font-bold">🎉 일주일 달성!</span>}
        </p>

        {/* 7일 사이클 캘린더 */}
        <div className="grid grid-cols-7 gap-1 mb-5">
          {CYCLE_REWARDS.map((r, i) => {
            const day = i + 1;
            const isPast = day < cycleDay;
            const isToday = day === cycleDay;
            return (
              <div
                key={day}
                className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 transition-all ${
                  isToday
                    ? 'bg-joseon-gold/30 border-2 border-joseon-gold scale-110'
                    : isPast
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200 opacity-50'
                }`}
              >
                <div className="text-base">{isPast ? '✅' : isToday ? r.emoji : r.emoji}</div>
                <div className="text-[9px] font-bold text-gray-500">{day}일</div>
              </div>
            );
          })}
        </div>

        {/* 오늘 보상 */}
        <div className="bg-joseon-gold/10 border-2 border-joseon-gold rounded-xl p-4 mb-4">
          <p className="text-joseon-brown text-xs mb-2 font-bold">오늘의 출석 보상</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl">🪙</div>
              <div className="font-black text-joseon-dark text-lg">+{coins}</div>
              <div className="text-xs text-joseon-brown">엽전</div>
            </div>
            <div className="text-joseon-brown text-xl">+</div>
            <div className="text-center">
              <div className="text-2xl">⭐</div>
              <div className="font-black text-joseon-dark text-lg">+{xp}</div>
              <div className="text-xs text-joseon-brown">경험치</div>
            </div>
            {fullHearts && (
              <>
                <div className="text-joseon-brown text-xl">+</div>
                <div className="text-center">
                  <div className="text-2xl">❤️</div>
                  <div className="font-black text-joseon-dark text-lg">전부</div>
                  <div className="text-xs text-joseon-brown">하트 충전</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 연속 출석 보너스 안내 */}
        {streak < 7 && (
          <p className="text-joseon-brown text-xs mb-4">
            7일 연속 출석하면 <span className="text-joseon-gold font-bold">👑 특별 보상</span>을 받아요!
          </p>
        )}

        <button
          onClick={claimAttendance}
          className="btn-joseon w-full py-4 text-lg font-black"
        >
          보상 받기! 🎁
        </button>
      </div>
    </div>
  );
}
