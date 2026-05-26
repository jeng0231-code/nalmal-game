/**
 * 🔤 초성 스피드 퀴즈
 *
 * 본게임과 다른 점:
 *  - 단어의 초성(ㅅㄷ, ㅅㅈㅅㅇ...)만 보고 4개 보기에서 고르는 형식
 *  - 문제당 5초 타이머 — 아케이드 압박감
 *  - 연속 정답 시 콤보 배율(최대 3×)
 *  - 10라운드 완주 후 최종 점수 → 엽전 환산
 *  - 점점 빨라지는 타이머 (라운드마다 0.15초씩 감소)
 */
import { useState, useEffect, useRef, useMemo } from 'react';

interface ChoseongGameProps {
  onComplete: (score: number) => void;
}

// 초성 추출 유틸
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function getChoseong(str: string): string {
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 28 / 21)];
  }).join('');
}

const WORD_POOL: { word: string; hint: string; category: string }[] = [
  { word: '일석이조', hint: '돌 하나로 새 두 마리를 잡는다', category: '사자성어' },
  { word: '이심전심', hint: '마음에서 마음으로 전해진다', category: '사자성어' },
  { word: '백발백중', hint: '쏘는 것마다 다 맞힌다', category: '사자성어' },
  { word: '천하무적', hint: '세상 어디에도 대적할 자가 없다', category: '사자성어' },
  { word: '유비무환', hint: '준비가 있으면 걱정이 없다', category: '사자성어' },
  { word: '마이동풍', hint: '말 귀에 동쪽 바람 — 들어도 듣지 않는다', category: '사자성어' },
  { word: '과유불급', hint: '지나친 것은 모자란 것과 같다', category: '사자성어' },
  { word: '우공이산', hint: '꾸준한 노력으로 산도 옮긴다', category: '사자성어' },
  { word: '삼인성호', hint: '세 사람이 말하면 없는 호랑이도 생긴다', category: '사자성어' },
  { word: '고생끝에낙이온다', hint: '힘든 뒤에 기쁨이 온다', category: '속담' },
  { word: '돌다리도두드려건너라', hint: '확실한 것도 신중히 확인하라', category: '속담' },
  { word: '백지장도맞들면낫다', hint: '아무리 쉬운 일도 협력이 좋다', category: '속담' },
  { word: '세살버릇여든까지간다', hint: '어릴 때 습관이 평생을 간다', category: '속담' },
  { word: '가는말이고와야온다', hint: '내가 먼저 잘해야 상대도 잘한다', category: '속담' },
  { word: '근면', hint: '부지런하고 열심히 함', category: '어휘' },
  { word: '성실', hint: '정성스럽고 참됨', category: '어휘' },
  { word: '절약', hint: '아껴서 낭비하지 않음', category: '어휘' },
  { word: '협동', hint: '힘을 합쳐 함께 일함', category: '어휘' },
  { word: '존중', hint: '높이 여겨 귀중히 대함', category: '어휘' },
  { word: '배려', hint: '상대방을 도와주거나 보살핌', category: '어휘' },
  { word: '감사', hint: '고맙게 여기는 마음', category: '어휘' },
  { word: '정직', hint: '거짓 없이 바르고 솔직함', category: '어휘' },
  { word: '인내', hint: '참고 견디는 것', category: '어휘' },
  { word: '봉사', hint: '남을 위해 자신을 바쳐 일함', category: '어휘' },
  { word: '세종대왕', hint: '훈민정음을 만든 조선 4대 왕', category: '역사' },
  { word: '이순신', hint: '거북선으로 왜군을 물리친 장군', category: '역사' },
  { word: '훈민정음', hint: '세종대왕이 만든 우리 글자', category: '역사' },
  { word: '삼일운동', hint: '1919년 독립을 외친 전국 운동', category: '역사' },
  { word: '광복절', hint: '1945년 8월 15일 독립을 기념하는 날', category: '역사' },
  { word: '화합', hint: '서로 어울려 하나가 됨', category: '어휘' },
];

const ROUNDS = 10;
const BASE_TIME = 5.0;
const TIME_DECREMENT = 0.15;
const MIN_TIME = 2.5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface RoundData {
  item: typeof WORD_POOL[0];
  choices: string[];
  timeLimit: number;
}

function buildRounds(): RoundData[] {
  const shuffled = shuffle(WORD_POOL).slice(0, ROUNDS);
  return shuffled.map((item, i) => {
    const wrong = WORD_POOL.filter(p => p.word !== item.word);
    const choices = shuffle([item.word, ...shuffle(wrong).slice(0, 3).map(w => w.word)]);
    return { item, choices, timeLimit: Math.max(MIN_TIME, BASE_TIME - i * TIME_DECREMENT) };
  });
}

type Phase = 'ready' | 'playing' | 'result';

