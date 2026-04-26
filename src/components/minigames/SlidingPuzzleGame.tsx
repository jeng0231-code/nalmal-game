import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

interface SlidingPuzzleGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

// ─── 레벨별 난이도 ──────────────────────────────────────────
function getDifficulty(level: number) {
  if (level <= 2) return { size: 2, shuffleMoves: 3,  label: '입문', color: 'text-green-600',  bgColor: 'bg-green-50',  borderColor: 'border-green-300',  useEmoji: true  };
  if (level <= 4) return { size: 3, shuffleMoves: 10, label: '초급', color: 'text-blue-600',   bgColor: 'bg-blue-50',   borderColor: 'border-blue-300',   useEmoji: false };
  if (level <= 6) return { size: 3, shuffleMoves: 22, label: '중급', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', useEmoji: false };
  if (level <= 8) return { size: 3, shuffleMoves: 38, label: '고급', color: 'text-red-600',    bgColor: 'bg-red-50',    borderColor: 'border-red-300',    useEmoji: false };
  return            { size: 4, shuffleMoves: 30, label: '최상급', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', useEmoji: false };
}

// 2×2 이모지 타일 (입문)
const EMOJI_TILES_2 = ['', '🌸', '🎈', '⭐'];
// 3×3 한자 타일
const LABELS_3 = ['', '一', '二', '三', '四', '五', '六', '七', '八'];
const SUBS_3   = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔'];

function getTileLabel(val: number, size: number): { main: string; sub: string } {
  if (size === 2) return { main: EMOJI_TILES_2[val] ?? '', sub: '' };
  if (size === 3) return { main: LABELS_3[val] ?? '', sub: SUBS_3[val] ?? '' };
  return { main: String(val), sub: '' };
}

// ─── 퍼즐 유틸 ──────────────────────────────────────────────
function solvedState(size: number): number[] {
  return Array.from({ length: size * size }, (_, i) => (i === size * size - 1 ? 0 : i + 1));
}

function shuffleBoard(size: number, moves: number): { board: number[]; solutionPath: number[] } {
  const board = solvedState(size);
  let blank = board.indexOf(0);
  let prevBlank = -1;
  const blankHistory: number[] = [];

  for (let i = 0; i < moves; i++) {
    const r = Math.floor(blank / size), c = blank % size;
    const nb: number[] = [];
    if (r > 0)        nb.push(blank - size);
    if (r < size - 1) nb.push(blank + size);
    if (c > 0)        nb.push(blank - 1);
    if (c < size - 1) nb.push(blank + 1);
    const cands = nb.filter(n => n !== prevBlank);
    const pick  = cands[Math.floor(Math.random() * cands.length)];
    blankHistory.push(blank);
    prevBlank = blank;
    board[blank] = board[pick];
    board[pick]  = 0;
    blank        = pick;
  }
  return { board, solutionPath: [...blankHistory].reverse() };
}

function isSolved(board: number[], size: number): boolean {
  return board.every((v, i) => v === solvedState(size)[i]);
}

function isAdjacent(a: number, b: number, size: number): boolean {
  const ar = Math.floor(a / size), ac = a % size;
  const br = Math.floor(b / size), bc = b % size;
  return (ar === br && Math.abs(ac - bc) === 1) || (ac === bc && Math.abs(ar - br) === 1);
}

/** 맨해튼 거리 */
function manhattanDist(board: number[], size: number): number {
  return board.reduce((sum, v, i) => {
    if (v === 0) return sum;
    const t = v - 1;
    return sum + Math.abs(Math.floor(i / size) - Math.floor(t / size)) + Math.abs(i % size - t % size);
  }, 0);
}

/** 현재에서 맨해튼 기준 최선 타일 */
function getBestHintTile(board: number[], size: number): number {
  const blank = board.indexOf(0);
  const r = Math.floor(blank / size), c = blank % size;
  const adj: number[] = [];
  if (r > 0)        adj.push(blank - size);
  if (r < size - 1) adj.push(blank + size);
  if (c > 0)        adj.push(blank - 1);
  if (c < size - 1) adj.push(blank + 1);
  return adj.reduce((best, tile) => {
    const nb = [...board]; nb[blank] = nb[tile]; nb[tile] = 0;
    const bb = [...board]; bb[blank] = bb[best]; bb[best] = 0;
    return manhattanDist(nb, size) < manhattanDist(bb, size) ? tile : best;
  }, adj[0]);
}

/** 타일 → 빈칸 방향 화살표 이모지 */
function getArrow(from: number, to: number, size: number): string {
  const dr = Math.floor(to / size) - Math.floor(from / size);
  const dc = (to % size) - (from % size);
  if (dr === -1) return '↑';
  if (dr ===  1) return '↓';
  if (dc === -1) return '←';
  if (dc ===  1) return '→';
  return '→';
}

// ─── 상수 ────────────────────────────────────────────────────
const TUTORIAL_KEY = 'puzzle_tutorial_done';
const HINT_COST    = 5;

type GamePhase = 'ready' | 'tutorial' | 'playing' | 'result' | 'gaveup';

export default function SlidingPuzzleGame({ onComplete, level = 1 }: SlidingPuzzleGameProps) {
  const { player, spendCoins } = useGameStore();
  const diff = getDifficulty(level);
  const { size, shuffleMoves } = diff;

  const isFirstTime  = !localStorage.getItem(TUTORIAL_KEY);
  const needTutorial = isFirstTime && level <= 2;

  // ── 게임 상태 ──────────────────────────────────────────────
  const [gamePhase,     setGamePhase]     = useState<GamePhase>('ready');
  const [board,         setBoard]         = useState<number[]>([]);
  const [moves,         setMoves]         = useState(0);
  const [elapsed,       setElapsed]       = useState(0);
  const [solved,        setSolved]        = useState(false);
  const [lastSlid,      setLastSlid]      = useState<number | null>(null);
  const [hintTile,      setHintTile]      = useState<number | null>(null);
  const [hintUsed,      setHintUsed]      = useState(0);
  const [hintMsg,       setHintMsg]       = useState('');
  const [confirmGiveup, setConfirmGiveup] = useState(false);

  // ── 튜토리얼 상태 ─────────────────────────────────────────
  const [tutBoard, setTutBoard] = useState<number[]>([]);
  const [tutPath,  setTutPath]  = useState<number[]>([]);
  const [tutStep,  setTutStep]  = useState(0);
  const [tutDone,  setTutDone]  = useState(false);

  // ── 타이머 ────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing' || solved) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [gamePhase, solved]);

  // 힌트 하이라이트 자동 해제
  useEffect(() => {
    if (hintTile === null) return;
    const t = setTimeout(() => setHintTile(null), 2500);
    return () => clearTimeout(t);
  }, [hintTile]);

  // ── 일반 게임 시작 ────────────────────────────────────────
  const startGame = useCallback(() => {
    const { board: b } = shuffleBoard(size, shuffleMoves);
    setBoard(b);
    setMoves(0);
    setElapsed(0);
    setSolved(false);
    setLastSlid(null);
    setHintTile(null);
    setHintUsed(0);
    setHintMsg('');
    setConfirmGiveup(false);
    setGamePhase('playing');
  }, [size, shuffleMoves]);

  // ── 재배치 (리셔플) ───────────────────────────────────────
  const handleReset = useCallback(() => {
    const { board: b } = shuffleBoard(size, shuffleMoves);
    setBoard(b);
    setMoves(0);
    setElapsed(0);
    setSolved(false);
    setLastSlid(null);
    setHintTile(null);
    setHintMsg('');
    setConfirmGiveup(false);
  }, [size, shuffleMoves]);

  // ── 포기 ─────────────────────────────────────────────────
  const handleGiveUp = useCallback(() => {
    setGamePhase('gaveup');
    setConfirmGiveup(false);
  }, []);

  // ── 힌트 ─────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (player.coins < HINT_COST) {
      setHintMsg(`엽전 부족! (${HINT_COST}개 필요)`);
      setTimeout(() => setHintMsg(''), 2000);
      return;
    }
    const ok = spendCoins(HINT_COST);
    if (!ok) return;
    const best = getBestHintTile(board, size);
    setHintTile(best);
    setHintUsed(h => h + 1);
    setHintMsg('');
  }, [board, size, player.coins, spendCoins]);

  // ── 튜토리얼 시작 ────────────────────────────────────────
  const startTutorial = useCallback(() => {
    const { board: b, solutionPath: sol } = shuffleBoard(2, 3);
    setTutBoard(b);
    setTutPath(sol);
    setTutStep(0);
    setTutDone(false);
    setGamePhase('tutorial');
  }, []);

  // ── 튜토리얼 타일 클릭 ───────────────────────────────────
  const handleTutClick = useCallback((idx: number) => {
    const blankIdx = tutBoard.indexOf(0);
    if (tutBoard[idx] === 0 || !isAdjacent(idx, blankIdx, 2)) return;

    const next = [...tutBoard];
    next[blankIdx] = next[idx];
    next[idx]      = 0;
    setTutBoard(next);
    setTutStep(s => s + 1);

    if (isSolved(next, 2)) {
      setTutDone(true);
      localStorage.setItem(TUTORIAL_KEY, '1');
      setTimeout(() => startGame(), 1800);
    }
  }, [tutBoard, startGame]);

  // ── 일반 플레이 타일 클릭 ─────────────────────────────────
  const handleTileClick = useCallback((idx: number) => {
    if (gamePhase !== 'playing' || solved) return;
    const blankIdx = board.indexOf(0);
    if (board[idx] === 0 || !isAdjacent(idx, blankIdx, size)) return;

    const next = [...board];
    next[blankIdx] = next[idx];
    next[idx]      = 0;
    setBoard(next);
    setLastSlid(blankIdx);
    setMoves(m => m + 1);
    setHintTile(null);

    if (isSolved(next, size)) {
      setSolved(true);
      setTimeout(() => setGamePhase('result'), 700);
    }
  }, [board, gamePhase, solved, size]);

  // ════════════════════════════════════════════
  // READY 화면
  // ════════════════════════════════════════════
  if (gamePhase === 'ready') {
    const goalBoard = solvedState(diff.size);
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-5xl animate-float">🧩</div>
        <h2 className="text-2xl font-black text-joseon-dark">슬라이딩 퍼즐</h2>

        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 ${diff.bgColor} ${diff.borderColor}`}>
          <span className="text-lg">⭐</span>
          <span className={`font-black text-sm ${diff.color}`}>Lv.{level} — {diff.label}</span>
          <span className="text-sm text-gray-500">({diff.size}×{diff.size})</span>
        </div>

        <div className="bg-joseon-gold/10 border border-joseon-gold/40 rounded-2xl p-4 text-sm text-joseon-brown max-w-xs w-full text-left">
          <p className="font-bold text-center mb-3 text-base text-joseon-dark">📖 게임 방법</p>
          <div className="space-y-1.5">
            <p>① 빈 칸 옆의 타일을 눌러서 민다</p>
            <p>② 숫자/그림 순서대로 맞추면 완성!</p>
            <p>③ 막히면 <strong>💡 힌트</strong> 버튼으로 도움받기</p>
            {needTutorial && <p className="text-green-700 font-bold">✨ 처음이니까 따라하기 모드로 시작!</p>}
          </div>
        </div>

        {/* 목표 미리보기 */}
        <div className="text-center">
          <p className="text-xs text-joseon-brown/60 mb-2">🎯 이렇게 완성하면 돼요!</p>
          <div
            className="inline-grid gap-1 p-2 bg-white border-2 border-joseon-gold/40 rounded-xl"
            style={{ gridTemplateColumns: `repeat(${diff.size}, 1fr)` }}
          >
            {goalBoard.map((val, i) => {
              const { main } = getTileLabel(val, diff.size);
              return val === 0
                ? <div key={i} className="w-9 h-9 rounded-lg bg-gray-100 border border-dashed border-gray-300" />
                : (
                  <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black border ${diff.bgColor} ${diff.borderColor} ${diff.color}`}>
                    {main}
                  </div>
                );
            })}
          </div>
        </div>

        {needTutorial ? (
          <div className="w-full max-w-xs space-y-2">
            <button onClick={startTutorial} className="btn-joseon w-full py-4 text-lg">
              따라하기로 배우기! 🌟
            </button>
            <button onClick={startGame} className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-500 text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all">
              바로 시작하기
            </button>
          </div>
        ) : (
          <button onClick={startGame} className="btn-joseon w-full max-w-xs py-4 text-xl">
            시작! 🧩
          </button>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // TUTORIAL 화면 — 화살표 가이드
  // ════════════════════════════════════════════
  if (gamePhase === 'tutorial') {
    const tutBlank      = tutBoard.indexOf(0);
    const hintTileIdx   = tutPath[tutStep];   // 지금 눌러야 할 타일 위치
    const arrowDir      = (hintTileIdx !== undefined && !tutDone)
                          ? getArrow(hintTileIdx, tutBlank, 2) : '';

    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">

        {/* 말풍선 */}
        <div className="relative bg-green-100 border-2 border-green-400 rounded-2xl px-5 py-3 max-w-xs w-full">
          {tutDone ? (
            <>
              <p className="font-black text-green-800 text-lg">🎉 완성! 대단해요!</p>
              <p className="text-green-600 text-sm mt-0.5">이제 혼자서도 할 수 있어요! 🌟</p>
            </>
          ) : (
            <>
              <p className="font-black text-green-800 text-base">
                빛나는 타일을 <span className="text-yellow-600 text-xl">{arrowDir}</span> 방향으로 밀어요!
              </p>
              <p className="text-green-600 text-xs mt-0.5">{tutStep + 1} / {tutPath.length} 단계</p>
            </>
          )}
          {/* 말풍선 꼬리 */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-3 overflow-hidden">
            <div className="w-4 h-4 bg-green-400 rotate-45 -translate-y-2 mx-auto" />
          </div>
        </div>

        {/* 튜토리얼 보드 (2×2) */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-green-50 rounded-2xl border-2 border-green-300 mt-2">
          {tutBoard.map((val, idx) => {
            const isBlank  = val === 0;
            const isHint   = idx === hintTileIdx && !tutDone;
            const canSlide = !isBlank && isAdjacent(idx, tutBlank, 2);
            const { main } = getTileLabel(val, 2);
            const arrow    = isHint ? getArrow(idx, tutBlank, 2) : '';

            if (isBlank) {
              return (
                <div key={idx} className="w-24 h-24 rounded-2xl bg-green-200/50 border-2 border-dashed border-green-400 flex items-center justify-center text-green-400 text-3xl">
                  ▢
                </div>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleTutClick(idx)}
                disabled={!canSlide}
                className={`
                  relative w-24 h-24 rounded-2xl text-5xl font-black border-3 transition-all duration-200 select-none
                  ${isHint
                    ? 'bg-yellow-300 border-yellow-500 shadow-xl shadow-yellow-400/70 scale-105 cursor-pointer ring-4 ring-yellow-400 ring-offset-2'
                    : canSlide
                    ? 'bg-white border-green-400 cursor-pointer hover:bg-green-50 active:scale-95'
                    : 'bg-gray-100 border-gray-200 cursor-default opacity-50'
                  }
                `}
              >
                <span>{main}</span>
                {/* 방향 화살표 오버레이 */}
                {isHint && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-6xl font-black text-yellow-600 opacity-80 leading-none">{main}</span>
                    {/* 화살표 배지 */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg animate-bounce">
                      {arrow}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 목표 */}
        <div className="flex items-center gap-3 text-sm text-joseon-brown">
          <span>🎯 목표 순서:</span>
          <div className="grid grid-cols-2 gap-0.5">
            {['🌸','🎈','⭐',''].map((e, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg text-base flex items-center justify-center font-bold ${e ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-dashed border-gray-300'}`}>
                {e || '□'}
              </div>
            ))}
          </div>
        </div>

        <button onClick={startGame} className="text-xs text-gray-400 underline mt-1">
          튜토리얼 건너뛰기
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // GAVEUP 화면
  // ════════════════════════════════════════════
  if (gamePhase === 'gaveup') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">😮‍💨</div>
        <h2 className="text-xl font-black text-joseon-dark">다음엔 꼭 완성해요!</h2>
        <p className="text-joseon-brown text-sm">💡 힌트를 활용하면 더 쉬워요!</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 w-full max-w-xs">
          <p className="text-sm text-gray-500">이번 기록</p>
          <div className="flex justify-center gap-6 mt-2">
            <div><div className="font-black text-lg text-gray-700">{moves}</div><div className="text-xs text-gray-500">이동</div></div>
            <div><div className="font-black text-lg text-gray-700">{elapsed}초</div><div className="text-xs text-gray-500">시간</div></div>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <button onClick={startGame} className="btn-joseon w-full py-3">
            다시 도전 🔄
          </button>
          <button onClick={() => onComplete(2)} className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all">
            완료 (🪙 2개 받기)
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // RESULT 화면
  // ════════════════════════════════════════════
  if (gamePhase === 'result') {
    const baseScore   = 1000;
    const movePenalty = moves * 5;
    const timeBonus   = Math.max(0, 300 - elapsed) * 2;
    const hintPenalty = hintUsed * 30;
    const totalScore  = Math.max(0, baseScore - movePenalty + timeBonus - hintPenalty);
    const coins       = Math.max(5, Math.round(totalScore / 20));
    const emoji       = totalScore >= 800 ? '🏆' : totalScore >= 500 ? '🎉' : '😊';
    const mins        = Math.floor(elapsed / 60);
    const secs        = elapsed % 60;
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl animate-level-up">{emoji}</div>
        <h2 className="text-xl font-black text-joseon-dark">퍼즐 완성! 🎉</h2>
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-2xl font-black text-blue-600">{moves}</div>
            <div className="text-xs text-blue-700">이동 횟수</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-2xl font-black text-green-600">{mins > 0 ? `${mins}분${secs}초` : `${secs}초`}</div>
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
        {hintUsed > 0 && (
          <p className="text-xs text-gray-400">힌트 {hintUsed}회 사용 (-{hintUsed * 30}점)</p>
        )}
        <button onClick={() => onComplete(coins)} className="btn-joseon w-full max-w-xs py-4 text-lg">
          완료! →
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // PLAYING 화면
  // ════════════════════════════════════════════
  const blankIdx = board.indexOf(0);
  const mins     = Math.floor(elapsed / 60);
  const secs     = elapsed % 60;
  const tileSize = size === 2 ? 'w-28 h-28' : size === 3 ? 'w-[76px] h-[76px]' : 'w-[60px] h-[60px]';
  const fontMain = size === 2 ? 'text-5xl'  : size === 3 ? 'text-3xl' : 'text-xl';
  const fontSub  = size === 3 ? 'text-[10px]' : 'hidden';

  return (
    <div className="flex flex-col items-center gap-3 p-3">

      {/* ── 상태 바 ── */}
      <div className="flex justify-between items-center w-full max-w-xs">
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
          👣 {moves}번
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${diff.bgColor} ${diff.color}`}>
          {diff.label}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${elapsed > 120 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          ⏱ {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}초`}
        </span>
      </div>

      {/* ── 상단 액션 버튼 (항상 표시) ── */}
      <div className="flex gap-2 w-full max-w-xs">
        {/* 힌트 */}
        <button
          onClick={handleHint}
          disabled={solved}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
            player.coins >= HINT_COST && !solved
              ? 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
              : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}
        >
          💡 힌트
          <span className="text-xs ml-1 opacity-70">({HINT_COST}🪙)</span>
        </button>

        {/* 재배치 */}
        <button
          onClick={handleReset}
          disabled={solved}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-40"
        >
          🔄 재배치
        </button>

        {/* 포기 / 확인 */}
        {!confirmGiveup ? (
          <button
            onClick={() => setConfirmGiveup(true)}
            disabled={solved}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 bg-gray-50 border-gray-300 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all active:scale-95 disabled:opacity-40"
          >
            🏳️ 포기
          </button>
        ) : (
          <button
            onClick={handleGiveUp}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 bg-red-50 border-red-400 text-red-600 animate-pulse active:scale-95"
          >
            확인? ✔
          </button>
        )}
      </div>

      {/* 힌트 메시지 */}
      {hintMsg && (
        <p className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1 rounded-full">{hintMsg}</p>
      )}
      {hintUsed > 0 && !hintMsg && (
        <p className="text-amber-500 text-xs">힌트 {hintUsed}회 사용</p>
      )}
      {confirmGiveup && (
        <p className="text-red-400 text-xs animate-pulse">정말 포기할까요? 다시 한 번 눌러주세요!</p>
      )}

      {/* ── 퍼즐 보드 ── */}
      <div
        className="grid gap-1.5 p-3 bg-joseon-dark/10 rounded-2xl border-2 border-joseon-brown/30"
        style={{ gridTemplateColumns: `repeat(${size}, auto)` }}
      >
        {board.map((val, idx) => {
          const isBlank  = val === 0;
          const canSlide = !isBlank && isAdjacent(idx, blankIdx, size);
          const isHint   = idx === hintTile;
          const justMoved = idx === lastSlid;
          const { main, sub } = getTileLabel(val, size);
          const arrow = isHint ? getArrow(idx, blankIdx, size) : '';

          if (isBlank) {
            return (
              <div
                key={idx}
                className={`${tileSize} rounded-xl bg-joseon-dark/20 border-2 border-dashed border-joseon-brown/30`}
              />
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`
                relative ${tileSize} rounded-xl border-2 flex flex-col items-center justify-center
                font-black transition-all duration-150 select-none shadow-sm
                ${isHint
                  ? 'bg-yellow-300 border-yellow-500 shadow-yellow-400/70 shadow-lg scale-110 animate-pulse cursor-pointer z-10 ring-4 ring-yellow-400 ring-offset-1'
                  : canSlide
                  ? 'bg-joseon-gold border-joseon-dark text-joseon-dark hover:bg-yellow-300 active:scale-95 cursor-pointer'
                  : 'bg-joseon-cream border-joseon-brown/40 text-joseon-dark/50 cursor-default'
                }
                ${justMoved ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
              `}
            >
              <span className={fontMain}>{main}</span>
              {sub && <span className={`${fontSub} text-joseon-brown/60 font-normal mt-0.5`}>{sub}</span>}
              {/* 힌트 방향 배지 */}
              {isHint && (
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-base font-black shadow-lg z-20">
                  {arrow}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 완성 메시지 */}
      {solved && <p className="text-green-600 font-black text-lg animate-pulse">🎉 완성!</p>}

      {/* 목표 미리보기 (3×3 이상) */}
      {size >= 3 && (
        <div className="flex items-center gap-2 text-xs text-joseon-brown/50">
          <span>🎯 목표:</span>
          <div className={`inline-grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {Array.from({ length: size * size }, (_, i) => {
              const val = i < size * size - 1 ? i + 1 : 0;
              const { main } = getTileLabel(val, size);
              return val === 0
                ? <div key={i} className="w-5 h-5 bg-gray-200 rounded" />
                : <div key={i} className="w-5 h-5 bg-joseon-gold/30 rounded text-[8px] font-bold flex items-center justify-center text-joseon-dark">{main}</div>;
            })}
          </div>
        </div>
      )}

      {/* 엽전 현황 */}
      <p className="text-xs text-joseon-brown/50">보유 엽전: 🪙 {player.coins}개</p>
    </div>
  );
}
