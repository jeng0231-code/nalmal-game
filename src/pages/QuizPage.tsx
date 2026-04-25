import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { INITIAL_QUIZ_DATA } from '../data/quizData';
import { PROVERBS_QUESTIONS } from '../data/proverbsData';
import { IDIOMS_QUESTIONS } from '../data/idiomsData';
import { HISTORY_QUESTIONS } from '../data/historyData';
import { ETIQUETTE_QUESTIONS } from '../data/etiquetteData';
import { getOrBuildAIBank, getOrBuildCategoryBank, getCategoryAIQuestions } from '../services/claudeApi';
import GateQuizPage from './GateQuizPage';
import type { QuizCategory } from '../types/hakdang';
import { HAKDANGS } from '../types/hakdang';
import OXQuiz from '../components/quiz/OXQuiz';
import MultipleChoiceQuiz from '../components/quiz/MultipleChoiceQuiz';
import RewardModal from '../components/ui/RewardModal';
import PunishmentModal from '../components/ui/PunishmentModal';
import LevelUpModal from '../components/ui/LevelUpModal';
import CharacterDisplay from '../components/character/CharacterDisplay';
import TuhoGame from '../components/minigames/TuhoGame';
import JegiGame from '../components/minigames/JegiGame';
import MemoryGame from '../components/minigames/MemoryGame';
import WordPuzzleGame from '../components/minigames/WordPuzzleGame';
import ArcheryGame from '../components/minigames/ArcheryGame';
import SpotDifferenceGame from '../components/minigames/SpotDifferenceGame';
import SlidingPuzzleGame from '../components/minigames/SlidingPuzzleGame';
import type { QuizQuestion } from '../types';

// 스테이지당 문제 수
const QUESTIONS_PER_STAGE = 10;

