import { useState } from 'react';
import type { QuizQuestion } from '../../types';

interface OXQuizProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
  onSpendCoins?: (amount: number) => boolean;
  coins?: number;
}

export default function OXQuiz({ question, onAnswer, onSpendCoins, coins = 0 }: OXQuizProps) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [hintShown, setHintShown] = useState(false);

  const handleHint = () => {
    if (hintShown || !onSpendCoins) return;
    const success = onSpendCoins(5);
    if (success) setHintShown(true);
  };

  const handleAnswer = (choice: boolean) => {
    if (answered !== null) return;
    const correct = choice === question.answer;
    setChosen(choice);
    setAnswered(correct);

    if (correct) {
      // 정답: 0.8초 후 onAnswer (RewardModal이 해설 표시)
      setTimeout(() => {
        onAnswer(correct);
        setAnswered(null);
        setChosen(null);
        setHintShown(false);
      }, 800);
    }
    // 오답: 버튼을 눌러 직접 진행 (자동 진행 없음)
  };

  const handleNextAfterWrong = () => {
    onAnswer(false);
    setAnswered(null);
    setChosen(null);
    setHintShown(false);
  };

  return (
    <div className="flex flex-col items-center gap-5 animate-bounce-in">
      {/* 문맥 문장 */}
      {question.context && (
        <div className="card-joseon p-4 w-full text-center">
          <p className="text-joseon-brown text-xs mb-1">📜 이런 상황이에요</p>
          <p className="text-joseon-dark text-lg font-medium leading-relaxed">
            {question.context.split(question.word).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="bg-joseon-gold/30 border-b-2 border-joseon-gold font-bold text-joseon-red px-1 rounded">
                    {question.word}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* 문제 */}
      <div className="text-center px-4">
        <p className="text-joseon-dark text-xl font-bold leading-relaxed">{question.question}</p>
      </div>

      {/* 힌트 버튼 */}
      {!answered && (
        <div className="flex justify-end">
          <button
            onClick={handleHint}
            disabled={hintShown || coins < 5}
            className={`text-xs px-2 py-1 rounded-lg border transition-all ${
              hintShown ? 'bg-blue-50 border-blue-200 text-blue-600' :
              coins >= 5 ? 'bg-white border-joseon-brown/30 text-joseon-brown hover:bg-joseon-cream active:scale-95' :
              'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hintShown ? '💡 힌트 확인 중' : `💡 힌트 🪙5`}
          </button>
        </div>
      )}

      {/* 힌트 내용 */}
      {hintShown && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 animate-bounce-in">
          <p className="font-bold text-xs mb-1">💡 힌트</p>
          <p>{question.explanation.substring(0, 40)}...</p>
        </div>
      )}

      {/* OX 버튼 */}
      <div className={`flex gap-10 mt-2 ${answered !== null ? 'pointer-events-none' : ''}`}>
        <button
          onClick={() => handleAnswer(true)}
          className={`btn-o transition-all duration-300 ${
            chosen === true
              ? answered ? 'ring-4 ring-green-300 scale-110' : 'ring-4 ring-red-300 scale-90 opacity-60'
              : ''
          }`}
        >
          ⭕
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className={`btn-x transition-all duration-300 ${
            chosen === false
              ? !answered ? 'ring-4 ring-green-300 scale-110' : 'ring-4 ring-red-300 scale-90 opacity-60'
              : ''
          }`}
        >
          ❌
        </button>
      </div>

      {/* 정답/오답 해설 */}
      {answered !== null && (
        <div className={`card-joseon p-4 w-full animate-bounce-in ${
          answered ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
        }`}>
          <div className="text-xl mb-2 text-center">{answered ? '🎉 정답!' : '😢 틀렸어요!'}</div>
          <p className="text-joseon-dark text-sm leading-relaxed text-center">{question.explanation}</p>

          {/* 오답일 때: 정답 표시 + 다음 문제 버튼 */}
          {!answered && (
            <>
              <div className="mt-3 bg-white/80 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-gray-500">정답은</p>
                <p className="font-black text-joseon-red text-lg">
                  {question.answer === true ? '⭕ (맞다)' : '❌ (틀리다)'}
                </p>
              </div>
              <button
                onClick={handleNextAfterWrong}
                className="mt-3 w-full py-2.5 rounded-xl bg-joseon-dark text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                알겠어요, 다음 문제 →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
