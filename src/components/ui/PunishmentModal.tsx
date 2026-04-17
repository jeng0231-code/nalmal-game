import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';

export default function PunishmentModal() {
  const { restoreHeart, addCoins, player } = useGameStore();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  const [waiting, setWaiting] = useState(false);

  // 카운트다운 타이머 (restoreHeart는 setTimeout으로 분리 → 렌더 중 setState 방지)
  useEffect(() => {
    if (!waiting || countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(c => {
        if (c <= 1) {
          setWaiting(false);
          // 다음 틱에 실행 → "Cannot update while rendering" 방지
          setTimeout(() => restoreHeart(), 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [waiting, countdown, restoreHeart]);

  const handleWait = () => {
    setWaiting(true);
    setCountdown(10);
  };

  const handlePayCoins = () => {
    if (player.coins >= 20) {
      addCoins(-20);
      restoreHeart();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-joseon p-7 max-w-sm w-full text-center border-red-400 animate-bounce-in">

        {!waiting ? (
          <>
            <div className="text-6xl mb-3">💔</div>
            <h2 className="text-2xl font-black text-joseon-red mb-1">하트가 모두 사라졌어요!</h2>
            <p className="text-joseon-brown text-sm mb-6">
              어떻게 다시 시작할까요?
            </p>

            <div className="flex flex-col gap-3">
              {/* 엽전으로 부활 */}
              <button
                onClick={handlePayCoins}
                disabled={player.coins < 20}
                className={`py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  player.coins >= 20
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">🪙</span>
                <div className="text-left">
                  <div>엽전 20개로 즉시 부활</div>
                  <div className="text-xs font-normal opacity-80">보유: {player.coins}개</div>
                </div>
              </button>

              {/* 잠깐 기다리기 */}
              <button
                onClick={handleWait}
                className="py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-2xl">⏰</span>
                <div className="text-left">
                  <div>10초 기다리고 부활</div>
                  <div className="text-xs font-normal opacity-80">잠깐 쉬고 다시 도전!</div>
                </div>
              </button>

              {/* 광고 보고 부활 (미래용) */}
              <button
                disabled
                className="py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-300"
              >
                <span className="text-2xl">📺</span>
                <div className="text-left">
                  <div>광고 보고 부활</div>
                  <div className="text-xs font-normal">준비 중...</div>
                </div>
              </button>
            </div>

            {/* 그냥 나가기 */}
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-gray-400 text-xs underline hover:text-gray-600 transition-colors"
            >
              오늘은 여기까지 · 홈으로 나가기
            </button>
          </>
        ) : (
          <>
            <div className="text-7xl mb-4 animate-float">😤</div>
            <h3 className="text-2xl font-black text-joseon-dark mb-2">잠깐 쉬어가기</h3>
            <p className="text-joseon-brown mb-6 text-sm">조급해하지 마세요. 천천히 생각해봐요!</p>

            {/* 카운트다운 원 */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#f0e6d0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#C0392B"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - countdown / 10)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-joseon-red">{countdown}</span>
              </div>
            </div>

            <p className="text-joseon-brown text-sm">
              {countdown > 7 ? '잠깐 눈을 쉬게 해줘요 👀' :
               countdown > 4 ? '천천히 숨을 쉬어봐요 🌬️' :
               '거의 다 됐어요! 화이팅! 💪'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
