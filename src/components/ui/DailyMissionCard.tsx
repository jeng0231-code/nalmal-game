import { useGameStore } from '../../store/gameStore';

export default function DailyMissionCard() {
  const { dailyMissions, claimMission } = useGameStore();

  if (!dailyMissions || dailyMissions.length === 0) return null;

  const allClaimed = dailyMissions.every(m => m.claimed);
  const claimableMissions = dailyMissions.filter(m => m.completed && !m.claimed);
  const completedCount = dailyMissions.filter(m => m.completed).length;

  const handleClaimAll = () => {
    claimableMissions.forEach(m => claimMission(m.id));
  };

  return (
    <div className="card-joseon p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="font-black text-joseon-dark text-sm">오늘의 미션</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* 일괄 수령 버튼 */}
          {claimableMissions.length >= 2 && (
            <button
              onClick={handleClaimAll}
              className="text-[10px] font-bold bg-joseon-gold text-white px-2 py-1 rounded-lg hover:bg-yellow-600 active:scale-95 transition-all"
            >
              모두 받기!
            </button>
          )}
          <div className="flex items-center gap-1">
            {dailyMissions.map((m, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  m.claimed ? 'bg-joseon-gold' :
                  m.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-joseon-brown ml-1">{completedCount}/3</span>
          </div>
        </div>
      </div>

      {/* 미션 목록 */}
      <div className="space-y-2">
        {dailyMissions.map((mission) => {
          const progress = Math.min(mission.current / mission.target, 1);

          return (
            <div
              key={mission.id}
              className={`rounded-xl p-3 border transition-all ${
                mission.claimed
                  ? 'bg-joseon-gold/10 border-joseon-gold/30 opacity-70'
                  : mission.completed
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white/60 border-joseon-brown/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{mission.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold truncate ${
                      mission.claimed ? 'text-joseon-brown line-through' :
                      mission.completed ? 'text-green-700' : 'text-joseon-dark'
                    }`}>
                      {mission.title}
                    </p>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <span className="text-[10px] text-joseon-brown">🪙{mission.reward.coins}</span>
                      <span className="text-[10px] text-joseon-brown">+{mission.reward.xp}XP</span>
                    </div>
                  </div>

                  {/* 진행 바 */}
                  {!mission.claimed && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                        <span>{mission.description}</span>
                        <span>{Math.min(mission.current, mission.target)}/{mission.target}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            mission.completed ? 'bg-green-500' : 'bg-joseon-red'
                          }`}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 수령 버튼 */}
                {mission.completed && !mission.claimed ? (
                  <button
                    onClick={() => claimMission(mission.id)}
                    className="shrink-0 bg-joseon-gold text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-yellow-600 active:scale-95 transition-all"
                  >
                    받기!
                  </button>
                ) : mission.claimed ? (
                  <span className="shrink-0 text-lg">✅</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {allClaimed && (
        <p className="text-center text-xs text-joseon-brown mt-2">
          🎉 오늘 미션을 모두 완료했어요! 내일 또 도전하세요!
        </p>
      )}
    </div>
  );
}
