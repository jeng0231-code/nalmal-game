import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { HAKDANGS } from '../types/hakdang';
import type { QuizCategory } from '../types/hakdang';
import type { QuizQuestion } from '../types';

import { INITIAL_QUIZ_DATA } from '../data/quizData';
import { PROVERBS_QUESTIONS } from '../data/proverbsData';
import { IDIOMS_QUESTIONS } from '../data/idiomsData';
import { HISTORY_QUESTIONS } from '../data/historyData';
import { ETIQUETTE_QUESTIONS } from '../data/etiquetteData';

// 카테고리별 문제 풀
const CATEGORY_QUESTIONS: Record<QuizCategory, QuizQuestion[]> = {
  literacy:  INITIAL_QUIZ_DATA,
  proverbs:  PROVERBS_QUESTIONS,
  idioms:    IDIOMS_QUESTIONS,
  history:   HISTORY_QUESTIONS,
  etiquette: ETIQUETTE_QUESTIONS,
};

const GATE_QUESTION_COUNT = 3;
const PASS_THRESHOLD = 2; // 3문제 중 2개 이상 정답
const TIMER_SECONDS = 30;

// ─── Props ────────────────────────────────────────────────────
export interface GateQuizProps {
  fromLevel: string; // '초급'
  toLevel: string;   // '중급'
  onPass: () => void;
  onFail: () => void;
}

// ─── 유틸 ─────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomCategories(n: number): QuizCategory[] {
  const cats = HAKDANGS.map((h) => h.id) as QuizCategory[];
  return shuffle(cats).slice(0, n);
}

function pickQuestions(category: QuizCategory, count: number): QuizQuestion[] {
  const pool = CATEGORY_QUESTIONS[category] ?? INITIAL_QUIZ_DATA;
  return shuffle(pool).slice(0, count);
}

