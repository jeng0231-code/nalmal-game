import { useState, useCallback, useRef } from 'react';

interface YutGameProps {
  onComplete: (score: number) => void;
}

type YutResult = '도' | '개' | '걸' | '윷' | '모';
type StickFace = 'flat' | 'round';

interface Piece { pos: number; done: boolean; }

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

// 윷 결과에 따른 윷가락 패턴 (flat=앞면, round=뒷면)
// 도=1앞, 개=2앞, 걸=3앞, 윷=4앞, 모=0앞
function getStickPattern(result: YutResult): StickFace[] {
  const flatCount = { 도: 1, 개: 2, 걸: 3, 윷: 4, 모: 0 }[result];
  const arr: StickFace[] = [
    ...Array(flatCount).fill('flat'),
    ...Array(4 - flatCount).fill('round'),
  ];
  // 셔플
  return arr.sort(() => Math.random() - 0.5);
}

// 윷판 좌표 (260×260 SVG, 테두리=10)
// 시작=우하단, 반시계방향
const BOARD_COORDS: [number, number][] = [
  [250, 250], // 0 = 시작/도착 (우하단)
  [202, 250], // 1
  [154, 250], // 2
  [106, 250], // 3
  [58,  250], // 4
  [10,  250], // 5 = 좌하단 모퉁이
  [10,  202], // 6
  [10,  154], // 7
  [10,  106], // 8
  [10,  58],  // 9
  [10,  10],  // 10 = 좌상단 모퉁이
  [58,  10],  // 11
  [106, 10],  // 12
  [154, 10],  // 13
  [202, 10],  // 14
  [250, 10],  // 15 = 우상단 모퉁이
  [250, 58],  // 16
  [250, 106], // 17
  [250, 154], // 18
  [250, 202], // 19
  [250, 250], // 20 = 도착 (우하단)
];
type Step = 'player-throw' | 'player-move' | 'cpu-throw' | 'cpu-auto' | 'finished';

const INITIAL_PIECES = (): Piece[] => [
  { pos: 0, done: false },
  { pos: 0, done: false },
];

