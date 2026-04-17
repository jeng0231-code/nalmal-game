import { useState, useRef, useCallback } from 'react';

interface MemoryGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

const CARDS = [
  { id: 0, emoji: '📜', label: '서당' },
  { id: 1, emoji: '🎓', label: '선비' },
  { id: 2, emoji: '👑', label: '임금' },
  { id: 3, emoji: '⚔️', label: '무관' },
  { id: 4, emoji: '🏯', label: '궁궐' },
  { id: 5, emoji: '🎯', label: '과거' },
  { id: 6, emoji: '🪶', label: '붓글씨' },
  { id: 7, emoji: '🥁', label: '북소리' },
];

export default function MemoryGame({ onComplete, level = 1 }: MemoryGameProps) {
  const cardCount = Math.min(4 + Math.floor((level - 1) / 2), 8);
  const startLen  = Math.min(2 + Math.floor((level - 1) / 3), 5);
  const TOTAL_ROUNDS = 3;
  const SHOW_DELAY = Math.max(400, 700 - level * 30);

  const activeCards = CARDS.slice(0, cardCount);

  type Phase = 'ready' | 'showing' | 'input' | 'success' | 'fail' | 'done';
  const [phase, setPhase]         = useState<Phase>('ready');
  const [round, setRound]         = useState(1);
  const [score, setScore]         = useState(0);
  const [sequence, setSequence]   = useState<number[]>([]);
  const [userSeq, setUserSeq]     = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const [successCard, setSuccessCard] = useState<number | null>(null);

  const seqRef   = useRef<number[]>([]);
  const roundRef = useRef(1);

  const genSequence = useCallback((len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * cardCount));
  }, [cardCount]);

  const showSequenceAsync = useCallback(async (seq: number[]) => {
    setPhase('showing');
    setUserSeq([]);
    seqRef.current = seq;
    await new Promise(r => setTimeout(r, 600));
    for (let i = 0; i < seq.length; i++) {
      setHighlighted(seq[i]);
      await new Promise(r => setTimeout(r, SHOW_DELAY));
      setHighlighted(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setPhase('input');
  }, [SHOW_DELAY]);

  const startRound = useCallback((r: number) => {
    roundRef.current = r;
    setRound(r);
    const len = startLen + (r - 1);
    const seq = genSequence(len);
    setSequence(seq);
    showSequenceAsync(seq);
  }, [startLen, genSequence, showSequenceAsync]);

  const handleCardClick = useCallback((cardId: number) => {
    if (phase !== 'input') return;
    setUserSeq(prev => {
      const next = [...prev, cardId];
      const pos = next.length - 1;

      if (next[pos] !== seqRef.current[pos]) {
        setWrongCard(cardId);
        setPhase('fail');
        setTimeout(() => {
          setWrongCard(null);
          const nextRound = roundRef.current + 1;
          if (nextRound > TOTAL_ROUNDS) {
            setPhase('done');
          } else {
            startRound(nextRound);
          }
        }, 1000);
        return next;
      }

      setSuccessCard(cardId);
      setTimeout(() => setSuccessCard(null), 300);

      if (next.length === seqRef.current.length) {
        const roundScore = seqRef.current.length * 10;
        setScore(s => s + roundScore);
        setPhase('success');
        setTimeout(() => {
          const nextRound = roundRef.current + 1;
          if (nextRound > TOTAL_ROUNDS) {
            setPhase('done');
          } else {
            startRound(nextRound);
          }
        }, 800);
      }
      return next;
    });
  }, [phase, startRound]);

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl animate-bounce">🧠</div>
        <h2 className="text-2xl font-black text-joseon-dark">기억력 게임</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-4 text-sm text-joseon-brown text-center max-w-xs">
          <p className="font-bold mb-2">📖 게임 방법</p>
          <p>카드가 순서대로 빛납니다.<br/>같은 순서로 클릭하세요!</p>
          <div className="mt-2 flex justify-center gap-3 text-xs opacity-70">
            <span>🃏 카드 {cardCount}개</span>
            <span>🔢 시작길이 {startLen}</span>
            <span>🏅 {TOTAL_ROUNDS}라운드</span>
          </div>
        </div>
        <button onClick={() => startRound(1)} className="btn-joseon px-10 py-4 text-lg">
          시작! 🧠
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const totalScore = Math.round(score * (1 + level * 0.1));
    const coins = Math.max(5, Math.round(totalScore / 4));
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">{score >= 60 ? '🏆' : score >= 30 ? '🎉' : '😅'}</div>
        <h2 className="text-2xl font-black text-joseon-dark">기억력 게임 완료!</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-600">{score}</div>
            <div className="text-xs text-green-700">기본 점수</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-joseon-red">{totalScore}</div>
            <div className="text-xs text-joseon-brown">레벨보너스 포함</div>
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
      <div className="flex justify-between w-full max-w-sm">
        <span className="bg-joseon-gold/20 px-3 py-1 rounded-full text-xs font-bold text-joseon-dark">
          라운드 {round}/{TOTAL_ROUNDS}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${
          phase === 'showing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
          phase === 'input'   ? 'bg-green-100 text-green-700' :
          phase === 'success' ? 'bg-joseon-gold/30 text-joseon-dark' :
          'bg-red-100 text-red-700'
        }`}>
          {phase === 'showing' ? '👀 기억하세요!' :
           phase === 'input'   ? `✏️ ${userSeq.length}/${sequence.length}` :
           phase === 'success' ? '✅ 정답!' : '❌ 틀렸어요!'}
        </span>
        <span className="bg-purple-100 px-3 py-1 rounded-full text-xs font-bold text-purple-700">
          🏆 {score}점
        </span>
      </div>

      {/* 진행 도트 */}
      <div className="flex gap-1.5">
        {sequence.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all ${
            i < userSeq.length ? 'bg-joseon-gold' :
            i === userSeq.length && phase === 'input' ? 'bg-white border-2 border-joseon-brown animate-pulse' :
            'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className={`grid gap-2.5 w-full max-w-sm ${
        cardCount <= 4 ? 'grid-cols-2' : cardCount <= 6 ? 'grid-cols-3' : 'grid-cols-4'
      }`}>
        {activeCards.map(card => {
          const isHL  = highlighted === card.id;
          const isWrong = wrongCard === card.id;
          const isOk  = successCard === card.id;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={phase !== 'input'}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none border-2 ${
                isHL    ? 'bg-joseon-gold scale-110 border-joseon-gold shadow-lg shadow-joseon-gold/50' :
                isWrong ? 'bg-red-400 scale-95 border-red-600' :
                isOk    ? 'bg-green-400 scale-110 border-green-500' :
                phase === 'input' ? 'bg-white border-joseon-brown/30 hover:bg-joseon-gold/10 active:scale-95 cursor-pointer' :
                'bg-gray-100 border-gray-200 cursor-default'
              }`}
            >
              <span className={cardCount <= 4 ? 'text-4xl' : cardCount <= 6 ? 'text-3xl' : 'text-2xl'}>
                {card.emoji}
              </span>
              <span className={`font-bold ${cardCount <= 4 ? 'text-sm' : 'text-xs'} text-joseon-dark`}>
                {card.label}
              </span>
            </button>
          );
        })}
      </div>

      {phase === 'input' && (
        <p className="text-xs text-joseon-brown/60">빛났던 순서대로 클릭하세요!</p>
      )}
    </div>
  );
}
