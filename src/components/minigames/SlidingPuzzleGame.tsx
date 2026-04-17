import { useState, useEffect, useCallback } from 'react';

interface SlidingPuzzleGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

// 3×3 타일 레이블 (0 = 빈칸)
const LABELS_3 = ['', '一', '二', '三', '四', '五', '六', '七', '八'];
// 3×3 서브텍스트
const SUBS_3   = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔'];

/** 목표 상태: [1,2,...,n²-1, 0] */
function solvedState(size: number): number[] {
  return Array.from({ length: size * size }, (_, i) =>
    i === size * size - 1 ? 0 : i + 1
  );
}

/** 합법적 이동으로만 섞기 → 항상 풀 수 있음 */
function shuffleBoard(size: number, moves: number): number[] {
  const board = solvedState(size);
  let blank = board.indexOf(0);
  let prevBlank = -1;

  for (let i = 0; i < moves; i++) {
    const row = Math.floor(blank / size);
    const col = blank % size;
    const neighbors: number[] = [];
    if (row > 0)          neighbors.push(blank - size);
    if (row < size - 1)   neighbors.push(blank + size);
    if (col > 0)          neighbors.push(blank - 1);
    if (col < size - 1)   neighbors.push(blank + 1);

    // 직전 위치로 되돌아가지 않도록 필터 (무한 왔다갔다 방지)
    const candidates = neighbors.filter(n => n !== prevBlank);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    prevBlank = blank;
    board[blank] = board[pick];
    board[pick] = 0;
    blank = pick;
  }
  return board;
}

function isSolved(board: number[], size: number): boolean {
  const goal = solvedState(size);
  return board.every((v, i) => v === goal[i]);
}

function isAdjacent(a: number, b: number, size: number): boolean {
  const ar = Math.floor(a / size), ac = a % size;
  const br = Math.floor(b / size), bc = b % size;
  return (ar === br && Math.abs(ac - bc) === 1) ||
         (ac === bc && Math.abs(ar - br) === 1);
}

type GamePhase = 'ready' | 'playing' | 'result';

