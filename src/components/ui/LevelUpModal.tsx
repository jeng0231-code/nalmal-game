import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { JOSEON_LEVELS } from '../../data/levels';

export default function LevelUpModal() {
  const { newLevelIndex, closeLevelUp } = useGameStore();
  const [showContent, setShowContent] = useState(false);
  const newLevel = JOSEON_LEVELS[Math.max(0, newLevelIndex)];

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* 배경 폭죽 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['🎆', '🎇', '✨', '🎊', '⭐', '🌟', '💫'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-float"
            style={{
              left: `${10 + i * 13}%`,
              top: `${Math.random() * 60 + 10}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className={`card-joseon p-8 max-w-sm w-full text-center z-10 transition-all duration-500 ${
        showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`} style={{ borderColor: '#F39C12', borderWidth: 4 }}>

        <div className="text-6xl mb-2 animate-level-up">{newLevel.emoji}</div>
        <div className="text-yellow-500 font-bold text-sm mb-1">신분 상승!</div>
        <h2 className="text-4xl font-black mb-1" style={{ color: '#C0392B' }}>
          {newLevel.hat} {newLevel.title}
        </h2>
        <p className="text-gray-600 text-sm mb-1">{newLevel.outfit}</p>
        <p className="text-joseon-dark font-medium mb-4">{newLevel.description}</p>

        <div className="bg-joseon-gold/20 border border-joseon-gold rounded-xl p-4 mb-5">
          <p className="text-joseon-dark font-bold text-sm">{newLevel.unlockMessage}</p>
        </div>

        {/* 레벨 표시 */}
        <div className="flex justify-center gap-2 mb-5">
          {JOSEON_LEVELS.slice(0, 10).map((_lvl, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                i < newLevel.level
                  ? 'bg-joseon-gold text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {i < newLevel.level ? '★' : '☆'}
            </div>
          ))}
        </div>

        <button onClick={closeLevelUp} className="btn-joseon w-full text-lg py-4">
          계속 공부하기 📚
        </button>
      </div>
    </div>
  );
}