// ─── 타이머 바 ────────────────────────────────────────────────
function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  const color =
    pct > 60 ? 'bg-green-400' : pct > 30 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
      <div
        className={`h-2 rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── 단계 타입 ────────────────────────────────────────────────
type GatePhase =
  | 'intro'           // 관문 소개
  | 'select'          // 카테고리 선택
  | 'quiz'            // 퀴즈 진행
  | 'result-pass'     // 통과
  | 'result-fail';    // 실패

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function GateQuizPage({ fromLevel, toLevel, onPass, onFail }: GateQuizProps) {
  const { player, addXP } = useGameStore();

  // 단계
  const [phase, setPhase] = useState<GatePhase>('intro');

  // 카테고리 선택 단계
  const [offeredCategories, setOfferedCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);

  // 퀴즈 단계
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [chosenAnswer, setChosenAnswer] = useState<boolean | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);

  // 타이머 ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 타이머 초기화 ──
  const startTimer = useCallback(() => {
    setTimeLeft(TIMER_SECONDS);
    setTimedOut(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // 타임아웃 처리
  useEffect(() => {
    if (timedOut && phase === 'quiz' && !showFeedback) {
      handleAnswer(null); // null = 시간 초과 (오답 처리)
    }
  }, [timedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── 페이즈 전환 ──
  const handleIntroStart = () => {
    const cats = pickRandomCategories(2);
    setOfferedCategories(cats);
    setPhase('select');
  };

  const handleCategorySelect = (cat: QuizCategory) => {
    setSelectedCategory(cat);
    const qs = pickQuestions(cat, GATE_QUESTION_COUNT);
    setQuestions(qs);
    setQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setPhase('quiz');
    startTimer();
  };

  // ── 답변 처리 ──
  const handleAnswer = (answer: boolean | number | null) => {
    stopTimer();
    const q = questions[questionIndex];
    const isCorrect = answer !== null && answer === q.answer;
    setChosenAnswer(answer);
    setShowFeedback(true);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
    }
  };

  // ── 다음 문제 또는 결과 ──
  const handleNext = () => {
    const nextIdx = questionIndex + 1;

    if (nextIdx >= GATE_QUESTION_COUNT) {
      // 모든 문제 완료 — 결과 판정
      const finalCorrect = correctCount + (chosenAnswer !== null && chosenAnswer === questions[questionIndex].answer ? 1 : 0);
      if (finalCorrect >= PASS_THRESHOLD) {
        addXP(300); // 관문 통과 보너스
        setPhase('result-pass');
      } else {
        setPhase('result-fail');
      }
      return;
    }

    setQuestionIndex(nextIdx);
    setChosenAnswer(null);
    setShowFeedback(false);
    setTimedOut(false);
    startTimer();
  };

  // ── 결과 판정 (진행 중 조기 판정) ──
  // 퀴즈가 진행될 때마다 통과/실패가 이미 확정된 경우 바로 결과 화면으로
  useEffect(() => {
    if (phase !== 'quiz' || !showFeedback) return;
    const remaining = GATE_QUESTION_COUNT - questionIndex - 1;
    if (correctCount >= PASS_THRESHOLD) {
      // 이미 통과 확정
      stopTimer();
      setTimeout(() => {
        addXP(300);
        setPhase('result-pass');
      }, 1200);
    } else if (wrongCount > GATE_QUESTION_COUNT - PASS_THRESHOLD) {
      // 이미 실패 확정
      stopTimer();
      setTimeout(() => setPhase('result-fail'), 1200);
    } else if (remaining === 0) {
      // 마지막 문제
      setTimeout(() => handleNext(), 1200);
    }
  }, [showFeedback, correctCount, wrongCount, questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 현재 문제 ──
  const currentQuestion = questions[questionIndex] ?? null;
  const currentHakdang = selectedCategory ? HAKDANGS.find((h) => h.id === selectedCategory) : null;

  // ════════════════════════════════════════════════════════════
  // 렌더 — INTRO
  // ════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-amber-300">
          {/* 문 이모지 연출 */}
          <div className="text-7xl mb-4 animate-bounce">🚪</div>
          <h2 className="text-2xl font-bold text-amber-900 mb-1">학당 관문</h2>
          <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1 mb-4">
            <span className="text-amber-800 font-semibold text-sm">
              {fromLevel}
            </span>
            <span className="text-amber-500">→</span>
            <span className="text-amber-800 font-semibold text-sm">
              {toLevel}
            </span>
          </div>
          <p className="text-amber-800 font-bold text-lg mb-2">⚔️ 관문을 통과하라!</p>
          <p className="text-sm text-amber-700 mb-5 leading-relaxed">
            다음 단계로 나아가려면 관문 시험을 통과해야 합니다.<br />
            <strong>3문제 중 2개 이상</strong> 맞혀야 통과!<br />
            문제당 제한 시간 <strong>30초</strong>
          </p>

          {/* 플레이어 현황 */}
          <div className="bg-white/60 rounded-xl px-4 py-2 mb-5 flex items-center justify-center gap-4 text-sm">
            <span>❤️ {player.hearts}</span>
            <span>🪙 {player.coins}</span>
            <span>⭐ Lv.{player.level}</span>
          </div>

          <button
            onClick={handleIntroStart}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-bold rounded-2xl py-4 text-base shadow-lg transition-all duration-200"
          >
            관문에 도전하기 🚀
          </button>
          <button
            onClick={onFail}
            className="mt-3 text-sm text-amber-500 hover:text-amber-700 underline"
          >
            나중에 도전
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 렌더 — SELECT (카테고리 선택)
  // ════════════════════════════════════════════════════════════
  if (phase === 'select') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-300">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🚪</div>
            <h2 className="text-xl font-bold text-amber-900">학당을 선택하세요</h2>
            <p className="text-sm text-amber-600 mt-1">
              두 학당 중 하나를 골라 시험을 치릅니다
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {offeredCategories.map((cat) => {
              const h = HAKDANGS.find((hd) => hd.id === cat)!;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`bg-gradient-to-br ${h.color} border-2 border-amber-200 rounded-2xl p-4 text-center hover:scale-105 active:scale-95 hover:shadow-md transition-all duration-200`}
                >
                  <div className="text-3xl mb-2">{h.emoji}</div>
                  <p className={`font-bold text-sm ${h.accentColor}`}>{h.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.koreanName}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{h.description}</p>
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-amber-400 mt-4">
            선택한 학당에서 {GATE_QUESTION_COUNT}문제가 출제됩니다
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 렌더 — QUIZ
  // ════════════════════════════════════════════════════════════
  if (phase === 'quiz' && currentQuestion) {
    const isOX = currentQuestion.type === 'OX';

    // 피드백 색상
    const getFeedbackColor = (optionAnswer: boolean | number) => {
      if (!showFeedback) return '';
      if (optionAnswer === currentQuestion.answer) return 'bg-green-100 border-green-400 text-green-800';
      if (chosenAnswer === optionAnswer) return 'bg-red-100 border-red-400 text-red-800';
      return 'opacity-50';
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-amber-300">
          {/* 진행 상태 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <span className="text-lg">{currentHakdang?.emoji}</span>
              <span className="text-sm font-semibold text-amber-800">{currentHakdang?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {Array.from({ length: GATE_QUESTION_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    i < questionIndex
                      ? 'bg-amber-400 border-amber-500 text-white'
                      : i === questionIndex
                      ? 'bg-amber-600 border-amber-700 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* 타이머 */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">
              정답 {correctCount} / 오답 {wrongCount}
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-amber-700'
              }`}
            >
              ⏱ {timeLeft}초
            </span>
          </div>
          <TimerBar seconds={timeLeft} total={TIMER_SECONDS} />

          {/* 문제 */}
          {currentQuestion.context && (
            <div className="bg-amber-100/80 rounded-xl px-3 py-2 mb-3 text-sm text-amber-800 italic">
              "{currentQuestion.context}"
            </div>
          )}
          <p className="text-base font-semibold text-gray-800 mb-4 leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* 답변 버튼 */}
          {isOX ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  disabled={showFeedback}
                  onClick={() => handleAnswer(val)}
                  className={`py-4 rounded-2xl text-2xl font-bold border-2 transition-all duration-200 ${
                    showFeedback
                      ? getFeedbackColor(val)
                      : 'bg-white border-gray-200 hover:border-amber-400 hover:bg-amber-50 active:scale-95'
                  }`}
                >
                  {val ? '⭕' : '❌'}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {currentQuestion.choices?.map((choice, idx) => (
                <button
                  key={idx}
                  disabled={showFeedback}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left py-3 px-4 rounded-xl border-2 text-sm transition-all duration-200 ${
                    showFeedback
                      ? getFeedbackColor(idx)
                      : 'bg-white border-gray-200 hover:border-amber-400 hover:bg-amber-50 active:scale-95'
                  }`}
                >
                  <span className="font-bold text-gray-400 mr-2">{idx + 1}.</span>
                  {choice}
                </button>
              ))}
            </div>
          )}

          {/* 피드백 박스 */}
          {showFeedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm mb-3 ${
                chosenAnswer !== null && chosenAnswer === currentQuestion.answer
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p className="font-bold mb-1">
                {chosenAnswer !== null && chosenAnswer === currentQuestion.answer
                  ? '✅ 정답!'
                  : timedOut
                  ? '⏰ 시간 초과!'
                  : '❌ 오답!'}
              </p>
              <p className="text-xs leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* 다음 버튼 — 정답/오답 확인 후 직접 진행하는 경우만 표시 */}
          {showFeedback &&
            correctCount < PASS_THRESHOLD &&
            wrongCount <= GATE_QUESTION_COUNT - PASS_THRESHOLD && (
              <button
                onClick={handleNext}
                className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl py-3 text-sm transition-all"
              >
                다음 문제 →
              </button>
            )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 렌더 — RESULT PASS
  // ════════════════════════════════════════════════════════════
  if (phase === 'result-pass') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-amber-50 to-yellow-50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-yellow-300">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-amber-900 mb-1">관문 통과!</h2>
          <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-1.5 mb-4">
            <span className="text-green-700 font-semibold text-sm">
              {fromLevel} → {toLevel}
            </span>
            <span className="text-green-500">진입 허가 ✓</span>
          </div>
          <p className="text-amber-700 text-sm mb-4 leading-relaxed">
            {correctCount}문제 정답으로 관문을 통과했습니다!<br />
            <strong className="text-amber-900">{toLevel}</strong> 단계로 진입합니다.
          </p>

          {/* 보상 */}
          <div className="bg-yellow-100 border border-yellow-300 rounded-2xl px-4 py-3 mb-5">
            <p className="text-xs font-bold text-yellow-700 mb-2">🏆 통과 보너스</p>
            <div className="flex items-center justify-center gap-4 text-sm font-bold text-yellow-800">
              <span>✨ +300 XP</span>
            </div>
          </div>

          <button
            onClick={onPass}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-95 text-white font-bold rounded-2xl py-4 text-base shadow-lg transition-all duration-200"
          >
            {toLevel} 시작하기 🚀
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 렌더 — RESULT FAIL
  // ════════════════════════════════════════════════════════════
  if (phase === 'result-fail') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-red-50 to-orange-50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-red-300">
          <div className="text-6xl mb-3">😔</div>
          <h2 className="text-2xl font-bold text-red-800 mb-1">관문 미통과</h2>
          <div className="inline-flex items-center gap-2 bg-red-100 rounded-full px-4 py-1.5 mb-4">
            <span className="text-red-700 font-semibold text-sm">
              {correctCount} / {GATE_QUESTION_COUNT} 정답
            </span>
            <span className="text-red-400">(통과 기준: {PASS_THRESHOLD}개)</span>
          </div>
          <p className="text-red-700 text-sm mb-5 leading-relaxed">
            아직 준비가 더 필요합니다.<br />
            <strong className="text-red-900">{fromLevel}</strong> 단계에서 더 연습해 보세요.
          </p>

          {/* 학습 팁 */}
          {selectedCategory && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs font-bold text-amber-700 mb-1">📖 학습 팁</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                {HAKDANGS.find((h) => h.id === selectedCategory)?.name}에서 더 많이 연습하면
                다음 도전에서 통과할 수 있어요!
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onFail}
              className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold rounded-xl py-3 text-sm transition-all"
            >
              계속 연습
            </button>
            <button
              onClick={() => {
                // 재도전 — 상태 초기화
                setPhase('intro');
                setSelectedCategory(null);
                setQuestions([]);
                setQuestionIndex(0);
                setCorrectCount(0);
                setWrongCount(0);
                setChosenAnswer(null);
                setShowFeedback(false);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold rounded-xl py-3 text-sm shadow transition-all"
            >
              다시 도전 🔄
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
