import { useState, useEffect, useRef, useCallback } from 'react';

interface ArcheryGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

const TOTAL_ARROWS = 5;
const CENTER = 100;

function calcScore(x: number, y: number): number {
  const dist = Math.sqrt((x - CENTER) ** 2 + (y - CENTER) ** 2);
  if (dist <= 12) return 10;
  if (dist <= 30) return 8;
  if (dist <= 50) return 6;
  if (dist <= 70) return 4;
  if (dist <= 90) return 2;
  return 0;
}

interface Arrow {
  x: number;
  y: number;
  score: number;
}

export default function ArcheryGame({ onComplete, level = 1 }: ArcheryGameProps) {
  const AMPLITUDE = Math.min(40 + level * 6, 82);
  const SPEED = Math.min(0.8 + level * 0.12, 2.0);

  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [crosshair, setCrosshair] = useState({ x: CENTER, y: CENTER });
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [isShooting, setIsShooting] = useState(false);
  const [feedback, setFeedback] = useState<{ x: number; y: number; score: number } | null>(null);

  const crosshairRef = useRef({ x: CENTER, y: CENTER });
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isShootingRef = useRef(false);
  const arrowsRef = useRef<Arrow[]>([]);

  const tick = useCallback(() => {
    if (isShootingRef.current) return;
    tRef.current += 0.016 * SPEED;
    const x = CENTER + AMPLITUDE * Math.sin(tRef.current * 1.7);
    const y = CENTER + AMPLITUDE * Math.sin(tRef.current * 1.3 + 1.2);
    crosshairRef.current = { x, y };
    setCrosshair({ x, y });
    rafRef.current = requestAnimationFrame(tick);
  }, [AMPLITUDE, SPEED]);

  const startAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      startAnim();
    }
    return () => stopAnim();
  }, [phase, startAnim, stopAnim]);

  const handleShoot = useCallback(() => {
    if (isShooting || phase !== 'playing') return;

    const { x, y } = crosshairRef.current;
    const score = calcScore(x, y);

    isShootingRef.current = true;
    setIsShooting(true);
    stopAnim();

    setFeedback({ x, y, score });

    setTimeout(() => {
      const newArrow: Arrow = { x, y, score };
      const newArrows = [...arrowsRef.current, newArrow];
      arrowsRef.current = newArrows;
      setArrows(newArrows);
      setFeedback(null);
      isShootingRef.current = false;
      setIsShooting(false);

      if (newArrows.length >= TOTAL_ARROWS) {
        setPhase('result');
      } else {
        startAnim();
      }
    }, 800);
  }, [isShooting, phase, stopAnim, startAnim]);

  /* ── 준비 화면 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl animate-bounce">🏹</div>
        <h2 className="text-2xl font-black text-joseon-dark">활쏘기</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-4 text-sm text-joseon-brown max-w-xs">
          <p className="font-bold mb-2">🎯 게임 방법</p>
          <p>조준점이 움직입니다.<br />과녁 중앙에 올 때 쏘세요!</p>
          <div className="mt-3 flex justify-center gap-3 text-xs opacity-80 flex-wrap">
            <span>🏹 화살 {TOTAL_ARROWS}개</span>
            <span>⚡ 속도 {SPEED.toFixed(2)}</span>
            <span>📐 진폭 {AMPLITUDE}</span>
          </div>
          <div className="mt-2 text-xs opacity-60">
            레벨 {level} — {level <= 2 ? '느리고 예측 가능' : level <= 5 ? '중간 난이도' : level <= 8 ? '빠르고 진폭 큼' : '극한의 난이도'}
          </div>
        </div>
        <button
          onClick={() => {
            arrowsRef.current = [];
            setArrows([]);
            tRef.current = 0;
            setPhase('playing');
          }}
          className="btn-joseon px-10 py-4 text-lg"
        >
          시작! 🏹
        </button>
      </div>
    );
  }

  /* ── 결과 화면 ── */
  if (phase === 'result') {
    const totalScore = arrows.reduce((sum, a) => sum + a.score, 0);
    const bullseyeCount = arrows.filter(a => a.score === 10).length;
    const coins = Math.max(3, Math.round(totalScore * 1.2));
    const emoji = totalScore >= 40 ? '🏹' : totalScore >= 20 ? '🎯' : '😅';

    const badgeStyle = (score: number) => {
      if (score === 10) return 'bg-yellow-400 text-yellow-900 border-yellow-600';
      if (score >= 6)  return 'bg-red-500 text-white border-red-700';
      if (score >= 2)  return 'bg-gray-400 text-white border-gray-600';
      return 'bg-white text-gray-400 border-gray-300';
    };

    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">{emoji}</div>
        <h2 className="text-2xl font-black text-joseon-dark">활쏘기 완료!</h2>

        {/* 화살 점수 배지 */}
        <div className="flex gap-2 flex-wrap justify-center">
          {arrows.map((arrow, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-black text-sm shadow ${badgeStyle(arrow.score)}`}
            >
              {arrow.score === 0 ? '✕' : arrow.score}
            </div>
          ))}
        </div>

        {/* 점수 통계 */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3">
            <div className="text-2xl font-black text-joseon-red">{totalScore}</div>
            <div className="text-xs text-joseon-brown">총점 / 50점</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="text-2xl font-black text-yellow-600">{bullseyeCount}</div>
            <div className="text-xs text-yellow-700">불스아이 🎯</div>
          </div>
        </div>

        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coins}개 획득!</p>
        <button onClick={() => onComplete(coins)} className="btn-joseon px-10 py-4 text-lg mt-1">
          완료! →
        </button>
      </div>
    );
  }

  /* ── 게임 화면 ── */
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* 진행 상황 */}
      <div className="flex justify-between w-full max-w-xs items-center">
        <span className="bg-joseon-gold/20 px-3 py-1 rounded-full text-xs font-bold text-joseon-dark">
          🏹 {arrows.length + 1}/{TOTAL_ARROWS} 발
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${
          isShooting
            ? 'bg-orange-100 text-orange-700 animate-pulse'
            : 'bg-green-100 text-green-700'
        }`}>
          {isShooting ? '💨 날아가는 중...' : '🎯 조준 중'}
        </span>
        <span className="bg-purple-100 px-3 py-1 rounded-full text-xs font-bold text-purple-700">
          Lv.{level}
        </span>
      </div>

      {/* 과녁 SVG */}
      <div className="relative select-none">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* 배경 원 — 0점 (검정 바깥) */}
          <circle cx="100" cy="100" r="90" fill="#1a1a1a" stroke="white" strokeWidth="0.5" />
          {/* 4점 (검정 안쪽) */}
          <circle cx="100" cy="100" r="70" fill="#333333" stroke="white" strokeWidth="0.5" />
          {/* 6점 (빨강 바깥) */}
          <circle cx="100" cy="100" r="50" fill="#CC0000" stroke="white" strokeWidth="0.5" />
          {/* 8점 (진빨강) */}
          <circle cx="100" cy="100" r="30" fill="#AA0000" stroke="white" strokeWidth="0.5" />
          {/* 10점 — 불스아이 (금색) */}
          <circle cx="100" cy="100" r="12" fill="#FFD700" stroke="white" strokeWidth="0.5" />

          {/* 과녁 십자선 가이드 */}
          <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="0.4" strokeOpacity="0.3" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth="0.4" strokeOpacity="0.3" />

          {/* 꽂힌 화살들 */}
          {arrows.map((arrow, i) => (
            <g key={i}>
              {/* 화살 몸통 */}
              <line
                x1={arrow.x}
                y1={arrow.y - 10}
                x2={arrow.x}
                y2={arrow.y + 4}
                stroke="#8B4513"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* 화살촉 */}
              <circle cx={arrow.x} cy={arrow.y} r="3" fill="#C0C0C0" stroke="#888" strokeWidth="0.5" />
              {/* 화살 깃 */}
              <line
                x1={arrow.x - 3}
                y1={arrow.y - 8}
                x2={arrow.x}
                y2={arrow.y - 10}
                stroke="#cc3333"
                strokeWidth="1.5"
              />
              <line
                x1={arrow.x + 3}
                y1={arrow.y - 8}
                x2={arrow.x}
                y2={arrow.y - 10}
                stroke="#cc3333"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* 적중 피드백 텍스트 */}
          {feedback && (
            <text
              x={feedback.x}
              y={feedback.y - 16}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={feedback.score === 10 ? '#FFD700' : feedback.score >= 6 ? '#ff6666' : feedback.score >= 2 ? '#aaaaaa' : '#ffffff'}
              stroke="#000"
              strokeWidth="0.5"
            >
              {feedback.score === 0 ? 'miss!' : `+${feedback.score}`}
            </text>
          )}

          {/* 움직이는 크로스헤어 */}
          {!isShooting && (
            <g opacity="0.85">
              {/* 크로스헤어 원 */}
              <circle
                cx={crosshair.x}
                cy={crosshair.y}
                r="9"
                fill="none"
                stroke="#00cc44"
                strokeWidth="1.5"
              />
              {/* 크로스헤어 십자 */}
              <line
                x1={crosshair.x - 14}
                y1={crosshair.y}
                x2={crosshair.x - 11}
                y2={crosshair.y}
                stroke="#00cc44"
                strokeWidth="1.5"
              />
              <line
                x1={crosshair.x + 11}
                y1={crosshair.y}
                x2={crosshair.x + 14}
                y2={crosshair.y}
                stroke="#00cc44"
                strokeWidth="1.5"
              />
              <line
                x1={crosshair.x}
                y1={crosshair.y - 14}
                x2={crosshair.x}
                y2={crosshair.y - 11}
                stroke="#00cc44"
                strokeWidth="1.5"
              />
              <line
                x1={crosshair.x}
                y1={crosshair.y + 11}
                x2={crosshair.x}
                y2={crosshair.y + 14}
                stroke="#00cc44"
                strokeWidth="1.5"
              />
              {/* 중심점 */}
              <circle cx={crosshair.x} cy={crosshair.y} r="1.5" fill="#00cc44" />
            </g>
          )}
        </svg>
      </div>

      {/* 쏘기 버튼 */}
      <button
        onClick={handleShoot}
        disabled={isShooting}
        className={`btn-joseon w-full max-w-xs text-xl py-5 transition-all
          ${isShooting
            ? 'opacity-50 scale-95 cursor-not-allowed'
            : 'hover:scale-105 active:scale-95 ring-2 ring-joseon-gold/40 ring-offset-1'
          }`}
      >
        {isShooting ? '💨 날아가는 중...' : '🏹 쏘기!'}
      </button>

      {/* 이미 쏜 화살 점수 미리보기 */}
      {arrows.length > 0 && (
        <div className="flex gap-1.5 items-center">
          {arrows.map((a, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black ${
                a.score === 10 ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                a.score >= 6  ? 'bg-red-500 text-white border-red-700' :
                a.score >= 2  ? 'bg-gray-400 text-white border-gray-600' :
                'bg-white text-gray-400 border-gray-300'
              }`}
            >
              {a.score === 0 ? '✕' : a.score}
            </div>
          ))}
          {Array.from({ length: TOTAL_ARROWS - arrows.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-300">
              🏹
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
