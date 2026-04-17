import { useState } from 'react';
import type { QuizQuestion } from '../../types';

interface MultipleChoiceQuizProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
  onSpendCoins?: (amount: number) => boolean;
  coins?: number;
}

const CHOICE_LABELS = ['①', '②', '③', '④'];

export default function MultipleChoiceQuiz({ question, onAnswer, onSpendCoins, coins }: MultipleChoiceQuizProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [eliminatedChoice, setEliminatedChoice] = useState<number | null>(null);

  const handleHint = () => {
    if (hintShown || !onSpendCoins || chosen !== null) return;
    const success = onSpendCoins(5);
    if (!success) return;
    setHintShown(true);
    // 오답 선택지 중 하나 제거 (정답 제외하고 랜덤)
    const wrongChoices = question.choices
      ? question.choices.map((_, i) => i).filter(i => i !== question.answer)
      : [];
    if (wrongChoices.length > 0) {
      setEliminatedChoice(wrongChoices[Math.floor(Math.random() * wrongChoices.length)]);
    }
  };

  const handleChoice = (index: number) => {
    if (chosen !== null) return;
    const correct = index === question.answer;
    setChosen(index);
    setRevealed(true);

    if (correct) {
      // 정답: 0.8초 후 onAnswer (RewardModal이 해설 표시)
      setTimeout(() => {
        onAnswer(correct);
        setChosen(null);
        setRevealed(false);
        setHintShown(false);
        setEliminatedChoice(null);
      }, 800);
    }
    // 오답: 수동으로 다음 문제 버튼 클릭
  };

  const handleNextAfterWrong = () => {
    onAnswer(false);
    setChosen(null);
    setRevealed(false);
    setHintShown(false);
    setEliminatedChoice(null);
  };

  const getChoiceClass = (index: number) => {
    if (!revealed) return 'choice-btn';
    if (index === question.answer) return 'choice-btn correct';
    if (index === chosen && index !== question.answer) return 'choice-btn wrong';
    return 'choice-btn opacity-40';
  };

  return (
    <div className="flex flex-col gap-4 animate-bounce-in">
      {/* 문맥 문장 */}
      {question.context && (
        <div className="card-joseon p-4 text-center">
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
      <div className="text-center px-2">
        <p className="text-joseon-dark text-xl font-bold leading-relaxed">{question.question}</p>
      </div>

      {/* 힌트 버튼 */}
      {!revealed && (
        <div className="flex justify-end mb-1">
          <button
            onClick={handleHint}
            disabled={hintShown || (coins ?? 0) < 5}
            className={`text-xs px-2 py-1 rounded-lg border transition-all ${
              hintShown ? 'bg-blue-50 border-blue-200 text-blue-600' :
              (coins ?? 0) >= 5 ? 'bg-white border-joseon-brown/30 text-joseon-brown hover:bg-joseon-cream active:scale-95' :
              'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hintShown ? '💡 오답 1개 제거됨' : `💡 힌트 (오답 제거) 🪙5`}
          </button>
        </div>
      )}

      {/* 선택지 */}
      <div className={`flex flex-col gap-2 ${revealed ? 'pointer-events-none' : ''}`}>
        {question.choices?.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            disabled={i === eliminatedChoice}
            className={`${getChoiceClass(i)} ${i === eliminatedChoice ? 'opacity-30 line-through cursor-not-allowed' : ''}`}
          >
            <span className="text-joseon-gold font-bold mr-2 text-lg">{CHOICE_LABELS[i]}</span>
            {choice}
            {revealed && i === question.answer && <span className="ml-2 text-green-600 font-bold">✓</span>}
            {revealed && i === chosen && i !== question.answer && <span className="ml-2 text-red-500 font-bold">✗</span>}
          </button>
        ))}
      </div>

      {/* 해설 */}
      {revealed && (
        <div className={`card-joseon p-4 animate-bounce-in ${
          chosen === question.answer ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
        }`}>
          <div className="text-xl mb-2 text-center">
            {chosen === question.answer ? '🎉 정답!' : '😢 틀렸어요!'}
          </div>
          <p className="text-joseon-dark text-sm leading-relaxed text-center">{question.explanation}</p>

          {/* 오답일 때: 다음 문제 버튼 */}
          {chosen !== question.answer && (
            <button
              onClick={handleNextAfterWrong}
              className="mt-3 w-full py-2.5 rounded-xl bg-joseon-dark text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              알겠어요, 다음 문제 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
