/**
 * 정답/오답 전체화면 이펙트 오버레이
 * 퀴즈 컴포넌트에서 정답·오답 확인 순간에 마운트하고
 * 애니메이션 종료 후 부모가 unmount.
 *
 * 사용법:
 *   {showEffect && (
 *     <AnswerEffect type="correct" streak={3} onDone={() => setShowEffect(false)} />
 *   )}
 */
import { useEffect } from 'react';

interface AnswerEffectProps {
  type: 'correct' | 'wrong';
  streak?: number;   // 연속 정답 수 (3 이상이면 콤보 뱃지)
  onDone: () => void;
}

// 파티클 설정: 방향·거리·색·크기·이모지
const CORRECT_PARTICLES = [
  { tx: '-120px', ty: '-90px',  emoji: '⭐', size: 28, dur: '0.75s', delay: '0s'    },
  { tx: '110px',  ty: '-100px', emoji: '🎉', size: 32, dur: '0.80s', delay: '0.04s' },
  { tx: '-90px',  ty: '-130px', emoji: '✨', size: 24, dur: '0.70s', delay: '0.08s' },
  { tx: '130px',  ty: '-80px',  emoji: '🏆', size: 26, dur: '0.85s', delay: '0.02s' },
  { tx: '-140px', ty: '-40px',  emoji: '⭐', size: 20, dur: '0.65s', delay: '0.10s' },
  { tx: '150px',  ty: '-50px',  emoji: '✨', size: 22, dur: '0.72s', delay: '0.06s' },
  { tx: '-60px',  ty: '-150px', emoji: '🎊', size: 30, dur: '0.78s', delay: '0.03s' },
  { tx: '70px',   ty: '-140px', emoji: '💛', size: 24, dur: '0.68s', delay: '0.09s' },
  { tx: '-170px', ty: '-70px',  emoji: '⭐', size: 18, dur: '0.60s', delay: '0.12s' },
  { tx: '160px',  ty: '-110px', emoji: '✨', size: 20, dur: '0.76s', delay: '0.05s' },
];

const WRONG_PARTICLES = [
  { tx: '-80px',  ty: '-60px',  emoji: '💔', size: 26, dur: '0.55s', delay: '0s'    },
  { tx: '90px',   ty: '-70px',  emoji: '😢', size: 28, dur: '0.58s', delay: '0.04s' },
  { tx: '-60px',  ty: '-90px',  emoji: '💔', size: 20, dur: '0.50s', delay: '0.06s' },
  { tx: '70px',   ty: '-80px',  emoji: '😮', size: 24, dur: '0.52s', delay: '0.02s' },
];

export default function AnswerEffect({ type, streak = 0, onDone }: AnswerEffectProps) {
  const isCorrect = type === 'correct';
  const duration = isCorrect ? 900 : 700;

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  const particles = isCorrect ? CORRECT_PARTICLES : WRONG_PARTICLES;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999, pointerEvents: 'none' }}>

      {/* 전체화면 컬러 플래시 */}
      <div
        className={`absolute inset-0 ${isCorrect ? 'effect-correct-overlay' : 'effect-wrong-overlay'}`}
        style={{
          background: isCorrect
            ? 'radial-gradient(ellipse at 50% 50%, rgba(39,174,96,0.35) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(231,76,60,0.35) 0%, transparent 70%)',
        }}
      />

      {/* 파티클들 (화면 중앙 기준 방사형 폭발) */}
      <div className="relative" style={{ width: 0, height: 0 }}>
        {particles.map((p, i) => (
          <div
            key={i}
            className="effect-particle absolute"
            style={{
              '--tx': p.tx,
              '--ty': p.ty,
              '--dur': p.dur,
              '--rot': `${(i % 2 === 0 ? 1 : -1) * (180 + i * 30)}deg`,
              animationDelay: p.delay,
              fontSize: p.size,
              top: 0,
              left: 0,
              transform: 'translate(-50%, -50%)',
            } as React.CSSProperties}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* 중앙 결과 텍스트 */}
      <div
        className={`absolute ${isCorrect ? 'effect-text-correct' : 'effect-text-wrong'}`}
        style={{ top: '50%', left: '50%' }}
      >
        {isCorrect ? (
          <div className="text-center">
            <div
              className="font-black text-white drop-shadow-lg px-8 py-4 rounded-3xl"
              style={{
                fontSize: '2.8rem',
                background: 'linear-gradient(135deg, #27AE60, #1E8449)',
                boxShadow: '0 8px 32px rgba(39,174,96,0.6), 0 0 60px rgba(39,174,96,0.3)',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                border: '3px solid rgba(255,255,255,0.4)',
              }}
            >
              정답! 🎉
            </div>
            {/* 콤보 뱃지 (3연속 이상) */}
            {streak >= 3 && (
              <div
                className="combo-badge-in mt-2 inline-block font-black text-white px-4 py-2 rounded-full text-base"
                style={{
                  background: streak >= 7
                    ? 'linear-gradient(135deg, #F39C12, #E74C3C)'
                    : streak >= 5
                    ? 'linear-gradient(135deg, #8E44AD, #3498DB)'
                    : 'linear-gradient(135deg, #F39C12, #E67E22)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  animationDelay: '0.2s',
                }}
              >
                {streak >= 7 ? '🔥 PERFECT ' : streak >= 5 ? '⚡ COMBO ' : '🔥 COMBO '}
                {streak}연속!
              </div>
            )}
          </div>
        ) : (
          <div
            className="font-black text-white drop-shadow-lg px-7 py-3 rounded-3xl text-center"
            style={{
              fontSize: '2.2rem',
              background: 'linear-gradient(135deg, #E74C3C, #C0392B)',
              boxShadow: '0 6px 24px rgba(231,76,60,0.5)',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            틀렸어요 😢
          </div>
        )}
      </div>
    </div>
  );
}
