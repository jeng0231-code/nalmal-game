import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface WordPuzzleGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

function genSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
}

type Phase = 'ready' | 'showing' | 'input' | 'correct' | 'wrong' | 'done';

const WordPuzzleGame: FC<WordPuzzleGameProps> = ({ onComplete, level = 1 }) => {
  const seqLength  = level <= 3 ? 4 : level <= 6 ? 5 : 6;
  const showMs     = level <= 3 ? 2500 : level <= 6 ? 2000 : 1500;
  const MAX_TRIES  = 3;

  const [phase, setPhase]       = useState<Phase>('ready');
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput]       = useState<number[]>([]);
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(showMs / 1000);
  const [attempts, setAttempts] = useState(0);   // total rounds tried

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqRef   = useRef<number[]>([]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRound = useCallback(() => {
    const seq = genSequence(seqLength);
    seqRef.current = seq;
    setSequence(seq);
    setInput([]);
    setTimeLeft(showMs / 1000);
    setPhase('showing');

    // Countdown while showing
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setPhase('input');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [seqLength, showMs]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  const handleNumberPress = useCallback((num: number) => {
    if (phase !== 'input') return;

    setInput(prev => {
      const next = [...prev, num];

      if (next.length < seqRef.current.length) return next;

      // Full sequence entered — evaluate
      const isCorrect = next.every((n, i) => n === seqRef.current[i]);
      setAttempts(a => a + 1);

      if (isCorrect) {
        const timeBonus = Math.round(showMs / 100);
        setScore(s => s + 200 + timeBonus);
        setPhase('correct');
        setTimeout(() => {
          setTriesLeft(MAX_TRIES);
          startRound();
        }, 900);
      } else {
        setScore(s => Math.max(0, s - 100));
        setTriesLeft(t => {
          const remaining = t - 1;
          if (remaining <= 0) {
            setPhase('done');
          } else {
            setPhase('wrong');
            setTimeout(() => startRound(), 1000);
          }
          return remaining;
        });
      }

      return next;
    });
  }, [phase, showMs, startRound]);

  const handleDelete = useCallback(() => {
    if (phase !== 'input') return;
    setInput(prev => prev.slice(0, -1));
  }, [phase]);

  // ── Ready Screen ──────────────────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl animate-bounce">🔢</div>
        <h2 className="text-2xl font-black text-joseon-dark">숫자 기억 게임</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-4 text-sm text-joseon-brown text-center max-w-xs">
          <p className="font-bold mb-2">게임 방법</p>
          <p>숫자 배열을 기억했다가<br/>순서대로 입력하세요!</p>
          <div className="mt-3 flex justify-center gap-3 text-xs opacity-70">
            <span>🔢 숫자 {seqLength}개</span>
            <span>⏱ {showMs / 1000}초 표시</span>
            <span>💔 {MAX_TRIES}회 도전</span>
          </div>
        </div>
        <button onClick={startRound} className="btn-joseon px-10 py-4 text-lg">
          시작!
        </button>
      </div>
    );
  }

  // ── Done Screen ───────────────────────────────────────────────────────────
  if (phase === 'done') {
    const coins = Math.max(3, Math.round(score / 40));
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">{score >= 600 ? '🏆' : score >= 300 ? '🎉' : '😅'}</div>
        <h2 className="text-2xl font-black text-joseon-dark">게임 종료!</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-blue-600">{attempts}</div>
            <div className="text-xs text-blue-700">도전 횟수</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-joseon-red">{score}</div>
            <div className="text-xs text-joseon-brown">최종 점수</div>
          </div>
        </div>
        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coins}개 획득!</p>
        <button onClick={() => onComplete(coins)} className="btn-joseon px-10 py-4 text-lg mt-1">
          완료! →
        </button>
      </div>
    );
  }

  // ── Game Screen ───────────────────────────────────────────────────────────
  const isShowing = phase === 'showing';
  const isInput   = phase === 'input';
  const isCorrect = phase === 'correct';
  const isWrong   = phase === 'wrong';

  return (
    <div className="flex flex-col items-center gap-4 p-3">
      {/* 상단 정보 */}
      <div className="flex justify-between items-center w-full max-w-sm">
        <span className="bg-joseon-gold/20 px-3 py-1 rounded-full text-xs font-bold text-joseon-dark">
          🏆 {score}점
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${
          isCorrect ? 'bg-green-100 text-green-700' :
          isWrong   ? 'bg-red-100 text-red-600' :
          isShowing ? 'bg-blue-100 text-blue-700 animate-pulse' :
          'bg-gray-100 text-gray-600'
        }`}>
          {isCorrect ? '✅ 정답!' :
           isWrong   ? '❌ 틀렸어요!' :
           isShowing ? `👀 기억하세요 (${timeLeft}s)` :
           `✏️ ${input.length}/${seqLength} 입력`}
        </span>
        <span className="flex gap-0.5">
          {Array.from({ length: MAX_TRIES }).map((_, i) => (
            <span key={i} className={`text-base ${i < triesLeft ? 'opacity-100' : 'opacity-20'}`}>
              💔
            </span>
          ))}
        </span>
      </div>

      {/* 숫자 표시 영역 */}
      <div className={`w-full max-w-sm rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all ${
        isShowing ? 'bg-joseon-dark border-joseon-gold' :
        isCorrect ? 'bg-green-50 border-green-400' :
        isWrong   ? 'bg-red-50 border-red-400' :
        'bg-white border-joseon-brown/30'
      }`}>
        {isShowing ? (
          <>
            <p className="text-xs text-joseon-gold/70">이 숫자를 기억하세요!</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {sequence.map((n, i) => (
                <span
                  key={i}
                  className="text-5xl font-black text-joseon-gold drop-shadow-lg tabular-nums"
                >
                  {n}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-joseon-brown/60">
              {isInput ? '기억한 순서대로 입력하세요' :
               isCorrect ? '정확하게 기억했어요!' :
               isWrong ? `정답: ${seqRef.current.join(' - ')}` : ''}
            </p>
            {/* 입력 진행 표시 */}
            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({ length: seqLength }).map((_, i) => (
                <div
                  key={i}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-black border-2 transition-all ${
                    input[i] != null
                      ? isCorrect
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : isWrong
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : 'bg-joseon-gold/20 border-joseon-gold text-joseon-dark'
                      : i === input.length
                      ? 'bg-white border-joseon-brown animate-pulse'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  {input[i] != null ? input[i] : ''}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 숫자 버튼 패드 */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberPress(num)}
            disabled={!isInput || input.length >= seqLength}
            className={`py-4 rounded-xl text-2xl font-black border-2 transition-all select-none ${
              isInput && input.length < seqLength
                ? 'bg-white border-joseon-brown/40 text-joseon-dark hover:bg-joseon-gold/10 hover:border-joseon-gold active:scale-95 cursor-pointer'
                : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* 지우기 버튼 */}
      {isInput && (
        <button
          onClick={handleDelete}
          disabled={input.length === 0}
          className="px-6 py-2 rounded-xl text-sm font-bold border-2 border-joseon-brown/30 text-joseon-brown bg-white hover:bg-red-50 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← 지우기
        </button>
      )}
    </div>
  );
};

export default WordPuzzleGame;