export default function YutGame({ onComplete }: YutGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [step, setStep] = useState<Step>('player-throw');

  const [myPieces, setMyPieces]   = useState<Piece[]>(INITIAL_PIECES());
  const [cpuPieces, setCpuPieces] = useState<Piece[]>(INITIAL_PIECES());

  const [lastYut, setLastYut] = useState<YutResult | null>(null);
  const [extraTurn, setExtraTurn] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);
  const [sticks, setSticks] = useState<StickFace[]>(['flat', 'flat', 'flat', 'flat']);
  const [winner, setWinner] = useState<'me' | 'cpu' | null>(null);
  const [movingPiece, setMovingPiece] = useState<{ who: 'me' | 'cpu'; idx: number } | null>(null);

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 6)]);
  const checkWin = (pieces: Piece[]) => pieces.every(p => p.done);

  const movePiece = (pieces: Piece[], idx: number, moves: number): Piece[] => {
    const next = pieces.map(p => ({ ...p }));
    const newPos = next[idx].pos + moves;
    if (newPos >= GOAL) {
      next[idx].pos = GOAL;
      next[idx].done = true;
    } else {
      next[idx].pos = newPos;
    }
    return next;
  };

  // 윷가락 굴리기 애니메이션 + 결과 계산
  const doRoll = useCallback((onResult: (result: YutResult) => void) => {
    setRolling(true);
    setLastYut(null);
    let ticks = 0;
    rollIntervalRef.current = setInterval(() => {
      setSticks([0, 1, 2, 3].map(() =>
        Math.random() < 0.5 ? 'flat' : 'round'
      ) as StickFace[]);
      ticks++;
      if (ticks >= 7) {
        clearInterval(rollIntervalRef.current!);
        const result = rollYut();
        setSticks(getStickPattern(result));
        setLastYut(result);
        setRolling(false);
        onResult(result);
      }
    }, 90);
  }, []);

  // 플레이어 던지기
  const handlePlayerThrow = useCallback(() => {
    if (rolling || step !== 'player-throw') return;
    doRoll((result) => {
      const moves = YUT_MOVES[result];
      const extra = result === '윷' || result === '모';
      addLog(`🎲 나: ${YUT_EMOJI[result]} ${result}(${moves}칸)${extra ? ' 🎉' : ''}`);
      setExtraTurn(extra);
      setStep('player-move');
    });
  }, [rolling, step, doRoll]);

  // 플레이어 말 선택
  const handleSelectPiece = useCallback((idx: number) => {
    if (!lastYut || step !== 'player-move') return;
    const moves = YUT_MOVES[lastYut];
    const updated = movePiece(myPieces, idx, moves);
    setMovingPiece({ who: 'me', idx });
    setMyPieces(updated);
    addLog(`👤 내 말${idx + 1}: ${updated[idx].done ? '완주! 🎉' : updated[idx].pos + '칸'}`);

    setTimeout(() => setMovingPiece(null), 400);

    if (checkWin(updated)) { setWinner('me'); setPhase('result'); return; }

    if (extraTurn) {
      setLastYut(null);
      setExtraTurn(false);
      setStep('player-throw');
    } else {
      setLastYut(null);
      setStep('cpu-throw');
      setTimeout(() => runCpuTurn(cpuPieces), 700);
    }
  }, [lastYut, step, myPieces, extraTurn, cpuPieces]);

  // CPU 자동 턴
  const runCpuTurn = useCallback((currentPieces: Piece[]) => {
    setStep('cpu-auto');

    const takeCpuThrow = (pieces: Piece[]) => {
      doRoll((result) => {
        const moves = YUT_MOVES[result];
        const extra = result === '윷' || result === '모';
        addLog(`🖥️ CPU: ${YUT_EMOJI[result]} ${result}(${moves}칸)${extra ? ' 🎉' : ''}`);

        // 뒤처진 말 이동
        const target = pieces[0].pos <= pieces[1].pos ? 0 : 1;
        const updated = movePiece(pieces, target, moves);
        setMovingPiece({ who: 'cpu', idx: target });
        setCpuPieces(updated);
        addLog(`🖥️ CPU 말${target + 1}: ${updated[target].done ? '완주! 🎉' : updated[target].pos + '칸'}`);

        setTimeout(() => setMovingPiece(null), 400);

        if (checkWin(updated)) { setWinner('cpu'); setPhase('result'); return; }

        if (extra) {
          setTimeout(() => takeCpuThrow(updated), 900);
        } else {
          setTimeout(() => {
            setLastYut(null);
            setStep('player-throw');
          }, 600);
        }
      });
    };

    setTimeout(() => takeCpuThrow(currentPieces), 400);
  }, [doRoll]);

  const startGame = () => {
    setMyPieces(INITIAL_PIECES());
    setCpuPieces(INITIAL_PIECES());
    setLastYut(null);
    setExtraTurn(false);
    setLog([]);
    setWinner(null);
    setSticks(['flat', 'flat', 'flat', 'flat']);
    setStep('player-throw');
    setPhase('playing');
  };

  /* ── 준비 ── */
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl">🎯</div>
        <h2 className="text-2xl font-black text-joseon-dark">윷놀이</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs">
          <p className="font-bold mb-2">📜 윷가락 결과</p>
          {(Object.keys(YUT_MOVES) as YutResult[]).map(y => (
            <p key={y} className="text-left">
              {YUT_EMOJI[y]} <b>{y}</b> → {YUT_MOVES[y]}칸
              {(y === '윷' || y === '모') && <span className="text-joseon-red"> + 한 번 더!</span>}
            </p>
          ))}
          <p className="mt-2 text-joseon-red font-bold">말 2개를 먼저 완주하면 승리!</p>
        </div>
        <button onClick={startGame} className="btn-joseon px-10 py-4 text-lg">
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
          {iWon ? '승리! 🎉' : 'CPU가 이겼어요!'}
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
    <div className="flex flex-col gap-3 p-3 w-full max-w-sm mx-auto">

      {/* 턴 표시 */}
      <div className={`text-center font-bold py-2 rounded-xl text-sm ${
        isMyTurn
          ? 'bg-joseon-red/10 text-joseon-red border border-joseon-red/30'
          : 'bg-blue-50 text-blue-600 border border-blue-200'
      }`}>
        {isMyTurn ? '🎲 내 차례!' : '🖥️ CPU 차례...'}
      </div>

      {/* 윷판 + 윷가락 */}
      <div className="flex gap-3 items-start">

        {/* 윷판 SVG */}
        <div className="flex-shrink-0">
          <YutBoard
            myPieces={myPieces}
            cpuPieces={cpuPieces}
            movingPiece={movingPiece}
          />
        </div>

        {/* 우측: 윷가락 + 결과 */}
        <div className="flex-1 flex flex-col gap-2 items-center justify-start pt-1">
          <div className="text-xs text-joseon-brown font-bold text-center">윷가락</div>

          {/* 4개 윷가락 */}
          <div className="flex gap-1 justify-center">
            {sticks.map((face, i) => (
              <StickDisplay key={i} face={face} rolling={rolling} />
            ))}
          </div>

          {/* 윷 결과 */}
          {lastYut && !rolling && (
            <div className="text-center bg-joseon-gold/10 border border-joseon-gold/40 rounded-xl p-2 w-full">
              <div className="text-3xl">{YUT_EMOJI[lastYut]}</div>
              <div className="font-black text-joseon-dark">{lastYut}! ({YUT_MOVES[lastYut]}칸)</div>
              {extraTurn && <div className="text-joseon-red text-xs font-bold">🎉 한 번 더!</div>}
            </div>
          )}

          {rolling && (
            <div className="text-center py-2">
              <div className="text-2xl animate-bounce">🎲</div>
              <div className="text-xs text-joseon-brown">굴리는 중...</div>
            </div>
          )}

          {/* 말 선택 버튼 */}
          {step === 'player-move' && lastYut && (
            <div className="w-full space-y-1">
              <div className="text-xs text-joseon-brown text-center font-bold">어느 말을 이동?</div>
              {myPieces.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectPiece(i)}
                  disabled={p.done}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                    p.done
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'btn-joseon hover:scale-105 active:scale-95'
                  }`}
                >
                  말{i + 1} ({p.done ? '완주✅' : p.pos === 0 ? '출발 전' : p.pos + '칸'})
                </button>
              ))}
            </div>
          )}

          {/* 던지기 버튼 */}
          {step === 'player-throw' && (
            <button
              onClick={handlePlayerThrow}
              disabled={rolling}
              className={`w-full btn-joseon text-base py-3 ${rolling ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
            >
              🎲 던지기!
            </button>
          )}
        </div>
      </div>

      {/* 로그 */}
      <div className="card-joseon p-2 text-xs text-joseon-brown space-y-0.5 max-h-16 overflow-hidden">
        {log.length === 0
          ? <p className="text-center text-gray-400">게임 기록</p>
          : log.map((l, i) => (
              <p key={i} className={i === 0 ? 'font-bold text-joseon-dark' : 'opacity-50'}>{l}</p>
            ))
        }
      </div>

    </div>
  );
}

