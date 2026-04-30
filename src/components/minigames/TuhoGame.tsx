import { useState, useEffect, useRef, useCallback } from 'react';

interface TuhoGameProps {
  onComplete: (score: number) => void;
}

const TOTAL_ARROWS = 8;
const SPEED = 1.5;

export default function TuhoGame({ onComplete }: TuhoGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [power, setPower] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [throwing, setThrowing] = useState(false);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const [jarShake, setJarShake] = useState(false);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number; tx: string; ty: string; dur: string; color: string;
  }>>([]);

  const powerRef = useRef(0);
  const dirRef = useRef(1);
  const rafRef = useRef<number>(0);
  const playingRef = useRef(false);
  const resultsRef = useRef<boolean[]>([]);
  const arrowRef = useRef<HTMLDivElement>(null);

  const tick = useCallback(() => {
    if (!playingRef.current) return;
    powerRef.current += dirRef.current * SPEED;
    if (powerRef.current >= 100) { powerRef.current = 100; dirRef.current = -1; }
    if (powerRef.current <= 0)   { powerRef.current = 0;   dirRef.current =  1; }
    setPower(Math.round(powerRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startAnim = useCallback(() => {
    playingRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopAnim = useCallback(() => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (phase === 'playing') startAnim();
    return stopAnim;
  }, [phase, startAnim, stopAnim]);

  // 화살 날아가는 애니메이션 (DOM 직접 제어 - CSS transition 강제)
  const animateArrow = useCallback((targetPercent: number) => {
    const el = arrowRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.left = '10%';
    el.getBoundingClientRect(); // force reflow
    el.style.transition = 'left 0.55s ease-out';
    el.style.left = `${targetPercent}%`;
  }, []);

  const handleThrow = useCallback(() => {
    if (throwing) return;
    stopAnim();

    const p = powerRef.current;
    // 중심(50)에서의 편차 → 명중 확률 계산 (명중구간 없음)
    const deviation = Math.abs(p - 50);
    const hitChance = 0.08 + 0.62 * Math.pow(1 - deviation / 50, 1.8);
    const hit = Math.random() < hitChance;

    setThrowing(true);
    setArrowVisible(true);
    setFeedback(null);

    // 화살 날아가기 시작
    setTimeout(() => animateArrow(hit ? 67 : 93), 20);

    // 결과 표시 (화살 도착 후)
    setTimeout(() => {
      setFeedback(hit ? 'hit' : 'miss');
      if (hit) {
        setJarShake(true);
        setTimeout(() => setJarShake(false), 500);
        // 🎇 명중 파티클
        const COLORS = ['#F39C12','#27AE60','#E74C3C','#F1C40F','#FF69B4','#00CED1'];
        const newParticles = Array.from({ length: 12 }, (_, i) => ({
          id: Date.now() + i,
          tx: `${(Math.random() - 0.5) * 90}px`,
          ty: `${-(Math.random() * 55 + 15)}px`,
          dur: `${0.4 + Math.random() * 0.35}s`,
          color: COLORS[i % COLORS.length],
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 850);
      }
    }, 600);

    // 다음 화살 준비
    setTimeout(() => {
      const newResults = [...resultsRef.current, hit];
      resultsRef.current = newResults;
      setResults(newResults);
      setFeedback(null);
      setArrowVisible(false);
      setThrowing(false);

      if (newResults.length >= TOTAL_ARROWS) {
        setPhase('result');
      } else {
        setTimeout(() => {
          powerRef.current = 0;
          dirRef.current = 1;
          startAnim();
        }, 250);
      }
    }, 1300);
  }, [throwing, stopAnim, startAnim, animateArrow]);

  const hitCount = results.filter(Boolean).length;
  const score = Math.round((hitCount / TOTAL_ARROWS) * 100);
  const accuracy = Math.round((0.08 + 0.62 * Math.pow(1 - Math.abs(power - 50) / 50, 1.8)) * 100);
  const isGood = power >= 35 && power <= 65;

  /* ── 준비 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl">🏺</div>
        <h2 className="text-2xl font-black text-joseon-dark">투호 놀이</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs space-y-2">
          <p>파워 바의 🏹를 잘 보세요!</p>
          <p>
            <span className="text-green-600 font-bold">중앙(50) 근처</span>에서 던질수록<br />
            항아리에 들어갈 확률이 높아요!
          </p>
          <p className="text-joseon-red font-bold">
            화살 {TOTAL_ARROWS}개로 최대한 많이 명중!
          </p>
        </div>
        <button onClick={() => setPhase('playing')} className="btn-joseon px-10 py-4 text-lg">
          시작! 🏹
        </button>
      </div>
    );
  }

  /* ── 결과 ── */
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">
          {hitCount >= 6 ? '🏆' : hitCount >= 4 ? '🥈' : hitCount >= 2 ? '🥉' : '😅'}
        </div>
        <h3 className="text-2xl font-black text-joseon-dark">
          {TOTAL_ARROWS}개 중 {hitCount}개 명중!
        </h3>
        <div className="flex gap-1 text-2xl flex-wrap justify-center">
          {results.map((hit, i) => <span key={i}>{hit ? '✅' : '❌'}</span>)}
        </div>
        <p className="text-joseon-brown text-sm">
          {hitCount >= 7 ? '완벽! 조선 최고의 투호 장인!' :
           hitCount >= 5 ? '훌륭해요! 상당한 실력이에요!' :
           hitCount >= 3 ? '좋아요! 연습하면 더 잘할 수 있어요!' :
           '다음엔 중앙(50%)에서 던져보세요!'}
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

  /* ── 게임 ── */
  return (
    <div className="flex flex-col items-center gap-4 p-4">

      {/* 투호 장면 */}
      <div
        className="relative w-full rounded-2xl border-2 border-joseon-brown overflow-hidden select-none"
        style={{ height: 168 }}
      >
        {/* 하늘 */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50" />
        {/* 땅 */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-amber-200 border-t-2 border-amber-400" />
        <div className="absolute bottom-10 left-0 right-0 h-2 bg-green-300/50" />

        {/* 구름 */}
        <div className="absolute top-3 left-8 text-xl opacity-40">☁️</div>
        <div className="absolute top-5 right-16 text-base opacity-30">☁️</div>

        {/* 투호꾼 */}
        <div className="absolute bottom-8 left-5 text-4xl">
          {throwing ? '🏃' : '🧑‍🌾'}
        </div>

        {/* 날아가는 화살 (DOM ref 사용) */}
        {arrowVisible && (
          <div
            ref={arrowRef}
            className="absolute text-2xl pointer-events-none"
            style={{ bottom: '48px', left: '10%', transform: 'rotate(-20deg)' }}
          >
            🏹
          </div>
        )}

        {/* 항아리 (명중 시 흔들림) */}
        <div
          className={`absolute bottom-8 right-8 text-5xl transition-transform ${jarShake ? 'animate-bounce' : ''}`}
        >
          🏺
        </div>

        {/* 항아리에 꽂힌 화살 */}
        {hitCount > 0 && (
          <div className="absolute bottom-[58px] right-9 flex gap-0.5">
            {Array(Math.min(hitCount, 5)).fill(null).map((_, i) => (
              <span key={i} className="text-xs leading-none" style={{ transform: 'rotate(160deg)' }}>🏹</span>
            ))}
          </div>
        )}

        {/* 🎇 명중 파티클 */}
        {particles.map(p => (
          <div
            key={p.id}
            className="particle rounded-full pointer-events-none"
            style={{
              position: 'absolute',
              width: 8, height: 8,
              background: p.color,
              right: 44,
              bottom: 44,
              boxShadow: `0 0 6px ${p.color}`,
              '--tx': p.tx,
              '--ty': p.ty,
              '--dur': p.dur,
            } as React.CSSProperties}
          />
        ))}

        {/* 명중/빗나감 피드백 */}
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-2xl font-black px-4 py-2 rounded-xl border-2 shadow-lg ${
              feedback === 'hit'
                ? 'bg-green-100 text-green-700 border-green-400'
                : 'bg-red-100 text-red-600 border-red-400'
            }`}>
              {feedback === 'hit' ? '🎯 명중!' : '💨 빗나감!'}
            </div>
          </div>
        )}

        {/* 화살 카운터 (우상단) */}
        <div className="absolute top-2 right-2 flex gap-0.5 flex-wrap justify-end max-w-[140px]">
          {Array.from({ length: TOTAL_ARROWS }).map((_, i) => (
            <span key={i} className={`text-base ${
              i < results.length
                ? results[i] ? 'opacity-100' : 'opacity-20'
                : 'opacity-60'
            }`}>
              {i < results.length ? (results[i] ? '🏹' : '✖️') : '🏹'}
            </span>
          ))}
        </div>
      </div>

      {/* 파워 바 */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-joseon-brown font-medium">힘 조절 (중앙이 유리해요)</span>
          <span className={`font-bold ${isGood ? 'text-green-600' : 'text-orange-500'}`}>
            명중 확률 {accuracy}%
          </span>
        </div>
        <div
          className="relative h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-joseon-brown cursor-pointer"
          onClick={!throwing ? handleThrow : undefined}
        >
          {/* 중앙 안내선 */}
          <div
            className="absolute top-2 bottom-2 w-1 bg-green-500/50 rounded-full"
            style={{ left: 'calc(50% - 2px)' }}
          />

          {/* 파워 인디케이터 */}
          <div
            className="absolute top-1 bottom-1 w-9 rounded-full flex items-center justify-center text-xl shadow-md"
            style={{
              left: `calc(${power}% - 18px)`,
              background: isGood ? '#22c55e' : '#f97316',
              transition: 'background 0.15s',
            }}
          >
            🏹
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-gray-600 drop-shadow">
              {isGood ? '⚡ 좋은 타이밍!' : '중앙을 노려라...'}
            </span>
          </div>
        </div>
      </div>

      {/* 던지기 버튼 */}
      <button
        onClick={handleThrow}
        disabled={throwing}
        className={`btn-joseon w-full max-w-xs text-xl py-4 transition-all ${
          throwing ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95'
        }`}
      >
        {throwing ? '🏹 날아가는 중...' : '🏹 던져!'}
      </button>

      {/* 명중 확률 대형 표시 */}
      <div className="text-center">
        <div className={`text-4xl font-black transition-colors ${
          accuracy >= 60 ? 'text-green-600' : accuracy >= 40 ? 'text-orange-500' : 'text-gray-400'
        }`}>
          {accuracy}%
        </div>
        <div className="text-xs text-joseon-brown">현재 명중 확률</div>
      </div>

    </div>
  );
}
