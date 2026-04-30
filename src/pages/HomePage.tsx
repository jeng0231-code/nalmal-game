import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import CharacterDisplay from '../components/character/CharacterDisplay';
import AvatarCreator from '../components/character/AvatarCreator';
import AttendanceModal from '../components/ui/AttendanceModal';
import DailyMissionCard from '../components/ui/DailyMissionCard';
import { getLevelByXP } from '../data/levels';
import { getDailyTip } from '../data/dailyTips';
import type { QuizCategory } from '../types/hakdang';

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
    player, initPlayer,
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

  // ── 하트 회복 카운트다운 (early return 전에 선언 — Rules of Hooks) ──
  const [regenCountdown, setRegenCountdown] = useState('');

  const currentLevel = getLevelByXP(player.xp);
  const dailyTip = getDailyTip();
  const heartsFullyRestored = player.hearts >= player.maxHearts;
  const completedMissions = dailyMissions.filter(m => m.completed && !m.claimed).length;

  // 하트 회복까지 남은 시간 계산
  const calcRegenTime = useCallback(() => {
    if (heartsFullyRestored) return '';
    const REGEN_MS = 30 * 60 * 1000;
    const elapsed = Date.now() - (lastHeartRegenTime || Date.now());
    const nextRegen = REGEN_MS - (elapsed % REGEN_MS);
    const mins = Math.floor(nextRegen / 60000);
    const secs = Math.floor((nextRegen % 60000) / 1000);
    return `${mins}분 ${secs.toString().padStart(2, '0')}초`;
  }, [heartsFullyRestored, lastHeartRegenTime]);

  // 매초 카운트다운 갱신
  useEffect(() => {
    if (heartsFullyRestored) { setRegenCountdown(''); return; }
    setRegenCountdown(calcRegenTime());
    const t = setInterval(() => setRegenCountdown(calcRegenTime()), 1000);
    return () => clearInterval(t);
  }, [heartsFullyRestored, calcRegenTime]);

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
          <AvatarCreator
            onAvatarCreated={handleAvatarCreated}
            onSkip={() => handleAvatarCreated(null)}
          />
        </div>
      </div>
    );
  }

  // ─── 메인 홈 화면 ─────────────────────────────────────────
  return (
    <div className="joseon-bg min-h-screen flex flex-col">
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
          {/* 연속 출석 배지 */}
          {loginStreak > 0 && (
            <div className="bg-joseon-gold/20 border border-joseon-gold/50 rounded-xl px-3 py-1.5 text-right">
              <div className="text-joseon-gold text-xs font-bold">📅 {loginStreak}일 연속</div>
              <div className="text-white/70 text-[10px]">출석 중!</div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full overflow-y-auto">

        {/* 캐릭터 카드 */}
        <div className="card-joseon p-5 text-center">
          <CharacterDisplay size="large" showStats={true} />
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-joseon-brown">
            <span>📝 {player.totalCorrect + player.totalWrong}문제</span>
            <span>•</span>
            <span>🎯 정답률 {player.totalCorrect + player.totalWrong > 0
              ? Math.round(player.totalCorrect / (player.totalCorrect + player.totalWrong) * 100)
              : 0}%</span>
            <span>•</span>
            <span>🔥 최고 {player.maxStreak}연속</span>
          </div>
        </div>

        {/* 신분 & 다음 목표 */}
        <div className="card-joseon p-4 bg-gradient-to-r from-joseon-gold/10 to-joseon-red/10">
          <p className="text-joseon-brown text-sm text-center">{currentLevel.description}</p>
          {currentLevel.level < 10 ? (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-joseon-brown mb-1">
                <span>Lv.{currentLevel.level} {currentLevel.title}</span>
                <span>다음 신분까지 {currentLevel.maxXP - player.xp} XP</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-joseon-red to-joseon-gold rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((player.xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100)}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-joseon-gold font-bold text-sm mt-1">👑 최고 신분 달성!</p>
          )}
        </div>

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
              <div className="text-xs font-normal text-joseon-brown mt-0.5">업적 · 통계 · 신분 여정</div>
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
    </div>
  );
}
