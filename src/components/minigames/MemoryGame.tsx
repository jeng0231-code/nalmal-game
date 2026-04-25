import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';

interface MemoryGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

const ANIMAL_EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
  '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
  '🐷', '🐸', '🐙', '🦋', '🐝', '🦄',
  '🐲', '🦀',
];

interface CardState {
  id: number;       // unique instance id (0..totalCards-1)
  pairId: number;   // which pair this card belongs to
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MemoryGame: FC<MemoryGameProps> = ({ onComplete, level = 1 }) => {
  const pairCount = level <= 3 ? 6 : level <= 6 ? 8 : 10;
  const TOTAL_TIME = 60 + level * 5;

  type Phase = 'ready' | 'playing' | 'done';
  const [phase, setPhase] = useState<Phase>('ready');
  const [cards, setCards] = useState<CardState[]>([]);
  const [_flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const buildCards = useCallback((): CardState[] => {
    const emojis = ANIMAL_EMOJIS.slice(0, pairCount);
    const pairs: Omit<CardState, 'id'>[] = emojis.flatMap((emoji, pairId) => [
      { pairId, emoji, flipped: false, matched: false },
      { pairId, emoji, flipped: false, matched: false },
    ]);
    return shuffle(pairs).map((c, idx) => ({ ...c, id: idx }));
  }, [pairCount]);

  const startGame = useCallback(() => {
    setCards(buildCards());
    setFlippedIds([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setLocked(false);
    setPhase('playing');
  }, [buildCards, TOTAL_TIME]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('done');
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Check win
  useEffect(() => {
    if (phase === 'playing' && matchedPairs === pairCount) {
      const timeBonus = timeLeft * 3;
      const moveBonus = Math.max(0, (pairCount * 4 - moves) * 5);
      setScore(pairCount * 50 + timeBonus + moveBonus);
      setPhase('done');
    }
  }, [matchedPairs, pairCount, phase, timeLeft, moves]);

  const handleCardClick = useCallback((cardId: number) => {
    if (locked || phase !== 'playing') return;

    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card || card.flipped || card.matched) return prev;
      return prev.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    });

    setFlippedIds(prev => {
      const card = cards.find(c => c.id === cardId);
      if (!card || card.flipped || card.matched) return prev;

      const next = [...prev, cardId];

      if (next.length === 2) {
        setMoves(m => m + 1);
        setLocked(true);

        const [firstId, secondId] = next;
        const first = cards.find(c => c.id === firstId)!;
        const second = cards.find(c => c.id === secondId)!;

        if (first.pairId === second.pairId) {
          // Match
          setTimeout(() => {
            setCards(cs => cs.map(c =>
              c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
            ));
            setMatchedPairs(p => p + 1);
            setFlippedIds([]);
            setLocked(false);
          }, 400);
        } else {
          // No match
          setTimeout(() => {
            setCards(cs => cs.map(c =>
              c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
            ));
            setFlippedIds([]);
            setLocked(false);
          }, 900);
        }
        return next;
      }

      return next;
    });
  }, [locked, phase, cards]);

  const cols = pairCount <= 6 ? 4 : pairCount <= 8 ? 4 : 5;
  const emojiSize = pairCount <= 6 ? 'text-4xl' : pairCount <= 8 ? 'text-3xl' : 'text-2xl';

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl animate-bounce">🐾</div>
        <h2 className="text-2xl font-black text-joseon-dark">동물 카드 짝 맞추기</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-4 text-sm text-joseon-brown text-center max-w-xs">
          <p className="font-bold mb-2">게임 방법</p>
          <p>카드를 뒤집어 같은 동물끼리<br/>짝을 맞추세요!</p>
          <div className="mt-3 flex justify-center gap-3 text-xs opacity-70">
            <span>🃏 {pairCount}쌍</span>
            <span>⏱ {TOTAL_TIME}초</span>
          </div>
        </div>
        <button onClick={startGame} className="btn-joseon px-10 py-4 text-lg">
          시작!
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const finalScore = matchedPairs === pairCount ? score : matchedPairs * 50;
    const coins = Math.max(5, Math.round(finalScore / 10));
    const perfect = matchedPairs === pairCount;
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">{perfect ? '🏆' : matchedPairs >= pairCount / 2 ? '🎉' : '😅'}</div>
        <h2 className="text-2xl font-black text-joseon-dark">
          {perfect ? '완벽 클리어!' : '시간 종료!'}
        </h2>
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-600">{matchedPairs}/{pairCount}</div>
            <div className="text-xs text-green-700">짝 맞춤</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-600">{moves}</div>
            <div className="text-xs text-blue-700">시도 횟수</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-joseon-red">{finalScore}</div>
            <div className="text-xs text-joseon-brown">점수</div>
          </div>
        </div>
        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coins}개 획득!</p>
        <button onClick={() => onComplete(coins)} className="btn-joseon px-10 py-4 text-lg mt-1">
          완료! →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-3">
      {/* 상단 정보 */}
      <div className="flex justify-between items-center w-full max-w-sm">
        <span className="bg-joseon-gold/20 px-3 py-1 rounded-full text-xs font-bold text-joseon-dark">
          짝 {matchedPairs}/{pairCount}
        </span>
        <span className="bg-blue-100 px-3 py-1 rounded-full text-xs font-bold text-blue-700">
          시도 {moves}회
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${
          timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'
        }`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {/* 타이머 바 */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-sm">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-400' : 'bg-green-500'
          }`}
          style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
        />
      </div>

      {/* 카드 그리드 */}
      <div
        className="grid gap-2 w-full max-w-sm"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map(card => {
          const isVisible = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={isVisible || locked || phase !== 'playing'}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 select-none border-2 ${
                card.matched
                  ? 'bg-green-100 border-green-400 cursor-default'
                  : card.flipped
                  ? 'bg-joseon-gold/20 border-joseon-gold scale-105 shadow-md'
                  : 'bg-joseon-dark border-joseon-brown/60 hover:bg-joseon-brown/80 active:scale-95 cursor-pointer'
              }`}
            >
              {isVisible ? (
                <span className={emojiSize}>{card.emoji}</span>
              ) : (
                <span className={`${emojiSize} opacity-30`}>?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MemoryGame;
