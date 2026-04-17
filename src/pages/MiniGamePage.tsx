import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import TuhoGame from '../components/minigames/TuhoGame';
import JegiGame from '../components/minigames/JegiGame';
import YutGame from '../components/minigames/YutGame';

type GameId = 'TUHO' | 'JEGI' | 'YUT' | null;

const GAMES = [
  {
    id: 'TUHO' as GameId,
    name: '투호 놀이',
    emoji: '🏺',
    desc: '화살을 항아리에 넣어라!',
    difficulty: '쉬움',
    diffColor: 'text-green-600',
  },
  {
    id: 'JEGI' as GameId,
    name: '제기차기',
    emoji: '🪶',
    desc: '15초 동안 제기를 차올려라!',
    difficulty: '보통',
    diffColor: 'text-yellow-600',
  },
  {
    id: 'YUT' as GameId,
    name: '윷놀이',
    emoji: '🎯',
    desc: '컴퓨터와 윷놀이 대결!',
    difficulty: '전략',
    diffColor: 'text-blue-600',
  },
];

export default function MiniGamePage() {
  const navigate = useNavigate();
  const { addCoins, player } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<GameId>(null);

  const handleGameComplete = (score: number) => {
    if (score > 0) addCoins(score);
    setSelectedGame(null);
  };

  return (
    <div className="joseon-bg min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-joseon-dark text-white p-4 flex items-center gap-3">
        <button onClick={() => selectedGame ? setSelectedGame(null) : navigate('/')}
          className="text-joseon-gold text-2xl">←</button>
        <div>
          <h1 className="text-xl font-black">🎮 조선 미니게임</h1>
          <p className="text-joseon-gold text-xs">엽전을 모아 신분을 높여라!</p>
        </div>
        <div className="ml-auto text-joseon-gold font-bold">🪙 {player.coins}</div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4">
        {!selectedGame ? (
          <div className="flex flex-col gap-4">
            <p className="text-joseon-brown text-center text-sm">
              게임을 클리어하면 엽전을 획득해요!
            </p>

            {GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className="card-joseon p-5 text-left w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{game.emoji}</div>
                  <div className="flex-1">
                    <div className="font-black text-joseon-dark text-xl">{game.name}</div>
                    <div className="text-joseon-brown text-sm">{game.desc}</div>
                    <div className={`text-xs font-bold mt-1 ${game.diffColor}`}>
                      난이도: {game.difficulty}
                    </div>
                  </div>
                  <div className="text-joseon-gold font-bold text-right">
                    <div className="text-lg">🪙</div>
                    <div className="text-xs">최대 100</div>
                  </div>
                </div>
              </button>
            ))}

            {/* 광고 영역 */}
            <div className="h-14 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mt-2">
              <p className="text-gray-400 text-xs">광고 영역 (준비 중)</p>
            </div>

            <div className="card-joseon p-4 text-center bg-joseon-gold/10">
              <p className="text-joseon-dark font-bold text-sm">💡 미니게임 팁</p>
              <p className="text-joseon-brown text-xs mt-1">
                게임에서 획득한 엽전은 나중에 아이템 구매에 사용할 수 있어요!
              </p>
            </div>
          </div>
        ) : (
          <div className="card-joseon p-2">
            {selectedGame === 'TUHO' && <TuhoGame onComplete={handleGameComplete} />}
            {selectedGame === 'JEGI' && <JegiGame onComplete={handleGameComplete} />}
            {selectedGame === 'YUT' && <YutGame onComplete={handleGameComplete} />}
          </div>
        )}
      </div>
    </div>
  );
}
