import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import CharacterDisplay from '../components/character/CharacterDisplay';
import AttendanceModal from '../components/ui/AttendanceModal';
import DailyMissionCard from '../components/ui/DailyMissionCard';
import TodayRecommendation from '../components/ui/TodayRecommendation';
import SeasonalBanner from '../components/ui/SeasonalBanner';
import WeeklyChallenge from '../components/ui/WeeklyChallenge';
import { getLevelByXP } from '../data/levels';
import { getDailyTip } from '../data/dailyTips';
import type { QuizCategory } from '../types/hakdang';

const AvatarCreator = lazy(() => import('../components/character/AvatarCreator'));

function AvatarCreatorFallback() {
  return (
    <div className="p-8 text-center">
      <div className="text-5xl mb-3 animate-float">🎨</div>
      <p className="text-joseon-dark font-bold">아바타 공방을 준비하는 중...</p>
      <p className="text-joseon-brown text-sm mt-2">첫 설정에서만 필요한 도구를 불러옵니다.</p>
    </div>
  );
}

// 퀴즈 풀기 시작 시 랜덤으로 선택할 카테고리 목록
const QUIZ_CATEGORIES: { id: QuizCategory; label: string; emoji: string; color: string }[] = [
  { id: 'literacy',  label: '문해력',   emoji: '📖', color: '#7B68EE' },
  { id: 'proverbs',  label: '속담',     emoji: '💬', color: '#E67E22' },
  { id: 'idioms',    label: '사자성어', emoji: '🏮', color: '#C0392B' },
  { id: 'history',   label: '역사',     emoji: '🏛️', color: '#27AE60' },
  { id: 'etiquette', label: '예절',     emoji: '🎎', color: '#2980B9' },
];

