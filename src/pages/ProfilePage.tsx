import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getLevelByXP, getXPProgress, JOSEON_LEVELS, getPrestigeTitle, getPrestigeProgress } from '../data/levels';
import { ACHIEVEMENTS } from '../data/achievements';
import CharacterDisplay from '../components/character/CharacterDisplay';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { player, initPlayer, unlockedAchievements, loginStreak, dailyStats, studyDays } = useGameStore();
  const currentLevel = getLevelByXP(player.xp);
  const xpProgress = getXPProgress(player.xp);
  const accuracy = player.totalCorrect + player.totalWrong > 0
    ? Math.round(player.totalCorrect / (player.totalCorrect + player.totalWrong) * 100)
    : 0;

  // 달력 상태
  const [calendarDate, setCalendarDate] = useState(new Date());
  const studyDaySet = new Set(studyDays);

  const handleReset = () => {
    if (confirm('정말로 처음부터 다시 시작하시겠어요? 모든 기록이 사라져요!')) {
      initPlayer('', null);
      navigate('/');
    }
  };

  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className="joseon-bg min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-joseon-dark text-white p-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-joseon-gold text-2xl">←</button>
        <h1 className="text-xl font-black">👤 내 기록</h1>
        {loginStreak > 0 && (
          <div className="ml-auto bg-joseon-gold/20 border border-joseon-gold/50 rounded-lg px-2 py-1">
            <span className="text-joseon-gold text-xs font-bold">📅 {loginStreak}일 연속 출석</span>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col gap-4 overflow-y-auto pb-8">

        {/* 캐릭터 카드 */}
        <div className="card-joseon p-6 text-center">
          <CharacterDisplay size="large" showStats={true} />
          {currentLevel.level < 10 ? (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-joseon-brown mb-1">
                <span>현재 경험치</span>
                <span>{player.xp.toLocaleString()} / {currentLevel.maxXP.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-joseon-red to-joseon-gold rounded-full transition-all"
                  style={{ width: `${xpProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            /* 레벨 10 이후: 프레스티지 진행도 */
            (() => {
              const prestige = getPrestigeTitle(player.xp);
              const prestigeProgress = getPrestigeProgress(player.xp);
              return (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-joseon-brown font-bold">{prestige.badge} {prestige.label}</span>
                    <span className="text-xs text-joseon-brown">{player.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-joseon-gold rounded-full transition-all"
                      style={{ width: `${prestigeProgress}%` }} />
                  </div>
                  {prestigeProgress < 100 && (
                    <p className="text-[10px] text-joseon-brown/60 mt-1 text-center">
                      다음 칭호까지 계속 도전하세요!
                    </p>
                  )}
                </div>
              );
            })()
          )}

          {/* 캐릭터 변경 버튼 */}
          <button
            onClick={() => navigate('/character')}
            className="mt-4 w-full btn-joseon py-2 text-sm flex items-center justify-center gap-2"
          >
            🎨 캐릭터 꾸미기
          </button>
        </div>

        {/* 학습 통계 */}
        <div className="card-joseon p-4">
          <h3 className="font-black text-joseon-dark mb-3 text-center">📊 학습 통계</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '총 정답',     value: player.totalCorrect,   emoji: '✅', color: 'text-green-600' },
              { label: '총 오답',     value: player.totalWrong,     emoji: '❌', color: 'text-red-500'   },
              { label: '정답률',      value: `${accuracy}%`,        emoji: '🎯', color: 'text-blue-600'  },
              { label: '보유 엽전',   value: `${player.coins}`,     emoji: '🪙', color: 'text-joseon-gold' },
              { label: '최대 연속',   value: `${player.maxStreak}연속`, emoji: '🔥', color: 'text-orange-500' },
              { label: '미니게임',    value: `${player.minigamesPlayed}회`, emoji: '🎮', color: 'text-purple-600' },
              { label: '연속 출석',   value: `${loginStreak}일`,    emoji: '📅', color: 'text-blue-500'  },
              { label: '오늘 문제',   value: `${dailyStats.solved}개`, emoji: '📝', color: 'text-green-500' },
              { label: '완료 퀴즈',   value: `${player.quizzesCompleted}회`, emoji: '📚', color: 'text-indigo-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 rounded-xl p-2.5 text-center border border-joseon-brown/20">
                <div className="text-xl">{stat.emoji}</div>
                <div className={`font-black text-base ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 월간 학습 달력 */}
        <div className="card-joseon p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="text-joseon-brown text-2xl px-2 py-1 hover:text-joseon-dark active:scale-95"
            >‹</button>
            <h3 className="font-black text-joseon-dark text-sm text-center">
              📅 {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월 학습 달력
            </h3>
            <button
              onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="text-joseon-brown text-2xl px-2 py-1 hover:text-joseon-dark active:scale-95"
            >›</button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {['일','월','화','수','목','금','토'].map((d, i) => (
              <div key={d} className={`text-center text-[11px] font-bold py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-joseon-brown'
              }`}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          {(() => {
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();
            const firstDow = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const todayStr = new Date().toISOString().split('T')[0];
            const cells: (number | null)[] = [
              ...Array(firstDow).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];
            while (cells.length % 7 !== 0) cells.push(null);
            return (
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isStudied = studyDaySet.has(dateStr);
                  const isToday = dateStr === todayStr;
                  const dow = idx % 7;
                  return (
                    <div key={idx} className="flex items-center justify-center py-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isStudied
                          ? 'bg-joseon-gold text-white shadow-sm'
                          : isToday
                          ? 'bg-joseon-brown/20 text-joseon-dark border-2 border-joseon-brown'
                          : dow === 0
                          ? 'text-red-400'
                          : dow === 6
                          ? 'text-blue-400'
                          : 'text-gray-500'
                      }`}>
                        {isStudied ? '✓' : day}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 범례 */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-joseon-brown">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-joseon-gold inline-block" /> 학습완료
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full border-2 border-joseon-brown inline-block" /> 오늘
            </span>
            <span className="font-bold text-joseon-gold">{studyDays.length}일 학습 🎯</span>
          </div>
        </div>

        {/* 신분 레벨 로드맵 */}
        <div className="card-joseon p-4">
          <h3 className="font-black text-joseon-dark mb-3 text-center">⚔️ 신분 상승 여정</h3>
          <div className="space-y-1.5">
            {JOSEON_LEVELS.map((lvl) => {
              const isUnlocked = currentLevel.level >= lvl.level;
              const isCurrent = currentLevel.level === lvl.level;
              return (
                <div
                  key={lvl.level}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-joseon-gold/20 border-2 border-joseon-gold'
                      : isUnlocked
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-100 opacity-50'
                  }`}
                >
                  <div className="text-xl">{isUnlocked ? lvl.emoji : '🔒'}</div>
                  <div className="flex-1">
                    <div className={`font-bold text-xs ${
                      isCurrent ? 'text-joseon-dark' : isUnlocked ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      Lv.{lvl.level} {lvl.title}
                    </div>
                    <div className="text-[10px] text-gray-400">{lvl.outfit}</div>
                  </div>
                  <div className="text-xs shrink-0">
                    {isCurrent ? (
                      <span className="bg-joseon-gold text-white px-2 py-0.5 rounded-full text-[10px]">현재</span>
                    ) : isUnlocked ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">{lvl.minXP.toLocaleString()} XP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업적 */}
        <div className="card-joseon p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-joseon-dark">🏆 업적</h3>
            <span className="text-xs text-joseon-brown font-bold bg-joseon-gold/20 px-2 py-0.5 rounded-full">
              {unlockedCount} / {totalAchievements}
            </span>
          </div>

          {/* 업적 달성 진행 바 */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-joseon-red to-joseon-gold rounded-full transition-all"
              style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`rounded-xl p-2.5 text-center border transition-all ${
                    isUnlocked
                      ? 'bg-joseon-gold/20 border-joseon-gold'
                      : 'bg-gray-100 border-gray-200 opacity-40'
                  }`}
                >
                  <div className="text-2xl mb-1">{isUnlocked ? ach.emoji : '🔒'}</div>
                  <div className={`text-[11px] font-bold leading-tight ${
                    isUnlocked ? 'text-joseon-dark' : 'text-gray-400'
                  }`}>
                    {ach.title}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{ach.desc}</div>
                  {isUnlocked && ach.reward.coins > 0 && (
                    <div className="text-[9px] text-joseon-gold mt-0.5">🪙{ach.reward.coins}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 초기화 버튼 */}
        <button
          onClick={handleReset}
          className="text-red-400 text-sm underline text-center py-2 hover:text-red-600"
        >
          처음부터 다시 시작하기
        </button>
      </div>
    </div>
  );
}