export default function SlidingPuzzleGame({ onComplete, level = 1 }: SlidingPuzzleGameProps) {
  const SIZE          = level >= 6 ? 4 : 3;
  const SHUFFLE_MOVES = 20 + level * 8;

  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [board,     setBoard]     = useState<number[]>([]);
  const [moves,     setMoves]     = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const [solved,    setSolved]    = useState(false);
  const [lastSlid,  setLastSlid]  = useState<number | null>(null);

  // 타이머
  useEffect(() => {
    if (gamePhase !== 'playing' || solved) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [gamePhase, solved]);

  const startGame = useCallback(() => {
    const b = shuffleBoard(SIZE, SHUFFLE_MOVES);
    setBoard(b);
    setMoves(0);
    setElapsed(0);
    setSolved(false);
    setLastSlid(null);
    setGamePhase('playing');
  }, [SIZE, SHUFFLE_MOVES]);

  const handleTileClick = useCallback((idx: number) => {
    if (gamePhase !== 'playing' || solved) return;
    const blankIdx = board.indexOf(0);
    if (board[idx] === 0) return;
    if (!isAdjacent(idx, blankIdx, SIZE)) return;

    const next = [...board];
    next[blankIdx] = next[idx];
    next[idx] = 0;
    setBoard(next);
    setLastSlid(blankIdx); // 방금 타일이 이동해온 위치 강조
    setMoves(m => m + 1);

    if (isSolved(next, SIZE)) {
      setSolved(true);
      setTimeout(() => setGamePhase('result'), 600);
    }
  }, [board, gamePhase, solved, SIZE]);

  // ── READY ──────────────────────────────────────────────────
  if (gamePhase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl animate-float">🧩</div>
        <h2 className="text-2xl font-black text-joseon-dark">슬라이딩 퍼즐</h2>
        <div className="bg-joseon-gold/10 border border-joseon-gold/40 rounded-2xl p-4 text-sm text-joseon-brown max-w-xs">
          <p className="font-bold mb-2">📖 게임 방법</p>
          <p>빈 칸 옆의 타일을 클릭해서 밀고<br />순서대로 정렬하세요!</p>
          <div className="mt-3 flex justify-center gap-4 text-xs opacity-70">
            <span>📐 {SIZE}×{SIZE} 격자</span>
            <span>🔀 난이도 {level <= 2 ? '쉬움' : level <= 5 ? '보통' : '어려움'}</span>
          </div>
          {/* 목표 미리보기 (3×3만) */}
          {SIZE === 3 && (
            <div className="mt-3">
              <p className="text-xs text-joseon-brown/60 mb-1">목표 상태</p>
              <div className="grid grid-cols-3 gap-0.5 w-20 mx-auto">
                {LABELS_3.slice(1).map((l, i) => (
                  <div key={i} className="bg-joseon-gold/30 rounded text-xs font-bold text-joseon-dark aspect-square flex items-center justify-center">
                    {l}
                  </div>
                ))}
                <div className="bg-gray-200 rounded aspect-square" />
              </div>
            </div>
          )}
        </div>
        <button onClick={startGame} className="btn-joseon w-full max-w-xs py-4 text-xl">
          시작! 🧩
        </button>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────
  if (gamePhase === 'result') {
    const baseScore     = 1000;
    const movesPenalty  = moves * 5;
    const timeBonus     = Math.max(0, 300 - elapsed) * 2;
    const totalScore    = Math.max(0, baseScore - movesPenalty + timeBonus);
    const coins         = Math.max(5, Math.round(totalScore / 20));
    const emoji         = totalScore >= 800 ? '🏆' : totalScore >= 500 ? '🎉' : '😊';
    const mins          = Math.floor(elapsed / 60);
    const secs          = elapsed % 60;

    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-level-up">{emoji}</div>
        <h2 className="text-xl font-black text-joseon-dark">퍼즐 완성!</h2>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-2xl font-black text-blue-600">{moves}</div>
            <div className="text-xs text-blue-700">이동 횟수</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-2xl font-black text-green-600">
              {mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`}
            </div>
            <div className="text-xs text-green-700">소요 시간</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-3">
            <div className="text-2xl font-black text-joseon-red">{totalScore}</div>
            <div className="text-xs text-joseon-brown">총점</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="text-2xl font-black text-yellow-600">🪙 {coins}</div>
            <div className="text-xs text-yellow-700">엽전 획득</div>
          </div>
        </div>

        <button onClick={() => onComplete(coins)} className="btn-joseon w-full max-w-xs py-4 text-lg">
          완료! →
        </button>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────
  const blankIdx = board.indexOf(0);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // 타일 크기 결정
  const tileSize = SIZE === 3 ? 'w-20 h-20' : 'w-14 h-14';
  const fontSize  = SIZE === 3 ? 'text-3xl'  : 'text-lg';
  const subSize   = SIZE === 3 ? 'text-[10px]' : 'hidden';

  return (
    <div className="flex flex-col items-center gap-3 p-3">
      {/* 상태 바 */}
      <div className="flex justify-between w-full max-w-xs text-sm font-bold">
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          👣 {moves}번 이동
        </span>
        <span className={`px-3 py-1 rounded-full ${elapsed > 120 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          ⏱ {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}초`}
        </span>
      </div>

      {/* 퍼즐 그리드 */}
      <div
        className="grid gap-1.5 p-3 bg-joseon-dark/10 rounded-2xl border-2 border-joseon-brown/30"
        style={{ gridTemplateColumns: `repeat(${SIZE}, auto)` }}
      >
        {board.map((val, idx) => {
          const isBlank    = val === 0;
          const canSlide   = !isBlank && isAdjacent(idx, blankIdx, SIZE);
          const justMoved  = idx === lastSlid;

          if (isBlank) {
            return (
              <div
                key={idx}
                className={`${tileSize} rounded-xl bg-joseon-dark/20 border-2 border-dashed border-joseon-brown/30`}
              />
            );
          }

          const label = SIZE === 3 ? LABELS_3[val] : String(val);
          const sub   = SIZE === 3 ? SUBS_3[val]   : '';

          return (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`
                ${tileSize} rounded-xl border-2 flex flex-col items-center justify-center
                font-black transition-all duration-100 select-none shadow-sm
                ${canSlide
                  ? 'bg-joseon-gold border-joseon-dark text-joseon-dark hover:bg-yellow-300 active:scale-95 cursor-pointer'
                  : 'bg-joseon-cream border-joseon-brown/40 text-joseon-dark/60 cursor-default'
                }
                ${justMoved ? 'ring-2 ring-joseon-gold ring-offset-1' : ''}
              `}
            >
              <span className={fontSize}>{label}</span>
              {sub && <span className={`${subSize} text-joseon-brown/70 font-normal`}>{sub}</span>}
            </button>
          );
        })}
      </div>

      {solved && (
        <p className="text-green-600 font-black text-lg animate-pulse">🎉 완성!</p>
      )}

      {/* 목표 힌트 (3×3) */}
      {SIZE === 3 && (
        <div className="flex items-center gap-2 text-xs text-joseon-brown/50">
          <span>목표:</span>
          <div className="grid grid-cols-3 gap-0.5">
            {LABELS_3.slice(1).map((l, i) => (
              <div key={i} className="w-5 h-5 bg-joseon-gold/30 rounded text-[8px] font-bold flex items-center justify-center text-joseon-dark">
                {l}
              </div>
            ))}
            <div className="w-5 h-5 bg-gray-200 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