/* ── 윷판 SVG ── */
function YutBoard({
  myPieces,
  cpuPieces,
  movingPiece,
}: {
  myPieces: Piece[];
  cpuPieces: Piece[];
  movingPiece: { who: 'me' | 'cpu'; idx: number } | null;
}) {
  const SIZE = 170;
  const PAD = 10;

  // 외곽 경로 좌표 (0~20 위치)
  const coords = BOARD_COORDS.map(([x, y]) => [
    PAD + (x / 260) * (SIZE - PAD * 2),
    PAD + (y / 260) * (SIZE - PAD * 2),
  ] as [number, number]);

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // 모퉁이 (0,5,10,15) 좌표
  const corners = [0, 5, 10, 15];

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="rounded-xl border-2 border-joseon-brown bg-amber-50"
    >
      {/* 배경 무늬 */}
      <rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2}
        fill="none" stroke="#d97706" strokeWidth="1" strokeOpacity="0.2" />

      {/* 외곽 선 */}
      {[
        // 아래 (0→5)
        [coords[0], coords[5]],
        // 왼쪽 (5→10)
        [coords[5], coords[10]],
        // 위 (10→15)
        [coords[10], coords[15]],
        // 오른쪽 (15→0)
        [coords[15], coords[0]],
      ].map(([a, b], i) => (
        <line key={i}
          x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
          stroke="#92400e" strokeWidth="1.5" strokeOpacity="0.5"
        />
      ))}

      {/* 대각선 (윷판 지름길 표시) */}
      {/* BL(5) → TR(15) */}
      <line x1={coords[5][0]} y1={coords[5][1]} x2={coords[15][0]} y2={coords[15][1]}
        stroke="#92400e" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3,3" />
      {/* TL(10) → BR(0) */}
      <line x1={coords[10][0]} y1={coords[10][1]} x2={coords[0][0]} y2={coords[0][1]}
        stroke="#92400e" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3,3" />
      {/* 중심 점 */}
      <circle cx={cx} cy={cy} r={4} fill="#d97706" fillOpacity="0.4" />

      {/* 위치 점들 */}
      {coords.slice(0, 20).map(([x, y], i) => {
        const isCorner = corners.includes(i);
        return (
          <circle key={i}
            cx={x} cy={y}
            r={isCorner ? 5 : 3.5}
            fill={isCorner ? '#92400e' : '#d97706'}
            fillOpacity={isCorner ? 0.7 : 0.4}
          />
        );
      })}

      {/* 시작/도착 표시 */}
      <text x={coords[0][0] - 3} y={coords[0][1] - 8}
        fontSize="7" fill="#92400e" fontWeight="bold" textAnchor="middle">
        출발
      </text>

      {/* 말들 렌더링 */}
      {myPieces.map((p, i) => {
        if (p.done || p.pos === 0) return null;
        const [x, y] = coords[p.pos] || coords[0];
        const isMoving = movingPiece?.who === 'me' && movingPiece.idx === i;
        return (
          <g key={`my-${i}`}>
            <circle
              cx={x + (i === 1 ? 5 : -5)}
              cy={y - 1}
              r={6}
              fill="#dc2626"
              stroke="white"
              strokeWidth="1.5"
              opacity={isMoving ? 0.7 : 1}
            >
              {isMoving && (
                <animate attributeName="r" values="6;8;6" dur="0.3s" repeatCount="2" />
              )}
            </circle>
            <text
              x={x + (i === 1 ? 5 : -5)}
              y={y + 3}
              fontSize="6"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {cpuPieces.map((p, i) => {
        if (p.done || p.pos === 0) return null;
        const [x, y] = coords[p.pos] || coords[0];
        const isMoving = movingPiece?.who === 'cpu' && movingPiece.idx === i;
        return (
          <g key={`cpu-${i}`}>
            <circle
              cx={x + (i === 1 ? 6 : -6)}
              cy={y + 6}
              r={6}
              fill="#2563eb"
              stroke="white"
              strokeWidth="1.5"
              opacity={isMoving ? 0.7 : 1}
            >
              {isMoving && (
                <animate attributeName="r" values="6;8;6" dur="0.3s" repeatCount="2" />
              )}
            </circle>
            <text
              x={x + (i === 1 ? 6 : -6)}
              y={y + 10}
              fontSize="6"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* 대기 중인 말 (우하단 바깥) */}
      {myPieces.filter(p => !p.done && p.pos === 0).map((_, i) => (
        <circle key={`my-wait-${i}`}
          cx={SIZE - 8 - i * 14}
          cy={SIZE - 6}
          r={5}
          fill="#dc2626"
          stroke="white"
          strokeWidth="1.5"
          fillOpacity="0.5"
        />
      ))}
      {cpuPieces.filter(p => !p.done && p.pos === 0).map((_, i) => (
        <circle key={`cpu-wait-${i}`}
          cx={8 + i * 14}
          cy={SIZE - 6}
          r={5}
          fill="#2563eb"
          stroke="white"
          strokeWidth="1.5"
          fillOpacity="0.5"
        />
      ))}

      {/* 완주 표시 */}
      {myPieces.filter(p => p.done).map((_, i) => (
        <text key={`my-done-${i}`} x={SIZE - 8 - i * 14} y={8}
          fontSize="10" textAnchor="middle">✅</text>
      ))}
      {cpuPieces.filter(p => p.done).map((_, i) => (
        <text key={`cpu-done-${i}`} x={8 + i * 14} y={8}
          fontSize="10" textAnchor="middle">🟦</text>
      ))}

      {/* 범례 */}
      <circle cx={PAD + 4} cy={PAD + 4} r={4} fill="#dc2626" fillOpacity="0.8" />
      <text x={PAD + 10} y={PAD + 8} fontSize="6" fill="#92400e">나</text>
      <circle cx={PAD + 22} cy={PAD + 4} r={4} fill="#2563eb" fillOpacity="0.8" />
      <text x={PAD + 28} y={PAD + 8} fontSize="6" fill="#92400e">CPU</text>
    </svg>
  );
}

/* ── 윷가락 표시 ── */
function StickDisplay({ face, rolling }: { face: StickFace; rolling: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 font-black text-xs transition-all duration-75 ${
        rolling
          ? 'bg-amber-300 border-amber-500 text-amber-800 scale-90'
          : face === 'flat'
          ? 'bg-amber-100 border-amber-500 text-amber-800'
          : 'bg-amber-800 border-amber-900 text-amber-100'
      }`}
      style={{ width: 20, height: 52, fontSize: 8 }}
    >
      {rolling ? '?' : (
        <>
          <div className="text-center leading-tight">{face === 'flat' ? '앞' : '뒤'}</div>
          <div className={`w-3 h-3 rounded-full mt-1 ${face === 'flat' ? 'bg-amber-400' : 'bg-amber-600'}`} />
        </>
      )}
    </div>
  );
}