export default function HomePage() {
  const {
    player, initPlayer, setCharacterConfig,
    checkDailyLogin, checkAndRegenHearts,
    showAttendance,
    loginStreak, dailyMissions, lastHeartRegenTime,
    wrongAnswers, streakProtected, dailyBonus, buyStreakProtection,
  } = useGameStore();
  const navigate = useNavigate();

  const [setupStep, setSetupStep] = useState<'name' | 'avatar' | null>(
    player.name ? null : 'name'
  );
  const [inputName, setInputName] = useState('');
  const [tempName, setTempName] = useState('');

  const [now, setNow] = useState(() => Date.now());

  const currentLevel = getLevelByXP(player.xp);
  const dailyTip = getDailyTip();
  const heartsFullyRestored = player.hearts >= player.maxHearts;

  // 🌌 시간대별 하늘 배경
  const hour = new Date().getHours();
  const isDawn    = hour >= 0 && hour < 6;
  const isMorning = hour >= 6 && hour < 10;
  const isDay     = hour >= 10 && hour < 18;
  const isEvening = hour >= 18 && hour < 21;
  const isNight   = hour >= 21;
  const isNightOrDawn = isNight || isDawn;
  const skyGradient = isDawn
    ? 'linear-gradient(to bottom, #090921 0%, #1a1a4e 45%, #2d2b55 70%, #7c3d5b 100%)'
    : isMorning
    ? 'linear-gradient(to bottom, #ffecd2 0%, #fcb69f 35%, #ff9a9e 65%, #87ceeb 100%)'
    : isDay
    ? 'linear-gradient(to bottom, #87CEEB 0%, #b8e4f9 55%, #dff3fd 100%)'
    : isEvening
    ? 'linear-gradient(to bottom, #090921 0%, #7b3f6e 30%, #e8722a 62%, #f4a942 100%)'
    : 'linear-gradient(to bottom, #090921 0%, #1a1a4e 50%, #2d2b55 100%)';
  const completedMissions = dailyMissions.filter(m => m.completed && !m.claimed).length;

  // 하트 회복까지 남은 시간 계산
  const calcRegenTime = useCallback((currentTime: number) => {
    if (heartsFullyRestored) return '';
    const REGEN_MS = 30 * 60 * 1000;
    const baseTime = lastHeartRegenTime || currentTime;
    const elapsed = currentTime - baseTime;
    const nextRegen = REGEN_MS - (elapsed % REGEN_MS);
    const mins = Math.floor(nextRegen / 60000);
    const secs = Math.floor((nextRegen % 60000) / 1000);
    return `${mins}분 ${secs.toString().padStart(2, '0')}초`;
  }, [heartsFullyRestored, lastHeartRegenTime]);
  const regenCountdown = calcRegenTime(now);

  // 매초 카운트다운 갱신
  useEffect(() => {
    if (heartsFullyRestored) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [heartsFullyRestored]);

  // 앱 시작 시: 하트 회복 체크 + 출석 체크
  useEffect(() => {
    if (!player.name) return;
    checkAndRegenHearts();
    checkDailyLogin();
  }, [player.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // 하트 자동 회복 타이머 (1분마다 체크)
  useEffect(() => {
    if (!player.name) return;
    const interval = setInterval(() => {
      checkAndRegenHearts();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [player.name, checkAndRegenHearts]);

  const handleNameSubmit = () => {
    if (!inputName.trim()) return;
    setTempName(inputName.trim());
    setSetupStep('avatar');
  };

  const handleAvatarCreated = (photo: string | null) => {
    initPlayer(tempName, photo);
    setSetupStep(null);
  };

  const handleCharacterCreated = (config: import('../types/character').CharacterConfig) => {
    // AI로 생성된 SVG 캐릭터 적용 (사진 없이)
    initPlayer(tempName, null);
    setCharacterConfig(config);
    setSetupStep(null);
  };

  // ─── 이름 입력 화면 ────────────────────────────────────────
  if (setupStep === 'name') {
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4 animate-float">🏫</div>
          <h1 className="text-3xl font-black text-joseon-dark mb-2">K-학당</h1>
          <p className="text-joseon-brown mb-6 text-sm">
            조선 최고의 선비를 향한 여정을 시작하세요!
          </p>
          <div className="mb-4">
            <label className="block text-joseon-dark font-bold mb-2 text-left">
              이름이 무엇인가요?
            </label>
            <input
              type="text"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              placeholder="이름을 입력하세요"
              maxLength={10}
              className="w-full p-3 border-2 border-joseon-brown rounded-lg text-center text-lg focus:outline-none focus:border-joseon-red"
              autoFocus
            />
          </div>
          <button
            onClick={handleNameSubmit}
            disabled={!inputName.trim()}
            className={`btn-joseon w-full text-lg py-4 ${!inputName.trim() ? 'opacity-50' : ''}`}
          >
            다음 →
          </button>
        </div>
      </div>
    );
  }

  // ─── 아바타 생성 화면 ─────────────────────────────────────
  if (setupStep === 'avatar') {
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon max-w-sm w-full">
          <Suspense fallback={<AvatarCreatorFallback />}>
            <AvatarCreator
              onAvatarCreated={handleAvatarCreated}
              onCharacterCreated={handleCharacterCreated}
              onSkip={() => handleAvatarCreated(null)}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // ─── 메인 홈 화면 ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col page-enter" style={{ background: skyGradient }}>
      {/* 🌌 시간대별 하늘 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {isNightOrDawn && <>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white star-twinkle"
              style={{
                width: `${2 + i % 3}px`, height: `${2 + i % 3}px`,
                top: `${(i * 17 + 5) % 65}%`, left: `${(i * 23 + 7) % 92}%`,
                '--dur': `${1.5 + (i % 3) * 0.7}s`, '--delay': `${(i * 0.2) % 2}s`,
              } as React.CSSProperties}
            />
          ))}
          <div className="absolute moon-glow" style={{ top: '5%', right: '8%', fontSize: 52 }}>🌙</div>
        </>}
        {isDay && <>
          <div className="absolute" style={{ top:'4%', right:'8%', fontSize:44, filter:'drop-shadow(0 0 14px rgba(255,220,0,0.6))' }}>☀️</div>
          <div className="absolute opacity-70" style={{ top:'12%', fontSize:36, animation:'cloudDrift 20s linear -5s infinite' }}>☁️</div>
          <div className="absolute opacity-50" style={{ top:'24%', fontSize:28, animation:'cloudDrift 28s linear -12s infinite' }}>☁️</div>
          <div className="absolute opacity-30" style={{ top:'8%', fontSize:44, animation:'cloudDrift 35s linear -20s infinite' }}>☁️</div>
        </>}
        {isMorning && <>
          <div className="absolute" style={{ top:'6%', right:'12%', fontSize:40 }}>🌅</div>
          <div className="absolute opacity-60" style={{ top:'14%', fontSize:30, animation:'cloudDrift 22s linear -3s infinite' }}>☁️</div>
          <div className="absolute opacity-40" style={{ top:'26%', fontSize:24, animation:'cloudDrift 30s linear -15s infinite' }}>☁️</div>
        </>}
        {isEvening && <>
          <div className="absolute" style={{ top:'5%', right:'10%', fontSize:40 }}>🌇</div>
          <div className="absolute opacity-60" style={{ top:'16%', fontSize:32, filter:'sepia(0.8) saturate(1.5)', animation:'cloudDrift 18s linear -6s infinite' }}>☁️</div>
          <div className="absolute opacity-40" style={{ top:'28%', fontSize:26, filter:'sepia(0.6)', animation:'cloudDrift 25s linear -10s infinite' }}>☁️</div>
        </>}
      </div>

      {/* 컨텐츠 레이어 (하늘 위) */}
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>
      {/* 출석 체크 모달 */}
      {showAttendance && <AttendanceModal />}

      {/* 헤더 */}
      <header className="bg-joseon-dark text-white p-4 text-center relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F39C12 0px, #F39C12 2px, transparent 2px, transparent 8px)' }}
        />
        <div className="relative z-10 flex items-center justify-between max-w-md mx-auto">
          <div className="text-left">
            <h1 className="text-xl font-black">🏫 K-학당</h1>
            <p className="text-joseon-gold text-xs">한국문화를 배우는 조선의 학당</p>
          </div>
          {/* 연속 출석 배지 — 불꽃 애니메이션 */}
          {loginStreak > 0 && (
            <div
              className="rounded-xl px-3 py-1.5 text-right border"
              style={{
                background: loginStreak >= 7
                  ? 'linear-gradient(135deg, rgba(255,80,0,0.25), rgba(255,160,0,0.2))'
                  : loginStreak >= 3
                  ? 'linear-gradient(135deg, rgba(255,140,0,0.2), rgba(255,200,0,0.15))'
                  : 'rgba(243,156,18,0.15)',
                borderColor: loginStreak >= 7 ? 'rgba(255,100,0,0.6)' : 'rgba(243,156,18,0.5)',
              }}
            >
              <div className="flex items-center gap-1 justify-end">
                <span
                  className={loginStreak >= 3 ? 'streak-fire' : ''}
                  style={{ fontSize: loginStreak >= 7 ? 18 : 15 }}
                >
                  {loginStreak >= 7 ? '🔥' : loginStreak >= 3 ? '🔥' : '📅'}
                </span>
                <span className="text-joseon-gold text-xs font-black">{loginStreak}일 연속!</span>
              </div>
              <div className="text-white/60 text-[10px] text-right">
                {loginStreak >= 7 ? '완벽한 출석 🏆' : loginStreak >= 3 ? '스트릭 유지 중 ✨' : '출석 중'}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full overflow-y-auto">

        {/* 캐릭터 카드 — 레벨 링 + XP 바 강화 */}
        <div
          className="card-joseon p-5 text-center relative overflow-hidden"
          style={{
            '--ring-color': currentLevel.level >= 20
              ? '#E74C3C'
              : currentLevel.level >= 10
              ? '#8E44AD'
              : currentLevel.level >= 5
              ? '#F39C12'
              : '#27AE60',
          } as React.CSSProperties}
        >
          {/* 레벨 티어별 배경 글로우 */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none rounded-xl"
            style={{
              background: currentLevel.level >= 20
                ? 'radial-gradient(ellipse, rgba(231,76,60,0.4) 0%, transparent 70%)'
                : currentLevel.level >= 10
                ? 'radial-gradient(ellipse, rgba(142,68,173,0.4) 0%, transparent 70%)'
                : currentLevel.level >= 5
                ? 'radial-gradient(ellipse, rgba(243,156,18,0.4) 0%, transparent 70%)'
                : 'transparent',
            }}
          />

          <div className="relative z-10">
            <CharacterDisplay size="large" showStats={true} />

            {/* 통계 행 */}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-joseon-brown">
              <div className="flex flex-col items-center">
                <span className="font-black text-joseon-dark text-sm">{player.totalCorrect + player.totalWrong}</span>
                <span>📝 총 문제</span>
              </div>
              <div className="w-px h-8 bg-joseon-brown/20" />
              <div className="flex flex-col items-center">
                <span className="font-black text-joseon-dark text-sm">
                  {player.totalCorrect + player.totalWrong > 0
                    ? Math.round(player.totalCorrect / (player.totalCorrect + player.totalWrong) * 100)
                    : 0}%
                </span>
                <span>🎯 정답률</span>
              </div>
              <div className="w-px h-8 bg-joseon-brown/20" />
              <div className="flex flex-col items-center">
                <span className="font-black text-joseon-dark text-sm">{player.maxStreak}</span>
                <span>🔥 최고연속</span>
              </div>
              <div className="w-px h-8 bg-joseon-brown/20" />
              <div className="flex flex-col items-center">
                <span className="font-black text-joseon-dark text-sm">{player.coins}</span>
                <span>🪙 엽전</span>
              </div>
            </div>

            {/* XP 진행 바 */}
            <div className="mt-4">
              {currentLevel.level < 30 ? (() => {
                const pct = Math.min(100,
                  Math.round(((player.xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100)
                );
                return (
                  <>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-black text-joseon-brown">
                        Lv.{currentLevel.level} {currentLevel.title}
                      </span>
                      <span className="text-xs text-joseon-brown/70">
                        {player.xp - currentLevel.minXP} / {currentLevel.maxXP - currentLevel.minXP} XP
                        <span className="ml-1 font-bold text-joseon-red">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-700 relative"
                        style={{
                          width: `${pct}%`,
                          background: currentLevel.level >= 20
                            ? 'linear-gradient(90deg, #C0392B, #E74C3C, #F39C12)'
                            : currentLevel.level >= 10
                            ? 'linear-gradient(90deg, #8E44AD, #9B59B6, #3498DB)'
                            : currentLevel.level >= 5
                            ? 'linear-gradient(90deg, #E67E22, #F39C12, #F1C40F)'
                            : 'linear-gradient(90deg, #27AE60, #2ECC71, #1ABC9C)',
                        }}
                      >
                        {/* 빛나는 하이라이트 */}
                        <div className="absolute inset-0 rounded-full" style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 60%)'
                        }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-joseon-brown/60 text-right mt-1">
                      다음 단계까지 {currentLevel.maxXP - player.xp} XP
                    </p>
                  </>
                );
              })() : (
                <div className="text-center py-1">
                  <span className="text-joseon-gold font-black text-sm">👑 최고 경지 달성!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🗓️ 이달의 시즌 이벤트 */}
        <SeasonalBanner />

        {/* 🎯 오늘의 추천 학습 (최우선 CTA) */}
        <TodayRecommendation />

        {/* 🎲 오늘의 보너스 이벤트 */}
        {dailyBonus.type && (
          <div className={`rounded-xl p-3 border-2 flex items-center gap-3 ${
            dailyBonus.type === 'double_xp' ? 'bg-purple-50 border-purple-300' :
            dailyBonus.type === 'double_coins' ? 'bg-yellow-50 border-yellow-300' :
            'bg-pink-50 border-pink-300'
          }`}>
            <span className="text-3xl">
              {dailyBonus.type === 'double_xp' ? '⚡' :
               dailyBonus.type === 'double_coins' ? '🪙' : '❤️'}
            </span>
            <div>
              <p className={`font-black text-sm ${
                dailyBonus.type === 'double_xp' ? 'text-purple-700' :
                dailyBonus.type === 'double_coins' ? 'text-yellow-700' :
                'text-pink-700'
              }`}>
                🎲 오늘의 보너스!
              </p>
              <p className={`text-xs ${
                dailyBonus.type === 'double_xp' ? 'text-purple-600' :
                dailyBonus.type === 'double_coins' ? 'text-yellow-600' :
                'text-pink-600'
              }`}>
                {dailyBonus.type === 'double_xp' && '오늘 모든 정답에 XP 2배 적용! ✨'}
                {dailyBonus.type === 'double_coins' && '오늘 모든 정답에 코인 2배 적용! 💰'}
                {dailyBonus.type === 'free_heart' && '오늘 첫 로그인 보너스: 하트 +1! 💖'}
              </p>
            </div>
          </div>
        )}

        {/* 하트 회복 안내 (실시간 카운트다운) */}
        {!heartsFullyRestored && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-red-600 text-xs font-bold">
                💔 하트 {player.hearts}/{player.maxHearts}
              </span>
              <span className="text-red-500 text-xs">
                {'❤️'.repeat(player.hearts)}{'🖤'.repeat(player.maxHearts - player.hearts)}
              </span>
            </div>
            {regenCountdown && (
              <p className="text-red-400 text-[11px] mt-1 text-center">
                ⏰ 다음 하트 회복까지 <span className="font-bold text-red-600">{regenCountdown}</span>
              </p>
            )}
          </div>
        )}

        {/* 미션 완료 알림 배지 */}
        {completedMissions > 0 && (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 flex items-center gap-2 animate-bounce-in">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-bold text-green-700 text-sm">미션 보상을 받을 수 있어요!</p>
              <p className="text-green-600 text-xs">완료된 미션 {completedMissions}개 · 아래에서 받기 버튼을 누르세요</p>
            </div>
          </div>
        )}

        {/* 메뉴 버튼 */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              const picked = QUIZ_CATEGORIES[Math.floor(Math.random() * QUIZ_CATEGORIES.length)];
              navigate(`/quiz?category=${picked.id}`);
            }}
            className="btn-joseon text-xl py-6 flex items-center justify-center gap-4"
          >
            <span className="text-4xl">📚</span>
            <div className="text-left">
              <div className="text-xl font-black">퀴즈 풀기</div>
              <div className="text-xs font-normal opacity-80 mt-0.5">
                오늘의 카테고리 랜덤 선택 → 스테이지 클리어!
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/hakdang')}
            className="py-5 rounded-lg font-bold border-2 flex items-center justify-center gap-4 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', borderColor: '#4CAF50' }}
          >
            <span className="text-4xl">🏛️</span>
            <div className="text-left">
              <div className="text-xl font-black text-green-800">학당 허브</div>
              <div className="text-xs font-normal text-green-700 mt-0.5">속담 · 사자성어 · 역사 · 예절 · 문해력</div>
            </div>
          </button>

          {/* 미니게임 버튼 */}
          <button
            onClick={() => navigate('/minigame')}
            className="py-5 rounded-lg font-bold border-2 flex items-center justify-center gap-4 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)', borderColor: '#7E57C2' }}
          >
            <span className="text-4xl">🎮</span>
            <div className="text-left">
              <div className="text-xl font-black text-purple-800">미니게임</div>
              <div className="text-xs font-normal text-purple-600 mt-0.5">
                투호 · 제기 · 활쏘기 · 퍼즐 등 8종!
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-purple-700 font-black text-sm">🪙</div>
              <div className="text-purple-500 text-[10px]">엽전획득</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="py-5 rounded-lg font-bold text-joseon-dark border-2 border-joseon-brown flex items-center justify-center gap-4 transition-all hover:bg-joseon-cream"
            style={{ background: 'linear-gradient(135deg, #FFF8DC, #FFE4B5)' }}
          >
            <span className="text-4xl">👤</span>
            <div className="text-left">
              <div className="text-xl font-black">내 기록</div>
              <div className="text-xs font-normal text-joseon-brown mt-0.5">업적 · 통계 · 성장 여정</div>
            </div>
          </button>
        </div>

        {/* 🛡️ 스트릭 보호 */}
        <div className={`rounded-xl p-3 border-2 flex items-center gap-3 ${
          streakProtected
            ? 'bg-blue-50 border-blue-300'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <span className="text-3xl">{streakProtected ? '🛡️' : '🔓'}</span>
          <div className="flex-1">
            <p className={`font-black text-sm ${streakProtected ? 'text-blue-700' : 'text-gray-600'}`}>
              {streakProtected ? '🛡️ 스트릭 보호 활성화!' : '스트릭 보호'}
            </p>
            <p className={`text-xs ${streakProtected ? 'text-blue-500' : 'text-gray-400'}`}>
              {streakProtected
                ? '오늘 출석을 못해도 연속 기록이 유지돼요'
                : '연속 출석이 끊겨도 스트릭을 지켜줘요'}
            </p>
          </div>
          {!streakProtected && (
            <button
              onClick={() => {
                const ok = buyStreakProtection();
                if (!ok) alert('엽전이 부족해요! (50개 필요)');
              }}
              className="bg-blue-500 text-white text-xs font-black px-3 py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all whitespace-nowrap"
            >
              🪙50 구매
            </button>
          )}
        </div>

        {/* 오답 복습 버튼 */}
        {wrongAnswers.length > 0 && (
          <button
            onClick={() => navigate('/quiz?mode=review')}
            className="py-4 rounded-xl font-bold border-2 border-red-400 flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FFF0F0, #FFE0E0)' }}
          >
            <span className="text-3xl">📝</span>
            <div className="text-left">
              <div className="text-base font-black text-red-700">오답 복습하기</div>
              <div className="text-xs font-normal text-red-500 mt-0.5">
                틀린 문제 {wrongAnswers.length}개 · 다시 도전해보세요!
              </div>
            </div>
          </button>
        )}

        {/* 주간 챌린지 */}
        <WeeklyChallenge />

        {/* 오늘의 미션 */}
        {dailyMissions.length > 0 && <DailyMissionCard />}

        {/* 오늘의 한자 상식 */}
        <div className="card-joseon p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <p className="text-blue-800 font-bold text-sm">오늘의 한자 상식</p>
            <span className="ml-auto bg-blue-200 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {dailyTip.hanja}
            </span>
          </div>
          <p className="text-blue-700 text-xs leading-relaxed">{dailyTip.tip}</p>
        </div>

        {/* 앱 버전 / 하단 여백 */}
        <div className="text-center text-gray-300 text-[10px] pb-2">K-학당 v1.0 · 매일 새로운 문제로 만나요</div>

        <div className="h-4" />
      </div>
      </div>{/* /컨텐츠 레이어 */}
    </div>
  );
}
