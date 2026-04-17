import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, QuizQuestion, DailyMission, DailyStats, MissionType } from '../types';
import { getLevelByXP, JOSEON_LEVELS } from '../data/levels';
import { ACHIEVEMENTS } from '../data/achievements';
import type { CharacterConfig } from '../types/character';
import { DEFAULT_CHARACTER } from '../types/character';

// ─── 출석 보상 (7일 사이클) ────────────────────────────────
const ATTENDANCE_REWARDS = [
  { coins: 10,  xp: 50,  emoji: '🌱', label: '1일차' },
  { coins: 15,  xp: 80,  emoji: '📖', label: '2일차' },
  { coins: 20,  xp: 120, emoji: '🎯', label: '3일차' },
  { coins: 30,  xp: 180, emoji: '⭐', label: '4일차' },
  { coins: 40,  xp: 250, emoji: '🔥', label: '5일차' },
  { coins: 50,  xp: 350, emoji: '💎', label: '6일차' },
  { coins: 80,  xp: 500, emoji: '👑', label: '7일차', fullHearts: true },
] as const;

// ─── 일일 미션 풀 ─────────────────────────────────────────
const MISSION_POOL: Omit<DailyMission, 'current' | 'completed' | 'claimed'>[] = [
  { id: 'solve5',    type: 'solve_n',        title: '5문제 도전',       emoji: '📝', description: '오늘 문제 5개 풀기',       target: 5,  reward: { coins: 15, xp: 60  } },
  { id: 'solve10',   type: 'solve_n',        title: '10문제 도전',      emoji: '📚', description: '오늘 문제 10개 풀기',      target: 10, reward: { coins: 30, xp: 120 } },
  { id: 'streak3',   type: 'correct_streak', title: '3연속 정답',       emoji: '🔥', description: '3개 연속으로 맞히기',      target: 3,  reward: { coins: 20, xp: 80  } },
  { id: 'streak5',   type: 'correct_streak', title: '5연속 정답왕',     emoji: '⭐', description: '5개 연속으로 맞히기',      target: 5,  reward: { coins: 40, xp: 160 } },
  { id: 'coins20',   type: 'earn_coins',     title: '엽전 20개 획득',   emoji: '🪙', description: '오늘 엽전 20개 모으기',   target: 20, reward: { coins: 15, xp: 60  } },
  { id: 'coins50',   type: 'earn_coins',     title: '엽전 50개 획득',   emoji: '💰', description: '오늘 엽전 50개 모으기',   target: 50, reward: { coins: 30, xp: 100 } },
  { id: 'minigame',  type: 'play_minigame',  title: '미니게임 1판',     emoji: '🎮', description: '미니게임 1판 플레이하기', target: 1,  reward: { coins: 30, xp: 120 } },
  { id: 'stage',     type: 'complete_stage', title: '스테이지 클리어',  emoji: '🏆', description: '스테이지 1개 완료하기',   target: 1,  reward: { coins: 50, xp: 200 } },
  { id: 'solve3',    type: 'solve_n',        title: '가볍게 3문제',     emoji: '✏️', description: '오늘 문제 3개 풀기',       target: 3,  reward: { coins: 10, xp: 40  } },
  { id: 'streak7',   type: 'correct_streak', title: '7연속 무결점',     emoji: '🌟', description: '7개 연속으로 맞히기',      target: 7,  reward: { coins: 60, xp: 240 } },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateDailyMissions(dateStr: string, accuracy = 0.5): DailyMission[] {
  const seed = dateStr.split('-').reduce((acc, n) => acc * 100 + parseInt(n, 10), 0);
  const rand = seededRandom(seed);
  // 정답률 50% 미만 초보자: streak5, streak7 미션 제외
  const pool = accuracy < 0.5
    ? MISSION_POOL.filter(m => m.id !== 'streak5' && m.id !== 'streak7')
    : MISSION_POOL;
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, 3).map(m => ({ ...m, current: 0, completed: false, claimed: false }));
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const HEART_REGEN_MS = 30 * 60 * 1000; // 30분마다 하트 1개 회복

// ─── Store 인터페이스 ──────────────────────────────────────
interface GameStore {
  player: PlayerState;
  currentQuestions: QuizQuestion[];
  currentIndex: number;
  sessionCorrect: number;
  sessionWrong: number;
  isLoading: boolean;
  showReward: boolean;
  showPunishment: boolean;
  showLevelUp: boolean;
  newLevelIndex: number;
  lastXpGained: number;
  lastCoinsGained: number;
  incorrectStreak: number;

  // ── 지속가능성 상태 ──
  lastLoginDate: string;
  loginStreak: number;
  lastHeartRegenTime: number;
  dailyMissions: DailyMission[];
  dailyMissionDate: string;
  dailyStats: DailyStats;
  unlockedAchievements: string[];
  showAttendance: boolean;
  pendingAttendanceReward: {
    coins: number; xp: number; streak: number;
    emoji: string; label: string; fullHearts?: boolean;
  } | null;

  streakProtected: boolean;
  dailyBonus: { type: 'double_xp' | 'double_coins' | 'free_heart' | null; date: string };

  // ── 새 기능 상태 ──
  wrongAnswers: QuizQuestion[];
  studyDays: string[];
  seenQuestionIds: string[];  // 최근 본 문제 ID (최대 500개 롤링)

  // ── 기본 액션 ──
  initPlayer: (name: string, photo: string | null) => void;
  setQuestions: (questions: QuizQuestion[]) => void;
  answerCorrect: (xp: number, coins: number) => void;
  answerWrong: () => void;
  nextQuestion: () => void;
  closeReward: () => void;
  closePunishment: () => void;
  closeLevelUp: () => void;
  restoreHeart: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setLoading: (loading: boolean) => void;
  resetSession: () => void;
  addWrongAnswer: (q: QuizQuestion) => void;
  removeWrongAnswer: (id: string) => void;
  clearWrongAnswers: () => void;
  buyStreakProtection: () => boolean;
  markQuestionsSeen: (ids: string[]) => void;

  // ── 지속가능성 액션 ──
  checkDailyLogin: () => void;
  claimAttendance: () => void;
  updateMissionProgress: (type: MissionType, value: number) => void;
  claimMission: (id: string) => void;
  checkAndRegenHearts: () => void;
  checkAchievements: () => void;
  recordMinigamePlayed: () => void;
  recordStageCleared: () => void;

  // ── 회차 시스템 ──
  cycleCount: number;
  incrementCycle: () => void;
  addXP: (amount: number) => void;

  // ── 캐릭터 커스터마이제이션 ──
  characterConfig: CharacterConfig;
  setCharacterConfig: (config: CharacterConfig) => void;
}

const DEFAULT_PLAYER: PlayerState = {
  name: '', avatarPhoto: null,
  level: 1, xp: 0, coins: 0,
  hearts: 5, maxHearts: 5,
  streak: 0, maxStreak: 0,
  totalCorrect: 0, totalWrong: 0,
  quizzesCompleted: 0, minigamesPlayed: 0,
};

const DEFAULT_DAILY_STATS: DailyStats = {
  date: '', solved: 0, coinsEarned: 0, minigamesPlayed: 0, stagesCleared: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: DEFAULT_PLAYER,
      currentQuestions: [],
      currentIndex: 0,
      sessionCorrect: 0,
      sessionWrong: 0,
      isLoading: false,
      showReward: false,
      showPunishment: false,
      showLevelUp: false,
      newLevelIndex: 0,
      lastXpGained: 0,
      lastCoinsGained: 0,
      incorrectStreak: 0,

      // 지속가능성 초기값
      lastLoginDate: '',
      loginStreak: 0,
      lastHeartRegenTime: Date.now(),
      dailyMissions: [],
      dailyMissionDate: '',
      dailyStats: DEFAULT_DAILY_STATS,
      unlockedAchievements: [],
      showAttendance: false,
      pendingAttendanceReward: null,
      streakProtected: false,
      dailyBonus: { type: null, date: '' },
      wrongAnswers: [],
      studyDays: [],
      seenQuestionIds: [],
      cycleCount: 0,
      characterConfig: DEFAULT_CHARACTER,

      // ─────────────────────────────────────────────────────
      // 기본 액션
      // ─────────────────────────────────────────────────────

      initPlayer: (name, photo) => {
        set({
          player: { ...DEFAULT_PLAYER, name, avatarPhoto: photo },
          unlockedAchievements: [],
          loginStreak: 0,
          lastLoginDate: '',
          dailyMissions: [],
          dailyMissionDate: '',
          dailyStats: DEFAULT_DAILY_STATS,
          streakProtected: false,
          dailyBonus: { type: null, date: '' },
          wrongAnswers: [],
          studyDays: [],
          seenQuestionIds: [],
        });
      },

      setQuestions: (questions) => {
        // sessionCorrect/sessionWrong는 리셋하지 않음 → 전 스테이지 누적 통계 유지
        set({ currentQuestions: questions, currentIndex: 0 });
      },

      answerCorrect: (xp, coins) => {
        const { player, dailyStats, dailyBonus } = get();
        const streakBonus = player.streak >= 2 ? 1.5 : 1;
        const today = todayStr();
        const bonusMultiplier = dailyBonus.date === today && dailyBonus.type === 'double_xp' ? 2
          : dailyBonus.date === today && dailyBonus.type === 'double_coins' ? 1 : 1;
        const coinMultiplier = dailyBonus.date === today && dailyBonus.type === 'double_coins' ? 2 : 1;
        const finalXP = Math.round(xp * streakBonus * bonusMultiplier);
        const finalCoins = Math.round(coins * streakBonus * coinMultiplier);

        const oldLevel = getLevelByXP(player.xp);
        const newXP = player.xp + finalXP;
        const newLevel = getLevelByXP(newXP);
        const leveledUp = newLevel.level > oldLevel.level;
        const newStreak = player.streak + 1;
        const newMaxStreak = Math.max(player.maxStreak, newStreak);

        set({
          player: {
            ...player,
            xp: newXP,
            level: newLevel.level,
            coins: player.coins + finalCoins,
            streak: newStreak,
            maxStreak: newMaxStreak,
            totalCorrect: player.totalCorrect + 1,
          },
          sessionCorrect: get().sessionCorrect + 1,
          showReward: true,
          showLevelUp: leveledUp,
          newLevelIndex: leveledUp ? newLevel.level - 1 : get().newLevelIndex,
          lastXpGained: finalXP,
          lastCoinsGained: finalCoins,
          incorrectStreak: 0,
          // 일일 통계 업데이트
          dailyStats: {
            ...dailyStats,
            solved: dailyStats.solved + 1,
            coinsEarned: dailyStats.coinsEarned + finalCoins,
          },
        });

        // 미션 진행 업데이트
        get().updateMissionProgress('solve_n', 1);
        get().updateMissionProgress('earn_coins', finalCoins);
        get().updateMissionProgress('correct_streak', newStreak);

        // 업적 체크
        setTimeout(() => get().checkAchievements(), 0);
      },

      answerWrong: () => {
        const { player, incorrectStreak, dailyStats } = get();
        const newHearts = Math.max(0, player.hearts - 1);

        set({
          player: {
            ...player,
            hearts: newHearts,
            streak: 0,
            totalWrong: player.totalWrong + 1,
          },
          sessionWrong: get().sessionWrong + 1,
          showPunishment: newHearts === 0,
          incorrectStreak: incorrectStreak + 1,
          // 오답도 "오늘 문제" 카운트에 포함
          dailyStats: {
            ...dailyStats,
            solved: dailyStats.solved + 1,
          },
        });

        // 오답도 solve_n 미션 진행도 업데이트 (문제 풀기 = 시도)
        get().updateMissionProgress('solve_n', 1);
      },

      nextQuestion: () => {
        const { currentIndex, currentQuestions } = get();
        if (currentIndex < currentQuestions.length - 1) {
          set({ currentIndex: currentIndex + 1, showReward: false });
        } else {
          const { player } = get();
          set({
            player: { ...player, quizzesCompleted: player.quizzesCompleted + 1 },
            showReward: false,
          });
        }
      },

      closeReward: () => set({ showReward: false }),
      closePunishment: () => set({ showPunishment: false }),
      closeLevelUp: () => set({ showLevelUp: false }),

      restoreHeart: () => {
        const { player } = get();
        set({
          player: { ...player, hearts: Math.min(player.maxHearts, player.hearts + 1) },
          showPunishment: false,
          incorrectStreak: 0,
        });
      },

      addCoins: (amount) => {
        const { player } = get();
        // 코인 음수 방지
        const newCoins = Math.max(0, player.coins + amount);
        set({ player: { ...player, coins: newCoins } });
      },

      spendCoins: (amount) => {
        const { player } = get();
        if (player.coins < amount) return false;
        set({ player: { ...player, coins: player.coins - amount } });
        return true;
      },

      setLoading: (loading) => set({ isLoading: loading }),

      resetSession: () => {
        set({ currentIndex: 0, sessionCorrect: 0, sessionWrong: 0, currentQuestions: [] });
      },

      addWrongAnswer: (q) => {
        const { wrongAnswers } = get();
        if (!wrongAnswers.find(w => w.id === q.id)) {
          set({ wrongAnswers: [...wrongAnswers, q] });
        }
      },

      removeWrongAnswer: (id) => {
        set({ wrongAnswers: get().wrongAnswers.filter(w => w.id !== id) });
      },

      clearWrongAnswers: () => set({ wrongAnswers: [] }),

      markQuestionsSeen: (ids) => {
        const { seenQuestionIds } = get();
        const newSeen = [...new Set([...seenQuestionIds, ...ids])].slice(-500);
        set({ seenQuestionIds: newSeen });
      },

      buyStreakProtection: () => {
        const { player } = get();
        if (player.coins < 50) return false;
        set({
          player: { ...player, coins: player.coins - 50 },
          streakProtected: true,
        });
        return true;
      },

      // ─────────────────────────────────────────────────────
      // 지속가능성 액션
      // ─────────────────────────────────────────────────────

      /** 앱 시작 시 호출 - 출석 체크 */
      checkDailyLogin: () => {
        const { lastLoginDate, loginStreak, dailyMissionDate, streakProtected, dailyBonus } = get();
        const today = todayStr();
        if (lastLoginDate === today) return; // 이미 오늘 체크함

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = lastLoginDate === yesterday;

        // 🛡️ 스트릭 보호: 연속이 끊겼지만 보호 아이템 있으면 유지
        const streakBroken = !isConsecutive && lastLoginDate !== '';
        const useProtection = streakBroken && streakProtected;
        const newStreak = (isConsecutive || useProtection) ? loginStreak + 1 : 1;
        if (useProtection) set({ streakProtected: false }); // 보호 아이템 소모

        // 🎲 오늘의 보너스 (매일 랜덤)
        const bonusTypes = ['double_xp', 'double_coins', 'free_heart', null, null] as const;
        const todayBonus = dailyBonus.date !== today
          ? bonusTypes[Math.floor(Math.abs(Math.sin(today.split('-').reduce((a, b) => a + parseInt(b), 0))) * bonusTypes.length)]
          : dailyBonus.type;
        if (dailyBonus.date !== today) {
          set({ dailyBonus: { type: todayBonus ?? null, date: today } });
        }

        // 7일 사이클 보상
        const cycleDay = ((newStreak - 1) % 7);
        const rewardBase = ATTENDANCE_REWARDS[cycleDay];
        const reward = {
          coins: rewardBase.coins,
          xp: rewardBase.xp,
          emoji: rewardBase.emoji,
          label: rewardBase.label,
          streak: newStreak,
          fullHearts: 'fullHearts' in rewardBase ? rewardBase.fullHearts : false,
        };

        // 오늘의 미션 생성 (날짜가 바뀌었으면)
        const { player: currentPlayer } = get();
        const accuracy = currentPlayer.totalCorrect + currentPlayer.totalWrong > 0
          ? currentPlayer.totalCorrect / (currentPlayer.totalCorrect + currentPlayer.totalWrong)
          : 0.5;
        const newMissions = dailyMissionDate !== today
          ? generateDailyMissions(today, accuracy)
          : get().dailyMissions;

        const prevStudyDays = get().studyDays;
        set({
          lastLoginDate: today,
          loginStreak: newStreak,
          dailyMissions: newMissions,
          dailyMissionDate: today,
          dailyStats: { date: today, solved: 0, coinsEarned: 0, minigamesPlayed: 0, stagesCleared: 0 },
          showAttendance: true,
          pendingAttendanceReward: reward,
          studyDays: prevStudyDays.includes(today) ? prevStudyDays : [...prevStudyDays, today],
        });
      },

      /** 출석 보상 수령 */
      claimAttendance: () => {
        const { player, pendingAttendanceReward } = get();
        if (!pendingAttendanceReward) {
          set({ showAttendance: false });
          return;
        }
        const { coins, xp, fullHearts } = pendingAttendanceReward;
        const newXP = player.xp + xp;
        const newLevel = getLevelByXP(newXP);
        set({
          player: {
            ...player,
            coins: player.coins + coins,
            xp: newXP,
            level: newLevel.level,
            hearts: fullHearts ? player.maxHearts : player.hearts,
          },
          showAttendance: false,
          pendingAttendanceReward: null,
        });
        setTimeout(() => get().checkAchievements(), 0);
      },

      /** 일일 미션 진행도 업데이트 */
      updateMissionProgress: (type, value) => {
        const { dailyMissions, dailyMissionDate } = get();
        const today = todayStr();
        if (dailyMissionDate !== today) return;

        const updated = dailyMissions.map(m => {
          if (m.type !== type || m.claimed) return m;
          // correct_streak는 최댓값만 기록 (연속 끊겨도 최고값 유지)
          const newCurrent = type === 'correct_streak'
            ? Math.max(m.current, value)
            : Math.min(m.target, m.current + value);
          return { ...m, current: newCurrent, completed: newCurrent >= m.target };
        });
        set({ dailyMissions: updated });
      },

      /** 미션 보상 수령 */
      claimMission: (id) => {
        const { player, dailyMissions } = get();
        const mission = dailyMissions.find(m => m.id === id);
        if (!mission || !mission.completed || mission.claimed) return;

        const newXP = player.xp + mission.reward.xp;
        const newLevel = getLevelByXP(newXP);
        set({
          player: {
            ...player,
            coins: player.coins + mission.reward.coins,
            xp: newXP,
            level: newLevel.level,
          },
          dailyMissions: dailyMissions.map(m => m.id === id ? { ...m, claimed: true } : m),
        });
      },

      /** 하트 자동 회복 (30분마다 1개) */
      checkAndRegenHearts: () => {
        const { player, lastHeartRegenTime } = get();
        if (player.hearts >= player.maxHearts) {
          set({ lastHeartRegenTime: Date.now() });
          return;
        }
        const elapsed = Date.now() - lastHeartRegenTime;
        const heartsToRegen = Math.floor(elapsed / HEART_REGEN_MS);
        if (heartsToRegen <= 0) return;

        const newHearts = Math.min(player.maxHearts, player.hearts + heartsToRegen);
        set({
          player: { ...player, hearts: newHearts },
          lastHeartRegenTime: lastHeartRegenTime + heartsToRegen * HEART_REGEN_MS,
        });
      },

      /** 업적 체크 및 신규 잠금해제 */
      checkAchievements: () => {
        const { player, unlockedAchievements, loginStreak } = get();
        const newUnlocks: string[] = [];

        for (const ach of ACHIEVEMENTS) {
          if (unlockedAchievements.includes(ach.id)) continue;
          if (ach.check(player, loginStreak)) {
            newUnlocks.push(ach.id);
          }
        }

        if (newUnlocks.length === 0) return;

        // 업적 보상 합산
        let totalCoins = 0;
        let totalXP = 0;
        for (const id of newUnlocks) {
          const ach = ACHIEVEMENTS.find(a => a.id === id)!;
          totalCoins += ach.reward.coins;
          totalXP += ach.reward.xp;
        }

        const newXP = player.xp + totalXP;
        const newLevel = getLevelByXP(newXP);
        set({
          player: {
            ...player,
            coins: player.coins + totalCoins,
            xp: newXP,
            level: newLevel.level,
          },
          unlockedAchievements: [...unlockedAchievements, ...newUnlocks],
        });
      },

      /** 미니게임 1판 완료 기록 */
      recordMinigamePlayed: () => {
        const { player, dailyStats } = get();
        set({
          player: { ...player, minigamesPlayed: player.minigamesPlayed + 1 },
          dailyStats: { ...dailyStats, minigamesPlayed: dailyStats.minigamesPlayed + 1 },
        });
        get().updateMissionProgress('play_minigame', 1);
        setTimeout(() => get().checkAchievements(), 0);
      },

      /** 스테이지 클리어 기록 */
      recordStageCleared: () => {
        const { dailyStats, player } = get();
        set({
          dailyStats: { ...dailyStats, stagesCleared: dailyStats.stagesCleared + 1 },
          player: { ...player, quizzesCompleted: player.quizzesCompleted + 1 },
        });
        get().updateMissionProgress('complete_stage', 1);
      },

      /** 회차 증가 */
      incrementCycle: () => {
        set(state => ({ cycleCount: state.cycleCount + 1 }));
      },

      /** XP 직접 추가 (모달 없이) */
      addXP: (amount) => {
        const { player } = get();
        const newXP = player.xp + amount;
        const newLevel = getLevelByXP(newXP);
        set({ player: { ...player, xp: newXP, level: newLevel.level } });
      },

      /** 캐릭터 설정 저장 */
      setCharacterConfig: (config) => {
        set({ characterConfig: config });
      },
    }),
    {
      name: 'joseon-literacy-game',
      partialize: (state) => ({
        player: state.player,
        lastLoginDate: state.lastLoginDate,
        loginStreak: state.loginStreak,
        lastHeartRegenTime: state.lastHeartRegenTime,
        dailyMissions: state.dailyMissions,
        dailyMissionDate: state.dailyMissionDate,
        dailyStats: state.dailyStats,
        unlockedAchievements: state.unlockedAchievements,
        streakProtected: state.streakProtected,
        dailyBonus: state.dailyBonus,
        wrongAnswers: state.wrongAnswers,
        studyDays: state.studyDays,
        seenQuestionIds: state.seenQuestionIds,
        cycleCount: state.cycleCount,
        characterConfig: state.characterConfig,
      }),
    }
  )
);

// 레벨별 XP 정보 내보내기 (ProfilePage에서 사용)
export { JOSEON_LEVELS };
