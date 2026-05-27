import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getRecommendation } from './todayRecommendationLogic';

export default function TodayRecommendation() {
  const navigate = useNavigate();
  const { categoryStats } = useGameStore();

  const rec = useMemo(() => getRecommendation(categoryStats), [categoryStats]);
  const { hakdang, reason, goal } = rec;

  return (
    <div className="card-joseon p-4 bg-gradient-to-br from-rose-50 to-amber-50 border-rose-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🎯</span>
        <p className="text-rose-700 font-black text-sm">오늘의 추천 학습</p>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl shrink-0">{hakdang.emoji}</span>
        <div className="min-w-0">
          <p className="font-black text-joseon-dark text-sm">
            {hakdang.name} · {hakdang.koreanName}
          </p>
          <p className="text-joseon-brown text-xs leading-relaxed mt-0.5">{reason}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/70 border border-rose-100 rounded-lg px-3 py-2 mb-3">
        <span className="text-sm">📌</span>
        <p className="text-xs text-rose-800 font-medium">오늘 목표 · {goal}</p>
      </div>

      <button
        onClick={() => navigate(`/quiz?category=${hakdang.id}`)}
        className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-black rounded-xl py-3 transition-all flex items-center justify-center gap-2"
      >
        바로 시작하기 →
      </button>
    </div>
  );
}
