import { useState, useEffect, useCallback } from 'react';

interface SpotDifferenceGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

const EMOJI_POOL = [
  '🌸','🌲','🦊','🐯','🌙','⭐','🏯','🎴',
  '🪨','🌊','🦋','🌺','🎋','🐉','🌾','🍃',
  '🦅','🌄','🏔️','🎑','🌻','🦌','🍁','🎐',
  '🌿','🦩','🎆','🌈','🏕️','🦜',
];

/** Fisher-Yates 셔플 (제자리) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(rows: number, cols: number, diffCount: number) {
  const totalCells = rows * cols;

  // 이모지 풀 셔플 후 앞에서 totalCells개 선택
  const poolShuffled = shuffle(EMOJI_POOL);
  const original = poolShuffled.slice(0, totalCells);

  // 인덱스 배열을 셔플해서 diffCount개 위치 선택 (무한루프 없음)
  const allIndices = Array.from({ length: totalCells }, (_, i) => i);
  const diffPositions = shuffle(allIndices).slice(0, diffCount);

  // 사용되지 않은 이모지로 교체
  const usedEmojis = new Set(original);
  const alternatives = shuffle(EMOJI_POOL.filter(e => !usedEmojis.has(e)));
  const modified = [...original];
  diffPositions.forEach((pos, i) => {
    modified[pos] = alternatives[i % Math.max(1, alternatives.length)];
  });

  return { original, modified, diffPositions };
}

export default function SpotDifferenceGame({ onComplete, level = 1 }: SpotDifferenceGameProps) {
  const GRID_COLS = 4;
  const GRID_ROWS = level <= 3 ? 3 : 4;
  const DIFF_COUNT = Math.min(2 + Math.floor(level / 2), 6);
  const TIME_LIMIT = Math.max(30, 60 - level * 3);

  type Phase = 'ready' | 'playing' | 'result';
  const [phase, setPhase] = useState<Phase>('ready');
  const [original, setOriginal] = useState<string[]>([]);
  const [modified, setModified] = useState<string[]>([]);
  const [diffPositions, setDiffPositions] = useState<number[]>([]);
  const [foundPositions, setFoundPositions] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [cleared, setCleared] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const initGame = useCallback(() => {
    const { original: orig, modified: mod, diffPositions: diffs } = generatePuzzle(GRID_ROWS, GRID_COLS, DIFF_COUNT);
    setOriginal(orig);
    setModified(mod);
    setDiffPositions(diffs);
    setFoundPositions([]);
    setWrongFlash(null);
    setWrongClicks(0);
    setTimeLeft(TIME_LIMIT);
    setCleared(false);
    setElapsedTime(0);
    setStartTime(Date.now());
  }, [GRID_ROWS, GRID_COLS, DIFF_COUNT, TIME_LIMIT]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || cleared) return;
    if (timeLeft <= 0) {
      setElapsedTime(Math.round((Date.now() - startTime) / 1000));
      setPhase('result');
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, cleared, startTime]);

  const handleCellClick = useCallback((index: number) => {
    if (phase !== 'playing' || cleared) return;
    if (foundPositions.includes(index)) return;

    if (diffPositions.includes(index)) {
      const next = [...foundPositions, index];
      setFoundPositions(next);
      if (next.length === DIFF_COUNT) {
        setCleared(true);
        setElapsedTime(Math.round((Date.now() - startTime) / 1000));
        setTimeout(() => setPhase('result'), 1000);
      }
    } else {
      setWrongClicks(w => w + 1);
      setWrongFlash(index);
      setTimeout(() => setWrongFlash(null), 500);
    }
  }, [phase, cleared, foundPositions, diffPositions, DIFF_COUNT, startTime]);

  const handleStart = useCallback(() => {
    initGame();
    setPhase('playing');
  }, [initGame]);

  // Ready screen
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl animate-bounce">🔍</div>
        <h2 className="text-2xl font-black text-joseon-dark">틀린그림 찾기</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-4 text-sm text-joseon-brown text-center max-w-xs">
          <p className="font-bold mb-2">📖 게임 방법</p>
          <p>왼쪽 원본과 오른쪽 그림을 비교하여<br/>다른 이모지를 찾아 클릭하세요!</p>
          <div className="mt-3 flex justify-center gap-3 text-xs opacity-70">
            <span>🔢 차이 {DIFF_COUNT}개</span>
            <span>⏱️ {TIME_LIMIT}초</span>
            <span>📐 {GRID_COLS}×{GRID_ROWS}</span>
          </div>
        </div>
        <button onClick={handleStart} className="btn-joseon px-10 py-4 text-lg">
          시작! 🔍
        </button>
      </div>
    );
  }

  // Result screen
  if (phase === 'result') {
    const found = foundPositions.length;
    const base = found * 20;
    const timeBonus = timeLeft * 1;
    const wrongPenalty = wrongClicks * 3;
    const totalScore = Math.max(0, base + timeBonus - wrongPenalty);
    const coins = Math.max(3, Math.round(totalScore / 5));

    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-bounce">
          {found === DIFF_COUNT ? '🏆' : found >= DIFF_COUNT / 2 ? '🎉' : '😅'}
        </div>
        <h2 className="text-2xl font-black text-joseon-dark">틀린그림 찾기 완료!</h2>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-600">{found}/{DIFF_COUNT}</div>
            <div className="text-xs text-green-700">찾은 개수</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-blue-600">{elapsedTime}초</div>
            <div className="text-xs text-blue-700">소요 시간</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-red-500">{wrongClicks}회</div>
            <div className="text-xs text-red-700">오답 클릭</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-joseon-red">{totalScore}</div>
            <div className="text-xs text-joseon-brown">총점</div>
          </div>
        </div>

        <div className="text-xs text-joseon-brown/60 space-y-0.5">
          <p>기본 {base}점 + 시간보너스 {timeBonus}점 - 오답 {wrongPenalty}점</p>
        </div>

        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coins}개 획득!</p>
        <button onClick={() => onComplete(coins)} className="btn-joseon px-10 py-4 text-lg mt-1">
          완료! →
        </button>
      </div>
    );
  }

  // Playing screen
  const found = foundPositions.length;
  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500';

  const cellClass = (index: number, isModified: boolean) => {
    const base = 'relative flex items-center justify-center aspect-square rounded-lg border-2 transition-all duration-150 select-none';
    if (!isModified) {
      return `${base} bg-white border-joseon-brown/20 cursor-default`;
    }
    // modified grid
    if (foundPositions.includes(index)) {
      return `${base} bg-green-100 border-green-500`;
    }
    if (wrongFlash === index) {
      return `${base} bg-red-100 border-red-500 animate-pulse`;
    }
    return `${base} bg-white border-joseon-brown/20 hover:bg-joseon-gold/10 active:scale-95 cursor-pointer`;
  };

  return (
    <div className="flex flex-col items-center gap-3 p-3 w-full">
      {/* Header: progress + timer */}
      <div className="w-full max-w-sm space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-joseon-brown">
          <span>🔍 {found}/{DIFF_COUNT} 찾음</span>
          {cleared
            ? <span className="text-green-600 animate-pulse font-black">✨ 모두 찾았어요!</span>
            : <span className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}>⏱️ {timeLeft}초</span>
          }
          <span>❌ 오답 {wrongClicks}회</span>
        </div>
        {/* Progress bar: found count */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-joseon-gold h-2 rounded-full transition-all duration-300"
            style={{ width: `${(found / DIFF_COUNT) * 100}%` }}
          />
        </div>
        {/* Timer bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`${timerColor} h-1.5 rounded-full transition-all duration-1000`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </div>

      {/* Grids side by side */}
      <div className="flex gap-2 w-full justify-center">
        {/* Original */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0 max-w-[160px]">
          <span className="text-xs font-black text-joseon-brown bg-joseon-gold/20 px-2 py-0.5 rounded-full">원본</span>
          <div
            className="grid gap-0.5 w-full"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
          >
            {original.map((emoji, i) => (
              <div key={i} className={cellClass(i, false)}>
                <span className="text-lg leading-none">{emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <div className="w-px flex-1 bg-joseon-brown/20" />
          <span className="text-joseon-brown/40 text-xs">vs</span>
          <div className="w-px flex-1 bg-joseon-brown/20" />
        </div>

        {/* Modified (clickable) */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0 max-w-[160px]">
          <span className="text-xs font-black text-joseon-red bg-joseon-red/10 px-2 py-0.5 rounded-full">찾기</span>
          <div
            className="grid gap-0.5 w-full"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
          >
            {modified.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={foundPositions.includes(i) || cleared}
                className={cellClass(i, true)}
              >
                <span className="text-lg leading-none">{emoji}</span>
                {foundPositions.includes(i) && (
                  <span className="absolute inset-0 flex items-center justify-center text-green-600 text-sm font-black bg-green-100/80 rounded-lg">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-joseon-brown/50">오른쪽에서 다른 그림을 찾아 클릭하세요!</p>
    </div>
  );
}
