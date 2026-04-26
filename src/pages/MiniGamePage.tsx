import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import TuhoGame from '../components/minigames/TuhoGame';
import JegiGame from '../components/minigames/JegiGame';
import YutGame from '../components/minigames/YutGame';
import MemoryGame from '../components/minigames/MemoryGame';
import WordPuzzleGame from '../components/minigames/WordPuzzleGame';
import ArcheryGame from '../components/minigames/ArcheryGame';
import SpotDifferenceGame from '../components/minigames/SpotDifferenceGame';
import SlidingPuzzleGame from '../components/minigames/SlidingPuzzleGame';

type GameId = 'TUHO' | 'JEGI' | 'YUT' | 'MEMORY' | 'WORDPUZZLE' | 'ARCHERY' | 'SPOTDIFF' | 'PUZZLE' | null;

const GAMES: {
  id: GameId;
  name: string;
  emoji: string;
  desc: string;
  difficulty: string;
  diffColor: string;
  maxCoins: number;
  tag?: string;
  tagColor?: string;
}[] = [
  {
    id: 'TUHO',
    name: '투호 놀이',
    emoji: '🏺',
    desc: '화살을 항아리에 넣어라!',
    difficulty: '쉬움',
    diffColor: 'text-green-600',
    maxCoins: 100,
    tag: '반응속도',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'JEGI',
    name: '제기차기',
    emoji: '🪶',
    desc: '15초 동안 제기를 차올려라!',
    difficulty: '보통',
    diffColor: 'text-yellow-600',
    maxCoins: 100,
    tag: '연타',
    tagColor: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'ARCHERY',
    name: '활쏘기',
    emoji: '🏹',
    desc: '과녁을 향해 화살을 쏴라!',
    difficulty: '반응',
    diffColor: 'text-red-600',
    maxCoins: 100,
    tag: '정확도',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    id: 'MEMORY',
    name: '기억력 게임',
    emoji: '🧠',
    desc: '순서대로 나온 숫자를 기억하라!',
    difficulty: '집중',
    diffColor: 'text-purple-600',
    maxCoins: 80,
    tag: '기억',
    tagColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'WORDPUZZLE',
    name: '숫자 기억 게임',
    emoji: '🔢',
    desc: '숫자를 보고 순서대로 기억하라!',
    difficulty: '집중',
    diffColor: 'text-orange-600',
    maxCoins: 80,
    tag: '기억력',
    tagColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'SPOTDIFF',
    name: '틀린그림 찾기',
    emoji: '🔍',
    desc: '두 그림의 차이점을 찾아라!',
    difficulty: '관찰',
    diffColor: 'text-teal-600',
    maxCoins: 80,
    tag: '집중력',
    tagColor: 'bg-teal-100 text-teal-700',
  },
  {
    id: 'PUZZLE',
    name: '슬라이딩 퍼즐',
    emoji: '🧩',
    desc: '타일을 밀어서 그림을 완성!',
    difficulty: '두뇌',
    diffColor: 'text-indigo-600',
    maxCoins: 120,
    tag: '논리',
    tagColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'YUT',
    name: '윷놀이',
    emoji: '🎯',
    desc: '컴퓨터와 윷놀이 대결!',
    difficulty: '전략',
    diffColor: 'text-blue-600',
    maxCoins: 100,
    tag: '전략',
    tagColor: 'bg-blue-100 text-blue-700',
  },
];

export default function MiniGamePage() {
  const navigate = useNavigate();
  const { addCoins, recordMinigamePlayed, player } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<GameId>(null);

  const handleGameComplete = (score: number) => {
    if (score > 0) addCoins(score);
    recordMinigamePlayed();
    setSelectedGame(null);
  };

  // 게임 목록 화면
  if (!selectedGame) {
    return (
      <div className="joseon-bg min-h-screen flex flex-col">
        {/* 헤더 */}
        <header className="bg-joseon-dark text-white p-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-joseon-gold text-2xl"
          >←</button>
          <div>
            <h1 className="text-xl font-black">🎮 조선 미니게임</h1>
            <p className="text-joseon-gold text-xs">게임을 클리어하고 엽전을 모아라!</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-joseon-gold font-bold">🪙 {player.coins}</span>
          </div>
        </header>

        <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-3">

          {/* 안내 */}
          <div className="bg-joseon-gold/10 border border-joseon-gold/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-joseon-brown text-sm">
              게임을 클리어하면 <strong>엽전</strong>을 획득해요!<br/>
              <span className="text-xs opacity-70">엽전은 힌트 사용에 쓸 수 있어요</span>
            </p>
          </div>

          {/* 게임 목록 */}
          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="card-joseon p-4 text-left w-full transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl flex-shrink-0">{game.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-joseon-dark text-lg">{game.name}</span>
                    {game.tag && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${game.tagColor}`}>
                        {game.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-joseon-brown text-sm mt-0.5">{game.desc}</div>
                  <div className={`text-xs font-bold mt-1 ${game.diffColor}`}>
                    난이도: {game.difficulty}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-joseon-gold font-black text-base">🪙 최대</div>
                  <div className="text-joseon-gold font-black text-lg">{game.maxCoins}</div>
                </div>
              </div>
            </button>
          ))}

          {/* 광고 영역 */}
          <div className="h-14 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mt-2">
            <p className="text-gray-400 text-xs">광고 영역 (준비 중)</p>
          </div>
        </div>
      </div>
    );
  }

  // 게임 플레이 화면
  const currentGame = GAMES.find(g => g.id === selectedGame);
  return (
    <div className="joseon-bg min-h-screen flex flex-col">
      <header className="bg-joseon-dark text-white p-3 flex items-center gap-3">
        <button
          onClick={() => setSelectedGame(null)}
          className="text-joseon-gold text-2xl"
        >←</button>
        <div>
          <h1 className="text-base font-black">
            {currentGame?.emoji} {currentGame?.name}
          </h1>
          <p className="text-joseon-gold text-xs">🪙 최대 {currentGame?.maxCoins} 엽전</p>
        </div>
        <div className="ml-auto text-joseon-gold font-bold">🪙 {player.coins}</div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-3 overflow-y-auto">
        <div className="card-joseon p-2">
          {selectedGame === 'TUHO'       && <TuhoGame onComplete={handleGameComplete} />}
          {selectedGame === 'JEGI'       && <JegiGame onComplete={handleGameComplete} />}
          {selectedGame === 'YUT'        && <YutGame onComplete={handleGameComplete} />}
          {selectedGame === 'MEMORY'     && <MemoryGame onComplete={handleGameComplete} level={player.level} />}
          {selectedGame === 'WORDPUZZLE' && <WordPuzzleGame onComplete={handleGameComplete} level={player.level} />}
          {selectedGame === 'ARCHERY'    && <ArcheryGame onComplete={handleGameComplete} level={player.level} />}
          {selectedGame === 'SPOTDIFF'   && <SpotDifferenceGame onComplete={handleGameComplete} level={player.level} />}
          {selectedGame === 'PUZZLE'     && <SlidingPuzzleGame onComplete={handleGameComplete} level={player.level} />}
        </div>
      </div>
    </div>
  );
}
