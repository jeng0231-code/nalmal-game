import { useState, useEffect, useRef, useCallback } from 'react';

interface WordPuzzleGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

const QUIZ_DATA = [
  { word: '가방', cho: 'ㄱㅂ',   hint: '들고 다니는 것',          choices: ['가방', '고양이', '기차', '거울'] },
  { word: '나무', cho: 'ㄴㅁ',   hint: '숲에 있는 것',            choices: ['냄비', '나무', '노래', '날씨'] },
  { word: '바다', cho: 'ㅂㄷ',   hint: '넓고 파란 곳',            choices: ['버스', '바다', '빗물', '봄날'] },
  { word: '사과', cho: 'ㅅㄱ',   hint: '빨간 과일',               choices: ['사과', '소금', '사탕', '시장'] },
  { word: '자전거', cho: 'ㅈㅈㄱ', hint: '두 바퀴 탈것',           choices: ['자전거', '지갑', '주먹', '잠자리'] },
  { word: '고양이', cho: 'ㄱㅇㅇ', hint: '야옹하는 동물',          choices: ['고양이', '거북이', '기린', '강아지'] },
  { word: '도서관', cho: 'ㄷㅅㄱ', hint: '책 읽는 곳',             choices: ['도서관', '다람쥐', '동화', '대나무'] },
  { word: '비행기', cho: 'ㅂㅎㄱ', hint: '하늘을 나는 것',         choices: ['비행기', '버섯', '보름달', '봄바람'] },
  { word: '학교',  cho: 'ㅎㄱ',   hint: '공부하는 곳',            choices: ['학교', '하늘', '호랑이', '화분'] },
  { word: '선비',  cho: 'ㅅㅂ',   hint: '조선시대 공부하는 사람', choices: ['선비', '소나무', '시장', '사냥꾼'] },
  { word: '과거',  cho: 'ㄱㄱ',   hint: '조선시대 국가 시험',     choices: ['과거', '구름', '기와', '국밥'] },
  { word: '임금',  cho: 'ㅇㄱ',   hint: '나라의 왕',              choices: ['임금', '이름', '언덕', '입술'] },
  { word: '한글',  cho: 'ㅎㄱ',   hint: '우리나라 글자',          choices: ['한글', '하늘', '허리', '해물'] },
  { word: '문해력', cho: 'ㅁㅎㄹ', hint: '글을 읽고 이해하는 능력', choices: ['문해력', '마법사', '무지개', '물바람'] },
  { word: '서당',  cho: 'ㅅㄷ',   hint: '옛날 공부방',            choices: ['서당', '소달구지', '사다리', '세상'] },
  { word: '붓글씨', cho: 'ㅂㄱㅆ', hint: '붓으로 쓰는 글씨',      choices: ['붓글씨', '바구니', '버섯국', '보글보글'] },
  { word: '다람쥐', cho: 'ㄷㄹㅈ', hint: '도토리를 모으는 동물',   choices: ['다람쥐', '두루마기', '달팽이', '도마뱀'] },
  { word: '무지개', cho: 'ㅁㅈㄱ', hint: '비 온 뒤 색깔 띠',      choices: ['무지개', '모래밭', '마을길', '미끄럼틀'] },
  { word: '태권도', cho: 'ㅌㄱㄷ', hint: '우리나라 무술',          choices: ['태권도', '토끼풀', '탑돌이', '타자기'] },
  { word: '호랑이', cho: 'ㅎㄹㅇ', hint: '산에 사는 맹수',        choices: ['호랑이', '해바라기', '허수아비', '황소'] },
  { word: '훈민정음', cho: 'ㅎㅁㅈㅇ', hint: '세종대왕이 만든 글자', choices: ['훈민정음', '한양성곽', '홍길동', '하회탈'] },
  { word: '경복궁', cho: 'ㄱㅂㄱ', hint: '조선의 정궁',           choices: ['경복궁', '관악산', '강릉단오', '광화문'] },
  { word: '조선왕조', cho: 'ㅈㅅㅇㅈ', hint: '1392년 세운 나라',  choices: ['조선왕조', '주산알', '진선미', '잠수함'] },
  { word: '세종대왕', cho: 'ㅅㅈㄷㅇ', hint: '한글을 만든 왕',    choices: ['세종대왕', '수정달인', '산조대목', '솔직담백'] },
];