export default function ChoseongGame({ onComplete }: ChoseongGameProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [chosenWord, setChosenWord] = useState<string | null>(null);
  const [roundHistory, setRoundHistory] = useState<{ word: string; correct: boolean }[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 타이머 시작 시각 ref — setInterval 콜백 안에서 elapsed 계산
  const roundStartRef = useRef<number>(0);
  const timeLimitRef = useRef<number>(BASE_TIME);
  const answeredRef = useRef(false);

  const currentRound = useMemo(() => rounds[round] ?? null, [rounds, round]);

  // 타이머: setTimeLeft는 setInterval 콜백 안에서만 호출 (ESLint 준수)
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null || !currentRound) return;
    answeredRef.current = false;
    roundStartRef.current = Date.now();
    timeLimitRef.current = currentRound.timeLimit;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - roundStartRef.current) / 1000;
      const remaining = Math.max(0, timeLimitRef.current - elapsed);
      setTimeLeft(+remaining.toFixed(1));

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        if (!answeredRef.current) {
          answeredRef.current = true;
          setFeedback('timeout');
          setCombo(0);
          setRoundHistory(h => [...h, { word: currentRound.item.word, correct: false }]);
        }
      }
    }, 100);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase, round, currentRound, feedback]);

  // timeout 후 자동 다음 라운드
  useEffect(() => {
    if (feedback !== 'timeout') return;
    const t = setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) {
        setPhase('result');
      } else {
        setRound(next);
        setFeedback(null);
        setChosenWord(null);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [feedback, round]);

  const handleAnswer = (word: string) => {
    if (answeredRef.current || feedback !== null || !currentRound) return;
    answeredRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setChosenWord(word);
    const isCorrect = word === currentRound.item.word;
    const timeBonus = Math.max(0, Math.round((timeLeft / currentRound.timeLimit) * 20));
    const newCombo = isCorrect ? combo + 1 : 0;
    const multiplier = Math.min(3, 1 + Math.floor(newCombo / 3) * 0.5);
    const pts = isCorrect ? Math.round((10 + timeBonus) * multiplier) : 0;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setCombo(newCombo);
    setMaxCombo(mc => Math.max(mc, newCombo));
    if (isCorrect) { setScore(s => s + pts); setCorrectCount(c => c + 1); }
    setRoundHistory(h => [...h, { word: currentRound.item.word, correct: isCorrect }]);

    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) {
        setPhase('result');
      } else {
        setRound(next);
        setFeedback(null);
        setChosenWord(null);
      }
    }, 700);
  };

  const startGame = () => {
    const newRounds = buildRounds();
    setRounds(newRounds);
    setRound(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setFeedback(null);
    setChosenWord(null);
    setRoundHistory([]);
    setTimeLeft(newRounds[0]?.timeLimit ?? BASE_TIME);
    setPhase('playing');
  };

  const coins = Math.round(score * 0.8);

  // ── READY ─────────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center animate-bounce-in">
        <div className="text-6xl">🔤</div>
        <div>
          <h2 className="text-2xl font-black text-joseon-dark">초성 스피드 퀴즈</h2>
          <p className="text-joseon-brown text-sm mt-1">초성만 보고 단어를 맞혀라!</p>
        </div>
        <div className="card-joseon p-4 w-full text-left space-y-2 text-sm">
          <div className="flex gap-2"><span>🎯</span><span><b>10라운드</b> · 문제당 <b>5초</b> (갈수록 빨라짐)</span></div>
          <div className="flex gap-2"><span>⚡</span><span>연속 정답 시 <b>콤보 배율</b> 최대 3×!</span></div>
          <div className="flex gap-2"><span>⏱️</span><span>빨리 맞힐수록 <b>보너스 점수</b></span></div>
          <div className="flex gap-2"><span>🪙</span><span>점수 × 0.8 = <b>획득 엽전</b></span></div>
        </div>
        <button onClick={startGame} className="btn-joseon w-full py-4 text-xl">시작! →</button>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────
  if (phase === 'result') {
    const accuracy = Math.round((correctCount / ROUNDS) * 100);
    const grade = accuracy >= 90 ? '🏆 완벽!' : accuracy >= 70 ? '⭐ 우수!' : accuracy >= 50 ? '👍 보통' : '💪 분발';
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center animate-bounce-in">
        <div className="text-5xl">{grade.split(' ')[0]}</div>
        <h2 className="text-2xl font-black text-joseon-dark">{grade.split(' ')[1]}</h2>
        <div className="card-joseon p-5 w-full">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div><div className="text-2xl font-black text-joseon-red">{score}</div><div className="text-xs text-joseon-brown">점수</div></div>
            <div><div className="text-2xl font-black text-green-600">{correctCount}/{ROUNDS}</div><div className="text-xs text-joseon-brown">정답</div></div>
            <div><div className="text-2xl font-black text-purple-600">{maxCombo}연속</div><div className="text-xs text-joseon-brown">최고 콤보</div></div>
          </div>
          <div className="rounded-xl p-3 flex items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #FFF8DC, #FFE4B5)', border: '2px solid #F39C12' }}>
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-2xl font-black text-joseon-brown">{coins}</div>
              <div className="text-xs text-joseon-brown">획득 엽전</div>
            </div>
          </div>
        </div>
        <div className="w-full grid grid-cols-5 gap-1">
          {roundHistory.map((r, i) => (
            <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-lg"
              style={{ background: r.correct ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `2px solid ${r.correct ? '#27AE60' : '#E74C3C'}` }}>
              {r.correct ? '✓' : '✗'}
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={startGame} className="flex-1 py-3 rounded-xl font-bold border-2 border-joseon-brown text-joseon-dark hover:bg-joseon-cream active:scale-95 transition-all">다시 하기</button>
          <button onClick={() => onComplete(coins)} className="flex-1 btn-joseon py-3">완료 🪙{coins}</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────
  if (!currentRound) return null;
  const { item, choices } = currentRound;
  const choseong = getChoseong(item.word);
  const timePct = (timeLeft / currentRound.timeLimit) * 100;
  const timerColor = timePct > 60 ? '#27AE60' : timePct > 30 ? '#F39C12' : '#E74C3C';
  const multiplier = Math.min(3, 1 + Math.floor(combo / 3) * 0.5);

  return (
    <div className="flex flex-col gap-4 p-2 animate-bounce-in">
      {/* 진행 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-joseon-brown">{round + 1}/{ROUNDS}</span>
        {combo >= 3 && (
          <div className="combo-badge-in px-3 py-1 rounded-full text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #F39C12, #E74C3C)' }}>
            🔥 {combo}연속 ×{multiplier.toFixed(1)}
          </div>
        )}
        <span className="text-xs font-bold text-joseon-brown">🪙{Math.round(score * 0.8)}</span>
      </div>

      {/* 타이머 바 */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full"
          style={{ width: `${timePct}%`, background: timerColor, transition: 'width 0.1s linear' }} />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow">
          {timeLeft.toFixed(1)}s
        </div>
      </div>

      {/* 카테고리 */}
      <div className="text-center">
        <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
          style={{ background: item.category === '사자성어' ? '#8E44AD' : item.category === '속담' ? '#E67E22' : item.category === '역사' ? '#27AE60' : '#2980B9' }}>
          {item.category}
        </span>
      </div>

      {/* 초성 + 힌트 카드 */}
      <div className={`card-joseon p-5 text-center ${
        feedback === 'correct' ? 'border-green-400 bg-green-50' :
        feedback === 'wrong' || feedback === 'timeout' ? 'border-red-400 bg-red-50' : ''
      }`}>
        {feedback ? (
          <div>
            <div className="text-3xl mb-1">{feedback === 'correct' ? '🎉' : feedback === 'timeout' ? '⏱️' : '😢'}</div>
            <div className="text-2xl font-black text-joseon-dark mb-1">{item.word}</div>
            <div className="text-xs text-joseon-brown">{item.hint}</div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-joseon-brown mb-3">이 초성의 단어는?</p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
              {[...choseong].map((ch, i) => (
                <span key={i} className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-2xl"
                  style={{ background: 'linear-gradient(135deg, #FFF3D0, #FFE4A0)', border: '2px solid #F39C12', color: '#8B4513', boxShadow: '0 2px 6px rgba(243,156,18,0.3)' }}>
                  {ch}
                </span>
              ))}
            </div>
            <p className="text-xs text-joseon-brown/70 italic">💡 {item.hint}</p>
          </div>
        )}
      </div>

      {/* 선택지 2×2 */}
      <div className={`grid grid-cols-2 gap-2 ${feedback ? 'pointer-events-none' : ''}`}>
        {choices.map(word => {
          const isCorrectChoice = word === item.word;
          const isChosen = word === chosenWord;
          let bg = 'linear-gradient(135deg, #FFFFFF, #FFF8F0)';
          let border = '#D4AC7A';
          if (feedback) {
            if (isCorrectChoice) { bg = 'linear-gradient(135deg, #D5F5E3, #A9DFBF)'; border = '#27AE60'; }
            else if (isChosen) { bg = 'linear-gradient(135deg, #FADBD8, #F5B7B1)'; border = '#E74C3C'; }
            else { bg = '#F5F5F5'; border = '#E0E0E0'; }
          }
          return (
            <button key={word} onClick={() => handleAnswer(word)}
              className="p-3 rounded-xl font-bold text-joseon-dark text-sm transition-all active:scale-95 hover:scale-[1.02] text-center leading-snug"
              style={{ background: bg, border: `2px solid ${border}`, boxShadow: feedback ? 'none' : '0 2px 6px rgba(139,69,19,0.1)' }}>
              {word}
              {feedback && isCorrectChoice && <span className="ml-1 text-green-600 text-xs">✓</span>}
              {feedback && isChosen && !isCorrectChoice && <span className="ml-1 text-red-500 text-xs">✗</span>}
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-joseon-brown/50">
        총점 {score}점 · 정답 {correctCount}/{round + (feedback ? 1 : 0)}
      </div>
    </div>
  );
}