// 각 스테이지 설정
const STAGE_CONFIG = [
  { stage: 1, difficulty: 1 as const, label: '초급', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', emoji: '🌱' },
  { stage: 2, difficulty: 2 as const, label: '중급', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300', emoji: '📖' },
  { stage: 3, difficulty: 3 as const, label: '고급', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', emoji: '🔥' },
  { stage: 4, difficulty: 3 as const, label: '도전', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', emoji: '👑' },
];

const MINIGAMES = ['TUHO', 'JEGI', 'MEMORY', 'WORDPUZZLE', 'ARCHERY', 'SPOTDIFF', 'PUZZLE'] as const;
type MiniGameId = typeof MINIGAMES[number];

type Phase =
  | 'loading'
  | 'stage-intro'     // 스테이지 시작 안내
  | 'quiz'            // 퀴즈 진행
  | 'minigame-intro'  // 미니게임 안내
  | 'minigame'        // 미니게임 플레이
  | 'stage-clear'     // 스테이지 클리어
  | 'cycle-clear'     // 회차 완주 화면
  | 'finished';       // 전체 완료

// ─── 🎊 Confetti 파티클 컴포넌트 ─────────────────────────
function ConfettiEffect({ active }: { active: boolean }) {
  if (!active) return null;
  const COLORS = ['#F39C12', '#C0392B', '#7B68EE', '#27AE60', '#FF69B4', '#00CED1'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const color = COLORS[i % COLORS.length];
        const left = (i * 37 + 13) % 100;
        const delay = (i * 0.07) % 1.2;
        const size = 6 + (i % 5) * 2;
        const duration = 1.2 + (i % 4) * 0.3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px',
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(${Math.floor(Math.random()*720 + 360)}deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const {
    player, currentQuestions, currentIndex,
    setQuestions, answerCorrect, answerWrong, nextQuestion,
    showReward, showPunishment, showLevelUp,
    sessionCorrect, sessionWrong, setLoading, addCoins, restoreHeart,
    recordMinigamePlayed, recordStageCleared, resetSession, spendCoins,
    unlockedAchievements, wrongAnswers, addWrongAnswer, removeWrongAnswer,
    seenQuestionIds, markQuestionsSeen,
    cycleCount, incrementCycle, addXP, updateCategoryStats,
  } = useGameStore();

  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('mode') === 'review';
  const categoryParam = searchParams.get('category');
  const selectedCategory = (categoryParam && categoryParam !== 'random') ? categoryParam as QuizCategory : null;

  const [phase, setPhase] = useState<Phase>('loading');
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [currentMinigame, setCurrentMinigame] = useState<MiniGameId>('TUHO');
  const [stageClearCorrect, setStageClearCorrect] = useState(0);
  const [lastExplanation, setLastExplanation] = useState('');   // 정답 해설 전달용
  const [heartShake, setHeartShake] = useState(false);          // 하트 감소 애니메이션
  const [loadError, setLoadError] = useState(false);            // 로딩 에러 상태

  // 타이머
  const TIMER_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🎊 Confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🚪 관문 시험
  const [showGateQuiz, setShowGateQuiz] = useState(false);
  const [pendingNextStage, setPendingNextStage] = useState(false);

  // ⚡ 스피드 라운드 (매 5번째 문제)
  const isSpeedRound = phase === 'quiz' && stageIndex % 5 === 4;
  const speedRoundDuration = 10;
  const effectiveTimerDuration = isSpeedRound ? speedRoundDuration : TIMER_DURATION;

  // wrongAnswers ref (loadQuestions가 wrongAnswers 변경 시 재실행되지 않도록)
  const wrongAnswersRef = useRef(wrongAnswers);
  wrongAnswersRef.current = wrongAnswers;

  // 세션 시작 시점 XP/코인 기록 (완료 화면 통계용)
  const sessionStartXP = useRef(player.xp);
  const sessionStartCoins = useRef(player.coins);

  // ─── 문제 로딩 ───────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    resetSession(); // 세션 통계 초기화
    setLoadError(false);

    // 오답 복습 모드: wrongAnswers를 직접 사용
    if (isReviewMode) {
      const currentWrong = wrongAnswersRef.current;
      if (currentWrong.length === 0) {
        setPhase('finished');
        return;
      }
      const shuffled = [...currentWrong].sort(() => Math.random() - 0.5);
      setAllQuestions(shuffled);
      setQuestions(shuffled);
      setStageIndex(0);
      setStageClearCorrect(0);
      setPhase('quiz');
      return;
    }

    setLoading(true);
    try {
      let questions: QuizQuestion[];

      if (selectedCategory) {
        // 카테고리별 데이터 로드 — 선택한 학당의 문제만 출제
        // INITIAL_QUIZ_DATA는 category 필드가 없으므로 literacy 태그를 명시적으로 추가
        const CATEGORY_BASE: Record<QuizCategory, QuizQuestion[]> = {
          literacy:  INITIAL_QUIZ_DATA.map(q => ({ ...q, category: 'literacy' as const })),
          proverbs:  PROVERBS_QUESTIONS,
          idioms:    IDIOMS_QUESTIONS,
          history:   HISTORY_QUESTIONS,
          etiquette: ETIQUETTE_QUESTIONS,
        };

        // AI 뱅크 로드 (선택 카테고리 전용 스토리지)
        const aiBank = await getOrBuildCategoryBank(selectedCategory);
        const aiExtra = getCategoryAIQuestions(selectedCategory);

        // 엄격한 카테고리 일치 필터 — category가 없거나 다른 문제는 절대 포함 안 함
        const basePool = CATEGORY_BASE[selectedCategory].filter(
          q => q.category === selectedCategory
        );
        const aiPool = [...aiBank, ...aiExtra].filter(
          q => q.category === selectedCategory
        );

        questions = [...basePool, ...aiPool]
          .filter((q, i, arr) => arr.findIndex(x => x.id === q.id) === i); // 중복 제거
      } else {
        // 전체 카테고리 모드 (기존 동작)
        const aiBank = await getOrBuildAIBank();
        questions = [...INITIAL_QUIZ_DATA, ...aiBank];
      }

      if (questions.length === 0) throw new Error('문제 없음');
      setAllQuestions(questions);
      setPhase('stage-intro');
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [setLoading, resetSession, isReviewMode, setQuestions, selectedCategory]); // wrongAnswers는 ref로 접근 → deps 제외

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // ─── 스테이지 시작 ───────────────────────────────────────
  const startStage = useCallback((stage: number) => {
    // ── 레벨별 난이도 가중치 [diff1, diff2, diff3] ──────────
    const lvl = player.level;
    let diffWeights: [number, number, number];
    if      (lvl <= 2) diffWeights = [1.0, 0.0, 0.0];
    else if (lvl <= 4) diffWeights = [0.6, 0.4, 0.0];
    else if (lvl <= 6) diffWeights = [0.3, 0.5, 0.2];
    else if (lvl <= 8) diffWeights = [0.1, 0.4, 0.5];
    else               diffWeights = [0.0, 0.2, 0.8];

    // 스테이지 번호도 고려 (후반 스테이지는 더 어렵게)
    const stageBoost = stage - 1; // 0~3
    // 회차가 올라갈수록 어려운 문제 비중 증가
    const cycleBoost = Math.min(cycleCount * 0.1, 0.4); // 최대 0.4까지
    const w0 = Math.max(0, diffWeights[0] - stageBoost * 0.15 - cycleBoost);
    const w2 = Math.min(1, diffWeights[2] + stageBoost * 0.15 + cycleBoost);
    const w1 = Math.max(0, 1 - w0 - w2);
    const weights: [number, number, number] = [w0, w1, w2];

    // ── 카테고리 필터 (엄격 — category 필드가 정확히 일치하는 문제만) ──
    const categoryFiltered = selectedCategory
      ? allQuestions.filter(q => q.category === selectedCategory)
      : allQuestions;

    // ── 문제 다양성: 안 본 문제 우선 ──────────────────────
    const seenSet = new Set(seenQuestionIds);
    const unseen = categoryFiltered.filter(q => !seenSet.has(q.id));
    const seen   = categoryFiltered.filter(q => seenSet.has(q.id));

    function pickByWeight(pool: typeof allQuestions, count: number) {
      if (pool.length === 0 || count <= 0) return [];
      const need = [
        Math.round(count * weights[0]),
        Math.round(count * weights[1]),
        0,
      ];
      need[2] = count - need[0] - need[1];
      const result: typeof allQuestions = [];
      ([1, 2, 3] as const).forEach((d, i) => {
        const bucket = pool.filter(q => q.difficulty === d).sort(() => Math.random() - 0.5);
        result.push(...bucket.slice(0, need[i]));
      });
      // 부족한 경우 해당 pool에서 아무 난이도로 보충
      if (result.length < count) {
        const picked = new Set(result.map(q => q.id));
        const rest = pool.filter(q => !picked.has(q.id)).sort(() => Math.random() - 0.5);
        result.push(...rest.slice(0, count - result.length));
      }
      return result.sort(() => Math.random() - 0.5);
    }

    // 1순위: 안 본 문제
    let selected = pickByWeight(unseen, QUESTIONS_PER_STAGE);
    // 2순위: 부족하면 본 문제로 보충
    if (selected.length < QUESTIONS_PER_STAGE) {
      const pickedIds = new Set(selected.map(q => q.id));
      const extra = pickByWeight(seen.filter(q => !pickedIds.has(q.id)), QUESTIONS_PER_STAGE - selected.length);
      selected = [...selected, ...extra];
    }
    // 최종 보충 (카테고리 필터 적용된 풀에서만)
    if (selected.length < QUESTIONS_PER_STAGE) {
      const pickedIds = new Set(selected.map(q => q.id));
      const rest = categoryFiltered.filter(q => !pickedIds.has(q.id)).sort(() => Math.random() - 0.5);
      selected = [...selected, ...rest].slice(0, QUESTIONS_PER_STAGE);
    }

    // seen 등록
    markQuestionsSeen(selected.map(q => q.id));

    setQuestions(selected);
    setStageIndex(0);
    setStageClearCorrect(0);
    setPhase('quiz');
  }, [allQuestions, setQuestions, player.level, seenQuestionIds, markQuestionsSeen, cycleCount, selectedCategory]);

  // ─── 문제 진행 공통 함수 ────────────────────────────────
  const advanceQuestion = useCallback(() => {
    const nextIdx = stageIndex + 1;
    const limit = isReviewMode ? allQuestions.length : QUESTIONS_PER_STAGE;
    if (nextIdx >= limit) {
      if (isReviewMode) {
        setPhase('finished');
      } else {
        setPhase('minigame-intro');
        setCurrentMinigame(MINIGAMES[Math.floor(Math.random() * MINIGAMES.length)]);
      }
    } else {
      setStageIndex(nextIdx);
      nextQuestion();
    }
  }, [stageIndex, nextQuestion, isReviewMode, allQuestions.length]);

  // ─── 정답/오답 처리 ─────────────────────────────────────
  const handleAnswer = useCallback((correct: boolean) => {
    if (!currentQuestions[currentIndex]) return;
    // 타이머 정지
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const q = currentQuestions[currentIndex];
    if (correct) {
      setLastExplanation(q.explanation);   // RewardModal에 해설 전달
      answerCorrect(q.xpReward, q.coinReward);
      setStageClearCorrect(p => p + 1);
      // 카테고리 통계 업데이트
      const qCat = (q.category as QuizCategory) || selectedCategory || 'literacy';
      updateCategoryStats(qCat, true);
      // ⚡ 스피드 라운드 보너스 (2배 코인)
      if (isSpeedRound) addCoins(q.coinReward * 2);
      // ⏱ 빠른 정답 보너스 코인
      else if (timeLeft > 10) addCoins(3);
      else if (timeLeft > 5) addCoins(1);
      // 오답 복습 모드: 맞히면 목록에서 제거
      if (isReviewMode) removeWrongAnswer(q.id);
      // 🎊 5연속 달성 시 confetti
      const newStreak = player.streak + 1;
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowConfetti(true);
        if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
        confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 2500);
      }
    } else {
      answerWrong();
      // 카테고리 통계 업데이트
      const qCat = (q.category as QuizCategory) || selectedCategory || 'literacy';
      updateCategoryStats(qCat, false);
      // 일반 모드: 틀린 문제 저장
      if (!isReviewMode) addWrongAnswer(q);
      // 하트 감소 흔들림 애니메이션
      setHeartShake(true);
      setTimeout(() => setHeartShake(false), 600);
      // 하트가 남아있으면 바로 다음 문제로 (PunishmentModal 없을 때)
      if (player.hearts > 1) {
        advanceQuestion();
      }
    }
  }, [currentQuestions, currentIndex, answerCorrect, answerWrong, player.hearts, advanceQuestion,
      timeLeft, addCoins, isReviewMode, removeWrongAnswer, addWrongAnswer]);

  // PunishmentModal이 닫힌 후 자동으로 다음 문제 진행
  const prevShowPunishment = useRef(false);
  useEffect(() => {
    if (prevShowPunishment.current && !showPunishment && phase === 'quiz') {
      advanceQuestion();
    }
    prevShowPunishment.current = showPunishment;
  }, [showPunishment, advanceQuestion, phase]);

  // ─── 타이머: 문제 변경 시 리셋 ──────────────────────────
  useEffect(() => {
    if (phase !== 'quiz' || showReward || showPunishment) return;
    setTimeLeft(effectiveTimerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [currentIndex, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // 모달 열릴 때 타이머 중지
  useEffect(() => {
    if ((showReward || showPunishment) && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [showReward, showPunishment]);

  // 타이머 0 → 자동 오답 처리
  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;
  useEffect(() => {
    if (timeLeft === 0 && phase === 'quiz' && !showReward && !showPunishment) {
      handleAnswerRef.current(false);
    }
  }, [timeLeft, phase, showReward, showPunishment]);

  // ─── 다음 문제 (RewardModal onNext) ──────────────────────
  const handleNext = useCallback(() => {
    advanceQuestion();
  }, [advanceQuestion]);

  // ─── 미니게임 완료 ───────────────────────────────────────
  const handleMinigameComplete = useCallback((score: number) => {
    if (score > 0) addCoins(score);
    recordMinigamePlayed();   // 미션/업적 기록
    // 미니게임 클리어 보너스: 하트 1개 회복
    restoreHeart();
    setPhase('stage-clear');
  }, [addCoins, recordMinigamePlayed, restoreHeart]);

  // ─── 다음 스테이지 or 완료 ──────────────────────────────
  const handleNextStage = useCallback(() => {
    recordStageCleared();     // 미션/업적 기록
    const nextStage = currentStage + 1;
    if (nextStage > STAGE_CONFIG.length) {
      // 마지막 스테이지 완주 → 회차 클리어
      incrementCycle();
      setShowConfetti(true);
      confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 2500);
      setPhase('cycle-clear');
    } else {
      // 관문 시험 표시 (스테이지 1→2, 2→3, 3→4 전환 시)
      setPendingNextStage(true);
      setShowGateQuiz(true);
    }
  }, [currentStage, recordStageCleared, incrementCycle]);

  const handleGatePass = useCallback(() => {
    setShowGateQuiz(false);
    setPendingNextStage(false);
    setCurrentStage(prev => prev + 1);
    setPhase('stage-intro');
  }, []);

  const handleGateFail = useCallback(() => {
    setShowGateQuiz(false);
    setPendingNextStage(false);
    // 실패해도 다음 스테이지로 진행 (처벌은 없음, 단지 보너스 XP 못 받음)
    setCurrentStage(prev => prev + 1);
    setPhase('stage-intro');
  }, []);

  const stageConfig = STAGE_CONFIG[Math.min(currentStage - 1, STAGE_CONFIG.length - 1)];
  const accuracy = stageClearCorrect > 0
    ? Math.round(stageClearCorrect / QUESTIONS_PER_STAGE * 100) : 0;
  const stageStars = accuracy === 100 ? 3 : accuracy >= 80 ? 2 : accuracy >= 50 ? 1 : 0;

  // ─── 관문 시험 오버레이 ──────────────────────────────────
  if (showGateQuiz && pendingNextStage) {
    const fromCfg = STAGE_CONFIG[Math.min(currentStage - 1, STAGE_CONFIG.length - 1)];
    const toCfg = STAGE_CONFIG[Math.min(currentStage, STAGE_CONFIG.length - 1)];
    return (
      <div className="joseon-bg min-h-screen">
        <GateQuizPage
          fromLevel={`${fromCfg.label} (Stage ${currentStage})`}
          toLevel={`${toCfg.label} (Stage ${currentStage + 1})`}
          onPass={handleGatePass}
          onFail={handleGateFail}
        />
      </div>
    );
  }

  // ─── 로딩 ────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="joseon-bg min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          {loadError ? (
            <>
              <div className="text-6xl mb-4">😓</div>
              <p className="text-joseon-dark font-bold text-xl">문제 로딩에 실패했어요</p>
              <p className="text-joseon-brown text-sm mt-2">네트워크를 확인하고 다시 시도해주세요</p>
              <button
                onClick={loadQuestions}
                className="mt-4 btn-joseon px-8 py-3"
              >
                🔄 다시 시도
              </button>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-joseon-brown text-sm underline block w-full"
              >
                홈으로 돌아가기
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 animate-float">📜</div>
              <p className="text-joseon-dark font-bold text-xl">문제를 준비하고 있어요...</p>
              <p className="text-joseon-brown text-sm mt-2">
                내장 110문제 + AI 생성 문제 로딩 중!
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full bg-joseon-red animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="text-joseon-brown/60 text-xs mt-4">
                AI 문제는 매일 새로 추가돼요 ✨
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── 스테이지 인트로 ─────────────────────────────────────
  if (phase === 'stage-intro') {
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          {selectedCategory && (() => {
            const h = HAKDANGS.find(hd => hd.id === selectedCategory);
            return h ? (
              <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${h.color} rounded-full px-4 py-1.5 mb-3`}>
                <span>{h.emoji}</span>
                <span className={`font-bold text-sm ${h.accentColor}`}>{h.name} · {h.koreanName}</span>
              </div>
            ) : null;
          })()}
          <div className={`text-6xl mb-3 animate-float`}>{stageConfig.emoji}</div>
          {cycleCount > 0 && (
            <div className="bg-purple-100 border border-purple-300 rounded-full px-3 py-1 text-xs font-bold text-purple-700 mb-2 inline-block">
              🔄 {cycleCount + 1}회차 도전 중
            </div>
          )}
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 ${stageConfig.bg} ${stageConfig.color} border ${stageConfig.border}`}>
            STAGE {currentStage} · {stageConfig.label}
          </div>
          <h2 className="text-3xl font-black text-joseon-dark mb-2">
            {currentStage === 1 ? '학습 시작!' :
             currentStage === 2 ? '난이도 상승!' :
             currentStage === 3 ? '고급 도전!' : '최종 도전!'}
          </h2>
          <p className="text-joseon-brown mb-2">
            {QUESTIONS_PER_STAGE}문제를 풀면 미니게임이 나와요!
          </p>
          <div className={`rounded-xl p-4 mb-5 ${stageConfig.bg} border ${stageConfig.border}`}>
            <p className={`font-bold ${stageConfig.color}`}>
              {currentStage === 1 && '⭐ 기초 단어부터 시작해요'}
              {currentStage === 2 && '⭐⭐ 좀 더 어려운 단어예요'}
              {currentStage === 3 && '⭐⭐⭐ 고급 한자어에 도전!'}
              {currentStage === 4 && '👑 최고 난이도 도전!'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              XP 보너스: {currentStage === 1 ? '기본' : currentStage === 2 ? '1.5배' : currentStage === 3 ? '2배' : '3배'}
            </p>
          </div>

          {/* 전체 스테이지 진행도 */}
          <div className="flex justify-center gap-2 mb-6">
            {STAGE_CONFIG.map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-1`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                  i + 1 < currentStage ? 'bg-joseon-gold border-joseon-gold text-white' :
                  i + 1 === currentStage ? `${stageConfig.bg} ${stageConfig.border} ${stageConfig.color}` :
                  'bg-gray-100 border-gray-200 text-gray-400'
                }`}>
                  {i + 1 < currentStage ? '✓' : s.emoji}
                </div>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>

          {/* 하트 부족 경고 */}
          {player.hearts === 0 ? (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 mb-4 text-sm text-red-600 font-bold">
              💔 하트가 없어요! 오답 시 잠깐 쉬어가기가 생겨요.<br/>
              <span className="font-normal text-red-400 text-xs">정답만 맞히면 계속 풀 수 있어요 💪</span>
            </div>
          ) : player.hearts === 1 ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 text-sm text-yellow-700">
              ⚠️ 하트가 1개 남았어요! 신중하게 풀어보세요.
            </div>
          ) : null}

          <button onClick={() => startStage(currentStage)} className="btn-joseon w-full text-xl py-5">
            시작! 📚
          </button>
        </div>
      </div>
    );
  }

  // ─── 미니게임 인트로 ─────────────────────────────────────
  if (phase === 'minigame-intro') {
    const gameNames: Record<MiniGameId, string> = {
      TUHO: '투호 놀이', JEGI: '제기차기',
      MEMORY: '기억력 게임', WORDPUZZLE: '초성 퀴즈',
      ARCHERY: '활쏘기', SPOTDIFF: '틀린그림 찾기', PUZZLE: '슬라이딩 퍼즐',
    };
    const gameEmojis: Record<MiniGameId, string> = {
      TUHO: '🏺', JEGI: '🪶',
      MEMORY: '🧠', WORDPUZZLE: '🔤',
      ARCHERY: '🏹', SPOTDIFF: '🔍', PUZZLE: '🧩',
    };
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-3 animate-float">{gameEmojis[currentMinigame]}</div>
          <div className="bg-joseon-gold/20 border border-joseon-gold rounded-full px-4 py-1 text-sm font-bold text-joseon-dark mb-3 inline-block">
            🎮 미니게임 TIME!
          </div>
          <h2 className="text-3xl font-black text-joseon-dark mb-2">
            {gameNames[currentMinigame]}
          </h2>
          <p className="text-joseon-brown mb-2">
            STAGE {currentStage} 완료! 수고했어요 🎉
          </p>
          <div className="card-joseon p-4 mb-5 bg-green-50 border-green-300">
            <p className="text-green-700 font-bold">
              이번 스테이지: {stageClearCorrect}/{QUESTIONS_PER_STAGE} 정답 ({accuracy}%)
            </p>
          </div>
          <p className="text-joseon-brown text-sm mb-5">
            미니게임을 클리어하면 엽전을 획득하고 다음 스테이지로!
          </p>
          <button onClick={() => setPhase('minigame')} className="btn-joseon w-full text-xl py-5">
            게임 시작! {gameEmojis[currentMinigame]}
          </button>
        </div>
      </div>
    );
  }

  // ─── 미니게임 ─────────────────────────────────────────────
  if (phase === 'minigame') {
    return (
      <div className="joseon-bg min-h-screen flex flex-col">
        <header className="bg-joseon-dark text-white p-3 flex items-center gap-3">
          <div className="text-xl">🎮</div>
          <div>
            <h1 className="text-base font-black">
              {currentMinigame === 'TUHO'     ? '🏺 투호 놀이' :
               currentMinigame === 'JEGI'     ? '🪶 제기차기' :
               currentMinigame === 'MEMORY'   ? '🧠 기억력 게임' :
               currentMinigame === 'WORDPUZZLE' ? '🔤 초성 퀴즈' :
               currentMinigame === 'ARCHERY'  ? '🏹 활쏘기' :
               currentMinigame === 'SPOTDIFF' ? '🔍 틀린그림 찾기' : '🧩 슬라이딩 퍼즐'}
            </h1>
            <p className="text-joseon-gold text-xs">Stage {currentStage} 미니게임</p>
          </div>
          <div className="ml-auto text-joseon-gold font-bold text-sm">🪙 {player.coins}</div>
        </header>
        <div className="flex-1 max-w-md mx-auto w-full p-3 overflow-y-auto">
          <div className="card-joseon p-2">
            {currentMinigame === 'TUHO'       && <TuhoGame onComplete={handleMinigameComplete} />}
            {currentMinigame === 'JEGI'       && <JegiGame onComplete={handleMinigameComplete} />}
            {currentMinigame === 'MEMORY'     && <MemoryGame onComplete={handleMinigameComplete} level={player.level} />}
            {currentMinigame === 'WORDPUZZLE' && <WordPuzzleGame onComplete={handleMinigameComplete} level={player.level} />}
            {currentMinigame === 'ARCHERY'    && <ArcheryGame onComplete={handleMinigameComplete} level={player.level} />}
            {currentMinigame === 'SPOTDIFF'   && <SpotDifferenceGame onComplete={handleMinigameComplete} level={player.level} />}
            {currentMinigame === 'PUZZLE'     && <SlidingPuzzleGame onComplete={handleMinigameComplete} level={player.level} />}
          </div>
        </div>
      </div>
    );
  }

  // ─── 스테이지 클리어 ─────────────────────────────────────
  if (phase === 'stage-clear') {
    const isLastStage = currentStage >= STAGE_CONFIG.length;
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-3 animate-level-up">
            {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎊' : '📚'}
          </div>
          <h2 className="text-3xl font-black text-joseon-dark mb-1">
            STAGE {currentStage} 클리어!
          </h2>
          <p className={`text-lg font-bold mb-2 ${stageConfig.color}`}>{stageConfig.emoji} {stageConfig.label} 완료</p>
          {/* 별점 표시 */}
          <div className="flex justify-center gap-1 mb-3 text-3xl">
            {[1,2,3].map(i => (
              <span key={i} className={`transition-all duration-300 ${i <= stageStars ? '' : 'opacity-20 grayscale'}`}>
                ⭐
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 border border-green-300 rounded-xl p-3">
              <div className="text-2xl font-black text-green-600">{stageClearCorrect}</div>
              <div className="text-green-700 text-xs">정답</div>
            </div>
            <div className="bg-red-50 border border-red-300 rounded-xl p-3">
              <div className="text-2xl font-black text-red-600">{QUESTIONS_PER_STAGE - stageClearCorrect}</div>
              <div className="text-red-700 text-xs">오답</div>
            </div>
          </div>

          {/* 미니게임 클리어 보너스 */}
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 text-sm font-bold text-red-600">
            ❤️ 미니게임 클리어 보너스 · 하트 1개 회복!
          </div>

          <div className="text-2xl font-bold text-joseon-dark mb-2">정답률 {accuracy}%</div>
          <p className="text-joseon-brown text-sm mb-5">
            {accuracy === 100 ? '🌟 완벽해요! 왕의 자질이 보입니다!' :
             accuracy >= 80 ? '👏 훌륭해요!' :
             '💪 다음 스테이지도 화이팅!'}
          </p>

          {!isLastStage && (
            <div className={`rounded-xl p-3 mb-4 ${STAGE_CONFIG[currentStage].bg} border ${STAGE_CONFIG[currentStage].border}`}>
              <p className={`font-bold text-sm ${STAGE_CONFIG[currentStage].color}`}>
                다음: STAGE {currentStage + 1} · {STAGE_CONFIG[currentStage].label} {STAGE_CONFIG[currentStage].emoji}
              </p>
            </div>
          )}

          <button
            onClick={handleNextStage}
            className="btn-joseon w-full text-lg py-4"
          >
            {isLastStage ? '🏁 완주 결과 보기' : `STAGE ${currentStage + 1} 시작 →`}
          </button>
          <button onClick={() => navigate('/')} className="text-joseon-brown text-sm underline mt-3 block">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ─── 회차 클리어 ─────────────────────────────────────────
  if (phase === 'cycle-clear') {
    const completedCycle = cycleCount; // incrementCycle() 이미 호출됨
    const cycleBonus = { coins: 50 + completedCycle * 20, xp: 200 + completedCycle * 80 };
    const totalAccuracy = sessionCorrect + sessionWrong > 0
      ? Math.round(sessionCorrect / (sessionCorrect + sessionWrong) * 100) : 0;
    const rank =
      completedCycle >= 10 ? { emoji: '🌟', label: '전설의 학자', color: 'text-yellow-500' } :
      completedCycle >= 5  ? { emoji: '👑', label: '왕의 학식',   color: 'text-yellow-600' } :
      completedCycle >= 3  ? { emoji: '🎓', label: '선비의 경지', color: 'text-blue-600'   } :
      completedCycle >= 1  ? { emoji: '📖', label: '학생의 열정', color: 'text-green-600'  } :
                             { emoji: '🌱', label: '첫 완주!',    color: 'text-green-500'  };

    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <ConfettiEffect active={showConfetti} />
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          <div className="text-7xl mb-2 animate-level-up">{rank.emoji}</div>
          <div className="bg-purple-100 border border-purple-300 rounded-full px-4 py-1 text-sm font-bold text-purple-700 mb-3 inline-block">
            🔄 {completedCycle}회차 완주!
          </div>
          <h2 className="text-3xl font-black text-joseon-dark mb-1">전 스테이지 완주!</h2>
          <p className={`text-lg font-black mb-4 ${rank.color}`}>{rank.label}</p>

          {/* 이번 회차 성과 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-2">
              <div className="text-xl font-black text-green-600">{sessionCorrect}</div>
              <div className="text-[10px] text-green-700">정답</div>
            </div>
            <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-2">
              <div className="text-xl font-black text-joseon-red">{totalAccuracy}%</div>
              <div className="text-[10px] text-joseon-brown">정답률</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-2">
              <div className="text-xl font-black text-red-500">{sessionWrong}</div>
              <div className="text-[10px] text-red-600">오답</div>
            </div>
          </div>

          {/* 회차 클리어 보너스 */}
          <div className="bg-purple-50 border border-purple-300 rounded-xl p-3 mb-4">
            <p className="text-purple-700 font-bold text-sm mb-1">🎁 {completedCycle}회차 완주 보너스</p>
            <div className="flex justify-center gap-4">
              <span className="text-joseon-dark font-bold text-sm">⭐ +{cycleBonus.xp} XP</span>
              <span className="text-joseon-dark/40">|</span>
              <span className="text-joseon-dark font-bold text-sm">🪙 +{cycleBonus.coins} 엽전</span>
            </div>
          </div>

          {/* 다음 회차 안내 */}
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 mb-5 text-sm text-joseon-brown">
            <p className="font-bold text-joseon-dark mb-1">⚔️ {completedCycle + 1}회차 예고</p>
            <p className="text-xs">
              {completedCycle === 0 ? '이제 좀 더 어려운 문제들이 기다려요!' :
               completedCycle < 3  ? '어려운 문제 비중이 높아집니다!' :
               completedCycle < 5  ? '고급 한자어 중심으로 출제됩니다!' :
               '최고 난이도! 진정한 학자의 길!'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // 보너스 지급
                addXP(cycleBonus.xp);
                addCoins(cycleBonus.coins);
                // 다음 회차 시작
                resetSession();
                sessionStartXP.current = player.xp;
                sessionStartCoins.current = player.coins;
                setCurrentStage(1);
                setPhase('stage-intro');
              }}
              className="btn-joseon py-4 text-base">
              ⚔️ {completedCycle + 1}회차 도전!
            </button>
            {wrongAnswers.length > 0 && (
              <button onClick={() => navigate('/quiz?mode=review')}
                className="py-3 rounded-xl font-bold text-red-700 border-2 border-red-400 bg-red-50 hover:opacity-90 active:scale-95 transition-all">
                📝 오답 복습하기 ({wrongAnswers.length}문제)
              </button>
            )}
            <button onClick={() => navigate('/')}
              className="py-3 rounded-xl font-bold text-joseon-dark border-2 border-joseon-brown bg-joseon-cream hover:opacity-90 active:scale-95 transition-all">
              🏠 홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 전체 완료 ───────────────────────────────────────────
  if (phase === 'finished') {
    const totalAccuracy = sessionCorrect + sessionWrong > 0
      ? Math.round(sessionCorrect / (sessionCorrect + sessionWrong) * 100) : 0;
    const rank = totalAccuracy >= 90 ? { emoji: '👑', label: '왕의 학식', color: 'text-yellow-600' }
               : totalAccuracy >= 70 ? { emoji: '🎓', label: '선비의 경지', color: 'text-blue-600' }
               : totalAccuracy >= 50 ? { emoji: '📖', label: '학생의 열정', color: 'text-green-600' }
               : { emoji: '🌱', label: '성장 중인 새싹', color: 'text-gray-600' };
    const earnedXP = Math.max(0, player.xp - sessionStartXP.current);
    const earnedCoins = Math.max(0, player.coins - sessionStartCoins.current);
    return (
      <div className="joseon-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card-joseon p-8 max-w-sm w-full text-center">
          <div className="text-7xl mb-3 animate-level-up">{rank.emoji}</div>
          <h2 className="text-3xl font-black text-joseon-dark mb-1">전 스테이지 완주!</h2>
          <p className={`text-lg font-black mb-4 ${rank.color}`}>{rank.label}</p>

          {/* 최종 점수판 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-2">
              <div className="text-xl font-black text-green-600">{sessionCorrect}</div>
              <div className="text-[10px] text-green-700">정답</div>
            </div>
            <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-2">
              <div className="text-xl font-black text-joseon-red">{totalAccuracy}%</div>
              <div className="text-[10px] text-joseon-brown">정답률</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-2">
              <div className="text-xl font-black text-red-500">{sessionWrong}</div>
              <div className="text-[10px] text-red-600">오답</div>
            </div>
          </div>

          {/* 이번 세션 획득 보상 */}
          <div className="flex justify-center gap-4 bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl px-4 py-2 mb-3">
            <span className="text-joseon-dark font-bold text-sm">⭐ +{earnedXP} XP</span>
            <span className="text-joseon-dark/40">|</span>
            <span className="text-joseon-dark font-bold text-sm">🪙 +{earnedCoins} 엽전</span>
          </div>

          <p className="text-joseon-brown text-sm mb-1">
            총 {STAGE_CONFIG.length * QUESTIONS_PER_STAGE}문제 · 4스테이지 완주
          </p>
          <p className="text-joseon-brown/60 text-xs mb-5">
            {totalAccuracy >= 80 ? '🌟 최고의 실력! 매일 꾸준히 하면 왕이 될 수 있어요!' :
             totalAccuracy >= 60 ? '👏 잘했어요! 틀린 문제를 복습해 보세요.' :
             '💪 처음엔 어렵지만 반복하면 늘어요!'}
          </p>

          {/* 다음 업적 미리보기 */}
          {(() => {
            const next = ACHIEVEMENTS.find(a => !unlockedAchievements.includes(a.id));
            if (!next) return null;
            // 진행도 힌트 계산
            let hint = '';
            if (next.id.startsWith('correct_')) {
              const t = parseInt(next.id.split('_')[1]);
              hint = `앞으로 ${Math.max(0, t - player.totalCorrect)}문제`;
            } else if (next.id.startsWith('quiz_')) {
              const t = parseInt(next.id.split('_')[1]);
              hint = `앞으로 ${Math.max(0, t - player.quizzesCompleted)}회`;
            } else if (next.id.startsWith('streak_')) {
              const t = parseInt(next.id.split('_')[1]);
              hint = `목표: ${t}연속 (현재 최고 ${player.maxStreak})`;
            }
            return (
              <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 mb-4 text-left">
                <p className="text-joseon-brown text-xs font-bold mb-1">🎯 다음 업적까지</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{next.emoji}</span>
                  <div>
                    <p className="text-joseon-dark font-bold text-sm">{next.title}</p>
                    <p className="text-joseon-brown text-xs">{next.desc}{hint ? ` · ${hint}` : ''}</p>
                  </div>
                  <span className="ml-auto text-joseon-gold text-xs font-bold">+{next.reward.coins}🪙</span>
                </div>
              </div>
            );
          })()}

          <div className="flex flex-col gap-3">
            {isReviewMode ? (
              <>
                {wrongAnswers.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
                    📝 아직 틀린 문제 <strong>{wrongAnswers.length}개</strong> 남아있어요!
                  </div>
                )}
                {wrongAnswers.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 text-center font-bold">
                    🎉 모든 오답을 완벽하게 마스터했어요!
                  </div>
                )}
                {wrongAnswers.length > 0 && (
                  <button onClick={() => { resetSession(); loadQuestions(); }}
                    className="btn-joseon py-4 text-base">🔄 남은 오답 계속 복습!</button>
                )}
              </>
            ) : (
              <>
                <button onClick={() => {
                  resetSession();
                  sessionStartXP.current = player.xp;
                  sessionStartCoins.current = player.coins;
                  setCurrentStage(1);
                  setPhase('stage-intro');
                }}
                  className="btn-joseon py-4 text-base">🔄 다시 도전!</button>
                {wrongAnswers.length > 0 && (
                  <button onClick={() => navigate('/quiz?mode=review')}
                    className="py-3 rounded-xl font-bold text-red-700 border-2 border-red-400 bg-red-50 hover:opacity-90 active:scale-95 transition-all">
                    📝 오답 복습하기 ({wrongAnswers.length}문제)
                  </button>
                )}
              </>
            )}
            <button onClick={() => navigate('/')}
              className="py-3 rounded-xl font-bold text-joseon-dark border-2 border-joseon-brown bg-joseon-cream hover:opacity-90 active:scale-95 transition-all">
              🏠 홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 퀴즈 화면 ───────────────────────────────────────────
  const currentQuestion = currentQuestions[currentIndex];

  return (
    <div className="joseon-bg min-h-screen flex flex-col">
      {/* 🎊 Confetti */}
      <ConfettiEffect active={showConfetti} />

      {/* ⚡ 스피드 라운드 배너 */}
      {isSpeedRound && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-400 text-black text-center py-1 text-sm font-black animate-bounce">
          ⚡ 스피드 라운드! 5초 안에 맞히면 코인 2배!
        </div>
      )}

      {/* 헤더 */}
      <header className={`text-white p-3 ${isSpeedRound ? 'bg-yellow-600' : 'bg-joseon-dark'}`}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate('/')} className="text-joseon-gold text-2xl">←</button>
          <div className="text-center">
            {/* 스테이지 + 문제 번호 */}
            {isReviewMode ? (
              <div className="text-xs font-bold text-red-300 bg-white/20 rounded-full px-2 py-0.5 mb-1">
                📝 오답 복습 모드
              </div>
            ) : (
              <div className={`text-xs font-bold ${stageConfig.color} bg-white rounded-full px-2 py-0.5 mb-1`}>
                STAGE {currentStage} · {stageConfig.emoji} {stageConfig.label}
                {cycleCount > 0 && <span className="text-purple-300 text-[10px]"> · {cycleCount + 1}회차</span>}
              </div>
            )}
            <div className="text-sm font-bold text-white">
              {stageIndex + 1} / {isReviewMode ? allQuestions.length : QUESTIONS_PER_STAGE}
            </div>
            {/* 진행바 */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: QUESTIONS_PER_STAGE }).map((_, i) => (
                <div key={i} className={`h-1.5 w-5 rounded-full ${
                  i < stageIndex ? 'bg-joseon-gold' :
                  i === stageIndex ? 'bg-white' : 'bg-white/30'
                }`} />
              ))}
            </div>
          </div>
          <CharacterDisplay size="small" showStats={false} />
        </div>
      </header>

      {/* 스탯 바 */}
      <div className="bg-joseon-dark/90 text-white px-4 py-2">
        <div className="flex justify-between items-center max-w-md mx-auto text-sm">
          {/* 하트 (오답 시 흔들림) */}
          <span className={heartShake ? 'animate-bounce' : ''}>
            {'❤️'.repeat(player.hearts)}{'🖤'.repeat(Math.max(0, player.maxHearts - player.hearts))}
          </span>
          {/* 연속 정답 뱃지 */}
          {player.streak >= 10
            ? <span className="bg-purple-600 text-white text-xs font-black px-2 py-1 rounded-full animate-pulse shadow-lg shadow-purple-500/50">
                ⚡ {player.streak}연속 신들린!
              </span>
            : player.streak >= 5
            ? <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                🔥 {player.streak}연속 불꽃!
              </span>
            : player.streak >= 2
            ? <span className="bg-joseon-gold text-black text-xs font-black px-2 py-0.5 rounded-full">
                🔥 {player.streak}연속
              </span>
            : <span className="text-white/70 text-xs">✅ {sessionCorrect} | ❌ {sessionWrong}</span>
          }
          <span className={`text-xs font-bold tabular-nums ${
            timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white/60'
          }`}>⏱{timeLeft}s</span>
          <span className="text-joseon-gold font-bold">🪙 {player.coins}</span>
        </div>
      </div>

      {/* 타이머 바 */}
      <div className={`w-full h-2 ${isSpeedRound ? 'bg-yellow-200' : 'bg-gray-200'}`}>
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isSpeedRound
              ? timeLeft <= 2 ? 'bg-red-600' : 'bg-yellow-500'
              : timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-yellow-400' : 'bg-green-500'
          }`}
          style={{ width: `${(timeLeft / effectiveTimerDuration) * 100}%` }}
        />
      </div>

      {/* 퀴즈 영역 */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full overflow-y-auto">
        {currentQuestion && (
          <div className="flex flex-col gap-4">
            {/* 뱃지 */}
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                currentQuestion.type === 'OX' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {currentQuestion.type === 'OX' ? '⭕❌ OX 퀴즈' : '📝 4지선다'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                currentQuestion.difficulty === 1 ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 2 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {'⭐'.repeat(currentQuestion.difficulty)} 난이도
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-joseon-gold/20 text-joseon-dark font-bold">
                +{currentQuestion.xpReward} XP
              </span>
            </div>

            {currentQuestion.type === 'OX'
              ? <OXQuiz question={currentQuestion} onAnswer={handleAnswer} onSpendCoins={spendCoins} coins={player.coins} />
              : <MultipleChoiceQuiz question={currentQuestion} onAnswer={handleAnswer} onSpendCoins={spendCoins} coins={player.coins} />
            }
          </div>
        )}
      </div>

      {/* 모달 */}
      {showReward && !showLevelUp && <RewardModal onNext={handleNext} explanation={lastExplanation} />}
      {showPunishment && <PunishmentModal />}
      {showLevelUp && <LevelUpModal />}
    </div>
  );
}