export default function WordPuzzleGame({ onComplete, level = 1 }: WordPuzzleGameProps) {
  const GAME_TIME = Math.max(20, 30 - Math.floor(level / 2));
  const QUESTIONS_COUNT = Math.min(5 + Math.floor(level / 2), 12);

  const [phase, setPhase]     = useState<'ready' | 'playing' | 'result'>('ready');
  const [questions, setQuestions] = useState<typeof QUIZ_DATA>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [combo, setCombo]     = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const comboRef    = useRef(0);

  const initQuestions = useCallback(() => {
    return [...QUIZ_DATA]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_COUNT)
      .map(q => ({ ...q, choices: [...q.choices].sort(() => Math.random() - 0.5) }));
  }, [QUESTIONS_COUNT]);

  const startGame = useCallback(() => {
    processingRef.current = false;
    comboRef.current = 0;
    setQuestions(initQuestions());
    setCurrentIdx(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(GAME_TIME);
    setSelected(null);
    setFeedback(null);
    setPhase('playing');
  }, [initQuestions, GAME_TIME]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleAnswer = useCallback((choice: string) => {
    if (processingRef.current || phase !== 'playing' || !questions[currentIdx]) return;
    processingRef.current = true;
    setSelected(choice);

    const isCorrect = choice === questions[currentIdx].word;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      setMaxCombo(m => Math.max(m, comboRef.current));
      const comboBonus = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1;
      setScore(s => s + 10 * comboBonus);
      setCorrectCount(c => c + 1);
    } else {
      comboRef.current = 0;
      setCombo(0);
    }

    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      processingRef.current = false;
      if (currentIdx + 1 >= questions.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('result');
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, isCorrect ? 500 : 800);
  }, [phase, questions, currentIdx]);

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4">
        <div className="text-6xl">🔤</div>
        <h2 className="text-2xl font-black text-joseon-dark">초성 퀴즈</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-center max-w-xs">
          <p className="font-bold text-blue-700 mb-2">📖 게임 방법</p>
          <p className="text-blue-600">초성(ㄱㄴㄷ...)을 보고<br/>해당하는 단어를 고르세요!</p>
          <div className="mt-3 flex justify-center gap-3 text-xs text-blue-500">
            <span>⏱ {GAME_TIME}초</span>
            <span>📝 {QUESTIONS_COUNT}문제</span>
            <span>🔥 콤보 보너스!</span>
          </div>
        </div>
        <button onClick={startGame} className="btn-joseon px-10 py-4 text-lg">시작! 🔤</button>
      </div>
    );
  }

  if (phase === 'result') {
    const timeBonus = timeLeft * 2;
    const comboBonus = maxCombo * 5;
    const totalScore = score + timeBonus + comboBonus;
    const coinReward = Math.max(3, Math.round(totalScore / 8));
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-5xl">{correctCount >= QUESTIONS_COUNT * 0.8 ? '🏆' : correctCount >= QUESTIONS_COUNT * 0.5 ? '🎉' : '📖'}</div>
        <h2 className="text-xl font-black text-joseon-dark">초성 퀴즈 완료!</h2>
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center">
            <div className="text-lg font-black text-green-600">{correctCount}/{QUESTIONS_COUNT}</div>
            <div className="text-[10px] text-green-700">정답수</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-center">
            <div className="text-lg font-black text-orange-600">{maxCombo}콤보</div>
            <div className="text-[10px] text-orange-700">최고콤보</div>
          </div>
          <div className="bg-joseon-gold/10 border border-joseon-gold/30 rounded-xl p-2 text-center">
            <div className="text-lg font-black text-joseon-red">{totalScore}</div>
            <div className="text-[10px] text-joseon-brown">최종점수</div>
          </div>
        </div>
        <p className="text-joseon-brown text-sm font-bold">🪙 엽전 {coinReward}개 획득!</p>
        <button onClick={() => onComplete(coinReward)} className="btn-joseon px-10 py-4 text-lg">완료! →</button>
      </div>
    );
  }

  const current = questions[currentIdx];
  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-3">
      {/* 상단 바 */}
      <div className="flex justify-between items-center w-full max-w-sm">
        <span className="text-xs font-bold text-joseon-brown bg-joseon-gold/20 px-2 py-0.5 rounded-full">
          {currentIdx + 1}/{questions.length}
        </span>
        {combo >= 2 && (
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
            combo >= 5 ? 'bg-purple-500 text-white animate-pulse' : 'bg-orange-400 text-white animate-bounce'
          }`}>
            🔥 {combo}콤보!
          </span>
        )}
        <span className={`text-sm font-black tabular-nums ${
          timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-joseon-brown'
        }`}>⏱{timeLeft}s</span>
      </div>

      {/* 타이머 바 */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden max-w-sm">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-yellow-400' : 'bg-green-500'
          }`}
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* 문제 카드 */}
      <div className={`w-full max-w-sm border-2 rounded-2xl p-5 text-center shadow-sm transition-all ${
        feedback === 'correct' ? 'bg-green-50 border-green-400' :
        feedback === 'wrong'   ? 'bg-red-50 border-red-400' :
        'bg-white border-joseon-brown/30'
      }`}>
        <p className="text-xs text-joseon-brown mb-2">💡 힌트: {current.hint}</p>
        <div className="text-5xl font-black text-joseon-dark tracking-[0.3em] mb-1">
          {current.cho}
        </div>
        <p className="text-xs text-gray-400">초성을 보고 단어를 맞혀보세요</p>
      </div>

      {/* 보기 4개 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {current.choices.map((choice) => {
          const isSel = selected === choice;
          const isAns = choice === current.word;
          return (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={!!selected}
              className={`py-4 rounded-xl font-bold text-base border-2 transition-all duration-200 ${
                isSel && feedback === 'correct'
                  ? 'bg-green-400 border-green-600 text-white scale-105 shadow-md' :
                isSel && feedback === 'wrong'
                  ? 'bg-red-300 border-red-500 text-white scale-95' :
                feedback === 'correct' && isAns && !isSel
                  ? 'bg-green-100 border-green-400 text-green-700' :
                selected
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' :
                'bg-white border-joseon-brown/30 text-joseon-dark hover:bg-joseon-gold/10 hover:border-joseon-gold active:scale-95 cursor-pointer'
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      <div className="text-sm font-bold text-joseon-brown">🏆 {score}점</div>
    </div>
  );
}
