import { useState, useEffect, useRef, useCallback } from 'react';

interface JegiGameProps {
  onComplete: (score: number) => void;
}

const GAME_TIME = 15;
const GRAVITY = 0.25;       // 중력 가속도 (낮을수록 천천히 떨어짐)
const KICK_POWER = -7;      // 차올리는 힘
const GROUND_Y = 75;        // 바닥 위치 (%)
const CEILING_Y = 5;        // 천장 위치 (%)

export default function JegiGame({ onComplete }: JegiGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [jegiY, setJegiY] = useState(GROUND_Y);
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [kickFlash, setKickFlash] = useState(false);
  const [missFlash, setMissFlash] = useState(false);

  // 물리 상태를 ref로 관리 (re-render와 분리)
  const yRef = useRef(GROUND_Y);
  const velRef = useRef(0);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  const countRef = useRef(0);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const physicsLoop = useCallback(() => {
    if (!activeRef.current) return;

    velRef.current += GRAVITY;
    yRef.current = Math.min(GROUND_Y, Math.max(CEILING_Y, yRef.current + velRef.current));

    // 바닥 충돌 → 멈춤 (제기가 바닥에 닿은 상태)
    if (yRef.current >= GROUND_Y) {
      yRef.current = GROUND_Y;
      velRef.current = 0;
    }

    setJegiY(yRef.current);
    rafRef.current = requestAnimationFrame(physicsLoop);
  }, []);

  const startGame = useCallback(() => {
    yRef.current = GROUND_Y;
    velRef.current = 0;
    countRef.current = 0;
    activeRef.current = true;
    setJegiY(GROUND_Y);
    setCount(0);
    setTimeLeft(GAME_TIME);
    setPhase('playing');

    // 물리 루프 시작
    rafRef.current = requestAnimationFrame(physicsLoop);

    // 타이머
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopAll();
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [physicsLoop, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  const kick = useCallback(() => {
    if (!activeRef.current) return;

    // 제기가 바닥 근처(하단 25%) 있을 때만 차기 가능
    if (yRef.current >= GROUND_Y - 20) {
      velRef.current = KICK_POWER;
      countRef.current += 1;
      setCount(countRef.current);
      setKickFlash(true);
      setTimeout(() => setKickFlash(false), 150);
    } else {
      // 너무 높이 있을 때 탭 → miss 표시
      setMissFlash(true);
      setTimeout(() => setMissFlash(false), 300);
    }
  }, []);

  const score = Math.min(100, count * 7);

  /* ── 준비 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl animate-float">🪶</div>
        <h2 className="text-2xl font-black text-joseon-dark">제기차기</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs">
          제기가 <span className="text-joseon-red font-bold">바닥 근처</span>로 내려올 때<br />
          화면 아무 곳이나 눌러서 차올리세요!<br />
          <span className="text-blue-600 font-bold">15초</span> 동안 최대한 많이 차기!
        </div>
        <button onClick={startGame} className="btn-joseon px-10 py-4 text-lg">
          시작! 🦵
        </button>
      </div>
    );
  }

  /* ── 결과 ── */
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">
          {count >= 20 ? '🏆' : count >= 10 ? '🥈' : count >= 5 ? '🥉' : '😅'}
        </div>
        <h3 className="text-2xl font-black text-joseon-dark">{count}번 찼어요!</h3>
        <p className="text-joseon-brown text-sm">
          {count >= 20 ? '놀라워요! 조선 최고의 제기 선수!' :
           count >= 10 ? '잘했어요! 꽤 실력이 있는데요?' :
           count >= 5  ? '좋아요! 연습하면 더 잘할 수 있어요!' :
                         '아직 연습이 필요해요. 다시 도전!'}
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
  const canKick = jegiY >= GROUND_Y - 20;

  return (
    <div
      className={`flex flex-col select-none rounded-2xl overflow-hidden border-2 border-joseon-brown
        ${kickFlash ? 'bg-green-100' : missFlash ? 'bg-red-100' : 'bg-gradient-to-b from-sky-200 to-green-200'}`}
      style={{ height: 380 }}
      onClick={kick}
    >
      {/* 상단 HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/20">
        <div className="bg-white/80 rounded-lg px-3 py-1 font-bold text-joseon-dark text-sm">
          ⏱️ {timeLeft}초
        </div>
        <div className="bg-joseon-gold/90 rounded-lg px-3 py-1 font-bold text-white text-sm">
          🦵 {count}번
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="flex-1 relative">
        {/* 구름 배경 */}
        <div className="absolute top-2 left-4 text-2xl opacity-40">☁️</div>
        <div className="absolute top-4 right-6 text-xl opacity-30">☁️</div>

        {/* 제기 */}
        <div
          className="absolute text-4xl transition-none select-none"
          style={{
            top: `${jegiY}%`,
            left: '50%',
            transform: `translateX(-50%) rotate(${velRef.current * 15}deg)`,
          }}
        >
          🪶
        </div>

        {/* 발 차기 가능 표시 */}
        {canKick && (
          <div
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
            style={{ top: `${GROUND_Y - 18}%` }}
          >
            <span className="text-xs text-green-700 font-bold bg-green-200/80 rounded-full px-2 py-0.5 animate-bounce">
              👇 지금 차!
            </span>
          </div>
        )}

        {/* 킥 효과 */}
        {kickFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-green-600 animate-bounce-in">💥 {count}</span>
          </div>
        )}

        {/* 실패 효과 */}
        {missFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl text-red-500 font-bold">너무 높아요!</span>
          </div>
        )}
      </div>

      {/* 바닥 */}
      <div className="h-14 bg-green-400 flex items-center justify-center gap-2 border-t-4 border-green-600">
        <span className="text-2xl">👟</span>
        <span className="text-green-800 text-sm font-bold">
          {canKick ? '화면을 눌러 차올리세요!' : '제기가 내려오길 기다려요...'}
        </span>
      </div>
    </div>
  );
}
