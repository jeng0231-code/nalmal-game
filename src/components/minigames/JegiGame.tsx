import { useState, useEffect, useRef, useCallback } from 'react';

interface JegiGameProps {
  onComplete: (score: number) => void;
}

const GAME_TIME = 15;
const GRAVITY = 0.22;
const KICK_POWER = -8;
const GROUND_Y = 72;
const CEILING_Y = 8;

// 차기 판정 구간
const PERFECT_Y = GROUND_Y - 7;  // 바닥 직전 = 퍼펙트
const GOOD_Y    = GROUND_Y - 22; // 바닥 근처  = 굿

type Grade = 'perfect' | 'good' | 'miss' | null;

export default function JegiGame({ onComplete }: JegiGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [jegiY, setJegiY] = useState(GROUND_Y);
  const [jegiX, setJegiX] = useState(50); // 좌우 표류 (%)
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [combo, setCombo] = useState(0);
  const [grade, setGrade] = useState<Grade>(null);
  const [gradeKey, setGradeKey] = useState(0);
  const [bgFlash, setBgFlash] = useState<'perfect' | 'good' | 'miss' | null>(null);

  const yRef = useRef(GROUND_Y);
  const xRef = useRef(50);
  const velYRef = useRef(0);
  const velXRef = useRef(0);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  const countRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const gradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (gradeTimerRef.current) clearTimeout(gradeTimerRef.current);
  }, []);

  const physicsLoop = useCallback(() => {
    if (!activeRef.current) return;

    // 중력
    velYRef.current += GRAVITY;
    yRef.current = Math.min(GROUND_Y, Math.max(CEILING_Y, yRef.current + velYRef.current));

    // 좌우 표류 (위로 올라갈수록 흔들림 추가)
    velXRef.current += (Math.random() - 0.5) * 0.3;
    velXRef.current *= 0.97; // 감쇠
    xRef.current = Math.min(80, Math.max(20, xRef.current + velXRef.current));

    if (yRef.current >= GROUND_Y) {
      yRef.current = GROUND_Y;
      velYRef.current = 0;
      velXRef.current = 0;
    }

    setJegiY(yRef.current);
    setJegiX(xRef.current);
    rafRef.current = requestAnimationFrame(physicsLoop);
  }, []);

  const startGame = useCallback(() => {
    yRef.current = GROUND_Y;
    velYRef.current = 0;
    xRef.current = 50;
    velXRef.current = 0;
    countRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    activeRef.current = true;

    setJegiY(GROUND_Y);
    setJegiX(50);
    setCount(0);
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_TIME);
    setGrade(null);
    setPhase('playing');

    rafRef.current = requestAnimationFrame(physicsLoop);

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

  const showGrade = useCallback((g: Grade) => {
    setGrade(g);
    setGradeKey(k => k + 1);
    setBgFlash(g);
    if (gradeTimerRef.current) clearTimeout(gradeTimerRef.current);
    gradeTimerRef.current = setTimeout(() => {
      setGrade(null);
      setBgFlash(null);
    }, 500);
  }, []);

  const kick = useCallback(() => {
    if (!activeRef.current) return;

    const y = yRef.current;

    if (y >= PERFECT_Y) {
      // 퍼펙트 차기
      velYRef.current = KICK_POWER * 1.15;
      velXRef.current = (Math.random() - 0.5) * 1.5;
      countRef.current += 1;
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
      const earned = 15 * multiplier;
      scoreRef.current = Math.min(100, scoreRef.current + earned);
      setCount(countRef.current);
      setScore(scoreRef.current);
      setCombo(newCombo);
      showGrade('perfect');

    } else if (y >= GOOD_Y) {
      // 굿 차기
      velYRef.current = KICK_POWER;
      velXRef.current = (Math.random() - 0.5) * 1.2;
      countRef.current += 1;
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
      const earned = 8 * multiplier;
      scoreRef.current = Math.min(100, scoreRef.current + earned);
      setCount(countRef.current);
      setScore(scoreRef.current);
      setCombo(newCombo);
      showGrade('good');

    } else {
      // 미스 (너무 높음)
      comboRef.current = 0;
      setCombo(0);
      showGrade('miss');
    }
  }, [showGrade]);

  const finalScore = Math.min(100, scoreRef.current);
  const isKickable = jegiY >= GOOD_Y;
  const isPerfect = jegiY >= PERFECT_Y;

  const multiplier = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;

  /* ── 준비 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl">🪶</div>
        <h2 className="text-2xl font-black text-joseon-dark">제기차기</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">PERFECT</span>
            <span>바닥 직전 = 15점</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="bg-yellow-400 text-white px-2 py-0.5 rounded-full text-xs font-bold">GOOD</span>
            <span>바닥 근처 = 8점</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="bg-gray-400 text-white px-2 py-0.5 rounded-full text-xs font-bold">MISS</span>
            <span>너무 높음 = 콤보 초기화</span>
          </div>
          <p className="text-joseon-red font-bold pt-1">
            연속으로 잘 차면 2~3배 점수!
          </p>
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
          {finalScore >= 80 ? '🏆' : finalScore >= 50 ? '🥈' : finalScore >= 25 ? '🥉' : '😅'}
        </div>
        <h3 className="text-2xl font-black text-joseon-dark">{count}번 찼어요!</h3>
        <p className="text-joseon-brown text-sm">
          {finalScore >= 80 ? '완벽해요! 조선 제기차기 챔피언!' :
           finalScore >= 50 ? '훌륭해요! 연속 콤보가 대단해요!' :
           finalScore >= 25 ? '좋아요! 타이밍을 더 연습해봐요!' :
           '바닥 직전에 차야 PERFECT에요!'}
        </p>
        <div className="card-joseon p-3 font-bold text-joseon-dark">
          획득 엽전: 🪙 {finalScore}개
        </div>
        <button onClick={() => onComplete(finalScore)} className="btn-joseon px-10 py-4">
          계속하기 →
        </button>
      </div>
    );
  }

  /* ── 게임 ── */
  return (
    <div
      className={`flex flex-col select-none rounded-2xl overflow-hidden border-2 border-joseon-brown transition-colors duration-100 ${
        bgFlash === 'perfect' ? 'bg-red-100' :
        bgFlash === 'good'    ? 'bg-yellow-50' :
        bgFlash === 'miss'    ? 'bg-gray-100' :
        'bg-gradient-to-b from-sky-200 to-green-200'
      }`}
      style={{ height: 400 }}
      onClick={kick}
    >
      {/* 상단 HUD */}
      <div className="flex justify-between items-center px-3 py-2 bg-black/20 gap-2">
        <div className="bg-white/80 rounded-lg px-2 py-1 font-bold text-joseon-dark text-sm">
          ⏱️ {timeLeft}초
        </div>
        <div className="bg-white/80 rounded-lg px-2 py-1 font-bold text-joseon-dark text-sm">
          🦵 {count}번
        </div>
        {multiplier > 1 && (
          <div className={`rounded-lg px-2 py-1 font-black text-white text-sm ${
            multiplier >= 3 ? 'bg-red-500' : 'bg-orange-400'
          }`}>
            🔥 {multiplier}x 콤보!
          </div>
        )}
        <div className="bg-joseon-gold/90 rounded-lg px-2 py-1 font-bold text-white text-sm">
          🪙 {score}
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="flex-1 relative">
        {/* 구름 */}
        <div className="absolute top-2 left-6 text-2xl opacity-30">☁️</div>
        <div className="absolute top-4 right-8 text-xl opacity-25">☁️</div>

        {/* 콤보 표시 */}
        {combo >= 3 && (
          <div className="absolute top-2 right-2 text-center">
            <div className={`font-black text-2xl leading-tight ${
              combo >= 6 ? 'text-red-600' : 'text-orange-500'
            }`}>
              🔥{combo}
            </div>
            <div className="text-xs text-orange-600 font-bold">콤보!</div>
          </div>
        )}

        {/* 제기 */}
        <div
          className="absolute text-4xl select-none transition-none"
          style={{
            top: `${jegiY}%`,
            left: `${jegiX}%`,
            transform: `translateX(-50%) rotate(${velYRef.current * -12}deg)`,
          }}
        >
          🪶
        </div>

        {/* 판정 등급 표시 */}
        {grade && (
          <div
            key={gradeKey}
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
            style={{ top: `${Math.max(10, jegiY - 20)}%` }}
          >
            <span className={`text-xl font-black px-3 py-1 rounded-full animate-bounce ${
              grade === 'perfect' ? 'bg-red-500 text-white' :
              grade === 'good'    ? 'bg-yellow-400 text-white' :
              'bg-gray-400 text-white'
            }`}>
              {grade === 'perfect' ? '✨ PERFECT!' :
               grade === 'good'    ? '👍 GOOD!' :
               '😅 MISS'}
            </span>
          </div>
        )}

        {/* 차기 구간 표시기 */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${GOOD_Y}%` }}
        >
          <div className={`mx-4 h-px ${isPerfect ? 'bg-red-400' : isKickable ? 'bg-yellow-400' : 'bg-gray-300'} opacity-60`} />
        </div>
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${PERFECT_Y}%` }}
        >
          <div className={`mx-4 h-px ${isPerfect ? 'bg-red-600' : 'bg-gray-200'} opacity-60`} />
        </div>
      </div>

      {/* 바닥 + 발 */}
      <div className={`h-16 flex items-center justify-center gap-3 border-t-4 transition-colors ${
        isPerfect ? 'bg-red-400 border-red-600' :
        isKickable ? 'bg-yellow-400 border-yellow-600' :
        'bg-green-400 border-green-600'
      }`}>
        <span className="text-3xl">{isPerfect ? '🦶' : '👟'}</span>
        <div className="text-sm font-bold text-white drop-shadow">
          {isPerfect
            ? '지금 차세요! PERFECT!'
            : isKickable
            ? '차도 돼요! (GOOD)'
            : '제기가 내려오길 기다려요...'}
        </div>
      </div>
    </div>
  );
}
