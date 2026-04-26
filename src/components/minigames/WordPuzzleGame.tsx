import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface WordPuzzleGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

// ─── 레벨별 표시 시간 (자리수와 무관) ──────────────────────────────────────
function getShowMs(level: number): number {
  if (level <= 2) return 3500;
  if (level <= 4) return 3000;
  if (level <= 6) return 2500;
  if (level <= 8) return 2000;
  return 1500;
}

// ─── 라운드별 자리수 (항상 3자리부터 시작, 라운드마다 증가) ──────────────
function getDigitsForRound(round: number): number {
  if (round <= 1) return 3; // 1~2라운드: 3자리
  if (round <= 3) return 4; // 3~4라운드: 4자리
  return 5;                  // 5라운드: 5자리
}

const TOTAL_ROUNDS = 5; // 항상 5라운드

function genSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
}

type Phase = 'ready' | 'showing' | 'input' | 'feedback' | 'done';

const WordPuzzleGame: FC<WordPuzzleGameProps> = ({ onComplete, level = 1 }) => {
  const showMs = getShowMs(level);

  const [phase, setPhase]         = useState<Phase>('ready');
  const [round, setRound]         = useState(0);          // 현재 라운드 (0-indexed → 표시는 +1)
  const [sequence, setSequence]   = useState<number[]>([]);
  const [input, setInput]         = useState<number[]>([]);
  const [results, setResults]     = useState<boolean[]>([]); // 각 라운드 정오답
  const [lastCorrect, setLastCorrect] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(showMs / 1000);
  const [score, setScore]         = useState(0);
  const [currentDigits, setCurrentDigits] = useState(3);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqRef   = useRef<number[]>([]);
  const showStartRef = useRef<number>(0);
  const digitsRef = useRef<number>(3);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── 라운드 시작 ──────────────────────────────────────────
  const startRound = useCallback((roundIdx: number) => {
    const digits = getDigitsForRound(roundIdx);
    digitsRef.current = digits;
    setCurrentDigits(digits);
    const seq = genSequence(digits);
    seqRef.current = seq;
    setSequence(seq);
    setInput([]);
    setTimeLeft(showMs / 1000);
    showStartRef.current = Date.now();
    setPhase('showing');

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTimer();
          setPhase('input');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [showMs, clearTimer]);

  // ── 숫자 버튼 누르기 ──────────────────────────────────────
  const handleNumberPress = useCallback((num: number) => {
    if (phase !== 'input') return;

    setInput(prev => {
      const next = [...prev, num];
      if (next.length < digitsRef.current) return next;

      // 마지막 숫자 입력 → 즉시 판정
      clearTimer();
      const correct = next.every((n, i) => n === seqRef.current[i]);
      setLastCorrect(correct);

      // 점수 계산 — 정답이면 시간 보너스 포함
      if (correct) {
        const elapsed = Date.now() - showStartRef.current;
        const maxTime = showMs + 10000; // showMs + 입력 최대 10초
        const timeFactor = Math.max(0, 1 - elapsed / maxTime);
        const gained = Math.round(100 + timeFactor * 100); // 100~200점
        setScore(s => s + gained);
      }

      setResults(r => [...r, correct]);
      setPhase('feedback');

      return next;
    });
  }, [phase, clearTimer, showMs]);

  // ── 피드백 후 다음 라운드 or 종료 ────────────────────────
  useEffect(() => {
    if (phase !== 'feedback') return;
    const nextRound = round + 1;
    const timer = setTimeout(() => {
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('done');
      } else {
        setRound(nextRound);
        startRound(nextRound);
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [phase, round, startRound]);

  const handleDelete = useCallback(() => {
    if (phase !== 'input') return;
    setInput(prev => prev.slice(0, -1));
  }, [phase]);

  // ── Ready Screen ──────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl animate-bounce">🔢</div>
        <h2 className="text-2xl font-black text-joseon-dark">숫자 기억 게임</h2>

        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-2xl p-4 text-sm text-joseon-brown text-center max-w-xs w-full">
          <p className="font-bold mb-3 text-base text-joseon-dark">게임 방법</p>
          <div className="space-y-1.5 text-left">
            <p>① 숫자가 <strong>{showMs / 1000}초</strong> 동안 화면에 표시됩니다</p>
            <p>② 사라지면 순서대로 입력하세요</p>
            <p>③ 총 <strong>{TOTAL_ROUNDS}라운드</strong>를 마치면 완료!</p>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xs font-bold">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">🔢 3→4→5자리</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">🏁 {TOTAL_ROUNDS}라운드</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg">⏱ {showMs / 1000}초 표시</span>
          </div>
          <p className="mt-3 text-xs text-joseon-brown/60">1~2라운드: 3자리 · 3~4라운드: 4자리 · 5라운드: 5자리</p>
        </div>

        <button onClick={() => { setRound(0); startRound(0); }} className="btn-joseon px-10 py-4 text-lg">
          시작! 🚀
        </button>
      </div>
    );
  }

  // ── Done Screen ───────────────────────────────────────────
  if (phase === 'done') {
    const correctCount = results.filter(Boolean).length;
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const coins = Math.max(3, Math.round(score / 40));
    const emoji = correctCount === TOTAL_ROUNDS ? '🏆' : correctCount >= 3 ? '🎉' : correctCount >= 2 ? '👏' : '💪';

    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">{emoji}</div>
        <h2 className="text-2xl font-black text-joseon-dark">
          {correctCount === TOTAL_ROUNDS ? '완벽해요!' : `${correctCount}/${TOTAL_ROUNDS} 라운드 성공!`}
        </h2>

        {/* 라운드별 결과 */}
        <div className="flex gap-2 justify-center">
          {results.map((ok, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${
              ok ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'
            }`}>
              {ok ? '✅' : '❌'}
            </div>
          ))}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-xl font-black text-green-600">{correctCount}</div>
            <div className="text-[10px] text-green-700">정답</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3">
            <div className="text-xl font-black text-joseon-red">{accuracy}%</div>
            <div className="text-[10px] text-joseon-brown">정확도</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xl font-black text-blue-600">{score}</div>
            <div className="text-[10px] text-blue-700">점수</div>
          </div>
        </div>

        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coins}개 획득!</p>
        <button onClick={() => onComplete(coins)} className="btn-joseon px-10 py-4 text-lg mt-1">
          완료! →
        </button>
      </div>
    );
  }

  // ── Game Screen ───────────────────────────────────────────
  const isShowing  = phase === 'showing';
  const isInput    = phase === 'input';
  const isFeedback = phase === 'feedback';

  return (
    <div className="flex flex-col items-center gap-3 p-3">

      {/* ── 라운드 진행 표시 ── */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-bold text-joseon-dark">
            라운드 <span className="text-joseon-red text-base">{round + 1}</span> / {TOTAL_ROUNDS}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-orange-600 bg-gray-100">
            {currentDigits}자리
          </span>
        </div>
        {/* 진행 도트 */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              i < results.length
                ? results[i] ? 'bg-green-400' : 'bg-red-400'
                : i === round
                ? 'bg-joseon-gold animate-pulse'
                : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* ── 상태 표시 ── */}
      <div className={`w-full max-w-sm text-center py-1.5 rounded-xl text-sm font-bold transition-all ${
        isFeedback && lastCorrect ? 'bg-green-100 text-green-700' :
        isFeedback              ? 'bg-red-100 text-red-600'   :
        isShowing               ? 'bg-blue-100 text-blue-700 animate-pulse' :
        'bg-gray-100 text-gray-600'
      }`}>
        {isFeedback && lastCorrect ? '✅ 정답! 잘 기억했어요!' :
         isFeedback               ? `❌ 오답! 정답: ${seqRef.current.join(' - ')}` :
         isShowing                ? `👀 숫자를 기억하세요! (${timeLeft}초)` :
         `✏️ 순서대로 입력하세요 (${input.length}/${currentDigits})`}
      </div>

      {/* ── 숫자 표시 영역 ── */}
      <div className={`w-full max-w-sm rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
        isShowing               ? 'bg-joseon-dark border-joseon-gold shadow-lg' :
        isFeedback && lastCorrect ? 'bg-green-50 border-green-400' :
        isFeedback              ? 'bg-red-50 border-red-400' :
        'bg-white border-joseon-brown/30'
      }`}>
        {isShowing ? (
          <div className="flex gap-2 flex-wrap justify-center">
            {sequence.map((n, i) => (
              <span key={i} className="text-5xl font-black text-joseon-gold drop-shadow-lg tabular-nums min-w-[2rem] text-center">
                {n}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: currentDigits }).map((_, i) => (
              <div
                key={i}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-black border-2 transition-all ${
                  input[i] != null
                    ? isFeedback && lastCorrect
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : isFeedback
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-joseon-gold/20 border-joseon-gold text-joseon-dark'
                    : i === input.length && isInput
                    ? 'bg-white border-joseon-brown animate-pulse'
                    : 'bg-gray-100 border-gray-200 text-gray-300'
                }`}
              >
                {input[i] != null ? input[i] : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 숫자 버튼 패드 ── */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberPress(num)}
            disabled={!isInput || input.length >= currentDigits}
            className={`py-4 rounded-xl text-2xl font-black border-2 transition-all select-none ${
              isInput && input.length < currentDigits
                ? 'bg-white border-joseon-brown/40 text-joseon-dark hover:bg-joseon-gold/10 hover:border-joseon-gold active:scale-95 active:bg-joseon-gold/20 cursor-pointer'
                : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* ── 지우기 버튼 ── */}
      {isInput && (
        <button
          onClick={handleDelete}
          disabled={input.length === 0}
          className="px-8 py-2 rounded-xl text-sm font-bold border-2 border-red-300 text-red-500 bg-white hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← 지우기
        </button>
      )}

      {/* ── 점수 표시 ── */}
      <div className="flex items-center gap-2 text-xs text-joseon-brown">
        <span>🏆 현재 점수:</span>
        <span className="font-black text-joseon-red">{score}점</span>
        <span className="text-gray-400">|</span>
        <span>정답 {results.filter(Boolean).length}/{results.length}</span>
      </div>
    </div>
  );
};

export default WordPuzzleGame;
