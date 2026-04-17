import { useState, useCallback } from 'react';

interface YutGameProps {
  onComplete: (score: number) => void;
}

type YutResult = '도' | '개' | '걸' | '윷' | '모';

interface Piece { pos: number; done: boolean; }  // pos: 0=대기, 1~20=진행, done=완주

const YUT_MOVES: Record<YutResult, number> = { 도: 1, 개: 2, 걸: 3, 윷: 4, 모: 5 };
const YUT_EMOJI: Record<YutResult, string>  = { 도: '🐷', 개: '🐕', 걸: '🦌', 윷: '🎉', 모: '🐎' };
const GOAL = 20;

// 확률: 도38% 개28% 걸17% 윷11% 모6%
function rollYut(): YutResult {
  const r = Math.random() * 100;
  if (r < 38) return '도';
  if (r < 66) return '개';
  if (r < 83) return '걸';
  if (r < 94) return '윷';
  return '모';
}

// 상태머신 단계
type Step = 'player-throw' | 'player-move' | 'cpu-throw' | 'cpu-auto' | 'finished';

export default function YutGame({ onComplete }: YutGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [step, setStep] = useState<Step>('player-throw');

  const [myPieces, setMyPieces]  = useState<Piece[]>([{ pos: 0, done: false }, { pos: 0, done: false }]);
  const [cpuPieces, setCpuPieces] = useState<Piece[]>([{ pos: 0, done: false }, { pos: 0, done: false }]);

  const [lastYut, setLastYut] = useState<YutResult | null>(null);
  const [extraTurn, setExtraThrow] = useState(false);   // 윷/모 → 한 번 더
  const [log, setLog] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);        // 주사위 굴리는 애니메이션
  const [winner, setWinner] = useState<'me' | 'cpu' | null>(null);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 5)]);

  // ── 승리 체크 ──────────────────────────────────────────
  const checkWin = (pieces: Piece[]): boolean => pieces.every(p => p.done);

  // ── 말 이동 ────────────────────────────────────────────
  const movePiece = (pieces: Piece[], idx: number, moves: number): Piece[] => {
    const next = [...pieces.map(p => ({ ...p }))];
    const newPos = next[idx].pos + moves;
    if (newPos >= GOAL) {
      next[idx].pos = GOAL;
      next[idx].done = true;
    } else {
      next[idx].pos = newPos;
    }
    return next;
  };

  // ── 플레이어 윷 던지기 ──────────────────────────────────
  const handlePlayerThrow = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setLastYut(null);

    setTimeout(() => {
      const result = rollYut();
      const moves = YUT_MOVES[result];
      const extra = result === '윷' || result === '모';
      setLastYut(result);
      setRolling(false);
      addLog(`🎲 나: ${YUT_EMOJI[result]} ${result}(${moves}칸)${extra ? ' 🎉 한 번 더!' : ''}`);
      setExtraThrow(extra);
      setStep('player-move');
    }, 600);
  }, [rolling]);

  // ── 플레이어 말 선택 ─────────────────────────────────────
  const handleSelectPiece = useCallback((idx: number) => {
    if (!lastYut || step !== 'player-move') return;
    const moves = YUT_MOVES[lastYut];
    const updated = movePiece(myPieces, idx, moves);
    setMyPieces(updated);
    addLog(`👤 내 말${idx + 1}: ${updated[idx].done ? '완주! 🎉' : updated[idx].pos + '칸'}`);

    if (checkWin(updated)) { setWinner('me'); setPhase('result'); return; }

    if (extraTurn) {
      // 한 번 더 던질 수 있음
      setLastYut(null);
      setExtraThrow(false);
      setStep('player-throw');
    } else {
      // CPU 차례
      setLastYut(null);
      setStep('cpu-throw');
      setTimeout(() => runCpuTurn(), 600);
    }
  }, [lastYut, step, myPieces, extraTurn]);

  // ── CPU 자동 턴 (재귀 없이 단순 루프) ──────────────────
  const runCpuTurn = useCallback(() => {
    setStep('cpu-auto');
    let currentPieces = cpuPieces.map(p => ({ ...p }));

    const takeCpuThrow = (pieces: Piece[]) => {
      setRolling(true);
      setTimeout(() => {
        const result = rollYut();
        const moves = YUT_MOVES[result];
        const extra = result === '윷' || result === '모';
        setLastYut(result);
        setRolling(false);
        addLog(`🖥️ CPU: ${YUT_EMOJI[result]} ${result}(${moves}칸)${extra ? ' 🎉' : ''}`);

        // 가장 뒤처진 말 이동
        const target = pieces[0].pos <= pieces[1].pos ? 0 : 1;
        const updated = movePiece(pieces, target, moves);
        setCpuPieces(updated);
        addLog(`🖥️ CPU 말${target + 1}: ${updated[target].done ? '완주! 🎉' : updated[target].pos + '칸'}`);

        if (checkWin(updated)) { setWinner('cpu'); setPhase('result'); return; }

        if (extra) {
          takeCpuThrow(updated); // 한 번 더
        } else {
          setLastYut(null);
          setStep('player-throw'); // 플레이어 차례로
        }
      }, 800);
    };

    takeCpuThrow(currentPieces);
  }, [cpuPieces]);

  /* ── 진행 바 ──────────────────────────────────────────── */
  const PieceBars = () => (
    <div className="space-y-2">
      {myPieces.map((p, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-joseon-brown mb-0.5">
            <span>👤 내 말{i + 1}</span>
            <span>{p.done ? '완주✅' : `${p.pos}/${GOAL}`}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-joseon-red rounded-full transition-all duration-500"
              style={{ width: `${(p.pos / GOAL) * 100}%` }} />
          </div>
        </div>
      ))}
      {cpuPieces.map((p, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
            <span>🖥️ CPU 말{i + 1}</span>
            <span>{p.done ? '완주✅' : `${p.pos}/${GOAL}`}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gray-500 rounded-full transition-all duration-500"
              style={{ width: `${(p.pos / GOAL) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  /* ── 준비 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl animate-float">🎯</div>
        <h2 className="text-2xl font-black text-joseon-dark">윷놀이</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs">
          <p className="font-bold mb-2">📜 윷 결과표</p>
          {(Object.keys(YUT_MOVES) as YutResult[]).map(y => (
            <p key={y}>{YUT_EMOJI[y]} <b>{y}</b> → {YUT_MOVES[y]}칸
              {(y === '윷' || y === '모') && ' + 한 번 더!'}
            </p>
          ))}
          <p className="mt-2 text-joseon-red font-bold">말 2개를 먼저 완주시키면 승리!</p>
        </div>
        <button onClick={() => setPhase('playing')} className="btn-joseon px-10 py-4 text-lg">
          시작! 🎲
        </button>
      </div>
    );
  }

  /* ── 결과 ── */
  if (phase === 'result') {
    const iWon = winner === 'me';
    const score = iWon ? 100 : 30;
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">{iWon ? '🏆' : '😢'}</div>
        <h3 className="text-2xl font-black text-joseon-dark">
          {iWon ? '승리했어요! 🎉' : 'CPU가 이겼어요!'}
        </h3>
        <p className="text-joseon-brown text-sm">
          {iWon ? '훌륭한 윷놀이 실력이에요!' : '아쉬워요! 다음엔 꼭 이겨봐요!'}
        </p>
        <div className="card-joseon p-3 font-bold text-joseon-dark">
          획득 엽전: 🪙 {score}개
        </div>
        <button onClick={() => onComplete(score)} className="btn-joseon px-10 py-4">
          계속하기 →
        </button>
      </div>
    );
  }

  /* ── 게임 ── */
  const isMyTurn = step === 'player-throw' || step === 'player-move';

  return (
    <div className="flex flex-col gap-3 p-3 w-full max-w-xs mx-auto">
      {/* 턴 표시 */}
      <div className={`text-center font-bold py-2 rounded-xl text-sm ${
        isMyTurn
          ? 'bg-joseon-red/10 text-joseon-red border border-joseon-red/30'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {isMyTurn ? '🎲 내 차례!' : '🖥️ CPU가 생각 중...'}
      </div>

      {/* 진행 바 */}
      <div className="card-joseon p-3">
        <PieceBars />
      </div>

      {/* 윷 결과 */}
      {lastYut && (
        <div className="text-center card-joseon p-3 animate-bounce-in">
          <div className="text-4xl">{YUT_EMOJI[lastYut]}</div>
          <div className="font-black text-joseon-dark text-xl">{lastYut}! ({YUT_MOVES[lastYut]}칸)</div>
          {extraTurn && <div className="text-joseon-gold text-sm font-bold">🎉 한 번 더!</div>}
        </div>
      )}

      {/* 굴리는 중 */}
      {rolling && (
        <div className="text-center py-2">
          <div className="text-3xl animate-bounce">🎲</div>
        </div>
      )}

      {/* 말 선택 (플레이어 이동 단계) */}
      {step === 'player-move' && lastYut && (
        <div className="flex gap-2">
          {myPieces.map((p, i) => (
            <button key={i} onClick={() => handleSelectPiece(i)} disabled={p.done}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                p.done
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'btn-joseon hover:scale-105 active:scale-95'
              }`}>
              말{i + 1} 이동<br />
              <span className="text-xs font-normal">{p.done ? '완주✅' : p.pos === 0 ? '출발 전' : p.pos + '칸'}</span>
            </button>
          ))}
        </div>
      )}

      {/* 던지기 버튼 */}
      {step === 'player-throw' && (
        <button onClick={handlePlayerThrow} disabled={rolling}
          className={`btn-joseon w-full text-xl py-5 ${rolling ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}>
          🎲 윷 던지기!
        </button>
      )}

      {/* 로그 */}
      <div className="card-joseon p-2 text-xs text-joseon-brown space-y-0.5 max-h-20 overflow-hidden">
        {log.length === 0
          ? <p className="text-center text-gray-400">게임 기록이 여기에 표시돼요</p>
          : log.map((l, i) => (
              <p key={i} className={i === 0 ? 'font-bold text-joseon-dark' : 'opacity-60'}>{l}</p>
            ))
        }
      </div>
    </div>
  );
}
