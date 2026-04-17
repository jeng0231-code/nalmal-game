import { useState, useEffect, useRef } from 'react';

interface TuhoGameProps {
  onComplete: (score: number) => void;
}

const TOTAL_ARROWS = 5;
const SWEET_MIN = 35;
const SWEET_MAX = 65;
const SPEED = 1.2; // 파워바 이동 속도

export default function TuhoGame({ onComplete }: TuhoGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [power, setPower] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);   // true=명중, false=빗나감
  const [throwing, setThrowing] = useState(false);
  const [_arrowPos, setArrowPos] = useState<number | null>(null); // 던진 순간 파워값 표시용

  const powerRef = useRef(0);
  const dirRef = useRef(1);
  const rafRef = useRef<number>(0);
  const playingRef = useRef(false);

  // 애니메이션 루프 (ref만 사용 → stale closure 없음)
  const tick = () => {
    if (!playingRef.current) return;
    powerRef.current += dirRef.current * SPEED;
    if (powerRef.current >= 100) { powerRef.current = 100; dirRef.current = -1; }
    if (powerRef.current <= 0)   { powerRef.current = 0;   dirRef.current =  1; }
    setPower(Math.round(powerRef.current));
    rafRef.current = requestAnimationFrame(tick);
  };

  const startAnim = () => {
    playingRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAnim = () => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    if (phase === 'playing') startAnim();
    return stopAnim;
  }, [phase]);

  const handleThrow = () => {
    if (throwing) return;
    stopAnim();

    const p = powerRef.current;
    const hit = p >= SWEET_MIN && p <= SWEET_MAX;
    setArrowPos(p);
    setThrowing(true);

    setTimeout(() => {
      const newResults = [...results, hit];
      setResults(newResults);
      setArrowPos(null);
      setThrowing(false);

      if (newResults.length >= TOTAL_ARROWS) {
        setPhase('result');
      } else {
        // 다음 화살 – 잠깐 멈췄다가 재개
        setTimeout(() => { powerRef.current = 0; dirRef.current = 1; startAnim(); }, 200);
      }
    }, 700);
  };

  const hitCount = results.filter(Boolean).length;
  const score = hitCount * 20;

  /* ── 준비 화면 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl animate-float">🏺</div>
        <h2 className="text-2xl font-black text-joseon-dark">투호 놀이</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs">
          파워 바가 <span className="text-green-600 font-bold">초록 구간</span>에 들어올 때<br />
          화면을 눌러 화살을 던지세요!<br />
          <span className="text-joseon-red font-bold">화살 5개</span> 중 많이 맞힐수록 엽전 ↑
        </div>
        <button onClick={() => setPhase('playing')} className="btn-joseon px-10 py-4 text-lg">
          시작! 🏹
        </button>
      </div>
    );
  }

  /* ── 결과 화면 ── */
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">{hitCount >= 4 ? '🏆' : hitCount >= 2 ? '🥈' : '😅'}</div>
        <h3 className="text-2xl font-black text-joseon-dark">{TOTAL_ARROWS}개 중 {hitCount}개 명중!</h3>
        <div className="flex gap-2 text-3xl">
          {results.map((hit, i) => <span key={i}>{hit ? '🏹' : '💨'}</span>)}
        </div>
        <p className="text-joseon-brown text-sm">
          {hitCount === TOTAL_ARROWS ? '완벽! 조선 최고의 궁사!' :
           hitCount >= 3 ? '훌륭해요! 조금만 더 연습하면 완벽!' :
           '다음엔 더 잘할 수 있어요!'}
        </p>
        <div className="card-joseon p-3 font-bold text-joseon-dark">
          획득 엽전: 🪙 {score}개
        </div>
        <button onClick={() => onComplete(score)} className="btn-joseon px-10 py-4">
          계속하기 →
        </button>
      </div>
    );
  }

  /* ── 게임 화면 ── */
  const inZone = power >= SWEET_MIN && power <= SWEET_MAX;

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* 항아리 + 남은 화살 */}
      <div className="flex items-end gap-6 justify-center">
        <div className="text-6xl relative">
          🏺
          {results.filter(Boolean).length > 0 && (
            <span className="absolute -top-3 left-1 text-xl">
              {'🏹'.repeat(results.filter(Boolean).length)}
            </span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {Array.from({ length: TOTAL_ARROWS }).map((_, i) => (
            <span key={i} className={`text-2xl transition-all ${
              i < results.length ? (results[i] ? 'opacity-30' : 'opacity-20') : 'opacity-100'
            }`}>
              {i < results.length ? (results[i] ? '✅' : '❌') : '🏹'}
            </span>
          ))}
        </div>
      </div>

      {/* 파워 바 */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-joseon-brown mb-1 font-medium">
          <span>약</span>
          <span className="text-green-600 font-bold">🎯 명중 구간</span>
          <span>강</span>
        </div>
        <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-joseon-brown cursor-pointer select-none"
          onClick={!throwing ? handleThrow : undefined}>
          {/* 명중 구간 */}
          <div
            className="absolute top-0 h-full bg-green-300/70 border-x-2 border-green-500"
            style={{ left: `${SWEET_MIN}%`, width: `${SWEET_MAX - SWEET_MIN}%` }}
          />
          {/* 🎯 파워 인디케이터 */}
          <div
            className="absolute top-1 bottom-1 w-6 rounded-full flex items-center justify-center text-sm font-bold shadow"
            style={{
              left: `calc(${power}% - 12px)`,
              background: inZone ? '#22c55e' : '#ef4444',
              transition: 'background 0.1s',
            }}
          >
            🏹
          </div>
          {/* 중앙 라벨 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-xs font-bold ${inZone ? 'text-green-700' : 'text-gray-500'}`}>
              {inZone ? '지금 던져!' : '기다려...'}
            </span>
          </div>
        </div>
      </div>

      {/* 던지기 버튼 */}
      <button
        onClick={handleThrow}
        disabled={throwing}
        className={`btn-joseon w-full max-w-xs text-xl py-5 transition-all
          ${throwing ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95'}
          ${inZone ? 'ring-4 ring-green-400 ring-offset-2' : ''}`}
      >
        {throwing ? '🏹 슝~!' : '🏹 던져!'}
      </button>

      {/* 현재 파워 수치 */}
      <div className={`text-lg font-black ${inZone ? 'text-green-600' : 'text-gray-400'}`}>
        파워: {power}%{inZone ? ' ✨' : ''}
      </div>
    </div>
  );
}
