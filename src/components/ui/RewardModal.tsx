import { useGameStore } from '../../store/gameStore';

interface RewardModalProps {
  onNext: () => void;
  explanation?: string;  // 현재 문제 해설
}

export default function RewardModal({ onNext, explanation }: RewardModalProps) {
  const { lastXpGained, lastCoinsGained, player } = useGameStore();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card-joseon p-6 max-w-sm w-full text-center animate-bounce-in">

        <div className="text-4xl mb-2 animate-level-up">🎊</div>
        <h2 className="text-2xl font-black text-joseon-red mb-3">정답!</h2>

        {/* 보상 */}
        <div className="flex justify-center gap-6 mb-3">
          <div className="text-center">
            <div className="text-2xl animate-coin-fly">⭐</div>
            <div className="text-joseon-dark font-bold">+{lastXpGained} XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl animate-coin-fly" style={{ animationDelay: '0.2s' }}>🪙</div>
            <div className="text-joseon-gold font-bold">+{lastCoinsGained} 엽전</div>
          </div>
        </div>

        {/* 연속 보너스 */}
        {player.streak >= 2 && (
          <div className="bg-joseon-gold/20 rounded-lg px-3 py-2 mb-3 border border-joseon-gold">
            <p className="text-joseon-dark font-bold text-sm">🔥 {player.streak}연속 정답 보너스!</p>
            <p className="text-joseon-brown text-xs">경험치 1.5배 적용됐어요</p>
          </div>
        )}

        {/* ★ 핵심 개선: 해설 표시 */}
        {explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-blue-700 text-xs font-bold mb-1">💡 이런 뜻이에요</p>
            <p className="text-joseon-dark text-sm leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* 격려 메시지 */}
        <p className="text-joseon-brown mb-4 text-xs">
          {player.streak >= 5
            ? '🌟 대단해요! 선비의 자질이 보입니다!'
            : player.streak >= 3
            ? '👏 훌륭해요! 계속 이대로!'
            : '잘했어요! 다음 문제도 화이팅!'}
        </p>

        <button onClick={onNext} className="btn-joseon w-full py-3 text-base font-bold">
          다음 문제 →
        </button>
      </div>
    </div>
  );
}
